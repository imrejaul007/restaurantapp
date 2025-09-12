import { PrismaService } from '../../prisma/prisma.service';
export declare class VerificationService {
    private prisma;
    constructor(prisma: PrismaService);
    verifyAadhar(aadharNumber: string): Promise<{
        isValid: boolean;
        data?: any;
    }>;
    verifyPAN(panNumber: string): Promise<{
        isValid: boolean;
        data?: any;
    }>;
    createVerificationRequest(employeeId: string, documentType: string, documentData: any): Promise<{
        id: string;
        employeeId: string;
        type: string;
        verificationStatus: string;
    }>;
    updateVerificationStatus(documentId: string, status: 'VERIFIED' | 'REJECTED', notes?: string): Promise<{
        id: string;
        verificationStatus: "VERIFIED" | "REJECTED";
    }>;
    private validateAadharFormat;
    private validatePANFormat;
    getVerificationStats(): Promise<{
        pending: number;
        verified: number;
        rejected: number;
        total: number;
    }>;
}
