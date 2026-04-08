'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Shield,
  FileText,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  Settings,
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VerificationBadge, VerificationStatus } from '@/components/verification/verification-badge';
import { DocumentUpload } from '@/components/verification/document-upload';
import { AadhaarVerification } from '@/components/verification/aadhaar-verification';
import { verificationService } from '@/lib/api/verification';
import { cn } from '@/lib/utils';

interface EmployeeProfile {
  id: string;
  employeeCode: string;
  designation: string;
  department?: string;
  joiningDate: string;
  isActive: boolean;
  user: {
    id: string;
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
      phone?: string;
      avatar?: string;
      dateOfBirth?: string;
      address?: string;
    };
  };
  restaurant: {
    id: string;
    name: string;
    location: string;
  };
}

// Mock data - in real app this would come from API
const mockProfile: EmployeeProfile = {
  id: 'emp_123',
  employeeCode: 'EMP001',
  designation: 'Senior Chef',
  department: 'Kitchen',
  joiningDate: '2023-01-15',
  isActive: true,
  user: {
    id: 'user_123',
    email: 'john.doe@email.com',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+91 98765 43210',
      dateOfBirth: '1990-05-15',
      address: 'Mumbai, Maharashtra'
    }
  },
  restaurant: {
    id: 'rest_123',
    name: 'The Grand Restaurant',
    location: 'Mumbai, India'
  }
};

export default function EmployeeProfilePage() {
  const [profile] = useState<EmployeeProfile>(mockProfile);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [aadhaarStatus, setAadhaarStatus] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadVerificationData();
  }, []);

  const loadVerificationData = async () => {
    try {
      setIsLoading(true);

      // Load verification status, Aadhaar status, and documents
      const [verStatus, aadhaarStat, docs] = await Promise.all([
        verificationService.getEmployeeVerificationStatus(profile.id),
        verificationService.getAadhaarVerificationStatus(),
        verificationService.getEmployeeDocuments(profile.id)
      ]);

      setVerificationStatus(verStatus);
      setAadhaarStatus(aadhaarStat);
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load verification data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUpload = async (file: File, documentType: string) => {
    try {
      setIsUploading(true);

      // Upload file and get URL
      const fileUrl = await verificationService.uploadFile(file, documentType);

      // Create document record
      await verificationService.uploadDocument({
        type: documentType,
        name: file.name,
        url: fileUrl,
        employeeId: profile.id
      });

      // Reload data
      await loadVerificationData();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await verificationService.deleteDocument(documentId);
      await loadVerificationData();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleAadhaarVerification = async (data: any) => {
    try {
      await verificationService.initiateAadhaarVerification(data);
      await loadVerificationData();
    } catch (error) {
      console.error('Aadhaar verification failed:', error);
    }
  };

  const getVerificationAlert = () => {
    if (!verificationStatus) return null;

    if (verificationStatus.isFullyVerified) {
      return (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Profile Fully Verified</p>
                <p className="text-sm text-green-600">
                  You can now apply for jobs and access all platform features.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-orange-800">Verification Required</p>
              <p className="text-sm text-orange-600 mb-2">
                Complete your profile verification to unlock job applications.
              </p>
              <div className="text-xs text-orange-600">
                <p>Missing requirements:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {!verificationStatus.aadharVerified && (
                    <li>Aadhaar verification</li>
                  )}
                  {verificationStatus.requiredDocuments
                    .filter((docType: string) =>
                      !verificationStatus.verifiedDocuments.some((doc: any) => doc.type === docType)
                    )
                    .map((docType: string) => (
                      <li key={docType}>
                        {docType.charAt(0).toUpperCase() + docType.slice(1).replace('_', ' ')} document
                      </li>
                    ))
                  }
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-96 bg-muted rounded-lg"></div>
              <div className="lg:col-span-2 h-96 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Employee Profile</h1>
            <p className="text-muted-foreground">
              Manage your profile and verification status
            </p>
          </div>
          <Button variant="outline">
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        {/* Verification Alert */}
        {getVerificationAlert()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Profile Overview */}
          <div className="space-y-6">
            {/* Basic Info Card */}
            <Card>
              <CardHeader className="text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {profile.user.profile?.firstName} {profile.user.profile?.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">{profile.designation}</p>
                    <Badge variant="secondary" className="mt-2">
                      {profile.employeeCode}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.user.email}</span>
                </div>
                {profile.user.profile?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.user.profile.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.restaurant.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.restaurant.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Joined {new Date(profile.joiningDate).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Verification Status Card */}
            {verificationStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Verification Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VerificationStatus
                    verificationScore={verificationStatus.verificationScore}
                    aadharVerified={verificationStatus.aadharVerified}
                    aadhaarStatus={verificationStatus.aadhaarStatus}
                    requiredDocuments={verificationStatus.requiredDocuments}
                    verifiedDocuments={verificationStatus.verifiedDocuments}
                    isFullyVerified={verificationStatus.isFullyVerified}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="verification" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="verification">Verification</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="verification" className="space-y-6">
                {/* Aadhaar Verification */}
                <AadhaarVerification
                  currentStatus={aadhaarStatus}
                  onInitiateVerification={handleAadhaarVerification}
                  isLoading={isUploading}
                />

                {/* Document Upload */}
                <DocumentUpload
                  documents={documents}
                  onUpload={handleDocumentUpload}
                  onDelete={handleDeleteDocument}
                  isUploading={isUploading}
                />
              </TabsContent>

              <TabsContent value="documents" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>All Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {documents.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No documents uploaded yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 border border-border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{doc.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {doc.type.replace('_', ' ')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <VerificationBadge status={doc.verificationStatus} size="sm" />
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Profile Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Profile settings will be available here.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}