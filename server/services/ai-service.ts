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
