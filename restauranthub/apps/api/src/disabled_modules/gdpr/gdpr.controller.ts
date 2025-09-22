import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GdprService } from './gdpr.service';
import { DataExportService } from './services/data-export.service';
import { DataDeletionService } from './services/data-deletion.service';
import { ConsentService } from './services/consent.service';
import { DataProcessingService } from './services/data-processing.service';
import { ConsentDto } from './dto/consent.dto';
import { DataExportRequestDto } from './dto/data-export-request.dto';
import { DataDeletionRequestDto } from './dto/data-deletion-request.dto';
import { UserRole } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('gdpr')
@Controller('gdpr')
export class GdprController {
  constructor(
    private readonly gdprService: GdprService,
    private readonly dataExportService: DataExportService,
    private readonly dataDeletionService: DataDeletionService,
    private readonly consentService: ConsentService,
    private readonly dataProcessingService: DataProcessingService,
  ) {}

  // Consent Management
  @Post('consent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user consent preferences' })
  @ApiResponse({ status: 200, description: 'Consent preferences updated successfully' })
  async updateConsent(@Req() req: AuthenticatedRequest, @Body() consentDto: ConsentDto) {
    return this.consentService.updateConsent(req.user.id, consentDto);
  }

  @Get('consent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user consent preferences' })
  @ApiResponse({ status: 200, description: 'Consent preferences retrieved successfully' })
  async getConsent(@Req() req: AuthenticatedRequest) {
    return this.consentService.getConsent(req.user.id);
  }

  // Data Export (Right to Data Portability)
  @Post('data-export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request data export' })
  @ApiResponse({ status: 202, description: 'Data export request accepted' })
  async requestDataExport(
    @Req() req: AuthenticatedRequest,
    @Body() exportRequestDto: DataExportRequestDto,
  ) {
    return this.dataExportService.requestDataExport(req.user.id, exportRequestDto);
  }

  @Get('data-export/:requestId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check data export status' })
  @ApiResponse({ status: 200, description: 'Export status retrieved successfully' })
  async getExportStatus(@Req() req: AuthenticatedRequest, @Param('requestId') requestId: string) {
    return this.dataExportService.getExportStatus(req.user.id, requestId);
  }

  @Get('data-export/:requestId/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download exported data' })
  @ApiResponse({ status: 200, description: 'Data download link provided' })
  async downloadExportedData(
    @Req() req: AuthenticatedRequest,
    @Param('requestId') requestId: string,
  ) {
    return this.dataExportService.downloadExportedData(req.user.id, requestId);
  }

  // Data Deletion (Right to Erasure)
  @Post('data-deletion')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request data deletion' })
  @ApiResponse({ status: 202, description: 'Data deletion request accepted' })
  async requestDataDeletion(
    @Req() req: AuthenticatedRequest,
    @Body() deletionRequestDto: DataDeletionRequestDto,
  ) {
    return this.dataDeletionService.requestDataDeletion(req.user.id, deletionRequestDto);
  }

  @Get('data-deletion/:requestId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check data deletion status' })
  @ApiResponse({ status: 200, description: 'Deletion status retrieved successfully' })
  async getDeletionStatus(@Req() req: AuthenticatedRequest, @Param('requestId') requestId: string) {
    return this.dataDeletionService.getDeletionStatus(req.user.id, requestId);
  }

  // Data Processing Information (Right to Information)
  @Get('data-processing')
  @ApiOperation({ summary: 'Get data processing information' })
  @ApiResponse({ status: 200, description: 'Data processing information retrieved' })
  async getDataProcessingInfo() {
    return this.dataProcessingService.getDataProcessingInfo();
  }

  @Get('data-categories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user data categories' })
  @ApiResponse({ status: 200, description: 'Data categories retrieved successfully' })
  async getUserDataCategories(@Req() req: AuthenticatedRequest) {
    return this.dataProcessingService.getUserDataCategories(req.user.id);
  }

  // Right to Rectification
  @Post('data-correction')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request data correction' })
  @ApiResponse({ status: 200, description: 'Data correction request submitted' })
  async requestDataCorrection(
    @Req() req: AuthenticatedRequest,
    @Body() correctionData: any,
  ) {
    return this.gdprService.requestDataCorrection(req.user.id, correctionData);
  }

  // Right to Restrict Processing
  @Post('processing-restriction')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request processing restriction' })
  @ApiResponse({ status: 200, description: 'Processing restriction request submitted' })
  async requestProcessingRestriction(
    @Req() req: AuthenticatedRequest,
    @Body('reason') reason: string,
  ) {
    return this.gdprService.requestProcessingRestriction(req.user.id, reason);
  }

  // Right to Object
  @Post('object-processing')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Object to data processing' })
  @ApiResponse({ status: 200, description: 'Processing objection submitted' })
  async objectToProcessing(
    @Req() req: AuthenticatedRequest,
    @Body() objectionData: { processingType: string; reason: string },
  ) {
    return this.gdprService.objectToProcessing(req.user.id, objectionData);
  }

  // Data Subject Requests History
  @Get('requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user GDPR requests history' })
  @ApiResponse({ status: 200, description: 'GDPR requests retrieved successfully' })
  async getGdprRequests(@Req() req: AuthenticatedRequest) {
    return this.gdprService.getGdprRequests(req.user.id);
  }

  // Admin endpoints
  @Get('admin/requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all GDPR requests (Admin only)' })
  @ApiResponse({ status: 200, description: 'All GDPR requests retrieved' })
  async getAllGdprRequests(@Query() query: any) {
    return this.gdprService.getAllGdprRequests(query);
  }

  @Post('admin/process-request/:requestId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process GDPR request (Admin only)' })
  @ApiResponse({ status: 200, description: 'GDPR request processed' })
  async processGdprRequest(
    @Param('requestId') requestId: string,
    @Body() processingData: { action: string; notes?: string },
  ) {
    return this.gdprService.processGdprRequest(requestId, processingData);
  }

  // Privacy Notice
  @Get('privacy-notice')
  @ApiOperation({ summary: 'Get privacy notice' })
  @ApiResponse({ status: 200, description: 'Privacy notice retrieved' })
  async getPrivacyNotice() {
    return this.gdprService.getPrivacyNotice();
  }

  // Data Breach Notifications (Internal)
  @Post('admin/data-breach')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report data breach (Admin only)' })
  @ApiResponse({ status: 201, description: 'Data breach reported' })
  async reportDataBreach(
    @Body() breachData: {
      description: string;
      affectedUsers: string[];
      severity: 'low' | 'medium' | 'high' | 'critical';
      containedAt?: Date;
    },
  ) {
    return this.gdprService.reportDataBreach(breachData);
  }

  // Lawful Basis Management
  @Get('lawful-basis/:processingType')
  @ApiOperation({ summary: 'Get lawful basis for processing type' })
  @ApiResponse({ status: 200, description: 'Lawful basis information retrieved' })
  async getLawfulBasis(@Param('processingType') processingType: string) {
    return this.dataProcessingService.getLawfulBasis(processingType);
  }

  // Data Protection Impact Assessment (DPIA) results
  @Get('admin/dpia')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get DPIA results (Admin only)' })
  @ApiResponse({ status: 200, description: 'DPIA results retrieved' })
  async getDpiaResults() {
    return this.gdprService.getDpiaResults();
  }
}