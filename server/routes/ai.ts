import { Express, Request, Response } from 'express';
import { aiService } from '../services';
import { isAuthenticated } from '../middleware/auth';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

// Validation schema for tag suggestions
const tagSuggestionSchema = z.object({
  description: z.string().min(1, 'Description must not be empty'),
  existingTags: z.array(z.string()).optional()
});

// Validation schema for sentiment analysis
const sentimentAnalysisSchema = z.object({
  text: z.string().min(1, 'Text must not be empty')
});

// Validation schema for text summarization
const summarizationSchema = z.object({
  text: z.string().min(1, 'Text must not be empty'),
  maxLength: z.number().int().positive().optional()
});

export function registerAIRoutes(app: Express) {
  const apiPrefix = '/api';
  
  // Generate tag suggestions for project descriptions
  app.post(`${apiPrefix}/ai/suggest-tags`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = tagSuggestionSchema.safeParse(req.body);
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({ error: error.message });
      }
      
      const { description, existingTags = [] } = validationResult.data;
      
      // Get tag suggestions from the AI service
      const suggestedTags = await aiService.suggestTags(description, existingTags);
      
      return res.json({ tags: suggestedTags });
    } catch (error) {
      console.error('Error generating tag suggestions:', error);
      return res.status(500).json({ error: 'Failed to generate tag suggestions' });
    }
  });
  
  // Analyze sentiment of text
  app.post(`${apiPrefix}/ai/analyze-sentiment`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = sentimentAnalysisSchema.safeParse(req.body);
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({ error: error.message });
      }
      
      const { text } = validationResult.data;
      
      // Get sentiment analysis from the AI service
      const sentiment = await aiService.analyzeSentiment(text);
      
      return res.json(sentiment);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return res.status(500).json({ error: 'Failed to analyze sentiment' });
    }
  });
  
  // Summarize text
  app.post(`${apiPrefix}/ai/summarize`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = summarizationSchema.safeParse(req.body);
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({ error: error.message });
      }
      
      const { text, maxLength } = validationResult.data;
      
      // Get summary from the AI service
      const summary = await aiService.summarizeProjectDescription(text, maxLength);
      
      return res.json({ summary });
    } catch (error) {
      console.error('Error summarizing text:', error);
      return res.status(500).json({ error: 'Failed to summarize text' });
    }
  });
  
  return app;
}
