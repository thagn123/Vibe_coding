import type { AuthenticatedRequestUser } from './api';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedRequestUser;
    }
  }
}

export { };
