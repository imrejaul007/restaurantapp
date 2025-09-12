"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var JwtStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../../prisma/prisma.service");
const auth_service_1 = require("../auth.service");
let JwtStrategy = JwtStrategy_1 = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(prisma, configService, authService) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET'),
            passReqToCallback: true,
        });
        this.prisma = prisma;
        this.configService = configService;
        this.authService = authService;
        this.logger = new common_1.Logger(JwtStrategy_1.name);
    }
    async validate(req, payload) {
        const { sub: userId, email, role, jti, type } = payload;
        if (type !== 'access') {
            throw new common_1.UnauthorizedException('Invalid token type');
        }
        const token = passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (!token) {
            throw new common_1.UnauthorizedException('Token not found');
        }
        const isBlacklisted = await this.authService.isTokenBlacklisted(token);
        if (isBlacklisted) {
            this.logger.warn(`Blacklisted token used by user ${userId}`);
            throw new common_1.UnauthorizedException('Token has been revoked');
        }
        const cachedUser = null;
        if (cachedUser) {
            const user = JSON.parse(cachedUser);
            if (!user.isActive) {
                throw new common_1.UnauthorizedException('User account is inactive');
            }
            return user;
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
            },
        });
        if (!user) {
            this.logger.warn(`JWT validation failed: User ${userId} not found`);
            throw new common_1.UnauthorizedException('User not found');
        }
        if (!user.isActive) {
            this.logger.warn(`JWT validation failed: User ${userId} is inactive`);
            throw new common_1.UnauthorizedException('User account is inactive');
        }
        if (user.email !== email) {
            this.logger.warn(`JWT validation failed: Email mismatch for user ${userId}`);
            throw new common_1.UnauthorizedException('Token email mismatch');
        }
        const userPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            emailVerified: user.emailVerifiedAt ? true : false,
            emailVerifiedAt: user.emailVerifiedAt,
            profile: user.profile,
        };
        return userPayload;
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = JwtStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        auth_service_1.AuthService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map