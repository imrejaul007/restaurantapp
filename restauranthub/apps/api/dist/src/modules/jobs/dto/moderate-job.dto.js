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
exports.ModerateJobDto = exports.ModerationPriority = exports.ModerationAction = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var ModerationAction;
(function (ModerationAction) {
    ModerationAction["APPROVE"] = "APPROVE";
    ModerationAction["REJECT"] = "REJECT";
    ModerationAction["REQUEST_CHANGES"] = "REQUEST_CHANGES";
    ModerationAction["FLAG"] = "FLAG";
    ModerationAction["SUSPEND"] = "SUSPEND";
})(ModerationAction || (exports.ModerationAction = ModerationAction = {}));
var ModerationPriority;
(function (ModerationPriority) {
    ModerationPriority["LOW"] = "LOW";
    ModerationPriority["MEDIUM"] = "MEDIUM";
    ModerationPriority["HIGH"] = "HIGH";
    ModerationPriority["URGENT"] = "URGENT";
})(ModerationPriority || (exports.ModerationPriority = ModerationPriority = {}));
class ModerateJobDto {
}
exports.ModerateJobDto = ModerateJobDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ModerationAction, example: ModerationAction.APPROVE }),
    (0, class_validator_1.IsEnum)(ModerationAction),
    __metadata("design:type", String)
], ModerateJobDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Job approved - meets all quality standards' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ModerateJobDto.prototype, "moderatorNotes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Salary range needs clarification' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ModerateJobDto.prototype, "feedback", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ModerationPriority, example: ModerationPriority.MEDIUM }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ModerationPriority),
    __metadata("design:type", String)
], ModerateJobDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ModerateJobDto.prototype, "requiresFollowUp", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['misleading-salary', 'incomplete-description'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ModerateJobDto.prototype, "flagReasons", void 0);
//# sourceMappingURL=moderate-job.dto.js.map