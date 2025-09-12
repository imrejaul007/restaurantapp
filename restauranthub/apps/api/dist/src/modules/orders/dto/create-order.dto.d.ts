declare enum OrderType {
    DELIVERY = "DELIVERY",
    PICKUP = "PICKUP",
    DINE_IN = "DINE_IN"
}
export declare class OrderItemDto {
    menuItemId?: string;
    productId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    customizations?: any;
    specialInstructions?: string;
}
export declare class CreateOrderDto {
    restaurantId?: string;
    vendorId?: string;
    type: OrderType;
    items: OrderItemDto[];
    subtotal: number;
    taxAmount: number;
    deliveryFee: number;
    discountAmount: number;
    total: number;
    deliveryAddress?: any;
    customerNotes?: string;
    kitchenNotes?: string;
}
export {};
