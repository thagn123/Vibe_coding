export type ChallengeDifficulty = 'Easy' | 'Medium' | 'Hard';
export type ChallengeStatus = 'draft' | 'published' | 'archived';

export interface BugChallengeRecord {
  id: string;
  title: string;
  description: string;
  difficulty: ChallengeDifficulty;
  category: string;
  language: string;
  starterCode: string;
  expectedBehavior: string;
  tags: string[];
  status: ChallengeStatus;
  points: number;
  entryFunction: string;
  referenceSolution: string;
  createdAt: string;
}

export interface BugHintRecord {
  id: string;
  challengeId: string;
  level: 1 | 2 | 3;
  hintText: string;
  createdAt: string;
}

export interface BugTestCaseRecord {
  id: string;
  challengeId: string;
  inputData: unknown[];
  expectedOutput: unknown;
  hidden: boolean;
  order: number;
}

export interface BugSubmissionRecord {
  id: string;
  userId: string;
  challengeId: string;
  submittedCode: string;
  pytestResult: string;
  passed: boolean;
  passedCount: number;
  failedCount: number;
  logs: string[];
  runtimeMs: number;
  createdAt: string;
}

export interface PytestRunResult {
  passed: boolean;
  passedCount: number;
  failedCount: number;
  logs: string[];
  runtimeMs: number;
  errorSummary: string | null;
}
