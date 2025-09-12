import { DatabaseService } from '../database/database.service';
import { WebsocketService } from '../websocket/websocket.service';
declare enum EmployeeTagType {
    POSITIVE = "POSITIVE",
    NEGATIVE = "NEGATIVE",
    WARNING = "WARNING"
}
declare enum TagStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare class EmployeeDefenseService {
    private readonly databaseService;
    private readonly websocketService;
    private readonly logger;
    constructor(databaseService: DatabaseService, websocketService: WebsocketService);
    createEmployeeTag(userId: string, data: {
        employeeId: string;
        type: EmployeeTagType;
        category: string;
        reason: string;
        details?: string;
        evidence?: string[];
        severity?: number;
        isPublic?: boolean;
    }): Promise<{
        id: string;
        employeeId: string;
        restaurantId: string;
        taggedBy: string;
        type: EmployeeTagType;
        category: string;
        reason: string;
        details: string | undefined;
        evidence: string[];
        severity: number;
        isPublic: boolean;
        status: TagStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getEmployeeTags(employeeId: string): Promise<{
        tags: never[];
        total: number;
    }>;
    updateEmployeeTag(tagId: string, updateData: any): Promise<void>;
    deleteEmployeeTag(tagId: string): Promise<void>;
    createEmployeeDefense(userId: string, data: any): Promise<{
        id: string;
        message: string;
    }>;
    getEmploymentHistory(employeeId: string): Promise<{
        history: never[];
        total: number;
    }>;
}
export {};
