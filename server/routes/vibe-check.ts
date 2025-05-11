import { Express, Request, Response } from 'express';
import { db } from '../../db';
import { vibeChecks } from '../../shared/schema';
import { aiService } from '../services/ai-service';
import { eq } from 'drizzle-orm';

/**
 * Register Vibe Check related routes
 */
export function registerVibeCheckRoutes(app: Express, apiPrefix: string) {
  /**
   * Process a vibe check request
   * This endpoint is public and does not require authentication
   */
  app.post(`${apiPrefix}/vibe-check`, async (req: Request, res: Response) => {
    try {
      const { email, websiteUrl, projectDescription, desiredVibe } = req.body;
      
      console.log('Vibe Check requested for project idea:');
      console.log(`Description length: ${projectDescription?.length || 0} characters`);
      
      // Validate required fields
      if (!projectDescription || projectDescription.trim().length < 10) {
        return res.status(400).json({ 
          error: 'Please provide a project description of at least 10 characters' 
        });
      }
      
      // Basic validation for email if provided
      if (email && (!email.includes('@') || !email.includes('.'))) {
        return res.status(400).json({ error: 'Please provide a valid email address' });
      }
      
      // Basic validation for website URL if provided
      if (websiteUrl && !websiteUrl.startsWith('http')) {
        return res.status(400).json({ error: 'Please provide a valid URL starting with http:// or https://' });
      }
      
      console.log('Calling AI service to generate vibe check evaluation');
      
      // Generate the AI evaluation
      const evaluation = await aiService.generateVibeCheckEvaluation({
        websiteUrl,
        projectDescription,
        desiredVibe
      });
      
      console.log('Vibe Check evaluation generated successfully');

      // Store the vibe check information in the database
      console.log('Saving vibe check to database');
      
      try {
        const [savedVibeCheck] = await db.insert(vibeChecks).values({
          email: email || null,
          websiteUrl: websiteUrl || null,
          projectDescription,
          desiredVibe: desiredVibe || null,
          evaluation
        }).returning();
        
        console.log(`Vibe check saved with ID: ${savedVibeCheck.id}`);
        
        // Return the evaluation and vibeCheckId
        return res.status(200).json({
          success: true,
          evaluation,
          vibeCheckId: savedVibeCheck.id
        });
      } catch (dbError) {
        console.error('Database error saving vibe check:', dbError);
        // If we have the evaluation but database save fails, still return the evaluation to the user
        return res.status(200).json({
          success: true,
          evaluation,
          warning: 'Your evaluation was generated successfully but could not be saved to our database'
        });
      }
    } catch (error) {
      console.error('Error generating vibe check evaluation:', error);
      return res.status(500).json({ error: 'Failed to generate vibe check evaluation' });
    }
  });
  
  /**
   * Convert a vibe check to a project
   * Requires authentication (user must be logged in)
   */
  app.post(`${apiPrefix}/vibe-check/:id/convert-to-project`, async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'You must be logged in to convert a vibe check to a project' });
      }
      
      const vibeCheckId = parseInt(req.params.id);
      
      if (isNaN(vibeCheckId)) {
        return res.status(400).json({ error: 'Invalid vibe check ID' });
      }
      
      // Get the vibe check
      const vibeCheck = await db.query.vibeChecks.findFirst({
        where: eq(vibeChecks.id, vibeCheckId)
      });
      
      if (!vibeCheck) {
        return res.status(404).json({ error: 'Vibe check not found' });
      }
      
      // Check if it's already been converted
      if (vibeCheck.convertedToProject) {
        return res.status(400).json({ 
          error: 'This vibe check has already been converted to a project',
          projectId: vibeCheck.convertedProjectId
        });
      }
      
      // Create a project from the vibe check
      const { isPrivate, tags } = req.body;
      
      // Here you would use your existing project creation logic to add the project
      // This will depend on how projects are currently created in your system
      // For now, we'll just return a success message
      
      return res.status(200).json({ 
        success: true, 
        message: 'Vibe check will be converted to a project. This functionality is coming soon.' 
      });
    } catch (error) {
      console.error('Error converting vibe check to project:', error);
      return res.status(500).json({ error: 'Failed to convert vibe check to project' });
    }
  });
}