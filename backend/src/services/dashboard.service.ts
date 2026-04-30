import { getFirestore } from '../integrations/firebase/firebase-admin';
import { userProfileRepository, userRepository } from '../repositories/user.repository';
import { AppError } from '../utils/app-error';

class DashboardService {
  async summary(userId: string) {
    const db = getFirestore();

    const [user, profile, submissions, prompts, notifications] = await Promise.all([
      userRepository.getById(userId),
      userProfileRepository.getById(userId),
      db.collection('bug_submissions').where('userId', '==', userId).get(),
      db.collection('prompt_templates').where('userId', '==', userId).get(),
      db.collection('notifications').where('userId', '==', userId).limit(20).get(),
    ]);

    if (!user || !profile) {
      throw new AppError('Dashboard profile not found.', 404, 'PROFILE_NOT_FOUND');
    }

    const solved = submissions.docs.filter((doc: any) => doc.data().passed).length;

    // Enrich submission records with challenge titles
    const submissionItems = await Promise.all(
      submissions.docs
        .sort((a: any, b: any) => String(b.data().createdAt ?? '').localeCompare(String(a.data().createdAt ?? '')))
        .slice(0, 6)
        .map(async (doc: any) => {
          const data = doc.data();
          // Use stored challengeTitle first (from new submissions), fallback to Firestore join
          let title = data.challengeTitle
            ? `Solved: ${data.challengeTitle}`
            : `Submitted: ${data.challengeId}`;

          if (!data.challengeTitle) {
            try {
              const challengeDoc = await db.collection('bug_challenges').doc(data.challengeId).get();
              if (challengeDoc.exists) {
                title = `Solved: ${challengeDoc.data()?.title ?? data.challengeId}`;
              }
            } catch {
              // keep default title
            }
          }

          return {
            id: doc.id,
            type: 'bug' as const,
            title,
            xp: data.earnedXP ?? 0,
            passed: data.passed ?? true,
            difficulty: data.difficulty,
            createdAt: data.createdAt,
          };
        })
    );

    const promptItems = prompts.docs
      .sort((a: any, b: any) => String(b.data().createdAt ?? '').localeCompare(String(a.data().createdAt ?? '')))
      .slice(0, 3)
      .map((doc: any) => ({
        id: doc.id,
        type: 'prompt' as const,
        title: doc.data().title ?? 'Prompt Lab Session',
        xp: 0,
        passed: true,
        createdAt: doc.data().createdAt,
      }));

    const recentActivity = [...submissionItems, ...promptItems]
      .sort((left: any, right: any) => String(right.createdAt ?? '').localeCompare(String(left.createdAt ?? '')))
      .slice(0, 8);

    // Current XP metrics
    const totalXP = user.experience ?? 0;
    const currentLevel = Math.floor(totalXP / 100) + 1;
    const xpInLevel = totalXP % 100;

    return {
      profile: {
        displayName: user.displayName,
        experience: totalXP,
        level: currentLevel,
        xpInLevel,
        xpForNextLevel: 100,
        progressPct: xpInLevel,
        streak: profile.streak ?? 0,
        totalSolved: profile.totalSolved ?? solved,
      },
      stats: {
        bugsFound: solved,
        promptsSaved: prompts.size,
        labSessions: submissions.size + prompts.size,
      },
      recentActivity,
      notifications: notifications.docs
        .map((doc: any) => doc.data())
        .sort((a: any, b: any) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .slice(0, 5),
    };
  }

  async recommendations(userId: string) {
    const db = getFirestore();

    // 1. Get challenges the user has already completed or is in-progress
    const progressSnap = await db
      .collection('learning_progress')
      .where('userId', '==', userId)
      .get();

    const doneIds = new Set<string>();
    const inProgressIds: string[] = [];
    for (const doc of progressSnap.docs) {
      const data = doc.data();
      if (data.status === 'completed') doneIds.add(data.itemId);
      if (data.status === 'in_progress') inProgressIds.push(data.itemId);
    }

    const items: Array<{
      type: string;
      challenge: Record<string, unknown>;
      reason: string;
    }> = [];

    // 2. First: resume in-progress challenges
    if (inProgressIds.length > 0) {
      const inProgressDocs = await Promise.all(
        inProgressIds.slice(0, 2).map(id => db.collection('bug_challenges').doc(id).get())
      );
      for (const doc of inProgressDocs) {
        if (doc.exists) {
          items.push({
            type: 'challenge',
            challenge: { id: doc.id, ...doc.data() },
            reason: 'Resume where you left off — you were close!',
          });
        }
      }
    }

    // 3. Then: new challenges not yet started (prefer Easy if new user, else Medium)
    if (items.length < 3) {
      const userDoc = await db.collection('users').doc(userId).get();
      const xp = userDoc.data()?.experience ?? 0;
      const targetDifficulty = xp < 50 ? 'Easy' : xp < 200 ? 'Medium' : 'Hard';

      const newChallengesSnap = await db
        .collection('bug_challenges')
        .where('difficulty', '==', targetDifficulty)
        .limit(10)
        .get();

      const newChallenges = newChallengesSnap.docs
        .filter(doc => !doneIds.has(doc.id))
        .slice(0, 3 - items.length);

      for (const doc of newChallenges) {
        items.push({
          type: 'challenge',
          challenge: { id: doc.id, ...doc.data() },
          reason: `A fresh ${targetDifficulty} challenge tailored to your current level.`,
        });
      }
    }

    // 4. Fallback: any un-attempted challenge
    if (items.length === 0) {
      const fallbackSnap = await db.collection('bug_challenges').limit(3).get();
      for (const doc of fallbackSnap.docs) {
        if (!doneIds.has(doc.id)) {
          items.push({
            type: 'challenge',
            challenge: { id: doc.id, ...doc.data() },
            reason: 'Start debugging and earn your first XP!',
          });
        }
      }
    }

    return { items };
  }

  async notifications(userId: string) {
    const db = getFirestore();
    const snapshot = await db
      .collection('notifications')
      .where('userId', '==', userId)
      .get();

    return snapshot.docs
      .map((doc: any) => doc.data())
      .sort((a: any, b: any) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }
}

export const dashboardService = new DashboardService();
