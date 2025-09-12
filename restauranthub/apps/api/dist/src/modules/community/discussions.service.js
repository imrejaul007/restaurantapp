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
var DiscussionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscussionsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const websocket_service_1 = require("../websocket/websocket.service");
let DiscussionsService = DiscussionsService_1 = class DiscussionsService {
    constructor(databaseService, websocketService) {
        this.databaseService = databaseService;
        this.websocketService = websocketService;
        this.logger = new common_1.Logger(DiscussionsService_1.name);
    }
    async createDiscussion(userId, discussionData) {
        throw new common_1.NotImplementedException('Discussion feature not implemented - Discussion model missing from schema');
    }
    async getAllDiscussions(filters, pagination) {
        throw new common_1.NotImplementedException('Discussion feature not implemented - Discussion model missing from schema');
    }
    async getDiscussionById(discussionId) {
        throw new common_1.NotImplementedException('Discussion feature not implemented - Discussion model missing from schema');
    }
    async joinDiscussion(userId, discussionId) {
        throw new common_1.NotImplementedException('Discussion feature not implemented - Discussion model missing from schema');
    }
    async leaveDiscussion(userId, discussionId) {
        throw new common_1.NotImplementedException('Discussion feature not implemented - Discussion model missing from schema');
        return { message: 'Left discussion successfully' };
    }
    async updateDiscussion(userId, discussionId, updateData) {
        throw new common_1.NotImplementedException('Discussion feature not implemented - Discussion model missing from schema');
    }
    async deleteDiscussion(userId, discussionId) {
        throw new common_1.NotImplementedException('Discussion feature not implemented - Discussion model missing from schema');
        return { message: 'Discussion deleted successfully' };
    }
    async sendMessage(userId, discussionId, messageData) {
        throw new common_1.NotImplementedException('Discussion feature not implemented - Discussion model missing from schema');
    }
    async getMessages(discussionId, filters, pagination) {
        throw new common_1.NotImplementedException('Discussion feature not implemented - Discussion model missing from schema');
    }
    async closeDiscussion(userId, discussionId) {
        throw new common_1.NotImplementedException('Discussion feature not implemented - Discussion model missing from schema');
    }
    async archiveDiscussion(userId, discussionId) {
        throw new common_1.NotImplementedException('Discussion feature not implemented - Discussion model missing from schema');
    }
};
exports.DiscussionsService = DiscussionsService;
exports.DiscussionsService = DiscussionsService = DiscussionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        websocket_service_1.WebsocketService])
], DiscussionsService);
//# sourceMappingURL=discussions.service.js.map