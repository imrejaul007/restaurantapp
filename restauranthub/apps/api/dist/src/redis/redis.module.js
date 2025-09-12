"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
const redis_service_1 = require("./redis.service");
const mock_redis_service_1 = require("./mock-redis.service");
let RedisModule = class RedisModule {
};
exports.RedisModule = RedisModule;
exports.RedisModule = RedisModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: 'REDIS_CLIENT',
                useFactory: (configService) => {
                    const logger = new common_1.Logger('RedisModule');
                    const mockMode = process.env.MOCK_DATABASE === 'true' || process.env.REDIS_ENABLED === 'false';
                    if (mockMode) {
                        logger.warn('Using mock Redis client - Redis functionality will be simulated in memory');
                        return new mock_redis_service_1.MockRedisService();
                    }
                    try {
                        logger.log('Connecting to Redis server...');
                        return new ioredis_1.default({
                            host: configService.get('redis.host'),
                            port: configService.get('redis.port'),
                            password: configService.get('redis.password'),
                            retryStrategy: (times) => {
                                if (times > 3) {
                                    logger.error('Redis connection failed after 3 retries, falling back to mock');
                                    return null;
                                }
                                return Math.min(times * 50, 2000);
                            },
                            maxRetriesPerRequest: 3,
                            lazyConnect: true,
                        });
                    }
                    catch (error) {
                        logger.error('Failed to create Redis client, using mock:', error.message);
                        return new mock_redis_service_1.MockRedisService();
                    }
                },
                inject: [config_1.ConfigService],
            },
            {
                provide: 'REDIS_SUBSCRIBER',
                useFactory: (configService) => {
                    const logger = new common_1.Logger('RedisModule');
                    const mockMode = process.env.MOCK_DATABASE === 'true' || process.env.REDIS_ENABLED === 'false';
                    if (mockMode) {
                        logger.warn('Using mock Redis subscriber - Pub/Sub will be simulated in memory');
                        return new mock_redis_service_1.MockRedisService();
                    }
                    try {
                        logger.log('Connecting Redis subscriber...');
                        return new ioredis_1.default({
                            host: configService.get('redis.host'),
                            port: configService.get('redis.port'),
                            password: configService.get('redis.password'),
                            retryStrategy: (times) => {
                                if (times > 3) {
                                    logger.error('Redis subscriber connection failed after 3 retries, falling back to mock');
                                    return null;
                                }
                                return Math.min(times * 50, 2000);
                            },
                            maxRetriesPerRequest: 3,
                            lazyConnect: true,
                        });
                    }
                    catch (error) {
                        logger.error('Failed to create Redis subscriber, using mock:', error.message);
                        return new mock_redis_service_1.MockRedisService();
                    }
                },
                inject: [config_1.ConfigService],
            },
            {
                provide: redis_service_1.RedisService,
                useFactory: (client, subscriber) => {
                    return new redis_service_1.RedisService(client, subscriber);
                },
                inject: ['REDIS_CLIENT', 'REDIS_SUBSCRIBER'],
            },
        ],
        exports: ['REDIS_CLIENT', 'REDIS_SUBSCRIBER', redis_service_1.RedisService],
    })
], RedisModule);
//# sourceMappingURL=redis.module.js.map