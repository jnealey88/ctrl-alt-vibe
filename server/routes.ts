import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { ValidationError, fromZodError } from "zod-validation-error";
import { generateTldrSummary } from "./services/openai";
import { writeSitemap, generateSitemap } from "./utils/sitemap-generator";
import cache from "./utils/cache";
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
  userActivity,
  notifications,
  notificationTypes,
  projects
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, asc } from "drizzle-orm";
import { setupAuth } from "./auth";
import multer from "multer";
import monitoringRoutes from "./routes/monitoring";
import { registerAdminRoutes } from "./routes/admin";
import { registerAIRoutes } from "./routes/ai";
import { registerVibeCheckRoutes } from "./routes/vibe-check";
// Profile routes are now directly implemented in this file
import path from "path";
import { processUrlForProject } from "./utils/url-metadata";
import fs from "fs";
import sharp from "sharp";

// Set up storage for uploaded files
// Use .replit's storage area if possible for persistent storage
const persistentStorageDir = process.env.REPLIT_DB_URL ? path.join(process.cwd(), ".replit", "data") : null;
const uploadDir = persistentStorageDir && fs.existsSync(persistentStorageDir) 
  ? path.join(persistentStorageDir, "uploads") 
  : path.join(process.cwd(), "uploads");

// Create the uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Log upload directory location for debugging
console.log(`Using upload directory: ${uploadDir}`);

// Ensure old uploads are migrated if needed
const oldUploadDir = path.join(process.cwd(), "uploads");
if (uploadDir !== oldUploadDir && fs.existsSync(oldUploadDir)) {
  try {
    // Copy any existing files from old location if our upload dir is different
    const files = fs.readdirSync(oldUploadDir);
    for (const file of files) {
      const srcPath = path.join(oldUploadDir, file);
      const destPath = path.join(uploadDir, file);
      if (fs.statSync(srcPath).isFile() && !fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Migrated uploaded file: ${file}`);
      }
    }
  } catch (err) {
    console.error('Error migrating uploads:', err);
  }
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
  
  // Register AI routes
  registerAIRoutes(app, '/api');
  
  // Register Vibe Check routes
  registerVibeCheckRoutes(app);
  
  // Create HTTP server once for the entire application
  const httpServer = createServer(app);
  
  // Create WebSocket server on a distinct path
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Generate sitemap.xml initially
  try {
    console.log('Generating initial sitemap.xml...');
    await writeSitemap();
    console.log('Initial sitemap.xml generated successfully');
  } catch (error) {
    console.error('Error generating initial sitemap.xml:', error);
  }
  
  // Set up a timer to regenerate the sitemap periodically (once a day)
  setInterval(async () => {
    try {
      console.log('Regenerating sitemap.xml...');
      await writeSitemap();
      console.log('Sitemap.xml regenerated successfully');
    } catch (error) {
      console.error('Error regenerating sitemap.xml:', error);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours
  
  // Route to dynamically serve the sitemap
  app.get('/sitemap.xml', async (req, res) => {
    try {
      // Generate a fresh sitemap
      const xml = await generateSitemap();
      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error('Error serving dynamic sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });
  
  // Route to serve robots.txt
  app.get('/robots.txt', (req, res) => {
    try {
      const robotsTxtPath = path.join(process.cwd(), 'public', 'robots.txt');
      if (fs.existsSync(robotsTxtPath)) {
        const content = fs.readFileSync(robotsTxtPath, 'utf8');
        res.header('Content-Type', 'text/plain');
        res.send(content);
      } else {
        // If file doesn't exist, generate a default one
        const content = 'User-agent: *\nAllow: /\n\n# Sitemap\nSitemap: https://ctrlaltvibe.com/sitemap.xml\n';
        res.header('Content-Type', 'text/plain');
        res.send(content);
      }
    } catch (error) {
      console.error('Error serving robots.txt:', error);
      res.status(500).send('Error serving robots.txt');
    }
  });
  
  // Store connected clients by userId for pushing notifications
  const clients = new Map<number, WebSocket>();
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');
    
    // Handle messages from clients
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Handle authentication to associate websocket with user
        if (data.type === 'auth') {
          const userId = data.userId;
          if (userId) {
            clients.set(userId, ws);
            console.log(`WebSocket authenticated for user ${userId}`);
            
            // Send confirmation
            ws.send(JSON.stringify({ type: 'auth_success' }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
      // Remove client from the clients map
      clients.forEach((socket, userId) => {
        if (socket === ws) {
          clients.delete(userId);
          console.log(`Removed user ${userId} from WebSocket clients`);
        }
      });
    });
  });
  
  // Helper to send notification to a specific user
  // Use type assertion to avoid TypeScript errors
  (global as any).sendNotificationToUser = (userId: number, notification: any) => {
    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'notification',
        data: notification
      }));
      console.log(`Real-time notification sent to user ${userId}`);
    } else {
      console.log(`User ${userId} not connected via WebSocket or connection not ready`);
    }
  };
  
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

  // Notifications endpoints
  
  // Get user notifications
  app.get('/api/notifications', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const unreadOnly = req.query.unreadOnly === 'true';
      
      const result = await storage.getUserNotifications(userId, { limit, offset, unreadOnly });
      res.json(result);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });
  
  // Get unread notifications count
  app.get('/api/notifications/count', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.json({ count: 0 });
      }
      
      const userId = req.user!.id;
      const count = await storage.getUnreadNotificationsCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
      res.status(500).json({ message: 'Failed to fetch notifications count' });
    }
  });
  
  // Mark notification as read
  app.patch('/api/notifications/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: 'Invalid notification ID' });
      }
      
      const userId = req.user!.id;
      const success = await storage.markNotificationAsRead(notificationId, userId);
      
      if (success) {
        res.json({ message: 'Notification marked as read' });
      } else {
        res.status(404).json({ message: 'Notification not found' });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to update notification' });
    }
  });
  
  // Mark all notifications as read
  app.patch('/api/notifications', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const userId = req.user!.id;
      const success = await storage.markAllNotificationsAsRead(userId);
      
      if (success) {
        res.json({ message: 'All notifications marked as read' });
      } else {
        res.status(500).json({ message: 'Failed to mark notifications as read' });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Failed to update notifications' });
    }
  });
  
  // Delete notification
  app.delete('/api/notifications/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: 'Invalid notification ID' });
      }
      
      const userId = req.user!.id;
      const success = await storage.deleteNotification(notificationId, userId);
      
      if (success) {
        res.json({ message: 'Notification deleted' });
      } else {
        res.status(404).json({ message: 'Notification not found' });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: 'Failed to delete notification' });
    }
  });
  
  // Serve static files from the uploads directory
  // Static files are served from the main uploads directory configuration below
  
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
      
      // Build a cache key based on all query parameters
      // Only cache if there's no search term (search results shouldn't be cached)
      if (!search) {
        const cacheKey = `projects:list:page:${page}:limit:${limit}:tag:${tag || 'none'}:sort:${sort || 'default'}:user:${user || 'none'}:currentUser:${currentUserId}`;
        
        // Try to get data from cache first
        let result = cache.get(cacheKey);
        
        // If not in cache, fetch from database and cache the result
        if (!result) {
          result = await storage.getProjects({ page, limit, tag, search, sort, user, currentUserId });
          // Cache for 2 minutes
          cache.set(cacheKey, result, { ttl: 2 * 60 * 1000, tag: 'projects:list' });
        }
        
        return res.json(result);
      }
      
      // For search queries, don't use cache
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
      
      // Create a cache key based on the user ID
      // Each user needs their own cache since isLiked/isBookmarked flags depend on user
      const cacheKey = `projects:featured:user:${currentUserId}`;
      
      // Try to get data from cache first
      let featured = cache.get(cacheKey);
      
      // If not in cache, fetch from database and cache the result
      if (!featured) {
        featured = await storage.getFeaturedProject(currentUserId);
        // Cache for 5 minutes
        cache.set(cacheKey, featured, { ttl: 5 * 60 * 1000, tag: 'projects:featured' });
      }
      
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
      
      // Create a cache key based on limit and user ID
      const cacheKey = `projects:trending:limit:${limit}:user:${currentUserId}`;
      
      // Try to get data from cache first
      let trending = cache.get(cacheKey);
      
      // If not in cache, fetch from database and cache the result
      if (!trending) {
        trending = await storage.getTrendingProjects(limit, currentUserId);
        // Cache for 5 minutes
        cache.set(cacheKey, trending, { ttl: 5 * 60 * 1000, tag: 'projects:trending' });
      }
      
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
  
  // Extract URL metadata for project creation
  app.post(`${apiPrefix}/extract-url-metadata`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to use this feature" });
      }
      
      // Validate the URL
      const urlSchema = z.object({
        url: z.string().url("Please enter a valid URL")
      });
      
      const { url } = urlSchema.parse(req.body);
      
      // Process the URL to extract metadata and take a screenshot
      const metadata = await processUrlForProject(url);
      
      if (!metadata.success) {
        return res.status(400).json({ 
          message: "Failed to extract data from URL",
          metadata: {
            title: "",
            description: "",
            imageUrl: ""
          }
        });
      }
      
      res.json({
        success: true,
        metadata
      });
    } catch (error) {
      console.error('Error extracting URL metadata:', error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ errors: validationError.details });
      }
      res.status(500).json({ message: 'Failed to extract URL metadata' });
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
      
      // Get project author to create notification if it's not the comment author
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
        columns: {
          authorId: true
        }
      });
      
      // If project exists and the commenter is not the project author, create a notification
      if (project && project.authorId !== userId) {
        await storage.createNotification({
          userId: project.authorId,
          type: "new_comment",
          actorId: userId,
          projectId,
          commentId: comment.id
        });
      }
      
      // Record user activity
      await storage.recordUserActivity(userId, "comment_added", comment.id);
      
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
      
      // Get the comment with project and author details to create notifications
      const comment = await db.query.comments.findFirst({
        where: eq(comments.id, commentId),
        columns: {
          id: true,
          authorId: true,
          projectId: true
        }
      });
      
      if (comment) {
        // Notify the comment author if they're not the one replying
        if (comment.authorId !== userId) {
          await storage.createNotification({
            userId: comment.authorId,
            type: "new_reply",
            actorId: userId,
            projectId: comment.projectId,
            commentId: comment.id,
            replyId: reply.id
          });
        }
        
        // Get the project author to notify them as well if needed
        if (comment.projectId) {
          const project = await db.query.projects.findFirst({
            where: eq(projects.id, comment.projectId),
            columns: {
              authorId: true
            }
          });
          
          // Notify project author if they're not the commenter or replier
          if (project && project.authorId !== userId && project.authorId !== comment.authorId) {
            await storage.createNotification({
              userId: project.authorId,
              type: "new_reply",
              actorId: userId,
              projectId: comment.projectId,
              commentId: comment.id,
              replyId: reply.id
            });
          }
        }
        
        // Record user activity
        await storage.recordUserActivity(userId, "reply_added", reply.id);
      }
      
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
      
      // Create a cache key based on the limit parameter
      const cacheKey = `tags:popular:${limit}`;
      
      // Try to get data from cache first
      let tags = cache.get<string[]>(cacheKey);
      
      // If not in cache, fetch from database and cache the result
      if (!tags) {
        tags = await storage.getPopularTags(limit);
        // Cache for 10 minutes - these don't change very frequently
        cache.set(cacheKey, tags, { ttl: 10 * 60 * 1000, tag: 'tags' });
      }
      
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
      const categorySlug = req.query.category as string;
      const tagId = req.query.tag ? parseInt(req.query.tag as string) : undefined;
      const authorId = req.query.author ? parseInt(req.query.author as string) : undefined;
      const search = req.query.search as string || undefined;
      
      // Only admins can see unpublished posts
      const publishedOnly = !isAdmin(req);
      
      let categoryId: number | undefined;
      
      // If categorySlug is provided, get the categoryId from the slug
      if (categorySlug) {
        const category = await storage.getBlogCategoryBySlug(categorySlug);
        if (category) {
          categoryId = category.id;
        }
      }
      
      const result = await storage.getBlogPosts({ 
        limit, 
        offset,
        publishedOnly,
        categoryId,
        tagId,
        authorId,
        search
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

  // File upload endpoint with more reliable image handling
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
      
      // For simplicity and reliability, just use the original file without optimization
      // This avoids potential issues with Sharp optimization that might lead to file corruption
      const fileUrl = `/uploads/${fileName}`;
      
      console.log(`File uploaded successfully: ${fileName}, URL: ${fileUrl}`);
      
      // Return the URL of the file
      return res.status(201).json({ 
        fileUrl,
        message: 'File uploaded successfully' 
      });
      
      /* Disabled image optimization due to reliability issues
      // Generate optimized file name 
      const optimizedFileName = `${path.basename(fileName, fileExt)}-optimized${fileExt}`;
      const optimizedFilePath = path.join(uploadDir, optimizedFileName);
      
      try {
        // Use the imported sharp module
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
      */
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
  const avatarDir = path.join(uploadDir, "avatars");
  // Ensure avatar directory exists
  if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
  }
  app.use('/uploads/avatars', express.static(avatarDir, { 
    maxAge: '30d', // Cache for 30 days
    immutable: true, // Files with filename hashes never change
    etag: true, // Generate ETags for better caching
    lastModified: true, // Use Last-Modified headers
    index: false, // Don't serve directory indexes
    redirect: false // Don't redirect to trailing slash
  }));

  return httpServer;
}
