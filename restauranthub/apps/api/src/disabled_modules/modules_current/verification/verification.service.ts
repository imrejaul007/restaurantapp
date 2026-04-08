import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VerificationStatus } from '@prisma/client';

export interface DocumentUploadDto {
  type: string;
  name: string;
  url: string;
  employeeId?: string;
  restaurantId?: string;
  vendorId?: string;
}

export interface AadhaarVerificationDto {
  aadhaarNumber: string;
  name: string;
  dateOfBirth?: string;
  address?: string;
  phone?: string;
}

@Injectable()
export class VerificationService {
  constructor(private prisma: PrismaService) {}

  // Document Management
  async uploadDocument(data: DocumentUploadDto) {
    const document = await this.prisma.document.create({
      data: {
        type: data.type,
        name: data.name,
        url: data.url,
        employeeId: data.employeeId,
        restaurantId: data.restaurantId,
        vendorId: data.vendorId,
        verificationStatus: VerificationStatus.PENDING,
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
          },
        },
      },
    });

    return document;
  }

  async getEmployeeDocuments(employeeId: string) {
    const documents = await this.prisma.document.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });

    return documents;
  }

  async verifyDocument(documentId: string, status: VerificationStatus, rejectionReason?: string, verifiedBy?: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        employee: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const updatedDocument = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        verificationStatus: status,
        verifiedAt: status === VerificationStatus.VERIFIED ? new Date() : null,
        verifiedBy,
        rejectionReason: status === VerificationStatus.REJECTED ? rejectionReason : null,
      },
    });

    // Update employee verification status if this is an Aadhaar document
    if (document.type === 'aadhar' && status === VerificationStatus.VERIFIED && document.employeeId) {
      await this.prisma.employee.update({
        where: { id: document.employeeId },
        data: {
          aadharVerified: true,
          verifiedAt: new Date(),
        },
      });
    }

    return updatedDocument;
  }

  // Aadhaar Verification
  async initiateAadhaarVerification(userId: string, data: AadhaarVerificationDto) {
    // Hash the Aadhaar number for security
    const aadhaarHash = this.hashAadhaar(data.aadhaarNumber);

    // Encrypt the full Aadhaar number (in real implementation, use proper encryption)
    const encryptedAadhaar = this.encryptAadhaar(data.aadhaarNumber);

    // Generate verification ID
    const verificationId = this.generateVerificationId();

    const verification = await this.prisma.aadhaarVerification.create({
      data: {
        userId,
        aadhaarHash,
        encryptedAadhaar,
        verificationId,
        status: VerificationStatus.PENDING,
        attempts: 1,
        lastAttemptAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // In a real implementation, this would call external Aadhaar verification API
    // For now, we'll simulate the verification process
    setTimeout(async () => {
      await this.processAadhaarVerification(verification.id, data);
    }, 5000); // Simulate 5-second processing

    return {
      verificationId: verification.verificationId,
      status: verification.status,
      message: 'Aadhaar verification initiated. Please wait for processing.',
    };
  }

  private async processAadhaarVerification(verificationId: string, data: AadhaarVerificationDto) {
    // Simulate verification logic
    const matchScore = Math.floor(Math.random() * 100) + 1;
    const nameMatch = Boolean(data.name && data.name.length > 3);
    const dobMatch = data.dateOfBirth ? Math.random() > 0.2 : null;
    const addressMatch = data.address ? Math.random() > 0.3 : null;
    const phoneMatch = data.phone ? Math.random() > 0.1 : null;

    const isVerified = matchScore >= 80 && nameMatch && (dobMatch !== false);

    await this.prisma.aadhaarVerification.update({
      where: { id: verificationId },
      data: {
        status: isVerified ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED,
        matchScore,
        nameMatch,
        dobMatch,
        addressMatch,
        phoneMatch,
        verifiedAt: isVerified ? new Date() : null,
      },
    });
  }

  async getAadhaarVerificationStatus(userId: string) {
    const verification = await this.prisma.aadhaarVerification.findUnique({
      where: { userId },
    });

    if (!verification) {
      return { status: 'NOT_INITIATED' };
    }

    return {
      status: verification.status,
      verificationId: verification.verificationId,
      matchScore: verification.matchScore,
      verifiedAt: verification.verifiedAt,
      attempts: verification.attempts,
    };
  }

  // Employee Verification Status
  async getEmployeeVerificationStatus(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: {
          include: {
            aadhaarVerification: true,
          },
        },
        documents: {
          where: {
            verificationStatus: VerificationStatus.VERIFIED,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const verifiedDocuments = employee.documents;
    const aadhaarVerification = employee.user.aadhaarVerification;

    const verificationScore = this.calculateVerificationScore(verifiedDocuments, aadhaarVerification);

    return {
      employeeId: employee.id,
      aadharVerified: employee.aadharVerified,
      verifiedAt: employee.verifiedAt,
      verificationScore,
      requiredDocuments: this.getRequiredDocuments(),
      verifiedDocuments: verifiedDocuments.map(doc => ({
        id: doc.id,
        type: doc.type,
        name: doc.name,
        verifiedAt: doc.verifiedAt,
      })),
      aadhaarStatus: aadhaarVerification?.status || 'NOT_INITIATED',
      isFullyVerified: this.isEmployeeFullyVerified(verifiedDocuments, aadhaarVerification),
    };
  }

  async getEmployeesRequiringVerification(restaurantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const employees = await this.prisma.employee.findMany({
      where: {
        restaurantId,
        OR: [
          { aadharVerified: false },
          {
            documents: {
              some: {
                verificationStatus: VerificationStatus.PENDING,
              },
            },
          },
        ],
      },
      include: {
        user: {
          include: {
            profile: true,
            aadhaarVerification: true,
          },
        },
        documents: {
          where: {
            verificationStatus: {
              in: [VerificationStatus.PENDING, VerificationStatus.REJECTED],
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.employee.count({
      where: {
        restaurantId,
        OR: [
          { aadharVerified: false },
          {
            documents: {
              some: {
                verificationStatus: VerificationStatus.PENDING,
              },
            },
          },
        ],
      },
    });

    return {
      employees: employees.map(emp => ({
        id: emp.id,
        employeeCode: emp.employeeCode,
        designation: emp.designation,
        user: emp.user,
        aadharVerified: emp.aadharVerified,
        pendingDocuments: emp.documents.length,
        aadhaarStatus: emp.user.aadhaarVerification?.status || 'NOT_INITIATED',
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Helper Methods
  private hashAadhaar(aadhaarNumber: string): string {
    // In production, use a proper hashing algorithm like bcrypt
    return Buffer.from(aadhaarNumber).toString('base64');
  }

  private encryptAadhaar(aadhaarNumber: string): string {
    // In production, use proper encryption like AES
    return Buffer.from(aadhaarNumber).toString('base64');
  }

  private generateVerificationId(): string {
    return 'VER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private calculateVerificationScore(documents: any[], aadhaarVerification: any): number {
    let score = 0;

    // Aadhaar verification (40 points)
    if (aadhaarVerification?.status === VerificationStatus.VERIFIED) {
      score += 40;
    }

    // Required documents (60 points total)
    const requiredTypes = ['pan', 'aadhar', 'photo'];
    const verifiedTypes = documents.map(doc => doc.type);

    requiredTypes.forEach(type => {
      if (verifiedTypes.includes(type)) {
        score += 20;
      }
    });

    return Math.min(score, 100);
  }

  private getRequiredDocuments(): string[] {
    return ['aadhar', 'pan', 'photo', 'address_proof'];
  }

  private isEmployeeFullyVerified(documents: any[], aadhaarVerification: any): boolean {
    const requiredTypes = ['aadhar', 'pan', 'photo'];
    const verifiedTypes = documents.map(doc => doc.type);

    const hasRequiredDocs = requiredTypes.every(type => verifiedTypes.includes(type));
    const hasAadhaarVerification = aadhaarVerification?.status === VerificationStatus.VERIFIED;

    return hasRequiredDocs && hasAadhaarVerification;
  }
}