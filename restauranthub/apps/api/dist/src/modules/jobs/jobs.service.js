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
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const client_1 = require("@prisma/client");
let JobsService = class JobsService {
    constructor(prisma, redisService) {
        this.prisma = prisma;
        this.redisService = redisService;
    }
    async create(restaurantId, userId, createJobDto) {
        const restaurant = await this.prisma.restaurant.findFirst({
            where: { id: restaurantId, userId },
        });
        if (!restaurant) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const job = await this.prisma.job.create({
            data: {
                ...createJobDto,
                restaurantId,
                validTill: new Date(createJobDto.validTill),
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
            },
        });
        return job;
    }
    async findAll(page = 1, limit = 20, filters) {
        const skip = (page - 1) * limit;
        const where = {
            status: client_1.JobStatus.OPEN,
            validTill: { gte: new Date() },
        };
        if (filters?.location) {
            where.location = {
                contains: filters.location,
                mode: 'insensitive',
            };
        }
        if (filters?.jobType) {
            where.jobType = {
                contains: filters.jobType,
                mode: 'insensitive',
            };
        }
        if (filters?.skills) {
            where.skills = {
                hasSome: Array.isArray(filters.skills) ? filters.skills : [filters.skills],
            };
        }
        if (filters?.experienceMin) {
            where.experienceMin = {
                lte: parseInt(filters.experienceMin),
            };
        }
        if (filters?.salaryMin && filters.salaryMax) {
            where.OR = [
                {
                    salaryMin: {
                        gte: parseFloat(filters.salaryMin),
                        lte: parseFloat(filters.salaryMax),
                    },
                },
                {
                    salaryMax: {
                        gte: parseFloat(filters.salaryMin),
                        lte: parseFloat(filters.salaryMax),
                    },
                },
            ];
        }
        const [jobs, total] = await Promise.all([
            this.prisma.job.findMany({
                where,
                skip,
                take: limit,
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
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            this.prisma.job.count({ where }),
        ]);
        return {
            data: jobs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findByRestaurant(restaurantId, page = 1, limit = 20, filters) {
        const skip = (page - 1) * limit;
        const where = { restaurantId };
        if (filters?.status) {
            where.status = filters.status;
        }
        const [jobs, total] = await Promise.all([
            this.prisma.job.findMany({
                where,
                skip,
                take: limit,
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
                    applications: {
                        include: {
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
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                    },
                    _count: {
                        select: {
                            applications: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            this.prisma.job.count({ where }),
        ]);
        return {
            data: jobs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        await this.prisma.job.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        });
        const job = await this.prisma.job.findUnique({
            where: { id },
            include: {
                restaurant: {
                    include: {
                        user: {
                            include: {
                                profile: true,
                            },
                        },
                        branches: true,
                    },
                },
                applications: {
                    include: {
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
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: {
                        applications: true,
                    },
                },
            },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        return job;
    }
    async update(id, userId, userRole, updateJobDto) {
        const job = await this.prisma.job.findUnique({
            where: { id },
            include: {
                restaurant: true,
            },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        ;
        if (userRole !== client_1.UserRole.ADMIN && job.restaurant.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const updatedJob = await this.prisma.job.update({
            where: { id },
            data: {
                ...updateJobDto,
                validTill: updateJobDto.validTill ? new Date(updateJobDto.validTill) : undefined,
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
            },
        });
        return updatedJob;
    }
    async updateStatus(id, status, userId, userRole) {
        const job = await this.prisma.job.findUnique({
            where: { id },
            include: {
                restaurant: true,
            },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        ;
        if (userRole !== client_1.UserRole.ADMIN && job.restaurant.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const updatedJob = await this.prisma.job.update({
            where: { id },
            data: { status },
        });
        return updatedJob;
    }
    async searchJobs(query, filters) {
        const where = {
            status: client_1.JobStatus.OPEN,
            validTill: { gte: new Date() },
            OR: [
                {
                    title: {
                        contains: query,
                        mode: 'insensitive',
                    },
                },
                {
                    description: {
                        contains: query,
                        mode: 'insensitive',
                    },
                },
                {
                    skills: {
                        hasSome: [query],
                    },
                },
            ],
        };
        if (filters?.location) {
            where.location = {
                contains: filters.location,
                mode: 'insensitive',
            };
        }
        if (filters?.jobType) {
            where.jobType = filters.jobType;
        }
        const jobs = await this.prisma.job.findMany({
            where,
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
            orderBy: {
                createdAt: 'desc',
            },
            take: 50,
        });
        return jobs;
    }
    async getJobStats(restaurantId) {
        const [totalJobs, openJobs, closedJobs, filledJobs, totalApplications, recentApplications,] = await Promise.all([
            this.prisma.job.count({ where: { restaurantId } }),
            this.prisma.job.count({ where: { restaurantId, status: client_1.JobStatus.OPEN } }),
            this.prisma.job.count({ where: { restaurantId, status: client_1.JobStatus.CLOSED } }),
            this.prisma.job.count({ where: { restaurantId, status: client_1.JobStatus.FILLED } }),
            this.prisma.jobApplication.count({
                where: { job: { restaurantId } },
            }),
            this.prisma.jobApplication.findMany({
                where: { job: { restaurantId } },
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    employee: {
                        include: {
                            user: {
                                include: {
                                    profile: true,
                                },
                            },
                        },
                    },
                    job: true,
                },
            }),
        ]);
        return {
            totalJobs,
            openJobs,
            closedJobs,
            filledJobs,
            totalApplications,
            recentApplications,
        };
    }
    async getRecommendedJobs(employeeId) {
        const employee = await this.prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                applications: {
                    include: {
                        job: true,
                    },
                },
            },
        });
        if (!employee) {
            return [];
        }
        const appliedJobIds = employee.applications.map(app => app.job.id);
        const jobs = await this.prisma.job.findMany({
            where: {
                id: { notIn: appliedJobIds },
                status: client_1.JobStatus.OPEN,
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
            orderBy: {
                createdAt: 'desc',
            },
            take: 10,
        });
        return jobs;
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
    async findEmployeeByUserId(userId) {
        const employee = await this.prisma.employee.findFirst({
            where: { userId },
        });
        if (!employee) {
            throw new common_1.ForbiddenException('Employee profile not found');
        }
        return employee;
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], JobsService);
//# sourceMappingURL=jobs.service.js.map