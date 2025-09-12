import { OrderStatus, PaymentStatus } from '@prisma/client';
export declare class UpdateOrderDto {
    status?: OrderStatus;
    paymentMethod?: string;
    paymentStatus?: PaymentStatus;
    paymentId?: string;
    customerNotes?: string;
    kitchenNotes?: string;
    preparationTime?: number;
    deliveryDuration?: number;
}
