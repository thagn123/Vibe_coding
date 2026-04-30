import { env } from '../../config/env';
import { AppError } from '../../utils/app-error';

interface SignInResponse {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  email: string;
}

const callIdentityToolkit = async <T>(path: string, payload: Record<string, unknown>): Promise<T> => {
  if (!env.FIREBASE_WEB_API_KEY) {
    throw new AppError('Firebase web API key is missing.', 500, 'FIREBASE_WEB_API_KEY_MISSING');
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/${path}?key=${env.FIREBASE_WEB_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );

  const json = (await response.json()) as { error?: { message?: string } } & T;
  if (!response.ok) {
    throw new AppError(json.error?.message ?? 'Firebase auth request failed.', 401, 'AUTH_PROVIDER_ERROR', json);
  }

  return json;
};

export const signInWithEmailAndPassword = (email: string, password: string) =>
  callIdentityToolkit<SignInResponse>('accounts:signInWithPassword', {
    email,
    password,
    returnSecureToken: true,
  });
