'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Package,
  Star,
  Eye,
  MoreHorizontal,
  Badge as BadgeIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth/auth-provider';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  minOrderQty: number;
  maxOrderQty?: number;
  unit: string;
  tags: string[];
  discount?: number;
  status: 'active' | 'inactive' | 'pending';
  views: number;
  orders: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

// No vendor product management endpoint exists yet on the backend.
// Products state starts empty; the Add Product flow will populate it once the API is ready.

const categories = [
  'All Categories',
  'Fresh Produce',
  'Grains & Cereals',
  'Spices & Seasonings',
  'Oils & Fats',
  'Dairy Products',
  'Meat & Poultry',
  'Beverages',
  'Kitchen Equipment'
];

export default function VendorProductsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddProduct, setShowAddProduct] = useState(false);

  const allProducts: Product[] = [];

  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || product.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: allProducts.length,
    active: allProducts.filter(p => p.status === 'active').length,
    inactive: allProducts.filter(p => p.status === 'inactive').length,
    pending: allProducts.filter(p => p.status === 'pending').length,
    totalViews: allProducts.reduce((sum, p) => sum + p.views, 0),
    totalOrders: allProducts.reduce((sum, p) => sum + p.orders, 0),
    revenue: allProducts.reduce((sum, p) => sum + (p.price * p.orders), 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />;
      case 'inactive': return <XCircle className="h-3 w-3" />;
      case 'pending': return <AlertCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Product Management</h1>
            <p className="text-muted-foreground">
              Manage your marketplace products and inventory
            </p>
          </div>
          <Button onClick={() => setShowAddProduct(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">₹{stats.revenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <div className="lg:w-48">
                <select
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="lg:w-32">
                <select
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Showing {filteredProducts.length} products
          </p>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <div className={cn("w-2 h-2 rounded-full", getStatusColor('active'))} />
              <span>Active: {stats.active}</span>
            </Badge>
            <Badge variant="secondary" className="flex items-center space-x-1">
              <div className={cn("w-2 h-2 rounded-full", getStatusColor('inactive'))} />
              <span>Inactive: {stats.inactive}</span>
            </Badge>
          </div>
        </div>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-4 font-medium">Product</th>
                    <th className="text-left p-4 font-medium">Price</th>
                    <th className="text-left p-4 font-medium">Stock</th>
                    <th className="text-left p-4 font-medium">Performance</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      {/* Product Info */}
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-foreground truncate">
                              {product.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {product.category}
                            </p>
                            <div className="flex items-center space-x-1 mt-1">
                              <Star className="h-3 w-3 fill-current text-yellow-400" />
                              <span className="text-xs text-muted-foreground">
                                {product.rating} ({product.reviewCount})
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">₹{product.price}</span>
                            {product.originalPrice && (
                              <span className="text-sm text-muted-foreground line-through">
                                ₹{product.originalPrice}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">per {product.unit}</p>
                          {product.discount && (
                            <Badge variant="secondary" className="text-xs">
                              -{product.discount}%
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className={cn(
                            "font-medium",
                            product.stockQuantity > 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {product.stockQuantity} {product.unit}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Min: {product.minOrderQty} {product.unit}
                          </p>
                        </div>
                      </td>

                      {/* Performance */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Eye className="h-3 w-3 text-blue-500" />
                            <span className="text-sm">{product.views}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <ShoppingCart className="h-3 w-3 text-green-500" />
                            <span className="text-sm">{product.orders}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "flex items-center space-x-1 w-fit",
                            product.status === 'active' && "text-green-700 bg-green-100",
                            product.status === 'inactive' && "text-red-700 bg-red-100",
                            product.status === 'pending' && "text-yellow-700 bg-yellow-100"
                          )}
                        >
                          {getStatusIcon(product.status)}
                          <span className="capitalize">{product.status}</span>
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="p-12 text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No products found
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || selectedCategory !== 'All Categories' || selectedStatus !== 'all' 
                    ? 'Try adjusting your filters to find products.'
                    : 'Start by adding your first product to the marketplace.'
                  }
                </p>
                {!searchQuery && selectedCategory === 'All Categories' && selectedStatus === 'all' && (
                  <Button onClick={() => setShowAddProduct(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Product
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}