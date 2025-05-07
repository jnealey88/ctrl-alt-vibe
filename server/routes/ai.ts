/**
 * AI routes for the application
 */

import { Express, Request, Response } from 'express';
import { AIService } from '../services/ai-service';
import { isAuthenticated } from '../middleware/auth';
import { storage } from '../storage';

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

  // Generate an AI evaluation for a project
  app.post(`${apiPrefix}/ai/evaluate-project`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.body;
      
      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      // Get the project
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Verify that the user owns the project or is an admin
      const userId = req.user?.id || 0;
      if (project.author.id !== userId) {
        // Check if user is admin
        const user = await storage.getUserById(userId);
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ 
            error: 'Only the project owner can generate evaluations' 
          });
        }
      }

      // Check if project already has an evaluation
      const existingEvaluation = await storage.getProjectEvaluation(projectId);
      if (existingEvaluation) {
        return res.json({ 
          message: 'Evaluation already exists for this project',
          evaluation: existingEvaluation 
        });
      }

      // Generate evaluation
      const evaluationResult = await aiService.generateProjectEvaluation({
        title: project.title,
        description: project.description,
        longDescription: project.longDescription,
        tags: project.tags
      });

      // Save the evaluation
      const savedEvaluation = await storage.saveProjectEvaluation(
        projectId,
        evaluationResult.evaluation,
        evaluationResult.fitScore
      );

      return res.json({ 
        message: 'Project evaluation generated successfully',
        evaluation: savedEvaluation
      });
    } catch (error) {
      console.error('Error generating project evaluation:', error);
      return res.status(500).json({ 
        error: 'Failed to generate project evaluation. Please try again later.' 
      });
    }
  });

  // Get project evaluation
  app.get(`${apiPrefix}/ai/project-evaluation/:projectId`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      
      if (!projectId || isNaN(parseInt(projectId))) {
        return res.status(400).json({ error: 'Valid project ID is required' });
      }

      const project = await storage.getProjectById(parseInt(projectId));
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Verify that the user owns the project or is an admin
      const userId = req.user?.id;
      if (project.author.id !== userId) {
        // Check if user is admin
        const user = await storage.getUserById(userId);
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ 
            error: 'Only the project owner can view evaluations' 
          });
        }
      }

      const evaluation = await storage.getProjectEvaluation(parseInt(projectId));
      if (!evaluation) {
        return res.status(404).json({ 
          error: 'No evaluation exists for this project. Generate one first.' 
        });
      }

      return res.json(evaluation);
    } catch (error) {
      console.error('Error fetching project evaluation:', error);
      return res.status(500).json({ error: 'Failed to fetch project evaluation' });
    }
  });

  // Delete project evaluation
  app.delete(`${apiPrefix}/ai/project-evaluation/:projectId`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      
      if (!projectId || isNaN(parseInt(projectId))) {
        return res.status(400).json({ error: 'Valid project ID is required' });
      }

      const project = await storage.getProjectById(parseInt(projectId));
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Verify that the user owns the project or is an admin
      const userId = req.user?.id;
      if (project.author.id !== userId) {
        // Check if user is admin
        const user = await storage.getUserById(userId);
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ 
            error: 'Only the project owner can delete evaluations' 
          });
        }
      }

      const deleted = await storage.deleteProjectEvaluation(parseInt(projectId));
      if (!deleted) {
        return res.status(404).json({ error: 'No evaluation found to delete' });
      }

      return res.json({ message: 'Project evaluation deleted successfully' });
    } catch (error) {
      console.error('Error deleting project evaluation:', error);
      return res.status(500).json({ error: 'Failed to delete project evaluation' });
    }
  });
}
