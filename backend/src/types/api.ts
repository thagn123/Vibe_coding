import type { DecodedIdToken } from 'firebase-admin/auth';

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorShape {
  success: false;
  message: string;
  error: {
    code: string;
    statusCode: number;
    details?: unknown;
  };
}

export interface AuthenticatedRequestUser {
  uid: string;
  email?: string;
  token: DecodedIdToken;
}
