import { BlogPost } from '../types';

const openAiApiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const openAiModel = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) || 'gpt-5.2';

export const isOpenAiConfigured = Boolean(openAiApiKey);

const stripHtml = (content: string) => content.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();

export interface SocialKit {
  aiSummary: string;
  socialCaption: string;
  infographicUrl: string;
}

const buildFallbackSocialKit = (title: string, content: string, category = 'Psychology'): SocialKit => {
  const plainText = stripHtml(content);
  const shortText = plainText.slice(0, 145).trim();
  const aiSummary = shortText
    ? `${shortText}${plainText.length > 145 ? '...' : ''}`
    : `A concise ${category.toLowerCase()} insight ready for peer review.`;
  const socialCaption = `${title}: ${aiSummary} #PsycheSphere #${category.replace(/\s+/g, '')}`;
  const infographicUrl = `https://placehold.co/1200x1200/4f46e5/ffffff?text=${encodeURIComponent(title.slice(0, 60))}`;

  return { aiSummary, socialCaption, infographicUrl };
};

const parseJsonFromText = (text: string) => {
  const jsonText = text.replace(/```json|```/g, '').trim();
  return JSON.parse(jsonText) as { aiSummary?: string; socialCaption?: string; infographicPrompt?: string };
};

export async function generateChatGptSocialKit(post: Pick<BlogPost, 'title' | 'content' | 'category'>): Promise<SocialKit> {
  const fallback = buildFallbackSocialKit(post.title, post.content, post.category);

  if (!isOpenAiConfigured) return fallback;

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiApiKey}`
      },
      body: JSON.stringify({
        model: openAiModel,
        input: [
          {
            role: 'developer',
            content: 'You create concise, accurate psychology blog promotion assets. Return only valid JSON.'
          },
          {
            role: 'user',
            content: `Create a social promotion kit for this psychology blog post. JSON keys: aiSummary, socialCaption, infographicPrompt. The summary must be one sentence. The caption must be ready for LinkedIn/X/Facebook with 2-3 hashtags. The infographic prompt should describe a square editorial infographic.\nTitle: ${post.title}\nCategory: ${post.category}\nContent: ${post.content}`
          }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'social_kit',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                aiSummary: { type: 'string' },
                socialCaption: { type: 'string' },
                infographicPrompt: { type: 'string' }
              },
              required: ['aiSummary', 'socialCaption', 'infographicPrompt']
            }
          }
        }
      })
    });

    if (!response.ok) throw new Error(`OpenAI request failed (${response.status}): ${await response.text()}`);

    const data = await response.json() as { output_text?: string };
    const parsed = parseJsonFromText(data.output_text || '');
    const infographicText = parsed.infographicPrompt || post.title;

    return {
      aiSummary: parsed.aiSummary || fallback.aiSummary,
      socialCaption: parsed.socialCaption || fallback.socialCaption,
      infographicUrl: `https://placehold.co/1200x1200/4f46e5/ffffff?text=${encodeURIComponent(infographicText.slice(0, 80))}`
    };
  } catch (error) {
    console.error('OpenAI social kit error:', error);
    return fallback;
  }
}
