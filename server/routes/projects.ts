import { Express, Request, Response } from 'express';
import { storage } from '../storage';
import { projectService } from '../services';
import { z } from 'zod';
import { ValidationError, fromZodError } from 'zod-validation-error';
import { projectInsertSchema, commentInsertSchema } from '@shared/schema';
import cache from '../utils/enhanced-cache';
import { processUrlForProject } from '../utils/url-metadata';
import { isAuthenticated } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

// Set up storage for uploaded files - copied from routes.ts
// In a more thorough refactoring, this would be extracted to a common config file
const persistentStorageDir = process.env.REPLIT_DB_URL ? path.join(process.cwd(), ".replit", "data") : null;
const uploadDir = persistentStorageDir && fs.existsSync(persistentStorageDir) 
  ? path.join(persistentStorageDir, "uploads") 
  : path.join(process.cwd(), "uploads");

// Configure multer for file storage
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with the original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// File filter to only allow certain image types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

// Initialize multer with our configuration
const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter
});

// Helper function to optimize image using sharp
async function optimizeImage(filePath: string): Promise<string> {
  const optimizedPath = path.join(uploadDir, 'opt-' + path.basename(filePath));
  try {
    await sharp(filePath)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(optimizedPath);
      
    // Remove the original if optimization succeeded
    fs.unlinkSync(filePath);
    
    return `/uploads/opt-${path.basename(filePath)}`;
  } catch (error) {
    console.error('Error optimizing image:', error);
    // Return path to original file if optimization fails
    return `/uploads/${path.basename(filePath)}`;
  }
}

export function registerProjectRoutes(app: Express) {
  const apiPrefix = '/api';
  
  // Get all projects with filtering
  app.get(`${apiPrefix}/projects`, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 6;
      const tag = req.query.tag as string;
      const search = req.query.search as string;
      const sort = req.query.sort as string;
      const user = req.query.user as string;
      
      // Get current user ID for isLiked/isBookmarked
      const currentUserId = req.isAuthenticated() ? req.user!.id : 0;
      
      // Cache key based on all parameters
      const cacheKey = `projects:list:page:${page}:limit:${limit}:tag:${tag || 'none'}:sort:${sort || 'default'}:user:${user || 'none'}:currentUser:${currentUserId}`;
      
      // Try to get from cache first
      let result = cache.get(cacheKey);
      
      if (!result) {
        console.log(`Cache miss for ${cacheKey}`);
        result = await storage.getProjects({ page, limit, tag, sort, search, user, currentUserId });
        
        // Cache for 2 minutes
        cache.set(cacheKey, result, { ttl: 2 * 60 * 1000, tags: ['projects:list'] });
      } else {
        console.log(`Cache hit for ${cacheKey}`);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ message: 'Failed to fetch projects' });
    }
  });
  
  // Get featured project
  app.get(`${apiPrefix}/projects/featured`, async (req, res) => {
    try {
      // Get current user ID for isLiked/isBookmarked
      const currentUserId = req.isAuthenticated() ? req.user!.id : 0;
      
      // Cache key with user context
      const cacheKey = `projects:featured:user:${currentUserId}`;
      
      // Try to get from cache first
      let result = cache.get(cacheKey);
      
      if (!result) {
        console.log(`Cache miss for ${cacheKey}`);
        const project = await storage.getFeaturedProject(currentUserId);
        result = { project };
        
        // Cache for 5 minutes
        cache.set(cacheKey, result, { ttl: 5 * 60 * 1000, tags: ['projects:featured'] });
      } else {
        console.log(`Cache hit for ${cacheKey}`);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching featured project:', error);
      res.status(500).json({ message: 'Failed to fetch featured project' });
    }
  });
  
  // Get trending projects
  app.get(`${apiPrefix}/projects/trending`, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 4;
      
      // Get current user ID for isLiked/isBookmarked
      const currentUserId = req.isAuthenticated() ? req.user!.id : 0;
      
      // Cache key with user context
      const cacheKey = `projects:trending:limit:${limit}:user:${currentUserId}`;
      
      // Try to get from cache first
      let result = cache.get(cacheKey);
      
      if (!result) {
        console.log(`Cache miss for ${cacheKey}`);
        const projects = await storage.getTrendingProjects(limit, currentUserId);
        result = { projects };
        
        // Cache for 5 minutes
        cache.set(cacheKey, result, { ttl: 5 * 60 * 1000, tags: ['projects:trending'] });
      } else {
        console.log(`Cache hit for ${cacheKey}`);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching trending projects:', error);
      res.status(500).json({ message: 'Failed to fetch trending projects' });
    }
  });
  
  // Get project by ID
  app.get(`${apiPrefix}/projects/:id`, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      // Get current user ID for isLiked/isBookmarked
      const currentUserId = req.isAuthenticated() ? req.user!.id : 0;
      
      const project = await storage.getProjectById(projectId, currentUserId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Increment view count in background
      storage.incrementProjectViews(projectId).catch(error => {
        console.error('Error incrementing project views:', error);
      });
      
      res.json({ project });
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({ message: 'Failed to fetch project' });
    }
  });
  
  // Create project
  app.post(`${apiPrefix}/projects`, isAuthenticated, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'galleryImages', maxCount: 5 }]), async (req, res) => {
    try {
      // Parse and validate the input
      const projectData = JSON.parse(req.body.project);
      
      try {
        projectInsertSchema.parse(projectData);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          const prettyError = fromZodError(validationError);
          return res.status(400).json({ message: prettyError.message });
        }
        throw validationError;
      }
      
      // Process tags
      const tagNames = req.body.tags ? JSON.parse(req.body.tags) : [];
      
      // Set the author to the current user
      projectData.authorId = req.user!.id;
      
      // Set default values for isPrivate and featured
      projectData.isPrivate = projectData.isPrivate || false;
      projectData.featured = false; // Only admins can set featured
      
      // If a URL was provided and no description, try to generate one
      if (projectData.projectUrl && (!projectData.description || projectData.description.trim() === '')) {
        try {
          const metadata = await processUrlForProject(projectData.projectUrl);
          if (metadata.description) {
            projectData.description = metadata.description;
          }
        } catch (metadataError) {
          console.error('Error processing URL metadata:', metadataError);
          // Continue without metadata, not a fatal error
        }
      }
      
      // Handle the main project image
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (files && files['image'] && files['image'].length > 0) {
        const mainImageFile = files['image'][0];
        const imageUrl = await optimizeImage(mainImageFile.path);
        projectData.imageUrl = imageUrl;
      } else if (!projectData.imageUrl) {
        // Set a default image if none provided
        projectData.imageUrl = '/images/default-project.jpg';
      }
      
      // Process gallery images if any
      const galleryImagesData: any[] = [];
      if (files && files['galleryImages'] && files['galleryImages'].length > 0) {
        const galleryFiles = files['galleryImages'];
        
        // Process each gallery image
        for (let i = 0; i < galleryFiles.length; i++) {
          const galleryFile = galleryFiles[i];
          const optimizedGalleryUrl = await optimizeImage(galleryFile.path);
          
          galleryImagesData.push({
            imageUrl: optimizedGalleryUrl,
            displayOrder: i,
            caption: `Gallery image ${i+1}`,
            createdAt: new Date() 
          });
        }
      }
      
      // Create the project with gallery images
      const project = await storage.createProject(projectData, tagNames, galleryImagesData);
      
      // Invalidate relevant caches
      cache.invalidateTag('projects:list');
      cache.invalidateTag('projects:featured');
      cache.invalidateTag('projects:trending');
      
      // Record activity
      await storage.recordUserActivity(req.user!.id, 'project_created', project.id);
      
      res.status(201).json({ project });
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ message: 'Failed to create project' });
    }
  });
  
  // Update project
  app.patch(`${apiPrefix}/projects/:id`, isAuthenticated, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'galleryImages', maxCount: 5 }]), async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      // Get the existing project
      const existingProject = await storage.getProjectById(projectId);
      
      if (!existingProject) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check if user is the author or an admin
      const userId = req.user!.id;
      if (existingProject.author.id !== userId && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update this project' });
      }
      
      // Parse and validate the input
      const projectData = JSON.parse(req.body.project);
      
      // Process tags
      const tagNames = req.body.tags ? JSON.parse(req.body.tags) : [];
      
      // Handle the main project image
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (files && files['image'] && files['image'].length > 0) {
        const mainImageFile = files['image'][0];
        const imageUrl = await optimizeImage(mainImageFile.path);
        projectData.imageUrl = imageUrl;
        
        // If there was a previous image that wasn't the default, try to remove it
        if (existingProject.imageUrl && 
            !existingProject.imageUrl.includes('default-project.jpg') && 
            existingProject.imageUrl.startsWith('/uploads/')) {
          const oldImagePath = path.join(process.cwd(), existingProject.imageUrl.substr(1));
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error('Failed to remove old image:', err);
          });
        }
      }
      
      // Process gallery images if any
      const galleryImagesData: any[] = [];
      if (files && files['galleryImages'] && files['galleryImages'].length > 0) {
        const galleryFiles = files['galleryImages'];
        
        // Process each gallery image
        for (let i = 0; i < galleryFiles.length; i++) {
          const galleryFile = galleryFiles[i];
          const optimizedGalleryUrl = await optimizeImage(galleryFile.path);
          
          galleryImagesData.push({
            imageUrl: optimizedGalleryUrl,
            displayOrder: i,
            caption: `Gallery image ${i+1}`,
            createdAt: new Date() 
          });
        }
      }
      
      // Update the project with gallery images
      const updatedProject = await storage.updateProject(projectId, projectData, tagNames, galleryImagesData.length > 0 ? galleryImagesData : undefined);
      
      if (!updatedProject) {
        return res.status(500).json({ message: 'Failed to update project' });
      }
      
      // Invalidate relevant caches
      cache.invalidateTag('projects:list');
      if (existingProject.featured || projectData.featured) {
        cache.invalidateTag('projects:featured');
      }
      cache.invalidateTag('projects:trending');
      
      // Record activity
      await storage.recordUserActivity(req.user!.id, 'project_updated', projectId);
      
      res.json({ project: updatedProject });
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ message: 'Failed to update project' });
    }
  });
  
  // Delete project
  app.delete(`${apiPrefix}/projects/:id`, isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      // Get the existing project
      const existingProject = await storage.getProjectById(projectId);
      
      if (!existingProject) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check if user is the author or an admin
      const userId = req.user!.id;
      if (existingProject.author.id !== userId && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to delete this project' });
      }
      
      // Delete the project
      const success = await storage.deleteProject(projectId);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete project' });
      }
      
      // Try to remove the project image if it wasn't the default
      if (existingProject.imageUrl && 
          !existingProject.imageUrl.includes('default-project.jpg') && 
          existingProject.imageUrl.startsWith('/uploads/')) {
        const imagePath = path.join(process.cwd(), existingProject.imageUrl.substr(1));
        fs.unlink(imagePath, (err) => {
          if (err) console.error('Failed to remove project image:', err);
        });
      }
      
      // Invalidate relevant caches
      cache.invalidateTag('projects:list');
      if (existingProject.featured) {
        cache.invalidateTag('projects:featured');
      }
      cache.invalidateTag('projects:trending');
      
      // Record activity
      await storage.recordUserActivity(req.user!.id, 'project_deleted', projectId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ message: 'Failed to delete project' });
    }
  });
  
  // Like a project
  app.post(`${apiPrefix}/projects/:id/like`, isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      const userId = req.user!.id;
      
      // Check if project exists
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      await storage.likeProject(projectId, userId);
      
      // Invalidate caches
      cache.invalidateTag('projects:list');
      cache.invalidateTag('projects:trending');
      if (project.featured) {
        cache.invalidateTag('projects:featured');
      }
      
      // Record activity
      await storage.recordUserActivity(userId, 'project_liked', projectId);
      
      // Create notification for project author, but not if the user likes their own project
      if (project.author.id !== userId) {
        await storage.createNotification({
          userId: project.author.id,
          actorId: userId,
          type: 'like_project',
          projectId: projectId
        });
        
        // Send real-time notification if user is connected
        const sendNotification = (global as any).sendNotificationToUser;
        if (typeof sendNotification === 'function') {
          const notification = {
            type: 'like_project',
            actor: {
              id: userId,
              username: req.user!.username,
              avatarUrl: req.user!.avatarUrl
            },
            project: {
              id: projectId,
              title: project.title
            },
            createdAt: new Date().toISOString()
          };
          sendNotification(project.author.id, notification);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error liking project:', error);
      res.status(500).json({ message: 'Failed to like project' });
    }
  });
  
  // Unlike a project
  app.delete(`${apiPrefix}/projects/:id/like`, isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      const userId = req.user!.id;
      
      // Check if project exists
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      await storage.unlikeProject(projectId, userId);
      
      // Invalidate caches
      cache.invalidateTag('projects:list');
      cache.invalidateTag('projects:trending');
      if (project.featured) {
        cache.invalidateTag('projects:featured');
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error unliking project:', error);
      res.status(500).json({ message: 'Failed to unlike project' });
    }
  });
  
  // Bookmark a project
  app.post(`${apiPrefix}/projects/:id/bookmark`, isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      const userId = req.user!.id;
      
      // Check if project exists
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      await storage.bookmarkProject(projectId, userId);
      
      // Record activity
      await storage.recordUserActivity(userId, 'project_bookmarked', projectId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error bookmarking project:', error);
      res.status(500).json({ message: 'Failed to bookmark project' });
    }
  });
  
  // Remove bookmark from a project
  app.delete(`${apiPrefix}/projects/:id/bookmark`, isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      const userId = req.user!.id;
      
      // Check if project exists
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      await storage.unbookmarkProject(projectId, userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing bookmark:', error);
      res.status(500).json({ message: 'Failed to remove bookmark' });
    }
  });
  
  // Share a project
  app.post(`${apiPrefix}/projects/:id/share`, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      const { platform } = req.body;
      if (!platform) {
        return res.status(400).json({ message: 'Platform is required' });
      }
      
      // Check if project exists
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      const userId = req.isAuthenticated() ? req.user!.id : undefined;
      
      await storage.shareProject(projectId, platform, userId);
      
      // Record activity if user is authenticated
      if (userId) {
        await storage.recordUserActivity(userId, 'project_shared', projectId);
      }
      
      // Get updated share count
      const sharesCount = await storage.getProjectShares(projectId);
      
      res.json({ success: true, sharesCount });
    } catch (error) {
      console.error('Error sharing project:', error);
      res.status(500).json({ message: 'Failed to share project' });
    }
  });
  
  // Get project comments
  app.get(`${apiPrefix}/projects/:id/comments`, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      // Check if project exists
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Get current user ID for isLiked flag
      const currentUserId = req.isAuthenticated() ? req.user!.id : 0;
      
      // Get page, limit, and sort parameters from query
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = req.query.sortBy as string || 'newest';
      
      const result = await storage.getProjectComments(projectId, page, limit, sortBy, currentUserId);
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching project comments:', error);
      res.status(500).json({ message: 'Failed to fetch comments' });
    }
  });
  
  // Create a comment
  app.post(`${apiPrefix}/projects/:id/comments`, isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      const { content } = req.body;
      if (!content || content.trim() === '') {
        return res.status(400).json({ message: 'Comment content cannot be empty' });
      }
      
      // Check if project exists
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      const userId = req.user!.id;
      
      // Validate using schema
      try {
        commentInsertSchema.parse({
          content,
          projectId,
          authorId: userId
        });
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          const prettyError = fromZodError(validationError);
          return res.status(400).json({ message: prettyError.message });
        }
        throw validationError;
      }
      
      // Create comment
      const comment = await storage.createComment({
        content,
        projectId,
        authorId: userId
      });
      
      // Record activity
      await storage.recordUserActivity(userId, 'comment_created', comment.id);
      
      // Create notification for project author, but not if commenting on their own project
      if (project.author.id !== userId) {
        await storage.createNotification({
          userId: project.author.id,
          actorId: userId,
          type: 'comment_project',
          projectId,
          commentId: comment.id
        });
        
        // Send real-time notification if user is connected
        const sendNotification = (global as any).sendNotificationToUser;
        if (typeof sendNotification === 'function') {
          const notification = {
            type: 'comment_project',
            actor: {
              id: userId,
              username: req.user!.username,
              avatarUrl: req.user!.avatarUrl
            },
            project: {
              id: projectId,
              title: project.title
            },
            comment: {
              id: comment.id,
              content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
            },
            createdAt: new Date().toISOString()
          };
          sendNotification(project.author.id, notification);
        }
      }
      
      res.status(201).json({ comment });
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ message: 'Failed to create comment' });
    }
  });

  // Gallery image endpoints
  
  // Upload a gallery image to an existing project
  app.post(`${apiPrefix}/projects/:id/gallery`, isAuthenticated, upload.single('galleryImage'), async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      // Get the existing project
      const existingProject = await storage.getProjectById(projectId);
      
      if (!existingProject) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check if user is the author or an admin
      const userId = req.user!.id;
      if (existingProject.author.id !== userId && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update this project' });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: 'No image file uploaded' });
      }
      
      // Log what we received
      console.log(`Processing gallery upload for project ${projectId}:`, {
        file: req.file.filename,
        caption: req.body.caption || 'No caption provided',
        contentType: req.headers['content-type']
      });
      
      // Optimize image and get the URL
      const optimizedUrl = await optimizeImage(req.file.path);
      console.log(`Image optimized: ${optimizedUrl}`);
      
      // Get current display order (highest + 1)
      const existingImages = await storage.getProjectGalleryImages(projectId);
      const displayOrder = existingImages.length > 0 
        ? Math.max(...existingImages.map(img => img.displayOrder)) + 1 
        : 0;
      
      // Create gallery image
      const galleryData = {
        projectId,
        imageUrl: optimizedUrl,
        displayOrder,
        caption: req.body.caption || `Image ${displayOrder + 1}`,
        createdAt: new Date()
      };
      console.log(`Adding gallery image to database:`, galleryData);
      
      const galleryImage = await storage.addProjectGalleryImage(galleryData);
      console.log(`Gallery image added successfully:`, galleryImage);
      
      // Invalidate relevant caches
      cache.invalidateTag('projects:list');
      if (existingProject.featured) {
        cache.invalidateTag('projects:featured');
      }
      
      // Send JSON response with content-type header explicitly set
      res.setHeader('Content-Type', 'application/json');
      res.status(201).json({ galleryImage });
    } catch (error) {
      console.error('Error adding gallery image:', error);
      
      // Send a more detailed error response
      res.status(500).json({ 
        message: 'Failed to add gallery image', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // Update a gallery image caption or display order
  app.patch(`${apiPrefix}/projects/:projectId/gallery/:imageId`, isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const imageId = parseInt(req.params.imageId);
      
      if (isNaN(projectId) || isNaN(imageId)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      // Get the existing project
      const existingProject = await storage.getProjectById(projectId);
      
      if (!existingProject) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check if user is the author or an admin
      const userId = req.user!.id;
      if (existingProject.author.id !== userId && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update this project' });
      }
      
      // Update gallery image
      const updatedImage = await storage.updateProjectGalleryImage(imageId, {
        caption: req.body.caption,
        displayOrder: req.body.displayOrder !== undefined ? parseInt(req.body.displayOrder) : undefined
      });
      
      if (!updatedImage) {
        return res.status(404).json({ message: 'Gallery image not found' });
      }
      
      res.json({ galleryImage: updatedImage });
    } catch (error) {
      console.error('Error updating gallery image:', error);
      res.status(500).json({ message: 'Failed to update gallery image' });
    }
  });
  
  // Get gallery images for a project
  app.get(`${apiPrefix}/projects/:id/gallery`, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      console.log(`Fetching gallery images for project ${projectId}`);
      
      // Get gallery images
      const galleryImages = await storage.getProjectGalleryImages(projectId);
      
      console.log(`Found ${galleryImages.length} gallery images:`, galleryImages);
      
      // Explicitly set content type to JSON and disable any potential HTML rendering
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(200).send(JSON.stringify({ galleryImages }));
    } catch (error) {
      console.error('Error fetching gallery images:', error);
      res.status(500).json({ message: 'Failed to fetch gallery images' });
    }
  });
  
  // Delete a gallery image
  app.delete(`${apiPrefix}/projects/:projectId/gallery/:imageId`, isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const imageId = parseInt(req.params.imageId);
      
      if (isNaN(projectId) || isNaN(imageId)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      // Get the existing project
      const existingProject = await storage.getProjectById(projectId);
      
      if (!existingProject) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check if user is the author or an admin
      const userId = req.user!.id;
      if (existingProject.author.id !== userId && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update this project' });
      }
      
      // Get the image first to get its URL for file deletion
      const galleryImage = await storage.getProjectGalleryImages(projectId)
        .then(images => images.find(img => img.id === imageId));
      
      if (!galleryImage) {
        return res.status(404).json({ message: 'Gallery image not found' });
      }
      
      // Delete the gallery image from the database
      const success = await storage.deleteProjectGalleryImage(imageId);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete gallery image' });
      }
      
      // Try to remove the image file from the file system
      if (galleryImage.imageUrl && galleryImage.imageUrl.startsWith('/uploads/')) {
        const imagePath = path.join(process.cwd(), galleryImage.imageUrl.substr(1));
        fs.unlink(imagePath, (err) => {
          if (err) console.error('Failed to remove gallery image file:', err);
        });
      }
      
      // Invalidate relevant caches
      cache.invalidateTag('projects:list');
      if (existingProject.featured) {
        cache.invalidateTag('projects:featured');
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting gallery image:', error);
      res.status(500).json({ message: 'Failed to delete gallery image' });
    }
  });
  
  return app;
}
