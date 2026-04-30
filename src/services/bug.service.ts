import { apiRequest } from '../lib/api';
import { Challenge } from '../types';

export const bugService = {
  getCategories: async () => {
    return apiRequest<{ id: string; title: string; description: string; icon: string }[]>('/api/bugs/categories');
  },

  getChallenges: async (category?: string) => {
    const query = category ? `?category=${category}` : '';
    return apiRequest<Challenge[]>(`/api/bugs/challenges${query}`);
  },

  getChallengeById: async (id: string, isAuthenticated: boolean) => {
    return apiRequest<Challenge>(`/api/bugs/challenges/${id}`, {}, isAuthenticated);
  },

  getHints: async (id: string) => {
    return apiRequest<{ level: number; hintText: string }[]>(`/api/bugs/challenges/${id}/hints`);
  },

  saveProgress: async (challengeId: string, code: string) => {
    return apiRequest('/api/bugs/save', {
      method: 'POST',
      body: JSON.stringify({ challengeId, code }),
    }, true);
  },

  runPytest: async (challengeId: string, code: string) => {
    return apiRequest<{
      passed: boolean;
      passedCount: number;
      failedCount: number;
      logs: string;
      runtimeMs: number;
      errorSummary?: string;
    }>('/api/bugs/run', {
      method: 'POST',
      body: JSON.stringify({ challengeId, code }),
    });
  },

  submitSolution: async (challengeId: string, code: string, hintsUsed: number = 0, attempts: number = 1) => {
    return apiRequest<{
      status: string;
      earnedXP: number;
      baseXP: number;
      bonusXP: number;
      bonusBreakdown: { firstTryBonus: number; noHintBonus: number };
      newTotalXP: number;
      levelUp: boolean;
      newLevel: number;
      badgesEarned: Array<{ id: string; name: string; icon: string; desc: string }>;
      alreadyCompleted: boolean;
    }>('/api/bugs/submit', {
      method: 'POST',
      body: JSON.stringify({ challengeId, code, hintsUsed, attempts }),
    }, true);
  }
};
