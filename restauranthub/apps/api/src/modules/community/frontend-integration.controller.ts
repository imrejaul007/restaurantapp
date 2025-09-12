import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FrontendIntegrationService } from './frontend-integration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('frontend-integration')
@Controller('community/integration')
export class FrontendIntegrationController {
  constructor(private readonly frontendIntegrationService: FrontendIntegrationService) {}

  @Get('api-docs')
  @ApiOperation({ summary: 'Get comprehensive API documentation for frontend integration' })
  getApiDocumentation() {
    return this.frontendIntegrationService.formatResponse(
      this.frontendIntegrationService.getApiDocumentation(),
      'API documentation retrieved successfully'
    );
  }

  @Get('form-mappings')
  @ApiOperation({ summary: 'Get form field mappings for frontend forms' })
  getFormFieldMappings() {
    return this.frontendIntegrationService.formatResponse(
      this.frontendIntegrationService.getFormFieldMappings(),
      'Form mappings retrieved successfully'
    );
  }

  @Get('error-codes')
  @ApiOperation({ summary: 'Get comprehensive error code mappings' })
  getErrorCodeMappings() {
    return this.frontendIntegrationService.formatResponse(
      this.frontendIntegrationService.getErrorCodeMappings(),
      'Error codes retrieved successfully'
    );
  }

  @Get('checklist')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get frontend integration checklist (Admin only)' })
  getIntegrationChecklist() {
    return this.frontendIntegrationService.formatResponse(
      this.frontendIntegrationService.getFrontendIntegrationChecklist(),
      'Integration checklist retrieved successfully'
    );
  }

  @Get('typescript-interfaces')
  @ApiOperation({ summary: 'Get TypeScript interfaces for frontend development' })
  getTypeScriptInterfaces() {
    return this.frontendIntegrationService.formatResponse(
      {
        interfaces: this.frontendIntegrationService.generateTypeScriptInterfaces(),
        usage: 'Copy these interfaces to your frontend TypeScript project',
      },
      'TypeScript interfaces generated successfully'
    );
  }
}