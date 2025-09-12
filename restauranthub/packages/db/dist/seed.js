"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const faker_1 = require("@faker-js/faker");
const bcrypt = __importStar(require("argon2"));
const prisma = new client_1.PrismaClient();
const USER_ROLES = ['ADMIN', 'RESTAURANT', 'VENDOR', 'EMPLOYEE'];
const VERIFICATION_STATUS = ['PENDING', 'VERIFIED', 'REJECTED'];
const ORDER_STATUS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
const PAYMENT_STATUS = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'];
// Food categories and items for realistic data
const FOOD_CATEGORIES = [
    {
        name: 'Appetizers',
        items: ['Samosa', 'Spring Rolls', 'Chicken Wings', 'Paneer Tikka', 'Fish Fingers', 'Bruschetta', 'Nachos']
    },
    {
        name: 'Main Course',
        items: ['Butter Chicken', 'Biryani', 'Dal Makhani', 'Pasta Alfredo', 'Grilled Fish', 'Mutton Curry', 'Vegetable Thali']
    },
    {
        name: 'Desserts',
        items: ['Gulab Jamun', 'Ice Cream', 'Chocolate Cake', 'Rasmalai', 'Tiramisu', 'Kulfi', 'Brownie']
    },
    {
        name: 'Beverages',
        items: ['Lassi', 'Coffee', 'Fresh Juice', 'Soft Drinks', 'Tea', 'Milkshake', 'Mocktails']
    },
    {
        name: 'Ingredients',
        items: ['Basmati Rice', 'Chicken', 'Paneer', 'Vegetables', 'Spices', 'Oil', 'Flour', 'Lentils']
    },
];
const RESTAURANT_NAMES = [
    'Spice Junction', 'The Golden Fork', 'Taste of India', 'Urban Bites', 'Café Delight',
    'Royal Kitchen', 'Food Paradise', 'The Hungry Soul', 'Flavors of Asia', 'Desi Dhaba',
    'Corner Bistro', 'Masala House', 'The Great Indian', 'Street Food Co.', 'Curry Express',
    'Tandoor Nights', 'Mumbai Chaat', 'South Indian Flavors', 'Punjabi Haveli', 'Coastal Kitchen'
];
const VENDOR_NAMES = [
    'Fresh Farm Supplies', 'Metro Food Distributors', 'Quality Ingredients Co.', 'Urban Suppliers',
    'Wholesale Food Hub', 'Prime Vendors', 'Agro Fresh Solutions', 'Daily Needs Suppliers',
    'Kitchen Essentials', 'Bulk Food Mart', 'Restaurant Supply Co.', 'Food Chain Solutions',
    'Organic Suppliers', 'Spice Merchants', 'Dairy Fresh Ltd', 'Meat Masters', 'Veggie Vault',
    'Grain & More', 'Beverage Suppliers', 'Frozen Foods Inc'
];
const JOB_TITLES = [
    'Head Chef', 'Sous Chef', 'Line Cook', 'Kitchen Helper', 'Waiter', 'Waitress',
    'Bartender', 'Cashier', 'Manager', 'Assistant Manager', 'Delivery Boy',
    'Cleaner', 'Security Guard', 'Receptionist', 'Food Runner'
];
const EMPLOYEE_NAMES = [
    'Rahul Kumar', 'Priya Sharma', 'Amit Singh', 'Sneha Patel', 'Ravi Gupta',
    'Anjali Verma', 'Suresh Yadav', 'Pooja Jain', 'Vikash Modi', 'Kavita Agarwal',
    'Deepak Shah', 'Meera Nair', 'Rajesh Tiwari', 'Sunita Joshi', 'Manoj Dubey'
];
const SKILLS = [
    'Cooking', 'Customer Service', 'Food Safety', 'Team Management', 'POS Systems',
    'Inventory Management', 'Food Preparation', 'Cash Handling', 'Communication',
    'Time Management', 'Problem Solving', 'Menu Planning', 'Quality Control'
];
const CITIES = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad',
    'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur',
    'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna'
];
async function hashPassword(password) {
    return await bcrypt.hash(password);
}
async function createUsers() {
    console.log('Creating users...');
    // Create 5 admin users
    const adminUsers = [];
    for (let i = 0; i < 5; i++) {
        const admin = await prisma.user.create({
            data: {
                firstName: faker_1.faker.person.firstName(),
                lastName: faker_1.faker.person.lastName(),
                email: faker_1.faker.internet.email().toLowerCase(),
                phone: faker_1.faker.phone.number('##########'),
                passwordHash: await hashPassword('admin123'),
                role: 'ADMIN',
                isActive: true,
                emailVerified: true,
                phoneVerified: true,
                avatar: faker_1.faker.image.avatar(),
            },
        });
        adminUsers.push(admin);
    }
    // Create 50 restaurant users
    const restaurantUsers = [];
    for (let i = 0; i < 50; i++) {
        const restaurant = await prisma.user.create({
            data: {
                firstName: faker_1.faker.person.firstName(),
                lastName: faker_1.faker.person.lastName(),
                email: faker_1.faker.internet.email().toLowerCase(),
                phone: faker_1.faker.phone.number('##########'),
                passwordHash: await hashPassword('restaurant123'),
                role: 'RESTAURANT',
                isActive: true,
                emailVerified: faker_1.faker.datatype.boolean(0.8),
                phoneVerified: faker_1.faker.datatype.boolean(0.9),
                avatar: faker_1.faker.image.avatar(),
            },
        });
        restaurantUsers.push(restaurant);
    }
    // Create 30 vendor users
    const vendorUsers = [];
    for (let i = 0; i < 30; i++) {
        const vendor = await prisma.user.create({
            data: {
                firstName: faker_1.faker.person.firstName(),
                lastName: faker_1.faker.person.lastName(),
                email: faker_1.faker.internet.email().toLowerCase(),
                phone: faker_1.faker.phone.number('##########'),
                passwordHash: await hashPassword('vendor123'),
                role: 'VENDOR',
                isActive: true,
                emailVerified: faker_1.faker.datatype.boolean(0.8),
                phoneVerified: faker_1.faker.datatype.boolean(0.9),
                avatar: faker_1.faker.image.avatar(),
            },
        });
        vendorUsers.push(vendor);
    }
    // Create 100 employee users
    const employeeUsers = [];
    for (let i = 0; i < 100; i++) {
        const employee = await prisma.user.create({
            data: {
                firstName: faker_1.faker.person.firstName(),
                lastName: faker_1.faker.person.lastName(),
                email: faker_1.faker.internet.email().toLowerCase(),
                phone: faker_1.faker.phone.number('##########'),
                passwordHash: await hashPassword('employee123'),
                role: 'EMPLOYEE',
                isActive: true,
                emailVerified: faker_1.faker.datatype.boolean(0.7),
                phoneVerified: faker_1.faker.datatype.boolean(0.8),
                avatar: faker_1.faker.image.avatar(),
            },
        });
        employeeUsers.push(employee);
    }
    return { adminUsers, restaurantUsers, vendorUsers, employeeUsers };
}
async function createRestaurantProfiles(restaurantUsers) {
    console.log('Creating restaurant profiles...');
    const restaurants = [];
    for (let i = 0; i < restaurantUsers.length; i++) {
        const user = restaurantUsers[i];
        const restaurant = await prisma.restaurant.create({
            data: {
                userId: user.id,
                businessName: RESTAURANT_NAMES[i % RESTAURANT_NAMES.length] + (i > RESTAURANT_NAMES.length - 1 ? ` ${Math.floor(i / RESTAURANT_NAMES.length) + 1}` : ''),
                description: faker_1.faker.lorem.paragraph(),
                cuisine: faker_1.faker.helpers.arrayElement(['Indian', 'Chinese', 'Italian', 'Mexican', 'Continental', 'Thai', 'Japanese']),
                address: faker_1.faker.location.streetAddress(),
                city: faker_1.faker.helpers.arrayElement(CITIES),
                state: 'Maharashtra',
                country: 'India',
                pincode: faker_1.faker.location.zipCode('######'),
                phone: faker_1.faker.phone.number('##########'),
                email: user.email,
                website: faker_1.faker.internet.url(),
                gstNumber: faker_1.faker.string.alphanumeric(15).toUpperCase(),
                fssaiNumber: faker_1.faker.string.numeric(14),
                verificationStatus: faker_1.faker.helpers.arrayElement(VERIFICATION_STATUS),
                isActive: true,
                logo: faker_1.faker.image.urlLoremFlickr({ category: 'restaurant' }),
                banner: faker_1.faker.image.urlLoremFlickr({ category: 'food' }),
                rating: faker_1.faker.number.float({ min: 3.0, max: 5.0, precision: 0.1 }),
                reviewCount: faker_1.faker.number.int({ min: 10, max: 500 }),
                averageDeliveryTime: faker_1.faker.number.int({ min: 20, max: 60 }),
                minimumOrderAmount: faker_1.faker.number.float({ min: 100, max: 300 }),
                deliveryRadius: faker_1.faker.number.int({ min: 5, max: 15 }),
                latitude: faker_1.faker.location.latitude(),
                longitude: faker_1.faker.location.longitude(),
                openingTime: '09:00',
                closingTime: '22:00',
                isOpen: faker_1.faker.datatype.boolean(0.8),
                capacity: faker_1.faker.number.int({ min: 20, max: 200 }),
                staffCount: faker_1.faker.number.int({ min: 5, max: 50 }),
            },
        });
        restaurants.push(restaurant);
    }
    return restaurants;
}
async function createVendorProfiles(vendorUsers) {
    console.log('Creating vendor profiles...');
    const vendors = [];
    for (let i = 0; i < vendorUsers.length; i++) {
        const user = vendorUsers[i];
        const vendor = await prisma.vendor.create({
            data: {
                userId: user.id,
                businessName: VENDOR_NAMES[i % VENDOR_NAMES.length] + (i > VENDOR_NAMES.length - 1 ? ` ${Math.floor(i / VENDOR_NAMES.length) + 1}` : ''),
                description: faker_1.faker.lorem.paragraph(),
                businessType: faker_1.faker.helpers.arrayElement(['MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'SUPPLIER']),
                address: faker_1.faker.location.streetAddress(),
                city: faker_1.faker.helpers.arrayElement(CITIES),
                state: 'Maharashtra',
                country: 'India',
                pincode: faker_1.faker.location.zipCode('######'),
                phone: faker_1.faker.phone.number('##########'),
                email: user.email,
                website: faker_1.faker.internet.url(),
                gstNumber: faker_1.faker.string.alphanumeric(15).toUpperCase(),
                panNumber: faker_1.faker.string.alphanumeric(10).toUpperCase(),
                verificationStatus: faker_1.faker.helpers.arrayElement(VERIFICATION_STATUS),
                isActive: true,
                logo: faker_1.faker.image.urlLoremFlickr({ category: 'business' }),
                banner: faker_1.faker.image.urlLoremFlickr({ category: 'warehouse' }),
                rating: faker_1.faker.number.float({ min: 3.5, max: 5.0, precision: 0.1 }),
                reviewCount: faker_1.faker.number.int({ min: 5, max: 200 }),
                minimumOrderAmount: faker_1.faker.number.float({ min: 500, max: 2000 }),
                deliveryRadius: faker_1.faker.number.int({ min: 10, max: 50 }),
                processingTime: faker_1.faker.number.int({ min: 1, max: 7 }),
                bankName: faker_1.faker.company.name() + ' Bank',
                accountNumber: faker_1.faker.finance.accountNumber(),
                ifscCode: faker_1.faker.string.alphanumeric(11).toUpperCase(),
                accountHolderName: user.firstName + ' ' + user.lastName,
            },
        });
        vendors.push(vendor);
    }
    return vendors;
}
async function createEmployeeProfiles(employeeUsers, restaurants) {
    console.log('Creating employee profiles...');
    const employees = [];
    for (let i = 0; i < employeeUsers.length; i++) {
        const user = employeeUsers[i];
        const restaurant = faker_1.faker.helpers.arrayElement(restaurants);
        const employee = await prisma.employee.create({
            data: {
                userId: user.id,
                restaurantId: restaurant.id,
                employeeCode: `EMP${String(i + 1).padStart(4, '0')}`,
                designation: faker_1.faker.helpers.arrayElement(JOB_TITLES),
                department: faker_1.faker.helpers.arrayElement(['Kitchen', 'Service', 'Management', 'Delivery', 'Cleaning']),
                aadharNumber: faker_1.faker.string.numeric(12),
                aadharVerified: faker_1.faker.datatype.boolean(0.6),
                verifiedAt: faker_1.faker.date.past(),
                salary: faker_1.faker.number.float({ min: 15000, max: 50000 }),
                joiningDate: faker_1.faker.date.past({ years: 2 }),
                isActive: faker_1.faker.datatype.boolean(0.9),
            },
        });
        employees.push(employee);
    }
    return employees;
}
async function createProducts(vendors, restaurants) {
    console.log('Creating products...');
    const products = [];
    // Create vendor products (for marketplace)
    for (const vendor of vendors) {
        const productCount = faker_1.faker.number.int({ min: 8, max: 20 });
        for (let i = 0; i < productCount; i++) {
            const category = faker_1.faker.helpers.arrayElement(FOOD_CATEGORIES);
            const product = await prisma.product.create({
                data: {
                    vendorId: vendor.id,
                    name: faker_1.faker.helpers.arrayElement(category.items),
                    description: faker_1.faker.lorem.sentence(),
                    category: category.name,
                    subcategory: faker_1.faker.helpers.arrayElement(['Premium', 'Standard', 'Bulk', 'Fresh', 'Frozen']),
                    price: faker_1.faker.number.float({ min: 50, max: 2000, precision: 0.01 }),
                    unit: faker_1.faker.helpers.arrayElement(['kg', 'piece', 'liter', 'packet', 'box']),
                    stockQuantity: faker_1.faker.number.int({ min: 10, max: 1000 }),
                    minOrderQty: faker_1.faker.number.int({ min: 1, max: 10 }),
                    maxOrderQty: faker_1.faker.number.int({ min: 50, max: 500 }),
                    images: [
                        faker_1.faker.image.urlLoremFlickr({ category: 'food' }),
                        faker_1.faker.image.urlLoremFlickr({ category: 'food' })
                    ],
                    tags: faker_1.faker.helpers.arrayElements(['fresh', 'organic', 'premium', 'bulk', 'daily'], { min: 1, max: 3 }),
                    sku: faker_1.faker.string.alphanumeric(8).toUpperCase(),
                    barcode: faker_1.faker.string.numeric(13),
                    isActive: true,
                    isAvailable: faker_1.faker.datatype.boolean(0.9),
                    rating: faker_1.faker.number.float({ min: 3.0, max: 5.0, precision: 0.1 }),
                    reviewCount: faker_1.faker.number.int({ min: 0, max: 100 }),
                    views: faker_1.faker.number.int({ min: 0, max: 1000 }),
                    orderCount: faker_1.faker.number.int({ min: 0, max: 200 }),
                    isFeatured: faker_1.faker.datatype.boolean(0.2),
                    weight: faker_1.faker.number.float({ min: 0.1, max: 50.0 }),
                    dimensions: `${faker_1.faker.number.int({ min: 10, max: 50 })}x${faker_1.faker.number.int({ min: 10, max: 50 })}x${faker_1.faker.number.int({ min: 5, max: 30 })}`,
                    shelfLife: faker_1.faker.number.int({ min: 7, max: 365 }),
                    storageInstructions: faker_1.faker.lorem.sentence(),
                },
            });
            products.push(product);
        }
    }
    // Create restaurant products (for customer orders)
    for (const restaurant of restaurants.slice(0, 30)) { // Only first 30 restaurants
        const productCount = faker_1.faker.number.int({ min: 10, max: 25 });
        for (let i = 0; i < productCount; i++) {
            const category = faker_1.faker.helpers.arrayElement(FOOD_CATEGORIES);
            const product = await prisma.product.create({
                data: {
                    restaurantId: restaurant.id,
                    name: faker_1.faker.helpers.arrayElement(category.items),
                    description: faker_1.faker.lorem.sentence(),
                    category: category.name,
                    subcategory: faker_1.faker.helpers.arrayElement(['Veg', 'Non-Veg', 'Vegan', 'Jain', 'Spicy']),
                    price: faker_1.faker.number.float({ min: 80, max: 600, precision: 0.01 }),
                    unit: 'piece',
                    stockQuantity: faker_1.faker.number.int({ min: 5, max: 100 }),
                    minOrderQty: 1,
                    maxOrderQty: 10,
                    images: [
                        faker_1.faker.image.urlLoremFlickr({ category: 'food' }),
                        faker_1.faker.image.urlLoremFlickr({ category: 'food' })
                    ],
                    tags: faker_1.faker.helpers.arrayElements(['spicy', 'mild', 'popular', 'chef-special', 'bestseller'], { min: 1, max: 3 }),
                    sku: faker_1.faker.string.alphanumeric(8).toUpperCase(),
                    isActive: true,
                    isAvailable: faker_1.faker.datatype.boolean(0.95),
                    rating: faker_1.faker.number.float({ min: 3.5, max: 5.0, precision: 0.1 }),
                    reviewCount: faker_1.faker.number.int({ min: 5, max: 200 }),
                    views: faker_1.faker.number.int({ min: 10, max: 2000 }),
                    orderCount: faker_1.faker.number.int({ min: 5, max: 500 }),
                    isFeatured: faker_1.faker.datatype.boolean(0.3),
                    preparationTime: faker_1.faker.number.int({ min: 10, max: 45 }),
                    calories: faker_1.faker.number.int({ min: 200, max: 800 }),
                    isVegetarian: faker_1.faker.datatype.boolean(0.6),
                    isVegan: faker_1.faker.datatype.boolean(0.2),
                    isGlutenFree: faker_1.faker.datatype.boolean(0.3),
                    spiceLevel: faker_1.faker.number.int({ min: 1, max: 5 }),
                },
            });
            products.push(product);
        }
    }
    return products;
}
async function createOrders(restaurants, vendors, products) {
    console.log('Creating orders...');
    const orders = [];
    const vendorProducts = products.filter(p => p.vendorId);
    const restaurantProducts = products.filter(p => p.restaurantId);
    // Create B2B orders (restaurant buying from vendors)
    for (let i = 0; i < 300; i++) {
        const restaurant = faker_1.faker.helpers.arrayElement(restaurants);
        const vendor = faker_1.faker.helpers.arrayElement(vendors);
        const vendorProductsForOrder = vendorProducts
            .filter(p => p.vendorId === vendor.id)
            .slice(0, faker_1.faker.number.int({ min: 1, max: 5 }));
        if (vendorProductsForOrder.length === 0)
            continue;
        const orderItems = vendorProductsForOrder.map(product => ({
            productId: product.id,
            quantity: faker_1.faker.number.int({ min: 1, max: product.minOrderQty * 3 }),
            unitPrice: product.price,
            totalPrice: product.price * faker_1.faker.number.int({ min: 1, max: product.minOrderQty * 3 }),
        }));
        const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const taxAmount = subtotal * 0.18; // 18% GST
        const totalAmount = subtotal + taxAmount;
        const order = await prisma.order.create({
            data: {
                restaurantId: restaurant.id,
                vendorId: vendor.id,
                orderNumber: `ORD${String(i + 1).padStart(6, '0')}`,
                status: faker_1.faker.helpers.arrayElement(ORDER_STATUS),
                paymentStatus: faker_1.faker.helpers.arrayElement(PAYMENT_STATUS),
                paymentMethod: faker_1.faker.helpers.arrayElement(['CARD', 'UPI', 'NET_BANKING', 'WALLET', 'COD', 'CREDIT']),
                subtotal,
                taxAmount,
                deliveryFee: faker_1.faker.number.float({ min: 0, max: 100 }),
                totalAmount,
                deliveryAddress: {
                    street: faker_1.faker.location.streetAddress(),
                    city: faker_1.faker.helpers.arrayElement(CITIES),
                    state: 'Maharashtra',
                    pincode: faker_1.faker.location.zipCode('######'),
                },
                deliveryDate: faker_1.faker.date.future(),
                notes: faker_1.faker.lorem.sentence(),
                items: {
                    create: orderItems,
                },
            },
        });
        orders.push(order);
    }
    return orders;
}
async function createJobs(restaurants) {
    console.log('Creating jobs...');
    const jobs = [];
    for (let i = 0; i < 150; i++) {
        const restaurant = faker_1.faker.helpers.arrayElement(restaurants);
        const job = await prisma.job.create({
            data: {
                restaurantId: restaurant.id,
                title: faker_1.faker.helpers.arrayElement(JOB_TITLES),
                department: faker_1.faker.helpers.arrayElement(['Kitchen', 'Service', 'Management', 'Delivery', 'Cleaning']),
                description: faker_1.faker.lorem.paragraphs(2),
                requirements: faker_1.faker.helpers.arrayElements(SKILLS, { min: 3, max: 7 }),
                location: restaurant.city,
                employmentType: faker_1.faker.helpers.arrayElement(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']),
                experience: faker_1.faker.helpers.arrayElement(['0-1 years', '1-3 years', '3-5 years', '5+ years']),
                salaryMin: faker_1.faker.number.int({ min: 15000, max: 30000 }),
                salaryMax: faker_1.faker.number.int({ min: 35000, max: 80000 }),
                benefits: faker_1.faker.helpers.arrayElements(['Food', 'Transport', 'Insurance', 'PF', 'Bonus'], { min: 2, max: 4 }),
                status: faker_1.faker.helpers.arrayElement(['DRAFT', 'OPEN', 'CLOSED', 'FILLED']),
                isActive: faker_1.faker.datatype.boolean(0.8),
                isPriority: faker_1.faker.datatype.boolean(0.3),
                validUntil: faker_1.faker.date.future(),
                workingHours: '8 hours',
                workingDays: 'Monday to Sunday',
                contactEmail: restaurant.email,
                contactPhone: restaurant.phone,
            },
        });
        jobs.push(job);
    }
    return jobs;
}
async function createJobApplications(employees, jobs) {
    console.log('Creating job applications...');
    const applications = [];
    for (let i = 0; i < 400; i++) {
        const employee = faker_1.faker.helpers.arrayElement(employees);
        const job = faker_1.faker.helpers.arrayElement(jobs);
        // Avoid duplicate applications
        const existingApplication = await prisma.jobApplication.findFirst({
            where: {
                employeeId: employee.id,
                jobId: job.id,
            },
        });
        if (existingApplication)
            continue;
        const application = await prisma.jobApplication.create({
            data: {
                employeeId: employee.id,
                jobId: job.id,
                status: faker_1.faker.helpers.arrayElement(['PENDING', 'REVIEWED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED']),
                coverLetter: faker_1.faker.lorem.paragraphs(2),
                expectedSalary: faker_1.faker.number.int({ min: 18000, max: 45000 }),
                availableFrom: faker_1.faker.date.future(),
                skills: faker_1.faker.helpers.arrayElements(SKILLS, { min: 3, max: 8 }),
                experience: faker_1.faker.number.int({ min: 0, max: 10 }),
                references: [
                    {
                        name: faker_1.faker.person.fullName(),
                        phone: faker_1.faker.phone.number('##########'),
                        relationship: 'Previous Manager',
                    },
                ],
            },
        });
        applications.push(application);
    }
    return applications;
}
async function createForumPosts(users) {
    console.log('Creating forum posts...');
    // Create forums first
    const forums = [];
    const forumData = [
        { name: 'General Discussion', description: 'General topics and discussions', category: 'general' },
        { name: 'Recipe Exchange', description: 'Share and discover new recipes', category: 'recipes' },
        { name: 'Restaurant Tips', description: 'Tips for running restaurants', category: 'business' },
        { name: 'Job Opportunities', description: 'Job postings and career discussions', category: 'jobs' },
        { name: 'Food Reviews', description: 'Review restaurants and dishes', category: 'reviews' },
    ];
    for (const forumInfo of forumData) {
        const creator = faker_1.faker.helpers.arrayElement(users.filter(u => u.role !== 'EMPLOYEE'));
        const forum = await prisma.forum.create({
            data: {
                name: forumInfo.name,
                description: forumInfo.description,
                category: forumInfo.category,
                slug: forumInfo.name.toLowerCase().replace(/\s+/g, '-'),
                creatorId: creator.id,
                isActive: true,
                isPrivate: faker_1.faker.datatype.boolean(0.2),
                memberCount: 0,
            },
        });
        forums.push(forum);
    }
    // Add members to forums
    for (const forum of forums) {
        const memberCount = faker_1.faker.number.int({ min: 10, max: 100 });
        const members = faker_1.faker.helpers.arrayElements(users, memberCount);
        for (const member of members) {
            await prisma.forumMember.create({
                data: {
                    forumId: forum.id,
                    userId: member.id,
                    role: member.id === forum.creatorId ? 'admin' : 'member',
                },
            });
        }
        await prisma.forum.update({
            where: { id: forum.id },
            data: { memberCount },
        });
    }
    // Create posts
    const posts = [];
    for (let i = 0; i < 200; i++) {
        const author = faker_1.faker.helpers.arrayElement(users);
        const forum = faker_1.faker.helpers.arrayElement(forums);
        const post = await prisma.forumPost.create({
            data: {
                forumId: forum.id,
                authorId: author.id,
                title: faker_1.faker.lorem.sentence(),
                content: faker_1.faker.lorem.paragraphs(faker_1.faker.number.int({ min: 1, max: 3 })),
                slug: faker_1.faker.lorem.slug(),
                tags: faker_1.faker.helpers.arrayElements(['cooking', 'tips', 'recipe', 'business', 'help', 'discussion'], { min: 1, max: 4 }),
                isVisible: true,
                isDeleted: false,
                isPinned: faker_1.faker.datatype.boolean(0.1),
                views: faker_1.faker.number.int({ min: 1, max: 500 }),
            },
        });
        posts.push(post);
    }
    // Create post likes and replies
    for (const post of posts.slice(0, 100)) {
        // Add likes
        const likeCount = faker_1.faker.number.int({ min: 0, max: 50 });
        const likers = faker_1.faker.helpers.arrayElements(users, likeCount);
        for (const liker of likers) {
            await prisma.forumPostLike.create({
                data: {
                    postId: post.id,
                    userId: liker.id,
                },
            });
        }
        // Add replies
        const replyCount = faker_1.faker.number.int({ min: 0, max: 10 });
        for (let i = 0; i < replyCount; i++) {
            const replier = faker_1.faker.helpers.arrayElement(users);
            await prisma.forumPostReply.create({
                data: {
                    postId: post.id,
                    authorId: replier.id,
                    content: faker_1.faker.lorem.paragraphs(faker_1.faker.number.int({ min: 1, max: 2 })),
                    isDeleted: false,
                },
            });
        }
    }
    return { forums, posts };
}
async function createMessages(users) {
    console.log('Creating messages and conversations...');
    const conversations = [];
    // Create individual conversations
    for (let i = 0; i < 100; i++) {
        const participants = faker_1.faker.helpers.arrayElements(users, 2);
        const conversation = await prisma.conversation.create({
            data: {
                isGroup: false,
                lastActivityAt: faker_1.faker.date.recent(),
                participants: {
                    create: participants.map(p => ({
                        userId: p.id,
                        role: 'member',
                    })),
                },
            },
        });
        conversations.push(conversation);
    }
    // Create group conversations
    for (let i = 0; i < 20; i++) {
        const participantCount = faker_1.faker.number.int({ min: 3, max: 10 });
        const participants = faker_1.faker.helpers.arrayElements(users, participantCount);
        const creator = participants[0];
        const conversation = await prisma.conversation.create({
            data: {
                name: `${faker_1.faker.company.name()} Group`,
                isGroup: true,
                createdBy: creator.id,
                lastActivityAt: faker_1.faker.date.recent(),
                participants: {
                    create: participants.map((p, index) => ({
                        userId: p.id,
                        role: index === 0 ? 'admin' : 'member',
                    })),
                },
            },
        });
        conversations.push(conversation);
    }
    // Create messages
    for (const conversation of conversations) {
        const messageCount = faker_1.faker.number.int({ min: 5, max: 30 });
        const participants = await prisma.conversationParticipant.findMany({
            where: { conversationId: conversation.id },
            include: { user: true },
        });
        let lastMessageId = null;
        for (let i = 0; i < messageCount; i++) {
            const sender = faker_1.faker.helpers.arrayElement(participants);
            const message = await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    senderId: sender.userId,
                    content: faker_1.faker.lorem.sentences(faker_1.faker.number.int({ min: 1, max: 3 })),
                    type: faker_1.faker.helpers.arrayElement(['text', 'image', 'file']),
                },
            });
            lastMessageId = message.id;
            // Mark some messages as read
            if (faker_1.faker.datatype.boolean(0.7)) {
                const readers = faker_1.faker.helpers.arrayElements(participants.filter(p => p.userId !== sender.userId), faker_1.faker.number.int({ min: 1, max: participants.length - 1 }));
                for (const reader of readers) {
                    await prisma.messageRead.create({
                        data: {
                            messageId: message.id,
                            userId: reader.userId,
                        },
                    });
                }
            }
        }
        // Update conversation with last message
        if (lastMessageId) {
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                    lastMessageId,
                    lastActivityAt: new Date(),
                },
            });
        }
    }
    return conversations;
}
async function createNotifications(users) {
    console.log('Creating notifications...');
    const notifications = [];
    for (let i = 0; i < 500; i++) {
        const user = faker_1.faker.helpers.arrayElement(users);
        const notification = await prisma.notification.create({
            data: {
                userId: user.id,
                title: faker_1.faker.lorem.sentence({ min: 3, max: 8 }),
                message: faker_1.faker.lorem.sentence({ min: 5, max: 15 }),
                type: faker_1.faker.helpers.arrayElement(['ORDER', 'PAYMENT', 'JOB', 'MESSAGE', 'SYSTEM', 'PROMOTION']),
                data: {
                    relatedId: faker_1.faker.string.uuid(),
                    action: faker_1.faker.helpers.arrayElement(['view', 'approve', 'pay', 'respond']),
                },
                readAt: faker_1.faker.datatype.boolean(0.4) ? faker_1.faker.date.recent() : null,
            },
        });
        notifications.push(notification);
    }
    return notifications;
}
async function createAnalytics(restaurants, vendors) {
    console.log('Creating analytics data...');
    const analytics = [];
    // Create restaurant analytics
    for (const restaurant of restaurants.slice(0, 20)) {
        for (let i = 0; i < 30; i++) {
            const analytic = await prisma.analytics.create({
                data: {
                    restaurantId: restaurant.id,
                    date: faker_1.faker.date.past({ days: 90 }),
                    revenue: faker_1.faker.number.float({ min: 1000, max: 50000 }),
                    orders: faker_1.faker.number.int({ min: 5, max: 100 }),
                    customers: faker_1.faker.number.int({ min: 3, max: 80 }),
                    avgOrderValue: faker_1.faker.number.float({ min: 200, max: 800 }),
                    newCustomers: faker_1.faker.number.int({ min: 0, max: 20 }),
                    repeatCustomers: faker_1.faker.number.int({ min: 1, max: 60 }),
                    cancellations: faker_1.faker.number.int({ min: 0, max: 10 }),
                    refunds: faker_1.faker.number.float({ min: 0, max: 2000 }),
                    rating: faker_1.faker.number.float({ min: 3.0, max: 5.0, precision: 0.1 }),
                },
            });
            analytics.push(analytic);
        }
    }
    return analytics;
}
async function createReviews(users, restaurants, products) {
    console.log('Creating reviews...');
    const reviews = [];
    // Restaurant reviews
    for (let i = 0; i < 300; i++) {
        const user = faker_1.faker.helpers.arrayElement(users.filter(u => u.role !== 'VENDOR'));
        const restaurant = faker_1.faker.helpers.arrayElement(restaurants);
        const review = await prisma.review.create({
            data: {
                userId: user.id,
                restaurantId: restaurant.id,
                rating: faker_1.faker.number.int({ min: 1, max: 5 }),
                comment: faker_1.faker.lorem.paragraphs(faker_1.faker.number.int({ min: 1, max: 2 })),
                isVisible: true,
                isFlagged: faker_1.faker.datatype.boolean(0.05),
                response: faker_1.faker.datatype.boolean(0.3) ? faker_1.faker.lorem.sentence() : null,
            },
        });
        reviews.push(review);
    }
    // Product reviews
    for (let i = 0; i < 200; i++) {
        const user = faker_1.faker.helpers.arrayElement(users.filter(u => u.role !== 'VENDOR'));
        const product = faker_1.faker.helpers.arrayElement(products);
        const review = await prisma.review.create({
            data: {
                userId: user.id,
                productId: product.id,
                rating: faker_1.faker.number.int({ min: 1, max: 5 }),
                comment: faker_1.faker.lorem.paragraphs(faker_1.faker.number.int({ min: 1, max: 2 })),
                isVisible: true,
                isFlagged: faker_1.faker.datatype.boolean(0.03),
            },
        });
        reviews.push(review);
    }
    return reviews;
}
async function createEmployeeTagsAndDefenses(employees, restaurants) {
    console.log('Creating employee tags and defenses...');
    const tags = [];
    const defenses = [];
    for (let i = 0; i < 50; i++) {
        const employee = faker_1.faker.helpers.arrayElement(employees);
        const restaurant = faker_1.faker.helpers.arrayElement(restaurants);
        const restaurantUser = await prisma.user.findFirst({
            where: { restaurantProfile: { id: restaurant.id } },
        });
        if (!restaurantUser)
            continue;
        const tag = await prisma.employeeTag.create({
            data: {
                employeeId: employee.id,
                restaurantId: restaurant.id,
                taggedBy: restaurantUser.id,
                type: faker_1.faker.helpers.arrayElement(['POSITIVE', 'NEGATIVE', 'NEUTRAL']),
                category: faker_1.faker.helpers.arrayElement(['Performance', 'Attitude', 'Punctuality', 'Teamwork', 'Skills']),
                reason: faker_1.faker.lorem.sentence(),
                details: faker_1.faker.lorem.paragraph(),
                evidence: [],
                severity: faker_1.faker.number.int({ min: 1, max: 5 }),
                status: faker_1.faker.helpers.arrayElement(['ACTIVE', 'DISPUTED', 'RESOLVED']),
            },
        });
        tags.push(tag);
        // Create some defenses for negative tags
        if (tag.type === 'NEGATIVE' && faker_1.faker.datatype.boolean(0.4)) {
            const employeeUser = await prisma.user.findUnique({ where: { id: employee.userId } });
            if (employeeUser) {
                const defense = await prisma.employeeDefense.create({
                    data: {
                        tagId: tag.id,
                        employeeId: employee.id,
                        response: faker_1.faker.lorem.paragraphs(2),
                        evidence: [],
                        isResolved: faker_1.faker.datatype.boolean(0.6),
                        resolutionNote: faker_1.faker.datatype.boolean(0.6) ? faker_1.faker.lorem.sentence() : null,
                    },
                });
                defenses.push(defense);
            }
        }
    }
    // Create employment history
    for (let i = 0; i < 30; i++) {
        const employee = faker_1.faker.helpers.arrayElement(employees);
        const restaurant = faker_1.faker.helpers.arrayElement(restaurants);
        await prisma.employmentHistory.create({
            data: {
                employeeId: employee.id,
                restaurantId: restaurant.id,
                startDate: faker_1.faker.date.past({ years: 3 }),
                endDate: faker_1.faker.datatype.boolean(0.7) ? faker_1.faker.date.past({ years: 1 }) : null,
                position: faker_1.faker.helpers.arrayElement(JOB_TITLES),
                department: faker_1.faker.helpers.arrayElement(['Kitchen', 'Service', 'Management']),
                reason: faker_1.faker.datatype.boolean(0.5) ? faker_1.faker.lorem.sentence() : null,
                rating: faker_1.faker.number.float({ min: 2.0, max: 5.0, precision: 0.1 }),
                review: faker_1.faker.lorem.paragraph(),
                isVerified: faker_1.faker.datatype.boolean(0.8),
            },
        });
    }
    return { tags, defenses };
}
async function main() {
    console.log('🌱 Starting database seeding...');
    // Clean existing data
    console.log('🧹 Cleaning existing data...');
    await prisma.employmentHistory.deleteMany();
    await prisma.employeeDefense.deleteMany();
    await prisma.employeeTag.deleteMany();
    await prisma.messageRead.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversationParticipant.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.forumPostReply.deleteMany();
    await prisma.forumPostLike.deleteMany();
    await prisma.forumPost.deleteMany();
    await prisma.forumMember.deleteMany();
    await prisma.forum.deleteMany();
    await prisma.jobApplication.deleteMany();
    await prisma.job.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.review.deleteMany();
    await prisma.product.deleteMany();
    await prisma.analytics.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.vendor.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();
    // Create all data
    const { adminUsers, restaurantUsers, vendorUsers, employeeUsers } = await createUsers();
    const allUsers = [...adminUsers, ...restaurantUsers, ...vendorUsers, ...employeeUsers];
    const restaurants = await createRestaurantProfiles(restaurantUsers);
    const vendors = await createVendorProfiles(vendorUsers);
    const employees = await createEmployeeProfiles(employeeUsers, restaurants);
    const products = await createProducts(vendors, restaurants);
    const orders = await createOrders(restaurants, vendors, products);
    const jobs = await createJobs(restaurants);
    const applications = await createJobApplications(employees, jobs);
    const { forums, posts } = await createForumPosts(allUsers);
    const conversations = await createMessages(allUsers);
    const notifications = await createNotifications(allUsers);
    const analytics = await createAnalytics(restaurants, vendors);
    const reviews = await createReviews(allUsers, restaurants, products);
    const { tags, defenses } = await createEmployeeTagsAndDefenses(employees, restaurants);
    console.log('✅ Database seeded successfully!');
    console.log(`
📊 Summary:
- Users: ${allUsers.length} (${adminUsers.length} admins, ${restaurantUsers.length} restaurants, ${vendorUsers.length} vendors, ${employeeUsers.length} employees)
- Restaurants: ${restaurants.length}
- Vendors: ${vendors.length}
- Employees: ${employees.length}
- Products: ${products.length}
- Orders: ${orders.length}
- Jobs: ${jobs.length}
- Applications: ${applications.length}
- Forums: ${forums.length}
- Posts: ${posts.length}
- Conversations: ${conversations.length}
- Messages: Created with conversations
- Notifications: ${notifications.length}
- Reviews: ${reviews.length}
- Employee Tags: ${tags.length}
- Employee Defenses: ${defenses.length}
- Analytics Records: ${analytics.length}
  `);
}
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
