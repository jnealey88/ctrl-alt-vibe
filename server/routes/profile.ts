/**
 * Profile routes for managing user profiles, skills, and activity
 */
import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../middleware/auth";
import { z } from "zod";
import { ValidationError, fromZodError } from "zod-validation-error";
import { userSkillInsertSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Set up storage for uploaded files
const uploadDir = path.join(process.cwd(), "uploads", "avatars");

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
    cb(null, `avatar-${uniqueSuffix}${ext}`);
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

export function registerProfileRoutes(app: Express) {
  const apiPrefix = '/api';

  // Get user profile with projects
  app.get(`${apiPrefix}/profile`, isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = req.user;
      
      // Get user's projects
      const { projects } = await storage.getProjects({ 
        user: userId.toString(), 
        currentUserId: userId,
        limit: 100 // Get all user projects
      });

      res.json({
        user,
        projects
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile data' });
    }
  });

  // Update profile
  app.patch(`${apiPrefix}/profile`, isAuthenticated, async (req, res) => {
    try {
      const updateSchema = z.object({
        email: z.string().email().optional(),
        bio: z.string().max(300).optional()
      });

      const validatedData = updateSchema.parse(req.body);
      const userId = req.user!.id;

      // Update user profile
      const updatedUser = await storage.updateUser(userId, validatedData);

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Upload avatar
  app.post(`${apiPrefix}/profile/avatar`, isAuthenticated, upload.single('avatar'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const userId = req.user!.id;
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      // Update user with new avatar URL
      const updatedUser = await storage.updateUser(userId, { avatarUrl });

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ avatarUrl });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      res.status(500).json({ error: 'Failed to upload avatar' });
    }
  });

  // Get user skills
  app.get(`${apiPrefix}/profile/skills`, isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const skills = await storage.getUserSkills(userId);
      res.json({ skills });
    } catch (error) {
      console.error('Error fetching skills:', error);
      res.status(500).json({ error: 'Failed to fetch skills data' });
    }
  });

  // Add a skill
  app.post(`${apiPrefix}/profile/skills`, isAuthenticated, async (req, res) => {
    try {
      const skillSchema = z.object({
        category: z.string().min(1, "Category is required"),
        skill: z.string().min(1, "Skill name is required")
      });

      const validatedData = skillSchema.parse(req.body);
      const userId = req.user!.id;

      const newSkill = await storage.addUserSkill(
        userId, 
        validatedData.category, 
        validatedData.skill
      );

      res.status(201).json(newSkill);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error('Error adding skill:', error);
      res.status(500).json({ error: 'Failed to add skill' });
    }
  });

  // Remove a skill
  app.delete(`${apiPrefix}/profile/skills/:id`, isAuthenticated, async (req, res) => {
    try {
      const skillId = parseInt(req.params.id);
      const userId = req.user!.id;

      if (isNaN(skillId)) {
        return res.status(400).json({ error: 'Invalid skill ID' });
      }

      const success = await storage.removeUserSkill(skillId, userId);

      if (!success) {
        return res.status(404).json({ error: 'Skill not found or not owned by user' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error removing skill:', error);
      res.status(500).json({ error: 'Failed to remove skill' });
    }
  });

  // Get user activity
  app.get(`${apiPrefix}/profile/activity`, isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getUserActivities(userId, limit);
      res.json({ activities });
    } catch (error) {
      console.error('Error fetching activities:', error);
      res.status(500).json({ error: 'Failed to fetch activity data' });
    }
  });

  // Get user's liked projects
  app.get(`${apiPrefix}/profile/liked`, isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const likedProjects = await storage.getUserLikedProjects(userId, userId);
      res.json({ projects: likedProjects });
    } catch (error) {
      console.error('Error fetching liked projects:', error);
      res.status(500).json({ error: 'Failed to fetch liked projects' });
    }
  });

  // View another user's profile
  app.get(`${apiPrefix}/users/:username`, async (req, res) => {
    try {
      const { username } = req.params;
      const currentUserId = req.isAuthenticated() ? req.user!.id : 0;
      
      // Find user by username
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get user's public projects
      const { projects } = await storage.getProjects({ 
        user: user.id.toString(), 
        currentUserId
      });
      
      // Get user's skills
      const skills = await storage.getUserSkills(user.id);
      
      // Get recent activities
      const activities = await storage.getUserActivities(user.id, 5);
      
      res.json({
        user: {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          createdAt: user.createdAt
        },
        projects,
        skills,
        activities
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  });
}