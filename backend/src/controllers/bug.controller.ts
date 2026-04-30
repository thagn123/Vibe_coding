import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { bugService } from '../services/bug.service';
import { randomUUID } from 'crypto';

// ── Badge definitions ─────────────────────────────────────────────────────────
const BADGE_DEFS = [
  { id: 'first_blood',   name: 'First Blood',    icon: 'zap',     desc: 'Completed your first challenge',   condition: (solved: number) => solved === 1 },
  { id: 'bug_hunter',    name: 'Bug Hunter',     icon: 'target',  desc: 'Solved 5 challenges',              condition: (solved: number) => solved >= 5 },
  { id: 'debug_master',  name: 'Debug Master',   icon: 'trophy',  desc: 'Solved 10 challenges',             condition: (solved: number) => solved >= 10 },
  { id: 'hard_slayer',   name: 'Hard Slayer',    icon: 'award',   desc: 'Completed a Hard challenge',       condition: (_s: number, diff?: string) => diff === 'Hard' },
  { id: 'no_hint_hero',  name: 'No Hint Hero',   icon: 'star',    desc: 'Passed without using any hints',   condition: (_s: number, _d?: string, noHint?: boolean) => !!noHint },
  { id: 'speed_coder',   name: 'Speed Coder',    icon: 'zap',     desc: 'Solved on the first attempt',      condition: (_s: number, _d?: string, _n?: boolean, firstTry?: boolean) => !!firstTry },
];

// Award any new badges the user hasn't earned yet
async function awardBadges(
  uid: string,
  totalSolved: number,
  difficulty: string,
  noHint: boolean,
  firstTry: boolean
): Promise<Array<{ id: string; name: string; icon: string; desc: string }>> {
  // Fetch already earned badges
  const existingSnap = await db.collection('achievements')
    .where('userId', '==', uid)
    .get();
  const existingIds = new Set(existingSnap.docs.map(d => d.data().badgeId as string));

  const earned: Array<{ id: string; name: string; icon: string; desc: string }> = [];

  for (const badge of BADGE_DEFS) {
    if (existingIds.has(badge.id)) continue; // already earned
    if (badge.condition(totalSolved, difficulty, noHint, firstTry)) {
      const docId = randomUUID();
      await db.collection('achievements').doc(docId).set({
        id: docId,
        userId: uid,
        badgeId: badge.id,
        name: badge.name,
        icon: badge.icon,
        description: badge.desc,
        earnedAt: new Date().toISOString(),
      });
      earned.push({ id: badge.id, name: badge.name, icon: badge.icon, desc: badge.desc });
    }
  }

  return earned;
}

// ── Controllers ───────────────────────────────────────────────────────────────
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = [
      { id: 'basics',         title: 'Basics',          description: 'Fundamental programming bugs',   icon: 'Code' },
      { id: 'loops',          title: 'Loops',            description: 'Iteration and loop logic',        icon: 'Repeat' },
      { id: 'conditions',     title: 'Conditions',       description: 'If-else and boolean logic',       icon: 'GitBranch' },
      { id: 'functions',      title: 'Functions',        description: 'Scope and return bugs',           icon: 'Box' },
      { id: 'arrays',         title: 'Arrays',           description: 'Index and mutation bugs',         icon: 'List' },
      { id: 'strings',        title: 'Strings',          description: 'String manipulation bugs',        icon: 'Type' },
      { id: 'dictionary',     title: 'Dictionaries',     description: 'Key errors and mutation',         icon: 'Book' },
      { id: 'error-handling', title: 'Error Handling',   description: 'Exceptions and try-catch',        icon: 'AlertTriangle' },
      { id: 'async',          title: 'Async',            description: 'Concurrency and promises',        icon: 'Clock' },
      { id: 'logic',          title: 'Logic Gates',      description: 'Complex boolean logic',           icon: 'Cpu' },
    ];
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const getChallenges = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;
    let query: FirebaseFirestore.Query = db.collection('bug_challenges');
    if (category) {
      query = query.where('category', '==', category);
    }
    const snapshot = await query.get();
    const challenges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: challenges });
  } catch (error) {
    next(error);
  }
};

export const getChallengeById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id?.trim().toLowerCase();
    const uid = req.user?.uid;

    const doc = await db.collection('bug_challenges').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    let savedCode = undefined;
    let progressStatus = 'not_started';
    if (uid) {
      const progressDoc = await db.collection('learning_progress').doc(`${uid}_${id}`).get();
      if (progressDoc.exists) {
        savedCode = progressDoc.data()?.lastCode;
        progressStatus = progressDoc.data()?.status ?? 'not_started';
      }
    }

    res.json({ success: true, data: { id: doc.id, ...doc.data(), savedCode, progressStatus } });
  } catch (error) {
    next(error);
  }
};

export const getHints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id?.trim().toLowerCase();
    const snapshot = await db.collection('bug_hints')
      .where('challengeId', '==', id)
      .get();
    const hints = snapshot.docs.map(doc => doc.data()).sort((a, b) => a.level - b.level);
    res.json({ success: true, data: hints });
  } catch (error) {
    next(error);
  }
};

export const saveProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { challengeId, code } = req.body;
    const uid = req.user!.uid;

    await db.collection('learning_progress').doc(`${uid}_${challengeId}`).set({
      userId: uid,
      moduleType: 'bug_challenge',
      itemId: challengeId,
      lastCode: code,
      status: 'in_progress',
      updatedAt: new Date().toISOString()
    }, { merge: true });

    res.json({ success: true, data: { status: 'saved' } });
  } catch (error) {
    next(error);
  }
};

export const submitSolution = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { challengeId, code, hintsUsed = 0, attempts = 1 } = req.body;
    const uid = req.user!.uid;

    // 1. Fetch challenge
    const challengeDoc = await db.collection('bug_challenges').doc(challengeId).get();
    if (!challengeDoc.exists) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }
    const challengeData = challengeDoc.data()!;

    // 2. XP calculation (difficulty-based)
    const difficultyXP = challengeData.difficulty === 'Hard' ? 40
      : challengeData.difficulty === 'Medium' ? 20 : 10;
    const baseXP = challengeData.points ?? difficultyXP;

    // 4. Check duplicate completion
    const progressRef = db.collection('learning_progress').doc(`${uid}_${challengeId}`);
    const progressDoc = await progressRef.get();
    const alreadyCompleted = progressDoc.exists && progressDoc.data()?.status === 'completed';
    const previousAttempts = progressDoc.data()?.attempts ?? 0;

    // 3. Bonus XP (Determine based on real history)
    const firstTry = previousAttempts === 0;
    const noHint = Number(hintsUsed) === 0;
    const firstTryBonus = firstTry ? 5 : 0;
    const noHintBonus = noHint ? 5 : 0;
    const totalBonusXP = firstTryBonus + noHintBonus;
    const totalXP = baseXP + totalBonusXP;

    // 5. Mark progress as completed
    await progressRef.set({
      userId: uid,
      moduleType: 'bug_challenge',
      itemId: challengeId,
      status: 'completed',
      lastCode: code,
      attempts: previousAttempts + 1,
      hintsUsed: Number(hintsUsed),
      completedAt: alreadyCompleted ? progressDoc.data()?.completedAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // 6. Add submission record
    await db.collection('bug_submissions').add({
      userId: uid,
      challengeId,
      challengeTitle: challengeData.title,
      difficulty: challengeData.difficulty,
      submittedCode: code,
      passed: true,
      earnedXP: alreadyCompleted ? 0 : totalXP,
      baseXP: alreadyCompleted ? 0 : baseXP,
      bonusXP: alreadyCompleted ? 0 : totalBonusXP,
      hintsUsed: Number(hintsUsed),
      firstTry,
      createdAt: new Date().toISOString()
    });

    // 7. Update user XP/level (only if first completion)
    let levelUp = false;
    let newLevel = 1;
    let newTotalXP = 0;
    let totalSolved = 0;

    if (!alreadyCompleted) {
      const userRef = db.collection('users').doc(uid);
      const profileRef = db.collection('user_profiles').doc(uid);

      await db.runTransaction(async (tx) => {
        const [userSnap, profileSnap] = await Promise.all([
          tx.get(userRef),
          tx.get(profileRef),
        ]);

        const prevXP = userSnap.data()?.experience ?? 0;
        const prevLevel = profileSnap.data()?.level ?? 1;
        newTotalXP = prevXP + totalXP;
        newLevel = Math.floor(newTotalXP / 100) + 1;
        levelUp = newLevel > prevLevel;
        totalSolved = (profileSnap.data()?.totalSolved ?? 0) + 1;

        tx.update(userRef, {
          experience: newTotalXP,
          level: newLevel,
          updatedAt: new Date().toISOString(),
        });
        tx.update(profileRef, {
          level: newLevel,
          totalSolved,
          updatedAt: new Date().toISOString(),
        });
      });
    } else {
      // Read current state for response
      const [userSnap, profileSnap] = await Promise.all([
        db.collection('users').doc(uid).get(),
        db.collection('user_profiles').doc(uid).get(),
      ]);
      newTotalXP = userSnap.data()?.experience ?? 0;
      newLevel = profileSnap.data()?.level ?? 1;
      totalSolved = profileSnap.data()?.totalSolved ?? 0;
    }

    // 8. Award badges (only if first completion)
    let badgesEarned: Array<{ id: string; name: string; icon: string; desc: string }> = [];
    if (!alreadyCompleted) {
      try {
        badgesEarned = await awardBadges(
          uid,
          totalSolved,
          challengeData.difficulty ?? 'Easy',
          noHint,
          firstTry
        );
      } catch (badgeErr) {
        console.error('Badge award failed (non-critical):', badgeErr);
      }
    }

    // 9. Create notification for completion
    if (!alreadyCompleted) {
      await db.collection('notifications').add({
        id: randomUUID(),
        userId: uid,
        message: `"${challengeData.title}" solved! +${totalXP} XP${levelUp ? ` · Level Up → ${newLevel}` : ''}`,
        type: 'success',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: {
        status: 'completed',
        passed: true,
        earnedXP: alreadyCompleted ? 0 : totalXP,
        baseXP: alreadyCompleted ? 0 : baseXP,
        bonusXP: alreadyCompleted ? 0 : totalBonusXP,
        bonusBreakdown: {
          firstTryBonus: alreadyCompleted ? 0 : firstTryBonus,
          noHintBonus: alreadyCompleted ? 0 : noHintBonus,
        },
        newTotalXP,
        newLevel,
        levelUp,
        badgesEarned,
        alreadyCompleted,
        message: alreadyCompleted
          ? 'Already completed — no duplicate XP awarded.'
          : `Challenge complete! +${totalXP} XP earned.`,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const runCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { challengeId, code } = req.body;
    const result = await bugService.runChallenge({ challengeId, code });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
