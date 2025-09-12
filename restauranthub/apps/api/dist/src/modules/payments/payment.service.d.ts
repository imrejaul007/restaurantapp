import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';
export declare const PaymentMethod: {
    readonly CASH: "CASH";
    readonly CARD: "CARD";
    readonly UPI: "UPI";
    readonly WALLET: "WALLET";
    readonly RAZORPAY: "RAZORPAY";
};
export type PaymentMethodType = typeof PaymentMethod[keyof typeof PaymentMethod];
export interface PaymentRequest {
    amount: number;
    currency: string;
    method: PaymentMethodType;
    customerId: string;
    orderId?: string;
    subscriptionId?: string;
    description?: string;
    metadata?: Record<string, any>;
}
export interface PaymentResult {
    paymentId: string;
    status: PaymentStatus;
    gatewayPaymentId?: string;
    gatewayOrderId?: string;
    clientSecret?: string;
    paymentUrl?: string;
    qrCode?: string;
}
export interface RefundRequest {
    paymentId: string;
    amount?: number;
    reason?: string;
}
export interface WebhookData {
    gatewayType: 'stripe' | 'razorpay';
    eventType: string;
    data: any;
    signature: string;
}
export declare class PaymentService {
    private prisma;
    private configService;
    private readonly logger;
    private stripe;
    private razorpay;
    constructor(prisma: PrismaService, configService: ConfigService);
    processPayment(paymentRequest: PaymentRequest): Promise<PaymentResult>;
    private processCardPayment;
    private processUPIPayment;
    private processNetBankingPayment;
    private processWalletPayment;
    private processCashPayment;
    refundPayment(refundRequest: RefundRequest): Promise<void>;
    handleWebhook(webhookData: WebhookData): Promise<void>;
    private verifyStripeWebhook;
    private verifyRazorpayWebhook;
    private handleStripeWebhook;
    private handleRazorpayWebhook;
    private handleStripePaymentSucceeded;
    private handleStripePaymentFailed;
    private handleRazorpayPaymentCaptured;
    private refundStripePayment;
    private refundRazorpayPayment;
    private refundToWallet;
    getWalletBalance(userId: string): Promise<number>;
    private deductFromWallet;
    private addToWallet;
    private updateOrderPaymentStatus;
    private getPreferredGateway;
    getPaymentMethods(userId: string): Promise<any[]>;
    private handleStripeSubscriptionPayment;
    private handleRazorpayPaymentFailed;
    getPaymentHistory(userId: string, page?: number, limit?: number, status?: string): Promise<any>;
    getPaymentDetails(paymentId: string, userId: string): Promise<any>;
    addMoneyToWallet(userId: string, amount: number, paymentMethod: string): Promise<PaymentResult>;
    getWalletTransactions(userId: string, page?: number, limit?: number): Promise<any>;
    getPaymentDashboard(startDate?: Date, endDate?: Date): Promise<any>;
    getAllTransactions(page?: number, limit?: number, filters?: {
        status?: string;
        gateway?: string;
    }): Promise<any>;
}
