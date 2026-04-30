import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'fake-key');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const askGemini = async (prompt: string, systemContext?: string) => {
  if (process.env.GEMINI_API_KEY === 'your-gemini-key' || !process.env.GEMINI_API_KEY) {
      return "Đây là câu trả lời mock từ Gemini do chưa cấu hình GEMINI_API_KEY thực. Vui lòng cập nhật .env để sử dụng AI thật!";
  }
  const fullPrompt = systemContext ? `[SYSTEM CONTEXT]\n${systemContext}\n[USER PROMPT]\n${prompt}` : prompt;
  const result = await model.generateContent(fullPrompt);
  return result.response.text();
};
