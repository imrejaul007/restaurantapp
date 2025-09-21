import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceStatus, PaymentStatus, AccountType } from '@prisma/client';

export interface CreateInvoiceDto {
  customerId?: string;
  orderId?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }[];
  dueDate?: Date;
  gstRate?: number;
  notes?: string;
}

export interface CreatePaymentDto {
  invoiceId?: string;
  orderId?: string;
  amount: number;
  paymentMethod: string;
  paymentGateway?: string;
  gatewayTransactionId?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface CreateExpenseDto {
  categoryId: string;
  vendorId?: string;
  amount: number;
  description: string;
  receiptUrl?: string;
  taxAmount?: number;
  tags?: string[];
}

export interface CreateBudgetDto {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  categories: {
    categoryId: string;
    allocatedAmount: number;
  }[];
}

@Injectable()
export class FinancialService {
  private readonly logger = new Logger(FinancialService.name);

  constructor(private prisma: PrismaService) {}

  async createInvoice(restaurantId: string, data: CreateInvoiceDto) {
    try {
      const invoiceNumber = await this.generateInvoiceNumber(restaurantId);

      const subtotal = data.items.reduce((sum, item) =>
        sum + (item.quantity * item.unitPrice), 0
      );

      const totalTax = data.items.reduce((sum, item) =>
        sum + (item.quantity * item.unitPrice * item.taxRate / 100), 0
      );

      const gstAmount = data.gstRate ? (subtotal * data.gstRate / 100) : 0;
      const total = subtotal + totalTax + gstAmount;

      const invoice = await this.prisma.invoice.create({
        data: {
          restaurantId,
          customerId: data.customerId,
          orderId: data.orderId,
          invoiceNumber,
          subtotal,
          taxAmount: totalTax,
          gstAmount,
          total,
          status: InvoiceStatus.DRAFT,
          dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          items: {
            create: data.items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate,
              totalPrice: item.quantity * item.unitPrice * (1 + item.taxRate / 100),
            }))
          },
          notes: data.notes,
        },
        include: {
          items: true,
          customer: true,
          order: true,
        }
      });

      await this.createJournalEntry(
        restaurantId,
        `Invoice ${invoiceNumber} created`,
        [
          { accountCode: '1200', debit: total }, // Accounts Receivable
          { accountCode: '4000', credit: subtotal }, // Revenue
          { accountCode: '2200', credit: totalTax + gstAmount }, // Tax Payable
        ]
      );

      this.logger.log(`Invoice ${invoiceNumber} created for restaurant ${restaurantId}`);
      return invoice;
    } catch (error) {
      this.logger.error('Failed to create invoice:', error);
      throw new BadRequestException('Failed to create invoice');
    }
  }

  async processPayment(restaurantId: string, data: CreatePaymentDto) {
    try {
      const payment = await this.prisma.payment.create({
        data: {
          restaurantId,
          invoiceId: data.invoiceId,
          orderId: data.orderId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          paymentGateway: data.paymentGateway,
          gatewayTransactionId: data.gatewayTransactionId,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          status: PaymentStatus.COMPLETED,
          processedAt: new Date(),
        },
        include: {
          invoice: true,
          order: true,
        }
      });

      if (data.invoiceId) {
        await this.updateInvoicePaymentStatus(data.invoiceId);
      }

      await this.createJournalEntry(
        restaurantId,
        `Payment received: ${data.gatewayTransactionId || 'Cash'}`,
        [
          { accountCode: '1000', debit: data.amount }, // Cash/Bank
          { accountCode: '1200', credit: data.amount }, // Accounts Receivable
        ]
      );

      this.logger.log(`Payment processed: ${payment.id} for restaurant ${restaurantId}`);
      return payment;
    } catch (error) {
      this.logger.error('Failed to process payment:', error);
      throw new BadRequestException('Failed to process payment');
    }
  }

  async createExpense(restaurantId: string, data: CreateExpenseDto) {
    try {
      const expense = await this.prisma.expense.create({
        data: {
          restaurantId,
          categoryId: data.categoryId,
          vendorId: data.vendorId,
          amount: data.amount,
          description: data.description,
          receiptUrl: data.receiptUrl,
          taxAmount: data.taxAmount || 0,
          tags: data.tags || [],
        },
        include: {
          category: true,
          vendor: true,
        }
      });

      await this.createJournalEntry(
        restaurantId,
        `Expense: ${data.description}`,
        [
          { accountCode: '5000', debit: data.amount }, // Operating Expenses
          { accountCode: '1000', credit: data.amount }, // Cash/Bank
        ]
      );

      this.logger.log(`Expense created: ${expense.id} for restaurant ${restaurantId}`);
      return expense;
    } catch (error) {
      this.logger.error('Failed to create expense:', error);
      throw new BadRequestException('Failed to create expense');
    }
  }

  async createBudget(restaurantId: string, data: CreateBudgetDto) {
    try {
      const budget = await this.prisma.budget.create({
        data: {
          restaurantId,
          name: data.name,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
          totalAmount: data.totalAmount,
          categories: {
            create: data.categories.map(cat => ({
              categoryId: cat.categoryId,
              allocatedAmount: cat.allocatedAmount,
              spentAmount: 0,
            }))
          }
        },
        include: {
          categories: {
            include: {
              category: true,
            }
          }
        }
      });

      this.logger.log(`Budget created: ${budget.id} for restaurant ${restaurantId}`);
      return budget;
    } catch (error) {
      this.logger.error('Failed to create budget:', error);
      throw new BadRequestException('Failed to create budget');
    }
  }

  async getFinancialDashboard(restaurantId: string) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        totalRevenue,
        totalExpenses,
        pendingInvoices,
        recentPayments,
        monthlyRevenue,
        monthlyExpenses,
        outstandingAmount,
        taxLiability
      ] = await Promise.all([
        this.prisma.payment.aggregate({
          where: {
            restaurantId,
            status: PaymentStatus.COMPLETED,
          },
          _sum: { amount: true }
        }),

        this.prisma.expense.aggregate({
          where: { restaurantId },
          _sum: { amount: true }
        }),

        this.prisma.invoice.count({
          where: {
            restaurantId,
            status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE] }
          }
        }),

        this.prisma.payment.findMany({
          where: {
            restaurantId,
            createdAt: { gte: thirtyDaysAgo }
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { invoice: true }
        }),

        this.prisma.payment.aggregate({
          where: {
            restaurantId,
            status: PaymentStatus.COMPLETED,
            createdAt: { gte: thirtyDaysAgo }
          },
          _sum: { amount: true }
        }),

        this.prisma.expense.aggregate({
          where: {
            restaurantId,
            createdAt: { gte: thirtyDaysAgo }
          },
          _sum: { amount: true }
        }),

        this.prisma.invoice.aggregate({
          where: {
            restaurantId,
            status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE] }
          },
          _sum: { total: true }
        }),

        this.prisma.invoice.aggregate({
          where: { restaurantId },
          _sum: { gstAmount: true }
        })
      ]);

      return {
        totalRevenue: totalRevenue._sum.amount || 0,
        totalExpenses: totalExpenses._sum.amount || 0,
        netProfit: (totalRevenue._sum.amount || 0) - (totalExpenses._sum.amount || 0),
        pendingInvoicesCount: pendingInvoices,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        monthlyExpenses: monthlyExpenses._sum.amount || 0,
        monthlyProfit: (monthlyRevenue._sum.amount || 0) - (monthlyExpenses._sum.amount || 0),
        outstandingAmount: outstandingAmount._sum.total || 0,
        taxLiability: taxLiability._sum.gstAmount || 0,
        recentPayments,
      };
    } catch (error) {
      this.logger.error('Failed to get financial dashboard:', error);
      throw new BadRequestException('Failed to load financial dashboard');
    }
  }

  async generateFinancialReport(restaurantId: string, startDate: Date, endDate: Date) {
    try {
      const [revenue, expenses, invoices, payments] = await Promise.all([
        this.prisma.payment.aggregate({
          where: {
            restaurantId,
            status: PaymentStatus.COMPLETED,
            createdAt: { gte: startDate, lte: endDate }
          },
          _sum: { amount: true },
          _count: true
        }),

        this.prisma.expense.findMany({
          where: {
            restaurantId,
            createdAt: { gte: startDate, lte: endDate }
          },
          include: { category: true },
          orderBy: { createdAt: 'desc' }
        }),

        this.prisma.invoice.findMany({
          where: {
            restaurantId,
            createdAt: { gte: startDate, lte: endDate }
          },
          include: { customer: true, items: true }
        }),

        this.prisma.payment.findMany({
          where: {
            restaurantId,
            createdAt: { gte: startDate, lte: endDate }
          },
          include: { invoice: true }
        })
      ]);

      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalRevenue = revenue._sum.amount || 0;
      const netProfit = totalRevenue - totalExpenses;

      const expensesByCategory = expenses.reduce((acc, expense) => {
        const categoryName = expense.category.name;
        acc[categoryName] = (acc[categoryName] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);

      const report = await this.prisma.financialReport.create({
        data: {
          restaurantId,
          startDate,
          endDate,
          totalRevenue,
          totalExpenses,
          netProfit,
          reportData: {
            revenue: { total: totalRevenue, count: revenue._count },
            expenses: { total: totalExpenses, byCategory: expensesByCategory },
            invoices: invoices.length,
            payments: payments.length,
            profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
          }
        }
      });

      return { report, invoices, expenses, payments };
    } catch (error) {
      this.logger.error('Failed to generate financial report:', error);
      throw new BadRequestException('Failed to generate financial report');
    }
  }

  private async generateInvoiceNumber(restaurantId: string): Promise<string> {
    const currentYear = new Date().getFullYear();
    const count = await this.prisma.invoice.count({
      where: {
        restaurantId,
        createdAt: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1)
        }
      }
    });

    return `INV-${currentYear}-${String(count + 1).padStart(6, '0')}`;
  }

  private async updateInvoicePaymentStatus(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true }
    });

    if (!invoice) return;

    const totalPaid = invoice.payments
      .filter(p => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + p.amount, 0);

    let status = invoice.status;
    if (totalPaid >= invoice.total) {
      status = InvoiceStatus.PAID;
    } else if (totalPaid > 0) {
      status = InvoiceStatus.VIEWED; // Partially paid
    }

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status, paidAt: status === InvoiceStatus.PAID ? new Date() : null }
    });
  }

  private async createJournalEntry(
    restaurantId: string,
    description: string,
    entries: { accountCode: string; debit?: number; credit?: number }[]
  ) {
    try {
      const totalDebits = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
      const totalCredits = entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error('Journal entry debits and credits must be equal');
      }

      const journalEntry = await this.prisma.journalEntry.create({
        data: {
          restaurantId,
          description,
          totalAmount: totalDebits,
          entries: {
            create: await Promise.all(entries.map(async (entry) => {
              const account = await this.prisma.account.findFirst({
                where: { restaurantId, code: entry.accountCode }
              });

              if (!account) {
                throw new Error(`Account with code ${entry.accountCode} not found`);
              }

              return {
                accountId: account.id,
                debitAmount: entry.debit || 0,
                creditAmount: entry.credit || 0,
              };
            }))
          }
        }
      });

      return journalEntry;
    } catch (error) {
      this.logger.error('Failed to create journal entry:', error);
      throw error;
    }
  }

  async initializeChartOfAccounts(restaurantId: string) {
    const defaultAccounts = [
      { code: '1000', name: 'Cash and Bank', type: AccountType.ASSET },
      { code: '1100', name: 'Inventory', type: AccountType.ASSET },
      { code: '1200', name: 'Accounts Receivable', type: AccountType.ASSET },
      { code: '1500', name: 'Equipment', type: AccountType.ASSET },
      { code: '2000', name: 'Accounts Payable', type: AccountType.LIABILITY },
      { code: '2100', name: 'Credit Card Payable', type: AccountType.LIABILITY },
      { code: '2200', name: 'Tax Payable', type: AccountType.LIABILITY },
      { code: '3000', name: 'Owner Equity', type: AccountType.EQUITY },
      { code: '4000', name: 'Food Sales Revenue', type: AccountType.REVENUE },
      { code: '4100', name: 'Beverage Sales Revenue', type: AccountType.REVENUE },
      { code: '5000', name: 'Cost of Goods Sold', type: AccountType.EXPENSE },
      { code: '5100', name: 'Labor Costs', type: AccountType.EXPENSE },
      { code: '5200', name: 'Rent Expense', type: AccountType.EXPENSE },
      { code: '5300', name: 'Utilities Expense', type: AccountType.EXPENSE },
      { code: '5400', name: 'Marketing Expense', type: AccountType.EXPENSE },
    ];

    const existingAccounts = await this.prisma.account.findMany({
      where: { restaurantId }
    });

    if (existingAccounts.length === 0) {
      await this.prisma.account.createMany({
        data: defaultAccounts.map(account => ({
          ...account,
          restaurantId,
          balance: 0,
        }))
      });

      this.logger.log(`Initialized chart of accounts for restaurant ${restaurantId}`);
    }
  }
}