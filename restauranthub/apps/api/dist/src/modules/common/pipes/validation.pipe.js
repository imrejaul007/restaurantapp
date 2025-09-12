"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CustomValidationPipe_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomValidationPipe = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const class_sanitizer_1 = require("class-sanitizer");
let CustomValidationPipe = CustomValidationPipe_1 = class CustomValidationPipe {
    constructor() {
        this.logger = new common_1.Logger(CustomValidationPipe_1.name);
    }
    async transform(value, { metatype }) {
        if (!metatype || !this.toValidate(metatype)) {
            return value;
        }
        const object = (0, class_transformer_1.plainToInstance)(metatype, value);
        (0, class_sanitizer_1.sanitize)(object);
        const errors = await (0, class_validator_1.validate)(object, {
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        });
        if (errors.length > 0) {
            const errorMessages = this.formatErrors(errors);
            this.logger.warn(`Validation failed: ${JSON.stringify(errorMessages)}`);
            throw new common_1.BadRequestException({
                message: 'Validation failed',
                errors: errorMessages,
                statusCode: 400,
            });
        }
        return object;
    }
    toValidate(metatype) {
        const types = [String, Boolean, Number, Array, Object];
        return !types.includes(metatype);
    }
    formatErrors(errors) {
        const result = {};
        errors.forEach((error) => {
            const property = error.property;
            const constraints = error.constraints;
            if (constraints) {
                result[property] = Object.values(constraints);
            }
            if (error.children && error.children.length > 0) {
                result[property] = this.formatErrors(error.children);
            }
        });
        return result;
    }
};
exports.CustomValidationPipe = CustomValidationPipe;
exports.CustomValidationPipe = CustomValidationPipe = CustomValidationPipe_1 = __decorate([
    (0, common_1.Injectable)()
], CustomValidationPipe);
//# sourceMappingURL=validation.pipe.js.map