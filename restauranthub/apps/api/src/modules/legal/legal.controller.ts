import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { LegalService } from './legal.service';

@ApiTags('legal')
@Controller('legal')
@Public()
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available legal documents' })
  @ApiResponse({ status: 200, description: 'Legal documents list retrieved' })
  getAllLegalDocuments() {
    return this.legalService.getAllLegalDocuments();
  }

  @Get('terms-of-service')
  @ApiOperation({ summary: 'Get Terms of Service' })
  @ApiResponse({ status: 200, description: 'Terms of Service retrieved' })
  getTermsOfService() {
    return this.legalService.getTermsOfService();
  }

  @Get('privacy-policy')
  @ApiOperation({ summary: 'Get Privacy Policy' })
  @ApiResponse({ status: 200, description: 'Privacy Policy retrieved' })
  getPrivacyPolicy() {
    return this.legalService.getPrivacyPolicy();
  }

  @Get('cookie-policy')
  @ApiOperation({ summary: 'Get Cookie Policy' })
  @ApiResponse({ status: 200, description: 'Cookie Policy retrieved' })
  getCookiePolicy() {
    return this.legalService.getCookiePolicy();
  }

  @Get('data-processing-agreement')
  @ApiOperation({ summary: 'Get Data Processing Agreement' })
  @ApiResponse({ status: 200, description: 'Data Processing Agreement retrieved' })
  getDataProcessingAgreement() {
    return this.legalService.getDataProcessingAgreement();
  }

  @Get(':documentId')
  @ApiOperation({ summary: 'Get specific legal document by ID' })
  @ApiResponse({ status: 200, description: 'Legal document retrieved' })
  @ApiResponse({ status: 404, description: 'Legal document not found' })
  @ApiParam({ 
    name: 'documentId', 
    description: 'Legal document identifier',
    enum: ['terms-of-service', 'privacy-policy', 'cookie-policy', 'data-processing-agreement']
  })
  getLegalDocument(@Param('documentId') documentId: string) {
    switch (documentId) {
      case 'terms-of-service':
        return this.legalService.getTermsOfService();
      case 'privacy-policy':
        return this.legalService.getPrivacyPolicy();
      case 'cookie-policy':
        return this.legalService.getCookiePolicy();
      case 'data-processing-agreement':
        return this.legalService.getDataProcessingAgreement();
      default:
        throw new NotFoundException('Legal document not found');
    }
  }
}