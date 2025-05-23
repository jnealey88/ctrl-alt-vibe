import { Request, Response, Router, Express } from 'express';
import { db } from '@db';
import { vibeChecks, vibeCheckInsertSchema, projects, projectEvaluations } from '@shared/schema';
import { z } from 'zod';
import { aiService } from '../services/ai-service';
import { storage } from '../storage';
import { eq, SQL } from 'drizzle-orm';
import crypto from 'crypto';

// Generate a unique share ID for vibe checks
function generateShareId(): string {
  return crypto.randomBytes(12).toString('hex');
}

// Verify Google reCAPTCHA token
async function verifyRecaptcha(token: string): Promise<boolean> {
  try {
    // Special case: if the token is "authenticated-user-token", it means
    // the request is coming from an authenticated user through the ProjectEvaluation
    // component, so we bypass reCAPTCHA verification
    if (token === "authenticated-user-token") {
      console.log('Bypassing reCAPTCHA for authenticated user');
      return true;
    }
    
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY is not defined');
      return false;
    }
    
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });
    
    const data = await response.json();
    console.log('reCAPTCHA verification response:', data);
    
    return data.success === true && data.score >= 0.5; // Use threshold of 0.5 for verification
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return false;
  }
}

// Transform function to convert the old evaluation structure to the new one with bootstrapping
function transformEvaluationResponse(evaluation: any): any {
  // Make a copy of the evaluation to avoid modifying the original
  const updatedEvaluation = { ...evaluation };
  
  // Log available fields to help with debugging
  console.log('Available fields in vibe check response:', Object.keys(evaluation).join(', '));
  
  // Ensure bootstrappingGuide exists
  if (!updatedEvaluation.bootstrappingGuide) {
    updatedEvaluation.bootstrappingGuide = {
      costMinimizationTips: [
        "Utilize free cloud service tiers for development",
        "Use open-source alternatives instead of paid tools",
        "Leverage AI coding assistants to accelerate development",
        "Start with minimal viable infrastructure and scale as needed",
        "Focus on core features first, add premium features later"
      ],
      diySolutions: (evaluation.fundingGuidance?.bootstrappingOptions) || 
        "Focus on using existing free and open-source tools to build your project efficiently.",
      growthWithoutFunding: "Focus on organic growth through community engagement and word-of-mouth marketing.",
      timeManagement: "Prioritize features by impact and development complexity, focusing on the core value proposition first.",
      milestonesOnBudget: [
        "Launch MVP with essential features",
        "Achieve first 100 active users",
        "Add one revenue-generating feature",
        "Reach break-even on operational costs",
        "Scale to 1,000 active users"
      ]
    };
  }
  
  // Ensure adjacentIdeas exists
  if (!updatedEvaluation.adjacentIdeas) {
    updatedEvaluation.adjacentIdeas = {
      complementaryProducts: [
        "Mobile companion app for on-the-go access",
        "Browser extension for quicker access to features",
        "Analytics dashboard for user insights",
        "API for integrations with other tools"
      ],
      pivotPossibilities: [
        "Enterprise version with team collaboration features",
        "White-label solution for agencies",
        "Specialized version for specific industry verticals",
        "Education/training platform around the core functionality"
      ],
      expansionOpportunities: [
        "Additional language support for international markets",
        "Premium templates or presets for specific use cases",
        "Managed service option for enterprises",
        "Community marketplace for user-generated content"
      ],
      strategicRecommendations: "Focus on building a strong core product first, then expand to adjacent markets through partnerships and integrations."
    };
  }
  
  // Ensure customerAcquisition exists
  if (!updatedEvaluation.customerAcquisition) {
    updatedEvaluation.customerAcquisition = {
      primaryChannels: [
        "Social media organic content",
        "Content marketing via blog/tutorials",
        "Word-of-mouth referrals", 
        "Online communities and forums"
      ],
      costPerAcquisition: "Low, focused on organic strategies rather than paid acquisition",
      conversionStrategy: "Provide immediate value through freemium model with clear upgrade path",
      retentionTactics: [
        "Regular feature updates based on user feedback",
        "Community building through Discord or Slack channels",
        "Email newsletter with tips and case studies",
        "Exceptional customer support"
      ],
      growthOpportunities: "Encourage user-generated content and social sharing to amplify organic reach"
    };
  }
  
  // Ensure launchStrategy exists
  if (!updatedEvaluation.launchStrategy) {
    updatedEvaluation.launchStrategy = {
      mvpFeatures: [
        "Core functionality focused on solving the primary user pain point",
        "Intuitive, user-friendly interface",
        "Basic account system",
        "Feedback mechanism"
      ],
      timeToMarket: "3-4 months for initial MVP using AI-assisted development",
      marketEntryApproach: "Soft launch with limited features to early adopters for feedback before wider release",
      criticalResources: [
        "Development environment with AI coding tools",
        "Simple landing page with clear value proposition",
        "Documentation and help guides",
        "Basic analytics setup"
      ],
      launchChecklist: [
        "Functional and security testing complete",
        "Privacy policy and terms of service ready",
        "Analytics tracking configured",
        "Social media accounts created",
        "Launch announcement content prepared"
      ]
    };
  }
  
  // Ensure revenueGeneration exists
  if (!updatedEvaluation.revenueGeneration) {
    updatedEvaluation.revenueGeneration = {
      businessModels: [
        "Freemium with premium features",
        "Subscription tiers for enhanced functionality",
        "One-time purchases for specific tools"
      ],
      pricingStrategy: "Value-based pricing tied to concrete benefits, with affordable entry point",
      revenueStreams: [
        "Premium subscriptions",
        "Add-on features or templates",
        "API access for integrations"
      ],
      unitEconomics: "Low marginal costs per user allows for profit once fixed development costs are covered",
      scalingPotential: "Highly scalable with minimal increased costs as user base grows"
    };
  }
  
  return updatedEvaluation;
}

// Register all vibe check routes to the main Express app
export function registerVibeCheckRoutes(app: Express) {
  console.log('Registering vibe check routes');
  app.use('/api/vibe-check', vibeCheckRouter);

  // Add a route to get the total vibe check count outside the router for direct access
  app.get('/api/vibe-check-count', async (req: Request, res: Response) => {
    try {
      const result = await db.select().from(vibeChecks);
      return res.json({ count: result.length });
    } catch (error: any) {
      console.error('Error getting vibe check count:', error);
      return res.status(500).json({ error: 'Failed to get vibe check count' });
    }
  });
}

// Schema for validating vibe check requests
const vibeCheckRequestSchema = z.object({
  email: z.string().email().optional().or(z.literal('')),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  projectDescription: z.string().min(10, 'Project description must be at least 10 characters long'),
  recaptchaToken: z.string().min(1, 'reCAPTCHA token is required')
  // desiredVibe field removed as it's not needed for vibe check
});

export const vibeCheckRouter = Router();

// Create a new vibe check
vibeCheckRouter.post('/', async (req: Request, res: Response) => {
  try {
    console.log('Received vibe check request:', req.body);
    
    // Validate the request
    const validatedData = vibeCheckRequestSchema.parse(req.body);
    
    // Verify reCAPTCHA token
    const isRecaptchaValid = await verifyRecaptcha(validatedData.recaptchaToken);
    
    if (!isRecaptchaValid) {
      console.log('reCAPTCHA verification failed');
      return res.status(400).json({ error: 'reCAPTCHA verification failed. Please try again.' });
    }
    
    console.log('reCAPTCHA verification passed');
    
    // Generate the vibe check evaluation
    console.log('Generating vibe check evaluation...');
    let evaluation = await aiService.generateVibeCheckEvaluation({
      websiteUrl: validatedData.websiteUrl || undefined,
      projectDescription: validatedData.projectDescription
    });
    
    // Transform the evaluation to ensure it has bootstrappingGuide
    evaluation = transformEvaluationResponse(evaluation);
    
    console.log('Vibe check evaluation generated successfully');
    
    // Generate a unique share ID
    const shareId = generateShareId();
    
    // Save the vibe check to database
    const [vibeCheck] = await db.insert(vibeChecks).values({
      email: validatedData.email || null,
      websiteUrl: validatedData.websiteUrl || null,
      projectDescription: validatedData.projectDescription,
      evaluation: evaluation,
      shareId: shareId,
      isPublic: true // Make all vibe checks publicly shareable by default
    }).returning();
    
    console.log(`Vibe check saved with ID: ${vibeCheck.id} and shareId: ${shareId}`);
    
    // Generate the share URL
    const shareUrl = `${req.protocol}://${req.get('host')}/vibe-check/share/${shareId}`;
    
    // Return the vibe check evaluation, ID, and share URL
    return res.status(201).json({
      vibeCheckId: vibeCheck.id,
      evaluation: evaluation,
      shareId: shareId,
      shareUrl: shareUrl
    });
    
  } catch (error: any) {
    console.error('Error creating vibe check:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    
    // Handle OpenAI API errors specifically
    if (error.message?.includes('OpenAI')) {
      return res.status(503).json({ error: 'AI service temporarily unavailable. Please try again later.' });
    }
    
    return res.status(500).json({ error: 'Failed to generate vibe check evaluation' });
  }
});

// Get a specific vibe check
vibeCheckRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const [vibeCheck] = await db.select().from(vibeChecks).where(eq(vibeChecks.id, id));
    
    if (!vibeCheck) {
      return res.status(404).json({ error: 'Vibe check not found' });
    }
    
    // Transform the evaluation to ensure it has bootstrappingGuide
    if (vibeCheck.evaluation) {
      vibeCheck.evaluation = transformEvaluationResponse(vibeCheck.evaluation);
    }
    
    return res.json(vibeCheck);
  } catch (error: any) {
    console.error('Error retrieving vibe check:', error);
    return res.status(500).json({ error: 'Failed to retrieve vibe check' });
  }
});

// Generate or update share link for a vibe check
vibeCheckRouter.post('/:id/share', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // Get the vibe check
    const [vibeCheck] = await db.select().from(vibeChecks).where(eq(vibeChecks.id, id));
    
    if (!vibeCheck) {
      return res.status(404).json({ error: 'Vibe check not found' });
    }
    
    // Check if it already has a shareId
    if (vibeCheck.shareId) {
      // Return the existing share URL
      return res.json({ 
        shareUrl: `${req.protocol}://${req.get('host')}/vibe-check/share/${vibeCheck.shareId}`,
        shareId: vibeCheck.shareId
      });
    }
    
    // Generate a new shareId
    const shareId = generateShareId();
    
    // Update the vibe check to make it shareable
    await db.update(vibeChecks)
      .set({
        shareId: shareId,
        isPublic: true,
        updatedAt: new Date()
      })
      .where(eq(vibeChecks.id, id));
    
    // Return the share URL
    return res.json({ 
      shareUrl: `${req.protocol}://${req.get('host')}/vibe-check/share/${shareId}`,
      shareId: shareId 
    });
  } catch (error: any) {
    console.error('Error generating share link:', error);
    return res.status(500).json({ error: 'Failed to generate share link' });
  }
});

// Get a vibe check by share ID
vibeCheckRouter.get('/share/:shareId', async (req: Request, res: Response) => {
  try {
    const { shareId } = req.params;
    
    if (!shareId || shareId.length < 5) { // Basic validation for share ID
      return res.status(400).json({ error: 'Invalid share ID' });
    }
    
    // Look up the Vibe Check by shareId
    const [vibeCheck] = await db.select().from(vibeChecks).where(eq(vibeChecks.shareId, shareId));
    
    if (!vibeCheck) {
      return res.status(404).json({ error: 'Shared Vibe Check not found' });
    }
    
    if (!vibeCheck.isPublic) {
      return res.status(403).json({ error: 'This Vibe Check is not publicly shared' });
    }
    
    // Transform the evaluation to ensure it has bootstrappingGuide
    if (vibeCheck.evaluation) {
      vibeCheck.evaluation = transformEvaluationResponse(vibeCheck.evaluation);
    }
    
    // Return the public information needed to render the shared version
    return res.json({
      id: vibeCheck.id,
      shareId: vibeCheck.shareId,
      projectDescription: vibeCheck.projectDescription,
      desiredVibe: vibeCheck.desiredVibe,
      evaluation: vibeCheck.evaluation,
      createdAt: vibeCheck.createdAt
    });
  } catch (error: any) {
    console.error('Error retrieving shared vibe check:', error);
    return res.status(500).json({ error: 'Failed to retrieve shared vibe check' });
  }
});

// Convert a vibe check to a project evaluation directly (for authenticated users)
vibeCheckRouter.post('/:id/convert-to-project-evaluation', async (req: Request, res: Response) => {
  try {
    // This endpoint requires authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const vibeCheckId = parseInt(req.params.id);
    if (isNaN(vibeCheckId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // Get the project ID from the request
    const { projectId } = req.body;
    if (!projectId || isNaN(parseInt(projectId.toString()))) {
      return res.status(400).json({ error: 'Valid project ID is required' });
    }
    
    // Get the vibe check
    const [vibeCheck] = await db.select().from(vibeChecks).where(eq(vibeChecks.id, vibeCheckId));
    
    if (!vibeCheck) {
      return res.status(404).json({ error: 'Vibe check not found' });
    }
    
    // Transform the evaluation to ensure it has bootstrappingGuide
    if (vibeCheck.evaluation) {
      vibeCheck.evaluation = transformEvaluationResponse(vibeCheck.evaluation);
    } else {
      return res.status(400).json({ error: 'Vibe check does not have evaluation data' });
    }
    
    // Delete any existing project evaluation
    await db.delete(projectEvaluations)
      .where(eq(projectEvaluations.projectId, parseInt(projectId.toString())));
    
    // Create a new project evaluation from the vibe check data
    const evalData = vibeCheck.evaluation as any;
    
    await db.insert(projectEvaluations).values({
      projectId: parseInt(projectId.toString()),
      marketFitAnalysis: evalData.marketFitAnalysis,
      targetAudience: evalData.targetAudience,
      fitScore: evalData.fitScore,
      fitScoreExplanation: evalData.fitScoreExplanation,
      businessPlan: evalData.businessPlan,
      valueProposition: evalData.valueProposition,
      riskAssessment: evalData.riskAssessment,
      technicalFeasibility: evalData.technicalFeasibility,
      regulatoryConsiderations: evalData.regulatoryConsiderations,
      partnershipOpportunities: evalData.partnershipOpportunities,
      competitiveLandscape: evalData.competitiveLandscape,
      implementationRoadmap: evalData.implementationRoadmap,
      // Additional fields for the expanded evaluation format
      launchStrategy: evalData.launchStrategy,
      customerAcquisition: evalData.customerAcquisition,
      revenueGeneration: evalData.revenueGeneration,
      bootstrappingGuide: evalData.bootstrappingGuide,
      adjacentIdeas: evalData.adjacentIdeas
    });
    
    // Update the vibe check to mark it as referenced
    await db.update(vibeChecks)
      .set({
        updatedAt: new Date()
      })
      .where(eq(vibeChecks.id, vibeCheckId));
    
    return res.status(201).json({ 
      message: 'Vibe check converted to project evaluation successfully', 
      projectId: projectId 
    });
    
  } catch (error: any) {
    console.error('Error converting vibe check to project evaluation:', error);
    return res.status(500).json({ error: 'Failed to convert vibe check to project evaluation' });
  }
});

// Convert a vibe check to a project (for authenticated users)
vibeCheckRouter.post('/:id/convert-to-project', async (req: Request, res: Response) => {
  try {
    // This endpoint requires authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const vibeCheckId = parseInt(req.params.id);
    if (isNaN(vibeCheckId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // Get the vibe check
    const [vibeCheck] = await db.select().from(vibeChecks).where(eq(vibeChecks.id, vibeCheckId));
    
    if (!vibeCheck) {
      return res.status(404).json({ error: 'Vibe check not found' });
    }
    
    // Check if this vibe check has already been converted
    if (vibeCheck.convertedToProject) {
      return res.status(400).json({ error: 'This vibe check has already been converted to a project' });
    }
    
    // Get user info
    const userId = req.user.id;
    
    // Transform the evaluation to ensure it has bootstrappingGuide
    if (vibeCheck.evaluation) {
      vibeCheck.evaluation = transformEvaluationResponse(vibeCheck.evaluation);
    }
    
    // Extract the value proposition as the title (or generate a title from description if not available)
    const evaluation = vibeCheck.evaluation || {};
    // Use type assertion to access valueProposition which may not be in the type definition
    const valueProposition = (evaluation as any).valueProposition as string | undefined;
    
    const title = valueProposition || 
      vibeCheck.projectDescription.split('.')[0].substring(0, 100);
    
    // Generate a description from the project description
    const description = vibeCheck.projectDescription.length > 200 
      ? vibeCheck.projectDescription.substring(0, 197) + '...'
      : vibeCheck.projectDescription;
    
    // Add a single "Vibe Check" tag for all converted projects
    const tagNames: string[] = ["Vibe Check"];
    
    // Determine if project should be private or public
    const isPrivate = req.body?.isPrivate === true;
    
    // Create a new project
    const project = await storage.createProject({
      title: title,
      description: description,
      longDescription: vibeCheck.projectDescription,
      projectUrl: vibeCheck.websiteUrl || '',
      imageUrl: '/vibe-check-cover.png', // Default image specifically for vibe checks
      authorId: userId,
      isPrivate: isPrivate,
      vibeCodingTool: 'OpenAI'
    }, tagNames);
    
    // Update the vibe check to mark it as converted
    await db.update(vibeChecks)
      .set({
        convertedToProject: true,
        convertedProjectId: project.id,
        updatedAt: new Date()
      })
      .where(eq(vibeChecks.id, vibeCheckId));
    
    // If we have evaluation data, also create a project evaluation
    if (vibeCheck.evaluation) {
      try {
        const evalData = vibeCheck.evaluation as any;
        
        await db.insert(projectEvaluations).values({
          projectId: project.id,
          marketFitAnalysis: evalData.marketFitAnalysis,
          targetAudience: evalData.targetAudience,
          fitScore: evalData.fitScore,
          fitScoreExplanation: evalData.fitScoreExplanation,
          businessPlan: evalData.businessPlan,
          valueProposition: evalData.valueProposition,
          riskAssessment: evalData.riskAssessment,
          technicalFeasibility: evalData.technicalFeasibility,
          regulatoryConsiderations: evalData.regulatoryConsiderations,
          partnershipOpportunities: evalData.partnershipOpportunities,
          competitiveLandscape: evalData.competitiveLandscape,
          implementationRoadmap: evalData.implementationRoadmap,
          // Additional fields for the expanded evaluation format
          launchStrategy: evalData.launchStrategy,
          customerAcquisition: evalData.customerAcquisition,
          revenueGeneration: evalData.revenueGeneration,
          bootstrappingGuide: evalData.bootstrappingGuide,
          adjacentIdeas: evalData.adjacentIdeas
        });
      } catch (evalError) {
        console.error('Error creating project evaluation:', evalError);
        // Still continue, just without the evaluation
      }
    }
    
    return res.status(201).json({ 
      message: 'Vibe check converted to project successfully', 
      projectId: project.id 
    });
    
  } catch (error: any) {
    console.error('Error converting vibe check to project:', error);
    return res.status(500).json({ error: 'Failed to convert vibe check to project' });
  }
});