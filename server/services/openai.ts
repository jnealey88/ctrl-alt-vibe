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
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error generating TL;DR summary with OpenAI:", error);
    throw new Error("Failed to generate summary. Please try again later.");
  }
}
