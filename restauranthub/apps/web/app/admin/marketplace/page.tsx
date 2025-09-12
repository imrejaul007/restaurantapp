'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Package,
  Store,
  TrendingUp,
  Star,
  Award,
  Users,
  DollarSign,
  ShoppingCart,
  Eye,
  BarChart3,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { autoCategorization, convertToAnalytics, AdminCategorizationUtils } from '@/lib/admin-categorization';
import { mockVendors, mockProducts } from '@/data/marketplace-data';

export default function MarketplaceDashboard() {
  // Generate analytics data
  const productAnalytics = mockProducts.map(product => convertToAnalytics(product, 'product'));
  const vendorAnalytics = mockVendors.map(vendor => convertToAnalytics(vendor, 'vendor'));
  
  const productResults = autoCategorization.batchAnalyze(productAnalytics);
  const vendorResults = autoCategorization.batchAnalyze(vendorAnalytics);
  
  const productStats = AdminCategorizationUtils.getSummaryStats(productResults);
  const vendorStats = AdminCategorizationUtils.getSummaryStats(vendorResults);

  // Calculate overall metrics
  const totalRevenue = productAnalytics.reduce((sum, p) => sum + p.currentMetrics.revenue, 0) +
                      vendorAnalytics.reduce((sum, v) => sum + v.currentMetrics.revenue, 0);
  
  const totalViews = productAnalytics.reduce((sum, p) => sum + p.currentMetrics.views, 0) +
                    vendorAnalytics.reduce((sum, v) => sum + v.currentMetrics.views, 0);

  const automationRate = Math.round(
    ((productStats.trending.auto + vendorStats.trending.auto) / 
     (productStats.total + vendorStats.total)) * 100
  );

  const quickActions = [
    {
      title: 'Manage Categories',
      description: 'Add, edit, and organize marketplace categories',
      href: '/admin/marketplace/categories',
      icon: Package,
      color: 'bg-blue-500 hover:bg-blue-600',
      stats: `${mockProducts.length + mockVendors.length} items`
    },
    {
      title: 'Product Management',
      description: 'Control trending, new, and bestseller promotions',
      href: '/admin/marketplace/products',
      icon: Store,
      color: 'bg-green-500 hover:bg-green-600',
      stats: `${productStats.trending.total} promoted`
    },
    {
      title: 'Vendor Management',
      description: 'Manage vendor profiles and promotions',
      href: '/admin/marketplace/vendors',
      icon: Users,
      color: 'bg-purple-500 hover:bg-purple-600',
      stats: `${vendorStats.trending.total} featured`
    },
    {
      title: 'Orders & Analytics',
      description: 'View sales data and performance metrics',
      href: '/admin/marketplace/orders',
      icon: BarChart3,
      color: 'bg-orange-500 hover:bg-orange-600',
      stats: `$${(totalRevenue / 1000).toFixed(0)}K revenue`
    }
  ];

  const alertItems = [
    {
      type: 'success',
      icon: CheckCircle,
      title: `${productStats.trending.auto} products auto-promoted`,
      description: 'Automatic trending detection is working well',
      time: '2 minutes ago'
    },
    {
      type: 'warning',
      icon: AlertCircle,
      title: `${productStats.recommendations} optimization opportunities`,
      description: 'Several items could benefit from promotion',
      time: '1 hour ago'
    },
    {
      type: 'info',
      icon: TrendingUp,
      title: `${vendorStats.alerts} vendor performance alerts`,
      description: 'Some vendors showing significant growth',
      time: '3 hours ago'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketplace Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Intelligent marketplace management with automated categorization
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Auto Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Products</CardTitle>
            <div className="text-3xl font-bold">{productStats.total}</div>
            <p className="text-xs opacity-80">
              {productStats.trending.total} promoted • {productStats.active} active
            </p>
          </CardHeader>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Vendors</CardTitle>
            <div className="text-3xl font-bold">{vendorStats.total}</div>
            <p className="text-xs opacity-80">
              {vendorStats.trending.total} featured • {vendorStats.active} active
            </p>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Revenue</CardTitle>
            <div className="text-3xl font-bold">${(totalRevenue / 1000000).toFixed(1)}M</div>
            <p className="text-xs opacity-80">
              {((totalRevenue / 1000000) * 0.15).toFixed(1)}M this month
            </p>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Automation Rate</CardTitle>
            <div className="text-3xl font-bold">{automationRate}%</div>
            <p className="text-xs opacity-80">
              {productStats.trending.auto + vendorStats.trending.auto} auto-promoted
            </p>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Product Performance
            </CardTitle>
            <CardDescription>Automated and manual promotion statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Trending Products</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {productStats.trending.auto} auto
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {productStats.trending.manual} manual
                  </Badge>
                  <span className="font-medium">{productStats.trending.total}</span>
                </div>
              </div>
              <Progress 
                value={(productStats.trending.total / productStats.total) * 100} 
                className="h-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">New Products</span>
                </div>
                <span className="font-medium">{productStats.new.total}</span>
              </div>
              <Progress 
                value={(productStats.new.total / productStats.total) * 100} 
                className="h-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Best Sellers</span>
                </div>
                <span className="font-medium">{productStats.bestSellers.total}</span>
              </div>
              <Progress 
                value={(productStats.bestSellers.total / productStats.total) * 100} 
                className="h-2"
              />
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Auto-confidence avg.</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${productStats.avgConfidence}%` }}
                    />
                  </div>
                  <span className="font-medium">{productStats.avgConfidence}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendor Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Vendor Performance
            </CardTitle>
            <CardDescription>Vendor promotion and engagement metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Trending Vendors</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {vendorStats.trending.auto} auto
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {vendorStats.trending.manual} manual
                  </Badge>
                  <span className="font-medium">{vendorStats.trending.total}</span>
                </div>
              </div>
              <Progress 
                value={(vendorStats.trending.total / vendorStats.total) * 100} 
                className="h-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">New Vendors</span>
                </div>
                <span className="font-medium">{vendorStats.new.total}</span>
              </div>
              <Progress 
                value={(vendorStats.new.total / vendorStats.total) * 100} 
                className="h-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Top Rated</span>
                </div>
                <span className="font-medium">{vendorStats.bestSellers.total}</span>
              </div>
              <Progress 
                value={(vendorStats.bestSellers.total / vendorStats.total) * 100} 
                className="h-2"
              />
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Auto-confidence avg.</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${vendorStats.avgConfidence}%` }}
                    />
                  </div>
                  <span className="font-medium">{vendorStats.avgConfidence}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Fast access to key marketplace management tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-lg text-white ${action.color} transition-all cursor-pointer group`}
                    >
                      <div className="flex items-start space-x-3">
                        <Icon className="h-6 w-6 mt-0.5 group-hover:scale-110 transition-transform" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
                          <p className="text-xs opacity-90 mb-2">{action.description}</p>
                          <div className="text-xs opacity-75">{action.stats}</div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              System Alerts
            </CardTitle>
            <CardDescription>Recent automated categorization alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alertItems.map((alert, index) => {
                const Icon = alert.icon;
                const colorClasses = {
                  success: 'text-green-600 bg-green-100',
                  warning: 'text-yellow-600 bg-yellow-100',
                  info: 'text-blue-600 bg-blue-100'
                };
                
                return (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full ${colorClasses[alert.type as keyof typeof colorClasses]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">{alert.title}</h4>
                      <p className="text-xs text-gray-600 mb-1">{alert.description}</p>
                      <div className="text-xs text-gray-500">{alert.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Marketplace Activity Summary
          </CardTitle>
          <CardDescription>Overview of recent marketplace activities and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {(totalViews / 1000).toFixed(1)}K
              </div>
              <div className="text-sm text-gray-600">Total Views</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(productAnalytics.reduce((sum, p) => sum + p.currentMetrics.orders, 0) / 100) * 100}
              </div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{automationRate}%</div>
              <div className="text-sm text-gray-600">Auto Success Rate</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                ${(totalRevenue / 1000000).toFixed(2)}M
              </div>
              <div className="text-sm text-gray-600">Revenue Generated</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}