import admin from 'firebase-admin';
import { env } from '../../config/env';

let app: admin.app.App | null = null;

export const getFirebaseAdmin = () => {
  if (app) {
    return app;
  }

  if (admin.apps.length > 0) {
    app = admin.app();
    return app;
  }

  const hasServiceAccount = Boolean(env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);

  app = hasServiceAccount
    ? admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY,
        }),
        projectId: env.FIREBASE_PROJECT_ID,
      })
    : admin.initializeApp({
        projectId: env.FIREBASE_PROJECT_ID,
      });

  return app;
};

export const getFirestore = () => getFirebaseAdmin().firestore();
export const getAuth = () => getFirebaseAdmin().auth();
