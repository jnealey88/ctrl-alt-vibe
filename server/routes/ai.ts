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

  // Get basic project evaluation for non-owners (no data - for backward compatibility)
  app.get(`${apiPrefix}/ai/public-evaluation/:projectId`, async (req: Request, res: Response) => {
    // This endpoint now returns no evaluation data as evaluations are only for owners/admins
    // Keeping the endpoint for backward compatibility
    return res.status(200).json({ evaluation: null });
  });

  // Get full project evaluation (for owners)
  app.get(`${apiPrefix}/ai/project-evaluation/:projectId`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      console.log(`Accessing evaluation for project ${projectId}`);
      console.log(`User authenticated:`, req.isAuthenticated());
      console.log(`User data:`, req.user);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
      }

      // Check if the project exists and the user has permission
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId)
      });

      if (!project) {
        console.log('Project not found:', projectId);
        return res.status(404).json({ error: 'Project not found' });
      }

      console.log(`Project author ID: ${project.authorId}, Current user ID: ${req.user?.id}`);
      console.log(`User role: ${req.user?.role}`);
      console.log(`Is owner: ${project.authorId === req.user?.id}`);
      console.log(`Is admin: ${req.user?.role === 'admin'}`);

      // Check if user is the project owner or an admin
      if (project.authorId !== req.user?.id && req.user?.role !== 'admin') {
        console.log('Permission denied. Not owner or admin.');
        return res.status(403).json({ error: 'You do not have permission to access this evaluation' });
      }

      // Find evaluation
      const evaluation = await db.query.projectEvaluations.findFirst({
        where: eq(projectEvaluations.projectId, projectId)
      });

      if (!evaluation) {
        console.log('No evaluation found for project', projectId);
        return res.status(200).json({ evaluation: null });
      }

      // Return full evaluation with admin flag
      console.log('Returning evaluation with admin flag:', req.user?.role === 'admin');
      return res.status(200).json({ 
        evaluation,
        isAdmin: req.user?.role === 'admin'
      });
    } catch (error) {
      console.error('Error retrieving project evaluation:', error);
      return res.status(500).json({ error: 'Failed to retrieve evaluation' });
    }
  });

  // Generate or retrieve a project evaluation
  app.post(`${apiPrefix}/ai/evaluate-project`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.body;
      
      console.log(`Generating evaluation for project ${projectId}`);
      console.log(`User authenticated:`, req.isAuthenticated());
      console.log(`User data:`, req.user);
      
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
        console.log('Project not found:', projectId);
        return res.status(404).json({ error: 'Project not found' });
      }

      console.log(`Project author ID: ${projectResult.authorId}, Current user ID: ${req.user?.id}`);
      console.log(`User role: ${req.user?.role}`);
      console.log(`Is owner: ${projectResult.authorId === req.user?.id}`);
      console.log(`Is admin: ${req.user?.role === 'admin'}`);

      // Check if user is the project owner
      if (projectResult.authorId !== req.user?.id && req.user?.role !== 'admin') {
        console.log('Permission denied. Not owner or admin.');
        return res.status(403).json({ error: 'You do not have permission to evaluate this project' });
      }

      // Always delete any existing evaluation to ensure fresh data
      // Delete old evaluation regardless of who's calling it
      const existingEvaluation = await db.query.projectEvaluations.findFirst({
        where: eq(projectEvaluations.projectId, projectId)
      });

      if (existingEvaluation) {
        console.log(`Deleting existing evaluation ${existingEvaluation.id} for project ${projectId}`);
        
        // Delete the evaluation record
        await db.delete(projectEvaluations)
          .where(eq(projectEvaluations.id, existingEvaluation.id));
      }
      
      // No need to use require for cache clearing, we'll handle this differently
      console.log(`Ensuring no caching for project evaluation: ${projectId}`);

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
        competitiveLandscape: evaluation.competitiveLandscape,
        implementationRoadmap: evaluation.implementationRoadmap
      });
      console.log('Evaluation saved successfully');

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error generating project evaluation:', error);
      return res.status(500).json({ error: 'Failed to generate project evaluation' });
    }
  });
}