import { INestApplication, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { SecureMockDataService } from './secure-mock-data.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  private mockMode = false;
  private mockData: any = {
    orders: [],
    sessions: [],
    users: [], // Mock users will be loaded securely from environment configuration
    profiles: [], // Mock profiles will be loaded securely from environment configuration
    restaurants: [],
    vendors: [],
    products: [],
    auditLogs: [],
    documents: [],
    employees: [],
    jobPostings: [],
    menuCategories: []
  };

  private secureMockDataService: SecureMockDataService;

  constructor(private configService: ConfigService) {
    // Check if mock mode is enabled
    const mockEnabled = configService.get('MOCK_DATABASE') === 'true' || process.env.MOCK_DATABASE === 'true';

    // Force mock mode if no database URL is available or if explicitly enabled
    const databaseUrl = configService.get('DATABASE_URL') || process.env.DATABASE_URL;
    const shouldUseMock = mockEnabled || !databaseUrl;

    // Call super() first before accessing 'this'
    super({
      datasources: {
        db: {
          url: shouldUseMock ? 'file:./dev.db' : databaseUrl,  // Use SQLite file for mock mode to avoid connection issues
        },
      },
      log: configService.get('NODE_ENV') === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
    });

    // Now we can safely access 'this'
    this.secureMockDataService = new SecureMockDataService(configService);
    this.mockMode = shouldUseMock;
    
    // Load comprehensive mock data immediately if in mock mode
    if (this.mockMode) {
      // Start loading data immediately, but set up basic mock methods first
      this.setupMockMethods();
      this.initializeSecureMockData().catch(error => {
        this.logger.error('Failed to initialize secure mock data:', error);
        this.initializeBasicMockData();
      });
    }
  }

  private setupMockMethods() {
    // Override the user property
    Object.defineProperty(this, 'user', {
      get: () => ({
        findMany: async (options?: any) => {
          this.logger.debug('Mock: user.findMany called');
          return this.mockData.users;
        },
        findUnique: async (options?: any) => {
          this.logger.debug('=== PRISMA MOCK findUnique DEBUG ===');
          this.logger.debug('Options:', JSON.stringify(options, null, 2));
          const id = options?.where?.id;
          const email = options?.where?.email;
          this.logger.debug(`Looking for - ID: ${id}, Email: ${email}`);
          this.logger.debug(`Total users in mock data: ${this.mockData.users.length}`);
          
          if (id) {
            const found = this.mockData.users.find((user: any) => user.id === id);
            this.logger.debug(`User found by ID: ${!!found}`);
            return found || null;
          }
          if (email) {
            this.logger.debug(`Searching for user with email: ${email}`);
            const found = this.mockData.users.find((user: any) => user.email === email);
            this.logger.debug(`User found by email: ${!!found}`);
            if (found) {
              this.logger.debug(`Found user: ID=${found.id}, Email=${found.email}, Active=${found.isActive}, Status=${found.status}`);
            } else {
              this.logger.debug('Available emails in mock data:');
              this.mockData.users.forEach((user: any, idx: number) => {
                this.logger.debug(`  [${idx}] ${user.email}`);
              });
            }
            return found || null;
          }
          this.logger.debug('No ID or email provided, returning null');
          return null;
        },
        findFirst: async (options?: any) => {
          this.logger.debug('Mock: user.findFirst called');
          const where = options?.where;
          if (where?.OR) {
            // Handle OR conditions for email/phone lookup
            for (const condition of where.OR) {
              if (condition.email) {
                const found = this.mockData.users.find((user: any) => user.email === condition.email);
                if (found) return found;
              }
              if (condition.phone && condition.phone !== undefined) {
                const found = this.mockData.users.find((user: any) => user.phone === condition.phone);
                if (found) return found;
              }
            }
            return null;
          }
          return this.mockData.users[0] || null;
        },
        create: async (options?: any) => {
          this.logger.debug('Mock: user.create called');
          const newUser = {
            id: `mock-user-${Date.now()}`,
            ...options.data,
            status: 'ACTIVE',  // Set default status
            isActive: true,  // Ensure new users are active
            emailVerifiedAt: new Date(),  // Auto-verify in mock mode
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          this.mockData.users.push(newUser);
          return newUser;
        },
        update: async (options?: any) => {
          this.logger.debug('Mock: user.update called');
          const id = options.where.id;
          const userIndex = this.mockData.users.findIndex((user: any) => user.id === id);
          if (userIndex !== -1) {
            this.mockData.users[userIndex] = { ...this.mockData.users[userIndex], ...options.data, updatedAt: new Date() };
            return this.mockData.users[userIndex];
          }
          throw new Error('User not found');
        },
        delete: async (options?: any) => {
          this.logger.debug('Mock: user.delete called');
          const id = options.where.id;
          const userIndex = this.mockData.users.findIndex((user: any) => user.id === id);
          if (userIndex !== -1) {
            return this.mockData.users.splice(userIndex, 1)[0];
          }
          throw new Error('User not found');
        },
        count: async (options?: any) => {
          this.logger.debug('Mock: user.count called');
          if (!options?.where) {
            return this.mockData.users?.length || 0;
          }

          // Handle filtering conditions
          let filteredUsers = this.mockData.users || [];

          if (options.where.role) {
            filteredUsers = filteredUsers.filter((user: any) => user.role === options.where.role);
          }

          if (options.where.isActive !== undefined) {
            filteredUsers = filteredUsers.filter((user: any) => user.isActive === options.where.isActive);
          }

          if (options.where.lastActiveAt) {
            // For active users within a time range
            const cutoffDate = options.where.lastActiveAt.gte;
            if (cutoffDate) {
              filteredUsers = filteredUsers.filter((user: any) => {
                const lastActive = user.lastActiveAt || user.updatedAt || user.createdAt;
                return new Date(lastActive) >= new Date(cutoffDate);
              });
            }
          }

          return filteredUsers.length;
        },
        aggregate: async (options?: any) => {
          this.logger.debug('Mock: user.aggregate called');
          return {
            _count: {
              id: this.mockData.users?.length || 0
            }
          };
        }
      }),
      configurable: true
    });

    // Override the profile property
    Object.defineProperty(this, 'profile', {
      get: () => ({
        findMany: async (options?: any) => this.mockData.profiles,
        create: async (options?: any) => {
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
        findUnique: async (options?: any) => {
          const id = options?.where?.id;
          const userId = options?.where?.userId;
          if (id) {
            return this.mockData.profiles.find((profile: any) => profile.id === id) || null;
          }
          if (userId) {
            return this.mockData.profiles.find((profile: any) => profile.userId === userId) || null;
          }
          return null;
        },
        update: async (options?: any) => {
          const id = options.where.id;
          const profileIndex = this.mockData.profiles.findIndex((profile: any) => profile.id === id);
          if (profileIndex !== -1) {
            this.mockData.profiles[profileIndex] = { ...this.mockData.profiles[profileIndex], ...options.data, updatedAt: new Date() };
            return this.mockData.profiles[profileIndex];
          }
          throw new Error('Profile not found');
        },
        delete: async (options?: any) => {
          const id = options.where.id;
          const profileIndex = this.mockData.profiles.findIndex((profile: any) => profile.id === id);
          if (profileIndex !== -1) {
            return this.mockData.profiles.splice(profileIndex, 1)[0];
          }
          throw new Error('Profile not found');
        }
      }),
      configurable: true
    });

    // Override the session property
    Object.defineProperty(this, 'session', {
      get: () => ({
        findMany: async (options?: any) => {
          this.logger.debug('Mock: session.findMany called');
          return this.mockData.sessions || [];
        },
        create: async (options?: any) => {
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
        delete: async (options?: any) => {
          this.logger.debug('Mock: session.delete called');
          const id = options?.where?.id;
          if (!this.mockData.sessions) return null;
          const sessionIndex = this.mockData.sessions.findIndex((session: any) => session.id === id);
          if (sessionIndex !== -1) {
            return this.mockData.sessions.splice(sessionIndex, 1)[0];
          }
          return null;
        },
        deleteMany: async (options?: any) => {
          this.logger.debug('Mock: session.deleteMany called');
          const where = options?.where;
          if (!this.mockData.sessions) return { count: 0 };
          if (where?.userId) {
            const initialCount = this.mockData.sessions.length;
            this.mockData.sessions = this.mockData.sessions.filter((session: any) => session.userId !== where.userId);
            return { count: initialCount - this.mockData.sessions.length };
          }
          const count = this.mockData.sessions.length;
          this.mockData.sessions = [];
          return { count };
        },
        count: async (options?: any) => {
          this.logger.debug('Mock: session.count called');
          if (!this.mockData.sessions) return 0;
          const where = options?.where;
          if (where?.expiresAt?.gt) {
            return this.mockData.sessions.filter((session: any) => 
              session.expiresAt && session.expiresAt > where.expiresAt.gt
            ).length;
          }
          return this.mockData.sessions.length;
        },
        findFirst: async (options?: any) => {
          this.logger.debug('Mock: session.findFirst called');
          if (!this.mockData.sessions) return null;
          const where = options?.where;
          if (where?.userId) {
            const sessions = this.mockData.sessions.filter((session: any) => session.userId === where.userId);
            if (options?.orderBy?.createdAt === 'desc') {
              sessions.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            }
            return sessions[0] || null;
          }
          return this.mockData.sessions[0] || null;
        }
      }),
      configurable: true
    });

    // Override the restaurant property
    Object.defineProperty(this, 'restaurant', {
      get: () => ({
        findMany: async (options?: any) => {
          this.logger.debug('Mock: restaurant.findMany called');
          return this.mockData.restaurants.map((restaurant: any) => ({
            ...restaurant,
            user: this.mockData.users.find((u: any) => u.id === restaurant.userId),
            _count: {
              employees: 0,
              jobs: 0,
              orders: 0
            }
          }));
        },
        findUnique: async (options?: any) => {
          this.logger.debug('Mock: restaurant.findUnique called');
          const id = options?.where?.id;
          const userId = options?.where?.userId;
          if (id) {
            const restaurant = this.mockData.restaurants.find((r: any) => r.id === id);
            return restaurant ? {
              ...restaurant,
              user: this.mockData.users.find((u: any) => u.id === restaurant.userId),
              _count: {
                employees: 0,
                jobs: 0,
                orders: 0
              }
            } : null;
          }
          if (userId) {
            const restaurant = this.mockData.restaurants.find((r: any) => r.userId === userId);
            return restaurant ? {
              ...restaurant,
              user: this.mockData.users.find((u: any) => u.id === restaurant.userId),
              _count: {
                employees: 0,
                jobs: 0,
                orders: 0
              }
            } : null;
          }
          return null;
        },
        create: async (options?: any) => {
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
            user: this.mockData.users.find((u: any) => u.id === newRestaurant.userId),
            _count: {
              employees: 0,
              jobs: 0,
              orders: 0
            }
          };
        },
        update: async (options?: any) => {
          this.logger.debug('Mock: restaurant.update called');
          const id = options.where.id;
          const restaurantIndex = this.mockData.restaurants.findIndex((r: any) => r.id === id);
          if (restaurantIndex !== -1) {
            this.mockData.restaurants[restaurantIndex] = { 
              ...this.mockData.restaurants[restaurantIndex], 
              ...options.data, 
              updatedAt: new Date() 
            };
            return {
              ...this.mockData.restaurants[restaurantIndex],
              user: this.mockData.users.find((u: any) => u.id === this.mockData.restaurants[restaurantIndex].userId),
              _count: {
                employees: 0,
                jobs: 0,
                orders: 0
              }
            };
          }
          throw new Error('Restaurant not found');
        },
        delete: async (options?: any) => {
          this.logger.debug('Mock: restaurant.delete called');
          const id = options.where.id;
          const restaurantIndex = this.mockData.restaurants.findIndex((r: any) => r.id === id);
          if (restaurantIndex !== -1) {
            return this.mockData.restaurants.splice(restaurantIndex, 1)[0];
          }
          throw new Error('Restaurant not found');
        },
        count: async (options?: any) => {
          this.logger.debug('Mock: restaurant.count called');
          return this.mockData.restaurants.length;
        }
      }),
      configurable: true
    });

    // Override the vendor property
    Object.defineProperty(this, 'vendor', {
      get: () => ({
        findMany: async (options?: any) => {
          this.logger.debug('Mock: vendor.findMany called');
          return this.mockData.vendors || [];
        },
        findUnique: async (options?: any) => {
          this.logger.debug('Mock: vendor.findUnique called');
          const id = options?.where?.id;
          if (id) {
            return this.mockData.vendors?.find((v: any) => v.id === id) || null;
          }
          return null;
        },
        create: async (options?: any) => {
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
        update: async (options?: any) => {
          this.logger.debug('Mock: vendor.update called');
          const id = options.where.id;
          const vendorIndex = this.mockData.vendors?.findIndex((v: any) => v.id === id) || -1;
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
        delete: async (options?: any) => {
          this.logger.debug('Mock: vendor.delete called');
          const id = options.where.id;
          const vendorIndex = this.mockData.vendors?.findIndex((v: any) => v.id === id) || -1;
          if (vendorIndex !== -1) {
            return this.mockData.vendors.splice(vendorIndex, 1)[0];
          }
          throw new Error('Vendor not found');
        },
        count: async (options?: any) => {
          this.logger.debug('Mock: vendor.count called');
          return this.mockData.vendors?.length || 0;
        }
      }),
      configurable: true
    });

    // Override the job property
    Object.defineProperty(this, 'job', {
      get: () => ({
        findMany: async (options?: any) => {
          this.logger.debug('Mock: job.findMany called');
          return this.mockData.jobs || [];
        },
        findUnique: async (options?: any) => {
          this.logger.debug('Mock: job.findUnique called');
          const id = options?.where?.id;
          if (id) {
            return this.mockData.jobs?.find((j: any) => j.id === id) || null;
          }
          return null;
        },
        create: async (options?: any) => {
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
        update: async (options?: any) => {
          this.logger.debug('Mock: job.update called');
          const id = options.where.id;
          const jobIndex = this.mockData.jobs?.findIndex((j: any) => j.id === id) || -1;
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
        delete: async (options?: any) => {
          this.logger.debug('Mock: job.delete called');
          const id = options.where.id;
          const jobIndex = this.mockData.jobs?.findIndex((j: any) => j.id === id) || -1;
          if (jobIndex !== -1) {
            return this.mockData.jobs.splice(jobIndex, 1)[0];
          }
          throw new Error('Job not found');
        },
        count: async (options?: any) => {
          this.logger.debug('Mock: job.count called');
          return this.mockData.jobs?.length || 0;
        }
      }),
      configurable: true
    });

    // Override the product property for marketplace
    Object.defineProperty(this, 'product', {
      get: () => ({
        findMany: async (options?: any) => {
          this.logger.debug('Mock: product.findMany called');
          return this.mockData.products || [];
        },
        findUnique: async (options?: any) => {
          this.logger.debug('Mock: product.findUnique called');
          const id = options?.where?.id;
          if (id) {
            return this.mockData.products?.find((p: any) => p.id === id) || null;
          }
          return null;
        },
        create: async (options?: any) => {
          this.logger.debug('Mock: product.create called');
          const newProduct = {
            id: `mock-product-${Date.now()}`,
            ...options.data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          this.mockData.products = this.mockData.products || [];
          this.mockData.products.push(newProduct);
          return newProduct;
        },
        update: async (options?: any) => {
          this.logger.debug('Mock: product.update called');
          const id = options.where.id;
          const productIndex = this.mockData.products?.findIndex((p: any) => p.id === id) || -1;
          if (productIndex !== -1) {
            this.mockData.products[productIndex] = { 
              ...this.mockData.products[productIndex], 
              ...options.data, 
              updatedAt: new Date() 
            };
            return this.mockData.products[productIndex];
          }
          throw new Error('Product not found');
        },
        delete: async (options?: any) => {
          this.logger.debug('Mock: product.delete called');
          const id = options.where.id;
          const productIndex = this.mockData.products?.findIndex((p: any) => p.id === id) || -1;
          if (productIndex !== -1) {
            return this.mockData.products.splice(productIndex, 1)[0];
          }
          throw new Error('Product not found');
        },
        count: async (options?: any) => {
          this.logger.debug('Mock: product.count called');
          return this.mockData.products?.length || 0;
        }
      }),
      configurable: true
    });

    // Override the category property for marketplace
    Object.defineProperty(this, 'category', {
      get: () => ({
        findMany: async (options?: any) => {
          this.logger.debug('Mock: category.findMany called');
          return this.mockData.categories || [];
        },
        findUnique: async (options?: any) => {
          this.logger.debug('Mock: category.findUnique called');
          const id = options?.where?.id;
          if (id) {
            return this.mockData.categories?.find((c: any) => c.id === id) || null;
          }
          return null;
        },
        create: async (options?: any) => {
          this.logger.debug('Mock: category.create called');
          const newCategory = {
            id: `mock-category-${Date.now()}`,
            ...options.data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          this.mockData.categories = this.mockData.categories || [];
          this.mockData.categories.push(newCategory);
          return newCategory;
        },
        update: async (options?: any) => {
          this.logger.debug('Mock: category.update called');
          const id = options.where.id;
          const categoryIndex = this.mockData.categories?.findIndex((c: any) => c.id === id) || -1;
          if (categoryIndex !== -1) {
            this.mockData.categories[categoryIndex] = { 
              ...this.mockData.categories[categoryIndex], 
              ...options.data, 
              updatedAt: new Date() 
            };
            return this.mockData.categories[categoryIndex];
          }
          throw new Error('Category not found');
        },
        delete: async (options?: any) => {
          this.logger.debug('Mock: category.delete called');
          const id = options.where.id;
          const categoryIndex = this.mockData.categories?.findIndex((c: any) => c.id === id) || -1;
          if (categoryIndex !== -1) {
            return this.mockData.categories.splice(categoryIndex, 1)[0];
          }
          throw new Error('Category not found');
        },
        count: async (options?: any) => {
          this.logger.debug('Mock: category.count called');
          return this.mockData.categories?.length || 0;
        }
      }),
      configurable: true
    });

    // Override the post property for community
    Object.defineProperty(this, 'post', {
      get: () => ({
        findMany: async (options?: any) => {
          this.logger.debug('Mock: post.findMany called');
          return this.mockData.posts || [];
        },
        findUnique: async (options?: any) => {
          this.logger.debug('Mock: post.findUnique called');
          const id = options?.where?.id;
          if (id) {
            return this.mockData.posts?.find((p: any) => p.id === id) || null;
          }
          return null;
        },
        create: async (options?: any) => {
          this.logger.debug('Mock: post.create called');
          const newPost = {
            id: `mock-post-${Date.now()}`,
            ...options.data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          this.mockData.posts = this.mockData.posts || [];
          this.mockData.posts.push(newPost);
          return newPost;
        },
        update: async (options?: any) => {
          this.logger.debug('Mock: post.update called');
          const id = options.where.id;
          const postIndex = this.mockData.posts?.findIndex((p: any) => p.id === id) || -1;
          if (postIndex !== -1) {
            this.mockData.posts[postIndex] = { 
              ...this.mockData.posts[postIndex], 
              ...options.data, 
              updatedAt: new Date() 
            };
            return this.mockData.posts[postIndex];
          }
          throw new Error('Post not found');
        },
        delete: async (options?: any) => {
          this.logger.debug('Mock: post.delete called');
          const id = options.where.id;
          const postIndex = this.mockData.posts?.findIndex((p: any) => p.id === id) || -1;
          if (postIndex !== -1) {
            return this.mockData.posts.splice(postIndex, 1)[0];
          }
          throw new Error('Post not found');
        },
        count: async (options?: any) => {
          this.logger.debug('Mock: post.count called');
          return this.mockData.posts?.length || 0;
        }
      }),
      configurable: true
    });

    // Override the walletTransaction property for payments
    Object.defineProperty(this, 'walletTransaction', {
      get: () => ({
        findMany: async (options?: any) => {
          this.logger.debug('Mock: walletTransaction.findMany called');
          return this.mockData.walletTransactions || [];
        },
        findUnique: async (options?: any) => {
          this.logger.debug('Mock: walletTransaction.findUnique called');
          const id = options?.where?.id;
          if (id) {
            return this.mockData.walletTransactions?.find((w: any) => w.id === id) || null;
          }
          return null;
        },
        create: async (options?: any) => {
          this.logger.debug('Mock: walletTransaction.create called');
          const newTransaction = {
            id: `mock-wallet-tx-${Date.now()}`,
            ...options.data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          this.mockData.walletTransactions = this.mockData.walletTransactions || [];
          this.mockData.walletTransactions.push(newTransaction);
          return newTransaction;
        },
        update: async (options?: any) => {
          this.logger.debug('Mock: walletTransaction.update called');
          const id = options.where.id;
          const txIndex = this.mockData.walletTransactions?.findIndex((w: any) => w.id === id) || -1;
          if (txIndex !== -1) {
            this.mockData.walletTransactions[txIndex] = { 
              ...this.mockData.walletTransactions[txIndex], 
              ...options.data, 
              updatedAt: new Date() 
            };
            return this.mockData.walletTransactions[txIndex];
          }
          throw new Error('Wallet transaction not found');
        },
        delete: async (options?: any) => {
          this.logger.debug('Mock: walletTransaction.delete called');
          const id = options.where.id;
          const txIndex = this.mockData.walletTransactions?.findIndex((w: any) => w.id === id) || -1;
          if (txIndex !== -1) {
            return this.mockData.walletTransactions.splice(txIndex, 1)[0];
          }
          throw new Error('Wallet transaction not found');
        },
        count: async (options?: any) => {
          this.logger.debug('Mock: walletTransaction.count called');
          return this.mockData.walletTransactions?.length || 0;
        }
      }),
      configurable: true
    });
  }

  async onModuleInit() {
    if (this.mockMode) {
      this.logger.log('Mock mode enabled, skipping database connection');
      // Mock data already initialized in constructor
      return;
    }
    
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.warn('Database connection failed, enabling mock mode');
      this.mockMode = true;
      await this.initializeMockData();
      this.setupMockMethods();
    }
  }

  private async initializeMockData() {
    this.logger.log('Initializing mock data...');
    
    // Load comprehensive mock data
    try {
      const { default: comprehensiveMockData } = await import('./mock-data-comprehensive');
      this.logger.log('Successfully loaded comprehensive mock data file');
      
      // Replace the entire mockData with comprehensive data
      this.mockData = { ...comprehensiveMockData };
      
      // Ensure all required arrays exist
      this.mockData.jobApplications = this.mockData.jobApplications || [];
      this.mockData.schedules = this.mockData.schedules || [];
      this.mockData.paymentMethods = this.mockData.paymentMethods || [];
      this.mockData.walletTransactions = this.mockData.walletTransactions || [];
      this.mockData.analytics = this.mockData.analytics || {};
      this.mockData.reviews = this.mockData.reviews || [];
      this.mockData.notifications = this.mockData.notifications || [];
      this.mockData.comments = this.mockData.comments || [];
      this.mockData.categories = this.mockData.categories || [];
      this.mockData.jobs = this.mockData.jobs || [];
      this.mockData.posts = this.mockData.posts || [];
      this.mockData.orders = this.mockData.orders || [];
      this.mockData.sessions = this.mockData.sessions || [];

      this.logger.log('Comprehensive mock data initialized successfully');
      this.logger.log(`Loaded data counts - Users: ${this.mockData.users?.length || 0}, Restaurants: ${this.mockData.restaurants?.length || 0}, Vendors: ${this.mockData.vendors?.length || 0}, Products: ${this.mockData.products?.length || 0}, Orders: ${this.mockData.orders?.length || 0}, Jobs: ${this.mockData.jobs?.length || 0}, Posts: ${this.mockData.posts?.length || 0}`);
    } catch (error) {
      this.logger.error('Failed to load comprehensive mock data, using basic data:', error);
      this.initializeBasicMockData();
    }
  }

  private async initializeSecureMockData() {
    this.logger.log('Initializing secure mock data...');

    try {
      // Initialize secure demo users and profiles
      const users = await this.secureMockDataService.initializeDemoUsers();
      const profiles = await this.secureMockDataService.initializeDemoProfiles(users);

      this.mockData.users = users;
      this.mockData.profiles = profiles;

      // Validate security configuration
      this.secureMockDataService.validateSecurityConfiguration();

      // Load comprehensive mock data if available
      try {
        const { default: comprehensiveMockData } = await import('./mock-data-comprehensive');
        this.logger.log('Successfully loaded comprehensive mock data file');

        // Merge with existing mock data (preserving secure users and profiles)
        this.mockData = {
          ...comprehensiveMockData,
          users: this.mockData.users, // Keep our securely initialized users
          profiles: this.mockData.profiles, // Keep our securely initialized profiles
        };

        // Ensure all required arrays exist
        this.mockData.jobApplications = this.mockData.jobApplications || [];
        this.mockData.schedules = this.mockData.schedules || [];
        this.mockData.paymentMethods = this.mockData.paymentMethods || [];
        this.mockData.walletTransactions = this.mockData.walletTransactions || [];
        this.mockData.analytics = this.mockData.analytics || {};
        this.mockData.reviews = this.mockData.reviews || [];
        this.mockData.notifications = this.mockData.notifications || [];
        this.mockData.comments = this.mockData.comments || [];
        this.mockData.categories = this.mockData.categories || [];
        this.mockData.jobs = this.mockData.jobs || [];
        this.mockData.posts = this.mockData.posts || [];
        this.mockData.orders = this.mockData.orders || [];
        this.mockData.sessions = this.mockData.sessions || [];

        this.logger.log('Secure mock data initialized successfully');
        this.logger.log(`Loaded data counts - Users: ${this.mockData.users?.length || 0}, Profiles: ${this.mockData.profiles?.length || 0}, Restaurants: ${this.mockData.restaurants?.length || 0}`);
      } catch (error) {
        this.logger.warn('Comprehensive mock data not available, using secure basic data only');
        this.initializeBasicMockData();
      }
    } catch (error) {
      this.logger.error('Failed to initialize secure mock data:', error);
      this.initializeBasicMockData();
    }
  }

  private initializeBasicMockData() {
    // Fallback basic mock data in case comprehensive data fails to load
    this.mockData.orders = this.mockData.orders || [];
    this.mockData.restaurants = this.mockData.restaurants || [];
    this.mockData.vendors = this.mockData.vendors || [];
    this.mockData.products = this.mockData.products || [];
    this.mockData.jobs = this.mockData.jobs || [];
    this.mockData.posts = this.mockData.posts || [];

    this.logger.log('Basic mock data initialized');
  }

  // Mock methods for orders
  get order(): any {
    if (this.mockMode) {
      return {
        findMany: async (options?: any) => {
          this.logger.debug('Mock: order.findMany called');
          return this.mockData.orders;
        },
        findUnique: async (options?: any) => {
          this.logger.debug('Mock: order.findUnique called');
          const id = options?.where?.id;
          return this.mockData.orders.find((order: any) => order.id === id) || null;
        },
        create: async (data: any) => {
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
        update: async (options: any) => {
          this.logger.debug('Mock: order.update called');
          const id = options.where.id;
          const index = this.mockData.orders.findIndex((order: any) => order.id === id);
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
        count: async (options?: any) => {
          this.logger.debug('Mock: order.count called');
          return this.mockData.orders.length;
        },
        aggregate: async (options?: any) => {
          this.logger.debug('Mock: order.aggregate called');
          const total = this.mockData.orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
          return { _sum: { total } };
        },
        groupBy: async (options?: any) => {
          this.logger.debug('Mock: order.groupBy called');
          return [];
        },
        findUniqueOrThrow: async (options?: any) => {
          const result = await this.order.findUnique(options);
          if (!result) throw new Error('Record not found');
          return result;
        },
        findFirst: async (options?: any) => {
          this.logger.debug('Mock: order.findFirst called');
          return this.mockData.orders[0] || null;
        },
        findFirstOrThrow: async (options?: any) => {
          const result = await this.order.findFirst(options);
          if (!result) throw new Error('Record not found');
          return result;
        },
        createMany: async (options?: any) => {
          this.logger.debug('Mock: order.createMany called');
          return { count: 0 };
        },
        updateMany: async (options?: any) => {
          this.logger.debug('Mock: order.updateMany called');
          return { count: 0 };
        },
        deleteMany: async (options?: any) => {
          this.logger.debug('Mock: order.deleteMany called');
          return { count: 0 };
        },
        delete: async (options?: any) => {
          this.logger.debug('Mock: order.delete called');
          const id = options?.where?.id;
          const index = this.mockData.orders.findIndex((order: any) => order.id === id);
          if (index >= 0) {
            return this.mockData.orders.splice(index, 1)[0];
          }
          throw new Error('Record not found');
        },
        upsert: async (options?: any) => {
          this.logger.debug('Mock: order.upsert called');
          return this.mockData.orders[0] || null;
        },
        createManyAndReturn: async (options?: any) => {
          this.logger.debug('Mock: order.createManyAndReturn called');
          return [];
        },
        fields: {}
      };
    }
    return super.order;
  }

  // Mock methods for employee
  get employee(): any {
    if (this.mockMode) {
      return {
        findMany: async (options?: any) => {
          this.logger.debug('Mock: employee.findMany called');
          return this.mockData.employees || [];
        },
        findUnique: async (options?: any) => {
          this.logger.debug('Mock: employee.findUnique called');
          const id = options?.where?.id;
          return (this.mockData.employees || []).find((employee: any) => employee.id === id) || null;
        },
        create: async (data: any) => {
          this.logger.debug('Mock: employee.create called');
          const newEmployee = {
            id: `mock-employee-${Date.now()}`,
            ...data.data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          if (!this.mockData.employees) this.mockData.employees = [];
          this.mockData.employees.push(newEmployee);
          return newEmployee;
        },
        update: async (options: any) => {
          this.logger.debug('Mock: employee.update called');
          const id = options.where.id;
          if (!this.mockData.employees) this.mockData.employees = [];
          const index = this.mockData.employees.findIndex((employee: any) => employee.id === id);
          if (index >= 0) {
            this.mockData.employees[index] = {
              ...this.mockData.employees[index],
              ...options.data,
              updatedAt: new Date(),
            };
            return this.mockData.employees[index];
          }
          return null;
        },
        count: async (options?: any) => {
          this.logger.debug('Mock: employee.count called');
          return (this.mockData.employees || []).length;
        },
        aggregate: async (options?: any) => {
          this.logger.debug('Mock: employee.aggregate called');
          return { _count: { id: (this.mockData.employees || []).length } };
        },
        findFirst: async (options?: any) => {
          this.logger.debug('Mock: employee.findFirst called');
          return (this.mockData.employees || [])[0] || null;
        },
        findUniqueOrThrow: async (options?: any) => {
          const result = await this.employee.findUnique(options);
          if (!result) throw new Error('Employee not found');
          return result;
        },
        findFirstOrThrow: async (options?: any) => {
          const result = await this.employee.findFirst(options);
          if (!result) throw new Error('Employee not found');
          return result;
        },
        createMany: async (options?: any) => ({ count: 0 }),
        updateMany: async (options?: any) => ({ count: 0 }),
        deleteMany: async (options?: any) => ({ count: 0 }),
        delete: async (options?: any) => {
          const id = options?.where?.id;
          if (!this.mockData.employees) return null;
          const index = this.mockData.employees.findIndex((employee: any) => employee.id === id);
          if (index >= 0) {
            return this.mockData.employees.splice(index, 1)[0];
          }
          throw new Error('Employee not found');
        },
        upsert: async (options?: any) => null,
        groupBy: async (options?: any) => [],
        createManyAndReturn: async (options?: any) => [],
        fields: {}
      };
    }
    return super.employee;
  }

  // Mock method for orderStatusHistory
  get orderStatusHistory(): any {
    if (this.mockMode) {
      return {
        create: async (data: any) => {
          this.logger.debug('Mock: orderStatusHistory.create called');
          return {
            id: `mock-status-${Date.now()}`,
            ...data.data,
            createdAt: new Date(),
          };
        },
        findMany: async (options?: any) => [],
        findUnique: async (options?: any) => null,
        findUniqueOrThrow: async (options?: any) => { throw new Error('Record not found'); },
        findFirst: async (options?: any) => null,
        findFirstOrThrow: async (options?: any) => { throw new Error('Record not found'); },
        createMany: async (options?: any) => ({ count: 0 }),
        update: async (options?: any) => null,
        updateMany: async (options?: any) => ({ count: 0 }),
        delete: async (options?: any) => { throw new Error('Record not found'); },
        deleteMany: async (options?: any) => ({ count: 0 }),
        upsert: async (options?: any) => null,
        count: async (options?: any) => 0,
        aggregate: async (options?: any) => ({}),
        groupBy: async (options?: any) => [],
        createManyAndReturn: async (options?: any) => [],
        fields: {}
      };
    }
    return super.orderStatusHistory;
  }

  async enableShutdownHooks(app: INestApplication) {
    if (!this.mockMode) {
      try {
        // Only enable shutdown hooks if we have a real Prisma client
        const client = this as any;
        if (client.$on && typeof client.$on === 'function') {
          client.$on('beforeExit', async () => {
            await app.close();
          });
        }
      } catch (error) {
        // Ignore shutdown hook errors in mock mode
      }
    }
  }

}
