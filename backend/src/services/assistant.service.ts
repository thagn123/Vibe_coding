import { randomUUID } from 'node:crypto';
import { geminiClient } from '../integrations/gemini/gemini.client';
import type { AiConversationRecord, AssistantModuleType } from '../models/assistant.model';
import { aiConversationRepository } from '../repositories/assistant.repository';

const now = () => new Date().toISOString();

const systemPrompts: Record<AssistantModuleType, string> = {
  find_bug:
    'You are a debugging coach. Explain reasoning, ask guiding questions, and never reveal the full final solution or patched code for the challenge.',
  prompt:
    'You are a prompt engineering assistant. Improve clarity, constraints, and evaluation criteria while staying concise.',
  general:
    'You are a senior software mentor. Explain concepts accurately with practical examples and tradeoffs.',
};

class AssistantService {
  async chat(
    userId: string,
    input: {
      conversationId?: string;
      moduleType: AssistantModuleType;
      message: string;
      context?: { challengeId?: string; challengeTitle?: string; currentCode?: string };
    },
  ) {
    const conversationId = input.conversationId ?? randomUUID();
    const existing = input.conversationId
      ? await aiConversationRepository.getById(conversationId)
      : null;

    const messages = existing?.messages ?? [];
    const userMessage = { role: 'user' as const, content: input.message, createdAt: now() };
    const prompt = [
      input.context?.challengeTitle ? `Challenge: ${input.context.challengeTitle}` : null,
      input.context?.currentCode ? `Current code:\n${input.context.currentCode}` : null,
      `User message:\n${input.message}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    const reply =
      (await geminiClient.generate(systemPrompts[input.moduleType], prompt).catch(() =>
        input.moduleType === 'find_bug'
          ? 'Focus on the failing condition and inspect which branch never reaches the expected state.'
          : 'Clarify the goal, constraints, and expected output before sending the prompt.',
      )) || 'No response generated.';

    const assistantMessage = { role: 'assistant' as const, content: reply, createdAt: now() };
    const record: AiConversationRecord = {
      id: conversationId,
      userId,
      moduleType: input.moduleType,
      messages: [...messages, userMessage, assistantMessage],
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now(),
    };

    await aiConversationRepository.upsert(conversationId, record);

    return {
      conversationId,
      reply,
      messages: record.messages,
    };
  }

  async history(userId: string, moduleType?: AssistantModuleType) {
    const baseQuery = aiConversationRepository.collection().where('userId', '==', userId);
    const query = moduleType ? baseQuery.where('moduleType', '==', moduleType) : baseQuery;
    const snapshot = await query.orderBy('updatedAt', 'desc').get();
    return snapshot.docs.map((doc) => doc.data());
  }

  async summarize(userId: string, conversationId?: string) {
    const record = conversationId
      ? await aiConversationRepository.getById(conversationId)
      : (await this.history(userId))[0];

    if (!record) {
      return { summary: 'No conversation history available.' };
    }

    const dialogue = record.messages
      .map((message: { role: string; content: string }) => `${message.role}: ${message.content}`)
      .join('\n');
    const summary =
      (await geminiClient.generate('Summarize this chat in 3 concise bullets.', dialogue).catch(() => 'Summary unavailable.')) ||
      'Summary unavailable.';

    return { summary, conversationId: record.id };
  }
}

export const assistantService = new AssistantService();
