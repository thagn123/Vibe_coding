import 'dotenv/config';
import admin from 'firebase-admin';
import { db } from '../config/firebase';

const sampleChallenges = [
  {
    challengeId: "challenge_1",
    title: "Sum Array Elements",
    description: "Fix the loop to properly sum all elements in the array.",
    difficulty: "Easy",
    category: "loops",
    starterCode: "def sum_array(arr):\n    total = 0\n    for i in range(len(arr)):\n        total = arr[i]\n    return total",
    expectedBehavior: "Should return the sum of all elements.",
    tags: ["python", "loop", "bug"],
    status: "active",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }
];

const sampleTestCases = [
  {
    testCaseId: "tc_1_1",
    challengeId: "challenge_1",
    inputData: "[1, 2, 3]",
    expectedOutput: "6",
    hidden: false,
    order: 1
  }
];

async function seed() {
  console.log("Seeding data...");
  try {
    for (const challenge of sampleChallenges) {
      await db.collection('bug_challenges').doc(challenge.challengeId).set(challenge);
    }
    for (const tc of sampleTestCases) {
      await db.collection('bug_test_cases').doc(tc.testCaseId).set(tc);
    }
    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding data:", err);
    process.exit(1);
  }
}

seed();
