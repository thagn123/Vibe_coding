import { randomUUID } from 'node:crypto';
import { getAuth, getFirestore } from '../integrations/firebase/firebase-admin';
import { seedChallenges, seedFaq, seedHints, seedTestCases, seedUsers } from './data';

const now = () => new Date().toISOString();

const seed = async () => {
  const auth = getAuth();
  const db = getFirestore();

  const userIdByEmail = new Map<string, string>();

  for (const userInput of seedUsers) {
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(userInput.email);
    } catch {
      userRecord = await auth.createUser({
        email: userInput.email,
        password: userInput.password,
        displayName: userInput.displayName,
      });
    }

    userIdByEmail.set(userInput.email, userRecord.uid);

    await db.collection('users').doc(userRecord.uid).set(
      {
        id: userRecord.uid,
        email: userInput.email,
        username: userInput.username,
        displayName: userInput.displayName,
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userInput.username)}`,
        role: userInput.role ?? 'user',
        experience: userInput.role === 'admin' ? 560 : 120,
        createdAt: now(),
        updatedAt: now(),
      },
      { merge: true },
    );

    await db.collection('user_profiles').doc(userRecord.uid).set(
      {
        id: userRecord.uid,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userInput.username)}`,
        bio: userInput.bio,
        level: userInput.role === 'admin' ? 6 : 2,
        streak: userInput.role === 'admin' ? 7 : 3,
        totalSolved: userInput.role === 'admin' ? 8 : 2,
        totalPromptsSaved: userInput.role === 'admin' ? 5 : 2,
        location: 'Silicon Valley, CA',
        lastActiveAt: now(),
        createdAt: now(),
        updatedAt: now(),
      },
      { merge: true },
    );
  }

  for (const challenge of seedChallenges) {
    await db.collection('bug_challenges').doc(challenge.id).set({
      ...challenge,
      createdAt: now(),
    });
  }

  for (const [index, [challengeId, level, hintText]] of seedHints.entries()) {
    await db.collection('bug_hints').doc(`hint-${index + 1}`).set({
      id: `hint-${index + 1}`,
      challengeId,
      level,
      hintText,
      createdAt: now(),
    });
  }

  for (const [index, [challengeId, inputData, expectedOutput, hidden, order]] of seedTestCases.entries()) {
    await db.collection('bug_test_cases').doc(`test-${index + 1}`).set({
      id: `test-${index + 1}`,
      challengeId,
      inputData: JSON.stringify(inputData),
      expectedOutput: JSON.stringify(expectedOutput),
      hidden,
      order,
    });
  }

  const alexId = userIdByEmail.get('alex@vibecode.dev')!;
  const mayaId = userIdByEmail.get('maya@vibecode.dev')!;

  for (let index = 0; index < 10; index += 1) {
    const ownerId = index % 2 === 0 ? alexId : mayaId;
    await db.collection('prompt_templates').doc(`prompt-template-${index + 1}`).set({
      id: `prompt-template-${index + 1}`,
      userId: ownerId,
      title: `Prompt Template ${index + 1}`,
      category: index % 2 === 0 ? 'debug' : 'learning',
      originalPrompt: `Help me improve workflow ${index + 1}`,
      improvedPrompt: `You are a senior engineer. Improve workflow ${index + 1} with constraints, explicit outputs, and edge cases.`,
      role: 'senior engineer',
      detailLevel: index % 3 === 0 ? 'high' : 'medium',
      createdAt: now(),
    });
  }

  for (let index = 0; index < 10; index += 1) {
    const [question, answer, category] = seedFaq[index];
    await db.collection('faq').doc(`faq-${index + 1}`).set({
      id: `faq-${index + 1}`,
      question,
      answer,
      category,
    });
  }

  const progressSeed = [
    [alexId, 'bug-js-001', 'completed', 100, 1],
    [alexId, 'bug-js-003', 'in_progress', 40, 2],
    [mayaId, 'bug-js-002', 'completed', 100, 1],
    [mayaId, 'bug-ts-004', 'saved', 0, 0],
  ] as const;

  for (const [userId, itemId, status, score, attempts] of progressSeed) {
    await db.collection('learning_progress').doc(`${userId}_${itemId}`).set({
      id: `${userId}_${itemId}`,
      userId,
      moduleType: 'bug',
      itemId,
      status,
      score,
      attempts,
      lastCode: seedChallenges.find((challenge) => challenge.id === itemId)?.starterCode ?? '',
      completedAt: status === 'completed' ? now() : null,
      updatedAt: now(),
    });
  }

  await db.collection('bug_submissions').doc('submission-1').set({
    id: 'submission-1',
    userId: alexId,
    challengeId: 'bug-js-001',
    submittedCode: seedChallenges[0].referenceSolution,
    pytestResult: 'passed',
    passed: true,
    passedCount: 3,
    failedCount: 0,
    logs: ['All tests passed.'],
    runtimeMs: 33,
    createdAt: now(),
  });

  await db.collection('achievements').doc('achievement-1').set({
    id: 'achievement-1',
    userId: alexId,
    name: 'Speedster',
    icon: 'zap',
    earnedAt: now(),
  });
  await db.collection('achievements').doc('achievement-2').set({
    id: 'achievement-2',
    userId: mayaId,
    name: 'Top Solver',
    icon: 'award',
    earnedAt: now(),
  });

  await db.collection('notifications').doc('notification-1').set({
    id: 'notification-1',
    userId: alexId,
    message: 'Welcome back. New Medium challenge available in the forge.',
    type: 'info',
    isRead: false,
    createdAt: now(),
  });

  await db.collection('notifications').doc('notification-2').set({
    id: 'notification-2',
    userId: mayaId,
    message: 'Prompt Lab saved a new template successfully.',
    type: 'success',
    isRead: false,
    createdAt: now(),
  });

  await db.collection('ai_conversations').doc('conversation-1').set({
    id: 'conversation-1',
    userId: alexId,
    moduleType: 'find_bug',
    messages: [
      { role: 'user', content: 'I think the loop never exits.', createdAt: now() },
      { role: 'assistant', content: 'Good direction. Track which statement prevents the counter from advancing.', createdAt: now() },
    ],
    createdAt: now(),
    updatedAt: now(),
  });

  console.log('Seed completed successfully.');
  process.exit(0);
};

seed().catch((error) => {
  console.error('Seed failed.', error);
  process.exit(1);
});
