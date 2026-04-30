import { COLLECTIONS } from '../constants/collections';
import type {
  BugChallengeRecord,
  BugHintRecord,
  BugSubmissionRecord,
  BugTestCaseRecord,
} from '../models/bug.model';
import { FirestoreRepository } from './firestore.repository';

export const bugChallengeRepository = new FirestoreRepository<BugChallengeRecord>(COLLECTIONS.BUG_CHALLENGES);
export const bugHintRepository = new FirestoreRepository<BugHintRecord>(COLLECTIONS.BUG_HINTS);
export const bugTestCaseRepository = new FirestoreRepository<BugTestCaseRecord>(COLLECTIONS.BUG_TEST_CASES);
export const bugSubmissionRepository = new FirestoreRepository<BugSubmissionRecord>(COLLECTIONS.BUG_SUBMISSIONS);
