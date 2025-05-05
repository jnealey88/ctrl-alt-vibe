import { Express, Request, Response } from 'express';
import { storage } from '../storage';
import { projectService } from '../services';
import { z } from 'zod';
import { ValidationError, fromZodError } from 'zod-validation-error';
import { projectInsertSchema } from '@shared/schema';
import cache from '../utils/cache';
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
        cache.set(cacheKey, result, { ttl: 2 * 60 * 1000, tag: 'projects:list' });
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
        cache.set(cacheKey, result, { ttl: 5 * 60 * 1000, tag: 'projects:featured' });
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
        cache.set(cacheKey, result, { ttl: 5 * 60 * 1000, tag: 'projects:trending' });
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
  app.post(`${apiPrefix}/projects`, isAuthenticated, upload.single('image'), async (req, res) => {
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
      
      // Handle the image
      if (req.file) {
        // Resize and optimize the image
        const optimizedImagePath = path.join(uploadDir, 'opt-' + req.file.filename);
        
        try {
          await sharp(req.file.path)
            .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toFile(optimizedImagePath);
          
          // Now use the optimized image instead
          projectData.imageUrl = `/uploads/opt-${req.file.filename}`;
          
          // Remove the original if optimization succeeded
          fs.unlinkSync(req.file.path);
        } catch (sharpError) {
          console.error('Error optimizing image:', sharpError);
          // Fallback to original image if optimization fails
          projectData.imageUrl = `/uploads/${req.file.filename}`;
        }
      } else if (!projectData.imageUrl) {
        // Set a default image if none provided
        projectData.imageUrl = '/images/default-project.jpg';
      }
      
      // Create the project
      const project = await storage.createProject(projectData, tagNames);
      
      // Invalidate relevant caches
      cache.invalidateByTag('projects:list');
      cache.invalidateByTag('projects:featured');
      cache.invalidateByTag('projects:trending');
      
      // Record activity
      await storage.recordUserActivity(req.user!.id, 'project_created', project.id);
      
      res.status(201).json({ project });
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ message: 'Failed to create project' });
    }
  });
  
  // Update project
  app.patch(`${apiPrefix}/projects/:id`, isAuthenticated, upload.single('image'), async (req, res) => {
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
      
      // Handle the image if a new one was uploaded
      if (req.file) {
        // Resize and optimize the image
        const optimizedImagePath = path.join(uploadDir, 'opt-' + req.file.filename);
        
        try {
          await sharp(req.file.path)
            .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toFile(optimizedImagePath);
          
          // Now use the optimized image instead
          projectData.imageUrl = `/uploads/opt-${req.file.filename}`;
          
          // Remove the original if optimization succeeded
          fs.unlinkSync(req.file.path);
          
          // If there was a previous image that wasn't the default, try to remove it
          if (existingProject.imageUrl && 
              !existingProject.imageUrl.includes('default-project.jpg') && 
              existingProject.imageUrl.startsWith('/uploads/')) {
            const oldImagePath = path.join(process.cwd(), existingProject.imageUrl.substr(1));
            fs.unlink(oldImagePath, (err) => {
              if (err) console.error('Failed to remove old image:', err);
            });
          }
        } catch (sharpError) {
          console.error('Error optimizing image:', sharpError);
          // Fallback to original image if optimization fails
          projectData.imageUrl = `/uploads/${req.file.filename}`;
        }
      }
      
      // Update the project
      const updatedProject = await storage.updateProject(projectId, projectData, tagNames);
      
      if (!updatedProject) {
        return res.status(500).json({ message: 'Failed to update project' });
      }
      
      // Invalidate relevant caches
      cache.invalidateByTag('projects:list');
      if (existingProject.featured || projectData.featured) {
        cache.invalidateByTag('projects:featured');
      }
      cache.invalidateByTag('projects:trending');
      
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
      cache.invalidateByTag('projects:list');
      if (existingProject.featured) {
        cache.invalidateByTag('projects:featured');
      }
      cache.invalidateByTag('projects:trending');
      
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
      cache.invalidateByTag('projects:list');
      cache.invalidateByTag('projects:trending');
      if (project.featured) {
        cache.invalidateByTag('projects:featured');
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
      cache.invalidateByTag('projects:list');
      cache.invalidateByTag('projects:trending');
      if (project.featured) {
        cache.invalidateByTag('projects:featured');
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
      
      const comments = await storage.getProjectComments(projectId, currentUserId);
      
      res.json({ comments });
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
  
  return app;
}
