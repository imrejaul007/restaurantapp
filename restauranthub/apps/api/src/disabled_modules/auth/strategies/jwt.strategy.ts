import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
// import { RedisService } from '../../../redis/redis.service';
import { AuthService } from '../auth.service';
import { JwtPayload, UserPayload } from '../types/user.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    // private redisService: RedisService, // Temporarily disabled
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtPayload): Promise<UserPayload> {
    const { sub: userId, email, role, jti, type } = payload;

    // Validate token type
    if (type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Check if token is blacklisted
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }
    const isBlacklisted = await this.authService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      this.logger.warn(`Blacklisted token used by user ${userId}`);
      throw new UnauthorizedException('Token has been revoked');
    }

    // Check cache first
    const cachedUser = null; // await // this.redisService.get(`user:${userId}`);
    if (cachedUser) {
      const user = JSON.parse(cachedUser);
      // Still check if user is active from cache
      if (!user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }
      return user;
    }

    // Get user from database with relations based on role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      this.logger.warn(`JWT validation failed: User ${userId} not found`);
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      this.logger.warn(`JWT validation failed: User ${userId} is inactive`);
      throw new UnauthorizedException('User account is inactive');
    }

    if (user.email !== email) {
      this.logger.warn(`JWT validation failed: Email mismatch for user ${userId}`);
      throw new UnauthorizedException('Token email mismatch');
    }

    // Update session last activity (commented out - lastActivityAt field doesn't exist)
    // if (token) {
    //   await this.prisma.session.updateMany({
    //     where: {
    //       userId,
    //       token: token,
    //     },
    //     data: {
    //       lastActivityAt: new Date(),
    //     },
    //   });
    // }

    const userPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerifiedAt ? true : false,
      emailVerifiedAt: user.emailVerifiedAt,
      profile: user.profile,
    };

    // Cache user for 5 minutes
    // await // this.redisService.set(
    //   `user:${userId}`,
    //   JSON.stringify(userPayload),
    //   300,
    // );

    return userPayload;
  }
}