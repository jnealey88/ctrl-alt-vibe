import { Express, Request, Response } from 'express';
import { storage } from '../storage';
import cache from '../utils/cache';

export function registerTagRoutes(app: Express) {
  const apiPrefix = '/api';
  
  // Get popular tags
  app.get(`${apiPrefix}/tags/popular`, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      
      // Create a cache key based on the limit
      const cacheKey = `tags:popular:${limit}`;
      
      // Try to get from cache first
      let tags = cache.get(cacheKey);
      
      if (!tags) {
        console.log(`Cache miss for ${cacheKey}`);
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
  
  return app;
}
