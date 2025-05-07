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
        
        Format your response as a valid JSON object with the EXACT structure shown in the example below.
        Be specific, practical and actionable with your analysis.
        
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
        max_tokens: 100,
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