import app from './app';
import { env } from './config/env';
import { getFirebaseAdmin } from './integrations/firebase/firebase-admin';

const startServer = async () => {
  getFirebaseAdmin();

  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`VibeCode Lab backend listening on http://0.0.0.0:${env.PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
