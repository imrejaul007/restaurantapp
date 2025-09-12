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
exports.ScheduleInterviewDto = exports.InterviewType = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var InterviewType;
(function (InterviewType) {
    InterviewType["IN_PERSON"] = "IN_PERSON";
    InterviewType["VIDEO_CALL"] = "VIDEO_CALL";
    InterviewType["PHONE"] = "PHONE";
})(InterviewType || (exports.InterviewType = InterviewType = {}));
class ScheduleInterviewDto {
}
exports.ScheduleInterviewDto = ScheduleInterviewDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-12-15T10:00:00Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ScheduleInterviewDto.prototype, "scheduledFor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: InterviewType, example: InterviewType.IN_PERSON }),
    (0, class_validator_1.IsEnum)(InterviewType),
    __metadata("design:type", String)
], ScheduleInterviewDto.prototype, "interviewType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Restaurant Main Branch - Conference Room 1' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScheduleInterviewDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Please bring your ID and work permit documents' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScheduleInterviewDto.prototype, "notes", void 0);
//# sourceMappingURL=schedule-interview.dto.js.map