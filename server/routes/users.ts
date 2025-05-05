import { Express, Request, Response } from 'express';
import { storage } from '../storage';
import { isAuthenticated } from '../middleware/auth';
import { db } from '@db';
import { users, userSkills, userActivity } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

export function registerUserRoutes(app: Express) {
  const apiPrefix = '/api';
  
  // Get current user data
  app.get(`${apiPrefix}/user`, (req, res) => {
    if (req.isAuthenticated()) {
      // Remove sensitive data
      const user = { ...req.user };
      delete user.password;
      
      res.json(user);
    } else {
      res.json(null);
    }
  });

  // Get all user roles (used for filtering in UI)
  app.get(`${apiPrefix}/user-roles`, async (req, res) => {
    try {
      // This could be cached or stored in a constant if roles don't change often
      const roles = ['Bolt', 'Magic Patterns', 'Replit AI'];
      res.json({ roles });
    } catch (error) {
      console.error('Error fetching user roles:', error);
      res.status(500).json({ message: 'Failed to fetch user roles' });
    }
  });

  // Get all profiles for user directory
  app.get(`${apiPrefix}/profiles`, async (req, res) => {
    try {
      // Get profiles with basic information
      const profiles = await db.query.users.findMany({
        columns: {
          id: true,
          username: true,
          avatarUrl: true,
          bio: true,
          role: true
        },
        orderBy: users.username
      });
      
      res.json({ profiles });
    } catch (error) {
      console.error('Error fetching profiles:', error);
      res.status(500).json({ message: 'Failed to fetch profiles' });
    }
  });

  // Get user profile by username
  app.get(`${apiPrefix}/profiles/:username`, async (req, res) => {
    try {
      const username = req.params.username;
      
      // Get user by username
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove sensitive data
      delete user.password;
      
      // Get user's projects
      const currentUserId = req.isAuthenticated() ? req.user!.id : 0;
      const { projects } = await storage.getProjects({ 
        user: user.id.toString(), 
        currentUserId,
        limit: 100 // Get all user projects
      });
      
      // Get user's skills
      const skills = await storage.getUserSkills(user.id);
      
      // Get user's activity
      const activities = await storage.getUserActivities(user.id);
      
      res.json({
        user,
        projects,
        skills,
        activities
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ message: 'Failed to fetch user profile' });
    }
  });

  // Add a skill to the current user's profile
  app.post(`${apiPrefix}/profile/skills`, isAuthenticated, async (req, res) => {
    try {
      const { category, skill } = req.body;
      
      if (!category || !skill) {
        return res.status(400).json({ message: 'Category and skill are required' });
      }
      
      const userId = req.user!.id;
      
      const result = await storage.addUserSkill(userId, category, skill);
      
      res.status(201).json({ skill: result });
    } catch (error) {
      console.error('Error adding skill:', error);
      res.status(500).json({ message: 'Failed to add skill' });
    }
  });

  // Remove a skill from the current user's profile
  app.delete(`${apiPrefix}/profile/skills/:id`, isAuthenticated, async (req, res) => {
    try {
      const skillId = parseInt(req.params.id);
      if (isNaN(skillId)) {
        return res.status(400).json({ message: 'Invalid skill ID' });
      }
      
      const userId = req.user!.id;
      
      const success = await storage.removeUserSkill(skillId, userId);
      
      if (success) {
        res.json({ message: 'Skill removed successfully' });
      } else {
        res.status(404).json({ message: 'Skill not found' });
      }
    } catch (error) {
      console.error('Error removing skill:', error);
      res.status(500).json({ message: 'Failed to remove skill' });
    }
  });

  // Get all skill categories for the current user
  app.get(`${apiPrefix}/profile/skill-categories`, isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      const categories = await storage.getUserSkillCategories(userId);
      
      res.json({ categories });
    } catch (error) {
      console.error('Error fetching skill categories:', error);
      res.status(500).json({ message: 'Failed to fetch skill categories' });
    }
  });

  // Get all skills for the current user
  app.get(`${apiPrefix}/profile/skills`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.json({ skills: [] });
      }
      
      const userId = req.user!.id;
      
      const skills = await storage.getUserSkills(userId);
      
      res.json({ skills });
    } catch (error) {
      console.error('Error fetching skills:', error);
      res.status(500).json({ message: 'Failed to fetch skills' });
    }
  });

  // Get activity for the current user
  app.get(`${apiPrefix}/profile/activity`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.json({ activities: [] });
      }
      
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const activities = await storage.getUserActivities(userId, limit);
      
      res.json({ activities });
    } catch (error) {
      console.error('Error fetching activity:', error);
      res.status(500).json({ message: 'Failed to fetch activity' });
    }
  });

  // Get liked projects for the current user
  app.get(`${apiPrefix}/profile/liked`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.json({ projects: [] });
      }
      
      const userId = req.user!.id;
      
      const projects = await storage.getUserLikedProjects(userId, userId);
      
      res.json({ projects: projects || [] });
    } catch (error) {
      console.error('Error fetching liked projects:', error);
      res.status(500).json({ message: 'Failed to fetch liked projects' });
    }
  });

  // Update current user's profile
  app.patch(`${apiPrefix}/profile`, isAuthenticated, async (req, res) => {
    try {
      const updateSchema = z.object({
        email: z.string().email().optional(),
        bio: z.string().max(300).optional()
      });

      const validatedData = updateSchema.parse(req.body);
      const userId = req.user!.id;

      const updatedUser = await storage.updateUser(userId, validatedData);
      
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update profile' });
      }
      
      // Remove sensitive data
      delete updatedUser.password;
      
      res.json({ user: updatedUser });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });
  
  return app;
}
