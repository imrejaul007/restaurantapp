import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import axios from 'axios';

/**
 * REZ JWT payload shape.
 * Source: rezbackend/src/middleware/auth.ts — JWTPayload interface.
 */
export interface RezJwtPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * The validated principal returned from this strategy.
 * Downstream controllers receive this as `req.user`.
 */
export interface RezValidatedPrincipal {
  rezUserId: string;
  rezRole: string;
  rezMerchantId: string | null;
}

/** Strategy name used with @UseGuards(AuthGuard('rez-merchant')) */
export const REZ_MERCHANT_STRATEGY = 'rez-merchant';

/** Roles accepted across the bridge. Anything else is rejected. */
const ALLOWED_REZ_ROLES = new Set(['merchant', 'merchant_admin']);

/**
 * RezMerchantStrategy
 *
 * Passport JWT strategy that validates a REZ-issued Bearer token:
 *   1. Verifies signature using REZ_JWT_SECRET (same secret as rezbackend JWT_SECRET).
 *   2. Checks the decoded role is a merchant role.
 *   3. Optionally checks the Redis blacklist via the REZ auth service.
 *      If REZ is unreachable the check is skipped (degrade gracefully).
 *
 * ENV VARS REQUIRED:
 *   REZ_JWT_SECRET        — same value as rezbackend JWT_SECRET
 *   REZ_BACKEND_URL       — e.g. https://api.rezapp.com/api
 *   REZ_INTERNAL_TOKEN    — INTERNAL_SERVICE_TOKEN from rezbackend
 */
@Injectable()
export class RezMerchantStrategy extends PassportStrategy(Strategy, REZ_MERCHANT_STRATEGY) {
  private readonly logger = new Logger(RezMerchantStrategy.name);
  private readonly rezBackendUrl: string;
  private readonly rezInternalToken: string;

  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('REZ_JWT_SECRET');
    if (!secret) {
      throw new Error('REZ_JWT_SECRET environment variable is required for the REZ auth bridge');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ['HS256'],
    });

    this.rezBackendUrl = configService.get<string>('REZ_BACKEND_URL', 'https://api.rezapp.com/api');
    this.rezInternalToken = configService.get<string>('REZ_INTERNAL_TOKEN', '');
  }

  /**
   * Called by Passport after the JWT signature is verified.
   * Throws UnauthorizedException to reject; returns the principal to allow.
   */
  async validate(payload: RezJwtPayload): Promise<RezValidatedPrincipal> {
    // Guard: only merchant roles are permitted across the bridge
    if (!ALLOWED_REZ_ROLES.has(payload.role)) {
      this.logger.warn(
        `RezBridge: rejected token for non-merchant role "${payload.role}" (userId=${payload.userId})`,
      );
      throw new UnauthorizedException('Only REZ merchant accounts may use this bridge');
    }

    // Optional: check Redis blacklist via REZ auth service
    await this.checkBlacklist(payload.userId);

    return {
      rezUserId: payload.userId,
      rezRole: payload.role,
      rezMerchantId: null, // resolved later in the controller after profile fetch
    };
  }

  /**
   * Calls the REZ auth service to check if this user's tokens have been
   * revoked (e.g. after logout or security event).
   *
   * Failure modes:
   *   - Network error / timeout → logged as warning, request proceeds (graceful degrade).
   *   - REZ returns 401/403 → token explicitly revoked → throw UnauthorizedException.
   */
  private async checkBlacklist(userId: string): Promise<void> {
    if (!this.rezInternalToken) {
      // No internal token configured — skip blacklist check
      this.logger.debug('RezBridge: REZ_INTERNAL_TOKEN not set, skipping blacklist check');
      return;
    }

    try {
      await axios.get(`${this.rezBackendUrl}/internal/auth/token-status/${userId}`, {
        headers: { Authorization: `Bearer ${this.rezInternalToken}` },
        timeout: 2000,
      });
      // 200 → token is valid, nothing to do
    } catch (error: any) {
      const status = error?.response?.status;

      if (status === 401 || status === 403) {
        this.logger.warn(`RezBridge: blacklist check rejected userId=${userId} (HTTP ${status})`);
        throw new UnauthorizedException('REZ token has been revoked');
      }

      // All other errors (network, timeout, 5xx) → degrade gracefully
      this.logger.warn(
        `RezBridge: blacklist check unavailable for userId=${userId} — proceeding (${error?.message ?? 'unknown error'})`,
      );
    }
  }
}
