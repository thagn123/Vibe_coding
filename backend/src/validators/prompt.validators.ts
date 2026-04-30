import { z } from 'zod';

const promptBaseSchema = z.object({
  prompt: z.string().min(3).max(6000),
  goal: z.string().min(2).max(120).default('general'),
  role: z.string().min(2).max(120).default('software engineer'),
  detailLevel: z.enum(['low', 'medium', 'high']).default('medium'),
});

export const generatePromptSchema = promptBaseSchema.extend({
  context: z.string().max(6000).optional(),
});

export const improvePromptSchema = promptBaseSchema;

export const rewritePromptSchema = promptBaseSchema.extend({
  originalPrompt: z.string().min(3).max(6000),
});

export const savePromptSchema = z.object({
  title: z.string().min(2).max(120),
  category: z.string().min(2).max(120),
  originalPrompt: z.string().min(3).max(6000),
  improvedPrompt: z.string().min(3).max(8000),
  role: z.string().min(2).max(120),
  detailLevel: z.enum(['low', 'medium', 'high']),
});
