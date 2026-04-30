export type UserRole = 'user' | 'admin';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'saved';

export interface UserRecord {
  id: string;
  email: string;
  username: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  experience: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileRecord {
  id: string;
  avatarUrl: string | null;
  bio: string;
  level: number;
  streak: number;
  totalSolved: number;
  totalPromptsSaved: number;
  location: string;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningProgressRecord {
  id: string;
  userId: string;
  moduleType: 'bug' | 'prompt' | 'assistant' | 'general';
  itemId: string;
  status: ProgressStatus;
  score: number;
  attempts: number;
  lastCode?: string;
  completedAt?: string | null;
  updatedAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  isRead: boolean;
  createdAt: string;
}

export interface AchievementRecord {
  id: string;
  userId: string;
  name: string;
  icon: string;
  earnedAt: string;
}
