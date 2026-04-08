import { User as PrismaUser, UserRole, Profile } from '@prisma/client';

// Extended user interface that includes relations
export interface AuthenticatedUser extends PrismaUser {
  profile?: Profile | null;
}

// JWT payload interface
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
  jti?: string;
  iat?: number;
  exp?: number;
}

// User payload returned from JWT strategy
export interface UserPayload {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  emailVerifiedAt: Date | null;
  profile?: Profile | null;
}