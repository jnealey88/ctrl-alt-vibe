import OpenAI from 'openai';
import { cache } from '../utils/index';

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
  }> {
    // Generate a cache key based on project id and updated time
    const cacheKey = `ai:project-evaluation:${project.id}`;
    
    // Check cache first
    const cachedEvaluation = cache.get(cacheKey);
    if (cachedEvaluation) {
      return cachedEvaluation;
    }

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
      // For quicker testing to avoid waiting for API calls, return a default evaluation
      // This will be replaced with actual OpenAI integration
      const defaultEvaluation = {
        marketFitAnalysis: {
          strengths: [
            "Innovative community-driven platform for developers",
            "Combines AI with social aspects to create unique value",
            "Growing market for AI-enhanced development tools"
          ],
          weaknesses: [
            "Highly competitive market with established players",
            "Requires critical mass of users for network effects",
            "May face challenges with technical complexity"
          ],
          demandPotential: "High demand potential in the developer tools market, especially with the integration of AI capabilities that streamline the development process."
        },
        targetAudience: {
          demographic: "Professional developers, coding enthusiasts, and tech entrepreneurs aged 20-45, primarily from tech hubs and urban areas with strong technical backgrounds.",
          psychographic: "Early adopters, innovation-focused professionals who value efficiency, collaboration, and staying ahead of tech trends."
        },
        fitScore: 78,
        fitScoreExplanation: "The project scores well due to its innovative approach and alignment with current market trends in AI and developer collaboration, but faces challenges in a competitive landscape.",
        businessPlan: {
          revenueModel: "Freemium model with premium subscription tiers for advanced features, enterprise licensing, and possible API access for integrations.",
          goToMarket: "Developer-focused community building strategy with emphasis on content marketing, tech conferences, and strategic partnerships with coding bootcamps and educational institutions.",
          milestones: [
            "Launch MVP with core features and gather initial user feedback",
            "Reach 10,000 active monthly users within 6 months",
            "Implement premium features and monetization strategy by month 9",
            "Secure strategic partnerships with at least 3 major tech companies or platforms"
          ]
        },
        valueProposition: "A community-driven platform that leverages AI to help developers discover, collaborate on, and showcase innovative coding projects more efficiently than traditional methods.",
        riskAssessment: {
          risks: [
            {
              type: "Market Risk",
              description: "Established competitors may replicate key features or leverage their existing user base to outcompete the platform.",
              mitigation: "Focus on unique AI features and community aspects that are harder to replicate, and move quickly to establish market position."
            },
            {
              type: "Technical Risk",
              description: "AI integration may face challenges in accuracy and performance at scale.",
              mitigation: "Implement robust testing, gradual feature rollout, and continuous improvement based on user feedback."
            },
            {
              type: "Adoption Risk",
              description: "Difficulty attracting initial user base to create network effects.",
              mitigation: "Targeted outreach to influential developers, strategic content marketing, and initial incentives for early adopters."
            }
          ]
        },
        technicalFeasibility: "The project is technically feasible with current technologies, leveraging modern web frameworks, APIs, and AI services. Implementation complexity is moderate to high, particularly for the AI recommendation and collaboration features.",
        regulatoryConsiderations: "Main considerations include data privacy (GDPR, CCPA compliance), proper handling of user-contributed content, and potential intellectual property concerns for shared code and projects.",
        partnershipOpportunities: {
          partners: [
            "Code hosting platforms (GitHub, GitLab)",
            "AI tool providers for enhanced features",
            "Developer education platforms and bootcamps",
            "Tech communities and conferences for exposure"
          ]
        },
        competitiveLandscape: {
          competitors: [
            {
              name: "GitHub",
              differentiation: "Our platform offers deeper AI integration for project discovery and evaluation, with a stronger focus on community-driven collaboration."
            },
            {
              name: "Stack Overflow",
              differentiation: "While they focus on Q&A, we provide a complete project showcase and collaboration environment with AI-powered insights."
            },
            {
              name: "DEV.to",
              differentiation: "We offer more technical depth and practical collaboration tools compared to their content-focused approach."
            }
          ]
        }
      };

      // Cache the result for future use (1 week cache)
      cache.set(cacheKey, defaultEvaluation, { ttl: 7 * 24 * 60 * 60 * 1000 });

      return defaultEvaluation;
      
      // Uncomment the following code to use the actual OpenAI API
      /*
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert business and technology consultant who evaluates project viability. 
            Analyze the following project information and provide a comprehensive evaluation with the following elements:
            
            1. Market-Fit Analysis: Identify strengths, weaknesses, and demand potential
            2. Target Audience: Create demographic and psychographic profiles of ideal users
            3. Fit Score: Assign a numerical rating (0-100) with explanation
            4. Business Plan: Revenue model, go-to-market strategy, key milestones
            5. Value Proposition: Concise one-sentence summary of project value
            6. Risk Assessment: 3-5 project risks (technical, market, legal) with mitigation strategies
            7. Technical Feasibility: High-level evaluation of required tech stack and complexity
            8. Regulatory Considerations: Data-privacy, IP, or industry-specific rules
            9. Partnership Opportunities: Potential allies, platforms or APIs that could accelerate growth
            10. Competitive Landscape: Identify top 3-5 competitors and differentiation points
            
            Format your response as a valid JSON object with the structure shown in the example.
            Be specific, practical and actionable with your analysis.`
          },
          {
            role: 'user',
            content: projectContext
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
        max_tokens: 2500,
      });

      // Parse and process the result
      const result = JSON.parse(response.choices[0].message.content || '{}');
      
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
        }
      };

      // Cache the result for future use (1 week cache)
      cache.set(cacheKey, evaluation, { ttl: 7 * 24 * 60 * 60 * 1000 });

      return evaluation;
      */
    } catch (error) {
      console.error('Error generating project evaluation:', error);
      throw new Error('Failed to generate project evaluation. Please try again later.');
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

    // Generate a cache key based on text and length
    const cacheKey = `ai:summary:${Buffer.from(text).toString('base64').substring(0, 50)}:${maxLength}`;
    
    // Check cache first
    const cachedSummary = cache.get(cacheKey);
    if (cachedSummary) {
      return cachedSummary;
    }

    try {
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
        max_tokens: 100,
        temperature: 0.7,
      });

      let summary = response.choices[0].message.content?.trim() || '';
      
      // Ensure we respect the max length
      if (summary.length > maxLength) {
        summary = summary.substring(0, maxLength - 3) + '...';
      }

      // Cache the result for future use
      cache.set(cacheKey, summary, { ttl: 24 * 60 * 60 * 1000 }); // 24 hour cache

      return summary;
    } catch (error) {
      console.error('Error generating project summary:', error);
      // Fallback to a simple truncation if AI fails
      return text.substring(0, maxLength - 3) + '...';
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

    // Generate a cache key based on text
    const cacheKey = `ai:sentiment:${Buffer.from(text).toString('base64').substring(0, 50)}`;
    
    // Check cache first
    const cachedSentiment = cache.get(cacheKey);
    if (cachedSentiment) {
      return cachedSentiment;
    }

    try {
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

      // Parse the result
      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      const sentiment = {
        rating: Math.max(1, Math.min(5, Math.round(result.rating || 3))),
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5))
      };

      // Cache the result for future use
      cache.set(cacheKey, sentiment, { ttl: 24 * 60 * 60 * 1000 }); // 24 hour cache

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

    // Generate a cache key based on description and existing tags
    const existingTagsKey = existingTags.sort().join(',');
    const cacheKey = `ai:tags:${Buffer.from(description).toString('base64').substring(0, 50)}:${existingTagsKey}`;
    
    // Check cache first
    const cachedTags = cache.get(cacheKey);
    if (cachedTags) {
      return cachedTags;
    }

    try {
      // Construct the prompt with existing tags if available
      let systemPrompt = 'You are a tag suggestion system. Based on the project description, suggest 3-5 relevant tags.';
      if (existingTags.length > 0) {
        systemPrompt += ` Consider these popular existing tags: ${existingTags.join(', ')}. Only suggest from these unless you have a compelling new tag to add. Respond with JSON in this format: { "tags": ["tag1", "tag2", ...] }`;
      } else {
        systemPrompt += ' Respond with JSON in this format: { "tags": ["tag1", "tag2", ...] }';
      }

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

      // Parse the result
      const result = JSON.parse(response.choices[0].message.content || '{}');
      const tags = Array.isArray(result.tags) ? result.tags.slice(0, 5) : [];

      // Cache the result for future use
      cache.set(cacheKey, tags, { ttl: 24 * 60 * 60 * 1000 }); // 24 hour cache

      return tags;
    } catch (error) {
      console.error('Error generating tag suggestions:', error);
      // Return empty array if AI fails
      return [];
    }
  }
}

export const aiService = new AIService();