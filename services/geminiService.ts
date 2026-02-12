
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function polishPsychologyContent(title: string, content: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a meticulous psychology copyeditor. Refine the provided blog post draft for clarity, professional word choice, and grammatical perfection. 
      
      CRITICAL INSTRUCTIONS:
      1. Correct all grammar, punctuation, and spelling errors.
      2. Improve vocabulary and word choice to be more precise and professional.
      3. DO NOT change the main ideas, arguments, or the core message of the post.
      4. DO NOT add new facts or delete existing scientific claims.
      5. Maintain the author's original tone (e.g., if it is conversational, keep it conversational but polished).
      6. Return ONLY the refined content as HTML.

      Title: ${title}
      Content: ${content}`,
      config: {
        temperature: 0.3, // Lower temperature for more consistent, less creative edits
        topP: 0.8,
        topK: 40,
      }
    });

    return response.text || "Could not generate content enhancement.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to enhance content using AI.");
  }
}

export async function generateExcerpt(title: string, content: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a compelling, one-sentence summary for a psychology blog post. 
      Title: ${title}
      Content: ${content}`,
      config: {
        maxOutputTokens: 100,
      }
    });

    return response.text || "No excerpt generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Read more to discover deep insights into the human psyche.";
  }
}
