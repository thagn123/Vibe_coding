import React, { createContext, useContext, useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { apiRequest, authStorage } from '../lib/api';
import { User as AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  token: string | null;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { email: string; password: string; username: string; displayName?: string }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  token: null,
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(authStorage.getToken());

  const fetchCurrentUser = async (nextToken: string) => {
    console.log('[AuthContext] Fetching enriched user data with new token');
    authStorage.setToken(nextToken);
    setToken(nextToken);
    const currentUser = await apiRequest<AppUser>('/api/auth/me', {}, true);
    console.log('[AuthContext] User profile loaded:', currentUser.email);
    setUser(currentUser);
  };

  useEffect(() => {
    const boot = async () => {
      const storedToken = authStorage.getToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        setToken(storedToken);
        console.log('[AuthContext] Restoring session from stored token...');
        const currentUser = await apiRequest<AppUser>('/api/auth/me', {}, true);
        console.log('[AuthContext] Session restored for:', currentUser.email);
        setUser(currentUser);
      } catch (err) {
        console.warn('[AuthContext] Stored token invalid or expired, clearing session');
        authStorage.clearToken();
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    };

    void boot();
  }, []);

  const login = async (input: { email: string; password: string }) => {
    const response = await apiRequest<{ user: AppUser; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        provider: 'password',
      }),
    });
    await fetchCurrentUser(response.token);
  };

  const register = async (input: { email: string; password: string; username: string; displayName?: string }) => {
    const response = await apiRequest<{ user: AppUser; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    await fetchCurrentUser(response.token);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();

    const response = await apiRequest<{ user: AppUser; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'google',
        idToken,
      }),
    });
    await fetchCurrentUser(response.token);
  };

  const refreshUser = async () => {
    const storedToken = authStorage.getToken();
    if (!storedToken) return;
    try {
      const currentUser = await apiRequest<AppUser>('/api/auth/me', {}, true);
      setUser(currentUser);
    } catch {
      // Silently fail – user state stays as is
    }
  };

  const logout = async () => {
    const currentToken = authStorage.getToken();
    if (currentToken) {
      try {
        await apiRequest('/api/auth/logout', { method: 'POST' }, true);
      } catch {
        // ignore logout API failure and clear client state anyway
      }
    }

    authStorage.clearToken();
    setToken(null);
    setUser(null);
    await signOut(auth).catch(() => undefined);
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, register, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
