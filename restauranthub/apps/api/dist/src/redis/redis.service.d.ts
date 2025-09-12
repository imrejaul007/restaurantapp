import { Redis } from 'ioredis';
export declare class RedisService {
    private readonly client;
    private readonly subscriber;
    constructor(client: Redis, subscriber: Redis);
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    expire(key: string, ttl: number): Promise<void>;
    hget(key: string, field: string): Promise<string | null>;
    hset(key: string, field: string, value: string): Promise<void>;
    hgetall(key: string): Promise<Record<string, string>>;
    hdel(key: string, field: string): Promise<void>;
    sadd(key: string, member: string): Promise<void>;
    srem(key: string, member: string): Promise<void>;
    smembers(key: string): Promise<string[]>;
    sismember(key: string, member: string): Promise<boolean>;
    incr(key: string): Promise<number>;
    decr(key: string): Promise<number>;
    publish(channel: string, message: string): Promise<void>;
    subscribe(channel: string, callback: (message: string) => void): Promise<void>;
    unsubscribe(channel: string): Promise<void>;
    flushall(): Promise<void>;
    getClient(): Redis;
    getSubscriber(): Redis;
}
