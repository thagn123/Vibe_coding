import { COLLECTIONS } from '../constants/collections';
import type { AiConversationRecord } from '../models/assistant.model';
import { FirestoreRepository } from './firestore.repository';

export const aiConversationRepository =
  new FirestoreRepository<AiConversationRecord>(COLLECTIONS.AI_CONVERSATIONS);
