import OpenAI from 'openai';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = 'gpt-4o';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class AIService {
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
        resources: string; 
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
      
      const systemPrompt = `You are an expert business and technology consultant who evaluates project viability. 
        Analyze the following project information and provide a comprehensive evaluation with the following elements:
        
        1. Market-Fit Analysis:
           - Identify 5 specific strengths with concrete examples of how they create value
           - Identify 5 specific weaknesses with actionable recommendations for improvement
           - Provide detailed demand potential analysis with market size estimates and growth projections
        
        2. Target Audience:
           - Create detailed demographic profiles including age ranges, income levels, education, occupation, and geographic location
           - Develop comprehensive psychographic profiles with values, interests, pain points, and buying behaviors
           - Include 3 detailed user personas with names, backgrounds, goals, and scenarios for using the product
        
        3. Fit Score:
           - Assign a numerical rating (0-100) based on concrete criteria
           - Provide a detailed explanation for the score broken down by key success factors
           - Include specific recommendations to improve the score by at least 10 points
        
        4. Business Plan:
           - Detail 3-5 revenue model options with pros/cons and implementation requirements for each
           - Create a phased go-to-market strategy with specific channels, messaging, and KPIs
           - Outline 6-8 key milestones with timeframes, resource requirements, and success criteria
           - Include monetization strategies with pricing models and revenue projections
        
        5. Value Proposition:
           - Provide a concise one-sentence summary of project value
           - Break down the value proposition into specific benefits for each user segment
           - Include before/after scenarios showing the transformation users experience
        
        6. Risk Assessment:
           - Identify 5-7 project risks across technical, market, and legal domains
           - Rate each risk by impact (High/Medium/Low) and probability (High/Medium/Low)
           - Provide detailed mitigation strategies with specific actions, owners, and timelines
           - Include contingency plans for high-impact risks
        
        7. Technical Feasibility:
           - Provide a detailed evaluation of required tech stack with specific technologies
           - Outline development complexity with estimated timelines and resource requirements
           - Identify technical challenges with specific solutions and best practices
           - Include scalability considerations and recommendations for future-proofing
           - Specify items they'll need to vibe code to ensure their vibe coded app meets production level quality
           - Recommend testing approaches and quality assurance strategies
        
        8. Regulatory Considerations:
           - Identify specific data privacy regulations applicable to the project (GDPR, CCPA, etc.)
           - Outline IP protection strategies and potential patent/trademark opportunities
           - Detail industry-specific rules and compliance requirements
           - Provide actionable recommendations for addressing regulatory challenges
        
        9. Partnership Opportunities:
           - Identify 5-7 specific potential partners with company names where possible
           - For each partner, explain the exact value exchange and integration points
           - Include detailed guidance on how to approach each partner (contact methods, pitch points)
           - Provide templates for partnership proposals and outreach messages
           - Outline partnership KPIs and success metrics
        
        10. Competitive Landscape:
           - Identify 5-7 direct and indirect competitors with detailed profiles
           - For each competitor, provide a complete SWOT analysis with specifics
           - Include market positioning map showing where the project fits relative to competitors
           - Detail differentiation strategies with specific features and messaging
           - Recommend competitive response strategies for different market scenarios
        
        11. Implementation Roadmap:
           - Provide a phased implementation plan with 90-day, 6-month, and 1-year horizons
           - Include resource requirements (team composition, skills needed, estimated costs)
           - Outline critical path dependencies and decision points
           - Detail success metrics and measurement approaches for each phase
        
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
                "resources": "Description of required resources",
                "metrics": ["Metric 1", "Metric 2"]
              },
              {
                "timeframe": "6-month horizon",
                "tasks": ["Task 1", "Task 2", "Task 3"],
                "resources": "Description of required resources",
                "metrics": ["Metric 1", "Metric 2"]
              },
              {
                "timeframe": "1-year horizon",
                "tasks": ["Task 1", "Task 2", "Task 3"],
                "resources": "Description of required resources",
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
                resources?: string; 
                metrics?: string[] 
              }) => ({
                timeframe: phase.timeframe || '',
                tasks: Array.isArray(phase.tasks) ? phase.tasks : [],
                resources: phase.resources || '',
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
              resources: "Could not generate resource requirements due to API error.",
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