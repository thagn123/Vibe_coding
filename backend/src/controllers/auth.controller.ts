import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { auth, db } from '../config/firebase';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';

const JWT_SECRET = env.JWT_SECRET;
const TOKEN_EXPIRY = '7d';

// ── Helpers ──────────────────────────────────────────────────────────────────
const generateToken = (uid: string, email: string) => {
  return jwt.sign({ uid, email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

// ── Controllers ───────────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, username, displayName } = req.body;

    if (!email || !password || !username) {
      throw new AppError('Email, password and username are required.', 400, 'BAD_REQUEST');
    }

    // Check if user already exists in Firestore
    const userSnap = await db.collection('users').where('email', '==', email).get();
    if (!userSnap.empty) {
      throw new AppError('User with this email already exists.', 400, 'USER_EXISTS');
    }

    const usernameSnap = await db.collection('users').where('username', '==', username).get();
    if (!usernameSnap.empty) {
      throw new AppError('Username is already taken.', 400, 'USERNAME_TAKEN');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in Firestore
    const uid = `u_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const userDoc = {
      uid,
      email,
      username,
      displayName: displayName || username,
      password: hashedPassword, // Store hashed password
      experience: 0,
      level: 1,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('users').doc(uid).set(userDoc);

    // Create initial profile
    await db.collection('user_profiles').doc(uid).set({
      id: uid,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      bio: '',
      level: 1,
      streak: 0,
      totalSolved: 0,
      location: '',
      createdAt: new Date().toISOString(),
    });

    const token = generateToken(uid, email);

    // Don't return password
    const { password: _, ...userWithoutPassword } = userDoc;

    console.log(`[Auth] Registered new user: ${email} (${uid})`);

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, provider, idToken } = req.body;

    // Handle Google Login
    if (provider === 'google' && idToken) {
      const decodedToken = await auth.verifyIdToken(idToken);
      const { uid, email: gEmail, name, picture } = decodedToken;

      let userDoc = await db.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        // Auto-register google user
        const newUser = {
          uid,
          email: gEmail,
          username: gEmail?.split('@')[0] || `user_${uid.substring(0, 5)}`,
          displayName: name || 'Google User',
          photoURL: picture,
          experience: 0,
          level: 1,
          role: 'user',
          createdAt: new Date().toISOString(),
        };
        await db.collection('users').doc(uid).set(newUser);
        
        await db.collection('user_profiles').doc(uid).set({
          id: uid,
          avatarUrl: picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
          level: 1,
          streak: 0,
          totalSolved: 0,
          createdAt: new Date().toISOString(),
        });
        
        userDoc = await db.collection('users').doc(uid).get();
      }

      const token = generateToken(uid, gEmail || '');
      return res.json({
        success: true,
        data: {
          user: userDoc.data(),
          token
        }
      });
    }

    // Handle Email/Password Login
    if (!email || !password) {
      throw new AppError('Email and password are required.', 400, 'BAD_REQUEST');
    }

    const userSnap = await db.collection('users').where('email', '==', email).get();
    if (userSnap.empty) {
      throw new AppError('Invalid email or password.', 401, 'UNAUTHORIZED');
    }

    const userDoc = userSnap.docs[0].data();
    
    // Check if user has a password (might be a social-only account)
    if (!userDoc.password) {
      throw new AppError('This account uses social login. Please sign in with Google.', 400, 'SOCIAL_ONLY');
    }

    const isMatch = await bcrypt.compare(password, userDoc.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401, 'UNAUTHORIZED');
    }

    const token = generateToken(userDoc.uid, userDoc.email);
    
    const { password: _, ...userWithoutPassword } = userDoc;

    console.log(`[Auth] User logged in: ${email}`);

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = req.user!.uid;

    const [userDoc, profileDoc] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('user_profiles').doc(uid).get(),
    ]);

    if (!userDoc.exists) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    const userData = userDoc.data()!;
    const profileData = profileDoc.exists ? profileDoc.data() : {};

    const user = {
      ...userData,
      ...profileData,
      createdAt: userData.createdAt, // Ensure original createdAt is used
    };

    // Remove sensitive data
    delete (user as any).password;

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  // Client handles token clearing, but we could blacklist tokens if needed
  res.json({ success: true, message: 'Logged out successfully' });
};
