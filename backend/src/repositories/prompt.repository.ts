import { COLLECTIONS } from '../constants/collections';
import type { PromptHistoryRecord, PromptTemplateRecord } from '../models/prompt.model';
import { FirestoreRepository } from './firestore.repository';

export const promptTemplateRepository =
  new FirestoreRepository<PromptTemplateRecord>(COLLECTIONS.PROMPT_TEMPLATES);
export const promptHistoryRepository = new FirestoreRepository<PromptHistoryRecord>(COLLECTIONS.PROMPT_HISTORY);
