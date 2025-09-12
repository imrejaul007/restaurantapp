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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityNotificationController = void 0;
const common_1 = require("@nestjs/common");
const notifications_service_1 = require("./notifications.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let CommunityNotificationController = class CommunityNotificationController {
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    async getNotifications(req, page, limit, unreadOnly, type) {
        return this.notificationService.getUserNotifications(req.user.id, {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            unreadOnly: unreadOnly === 'true',
            type,
        });
    }
    async markNotificationRead(req, notificationId) {
        return this.notificationService.markNotificationRead(req.user.id, notificationId);
    }
    async markAllNotificationsRead(req) {
        return this.notificationService.markAllNotificationsRead(req.user.id);
    }
    async getNotificationPreferences(req) {
        return {
            email: true,
            push: true,
            inApp: true,
            types: {
                POST_LIKED: true,
                POST_COMMENTED: true,
                USER_FOLLOWED: true,
                GROUP_ACTIVITY: true,
                REPUTATION_MILESTONE: true,
                WEEKLY_DIGEST: true,
            },
        };
    }
    async updateNotificationPreferences(req, preferences) {
        return this.notificationService.updateNotificationPreferences(req.user.id, preferences);
    }
    async sendTestNotification(req, type) {
        const testNotifications = {
            like: {
                type: 'POST_LIKED',
                title: 'Test Notification',
                message: 'Someone liked your test post',
                actionUrl: '/community/posts/test',
                priority: 'LOW',
            },
            follow: {
                type: 'USER_FOLLOWED',
                title: 'Test Notification',
                message: 'Someone started following you',
                actionUrl: '/community/users/test',
                priority: 'MEDIUM',
            },
            milestone: {
                type: 'REPUTATION_MILESTONE',
                title: 'Test Notification',
                message: 'You reached a test milestone',
                actionUrl: '/community/reputation',
                priority: 'HIGH',
            },
        };
        const testData = testNotifications[type];
        if (!testData) {
            return { error: 'Invalid test type' };
        }
        return this.notificationService.sendNotification(req.user.id, testData);
    }
};
exports.CommunityNotificationController = CommunityNotificationController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('unreadOnly')),
    __param(4, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CommunityNotificationController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Post)('mark-read/:notificationId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('notificationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityNotificationController.prototype, "markNotificationRead", null);
__decorate([
    (0, common_1.Post)('mark-all-read'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommunityNotificationController.prototype, "markAllNotificationsRead", null);
__decorate([
    (0, common_1.Get)('preferences'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommunityNotificationController.prototype, "getNotificationPreferences", null);
__decorate([
    (0, common_1.Put)('preferences'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CommunityNotificationController.prototype, "updateNotificationPreferences", null);
__decorate([
    (0, common_1.Post)('test/:type'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityNotificationController.prototype, "sendTestNotification", null);
exports.CommunityNotificationController = CommunityNotificationController = __decorate([
    (0, common_1.Controller)('community/notifications'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [notifications_service_1.CommunityNotificationService])
], CommunityNotificationController);
//# sourceMappingURL=notifications.controller.js.map