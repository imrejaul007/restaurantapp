'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Briefcase,
  FileText,
  Clock,
  Award,
  TrendingUp,
  Eye,
  Send,
  Star,
  MapPin,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  User,
  BookOpen,
  Target,
  MessageSquare,
  Bell
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { EmailVerificationAlert } from '@/components/auth/email-verification-alert';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface JobApplication {
  id: string;
  jobTitle: string;
  company: string;
  appliedAt: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interview' | 'rejected' | 'offered';
  location: string;
  salary?: {
    min: number;
    max: number;
  };
  type: 'full-time' | 'part-time' | 'contract';
  logo?: string;
}

interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: {
    min: number;
    max: number;
  };
  type: 'full-time' | 'part-time' | 'contract';
  matchPercentage: number;
  postedAt: string;
  skills: string[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'skill' | 'certification' | 'milestone';
  earnedAt: string;
  icon: any;
}

const mockApplications: JobApplication[] = [
  {
    id: '1',
    jobTitle: 'Head Chef',
    company: 'The Spice Route',
    appliedAt: '2024-01-08T10:00:00Z',
    status: 'interview',
    location: 'Mumbai, Maharashtra',
    salary: { min: 50000, max: 70000 },
    type: 'full-time'
  },
  {
    id: '2',
    jobTitle: 'Sous Chef',
    company: 'Mumbai Bistro',
    appliedAt: '2024-01-06T14:30:00Z',
    status: 'shortlisted',
    location: 'Mumbai, Maharashtra',
    salary: { min: 35000, max: 45000 },
    type: 'full-time'
  },
  {
    id: '3',
    jobTitle: 'Kitchen Assistant',
    company: 'Cafe Central',
    appliedAt: '2024-01-05T09:15:00Z',
    status: 'reviewed',
    location: 'Pune, Maharashtra',
    salary: { min: 20000, max: 25000 },
    type: 'part-time'
  },
  {
    id: '4',
    jobTitle: 'Restaurant Manager',
    company: 'Grand Hotel',
    appliedAt: '2024-01-03T16:45:00Z',
    status: 'rejected',
    location: 'Delhi, India',
    salary: { min: 40000, max: 55000 },
    type: 'full-time'
  },
];

const mockRecommendations: JobRecommendation[] = [
  {
    id: '1',
    title: 'Senior Chef',
    company: 'Royal Kitchen',
    location: 'Mumbai, Maharashtra',
    salary: { min: 45000, max: 60000 },
    type: 'full-time',
    matchPercentage: 95,
    postedAt: '2024-01-09T08:00:00Z',
    skills: ['Indian Cuisine', 'Team Management', 'Menu Planning']
  },
  {
    id: '2',
    title: 'Food & Beverage Manager',
    company: 'Luxury Resort',
    location: 'Goa, India',
    salary: { min: 50000, max: 70000 },
    type: 'full-time',
    matchPercentage: 88,
    postedAt: '2024-01-08T12:30:00Z',
    skills: ['Management', 'Customer Service', 'Operations']
  },
  {
    id: '3',
    title: 'Executive Chef',
    company: 'Fine Dining Restaurant',
    location: 'Bangalore, Karnataka',
    salary: { min: 60000, max: 80000 },
    type: 'full-time',
    matchPercentage: 82,
    postedAt: '2024-01-07T15:20:00Z',
    skills: ['Continental Cuisine', 'Leadership', 'Innovation']
  },
];

const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: 'Profile Completion',
    description: 'Completed your professional profile',
    type: 'milestone',
    earnedAt: '2024-01-01T00:00:00Z',
    icon: User
  },
  {
    id: '2',
    title: 'Food Safety Certified',
    description: 'Earned HACCP certification',
    type: 'certification',
    earnedAt: '2024-01-05T00:00:00Z',
    icon: Award
  },
  {
    id: '3',
    title: 'Active Applicant',
    description: 'Applied to 10+ positions',
    type: 'milestone',
    earnedAt: '2024-01-08T00:00:00Z',
    icon: Target
  },
];

const employeeStats = [
  {
    title: 'Applications Sent',
    value: '23',
    change: '+5',
    changeType: 'increase' as const,
    icon: Send,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    description: 'This month',
  },
  {
    title: 'Profile Views',
    value: '156',
    change: '+28%',
    changeType: 'increase' as const,
    icon: Eye,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
    description: 'By employers',
  },
  {
    title: 'Interview Calls',
    value: '4',
    change: '+2',
    changeType: 'increase' as const,
    icon: MessageSquare,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    description: 'This week',
  },
  {
    title: 'Skills Rating',
    value: '4.3',
    change: '+0.4',
    changeType: 'increase' as const,
    icon: Star,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
    description: 'Average score',
  },
];

export default function EmployeeDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const router = useRouter();
  
  const quickActions = [
    { icon: User, label: 'Update Profile', href: '/employee/profile', color: 'bg-blue-500' },
    { icon: Briefcase, label: 'Find Jobs', href: '/employee/jobs', color: 'bg-green-500' },
    { icon: FileText, label: 'My Applications', href: '/employee/applications', color: 'bg-purple-500' },
    { icon: BookOpen, label: 'Learning Hub', href: '/employee/learning', color: 'bg-orange-500' },
  ];

  const getApplicationStatusColor = (status: JobApplication['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'shortlisted':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'interview':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'offered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getApplicationStatusIcon = (status: JobApplication['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'reviewed':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'shortlisted':
        return <CheckCircle className="h-4 w-4 text-purple-600" />;
      case 'interview':
        return <MessageSquare className="h-4 w-4 text-orange-600" />;
      case 'offered':
        return <Award className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Track your job search progress and discover new opportunities
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button variant="outline" >
              <BookOpen className="h-4 w-4 mr-2" />
              Learning Hub
            </Button>
            <Button >
              <Briefcase className="h-4 w-4 mr-2" />
              Browse Jobs
            </Button>
          </div>
        </div>

        {/* Email Verification Alert */}
        <EmailVerificationAlert />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {employeeStats.map((stat, index) => {
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
                            {stat.description}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Applications */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">
                    Recent Applications
                  </CardTitle>
                  <Button variant="ghost" >
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockApplications.slice(0, 4).map((application) => (
                    <div
                      key={application.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Briefcase className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{application.jobTitle}</h4>
                          <p className="text-xs text-muted-foreground">
                            {application.company} • {application.location}
                          </p>
                          {application.salary && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatCurrency(application.salary.min)} - {formatCurrency(application.salary.max)} / month
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          {getApplicationStatusIcon(application.status)}
                          <div className={`text-xs px-2 py-1 rounded-full ${getApplicationStatusColor(application.status)}`}>
                            {application.status}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(application.appliedAt, { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                <CardDescription>
                  Enhance your job search
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button 
                      key={index}
                      variant="ghost" 
                      className="w-full justify-start h-auto p-4 hover:bg-muted/50"
                      onClick={() => router.push(action.href)}
                    >
                      <div className={`p-2 rounded-lg ${action.color} mr-4`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">{action.label}</p>
                        <p className="text-xs text-muted-foreground">
                          Navigate to {action.label.toLowerCase()}
                        </p>
                      </div>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Job Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">
                Recommended for You
              </CardTitle>
              <Button variant="ghost" >
                <TrendingUp className="h-4 w-4 mr-2" />
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockRecommendations.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-1">{job.title}</h4>
                        <p className="text-xs text-muted-foreground">{job.company}</p>
                      </div>
                      <div className="text-right">
                        <div className="bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200 text-xs px-2 py-1 rounded-full">
                          {job.matchPercentage}% match
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        <span>
                          {formatCurrency(job.salary.min)} - {formatCurrency(job.salary.max)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(job.postedAt, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 mb-3">
                      {job.skills.slice(0, 2).map((skill, index) => (
                        <span
                          key={index}
                          className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.skills.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{job.skills.length - 2}
                        </span>
                      )}
                    </div>

                    <Button  className="w-full">
                      Apply Now
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Achievements</CardTitle>
              <CardDescription>
                Your progress milestones and certifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockAchievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className="flex items-center space-x-4 p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{achievement.title}</h4>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(achievement.earnedAt, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        achievement.type === 'certification' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {achievement.type}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}