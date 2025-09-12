'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Users, ShoppingBag, Clock, Star, Calendar, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function RestaurantAnalytics() {
  const [timeframe, setTimeframe] = useState('week');
  
  const analytics = {
    revenue: {
      current: 15420.50,
      previous: 13890.25,
      change: 11.0,
      target: 18000
    },
    orders: {
      current: 342,
      previous: 298,
      change: 14.8,
      target: 400
    },
    customers: {
      current: 1247,
      previous: 1098,
      change: 13.6,
      target: 1500
    },
    avgOrderValue: {
      current: 45.09,
      previous: 46.60,
      change: -3.2,
      target: 50.00
    },
    topItems: [
      { name: 'Margherita Pizza', orders: 89, revenue: 1690.11, trend: 'up' },
      { name: 'Caesar Salad', orders: 67, revenue: 869.33, trend: 'up' },
      { name: 'Pasta Carbonara', orders: 54, revenue: 1134.00, trend: 'down' },
      { name: 'Grilled Chicken', orders: 43, revenue: 946.50, trend: 'up' },
      { name: 'Tiramisu', orders: 38, revenue: 304.00, trend: 'stable' }
    ],
    hourlyData: [
      { hour: '11:00', orders: 12, revenue: 540 },
      { hour: '12:00', orders: 28, revenue: 1260 },
      { hour: '13:00', orders: 45, revenue: 2025 },
      { hour: '14:00', orders: 38, revenue: 1710 },
      { hour: '15:00', orders: 22, revenue: 990 },
      { hour: '16:00', orders: 15, revenue: 675 },
      { hour: '17:00', orders: 32, revenue: 1440 },
      { hour: '18:00', orders: 52, revenue: 2340 },
      { hour: '19:00', orders: 68, revenue: 3060 },
      { hour: '20:00', orders: 58, revenue: 2610 },
      { hour: '21:00', orders: 35, revenue: 1575 },
      { hour: '22:00', orders: 18, revenue: 810 }
    ],
    customerSatisfaction: {
      rating: 4.7,
      reviews: 156,
      breakdown: {
        5: 78,
        4: 45,
        3: 23,
        2: 7,
        1: 3
      }
    }
  };

  const MetricCard = ({ title, value, change, target, icon: Icon, format = 'number' }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-center space-x-2 mt-2">
              <h3 className="text-2xl font-bold">
                {format === 'currency' ? `$${value.toLocaleString()}` : value.toLocaleString()}
              </h3>
              <Badge variant={change >= 0 ? "default" : "destructive"} className="text-xs">
                {change >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                {Math.abs(change).toFixed(1)}%
              </Badge>
            </div>
            {target && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress to target</span>
                  <span>{((value / target) * 100).toFixed(0)}%</span>
                </div>
                <Progress value={(value / target) * 100} className="h-2" />
              </div>
            )}
          </div>
          <div className="p-3 bg-blue-50 rounded-full">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Track your restaurant's performance</p>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <MetricCard
              title="Revenue"
              value={analytics.revenue.current}
              change={analytics.revenue.change}
              target={analytics.revenue.target}
              icon={DollarSign}
              format="currency"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <MetricCard
              title="Orders"
              value={analytics.orders.current}
              change={analytics.orders.change}
              target={analytics.orders.target}
              icon={ShoppingBag}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <MetricCard
              title="Customers"
              value={analytics.customers.current}
              change={analytics.customers.change}
              target={analytics.customers.target}
              icon={Users}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <MetricCard
              title="Avg Order Value"
              value={analytics.avgOrderValue.current}
              change={analytics.avgOrderValue.change}
              target={analytics.avgOrderValue.target}
              icon={TrendingUp}
              format="currency"
            />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Sales Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Hourly Sales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.hourlyData.map((data, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-16 text-sm font-medium">{data.hour}</div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{data.orders} orders</span>
                            <span>${data.revenue}</span>
                          </div>
                          <Progress value={(data.revenue / 3000) * 100} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Menu Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Top Menu Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-600">{item.orders} orders</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${item.revenue.toLocaleString()}</div>
                          <Badge 
                            variant={item.trend === 'up' ? 'default' : item.trend === 'down' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {item.trend === 'up' ? <ArrowUp className="h-3 w-3 mr-1" /> : 
                             item.trend === 'down' ? <ArrowDown className="h-3 w-3 mr-1" /> : ''}
                            {item.trend}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="space-y-6">
            {/* Customer Satisfaction */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2 text-yellow-500" />
                    Customer Satisfaction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-yellow-600">{analytics.customerSatisfaction.rating}</div>
                    <div className="text-sm text-gray-600">{analytics.customerSatisfaction.reviews} reviews</div>
                  </div>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(rating => {
                      const count = analytics.customerSatisfaction.breakdown[rating as keyof typeof analytics.customerSatisfaction.breakdown];
                      const percentage = (count / analytics.customerSatisfaction.reviews) * 100;
                      return (
                        <div key={rating} className="flex items-center space-x-2 text-sm">
                          <span className="w-8">{rating}★</span>
                          <Progress value={percentage} className="flex-1 h-2" />
                          <span className="w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Peak Hour</span>
                    <span className="font-semibold">7:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Prep Time</span>
                    <span className="font-semibold">18 min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Order Accuracy</span>
                    <span className="font-semibold">98.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Return Rate</span>
                    <span className="font-semibold">67%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Staff Efficiency</span>
                    <span className="font-semibold">94%</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Goals */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Goals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Revenue Target</span>
                      <span>85.7%</span>
                    </div>
                    <Progress value={85.7} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Customer Growth</span>
                      <span>83.1%</span>
                    </div>
                    <Progress value={83.1} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Order Volume</span>
                      <span>85.5%</span>
                    </div>
                    <Progress value={85.5} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}