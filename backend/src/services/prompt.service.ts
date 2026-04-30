import { randomUUID } from 'node:crypto';
import { geminiClient } from '../integrations/gemini/gemini.client';
import type { PromptHistoryRecord, PromptTemplateRecord } from '../models/prompt.model';
import { promptHistoryRepository, promptTemplateRepository } from '../repositories/prompt.repository';
import { userProfileRepository } from '../repositories/user.repository';
import { AppError } from '../utils/app-error';

const now = () => new Date().toISOString();

const buildPromptSystemInstruction = (goal: string, role: string, detailLevel: string) =>
  `You optimize prompts for VibeCode Lab users.
Goal: ${goal}
Target AI role: ${role}
Detail level: ${detailLevel}
Return concise, actionable prompt text plus a short rationale.
Do not include markdown fences unless necessary.`;

class PromptService {
  private fallback(prompt: string, goal: string, role: string, detailLevel: string) {
    return `Role: ${role}
Goal: ${goal}
Detail: ${detailLevel}

Task:
${prompt}

Output format:
- State assumptions explicitly
- Show steps
- Include edge cases
- Keep answer actionable`;
  }

  private async storeHistory(record: Omit<PromptHistoryRecord, 'id'>) {
    const id = randomUUID();
    await promptHistoryRepository.create(id, { id, ...record });
  }

  async improve(userId: string, input: { prompt: string; goal: string; role: string; detailLevel: string }) {
    const systemInstruction = buildPromptSystemInstruction(input.goal, input.role, input.detailLevel);
    const improvedPrompt = await geminiClient
      .generate(systemInstruction, input.prompt)
      .catch(() => this.fallback(input.prompt, input.goal, input.role, input.detailLevel));

    await this.storeHistory({
      userId,
      inputPrompt: input.prompt,
      outputPrompt: improvedPrompt,
      goal: input.goal,
      role: input.role,
      detailLevel: input.detailLevel,
      createdAt: now(),
    });

    return {
      improvedPrompt,
      rationale: `Optimized for ${input.goal} with ${input.role} perspective.`,
    };
  }

  async generate(
    userId: string,
    input: { prompt: string; goal: string; role: string; detailLevel: string; context?: string },
  ) {
    const source = input.context ? `${input.prompt}\n\nContext:\n${input.context}` : input.prompt;
    return this.improve(userId, {
      prompt: source,
      goal: input.goal,
      role: input.role,
      detailLevel: input.detailLevel,
    });
  }

  async rewrite(
    userId: string,
    input: { originalPrompt: string; prompt: string; goal: string; role: string; detailLevel: string },
  ) {
    const rewrittenInput = `Rewrite this prompt:
Original:
${input.originalPrompt}

Requested changes:
${input.prompt}`;

    return this.improve(userId, {
      prompt: rewrittenInput,
      goal: input.goal,
      role: input.role,
      detailLevel: input.detailLevel,
    });
  }

  async history(userId: string) {
    const snapshot = await promptTemplateRepository
      .collection()
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => doc.data());
  }

  async save(
    userId: string,
    input: {
      title: string;
      category: string;
      originalPrompt: string;
      improvedPrompt: string;
      role: string;
      detailLevel: string;
    },
  ) {
    const id = randomUUID();
    const record: PromptTemplateRecord = {
      id,
      userId,
      title: input.title,
      category: input.category,
      originalPrompt: input.originalPrompt,
      improvedPrompt: input.improvedPrompt,
      role: input.role,
      detailLevel: input.detailLevel,
      createdAt: now(),
    };
    await promptTemplateRepository.create(id, record);

    const profile = await userProfileRepository.getById(userId);
    if (profile) {
      await userProfileRepository.upsert(userId, {
        ...profile,
        totalPromptsSaved: profile.totalPromptsSaved + 1,
        updatedAt: now(),
        lastActiveAt: now(),
      });
    }

    return record;
  }

  async remove(userId: string, promptId: string) {
    const record = await promptTemplateRepository.getById(promptId);
    if (!record || record.userId !== userId) {
      throw new AppError('Prompt not found.', 404, 'PROMPT_NOT_FOUND');
    }
    await promptTemplateRepository.delete(promptId);
    return { deleted: true };
  }
}

export const promptService = new PromptService();
