import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { env } from '../../config/env';
import type { BugChallengeRecord, BugTestCaseRecord, PytestRunResult } from '../../models/bug.model';
import { AppError } from '../../utils/app-error';
import type { PytestRunner } from './pytest.types';

const bannedPatterns = [
  /\bimport\s+os\b/,
  /\bimport\s+subprocess\b/,
  /\bimport\s+socket\b/,
  /\bfrom\s+os\s+import\b/,
  /\bopen\s*\(/,
  /\beval\s*\(/,
  /\bexec\s*\(/,
  /\b__import__\s*\(/,
];

const assertSafeCode = (code: string) => {
  if (bannedPatterns.some((pattern) => pattern.test(code))) {
    throw new AppError(
      'Submitted code contains blocked operations and cannot be executed.',
      400,
      'UNSAFE_CODE_DETECTED',
    );
  }
};

const buildPytestFile = (entryFunction: string, testCases: BugTestCaseRecord[]) => {
  const serializedCases = JSON.stringify(
    testCases.map((testCase) => ({
      inputData: testCase.inputData,
      expectedOutput: testCase.expectedOutput,
    })),
  );

  return `import json
import pathlib
import importlib.util
import pytest

spec = importlib.util.spec_from_file_location("user_code", pathlib.Path(__file__).with_name("user_code.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

CASES = json.loads(r'''${serializedCases}''')

@pytest.mark.parametrize("case", CASES)
def test_generated(case):
    fn = getattr(module, "${entryFunction}")
    assert fn(*case["inputData"]) == case["expectedOutput"]
`;
};

export class PythonPytestRunner implements PytestRunner {
  async run({
    challenge,
    code,
    testCases,
  }: {
    challenge: BugChallengeRecord;
    code: string;
    testCases: BugTestCaseRecord[];
  }): Promise<PytestRunResult> {
    assertSafeCode(code);

    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'vibecode-pytest-'));
    const startedAt = Date.now();

    try {
      await writeFile(path.join(tempDir, 'user_code.py'), code, 'utf-8');
      await writeFile(path.join(tempDir, 'test_user_code.py'), buildPytestFile(challenge.entryFunction, testCases), 'utf-8');

      const output = await new Promise<{ stdout: string; stderr: string; code: number | null }>((resolve, reject) => {
        const child = spawn('python', ['-I', '-m', 'pytest', '-q', 'test_user_code.py'], {
          cwd: tempDir,
          env: {},
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';

        const timeout = setTimeout(() => {
          child.kill();
          reject(new AppError('Pytest execution timed out.', 504, 'PYTEST_TIMEOUT'));
        }, env.PYTEST_TIMEOUT);

        child.stdout.on('data', (chunk) => {
          stdout += chunk.toString();
        });
        child.stderr.on('data', (chunk) => {
          stderr += chunk.toString();
        });
        child.on('close', (code) => {
          clearTimeout(timeout);
          resolve({ stdout, stderr, code });
        });
        child.on('error', reject);
      });

      const summaryText = `${output.stdout}\n${output.stderr}`.trim();
      const failedCount = (summaryText.match(/FAILED/g) ?? []).length;
      const passedCount =
        output.code === 0 ? testCases.length : Math.max(0, testCases.length - Math.max(1, failedCount));

      return {
        passed: output.code === 0,
        passedCount,
        failedCount: testCases.length - passedCount,
        logs: summaryText ? summaryText.split('\n').filter(Boolean) : ['Pytest finished without output.'],
        runtimeMs: Date.now() - startedAt,
        errorSummary: output.code === 0 ? null : 'Some pytest checks failed.',
      };
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
}
