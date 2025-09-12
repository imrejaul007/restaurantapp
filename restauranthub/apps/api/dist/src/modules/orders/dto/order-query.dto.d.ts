import { OrderStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
declare enum OrderType {
    DELIVERY = "DELIVERY",
    PICKUP = "PICKUP",
    DINE_IN = "DINE_IN"
}
export declare class OrderQueryDto extends PaginationDto {
    status?: OrderStatus;
    type?: OrderType;
    restaurantId?: string;
    vendorId?: string;
    startDate?: string;
    endDate?: string;
    sortOrder?: 'asc' | 'desc';
}
export {};
