export interface PytestResult {
  passed: boolean;
  passedCount: number;
  failedCount: number;
  logs: string;
  runtimeMs: number;
  errorSummary?: string;
}

export class PytestRunnerService {
  static async runCode(code: string, testCases: any[]): Promise<PytestResult> {
    const startTime = Date.now();
    
    // Giả lập logic kiểm tra: Nếu code có chứa từ khoá sai hoặc không có thân hàm chuẩn
    const passed = code.includes('return') && !code.includes('pass');
    const passedCount = passed ? testCases.length : 0;
    const failedCount = testCases.length - passedCount;
    
    const logs = passed 
      ? `================ test session starts ================\nCollected ${testCases.length} items\n\nPASSED` 
      : `================ test session starts ================\nCollected ${testCases.length} items\n\nFAILED: Check your logic.`;

    const errorSummary = passed ? undefined : 'Logic verification failed.';

    return {
      passed,
      passedCount,
      failedCount,
      logs,
      runtimeMs: Date.now() - startTime + Math.floor(Math.random() * 100),
      errorSummary
    };
  }
}
