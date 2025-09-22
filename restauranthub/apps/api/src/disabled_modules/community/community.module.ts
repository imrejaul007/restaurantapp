import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { ForumService } from './forum.service';
// import { ForumController } from './forum.controller';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { ReputationService } from './reputation.service';
import { ReputationController } from './reputation.controller';
import { VendorSuggestionsService } from './vendor-suggestions.service';
import { VendorSuggestionsController } from './vendor-suggestions.controller';
import { NetworkingService } from './networking.service';
import { NetworkingController } from './networking.controller';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { ModerationService } from './moderation.service';
import { ModerationController } from './moderation.controller';
import { MarketplaceIntegrationService } from './marketplace-integration.service';
import { MarketplaceIntegrationController } from './marketplace-integration.controller';
import { CommunityNotificationService } from './notifications.service';
import { CommunityNotificationController } from './notifications.controller';
import { AdminCommunityService } from './admin-community.service';
import { AdminCommunityController } from './admin-community.controller';
import { SecurityPerformanceService } from './security-performance.service';
import { PerformanceInterceptor } from './interceptors/performance.interceptor';
import { CommunityValidationPipe, PostValidationPipe, CommentValidationPipe, SearchValidationPipe } from './pipes/validation.pipe';
import { FrontendIntegrationService } from './frontend-integration.service';
import { FrontendIntegrationController } from './frontend-integration.controller';
// import { DiscussionsService } from './discussions.service';
// import { DiscussionsController } from './discussions.controller';

@Module({
  imports: [DatabaseModule, WebsocketModule],
  providers: [CommunityService, PostsService, ForumService, ReputationService, VendorSuggestionsService, NetworkingService, SearchService, ModerationService, MarketplaceIntegrationService, CommunityNotificationService, AdminCommunityService, SecurityPerformanceService, PerformanceInterceptor, CommunityValidationPipe, PostValidationPipe, CommentValidationPipe, SearchValidationPipe, FrontendIntegrationService],
  controllers: [CommunityController, PostsController, ReputationController, VendorSuggestionsController, NetworkingController, SearchController, ModerationController, MarketplaceIntegrationController, CommunityNotificationController, AdminCommunityController, FrontendIntegrationController],
  exports: [CommunityService, PostsService, ForumService, ReputationService, VendorSuggestionsService, NetworkingService, SearchService, ModerationService, MarketplaceIntegrationService, CommunityNotificationService, AdminCommunityService, SecurityPerformanceService, FrontendIntegrationService],
})
export class CommunityModule {}