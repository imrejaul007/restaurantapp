'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  Building2,
  Star,
  Heart,
  Send,
  Eye,
  SlidersHorizontal,
  ArrowUpDown,
  Bookmark,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface Job {
  id: string;
  title: string;
  company: {
    id: string;
    name: string;
    logo?: string;
    rating: number;
    verified: boolean;
    location: string;
  };
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  salary: {
    min: number;
    max: number;
    period: 'monthly' | 'annually';
    negotiable: boolean;
  };
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  experience: {
    min: number;
    max: number;
  };
  skills: string[];
  postedAt: string;
  expiresAt: string;
  applicationsCount: number;
  viewsCount: number;
  matchPercentage?: number;
  isUrgent: boolean;
  isFeatured: boolean;
  isApplied: boolean;
  isSaved: boolean;
}

const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Chef',
    company: {
      id: '1',
      name: 'Royal Kitchen Restaurant',
      rating: 4.5,
      verified: true,
      location: 'Mumbai, Maharashtra'
    },
    description: 'We are looking for an experienced Senior Chef to join our team and lead our kitchen operations. The ideal candidate should have extensive experience in Indian and Continental cuisine.',
    requirements: [
      '5+ years of experience in professional kitchen',
      'Expertise in Indian and Continental cuisine',
      'Leadership and team management skills',
      'Food safety certification preferred'
    ],
    responsibilities: [
      'Lead kitchen operations and menu planning',
      'Supervise junior chefs and kitchen staff',
      'Maintain food quality and safety standards',
      'Manage inventory and vendor relationships'
    ],
    benefits: [
      'Competitive salary package',
      'Health insurance',
      'Performance bonus',
      'Professional development opportunities'
    ],
    salary: {
      min: 45000,
      max: 60000,
      period: 'monthly',
      negotiable: true
    },
    location: 'Mumbai, Maharashtra',
    type: 'full-time',
    experience: { min: 5, max: 10 },
    skills: ['Indian Cuisine', 'Continental Cuisine', 'Team Management', 'Food Safety'],
    postedAt: '2024-01-09T08:00:00Z',
    expiresAt: '2024-01-25T23:59:59Z',
    applicationsCount: 45,
    viewsCount: 234,
    matchPercentage: 95,
    isUrgent: false,
    isFeatured: true,
    isApplied: false,
    isSaved: true
  },
  {
    id: '2',
    title: 'Food & Beverage Manager',
    company: {
      id: '2',
      name: 'Luxury Resort & Spa',
      rating: 4.8,
      verified: true,
      location: 'Goa, India'
    },
    description: 'Join our luxury resort as F&B Manager and oversee all food and beverage operations. Excellent opportunity for career growth in hospitality industry.',
    requirements: [
      'Bachelor\'s degree in Hotel Management',
      '4+ years in F&B management',
      'Strong leadership and communication skills',
      'Knowledge of hotel operations'
    ],
    responsibilities: [
      'Manage all F&B operations',
      'Ensure guest satisfaction',
      'Control costs and inventory',
      'Train and develop team members'
    ],
    benefits: [
      'Attractive salary with incentives',
      'Accommodation provided',
      'Medical coverage',
      'Career advancement opportunities'
    ],
    salary: {
      min: 50000,
      max: 70000,
      period: 'monthly',
      negotiable: true
    },
    location: 'Goa, India',
    type: 'full-time',
    experience: { min: 4, max: 8 },
    skills: ['F&B Management', 'Leadership', 'Customer Service', 'Hotel Operations'],
    postedAt: '2024-01-08T12:30:00Z',
    expiresAt: '2024-01-22T23:59:59Z',
    applicationsCount: 28,
    viewsCount: 156,
    matchPercentage: 88,
    isUrgent: true,
    isFeatured: false,
    isApplied: false,
    isSaved: false
  },
  {
    id: '3',
    title: 'Sous Chef',
    company: {
      id: '3',
      name: 'Grand Hotel Palace',
      rating: 4.3,
      verified: true,
      location: 'Delhi, India'
    },
    description: 'Seeking a talented Sous Chef to support our Executive Chef in delivering exceptional culinary experiences to our guests.',
    requirements: [
      '3+ years as Sous Chef or Senior Chef',
      'Culinary degree or equivalent experience',
      'Knowledge of multi-cuisine cooking',
      'Ability to work in fast-paced environment'
    ],
    responsibilities: [
      'Assist Executive Chef in menu planning',
      'Supervise kitchen operations',
      'Maintain food quality standards',
      'Train junior kitchen staff'
    ],
    benefits: [
      'Competitive compensation',
      'Health and life insurance',
      'Free meals during duty',
      'Annual bonus'
    ],
    salary: {
      min: 35000,
      max: 45000,
      period: 'monthly',
      negotiable: false
    },
    location: 'Delhi, India',
    type: 'full-time',
    experience: { min: 3, max: 6 },
    skills: ['Multi-cuisine', 'Kitchen Management', 'Food Quality', 'Training'],
    postedAt: '2024-01-07T15:20:00Z',
    expiresAt: '2024-01-21T23:59:59Z',
    applicationsCount: 67,
    viewsCount: 312,
    matchPercentage: 82,
    isUrgent: false,
    isFeatured: false,
    isApplied: true,
    isSaved: false
  }
];

const searchStats = [
  {
    title: 'Available Jobs',
    value: '1,247',
    change: '+89',
    changeType: 'increase' as const,
    icon: Briefcase,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
  },
  {
    title: 'Companies Hiring',
    value: '342',
    change: '+23',
    changeType: 'increase' as const,
    icon: Building2,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
  },
  {
    title: 'Applications Sent',
    value: '23',
    change: '+5',
    changeType: 'increase' as const,
    icon: Send,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
  },
  {
    title: 'Profile Views',
    value: '156',
    change: '+28%',
    changeType: 'increase' as const,
    icon: Eye,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
  },
];

export default function EmployeeJobs() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [experienceFilter, setExperienceFilter] = useState<string>('all');
  const [salaryFilter, setSalaryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>(['1']);

  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLocation = locationFilter === 'all' || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesType = typeFilter === 'all' || job.type === typeFilter;
    const matchesExperience = experienceFilter === 'all' || (
      job.experience.min <= parseInt(experienceFilter) &&
      job.experience.max >= parseInt(experienceFilter)
    );
    const matchesSalary = salaryFilter === 'all' || job.salary.min >= parseInt(salaryFilter) * 1000;

    return matchesSearch && matchesLocation && matchesType && matchesExperience && matchesSalary;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'match':
        return (b.matchPercentage || 0) - (a.matchPercentage || 0);
      case 'salary-high':
        return b.salary.max - a.salary.max;
      case 'salary-low':
        return a.salary.min - b.salary.min;
      case 'newest':
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      case 'applications':
        return a.applicationsCount - b.applicationsCount;
      default:
        return 0;
    }
  });

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs(prev =>
      prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const getJobTypeColor = (type: Job['type']) => {
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

  const JobCard = ({ job }: { job: Job }) => {
    return (
      <Card
        className="hover:shadow-lg transition-all duration-300 cursor-pointer"
        onClick={() => router.push(`/employee/jobs/${job.id}`)}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-4 flex-1">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg line-clamp-1">
                      {job.title}
                      {job.matchPercentage && (
                        <span className="ml-2 text-sm bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200 px-2 py-1 rounded-full">
                          {job.matchPercentage}% match
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-muted-foreground font-medium">{job.company.name}</p>
                      {job.company.verified && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-muted-foreground">{job.company.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="default"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveJob(job.id);
                      }}
                    >
                      <Heart className={cn(
                        "h-4 w-4",
                        savedJobs.includes(job.id) ? "fill-destructive text-destructive" : "text-muted-foreground"
                      )} />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {job.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <div className={`text-xs px-2 py-1 rounded-full ${getJobTypeColor(job.type)}`}>
                    {job.type.replace('-', ' ')}
                  </div>
                  {job.isUrgent && (
                    <div className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full">
                      Urgent
                    </div>
                  )}
                  {job.isFeatured && (
                    <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                      Featured
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      {formatCurrency(job.salary.min)} - {formatCurrency(job.salary.max)}
                      {job.salary.negotiable && ' (Negotiable)'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{job.experience.min}-{job.experience.max} years</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{job.applicationsCount} applicants</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {job.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{job.skills.length - 3} more
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(job.postedAt, { month: 'short', day: 'numeric' })}
                    </p>
                    {job.isApplied ? (
                      <Button variant="outline" disabled size="default">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Applied
                      </Button>
                    ) : (
                      <Button
                        size="default"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/employee/jobs/${job.id}`);
                        }}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Apply Now
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Job Search</h1>
            <p className="text-muted-foreground mt-1">
              Discover opportunities that match your skills and preferences
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              size="default"
              onClick={() => router.push('/jobs/saved')}
            >
              <Bookmark className="h-4 w-4 mr-2" />
              Saved Jobs ({savedJobs.length})
            </Button>
            <Button variant="outline" size="default">
              <TrendingUp className="h-4 w-4 mr-2" />
              Job Alerts
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {searchStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all duration-200">
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
              <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search for jobs, companies, or skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="all">All Locations</option>
                    <option value="mumbai">Mumbai</option>
                    <option value="delhi">Delhi</option>
                    <option value="bangalore">Bangalore</option>
                    <option value="pune">Pune</option>
                    <option value="goa">Goa</option>
                  </select>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="relevance">Most Relevant</option>
                    <option value="match">Best Match</option>
                    <option value="newest">Newest First</option>
                    <option value="salary-high">Salary: High to Low</option>
                    <option value="salary-low">Salary: Low to High</option>
                    <option value="applications">Fewest Applications</option>
                  </select>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Job Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground">
              Showing {sortedJobs.length} job{sortedJobs.length !== 1 ? 's' : ''}
              {searchTerm && ` for "${searchTerm}"`}
            </p>
          </div>

          <div className="space-y-4">
            {sortedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}

            {sortedJobs.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No jobs found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or browse our featured jobs
                </p>
                <Button size="default" variant="default">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Browse Featured Jobs
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}