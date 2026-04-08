import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { VerificationService } from '../verification.service';

export const VERIFICATION_REQUIRED = 'verification_required';

export interface VerificationRequirement {
  minScore?: number;
  requireAadhaar?: boolean;
  requiredDocuments?: string[];
  allowPending?: boolean;
}

export const RequireVerification = (requirements: VerificationRequirement = {}) =>
  SetMetadata(VERIFICATION_REQUIRED, requirements);

@Injectable()
export class VerificationGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private verificationService: VerificationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirements = this.reflector.get<VerificationRequirement>(
      VERIFICATION_REQUIRED,
      context.getHandler(),
    );

    if (!requirements) {
      return true; // No verification required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Find employee record for this user
    const employee = await this.findEmployeeByUserId(user.id);

    if (!employee) {
      throw new ForbiddenException('Employee profile not found');
    }

    // Get verification status
    const verificationStatus = await this.verificationService.getEmployeeVerificationStatus(employee.id);

    // Check minimum score requirement
    if (requirements.minScore && verificationStatus.verificationScore < requirements.minScore) {
      throw new ForbiddenException(
        `Verification score must be at least ${requirements.minScore}%. Current score: ${verificationStatus.verificationScore}%`
      );
    }

    // Check Aadhaar verification requirement
    if (requirements.requireAadhaar && !verificationStatus.aadharVerified) {
      throw new ForbiddenException('Aadhaar verification required');
    }

    // Check required documents
    if (requirements.requiredDocuments?.length) {
      const verifiedDocTypes = verificationStatus.verifiedDocuments.map(doc => doc.type);
      const missingDocs = requirements.requiredDocuments.filter(
        docType => !verifiedDocTypes.includes(docType)
      );

      if (missingDocs.length > 0) {
        throw new ForbiddenException(
          `Missing required documents: ${missingDocs.join(', ')}`
        );
      }
    }

    // Check if full verification is required (unless pending is allowed)
    if (!requirements.allowPending && !verificationStatus.isFullyVerified) {
      throw new ForbiddenException('Complete profile verification required');
    }

    return true;
  }

  private async findEmployeeByUserId(userId: string) {
    // This would typically use PrismaService
    // For now, we'll simulate finding an employee
    return {
      id: 'emp_123',
      userId,
      restaurantId: 'rest_123'
    };
  }
}

// Common verification requirement presets
export const VerificationPresets = {
  // Basic verification for job applications
  JOB_APPLICATION: {
    minScore: 80,
    requireAadhaar: true,
    requiredDocuments: ['aadhar', 'pan', 'photo'],
    allowPending: false
  },

  // Moderate verification for accessing sensitive features
  SENSITIVE_ACCESS: {
    minScore: 60,
    requireAadhaar: true,
    requiredDocuments: ['aadhar'],
    allowPending: true
  },

  // Basic verification for profile completion
  PROFILE_COMPLETION: {
    minScore: 40,
    requireAadhaar: false,
    requiredDocuments: ['photo'],
    allowPending: true
  },

  // Full verification for admin access
  ADMIN_ACCESS: {
    minScore: 100,
    requireAadhaar: true,
    requiredDocuments: ['aadhar', 'pan', 'photo', 'address_proof'],
    allowPending: false
  }
};