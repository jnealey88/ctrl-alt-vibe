import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate a TL;DR summary for a blog post
 * @param content The HTML content of the blog post
 * @param title The title of the blog post
 * @returns A concise summary of the blog post
 */
export async function generateTldrSummary(content: string, title: string): Promise<string> {
  try {
    // Extract text from HTML to provide cleaner input to the model
    const textContent = content.replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert content summarizer. Create a concise TL;DR summary (2-3 sentences max) that captures the key points of the article."
        },
        {
          role: "user",
          content: `Title: ${title}\n\nContent: ${textContent}\n\nProvide a TL;DR summary in 2-3 sentences max:"`
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error generating TL;DR summary with OpenAI:", error);
    throw new Error("Failed to generate summary. Please try again later.");
  }
}

/**
 * Generate a complete blog post based on a title and keywords
 * @param title The title of the blog post
 * @param keywords Primary keywords for the blog post
 * @returns An HTML formatted blog post
 */
export async function generateBlogPost(title: string, keywords: string[]): Promise<{ content: string, summary: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert blog content writer for a tech platform called Ctrl Alt Vibe that focuses on AI-assisted development and coding.
          Create high-quality, engaging blog content that is informative, practical, and includes code examples where relevant.
          Format your response in well-structured HTML with proper headings (h2, h3), paragraphs, code blocks (using <pre><code> tags), and occasional bullet points or numbered lists where appropriate.
          The content should be comprehensive (approximately 1500-2000 words) and provide actionable insights for developers.`
        },
        {
          role: "user",
          content: `Title: ${title}\n\nPrimary keywords: ${keywords.join(', ')}\n\nPlease write a comprehensive blog post with the following elements:\n1. An engaging introduction that hooks the reader\n2. 7 distinct, practical tips or techniques as h2 sections\n3. Code examples where relevant\n4. A conclusion that summarizes the key takeaways\n\nFormat the content with proper HTML tags for a blog.`
        }
      ],
      max_tokens: 10000,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || "";
    
    // Generate a brief summary for the blog post metadata
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Create a concise, engaging one-sentence summary (maximum 150 characters) of this blog post that would make users want to read it."
        },
        {
          role: "user",
          content: `Blog post title: ${title}\n\nWrite a one-sentence summary/hook for this blog post about ${keywords.join(', ')}:`
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    const summary = summaryResponse.choices[0].message.content || "";

    return { content, summary };
  } catch (error) {
    console.error("Error generating blog post with OpenAI:", error);
    throw new Error("Failed to generate blog post. Please try again later.");
  }
}
