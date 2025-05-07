import { Express, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { projectEvaluations, projects } from '../../shared/schema';
import { aiService } from '../services/ai-service';

/**
 * Register AI-related routes
 */
export function registerAIRoutes(app: Express, apiPrefix: string) {
  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };

  // Get basic project evaluation for non-owners (limited info)
  app.get(`${apiPrefix}/ai/public-evaluation/:projectId`, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
      }

      // Check if the project exists
      const projectExists = await db.query.projects.findFirst({
        where: eq(projects.id, projectId)
      });

      if (!projectExists) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Find evaluation
      const evaluation = await db.query.projectEvaluations.findFirst({
        where: eq(projectEvaluations.projectId, projectId)
      });

      if (!evaluation) {
        return res.status(200).json({ evaluation: null });
      }

      // Return limited information
      return res.status(200).json({
        evaluation: {
          fitScore: evaluation.fitScore,
          valueProposition: evaluation.valueProposition,
          marketFitAnalysis: {
            strengths: evaluation.marketFitAnalysis.strengths
          }
        }
      });
    } catch (error) {
      console.error('Error retrieving public project evaluation:', error);
      return res.status(500).json({ error: 'Failed to retrieve evaluation' });
    }
  });

  // Get full project evaluation (for owners)
  app.get(`${apiPrefix}/ai/project-evaluation/:projectId`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
      }

      // Check if the project exists and the user has permission
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId)
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Check if user is the project owner or an admin
      if (project.authorId !== req.user?.id && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'You do not have permission to access this evaluation' });
      }

      // Find evaluation
      const evaluation = await db.query.projectEvaluations.findFirst({
        where: eq(projectEvaluations.projectId, projectId)
      });

      if (!evaluation) {
        return res.status(200).json({ evaluation: null });
      }

      // Return full evaluation
      return res.status(200).json({ evaluation });
    } catch (error) {
      console.error('Error retrieving project evaluation:', error);
      return res.status(500).json({ error: 'Failed to retrieve evaluation' });
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
        return res.status(200).json({ success: true, message: 'Evaluation already exists' });
      }

      // Prepare project data for evaluation
      console.log('Preparing project data for evaluation');
      const projectData = {
        id: projectResult.id,
        title: projectResult.title,
        description: projectResult.description,
        longDescription: projectResult.longDescription || '',
        projectUrl: projectResult.projectUrl,
        vibeCodingTool: projectResult.vibeCodingTool || '',
        tags: projectResult.projectTags.map(pt => pt.tag.name)
      };

      console.log('Calling AI service to generate evaluation');
      // Generate the AI evaluation
      const evaluation = await aiService.generateProjectEvaluation(projectData);
      console.log('Evaluation generated successfully');

      // Save the evaluation to the database
      console.log('Saving evaluation to database');
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
      console.log('Evaluation saved successfully');

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error generating project evaluation:', error);
      return res.status(500).json({ error: 'Failed to generate project evaluation' });
    }
  });
}