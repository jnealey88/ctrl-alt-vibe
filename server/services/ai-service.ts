import OpenAI from 'openai';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = 'gpt-4o';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class AIService {
  /**
   * Generate a vibe check evaluation for a project idea using separate API calls for each section
   * @param projectInfo Information about the project idea
   * @returns Vibe Check evaluation object with the same structure as project evaluation
   */
  async generateVibeCheckEvaluation(projectInfo: {
    websiteUrl?: string;
    projectDescription: string;
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
    competitiveLandscape: {
      competitors: Array<{
        name: string;
        differentiation: string;
        strengths?: string[];
        weaknesses?: string[];
        marketPosition?: string;
        pricingStrategy?: string;
      }>;
      marketPositioning?: string;
      differentiationStrategy?: string;
      competitiveAdvantages?: string[];
    };
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
    console.log(`Generating vibe check evaluation with separate API calls for each section`);
    
    // Check if API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set. Check your environment variables.');
      throw new Error('OpenAI API key is missing');
    }
    
    // Combine all project information for context
    const projectContext = `
      Project Description: ${projectInfo.projectDescription}
      ${projectInfo.websiteUrl ? `Project Website URL: ${projectInfo.websiteUrl}` : ''}
    `;
    
    // Log the project context (limited for privacy)
    console.log(`Project context length: ${projectContext.length} characters`);
    console.log(`Project context sample: ${projectContext.substring(0, 100)}...`);
    
    try {
      // Make separate API calls for each component
      console.log('Starting separate API calls for each vibe check section...');
      
      // Define the sections to be generated separately
      const sections = [
        {
          name: 'initialAssessment',
          prompt: this.createVibeCheckPrompt('initialAssessment', projectContext),
          fields: ['fitScore', 'fitScoreExplanation', 'valueProposition']
        },
        {
          name: 'marketFit',
          prompt: this.createVibeCheckPrompt('marketFit', projectContext),
          fields: ['marketFitAnalysis']
        },
        {
          name: 'targetAudience',
          prompt: this.createVibeCheckPrompt('targetAudience', projectContext),
          fields: ['targetAudience']
        },
        {
          name: 'competitiveLandscape',
          prompt: this.createVibeCheckPrompt('competitiveLandscape', projectContext),
          fields: ['competitiveLandscape']
        },
        {
          name: 'businessPlan',
          prompt: this.createVibeCheckPrompt('businessPlan', projectContext),
          fields: ['businessPlan']
        },
        {
          name: 'riskAssessment',
          prompt: this.createVibeCheckPrompt('riskAssessment', projectContext),
          fields: ['riskAssessment']
        },
        {
          name: 'launchStrategy',
          prompt: this.createVibeCheckPrompt('launchStrategy', projectContext),
          fields: ['launchStrategy']
        },
        {
          name: 'customerAcquisition',
          prompt: this.createVibeCheckPrompt('customerAcquisition', projectContext),
          fields: ['customerAcquisition']
        },
        {
          name: 'bootstrapping',
          prompt: this.createVibeCheckPrompt('bootstrapping', projectContext),
          fields: ['bootstrappingGuide']
        },
        {
          name: 'technicalAndRegulatory',
          prompt: this.createVibeCheckPrompt('technicalAndRegulatory', projectContext),
          fields: ['technicalFeasibility', 'regulatoryConsiderations', 'partnershipOpportunities', 'implementationRoadmap']
        }
      ];
      
      // Execute API calls in parallel with a concurrency limit of 3
      const results = await this.executeWithConcurrencyLimit(
        sections.map(section => async () => {
          console.log(`Generating ${section.name} section...`);
          const response = await this.makeOpenAIRequest(section.prompt);
          console.log(`Completed ${section.name} section`);
          return { section, response };
        }),
        3 // Concurrency limit
      );
      
      // Merge all sections into a single result
      const mergedResult: any = {};
      
      for (const { section, response } of results) {
        try {
          // Parse the section result
          const sectionContent = response.choices[0].message.content;
          const sectionResult = JSON.parse(sectionContent);
          
          // Add all fields from this section to the merged result
          section.fields.forEach(field => {
            if (sectionResult[field]) {
              mergedResult[field] = sectionResult[field];
            }
          });
        } catch (error) {
          console.error(`Error processing ${section.name} section:`, error);
        }
      }
      
      // Validate the merged result has the expected structure
      console.log(`Available fields in vibe check response: ${Object.keys(mergedResult).join(', ')}`);
      
      const requiredFields = [
        'marketFitAnalysis', 'targetAudience', 'fitScore', 'fitScoreExplanation',
        'businessPlan', 'valueProposition', 'riskAssessment', 'technicalFeasibility',
        'regulatoryConsiderations', 'partnershipOpportunities', 'competitiveLandscape',
        'launchStrategy', 'customerAcquisition', 'bootstrappingGuide'
      ];
      
      const missingFields = requiredFields.filter(field => !mergedResult[field]);
      if (missingFields.length > 0) {
        console.error(`Missing required fields in merged vibe check response: ${missingFields.join(', ')}`);
        throw new Error(`Incomplete merged response: Missing fields ${missingFields.join(', ')}`);
      }
      
      // Add revenue generation if missing (might be part of business plan section)
      if (!mergedResult.revenueGeneration && mergedResult.businessPlan) {
        mergedResult.revenueGeneration = {
          businessModels: mergedResult.businessPlan.revenueModels || ["Subscription model", "Freemium model", "Transaction fees"],
          pricingStrategy: mergedResult.businessPlan.pricingStrategy || "Tiered pricing structure based on features and usage",
          revenueStreams: mergedResult.businessPlan.revenueStreams || ["Direct sales", "Premium subscriptions", "API access fees"],
          unitEconomics: "Detailed unit economics will depend on final implementation costs and market pricing",
          scalingPotential: "Good scaling potential with low marginal costs for additional users"
        };
      }
      
      return mergedResult;
    } catch (error) {
      console.error('Error generating vibe check evaluation:', error);
      throw error;
    }
  }
  
  /**
   * Create a specific prompt for a vibe check section
   */
  private createVibeCheckPrompt(section: string, projectContext: string): string {
    const baseInstructions = `You are an expert business and technology consultant who specializes in evaluating project ideas for "vibe coding" (using AI-assisted coding). Your analysis is highly detailed, practical, and tailored for solo developers who need both business and technical guidance.
    
    Analyze the following project idea and provide a detailed, focused evaluation of the requested section. Format your response as a valid JSON object with the EXACT structure shown in the example.`;
    
    let sectionPrompt = '';
    let exampleStructure = '';
    
    switch (section) {
      case 'initialAssessment':
        sectionPrompt = `
        Provide an initial assessment of this project idea with:
        
        1. Fit Score:
           - Assign a numerical rating (0-100) based on concrete criteria with individual scores for market fit, technical feasibility, and business viability
           - The score should reflect how viable this idea is for a solo developer using AI-assisted development
        
        2. Fit Score Explanation:
           - Provide a detailed explanation for the score broken down by key success factors
           - Include specific, actionable recommendations to improve the score
           - Identify the 3 most impactful changes that would improve the overall score
        
        3. Value Proposition:
           - Provide a concise, compelling one-sentence summary of project value that could be used in marketing
           - The value proposition should clearly communicate the unique selling point and target market
        `;
        
        exampleStructure = `
        {
          "fitScore": 85,
          "fitScoreExplanation": "Detailed explanation of fit score with specific factors and recommendations for improvement",
          "valueProposition": "A compelling one-sentence value proposition that clearly articulates the unique value and target market"
        }`;
        break;
        
      case 'marketFit':
        sectionPrompt = `
        Analyze the market fit of this project idea with:
        
        1. Market-Fit Analysis:
           - Identify 5-7 specific strengths with concrete examples of how they create value in the market
           - For each strength, explain exactly how it addresses a real market need with specific use cases
           - Identify 5-7 specific weaknesses with detailed, actionable recommendations for improvement
           - For each weakness, provide a step-by-step approach to address it with realistic timelines
           - Provide detailed demand potential analysis with market size estimates, growth projections, and specific customer segments
        `;
        
        exampleStructure = `
        {
          "marketFitAnalysis": {
            "strengths": [
              "Detailed strength 1 with specific market value and use case",
              "Detailed strength 2 with specific market value and use case",
              "Detailed strength 3 with specific market value and use case",
              "Detailed strength 4 with specific market value and use case",
              "Detailed strength 5 with specific market value and use case"
            ],
            "weaknesses": [
              "Detailed weakness 1 with actionable recommendation",
              "Detailed weakness 2 with actionable recommendation",
              "Detailed weakness 3 with actionable recommendation",
              "Detailed weakness 4 with actionable recommendation",
              "Detailed weakness 5 with actionable recommendation"
            ],
            "demandPotential": "Detailed analysis of market demand with size estimates, growth projections, and customer segments"
          }
        }`;
        break;
        
      case 'targetAudience':
        sectionPrompt = `
        Provide a detailed analysis of the target audience for this project with:
        
        1. Target Audience:
           - Create detailed demographic profiles including specific age ranges, income levels, education, occupation, geographic location, and technology usage patterns
           - Develop comprehensive psychographic profiles with values, interests, pain points, buying behaviors, and decision-making factors
        `;
        
        exampleStructure = `
        {
          "targetAudience": {
            "demographic": "Detailed demographic profile including age ranges, income levels, education, occupation, location, and technology usage",
            "psychographic": "Detailed psychographic profile with values, interests, pain points, buying behaviors, and decision factors"
          }
        }`;
        break;
        
      case 'competitiveLandscape':
        sectionPrompt = `
        Provide a comprehensive analysis of the competitive landscape for this project with:
        
        1. Competitive Landscape:
           - Identify 5-7 direct and indirect competitors with detailed profiles and market positions
           - For each competitor, provide a complete SWOT analysis with specific features, strengths, and weaknesses
           - Include market positioning description showing where the project fits relative to competitors
           - Detail differentiation strategies with specific features, messaging, and positioning recommendations
           - Identify specific competitive advantages that can be leveraged immediately by a solo developer
        `;
        
        exampleStructure = `
        {
          "competitiveLandscape": {
            "competitors": [
              {
                "name": "Competitor 1 Name",
                "differentiation": "Detailed explanation of how this project differs from competitor 1",
                "strengths": ["Specific strength 1", "Specific strength 2", "Specific strength 3"],
                "weaknesses": ["Specific weakness 1", "Specific weakness 2", "Specific weakness 3"]
              },
              {
                "name": "Competitor 2 Name",
                "differentiation": "Detailed explanation of how this project differs from competitor 2",
                "strengths": ["Specific strength 1", "Specific strength 2", "Specific strength 3"],
                "weaknesses": ["Specific weakness 1", "Specific weakness 2", "Specific weakness 3"]
              },
              {
                "name": "Competitor 3 Name",
                "differentiation": "Detailed explanation of how this project differs from competitor 3",
                "strengths": ["Specific strength 1", "Specific strength 2", "Specific strength 3"],
                "weaknesses": ["Specific weakness 1", "Specific weakness 2", "Specific weakness 3"]
              }
            ],
            "marketPositioning": "Detailed description of the project's position in the market relative to competitors",
            "differentiationStrategy": "Specific strategy for differentiating from competitors with features and messaging",
            "competitiveAdvantages": ["Specific advantage 1", "Specific advantage 2", "Specific advantage 3"]
          }
        }`;
        break;
        
      case 'businessPlan':
        sectionPrompt = `
        Provide a detailed business plan for this project with:
        
        1. Business Plan:
           - Detail a viable revenue model with specific pricing structures and implementation requirements
           - Create a detailed phased go-to-market strategy with specific channels and messaging approaches
           - Outline 5-7 key milestones with specific timeframes and implementation steps
        `;
        
        exampleStructure = `
        {
          "businessPlan": {
            "revenueModel": "Detailed revenue model description with specific pricing structures and implementation requirements",
            "goToMarket": "Detailed go-to-market strategy with specific channels, messaging approaches, and KPIs",
            "milestones": [
              "Specific milestone 1 with timeframe and implementation steps",
              "Specific milestone 2 with timeframe and implementation steps",
              "Specific milestone 3 with timeframe and implementation steps",
              "Specific milestone 4 with timeframe and implementation steps",
              "Specific milestone 5 with timeframe and implementation steps"
            ]
          }
        }`;
        break;
        
      case 'riskAssessment':
        sectionPrompt = `
        Provide a comprehensive risk assessment for this project with:
        
        1. Risk Assessment:
           - Identify 5-7 project risks across technical, market, financial, regulatory, and operational domains
           - For each risk, provide the type, a detailed description, and a specific mitigation strategy
           - Prioritize risks based on impact and probability
        `;
        
        exampleStructure = `
        {
          "riskAssessment": {
            "risks": [
              {
                "type": "Technical Risk",
                "description": "Detailed description of the technical risk and its potential impact",
                "mitigation": "Detailed mitigation strategy with specific actions and timelines"
              },
              {
                "type": "Market Risk",
                "description": "Detailed description of the market risk and its potential impact",
                "mitigation": "Detailed mitigation strategy with specific actions and timelines"
              },
              {
                "type": "Financial Risk",
                "description": "Detailed description of the financial risk and its potential impact",
                "mitigation": "Detailed mitigation strategy with specific actions and timelines"
              },
              {
                "type": "Regulatory Risk",
                "description": "Detailed description of the regulatory risk and its potential impact",
                "mitigation": "Detailed mitigation strategy with specific actions and timelines"
              },
              {
                "type": "Operational Risk",
                "description": "Detailed description of the operational risk and its potential impact",
                "mitigation": "Detailed mitigation strategy with specific actions and timelines"
              }
            ]
          }
        }`;
        break;
        
      case 'launchStrategy':
        sectionPrompt = `
        Provide a detailed launch strategy for this project with:
        
        1. Launch Strategy:
           - Identify 5-7 critical MVP features required for a successful initial launch
           - Provide a realistic timeline from development to launch with specific milestones
           - Outline a detailed market entry approach with specific tactics for gaining initial traction
           - List critical resources (human, technical, financial) needed for a successful launch
           - Create a comprehensive pre-launch checklist with specific action items
        `;
        
        exampleStructure = `
        {
          "launchStrategy": {
            "mvpFeatures": [
              "Critical MVP feature 1 with rationale",
              "Critical MVP feature 2 with rationale",
              "Critical MVP feature 3 with rationale",
              "Critical MVP feature 4 with rationale",
              "Critical MVP feature 5 with rationale"
            ],
            "timeToMarket": "Realistic timeline from development to launch with specific milestones",
            "marketEntryApproach": "Detailed market entry strategy with specific tactics for gaining initial traction",
            "criticalResources": [
              "Specific human resource requirement",
              "Specific technical resource requirement",
              "Specific financial resource requirement",
              "Specific marketing resource requirement"
            ],
            "launchChecklist": [
              "Specific pre-launch action item 1",
              "Specific pre-launch action item 2",
              "Specific pre-launch action item 3",
              "Specific pre-launch action item 4",
              "Specific pre-launch action item 5"
            ]
          }
        }`;
        break;
        
      case 'customerAcquisition':
        sectionPrompt = `
        Provide a detailed customer acquisition strategy for this project with:
        
        1. Customer Acquisition:
           - Identify 5-7 primary customer acquisition channels with specific targeting parameters and tactics for each
           - Provide realistic customer acquisition cost estimates based on industry benchmarks
           - Detail a complete conversion funnel strategy from awareness to activation
           - Outline 3-5 specific customer retention tactics with implementation guidance
        `;
        
        exampleStructure = `
        {
          "customerAcquisition": {
            "primaryChannels": [
              "Specific acquisition channel 1 with targeting parameters",
              "Specific acquisition channel 2 with targeting parameters",
              "Specific acquisition channel 3 with targeting parameters",
              "Specific acquisition channel 4 with targeting parameters",
              "Specific acquisition channel 5 with targeting parameters"
            ],
            "acquisitionCost": "Realistic customer acquisition cost estimate based on industry benchmarks",
            "conversionStrategy": "Detailed conversion funnel strategy from awareness to activation",
            "retentionTactics": [
              "Specific retention tactic 1 with implementation guidance",
              "Specific retention tactic 2 with implementation guidance",
              "Specific retention tactic 3 with implementation guidance",
              "Specific retention tactic 4 with implementation guidance"
            ],
            "growthOpportunities": "Identification of untapped growth opportunities and expansion strategies"
          }
        }`;
        break;
        
      case 'bootstrapping':
        sectionPrompt = `
        Provide a practical bootstrapping guide for this project with:
        
        1. Bootstrapping Guide:
           - Provide 5-7 practical cost minimization tips specifically for solo developers
           - Detail DIY solutions and free/low-cost tools that can replace expensive services
           - Outline strategies for organic growth without external funding
           - Provide time management advice for solo developers juggling multiple project aspects
           - List 5-7 achievable milestones that can be completed on a minimal budget
        `;
        
        exampleStructure = `
        {
          "bootstrappingGuide": {
            "costMinimizationTips": [
              "Specific cost minimization tip 1 for solo developers",
              "Specific cost minimization tip 2 for solo developers",
              "Specific cost minimization tip 3 for solo developers",
              "Specific cost minimization tip 4 for solo developers",
              "Specific cost minimization tip 5 for solo developers"
            ],
            "diySolutions": "Detailed DIY solutions and free/low-cost tools that can replace expensive services",
            "growthWithoutFunding": "Specific strategies for organic growth without external funding",
            "timeManagement": "Practical time management advice for solo developers juggling multiple project aspects",
            "milestonesOnBudget": [
              "Achievable milestone 1 that can be completed on a minimal budget",
              "Achievable milestone 2 that can be completed on a minimal budget",
              "Achievable milestone 3 that can be completed on a minimal budget",
              "Achievable milestone 4 that can be completed on a minimal budget",
              "Achievable milestone 5 that can be completed on a minimal budget"
            ]
          }
        }`;
        break;
        
      case 'technicalAndRegulatory':
        sectionPrompt = `
        Provide a comprehensive technical and regulatory analysis for this project with:
        
        1. Technical Feasibility:
           - Provide an in-depth analysis of implementing this project through vibe coding (AI-assisted development)
           - Identify critical technical components that must be properly addressed
           - Detail common pitfalls when building similar projects and how to avoid them
        
        2. Regulatory Considerations:
           - Identify specific data privacy regulations applicable to the project with compliance requirements
           - Outline IP protection strategies and potential patent/trademark opportunities
           - Detail industry-specific rules and compliance requirements
        
        3. Partnership Opportunities:
           - Identify 3-5 specific potential partners with reasons for strategic alignment
           - For each partner, explain the value exchange and integration points
        
        4. Implementation Roadmap:
           - Provide a phased implementation plan with 90-day, 6-month, and 1-year horizons
           - For each phase, include specific tasks that a solo developer can accomplish
           - Detail success metrics for each phase
        `;
        
        exampleStructure = `
        {
          "technicalFeasibility": "In-depth analysis of implementing this project through AI-assisted development, including critical technical components and common pitfalls to avoid",
          "regulatoryConsiderations": "Specific data privacy regulations applicable to the project with compliance requirements, IP protection strategies, and industry-specific rules",
          "partnershipOpportunities": {
            "partners": [
              "Specific potential partner 1 with strategic alignment rationale",
              "Specific potential partner 2 with strategic alignment rationale",
              "Specific potential partner 3 with strategic alignment rationale",
              "Specific potential partner 4 with strategic alignment rationale"
            ]
          },
          "implementationRoadmap": {
            "phases": [
              {
                "timeframe": "First 90 days",
                "tasks": [
                  "Specific task 1 for a solo developer",
                  "Specific task 2 for a solo developer",
                  "Specific task 3 for a solo developer"
                ],
                "metrics": [
                  "Specific success metric 1",
                  "Specific success metric 2"
                ]
              },
              {
                "timeframe": "6-month horizon",
                "tasks": [
                  "Specific task 1 for a solo developer",
                  "Specific task 2 for a solo developer",
                  "Specific task 3 for a solo developer"
                ],
                "metrics": [
                  "Specific success metric 1",
                  "Specific success metric 2"
                ]
              },
              {
                "timeframe": "1-year horizon",
                "tasks": [
                  "Specific task 1 for a solo developer",
                  "Specific task 2 for a solo developer",
                  "Specific task 3 for a solo developer"
                ],
                "metrics": [
                  "Specific success metric 1",
                  "Specific success metric 2"
                ]
              }
            ]
          }
        }`;
        break;
    }
    
    return `${baseInstructions}
    
    ${sectionPrompt}
    
    Please analyze this project idea:
    ${projectContext}
    
    Format your response as a valid JSON object with this structure:
    ${exampleStructure}`;
  }
  
  /**
   * Helper method to make OpenAI API requests
   */
  private async makeOpenAIRequest(prompt: string) {
    return await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000,
    });
  }
  
  /**
   * Execute an array of functions with a concurrency limit
   */
  private async executeWithConcurrencyLimit<T>(
    tasks: (() => Promise<T>)[],
    concurrencyLimit: number
  ): Promise<T[]> {
    const results: T[] = [];
    const runningTasks = new Set<Promise<void>>();
    
    for (const task of tasks) {
      if (runningTasks.size >= concurrencyLimit) {
        // Wait for any task to complete before adding a new one
        await Promise.race(runningTasks);
      }
      
      // Create a task wrapper
      const runTask = async () => {
        try {
          results.push(await task());
        } catch (error) {
          console.error('Task error:', error);
          throw error;
        }
      };
      
      // Create the promise and track it
      const taskPromise = runTask().finally(() => {
        runningTasks.delete(taskPromise);
      });
      
      // Add to running tasks
      runningTasks.add(taskPromise);
    }
    
    // Wait for remaining tasks to complete
    await Promise.all(runningTasks);
    return results;
  }

  /**
   * Generate a project evaluation
   * @param projectInfo Information about the project
   * @returns Project evaluation object
   */
  async generateProjectEvaluation(projectInfo: {
    websiteUrl: string;
    projectDescription: string;
    desiredVibe: string;
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
    competitiveLandscape: {
      competitors: Array<{
        name: string;
        differentiation: string;
        strengths?: string[];
        weaknesses?: string[];
        marketPosition?: string;
        pricingStrategy?: string;
      }>;
      marketPositioning?: string;
      differentiationStrategy?: string;
      competitiveAdvantages?: string[];
    };
    implementationRoadmap?: { 
      phases: Array<{ 
        timeframe: string; 
        tasks: string[]; 
        metrics: string[] 
      }> 
    };
  }> {
    console.log(`Generating project evaluation`);
    
    // Combine all project information for context
    const projectContext = `
      Project Website URL: ${projectInfo.websiteUrl}
      Project Description: ${projectInfo.projectDescription}
      Desired Vibe/Style: ${projectInfo.desiredVibe}
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
      
      const systemPrompt = `You are an expert business and technology consultant who specializes in evaluating project ideas and websites. Your analysis is highly detailed, practical, and tailored for both solo developers and small teams.
        
        Analyze the following project information and provide an extremely comprehensive evaluation with the following elements:
        
        1. Market-Fit Analysis:
           - Identify specific strengths with concrete examples of how they create value in the market
           - For each strength, explain exactly how it addresses a real market need with specific use cases
           - Identify specific weaknesses with detailed, actionable recommendations for improvement
           - For each weakness, provide a step-by-step approach to address it with realistic timelines
           - Provide detailed demand potential analysis with market size estimates and specific customer segments
        
        2. Target Audience:
           - Create detailed demographic profiles including specific age ranges, income levels, education, occupation, geographic location, and technology usage patterns
           - Develop comprehensive psychographic profiles with values, interests, pain points, buying behaviors, and decision-making factors
        
        3. Fit Score:
           - Assign a numerical rating (0-100) based on concrete criteria with individual scores for market fit, technical feasibility, and business viability
           - Provide a detailed explanation for the score broken down by key success factors with individual ratings
           - Include specific, actionable recommendations to improve each factor
        
        4. Business Plan:
           - Detail viable revenue model options with specific pricing structures and implementation requirements
           - Create a detailed phased go-to-market strategy with specific channels and messaging approaches
           - Outline key milestones with specific timeframes and implementation steps
        
        5. Value Proposition:
           - Provide a concise, compelling one-sentence summary of project value that could be used in marketing
        
        6. Risk Assessment:
           - Identify project risks across technical, market, financial, regulatory, and operational domains
           - For each risk, provide a detailed description and a specific mitigation strategy
        
        7. Technical Feasibility:
           - Provide an in-depth analysis of implementing this project with current technology
           - Identify critical technical components that must be properly addressed
           - Detail common pitfalls when building similar projects and how to avoid them
        
        8. Regulatory Considerations:
           - Identify specific data privacy regulations applicable to the project with compliance requirements
           - Outline IP protection strategies and potential patent/trademark opportunities
           - Detail industry-specific rules and compliance requirements
        
        9. Partnership Opportunities:
           - Identify specific potential partners with reasons for strategic alignment
           - For each partner, explain the value exchange and integration points
        
        10. Competitive Landscape:
           - Identify direct and indirect competitors with detailed profiles and market positions
           - For each competitor, provide specific strengths and weaknesses
           - Include market positioning description showing where the project fits relative to competitors
           - Detail differentiation strategies with specific features and positioning recommendations
        
        11. Implementation Roadmap:
           - Provide a phased implementation plan with 90-day, 6-month, and 1-year horizons
           - For each phase, include specific tasks that can be accomplished
           - Detail success metrics for each phase
        
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
        console.error(`Missing required fields in response: ${missingFields.join(', ')}`);
        throw new Error(`Incomplete response from OpenAI API: Missing fields ${missingFields.join(', ')}`);
      }
      
      return result;
    } catch (error) {
      console.error('Error generating project evaluation:', error);
      throw error;
    }
  }

  /**
   * Generate tag suggestions for a project description
   * @param description Project description to generate tags for
   * @returns Array of suggested tags
   */
  async generateTagSuggestions(description: string): Promise<string[]> {
    console.log(`Generating tag suggestions for project description`);
    
    try {
      // Check if API key is set
      if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY is not set. Check your environment variables.');
        throw new Error('OpenAI API key is missing');
      }
      
      const systemPrompt = `You are an expert at categorizing and tagging tech projects and coding-related content.
        Given a project description, generate between 3-5 relevant tags that accurately represent:
        - The primary technologies used
        - The project domain or industry
        - The core functionality
        
        Tags should be short (1-3 words maximum), lowercase, and use hyphens for multi-word tags.
        Respond with a JSON object containing an array of tags.
        
        Example: 
        {
          "tags": ["react", "e-commerce", "payment-processing", "user-authentication", "dashboard"]
        }`;
      
      // Make the API call
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