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
exports.SuccessResponseDto = exports.ErrorResponseDto = exports.BaseResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class BaseResponseDto {
    constructor(success, data, message, error) {
        this.success = success;
        this.data = data;
        this.message = message;
        this.error = error;
        this.timestamp = new Date().toISOString();
    }
    static success(data, message) {
        return new BaseResponseDto(true, data, message);
    }
    static error(message, error) {
        return new BaseResponseDto(false, null, message, error);
    }
}
exports.BaseResponseDto = BaseResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Success status' }),
    __metadata("design:type", Boolean)
], BaseResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Response message' }),
    __metadata("design:type", String)
], BaseResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Response data' }),
    __metadata("design:type", Object)
], BaseResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Error details' }),
    __metadata("design:type", Object)
], BaseResponseDto.prototype, "error", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Timestamp' }),
    __metadata("design:type", String)
], BaseResponseDto.prototype, "timestamp", void 0);
class ErrorResponseDto {
    constructor(statusCode, message, path, error) {
        this.statusCode = statusCode;
        this.message = message;
        this.error = error;
        this.timestamp = new Date().toISOString();
        this.path = path;
    }
}
exports.ErrorResponseDto = ErrorResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'HTTP status code' }),
    __metadata("design:type", Number)
], ErrorResponseDto.prototype, "statusCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Error message' }),
    __metadata("design:type", String)
], ErrorResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Error details' }),
    __metadata("design:type", String)
], ErrorResponseDto.prototype, "error", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Timestamp' }),
    __metadata("design:type", String)
], ErrorResponseDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Request path' }),
    __metadata("design:type", String)
], ErrorResponseDto.prototype, "path", void 0);
class SuccessResponseDto {
    constructor(data, message) {
        this.success = true;
        this.data = data;
        this.message = message;
        this.timestamp = new Date().toISOString();
    }
}
exports.SuccessResponseDto = SuccessResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Success status', default: true }),
    __metadata("design:type", Boolean)
], SuccessResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Success message' }),
    __metadata("design:type", String)
], SuccessResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Response data' }),
    __metadata("design:type", Object)
], SuccessResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Timestamp' }),
    __metadata("design:type", String)
], SuccessResponseDto.prototype, "timestamp", void 0);
//# sourceMappingURL=response.dto.js.map