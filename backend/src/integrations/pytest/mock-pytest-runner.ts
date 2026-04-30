import type { PytestRunner } from './pytest.types';
import type { PytestRunResult } from '../../models/bug.model';
import { normalizeCode } from '../../utils/sanitize';

export class MockPytestRunner implements PytestRunner {
  async run({
    challenge,
    code,
    testCases,
  }: {
    challenge: { referenceSolution: string };
    code: string;
    testCases: { hidden: boolean }[];
  }): Promise<PytestRunResult> {
    const normalizedCode = normalizeCode(code);
    const normalizedSolution = normalizeCode(challenge.referenceSolution);
    const totalCount = testCases.length;

    if (normalizedCode === normalizedSolution) {
      return {
        passed: true,
        passedCount: totalCount,
        failedCount: 0,
        logs: ['Mock runner: all assertions passed against the reference signature.'],
        runtimeMs: 42,
        errorSummary: null,
      };
    }

    const visibleCount = testCases.filter((testCase) => !testCase.hidden).length;
    const passedCount = Math.max(0, Math.min(visibleCount, Math.floor(totalCount / 3)));

    return {
      passed: false,
      passedCount,
      failedCount: totalCount - passedCount,
      logs: [
        'Mock runner: result differs from the reference solution.',
        'Check loop conditions, return values, and edge-case handling.',
      ],
      runtimeMs: 61,
      errorSummary: 'Tests failed. The implementation does not satisfy expected behavior yet.',
    };
  }
}
