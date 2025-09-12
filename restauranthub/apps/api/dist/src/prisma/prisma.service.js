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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const config_1 = require("@nestjs/config");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    constructor(configService) {
        const mockEnabled = configService.get('MOCK_DATABASE') === 'true' || process.env.MOCK_DATABASE === 'true';
        const databaseUrl = configService.get('DATABASE_URL') || process.env.DATABASE_URL;
        const shouldUseMock = mockEnabled || !databaseUrl;
        super({
            datasources: {
                db: {
                    url: shouldUseMock ? 'file:./dev.db' : databaseUrl,
                },
            },
            log: configService.get('NODE_ENV') === 'development'
                ? ['query', 'error', 'warn']
                : ['error'],
        });
        this.configService = configService;
        this.logger = new common_1.Logger(PrismaService_1.name);
        this.mockMode = false;
        this.mockData = {
            orders: [],
            sessions: [],
            users: [
                {
                    id: 'mock-admin-1',
                    email: 'admin@restauranthub.com',
                    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$fPiJ6dKU6GMuobhK3r3pIQ$WJTVWZOEz/84EL1pxmW3f7UrMtFY5oiMeVXsfMEnXWg',
                    phone: '+1234567890',
                    role: 'ADMIN',
                    isActive: true,
                    isVerified: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'mock-restaurant-1',
                    email: 'restaurant@restauranthub.com',
                    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$fPiJ6dKU6GMuobhK3r3pIQ$WJTVWZOEz/84EL1pxmW3f7UrMtFY5oiMeVXsfMEnXWg',
                    phone: '+1234567891',
                    role: 'RESTAURANT',
                    isActive: true,
                    isVerified: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'mock-vendor-1',
                    email: 'vendor@restauranthub.com',
                    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$fPiJ6dKU6GMuobhK3r3pIQ$WJTVWZOEz/84EL1pxmW3f7UrMtFY5oiMeVXsfMEnXWg',
                    phone: '+1234567892',
                    role: 'VENDOR',
                    isActive: true,
                    isVerified: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'mock-employee-1',
                    email: 'employee@restauranthub.com',
                    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$fPiJ6dKU6GMuobhK3r3pIQ$WJTVWZOEz/84EL1pxmW3f7UrMtFY5oiMeVXsfMEnXWg',
                    phone: '+1234567893',
                    role: 'EMPLOYEE',
                    isActive: true,
                    isVerified: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'mock-customer-1',
                    email: 'customer@restauranthub.com',
                    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$fPiJ6dKU6GMuobhK3r3pIQ$WJTVWZOEz/84EL1pxmW3f7UrMtFY5oiMeVXsfMEnXWg',
                    phone: '+1234567894',
                    role: 'CUSTOMER',
                    isActive: true,
                    isVerified: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            ],
            profiles: [
                {
                    id: 'mock-profile-admin-1',
                    userId: 'mock-admin-1',
                    firstName: 'System',
                    lastName: 'Administrator',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'mock-profile-restaurant-1',
                    userId: 'mock-restaurant-1',
                    firstName: 'Restaurant',
                    lastName: 'Owner',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'mock-profile-vendor-1',
                    userId: 'mock-vendor-1',
                    firstName: 'Vendor',
                    lastName: 'Manager',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'mock-profile-employee-1',
                    userId: 'mock-employee-1',
                    firstName: 'Restaurant',
                    lastName: 'Employee',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'mock-profile-customer-1',
                    userId: 'mock-customer-1',
                    firstName: 'Valued',
                    lastName: 'Customer',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            ],
            restaurants: [],
            vendors: [],
            products: [],
            auditLogs: [],
            documents: [],
            employees: [],
            jobPostings: [],
            menuCategories: []
        };
        this.mockMode = shouldUseMock;
        if (this.mockMode) {
            this.setupMockMethods();
        }
    }
    setupMockMethods() {
        Object.defineProperty(this, 'user', {
            get: () => ({
                findMany: async (options) => {
                    this.logger.debug('Mock: user.findMany called');
                    return this.mockData.users;
                },
                findUnique: async (options) => {
                    this.logger.debug('Mock: user.findUnique called');
                    const id = options?.where?.id;
                    const email = options?.where?.email;
                    if (id) {
                        return this.mockData.users.find((user) => user.id === id) || null;
                    }
                    if (email) {
                        return this.mockData.users.find((user) => user.email === email) || null;
                    }
                    return null;
                },
                findFirst: async (options) => {
                    this.logger.debug('Mock: user.findFirst called');
                    const where = options?.where;
                    if (where?.OR) {
                        for (const condition of where.OR) {
                            if (condition.email) {
                                const found = this.mockData.users.find((user) => user.email === condition.email);
                                if (found)
                                    return found;
                            }
                            if (condition.phone && condition.phone !== undefined) {
                                const found = this.mockData.users.find((user) => user.phone === condition.phone);
                                if (found)
                                    return found;
                            }
                        }
                        return null;
                    }
                    return this.mockData.users[0] || null;
                },
                create: async (options) => {
                    this.logger.debug('Mock: user.create called');
                    const newUser = {
                        id: `mock-user-${Date.now()}`,
                        ...options.data,
                        status: 'ACTIVE',
                        isActive: true,
                        isVerified: true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    this.mockData.users.push(newUser);
                    return newUser;
                },
                update: async (options) => {
                    this.logger.debug('Mock: user.update called');
                    const id = options.where.id;
                    const userIndex = this.mockData.users.findIndex((user) => user.id === id);
                    if (userIndex !== -1) {
                        this.mockData.users[userIndex] = { ...this.mockData.users[userIndex], ...options.data, updatedAt: new Date() };
                        return this.mockData.users[userIndex];
                    }
                    throw new Error('User not found');
                },
                delete: async (options) => {
                    this.logger.debug('Mock: user.delete called');
                    const id = options.where.id;
                    const userIndex = this.mockData.users.findIndex((user) => user.id === id);
                    if (userIndex !== -1) {
                        return this.mockData.users.splice(userIndex, 1)[0];
                    }
                    throw new Error('User not found');
                }
            }),
            configurable: true
        });
        Object.defineProperty(this, 'profile', {
            get: () => ({
                findMany: async (options) => this.mockData.profiles,
                create: async (options) => {
                    this.logger.debug('Mock: profile.create called');
                    const newProfile = {
                        id: `mock-profile-${Date.now()}`,
                        ...options.data,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    this.mockData.profiles.push(newProfile);
                    return newProfile;
                },
                findUnique: async (options) => {
                    const id = options?.where?.id;
                    const userId = options?.where?.userId;
                    if (id) {
                        return this.mockData.profiles.find((profile) => profile.id === id) || null;
                    }
                    if (userId) {
                        return this.mockData.profiles.find((profile) => profile.userId === userId) || null;
                    }
                    return null;
                },
                update: async (options) => {
                    const id = options.where.id;
                    const profileIndex = this.mockData.profiles.findIndex((profile) => profile.id === id);
                    if (profileIndex !== -1) {
                        this.mockData.profiles[profileIndex] = { ...this.mockData.profiles[profileIndex], ...options.data, updatedAt: new Date() };
                        return this.mockData.profiles[profileIndex];
                    }
                    throw new Error('Profile not found');
                },
                delete: async (options) => {
                    const id = options.where.id;
                    const profileIndex = this.mockData.profiles.findIndex((profile) => profile.id === id);
                    if (profileIndex !== -1) {
                        return this.mockData.profiles.splice(profileIndex, 1)[0];
                    }
                    throw new Error('Profile not found');
                }
            }),
            configurable: true
        });
        Object.defineProperty(this, 'session', {
            get: () => ({
                findMany: async (options) => {
                    this.logger.debug('Mock: session.findMany called');
                    return this.mockData.sessions || [];
                },
                create: async (options) => {
                    this.logger.debug('Mock: session.create called');
                    const newSession = {
                        id: `mock-session-${Date.now()}`,
                        ...options.data,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    this.mockData.sessions = this.mockData.sessions || [];
                    this.mockData.sessions.push(newSession);
                    return newSession;
                },
                delete: async (options) => {
                    this.logger.debug('Mock: session.delete called');
                    const id = options?.where?.id;
                    if (!this.mockData.sessions)
                        return null;
                    const sessionIndex = this.mockData.sessions.findIndex((session) => session.id === id);
                    if (sessionIndex !== -1) {
                        return this.mockData.sessions.splice(sessionIndex, 1)[0];
                    }
                    return null;
                },
                deleteMany: async (options) => {
                    this.logger.debug('Mock: session.deleteMany called');
                    const where = options?.where;
                    if (!this.mockData.sessions)
                        return { count: 0 };
                    if (where?.userId) {
                        const initialCount = this.mockData.sessions.length;
                        this.mockData.sessions = this.mockData.sessions.filter((session) => session.userId !== where.userId);
                        return { count: initialCount - this.mockData.sessions.length };
                    }
                    const count = this.mockData.sessions.length;
                    this.mockData.sessions = [];
                    return { count };
                },
                count: async (options) => {
                    this.logger.debug('Mock: session.count called');
                    if (!this.mockData.sessions)
                        return 0;
                    const where = options?.where;
                    if (where?.expiresAt?.gt) {
                        return this.mockData.sessions.filter((session) => session.expiresAt && session.expiresAt > where.expiresAt.gt).length;
                    }
                    return this.mockData.sessions.length;
                },
                findFirst: async (options) => {
                    this.logger.debug('Mock: session.findFirst called');
                    if (!this.mockData.sessions)
                        return null;
                    const where = options?.where;
                    if (where?.userId) {
                        const sessions = this.mockData.sessions.filter((session) => session.userId === where.userId);
                        if (options?.orderBy?.createdAt === 'desc') {
                            sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                        }
                        return sessions[0] || null;
                    }
                    return this.mockData.sessions[0] || null;
                }
            }),
            configurable: true
        });
        Object.defineProperty(this, 'restaurant', {
            get: () => ({
                findMany: async (options) => {
                    this.logger.debug('Mock: restaurant.findMany called');
                    return this.mockData.restaurants.map((restaurant) => ({
                        ...restaurant,
                        user: this.mockData.users.find((u) => u.id === restaurant.userId),
                        _count: {
                            employees: 0,
                            jobs: 0,
                            orders: 0
                        }
                    }));
                },
                findUnique: async (options) => {
                    this.logger.debug('Mock: restaurant.findUnique called');
                    const id = options?.where?.id;
                    const userId = options?.where?.userId;
                    if (id) {
                        const restaurant = this.mockData.restaurants.find((r) => r.id === id);
                        return restaurant ? {
                            ...restaurant,
                            user: this.mockData.users.find((u) => u.id === restaurant.userId),
                            _count: {
                                employees: 0,
                                jobs: 0,
                                orders: 0
                            }
                        } : null;
                    }
                    if (userId) {
                        const restaurant = this.mockData.restaurants.find((r) => r.userId === userId);
                        return restaurant ? {
                            ...restaurant,
                            user: this.mockData.users.find((u) => u.id === restaurant.userId),
                            _count: {
                                employees: 0,
                                jobs: 0,
                                orders: 0
                            }
                        } : null;
                    }
                    return null;
                },
                create: async (options) => {
                    this.logger.debug('Mock: restaurant.create called');
                    const newRestaurant = {
                        id: `mock-restaurant-${Date.now()}`,
                        ...options.data,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    this.mockData.restaurants.push(newRestaurant);
                    return {
                        ...newRestaurant,
                        user: this.mockData.users.find((u) => u.id === newRestaurant.userId),
                        _count: {
                            employees: 0,
                            jobs: 0,
                            orders: 0
                        }
                    };
                },
                update: async (options) => {
                    this.logger.debug('Mock: restaurant.update called');
                    const id = options.where.id;
                    const restaurantIndex = this.mockData.restaurants.findIndex((r) => r.id === id);
                    if (restaurantIndex !== -1) {
                        this.mockData.restaurants[restaurantIndex] = {
                            ...this.mockData.restaurants[restaurantIndex],
                            ...options.data,
                            updatedAt: new Date()
                        };
                        return {
                            ...this.mockData.restaurants[restaurantIndex],
                            user: this.mockData.users.find((u) => u.id === this.mockData.restaurants[restaurantIndex].userId),
                            _count: {
                                employees: 0,
                                jobs: 0,
                                orders: 0
                            }
                        };
                    }
                    throw new Error('Restaurant not found');
                },
                delete: async (options) => {
                    this.logger.debug('Mock: restaurant.delete called');
                    const id = options.where.id;
                    const restaurantIndex = this.mockData.restaurants.findIndex((r) => r.id === id);
                    if (restaurantIndex !== -1) {
                        return this.mockData.restaurants.splice(restaurantIndex, 1)[0];
                    }
                    throw new Error('Restaurant not found');
                },
                count: async (options) => {
                    this.logger.debug('Mock: restaurant.count called');
                    return this.mockData.restaurants.length;
                }
            }),
            configurable: true
        });
        Object.defineProperty(this, 'vendor', {
            get: () => ({
                findMany: async (options) => {
                    this.logger.debug('Mock: vendor.findMany called');
                    return this.mockData.vendors || [];
                },
                findUnique: async (options) => {
                    this.logger.debug('Mock: vendor.findUnique called');
                    const id = options?.where?.id;
                    if (id) {
                        return this.mockData.vendors?.find((v) => v.id === id) || null;
                    }
                    return null;
                },
                create: async (options) => {
                    this.logger.debug('Mock: vendor.create called');
                    const newVendor = {
                        id: `mock-vendor-${Date.now()}`,
                        ...options.data,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    this.mockData.vendors = this.mockData.vendors || [];
                    this.mockData.vendors.push(newVendor);
                    return newVendor;
                },
                update: async (options) => {
                    this.logger.debug('Mock: vendor.update called');
                    const id = options.where.id;
                    const vendorIndex = this.mockData.vendors?.findIndex((v) => v.id === id) || -1;
                    if (vendorIndex !== -1) {
                        this.mockData.vendors[vendorIndex] = {
                            ...this.mockData.vendors[vendorIndex],
                            ...options.data,
                            updatedAt: new Date()
                        };
                        return this.mockData.vendors[vendorIndex];
                    }
                    throw new Error('Vendor not found');
                },
                delete: async (options) => {
                    this.logger.debug('Mock: vendor.delete called');
                    const id = options.where.id;
                    const vendorIndex = this.mockData.vendors?.findIndex((v) => v.id === id) || -1;
                    if (vendorIndex !== -1) {
                        return this.mockData.vendors.splice(vendorIndex, 1)[0];
                    }
                    throw new Error('Vendor not found');
                },
                count: async (options) => {
                    this.logger.debug('Mock: vendor.count called');
                    return this.mockData.vendors?.length || 0;
                }
            }),
            configurable: true
        });
        Object.defineProperty(this, 'job', {
            get: () => ({
                findMany: async (options) => {
                    this.logger.debug('Mock: job.findMany called');
                    return this.mockData.jobs || [];
                },
                findUnique: async (options) => {
                    this.logger.debug('Mock: job.findUnique called');
                    const id = options?.where?.id;
                    if (id) {
                        return this.mockData.jobs?.find((j) => j.id === id) || null;
                    }
                    return null;
                },
                create: async (options) => {
                    this.logger.debug('Mock: job.create called');
                    const newJob = {
                        id: `mock-job-${Date.now()}`,
                        ...options.data,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    this.mockData.jobs = this.mockData.jobs || [];
                    this.mockData.jobs.push(newJob);
                    return newJob;
                },
                update: async (options) => {
                    this.logger.debug('Mock: job.update called');
                    const id = options.where.id;
                    const jobIndex = this.mockData.jobs?.findIndex((j) => j.id === id) || -1;
                    if (jobIndex !== -1) {
                        this.mockData.jobs[jobIndex] = {
                            ...this.mockData.jobs[jobIndex],
                            ...options.data,
                            updatedAt: new Date()
                        };
                        return this.mockData.jobs[jobIndex];
                    }
                    throw new Error('Job not found');
                },
                delete: async (options) => {
                    this.logger.debug('Mock: job.delete called');
                    const id = options.where.id;
                    const jobIndex = this.mockData.jobs?.findIndex((j) => j.id === id) || -1;
                    if (jobIndex !== -1) {
                        return this.mockData.jobs.splice(jobIndex, 1)[0];
                    }
                    throw new Error('Job not found');
                },
                count: async (options) => {
                    this.logger.debug('Mock: job.count called');
                    return this.mockData.jobs?.length || 0;
                }
            }),
            configurable: true
        });
    }
    async onModuleInit() {
        if (this.mockMode) {
            this.logger.log('Mock mode enabled, skipping database connection');
            this.initializeMockData();
            return;
        }
        try {
            await this.$connect();
            this.logger.log('Database connected successfully');
        }
        catch (error) {
            this.logger.warn('Database connection failed, enabling mock mode');
            this.mockMode = true;
            this.initializeMockData();
        }
    }
    initializeMockData() {
        this.mockData.orders = [
            {
                id: 'mock-order-1',
                orderNumber: 'ORD-20240107-001',
                status: 'PENDING',
                paymentStatus: 'PENDING',
                type: 'DELIVERY',
                total: 2500,
                customerId: 'mock-customer-1',
                restaurantId: 'mock-restaurant-1',
                vendorId: null,
                items: [
                    {
                        id: 'item-1',
                        name: 'Chicken Burger',
                        quantity: 2,
                        price: 850,
                        total: 1700
                    },
                    {
                        id: 'item-2',
                        name: 'French Fries',
                        quantity: 1,
                        price: 400,
                        total: 400
                    }
                ],
                customer: {
                    id: 'mock-customer-1',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john.doe@example.com',
                    phone: '+1234567890'
                },
                restaurant: {
                    id: 'mock-restaurant-1',
                    businessName: 'Best Burgers',
                    businessPhone: '+1987654321',
                    businessEmail: 'contact@bestburgers.com',
                    address: '123 Food Street',
                    city: 'Mumbai',
                    state: 'Maharashtra'
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                expectedDelivery: new Date(Date.now() + 45 * 60 * 1000),
                statusHistory: []
            }
        ];
        this.mockData.restaurants = [
            {
                id: 'mock-restaurant-data-1',
                userId: 'mock-restaurant-1',
                businessName: 'Best Burgers',
                description: 'Authentic burgers and fast food',
                cuisine: ['American', 'Fast Food'],
                registrationNumber: 'REG123456',
                gstNumber: 'GST123456789',
                fssaiNumber: 'FSSAI123456',
                panNumber: 'PAN123456',
                address: '123 Food Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                zipCode: '400001',
                isVerified: true,
                verifiedAt: new Date(),
                averageRating: 4.5,
                totalReviews: 25,
                createdAt: new Date(),
                updatedAt: new Date(),
                user: {
                    id: 'mock-restaurant-1',
                    firstName: 'Restaurant',
                    lastName: 'Owner',
                    email: 'restaurant@restauranthub.com'
                }
            }
        ];
        this.mockData.vendors = [
            {
                id: 'mock-vendor-data-1',
                userId: 'mock-vendor-1',
                businessName: 'Fresh Supplies Co',
                businessType: 'Food Distributor',
                businessAddress: '456 Supply Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                zipCode: '400002',
                businessPhone: '+919876543210',
                businessEmail: 'contact@freshsupplies.com',
                description: 'Premium food ingredients supplier',
                categories: ['Vegetables', 'Spices', 'Dairy'],
                minOrderValue: 500,
                deliveryAreas: ['Mumbai', 'Navi Mumbai'],
                isVerified: true,
                verifiedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                user: {
                    id: 'mock-vendor-1',
                    firstName: 'Vendor',
                    lastName: 'Manager',
                    email: 'vendor@restauranthub.com'
                }
            }
        ];
        this.logger.log('Mock data initialized');
    }
    get order() {
        if (this.mockMode) {
            return {
                findMany: async (options) => {
                    this.logger.debug('Mock: order.findMany called');
                    return this.mockData.orders;
                },
                findUnique: async (options) => {
                    this.logger.debug('Mock: order.findUnique called');
                    const id = options?.where?.id;
                    return this.mockData.orders.find((order) => order.id === id) || null;
                },
                create: async (data) => {
                    this.logger.debug('Mock: order.create called');
                    const newOrder = {
                        id: `mock-order-${Date.now()}`,
                        orderNumber: `ORD-${Date.now()}`,
                        ...data.data,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    this.mockData.orders.push(newOrder);
                    return newOrder;
                },
                update: async (options) => {
                    this.logger.debug('Mock: order.update called');
                    const id = options.where.id;
                    const index = this.mockData.orders.findIndex((order) => order.id === id);
                    if (index >= 0) {
                        this.mockData.orders[index] = {
                            ...this.mockData.orders[index],
                            ...options.data,
                            updatedAt: new Date(),
                        };
                        return this.mockData.orders[index];
                    }
                    return null;
                },
                count: async (options) => {
                    this.logger.debug('Mock: order.count called');
                    return this.mockData.orders.length;
                },
                aggregate: async (options) => {
                    this.logger.debug('Mock: order.aggregate called');
                    const total = this.mockData.orders.reduce((sum, order) => sum + (order.total || 0), 0);
                    return { _sum: { total } };
                },
                groupBy: async (options) => {
                    this.logger.debug('Mock: order.groupBy called');
                    return [];
                },
                findUniqueOrThrow: async (options) => {
                    const result = await this.order.findUnique(options);
                    if (!result)
                        throw new Error('Record not found');
                    return result;
                },
                findFirst: async (options) => {
                    this.logger.debug('Mock: order.findFirst called');
                    return this.mockData.orders[0] || null;
                },
                findFirstOrThrow: async (options) => {
                    const result = await this.order.findFirst(options);
                    if (!result)
                        throw new Error('Record not found');
                    return result;
                },
                createMany: async (options) => {
                    this.logger.debug('Mock: order.createMany called');
                    return { count: 0 };
                },
                updateMany: async (options) => {
                    this.logger.debug('Mock: order.updateMany called');
                    return { count: 0 };
                },
                deleteMany: async (options) => {
                    this.logger.debug('Mock: order.deleteMany called');
                    return { count: 0 };
                },
                delete: async (options) => {
                    this.logger.debug('Mock: order.delete called');
                    const id = options?.where?.id;
                    const index = this.mockData.orders.findIndex((order) => order.id === id);
                    if (index >= 0) {
                        return this.mockData.orders.splice(index, 1)[0];
                    }
                    throw new Error('Record not found');
                },
                upsert: async (options) => {
                    this.logger.debug('Mock: order.upsert called');
                    return this.mockData.orders[0] || null;
                },
                createManyAndReturn: async (options) => {
                    this.logger.debug('Mock: order.createManyAndReturn called');
                    return [];
                },
                fields: {}
            };
        }
        return super.order;
    }
    get orderStatusHistory() {
        if (this.mockMode) {
            return {
                create: async (data) => {
                    this.logger.debug('Mock: orderStatusHistory.create called');
                    return {
                        id: `mock-status-${Date.now()}`,
                        ...data.data,
                        createdAt: new Date(),
                    };
                },
                findMany: async (options) => [],
                findUnique: async (options) => null,
                findUniqueOrThrow: async (options) => { throw new Error('Record not found'); },
                findFirst: async (options) => null,
                findFirstOrThrow: async (options) => { throw new Error('Record not found'); },
                createMany: async (options) => ({ count: 0 }),
                update: async (options) => null,
                updateMany: async (options) => ({ count: 0 }),
                delete: async (options) => { throw new Error('Record not found'); },
                deleteMany: async (options) => ({ count: 0 }),
                upsert: async (options) => null,
                count: async (options) => 0,
                aggregate: async (options) => ({}),
                groupBy: async (options) => [],
                createManyAndReturn: async (options) => [],
                fields: {}
            };
        }
        return super.orderStatusHistory;
    }
    async enableShutdownHooks(app) {
        if (!this.mockMode) {
            try {
                const client = this;
                if (client.$on && typeof client.$on === 'function') {
                    client.$on('beforeExit', async () => {
                        await app.close();
                    });
                }
            }
            catch (error) {
            }
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map