import { PrismaService } from '../../prisma/prisma.service';
import { WebsocketService } from '../websocket/websocket.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
export declare class OrdersService {
    private prisma;
    private websocketService;
    constructor(prisma: PrismaService, websocketService: WebsocketService);
    create(createOrderDto: CreateOrderDto): Promise<any>;
    findAll(query: OrderQueryDto, userId?: string, userRole?: string, filterRestaurantId?: string, filterVendorId?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, userId?: string, userRole?: string): Promise<any>;
    update(id: string, updateOrderDto: UpdateOrderDto, userId?: string, userRole?: string): Promise<any>;
    cancel(id: string, reason: string, userId?: string, userRole?: string): Promise<any>;
    getOrderStats(userId?: string, userRole?: string, restaurantId?: string, vendorId?: string): Promise<{
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
    private canUpdateStatus;
}
