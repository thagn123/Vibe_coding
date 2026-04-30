import { getFirestore } from '../integrations/firebase/firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const now = () => new Date().toISOString();

const seedPythonBugs = async () => {
  const db = getFirestore();
  const bugs1 = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'backend/src/seed/python_bugs.json'), 'utf8'));
  const bugs2 = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'backend/src/seed/python_bugs_2.json'), 'utf8'));
  const bugs3 = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'backend/src/seed/python_bugs_3.json'), 'utf8'));

  const allBugs = [...bugs1, ...bugs2, ...bugs3];

  for (const bug of allBugs) {
    console.log(`Seeding challenge: ${bug.title} (${bug.id})`);
    
    // Seed challenge
    await db.collection('bug_challenges').doc(bug.id).set({
      id: bug.id,
      title: bug.title,
      description: bug.description,
      difficulty: bug.difficulty,
      category: bug.category,
      language: bug.language,
      starterCode: bug.starterCode,
      expectedBehavior: bug.expectedBehavior,
      tags: bug.tags,
      status: bug.status,
      points: bug.xp,
      entryFunction: bug.entryFunction,
      createdAt: now(),
    });

    // Seed hints
    for (let i = 0; i < bug.hints.length; i++) {
      const hintId = `${bug.id}_hint_${i + 1}`;
      await db.collection('bug_hints').doc(hintId).set({
        id: hintId,
        challengeId: bug.id,
        level: i + 1,
        hintText: bug.hints[i],
        createdAt: now(),
      });
    }

    // Seed test cases
    for (let i = 0; i < bug.testCases.length; i++) {
      const tc = bug.testCases[i];
      const testId = `${bug.id}_test_${i + 1}`;
      await db.collection('bug_test_cases').doc(testId).set({
        id: testId,
        challengeId: bug.id,
        inputData: JSON.stringify(tc.input),
        expectedOutput: JSON.stringify(tc.expectedOutput),
        hidden: tc.hidden,
        order: i + 1,
      });
    }
  }

  console.log('Successfully seeded 30 Python bugs!');
  process.exit(0);
};

seedPythonBugs().catch(console.error);
