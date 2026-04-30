export interface PromptTemplateRecord {
  id: string;
  userId: string;
  title: string;
  category: string;
  originalPrompt: string;
  improvedPrompt: string;
  role: string;
  detailLevel: string;
  createdAt: string;
}

export interface PromptHistoryRecord {
  id: string;
  userId: string;
  inputPrompt: string;
  outputPrompt: string;
  goal: string;
  role: string;
  detailLevel: string;
  createdAt: string;
}
