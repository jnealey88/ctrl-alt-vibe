import OpenAI from 'openai';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = 'gpt-4o';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class AIService {
  /**
   * Generate a vibe check evaluation for a project idea
   * @param projectInfo Information about the project idea
   * @returns Vibe Check evaluation object with the same structure as project evaluation
   */
  async generateVibeCheckEvaluation(projectInfo: {
    websiteUrl?: string;
    projectDescription: string;
    desiredVibe?: string;
  }): Promise<{
    marketFitAnalysis: { strengths: string[]; weaknesses: string[]; demandPotential: string };
    targetAudience: { demographic: string; psychographic: string };
    fitScore: number;
    fitScoreExplanation: string;
    businessPlan: { revenueModel: string; goToMarket: string; milestones: string[] };
    valueProposition: string;
    riskAssessment: { risks: Array<{ type: string; description: string; mitigation: string }> };
    technicalFeasibility: string;
    regulatoryConsiderations: string;
    partnershipOpportunities: { partners: string[] };
    competitiveLandscape: { competitors: Array<{ name: string; differentiation: string }> };
    implementationRoadmap?: { 
      phases: Array<{ 
        timeframe: string; 
        tasks: string[]; 
        metrics: string[] 
      }> 
    };
    // Enhanced business guidance sections
    launchStrategy: {
      mvpFeatures: string[];
      timeToMarket: string;
      marketEntryApproach: string;
      criticalResources: string[];
      launchChecklist: string[];
    };
    customerAcquisition: {
      primaryChannels: string[];
      acquisitionCost: string;
      conversionStrategy: string;
      retentionTactics: string[];
      growthOpportunities: string;
    };
    revenueGeneration: {
      businessModels: string[];
      pricingStrategy: string;
      revenueStreams: string[];
      unitEconomics: string;
      scalingPotential: string;
    };
    bootstrappingGuide: {
      costMinimizationTips: string[];
      diySolutions: string;
      growthWithoutFunding: string;
      timeManagement: string;
      milestonesOnBudget: string[];
    };
  }> {
    console.log(`Generating vibe check evaluation for a project idea`);
    
    // Combine all project information for context
    const projectContext = `
      Project Description: ${projectInfo.projectDescription}
      ${projectInfo.websiteUrl ? `Project Website URL: ${projectInfo.websiteUrl}` : ''}
      ${projectInfo.desiredVibe ? `Desired Vibe/Style: ${projectInfo.desiredVibe}` : ''}
    `;

    try {
      // Check if API key is set
      if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY is not set. Check your environment variables.');
        throw new Error('OpenAI API key is missing');
      }
      
      // Log the project context (limited for privacy)
      console.log(`Project context length: ${projectContext.length} characters`);
      console.log(`Project context sample: ${projectContext.substring(0, 100)}...`);
      
      const systemPrompt = `You are an expert business and technology consultant who specializes in evaluating project ideas for "vibe coding" (using AI-assisted coding). Your analysis is highly detailed, practical, and tailored for solo developers who need both business and technical guidance.
        
        Analyze the following project idea information and provide an extremely comprehensive evaluation with the following elements:
        
        1. Market-Fit Analysis:
           - Identify 5-7 specific strengths with concrete examples of how they create value in the market
           - For each strength, explain exactly how it addresses a real market need with specific use cases
           - Identify 5-7 specific weaknesses with detailed, actionable recommendations for improvement
           - For each weakness, provide a step-by-step approach to address it with realistic timelines
           - Provide detailed demand potential analysis with market size estimates, growth projections, and specific customer segments
           - Include 3-5 specific market trends that directly impact this project's potential success
           - Recommend 2-3 specific pivots or adjustments that could dramatically improve market fit
        
        2. Target Audience:
           - Create detailed demographic profiles including specific age ranges, income levels, education, occupation, geographic location, and technology usage patterns
           - Develop comprehensive psychographic profiles with values, interests, pain points, buying behaviors, and decision-making factors
           - Include 3 detailed user personas with names, backgrounds, goals, scenarios for using the product, and specific friction points they experience
           - For each persona, provide a "day in the life" scenario showing exactly how the product solves their problems
           - Identify 2-3 underserved segments within the target audience that represent growth opportunities
           - Recommend specific messaging approaches for each target segment
        
        3. Fit Score:
           - Assign a numerical rating (0-100) based on concrete criteria with individual scores for market fit, technical feasibility, and business viability
           - Provide a detailed explanation for the score broken down by 7-10 key success factors with individual ratings
           - Include specific, actionable recommendations to improve each factor by at least 10-15 points
           - Compare the fit score to similar successful projects in the same domain as benchmarks
           - Identify the 3 most impactful changes that would improve the overall score
        
        4. Business Plan:
           - Detail 4-6 revenue model options with specific pricing structures, pros/cons, and implementation requirements for each
           - For each revenue model, include specific examples of companies using similar models successfully
           - Create a detailed phased go-to-market strategy with specific channels, messaging approaches, and KPIs for each phase
           - Include exact metrics to track for evaluating go-to-market success
           - Outline 7-10 key milestones with specific timeframes, detailed implementation steps, and clear success criteria
           - Provide concrete monetization strategies with detailed pricing models, revenue projections, and break-even analysis
           - Include acquisition cost estimates and lifetime value projections for different customer segments
           - Add specific customer retention strategies with measurable targets
        
        5. Value Proposition:
           - Provide a concise, compelling one-sentence summary of project value that could be used in marketing
           - Break down the value proposition into 5-7 specific, quantifiable benefits for each user segment
           - Include before/after scenarios showing the transformation users experience with concrete metrics
           - Create a value matrix mapping specific features to customer benefits and pain points addressed
           - Suggest 3-5 ways to strengthen and communicate the value proposition more effectively
           - Include specific messaging examples for different channels (website, email, social media)
        
        6. Risk Assessment:
           - Identify 7-9 project risks across technical, market, financial, regulatory, and operational domains
           - Rate each risk by impact (High/Medium/Low) and probability (High/Medium/Low) with specific justifications
           - Provide extremely detailed mitigation strategies with specific actions, timelines, and success indicators
           - Include contingency plans for high-impact risks with exact trigger points and response protocols
           - Create a risk monitoring framework with specific metrics to track for early warning signs
           - Prioritize risks based on a calculated risk score (impact × probability)
           - Identify specific resources, tools, and methods to address each risk effectively
        
        7. Technical Feasibility:
           - Provide an in-depth analysis of implementing this project through vibe coding (AI-assisted development)
           - Identify 7-10 critical technical components that must be properly prompted for when vibe coding this project
           - For each component, include specific prompt examples and approaches to get high-quality AI output
           - Detail common pitfalls when vibe coding similar projects and how to avoid them
           - Recommend specific AI models and tools most appropriate for different aspects of this project
           - Outline comprehensive security measures that must be implemented to protect users and project owners
           - Include detailed code patterns and architectures that ensure proper security in a vibe-coded project
           - Provide specific prompt techniques for generating secure authentication, authorization, and data protection code
           - Recommend validation and testing approaches specifically designed for verifying security in vibe-coded applications
           - Include a vibe coding workflow with prompting sequences for the most critical technical components
           - Suggest specific libraries, frameworks, and tools that work well with AI-assisted development for this type of project
        
        8. Regulatory Considerations:
           - Identify specific data privacy regulations applicable to the project (GDPR, CCPA, HIPAA, etc.) with detailed compliance requirements
           - For each regulation, provide concrete implementation guidance with specific technical and operational measures
           - Outline IP protection strategies and potential patent/trademark opportunities with filing guidance
           - Detail industry-specific rules and compliance requirements with compliance checklist
           - Provide actionable recommendations for addressing regulatory challenges with step-by-step implementation plans
           - Include specific legal disclaimers, privacy policies, and terms of service sections needed
           - Recommend legal resources and tools appropriate for vibe coders to ensure compliance
        
        9. Partnership Opportunities:
           - Identify 7-9 specific potential partners with company names and reasons for strategic alignment
           - For each partner, explain the exact value exchange, integration points, and technical requirements
           - Include detailed guidance on how to approach each partner with specific contact methods and pitch points
           - Outline partnership KPIs and success metrics with measurement frameworks
           - Suggest specific API integrations or technical touchpoints for each partnership
           - Recommend partnership prioritization based on ease of implementation and potential impact
           - Include templates for outreach messages and partnership proposals customized for each potential partner
        
        10. Competitive Landscape:
           - Identify 7-9 direct and indirect competitors with detailed profiles and market positions
           - For each competitor, provide a complete SWOT analysis with specific features, strengths, and weaknesses
           - Include market positioning map showing where the project fits relative to competitors based on key attributes
           - Detail differentiation strategies with specific features, messaging, and positioning recommendations
           - Recommend competitive response strategies for different market scenarios and competitor moves
           - Identify specific competitive advantages that can be leveraged immediately by a solo vibe coder
           - Analyze pricing strategies of competitors and recommend optimal positioning
           - Include specific feature comparison tables and competitive analysis frameworks
        
        11. Implementation Roadmap:
           - Provide a detailed phased implementation plan with 90-day, 6-month, and 1-year horizons
           - For each phase, include 8-12 specific, actionable tasks that a solo vibe coder can accomplish
           - Include technical specifications, prompt recommendations, and implementation approaches for critical components
           - Outline critical path dependencies and decision points with contingency plans
           - Detail success metrics and measurement approaches for each phase with specific KPIs
           - Provide a realistic effort estimation for each task (in hours/days) based on vibe coding approach
           - Include recommendations for prioritizing features based on technical complexity and business impact
           - Suggest specific tools, frameworks, and AI assistance methods for each implementation phase
        
        12. Launch Strategy:
           - Identify 5-7 critical MVP features required for a successful initial launch
           - Provide a realistic timeline from development to launch with specific milestones
           - Outline a detailed market entry approach with specific tactics for gaining initial traction
           - List all critical resources (human, technical, financial) needed for a successful launch
           - Create a comprehensive pre-launch and launch-day checklist with specific action items
           - Include contingency plans for common launch obstacles and technical issues
           - Detail post-launch monitoring and rapid iteration strategies for the first 30/60/90 days
        
        13. Customer Acquisition Strategy:
           - Identify 5-7 primary customer acquisition channels with specific targeting parameters and tactics for each
           - Provide realistic customer acquisition cost estimates based on industry benchmarks
           - Detail a complete conversion funnel from awareness to activation with optimization strategies for each stage
           - Outline 3-5 specific customer retention tactics with implementation guidance
           - Identify untapped growth opportunities and expansion strategies based on initial market entry
           - Include performance metrics and tracking mechanisms for each acquisition channel
        
        14. Revenue Generation Models:
           - Present 4-6 viable business models tailored to this specific project with pros/cons analysis
           - Provide detailed pricing strategy recommendations with price points, tiers, and packaging options
           - Identify multiple revenue streams and prioritize them based on implementation complexity and potential returns
           - Include unit economics analysis with cost structures, margins, and break-even calculations
           - Detail scaling strategies to grow from initial revenue to sustainable profitability
        
        15. Bootstrapping Guide:
           - Provide 5-7 practical cost minimization tips specifically for solo developers
           - Detail DIY solutions and free/low-cost tools that can replace expensive services
           - Outline strategies for organic growth without external funding
           - Provide time management advice for solo developers juggling multiple project aspects
           - List 5-7 achievable milestones that can be completed on a minimal budget
        
        Format your response as a valid JSON object with the EXACT structure shown in the example below.
        Be extremely specific, practical and actionable with your analysis. Include concrete examples, numbers, 
        and detailed recommendations throughout. Avoid generic advice and tailor everything to this specific project.
        
        IMPORTANT: 
        - Base your analysis ONLY on the specific project details provided. 
        - Every evaluation must be unique to the project being evaluated. DO NOT return generic evaluations.
        - YOU MUST FOLLOW THE EXACT JSON STRUCTURE PROVIDED IN THIS EXAMPLE:
        
        {
          "marketFitAnalysis": {
            "strengths": ["Strength 1", "Strength 2", "Strength 3"],
            "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
            "demandPotential": "Description of market demand potential"
          },
          "targetAudience": {
            "demographic": "Description of target demographics",
            "psychographic": "Description of target psychographics"
          },
          "fitScore": 75,
          "fitScoreExplanation": "Explanation of the fit score",
          "businessPlan": {
            "revenueModel": "Description of revenue model",
            "goToMarket": "Description of go-to-market strategy",
            "milestones": ["Milestone 1", "Milestone 2", "Milestone 3", "Milestone 4"]
          },
          "valueProposition": "One sentence value proposition",
          "riskAssessment": {
            "risks": [
              {
                "type": "Risk Type 1",
                "description": "Description of risk 1",
                "mitigation": "Mitigation strategy for risk 1"
              },
              {
                "type": "Risk Type 2",
                "description": "Description of risk 2",
                "mitigation": "Mitigation strategy for risk 2"
              }
            ]
          },
          "technicalFeasibility": "Description of technical feasibility",
          "regulatoryConsiderations": "Description of regulatory considerations",
          "partnershipOpportunities": {
            "partners": ["Partner 1", "Partner 2", "Partner 3", "Partner 4"]
          },
          "competitiveLandscape": {
            "competitors": [
              {
                "name": "Competitor 1",
                "differentiation": "Differentiation from competitor 1"
              },
              {
                "name": "Competitor 2",
                "differentiation": "Differentiation from competitor 2"
              }
            ]
          },
          "implementationRoadmap": {
            "phases": [
              {
                "timeframe": "90-day horizon",
                "tasks": ["Task 1", "Task 2", "Task 3"],
                "metrics": ["Metric 1", "Metric 2"]
              },
              {
                "timeframe": "6-month horizon",
                "tasks": ["Task 1", "Task 2", "Task 3"],
                "metrics": ["Metric 1", "Metric 2"]
              },
              {
                "timeframe": "1-year horizon",
                "tasks": ["Task 1", "Task 2", "Task 3"],
                "metrics": ["Metric 1", "Metric 2"]
              }
            ]
          },
          "launchStrategy": {
            "mvpFeatures": ["Feature 1", "Feature 2", "Feature 3"],
            "timeToMarket": "Estimated time to market",
            "marketEntryApproach": "Description of market entry approach",
            "criticalResources": ["Resource 1", "Resource 2", "Resource 3"],
            "launchChecklist": ["Checklist item 1", "Checklist item 2", "Checklist item 3"]
          },
          "customerAcquisition": {
            "primaryChannels": ["Channel 1", "Channel 2", "Channel 3"],
            "acquisitionCost": "Estimated cost of customer acquisition",
            "conversionStrategy": "Description of conversion funnel strategy",
            "retentionTactics": ["Tactic 1", "Tactic 2", "Tactic 3"],
            "growthOpportunities": "Description of growth opportunities"
          },
          "revenueGeneration": {
            "businessModels": ["Model 1", "Model 2", "Model 3"],
            "pricingStrategy": "Description of pricing strategy",
            "revenueStreams": ["Stream 1", "Stream 2", "Stream 3"],
            "unitEconomics": "Description of unit economics",
            "scalingPotential": "Description of scaling potential"
          },
          "bootstrappingGuide": {
            "costMinimizationTips": ["Tip 1", "Tip 2", "Tip 3"],
            "diySolutions": "Description of DIY solutions and free/low-cost tools",
            "growthWithoutFunding": "Strategies for organic growth",
            "timeManagement": "Time management advice for solo developers",
            "milestonesOnBudget": ["Milestone 1", "Milestone 2", "Milestone 3"]
          }
        }`;
        
      // Make the API call
      console.log('Sending request to OpenAI API for vibe check...');
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: projectContext
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 10000,
      });

      console.log('OpenAI response received for vibe check evaluation');
      
      if (!response.choices || response.choices.length === 0) {
        console.error('No choices returned from OpenAI API');
        throw new Error('Invalid response from OpenAI API: No choices returned');
      }
      
      const content = response.choices[0].message.content;
      if (!content) {
        console.error('Empty content returned from OpenAI API');
        throw new Error('Invalid response from OpenAI API: Empty content');
      }
      
      // Parse and process the result
      let result;
      try {
        result = JSON.parse(content);
        console.log('Successfully parsed JSON response for vibe check');
      } catch (parseError) {
        console.error('Failed to parse JSON response from OpenAI for vibe check:', parseError);
        throw new Error('Invalid JSON response from OpenAI API');
      }
      
      // Validate the result has the expected structure
      console.log(`Available fields in vibe check response: ${Object.keys(result).join(', ')}`);
      
      const requiredFields = [
        'marketFitAnalysis', 'targetAudience', 'fitScore', 'fitScoreExplanation',
        'businessPlan', 'valueProposition', 'riskAssessment', 'technicalFeasibility',
        'regulatoryConsiderations', 'partnershipOpportunities', 'competitiveLandscape'
      ];
      
      const missingFields = requiredFields.filter(field => !result[field]);
      if (missingFields.length > 0) {
        console.error(`Missing required fields in vibe check response: ${missingFields.join(', ')}`);
        throw new Error(`Incomplete response from OpenAI API: Missing fields ${missingFields.join(', ')}`);
      }
      
      return result;
    } catch (error) {
      console.error('Error generating vibe check evaluation:', error);
      throw error;
    }
  }
  /**
   * Generate a complete evaluation for a project
   * @param project Project information
   * @returns Project evaluation object
   */
  async generateProjectEvaluation(project: {
    id: number;
    title: string;
    description: string;
    longDescription?: string;
    projectUrl: string;
    tags: string[];
    vibeCodingTool?: string;
  }): Promise<{
    marketFitAnalysis: { strengths: string[]; weaknesses: string[]; demandPotential: string };
    targetAudience: { demographic: string; psychographic: string };
    fitScore: number;
    fitScoreExplanation: string;
    businessPlan: { revenueModel: string; goToMarket: string; milestones: string[] };
    valueProposition: string;
    riskAssessment: { risks: Array<{ type: string; description: string; mitigation: string }> };
    technicalFeasibility: string;
    regulatoryConsiderations: string;
    partnershipOpportunities: { partners: string[] };
    competitiveLandscape: { competitors: Array<{ name: string; differentiation: string }> };
    implementationRoadmap?: { 
      phases: Array<{ 
        timeframe: string; 
        tasks: string[]; 
        metrics: string[] 
      }> 
    };
  }> {
    console.log(`Generating fresh evaluation for project ${project.id}: ${project.title}`);
    
    // Combine all project information for context
    const projectContext = `
      Project Title: ${project.title}
      Description: ${project.description}
      Detailed Description: ${project.longDescription || ''}
      Project URL: ${project.projectUrl}
      Tags: ${project.tags.join(', ')}
      AI Tool Used: ${project.vibeCodingTool || 'Not specified'}
    `;

    try {
      // For all projects, always use OpenAI to ensure fresh, unique evaluations
      console.log(`Using OpenAI API for project: ${project.title}`);
      
      // Check if API key is set
      if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY is not set. Check your environment variables.');
        throw new Error('OpenAI API key is missing');
      }
      
      // Log the project context (limited for privacy)
      console.log(`Project context length: ${projectContext.length} characters`);
      console.log(`Project context sample: ${projectContext.substring(0, 100)}...`);
      
      const systemPrompt = `You are an expert business and technology consultant who specializes in evaluating projects built by vibe coders (solo developers using AI-assisted coding). Your analysis is highly detailed, practical, and tailored for solo developers who need both business and technical guidance.
        
        Analyze the following project information and provide an extremely comprehensive evaluation with the following elements:
        
        1. Market-Fit Analysis:
           - Identify 5-7 specific strengths with concrete examples of how they create value in the market
           - For each strength, explain exactly how it addresses a real market need with specific use cases
           - Identify 5-7 specific weaknesses with detailed, actionable recommendations for improvement
           - For each weakness, provide a step-by-step approach to address it with realistic timelines
           - Provide detailed demand potential analysis with market size estimates, growth projections, and specific customer segments
           - Include 3-5 specific market trends that directly impact this project's potential success
           - Recommend 2-3 specific pivots or adjustments that could dramatically improve market fit
        
        2. Target Audience:
           - Create detailed demographic profiles including specific age ranges, income levels, education, occupation, geographic location, and technology usage patterns
           - Develop comprehensive psychographic profiles with values, interests, pain points, buying behaviors, and decision-making factors
           - Include 3 detailed user personas with names, backgrounds, goals, scenarios for using the product, and specific friction points they experience
           - For each persona, provide a "day in the life" scenario showing exactly how the product solves their problems
           - Identify 2-3 underserved segments within the target audience that represent growth opportunities
           - Recommend specific messaging approaches for each target segment
        
        3. Fit Score:
           - Assign a numerical rating (0-100) based on concrete criteria with individual scores for market fit, technical feasibility, and business viability
           - Provide a detailed explanation for the score broken down by 7-10 key success factors with individual ratings
           - Include specific, actionable recommendations to improve each factor by at least 10-15 points
           - Compare the fit score to similar successful projects in the same domain as benchmarks
           - Identify the 3 most impactful changes that would improve the overall score
        
        4. Business Plan:
           - Detail 4-6 revenue model options with specific pricing structures, pros/cons, and implementation requirements for each
           - For each revenue model, include specific examples of companies using similar models successfully
           - Create a detailed phased go-to-market strategy with specific channels, messaging approaches, and KPIs for each phase
           - Include exact metrics to track for evaluating go-to-market success
           - Outline 7-10 key milestones with specific timeframes, detailed implementation steps, and clear success criteria
           - Provide concrete monetization strategies with detailed pricing models, revenue projections, and break-even analysis
           - Include acquisition cost estimates and lifetime value projections for different customer segments
           - Add specific customer retention strategies with measurable targets
        
        5. Value Proposition:
           - Provide a concise, compelling one-sentence summary of project value that could be used in marketing
           - Break down the value proposition into 5-7 specific, quantifiable benefits for each user segment
           - Include before/after scenarios showing the transformation users experience with concrete metrics
           - Create a value matrix mapping specific features to customer benefits and pain points addressed
           - Suggest 3-5 ways to strengthen and communicate the value proposition more effectively
           - Include specific messaging examples for different channels (website, email, social media)
        
        6. Risk Assessment:
           - Identify 7-9 project risks across technical, market, financial, regulatory, and operational domains
           - Rate each risk by impact (High/Medium/Low) and probability (High/Medium/Low) with specific justifications
           - Provide extremely detailed mitigation strategies with specific actions, timelines, and success indicators
           - Include contingency plans for high-impact risks with exact trigger points and response protocols
           - Create a risk monitoring framework with specific metrics to track for early warning signs
           - Prioritize risks based on a calculated risk score (impact × probability)
           - Identify specific resources, tools, and methods to address each risk effectively
        
        7. Technical Feasibility:
           - Provide an in-depth analysis of implementing this project through vibe coding (AI-assisted development)
           - Identify 7-10 critical technical components that must be properly prompted for when vibe coding this project
           - For each component, include specific prompt examples and approaches to get high-quality AI output
           - Detail common pitfalls when vibe coding similar projects and how to avoid them
           - Recommend specific AI models and tools most appropriate for different aspects of this project
           - Outline comprehensive security measures that must be implemented to protect users and project owners
           - Include detailed code patterns and architectures that ensure proper security in a vibe-coded project
           - Provide specific prompt techniques for generating secure authentication, authorization, and data protection code
           - Recommend validation and testing approaches specifically designed for verifying security in vibe-coded applications
           - Include a vibe coding workflow with prompting sequences for the most critical technical components
           - Suggest specific libraries, frameworks, and tools that work well with AI-assisted development for this type of project
        
        8. Regulatory Considerations:
           - Identify specific data privacy regulations applicable to the project (GDPR, CCPA, HIPAA, etc.) with detailed compliance requirements
           - For each regulation, provide concrete implementation guidance with specific technical and operational measures
           - Outline IP protection strategies and potential patent/trademark opportunities with filing guidance
           - Detail industry-specific rules and compliance requirements with compliance checklist
           - Provide actionable recommendations for addressing regulatory challenges with step-by-step implementation plans
           - Include specific legal disclaimers, privacy policies, and terms of service sections needed
           - Recommend legal resources and tools appropriate for vibe coders to ensure compliance
        
        9. Partnership Opportunities:
           - Identify 7-9 specific potential partners with company names and reasons for strategic alignment
           - For each partner, explain the exact value exchange, integration points, and technical requirements
           - Include detailed guidance on how to approach each partner with specific contact methods and pitch points
           - Outline partnership KPIs and success metrics with measurement frameworks
           - Suggest specific API integrations or technical touchpoints for each partnership
           - Recommend partnership prioritization based on ease of implementation and potential impact
           - Include templates for outreach messages and partnership proposals customized for each potential partner
        
        10. Competitive Landscape:
           - Identify 7-9 direct and indirect competitors with detailed profiles and market positions
           - For each competitor, provide a complete SWOT analysis with specific features, strengths, and weaknesses
           - Include market positioning map showing where the project fits relative to competitors based on key attributes
           - Detail differentiation strategies with specific features, messaging, and positioning recommendations
           - Recommend competitive response strategies for different market scenarios and competitor moves
           - Identify specific competitive advantages that can be leveraged immediately by a solo vibe coder
           - Analyze pricing strategies of competitors and recommend optimal positioning
           - Include specific feature comparison tables and competitive analysis frameworks
        
        11. Implementation Roadmap:
           - Provide a detailed phased implementation plan with 90-day, 6-month, and 1-year horizons
           - For each phase, include 8-12 specific, actionable tasks that a solo vibe coder can accomplish
           - Include technical specifications, prompt recommendations, and implementation approaches for critical components
           - Outline critical path dependencies and decision points with contingency plans
           - Detail success metrics and measurement approaches for each phase with specific KPIs
           - Provide a realistic effort estimation for each task (in hours/days) based on vibe coding approach
           - Include recommendations for prioritizing features based on technical complexity and business impact
           - Suggest specific tools, frameworks, and AI assistance methods for each implementation phase
        
        Format your response as a valid JSON object with the EXACT structure shown in the example below.
        Be extremely specific, practical and actionable with your analysis. Include concrete examples, numbers, 
        and detailed recommendations throughout. Avoid generic advice and tailor everything to this specific project.
        
        IMPORTANT: 
        - Base your analysis ONLY on the specific project details provided. 
        - Every evaluation must be unique to the project being evaluated. DO NOT return generic evaluations.
        - YOU MUST FOLLOW THE EXACT JSON STRUCTURE PROVIDED IN THIS EXAMPLE:
        
        {
          "marketFitAnalysis": {
            "strengths": ["Strength 1", "Strength 2", "Strength 3"],
            "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
            "demandPotential": "Description of market demand potential"
          },
          "targetAudience": {
            "demographic": "Description of target demographics",
            "psychographic": "Description of target psychographics"
          },
          "fitScore": 75,
          "fitScoreExplanation": "Explanation of the fit score",
          "businessPlan": {
            "revenueModel": "Description of revenue model",
            "goToMarket": "Description of go-to-market strategy",
            "milestones": ["Milestone 1", "Milestone 2", "Milestone 3", "Milestone 4"]
          },
          "valueProposition": "One sentence value proposition",
          "riskAssessment": {
            "risks": [
              {
                "type": "Risk Type 1",
                "description": "Description of risk 1",
                "mitigation": "Mitigation strategy for risk 1"
              },
              {
                "type": "Risk Type 2",
                "description": "Description of risk 2",
                "mitigation": "Mitigation strategy for risk 2"
              }
            ]
          },
          "technicalFeasibility": "Description of technical feasibility",
          "regulatoryConsiderations": "Description of regulatory considerations",
          "partnershipOpportunities": {
            "partners": ["Partner 1", "Partner 2", "Partner 3", "Partner 4"]
          },
          "competitiveLandscape": {
            "competitors": [
              {
                "name": "Competitor 1",
                "differentiation": "Differentiation from competitor 1"
              },
              {
                "name": "Competitor 2",
                "differentiation": "Differentiation from competitor 2"
              }
            ]
          },
          "implementationRoadmap": {
            "phases": [
              {
                "timeframe": "90-day horizon",
                "tasks": ["Task 1", "Task 2", "Task 3"],
                "metrics": ["Metric 1", "Metric 2"]
              },
              {
                "timeframe": "6-month horizon",
                "tasks": ["Task 1", "Task 2", "Task 3"],
                "metrics": ["Metric 1", "Metric 2"]
              },
              {
                "timeframe": "1-year horizon",
                "tasks": ["Task 1", "Task 2", "Task 3"],
                "metrics": ["Metric 1", "Metric 2"]
              }
            ]
          }
        }`;
        
      // Make the API call
      console.log('Sending request to OpenAI API...');
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: projectContext
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 10000,
      });

      console.log('OpenAI response received for project evaluation');
      
      if (!response.choices || response.choices.length === 0) {
        console.error('No choices returned from OpenAI API');
        throw new Error('Invalid response from OpenAI API: No choices returned');
      }
      
      const content = response.choices[0].message.content;
      if (!content) {
        console.error('Empty content returned from OpenAI API');
        throw new Error('Invalid response from OpenAI API: Empty content');
      }
      
      // Parse and process the result
      let result;
      try {
        result = JSON.parse(content);
        console.log('Successfully parsed JSON response');
      } catch (parseError) {
        console.error('Failed to parse JSON response from OpenAI:', parseError);
        throw new Error('Invalid JSON response from OpenAI API');
      }
      
      // Validate the result has the expected structure
      console.log(`Available fields in response: ${Object.keys(result).join(', ')}`);
      
      const requiredFields = [
        'marketFitAnalysis', 'targetAudience', 'fitScore', 'fitScoreExplanation',
        'businessPlan', 'valueProposition', 'riskAssessment', 'technicalFeasibility',
        'regulatoryConsiderations', 'partnershipOpportunities', 'competitiveLandscape'
      ];
      
      const missingFields = requiredFields.filter(field => !result[field]);
      if (missingFields.length > 0) {
        console.error(`Missing ${missingFields.length} fields in OpenAI response: ${missingFields.join(', ')}`);
        console.error(`Available fields: ${Object.keys(result).join(', ')}`);
        console.error(`Response content preview: ${content.substring(0, 500)}...`);
        throw new Error(`Invalid structure in OpenAI API response: Missing fields (${missingFields.join(', ')})`);
      }
      
      console.log('Creating evaluation object from parsed response');
      const evaluation = {
        marketFitAnalysis: {
          strengths: Array.isArray(result.marketFitAnalysis?.strengths) ? result.marketFitAnalysis.strengths : [],
          weaknesses: Array.isArray(result.marketFitAnalysis?.weaknesses) ? result.marketFitAnalysis.weaknesses : [],
          demandPotential: result.marketFitAnalysis?.demandPotential || ''
        },
        targetAudience: {
          demographic: result.targetAudience?.demographic || '',
          psychographic: result.targetAudience?.psychographic || ''
        },
        fitScore: typeof result.fitScore === 'number' ? Math.max(0, Math.min(100, result.fitScore)) : 50,
        fitScoreExplanation: result.fitScoreExplanation || '',
        businessPlan: {
          revenueModel: result.businessPlan?.revenueModel || '',
          goToMarket: result.businessPlan?.goToMarket || '',
          milestones: Array.isArray(result.businessPlan?.milestones) ? result.businessPlan.milestones : []
        },
        valueProposition: result.valueProposition || '',
        riskAssessment: {
          risks: Array.isArray(result.riskAssessment?.risks) ? result.riskAssessment.risks : []
        },
        technicalFeasibility: result.technicalFeasibility || '',
        regulatoryConsiderations: result.regulatoryConsiderations || '',
        partnershipOpportunities: {
          partners: Array.isArray(result.partnershipOpportunities?.partners) ? result.partnershipOpportunities.partners : []
        },
        competitiveLandscape: {
          competitors: Array.isArray(result.competitiveLandscape?.competitors) ? result.competitiveLandscape.competitors : []
        },
        implementationRoadmap: result.implementationRoadmap && {
          phases: Array.isArray(result.implementationRoadmap?.phases) 
            ? result.implementationRoadmap.phases.map((phase: { 
                timeframe?: string; 
                tasks?: string[]; 
                metrics?: string[] 
              }) => ({
                timeframe: phase.timeframe || '',
                tasks: Array.isArray(phase.tasks) ? phase.tasks : [],
                metrics: Array.isArray(phase.metrics) ? phase.metrics : []
              }))
            : []
        }
      };
      
      return evaluation;
    } catch (error) {
      console.error('Error generating project evaluation:', error);
      
      // Fallback to a generic evaluation with explicit note about the error
      return {
        marketFitAnalysis: {
          strengths: [
            "ERROR: Could not generate project-specific evaluation",
            "Please try again later",
            "OpenAI API call failed"
          ],
          weaknesses: [
            "Error occurred during evaluation generation",
            "See server logs for details"
          ],
          demandPotential: "Could not evaluate due to API error."
        },
        targetAudience: {
          demographic: "Error generating demographic profile.",
          psychographic: "Error generating psychographic profile."
        },
        fitScore: 0,
        fitScoreExplanation: "Could not calculate score due to error in API communication.",
        businessPlan: {
          revenueModel: "Error generating revenue model.",
          goToMarket: "Error generating go-to-market strategy.",
          milestones: [
            "Error generating milestones"
          ]
        },
        valueProposition: "Error: Could not generate value proposition due to API failure.",
        riskAssessment: {
          risks: [
            {
              type: "API Error",
              description: "The OpenAI API call failed to generate an evaluation.",
              mitigation: "Try again later or contact system administrator."
            }
          ]
        },
        technicalFeasibility: "Error generating technical feasibility assessment.",
        regulatoryConsiderations: "Error generating regulatory considerations.",
        partnershipOpportunities: {
          partners: [
            "Error generating partnership opportunities"
          ]
        },
        competitiveLandscape: {
          competitors: [
            {
              name: "Error",
              differentiation: "Could not generate competitive landscape due to API error."
            }
          ]
        },
        implementationRoadmap: {
          phases: [
            {
              timeframe: "Error",
              tasks: ["Error generating implementation roadmap"],
              metrics: ["Error generating success metrics"]
            }
          ]
        }
      };
    }
  }

  /**
   * Generate a summary for a project description
   * @param text Project description to summarize
   * @param maxLength Maximum length of summary (optional)
   * @returns Summarized text
   */
  async summarizeProjectDescription(text: string, maxLength: number = 150): Promise<string> {
    if (!text || text.trim().length === 0) {
      return '';
    }

    // If text is already shorter than max length, return it as is
    if (text.length <= maxLength) {
      return text;
    }

    try {
      console.log(`Generating summary for project description (length: ${text.length})`);
      
      // Check if API key is set
      if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY is not set. Check your environment variables.');
        throw new Error('OpenAI API key is missing');
      }
      
      console.log('Sending request to OpenAI API for summary...');
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that summarizes project descriptions. 
                     Create a concise summary of no more than ${maxLength} characters 
                     that captures the essence of the project.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });
      
      console.log('OpenAI response received for project summary');
      
      if (!response.choices || response.choices.length === 0) {
        console.error('No choices returned from OpenAI API for summary');
        throw new Error('Invalid response from OpenAI API: No choices returned');
      }
      
      const content = response.choices[0].message.content;
      if (!content) {
        console.error('Empty content returned from OpenAI API for summary');
        throw new Error('Invalid response from OpenAI API: Empty content');
      }

      let summary = content.trim();
      console.log(`Generated summary length: ${summary.length}`);
      
      // Ensure we respect the max length
      if (summary.length > maxLength) {
        const trimmedSummary = summary.substring(0, maxLength - 3) + '...';
        console.log(`Trimmed summary from ${summary.length} to ${trimmedSummary.length} characters`);
        summary = trimmedSummary;
      }

      return summary;
    } catch (error) {
      console.error('Error generating project summary:', error);
      // Fallback to a simple truncation if AI fails
      const fallbackSummary = text.substring(0, maxLength - 3) + '...';
      console.log(`Using fallback summary due to error: ${fallbackSummary.substring(0, 50)}...`);
      return fallbackSummary;
    }
  }

  /**
   * Analyze sentiment of content
   * @param text Content to analyze
   * @returns Sentiment analysis result
   */
  async analyzeSentiment(text: string): Promise<{ rating: number, confidence: number }> {
    if (!text || text.trim().length === 0) {
      return { rating: 3, confidence: 0 };
    }

    try {
      console.log(`Analyzing sentiment for text (length: ${text.length})`);
      
      // Check if API key is set
      if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY is not set. Check your environment variables.');
        throw new Error('OpenAI API key is missing');
      }
      
      console.log('Sending request to OpenAI API for sentiment analysis...');
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analysis expert. Analyze the sentiment of the text and provide a rating from 1 to 5 stars and a confidence score between 0 and 1. Respond with JSON in this format: { "rating": number, "confidence": number }'
          },
          {
            role: 'user',
            content: text
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });
      
      console.log('OpenAI response received for sentiment analysis');
      
      if (!response.choices || response.choices.length === 0) {
        console.error('No choices returned from OpenAI API for sentiment analysis');
        throw new Error('Invalid response from OpenAI API: No choices returned');
      }
      
      const content = response.choices[0].message.content;
      if (!content) {
        console.error('Empty content returned from OpenAI API for sentiment analysis');
        throw new Error('Invalid response from OpenAI API: Empty content');
      }
      
      // Parse the result
      let result;
      try {
        result = JSON.parse(content);
        console.log('Successfully parsed JSON sentiment response');
      } catch (parseError) {
        console.error('Failed to parse JSON response from OpenAI:', parseError);
        throw new Error('Invalid JSON response from OpenAI API');
      }
      
      const sentiment = {
        rating: Math.max(1, Math.min(5, Math.round(result.rating || 3))),
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5))
      };
      
      console.log(`Sentiment analysis result: rating=${sentiment.rating}, confidence=${sentiment.confidence}`);
      return sentiment;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      // Fallback to neutral sentiment if AI fails
      return { rating: 3, confidence: 0.5 };
    }
  }

  /**
   * Generate tag suggestions for a project based on its description
   * @param description Project description
   * @param existingTags Optional array of existing popular tags to consider
   * @returns Array of suggested tags
   */
  async suggestTags(description: string, existingTags: string[] = []): Promise<string[]> {
    if (!description || description.trim().length === 0) {
      return [];
    }

    try {
      console.log(`Generating tag suggestions for text (length: ${description.length})`);
      console.log(`Using ${existingTags.length} existing tags for reference`);
      
      // Check if API key is set
      if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY is not set. Check your environment variables.');
        throw new Error('OpenAI API key is missing');
      }
      
      // Construct the prompt with existing tags if available
      let systemPrompt = 'You are a tag suggestion system. Based on the project description, suggest 3-5 relevant tags.';
      if (existingTags.length > 0) {
        systemPrompt += ` Consider these popular existing tags: ${existingTags.join(', ')}. Only suggest from these unless you have a compelling new tag to add. Respond with JSON in this format: { "tags": ["tag1", "tag2", ...] }`;
      } else {
        systemPrompt += ' Respond with JSON in this format: { "tags": ["tag1", "tag2", ...] }';
      }
      
      console.log('Sending request to OpenAI API for tag suggestions...');
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: description
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });
      
      console.log('OpenAI response received for tag suggestions');
      
      if (!response.choices || response.choices.length === 0) {
        console.error('No choices returned from OpenAI API for tag suggestions');
        throw new Error('Invalid response from OpenAI API: No choices returned');
      }
      
      const content = response.choices[0].message.content;
      if (!content) {
        console.error('Empty content returned from OpenAI API for tag suggestions');
        throw new Error('Invalid response from OpenAI API: Empty content');
      }
      
      // Parse the result
      let result;
      try {
        result = JSON.parse(content);
        console.log('Successfully parsed JSON tag suggestions response');
      } catch (parseError) {
        console.error('Failed to parse JSON response from OpenAI:', parseError);
        throw new Error('Invalid JSON response from OpenAI API');
      }
      
      // Validate and process tags
      if (!Array.isArray(result.tags)) {
        console.error('Missing or invalid "tags" field in response');
        throw new Error('Invalid structure in OpenAI API response');
      }
      
      const tags = result.tags.slice(0, 5);
      console.log(`Generated ${tags.length} tag suggestions: ${tags.join(', ')}`);
      return tags;
    } catch (error) {
      console.error('Error generating tag suggestions:', error);
      // Return empty array if AI fails
      return [];
    }
  }
}

export const aiService = new AIService();