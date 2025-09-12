"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const throttler_2 = require("@nestjs/throttler");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const restaurants_module_1 = require("./modules/restaurants/restaurants.module");
const vendors_module_1 = require("./modules/vendors/vendors.module");
const jobs_module_1 = require("./modules/jobs/jobs.module");
const marketplace_module_1 = require("./modules/marketplace/marketplace.module");
const orders_module_1 = require("./modules/orders/orders.module");
const payments_module_1 = require("./modules/payments/payments.module");
const community_module_1 = require("./modules/community/community.module");
const admin_module_1 = require("./modules/admin/admin.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const websocket_module_1 = require("./modules/websocket/websocket.module");
const email_module_1 = require("./modules/email/email.module");
const legal_module_1 = require("./modules/legal/legal.module");
const redis_module_1 = require("./redis/redis.module");
const database_module_1 = require("./modules/database/database.module");
const configuration_1 = __importDefault(require("./config/configuration"));
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
                envFilePath: ['.env.local', '.env'],
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => [{
                        ttl: parseInt(configService.get('THROTTLE_TTL') || '60000'),
                        limit: parseInt(configService.get('THROTTLE_LIMIT') || (configService.get('NODE_ENV') === 'development' ? '10000' : '100')),
                    }],
                inject: [config_1.ConfigService],
            }),
            prisma_module_1.PrismaModule,
            database_module_1.DatabaseModule,
            redis_module_1.RedisModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            email_module_1.EmailModule,
            legal_module_1.LegalModule,
            restaurants_module_1.RestaurantsModule,
            vendors_module_1.VendorsModule,
            jobs_module_1.JobsModule,
            marketplace_module_1.MarketplaceModule,
            orders_module_1.OrdersModule,
            payments_module_1.PaymentsModule,
            community_module_1.CommunityModule,
            admin_module_1.AdminModule,
            analytics_module_1.AnalyticsModule,
            websocket_module_1.WebsocketModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useFactory: (configService) => {
                    const enableThrottling = configService.get('ENABLE_THROTTLING', 'true') === 'true';
                    if (!enableThrottling) {
                        console.warn('⚠️ RATE LIMITING DISABLED - Check ENABLE_THROTTLING environment variable');
                        return null;
                    }
                    return new throttler_2.ThrottlerGuard();
                },
                inject: [config_1.ConfigService],
            },
        ].filter(provider => provider !== null),
    })
], AppModule);
//# sourceMappingURL=app.module.js.map