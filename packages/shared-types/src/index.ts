export type RoleClaim = 'user' | 'admin' | 'auditor';

export type AuthSession = {
  sessionId: string;
  userId: string;
  roles: RoleClaim[];
  issuedAt: string;
  expiresAt: string;
};
