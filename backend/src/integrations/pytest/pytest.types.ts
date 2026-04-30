import type { BugChallengeRecord, BugTestCaseRecord, PytestRunResult } from '../../models/bug.model';

export interface PytestRunner {
  run(input: {
    challenge: BugChallengeRecord;
    code: string;
    testCases: BugTestCaseRecord[];
  }): Promise<PytestRunResult>;
}
