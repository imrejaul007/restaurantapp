'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/Textarea';
import { 
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  DownloadIcon,
  ArrowLeftIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  BuildingStorefrontIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface VerificationDocument {
  id: string;
  type: 'GST' | 'FSSAI' | 'PAN' | 'BUSINESS_LICENSE' | 'IDENTITY_PROOF' | 'ADDRESS_PROOF';
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  fileSize: number;
  mimeType: string;
}

interface VerificationRequest {
  id: string;
  restaurantId: string;
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string;
  submittedAt: string;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'REQUIRES_CHANGES';
  assignedTo?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  documents: VerificationDocument[];
  businessDetails: {
    businessType: string;
    establishedYear: number;
    ownershipType: string;
    businessAddress: string;
    description: string;
  };
  verificationNotes: {
    id: string;
    note: string;
    addedBy: string;
    addedAt: string;
    type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  }[];
  timeline: {
    id: string;
    action: string;
    performedBy: string;
    timestamp: string;
    details: string;
  }[];
}

// Mock verification request data
const mockVerificationRequest: VerificationRequest = {
  id: 'VER-2024-001',
  restaurantId: 'REST-001',
  restaurantName: 'Spice Garden Restaurant',
  ownerName: 'Arjun Patel',
  email: 'owner@spicegarden.com',
  phone: '+91-9876543211',
  submittedAt: '2024-01-18T09:20:00Z',
  status: 'IN_REVIEW',
  assignedTo: 'Admin (John Doe)',
  priority: 'MEDIUM',
  documents: [
    {
      id: 'DOC-001',
      type: 'GST',
      fileName: 'gst-certificate.pdf',
      fileUrl: '/documents/gst-certificate.pdf',
      uploadedAt: '2024-01-18T09:20:00Z',
      status: 'APPROVED',
      verifiedBy: 'Admin (John Doe)',
      verifiedAt: '2024-01-19T14:30:00Z',
      fileSize: 2048576,
      mimeType: 'application/pdf',
    },
    {
      id: 'DOC-002',
      type: 'FSSAI',
      fileName: 'fssai-license.pdf',
      fileUrl: '/documents/fssai-license.pdf',
      uploadedAt: '2024-01-18T09:21:00Z',
      status: 'APPROVED',
      verifiedBy: 'Admin (John Doe)',
      verifiedAt: '2024-01-19T14:32:00Z',
      fileSize: 1536000,
      mimeType: 'application/pdf',
    },
    {
      id: 'DOC-003',
      type: 'PAN',
      fileName: 'pan-card.jpg',
      fileUrl: '/documents/pan-card.jpg',
      uploadedAt: '2024-01-18T09:22:00Z',
      status: 'PENDING',
      fileSize: 1024000,
      mimeType: 'image/jpeg',
    },
    {
      id: 'DOC-004',
      type: 'BUSINESS_LICENSE',
      fileName: 'business-license.pdf',
      fileUrl: '/documents/business-license.pdf',
      uploadedAt: '2024-01-18T09:23:00Z',
      status: 'REJECTED',
      rejectionReason: 'Document is expired. Please upload a valid business license.',
      verifiedBy: 'Admin (Jane Smith)',
      verifiedAt: '2024-01-19T16:45:00Z',
      fileSize: 2560000,
      mimeType: 'application/pdf',
    },
  ],
  businessDetails: {
    businessType: 'Restaurant',
    establishedYear: 2020,
    ownershipType: 'Private Limited',
    businessAddress: '456 Curry Lane, Delhi, Delhi 110001',
    description: 'Traditional Indian restaurant specializing in North Indian cuisine and vegetarian dishes.',
  },
  verificationNotes: [
    {
      id: 'NOTE-001',
      note: 'GST certificate verified successfully. All details match with government records.',
      addedBy: 'Admin (John Doe)',
      addedAt: '2024-01-19T14:30:00Z',
      type: 'SUCCESS',
    },
    {
      id: 'NOTE-002',
      note: 'Business license appears to be expired. Requested owner to upload current license.',
      addedBy: 'Admin (Jane Smith)',
      addedAt: '2024-01-19T16:45:00Z',
      type: 'WARNING',
    },
    {
      id: 'NOTE-003',
      note: 'PAN card image quality is poor. May need to request clearer image if details are not readable.',
      addedBy: 'Admin (John Doe)',
      addedAt: '2024-01-20T10:15:00Z',
      type: 'INFO',
    },
  ],
  timeline: [
    {
      id: 'TL-001',
      action: 'Verification Request Submitted',
      performedBy: 'Owner (Arjun Patel)',
      timestamp: '2024-01-18T09:20:00Z',
      details: 'Complete verification package submitted with all required documents',
    },
    {
      id: 'TL-002',
      action: 'Review Started',
      performedBy: 'Admin (John Doe)',
      timestamp: '2024-01-19T14:00:00Z',
      details: 'Verification review process initiated',
    },
    {
      id: 'TL-003',
      action: 'GST Certificate Approved',
      performedBy: 'Admin (John Doe)',
      timestamp: '2024-01-19T14:30:00Z',
      details: 'GST certificate verified and approved',
    },
    {
      id: 'TL-004',
      action: 'Business License Rejected',
      performedBy: 'Admin (Jane Smith)',
      timestamp: '2024-01-19T16:45:00Z',
      details: 'Business license rejected due to expiry',
    },
  ],
};

export default function VerificationWorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const [verificationRequest, setVerificationRequest] = useState<VerificationRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'>('INFO');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  useEffect(() => {
    const loadVerificationRequest = async () => {
      setIsLoading(true);
      try {
        // In real app, fetch verification request by ID
        await new Promise(resolve => setTimeout(resolve, 1000));
        setVerificationRequest(mockVerificationRequest);
      } catch (error) {
        toast.error('Failed to load verification request');
      } finally {
        setIsLoading(false);
      }
    };

    loadVerificationRequest();
  }, [params.id]);

  const handleDocumentAction = async (documentId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      setVerificationRequest(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          documents: prev.documents.map(doc => 
            doc.id === documentId 
              ? { 
                  ...doc, 
                  status: action === 'approve' ? 'APPROVED' : 'REJECTED',
                  rejectionReason: reason,
                  verifiedBy: 'Admin (Current User)',
                  verifiedAt: new Date().toISOString(),
                }
              : doc
          ),
        };
      });
      
      toast.success(`Document ${action}d successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} document`);
    }
  };

  const handleOverallDecision = async (decision: 'approve' | 'reject' | 'request_changes') => {
    try {
      const newStatus = decision === 'approve' ? 'APPROVED' : 
                       decision === 'reject' ? 'REJECTED' : 'REQUIRES_CHANGES';
      
      setVerificationRequest(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(`Verification ${decision.replace('_', ' ')}d successfully`);
    } catch (error) {
      toast.error(`Failed to ${decision} verification`);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      const note = {
        id: `NOTE-${Date.now()}`,
        note: newNote,
        addedBy: 'Admin (Current User)',
        addedAt: new Date().toISOString(),
        type: noteType,
      };
      
      setVerificationRequest(prev => prev ? {
        ...prev,
        verificationNotes: [note, ...prev.verificationNotes],
      } : null);
      
      setNewNote('');
      toast.success('Note added successfully');
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'PENDING': return 'yellow';
      case 'IN_REVIEW': return 'blue';
      case 'REQUIRES_CHANGES': return 'orange';
      default: return 'gray';
    }
  };

  const getNoteBadgeColor = (type: string) => {
    switch (type) {
      case 'SUCCESS': return 'green';
      case 'WARNING': return 'yellow';
      case 'ERROR': return 'red';
      case 'INFO': return 'blue';
      default: return 'gray';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'red';
      case 'HIGH': return 'orange';
      case 'MEDIUM': return 'yellow';
      case 'LOW': return 'green';
      default: return 'gray';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!verificationRequest) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification Request Not Found</h2>
          <p className="text-gray-600 mb-4">The verification request you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">Verification Request #{verificationRequest.id}</h1>
              <Badge color={getStatusBadgeColor(verificationRequest.status)}>
                {verificationRequest.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-gray-600">{verificationRequest.restaurantName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Badge color={getPriorityBadgeColor(verificationRequest.priority)}>
            {verificationRequest.priority} Priority
          </Badge>
          {verificationRequest.assignedTo && (
            <Badge color="blue" variant="outline">
              Assigned to: {verificationRequest.assignedTo}
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {verificationRequest.status === 'IN_REVIEW' && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleOverallDecision('approve')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              Approve Verification
            </Button>
            <Button
              onClick={() => setShowRejectionModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <XCircleIcon className="w-4 h-4 mr-2" />
              Reject Verification
            </Button>
            <Button
              onClick={() => handleOverallDecision('request_changes')}
              variant="outline"
              className="border-orange-600 text-orange-600 hover:bg-orange-50"
            >
              <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
              Request Changes
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Restaurant Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BuildingStorefrontIcon className="w-5 h-5 mr-2" />
              Restaurant Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Restaurant Name</p>
                <p className="text-gray-600">{verificationRequest.restaurantName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Owner Name</p>
                <p className="text-gray-600">{verificationRequest.ownerName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-gray-600">{verificationRequest.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Phone</p>
                <p className="text-gray-600">{verificationRequest.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Business Type</p>
                <p className="text-gray-600">{verificationRequest.businessDetails.businessType}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Established Year</p>
                <p className="text-gray-600">{verificationRequest.businessDetails.establishedYear}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-900">Business Address</p>
                <p className="text-gray-600">{verificationRequest.businessDetails.businessAddress}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-900">Description</p>
                <p className="text-gray-600">{verificationRequest.businessDetails.description}</p>
              </div>
            </div>
          </Card>

          {/* Documents */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DocumentTextIcon className="w-5 h-5 mr-2" />
              Verification Documents
            </h3>
            
            <div className="space-y-4">
              {verificationRequest.documents.map((document) => (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {document.mimeType.startsWith('image/') ? (
                          <PhotoIcon className="w-5 h-5 text-gray-600" />
                        ) : (
                          <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{document.type}</h4>
                        <p className="text-sm text-gray-600">{document.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(document.fileSize)} • 
                          Uploaded {format(new Date(document.uploadedAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge color={getStatusBadgeColor(document.status)}>
                        {document.status}
                      </Badge>
                    </div>
                  </div>
                  
                  {document.status === 'REJECTED' && document.rejectionReason && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Rejection Reason:</strong> {document.rejectionReason}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    
                    {document.status === 'PENDING' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleDocumentAction(document.id, 'approve')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(document.id);
                            setShowRejectionModal(true);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {document.verifiedBy && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Verified by {document.verifiedBy} on {format(new Date(document.verifiedAt!), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Add Note */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
              Add Note
            </h3>
            
            <div className="space-y-3">
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="ERROR">Error</option>
                <option value="SUCCESS">Success</option>
              </select>
              
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add verification note..."
                rows={3}
              />
              
              <Button onClick={addNote} className="w-full" disabled={!newNote.trim()}>
                Add Note
              </Button>
            </div>
          </Card>

          {/* Verification Notes */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Notes</h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {verificationRequest.verificationNotes.map((note) => (
                <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge color={getNoteBadgeColor(note.type)} size="sm">
                      {note.type}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {format(new Date(note.addedAt), 'MMM dd, HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 mb-1">{note.note}</p>
                  <p className="text-xs text-gray-500">By {note.addedBy}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2" />
              Timeline
            </h3>
            
            <div className="space-y-4">
              {verificationRequest.timeline.map((event, index) => (
                <div key={event.id} className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    {index < verificationRequest.timeline.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-300 ml-0.5 mt-1"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{event.action}</p>
                    <p className="text-xs text-gray-600">{event.details}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {event.performedBy} • {format(new Date(event.timestamp), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedDocument ? 'Reject Document' : 'Reject Verification'}
            </h3>
            
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              rows={4}
              className="mb-4"
            />
            
            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  if (selectedDocument) {
                    handleDocumentAction(selectedDocument, 'reject', rejectionReason);
                    setSelectedDocument(null);
                  } else {
                    handleOverallDecision('reject');
                  }
                  setShowRejectionModal(false);
                  setRejectionReason('');
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={!rejectionReason.trim()}
              >
                Reject
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectionModal(false);
                  setSelectedDocument(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}