import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsInt } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class ConsentDto {
  @IsInt()
  @IsIn([0, 1, 2])
  consentTier: 0 | 1 | 2;
}

@Controller('users')
export class ConsentController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('consent')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async updateConsent(
    @Request() req: { user: { id: string } },
    @Body() body: ConsentDto,
  ): Promise<{ consentTier: number }> {
    const { consentTier } = body;

    await this.prisma.user.update({
      where: { id: req.user.id },
      data: { consentTier },
    });

    return { consentTier };
  }

  /** GET /users/:id/rez-profile — used by useRezProfile hook in the web app */
  @Get(':id/rez-profile')
  @UseGuards(JwtAuthGuard)
  async getRezProfile(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        rezMerchantId: true,
        rezVerified: true,
        consentTier: true,
        profile: {
          select: {
            rezStoreId: true,
            city: true,
            firstName: true,
            lastName: true,
          },
        },
        courseCompletions: {
          select: { courseSlug: true, completedAt: true },
          orderBy: { completedAt: 'desc' },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      isRezVerified: user.rezVerified,
      rezMerchantId: user.rezMerchantId ?? null,
      rezStoreId: user.profile?.rezStoreId ?? null,
      consentTier: user.consentTier,
      city: user.profile?.city ?? null,
      rezStats: {
        coursesCompleted: user.courseCompletions.length,
        lastCourseAt: user.courseCompletions[0]?.completedAt ?? null,
      },
    };
  }
}
