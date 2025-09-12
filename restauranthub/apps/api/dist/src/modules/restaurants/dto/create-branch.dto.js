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
exports.CreateBranchDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateBranchDto {
}
exports.CreateBranchDto = CreateBranchDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Main Branch' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123 Main Street, Downtown' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Mumbai' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Maharashtra' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '400001' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "pincode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+919876543210' }),
    (0, class_validator_1.IsPhoneNumber)('IN'),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'branch@restaurant.com' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "managerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 19.0760 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateBranchDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 72.8777 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateBranchDto.prototype, "longitude", void 0);
//# sourceMappingURL=create-branch.dto.js.map