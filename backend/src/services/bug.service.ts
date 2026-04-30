import { randomUUID } from 'node:crypto';
import { getFirestore } from '../integrations/firebase/firebase-admin';
import type { BugChallengeRecord, BugSubmissionRecord, PytestRunResult } from '../models/bug.model';
import type { LearningProgressRecord } from '../models/user.model';
import {
  bugChallengeRepository,
  bugHintRepository,
  bugSubmissionRepository,
  bugTestCaseRepository,
} from '../repositories/bug.repository';
import { learningProgressRepository, notificationRepository, userProfileRepository, userRepository } from '../repositories/user.repository';
import { AppError } from '../utils/app-error';
import { pytestRunnerService } from './pytest-runner.service';

const now = () => new Date().toISOString();

class BugService {
  private toChallengeResponse(challenge: BugChallengeRecord) {
    return {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      difficulty: challenge.difficulty,
      category: challenge.category,
      language: challenge.language,
      starterCode: challenge.starterCode,
      buggyCode: challenge.starterCode,
      expectedBehavior: challenge.expectedBehavior,
      tags: challenge.tags,
      status: challenge.status,
      points: challenge.points,
    };
  }

  async listChallenges(filters: { difficulty?: string; tag?: string; status?: string }) {
    const snapshot = await bugChallengeRepository.collection().where('status', '==', filters.status ?? 'published').get();
    return snapshot.docs
      .map((doc) => doc.data() as BugChallengeRecord)
      .filter((challenge) => (filters.difficulty ? challenge.difficulty === filters.difficulty : true))
      .filter((challenge) => (filters.tag ? challenge.tags.includes(filters.tag) : true))
      .map((challenge) => this.toChallengeResponse(challenge));
  }

  async getChallenge(challengeId: string, userId?: string) {
    const challenge = await bugChallengeRepository.getById(challengeId);
    if (!challenge || challenge.status === 'archived') {
      throw new AppError('Challenge not found.', 404, 'CHALLENGE_NOT_FOUND');
    }

    const response = this.toChallengeResponse(challenge);
    if (!userId) {
      return response;
    }

    const progressDoc = await getFirestore()
      .collection('learning_progress')
      .where('userId', '==', userId)
      .where('itemId', '==', challengeId)
      .limit(1)
      .get();

    return {
      ...response,
      savedCode: progressDoc.empty ? challenge.starterCode : progressDoc.docs[0].data().lastCode ?? challenge.starterCode,
      progress: progressDoc.empty ? null : progressDoc.docs[0].data(),
    };
  }

  async getHints(challengeId: string, level?: number) {
    const snapshot = await bugHintRepository.collection().where('challengeId', '==', challengeId).get();
    const hints = snapshot.docs.map((doc) => doc.data()).sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
    return level ? hints.filter((hint) => hint.level === level) : hints;
  }

  async getTestCases(challengeId: string, includeHidden = false) {
    const snapshot = await bugTestCaseRepository
      .collection()
      .where('challengeId', '==', challengeId)
      .get();

    const records = snapshot.docs
      .map((doc) => doc.data() as import('../models/bug.model').BugTestCaseRecord)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return includeHidden ? records : records.filter((record) => !record.hidden);
  }

  async runChallenge(input: { challengeId: string; code: string }) {
    const challenge = await bugChallengeRepository.getById(input.challengeId);
    if (!challenge) {
      throw new AppError('Challenge not found.', 404, 'CHALLENGE_NOT_FOUND');
    }

    const allTestCases = await this.getTestCases(input.challengeId, true);
    return pytestRunnerService.runner.run({
      challenge,
      code: input.code,
      testCases: allTestCases,
    });
  }

  private async updateProgressAfterSubmit(userId: string, challenge: BugChallengeRecord, code: string, result: PytestRunResult) {
    const timestamp = now();
    const progressId = `${userId}_${challenge.id}`;
    const existing = await learningProgressRepository.getById(progressId);
    const status: LearningProgressRecord['status'] = result.passed ? 'completed' : 'in_progress';

    const progressRecord: LearningProgressRecord = {
      id: progressId,
      userId,
      moduleType: 'bug',
      itemId: challenge.id,
      status,
      score: result.passed ? 100 : Math.max(0, result.passedCount * 20),
      attempts: (existing?.attempts ?? 0) + 1,
      lastCode: code,
      completedAt: result.passed ? timestamp : existing?.completedAt ?? null,
      updatedAt: timestamp,
    };

    await learningProgressRepository.upsert(progressId, progressRecord);

    const [user, profile] = await Promise.all([userRepository.getById(userId), userProfileRepository.getById(userId)]);
    if (user && profile && result.passed && existing?.status !== 'completed') {
      await userRepository.upsert(userId, {
        ...user,
        experience: user.experience + challenge.points,
        updatedAt: timestamp,
      });
      await userProfileRepository.upsert(userId, {
        ...profile,
        level: Math.floor((user.experience + challenge.points) / 100) + 1,
        totalSolved: profile.totalSolved + 1,
        streak: Math.max(1, profile.streak + 1),
        updatedAt: timestamp,
        lastActiveAt: timestamp,
      });
    }
  }

  async submitChallenge(userId: string, input: { challengeId: string; code: string }) {
    const challenge = await bugChallengeRepository.getById(input.challengeId);
    if (!challenge) {
      throw new AppError('Challenge not found.', 404, 'CHALLENGE_NOT_FOUND');
    }

    const result = await this.runChallenge(input);
    const submissionId = randomUUID();
    const submission: BugSubmissionRecord = {
      id: submissionId,
      userId,
      challengeId: input.challengeId,
      submittedCode: input.code,
      pytestResult: result.passed ? 'passed' : 'failed',
      passed: result.passed,
      passedCount: result.passedCount,
      failedCount: result.failedCount,
      logs: result.logs,
      runtimeMs: result.runtimeMs,
      createdAt: now(),
    };
    await bugSubmissionRepository.create(submissionId, submission);
    await this.updateProgressAfterSubmit(userId, challenge, input.code, result);

    if (result.passed) {
      const notificationId = randomUUID();
      await notificationRepository.create(notificationId, {
        id: notificationId,
        userId,
        message: `Challenge "${challenge.title}" completed successfully.`,
        type: 'success',
        isRead: false,
        createdAt: now(),
      });
    }

    return {
      submission,
      result,
      completionMessage: result.passed
        ? 'Submission accepted. Progress updated without exposing the full answer.'
        : 'Submission stored. Review the failing checks and iterate again.',
    };
  }

  async listSubmissions(userId: string) {
    const snapshot = await bugSubmissionRepository
      .collection()
      .where('userId', '==', userId)
      .get();
    return snapshot.docs
      .map((doc) => doc.data())
      .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
  }

  async saveDraft(userId: string, input: { challengeId: string; code: string }) {
    const challenge = await bugChallengeRepository.getById(input.challengeId);
    if (!challenge) {
      throw new AppError('Challenge not found.', 404, 'CHALLENGE_NOT_FOUND');
    }

    const progressId = `${userId}_${challenge.id}`;
    const existing = await learningProgressRepository.getById(progressId);
    const record: LearningProgressRecord = {
      id: progressId,
      userId,
      moduleType: 'bug',
      itemId: challenge.id,
      status: existing?.status === 'completed' ? 'completed' : 'saved',
      score: existing?.score ?? 0,
      attempts: existing?.attempts ?? 0,
      lastCode: input.code,
      completedAt: existing?.completedAt ?? null,
      updatedAt: now(),
    };

    await learningProgressRepository.upsert(progressId, record);
    return record;
  }

  async deleteDraft(userId: string, challengeId: string) {
    const progressId = `${userId}_${challengeId}`;
    const existing = await learningProgressRepository.getById(progressId);
    if (!existing || existing.userId !== userId) {
      throw new AppError('Saved draft not found.', 404, 'DRAFT_NOT_FOUND');
    }

    if (existing.status === 'completed') {
      await learningProgressRepository.upsert(progressId, {
        ...existing,
        lastCode: undefined,
        updatedAt: now(),
      });
    } else {
      await learningProgressRepository.delete(progressId);
    }

    return { deleted: true };
  }
}

export const bugService = new BugService();
