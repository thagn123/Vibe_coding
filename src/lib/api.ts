const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'vibecode_token';

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    statusCode: number;
    details?: unknown;
  };
}

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

export async function apiRequest<T>(path: string, options: RequestInit = {}, useAuth = false): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (useAuth) {
    const token = authStorage.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const json = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !json.success) {
    throw new Error(json.message || 'API request failed.');
  }

  return json.data;
}
