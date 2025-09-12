import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(createOrderDto: CreateOrderDto, req: any): Promise<any>;
    findAll(query: OrderQueryDto, req: any): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getStats(req: any): Promise<{
        totalOrders: any;
        pendingOrders: any;
        confirmedOrders: any;
        preparingOrders: any;
        readyOrders: any;
        dispatchedOrders: any;
        deliveredOrders: any;
        cancelledOrders: any;
        totalRevenue: any;
        processingOrders: any;
    }>;
    findOne(id: string, req: any): Promise<any>;
    update(id: string, updateOrderDto: UpdateOrderDto, req: any): Promise<any>;
    cancel(id: string, reason: string, req: any): Promise<any>;
}
