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
var SearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let SearchService = SearchService_1 = class SearchService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SearchService_1.name);
    }
    async searchRestaurants(query, filters = {}, pagination) {
        const cacheKey = `search:restaurants:${JSON.stringify({ query, filters, pagination })}`;
        const cached = null;
        if (cached) {
            return JSON.parse(cached);
        }
        const searchConditions = {
            AND: [
                { isActive: true },
                { status: 'ACTIVE' },
            ],
        };
        if (query && query.trim()) {
            searchConditions.AND.push({
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                    { cuisineType: { has: query } },
                ],
            });
        }
        if (filters.category && filters.category.length > 0) {
            searchConditions.AND.push({
                cuisineType: { hasSome: filters.category },
            });
        }
        if (filters.rating) {
            searchConditions.AND.push({
                rating: { gte: filters.rating },
            });
        }
        if (filters.availability) {
            searchConditions.AND.push({
                isActive: true,
            });
        }
        const orderBy = this.buildOrderBy(pagination.sortBy, pagination.sortOrder);
        const [restaurants, totalCount] = await Promise.all([
            this.prisma.restaurant.findMany({
                where: searchConditions,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    _count: {
                        select: {
                            orders: true,
                        },
                    },
                },
                orderBy,
                skip: pagination.skip,
                take: pagination.limit,
            }),
            this.prisma.restaurant.count({ where: searchConditions }),
        ]);
        const result = (0, pagination_dto_1.createPaginatedResponse)(restaurants, totalCount, pagination.page || 1, pagination.limit || 20);
        return result;
    }
    async searchProducts(query, filters = {}, pagination) {
        const cacheKey = `search:products:${JSON.stringify({ query, filters, pagination })}`;
        const cached = null;
        if (cached) {
            return JSON.parse(cached);
        }
        const searchConditions = {
            AND: [
                { isActive: true },
            ],
        };
        if (query && query.trim()) {
            searchConditions.AND.push({
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                    { category: { name: { contains: query, mode: 'insensitive' } } },
                    { tags: { has: query } },
                    { sku: { contains: query, mode: 'insensitive' } },
                ],
            });
        }
        if (filters.category && filters.category.length > 0) {
            searchConditions.AND.push({
                categoryId: { in: filters.category },
            });
        }
        if (filters.priceRange) {
            searchConditions.AND.push({
                AND: [
                    { price: { gte: filters.priceRange.min } },
                    { price: { lte: filters.priceRange.max } },
                ],
            });
        }
        if (filters.availability) {
            searchConditions.AND.push({
                quantity: { gt: 0 },
            });
        }
        if (filters.tags && filters.tags.length > 0) {
            searchConditions.AND.push({
                tags: { hasSome: filters.tags },
            });
        }
        const orderBy = this.buildOrderBy(pagination.sortBy, pagination.sortOrder);
        const [products, totalCount] = await Promise.all([
            this.prisma.product.findMany({
                where: searchConditions,
                include: {
                    vendor: {
                        select: {
                            id: true,
                            businessName: true,
                            user: {
                                select: {
                                    email: true,
                                    restaurant: true,
                                    employee: true,
                                    vendor: true,
                                },
                            },
                        },
                    },
                    reviews: {
                        select: {
                            rating: true,
                        },
                    },
                    _count: {
                        select: {
                            orderItems: true,
                        },
                    },
                },
                orderBy,
                skip: pagination.skip,
                take: pagination.limit,
            }),
            this.prisma.product.count({ where: searchConditions }),
        ]);
        const result = (0, pagination_dto_1.createPaginatedResponse)(products, totalCount, pagination.page || 1, pagination.limit || 20);
        return result;
    }
    async searchJobs(query, filters = {}, pagination) {
        const searchConditions = {
            AND: [
                { isActive: true },
                { status: 'OPEN' },
            ],
        };
        if (query && query.trim()) {
            searchConditions.AND.push({
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                    { requirements: { contains: query, mode: 'insensitive' } },
                    { location: { contains: query, mode: 'insensitive' } },
                    { skills: { has: query } },
                ],
            });
        }
        if (filters.location) {
            searchConditions.AND.push({
                location: { contains: query, mode: 'insensitive' },
            });
        }
        if (filters.dateRange) {
            searchConditions.AND.push({
                createdAt: {
                    gte: filters.dateRange.from,
                    lte: filters.dateRange.to,
                },
            });
        }
        if (filters.status && filters.status.length > 0) {
            searchConditions.AND.push({
                status: { in: filters.status },
            });
        }
        const orderBy = this.buildOrderBy(pagination.sortBy, pagination.sortOrder);
        const [jobs, totalCount] = await Promise.all([
            this.prisma.job.findMany({
                where: searchConditions,
                include: {
                    restaurant: {
                        select: {
                            id: true,
                            businessName: true,
                            user: {
                                select: {
                                    restaurant: true,
                                    employee: true,
                                    vendor: true,
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
                orderBy,
                skip: pagination.skip,
                take: pagination.limit,
            }),
            this.prisma.job.count({ where: searchConditions }),
        ]);
        return (0, pagination_dto_1.createPaginatedResponse)(jobs, totalCount, pagination.page || 1, pagination.limit || 20);
    }
    async searchUsers(query, filters = {}, pagination) {
        const searchConditions = {
            AND: [
                { isActive: true },
            ],
        };
        if (query && query.trim()) {
            searchConditions.AND.push({
                OR: [
                    { email: { contains: query, mode: 'insensitive' } },
                    { phone: { contains: query, mode: 'insensitive' } },
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                ],
            });
        }
        if (filters.role && filters.role.length > 0) {
            searchConditions.AND.push({
                role: { in: filters.role },
            });
        }
        if (filters.status && filters.status.length > 0) {
            searchConditions.AND.push({
                status: { in: filters.status },
            });
        }
        const orderBy = this.buildOrderBy(pagination.sortBy, pagination.sortOrder);
        const [users, totalCount] = await Promise.all([
            this.prisma.user.findMany({
                where: searchConditions,
                select: {
                    id: true,
                    email: true,
                    role: true,
                    status: true,
                    createdAt: true,
                    lastLoginAt: true,
                    restaurant: {
                        select: { id: true, businessName: true }
                    },
                    employee: {
                        select: { id: true, designation: true }
                    },
                    vendor: {
                        select: { id: true, businessName: true }
                    },
                },
                orderBy,
                skip: pagination.skip,
                take: pagination.limit,
            }),
            this.prisma.user.count({ where: searchConditions }),
        ]);
        return (0, pagination_dto_1.createPaginatedResponse)(users, totalCount, pagination.page || 1, pagination.limit || 20);
    }
    async globalSearch(query, pagination) {
        if (!query || query.trim().length < 2) {
            return {
                restaurants: { data: [], meta: { totalItems: 0 } },
                products: { data: [], meta: { totalItems: 0 } },
                jobs: { data: [], meta: { totalItems: 0 } },
            };
        }
        const searchPagination = { ...pagination, limit: Math.min(pagination.limit || 20, 10), skip: ((pagination.page || 1) - 1) * Math.min(pagination.limit || 20, 10) };
        const [restaurants, products, jobs] = await Promise.all([
            this.searchRestaurants(query, {}, searchPagination),
            this.searchProducts(query, {}, searchPagination),
            this.searchJobs(query, {}, searchPagination),
        ]);
        return {
            restaurants,
            products,
            jobs,
            totalResults: restaurants.meta.totalItems + products.meta.totalItems + jobs.meta.totalItems,
        };
    }
    async getSearchSuggestions(query, type = 'restaurants') {
        const cacheKey = `suggestions:${type}:${query}`;
        const cached = null;
        if (cached) {
            return JSON.parse(cached);
        }
        let suggestions = [];
        switch (type) {
            case 'restaurants':
                suggestions = await this.getRestaurantSuggestions(query);
                break;
            case 'products':
                suggestions = await this.getProductSuggestions(query);
                break;
            case 'jobs':
                suggestions = await this.getJobSuggestions(query);
                break;
        }
        return suggestions;
    }
    async getRestaurantSuggestions(query) {
        const restaurants = await this.prisma.restaurant.findMany({
            where: {
                OR: [
                    { businessName: { contains: query, mode: 'insensitive' } },
                    { cuisineType: { has: query } },
                ],
            },
            select: {
                id: true,
                businessName: true,
                cuisineType: true,
                rating: true,
            },
            take: 10,
            orderBy: [
                { rating: 'desc' },
                { businessName: 'asc' },
            ],
        });
        return restaurants.map((restaurant) => ({
            id: restaurant.id,
            title: restaurant.businessName,
            subtitle: `${restaurant.cuisineType?.join(', ') || 'Restaurant'}`,
            type: 'restaurant',
            rating: restaurant.rating,
        }));
    }
    async getProductSuggestions(query) {
        const products = await this.prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { category: { name: { contains: query, mode: 'insensitive' } } },
                    { tags: { has: query } },
                ],
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                category: {
                    select: {
                        name: true,
                    },
                },
                price: true,
                vendor: {
                    select: {
                        businessName: true,
                    },
                },
            },
            take: 10,
            orderBy: [
                { createdAt: 'desc' },
            ],
        });
        return products.map((product) => ({
            id: product.id,
            title: product.name,
            subtitle: `${product.category} • ₹${product.price} • ${product.vendor.businessName}`,
            type: 'product',
            price: product.price,
        }));
    }
    async getJobSuggestions(query) {
        const jobs = await this.prisma.job.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { location: { contains: query, mode: 'insensitive' } },
                ],
                status: 'OPEN',
            },
            include: {
                restaurant: {
                    select: {
                        businessName: true,
                    },
                },
            },
            take: 10,
            orderBy: [
                { createdAt: 'desc' },
            ],
        });
        return jobs.map((job) => ({
            id: job.id,
            title: job.title,
            subtitle: `${job.category} • ${job.location} • ${job.restaurant.businessName}`,
            type: 'job',
            salary: job.salaryRange,
        }));
    }
    buildOrderBy(sortBy = 'createdAt', sortOrder = 'desc') {
        const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'price', 'rating', 'title'];
        if (!allowedSortFields.includes(sortBy)) {
            sortBy = 'createdAt';
        }
        return { [sortBy]: sortOrder };
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = SearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchService);
//# sourceMappingURL=search.service.js.map