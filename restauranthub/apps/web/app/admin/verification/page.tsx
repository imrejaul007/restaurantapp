'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/badge';
import { 
  DocumentIcon,
  IdentificationIcon,
  BuildingOfficeIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface VerificationRequest {
  id: string;
  applicantName: string;
  applicantType: 'RESTAURANT' | 'VENDOR' | 'EMPLOYEE' | 'INDIVIDUAL';
  email: string;
  phone: string;
  verificationType: 'IDENTITY' | 'BUSINESS' | 'DOCUMENT' | 'BACKGROUND';
  status: 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED' | 'REQUIRES_INFO';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  documents: {
    type: string;
    name: string;
    url: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
  }[];
  verificationData: {
    aadhaarNumber?: string;
    panNumber?: string;
    gstNumber?: string;
    businessName?: string;
    businessAddress?: string;
    licenseNumber?: string;
  };
  notes?: string;
  riskScore: number;
}

// Mock data for demonstration
const mockVerificationRequests: VerificationRequest[] = [
  {
    id: '1',
    applicantName: 'Spice Garden Restaurant',
    applicantType: 'RESTAURANT',
    email: 'owner@spicegarden.com',
    phone: '+91-9876543210',
    verificationType: 'BUSINESS',
    status: 'PENDING',
    priority: 'HIGH',
    submittedAt: '2024-01-20T10:30:00Z',
    documents: [
      {
        type: 'GST_CERTIFICATE',
        name: 'GST Certificate.pdf',
        url: '/documents/gst-cert.pdf',
        status: 'PENDING',
      },
      {
        type: 'FSSAI_LICENSE',
        name: 'FSSAI License.pdf',
        url: '/documents/fssai.pdf',
        status: 'PENDING',
      },
      {
        type: 'PAN_CARD',
        name: 'PAN Card.jpg',
        url: '/documents/pan.jpg',
        status: 'PENDING',
      },
    ],
    verificationData: {
      businessName: 'Spice Garden Restaurant Pvt Ltd',
      businessAddress: '123 Food Street, Delhi',
      gstNumber: '07AAACH7409R1ZW',
      panNumber: 'AAACH7409R',
      licenseNumber: 'FSSAI-12345678901234',
    },
    riskScore: 0.2,
  },
  {
    id: '2',
    applicantName: 'Fresh Foods Supply Co',
    applicantType: 'VENDOR',
    email: 'contact@freshfoods.com',
    phone: '+91-9876543211',
    verificationType: 'BUSINESS',
    status: 'IN_REVIEW',
    priority: 'MEDIUM',
    submittedAt: '2024-01-19T14:15:00Z',
    reviewedAt: '2024-01-20T09:00:00Z',
    reviewedBy: 'Admin User',
    documents: [
      {
        type: 'BUSINESS_REGISTRATION',
        name: 'Business Registration.pdf',
        url: '/documents/business-reg.pdf',
        status: 'APPROVED',
      },
      {
        type: 'GST_CERTIFICATE',
        name: 'GST Certificate.pdf',
        url: '/documents/gst-cert-vendor.pdf',
        status: 'PENDING',
      },
    ],
    verificationData: {
      businessName: 'Fresh Foods Supply Co Ltd',
      businessAddress: '456 Supply Chain Road, Mumbai',
      gstNumber: '27BBBFB1234L1ZX',
      panNumber: 'BBBFB1234L',
    },
    riskScore: 0.1,
  },
  {
    id: '3',
    applicantName: 'Rajesh Kumar',
    applicantType: 'EMPLOYEE',
    email: 'rajesh@example.com',
    phone: '+91-9876543212',
    verificationType: 'IDENTITY',
    status: 'REQUIRES_INFO',
    priority: 'LOW',
    submittedAt: '2024-01-18T16:45:00Z',
    reviewedAt: '2024-01-19T11:30:00Z',
    reviewedBy: 'Admin User',
    documents: [
      {
        type: 'AADHAAR_CARD',
        name: 'Aadhaar Card.jpg',
        url: '/documents/aadhaar.jpg',
        status: 'REJECTED',
        rejectionReason: 'Image quality too low, please resubmit with clear image',
      },
      {
        type: 'EMPLOYMENT_LETTER',
        name: 'Previous Employment.pdf',
        url: '/documents/employment.pdf',
        status: 'APPROVED',
      },
    ],
    verificationData: {
      aadhaarNumber: '1234-5678-9012',
    },
    notes: 'Aadhaar image needs to be resubmitted with better quality',
    riskScore: 0.3,
  },
  {
    id: '4',
    applicantName: 'Tech Solutions Ltd',
    applicantType: 'VENDOR',
    email: 'admin@techsolutions.com',
    phone: '+91-9876543213',
    verificationType: 'BUSINESS',
    status: 'VERIFIED',
    priority: 'MEDIUM',
    submittedAt: '2024-01-15T12:00:00Z',
    reviewedAt: '2024-01-17T10:15:00Z',
    reviewedBy: 'Admin User',
    documents: [
      {
        type: 'BUSINESS_REGISTRATION',
        name: 'Business Registration.pdf',
        url: '/documents/tech-business-reg.pdf',
        status: 'APPROVED',
      },
      {
        type: 'GST_CERTIFICATE',
        name: 'GST Certificate.pdf',
        url: '/documents/tech-gst.pdf',
        status: 'APPROVED',
      },
    ],
    verificationData: {
      businessName: 'Tech Solutions Ltd',
      businessAddress: '789 Tech Park, Bangalore',
      gstNumber: '29AABCT1234C1ZF',
      panNumber: 'AABCT1234C',
    },
    riskScore: 0.05,
  },
];

export default function VerificationPage() {
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>(mockVerificationRequests);
  const [filteredRequests, setFilteredRequests] = useState<VerificationRequest[]>(mockVerificationRequests);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPerPage] = useState(10);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);

  useEffect(() => {
    let filtered = verificationRequests;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.phone.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    // Type filter
    if (typeFilter) {
      filtered = filtered.filter(request => request.verificationType === typeFilter);
    }

    // Priority filter
    if (priorityFilter) {
      filtered = filtered.filter(request => request.priority === priorityFilter);
    }

    // Sort by priority and submission date
    filtered.sort((a, b) => {
      const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, priorityFilter, verificationRequests]);

  // Pagination
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstRequest, indexOfLastRequest);
  const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'green';
      case 'PENDING':
        return 'yellow';
      case 'IN_REVIEW':
        return 'blue';
      case 'REJECTED':
        return 'red';
      case 'REQUIRES_INFO':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'red';
      case 'HIGH':
        return 'orange';
      case 'MEDIUM':
        return 'blue';
      case 'LOW':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IDENTITY':
        return IdentificationIcon;
      case 'BUSINESS':
        return BuildingOfficeIcon;
      case 'DOCUMENT':
        return DocumentIcon;
      case 'BACKGROUND':
        return DocumentCheckIcon;
      default:
        return DocumentIcon;
    }
  };

  const handleVerificationAction = (action: string, requestId: string, documentIndex?: number) => {
    console.log(`Action: ${action} for request: ${requestId}`, documentIndex);
    
    if (action === 'approve') {
      setVerificationRequests(prev => prev.map(request => 
        request.id === requestId 
          ? { ...request, status: 'VERIFIED' as const, reviewedAt: new Date().toISOString(), reviewedBy: 'Admin User' }
          : request
      ));
    } else if (action === 'reject') {
      setVerificationRequests(prev => prev.map(request => 
        request.id === requestId 
          ? { ...request, status: 'REJECTED' as const, reviewedAt: new Date().toISOString(), reviewedBy: 'Admin User' }
          : request
      ));
    } else if (action === 'request_info') {
      setVerificationRequests(prev => prev.map(request => 
        request.id === requestId 
          ? { ...request, status: 'REQUIRES_INFO' as const, reviewedAt: new Date().toISOString(), reviewedBy: 'Admin User' }
          : request
      ));
    } else if (action === 'start_review') {
      setVerificationRequests(prev => prev.map(request => 
        request.id === requestId 
          ? { ...request, status: 'IN_REVIEW' as const, reviewedAt: new Date().toISOString(), reviewedBy: 'Admin User' }
          : request
      ));
    }
  };

  const stats = {
    total: verificationRequests.length,
    pending: verificationRequests.filter(r => r.status === 'PENDING').length,
    inReview: verificationRequests.filter(r => r.status === 'IN_REVIEW').length,
    verified: verificationRequests.filter(r => r.status === 'VERIFIED').length,
    rejected: verificationRequests.filter(r => r.status === 'REJECTED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verification Management</h1>
          <p className="text-gray-600 mt-1">Review and approve verification requests</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button variant="outline" size="sm">
            Bulk Actions
          </Button>
          <Button variant="outline" size="sm">
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <DocumentIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <EyeIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Review</p>
              <p className="text-xl font-bold text-gray-900">{stats.inReview}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Verified</p>
              <p className="text-xl font-bold text-gray-900">{stats.verified}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XMarkIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-xl font-bold text-gray-900">{stats.rejected}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-w-[120px]"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
              <option value="REQUIRES_INFO">Requires Info</option>
            </Select>
            
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="min-w-[120px]"
            >
              <option value="">All Types</option>
              <option value="IDENTITY">Identity</option>
              <option value="BUSINESS">Business</option>
              <option value="DOCUMENT">Document</option>
              <option value="BACKGROUND">Background</option>
            </Select>
            
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="min-w-[120px]"
            >
              <option value="">All Priority</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Verification Requests Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timeline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentRequests.map((request) => {
                const TypeIcon = getTypeIcon(request.verificationType);
                const approvedDocs = request.documents.filter(d => d.status === 'APPROVED').length;
                const totalDocs = request.documents.length;
                
                return (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{request.applicantName}</div>
                        <div className="text-sm text-gray-500">{request.email}</div>
                        <div className="text-sm text-gray-500">{request.phone}</div>
                        <Badge color="gray" size="sm">{request.applicantType}</Badge>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <TypeIcon className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.verificationType}
                          </div>
                          <Badge color={getPriorityBadgeColor(request.priority)} size="sm">
                            {request.priority}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge color={getStatusBadgeColor(request.status)}>
                        {request.status.replace('_', ' ')}
                      </Badge>
                      {request.reviewedBy && (
                        <div className="text-xs text-gray-500 mt-1">
                          By: {request.reviewedBy}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {approvedDocs}/{totalDocs} approved
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(approvedDocs / totalDocs) * 100}%` }}
                        />
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          request.riskScore < 0.3 ? 'bg-green-500' :
                          request.riskScore < 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm text-gray-900">
                          {(request.riskScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div>Submitted: {format(new Date(request.submittedAt), 'MMM dd')}</div>
                        {request.reviewedAt && (
                          <div>Reviewed: {format(new Date(request.reviewedAt), 'MMM dd')}</div>
                        )}
                        <div className="text-xs text-gray-400">
                          {Math.ceil((Date.now() - new Date(request.submittedAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col space-y-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                        
                        {request.status === 'PENDING' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerificationAction('start_review', request.id)}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            Start Review
                          </Button>
                        )}
                        
                        {request.status === 'IN_REVIEW' && (
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerificationAction('approve', request.id)}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerificationAction('reject', request.id)}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <XMarkIcon className="w-4 h-4" />
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
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstRequest + 1} to {Math.min(indexOfLastRequest, filteredRequests.length)} of {filteredRequests.length} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
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

      {/* Detailed Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Verification Review: {selectedRequest.applicantName}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRequest(null)}
                >
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Applicant Information */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Applicant Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Name:</span> {selectedRequest.applicantName}
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Type:</span> {selectedRequest.applicantType}
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Email:</span> {selectedRequest.email}
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Phone:</span> {selectedRequest.phone}
                  </div>
                </div>
              </div>
              
              {/* Verification Data */}
              {Object.keys(selectedRequest.verificationData).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Verification Data</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {Object.entries(selectedRequest.verificationData).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium text-gray-500 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span> {value}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Documents */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Documents ({selectedRequest.documents.length})</h4>
                <div className="space-y-3">
                  {selectedRequest.documents.map((document, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <DocumentIcon className="w-5 h-5 text-gray-500" />
                          <div>
                            <div className="font-medium text-gray-900">{document.name}</div>
                            <div className="text-sm text-gray-500">{document.type.replace('_', ' ')}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge color={document.status === 'APPROVED' ? 'green' : document.status === 'REJECTED' ? 'red' : 'yellow'}>
                            {document.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <EyeIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {document.rejectionReason && (
                        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                          {document.rejectionReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Notes */}
              {selectedRequest.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Notes</h4>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    {selectedRequest.notes}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => {
                    handleVerificationAction('approve', selectedRequest.id);
                    setSelectedRequest(null);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleVerificationAction('reject', selectedRequest.id);
                    setSelectedRequest(null);
                  }}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleVerificationAction('request_info', selectedRequest.id);
                    setSelectedRequest(null);
                  }}
                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                >
                  <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                  Request More Info
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}