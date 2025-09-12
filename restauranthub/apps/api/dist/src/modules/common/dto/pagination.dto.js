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
exports.PaginationWithDateRangeDto = exports.DateRangeDto = exports.PaginationDto = void 0;
exports.createPaginatedResponse = createPaginatedResponse;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class PaginationDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
        this.sortBy = 'createdAt';
        this.sortOrder = 'desc';
    }
}
exports.PaginationDto = PaginationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Page number (starts from 1)',
        default: 1,
        minimum: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PaginationDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Number of items per page',
        default: 20,
        minimum: 1,
        maximum: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], PaginationDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Search term for filtering results',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaginationDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Sort field',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaginationDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Sort order',
        enum: ['asc', 'desc'],
        default: 'desc',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['asc', 'desc']),
    __metadata("design:type", String)
], PaginationDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Number of items to skip (calculated from page and limit)',
    }),
    __metadata("design:type", Number)
], PaginationDto.prototype, "skip", void 0);
class DateRangeDto {
}
exports.DateRangeDto = DateRangeDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Start date (ISO string)',
        example: '2024-01-01T00:00:00.000Z',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DateRangeDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'End date (ISO string)',
        example: '2024-12-31T23:59:59.999Z',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DateRangeDto.prototype, "to", void 0);
class PaginationWithDateRangeDto extends PaginationDto {
}
exports.PaginationWithDateRangeDto = PaginationWithDateRangeDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Start date for filtering (ISO string)',
        example: '2024-01-01T00:00:00.000Z',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], PaginationWithDateRangeDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'End date for filtering (ISO string)',
        example: '2024-12-31T23:59:59.999Z',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], PaginationWithDateRangeDto.prototype, "to", void 0);
function createPaginatedResponse(data, totalItems, page, limit) {
    const totalPages = Math.ceil(totalItems / limit);
    return {
        data,
        meta: {
            page,
            limit,
            totalItems,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
}
//# sourceMappingURL=pagination.dto.js.map