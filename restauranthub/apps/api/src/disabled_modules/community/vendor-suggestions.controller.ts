import { Controller, Get, Post, Query, Param, Body, UseGuards, Request } from '@nestjs/common';
import { VendorSuggestionsService } from './vendor-suggestions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuggestionRating } from '@prisma/client';

@Controller('community/suggestions')
@UseGuards(JwtAuthGuard)
export class VendorSuggestionsController {
  constructor(private readonly vendorSuggestionsService: VendorSuggestionsService) {}

  @Post('vendor')
  async suggestVendor(
    @Request() req: any,
    @Body() body: {
      postId: string;
      vendorId: string;
      reason: string;
    },
  ) {
    return this.vendorSuggestionsService.suggestVendor(
      req.user.id,
      body.postId,
      body.vendorId,
      body.reason,
    );
  }

  @Post('product')
  async suggestProduct(
    @Request() req: any,
    @Body() body: {
      postId: string;
      productId: string;
      reason: string;
    },
  ) {
    return this.vendorSuggestionsService.suggestProduct(
      req.user.id,
      body.postId,
      body.productId,
      body.reason,
    );
  }

  @Get('post/:postId')
  async getSuggestions(
    @Param('postId') postId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.vendorSuggestionsService.getSuggestions(postId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Post('rate/:suggestionId')
  async rateSuggestion(
    @Request() req: any,
    @Param('suggestionId') suggestionId: string,
    @Body() body: {
      rating: SuggestionRating;
    },
  ) {
    return this.vendorSuggestionsService.rateSuggestion(
      req.user.id,
      suggestionId,
      'vendor', // Default to vendor suggestions
      body.rating,
    );
  }

  @Post('mark-best/:suggestionId')
  async markBestSuggestion(
    @Request() req: any,
    @Param('suggestionId') suggestionId: string,
  ) {
    return this.vendorSuggestionsService.markBestSuggestion(
      req.user.id,
      suggestionId,
      'vendor', // Default to vendor suggestions
    );
  }
}