import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'fake-key',
});

export const askOpenAI = async (prompt: string, systemContext?: string) => {
  if (process.env.OPENAI_API_KEY === 'your-openai-key' || !process.env.OPENAI_API_KEY) {
      return "Đây là câu trả lời mock từ OpenAI do chưa cấu hình OPENAI_API_KEY thực. Vui lòng cập nhật .env để sử dụng AI thật!";
  }
  
  const messages: any[] = [];
  if (systemContext) {
      messages.push({ role: 'system', content: systemContext });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Có thể đổi thành gpt-4o tùy nhu cầu
    messages: messages,
  });

  return response.choices[0].message.content || "";
};
