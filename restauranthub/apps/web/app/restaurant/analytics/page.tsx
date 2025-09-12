'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  Download,
  BarChart3,
  MapPin,
  Calendar,
  ArrowUp,
  ArrowDown,
  Filter,
  Search,
  Briefcase,
  UserCheck,
  Target,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

interface JobAnalytics {
  overview: {
    totalJobs: number;
    activeJobs: number;
    totalViews: number;
    totalApplications: number;
    applicationRate: number;
    hireRate: number;
  };
  jobPerformance: Array<{
    id: string;
    title: string;
    views: number;
    applications: number;
    applicationRate: number;
    status: 'active' | 'paused' | 'closed';
    postedDate: string;
    category: string;
  }>;
  hiringFunnel: {
    applications: number;
    screening: number;
    interviews: number;
    offers: number;
    hired: number;
  };
  trafficSources: Array<{
    source: string;
    percentage: number;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  demographics: {
    experienceLevel: Array<{
      level: string;
      count: number;
      percentage: number;
    }>;
    locations: Array<{
      city: string;
      count: number;
      percentage: number;
    }>;
  };
}

export default function JobAnalyticsPage() {
  const [timeframe, setTimeframe] = useState('month');
  const [analytics, setAnalytics] = useState<JobAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        // Mock job analytics data
        const mockAnalytics: JobAnalytics = {
          overview: {
            totalJobs: 24,
            activeJobs: 18,
            totalViews: 3420,
            totalApplications: 287,
            applicationRate: 8.4,
            hireRate: 12.5
          },
          jobPerformance: [
            {
              id: '1',
              title: 'Senior Head Chef',
              views: 456,
              applications: 34,
              applicationRate: 7.5,
              status: 'active',
              postedDate: '2024-01-10',
              category: 'Kitchen Staff'
            },
            {
              id: '2',
              title: 'Restaurant Manager',
              views: 392,
              applications: 28,
              applicationRate: 7.1,
              status: 'active',
              postedDate: '2024-01-08',
              category: 'Management'
            },
            {
              id: '3',
              title: 'Server - Weekend Shifts',
              views: 298,
              applications: 45,
              applicationRate: 15.1,
              status: 'active',
              postedDate: '2024-01-12',
              category: 'Front of House'
            },
            {
              id: '4',
              title: 'Bartender',
              views: 234,
              applications: 22,
              applicationRate: 9.4,
              status: 'paused',
              postedDate: '2024-01-05',
              category: 'Front of House'
            },
            {
              id: '5',
              title: 'Sous Chef',
              views: 187,
              applications: 18,
              applicationRate: 9.6,
              status: 'closed',
              postedDate: '2024-01-02',
              category: 'Kitchen Staff'
            }
          ],
          hiringFunnel: {
            applications: 287,
            screening: 156,
            interviews: 89,
            offers: 34,
            hired: 18
          },
          trafficSources: [
            { source: 'Direct Search', percentage: 35, count: 1197, trend: 'up' },
            { source: 'Job Portals', percentage: 28, count: 958, trend: 'stable' },
            { source: 'Social Media', percentage: 22, count: 752, trend: 'up' },
            { source: 'Company Website', percentage: 15, count: 513, trend: 'down' }
          ],
          demographics: {
            experienceLevel: [
              { level: 'Entry Level', count: 89, percentage: 31 },
              { level: '1-3 Years', count: 126, percentage: 44 },
              { level: '3-5 Years', count: 45, percentage: 16 },
              { level: '5+ Years', count: 27, percentage: 9 }
            ],
            locations: [
              { city: 'Mumbai', count: 98, percentage: 34 },
              { city: 'Delhi', count: 75, percentage: 26 },
              { city: 'Bangalore', count: 52, percentage: 18 },
              { city: 'Chennai', count: 34, percentage: 12 },
              { city: 'Others', count: 28, percentage: 10 }
            ]
          }
        };
        
        setAnalytics(mockAnalytics);
      } catch (error) {
        console.error('Failed to fetch job analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeframe]);

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    format = 'number',
    subtitle
  }: {
    title: string;
    value: number;
    change?: number;
    icon: React.ElementType;
    format?: 'number' | 'percentage';
    subtitle?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center space-x-2">
              <h3 className="text-2xl font-bold">
                {format === 'percentage' ? `${value.toFixed(1)}%` : value.toLocaleString()}
              </h3>
              {change !== undefined && (
                <Badge variant={change >= 0 ? "default" : "destructive"} className="text-xs">
                  {change >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                  {Math.abs(change).toFixed(1)}%
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!analytics) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load analytics</h3>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Job Analytics</h1>
            <p className="text-muted-foreground">Track your job posting performance and hiring metrics</p>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <MetricCard
              title="Total Jobs"
              value={analytics.overview.totalJobs}
              icon={Briefcase}
              subtitle={`${analytics.overview.activeJobs} active`}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <MetricCard
              title="Total Views"
              value={analytics.overview.totalViews}
              change={15.3}
              icon={Eye}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <MetricCard
              title="Applications"
              value={analytics.overview.totalApplications}
              change={8.7}
              icon={Users}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <MetricCard
              title="Application Rate"
              value={analytics.overview.applicationRate}
              change={2.1}
              icon={Target}
              format="percentage"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <MetricCard
              title="Hire Rate"
              value={analytics.overview.hireRate}
              change={-1.3}
              icon={UserCheck}
              format="percentage"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <MetricCard
              title="Time to Hire"
              value={14}
              change={-5.2}
              icon={Clock}
              subtitle="days average"
            />
          </motion.div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Job Performance</TabsTrigger>
            <TabsTrigger value="funnel">Hiring Funnel</TabsTrigger>
            <TabsTrigger value="sources">Traffic Sources</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
          </TabsList>

          {/* Job Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Individual Job Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.jobPerformance.map((job, index) => (
                      <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium">{job.title}</h4>
                            <Badge 
                              variant={job.status === 'active' ? 'default' : job.status === 'paused' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {job.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {job.category}
                            </Badge>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground space-x-4">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Posted {new Date(job.postedDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-8 text-sm">
                          <div className="text-center">
                            <div className="font-semibold">{job.views.toLocaleString()}</div>
                            <div className="text-muted-foreground">Views</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{job.applications}</div>
                            <div className="text-muted-foreground">Applications</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{job.applicationRate.toFixed(1)}%</div>
                            <div className="text-muted-foreground">App. Rate</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Hiring Funnel Tab */}
          <TabsContent value="funnel" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Hiring Funnel Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.entries(analytics.hiringFunnel).map(([stage, count], index) => {
                      const percentage = (count / analytics.hiringFunnel.applications) * 100;
                      const stageNames = {
                        applications: 'Applications Received',
                        screening: 'Passed Screening',
                        interviews: 'Interviewed',
                        offers: 'Offers Extended',
                        hired: 'Successfully Hired'
                      };
                      
                      return (
                        <div key={stage} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{stageNames[stage as keyof typeof stageNames]}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold">{count}</span>
                              <span className="text-sm text-muted-foreground">
                                ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                          <Progress value={percentage} className="h-3" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Traffic Sources Tab */}
          <TabsContent value="sources" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Search className="h-5 w-5 mr-2" />
                    Traffic Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {analytics.trafficSources.map((source, index) => (
                      <div key={source.source} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{source.source}</h4>
                            <Badge 
                              variant={source.trend === 'up' ? 'default' : source.trend === 'down' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {source.trend === 'up' ? <ArrowUp className="h-3 w-3 mr-1" /> : 
                               source.trend === 'down' ? <ArrowDown className="h-3 w-3 mr-1" /> : ''}
                              {source.trend}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {source.count.toLocaleString()} views
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{source.percentage}%</div>
                          <Progress value={source.percentage} className="w-20 h-2 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Demographics Tab */}
          <TabsContent value="demographics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Experience Level */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Experience Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analytics.demographics.experienceLevel.map((level) => (
                      <div key={level.level} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{level.level}</span>
                          <span className="text-sm text-muted-foreground">
                            {level.count} ({level.percentage}%)
                          </span>
                        </div>
                        <Progress value={level.percentage} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Geographic Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Geographic Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analytics.demographics.locations.map((location) => (
                      <div key={location.city} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{location.city}</span>
                          <span className="text-sm text-muted-foreground">
                            {location.count} ({location.percentage}%)
                          </span>
                        </div>
                        <Progress value={location.percentage} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}