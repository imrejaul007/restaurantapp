"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../database/database.module");
const websocket_module_1 = require("../websocket/websocket.module");
const community_service_1 = require("./community.service");
const community_controller_1 = require("./community.controller");
const forum_service_1 = require("./forum.service");
const posts_service_1 = require("./posts.service");
const posts_controller_1 = require("./posts.controller");
const reputation_service_1 = require("./reputation.service");
const reputation_controller_1 = require("./reputation.controller");
const vendor_suggestions_service_1 = require("./vendor-suggestions.service");
const vendor_suggestions_controller_1 = require("./vendor-suggestions.controller");
const networking_service_1 = require("./networking.service");
const networking_controller_1 = require("./networking.controller");
const search_service_1 = require("./search.service");
const search_controller_1 = require("./search.controller");
const moderation_service_1 = require("./moderation.service");
const moderation_controller_1 = require("./moderation.controller");
const marketplace_integration_service_1 = require("./marketplace-integration.service");
const marketplace_integration_controller_1 = require("./marketplace-integration.controller");
const notifications_service_1 = require("./notifications.service");
const notifications_controller_1 = require("./notifications.controller");
const admin_community_service_1 = require("./admin-community.service");
const admin_community_controller_1 = require("./admin-community.controller");
const security_performance_service_1 = require("./security-performance.service");
const performance_interceptor_1 = require("./interceptors/performance.interceptor");
const validation_pipe_1 = require("./pipes/validation.pipe");
const frontend_integration_service_1 = require("./frontend-integration.service");
const frontend_integration_controller_1 = require("./frontend-integration.controller");
let CommunityModule = class CommunityModule {
};
exports.CommunityModule = CommunityModule;
exports.CommunityModule = CommunityModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, websocket_module_1.WebsocketModule],
        providers: [community_service_1.CommunityService, posts_service_1.PostsService, forum_service_1.ForumService, reputation_service_1.ReputationService, vendor_suggestions_service_1.VendorSuggestionsService, networking_service_1.NetworkingService, search_service_1.SearchService, moderation_service_1.ModerationService, marketplace_integration_service_1.MarketplaceIntegrationService, notifications_service_1.CommunityNotificationService, admin_community_service_1.AdminCommunityService, security_performance_service_1.SecurityPerformanceService, performance_interceptor_1.PerformanceInterceptor, validation_pipe_1.CommunityValidationPipe, validation_pipe_1.PostValidationPipe, validation_pipe_1.CommentValidationPipe, validation_pipe_1.SearchValidationPipe, frontend_integration_service_1.FrontendIntegrationService],
        controllers: [community_controller_1.CommunityController, posts_controller_1.PostsController, reputation_controller_1.ReputationController, vendor_suggestions_controller_1.VendorSuggestionsController, networking_controller_1.NetworkingController, search_controller_1.SearchController, moderation_controller_1.ModerationController, marketplace_integration_controller_1.MarketplaceIntegrationController, notifications_controller_1.CommunityNotificationController, admin_community_controller_1.AdminCommunityController, frontend_integration_controller_1.FrontendIntegrationController],
        exports: [community_service_1.CommunityService, posts_service_1.PostsService, forum_service_1.ForumService, reputation_service_1.ReputationService, vendor_suggestions_service_1.VendorSuggestionsService, networking_service_1.NetworkingService, search_service_1.SearchService, moderation_service_1.ModerationService, marketplace_integration_service_1.MarketplaceIntegrationService, notifications_service_1.CommunityNotificationService, admin_community_service_1.AdminCommunityService, security_performance_service_1.SecurityPerformanceService, frontend_integration_service_1.FrontendIntegrationService],
    })
], CommunityModule);
//# sourceMappingURL=community.module.js.map