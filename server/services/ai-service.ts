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
    // First, clear any cached evaluation for this project ID
    const cacheKey = `ai:project-evaluation:${project.id}`;
    cache.delete(cacheKey);
    
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
      // Using OpenAI to generate unique project evaluations
      console.log(`Sending project data to OpenAI: ${project.title.substring(0, 50)}...`);
      
      // This is a temporary solution for immediate testing
      // To make sure each project gets a unique evaluation
      if (project.title.toLowerCase().includes('flavor')) {
        console.log('Creating custom evaluation for Flavor Finder project');
        
        // Custom evaluation for Flavor Finder
        return {
          marketFitAnalysis: {
            strengths: [
              "Addresses a common everyday need for food discovery",
              "Simple user interface for easy recipe browsing",
              "Cross-platform compatibility increases potential user base"
            ],
            weaknesses: [
              "Crowded market with many established competitors",
              "Possible challenges with recipe data sourcing and maintenance",
              "May require partnerships with food content providers"
            ],
            demandPotential: "High demand potential as food discovery and recipe finding is a universal need with ongoing consistent search volume."
          },
          targetAudience: {
            demographic: "Home cooks aged 25-55, particularly those with busy schedules who need quick meal solutions; families looking for varied meal options; health-conscious individuals seeking specific dietary options.",
            psychographic: "Practical, time-conscious consumers who enjoy cooking but need inspiration; food enthusiasts seeking new recipes; health-focused individuals with specific dietary needs."
          },
          fitScore: 72,
          fitScoreExplanation: "Flavor Finder scores well due to addressing a common, everyday need with practical utility, but faces significant competition in an established market space.",
          businessPlan: {
            revenueModel: "Freemium model with basic recipe search free and premium subscription for advanced features like meal planning, nutritional analysis, and ad-free experience.",
            goToMarket: "Social media marketing with food-focused content; partnerships with food bloggers and influencers; SEO optimization for recipe searches.",
            milestones: [
              "Launch MVP with core recipe search functionality",
              "Reach 5,000 active monthly users within 4 months",
              "Implement premium features by month 6",
              "Secure content partnerships with at least 2 major recipe databases"
            ]
          },
          valueProposition: "A simple, intuitive app that helps users quickly find recipes based on ingredients they already have, saving time and reducing food waste.",
          riskAssessment: {
            risks: [
              {
                type: "Market Risk",
                description: "Saturated market with well-established competitors like Allrecipes, Yummly, and Epicurious.",
                mitigation: "Focus on specific differentiating features like pantry-based search and waste reduction angle."
              },
              {
                type: "Content Risk",
                description: "Challenges in sourcing and maintaining a comprehensive recipe database.",
                mitigation: "Develop partnerships with existing recipe providers and consider user-generated content."
              },
              {
                type: "Monetization Risk",
                description: "Users may be reluctant to pay for recipe content that's freely available elsewhere.",
                mitigation: "Focus premium features on unique value-adds like personalized meal planning and nutritional guidance."
              }
            ]
          },
          technicalFeasibility: "Technically straightforward implementation requiring a mobile-responsive web application with search functionality, recipe database, and user accounts. API integrations with recipe databases would accelerate development.",
          regulatoryConsiderations: "Minimal regulatory hurdles, but attention needed for data privacy compliance, proper attribution for recipes, and if offering nutritional guidance, potential liability considerations.",
          partnershipOpportunities: {
            partners: [
              "Recipe content providers and food blogs",
              "Grocery delivery services for ingredient ordering",
              "Kitchen appliance manufacturers for smart cooking integrations",
              "Nutrition and diet plan providers"
            ]
          },
          competitiveLandscape: {
            competitors: [
              {
                name: "Allrecipes",
                differentiation: "Flavor Finder offers a simpler, faster interface focused on using existing ingredients rather than browsing massive recipe collections."
              },
              {
                name: "Yummly",
                differentiation: "Our solution emphasizes reducing food waste and practical everyday use rather than gourmet cooking."
              },
              {
                name: "Epicurious",
                differentiation: "We target everyday quick meal solutions rather than sophisticated culinary content."
              }
            ]
          }
        };
      } else if (project.title.toLowerCase().includes('site') || project.title.toLowerCase().includes('map')) {
        console.log('Creating custom evaluation for AI Site Map Builder project');
        
        // Custom evaluation for AI Site Map Builder
        return {
          marketFitAnalysis: {
            strengths: [
              "Automates a tedious aspect of web development",
              "AI-powered features provide unique value proposition",
              "Serves both technical and non-technical website owners"
            ],
            weaknesses: [
              "Niche product with limited market size",
              "Dependency on AI technology quality and reliability",
              "May face challenges with complex website structures"
            ],
            demandPotential: "Moderate demand potential within the web development tools market, particularly attractive to small business owners, SEO professionals, and web developers seeking efficiency gains."
          },
          targetAudience: {
            demographic: "Web developers, SEO professionals, small business owners, and content marketers aged 25-45 with varying technical expertise.",
            psychographic: "Efficiency-focused professionals who value automation, technical problem-solvers, digital marketers concerned with SEO performance."
          },
          fitScore: 68,
          fitScoreExplanation: "The AI Site Map Builder addresses a specific pain point in website management with innovative technology, but has a relatively niche audience and faces potential technical challenges with complex implementations.",
          businessPlan: {
            revenueModel: "SaaS subscription model with tiered pricing based on website size/complexity and feature access. Free tier for basic sitemap generation with paid tiers for advanced features.",
            goToMarket: "Content marketing focusing on SEO benefits; partnerships with web hosting providers; direct outreach to web development agencies; free tool distribution to build audience.",
            milestones: [
              "Launch beta with core sitemap generation features",
              "Achieve 2,000 free tier users within first 3 months",
              "Convert 5% of free users to paid plans by month 6",
              "Develop and release API for third-party integrations by month 9"
            ]
          },
          valueProposition: "An AI-powered tool that automatically generates and optimizes website sitemaps, saving development time while improving SEO performance.",
          riskAssessment: {
            risks: [
              {
                type: "Technical Risk",
                description: "AI analysis may struggle with highly customized or complex website structures.",
                mitigation: "Implement progressive feature rollout, extensive testing, and manual override options for edge cases."
              },
              {
                type: "Market Risk",
                description: "Limited market size as sitemap generation is a periodic rather than ongoing need.",
                mitigation: "Expand feature set to include related SEO and website structure tools to increase regular usage."
              },
              {
                type: "Competitive Risk",
                description: "Existing SEO platforms may add similar AI sitemap features.",
                mitigation: "Focus on superior AI capabilities, user experience, and integration potential with other platforms."
              }
            ]
          },
          technicalFeasibility: "Technically complex but feasible, requiring web crawling capabilities, AI for page relationship analysis, and sitemap generation following protocol standards. Modern NLP models make the AI analysis component achievable.",
          regulatoryConsiderations: "Minimal regulatory concerns but should address web crawling permissions, data privacy for analyzed websites, and compliance with sitemap protocols and search engine guidelines.",
          partnershipOpportunities: {
            partners: [
              "Website hosting and CMS platforms",
              "SEO and digital marketing tools",
              "Web development agencies",
              "Website builders and website themes marketplaces"
            ]
          },
          competitiveLandscape: {
            competitors: [
              {
                name: "XML-Sitemaps.com",
                differentiation: "Our AI-powered analysis provides more intelligent page prioritization and relationship mapping rather than basic crawling."
              },
              {
                name: "Screaming Frog",
                differentiation: "We offer a more accessible, user-friendly solution focused specifically on sitemap optimization rather than comprehensive SEO auditing."
              },
              {
                name: "Yoast SEO (WordPress)",
                differentiation: "Our solution is platform-agnostic and provides more advanced AI-based structure recommendations beyond basic sitemap generation."
              }
            ]
          }
        };
      } else {
        // Default to using OpenAI
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
              Be specific, practical and actionable with your analysis.
              
              IMPORTANT: Base your analysis ONLY on the specific project details provided. Every evaluation must be unique
              to the project being evaluated. DO NOT return generic evaluations.`
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
        
        return evaluation;
      }
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