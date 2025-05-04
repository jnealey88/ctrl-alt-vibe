import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { ValidationError, fromZodError } from "zod-validation-error";
import { generateTldrSummary } from "./services/openai";
import { 
  commentInsertSchema, 
  projectInsertSchema, 
  replyInsertSchema,
  comments,
  commentReplies,
  blogPostInsertSchema,
  blogCategoryInsertSchema,
  blogTagInsertSchema,
  userSkills,
  userActivity
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, asc } from "drizzle-orm";
import { setupAuth } from "./auth";
import multer from "multer";
import monitoringRoutes from "./routes/monitoring";
import { registerAdminRoutes } from "./routes/admin";
// Profile routes are now directly implemented in this file
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
  
  // Register admin routes
  registerAdminRoutes(app);
  
  // Profile routes are directly implemented below

  // Test route for debugging
  app.get('/api/test-profile-route', (req, res) => {
    console.log('Test profile route accessed');
    res.json({ message: 'Test profile route works!' });
  });

  // Direct implementation of profile routes with new approach
  
  // Skills endpoint - added debug and better error handling
  app.get('/api/profile/skills', async (req, res) => {
    console.log('GET /api/profile/skills: Improved implementation called');
    try {
      if (!req.isAuthenticated()) {
        console.log('User not authenticated, returning empty skills array');
        return res.json({ skills: [] });
      }

      const userId = req.user!.id;
      console.log('Authenticated user ID:', userId);
      
      try {
        // Direct database query with better error handling
        const result = await db.select()
          .from(userSkills)
          .where(eq(userSkills.userId, userId))
          .orderBy(userSkills.category, userSkills.skill);
        
        console.log('Skills query result:', result);
        res.json({ skills: result });
      } catch (dbError) {
        console.error('Database error in skills endpoint:', dbError);
        // Return empty array on database error instead of error response
        res.json({ skills: [] });
      }
    } catch (error) {
      console.error('Unexpected error in skills endpoint:', error);
      // Return empty array on error instead of error response
      res.json({ skills: [] });
    }
  });

  // Activity endpoint with improved error handling
  app.get('/api/profile/activity', async (req, res) => {
    console.log('GET /api/profile/activity: Improved implementation called');
    try {
      if (!req.isAuthenticated()) {
        console.log('User not authenticated, returning empty activity array');
        return res.json({ activities: [] });
      }
      
      const userId = req.user!.id;
      console.log('Authenticated user ID:', userId);
      const limit = parseInt(req.query.limit as string) || 10;
      
      try {
        // Direct database query with better error handling
        const result = await db.select()
          .from(userActivity)
          .where(eq(userActivity.userId, userId))
          .orderBy(desc(userActivity.createdAt))
          .limit(limit);
        
        console.log('Activity query result:', result);
        res.json({ activities: result });
      } catch (dbError) {
        console.error('Database error in activity endpoint:', dbError);
        // Return empty array on database error instead of error response
        res.json({ activities: [] });
      }
    } catch (error) {
      console.error('Unexpected error in activity endpoint:', error);
      // Return empty array on error instead of error response
      res.json({ activities: [] });
    }
  });

  // Liked projects endpoint with improved error handling
  app.get('/api/profile/liked', async (req, res) => {
    console.log('GET /api/profile/liked: Improved implementation called');
    try {
      if (!req.isAuthenticated()) {
        console.log('User not authenticated, returning empty projects array');
        return res.json({ projects: [] });
      }
      
      const userId = req.user!.id;
      console.log('Authenticated user ID for liked projects:', userId);
      
      try {
        // Get projects that the user has liked
        const likedProjects = await storage.getUserLikedProjects(userId, userId);
        console.log('Liked projects result length:', likedProjects?.length || 0);
        res.json({ projects: likedProjects || [] });
      } catch (dbError) {
        console.error('Database error in liked projects endpoint:', dbError);
        // Return empty array on database error instead of error response
        res.json({ projects: [] });
      }
    } catch (error) {
      console.error('Unexpected error in liked projects endpoint:', error);
      // Return empty array on error instead of error response
      res.json({ projects: [] });
    }
  });
  
  // Serve static files from the uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
  // Check if user is admin
  const isAdmin = (req: Request) => {
    return req.isAuthenticated() && req.user?.role === 'admin';
  };
  
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
      const currentUserId = req.user?.id || 0;
      
      const result = await storage.getProjects({ page, limit, tag, search, sort, user, currentUserId });
      res.json(result);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ message: 'Failed to fetch projects' });
    }
  });
  
  // Get featured project
  app.get(`${apiPrefix}/projects/featured`, async (req, res) => {
    try {
      const currentUserId = req.user?.id || 0;
      const featured = await storage.getFeaturedProject(currentUserId);
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
      const currentUserId = req.user?.id || 0;
      const trending = await storage.getTrendingProjects(limit, currentUserId);
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
      
      const currentUserId = req.user?.id || 0;
      const project = await storage.getProjectById(id, currentUserId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check if the project is private and not owned by the current user
      if (project.isPrivate && project.author.id !== currentUserId) {
        return res.status(403).json({ message: 'You do not have permission to view this project' });
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
        tags: z.array(z.string()).min(1).max(5),
        isPrivate: z.boolean().optional().default(false)
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
        authorId: validatedData.authorId,
        isPrivate: validatedData.isPrivate
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
          isPrivate: z.boolean().optional(),
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
  
  // Share project
  app.post(`${apiPrefix}/projects/:id/share`, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { platform } = req.body;
      
      if (!platform) {
        return res.status(400).json({ message: "Platform is required" });
      }
      
      // Track user ID if authenticated
      const userId = req.isAuthenticated() ? req.user!.id : undefined;
      
      await storage.shareProject(projectId, platform, userId);
      
      // Get updated share count
      const sharesCount = await storage.getProjectShares(projectId);
      
      res.status(200).json({ message: "Project shared successfully", sharesCount });
    } catch (error) {
      console.error("Error sharing project:", error);
      res.status(500).json({ message: "Failed to share project" });
    }
  });
  
  // Get project share count
  app.get(`${apiPrefix}/projects/:id/shares`, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const sharesCount = await storage.getProjectShares(projectId);
      res.status(200).json({ sharesCount });
    } catch (error) {
      console.error("Error getting project shares:", error);
      res.status(500).json({ message: "Failed to get project shares" });
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
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to reply to a comment" });
      }
      
      const commentId = parseInt(req.params.id);
      const userId = req.user!.id;
      
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
  
  // Delete a comment
  app.delete(`${apiPrefix}/comments/:id`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to delete a comment" });
      }
      
      const commentId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Get the comment to check if it belongs to the user
      const comment = await db.query.comments.findFirst({
        where: and(eq(comments.id, commentId), eq(comments.authorId, userId))
      });
      
      if (!comment) {
        return res.status(403).json({ message: "You can only delete your own comments" });
      }
      
      // Delete the comment
      await db.delete(comments).where(eq(comments.id, commentId));
      
      res.json({ success: true, message: "Comment deleted successfully" });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ message: 'Failed to delete comment' });
    }
  });
  
  // Delete a reply
  app.delete(`${apiPrefix}/replies/:id`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to delete a reply" });
      }
      
      const replyId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Get the reply to check if it belongs to the user
      const reply = await db.query.commentReplies.findFirst({
        where: and(eq(commentReplies.id, replyId), eq(commentReplies.authorId, userId))
      });
      
      if (!reply) {
        return res.status(403).json({ message: "You can only delete your own replies" });
      }
      
      // Delete the reply
      await db.delete(commentReplies).where(eq(commentReplies.id, replyId));
      
      res.json({ success: true, message: "Reply deleted successfully" });
    } catch (error) {
      console.error('Error deleting reply:', error);
      res.status(500).json({ message: 'Failed to delete reply' });
    }
  });
  
  // Like a comment
  app.post(`${apiPrefix}/comments/:id/like`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to like a comment" });
      }
      
      const commentId = parseInt(req.params.id);
      const userId = req.user!.id;
      
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
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to like a reply" });
      }
      
      const replyId = parseInt(req.params.id);
      const userId = req.user!.id;
      
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
  
  // Get all available coding tools
  app.get(`${apiPrefix}/coding-tools`, async (req, res) => {
    try {
      const tools = await storage.getAllCodingTools();
      res.json({ tools });
    } catch (error) {
      console.error('Error fetching coding tools:', error);
      res.status(500).json({ message: 'Failed to fetch coding tools' });
    }
  });
  
  // Get popular coding tools
  app.get(`${apiPrefix}/coding-tools/popular`, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const tools = await storage.getPopularCodingTools(limit);
      res.json({ tools });
    } catch (error) {
      console.error('Error fetching popular coding tools:', error);
      res.status(500).json({ message: 'Failed to fetch popular coding tools' });
    }
  });
  
  // Blog routes
  
  // Generate TL;DR summary for a blog post
  app.post(`${apiPrefix}/blog/posts/:id/generate-tldr`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to generate a TL;DR summary" });
      }

      // Only admins can generate TL;DR summaries
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized. Admin access required" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }

      // Get the blog post
      const post = await storage.getBlogPost(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Generate TL;DR summary
      const tldr = await generateTldrSummary(post.content, post.title);

      // Update the blog post with the generated TL;DR
      const updatedPost = await storage.updateBlogPost(id, { tldr });

      res.status(200).json({ 
        success: true, 
        tldr,
        post: updatedPost
      });
    } catch (error) {
      console.error("Error generating TL;DR summary:", error);
      res.status(500).json({ message: "Failed to generate TL;DR summary" });
    }
  });
  
  // Get blog posts with pagination and filtering
  app.get(`${apiPrefix}/blog/posts`, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const page = parseInt(req.query.page as string) || 1;
      const offset = (page - 1) * limit;
      const categoryId = req.query.category ? parseInt(req.query.category as string) : undefined;
      const tagId = req.query.tag ? parseInt(req.query.tag as string) : undefined;
      const authorId = req.query.author ? parseInt(req.query.author as string) : undefined;
      
      // Only admins can see unpublished posts
      const publishedOnly = !isAdmin(req);
      
      const result = await storage.getBlogPosts({ 
        limit, 
        offset,
        publishedOnly,
        categoryId,
        tagId,
        authorId
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      res.status(500).json({ message: 'Failed to fetch blog posts' });
    }
  });
  
  // Get blog post by ID
  app.get(`${apiPrefix}/blog/posts/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid post ID' });
      }
      
      const post = await storage.getBlogPost(id);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Only allow admins to see unpublished posts
      if (!post.published && !isAdmin(req)) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Increment view count
      await storage.incrementBlogPostViews(id);
      
      res.json({ post });
    } catch (error) {
      console.error('Error fetching blog post:', error);
      res.status(500).json({ message: 'Failed to fetch blog post' });
    }
  });
  
  // Get blog post by slug
  app.get(`${apiPrefix}/blog/posts/slug/:slug`, async (req, res) => {
    try {
      const slug = req.params.slug;
      
      const post = await storage.getBlogPostBySlug(slug);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Only allow admins to see unpublished posts
      if (!post.published && !isAdmin(req)) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Increment view count
      await storage.incrementBlogPostViews(post.id);
      
      res.json({ post });
    } catch (error) {
      console.error('Error fetching blog post by slug:', error);
      res.status(500).json({ message: 'Failed to fetch blog post' });
    }
  });
  
  // Create blog post (admin only)
  app.post(`${apiPrefix}/blog/posts`, async (req, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ message: 'Unauthorized. Admin access required' });
      }
      
      const userId = req.user!.id;
      
      const postData = {
        ...req.body,
        authorId: userId
      };
      
      // Create validation schema
      const validatePostWithTags = z.object({
        title: z.string().min(5).max(200),
        slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/, {
          message: 'Slug can only contain lowercase letters, numbers, and hyphens'
        }),
        content: z.string().min(50),
        summary: z.string().min(10).max(500), // Required by the schema
        tldr: z.string().optional().nullable(),
        excerpt: z.string().min(20).max(500).optional(),
        featuredImage: z.string().refine(val => val === '' || /^https?:\/\//.test(val) || val.startsWith('/uploads/'), { message: 'Invalid URL' }).optional(),
        categoryId: z.number().optional().nullable(),
        authorId: z.number(),
        published: z.boolean().default(false),
        tags: z.array(z.number()).optional()
      });
      
      const validatedData = validatePostWithTags.parse(postData);
      const tags = validatedData.tags || [];
      // Remove tags from the validated data
      const { tags: _, ...rest } = validatedData;
      
      // Use the rest of the validated data directly
      const postDataWithoutTags = {
        ...rest
      };
      
      const post = await storage.createBlogPost(postDataWithoutTags, tags);
      res.status(201).json({ post });
    } catch (error) {
      console.error('Error creating blog post:', error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ errors: validationError.details });
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to create blog post' });
    }
  });
  
  // Update blog post (admin only)
  app.put(`${apiPrefix}/blog/posts/:id`, async (req, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ message: 'Unauthorized. Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid post ID' });
      }
      
      const post = await storage.getBlogPost(id);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Validate update data
      const validatePostUpdate = z.object({
        title: z.string().min(5).max(200).optional(),
        slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/, {
          message: 'Slug can only contain lowercase letters, numbers, and hyphens'
        }).optional(),
        content: z.string().min(50).optional(),
        summary: z.string().min(10).max(500).optional(), // Required field in schema
        tldr: z.string().optional().nullable(),
        excerpt: z.string().min(20).max(500).optional().nullable(),
        featuredImage: z.string().refine(val => val === '' || val === null || /^https?:\/\//.test(val) || val.startsWith('/uploads/'), { message: 'Invalid URL' }).optional().nullable(),
        categoryId: z.number().optional().nullable(),
        published: z.boolean().optional(),
        tags: z.array(z.number()).optional()
      });
      
      const validatedData = validatePostUpdate.parse(req.body);
      const tags = validatedData.tags;
      // Remove tags from post data if present and handle featured_image mapping
      const { tags: _, ...rest } = validatedData;
      
      // Use the validated data directly without remapping fields
      const postDataWithoutTags = {
        ...rest
      };
      
      const updatedPost = await storage.updateBlogPost(id, postDataWithoutTags, tags);
      
      if (!updatedPost) {
        return res.status(500).json({ message: 'Failed to update post' });
      }
      
      res.json({ post: updatedPost });
    } catch (error) {
      console.error('Error updating blog post:', error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ errors: validationError.details });
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to update blog post' });
    }
  });
  
  // Delete blog post (admin only)
  app.delete(`${apiPrefix}/blog/posts/:id`, async (req, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ message: 'Unauthorized. Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid post ID' });
      }
      
      const post = await storage.getBlogPost(id);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      const success = await storage.deleteBlogPost(id);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete post' });
      }
      
      res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Error deleting blog post:', error);
      res.status(500).json({ message: 'Failed to delete blog post' });
    }
  });
  
  // Get blog categories
  app.get(`${apiPrefix}/blog/categories`, async (req, res) => {
    try {
      const categories = await storage.getBlogCategories();
      res.json({ categories });
    } catch (error) {
      console.error('Error fetching blog categories:', error);
      res.status(500).json({ message: 'Failed to fetch blog categories' });
    }
  });
  
  // Get blog category by ID
  app.get(`${apiPrefix}/blog/categories/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }
      
      const category = await storage.getBlogCategory(id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json({ category });
    } catch (error) {
      console.error('Error fetching blog category:', error);
      res.status(500).json({ message: 'Failed to fetch blog category' });
    }
  });
  
  // Create blog category (admin only)
  app.post(`${apiPrefix}/blog/categories`, async (req, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ message: 'Unauthorized. Admin access required' });
      }
      
      // Validate category data
      const validateCategory = z.object({
        name: z.string().min(2).max(50),
        slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, {
          message: 'Slug can only contain lowercase letters, numbers, and hyphens'
        }),
        description: z.string().max(500).optional().nullable()
      });
      
      const validatedData = validateCategory.parse(req.body);
      
      const category = await storage.createBlogCategory(validatedData);
      res.status(201).json({ category });
    } catch (error) {
      console.error('Error creating blog category:', error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ errors: validationError.details });
      }
      res.status(500).json({ message: 'Failed to create blog category' });
    }
  });
  
  // Update blog category (admin only)
  app.put(`${apiPrefix}/blog/categories/:id`, async (req, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ message: 'Unauthorized. Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }
      
      // Validate category update data
      const validateCategoryUpdate = z.object({
        name: z.string().min(2).max(50).optional(),
        slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, {
          message: 'Slug can only contain lowercase letters, numbers, and hyphens'
        }).optional(),
        description: z.string().max(500).optional().nullable()
      });
      
      const validatedData = validateCategoryUpdate.parse(req.body);
      
      const category = await storage.updateBlogCategory(id, validatedData);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json({ category });
    } catch (error) {
      console.error('Error updating blog category:', error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ errors: validationError.details });
      }
      res.status(500).json({ message: 'Failed to update blog category' });
    }
  });
  
  // Delete blog category (admin only)
  app.delete(`${apiPrefix}/blog/categories/:id`, async (req, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ message: 'Unauthorized. Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }
      
      const success = await storage.deleteBlogCategory(id);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete category' });
      }
      
      res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting blog category:', error);
      res.status(500).json({ message: 'Failed to delete blog category' });
    }
  });
  
  // Get blog tags
  app.get(`${apiPrefix}/blog/tags`, async (req, res) => {
    try {
      const tags = await storage.getBlogTags();
      res.json({ tags });
    } catch (error) {
      console.error('Error fetching blog tags:', error);
      res.status(500).json({ message: 'Failed to fetch blog tags' });
    }
  });
  
  // Get blog tag by ID
  app.get(`${apiPrefix}/blog/tags/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid tag ID' });
      }
      
      const tag = await storage.getBlogTag(id);
      if (!tag) {
        return res.status(404).json({ message: 'Tag not found' });
      }
      
      res.json({ tag });
    } catch (error) {
      console.error('Error fetching blog tag:', error);
      res.status(500).json({ message: 'Failed to fetch blog tag' });
    }
  });
  
  // Create blog tag (admin only)
  app.post(`${apiPrefix}/blog/tags`, async (req, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ message: 'Unauthorized. Admin access required' });
      }
      
      // Validate tag data
      const validateTag = z.object({
        name: z.string().min(2).max(50),
        slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, {
          message: 'Slug can only contain lowercase letters, numbers, and hyphens'
        })
      });
      
      const validatedData = validateTag.parse(req.body);
      
      const tag = await storage.createBlogTag(validatedData);
      res.status(201).json({ tag });
    } catch (error) {
      console.error('Error creating blog tag:', error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ errors: validationError.details });
      }
      res.status(500).json({ message: 'Failed to create blog tag' });
    }
  });
  
  // Update blog tag (admin only)
  app.put(`${apiPrefix}/blog/tags/:id`, async (req, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ message: 'Unauthorized. Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid tag ID' });
      }
      
      // Validate tag update data
      const validateTagUpdate = z.object({
        name: z.string().min(2).max(50).optional(),
        slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, {
          message: 'Slug can only contain lowercase letters, numbers, and hyphens'
        }).optional()
      });
      
      const validatedData = validateTagUpdate.parse(req.body);
      
      const tag = await storage.updateBlogTag(id, validatedData);
      
      if (!tag) {
        return res.status(404).json({ message: 'Tag not found' });
      }
      
      res.json({ tag });
    } catch (error) {
      console.error('Error updating blog tag:', error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ errors: validationError.details });
      }
      res.status(500).json({ message: 'Failed to update blog tag' });
    }
  });
  
  // Delete blog tag (admin only)
  app.delete(`${apiPrefix}/blog/tags/:id`, async (req, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ message: 'Unauthorized. Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid tag ID' });
      }
      
      const success = await storage.deleteBlogTag(id);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete tag' });
      }
      
      res.status(200).json({ message: 'Tag deleted successfully' });
    } catch (error) {
      console.error('Error deleting blog tag:', error);
      res.status(500).json({ message: 'Failed to delete blog tag' });
    }
  });
  
  // Add a new coding tool (admin only in a real app)
  app.post(`${apiPrefix}/coding-tools`, async (req, res) => {
    try {
      const newTool = await storage.createCodingTool(req.body);
      res.status(201).json({ tool: newTool });
    } catch (error) {
      console.error('Error creating coding tool:', error);
      res.status(500).json({ message: 'Failed to create coding tool' });
    }
  });

  // File upload endpoint with image optimization
  app.post(`${apiPrefix}/upload/image`, upload.single('image'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to upload images" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Get the uploaded file path
      const filePath = req.file.path;
      const fileName = req.file.filename;
      const fileExt = path.extname(fileName).toLowerCase();
      
      // Generate optimized file name
      const optimizedFileName = `${path.basename(fileName, fileExt)}-optimized${fileExt}`;
      const optimizedFilePath = path.join(uploadDir, optimizedFileName);
      
      try {
        // Import sharp dynamically to ensure it's loaded
        const sharp = require('sharp');
        
        // Process the image with Sharp based on file type
        if (fileExt === '.gif' || fileExt === '.svg') {
          // For GIFs and SVGs, just copy them as is (Sharp doesn't handle animations well)
          fs.copyFileSync(filePath, optimizedFilePath);
          
          // After successful copy, we can remove the original
          fs.unlinkSync(filePath);
          
          // Create a URL for the optimized file
          const fileUrl = `/uploads/${optimizedFileName}`;
          
          // Return the URL of the optimized file
          return res.status(201).json({ 
            fileUrl,
            message: 'File uploaded and optimized successfully' 
          });
        } else {
          // For JPG, PNG, WebP, optimize them
          await sharp(filePath)
            .resize({
              width: 1200, // Limit width to max 1200px
              height: 1200, // Limit height to max 1200px
              fit: 'inside', // Maintain aspect ratio
              withoutEnlargement: true // Don't enlarge smaller images
            })
            .jpeg({ quality: 85, progressive: true }) // For JPG output
            .png({ compressionLevel: 9, progressive: true }) // For PNG output
            .webp({ quality: 85 }) // For WebP output
            .toFormat(fileExt === '.png' ? 'png' : fileExt === '.webp' ? 'webp' : 'jpeg')
            .toFile(optimizedFilePath);
          
          // Only delete the original after successful optimization
          fs.unlinkSync(filePath);
          
          // Create a URL for the optimized file
          const fileUrl = `/uploads/${optimizedFileName}`;
          
          // Return the URL of the optimized file
          return res.status(201).json({ 
            fileUrl,
            message: 'File uploaded and optimized successfully' 
          });
        }
      } catch (optimizationError) {
        console.error('Image optimization error:', optimizationError);
        
        // If optimization fails, use the original file since we haven't deleted it yet
        const fileUrl = `/uploads/${fileName}`;
        return res.status(201).json({ 
          fileUrl,
          message: 'File uploaded successfully (without optimization)' 
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });

  // Add monitoring and health check routes
  app.use(`${apiPrefix}/monitoring`, monitoringRoutes);

  // Configure Express to serve static files from the uploads directory with optimized caching
  app.use('/uploads', express.static(uploadDir, { 
    maxAge: '7d', // Cache for 7 days
    immutable: true, // Files with filename hashes never change
    etag: true, // Generate ETags for better caching
    lastModified: true, // Use Last-Modified headers
    index: false, // Don't serve directory indexes
    redirect: false // Don't redirect to trailing slash
  }));
  
  // Configure avatars with longer cache times (30 days) since they change less frequently
  const avatarDir = path.join(process.cwd(), "uploads", "avatars");
  app.use('/uploads/avatars', express.static(avatarDir, { 
    maxAge: '30d', // Cache for 30 days
    immutable: true, // Files with filename hashes never change
    etag: true, // Generate ETags for better caching
    lastModified: true, // Use Last-Modified headers
    index: false, // Don't serve directory indexes
    redirect: false // Don't redirect to trailing slash
  }));

  const httpServer = createServer(app);
  return httpServer;
}
