'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import {
  BriefcaseIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PauseIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  StarIcon,
  ChatBubbleLeftIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface JobApplication {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  experience: number;
  currentSalary?: number;
  expectedSalary: number;
  appliedAt: string;
  status: 'pending' | 'shortlisted' | 'interviewed' | 'hired' | 'rejected';
  resume: string;
  rating?: number;
  notes?: string;
  availableFrom?: string;
}

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  experience: string;
  salary: { min: number; max: number };
  description: string;
  requirements: string[];
  benefits: string[];
  status: 'active' | 'paused' | 'closed' | 'draft';
  postedAt: string;
  closingDate: string;
  applications: JobApplication[];
  views: number;
  restaurants: string[];
}

// Mock job data
const mockJob: JobPosting = {
  id: '1',
  title: 'Senior Chef',
  department: 'Kitchen',
  location: 'Mumbai, Maharashtra',
  type: 'full-time',
  experience: '3-5 years',
  salary: { min: 35000, max: 50000 },
  description: `We are looking for an experienced Senior Chef to join our dynamic kitchen team. The ideal candidate will have a passion for creating exceptional dishes and leading a team of junior chefs.

Key Responsibilities:
- Plan and oversee daily kitchen operations
- Create and develop new menu items
- Ensure food quality and safety standards
- Train and mentor junior kitchen staff
- Manage inventory and control food costs
- Collaborate with management on menu pricing`,
  requirements: [
    'Culinary degree or equivalent experience',
    '3-5 years of experience in a similar role',
    'Strong leadership and communication skills',
    'Knowledge of food safety regulations',
    'Ability to work in a fast-paced environment',
    'Creative flair and attention to detail'
  ],
  benefits: [
    'Competitive salary package',
    'Health insurance coverage',
    'Performance-based bonuses',
    'Professional development opportunities',
    'Meal allowances',
    'Flexible working hours'
  ],
  status: 'active',
  postedAt: '2024-01-15T10:30:00Z',
  closingDate: '2024-02-15T23:59:59Z',
  views: 1247,
  restaurants: ['Pizza Palace'],
  applications: [
    {
      id: 'APP-001',
      applicantName: 'Rahul Sharma',
      email: 'rahul.sharma@email.com',
      phone: '+91-9876543210',
      experience: 4,
      currentSalary: 32000,
      expectedSalary: 45000,
      appliedAt: '2024-01-18T14:30:00Z',
      status: 'shortlisted',
      resume: '/resumes/rahul-sharma-resume.pdf',
      rating: 4.5,
      notes: 'Strong background in Italian cuisine. Good leadership skills.',
      availableFrom: '2024-02-01'
    },
    {
      id: 'APP-002',
      applicantName: 'Priya Patel',
      email: 'priya.patel@email.com',
      phone: '+91-9876543211',
      experience: 5,
      currentSalary: 38000,
      expectedSalary: 48000,
      appliedAt: '2024-01-16T09:15:00Z',
      status: 'interviewed',
      resume: '/resumes/priya-patel-resume.pdf',
      rating: 4.8,
      notes: 'Excellent technical skills and creativity. Very impressive portfolio.',
      availableFrom: '2024-01-25'
    },
    {
      id: 'APP-003',
      applicantName: 'Amit Kumar',
      email: 'amit.kumar@email.com',
      phone: '+91-9876543212',
      experience: 3,
      expectedSalary: 40000,
      appliedAt: '2024-01-20T16:45:00Z',
      status: 'pending',
      resume: '/resumes/amit-kumar-resume.pdf',
      availableFrom: '2024-02-15'
    }
  ]
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const loadJob = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setJob(mockJob);
      } catch (error) {
        toast.error('Failed to load job details');
      } finally {
        setIsLoading(false);
      }
    };

    loadJob();
  }, [params.id]);

  const handleStatusChange = async (newStatus: JobPosting['status']) => {
    try {
      setJob(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(`Job ${newStatus} successfully`);
    } catch (error) {
      toast.error('Failed to update job status');
    }
  };

  const handleApplicationAction = async (applicationId: string, action: 'shortlist' | 'interview' | 'hire' | 'reject') => {
    try {
      setJob(prev => {
        if (!prev) return null;
        return {
          ...prev,
          applications: prev.applications.map(app =>
            app.id === applicationId
              ? { ...app, status: action === 'shortlist' ? 'shortlisted' : 
                                action === 'interview' ? 'interviewed' :
                                action === 'hire' ? 'hired' : 'rejected' }
              : app
          )
        };
      });
      
      toast.success(`Application ${action}ed successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} application`);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'paused': return 'yellow';
      case 'closed': return 'red';
      case 'draft': return 'gray';
      default: return 'gray';
    }
  };

  const getApplicationStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'hired': return 'green';
      case 'interviewed': return 'blue';
      case 'shortlisted': return 'yellow';
      case 'rejected': return 'red';
      case 'pending': return 'gray';
      default: return 'gray';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BriefcaseIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-4">The job posting you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BriefcaseIcon },
    { id: 'applications', label: `Applications (${job.applications.length})`, icon: UserGroupIcon },
    { id: 'analytics', label: 'Analytics', icon: StarIcon },
    { id: 'settings', label: 'Settings', icon: PencilIcon },
  ];

  const applicationStats = {
    total: job.applications.length,
    pending: job.applications.filter(a => a.status === 'pending').length,
    shortlisted: job.applications.filter(a => a.status === 'shortlisted').length,
    interviewed: job.applications.filter(a => a.status === 'interviewed').length,
    hired: job.applications.filter(a => a.status === 'hired').length,
    rejected: job.applications.filter(a => a.status === 'rejected').length,
  };

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
            
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <Badge color={getStatusBadgeColor(job.status)}>
                {job.status}
              </Badge>
            </div>
            <p className="text-gray-600">{job.department} • {job.location}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button variant="outline" >
            <EyeIcon className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" >
            <PencilIcon className="w-4 h-4 mr-2" />
            Edit
          </Button>
          {job.status === 'active' ? (
            <Button
              variant="outline"
              
              onClick={() => handleStatusChange('paused')}
            >
              <PauseIcon className="w-4 h-4 mr-2" />
              Pause
            </Button>
          ) : (
            <Button
              variant="outline"
              
              onClick={() => handleStatusChange('active')}
            >
              <PlayIcon className="w-4 h-4 mr-2" />
              Activate
            </Button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <EyeIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{job.views}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Applications</p>
              <p className="text-2xl font-bold text-gray-900">{applicationStats.total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Days Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.ceil((new Date().getTime() - new Date(job.postedAt).getTime()) / (1000 * 60 * 60 * 24))}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Hired</p>
              <p className="text-2xl font-bold text-gray-900">{applicationStats.hired}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {tabs.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id}>
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Job Details</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <MapPinIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{job.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BriefcaseIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{job.type} • {job.experience}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CurrencyDollarIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">
                        ₹{job.salary.min.toLocaleString()} - ₹{job.salary.max.toLocaleString()} per month
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">
                        Closes on {format(new Date(job.closingDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                    <ul className="space-y-1">
                      {job.requirements.map((req, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                  <div className="prose prose-sm text-gray-600">
                    {job.description.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-3">{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Benefits</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {job.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Applications</h3>
                <Button variant="outline" >
                  Export Applications
                </Button>
              </div>

              {/* Application Stats */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">{applicationStats.total}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-600">{applicationStats.pending}</div>
                  <div className="text-xs text-gray-600">Pending</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-lg font-semibold text-yellow-600">{applicationStats.shortlisted}</div>
                  <div className="text-xs text-yellow-600">Shortlisted</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-semibold text-blue-600">{applicationStats.interviewed}</div>
                  <div className="text-xs text-blue-600">Interviewed</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-semibold text-green-600">{applicationStats.hired}</div>
                  <div className="text-xs text-green-600">Hired</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-lg font-semibold text-red-600">{applicationStats.rejected}</div>
                  <div className="text-xs text-red-600">Rejected</div>
                </div>
              </div>

              {/* Applications List */}
              <div className="space-y-4">
                {job.applications.map((application) => (
                  <Card key={application.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {application.applicantName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{application.applicantName}</h4>
                          <p className="text-sm text-gray-600">{application.email}</p>
                        </div>
                      </div>
                      <Badge color={getApplicationStatusBadgeColor(application.status)}>
                        {application.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-600">Experience:</span>
                        <span className="ml-1 text-gray-900">{application.experience} years</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Expected Salary:</span>
                        <span className="ml-1 text-gray-900">₹{application.expectedSalary.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Applied:</span>
                        <span className="ml-1 text-gray-900">
                          {format(new Date(application.appliedAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      {application.availableFrom && (
                        <div>
                          <span className="text-gray-600">Available from:</span>
                          <span className="ml-1 text-gray-900">
                            {format(new Date(application.availableFrom), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>

                    {application.rating && (
                      <div className="flex items-center space-x-1 mb-3">
                        <span className="text-sm text-gray-600">Rating:</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(application.rating || 0)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-900">{application.rating}</span>
                      </div>
                    )}

                    {application.notes && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-600">Notes:</span>
                        <p className="text-sm text-gray-900 mt-1">{application.notes}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Button variant="outline" >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View Resume
                        </Button>
                        <Button variant="outline" >
                          <ChatBubbleLeftIcon className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                      </div>
                      
                      {application.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            
                            onClick={() => handleApplicationAction(application.id, 'shortlist')}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white"
                          >
                            Shortlist
                          </Button>
                          <Button
                            
                            onClick={() => handleApplicationAction(application.id, 'reject')}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      
                      {application.status === 'shortlisted' && (
                        <div className="flex space-x-2">
                          <Button
                            
                            onClick={() => handleApplicationAction(application.id, 'interview')}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Interview
                          </Button>
                          <Button
                            
                            onClick={() => handleApplicationAction(application.id, 'reject')}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      
                      {application.status === 'interviewed' && (
                        <div className="flex space-x-2">
                          <Button
                            
                            onClick={() => handleApplicationAction(application.id, 'hire')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Hire
                          </Button>
                          <Button
                            
                            onClick={() => handleApplicationAction(application.id, 'reject')}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Job Performance Analytics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Application Rate</h4>
                  <div className="text-3xl font-bold text-blue-600">
                    {((applicationStats.total / job.views) * 100).toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600">
                    {applicationStats.total} applications from {job.views} views
                  </p>
                </Card>
                
                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Success Rate</h4>
                  <div className="text-3xl font-bold text-green-600">
                    {applicationStats.total > 0 
                      ? ((applicationStats.hired / applicationStats.total) * 100).toFixed(1)
                      : '0'}%
                  </div>
                  <p className="text-sm text-gray-600">
                    {applicationStats.hired} hired from {applicationStats.total} applications
                  </p>
                </Card>
                
                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Avg. Experience</h4>
                  <div className="text-3xl font-bold text-purple-600">
                    {job.applications.length > 0
                      ? (job.applications.reduce((sum, app) => sum + app.experience, 0) / job.applications.length).toFixed(1)
                      : '0'} years
                  </div>
                  <p className="text-sm text-gray-600">
                    Average experience of applicants
                  </p>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Job Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Status Management</h4>
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleStatusChange('active')}
                      disabled={job.status === 'active'}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      Activate Job
                    </Button>
                    <Button
                      onClick={() => handleStatusChange('paused')}
                      disabled={job.status === 'paused'}
                      variant="outline"
                      className="w-full"
                    >
                      Pause Job
                    </Button>
                    <Button
                      onClick={() => handleStatusChange('closed')}
                      disabled={job.status === 'closed'}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      Close Job
                    </Button>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Danger Zone</h4>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Delete Job
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}