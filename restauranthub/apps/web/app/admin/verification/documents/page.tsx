'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { 
  DocumentTextIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon,
  PhotoIcon,
  CalendarIcon,
  UserIcon,
  BuildingStorefrontIcon,
  ArrowDownTrayIcon,
  FolderIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

interface Document {
  id: string;
  fileName: string;
  originalName: string;
  type: 'GST' | 'FSSAI' | 'PAN' | 'BUSINESS_LICENSE' | 'IDENTITY_PROOF' | 'ADDRESS_PROOF';
  restaurantId: string;
  restaurantName: string;
  ownerName: string;
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  tags: string[];
  metadata: {
    expiryDate?: string;
    issueDate?: string;
    issuingAuthority?: string;
    documentNumber?: string;
  };
}

// Mock documents data
const mockDocuments: Document[] = [
  {
    id: 'DOC-001',
    fileName: 'gst-certificate-001.pdf',
    originalName: 'GST Certificate - Spice Garden.pdf',
    type: 'GST',
    restaurantId: 'REST-001',
    restaurantName: 'Spice Garden Restaurant',
    ownerName: 'Arjun Patel',
    fileUrl: '/documents/gst-certificate-001.pdf',
    thumbnailUrl: '/thumbnails/gst-certificate-001.jpg',
    fileSize: 2048576,
    mimeType: 'application/pdf',
    uploadedAt: '2024-01-20T09:15:00Z',
    status: 'PENDING',
    tags: ['verification', 'tax-document'],
    metadata: {
      expiryDate: '2025-12-31',
      issueDate: '2024-01-01',
      issuingAuthority: 'GST Department',
      documentNumber: 'GST123456789',
    },
  },
  {
    id: 'DOC-002',
    fileName: 'fssai-license-002.pdf',
    originalName: 'FSSAI License - Pizza Palace.pdf',
    type: 'FSSAI',
    restaurantId: 'REST-002',
    restaurantName: 'Pizza Palace',
    ownerName: 'Marco Rossi',
    fileUrl: '/documents/fssai-license-002.pdf',
    thumbnailUrl: '/thumbnails/fssai-license-002.jpg',
    fileSize: 1536000,
    mimeType: 'application/pdf',
    uploadedAt: '2024-01-19T14:30:00Z',
    status: 'APPROVED',
    verifiedBy: 'Admin (John Doe)',
    verifiedAt: '2024-01-20T10:45:00Z',
    tags: ['verification', 'food-safety'],
    metadata: {
      expiryDate: '2026-03-15',
      issueDate: '2023-03-15',
      issuingAuthority: 'FSSAI',
      documentNumber: 'FSSAI987654321',
    },
  },
  {
    id: 'DOC-003',
    fileName: 'pan-card-003.jpg',
    originalName: 'PAN Card - Sarah Wilson.jpg',
    type: 'PAN',
    restaurantId: 'REST-003',
    restaurantName: 'Burger Junction',
    ownerName: 'Sarah Wilson',
    fileUrl: '/documents/pan-card-003.jpg',
    thumbnailUrl: '/thumbnails/pan-card-003.jpg',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    uploadedAt: '2024-01-18T16:20:00Z',
    status: 'REJECTED',
    verifiedBy: 'Admin (Jane Smith)',
    verifiedAt: '2024-01-19T11:30:00Z',
    rejectionReason: 'Image quality is too poor to read details clearly. Please upload a clearer image.',
    tags: ['verification', 'identity'],
    metadata: {
      issuingAuthority: 'Income Tax Department',
      documentNumber: 'ABCDE1234F',
    },
  },
  {
    id: 'DOC-004',
    fileName: 'business-license-004.pdf',
    originalName: 'Business License - Sushi Zen.pdf',
    type: 'BUSINESS_LICENSE',
    restaurantId: 'REST-004',
    restaurantName: 'Sushi Zen',
    ownerName: 'Takeshi Yamamoto',
    fileUrl: '/documents/business-license-004.pdf',
    fileSize: 2560000,
    mimeType: 'application/pdf',
    uploadedAt: '2024-01-17T12:10:00Z',
    status: 'REJECTED',
    verifiedBy: 'Admin (Jane Smith)',
    verifiedAt: '2024-01-18T15:20:00Z',
    rejectionReason: 'License has expired. Please upload a valid current business license.',
    tags: ['verification', 'business'],
    metadata: {
      expiryDate: '2023-12-31',
      issueDate: '2020-01-01',
      issuingAuthority: 'Municipal Corporation',
      documentNumber: 'BL789012345',
    },
  },
  {
    id: 'DOC-005',
    fileName: 'address-proof-005.pdf',
    originalName: 'Electricity Bill - Spice Garden.pdf',
    type: 'ADDRESS_PROOF',
    restaurantId: 'REST-001',
    restaurantName: 'Spice Garden Restaurant',
    ownerName: 'Arjun Patel',
    fileUrl: '/documents/address-proof-005.pdf',
    fileSize: 1200000,
    mimeType: 'application/pdf',
    uploadedAt: '2024-01-16T08:45:00Z',
    status: 'APPROVED',
    verifiedBy: 'Admin (John Doe)',
    verifiedAt: '2024-01-17T09:15:00Z',
    tags: ['verification', 'address'],
    metadata: {
      issueDate: '2024-01-01',
      issuingAuthority: 'State Electricity Board',
    },
  },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>(mockDocuments);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [documentsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    let filtered = documents;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.metadata.documentNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter) {
      filtered = filtered.filter(doc => doc.type === typeFilter);
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    // Date filter
    if (dateFilter) {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(doc => new Date(doc.uploadedAt) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(doc => new Date(doc.uploadedAt) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(doc => new Date(doc.uploadedAt) >= filterDate);
          break;
      }
    }

    setFilteredDocuments(filtered);
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter, dateFilter, documents]);

  // Pagination
  const indexOfLastDocument = currentPage * documentsPerPage;
  const indexOfFirstDocument = indexOfLastDocument - documentsPerPage;
  const currentDocuments = filteredDocuments.slice(indexOfFirstDocument, indexOfLastDocument);
  const totalPages = Math.ceil(filteredDocuments.length / documentsPerPage);

  const handleDocumentAction = async (documentId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { 
              ...doc, 
              status: action === 'approve' ? 'APPROVED' : 'REJECTED',
              rejectionReason: reason,
              verifiedBy: 'Admin (Current User)',
              verifiedAt: new Date().toISOString(),
            }
          : doc
      ));
      
      toast.success(`Document ${action}d successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} document`);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'download') => {
    if (selectedDocuments.length === 0) {
      toast.error('Please select documents first');
      return;
    }

    try {
      if (action === 'download') {
        toast.success(`Downloading ${selectedDocuments.length} documents...`);
      } else {
        setDocuments(prev => prev.map(doc => 
          selectedDocuments.includes(doc.id) 
            ? { 
                ...doc, 
                status: action === 'approve' ? 'APPROVED' : 'REJECTED',
                verifiedBy: 'Admin (Current User)',
                verifiedAt: new Date().toISOString(),
              }
            : doc
        ));
        
        toast.success(`${selectedDocuments.length} documents ${action}d successfully`);
      }
      
      setSelectedDocuments([]);
    } catch (error) {
      toast.error(`Failed to ${action} documents`);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'PENDING': return 'yellow';
      default: return 'gray';
    }
  };

  const getDocumentIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return PhotoIcon;
    } else if (mimeType === 'application/pdf') {
      return DocumentTextIcon;
    } else {
      return DocumentDuplicateIcon;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === 'PENDING').length,
    approved: documents.filter(d => d.status === 'APPROVED').length,
    rejected: documents.filter(d => d.status === 'REJECTED').length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Viewer</h1>
          <p className="text-gray-600 mt-1">Review and manage verification documents</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button
            variant="outline"
            
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <FolderIcon className="w-4 h-4 mr-2" />
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </Button>
          <Button variant="outline" >
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search documents by name, restaurant, owner, or document number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value)}
              >
                <option value="">All Types</option>
                <option value="GST">GST Certificate</option>
                <option value="FSSAI">FSSAI License</option>
                <option value="PAN">PAN Card</option>
                <option value="BUSINESS_LICENSE">Business License</option>
                <option value="IDENTITY_PROOF">Identity Proof</option>
                <option value="ADDRESS_PROOF">Address Proof</option>
              </Select>
              
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </Select>
              
              <Select
                value={dateFilter}
                onValueChange={(value) => setDateFilter(value)}
              >
                <option value="">All Dates</option>
                <option value="today">Today</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedDocuments.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm text-blue-800">
                {selectedDocuments.length} document(s) selected
              </span>
              <div className="flex space-x-2">
                <Button
                  
                  onClick={() => handleBulkAction('approve')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Approve All
                </Button>
                <Button
                  
                  onClick={() => handleBulkAction('reject')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Reject All
                </Button>
                <Button
                  
                  variant="outline"
                  onClick={() => handleBulkAction('download')}
                >
                  Download All
                </Button>
                <Button
                  
                  variant="outline"
                  onClick={() => setSelectedDocuments([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Documents */}
      <Card>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
            {currentDocuments.map((document) => {
              const IconComponent = getDocumentIcon(document.mimeType);
              return (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(document.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDocuments([...selectedDocuments, document.id]);
                        } else {
                          setSelectedDocuments(selectedDocuments.filter(id => id !== document.id));
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <Badge color={getStatusBadgeColor(document.status)} >
                      {document.status}
                    </Badge>
                  </div>
                  
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-8 h-8 text-gray-500" />
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm truncate">{document.type}</h4>
                    <p className="text-xs text-gray-600 truncate">{document.originalName}</p>
                  </div>
                  
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center">
                      <BuildingStorefrontIcon className="w-4 h-4 mr-1" />
                      <span className="truncate">{document.restaurantName}</span>
                    </div>
                    <div className="flex items-center">
                      <UserIcon className="w-4 h-4 mr-1" />
                      <span className="truncate">{document.ownerName}</span>
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      <span>{format(parseISO(document.uploadedAt), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center">
                      <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                      <span>{formatFileSize(document.fileSize)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-4 pt-3 border-t border-gray-100">
                    <Button variant="outline" >
                      <EyeIcon className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    
                    {document.status === 'PENDING' && (
                      <div className="flex space-x-1">
                        <Button
                          
                          onClick={() => handleDocumentAction(document.id, 'approve')}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                        >
                          <CheckCircleIcon className="w-3 h-3" />
                        </Button>
                        <Button
                          
                          onClick={() => handleDocumentAction(document.id, 'reject', 'Rejected by admin')}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1"
                        >
                          <XCircleIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {document.status === 'REJECTED' && document.rejectionReason && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                      {document.rejectionReason}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.length === currentDocuments.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDocuments(currentDocuments.map(d => d.id));
                        } else {
                          setSelectedDocuments([]);
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restaurant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Upload Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentDocuments.map((document) => {
                  const IconComponent = getDocumentIcon(document.mimeType);
                  return (
                    <tr key={document.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedDocuments.includes(document.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDocuments([...selectedDocuments, document.id]);
                            } else {
                              setSelectedDocuments(selectedDocuments.filter(id => id !== document.id));
                            }
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <IconComponent className="h-5 w-5 text-gray-500" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{document.type}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{document.originalName}</div>
                            <div className="text-xs text-gray-400">{formatFileSize(document.fileSize)}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{document.restaurantName}</div>
                        <div className="text-sm text-gray-500">{document.ownerName}</div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge color={getStatusBadgeColor(document.status)}>
                          {document.status}
                        </Badge>
                        {document.verifiedBy && (
                          <div className="text-xs text-gray-500 mt-1">
                            by {document.verifiedBy}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(parseISO(document.uploadedAt), 'MMM dd, yyyy HH:mm')}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button variant="outline" >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" >
                            <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                          
                          {document.status === 'PENDING' && (
                            <div className="flex space-x-1">
                              <Button
                                
                                onClick={() => handleDocumentAction(document.id, 'approve')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircleIcon className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                
                                onClick={() => handleDocumentAction(document.id, 'reject', 'Rejected by admin')}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                <XCircleIcon className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstDocument + 1} to {Math.min(indexOfLastDocument, filteredDocuments.length)} of {filteredDocuments.length} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}