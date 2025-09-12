'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Filter,
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Award,
  MessageSquare,
  FileText,
  ArrowUpDown,
  MoreHorizontal,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth/auth-provider';
import { cn } from '@/lib/utils';

interface JobApplication {
  id: string;
  applicant: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
    location: {
      city: string;
      state: string;
    };
    profile: {
      title: string;
      experience: number;
      rating?: number;
      verified: boolean;
    };
  };
  job: {
    id: string;
    title: string;
    department: string;
  };
  appliedAt: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interview-scheduled' | 'offered' | 'rejected' | 'withdrawn';
  coverLetter: string;
  resume?: {
    url: string;
    filename: string;
  };
  experience: {
    totalYears: number;
    relevantYears: number;
    previousRoles: Array<{
      title: string;
      company: string;
      duration: string;
    }>;
  };
  skills: string[];
  expectedSalary: {
    amount: number;
    negotiable: boolean;
  };
  availability: {
    startDate: string;
    noticePeriod: string;
  };
  score?: number;
  notes?: string;
}

const mockApplications: JobApplication[] = [
  {
    id: '1',
    applicant: {
      id: 'emp1',
      name: 'Amit Sharma',
      email: 'amit.sharma@email.com',
      phone: '+91 98765 43210',
      location: { city: 'Mumbai', state: 'Maharashtra' },
      profile: {
        title: 'Senior Chef',
        experience: 8,
        rating: 4.8,
        verified: true
      }
    },
    job: { id: 'job1', title: 'Head Chef', department: 'Kitchen' },
    appliedAt: '2024-01-10T14:30:00Z',
    status: 'interview-scheduled',
    coverLetter: 'I am passionate about creating exceptional dining experiences...',
    experience: {
      totalYears: 8,
      relevantYears: 8,
      previousRoles: [
        { title: 'Sous Chef', company: 'The Taj Hotel', duration: '3 years' },
        { title: 'Chef de Partie', company: 'ITC Grand Central', duration: '2 years' }
      ]
    },
    skills: ['Indian Cuisine', 'Team Leadership', 'Menu Planning', 'Cost Control'],
    expectedSalary: { amount: 65000, negotiable: true },
    availability: { startDate: '2024-02-01', noticePeriod: '1-month' },
    score: 92,
    notes: 'Strong candidate with excellent references'
  },
  {
    id: '2',
    applicant: {
      id: 'emp2',
      name: 'Priya Patel',
      email: 'priya.patel@email.com',
      phone: '+91 87654 32109',
      location: { city: 'Pune', state: 'Maharashtra' },
      profile: {
        title: 'Restaurant Manager',
        experience: 5,
        rating: 4.6,
        verified: true
      }
    },
    job: { id: 'job2', title: 'Restaurant Manager', department: 'Management' },
    appliedAt: '2024-01-09T11:20:00Z',
    status: 'shortlisted',
    coverLetter: 'With 5 years of experience in restaurant management...',
    experience: {
      totalYears: 5,
      relevantYears: 5,
      previousRoles: [
        { title: 'Assistant Manager', company: 'Barbeque Nation', duration: '2 years' },
        { title: 'Team Leader', company: 'Cafe Coffee Day', duration: '3 years' }
      ]
    },
    skills: ['Team Management', 'Customer Service', 'Operations', 'Staff Training'],
    expectedSalary: { amount: 45000, negotiable: false },
    availability: { startDate: '2024-01-25', noticePeriod: '2-weeks' },
    score: 87
  },
  {
    id: '3',
    applicant: {
      id: 'emp3',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@email.com',
      phone: '+91 76543 21098',
      location: { city: 'Delhi', state: 'Delhi' },
      profile: {
        title: 'Waiter',
        experience: 3,
        rating: 4.2,
        verified: false
      }
    },
    job: { id: 'job3', title: 'Senior Waiter', department: 'Service' },
    appliedAt: '2024-01-08T09:45:00Z',
    status: 'pending',
    coverLetter: 'I am enthusiastic about providing excellent customer service...',
    experience: {
      totalYears: 3,
      relevantYears: 3,
      previousRoles: [
        { title: 'Waiter', company: 'Local Restaurant', duration: '3 years' }
      ]
    },
    skills: ['Customer Service', 'Communication', 'Order Management'],
    expectedSalary: { amount: 25000, negotiable: true },
    availability: { startDate: '2024-01-20', noticePeriod: 'immediate' },
    score: 72
  }
];

const statusColors = {
  'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'reviewed': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'shortlisted': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'interview-scheduled': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'offered': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  'rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'withdrawn': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
};

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'name'>('date');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Verify user is restaurant owner
  if (user?.role !== 'restaurant') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Access Denied
          </h2>
          <p className="text-muted-foreground">
            Only restaurant owners can view applications.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const filteredApplications = mockApplications.filter(app => {
    const matchesSearch = app.applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.job.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return (b.score || 0) - (a.score || 0);
      case 'name':
        return a.applicant.name.localeCompare(b.applicant.name);
      case 'date':
      default:
        return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
    }
  });

  const updateApplicationStatus = (applicationId: string, newStatus: JobApplication['status']) => {
    // This would typically make an API call
    console.log(`Updating application ${applicationId} to ${newStatus}`);
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAll = () => {
    if (selectedIds.size === sortedApplications.length) {
      setSelectedIds(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedIds(new Set(sortedApplications.map(app => app.id)));
      setShowBulkActions(true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Job Applications</h1>
            <p className="text-muted-foreground">
              Review and manage applications for your job postings
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-foreground">{mockApplications.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-foreground">
                    {mockApplications.filter(app => app.status === 'pending').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Shortlisted</p>
                  <p className="text-2xl font-bold text-foreground">
                    {mockApplications.filter(app => app.status === 'shortlisted').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Interviews</p>
                  <p className="text-2xl font-bold text-foreground">
                    {mockApplications.filter(app => app.status === 'interview-scheduled').length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search applications..."
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <select
                className="px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview-scheduled">Interview Scheduled</option>
                <option value="offered">Offered</option>
                <option value="rejected">Rejected</option>
              </select>

              {/* Sort By */}
              <select
                className="px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'score' | 'name')}
              >
                <option value="date">Sort by Date</option>
                <option value="score">Sort by Score</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {showBulkActions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/10 border border-primary/20 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                {selectedIds.size} application{selectedIds.size > 1 ? 's' : ''} selected
              </p>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline">Mark as Reviewed</Button>
                <Button size="sm" variant="outline">Shortlist</Button>
                <Button size="sm" variant="outline" className="text-destructive">Reject</Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Applications List */}
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedIds.size === sortedApplications.length && sortedApplications.length > 0}
                onChange={selectAll}
                className="rounded border-border"
              />
              <span className="text-sm font-medium">Select All</span>
            </label>
            <p className="text-sm text-muted-foreground">
              {sortedApplications.length} application{sortedApplications.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Applications */}
          {sortedApplications.map((application) => (
            <motion.div
              key={application.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card className={cn(
                "cursor-pointer hover:shadow-md transition-all",
                selectedIds.has(application.id) && "ring-2 ring-primary/20 bg-primary/5"
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedIds.has(application.id)}
                      onChange={() => toggleSelection(application.id)}
                      className="rounded border-border mt-1"
                    />

                    {/* Avatar */}
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-primary" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {application.applicant.name}
                            </h3>
                            {application.applicant.profile.verified && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Applied for {application.job.title} • {formatDate(application.appliedAt)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {application.score && (
                            <div className="flex items-center space-x-1 bg-primary/10 px-2 py-1 rounded">
                              <Star className="h-3 w-3 text-primary" />
                              <span className="text-sm font-medium text-primary">{application.score}</span>
                            </div>
                          )}
                          <Badge className={statusColors[application.status]}>
                            {application.status.replace('-', ' ')}
                          </Badge>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <span>{application.experience.totalYears} years experience</span>
                        </div>
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{application.applicant.location.city}, {application.applicant.location.state}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Available: {application.availability.startDate}</span>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2">
                        {application.skills.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded"
                          >
                            {skill}
                          </span>
                        ))}
                        {application.skills.length > 4 && (
                          <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                            +{application.skills.length - 4} more
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center space-x-4 text-sm">
                          <button className="flex items-center space-x-1 text-primary hover:text-primary/80">
                            <Eye className="h-4 w-4" />
                            <span>View Details</span>
                          </button>
                          <button className="flex items-center space-x-1 text-muted-foreground hover:text-foreground">
                            <MessageSquare className="h-4 w-4" />
                            <span>Message</span>
                          </button>
                          <button className="flex items-center space-x-1 text-muted-foreground hover:text-foreground">
                            <Download className="h-4 w-4" />
                            <span>Resume</span>
                          </button>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {application.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateApplicationStatus(application.id, 'shortlisted')}
                              >
                                Shortlist
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateApplicationStatus(application.id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {application.status === 'shortlisted' && (
                            <Button
                              size="sm"
                              onClick={() => updateApplicationStatus(application.id, 'interview-scheduled')}
                            >
                              Schedule Interview
                            </Button>
                          )}
                          {application.status === 'interview-scheduled' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => updateApplicationStatus(application.id, 'offered')}
                            >
                              Make Offer
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {sortedApplications.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No applications found
              </h3>
              <p className="text-muted-foreground">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Applications will appear here when candidates apply for your jobs'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}