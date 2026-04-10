import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommunityService } from './community.service';

@Controller('community')
export class CommunityController {
  private readonly logger = new Logger(CommunityController.name);

  constructor(private readonly communityService: CommunityService) {}

  @Get('posts')
  async listPosts(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communityService.listPosts({
      search,
      category,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPost(
    @Request() req: any,
    @Body() body: { title: string; content: string; category?: string; tags?: string[] },
  ) {
    this.logger.log(`User ${req.user.id} creating post`);
    return this.communityService.createPost(req.user.id, body);
  }

  @Post('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async toggleLike(@Param('id') id: string, @Request() req: any) {
    return this.communityService.toggleLike(id, req.user.id);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') id: string, @Request() req: any) {
    this.logger.log(`User ${req.user.id} deleting post ${id}`);
    await this.communityService.deletePost(id, req.user.id);
  }
}
