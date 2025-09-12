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
exports.EmployeeAvailabilityDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class EmployeeAvailabilityDto {
}
exports.EmployeeAvailabilityDto = EmployeeAvailabilityDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['Full-time', 'Part-time'] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], EmployeeAvailabilityDto.prototype, "preferredJobTypes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['Mumbai', 'Pune', 'Delhi'] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], EmployeeAvailabilityDto.prototype, "preferredLocations", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['Chef', 'Server', 'Kitchen Assistant'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], EmployeeAvailabilityDto.prototype, "preferredRoles", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 25000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], EmployeeAvailabilityDto.prototype, "expectedSalaryMin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 50000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], EmployeeAvailabilityDto.prototype, "expectedSalaryMax", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], EmployeeAvailabilityDto.prototype, "availableDays", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['Morning', 'Evening'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], EmployeeAvailabilityDto.prototype, "preferredShifts", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], EmployeeAvailabilityDto.prototype, "openToRelocation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Looking for opportunities to grow in fine dining' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EmployeeAvailabilityDto.prototype, "notes", void 0);
//# sourceMappingURL=employee-availability.dto.js.map