import { Controller, Get, Post, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { MarketplaceIntegrationService } from './marketplace-integration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('community/marketplace')
@UseGuards(JwtAuthGuard)
export class MarketplaceIntegrationController {
  constructor(
    private readonly marketplaceIntegrationService: MarketplaceIntegrationService,
  ) {}

  @Post('product-discussion')
  async createProductDiscussion(
    @Request() req: any,
    @Body() body: {
      productId: string;
      title: string;
      content: string;
      forumId?: string;
      tags?: string[];
    },
  ) {
    return this.marketplaceIntegrationService.createProductDiscussion(
      req.user.id,
      body.productId,
      {
        title: body.title,
        content: body.content,
        forumId: body.forumId,
        tags: body.tags,
      },
    );
  }

  @Post('job-posting')
  async createJobPosting(
    @Request() req: any,
    @Body() body: {
      title: string;
      description: string;
      restaurantId: string;
      location: string;
      jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE';
      salaryMin?: number;
      salaryMax?: number;
      requirements: string[];
      skills?: string[];
      benefits?: string[];
      applicationUrl?: string;
      expiresAt?: string;
    },
  ) {
    return this.marketplaceIntegrationService.createJobPosting(req.user.id, {
      title: body.title,
      description: body.description,
      restaurantId: body.restaurantId,
      location: body.location,
      jobType: body.jobType,
      salaryMin: body.salaryMin,
      salaryMax: body.salaryMax,
      requirements: body.requirements,
      skills: body.skills,
      benefits: body.benefits,
      applicationUrl: body.applicationUrl,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });
  }

  @Get('insights')
  async getMarketplaceInsights(
    @Query('type') type: 'product' | 'vendor' | 'category',
    @Query('id') id?: string,
    @Query('timeframe') timeframe?: 'week' | 'month' | 'quarter',
  ) {
    return this.marketplaceIntegrationService.getMarketplaceInsights({
      type,
      id,
      timeframe,
    });
  }

  @Get('job-analytics')
  async getJobMarketAnalytics(
    @Query('location') location?: string,
    @Query('jobType') jobType?: string,
    @Query('timeframe') timeframe?: 'week' | 'month' | 'quarter',
  ) {
    return this.marketplaceIntegrationService.getJobMarketAnalytics({
      location,
      jobType,
      timeframe,
    });
  }

  @Get('recommended-products')
  async getRecommendedProducts(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceIntegrationService.getRecommendedProducts(
      req.user.id,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('recommended-jobs')
  async getRecommendedJobs(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceIntegrationService.getRecommendedJobs(
      req.user.id,
      limit ? parseInt(limit) : 10,
    );
  }
}