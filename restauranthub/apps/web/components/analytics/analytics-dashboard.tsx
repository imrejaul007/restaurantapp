'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  Clock,
  MapPin,
  Star,
  Download,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  period: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description?: string;
}

interface ChartData {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface AnalyticsDashboardProps {
  userRole: 'admin' | 'restaurant' | 'vendor' | 'employee';
  timeRange: '7d' | '30d' | '3m' | '1y';
  onTimeRangeChange: (range: '7d' | '30d' | '3m' | '1y') => void;
}

export default function AnalyticsDashboard({
  userRole,
  timeRange,
  onTimeRangeChange
}: AnalyticsDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data based on user role
  const getMetricsForRole = (): MetricCard[] => {
    switch (userRole) {
      case 'admin':
        return [
          {
            title: 'Total Revenue',
            value: '₹2.4M',
            change: 12.5,
            changeType: 'increase',
            period: 'vs last month',
            icon: DollarSign,
            color: 'text-green-600',
            description: 'Platform-wide revenue'
          },
          {
            title: 'Active Users',
            value: '15.2K',
            change: 8.2,
            changeType: 'increase',
            period: 'vs last month',
            icon: Users,
            color: 'text-blue-600',
            description: 'Monthly active users'
          },
          {
            title: 'Total Orders',
            value: '3,847',
            change: -2.1,
            changeType: 'decrease',
            period: 'vs last month',
            icon: ShoppingCart,
            color: 'text-purple-600',
            description: 'Orders processed'
          },
          {
            title: 'Marketplace GMV',
            value: '₹8.9M',
            change: 15.3,
            changeType: 'increase',
            period: 'vs last month',
            icon: Package,
            color: 'text-orange-600',
            description: 'Gross merchandise value'
          },
          {
            title: 'Job Applications',
            value: '1,234',
            change: 5.7,
            changeType: 'increase',
            period: 'vs last month',
            icon: Users,
            color: 'text-cyan-600',
            description: 'New applications'
          },
          {
            title: 'Platform Growth',
            value: '23.4%',
            change: 3.2,
            changeType: 'increase',
            period: 'vs last month',
            icon: TrendingUp,
            color: 'text-emerald-600',
            description: 'Month-over-month growth'
          }
        ];

      case 'restaurant':
        return [
          {
            title: 'Monthly Revenue',
            value: '₹145K',
            change: 18.5,
            changeType: 'increase',
            period: 'vs last month',
            icon: DollarSign,
            color: 'text-green-600',
            description: 'Total earnings'
          },
          {
            title: 'Orders Placed',
            value: '89',
            change: 12.3,
            changeType: 'increase',
            period: 'vs last month',
            icon: ShoppingCart,
            color: 'text-blue-600',
            description: 'Marketplace orders'
          },
          {
            title: 'Active Employees',
            value: '24',
            change: 2,
            changeType: 'increase',
            period: 'vs last month',
            icon: Users,
            color: 'text-purple-600',
            description: 'Team members'
          },
          {
            title: 'Job Applications',
            value: '156',
            change: 28.7,
            changeType: 'increase',
            period: 'vs last month',
            icon: Award,
            color: 'text-orange-600',
            description: 'New applications received'
          },
          {
            title: 'Average Rating',
            value: '4.8',
            change: 0.2,
            changeType: 'increase',
            period: 'vs last month',
            icon: Star,
            color: 'text-yellow-600',
            description: 'Customer satisfaction'
          },
          {
            title: 'Cost Savings',
            value: '₹32K',
            change: 15.8,
            changeType: 'increase',
            period: 'vs direct sourcing',
            icon: Target,
            color: 'text-emerald-600',
            description: 'Through marketplace'
          }
        ];

      case 'vendor':
        return [
          {
            title: 'Monthly Sales',
            value: '₹280K',
            change: 22.1,
            changeType: 'increase',
            period: 'vs last month',
            icon: DollarSign,
            color: 'text-green-600',
            description: 'Total sales volume'
          },
          {
            title: 'Orders Fulfilled',
            value: '245',
            change: 8.7,
            changeType: 'increase',
            period: 'vs last month',
            icon: Package,
            color: 'text-blue-600',
            description: 'Completed orders'
          },
          {
            title: 'Active Customers',
            value: '67',
            change: 15.2,
            changeType: 'increase',
            period: 'vs last month',
            icon: Users,
            color: 'text-purple-600',
            description: 'Regular buyers'
          },
          {
            title: 'Average Order Value',
            value: '₹1,143',
            change: 5.3,
            changeType: 'increase',
            period: 'vs last month',
            icon: TrendingUp,
            color: 'text-orange-600',
            description: 'Per order value'
          },
          {
            title: 'Fulfillment Rate',
            value: '98.2%',
            change: 1.1,
            changeType: 'increase',
            period: 'vs last month',
            icon: Target,
            color: 'text-cyan-600',
            description: 'On-time delivery'
          },
          {
            title: 'Customer Rating',
            value: '4.9',
            change: 0.1,
            changeType: 'increase',
            period: 'vs last month',
            icon: Star,
            color: 'text-yellow-600',
            description: 'Average rating'
          }
        ];

      case 'employee':
        return [
          {
            title: 'Applications Sent',
            value: '12',
            change: 3,
            changeType: 'increase',
            period: 'this month',
            icon: Users,
            color: 'text-blue-600',
            description: 'Job applications'
          },
          {
            title: 'Profile Views',
            value: '89',
            change: 15.7,
            changeType: 'increase',
            period: 'vs last month',
            icon: Activity,
            color: 'text-green-600',
            description: 'Employer views'
          },
          {
            title: 'Response Rate',
            value: '67%',
            change: 8.3,
            changeType: 'increase',
            period: 'vs last month',
            icon: TrendingUp,
            color: 'text-purple-600',
            description: 'Application responses'
          },
          {
            title: 'Skills Completed',
            value: '8',
            change: 2,
            changeType: 'increase',
            period: 'this month',
            icon: Award,
            color: 'text-orange-600',
            description: 'Training modules'
          },
          {
            title: 'Network Connections',
            value: '156',
            change: 12.5,
            changeType: 'increase',
            period: 'vs last month',
            icon: Users,
            color: 'text-cyan-600',
            description: 'Professional network'
          },
          {
            title: 'Profile Score',
            value: '85%',
            change: 5.2,
            changeType: 'increase',
            period: 'vs last month',
            icon: Target,
            color: 'text-emerald-600',
            description: 'Completeness score'
          }
        ];

      default:
        return [];
    }
  };

  const getSalesData = (): ChartData[] => {
    // Mock sales/activity data
    return [
      { label: 'Jan', value: 12000, trend: 'up' },
      { label: 'Feb', value: 19000, trend: 'up' },
      { label: 'Mar', value: 15000, trend: 'down' },
      { label: 'Apr', value: 25000, trend: 'up' },
      { label: 'May', value: 22000, trend: 'down' },
      { label: 'Jun', value: 30000, trend: 'up' },
      { label: 'Jul', value: 28000, trend: 'down' }
    ];
  };

  const getCategoryData = (): ChartData[] => {
    switch (userRole) {
      case 'admin':
        return [
          { label: 'Restaurants', value: 45, color: 'bg-blue-500', percentage: 45 },
          { label: 'Vendors', value: 30, color: 'bg-green-500', percentage: 30 },
          { label: 'Employees', value: 25, color: 'bg-purple-500', percentage: 25 }
        ];
      case 'restaurant':
        return [
          { label: 'Fresh Produce', value: 35, color: 'bg-green-500', percentage: 35 },
          { label: 'Dairy & Eggs', value: 25, color: 'bg-blue-500', percentage: 25 },
          { label: 'Meat & Poultry', value: 20, color: 'bg-red-500', percentage: 20 },
          { label: 'Dry Goods', value: 20, color: 'bg-yellow-500', percentage: 20 }
        ];
      case 'vendor':
        return [
          { label: 'Restaurants', value: 60, color: 'bg-blue-500', percentage: 60 },
          { label: 'Hotels', value: 25, color: 'bg-green-500', percentage: 25 },
          { label: 'Cafes', value: 15, color: 'bg-purple-500', percentage: 15 }
        ];
      default:
        return [];
    }
  };

  const getTopPerformers = () => {
    switch (userRole) {
      case 'admin':
        return [
          { name: 'Spice Garden Restaurant', value: '₹45K', change: 18.5 },
          { name: 'Fresh Farms Supplier', value: '₹38K', change: 12.3 },
          { name: 'Organic Vegetables Co.', value: '₹32K', change: 8.7 }
        ];
      case 'restaurant':
        return [
          { name: 'Fresh Farms Supplier', value: '₹25K', change: 22.1 },
          { name: 'Dairy Direct Ltd', value: '₹18K', change: 15.8 },
          { name: 'Meat Masters Co.', value: '₹14K', change: 11.2 }
        ];
      case 'vendor':
        return [
          { name: 'Spice Garden Restaurant', value: '₹15K', change: 25.3 },
          { name: 'Cafe Mocha Chain', value: '₹12K', change: 18.7 },
          { name: 'Grand Hotel & Resort', value: '₹9K', change: 12.5 }
        ];
      default:
        return [];
    }
  };

  const metrics = getMetricsForRole();
  const salesData = getSalesData();
  const categoryData = getCategoryData();
  const topPerformers = getTopPerformers();

  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '3m', label: '3 Months' },
    { value: '1y', label: '1 Year' }
  ];

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            {userRole === 'admin' && 'Platform-wide insights and performance metrics'}
            {userRole === 'restaurant' && 'Restaurant performance and operational insights'}
            {userRole === 'vendor' && 'Sales performance and customer analytics'}
            {userRole === 'employee' && 'Career progress and application insights'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <div className="flex items-center space-x-2">
            {timeRangeOptions.map((option) => (
              <Button
                key={option.value}
                variant={timeRange === option.value ? 'default' : 'outline'}
                
                onClick={() => onTimeRangeChange(option.value as any)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          
          <Button variant="outline"  onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          
          <Button variant="outline" >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const isSelected = selectedMetric === metric.title;
          
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  isSelected && 'ring-2 ring-primary'
                )}
                onClick={() => setSelectedMetric(isSelected ? null : metric.title)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                      <div className="flex items-baseline space-x-2">
                        <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                        <div className={cn(
                          'flex items-center space-x-1 text-sm',
                          metric.changeType === 'increase' ? 'text-green-600' :
                          metric.changeType === 'decrease' ? 'text-red-600' :
                          'text-muted-foreground'
                        )}>
                          {metric.changeType === 'increase' ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : metric.changeType === 'decrease' ? (
                            <ArrowDownRight className="h-3 w-3" />
                          ) : null}
                          <span>{Math.abs(metric.change)}%</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{metric.period}</p>
                      {metric.description && (
                        <p className="text-xs text-muted-foreground">{metric.description}</p>
                      )}
                    </div>
                    
                    <div className={cn('p-3 rounded-full bg-muted', metric.color)}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>
                {userRole === 'admin' && 'Platform Revenue Trend'}
                {userRole === 'restaurant' && 'Order Volume Trend'}
                {userRole === 'vendor' && 'Sales Performance'}
                {userRole === 'employee' && 'Application Activity'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-64 flex items-end justify-between space-x-2">
                {salesData.map((data, index) => (
                  <div key={data.label} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-primary rounded-t"
                      style={{
                        height: `${(data.value / Math.max(...salesData.map(d => d.value))) * 200}px`
                      }}
                    />
                    <div className="mt-2 text-center">
                      <p className="text-xs text-muted-foreground">{data.label}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        {data.trend === 'up' ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : data.trend === 'down' ? (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>
                {userRole === 'admin' && 'User Distribution'}
                {userRole === 'restaurant' && 'Order Categories'}
                {userRole === 'vendor' && 'Customer Types'}
                {userRole === 'employee' && 'Application Status'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.map((category, index) => (
                <div key={category.label} className="flex items-center space-x-3">
                  <div className={cn('w-4 h-4 rounded-full', category.color)} />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm font-medium">{category.label}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{category.percentage}%</span>
                      <span className="text-sm font-medium">{category.value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>
                {userRole === 'admin' && 'Top Performing Users'}
                {userRole === 'restaurant' && 'Top Suppliers'}
                {userRole === 'vendor' && 'Top Customers'}
                {userRole === 'employee' && 'Recent Applications'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((performer, index) => (
                <div key={performer.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{performer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        +{performer.change}% growth
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{performer.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: userRole === 'admin' ? 'New restaurant registered' : 'Order #1234 completed',
                  time: '2 hours ago',
                  icon: Users,
                  color: 'text-green-600'
                },
                {
                  action: userRole === 'admin' ? 'Payment processed' : 'Supplier payment received',
                  time: '4 hours ago',
                  icon: DollarSign,
                  color: 'text-blue-600'
                },
                {
                  action: userRole === 'admin' ? 'Job application submitted' : 'New supplier inquiry',
                  time: '6 hours ago',
                  icon: Clock,
                  color: 'text-orange-600'
                },
                {
                  action: userRole === 'admin' ? 'Marketplace order placed' : 'Inventory updated',
                  time: '8 hours ago',
                  icon: Package,
                  color: 'text-purple-600'
                }
              ].map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={cn('p-2 rounded-full bg-muted', activity.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals and Targets (for non-employee roles) */}
      {userRole !== 'employee' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Goals & Targets</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: userRole === 'admin' ? 'Monthly Revenue Target' : userRole === 'restaurant' ? 'Cost Savings Goal' : 'Sales Target',
                  current: userRole === 'admin' ? '₹2.4M' : userRole === 'restaurant' ? '₹32K' : '₹280K',
                  target: userRole === 'admin' ? '₹3M' : userRole === 'restaurant' ? '₹40K' : '₹300K',
                  progress: userRole === 'admin' ? 80 : userRole === 'restaurant' ? 80 : 93
                },
                {
                  title: userRole === 'admin' ? 'User Growth Target' : userRole === 'restaurant' ? 'Order Volume' : 'Customer Acquisition',
                  current: userRole === 'admin' ? '15.2K' : userRole === 'restaurant' ? '89' : '67',
                  target: userRole === 'admin' ? '20K' : userRole === 'restaurant' ? '100' : '75',
                  progress: userRole === 'admin' ? 76 : userRole === 'restaurant' ? 89 : 89
                },
                {
                  title: userRole === 'admin' ? 'Platform Adoption' : userRole === 'restaurant' ? 'Employee Satisfaction' : 'Order Fulfillment',
                  current: userRole === 'admin' ? '85%' : userRole === 'restaurant' ? '4.8' : '98.2%',
                  target: userRole === 'admin' ? '90%' : userRole === 'restaurant' ? '5.0' : '99%',
                  progress: userRole === 'admin' ? 94 : userRole === 'restaurant' ? 96 : 99
                }
              ].map((goal, index) => (
                <div key={goal.title} className="space-y-3">
                  <div>
                    <p className="font-medium text-foreground">{goal.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {goal.current} / {goal.target}
                      </span>
                      <Badge variant={goal.progress >= 90 ? 'default' : 'secondary'} className="text-xs">
                        {goal.progress}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={cn(
                          'h-2 rounded-full transition-all',
                          goal.progress >= 90 ? 'bg-green-500' :
                          goal.progress >= 70 ? 'bg-blue-500' :
                          'bg-orange-500'
                        )}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}