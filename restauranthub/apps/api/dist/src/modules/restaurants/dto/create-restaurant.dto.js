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
exports.CreateRestaurantDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateRestaurantDto {
}
exports.CreateRestaurantDto = CreateRestaurantDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'The Food Court' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Best Indian cuisine in the city' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['Indian', 'Chinese', 'Continental'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateRestaurantDto.prototype, "cuisineType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "logo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "banner", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'FL123456789' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "licenseNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '27ABCDE1234F1Z5' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "gstNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '12345678901234' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "fssaiNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'ABCDE1234F' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "panNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '1234567890' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "bankAccountNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'State Bank of India' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "bankName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'SBIN0001234' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRestaurantDto.prototype, "ifscCode", void 0);
//# sourceMappingURL=create-restaurant.dto.js.map