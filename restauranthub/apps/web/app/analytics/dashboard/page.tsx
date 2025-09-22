'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Star,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Target,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('all');
  
  // Mock data - in real app this would come from API
  const analytics = {
    overview: {
      totalRevenue: 15420.50,
      revenueChange: 12.5,
      totalOrders: 287,
      ordersChange: 8.3,
      newCustomers: 45,
      customersChange: -2.1,
      averageRating: 4.7,
      ratingChange: 3.2
    },
    chartData: {
      revenue: [
        { period: 'Mon', value: 2400 },
        { period: 'Tue', value: 1398 },
        { period: 'Wed', value: 9800 },
        { period: 'Thu', value: 3908 },
        { period: 'Fri', value: 4800 },
        { period: 'Sat', value: 3800 },
        { period: 'Sun', value: 4300 }
      ],
      orders: [
        { period: 'Mon', value: 45 },
        { period: 'Tue', value: 38 },
        { period: 'Wed', value: 62 },
        { period: 'Thu', value: 41 },
        { period: 'Fri', value: 55 },
        { period: 'Sat', value: 48 },
        { period: 'Sun', value: 52 }
      ]
    },
    topRestaurants: [
      {
        id: 1,
        name: 'Bella Vista Italian',
        revenue: 4250,
        orders: 89,
        rating: 4.8,
        growth: 15.2
      },
      {
        id: 2,
        name: 'Tokyo Sushi Bar',
        revenue: 3890,
        orders: 76,
        rating: 4.6,
        growth: 8.7
      },
      {
        id: 3,
        name: 'Green Garden Cafe',
        revenue: 2340,
        orders: 54,
        rating: 4.9,
        growth: 22.1
      }
    ],
    customerSegments: [
      { segment: 'New Customers', count: 45, percentage: 18 },
      { segment: 'Returning Customers', count: 156, percentage: 62 },
      { segment: 'VIP Customers', count: 32, percentage: 13 },
      { segment: 'Inactive Customers', count: 18, percentage: 7 }
    ],
    goals: [
      {
        title: 'Monthly Revenue Target',
        current: 15420,
        target: 20000,
        percentage: 77
      },
      {
        title: 'Customer Acquisition',
        current: 45,
        target: 60,
        percentage: 75
      },
      {
        title: 'Average Order Value',
        current: 53.70,
        target: 60,
        percentage: 89
      }
    ]
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Track your business performance and insights</p>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Today</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <h3 className="text-2xl font-bold mt-2">
                      {formatCurrency(analytics.overview.totalRevenue)}
                    </h3>
                    <div className="flex items-center mt-2">
                      {getChangeIcon(analytics.overview.revenueChange)}
                      <span className={`text-sm ml-1 ${getChangeColor(analytics.overview.revenueChange)}`}>
                        {Math.abs(analytics.overview.revenueChange)}% vs last period
                      </span>
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <h3 className="text-2xl font-bold mt-2">{analytics.overview.totalOrders}</h3>
                    <div className="flex items-center mt-2">
                      {getChangeIcon(analytics.overview.ordersChange)}
                      <span className={`text-sm ml-1 ${getChangeColor(analytics.overview.ordersChange)}`}>
                        {Math.abs(analytics.overview.ordersChange)}% vs last period
                      </span>
                    </div>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">New Customers</p>
                    <h3 className="text-2xl font-bold mt-2">{analytics.overview.newCustomers}</h3>
                    <div className="flex items-center mt-2">
                      {getChangeIcon(analytics.overview.customersChange)}
                      <span className={`text-sm ml-1 ${getChangeColor(analytics.overview.customersChange)}`}>
                        {Math.abs(analytics.overview.customersChange)}% vs last period
                      </span>
                    </div>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <h3 className="text-2xl font-bold mt-2">{analytics.overview.averageRating}</h3>
                    <div className="flex items-center mt-2">
                      {getChangeIcon(analytics.overview.ratingChange)}
                      <span className={`text-sm ml-1 ${getChangeColor(analytics.overview.ratingChange)}`}>
                        {Math.abs(analytics.overview.ratingChange)}% vs last period
                      </span>
                    </div>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between space-x-2">
                  {analytics.chartData.revenue.map((data, index) => (
                    <div key={index} className="flex flex-col items-center space-y-2">
                      <div 
                        className="bg-blue-500 rounded-t min-w-8 transition-all duration-300 hover:bg-blue-600"
                        style={{ 
                          height: `${(data.value / Math.max(...analytics.chartData.revenue.map(d => d.value))) * 200}px` 
                        }}
                        title={`${data.period}: ${formatCurrency(data.value)}`}
                      ></div>
                      <span className="text-xs text-gray-600">{data.period}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Restaurants */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Top Restaurants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topRestaurants.map((restaurant, index) => (
                    <div key={restaurant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-blue-500">{index + 1}</Badge>
                          <h4 className="font-medium text-sm">{restaurant.name}</h4>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600">
                          <span>{formatCurrency(restaurant.revenue)}</span>
                          <span>{restaurant.orders} orders</span>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-400 mr-1" />
                            <span>{restaurant.rating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getChangeColor(restaurant.growth)}`}>
                          +{restaurant.growth}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Segments */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Customer Segments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.customerSegments.map((segment, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{segment.segment}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{segment.count}</span>
                          <span className="text-xs text-gray-500">({segment.percentage}%)</span>
                        </div>
                      </div>
                      <Progress value={segment.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Goals & Targets */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Goals & Targets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.goals.map((goal, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{goal.title}</span>
                        <span className="text-xs text-gray-500">
                          {typeof goal.current === 'number' && goal.current > 100 
                            ? formatCurrency(goal.current) 
                            : goal.current}
                          {' / '}
                          {typeof goal.target === 'number' && goal.target > 100 
                            ? formatCurrency(goal.target) 
                            : goal.target}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={goal.percentage} className="h-2 flex-1" />
                        <span className="text-xs font-medium">{goal.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <BarChart3 className="h-6 w-6" />
                  <span className="text-sm">View Reports</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <Download className="h-6 w-6" />
                  <span className="text-sm">Export Data</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <Target className="h-6 w-6" />
                  <span className="text-sm">Set Goals</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <Filter className="h-6 w-6" />
                  <span className="text-sm">Custom Filter</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}