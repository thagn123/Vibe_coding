import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(64).optional(),
  username: z.string().min(3).max(32).optional(),
  avatarUrl: z.string().url().or(z.literal('')).optional(),
  bio: z.string().max(240).optional(),
  location: z.string().max(120).optional(),
});
