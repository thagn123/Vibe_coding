import { apiRequest } from '../lib/api';

export async function getBugHint(
  challengeId: string,
  challengeTitle: string,
  code: string,
  userMessage: string,
  conversationId?: string,
) {
  const response = await apiRequest<{ conversationId: string; reply: string }>('/api/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({
      conversationId,
      moduleType: 'find_bug',
      message: userMessage,
      context: {
        challengeId,
        challengeTitle,
        currentCode: code,
      },
    }),
  }, true);

  return response;
}

export async function refinePrompt(rawPrompt: string) {
  const response = await apiRequest<{ improvedPrompt: string; rationale: string }>('/api/prompts/improve', {
    method: 'POST',
    body: JSON.stringify({
      prompt: rawPrompt,
      goal: 'write better prompts',
      role: 'prompt engineer',
      detailLevel: 'high',
    }),
  }, true);

  return `## Refined Prompt\n\n${response.improvedPrompt}\n\n## Key Optimizations\n\n- ${response.rationale}`;
}
