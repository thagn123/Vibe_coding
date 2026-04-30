import { COLLECTIONS } from '../constants/collections';
import type {
  AchievementRecord,
  LearningProgressRecord,
  NotificationRecord,
  UserProfileRecord,
  UserRecord,
} from '../models/user.model';
import { FirestoreRepository } from './firestore.repository';

export const userRepository = new FirestoreRepository<UserRecord>(COLLECTIONS.USERS);
export const userProfileRepository = new FirestoreRepository<UserProfileRecord>(COLLECTIONS.USER_PROFILES);
export const learningProgressRepository =
  new FirestoreRepository<LearningProgressRecord>(COLLECTIONS.LEARNING_PROGRESS);
export const notificationRepository = new FirestoreRepository<NotificationRecord>(COLLECTIONS.NOTIFICATIONS);
export const achievementRepository = new FirestoreRepository<AchievementRecord>(COLLECTIONS.ACHIEVEMENTS);
