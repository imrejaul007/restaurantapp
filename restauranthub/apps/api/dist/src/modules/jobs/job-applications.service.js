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
exports.JobApplicationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const client_1 = require("@prisma/client");
let JobApplicationsService = class JobApplicationsService {
    constructor(prisma, redisService) {
        this.prisma = prisma;
        this.redisService = redisService;
    }
    async create(jobId, employeeId, createApplicationDto) {
        const existingApplication = await this.prisma.jobApplication.findFirst({
            where: {
                AND: [
                    { jobId: jobId },
                    { employeeId: employeeId }
                ]
            },
        });
        if (existingApplication) {
            throw new common_1.ConflictException('Already applied to this job');
        }
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
        });
        if (!job || job.status !== 'OPEN' || (job.validTill && job.validTill < new Date())) {
            throw new common_1.ForbiddenException('Job is no longer accepting applications');
        }
        const application = await this.prisma.jobApplication.create({
            data: {
                ...createApplicationDto,
                jobId: jobId,
                employeeId: employeeId,
            },
            include: {
                job: {
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
                    },
                },
                employee: {
                    include: {
                        user: {
                            include: {
                                profile: true,
                            },
                        },
                    },
                },
            },
        });
        await this.prisma.job.update({
            where: { id: jobId },
            data: { applicationCount: { increment: 1 } },
        });
        await this.sendApplicationNotification(application);
        return application;
    }
    async findByEmployee(employeeId, page = 1, limit = 20, filters) {
        const skip = (page - 1) * limit;
        const where = { employeeId };
        if (filters?.status) {
            where.status = filters.status;
        }
        const [applications, total] = await Promise.all([
            this.prisma.jobApplication.findMany({
                where,
                skip,
                take: limit,
                include: {
                    job: {
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
                        },
                    },
                    employee: {
                        include: {
                            user: {
                                include: {
                                    profile: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            this.prisma.jobApplication.count({ where }),
        ]);
        return {
            data: applications,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findByJob(jobId, page = 1, limit = 20, filters) {
        const skip = (page - 1) * limit;
        const where = { jobId };
        if (filters?.status) {
            where.status = filters.status;
        }
        const [applications, total] = await Promise.all([
            this.prisma.jobApplication.findMany({
                where,
                skip,
                take: limit,
                include: {
                    job: {
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
                        },
                    },
                    employee: {
                        include: {
                            user: {
                                include: {
                                    profile: true,
                                },
                            },
                            documents: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            this.prisma.jobApplication.count({ where }),
        ]);
        return {
            data: applications,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        const application = await this.prisma.jobApplication.findUnique({
            where: { id },
            include: {
                job: {
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
                    },
                },
                employee: {
                    include: {
                        user: {
                            include: {
                                profile: true,
                            },
                        },
                        documents: true,
                        attendance: {
                            where: {
                                date: {
                                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!application) {
            throw new common_1.NotFoundException('Application not found');
        }
        return application;
    }
    async updateStatus(id, status, reviewNotes, userId, userRole) {
        const application = await this.findOne(id);
        if (userRole !== client_1.UserRole.ADMIN && application.job.restaurant.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const updatedApplication = await this.prisma.jobApplication.update({
            where: { id },
            data: {
                status,
                reviewNotes,
                reviewedAt: new Date(),
            },
            include: {
                job: {
                    include: {
                        restaurant: true,
                    },
                },
                employee: {
                    include: {
                        user: {
                            include: {
                                profile: true,
                            },
                        },
                    },
                },
            },
        });
        await this.sendStatusUpdateNotification(updatedApplication);
        return updatedApplication;
    }
    async withdraw(id, employeeId) {
        const application = await this.findOne(id);
        if (application.employeeId !== employeeId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        if (application.status !== client_1.ApplicationStatus.PENDING) {
            throw new common_1.ForbiddenException('Cannot withdraw application that has been reviewed');
        }
        await this.prisma.jobApplication.delete({
            where: { id },
        });
        await this.prisma.job.update({
            where: { id: application.jobId },
            data: { applicationCount: { decrement: 1 } },
        });
        return { message: 'Application withdrawn successfully' };
    }
    async getApplicationStats(restaurantId, employeeId) {
        const where = {};
        if (restaurantId) {
            where.job = { restaurantId };
        }
        if (employeeId) {
            where.employeeId = employeeId;
        }
        const [totalApplications, pendingApplications, reviewedApplications, shortlistedApplications, acceptedApplications, rejectedApplications,] = await Promise.all([
            this.prisma.jobApplication.count({ where }),
            this.prisma.jobApplication.count({ where: { ...where, status: client_1.ApplicationStatus.PENDING } }),
            this.prisma.jobApplication.count({ where: { ...where, status: client_1.ApplicationStatus.REVIEWED } }),
            this.prisma.jobApplication.count({ where: { ...where, status: client_1.ApplicationStatus.SHORTLISTED } }),
            this.prisma.jobApplication.count({ where: { ...where, status: client_1.ApplicationStatus.ACCEPTED } }),
            this.prisma.jobApplication.count({ where: { ...where, status: client_1.ApplicationStatus.REJECTED } }),
        ]);
        return {
            total: totalApplications,
            pending: pendingApplications,
            reviewed: reviewedApplications,
            shortlisted: shortlistedApplications,
            accepted: acceptedApplications,
            rejected: rejectedApplications,
        };
    }
    async sendApplicationNotification(application) {
        console.log(`New application for job ${application.job.title} from ${application.employee.user.profile.firstName}`);
        await this.redisService.publish(`restaurant:${application.job.restaurantId}`, JSON.stringify({
            type: 'job:application',
            data: {
                applicationId: application.id,
                jobId: application.jobId,
                employeeName: `${application.employee.user.profile.firstName} ${application.employee.user.profile.lastName}`,
            },
        }));
    }
    async sendStatusUpdateNotification(application) {
        console.log(`Application status updated to ${application.status} for ${application.employee.user.profile.firstName}`);
        await this.redisService.publish(`employee:${application.employeeId}`, JSON.stringify({
            type: 'application:status',
            data: {
                applicationId: application.id,
                status: application.status,
                jobTitle: application.job.title,
                restaurantName: application.job.restaurant.name,
            },
        }));
    }
    async findEmployeeByUserId(userId) {
        const employee = await this.prisma.employee.findFirst({
            where: { userId },
        });
        if (!employee) {
            throw new common_1.ForbiddenException('Employee profile not found');
        }
        return employee;
    }
    async findRestaurantByUserId(userId) {
        const restaurant = await this.prisma.restaurant.findFirst({
            where: { userId },
        });
        if (!restaurant) {
            throw new common_1.ForbiddenException('Restaurant profile not found');
        }
        return restaurant;
    }
    async verifyJobOwnership(jobId, userId) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                restaurant: true,
            },
        });
        if (!job || job.restaurant.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied to this job');
        }
        return job;
    }
    async scheduleInterview(id, interviewData, userId, userRole) {
        const application = await this.findOne(id);
        if (userRole !== client_1.UserRole.ADMIN && application.job.restaurant.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const interviewDetails = `Interview scheduled: ${interviewData.scheduledFor}, Type: ${interviewData.interviewType}, Location: ${interviewData.location || 'TBD'}, Notes: ${interviewData.notes || 'None'}`;
        const updatedApplication = await this.prisma.jobApplication.update({
            where: { id },
            data: {
                status: client_1.ApplicationStatus.SHORTLISTED,
                reviewNotes: interviewDetails,
                reviewedAt: new Date(),
            },
        });
        await this.sendStatusUpdateNotification({
            ...updatedApplication,
            job: application.job,
            employee: application.employee,
        });
        return updatedApplication;
    }
    async hire(id, contractData, userId, userRole) {
        const application = await this.findOne(id);
        if (userRole !== client_1.UserRole.ADMIN && application.job.restaurant.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const updatedApplication = await this.prisma.jobApplication.update({
            where: { id },
            data: {
                status: client_1.ApplicationStatus.ACCEPTED,
                reviewNotes: `Hired: ${contractData.position} starting ${contractData.startDate}`,
                reviewedAt: new Date(),
            },
        });
        const employmentHistory = await this.prisma.employmentHistory.create({
            data: {
                employeeId: application.employeeId,
                restaurantId: application.job.restaurantId,
                startDate: new Date(contractData.startDate),
                position: contractData.position,
                department: contractData.department,
            },
        });
        if (contractData.closeJob) {
            await this.prisma.job.update({
                where: { id: application.jobId },
                data: { status: 'FILLED' },
            });
        }
        await this.sendStatusUpdateNotification({
            ...updatedApplication,
            job: application.job,
            employee: application.employee,
        });
        return { application: updatedApplication, employmentHistory };
    }
    async rateEmployee(employmentHistoryId, ratingData, userId, userRole) {
        const employmentHistory = await this.prisma.employmentHistory.findUnique({
            where: { id: employmentHistoryId },
            include: {
                employee: {
                    include: {
                        user: true,
                    },
                },
                restaurant: true,
            },
        });
        if (!employmentHistory) {
            throw new common_1.NotFoundException('Employment history not found');
        }
        if (userRole !== client_1.UserRole.ADMIN && employmentHistory.restaurant.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const updatedHistory = await this.prisma.employmentHistory.update({
            where: { id: employmentHistoryId },
            data: {
                rating: ratingData.rating,
                review: ratingData.review,
                reason: ratingData.reason || null,
            },
        });
        return updatedHistory;
    }
    async getEmploymentHistory(employeeId, userId, userRole) {
        if (userRole === client_1.UserRole.EMPLOYEE) {
            const employee = await this.findEmployeeByUserId(userId);
            if (employee.id !== employeeId) {
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
        const history = await this.prisma.employmentHistory.findMany({
            where: { employeeId },
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
            },
            orderBy: {
                startDate: 'desc',
            },
        });
        return history;
    }
    async terminateEmployment(employmentHistoryId, terminationData, userId, userRole) {
        const employmentHistory = await this.prisma.employmentHistory.findUnique({
            where: { id: employmentHistoryId },
            include: {
                restaurant: true,
            },
        });
        if (!employmentHistory) {
            throw new common_1.NotFoundException('Employment history not found');
        }
        if (userRole !== client_1.UserRole.ADMIN && employmentHistory.restaurant.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const updatedHistory = await this.prisma.employmentHistory.update({
            where: { id: employmentHistoryId },
            data: {
                endDate: new Date(terminationData.endDate || new Date()),
                reason: terminationData.reason,
                rating: terminationData.rating || null,
                review: terminationData.review || null,
            },
        });
        return updatedHistory;
    }
    async getJobApplicationAnalytics(jobId) {
        const [totalApplications, statusBreakdown, applicationsByDate, topSkills,] = await Promise.all([
            this.prisma.jobApplication.count({ where: { jobId } }),
            this.prisma.jobApplication.groupBy({
                by: ['status'],
                where: { jobId },
                _count: { status: true },
            }),
            this.prisma.$queryRaw `
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM job_applications
        WHERE job_id = ${jobId}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `,
            this.prisma.$queryRaw `
        SELECT skill, COUNT(*) as count
        FROM job_applications ja
        JOIN employees e ON ja.employee_id = e.id
        CROSS JOIN LATERAL unnest(e.skills) as skill
        WHERE ja.job_id = ${jobId}
        GROUP BY skill
        ORDER BY count DESC
        LIMIT 10
      `,
        ]);
        return {
            totalApplications,
            statusBreakdown,
            applicationsByDate,
            topSkills,
        };
    }
};
exports.JobApplicationsService = JobApplicationsService;
exports.JobApplicationsService = JobApplicationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], JobApplicationsService);
//# sourceMappingURL=job-applications.service.js.map