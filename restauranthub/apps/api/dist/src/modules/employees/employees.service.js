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
var EmployeesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let EmployeesService = EmployeesService_1 = class EmployeesService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(EmployeesService_1.name);
    }
    async create(restaurantId, createEmployeeDto) {
        try {
            this.logger.warn('Employee management not fully implemented - returning stub response');
            const employeeCode = await this.generateEmployeeCode();
            return {
                id: 'stub-' + Date.now(),
                restaurantId,
                employeeCode,
                ...createEmployeeDto,
                joiningDate: new Date(createEmployeeDto.joiningDate),
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }
        catch (error) {
            this.logger.error('Failed to create employee', error);
            throw error;
        }
    }
    async findByRestaurant(restaurantId, page = 1, limit = 20, filters) {
        try {
            this.logger.warn('Employee management not fully implemented - returning empty result');
            return {
                employees: [],
                total: 0,
                page,
                limit,
                totalPages: 0,
            };
        }
        catch (error) {
            this.logger.error('Failed to find employees', error);
            throw error;
        }
    }
    async findOne(id) {
        try {
            const employee = await this.prisma.employee.findUnique({
                where: { id },
                include: {
                    user: true,
                    restaurant: true,
                },
            });
            if (!employee) {
                throw new common_1.NotFoundException('Employee not found');
            }
            return employee;
        }
        catch (error) {
            this.logger.error('Failed to find employee', error);
            throw error;
        }
    }
    async update(id, updateEmployeeDto) {
        try {
            this.logger.warn('Employee management not fully implemented - employee not found');
            throw new common_1.NotFoundException('Employee not found');
        }
        catch (error) {
            this.logger.error('Failed to update employee', error);
            throw error;
        }
    }
    async remove(id) {
        try {
            this.logger.warn('Employee management not fully implemented - employee not found');
            throw new common_1.NotFoundException('Employee not found');
        }
        catch (error) {
            this.logger.error('Failed to remove employee', error);
            throw error;
        }
    }
    async getProfile(employeeId) {
        try {
            return this.findOne(employeeId);
        }
        catch (error) {
            this.logger.error('Failed to get employee profile', error);
            throw error;
        }
    }
    async getPerformanceReport(employeeId) {
        try {
            this.logger.warn('Performance reporting not implemented - returning stub response');
            return {
                employeeId,
                period: 'monthly',
                performance: {
                    rating: 0,
                    completedTasks: 0,
                    attendance: 0,
                    punctuality: 0,
                },
                feedback: [],
                goals: [],
            };
        }
        catch (error) {
            this.logger.error('Failed to get performance report', error);
            throw error;
        }
    }
    async getAttendance(employeeId) {
        try {
            const attendanceRecords = [];
            return {
                records: attendanceRecords,
                summary: {
                    totalDays: attendanceRecords.length,
                    presentDays: attendanceRecords.filter(r => r.status === 'present').length,
                    absentDays: attendanceRecords.filter(r => r.status === 'absent').length,
                    lateDays: attendanceRecords.filter(r => r.status === 'late').length,
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to get attendance', error);
            throw error;
        }
    }
    async markAttendance(employeeId, data) {
        try {
            const attendance = { id: 'mock-id', employeeId, ...data };
            return attendance;
        }
        catch (error) {
            this.logger.error('Failed to mark attendance', error);
            throw error;
        }
    }
    async generateEmployeeCode() {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `EMP${timestamp}${random}`;
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = EmployeesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map