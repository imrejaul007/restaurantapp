import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { SecurityPerformanceService } from '../security-performance.service';

@Injectable()
export class CommunityValidationPipe implements PipeTransform {
  constructor(private readonly securityPerformanceService: SecurityPerformanceService) {}

  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    if (!value || typeof value !== 'object') {
      return value;
    }

    // Apply different validation based on the DTO type or metadata
    switch (metadata.metatype?.name) {
      case 'CreatePostDto':
        return this.validateCreatePost(value);
      case 'CreateCommentDto':
        return this.validateCreateComment(value);
      case 'SearchDto':
        return this.validateSearch(value);
      default:
        return value;
    }
  }

  private validateCreatePost(value: any): any {
    return this.securityPerformanceService.validateAndSanitizePostInput({
      title: value.title,
      content: value.content,
      tags: value.tags,
    });
  }

  private validateCreateComment(value: any): any {
    return {
      ...value,
      content: this.securityPerformanceService.validateAndSanitizeCommentInput(value.content),
    };
  }

  private validateSearch(value: any): any {
    return {
      ...value,
      query: value.query ? this.securityPerformanceService.validateAndSanitizeSearchInput(value.query) : value.query,
    };
  }
}

// Specific validation pipes for different use cases
@Injectable()
export class PostValidationPipe implements PipeTransform {
  constructor(private readonly securityPerformanceService: SecurityPerformanceService) {}

  transform(value: any, metadata: ArgumentMetadata): any {
    if (metadata.type !== 'body') {
      return value;
    }

    return this.securityPerformanceService.validateAndSanitizePostInput({
      title: value.title,
      content: value.content,
      tags: value.tags,
    });
  }
}

@Injectable()
export class CommentValidationPipe implements PipeTransform {
  constructor(private readonly securityPerformanceService: SecurityPerformanceService) {}

  transform(value: any, metadata: ArgumentMetadata): any {
    if (metadata.type !== 'body' || !value.content) {
      return value;
    }

    return {
      ...value,
      content: this.securityPerformanceService.validateAndSanitizeCommentInput(value.content),
    };
  }
}

@Injectable()
export class SearchValidationPipe implements PipeTransform {
  constructor(private readonly securityPerformanceService: SecurityPerformanceService) {}

  transform(value: any, metadata: ArgumentMetadata): any {
    if (metadata.type !== 'query' || !value.query) {
      return value;
    }

    return {
      ...value,
      query: this.securityPerformanceService.validateAndSanitizeSearchInput(value.query),
    };
  }
}