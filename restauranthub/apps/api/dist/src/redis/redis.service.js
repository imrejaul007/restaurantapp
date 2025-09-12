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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
let RedisService = class RedisService {
    constructor(client, subscriber) {
        this.client = client;
        this.subscriber = subscriber;
    }
    async get(key) {
        return this.client.get(key);
    }
    async set(key, value, ttl) {
        if (ttl) {
            await this.client.setex(key, ttl, value);
        }
        else {
            await this.client.set(key, value);
        }
    }
    async del(key) {
        await this.client.del(key);
    }
    async exists(key) {
        const result = await this.client.exists(key);
        return result === 1;
    }
    async expire(key, ttl) {
        await this.client.expire(key, ttl);
    }
    async hget(key, field) {
        return this.client.hget(key, field);
    }
    async hset(key, field, value) {
        await this.client.hset(key, field, value);
    }
    async hgetall(key) {
        return this.client.hgetall(key);
    }
    async hdel(key, field) {
        await this.client.hdel(key, field);
    }
    async sadd(key, member) {
        await this.client.sadd(key, member);
    }
    async srem(key, member) {
        await this.client.srem(key, member);
    }
    async smembers(key) {
        return this.client.smembers(key);
    }
    async sismember(key, member) {
        const result = await this.client.sismember(key, member);
        return result === 1;
    }
    async incr(key) {
        return this.client.incr(key);
    }
    async decr(key) {
        return this.client.decr(key);
    }
    async publish(channel, message) {
        await this.client.publish(channel, message);
    }
    async subscribe(channel, callback) {
        await this.subscriber.subscribe(channel);
        this.subscriber.on('message', (ch, message) => {
            if (ch === channel) {
                callback(message);
            }
        });
    }
    async unsubscribe(channel) {
        await this.subscriber.unsubscribe(channel);
    }
    async flushall() {
        await this.client.flushall();
    }
    getClient() {
        return this.client;
    }
    getSubscriber() {
        return this.subscriber;
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('REDIS_CLIENT')),
    __param(1, (0, common_1.Inject)('REDIS_SUBSCRIBER')),
    __metadata("design:paramtypes", [ioredis_1.Redis,
        ioredis_1.Redis])
], RedisService);
//# sourceMappingURL=redis.service.js.map