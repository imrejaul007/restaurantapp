import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JobsService, CreateJobDto, UpdateJobDto, JobFilters } from './jobs.service';
import { ApplicationStatus, JobStatus } from '@prisma/client';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private jobsService: JobsService) {}

  // Job CRUD endpoints
  @Post()
  async createJob(@Body() data: CreateJobDto, @Request() req: any) {
    // Only restaurants can create jobs
    if (req.user.role !== 'RESTAURANT') {
      throw new BadRequestException('Only restaurants can create job postings');
    }

    return this.jobsService.createJob(req.user.restaurant.id, data);
  }

  @Get()
  async getJobs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: JobStatus,
    @Query('location') location?: string,
    @Query('salaryMin', new DefaultValuePipe(0), ParseIntPipe) salaryMin?: number,
    @Query('salaryMax') salaryMax?: string,
    @Query('experienceMin') experienceMin?: string,
    @Query('experienceMax') experienceMax?: string,
    @Query('skills') skills?: string,
    @Query('search') search?: string
  ) {
    const filters: JobFilters = {
      status,
      location,
      salaryMin,
      salaryMax: salaryMax ? parseInt(salaryMax) : undefined,
      experienceMin: experienceMin ? parseInt(experienceMin) : undefined,
      experienceMax: experienceMax ? parseInt(experienceMax) : undefined,
      skills: skills ? skills.split(',') : undefined,
      search
    };

    return this.jobsService.getJobs(filters, page, limit);
  }

  @Get('my-jobs')
  async getMyJobs(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
  ) {
    if (req.user.role !== 'RESTAURANT') {
      throw new BadRequestException('Only restaurants can view their job postings');
    }

    return this.jobsService.getRestaurantJobs(req.user.restaurant.id, page, limit);
  }

  @Get('my-applications')
  async getMyApplications(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
  ) {
    if (req.user.role !== 'EMPLOYEE') {
      throw new BadRequestException('Only employees can view their applications');
    }

    return this.jobsService.getMyApplications(req.user.employee.id, page, limit);
  }

  @Get(':id')
  async getJob(@Param('id') id: string) {
    return this.jobsService.getJob(id);
  }

  @Put(':id')
  async updateJob(
    @Param('id') id: string,
    @Body() data: UpdateJobDto,
    @Request() req: any
  ) {
    if (req.user.role !== 'RESTAURANT') {
      throw new BadRequestException('Only restaurants can update job postings');
    }

    return this.jobsService.updateJob(id, req.user.restaurant.id, data);
  }

  @Delete(':id')
  async deleteJob(@Param('id') id: string, @Request() req: any) {
    if (req.user.role !== 'RESTAURANT') {
      throw new BadRequestException('Only restaurants can delete job postings');
    }

    return this.jobsService.deleteJob(id, req.user.restaurant.id);
  }

  // Job Application endpoints
  @Post(':jobId/apply')
  @UseInterceptors(FileInterceptor('resume'))
  async applyToJob(
    @Param('jobId') jobId: string,
    @Body('coverLetter') coverLetter: string,
    @UploadedFile() resumeFile: Express.Multer.File,
    @Request() req: any
  ) {
    if (req.user.role !== 'EMPLOYEE') {
      throw new BadRequestException('Only employees can apply to jobs');
    }

    let resumePath: string | undefined;
    if (resumeFile) {
      resumePath = await this.jobsService.uploadResume(resumeFile);
    }

    return this.jobsService.applyToJob(
      jobId,
      req.user.employee.id,
      coverLetter,
      resumePath
    );
  }

  @Get(':jobId/applications')
  async getJobApplications(
    @Param('jobId') jobId: string,
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
  ) {
    if (req.user.role !== 'RESTAURANT') {
      throw new BadRequestException('Only restaurants can view job applications');
    }

    return this.jobsService.getJobApplications(
      jobId,
      req.user.restaurant.id,
      page,
      limit
    );
  }

  @Put('applications/:applicationId/status')
  async updateApplicationStatus(
    @Param('applicationId') applicationId: string,
    @Body('status') status: ApplicationStatus,
    @Body('reviewNotes') reviewNotes: string,
    @Request() req: any
  ) {
    if (req.user.role !== 'RESTAURANT') {
      throw new BadRequestException('Only restaurants can update application status');
    }

    return this.jobsService.updateApplicationStatus(
      applicationId,
      req.user.restaurant.id,
      status,
      reviewNotes
    );
  }

  // File Upload endpoints
  @Post('upload/resume')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const filePath = await this.jobsService.uploadResume(file);
    return {
      message: 'Resume uploaded successfully',
      filePath
    };
  }

  @Post('upload/attachment')
  @UseInterceptors(FileInterceptor('file'))
  async uploadJobAttachment(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const filePath = await this.jobsService.uploadJobAttachment(file);
    return {
      message: 'Attachment uploaded successfully',
      filePath
    };
  }

  // Utility endpoints
  @Get(':jobId/stats')
  async getJobStats(@Param('jobId') jobId: string, @Request() req: any) {
    if (req.user.role !== 'RESTAURANT') {
      throw new BadRequestException('Only restaurants can view job statistics');
    }

    // Get job with application statistics
    const job = await this.jobsService.getJob(jobId);

    // Verify job belongs to restaurant
    if (job.restaurant.id !== req.user.restaurant.id) {
      throw new BadRequestException('Job not found');
    }

    // Calculate application statistics
    const applicationStats = job.applications.reduce((stats, app) => {
      stats.total++;
      stats[app.status.toLowerCase()]++;
      return stats;
    }, {
      total: 0,
      pending: 0,
      reviewed: 0,
      shortlisted: 0,
      accepted: 0,
      rejected: 0
    });

    return {
      job: {
        id: job.id,
        title: job.title,
        status: job.status,
        viewCount: job.viewCount,
        applicationCount: job.applicationCount
      },
      applicationStats
    };
  }

  @Put(':jobId/status')
  async toggleJobStatus(
    @Param('jobId') jobId: string,
    @Body('status') status: JobStatus,
    @Request() req: any
  ) {
    if (req.user.role !== 'RESTAURANT') {
      throw new BadRequestException('Only restaurants can update job status');
    }

    return this.jobsService.updateJob(
      jobId,
      req.user.restaurant.id,
      { status }
    );
  }
}