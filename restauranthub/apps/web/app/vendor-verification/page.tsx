'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import VendorVerification from '@/components/verification/vendor-verification';
import { useAuth } from '@/lib/auth/auth-provider';

// Mock verification requests data
const mockVerificationRequests = [
  {
    id: '1',
    vendorId: 'vendor-1',
    requestDate: '2024-01-19T10:00:00Z',
    status: 'pending' as const,
    priority: 'high' as const,
    vendorInfo: {
      businessName: 'Fresh Valley Farms',
      contactPerson: 'Raj Kumar Sharma',
      email: 'raj@freshvalleyfarms.com',
      phone: '+91 98765 43210',
      businessType: 'Agricultural Supplier',
      gstNumber: 'GST123456789',
      panNumber: 'ABCDE1234F',
      address: {
        street: '123 Farm Road',
        city: 'Pune',
        state: 'Maharashtra',
        zipCode: '411001',
        country: 'India'
      },
      yearsInBusiness: 8,
      employeeCount: 25,
      annualRevenue: 5000000,
      description: 'We are a leading supplier of fresh organic vegetables and fruits, specializing in farm-to-table delivery. Our operations span across 500+ acres with sustainable farming practices.'
    },
    documents: [
      {
        id: '1',
        type: 'business_registration',
        name: 'Business Registration Certificate',
        status: 'verified',
        uploadDate: '2024-01-19T09:00:00Z',
        fileUrl: '/documents/business-reg.pdf',
        verifiedBy: 'admin-1',
        verifiedDate: '2024-01-19T11:30:00Z',
        notes: 'Document is clear and valid'
      },
      {
        id: '2',
        type: 'gst_certificate',
        name: 'GST Registration Certificate',
        status: 'verified',
        uploadDate: '2024-01-19T09:05:00Z',
        fileUrl: '/documents/gst-cert.pdf',
        verifiedBy: 'admin-1',
        verifiedDate: '2024-01-19T11:35:00Z',
        notes: 'GST number matches records'
      },
      {
        id: '3',
        type: 'fssai_license',
        name: 'FSSAI License',
        status: 'pending',
        uploadDate: '2024-01-19T09:10:00Z',
        fileUrl: '/documents/fssai-license.pdf',
        notes: 'Requires verification with FSSAI database'
      },
      {
        id: '4',
        type: 'bank_statement',
        name: 'Bank Statement (Last 6 months)',
        status: 'rejected',
        uploadDate: '2024-01-19T09:15:00Z',
        fileUrl: '/documents/bank-statement.pdf',
        rejectedDate: '2024-01-19T12:00:00Z',
        rejectedBy: 'admin-1',
        rejectionReason: 'Statement is older than 3 months',
        notes: 'Please upload recent bank statement'
      },
      {
        id: '5',
        type: 'insurance_certificate',
        name: 'Business Insurance Certificate',
        status: 'verified',
        uploadDate: '2024-01-19T09:20:00Z',
        fileUrl: '/documents/insurance-cert.pdf',
        verifiedBy: 'admin-1',
        verifiedDate: '2024-01-19T11:40:00Z',
        notes: 'Valid coverage amount'
      }
    ],
    verificationChecks: {
      businessRegistration: { status: 'passed', score: 95, details: 'Valid registration with MCA' },
      gstVerification: { status: 'passed', score: 90, details: 'Active GST registration' },
      bankVerification: { status: 'failed', score: 0, details: 'Bank statement needs update' },
      addressVerification: { status: 'passed', score: 85, details: 'Address verified via Google Maps' },
      phoneVerification: { status: 'passed', score: 100, details: 'Phone number verified via OTP' },
      emailVerification: { status: 'passed', score: 100, details: 'Email verified via link' },
      creditCheck: { status: 'pending', score: 0, details: 'Credit check in progress' },
      backgroundCheck: { status: 'passed', score: 80, details: 'No adverse records found' }
    },
    riskAssessment: {
      overallScore: 72,
      riskLevel: 'medium',
      factors: [
        { category: 'Financial', score: 60, impact: 'medium', details: 'Needs updated financial documents' },
        { category: 'Operational', score: 85, impact: 'low', details: 'Good operational history' },
        { category: 'Compliance', score: 90, impact: 'low', details: 'All required licenses present' },
        { category: 'Reputation', score: 75, impact: 'medium', details: 'Limited online reviews' }
      ]
    },
    timeline: [
      {
        id: '1',
        action: 'Application Submitted',
        timestamp: '2024-01-19T10:00:00Z',
        performedBy: 'vendor-1',
        details: 'Vendor submitted verification request'
      },
      {
        id: '2',
        action: 'Documents Uploaded',
        timestamp: '2024-01-19T10:30:00Z',
        performedBy: 'vendor-1',
        details: 'All required documents uploaded'
      },
      {
        id: '3',
        action: 'Initial Review Started',
        timestamp: '2024-01-19T11:00:00Z',
        performedBy: 'admin-1',
        details: 'Admin started document verification'
      },
      {
        id: '4',
        action: 'Documents Partially Verified',
        timestamp: '2024-01-19T12:00:00Z',
        performedBy: 'admin-1',
        details: '4 out of 5 documents verified'
      }
    ],
    assignedTo: 'admin-1',
    estimatedCompletion: '2024-01-22T18:00:00Z',
    internalNotes: [
      {
        id: '1',
        note: 'Vendor has good reputation in the market. Fast-track if bank statement is updated.',
        createdBy: 'admin-1',
        createdAt: '2024-01-19T11:45:00Z'
      }
    ]
  },
  {
    id: '2',
    vendorId: 'vendor-2',
    requestDate: '2024-01-18T14:00:00Z',
    status: 'in_review' as const,
    priority: 'medium' as const,
    vendorInfo: {
      businessName: 'Spice Masters Ltd',
      contactPerson: 'Priya Patel',
      email: 'priya@spicemasters.com',
      phone: '+91 98765 43211',
      businessType: 'Spice Manufacturer',
      gstNumber: 'GST987654321',
      panNumber: 'FGHIJ5678K',
      address: {
        street: '456 Spice Market',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India'
      },
      yearsInBusiness: 12,
      employeeCount: 50,
      annualRevenue: 8000000,
      description: 'Leading manufacturer and exporter of premium quality spices with certifications from major food safety authorities.'
    },
    documents: [
      {
        id: '6',
        type: 'business_registration',
        name: 'Business Registration Certificate',
        status: 'verified',
        uploadDate: '2024-01-18T14:00:00Z',
        fileUrl: '/documents/spice-business-reg.pdf',
        verifiedBy: 'admin-2',
        verifiedDate: '2024-01-18T16:00:00Z'
      },
      {
        id: '7',
        type: 'fssai_license',
        name: 'FSSAI Manufacturing License',
        status: 'verified',
        uploadDate: '2024-01-18T14:05:00Z',
        fileUrl: '/documents/spice-fssai.pdf',
        verifiedBy: 'admin-2',
        verifiedDate: '2024-01-18T16:30:00Z'
      }
    ],
    verificationChecks: {
      businessRegistration: { status: 'passed', score: 100, details: 'Valid MCA registration' },
      gstVerification: { status: 'passed', score: 95, details: 'Active GST with good filing history' },
      bankVerification: { status: 'passed', score: 90, details: 'Strong financial position' },
      addressVerification: { status: 'passed', score: 95, details: 'Verified business address' },
      phoneVerification: { status: 'passed', score: 100, details: 'Phone verified' },
      emailVerification: { status: 'passed', score: 100, details: 'Email verified' },
      creditCheck: { status: 'passed', score: 85, details: 'Good credit history' },
      backgroundCheck: { status: 'passed', score: 90, details: 'Clean background check' }
    },
    riskAssessment: {
      overallScore: 94,
      riskLevel: 'low',
      factors: [
        { category: 'Financial', score: 95, impact: 'low', details: 'Strong financial health' },
        { category: 'Operational', score: 90, impact: 'low', details: 'Excellent operational track record' },
        { category: 'Compliance', score: 98, impact: 'low', details: 'All certifications current' },
        { category: 'Reputation', score: 92, impact: 'low', details: 'Excellent market reputation' }
      ]
    },
    timeline: [
      {
        id: '5',
        action: 'Application Submitted',
        timestamp: '2024-01-18T14:00:00Z',
        performedBy: 'vendor-2',
        details: 'Complete application submitted'
      },
      {
        id: '6',
        action: 'Fast-track Review',
        timestamp: '2024-01-18T15:00:00Z',
        performedBy: 'admin-2',
        details: 'Qualified for fast-track processing'
      }
    ],
    assignedTo: 'admin-2',
    estimatedCompletion: '2024-01-20T18:00:00Z',
    internalNotes: [
      {
        id: '2',
        note: 'Excellent vendor. Recommend for immediate approval.',
        createdBy: 'admin-2',
        createdAt: '2024-01-18T17:00:00Z'
      }
    ]
  }
];

export default function VendorVerificationPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState(mockVerificationRequests);

  const handleApprove = (requestId: string, notes?: string) => {
    setRequests(prev => prev.map(request => 
      request.id === requestId 
        ? {
            ...request,
            status: 'approved' as const,
            timeline: [
              ...request.timeline,
              {
                id: Date.now().toString(),
                action: 'Application Approved',
                timestamp: new Date().toISOString(),
                performedBy: user?.id || 'current-admin',
                details: notes || 'Vendor application approved'
              }
            ]
          }
        : request
    ));
  };

  const handleReject = (requestId: string, reason: string) => {
    setRequests(prev => prev.map(request => 
      request.id === requestId 
        ? {
            ...request,
            status: 'rejected' as const,
            timeline: [
              ...request.timeline,
              {
                id: Date.now().toString(),
                action: 'Application Rejected',
                timestamp: new Date().toISOString(),
                performedBy: user?.id || 'current-admin',
                details: `Rejected: ${reason}`
              }
            ]
          }
        : request
    ));
  };

  const handleRequestMoreInfo = (requestId: string, requirements: string[]) => {
    setRequests(prev => prev.map(request => 
      request.id === requestId 
        ? {
            ...request,
            status: 'incomplete' as const,
            timeline: [
              ...request.timeline,
              {
                id: Date.now().toString(),
                action: 'More Information Requested',
                timestamp: new Date().toISOString(),
                performedBy: user?.id || 'current-admin',
                details: `Additional requirements: ${requirements.join(', ')}`
              }
            ]
          }
        : request
    ));
  };

  const handleAssignReviewer = (requestId: string, reviewerId: string) => {
    setRequests(prev => prev.map(request => 
      request.id === requestId 
        ? {
            ...request,
            assignedTo: reviewerId,
            timeline: [
              ...request.timeline,
              {
                id: Date.now().toString(),
                action: 'Reviewer Assigned',
                timestamp: new Date().toISOString(),
                performedBy: user?.id || 'current-admin',
                details: `Assigned to reviewer: ${reviewerId}`
              }
            ]
          }
        : request
    ));
  };

  // Only show for admin users
  if (user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Vendor Verification
          </h2>
          <p className="text-muted-foreground">
            This feature is only available for administrators.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <VendorVerification
        requests={requests}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestMoreInfo={handleRequestMoreInfo}
        onAssignReviewer={handleAssignReviewer}
      />
    </DashboardLayout>
  );
}