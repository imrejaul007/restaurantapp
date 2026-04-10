import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

class ContactDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsString()
  @MinLength(1)
  subject!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsString()
  @MinLength(1)
  message!: string;
}

@Controller('support')
export class SupportController {
  private readonly logger = new Logger(SupportController.name);

  @Post('contact')
  @HttpCode(HttpStatus.OK)
  async contact(@Body() dto: ContactDto) {
    this.logger.log(
      `Contact form submission — from: ${dto.email}, subject: "${dto.subject}", category: ${dto.category ?? 'none'}`,
    );
    this.logger.log(
      `Message from ${dto.name} (${dto.company ?? 'no company'}): ${dto.message}`,
    );
    return { success: true, message: 'Your message has been received. We will get back to you within 24 hours.' };
  }
}
