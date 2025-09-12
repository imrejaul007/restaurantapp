'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Star,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Truck,
  BarChart3,
  FileText,
  MessageSquare,
  Calendar,
  ArrowUpRight,
  Box
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { EmailVerificationAlert } from '@/components/auth/email-verification-alert';
import { formatCurrency, formatDate, formatNumber, cn } from '@/lib/utils';

interface Order {
  id: string;
  customer: {
    name: string;
    type: 'restaurant' | 'hotel' | 'individual';
    avatar?: string;
  };
  items: {
    name: string;
    quantity: number;
    unit: string;
  }[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  placedAt: string;
  deliveryDate: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
}

interface Product {
  id: string;
  name: string;
  category: string;
  stockQuantity: number;
  lowStockThreshold: number;
  price: number;
  salesCount: number;
  revenue: number;
  status: 'active' | 'inactive' | 'out-of-stock';
}

interface Review {
  id: string;
  customer: string;
  product: string;
  rating: number;
  comment: string;
  createdAt: string;
  verified: boolean;
}

const vendorStats = [
  {
    title: 'Monthly Revenue',
    value: '₹2,47,350',
    change: '+18%',
    changeType: 'increase' as const,
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
    description: 'vs last month',
  },
  {
    title: 'Total Orders',
    value: '156',
    change: '+12',
    changeType: 'increase' as const,
    icon: ShoppingCart,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    description: 'this month',
  },
  {
    title: 'Active Products',
    value: '89',
    change: '+5',
    changeType: 'increase' as const,
    icon: Package,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    description: 'in catalog',
  },
  {
    title: 'Customer Rating',
    value: '4.6',
    change: '+0.3',
    changeType: 'increase' as const,
    icon: Star,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
    description: 'average rating',
  },
];

const mockOrders: Order[] = [
  {
    id: '1',
    customer: {
      name: 'Royal Kitchen Restaurant',
      type: 'restaurant'
    },
    items: [
      { name: 'Premium Basmati Rice', quantity: 50, unit: 'kg' },
      { name: 'Organic Spices Mix', quantity: 5, unit: 'kg' }
    ],
    totalAmount: 15420,
    status: 'processing',
    placedAt: '2024-01-10T09:30:00Z',
    deliveryDate: '2024-01-12T16:00:00Z',
    paymentStatus: 'paid'
  },
  {
    id: '2',
    customer: {
      name: 'Grand Hotel Palace',
      type: 'hotel'
    },
    items: [
      { name: 'Fresh Vegetables Combo', quantity: 25, unit: 'kg' }
    ],
    totalAmount: 8750,
    status: 'shipped',
    placedAt: '2024-01-09T14:15:00Z',
    deliveryDate: '2024-01-11T10:30:00Z',
    paymentStatus: 'paid'
  },
  {
    id: '3',
    customer: {
      name: 'Mumbai Bistro',
      type: 'restaurant'
    },
    items: [
      { name: 'Sunflower Oil', quantity: 20, unit: 'liter' },
      { name: 'Wheat Flour', quantity: 30, unit: 'kg' }
    ],
    totalAmount: 12300,
    status: 'confirmed',
    placedAt: '2024-01-08T11:45:00Z',
    deliveryDate: '2024-01-13T14:00:00Z',
    paymentStatus: 'paid'
  },
];

const mockLowStockProducts: Product[] = [
  {
    id: '1',
    name: 'Organic Turmeric Powder',
    category: 'Spices',
    stockQuantity: 15,
    lowStockThreshold: 20,
    price: 180,
    salesCount: 45,
    revenue: 8100,
    status: 'active'
  },
  {
    id: '2',
    name: 'Premium Cashews',
    category: 'Dry Fruits',
    stockQuantity: 8,
    lowStockThreshold: 25,
    price: 850,
    salesCount: 23,
    revenue: 19550,
    status: 'active'
  },
  {
    id: '3',
    name: 'Fresh Ginger',
    category: 'Vegetables',
    stockQuantity: 0,
    lowStockThreshold: 50,
    price: 120,
    salesCount: 67,
    revenue: 8040,
    status: 'out-of-stock'
  },
];

const mockReviews: Review[] = [
  {
    id: '1',
    customer: 'Amit Sharma',
    product: 'Premium Basmati Rice',
    rating: 5,
    comment: 'Excellent quality rice! Perfect for our restaurant\'s biryanis. Will definitely order again.',
    createdAt: '2024-01-09T16:30:00Z',
    verified: true
  },
  {
    id: '2',
    customer: 'Hotel Manager',
    product: 'Fresh Vegetables Combo',
    rating: 4,
    comment: 'Good quality vegetables, delivered fresh and on time. Packaging was excellent.',
    createdAt: '2024-01-08T10:15:00Z',
    verified: true
  },
  {
    id: '3',
    customer: 'Restaurant Owner',
    product: 'Organic Spices Mix',
    rating: 5,
    comment: 'Amazing aroma and authentic taste. Our customers love the dishes made with these spices!',
    createdAt: '2024-01-07T14:20:00Z',
    verified: true
  },
];

export default function VendorDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const router = useRouter();
  
  const quickActions = [
    { icon: Package, label: 'Add Product', href: '/vendor/products', color: 'bg-blue-500' },
    { icon: ShoppingCart, label: 'View Orders', href: '/vendor/orders', color: 'bg-green-500' },
    { icon: TrendingUp, label: 'Analytics', href: '/vendor/analytics', color: 'bg-purple-500' },
    { icon: Star, label: 'Reviews', href: '/vendor/reviews', color: 'bg-orange-500' },
  ];

  const getOrderStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'processing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'shipped':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getOrderStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'processing':
        return <Package className="h-4 w-4 text-purple-600" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-orange-600" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCustomerTypeIcon = (type: Order['customer']['type']) => {
    switch (type) {
      case 'restaurant':
        return '🍽️';
      case 'hotel':
        return '🏨';
      case 'individual':
        return '👤';
      default:
        return '🏢';
    }
  };

  const getStockStatusColor = (product: Product) => {
    if (product.stockQuantity === 0) {
      return 'bg-destructive text-destructive-foreground';
    } else if (product.stockQuantity <= product.lowStockThreshold) {
      return 'bg-warning text-warning-foreground';
    }
    return 'bg-success text-success-foreground';
  };

  const getStockStatusText = (product: Product) => {
    if (product.stockQuantity === 0) {
      return 'Out of Stock';
    } else if (product.stockQuantity <= product.lowStockThreshold) {
      return 'Low Stock';
    }
    return 'In Stock';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Vendor Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your inventory, orders, and track business performance
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Last 30 days
            </Button>
            <Button size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </div>

        {/* Email Verification Alert */}
        <EmailVerificationAlert />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {vendorStats.map((stat, index) => {
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
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">
                    Recent Orders
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-lg">
                          {getCustomerTypeIcon(order.customer.type)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-sm">{order.customer.name}</h4>
                            {getOrderStatusIcon(order.status)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''} • 
                            {formatCurrency(order.totalAmount)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Placed: {formatDate(order.placedAt, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs px-2 py-1 rounded-full mb-2 ${getOrderStatusColor(order.status)}`}>
                          {order.status}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Delivery: {formatDate(order.deliveryDate, { month: 'short', day: 'numeric' })}
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
                  Common vendor tasks
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

        {/* Low Stock Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-warning-500" />
                <CardTitle className="text-lg font-semibold">
                  Inventory Alerts
                </CardTitle>
              </div>
              <Button variant="ghost" size="sm">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Manage Inventory
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockLowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{product.name}</h4>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Stock: {product.stockQuantity} units
                          </span>
                          <div className={`text-xs px-2 py-1 rounded-full ${getStockStatusColor(product)}`}>
                            {getStockStatusText(product)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(product.price)}</p>
                      <p className="text-xs text-muted-foreground">
                        Revenue: {formatCurrency(product.revenue)}
                      </p>
                      <Button size="sm" variant="outline" className="mt-2">
                        Restock
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">
                Recent Reviews
              </CardTitle>
              <Button variant="ghost" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                View All Reviews
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockReviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-sm">{review.customer}</p>
                            {review.verified && (
                              <CheckCircle className="h-4 w-4 text-success-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{review.product}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-4 w-4",
                              i < review.rating 
                                ? "fill-yellow-400 text-yellow-400" 
                                : "text-muted-foreground"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(review.createdAt, { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
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