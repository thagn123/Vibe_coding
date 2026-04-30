export type AssistantModuleType = 'find_bug' | 'prompt' | 'general';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface AiConversationRecord {
  id: string;
  userId: string;
  moduleType: AssistantModuleType;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}
