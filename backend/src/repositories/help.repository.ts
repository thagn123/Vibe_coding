import { COLLECTIONS } from '../constants/collections';
import type { FaqRecord } from '../models/help.model';
import { FirestoreRepository } from './firestore.repository';

export const faqRepository = new FirestoreRepository<FaqRecord>(COLLECTIONS.FAQ);
