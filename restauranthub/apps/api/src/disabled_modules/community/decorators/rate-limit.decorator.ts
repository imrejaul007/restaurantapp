import { SetMetadata, applyDecorators } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitOptions {
  action: string;
  skipIf?: (req: any) => boolean;
}

export const RateLimit = (action: string, skipIf?: (req: any) => boolean) =>
  applyDecorators(SetMetadata(RATE_LIMIT_KEY, { action, skipIf }));

// Pre-defined rate limit decorators for common actions
export const PostCreationLimit = () => RateLimit('create_post');
export const LikeActionLimit = () => RateLimit('like_post');
export const CommentLimit = () => RateLimit('comment_post');
export const FollowLimit = () => RateLimit('follow_user');
export const SearchLimit = () => RateLimit('search');
export const ReportLimit = () => RateLimit('report_content');