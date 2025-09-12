export declare const CACHE_KEY = "cache_config";
export interface CacheOptions {
    ttl: number;
    keyGenerator?: (...args: any[]) => string;
    tags?: string[];
    skipIf?: (req: any, result: any) => boolean;
}
export declare const Cache: (options: CacheOptions) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
export declare const CachePostsList: (ttl?: number) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
export declare const CacheUserProfile: (ttl?: number) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
export declare const CacheForumsList: (ttl?: number) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
export declare const CacheSearchResults: (ttl?: number) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
