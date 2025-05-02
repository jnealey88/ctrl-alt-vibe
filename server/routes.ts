import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { ValidationError, fromZodError } from "zod-validation-error";
import { 
  commentInsertSchema, 
  projectInsertSchema, 
  replyInsertSchema
} from "@shared/schema";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";

// Set up storage for uploaded files
const uploadDir = path.join(process.cwd(), "uploads");

// Create the uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  const apiPrefix = '/api';
  
  // Projects routes
  
  // Get all projects with filtering
  app.get(`${apiPrefix}/projects`, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 6;
      const tag = req.query.tag as string;
      const search = req.query.search as string;
      const sort = req.query.sort as string;
      const user = req.query.user as string;
      
      const result = await storage.getProjects({ page, limit, tag, search, sort, user });
      res.json(result);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ message: 'Failed to fetch projects' });
    }
  });
  
  // Get featured project
  app.get(`${apiPrefix}/projects/featured`, async (req, res) => {
    try {
      const featured = await storage.getFeaturedProject();
      res.json({ project: featured });
    } catch (error) {
      console.error('Error fetching featured project:', error);
      res.status(500).json({ message: 'Failed to fetch featured project' });
    }
  });
  
  // Get trending projects
  app.get(`${apiPrefix}/projects/trending`, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 4;
      const trending = await storage.getTrendingProjects(limit);
      res.json({ projects: trending });
    } catch (error) {
      console.error('Error fetching trending projects:', error);
      res.status(500).json({ message: 'Failed to fetch trending projects' });
    }
  });
  
  // Get project by ID
  app.get(`${apiPrefix}/projects/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      const project = await storage.getProjectById(id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      res.json({ project });
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({ message: 'Failed to fetch project' });
    }
  });
  
  // Create new project
  app.post(`${apiPrefix}/projects`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to create a project" });
      }
      const userId = req.user?.id || 0;
      
      // Validate project data
      const projectData = {
        ...req.body,
        authorId: userId
      };
      
      // Creating custom validator because tags are sent as array from client
      const validateProjectWithTags = z.object({
        title: z.string().min(3).max(100),
        description: z.string().min(20).max(500),
        longDescription: z.string().optional(),
        projectUrl: z.string().url(),
        imageUrl: z.string().refine(val => {
          // Allow URLs that start with http:// or https:// (remote images)
          if (val.startsWith('http://') || val.startsWith('https://')) {
            return true;
          }
          // Allow URLs that start with /uploads/ (local uploads)
          if (val.startsWith('/uploads/')) {
            return true;
          }
          return false;
        }, { message: "Please provide a valid image URL or upload an image" }),
        vibeCodingTool: z.string().optional(),
        authorId: z.number(),
        tags: z.array(z.string()).min(1).max(5)
      });
      
      const validatedData = validateProjectWithTags.parse(projectData);
      const tags = validatedData.tags;
      // Create a new object omitting tags instead of using delete
      const projectDataWithoutTags = {
        title: validatedData.title,
        description: validatedData.description,
        longDescription: validatedData.longDescription,
        projectUrl: validatedData.projectUrl,
        imageUrl: validatedData.imageUrl,
        vibeCodingTool: validatedData.vibeCodingTool,
        authorId: validatedData.authorId
      };
      
      const project = await storage.createProject(projectDataWithoutTags, tags);
      res.status(201).json({ project });
    } catch (error) {
      console.error('Error creating project:', error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ errors: validationError.details });
      }
      res.status(500).json({ message: 'Failed to create project' });
    }
  });
  
  // Like a project
  app.post(`${apiPrefix}/projects/:id/like`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to like a project" });
      }
      const projectId = parseInt(req.params.id);
      const userId = req.user?.id || 0;
      
      const { liked } = req.body;
      
      if (liked) {
        await storage.likeProject(projectId, userId);
      } else {
        await storage.unlikeProject(projectId, userId);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error liking project:', error);
      res.status(500).json({ message: 'Failed to like project' });
    }
  });
  
  // Bookmark a project
  app.post(`${apiPrefix}/projects/:id/bookmark`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to bookmark a project" });
      }
      
      const projectId = parseInt(req.params.id);
      const userId = req.user?.id || 0;
      
      const { bookmarked } = req.body;
      
      if (bookmarked) {
        await storage.bookmarkProject(projectId, userId);
      } else {
        await storage.unbookmarkProject(projectId, userId);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error bookmarking project:', error);
      res.status(500).json({ message: 'Failed to bookmark project' });
    }
  });
  
  // Update project
  app.put(`${apiPrefix}/projects/:id`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to update a project" });
      }
      
      const projectId = parseInt(req.params.id);
      const project = await storage.getProjectById(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if the authenticated user is the author of the project
      if (project.author.id !== req.user!.id) {
        return res.status(403).json({ message: "You do not have permission to update this project" });
      }
      
      try {
        // Create validation schema for update
        const validateProjectWithTags = z.object({
          title: z.string().min(3).max(100),
          description: z.string().min(20).max(500),
          longDescription: z.string().optional(),
          projectUrl: z.string().url(),
          imageUrl: z.string(),
          vibeCodingTool: z.string().optional(),
          tags: z.array(z.string()).min(1).max(5),
        });
        
        const validated = validateProjectWithTags.parse(req.body);
        const { tags: tagNames, ...projectData } = validated;
        
        const updatedProject = await storage.updateProject(projectId, projectData, tagNames);
        
        if (!updatedProject) {
          return res.status(404).json({ message: "Failed to update project" });
        }
        
        res.json({ project: updatedProject });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const validationError = fromZodError(error);
          return res.status(400).json({ errors: validationError.details });
        }
        throw error;
      }
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ message: 'Failed to update project' });
    }
  });
  
  // Delete project
  app.delete(`${apiPrefix}/projects/:id`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to delete a project" });
      }
      
      const projectId = parseInt(req.params.id);
      const project = await storage.getProjectById(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if the authenticated user is the author of the project
      if (project.author.id !== req.user!.id) {
        return res.status(403).json({ message: "You do not have permission to delete this project" });
      }
      
      const success = await storage.deleteProject(projectId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete project" });
      }
      
      res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ message: 'Failed to delete project' });
    }
  });
  
  // Record project view
  app.post(`${apiPrefix}/projects/:id/view`, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      await storage.incrementProjectViews(projectId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error recording view:', error);
      res.status(500).json({ message: 'Failed to record view' });
    }
  });
  
  // Comments routes
  
  // Get comments for a project
  app.get(`${apiPrefix}/projects/:id/comments`, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = req.query.sortBy as string || 'newest';
      
      // Get user ID from authentication if available
      const userId = req.isAuthenticated() ? req.user!.id : 0;
      
      const result = await storage.getProjectComments(projectId, page, limit, sortBy, userId);
      res.json(result);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Failed to fetch comments' });
    }
  });
  
  // Add a comment to a project
  app.post(`${apiPrefix}/projects/:id/comments`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to comment" });
      }
      
      const projectId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      const commentData = {
        projectId,
        authorId: userId,
        content: req.body.content
      };
      
      const validatedData = commentInsertSchema.parse(commentData);
      const comment = await storage.createComment(validatedData);
      
      res.status(201).json({ comment });
    } catch (error) {
      console.error('Error creating comment:', error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ errors: validationError.details });
      }
      res.status(500).json({ message: 'Failed to create comment' });
    }
  });
  
  // Add a reply to a comment
  app.post(`${apiPrefix}/comments/:id/replies`, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      // In a real application, this would be retrieved from the authenticated user
      const userId = 1; // Mock user ID
      
      const replyData = {
        commentId,
        authorId: userId,
        content: req.body.content
      };
      
      const validatedData = replyInsertSchema.parse(replyData);
      const reply = await storage.createCommentReply(validatedData);
      
      res.status(201).json({ reply });
    } catch (error) {
      console.error('Error creating reply:', error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ errors: validationError.details });
      }
      res.status(500).json({ message: 'Failed to create reply' });
    }
  });
  
  // Like a comment
  app.post(`${apiPrefix}/comments/:id/like`, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      // In a real application, this would be retrieved from the authenticated user
      const userId = 1; // Mock user ID
      
      const { liked } = req.body;
      
      if (liked) {
        await storage.likeComment(commentId, userId);
      } else {
        await storage.unlikeComment(commentId, userId);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error liking comment:', error);
      res.status(500).json({ message: 'Failed to like comment' });
    }
  });
  
  // Like a reply
  app.post(`${apiPrefix}/replies/:id/like`, async (req, res) => {
    try {
      const replyId = parseInt(req.params.id);
      // In a real application, this would be retrieved from the authenticated user
      const userId = 1; // Mock user ID
      
      const { liked } = req.body;
      
      if (liked) {
        await storage.likeReply(replyId, userId);
      } else {
        await storage.unlikeReply(replyId, userId);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error liking reply:', error);
      res.status(500).json({ message: 'Failed to like reply' });
    }
  });
  
  // Get popular tags
  app.get(`${apiPrefix}/tags/popular`, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const tags = await storage.getPopularTags(limit);
      res.json({ tags });
    } catch (error) {
      console.error('Error fetching popular tags:', error);
      res.status(500).json({ message: 'Failed to fetch popular tags' });
    }
  });
  
  // Get all available tags
  app.get(`${apiPrefix}/tags`, async (req, res) => {
    try {
      const tags = await storage.getAllTags();
      res.json({ tags });
    } catch (error) {
      console.error('Error fetching all tags:', error);
      res.status(500).json({ message: 'Failed to fetch all tags' });
    }
  });

  // File upload endpoint
  app.post(`${apiPrefix}/upload/image`, upload.single('image'), (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to upload images" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Create a URL for the uploaded file
      const fileName = req.file.filename;
      const fileUrl = `/uploads/${fileName}`;
      
      // Return the URL of the uploaded file
      res.status(201).json({ 
        fileUrl,
        message: 'File uploaded successfully' 
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });

  // Configure Express to serve static files from the uploads directory
  app.use('/uploads', express.static(uploadDir, { maxAge: '1d' }));

  const httpServer = createServer(app);
  return httpServer;
}
