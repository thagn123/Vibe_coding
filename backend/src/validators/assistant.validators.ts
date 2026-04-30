import { z } from 'zod';

export const chatSchema = z.object({
  conversationId: z.string().optional(),
  moduleType: z.enum(['find_bug', 'prompt', 'general']),
  message: z.string().min(1).max(6000),
  context: z
    .object({
      challengeId: z.string().optional(),
      challengeTitle: z.string().optional(),
      currentCode: z.string().max(20000).optional(),
    })
    .optional(),
});

export const assistantHistorySchema = z.object({
  moduleType: z.enum(['find_bug', 'prompt', 'general']).optional(),
});

export const summarizeSchema = z.object({
  conversationId: z.string().optional(),
});
