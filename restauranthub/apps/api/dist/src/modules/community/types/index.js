"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationPriority = exports.NotificationType = void 0;
var NotificationType;
(function (NotificationType) {
    NotificationType["POST_LIKED"] = "POST_LIKED";
    NotificationType["POST_COMMENTED"] = "POST_COMMENTED";
    NotificationType["POST_SHARED"] = "POST_SHARED";
    NotificationType["USER_FOLLOWED"] = "USER_FOLLOWED";
    NotificationType["GROUP_JOINED"] = "GROUP_JOINED";
    NotificationType["GROUP_POST"] = "GROUP_POST";
    NotificationType["REPUTATION_MILESTONE"] = "REPUTATION_MILESTONE";
    NotificationType["BADGE_EARNED"] = "BADGE_EARNED";
    NotificationType["FORUM_SUBSCRIBED"] = "FORUM_SUBSCRIBED";
    NotificationType["SUGGESTION_RATED"] = "SUGGESTION_RATED";
    NotificationType["CONTENT_REPORTED"] = "CONTENT_REPORTED";
    NotificationType["JOB_APPLICATION"] = "JOB_APPLICATION";
    NotificationType["PRODUCT_DISCUSSED"] = "PRODUCT_DISCUSSED";
    NotificationType["WEEKLY_DIGEST"] = "WEEKLY_DIGEST";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationPriority;
(function (NotificationPriority) {
    NotificationPriority["LOW"] = "LOW";
    NotificationPriority["MEDIUM"] = "MEDIUM";
    NotificationPriority["HIGH"] = "HIGH";
})(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
//# sourceMappingURL=index.js.map