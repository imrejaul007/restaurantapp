import { PaymentService, PaymentRequest, RefundRequest } from './payment.service';
export declare class PaymentController {
    private readonly paymentService;
    private readonly logger;
    constructor(paymentService: PaymentService);
    processPayment(paymentRequest: PaymentRequest, req: any): Promise<{
        success: boolean;
        data: import("./payment.service").PaymentResult;
        message: string;
    }>;
    refundPayment(refundRequest: RefundRequest, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getPaymentMethods(req: any): Promise<{
        success: boolean;
        data: any[];
    }>;
    getPaymentHistory(req: any, page?: string, limit?: string, status?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    getPaymentDetails(paymentId: string, req: any): Promise<{
        success: boolean;
        data: any;
    }>;
    handleStripeWebhook(body: any, signature: string): Promise<{
        received: boolean;
    }>;
    handleRazorpayWebhook(body: any, signature: string): Promise<{
        received: boolean;
    }>;
    getWalletBalance(req: any): Promise<{
        success: boolean;
        data: {
            balance: number;
        };
    }>;
    addMoneyToWallet(body: {
        amount: number;
        paymentMethod: string;
    }, req: any): Promise<{
        success: boolean;
        data: import("./payment.service").PaymentResult;
        message: string;
    }>;
    getWalletTransactions(req: any, page?: string, limit?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    getPaymentDashboard(startDate?: string, endDate?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    getAllTransactions(page?: string, limit?: string, status?: string, gateway?: string): Promise<{
        success: boolean;
        data: any;
    }>;
}
