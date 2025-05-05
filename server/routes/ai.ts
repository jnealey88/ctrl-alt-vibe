/**
 * AI routes for the application
 */

import { Express, Request, Response } from 'express';
import { AIService } from '../services/ai-service';
import { isAuthenticated } from '../middleware/auth';

// API routes prefix
const apiPrefix = '/api';

// Initialize service
const aiService = new AIService();

/**
 * Register AI-related routes
 * @param app Express application
 */
export function registerAIRoutes(app: Express) {
  // Suggest tags based on project description
  app.post(`${apiPrefix}/ai/suggest-tags`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { description, existingTags = [] } = req.body;
      
      if (!description) {
        return res.status(400).json({ error: 'Description is required' });
      }
      
      const suggestedTags = await aiService.suggestTags(description, existingTags);
      return res.json({ tags: suggestedTags });
    } catch (error) {
      console.error('Error suggesting tags:', error);
      return res.status(500).json({ error: 'Failed to generate tag suggestions' });
    }
  });

  // Analyze sentiment of content
  app.post(`${apiPrefix}/ai/analyze-sentiment`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }
      
      const sentiment = await aiService.analyzeSentiment(text);
      return res.json(sentiment);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return res.status(500).json({ error: 'Failed to analyze sentiment' });
    }
  });

  // Summarize text content
  app.post(`${apiPrefix}/ai/summarize`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { text, maxLength } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }
      
      const summary = await aiService.summarizeProjectDescription(text, maxLength);
      return res.json({ summary });
    } catch (error) {
      console.error('Error summarizing text:', error);
      return res.status(500).json({ error: 'Failed to generate summary' });
    }
  });
}
