import { getFirestore } from '../integrations/firebase/firebase-admin';
import {
  achievementRepository,
  learningProgressRepository,
  notificationRepository,
  userProfileRepository,
  userRepository,
} from '../repositories/user.repository';
import { bugSubmissionRepository } from '../repositories/bug.repository';
import { promptTemplateRepository } from '../repositories/prompt.repository';
import { AppError } from '../utils/app-error';

class UserService {
  async getProfile(userId: string) {
    const [user, profile] = await Promise.all([
      userRepository.getById(userId),
      userProfileRepository.getById(userId),
    ]);

    if (!user || !profile) {
      throw new AppError('Profile not found.', 404, 'PROFILE_NOT_FOUND');
    }

    return {
      user: {
        uid: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        photoURL: profile.avatarUrl ?? user.photoURL,
        experience: user.experience,
        role: user.role,
      },
      profile: {
        ...profile,
        totalSolved: profile.totalSolved ?? 0,
        streak: profile.streak ?? 0,
        level: profile.level ?? 1,
      },
    };
  }

  async updateProfile(
    userId: string,
    input: { displayName?: string; username?: string; avatarUrl?: string; bio?: string; location?: string },
  ) {
    const timestamp = new Date().toISOString();
    const user = await userRepository.getById(userId);
    const profile = await userProfileRepository.getById(userId);

    if (!user || !profile) {
      throw new AppError('Profile not found.', 404, 'PROFILE_NOT_FOUND');
    }

    await userRepository.upsert(userId, {
      ...user,
      displayName: input.displayName ?? user.displayName,
      username: input.username ?? user.username,
      photoURL: input.avatarUrl || user.photoURL,
      updatedAt: timestamp,
    });

    const updatedProfile = {
      ...profile,
      avatarUrl: input.avatarUrl || profile.avatarUrl,
      bio: input.bio ?? profile.bio,
      location: input.location ?? profile.location,
      updatedAt: timestamp,
      lastActiveAt: timestamp,
    };
    await userProfileRepository.upsert(userId, updatedProfile);

    return this.getProfile(userId);
  }

  async getProgress(userId: string) {
    const snapshot = await getFirestore()
      .collection('learning_progress')
      .where('userId', '==', userId)
      .get();

    const records = snapshot.docs
      .map((doc: any) => doc.data())
      .sort((a: any, b: any) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')));
    const completed = records.filter((record: any) => record.status === 'completed');

    // Enrich completed records with challenge titles
    const enriched = await Promise.all(
      records.map(async (record: any) => {
        if (!record.itemId) return record;
        try {
          const challengeDoc = await getFirestore().collection('bug_challenges').doc(record.itemId).get();
          if (challengeDoc.exists) {
            return { ...record, challengeTitle: challengeDoc.data()?.title };
          }
        } catch {
          // keep record without title
        }
        return record;
      })
    );

    return {
      items: enriched,
      stats: {
        total: records.length,
        completed: completed.length,
        inProgress: records.filter((record: any) => record.status === 'in_progress').length,
      },
    };
  }

  async getHistory(userId: string) {
    const [submissions, prompts] = await Promise.all([
      getFirestore().collection('bug_submissions').where('userId', '==', userId).get(),
      getFirestore().collection('prompt_templates').where('userId', '==', userId).get(),
    ]);

    const items = [
      ...submissions.docs.map((doc: any) => {
        const data = doc.data();
        // Use stored title from new submissions, fallback to ID
        const title = data.challengeTitle
          ? `Solved: ${data.challengeTitle}`
          : `Challenge: ${data.challengeId}`;
        return {
          id: doc.id,
          type: 'submission' as const,
          title,
          xp: data.earnedXP ?? 0,
          passed: data.passed,
          difficulty: data.difficulty,
          createdAt: data.createdAt,
        };
      }),
      ...prompts.docs.map((doc: any) => ({
        id: doc.id,
        type: 'prompt' as const,
        title: doc.data().title || 'Untitled Prompt',
        xp: 0,
        passed: true,
        createdAt: doc.data().createdAt,
      })),
    ].sort((left, right) => String(right.createdAt ?? '').localeCompare(String(left.createdAt ?? '')));

    return items.slice(0, 30);
  }

  async getAchievements(userId: string) {
    const snapshot = await getFirestore()
      .collection('achievements')
      .where('userId', '==', userId)
      .get();

    return snapshot.docs
      .map((doc: any) => {
        const data = doc.data();
        return {
          id: data.badgeId ?? data.id ?? doc.id,
          name: data.name ?? data.badgeId ?? 'Achievement',
          icon: data.icon ?? 'award',
          description: data.description ?? '',
          earnedAt: data.earnedAt ?? new Date().toISOString(),
        };
      })
      .sort((a: any, b: any) => String(b.earnedAt ?? '').localeCompare(String(a.earnedAt ?? '')));
  }
}

export const userService = new UserService();
