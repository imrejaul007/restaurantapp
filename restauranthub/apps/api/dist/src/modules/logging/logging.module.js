"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingModule = void 0;
const common_1 = require("@nestjs/common");
const nest_winston_1 = require("nest-winston");
const config_1 = require("@nestjs/config");
const winston = __importStar(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const logging_service_1 = require("./logging.service");
const logging_interceptor_1 = require("./logging.interceptor");
let LoggingModule = class LoggingModule {
};
exports.LoggingModule = LoggingModule;
exports.LoggingModule = LoggingModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            nest_winston_1.WinstonModule.forRootAsync({
                useFactory: (configService) => {
                    const logLevel = configService.get('LOG_LEVEL', 'info');
                    const nodeEnv = configService.get('NODE_ENV', 'development');
                    const transports = [];
                    if (nodeEnv === 'development' || nodeEnv === 'test') {
                        transports.push(new winston.transports.Console({
                            level: logLevel,
                            format: winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), winston.format.colorize(), winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
                                let log = `${timestamp} [${context || 'Application'}] ${level}: ${message}`;
                                if (Object.keys(meta).length > 0) {
                                    log += ` ${JSON.stringify(meta, null, 2)}`;
                                }
                                if (trace) {
                                    log += `\n${trace}`;
                                }
                                return log;
                            })),
                        }));
                    }
                    if (nodeEnv === 'production') {
                        transports.push(new winston_daily_rotate_file_1.default({
                            level: 'error',
                            filename: 'logs/error-%DATE%.log',
                            datePattern: 'YYYY-MM-DD',
                            zippedArchive: true,
                            maxSize: '20m',
                            maxFiles: '14d',
                            format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
                        }));
                        transports.push(new winston_daily_rotate_file_1.default({
                            filename: 'logs/combined-%DATE%.log',
                            datePattern: 'YYYY-MM-DD',
                            zippedArchive: true,
                            maxSize: '20m',
                            maxFiles: '30d',
                            format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
                        }));
                        transports.push(new winston_daily_rotate_file_1.default({
                            filename: 'logs/access-%DATE%.log',
                            datePattern: 'YYYY-MM-DD',
                            zippedArchive: true,
                            maxSize: '20m',
                            maxFiles: '30d',
                            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
                            level: 'http',
                        }));
                        transports.push(new winston_daily_rotate_file_1.default({
                            filename: 'logs/security-%DATE%.log',
                            datePattern: 'YYYY-MM-DD',
                            zippedArchive: true,
                            maxSize: '20m',
                            maxFiles: '90d',
                            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
                        }));
                    }
                    return {
                        level: logLevel,
                        format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.ms()),
                        transports,
                        defaultMeta: {
                            service: 'restauranthub-api',
                            version: process.env.npm_package_version || '1.0.0',
                            environment: nodeEnv,
                        },
                        exceptionHandlers: nodeEnv === 'production' ? [
                            new winston_daily_rotate_file_1.default({
                                filename: 'logs/exceptions-%DATE%.log',
                                datePattern: 'YYYY-MM-DD',
                                zippedArchive: true,
                                maxSize: '20m',
                                maxFiles: '30d',
                            }),
                        ] : [],
                        rejectionHandlers: nodeEnv === 'production' ? [
                            new winston_daily_rotate_file_1.default({
                                filename: 'logs/rejections-%DATE%.log',
                                datePattern: 'YYYY-MM-DD',
                                zippedArchive: true,
                                maxSize: '20m',
                                maxFiles: '30d',
                            }),
                        ] : [],
                        exitOnError: false,
                    };
                },
                inject: [config_1.ConfigService],
            }),
        ],
        providers: [logging_service_1.LoggingService, logging_interceptor_1.LoggingInterceptor],
        exports: [logging_service_1.LoggingService, logging_interceptor_1.LoggingInterceptor],
    })
], LoggingModule);
//# sourceMappingURL=logging.module.js.map