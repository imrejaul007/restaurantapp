'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Users,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Calendar,
  ChefHat,
  Utensils,
  User,
  FileText,
  Star,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface Job {
  id: string;
  title: string;
  department: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  experience: string;
  salary: {
    min: number;
    max: number;
    period: 'monthly' | 'hourly';
  };
  location: string;
  description: string;
  requirements: string[];
  benefits: string[];
  postedAt: string;
  deadline: string;
  status: 'active' | 'paused' | 'closed' | 'draft';
  applicationsCount: number;
  viewsCount: number;
}

const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Head Chef',
    department: 'Kitchen',
    type: 'full-time',
    experience: '5+ years',
    salary: { min: 50000, max: 75000, period: 'monthly' },
    location: 'Mumbai, Maharashtra',
    description: 'Lead our kitchen team and create innovative dishes...',
    requirements: ['Culinary degree', '5+ years experience', 'Team leadership'],
    benefits: ['Health insurance', 'Performance bonus', 'Professional development'],
    postedAt: '2024-01-08T10:00:00Z',
    deadline: '2024-01-25T23:59:59Z',
    status: 'active',
    applicationsCount: 23,
    viewsCount: 156,
  },
  {
    id: '2',
    title: 'Sous Chef',
    department: 'Kitchen',
    type: 'full-time',
    experience: '3+ years',
    salary: { min: 35000, max: 45000, period: 'monthly' },
    location: 'Mumbai, Maharashtra',
    description: 'Support head chef and manage daily kitchen operations...',
    requirements: ['Culinary training', '3+ years experience', 'Indian cuisine expertise'],
    benefits: ['Health insurance', 'Meal allowance', 'Career growth'],
    postedAt: '2024-01-07T14:30:00Z',
    deadline: '2024-01-22T23:59:59Z',
    status: 'active',
    applicationsCount: 18,
    viewsCount: 89,
  },
  {
    id: '3',
    title: 'Restaurant Manager',
    department: 'Management',
    type: 'full-time',
    experience: '4+ years',
    salary: { min: 40000, max: 55000, period: 'monthly' },
    location: 'Mumbai, Maharashtra',
    description: 'Oversee daily restaurant operations and staff management...',
    requirements: ['Management degree', '4+ years restaurant experience', 'Leadership skills'],
    benefits: ['Health insurance', 'Performance bonus', 'Growth opportunities'],
    postedAt: '2024-01-06T09:15:00Z',
    deadline: '2024-01-20T23:59:59Z',
    status: 'paused',
    applicationsCount: 31,
    viewsCount: 203,
  },
  {
    id: '4',
    title: 'Waiter/Waitress',
    department: 'Service',
    type: 'part-time',
    experience: '1+ years',
    salary: { min: 300, max: 500, period: 'hourly' },
    location: 'Mumbai, Maharashtra',
    description: 'Provide excellent customer service and take orders...',
    requirements: ['Customer service experience', 'Language skills', 'Friendly personality'],
    benefits: ['Flexible hours', 'Tips', 'Meal allowance'],
    postedAt: '2024-01-05T16:20:00Z',
    deadline: '2024-01-18T23:59:59Z',
    status: 'active',
    applicationsCount: 45,
    viewsCount: 278,
  },
];

const jobStats = [
  {
    title: 'Active Jobs',
    value: '8',
    change: '+2',
    changeType: 'increase' as const,
    icon: Briefcase,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
  },
  {
    title: 'Total Applications',
    value: '117',
    change: '+23',
    changeType: 'increase' as const,
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
  },
  {
    title: 'This Month Views',
    value: '1,547',
    change: '+35%',
    changeType: 'increase' as const,
    icon: Eye,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
  },
  {
    title: 'Response Rate',
    value: '73%',
    change: '+8%',
    changeType: 'increase' as const,
    icon: TrendingUp,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
  },
];

export default function RestaurantJobs() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'draft':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeColor = (type: Job['type']) => {
    switch (type) {
      case 'full-time':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'part-time':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'contract':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'internship':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getDepartmentIcon = (department: string) => {
    switch (department.toLowerCase()) {
      case 'kitchen':
        return <ChefHat className="h-4 w-4" />;
      case 'service':
        return <Utensils className="h-4 w-4" />;
      case 'management':
        return <User className="h-4 w-4" />;
      default:
        return <Briefcase className="h-4 w-4" />;
    }
  };

  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectJob = (jobId: string) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleSelectAll = () => {
    if (selectedJobs.length === filteredJobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(filteredJobs.map(job => job.id));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Job Portal</h1>
            <p className="text-muted-foreground mt-1">
              Manage your job postings and track applications
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button variant="outline"  onClick={() => alert('Job templates feature coming soon!')}>
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button variant="outline"  onClick={() => router.push('/restaurant/analytics')}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button  onClick={() => router.push('/restaurant/jobs/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Post New Job
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {jobStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {stat.value}
                        </p>
                        <div className="flex items-center mt-2">
                          <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
                          <span className="text-sm font-medium text-success-500">
                            {stat.change}
                          </span>
                          <span className="text-sm text-muted-foreground ml-1">
                            this month
                          </span>
                        </div>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search jobs by title or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="closed">Closed</option>
                    <option value="draft">Draft</option>
                  </select>
                  <Button variant="outline" >
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedJobs.length > 0 && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg border-l-4 border-primary">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-primary font-medium">
                      {selectedJobs.length} job{selectedJobs.length > 1 ? 's' : ''} selected
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" >
                        Pause Selected
                      </Button>
                      <Button variant="outline" >
                        Close Selected
                      </Button>
                      <Button variant="outline"  className="text-destructive hover:text-destructive">
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Jobs List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold">
                Job Listings ({filteredJobs.length})
              </CardTitle>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedJobs.length === filteredJobs.length && filteredJobs.length > 0}
                  onChange={() => handleSelectAll()}
                  className="rounded border-border"
                />
                <label className="text-sm text-muted-foreground">Select All</label>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className={cn(
                      'p-6 rounded-lg border transition-colors hover:bg-accent/30',
                      selectedJobs.includes(job.id) ? 'bg-primary/5 border-primary/20' : 'bg-background'
                    )}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedJobs.includes(job.id)}
                          onChange={() => handleSelectJob(job.id)}
                          className="mt-1 rounded border-border"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                            <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(job.status)}`}>
                              {job.status}
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full ${getTypeColor(job.type)}`}>
                              {job.type}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center space-x-1">
                              {getDepartmentIcon(job.department)}
                              <span>{job.department}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4" />
                              <span>
                                {formatCurrency(job.salary.min)} - {formatCurrency(job.salary.max)} / {job.salary.period}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{job.experience}</span>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {job.description}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4 text-primary" />
                                <span>{job.applicationsCount} applications</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                <span>{job.viewsCount} views</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>Deadline: {formatDate(job.deadline, { month: 'short', day: 'numeric' })}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button variant="ghost" >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="ghost" >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="ghost"  className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredJobs.length === 0 && (
                  <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No jobs found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your search or filters'
                        : 'Get started by posting your first job'
                      }
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Post New Job
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}