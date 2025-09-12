import { User as PrismaUser, UserRole, Profile } from '@prisma/client';
export interface AuthenticatedUser extends PrismaUser {
    profile?: Profile | null;
}
export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    type: 'access' | 'refresh';
    jti?: string;
    iat?: number;
    exp?: number;
}
export interface UserPayload {
    id: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    emailVerifiedAt: Date | null;
    profile?: Profile | null;
}
