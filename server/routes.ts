import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { ValidationError, fromZodError } from "zod-validation-error";
import { 
  commentInsertSchema, 
  projectInsertSchema, 
  replyInsertSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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
      // In a real application, this would be retrieved from the authenticated user
      const userId = 1; // Mock user ID
      
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
        imageUrl: z.string().url(),
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
      const projectId = parseInt(req.params.id);
      // In a real application, this would be retrieved from the authenticated user
      const userId = 1; // Mock user ID
      
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
      const projectId = parseInt(req.params.id);
      // In a real application, this would be retrieved from the authenticated user
      const userId = 1; // Mock user ID
      
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
      
      // In a real application, this would be retrieved from the authenticated user
      const userId = 1; // Mock user ID
      
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
      const projectId = parseInt(req.params.id);
      // In a real application, this would be retrieved from the authenticated user
      const userId = 1; // Mock user ID
      
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

  const httpServer = createServer(app);
  return httpServer;
}
