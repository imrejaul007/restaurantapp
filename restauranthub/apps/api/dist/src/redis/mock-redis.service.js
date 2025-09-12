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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockRedisService = void 0;
const common_1 = require("@nestjs/common");
let MockRedisService = class MockRedisService {
    constructor() {
        this.storage = {
            data: new Map(),
            hashes: new Map(),
            sets: new Map(),
            expirations: new Map(),
            counters: new Map(),
            subscribers: new Map(),
        };
        setInterval(() => {
            const now = Date.now();
            for (const [key, expiry] of this.storage.expirations.entries()) {
                if (now > expiry) {
                    this.storage.data.delete(key);
                    this.storage.hashes.delete(key);
                    this.storage.sets.delete(key);
                    this.storage.counters.delete(key);
                    this.storage.expirations.delete(key);
                }
            }
        }, 60000);
    }
    async get(key) {
        this.checkExpiry(key);
        return this.storage.data.get(key) || null;
    }
    async set(key, value, ttl) {
        this.storage.data.set(key, value);
        if (ttl) {
            this.storage.expirations.set(key, Date.now() + ttl * 1000);
        }
        else {
            this.storage.expirations.delete(key);
        }
    }
    async del(key) {
        this.storage.data.delete(key);
        this.storage.hashes.delete(key);
        this.storage.sets.delete(key);
        this.storage.counters.delete(key);
        this.storage.expirations.delete(key);
    }
    async exists(key) {
        this.checkExpiry(key);
        return this.storage.data.has(key) ||
            this.storage.hashes.has(key) ||
            this.storage.sets.has(key) ||
            this.storage.counters.has(key);
    }
    async expire(key, ttl) {
        if (await this.exists(key)) {
            this.storage.expirations.set(key, Date.now() + ttl * 1000);
        }
    }
    async hget(key, field) {
        this.checkExpiry(key);
        const hash = this.storage.hashes.get(key);
        return hash?.get(field) || null;
    }
    async hset(key, field, value) {
        if (!this.storage.hashes.has(key)) {
            this.storage.hashes.set(key, new Map());
        }
        this.storage.hashes.get(key).set(field, value);
    }
    async hgetall(key) {
        this.checkExpiry(key);
        const hash = this.storage.hashes.get(key);
        if (!hash)
            return {};
        const result = {};
        for (const [field, value] of hash.entries()) {
            result[field] = value;
        }
        return result;
    }
    async hdel(key, field) {
        const hash = this.storage.hashes.get(key);
        if (hash) {
            hash.delete(field);
            if (hash.size === 0) {
                this.storage.hashes.delete(key);
            }
        }
    }
    async sadd(key, member) {
        if (!this.storage.sets.has(key)) {
            this.storage.sets.set(key, new Set());
        }
        this.storage.sets.get(key).add(member);
    }
    async srem(key, member) {
        const set = this.storage.sets.get(key);
        if (set) {
            set.delete(member);
            if (set.size === 0) {
                this.storage.sets.delete(key);
            }
        }
    }
    async smembers(key) {
        this.checkExpiry(key);
        const set = this.storage.sets.get(key);
        return set ? Array.from(set) : [];
    }
    async sismember(key, member) {
        this.checkExpiry(key);
        const set = this.storage.sets.get(key);
        return set?.has(member) || false;
    }
    async incr(key) {
        const current = this.storage.counters.get(key) || 0;
        const newValue = current + 1;
        this.storage.counters.set(key, newValue);
        return newValue;
    }
    async decr(key) {
        const current = this.storage.counters.get(key) || 0;
        const newValue = current - 1;
        this.storage.counters.set(key, newValue);
        return newValue;
    }
    async publish(channel, message) {
        const callbacks = this.storage.subscribers.get(channel);
        if (callbacks) {
            setImmediate(() => {
                callbacks.forEach(callback => {
                    try {
                        callback(message);
                    }
                    catch (error) {
                        console.error(`Error in Redis subscriber callback for channel ${channel}:`, error);
                    }
                });
            });
        }
    }
    async subscribe(channel, callback) {
        if (!this.storage.subscribers.has(channel)) {
            this.storage.subscribers.set(channel, []);
        }
        this.storage.subscribers.get(channel).push(callback);
    }
    async unsubscribe(channel) {
        this.storage.subscribers.delete(channel);
    }
    async flushall() {
        this.storage.data.clear();
        this.storage.hashes.clear();
        this.storage.sets.clear();
        this.storage.counters.clear();
        this.storage.expirations.clear();
        this.storage.subscribers.clear();
    }
    getClient() {
        return this;
    }
    getSubscriber() {
        return this;
    }
    checkExpiry(key) {
        const expiry = this.storage.expirations.get(key);
        if (expiry && Date.now() > expiry) {
            this.storage.data.delete(key);
            this.storage.hashes.delete(key);
            this.storage.sets.delete(key);
            this.storage.counters.delete(key);
            this.storage.expirations.delete(key);
        }
    }
};
exports.MockRedisService = MockRedisService;
exports.MockRedisService = MockRedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MockRedisService);
//# sourceMappingURL=mock-redis.service.js.map