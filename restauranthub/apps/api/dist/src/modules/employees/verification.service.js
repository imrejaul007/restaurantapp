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
exports.VerificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let VerificationService = class VerificationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async verifyAadhar(aadharNumber) {
        const isValid = this.validateAadharFormat(aadharNumber);
        if (!isValid) {
            return { isValid: false };
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockData = {
            name: 'John Doe',
            gender: 'M',
            dateOfBirth: '01-01-1990',
            address: '123 Main St, City, State, PIN',
        };
        return {
            isValid: true,
            data: mockData,
        };
    }
    async verifyPAN(panNumber) {
        const isValid = this.validatePANFormat(panNumber);
        if (!isValid) {
            return { isValid: false };
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockData = {
            name: 'John Doe',
            category: 'Individual',
            status: 'Valid',
        };
        return {
            isValid: true,
            data: mockData,
        };
    }
    async createVerificationRequest(employeeId, documentType, documentData) {
        return { id: 'temp', employeeId, type: documentType, verificationStatus: 'PENDING' };
    }
    async updateVerificationStatus(documentId, status, notes) {
        return { id: documentId, verificationStatus: status };
    }
    validateAadharFormat(aadhar) {
        const pattern = /^\d{12}$/;
        return pattern.test(aadhar);
    }
    validatePANFormat(pan) {
        const pattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        return pattern.test(pan);
    }
    async getVerificationStats() {
        const [pendingCount, verifiedCount, rejectedCount] = [0, 0, 0];
        return {
            pending: pendingCount,
            verified: verifiedCount,
            rejected: rejectedCount,
            total: pendingCount + verifiedCount + rejectedCount,
        };
    }
};
exports.VerificationService = VerificationService;
exports.VerificationService = VerificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VerificationService);
//# sourceMappingURL=verification.service.js.map