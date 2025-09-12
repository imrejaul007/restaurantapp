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
exports.EmployeeAvailabilityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const client_1 = require("@prisma/client");
let EmployeeAvailabilityService = class EmployeeAvailabilityService {
    constructor(prisma, redisService) {
        this.prisma = prisma;
        this.redisService = redisService;
        this.availabilityCache = new Map();
    }
    async updateAvailability(employeeId, availabilityData, userId, userRole) {
        if (userRole !== client_1.UserRole.ADMIN) {
            const employee = await this.prisma.employee.findUnique({
                where: { id: employeeId },
            });
            if (!employee || employee.userId !== userId) {
                throw new common_1.ForbiddenException('Access denied');
            }
        }
        const cacheKey = `availability:${employeeId}`;
        const availabilityRecord = {
            employeeId,
            ...availabilityData,
            updatedAt: new Date(),
            isActive: true,
        };
        this.availabilityCache.set(cacheKey, availabilityRecord);
        await this.redisService.publish(`employee:${employeeId}`, JSON.stringify({
            type: 'availability:updated',
            data: {
                employeeId,
                availability: availabilityRecord,
            },
        }));
        return availabilityRecord;
    }
    async getAvailability(employeeId, userId, userRole) {
        if (userRole === client_1.UserRole.EMPLOYEE) {
            const employee = await this.prisma.employee.findUnique({
                where: { id: employeeId },
            });
            if (!employee || employee.userId !== userId) {
                throw new common_1.ForbiddenException('Access denied');
            }
        }
        else if (userRole === client_1.UserRole.RESTAURANT) {
            const employee = await this.prisma.employee.findUnique({
                where: { id: employeeId },
                include: { restaurant: true },
            });
            if (!employee || employee.restaurant.userId !== userId) {
                throw new common_1.ForbiddenException('Access denied');
            }
        }
        const cacheKey = `availability:${employeeId}`;
        const availability = this.availabilityCache.get(cacheKey);
        if (!availability) {
            return {
                employeeId,
                preferredJobTypes: ['Full-time'],
                preferredLocations: [],
                preferredRoles: [],
                isActive: false,
                message: 'Employee has not set availability preferences yet',
            };
        }
        return availability;
    }
    async getAvailableEmployees(filters) {
        const employees = await this.prisma.employee.findMany({
            where: {
                isActive: true,
            },
            include: {
                user: {
                    include: {
                        profile: true,
                    },
                },
                applications: {
                    where: {
                        status: 'PENDING',
                    },
                    include: {
                        job: true,
                    },
                },
                employmentHistory: {
                    orderBy: {
                        startDate: 'desc',
                    },
                    take: 1,
                },
            },
        });
        const availableEmployees = employees
            .map(employee => {
            const cacheKey = `availability:${employee.id}`;
            const availability = this.availabilityCache.get(cacheKey);
            if (!availability || !availability.isActive) {
                return null;
            }
            return {
                ...employee,
                availability,
                isAvailable: true,
                activeApplicationsCount: employee.applications.length,
                lastEmployment: employee.employmentHistory[0] || null,
            };
        })
            .filter(employee => employee !== null);
        let filteredEmployees = availableEmployees;
        if (filters?.location) {
            filteredEmployees = filteredEmployees.filter(emp => emp.availability.preferredLocations.some((loc) => loc.toLowerCase().includes(filters.location.toLowerCase())));
        }
        if (filters?.jobType) {
            filteredEmployees = filteredEmployees.filter(emp => emp.availability.preferredJobTypes.includes(filters.jobType));
        }
        if (filters?.role) {
            filteredEmployees = filteredEmployees.filter(emp => emp.availability.preferredRoles.includes(filters.role));
        }
        if (filters?.salaryMin) {
            filteredEmployees = filteredEmployees.filter(emp => !emp.availability.expectedSalaryMin ||
                emp.availability.expectedSalaryMin <= parseInt(filters.salaryMin));
        }
        if (filters?.salaryMax) {
            filteredEmployees = filteredEmployees.filter(emp => !emp.availability.expectedSalaryMax ||
                emp.availability.expectedSalaryMax >= parseInt(filters.salaryMax));
        }
        return {
            data: filteredEmployees,
            total: filteredEmployees.length,
            filters: filters || {},
        };
    }
    async matchJobsToEmployee(employeeId, userId, userRole) {
        if (userRole === client_1.UserRole.EMPLOYEE) {
            const employee = await this.prisma.employee.findUnique({
                where: { id: employeeId },
            });
            if (!employee || employee.userId !== userId) {
                throw new common_1.ForbiddenException('Access denied');
            }
        }
        const availability = await this.getAvailability(employeeId, userId, userRole);
        if (!availability.isActive) {
            return {
                matches: [],
                message: 'Employee availability not set or inactive',
            };
        }
        const jobs = await this.prisma.job.findMany({
            where: {
                status: 'OPEN',
                validTill: { gte: new Date() },
            },
            include: {
                restaurant: {
                    include: {
                        user: {
                            include: {
                                profile: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        applications: true,
                    },
                },
            },
        });
        const matchedJobs = jobs
            .map(job => {
            let matchScore = 0;
            const matchReasons = [];
            if (availability.preferredLocations.some((loc) => job.location.toLowerCase().includes(loc.toLowerCase()))) {
                matchScore += 30;
                matchReasons.push('Location preference match');
            }
            if (availability.preferredJobTypes.includes(job.jobType)) {
                matchScore += 25;
                matchReasons.push('Job type preference match');
            }
            if (availability.preferredRoles && availability.preferredRoles.some((role) => job.title.toLowerCase().includes(role.toLowerCase()))) {
                matchScore += 35;
                matchReasons.push('Role preference match');
            }
            if (availability.expectedSalaryMin && job.salaryMin &&
                job.salaryMin >= availability.expectedSalaryMin) {
                matchScore += 10;
                matchReasons.push('Salary expectation met');
            }
            return {
                ...job,
                matchScore,
                matchReasons,
                isMatch: matchScore >= 25,
            };
        })
            .filter(job => job.isMatch)
            .sort((a, b) => b.matchScore - a.matchScore);
        return {
            matches: matchedJobs.slice(0, 20),
            total: matchedJobs.length,
            employeeId,
            availability,
        };
    }
    async deactivateAvailability(employeeId, userId, userRole) {
        if (userRole !== client_1.UserRole.ADMIN) {
            const employee = await this.prisma.employee.findUnique({
                where: { id: employeeId },
            });
            if (!employee || employee.userId !== userId) {
                throw new common_1.ForbiddenException('Access denied');
            }
        }
        const cacheKey = `availability:${employeeId}`;
        const availability = this.availabilityCache.get(cacheKey);
        if (availability) {
            availability.isActive = false;
            availability.deactivatedAt = new Date();
            this.availabilityCache.set(cacheKey, availability);
            await this.redisService.publish(`employee:${employeeId}`, JSON.stringify({
                type: 'availability:deactivated',
                data: {
                    employeeId,
                },
            }));
        }
        return { message: 'Availability deactivated successfully' };
    }
    async getAvailabilityStats(restaurantId) {
        let employees;
        if (restaurantId) {
            employees = await this.prisma.employee.findMany({
                where: {
                    restaurantId,
                    isActive: true,
                },
            });
        }
        else {
            employees = await this.prisma.employee.findMany({
                where: {
                    isActive: true,
                },
            });
        }
        const totalEmployees = employees.length;
        const availableEmployees = employees.filter(emp => {
            const cacheKey = `availability:${emp.id}`;
            const availability = this.availabilityCache.get(cacheKey);
            return availability && availability.isActive;
        }).length;
        const availabilityBreakdown = {
            fullTime: 0,
            partTime: 0,
            contract: 0,
        };
        employees.forEach(emp => {
            const cacheKey = `availability:${emp.id}`;
            const availability = this.availabilityCache.get(cacheKey);
            if (availability && availability.isActive) {
                if (availability.preferredJobTypes.includes('Full-time')) {
                    availabilityBreakdown.fullTime++;
                }
                if (availability.preferredJobTypes.includes('Part-time')) {
                    availabilityBreakdown.partTime++;
                }
                if (availability.preferredJobTypes.includes('Contract')) {
                    availabilityBreakdown.contract++;
                }
            }
        });
        return {
            totalEmployees,
            availableEmployees,
            availabilityRate: totalEmployees > 0 ? (availableEmployees / totalEmployees * 100).toFixed(1) : 0,
            availabilityBreakdown,
        };
    }
};
exports.EmployeeAvailabilityService = EmployeeAvailabilityService;
exports.EmployeeAvailabilityService = EmployeeAvailabilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], EmployeeAvailabilityService);
//# sourceMappingURL=employee-availability.service.js.map