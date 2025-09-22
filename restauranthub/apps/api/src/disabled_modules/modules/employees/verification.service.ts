import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VerificationService {
  constructor(private prisma: PrismaService) {}

  async verifyAadhar(aadharNumber: string): Promise<{ isValid: boolean; data?: any }> {
    // Mock Aadhaar verification - replace with actual UIDAI API integration
    const isValid = this.validateAadharFormat(aadharNumber);
    
    if (!isValid) {
      return { isValid: false };
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock response data
    const mockData = {
      name: 'John Doe',
      gender: 'M',
      dateOfBirth: '01-01-1990',
      address: '123 Main St, City, State, PIN',
    };

    return {
      isValid: true,
      data: mockData,
    };
  }

  async verifyPAN(panNumber: string): Promise<{ isValid: boolean; data?: any }> {
    const isValid = this.validatePANFormat(panNumber);
    
    if (!isValid) {
      return { isValid: false };
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockData = {
      name: 'John Doe',
      category: 'Individual',
      status: 'Valid',
    };

    return {
      isValid: true,
      data: mockData,
    };
  }

  async createVerificationRequest(employeeId: string, documentType: string, documentData: any) {
    // TODO: Document model not implemented yet
    // const document = await this.prisma.document.create({
    //   data: {
    //     employeeId,
    //     type: documentType,
    //     name: `${documentType} Verification`,
    //     url: documentData.url || '',
    //     verificationStatus: 'PENDING',
    //   },
    // });

    // return document;
    return { id: 'temp', employeeId, type: documentType, verificationStatus: 'PENDING' }; // placeholder
  }

  async updateVerificationStatus(documentId: string, status: 'VERIFIED' | 'REJECTED', notes?: string) {
    // TODO: Document and Employee models not implemented yet
    // const document = await this.prisma.document.update({
    //   where: { id: documentId },
    //   data: {
    //     verificationStatus: status,
    //     verifiedAt: status === 'VERIFIED' ? new Date() : null,
    //     rejectionReason: status === 'REJECTED' ? notes : null,
    //   },
    // });

    // Update employee verification status if Aadhaar is verified
    // if (document.type === 'aadhar' && status === 'VERIFIED') {
    //   await this.prisma.employee.update({
    //     where: { id: document.employeeId },
    //     data: {
    //       aadharVerified: true,
    //       verifiedAt: new Date(),
    //     },
    //   });
    // }

    // return document;
    return { id: documentId, verificationStatus: status }; // placeholder
  }

  private validateAadharFormat(aadhar: string): boolean {
    // Aadhaar should be 12 digits
    const pattern = /^\d{12}$/;
    return pattern.test(aadhar);
  }

  private validatePANFormat(pan: string): boolean {
    // PAN format: 5 letters, 4 digits, 1 letter
    const pattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return pattern.test(pan);
  }

  async getVerificationStats() {
    // TODO: Document model not implemented yet
    // const [pendingCount, verifiedCount, rejectedCount] = await Promise.all([
    //   this.prisma.document.count({
    //     where: { verificationStatus: 'PENDING' },
    //   }),
    //   this.prisma.document.count({
    //     where: { verificationStatus: 'VERIFIED' },
    //   }),
    //   this.prisma.document.count({
    //     where: { verificationStatus: 'REJECTED' },
    //   }),
    // ]);
    const [pendingCount, verifiedCount, rejectedCount] = [0, 0, 0]; // placeholder

    return {
      pending: pendingCount,
      verified: verifiedCount,
      rejected: rejectedCount,
      total: pendingCount + verifiedCount + rejectedCount,
    };
  }
}