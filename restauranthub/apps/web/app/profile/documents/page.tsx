'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  Edit3,
  Plus,
  Calendar,
  File,
  Image,
  Award,
  Briefcase
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/ui/file-upload';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { toast } from '@/lib/toast';
import { formatDate, cn } from '@/lib/utils';

interface Document {
  id: string;
  name: string;
  type: 'resume' | 'cover_letter' | 'portfolio' | 'certificate';
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: Date;
  isDefault: boolean;
  url: string;
}

export default function ProfileDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<Document['type'] | null>(null);

  useEffect(() => {
    // Simulate API call to fetch user documents
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        // Mock data
        const mockDocuments: Document[] = [
          {
            id: '1',
            name: 'Senior Chef Resume 2024',
            type: 'resume',
            fileName: 'rahul-sharma-resume-2024.pdf',
            fileSize: 245760, // ~240KB
            fileType: 'application/pdf',
            uploadedAt: new Date('2024-01-15'),
            isDefault: true,
            url: '/documents/rahul-sharma-resume-2024.pdf'
          },
          {
            id: '2',
            name: 'Cover Letter Template',
            type: 'cover_letter',
            fileName: 'cover-letter-chef.pdf',
            fileSize: 128000, // ~125KB
            fileType: 'application/pdf',
            uploadedAt: new Date('2024-01-12'),
            isDefault: false,
            url: '/documents/cover-letter-chef.pdf'
          },
          {
            id: '3',
            name: 'Portfolio - Signature Dishes',
            type: 'portfolio',
            fileName: 'chef-portfolio-dishes.pdf',
            fileSize: 3200000, // ~3.2MB
            fileType: 'application/pdf',
            uploadedAt: new Date('2024-01-10'),
            isDefault: false,
            url: '/documents/chef-portfolio-dishes.pdf'
          },
          {
            id: '4',
            name: 'Food Safety Certificate',
            type: 'certificate',
            fileName: 'food-safety-cert-2023.jpg',
            fileSize: 890000, // ~890KB
            fileType: 'image/jpeg',
            uploadedAt: new Date('2023-12-20'),
            isDefault: false,
            url: '/documents/food-safety-cert-2023.jpg'
          },
          {
            id: '5',
            name: 'Culinary Arts Diploma',
            type: 'certificate',
            fileName: 'culinary-diploma.pdf',
            fileSize: 1240000, // ~1.24MB
            fileType: 'application/pdf',
            uploadedAt: new Date('2023-11-15'),
            isDefault: false,
            url: '/documents/culinary-diploma.pdf'
          }
        ];
        
        setDocuments(mockDocuments);
      } catch (error) {
        toast.error('Error', 'Failed to load documents.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string, documentType: Document['type']) => {
    if (documentType === 'resume') {
      return <Briefcase className="h-5 w-5 text-blue-500" />;
    } else if (documentType === 'certificate') {
      return <Award className="h-5 w-5 text-yellow-500" />;
    } else if (fileType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-green-500" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const getTypeColor = (type: Document['type']) => {
    switch (type) {
      case 'resume':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cover_letter':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'portfolio':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'certificate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleUploadComplete = (files: any[], type: Document['type']) => {
    // In a real app, this would be handled by the FileUpload component's onUploadComplete
    files.forEach((file, index) => {
      const newDocument: Document = {
        id: `new-${Date.now()}-${index}`,
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        type,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date(),
        isDefault: false,
        url: URL.createObjectURL(file)
      };
      
      setDocuments(prev => [newDocument, ...prev]);
    });
    
    setUploadingType(null);
    toast.success('Upload Complete', 'Documents uploaded successfully.');
  };

  const handleDelete = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    toast.success('Document Deleted', 'Document has been removed.');
  };

  const handleSetDefault = (documentId: string) => {
    setDocuments(prev => prev.map(doc => ({
      ...doc,
      isDefault: doc.type === 'resume' ? doc.id === documentId : doc.isDefault
    })));
    toast.success('Default Set', 'Document set as default.');
  };

  const documentTypes: { type: Document['type']; label: string; description: string }[] = [
    {
      type: 'resume',
      label: 'Resume/CV',
      description: 'Upload your latest resume or curriculum vitae'
    },
    {
      type: 'cover_letter',
      label: 'Cover Letters',
      description: 'Template cover letters for job applications'
    },
    {
      type: 'portfolio',
      label: 'Portfolio',
      description: 'Work samples, projects, and portfolio items'
    },
    {
      type: 'certificate',
      label: 'Certificates',
      description: 'Professional certificates and qualifications'
    }
  ];

  const getDocumentsByType = (type: Document['type']) => {
    return documents.filter(doc => doc.type === type);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Document Management</h1>
          <p className="text-muted-foreground">
            Manage your resumes, cover letters, portfolios, and certificates
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {documentTypes.map((docType) => {
            const count = getDocumentsByType(docType.type).length;
            return (
              <motion.div
                key={docType.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{docType.label}</p>
                        <p className="text-2xl font-bold">{count}</p>
                      </div>
                      {getFileIcon('application/pdf', docType.type)}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Document Sections */}
        <div className="space-y-8">
          {documentTypes.map((docType, index) => {
            const typeDocuments = getDocumentsByType(docType.type);
            
            return (
              <motion.div
                key={docType.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          {getFileIcon('application/pdf', docType.type)}
                          <span className="ml-2">{docType.label}</span>
                        </CardTitle>
                        <CardDescription>{docType.description}</CardDescription>
                      </div>
                      <Button
                        onClick={() => setUploadingType(docType.type)}
                        disabled={uploadingType !== null}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add {docType.label}
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Upload Area */}
                    {uploadingType === docType.type && (
                      <div className="border-2 border-dashed border-border rounded-lg p-4">
                        <FileUpload
                          accept={docType.type === 'certificate' ? '.pdf,.jpg,.jpeg,.png' : '.pdf,.doc,.docx'}
                          multiple={docType.type !== 'resume'}
                          maxFiles={docType.type === 'resume' ? 1 : 5}
                          maxSize={docType.type === 'portfolio' ? 20 : 10}
                          placeholder={`Upload your ${docType.label.toLowerCase()}`}
                          allowedTypes={
                            docType.type === 'certificate' 
                              ? ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
                              : ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
                          }
                          onFilesChange={(files) => {
                            if (files.length > 0) {
                              handleUploadComplete(files, docType.type);
                            }
                          }}
                        />
                        <div className="flex justify-end mt-4">
                          <Button
                            variant="outline"
                            onClick={() => setUploadingType(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Document List */}
                    {typeDocuments.length > 0 ? (
                      <div className="space-y-3">
                        {typeDocuments.map((document) => (
                          <div
                            key={document.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                              {getFileIcon(document.fileType, document.type)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium text-foreground truncate">
                                    {document.name}
                                  </h4>
                                  {document.isDefault && (
                                    <Badge variant="default" className="text-xs">
                                      Default
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span>{document.fileName}</span>
                                  <span>{formatFileSize(document.fileSize)}</span>
                                  <span className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {formatDate(document.uploadedAt.toISOString())}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                              {document.type === 'resume' && !document.isDefault && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSetDefault(document.id)}
                                >
                                  Set Default
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(document.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                          {getFileIcon('application/pdf', docType.type)}
                        </div>
                        <p>No {docType.label.toLowerCase()} uploaded yet</p>
                        <p className="text-sm">Click "Add {docType.label}" to upload your first document</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}