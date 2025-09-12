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
exports.JobNotificationsService = exports.NotificationPriority = exports.JobNotificationType = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
var JobNotificationType;
(function (JobNotificationType) {
    JobNotificationType["JOB_POSTED"] = "JOB_POSTED";
    JobNotificationType["JOB_UPDATED"] = "JOB_UPDATED";
    JobNotificationType["JOB_EXPIRED"] = "JOB_EXPIRED";
    JobNotificationType["JOB_FILLED"] = "JOB_FILLED";
    JobNotificationType["JOB_CLOSED"] = "JOB_CLOSED";
    JobNotificationType["APPLICATION_RECEIVED"] = "APPLICATION_RECEIVED";
    JobNotificationType["APPLICATION_STATUS_CHANGED"] = "APPLICATION_STATUS_CHANGED";
    JobNotificationType["APPLICATION_REVIEWED"] = "APPLICATION_REVIEWED";
    JobNotificationType["APPLICATION_SHORTLISTED"] = "APPLICATION_SHORTLISTED";
    JobNotificationType["APPLICATION_REJECTED"] = "APPLICATION_REJECTED";
    JobNotificationType["APPLICATION_ACCEPTED"] = "APPLICATION_ACCEPTED";
    JobNotificationType["INTERVIEW_SCHEDULED"] = "INTERVIEW_SCHEDULED";
    JobNotificationType["INTERVIEW_REMINDER"] = "INTERVIEW_REMINDER";
    JobNotificationType["INTERVIEW_COMPLETED"] = "INTERVIEW_COMPLETED";
    JobNotificationType["EMPLOYMENT_OFFER"] = "EMPLOYMENT_OFFER";
    JobNotificationType["EMPLOYMENT_STARTED"] = "EMPLOYMENT_STARTED";
    JobNotificationType["EMPLOYMENT_TERMINATED"] = "EMPLOYMENT_TERMINATED";
    JobNotificationType["JOB_MATCH_FOUND"] = "JOB_MATCH_FOUND";
    JobNotificationType["EMPLOYEE_MATCH_FOUND"] = "EMPLOYEE_MATCH_FOUND";
    JobNotificationType["AVAILABILITY_UPDATED"] = "AVAILABILITY_UPDATED";
    JobNotificationType["JOB_MODERATION_DECISION"] = "JOB_MODERATION_DECISION";
    JobNotificationType["JOB_FLAGGED"] = "JOB_FLAGGED";
    JobNotificationType["JOB_APPROVED"] = "JOB_APPROVED";
    JobNotificationType["URGENT_ALERT"] = "URGENT_ALERT";
    JobNotificationType["DEADLINE_REMINDER"] = "DEADLINE_REMINDER";
    JobNotificationType["SYSTEM_UPDATE"] = "SYSTEM_UPDATE";
})(JobNotificationType || (exports.JobNotificationType = JobNotificationType = {}));
var NotificationPriority;
(function (NotificationPriority) {
    NotificationPriority["LOW"] = "LOW";
    NotificationPriority["MEDIUM"] = "MEDIUM";
    NotificationPriority["HIGH"] = "HIGH";
    NotificationPriority["URGENT"] = "URGENT";
})(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
let JobNotificationsService = class JobNotificationsService {
    constructor(prisma, redisService, websocketGateway) {
        this.prisma = prisma;
        this.redisService = redisService;
        this.websocketGateway = websocketGateway;
        this.notifications = new Map();
        this.globalNotifications = [];
    }
    async onModuleInit() {
        await this.subscribeToJobEvents();
    }
    async subscribeToJobEvents() {
        const channels = [
            'job:created',
            'job:updated',
            'job:application',
            'job:moderation',
            'employee:availability',
            'application:status',
            'interview:scheduled',
            'employment:hired'
        ];
        for (const channel of channels) {
            console.log(`Subscribed to ${channel} notifications`);
        }
    }
    async notifyJobPosted(job, restaurantId) {
        const notification = {
            id: `job_posted_${job.id}_${Date.now()}`,
            type: JobNotificationType.JOB_POSTED,
            title: 'New Job Posted',
            message: `Your job "${job.title}" has been posted successfully`,
            data: { jobId: job.id, jobTitle: job.title },
            recipients: [restaurantId],
            priority: NotificationPriority.MEDIUM,
            createdAt: new Date(),
            readBy: [],
            actionUrl: `/jobs/${job.id}`,
        };
        await this.sendNotification(notification);
        await this.notifyMatchedEmployees(job);
    }
    async notifyJobUpdated(job, restaurantId) {
        const notification = {
            id: `job_updated_${job.id}_${Date.now()}`,
            type: JobNotificationType.JOB_UPDATED,
            title: 'Job Updated',
            message: `Your job "${job.title}" has been updated`,
            data: { jobId: job.id, jobTitle: job.title },
            recipients: [restaurantId],
            priority: NotificationPriority.LOW,
            createdAt: new Date(),
            readBy: [],
            actionUrl: `/jobs/${job.id}`,
        };
        await this.sendNotification(notification);
    }
    async notifyApplicationReceived(application) {
        const notification = {
            id: `app_received_${application.id}_${Date.now()}`,
            type: JobNotificationType.APPLICATION_RECEIVED,
            title: 'New Job Application',
            message: `New application received for "${application.job.title}" from ${application.employee.user.profile?.firstName || 'Employee'}`,
            data: {
                applicationId: application.id,
                jobId: application.jobId,
                jobTitle: application.job.title,
                employeeName: application.employee.user.profile?.firstName || 'Employee'
            },
            recipients: [application.job.restaurant.userId],
            priority: NotificationPriority.HIGH,
            createdAt: new Date(),
            readBy: [],
            actionRequired: true,
            actionUrl: `/applications/${application.id}`,
        };
        await this.sendNotification(notification);
    }
    async notifyApplicationStatusChanged(application, newStatus) {
        const employeeNotification = {
            id: `app_status_${application.id}_${Date.now()}`,
            type: JobNotificationType.APPLICATION_STATUS_CHANGED,
            title: 'Application Status Updated',
            message: `Your application for "${application.job.title}" has been ${newStatus.toLowerCase()}`,
            data: {
                applicationId: application.id,
                jobId: application.jobId,
                status: newStatus,
                jobTitle: application.job.title
            },
            recipients: [application.employee.userId],
            priority: newStatus === 'ACCEPTED' ? NotificationPriority.URGENT : NotificationPriority.HIGH,
            createdAt: new Date(),
            readBy: [],
            actionUrl: `/my-applications/${application.id}`,
        };
        await this.sendNotification(employeeNotification);
    }
    async notifyInterviewScheduled(application, interviewDetails) {
        const employeeNotification = {
            id: `interview_scheduled_${application.id}_${Date.now()}`,
            type: JobNotificationType.INTERVIEW_SCHEDULED,
            title: 'Interview Scheduled',
            message: `Interview scheduled for "${application.job.title}" on ${interviewDetails.scheduledFor}`,
            data: {
                applicationId: application.id,
                jobId: application.jobId,
                interviewDetails,
                jobTitle: application.job.title
            },
            recipients: [application.employee.userId],
            priority: NotificationPriority.URGENT,
            createdAt: new Date(),
            readBy: [],
            actionRequired: true,
            actionUrl: `/interviews/${application.id}`,
        };
        await this.sendNotification(employeeNotification);
        const restaurantNotification = {
            id: `interview_confirmed_${application.id}_${Date.now()}`,
            type: JobNotificationType.INTERVIEW_SCHEDULED,
            title: 'Interview Scheduled',
            message: `Interview scheduled with ${application.employee.user.profile?.firstName || 'candidate'} for "${application.job.title}"`,
            data: {
                applicationId: application.id,
                jobId: application.jobId,
                interviewDetails,
                candidateName: application.employee.user.profile?.firstName
            },
            recipients: [application.job.restaurant.userId],
            priority: NotificationPriority.HIGH,
            createdAt: new Date(),
            readBy: [],
            actionUrl: `/interviews/${application.id}`,
        };
        await this.sendNotification(restaurantNotification);
    }
    async notifyEmploymentOffer(application, contractDetails) {
        const notification = {
            id: `employment_offer_${application.id}_${Date.now()}`,
            type: JobNotificationType.EMPLOYMENT_OFFER,
            title: 'Job Offer Received!',
            message: `Congratulations! You have received a job offer for "${application.job.title}"`,
            data: {
                applicationId: application.id,
                jobId: application.jobId,
                contractDetails,
                jobTitle: application.job.title,
                restaurantName: application.job.restaurant.name
            },
            recipients: [application.employee.userId],
            priority: NotificationPriority.URGENT,
            createdAt: new Date(),
            readBy: [],
            actionRequired: true,
            actionUrl: `/job-offers/${application.id}`,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };
        await this.sendNotification(notification);
    }
    async notifyJobMatches(employeeId, matches) {
        if (matches.length === 0)
            return;
        const notification = {
            id: `job_matches_${employeeId}_${Date.now()}`,
            type: JobNotificationType.JOB_MATCH_FOUND,
            title: `${matches.length} New Job Match${matches.length > 1 ? 'es' : ''} Found!`,
            message: `We found ${matches.length} job${matches.length > 1 ? 's' : ''} that match your preferences`,
            data: {
                employeeId,
                matchCount: matches.length,
                topMatches: matches.slice(0, 3).map(match => ({
                    jobId: match.id,
                    title: match.title,
                    restaurant: match.restaurant.name,
                    matchScore: match.matchScore
                }))
            },
            recipients: [employeeId],
            priority: NotificationPriority.MEDIUM,
            createdAt: new Date(),
            readBy: [],
            actionUrl: `/job-matches`,
        };
        await this.sendNotification(notification);
    }
    async notifyEmployeeMatches(restaurantId, availableEmployees) {
        if (availableEmployees.length === 0)
            return;
        const notification = {
            id: `employee_matches_${restaurantId}_${Date.now()}`,
            type: JobNotificationType.EMPLOYEE_MATCH_FOUND,
            title: `${availableEmployees.length} Available Employee${availableEmployees.length > 1 ? 's' : ''} Found`,
            message: `${availableEmployees.length} employee${availableEmployees.length > 1 ? 's are' : ' is'} available for your job postings`,
            data: {
                restaurantId,
                employeeCount: availableEmployees.length,
                topEmployees: availableEmployees.slice(0, 3).map(emp => ({
                    employeeId: emp.id,
                    name: emp.user.profile?.firstName,
                    skills: emp.availability?.preferredRoles || []
                }))
            },
            recipients: [restaurantId],
            priority: NotificationPriority.MEDIUM,
            createdAt: new Date(),
            readBy: [],
            actionUrl: `/available-employees`,
        };
        await this.sendNotification(notification);
    }
    async notifyModerationDecision(job, decision, moderatorNotes, feedback) {
        const notification = {
            id: `moderation_${job.id}_${Date.now()}`,
            type: decision === 'approved' ? JobNotificationType.JOB_APPROVED :
                decision === 'flagged' ? JobNotificationType.JOB_FLAGGED :
                    JobNotificationType.JOB_MODERATION_DECISION,
            title: `Job ${decision.charAt(0).toUpperCase() + decision.slice(1)}`,
            message: decision === 'approved' ?
                `Your job "${job.title}" has been approved and is now live` :
                `Your job "${job.title}" needs attention: ${feedback || moderatorNotes}`,
            data: {
                jobId: job.id,
                jobTitle: job.title,
                decision,
                moderatorNotes,
                feedback
            },
            recipients: [job.restaurant.userId],
            priority: decision === 'approved' ? NotificationPriority.MEDIUM : NotificationPriority.HIGH,
            createdAt: new Date(),
            readBy: [],
            actionRequired: decision !== 'approved',
            actionUrl: `/jobs/${job.id}`,
        };
        await this.sendNotification(notification);
    }
    async sendJobExpiryReminders() {
        const expiringJobs = await this.prisma.job.findMany({
            where: {
                status: 'OPEN',
                validTill: {
                    gte: new Date(),
                    lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
                },
            },
            include: {
                restaurant: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        for (const job of expiringJobs) {
            const notification = {
                id: `job_expiry_${job.id}_${Date.now()}`,
                type: JobNotificationType.JOB_EXPIRED,
                title: 'Job Expiring Soon',
                message: `Your job "${job.title}" expires in 24 hours`,
                data: {
                    jobId: job.id,
                    jobTitle: job.title,
                    validTill: job.validTill
                },
                recipients: [job.restaurant.userId],
                priority: NotificationPriority.HIGH,
                createdAt: new Date(),
                readBy: [],
                actionRequired: true,
                actionUrl: `/jobs/${job.id}/extend`,
            };
            await this.sendNotification(notification);
        }
    }
    async sendNotification(notification) {
        for (const recipientId of notification.recipients) {
            const userNotifications = this.notifications.get(recipientId) || [];
            userNotifications.unshift(notification);
            if (userNotifications.length > 100) {
                userNotifications.splice(100);
            }
            this.notifications.set(recipientId, userNotifications);
            try {
                this.websocketGateway.server?.to(recipientId).emit('job_notification', {
                    notification,
                    unreadCount: this.getUnreadCount(recipientId),
                });
            }
            catch (error) {
                console.log(`Failed to send WebSocket notification to user ${recipientId}:`, error.message);
            }
        }
        await this.redisService.publish('job_notifications', JSON.stringify({
            type: 'notification_sent',
            notification,
            timestamp: new Date(),
        }));
        console.log(`📨 Sent ${notification.type} notification to ${notification.recipients.length} user(s): ${notification.title}`);
    }
    async getUserNotifications(userId, page = 1, limit = 20) {
        const userNotifications = this.notifications.get(userId) || [];
        const start = (page - 1) * limit;
        const end = start + limit;
        return {
            notifications: userNotifications.slice(start, end),
            total: userNotifications.length,
            unread: this.getUnreadCount(userId),
            page,
            limit,
            totalPages: Math.ceil(userNotifications.length / limit),
        };
    }
    async markNotificationRead(userId, notificationId) {
        const userNotifications = this.notifications.get(userId) || [];
        const notification = userNotifications.find(n => n.id === notificationId);
        if (notification && !notification.readBy.includes(userId)) {
            notification.readBy.push(userId);
        }
        return { success: true, unreadCount: this.getUnreadCount(userId) };
    }
    async markAllNotificationsRead(userId) {
        const userNotifications = this.notifications.get(userId) || [];
        userNotifications.forEach(notification => {
            if (!notification.readBy.includes(userId)) {
                notification.readBy.push(userId);
            }
        });
        return { success: true, unreadCount: 0 };
    }
    async deleteNotification(userId, notificationId) {
        const userNotifications = this.notifications.get(userId) || [];
        const index = userNotifications.findIndex(n => n.id === notificationId);
        if (index > -1) {
            userNotifications.splice(index, 1);
        }
        return { success: true };
    }
    getUnreadCount(userId) {
        const userNotifications = this.notifications.get(userId) || [];
        return userNotifications.filter(n => !n.readBy.includes(userId)).length;
    }
    async updateNotificationPreferences(userId, preferences) {
        const cacheKey = `notification_prefs_${userId}`;
        return { success: true, preferences };
    }
    async getNotificationStats(userId) {
        if (userId) {
            const userNotifications = this.notifications.get(userId) || [];
            return {
                total: userNotifications.length,
                unread: this.getUnreadCount(userId),
                byType: this.groupNotificationsByType(userNotifications),
            };
        }
        let totalNotifications = 0;
        const typeStats = {};
        for (const [uid, notifications] of this.notifications.entries()) {
            totalNotifications += notifications.length;
            notifications.forEach(n => {
                typeStats[n.type] = (typeStats[n.type] || 0) + 1;
            });
        }
        return {
            totalUsers: this.notifications.size,
            totalNotifications,
            averagePerUser: this.notifications.size > 0 ? (totalNotifications / this.notifications.size).toFixed(1) : 0,
            byType: typeStats,
        };
    }
    groupNotificationsByType(notifications) {
        return notifications.reduce((acc, notification) => {
            acc[notification.type] = (acc[notification.type] || 0) + 1;
            return acc;
        }, {});
    }
    async notifyMatchedEmployees(job) {
        try {
            console.log(`🔍 Looking for matched employees for job: ${job.title}`);
            const matchedEmployees = [];
            for (const employeeId of matchedEmployees) {
                const notification = {
                    id: `job_match_${job.id}_${employeeId}_${Date.now()}`,
                    type: JobNotificationType.JOB_MATCH_FOUND,
                    title: 'New Job Match Available',
                    message: `A job matching your skills is available: ${job.title}`,
                    data: {
                        jobId: job.id,
                        jobTitle: job.title,
                        restaurant: job.restaurant?.name,
                        matchScore: 0.85,
                    },
                    recipients: [employeeId],
                    priority: NotificationPriority.HIGH,
                    readBy: [],
                    createdAt: new Date(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                };
                await this.sendNotification(notification);
            }
        }
        catch (error) {
            console.error('Error notifying matched employees:', error);
        }
    }
    async cleanupExpiredNotifications() {
        const now = new Date();
        let cleanedCount = 0;
        for (const [userId, notifications] of this.notifications.entries()) {
            const validNotifications = notifications.filter(n => !n.expiresAt || n.expiresAt > now);
            cleanedCount += notifications.length - validNotifications.length;
            if (validNotifications.length !== notifications.length) {
                this.notifications.set(userId, validNotifications);
            }
        }
        console.log(`🧹 Cleaned up ${cleanedCount} expired notifications`);
        return { cleanedCount };
    }
};
exports.JobNotificationsService = JobNotificationsService;
exports.JobNotificationsService = JobNotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        websocket_gateway_1.WebsocketGateway])
], JobNotificationsService);
//# sourceMappingURL=job-notifications.service.js.map