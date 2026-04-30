import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  username: z.string().min(3).max(32),
  displayName: z.string().min(2).max(64).optional(),
});

export const loginSchema = z
  .object({
    email: z.string().email().optional(),
    password: z.string().min(8).max(128).optional(),
    provider: z.enum(['password', 'google']).default('password'),
    idToken: z.string().min(10).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.provider === 'password' && (!value.email || !value.password)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Email and password are required.' });
    }

    if (value.provider === 'google' && !value.idToken) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Google Firebase ID token is required.' });
    }
  });
