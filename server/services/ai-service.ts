import OpenAI from 'openai';
import { cache } from '../utils/index';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = 'gpt-4o';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class AIService {
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
    if (cachedSummary && typeof cachedSummary === 'string') {
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

      const responseContent = response.choices[0].message.content;
      let summary = responseContent ? responseContent.trim() : '';
      
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
    if (cachedSentiment && 
        typeof cachedSentiment === 'object' && 
        'rating' in cachedSentiment && 
        'confidence' in cachedSentiment) {
      return cachedSentiment as { rating: number, confidence: number };
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
      const responseContent = response.choices[0].message.content;
      let result = { rating: 3, confidence: 0.5 };
      if (responseContent) {
        try {
          const parsed = JSON.parse(responseContent);
          result = parsed;
        } catch (e) {
          console.error('Failed to parse sentiment JSON response', e);
        }
      }
      
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
    if (cachedTags && Array.isArray(cachedTags)) {
      return cachedTags as string[];
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

  /**
   * Generate a comprehensive business and technical evaluation of a project
   * @param project The project to evaluate
   * @returns Object containing the evaluation data
   */
  async generateProjectEvaluation(project: {
    title: string;
    description: string;
    longDescription?: string;
    tags?: string[];
  }): Promise<{
    evaluation: any;
    fitScore: number;
  }> {
    if (!project.title || !project.description) {
      throw new Error('Project title and description are required for evaluation');
    }

    // Create a cache key from project details
    const cacheKey = `ai:project_evaluation:${Buffer.from(project.title + project.description).toString('base64').substring(0, 50)}`;
    
    // Check cache first
    const cachedEvaluation = cache.get(cacheKey);
    if (cachedEvaluation && 
        typeof cachedEvaluation === 'object' && 
        'evaluation' in cachedEvaluation && 
        'fitScore' in cachedEvaluation) {
      return cachedEvaluation as { evaluation: any; fitScore: number };
    }

    try {
      // Build project content for evaluation
      const projectContent = `
Project Title: ${project.title}
Project Description: ${project.description}
${project.longDescription ? `Extended Description: ${project.longDescription}` : ''}
${project.tags && project.tags.length > 0 ? `Project Tags: ${project.tags.join(', ')}` : ''}
      `.trim();

      // System prompt to guide evaluation
      const systemPrompt = `
You are a professional business and project analyst with expertise in evaluating technology projects.
Provide a comprehensive evaluation of the project described below.
Focus on business viability, market fit, and technical feasibility.
Your evaluation must include all of the following sections:

1. Market-Fit Analysis:
   - List 3-5 specific strengths of the project
   - List 2-4 potential weaknesses or areas for improvement
   - Evaluate the demand potential in the current market

2. Target Audience:
   - Describe the demographic profile (age, education, etc.)
   - Describe psychographic profile (interests, values, pain points)

3. Fit Score:
   - Provide a numerical rating from 0 to 100 based on market potential
   - Include a brief explanation of how you determined the score

4. High-Level Business Plan:
   - Suggest 1-2 potential revenue models
   - Outline a go-to-market strategy
   - List 3-5 key milestones the project should aim for
   - Identify essential resources needed

5. Value Proposition Statement:
   - Create a concise one-sentence summary of the unique value

6. Risk Assessment:
   - Identify 3-5 significant risks across technical, market, and legal areas
   - For each risk, suggest a mitigation strategy

7. Technical Feasibility:
   - Evaluate the likely tech stack requirements
   - List potential dependencies or technologies
   - Rate the overall technical complexity (Low, Medium, or High)

8. Regulatory/Compliance Considerations:
   - List any data privacy, IP, or industry-specific regulations that might apply

9. Partnership Opportunities:
   - Suggest 2-4 potential strategic partnerships or integrations

10. Competitive Landscape:
    - Identify 3-5 potential competitors
    - List specific differentiation points for this project

Respond with a JSON object containing all these sections. Use the following exact structure:
{
  "marketFitAnalysis": {
    "strengths": ["strength1", "strength2", ...],
    "weaknesses": ["weakness1", "weakness2", ...],
    "demandPotential": "description"
  },
  "targetAudience": {
    "demographic": "profile description",
    "psychographic": "profile description"
  },
  "fitScore": 75,
  "fitScoreExplanation": "explanation",
  "businessPlan": {
    "revenueModel": "description",
    "goToMarketStrategy": "strategy description",
    "keyMilestones": ["milestone1", "milestone2", ...],
    "resourcesNeeded": ["resource1", "resource2", ...]
  },
  "valueProposition": "concise statement",
  "riskAssessment": {
    "risks": [
      {
        "type": "technical/market/legal/etc",
        "description": "risk description",
        "mitigation": "mitigation strategy"
      },
      ...
    ]
  },
  "technicalFeasibility": {
    "stack": "description",
    "dependencies": ["dependency1", "dependency2", ...],
    "complexity": "Low/Medium/High"
  },
  "regulatoryConsiderations": ["consideration1", "consideration2", ...],
  "partnershipOpportunities": ["opportunity1", "opportunity2", ...],
  "competitiveLandscape": {
    "competitors": [
      {
        "name": "competitor name",
        "description": "brief description"
      },
      ...
    ],
    "differentiationPoints": ["point1", "point2", ...]
  }
}
      `.trim();

      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Please evaluate this project and provide your comprehensive analysis: ${projectContent}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2000, // Allow enough tokens for a detailed response
      });

      // Parse the response
      const evaluationData = JSON.parse(response.choices[0].message.content || '{}');
      
      // Extract the fit score or default to 50 if missing
      const fitScore = typeof evaluationData.fitScore === 'number' 
        ? Math.max(0, Math.min(100, evaluationData.fitScore)) 
        : 50;

      const result = {
        evaluation: evaluationData,
        fitScore: fitScore
      };

      // Cache the result for future use (longer cache time as evaluation is expensive)
      cache.set(cacheKey, result, { ttl: 7 * 24 * 60 * 60 * 1000 }); // 7 day cache

      return result;
    } catch (error) {
      console.error('Error generating project evaluation:', error);
      throw new Error('Failed to generate project evaluation. Please try again later.');
    }
  }
}
