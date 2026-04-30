import { env } from '../config/env';
import { MockPytestRunner } from '../integrations/pytest/mock-pytest-runner';
import { PythonPytestRunner } from '../integrations/pytest/python-pytest-runner';

export class PytestRunnerService {
  readonly runner = env.PYTEST_RUNNER_MODE === 'python' ? new PythonPytestRunner() : new MockPytestRunner();
}

export const pytestRunnerService = new PytestRunnerService();
