import { z } from 'zod';

export const challengeQuerySchema = z.object({
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  tag: z.string().min(1).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export const hintQuerySchema = z.object({
  level: z.coerce.number().int().min(1).max(3).optional(),
});

export const runBugSchema = z.object({
  challengeId: z.string().min(3).max(128),
  code: z.string().min(1).max(20000),
});

export const submitBugSchema = z.object({
  challengeId: z.string().min(3).max(128),
  code: z.string().min(1).max(20000),
});

export const saveBugSchema = z.object({
  challengeId: z.string().min(3).max(128),
  code: z.string().min(1).max(20000),
});
