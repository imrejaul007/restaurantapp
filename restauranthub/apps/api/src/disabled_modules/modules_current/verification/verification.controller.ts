import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VerificationService, DocumentUploadDto, AadhaarVerificationDto } from './verification.service';
import { VerificationStatus } from '@prisma/client';

@Controller('verification')
@UseGuards(JwtAuthGuard)
export class VerificationController {
  constructor(private verificationService: VerificationService) {}

  // Document Management
  @Post('documents')
  async uploadDocument(@Request() req: any, @Body() documentData: DocumentUploadDto) {
    return this.verificationService.uploadDocument(documentData);
  }

  @Get('documents/employee/:employeeId')
  async getEmployeeDocuments(@Param('employeeId') employeeId: string) {
    return this.verificationService.getEmployeeDocuments(employeeId);
  }

  @Put('documents/:documentId/verify')
  async verifyDocument(
    @Param('documentId') documentId: string,
    @Body() data: { status: VerificationStatus; rejectionReason?: string },
    @Request() req: any,
  ) {
    const { status, rejectionReason } = data;

    if (!Object.values(VerificationStatus).includes(status)) {
      throw new BadRequestException('Invalid verification status');
    }

    return this.verificationService.verifyDocument(
      documentId,
      status,
      rejectionReason,
      req.user.id,
    );
  }

  // Aadhaar Verification
  @Post('aadhaar/initiate')
  async initiateAadhaarVerification(
    @Request() req: any,
    @Body() aadhaarData: AadhaarVerificationDto,
  ) {
    return this.verificationService.initiateAadhaarVerification(req.user.id, aadhaarData);
  }

  @Get('aadhaar/status')
  async getAadhaarVerificationStatus(@Request() req: any) {
    return this.verificationService.getAadhaarVerificationStatus(req.user.id);
  }

  // Employee Verification Status
  @Get('employee/:employeeId/status')
  async getEmployeeVerificationStatus(@Param('employeeId') employeeId: string) {
    return this.verificationService.getEmployeeVerificationStatus(employeeId);
  }

  @Get('employees/pending')
  async getEmployeesRequiringVerification(
    @Request() req: any,
    @Query('restaurantId') restaurantId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!restaurantId) {
      throw new BadRequestException('Restaurant ID is required');
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.verificationService.getEmployeesRequiringVerification(
      restaurantId,
      pageNum,
      limitNum,
    );
  }

  // Verification Dashboard
  @Get('dashboard/:restaurantId')
  async getVerificationDashboard(
    @Param('restaurantId') restaurantId: string,
    @Request() req: any,
  ) {
    // Get basic statistics
    const [pendingEmployees, verifiedEmployees, totalDocuments] = await Promise.all([
      this.verificationService.getEmployeesRequiringVerification(restaurantId, 1, 1),
      // Add method to get verified employees count
      this.getVerifiedEmployeesCount(restaurantId),
      this.getTotalDocumentsCount(restaurantId),
    ]);

    return {
      restaurantId,
      pendingVerifications: pendingEmployees.total,
      verifiedEmployees,
      totalDocuments,
      verificationRate: verifiedEmployees > 0
        ? Math.round((verifiedEmployees / (verifiedEmployees + pendingEmployees.total)) * 100)
        : 0,
    };
  }

  private async getVerifiedEmployeesCount(restaurantId: string): Promise<number> {
    // This would need to be implemented in the service
    return 0; // Placeholder
  }

  private async getTotalDocumentsCount(restaurantId: string): Promise<number> {
    // This would need to be implemented in the service
    return 0; // Placeholder
  }
}