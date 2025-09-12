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
var SanitizationMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SanitizationUtils = exports.SanitizationMiddleware = void 0;
const common_1 = require("@nestjs/common");
const xss_1 = require("xss");
const mongoSanitize = __importStar(require("express-mongo-sanitize"));
let SanitizationMiddleware = SanitizationMiddleware_1 = class SanitizationMiddleware {
    constructor() {
        this.logger = new common_1.Logger(SanitizationMiddleware_1.name);
        this.xssFilter = new xss_1.FilterXSS({
            whiteList: {},
            stripIgnoreTag: true,
            stripIgnoreTagBody: ['script']
        });
    }
    use(req, res, next) {
        if (req.body) {
            req.body = this.sanitizeObject(req.body);
        }
        if (req.query) {
            req.query = this.sanitizeObject(req.query);
        }
        if (req.params) {
            req.params = this.sanitizeObject(req.params);
        }
        next();
    }
    sanitizeObject(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return this.sanitizeValue(obj);
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            const sanitizedKey = this.sanitizeValue(key);
            sanitized[sanitizedKey] = this.sanitizeObject(value);
        }
        return sanitized;
    }
    sanitizeValue(value) {
        if (typeof value === 'string') {
            let sanitized = this.xssFilter.process(value);
            const mongoSanitized = mongoSanitize.sanitize({ value: sanitized });
            if (mongoSanitized && typeof mongoSanitized === 'object' && 'value' in mongoSanitized) {
                sanitized = String(mongoSanitized.value || '');
            }
            else {
                sanitized = '';
            }
            sanitized = this.removeSQLInjectionPatterns(sanitized);
            sanitized = sanitized.trim().replace(/\s+/g, ' ');
            return sanitized;
        }
        return value;
    }
    removeSQLInjectionPatterns(input) {
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
            /(-{2,}|\/\*[\s\S]*?\*\/)/g,
            /(;|\||&)/g,
            /(\bOR\b|\bAND\b)(\s+)?\d+(\s+)?=(\s+)?\d+/gi,
            /('|(\\)?('|"|`|;|\\|\/\*))/g,
        ];
        let sanitized = input;
        sqlPatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '');
        });
        return sanitized;
    }
};
exports.SanitizationMiddleware = SanitizationMiddleware;
exports.SanitizationMiddleware = SanitizationMiddleware = SanitizationMiddleware_1 = __decorate([
    (0, common_1.Injectable)()
], SanitizationMiddleware);
class SanitizationUtils {
    static sanitizeEmail(email) {
        return email.toLowerCase().trim().replace(/[^a-zA-Z0-9@._-]/g, '');
    }
    static sanitizePhoneNumber(phone) {
        return phone.replace(/[^0-9+()-\s]/g, '').trim();
    }
    static sanitizeAlphanumeric(input) {
        return input.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    }
    static sanitizeNumeric(input) {
        return input.replace(/[^0-9.-]/g, '');
    }
    static sanitizeURL(url) {
        try {
            const urlObj = new URL(url);
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                throw new Error('Invalid protocol');
            }
            return urlObj.toString();
        }
        catch {
            return '';
        }
    }
    static sanitizeFilename(filename) {
        return filename
            .replace(/[^a-zA-Z0-9._-]/g, '')
            .replace(/\.{2,}/g, '.')
            .replace(/^\.+|\.+$/g, '')
            .substring(0, 255);
    }
    static sanitizeJSON(input) {
        try {
            const parsed = JSON.parse(input);
            return this.deepSanitizeObject(parsed);
        }
        catch {
            return null;
        }
    }
    static deepSanitizeObject(obj) {
        if (typeof obj !== 'object' || obj === null) {
            if (typeof obj === 'string') {
                return new xss_1.FilterXSS().process(obj);
            }
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.deepSanitizeObject(item));
        }
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = this.deepSanitizeObject(value);
        }
        return sanitized;
    }
}
exports.SanitizationUtils = SanitizationUtils;
//# sourceMappingURL=sanitization.middleware.js.map