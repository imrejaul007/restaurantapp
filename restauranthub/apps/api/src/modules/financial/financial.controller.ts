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
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { FinancialService, CreateInvoiceDto, CreatePaymentDto, CreateExpenseDto, CreateBudgetDto } from './financial.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { IsDateString, IsOptional, IsString, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    restaurant?: { id: string };
  };
}

export class CreateInvoiceRequestDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  gstRate?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class InvoiceItemDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(0)
  taxRate: number;
}

export class CreatePaymentRequestDto {
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  paymentGateway?: string;

  @IsOptional()
  @IsString()
  gatewayTransactionId?: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;
}

export class CreateExpenseRequestDto {
  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class CreateBudgetRequestDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetCategoryDto)
  categories: BudgetCategoryDto[];
}

export class BudgetCategoryDto {
  @IsString()
  categoryId: string;

  @IsNumber()
  @Min(0)
  allocatedAmount: number;
}

@ApiTags('financial')
@Controller('financial')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
@ApiBearerAuth()
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  private getRestaurantId(req: AuthenticatedRequest): string {
    if (req.user.role === 'RESTAURANT' && req.user.restaurant?.id) {
      return req.user.restaurant.id;
    }
    throw new BadRequestException('Restaurant access required');
  }

  @Post('invoices')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid invoice data' })
  async createInvoice(
    @Req() req: AuthenticatedRequest,
    @Body() createInvoiceDto: CreateInvoiceRequestDto
  ) {
    const restaurantId = this.getRestaurantId(req);
    const invoiceData: CreateInvoiceDto = {
      ...createInvoiceDto,
      dueDate: createInvoiceDto.dueDate ? new Date(createInvoiceDto.dueDate) : undefined,
    };
    return this.financialService.createInvoice(restaurantId, invoiceData);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get restaurant invoices' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by invoice status' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getInvoices(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20'
  ) {
    const restaurantId = this.getRestaurantId(req);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const where: any = { restaurantId };
    if (status) {
      where.status = status;
    }

    // This would typically use the PrismaService directly in a simpler implementation
    // For now, we'll return a placeholder response
    return {
      invoices: [],
      total: 0,
      page: pageNum,
      limit: limitNum,
      totalPages: 0,
    };
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoice(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    const restaurantId = this.getRestaurantId(req);
    // This would fetch from the database with restaurantId verification
    return { message: `Get invoice ${id} for restaurant ${restaurantId}` };
  }

  @Post('payments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Process a payment' })
  @ApiResponse({ status: 201, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  async processPayment(
    @Req() req: AuthenticatedRequest,
    @Body() createPaymentDto: CreatePaymentRequestDto
  ) {
    const restaurantId = this.getRestaurantId(req);
    return this.financialService.processPayment(restaurantId, createPaymentDto);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get restaurant payments' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getPayments(
    @Req() req: AuthenticatedRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20'
  ) {
    const restaurantId = this.getRestaurantId(req);
    return {
      payments: [],
      total: 0,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  }

  @Post('expenses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new expense' })
  @ApiResponse({ status: 201, description: 'Expense created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid expense data' })
  async createExpense(
    @Req() req: AuthenticatedRequest,
    @Body() createExpenseDto: CreateExpenseRequestDto
  ) {
    const restaurantId = this.getRestaurantId(req);
    return this.financialService.createExpense(restaurantId, createExpenseDto);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'Get restaurant expenses' })
  @ApiResponse({ status: 200, description: 'Expenses retrieved successfully' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getExpenses(
    @Req() req: AuthenticatedRequest,
    @Query('categoryId') categoryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20'
  ) {
    const restaurantId = this.getRestaurantId(req);
    return {
      expenses: [],
      total: 0,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  }

  @Post('budgets')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiResponse({ status: 201, description: 'Budget created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid budget data' })
  async createBudget(
    @Req() req: AuthenticatedRequest,
    @Body() createBudgetDto: CreateBudgetRequestDto
  ) {
    const restaurantId = this.getRestaurantId(req);
    const budgetData: CreateBudgetDto = {
      ...createBudgetDto,
      startDate: new Date(createBudgetDto.startDate),
      endDate: new Date(createBudgetDto.endDate),
    };
    return this.financialService.createBudget(restaurantId, budgetData);
  }

  @Get('budgets')
  @ApiOperation({ summary: 'Get restaurant budgets' })
  @ApiResponse({ status: 200, description: 'Budgets retrieved successfully' })
  @ApiQuery({ name: 'active', required: false, description: 'Filter active budgets only' })
  async getBudgets(
    @Req() req: AuthenticatedRequest,
    @Query('active') active?: string
  ) {
    const restaurantId = this.getRestaurantId(req);
    return {
      budgets: [],
      total: 0,
    };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get financial dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getFinancialDashboard(@Req() req: AuthenticatedRequest) {
    const restaurantId = this.getRestaurantId(req);
    return this.financialService.getFinancialDashboard(restaurantId);
  }

  @Post('reports/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate financial report' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid date range' })
  async generateFinancialReport(
    @Req() req: AuthenticatedRequest,
    @Body() reportParams: { startDate: string; endDate: string }
  ) {
    const restaurantId = this.getRestaurantId(req);
    const startDate = new Date(reportParams.startDate);
    const endDate = new Date(reportParams.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    return this.financialService.generateFinancialReport(restaurantId, startDate, endDate);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get generated financial reports' })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getFinancialReports(
    @Req() req: AuthenticatedRequest,
    @Query('page') page = '1',
    @Query('limit') limit = '10'
  ) {
    const restaurantId = this.getRestaurantId(req);
    return {
      reports: [],
      total: 0,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Get chart of accounts' })
  @ApiResponse({ status: 200, description: 'Chart of accounts retrieved successfully' })
  async getChartOfAccounts(@Req() req: AuthenticatedRequest) {
    const restaurantId = this.getRestaurantId(req);
    return {
      accounts: [],
      total: 0,
    };
  }

  @Post('accounts/initialize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initialize default chart of accounts' })
  @ApiResponse({ status: 200, description: 'Chart of accounts initialized successfully' })
  async initializeChartOfAccounts(@Req() req: AuthenticatedRequest) {
    const restaurantId = this.getRestaurantId(req);
    await this.financialService.initializeChartOfAccounts(restaurantId);
    return { message: 'Chart of accounts initialized successfully' };
  }

  @Get('tax/gst-report')
  @ApiOperation({ summary: 'Generate GST compliance report' })
  @ApiResponse({ status: 200, description: 'GST report generated successfully' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Report start date' })
  @ApiQuery({ name: 'endDate', required: true, description: 'Report end date' })
  async generateGSTReport(
    @Req() req: AuthenticatedRequest,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    const restaurantId = this.getRestaurantId(req);

    if (!startDate || !endDate) {
      throw new BadRequestException('Start date and end date are required');
    }

    return {
      period: { startDate, endDate },
      gstCollected: 0,
      gstPaid: 0,
      netGstLiability: 0,
      transactions: [],
    };
  }

  @Get('analytics/profit-loss')
  @ApiOperation({ summary: 'Get profit and loss analytics' })
  @ApiResponse({ status: 200, description: 'P&L analytics retrieved successfully' })
  @ApiQuery({ name: 'period', required: false, description: 'Analysis period (month, quarter, year)' })
  async getProfitLossAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query('period') period = 'month'
  ) {
    const restaurantId = this.getRestaurantId(req);
    return {
      period,
      revenue: {
        total: 0,
        growth: 0,
        breakdown: {},
      },
      expenses: {
        total: 0,
        growth: 0,
        breakdown: {},
      },
      profit: {
        gross: 0,
        net: 0,
        margin: 0,
      },
    };
  }

  @Get('analytics/cash-flow')
  @ApiOperation({ summary: 'Get cash flow analytics' })
  @ApiResponse({ status: 200, description: 'Cash flow analytics retrieved successfully' })
  @ApiQuery({ name: 'months', required: false, description: 'Number of months to analyze' })
  async getCashFlowAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query('months') months = '12'
  ) {
    const restaurantId = this.getRestaurantId(req);
    return {
      period: `${months} months`,
      cashFlow: {
        operating: [],
        investing: [],
        financing: [],
      },
      projections: [],
    };
  }
}