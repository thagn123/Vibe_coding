export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface User {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
  username?: string;
  role?: string;
  experience: number;
  level: number;
  streak?: number;
  totalSolved?: number;
  totalPromptsSaved?: number;
  bio?: string;
  location?: string;
  createdAt: string;
}

// Alias for clarity across contexts
export type AppUser = User;

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  language: string;
  buggyCode: string;
  starterCode?: string;
  expectedBehavior?: string;
  tags?: string[];
  status?: string;
  solution?: string;
  testCases?: string;
  points: number;
  savedCode?: string;
  progress?: UserChallengeProgress | null;
}

export interface UserChallengeProgress {
  id?: string;
  userId: string;
  challengeId?: string;
  itemId?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'saved';
  attempts: number;
  lastCode?: string;
  score?: number;
  completedAt?: string;
  updatedAt?: string;
}

export interface PromptLab {
  id: string;
  userId: string;
  title: string;
  basePrompt: string;
  refinedPrompt: string;
  output: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface DashboardSummary {
  profile: {
    displayName: string;
    experience: number;
    level: number;
    xpInLevel: number;
    progressPct: number;
    streak: number;
    totalSolved: number;
  };
  stats: {
    bugsFound: number;
    promptsSaved: number;
    labSessions: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'bug' | 'prompt';
    title: string;
    createdAt: string;
  }>;
  notifications: Array<{
    id: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
  }>;
}

export interface Recommendation {
  type: 'challenge' | 'prompt';
  challenge: Challenge;
  reason: string;
}

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  earnedAt: string;
}
