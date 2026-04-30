import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env';
import { AppError } from '../../utils/app-error';

class GeminiClient {
  private client = env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }) : null;

  async generate(systemInstruction: string, prompt: string) {
    if (!this.client) {
      throw new AppError('Gemini API key is not configured.', 500, 'GEMINI_NOT_CONFIGURED');
    }

    const result = await Promise.race([
      this.client.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: [{ text: prompt }],
        config: { systemInstruction },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new AppError('Gemini request timed out.', 504, 'GEMINI_TIMEOUT')), 12000),
      ),
    ]);

    return (result as { text?: string }).text?.trim() ?? '';
  }
}

export const geminiClient = new GeminiClient();
