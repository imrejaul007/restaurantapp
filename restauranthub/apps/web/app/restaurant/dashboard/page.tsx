'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Briefcase, 
  ShoppingCart, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  DollarSign,
  Package,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Eye,
  MessageSquare,
  Star,
  MapPin,
  ChefHat
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { EmailVerificationAlert } from '@/components/auth/email-verification-alert';
import { formatCurrency, formatDate } from '@/lib/utils';

// Mock data for Restaurant Dashboard
const restaurantStats = [
  {
    title: 'Total Employees',
    value: '47',
    change: '+3',
    changeType: 'increase' as const,
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    description: '5 pending applications',
  },
  {
    title: 'Active Job Posts',
    value: '12',
    change: '+2',
    changeType: 'increase' as const,
    icon: Briefcase,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
    description: '87 total applications',
  },
  {
    title: 'Monthly Orders',
    value: '₹2,47,350',
    change: '+18%',
    changeType: 'increase' as const,
    icon: ShoppingCart,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    description: '156 orders this month',
  },
  {
    title: 'Customer Rating',
    value: '4.8',
    change: '+0.2',
    changeType: 'increase' as const,
    icon: Star,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    description: 'Based on 1,247 reviews',
  },
];

const recentApplications = [
  {
    id: '1',
    name: 'Amit Sharma',
    position: 'Head Chef',
    experience: '8 years',
    appliedAt: '2024-01-10T14:30:00Z',
    status: 'pending',
    avatar: null,
    skills: ['Indian Cuisine', 'Team Leadership', 'Menu Planning'],
  },
  {
    id: '2',
    name: 'Priya Patel',
    position: 'Sous Chef',
    experience: '5 years',
    appliedAt: '2024-01-10T11:15:00Z',
    status: 'reviewed',
    avatar: null,
    skills: ['Continental', 'Pastry', 'Food Safety'],
  },
  {
    id: '3',
    name: 'Rajesh Kumar',
    position: 'Waiter',
    experience: '3 years',
    appliedAt: '2024-01-09T16:45:00Z',
    status: 'shortlisted',
    avatar: null,
    skills: ['Customer Service', 'Hindi', 'English'],
  },
];

const recentOrders = [
  {
    id: '1',
    vendor: 'Fresh Farm Supplies',
    items: 'Vegetables, Dairy Products',
    amount: 15420,
    status: 'delivered',
    deliveryDate: '2024-01-10T10:30:00Z',
    orderDate: '2024-01-08T14:20:00Z',
  },
  {
    id: '2',
    vendor: 'Spice Garden',
    items: 'Spices, Condiments',
    amount: 8750,
    status: 'processing',
    deliveryDate: '2024-01-12T16:00:00Z',
    orderDate: '2024-01-10T09:15:00Z',
  },
  {
    id: '3',
    vendor: 'Metro Cash & Carry',
    items: 'Rice, Pulses, Oil',
    amount: 24580,
    status: 'shipped',
    deliveryDate: '2024-01-11T14:30:00Z',
    orderDate: '2024-01-09T11:45:00Z',
  },
];

const quickActions = [
  {
    title: 'Manage Jobs',
    description: 'View and manage job listings',
    icon: Briefcase,
    color: 'bg-blue-500',
    href: '/restaurant/jobs',
  },
  {
    title: 'Manage Employees',
    description: 'View and manage team members',
    icon: UserCheck,
    color: 'bg-green-500',
    href: '/restaurant/employees',
  },
  {
    title: 'Browse Marketplace',
    description: 'Find suppliers & products',
    icon: Package,
    color: 'bg-purple-500',
    href: '/restaurant/marketplace',
  },
  {
    title: 'Manage Menu',
    description: 'Update restaurant menu',
    icon: ChefHat,
    color: 'bg-orange-500',
    href: '/restaurant/menu',
  },
];

export default function RestaurantDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'shortlisted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Restaurant Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's what's happening at your restaurant.
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Last 30 days
            </Button>
            <Button size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Reports
            </Button>
          </div>
        </div>

        {/* Email Verification Alert */}
        <EmailVerificationAlert />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {restaurantStats.map((stat, index) => {
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
                          {stat.changeType === 'increase' ? (
                            <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-destructive mr-1" />
                          )}
                          <span className={`text-sm font-medium ${
                            stat.changeType === 'increase' 
                              ? 'text-success-500' 
                              : 'text-destructive'
                          }`}>
                            {stat.change}
                          </span>
                          <span className="text-sm text-muted-foreground ml-1">
                            this month
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stat.description}
                        </p>
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

        {/* Main Content Grid */}
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
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentApplications.map((application) => (
                    <div
                      key={application.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <ChefHat className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{application.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {application.position} • {application.experience}
                          </p>
                          <div className="flex items-center space-x-1 mt-1">
                            {application.skills.slice(0, 2).map((skill, index) => (
                              <span
                                key={index}
                                className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded"
                              >
                                {skill}
                              </span>
                            ))}
                            {application.skills.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{application.skills.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(application.status)}`}>
                          {application.status}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
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
                  Common tasks for your restaurant
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
                        <p className="font-medium text-sm">{action.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">
                Recent Orders
              </CardTitle>
              <Button variant="ghost" size="sm">
                <ShoppingCart className="h-4 w-4 mr-2" />
                View All Orders
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{order.vendor}</h4>
                        <p className="text-xs text-muted-foreground">{order.items}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ordered: {formatDate(order.orderDate, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(order.amount)}</p>
                      <div className={`text-xs px-2 py-1 rounded-full mt-1 ${getStatusColor(order.status)}`}>
                        {order.status}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        ETA: {formatDate(order.deliveryDate, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}