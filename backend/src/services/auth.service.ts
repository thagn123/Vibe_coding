import { randomUUID } from 'node:crypto';
import { getAuth } from '../integrations/firebase/firebase-admin';
import { signInWithEmailAndPassword } from '../integrations/firebase/identity-toolkit';
import { userProfileRepository, userRepository } from '../repositories/user.repository';
import type { UserProfileRecord, UserRecord } from '../models/user.model';
import { AppError } from '../utils/app-error';

const now = () => new Date().toISOString();

const defaultAvatar = (seed: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

class AuthService {
  private async ensureUserDocuments(
    uid: string,
    data: { email: string; username?: string; displayName?: string; photoURL?: string | null },
  ) {
    const existingUser = await userRepository.getById(uid);
    const timestamp = now();

    const userRecord: UserRecord = existingUser ?? {
      id: uid,
      email: data.email,
      username: data.username ?? data.email.split('@')[0],
      displayName: data.displayName ?? data.username ?? data.email.split('@')[0],
      photoURL: data.photoURL ?? defaultAvatar(data.email),
      role: 'user',
      experience: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    userRecord.updatedAt = timestamp;
    await userRepository.upsert(uid, userRecord);

    const existingProfile = await userProfileRepository.getById(uid);
    const profileRecord: UserProfileRecord = existingProfile ?? {
      id: uid,
      avatarUrl: userRecord.photoURL,
      bio: 'Debugging one bug at a time.',
      level: 1,
      streak: 0,
      totalSolved: 0,
      totalPromptsSaved: 0,
      location: 'Silicon Valley, CA',
      lastActiveAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    profileRecord.avatarUrl = userRecord.photoURL;
    profileRecord.updatedAt = timestamp;
    profileRecord.lastActiveAt = timestamp;
    await userProfileRepository.upsert(uid, profileRecord);

    return this.composeUserResponse(userRecord, profileRecord);
  }

  private composeUserResponse(user: UserRecord, profile: UserProfileRecord) {
    return {
      uid: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      photoURL: profile.avatarUrl ?? user.photoURL,
      role: user.role,
      experience: user.experience,
      level: profile.level,
      streak: profile.streak,
      totalSolved: profile.totalSolved,
      totalPromptsSaved: profile.totalPromptsSaved,
      bio: profile.bio,
      createdAt: user.createdAt,
    };
  }

  async register(input: { email: string; password: string; username: string; displayName?: string }) {
    try {
      const user = await getAuth().createUser({
        email: input.email,
        password: input.password,
        displayName: input.displayName ?? input.username,
      });

      const signedIn = await signInWithEmailAndPassword(input.email, input.password);
      const currentUser = await this.ensureUserDocuments(user.uid, input);

      return {
        user: currentUser,
        token: signedIn.idToken,
        refreshToken: signedIn.refreshToken,
        expiresIn: Number(signedIn.expiresIn),
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to register user.';
      if (message.includes('EMAIL_EXISTS') || message.includes('email-already-exists')) {
        throw new AppError('Email already exists.', 409, 'EMAIL_ALREADY_EXISTS');
      }
      throw error;
    }
  }

  async login(input: { email?: string; password?: string; provider: 'password' | 'google'; idToken?: string }) {
    if (input.provider === 'google') {
      const decoded = await getAuth().verifyIdToken(input.idToken as string);
      const user = await this.ensureUserDocuments(decoded.uid, {
        email: decoded.email ?? `${randomUUID()}@unknown.local`,
        displayName: decoded.name,
        photoURL: decoded.picture,
      });

      return {
        user,
        token: input.idToken,
        refreshToken: null,
        expiresIn: 3600,
      };
    }

    const signedIn = await signInWithEmailAndPassword(input.email as string, input.password as string);
    const decoded = await getAuth().verifyIdToken(signedIn.idToken);
    const user = await this.ensureUserDocuments(decoded.uid, {
      email: decoded.email ?? (input.email as string),
      displayName: decoded.name ?? input.email?.split('@')[0],
    });

    return {
      user,
      token: signedIn.idToken,
      refreshToken: signedIn.refreshToken,
      expiresIn: Number(signedIn.expiresIn),
    };
  }

  async logout(userId: string) {
    await getAuth().revokeRefreshTokens(userId);
    return { loggedOut: true };
  }

  async me(userId: string) {
    const user = await userRepository.getById(userId);
    const profile = await userProfileRepository.getById(userId);

    if (!user || !profile) {
      throw new AppError('User profile not found.', 404, 'USER_NOT_FOUND');
    }

    return this.composeUserResponse(user, profile);
  }
}

export const authService = new AuthService();
