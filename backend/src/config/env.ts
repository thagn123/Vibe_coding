import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { config } from 'dotenv';
import { z } from 'zod';

config();

const firebaseConfigPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = existsSync(firebaseConfigPath)
  ? JSON.parse(readFileSync(firebaseConfigPath, 'utf-8'))
  : {};

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_BASE_URL: z.string().default('http://localhost:8080'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  FIREBASE_PROJECT_ID: z.string().default(firebaseConfig.projectId ?? ''),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_WEB_API_KEY: z.string().default(firebaseConfig.apiKey ?? ''),
  FIRESTORE_EMULATOR_HOST: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  PYTEST_TIMEOUT: z.coerce.number().default(7000),
  PYTEST_RUNNER_MODE: z.enum(['mock', 'python']).default('mock'),
  JWT_SECRET: z.string().default('vibecode_secret_123_change_me'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
}

export const env = {
  ...parsed.data,
  FIREBASE_PRIVATE_KEY: parsed.data.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};
