/**
 * AI routes for the application
 */

import { Express, Request, Response } from 'express';
import { AIService } from '../services/ai-service';
import { isAuthenticated } from '../middleware/auth';
import { db } from '../../db';
import { eq } from 'drizzle-orm';
import { projects, projectEvaluations } from '../../shared/schema';

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

  // Generate or retrieve a project evaluation
  app.post(`${apiPrefix}/ai/evaluate-project`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.body;
      
      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      // Fetch the project
      const projectResult = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
        with: {
          author: true,
          projectTags: {
            with: {
              tag: true
            }
          }
        }
      });

      if (!projectResult) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Check if user is the project owner
      if (projectResult.authorId !== req.user?.id && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'You do not have permission to evaluate this project' });
      }

      // Check if an evaluation already exists
      const existingEvaluation = await db.query.projectEvaluations.findFirst({
        where: eq(projectEvaluations.projectId, projectId)
      });

      if (existingEvaluation) {
        // Just return success since the evaluation exists
        return res.status(200).json({ success: true });
      }

      // Prepare project data for evaluation
      const projectData = {
        id: projectResult.id,
        title: projectResult.title,
        description: projectResult.description,
        longDescription: projectResult.longDescription || '',
        projectUrl: projectResult.projectUrl,
        vibeCodingTool: projectResult.vibeCodingTool || '',
        tags: projectResult.projectTags.map(pt => pt.tag.name)
      };

      // Generate the AI evaluation
      const evaluation = await aiService.generateProjectEvaluation(projectData);

      // Save the evaluation to the database
      await db.insert(projectEvaluations).values({
        projectId: projectResult.id,
        marketFitAnalysis: evaluation.marketFitAnalysis,
        targetAudience: evaluation.targetAudience,
        fitScore: evaluation.fitScore,
        fitScoreExplanation: evaluation.fitScoreExplanation,
        businessPlan: evaluation.businessPlan,
        valueProposition: evaluation.valueProposition,
        riskAssessment: evaluation.riskAssessment,
        technicalFeasibility: evaluation.technicalFeasibility,
        regulatoryConsiderations: evaluation.regulatoryConsiderations,
        partnershipOpportunities: evaluation.partnershipOpportunities,
        competitiveLandscape: evaluation.competitiveLandscape
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error generating project evaluation:', error);
      return res.status(500).json({ error: 'Failed to generate project evaluation' });
    }
  });

  // Get a project evaluation (only for project owner)
  app.get(`${apiPrefix}/ai/project-evaluation/:projectId`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
      }

      // Get project to check ownership
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId)
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Check if user is the project owner or admin
      if (project.authorId !== req.user?.id && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'You do not have permission to view this evaluation' });
      }

      // Get the evaluation
      const evaluation = await db.query.projectEvaluations.findFirst({
        where: eq(projectEvaluations.projectId, projectId)
      });

      if (!evaluation) {
        return res.status(404).json({ error: 'Evaluation not found' });
      }

      return res.json({ evaluation });
    } catch (error) {
      console.error('Error fetching project evaluation:', error);
      return res.status(500).json({ error: 'Failed to fetch project evaluation' });
    }
  });
  
  // Check if a project has a public evaluation that can be viewed without auth
  app.get(`${apiPrefix}/ai/public-evaluation/:projectId`, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
      }

      // Get project to check if it exists and is public
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId)
      });

      if (!project || project.isPrivate) {
        return res.status(404).json({ error: 'Project not found or private' });
      }

      // Get the evaluation
      const evaluation = await db.query.projectEvaluations.findFirst({
        where: eq(projectEvaluations.projectId, projectId)
      });

      if (!evaluation) {
        return res.status(404).json({ error: 'Evaluation not found' });
      }

      // Check if user is authenticated and is project owner or admin
      const isOwner = req.isAuthenticated() && 
        (project.authorId === req.user?.id || req.user?.role === 'admin');

      if (!isOwner) {
        // For non-owners, return limited evaluation data
        return res.json({
          evaluation: {
            fitScore: evaluation.fitScore,
            valueProposition: evaluation.valueProposition,
            // Return a subset of strengths
            marketFitAnalysis: {
              strengths: evaluation.marketFitAnalysis?.strengths?.slice(0, 2) || []
            }
          }
        });
      }

      // For owners, return the full evaluation
      return res.json({ evaluation });
    } catch (error) {
      console.error('Error fetching public project evaluation:', error);
      return res.status(500).json({ error: 'Failed to fetch project evaluation' });
    }
  });
}
