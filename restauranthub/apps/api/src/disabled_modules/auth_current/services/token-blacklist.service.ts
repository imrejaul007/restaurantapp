import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private inMemoryBlacklist = new Set<string>(); // Fallback for Redis failures

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async blacklistToken(token: string, userId?: string, reason?: string): Promise<void> {
    try {
      // Decode token to get expiration time
      const decoded = this.jwtService.decode(token) as any;
      const expiresAt = decoded?.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Add to in-memory blacklist for immediate effect
      this.inMemoryBlacklist.add(token);

      // Skip database operations in mock mode
      if (process.env.MOCK_DATABASE === 'true') {
        this.logger.debug(`MOCK: Token blacklisted for user ${userId}: ${reason}`);
        return;
      }

      // Try to persist to database
      try {
        await this.prisma.$executeRaw`
          INSERT INTO "BlacklistedToken" (id, token, "expiresAt", "userId", reason, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${token}, ${expiresAt}, ${userId}, ${reason}, NOW(), NOW())
          ON CONFLICT (token) DO NOTHING
        `;

        this.logger.debug(`Token blacklisted for user ${userId}: ${reason}`);
      } catch (dbError) {
        this.logger.warn(`Failed to persist blacklisted token to database: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
        // Continue with in-memory blacklist as fallback
      }

    } catch (error) {
      this.logger.error(`Failed to blacklist token: ${error instanceof Error ? error.message : String(error)}`);
      // Fail safely by adding to in-memory blacklist
      this.inMemoryBlacklist.add(token);
    }
  }

  async isTokenBlacklisted(token: string, userId?: string): Promise<boolean> {
    try {
      // Check in-memory blacklist first (fastest)
      if (this.inMemoryBlacklist.has(token)) {
        return true;
      }

      // In mock mode, only use in-memory blacklist
      if (process.env.MOCK_DATABASE === 'true') {
        return false;
      }

      // Check database blacklist
      try {
        const result = await this.prisma.$queryRaw`
          SELECT 1 FROM "BlacklistedToken"
          WHERE token = ${token} AND "expiresAt" > NOW()
          LIMIT 1
        `;

        const isBlacklisted = Array.isArray(result) && result.length > 0;

        if (isBlacklisted) {
          // Add to in-memory cache for faster future lookups
          this.inMemoryBlacklist.add(token);
        }

        return isBlacklisted;
      } catch (dbError) {
        this.logger.warn(`Database blacklist check failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
        // Fail open - return false to maintain availability
        return false;
      }

    } catch (error) {
      this.logger.error(`Token blacklist check failed: ${error instanceof Error ? error.message : String(error)}`);
      return false; // Fail open for availability
    }
  }

  async cleanupExpiredTokens(): Promise<number> {
    try {
      if (process.env.MOCK_DATABASE === 'true') {
        // Clean up in-memory blacklist
        const currentTime = Date.now();
        let cleaned = 0;

        for (const token of this.inMemoryBlacklist) {
          try {
            const decoded = this.jwtService.decode(token) as any;
            if (decoded?.exp && decoded.exp * 1000 < currentTime) {
              this.inMemoryBlacklist.delete(token);
              cleaned++;
            }
          } catch {
            // Invalid token, remove it
            this.inMemoryBlacklist.delete(token);
            cleaned++;
          }
        }

        this.logger.debug(`Cleaned up ${cleaned} expired tokens from memory`);
        return cleaned;
      }

      // Clean up database
      const result = await this.prisma.$executeRaw`
        DELETE FROM "BlacklistedToken" WHERE "expiresAt" < NOW()
      `;

      this.logger.debug(`Cleaned up ${result} expired blacklisted tokens from database`);
      return Number(result);

    } catch (error) {
      this.logger.error(`Failed to cleanup expired tokens: ${error instanceof Error ? error.message : String(error)}`);
      return 0;
    }
  }
}