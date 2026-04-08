'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  TrendingUp,
  Star,
  Award,
  Clock,
  Eye,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Edit2,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { mockProducts, mockVendors } from '@/data/marketplace-data';

interface ProductAnalytics {
  id: string;
  name: string;
  category: string;
  vendor: string;
  price: number;
  sales: number;
  views: number;
  orders: number;
  rating: number;
  revenue: number;
  stock: number;
  createdAt: string;
  isActive: boolean;
  // Promotion flags
  isTrending: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  // Auto-calculated flags
  autoTrending: boolean;
  autoNew: boolean;
  autoBestSeller: boolean;
  // Manual override
  manualOverride: {
    trending?: boolean;
    new?: boolean;
    bestSeller?: boolean;
  };
}

interface VendorAnalytics {
  id: string;
  name: string;
  category: string;
  rating: number;
  totalSales: number;
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  joinedAt: string;
  isActive: boolean;
  // Promotion flags
  isTrending: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  // Auto-calculated flags
  autoTrending: boolean;
  autoNew: boolean;
  autoBestSeller: boolean;
  // Manual override
  manualOverride: {
    trending?: boolean;
    new?: boolean;
    bestSeller?: boolean;
  };
}

// Enhanced mock data with analytics
const generateProductAnalytics = (): ProductAnalytics[] => {
  return mockProducts.map((product, index) => {
    const sales = Math.floor(Math.random() * 1000) + 50;
    const views = Math.floor(Math.random() * 5000) + 100;
    const orders = Math.floor(Math.random() * 200) + 10;
    const revenue = sales * product.price;
    const createdDaysAgo = Math.floor(Math.random() * 365);
    
    // Auto-calculate flags based on data
    const autoNew = createdDaysAgo <= 30;
    const autoTrending = views > 1000 && sales > 100;
    const autoBestSeller = sales > 500 && orders > 50;
    
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      vendor: mockVendors.find(v => v.id === product.vendorId)?.name || 'Unknown',
      price: product.price,
      sales,
      views,
      orders,
      rating: Math.random() * 2 + 3, // 3-5 rating
      revenue,
      stock: Math.floor(Math.random() * 100) + 10,
      createdAt: new Date(Date.now() - createdDaysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || new Date().toISOString(),
      isActive: product.inStock,
      // Auto-calculated
      autoTrending,
      autoNew,
      autoBestSeller,
      // Current display flags (can be manual override or auto)
      isTrending: autoTrending,
      isNew: autoNew,
      isBestSeller: autoBestSeller,
      manualOverride: {}
    };
  });
};

const generateVendorAnalytics = (): VendorAnalytics[] => {
  return mockVendors.map((vendor, index) => {
    const totalSales = Math.floor(Math.random() * 5000) + 500;
    const totalProducts = Math.floor(Math.random() * 100) + 10;
    const totalOrders = Math.floor(Math.random() * 1000) + 50;
    const revenue = totalSales * (Math.random() * 100 + 50);
    const joinedDaysAgo = Math.floor(Math.random() * 730);
    
    // Auto-calculate flags
    const autoNew = joinedDaysAgo <= 90;
    const autoTrending = totalSales > 2000 && totalOrders > 500;
    const autoBestSeller = revenue > 100000 && vendor.rating > 4.5;
    
    return {
      id: vendor.id,
      name: vendor.name,
      category: vendor.category,
      rating: vendor.rating,
      totalSales,
      totalProducts,
      totalOrders,
      revenue,
      joinedAt: new Date(Date.now() - joinedDaysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
      autoTrending,
      autoNew,
      autoBestSeller,
      isTrending: autoTrending,
      isNew: autoNew,
      isBestSeller: autoBestSeller,
      manualOverride: {}
    };
  });
};

export default function MarketplaceProductsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'products' | 'vendors'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPromotionFilter, setSelectedPromotionFilter] = useState('all');
  
  // Data
  const [products, setProducts] = useState<ProductAnalytics[]>(generateProductAnalytics());
  const [vendors, setVendors] = useState<VendorAnalytics[]>(generateVendorAnalytics());

  // Auto-refresh data every minute to simulate real-time analytics
  useEffect(() => {
    const interval = setInterval(() => {
      // Recalculate auto flags based on fresh data
      setProducts(prev => prev.map(product => ({
        ...product,
        views: product.views + Math.floor(Math.random() * 5),
        autoTrending: product.views > 1000 && product.sales > 100,
        isTrending: product.manualOverride.trending !== undefined 
          ? product.manualOverride.trending 
          : (product.views > 1000 && product.sales > 100)
      })));
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  const handleManualToggle = (id: string, type: 'trending' | 'new' | 'bestSeller', isProduct: boolean) => {
    const updateFunction = isProduct ? setProducts : setVendors;
    
    updateFunction(prev => prev.map(item => 
      item.id === id ? {
        ...item,
        manualOverride: {
          ...item.manualOverride,
          [type]: !item.manualOverride[type]
        },
        [`is${type.charAt(0).toUpperCase() + type.slice(1)}`]: !item[`is${type.charAt(0).toUpperCase() + type.slice(1)}`]
      } : item
    ));
    
    toast({
      title: "Promotion Updated",
      description: `Manual ${type} flag has been toggled.`,
    });
  };

  const handleBulkAction = (action: string, items: string[], isProduct: boolean) => {
    const updateFunction = isProduct ? setProducts : setVendors;
    
    switch (action) {
      case 'trending':
        updateFunction(prev => prev.map(item => 
          items.includes(item.id) ? { ...item, isTrending: true, manualOverride: { ...item.manualOverride, trending: true } } : item
        ));
        break;
      case 'bestseller':
        updateFunction(prev => prev.map(item => 
          items.includes(item.id) ? { ...item, isBestSeller: true, manualOverride: { ...item.manualOverride, bestSeller: true } } : item
        ));
        break;
      case 'deactivate':
        updateFunction(prev => prev.map(item => 
          items.includes(item.id) ? { ...item, isActive: false } : item
        ));
        break;
    }
    
    toast({
      title: "Bulk Action Applied",
      description: `${action} has been applied to ${items.length} items.`,
    });
  };

  // Filter functions
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesPromotion = selectedPromotionFilter === 'all' || 
                            (selectedPromotionFilter === 'trending' && product.isTrending) ||
                            (selectedPromotionFilter === 'new' && product.isNew) ||
                            (selectedPromotionFilter === 'bestseller' && product.isBestSeller);
    return matchesSearch && matchesCategory && matchesPromotion;
  });

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || vendor.category === selectedCategory;
    const matchesPromotion = selectedPromotionFilter === 'all' || 
                            (selectedPromotionFilter === 'trending' && vendor.isTrending) ||
                            (selectedPromotionFilter === 'new' && vendor.isNew) ||
                            (selectedPromotionFilter === 'bestseller' && vendor.isBestSeller);
    return matchesSearch && matchesCategory && matchesPromotion;
  });

  // Analytics calculations
  const productStats = {
    total: products.length,
    active: products.filter(p => p.isActive).length,
    trending: products.filter(p => p.isTrending).length,
    new: products.filter(p => p.isNew).length,
    bestsellers: products.filter(p => p.isBestSeller).length,
    totalRevenue: products.reduce((sum, p) => sum + p.revenue, 0),
    autoTrending: products.filter(p => p.autoTrending && !p.manualOverride.trending).length,
    manualTrending: products.filter(p => p.manualOverride.trending).length
  };

  const vendorStats = {
    total: vendors.length,
    active: vendors.filter(v => v.isActive).length,
    trending: vendors.filter(v => v.isTrending).length,
    new: vendors.filter(v => v.isNew).length,
    bestsellers: vendors.filter(v => v.isBestSeller).length,
    totalRevenue: vendors.reduce((sum, v) => sum + v.revenue, 0),
    autoTrending: vendors.filter(v => v.autoTrending && !v.manualOverride.trending).length,
    manualTrending: vendors.filter(v => v.manualOverride.trending).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketplace Management</h1>
          <p className="mt-2 text-gray-600">
            Manage trending, new arrivals, and bestseller promotions with intelligent automation
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button variant="outline" >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button variant="outline" >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Data
          </Button>
          <Button >
            <Settings className="h-4 w-4 mr-2" />
            Auto Rules
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="products" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Products</span>
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Vendors</span>
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {/* Product Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
                <div className="text-2xl font-bold">{productStats.total}</div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
                <div className="text-2xl font-bold text-green-600">{productStats.active}</div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Trending
                </CardTitle>
                <div className="text-2xl font-bold text-orange-600">{productStats.trending}</div>
                <div className="text-xs text-gray-500">
                  Auto: {productStats.autoTrending} | Manual: {productStats.manualTrending}
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  New
                </CardTitle>
                <div className="text-2xl font-bold text-blue-600">{productStats.new}</div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Award className="h-4 w-4 mr-1" />
                  Best Sellers
                </CardTitle>
                <div className="text-2xl font-bold text-purple-600">{productStats.bestsellers}</div>
              </CardHeader>
            </Card>
            <Card className="col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Total Revenue
                </CardTitle>
                <div className="text-2xl font-bold text-green-600">
                  ${(productStats.totalRevenue / 1000).toFixed(1)}K
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Product Filters */}
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="ingredients">Ingredients</option>
                    <option value="kitchen_equipment">Kitchen Equipment</option>
                    <option value="packaging">Packaging</option>
                    <option value="cleaning">Cleaning</option>
                  </select>
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={selectedPromotionFilter}
                    onChange={(e) => setSelectedPromotionFilter(e.target.value)}
                  >
                    <option value="all">All Promotions</option>
                    <option value="trending">Trending</option>
                    <option value="new">New</option>
                    <option value="bestseller">Best Sellers</option>
                  </select>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Products ({filteredProducts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-3">Product</th>
                      <th className="text-left p-3">Category</th>
                      <th className="text-left p-3">Vendor</th>
                      <th className="text-left p-3">Price</th>
                      <th className="text-left p-3">Performance</th>
                      <th className="text-left p-3">Promotions</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.slice(0, 10).map((product) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-gray-500 text-xs">ID: {product.id}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="capitalize">
                            {product.category.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-3">{product.vendor}</td>
                        <td className="p-3">${product.price}</td>
                        <td className="p-3">
                          <div className="space-y-1 text-xs">
                            <div>Sales: {product.sales}</div>
                            <div>Views: {product.views}</div>
                            <div>Orders: {product.orders}</div>
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-yellow-400 mr-1" />
                              {product.rating.toFixed(1)}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            <div className="flex items-center space-x-1">
                              <Switch
                                checked={product.isTrending}
                                onCheckedChange={() => handleManualToggle(product.id, 'trending', true)}
                              />
                              <span className="text-xs">
                                Trending {product.autoTrending && <span className="text-green-600">(Auto)</span>}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Switch
                                checked={product.isNew}
                                onCheckedChange={() => handleManualToggle(product.id, 'new', true)}
                              />
                              <span className="text-xs">
                                New {product.autoNew && <span className="text-green-600">(Auto)</span>}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Switch
                                checked={product.isBestSeller}
                                onCheckedChange={() => handleManualToggle(product.id, 'bestSeller', true)}
                              />
                              <span className="text-xs">
                                Best Seller {product.autoBestSeller && <span className="text-green-600">(Auto)</span>}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-6">
          {/* Vendor Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Vendors</CardTitle>
                <div className="text-2xl font-bold">{vendorStats.total}</div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
                <div className="text-2xl font-bold text-green-600">{vendorStats.active}</div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Trending
                </CardTitle>
                <div className="text-2xl font-bold text-orange-600">{vendorStats.trending}</div>
                <div className="text-xs text-gray-500">
                  Auto: {vendorStats.autoTrending} | Manual: {vendorStats.manualTrending}
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  New
                </CardTitle>
                <div className="text-2xl font-bold text-blue-600">{vendorStats.new}</div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Award className="h-4 w-4 mr-1" />
                  Best Sellers
                </CardTitle>
                <div className="text-2xl font-bold text-purple-600">{vendorStats.bestsellers}</div>
              </CardHeader>
            </Card>
            <Card className="col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Total Revenue
                </CardTitle>
                <div className="text-2xl font-bold text-green-600">
                  ${(vendorStats.totalRevenue / 1000).toFixed(1)}K
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Vendor Filters - Same structure as products */}
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search vendors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="utilities">Utilities</option>
                    <option value="food_supplies">Food Supplies</option>
                    <option value="equipment">Equipment</option>
                    <option value="services">Services</option>
                  </select>
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={selectedPromotionFilter}
                    onChange={(e) => setSelectedPromotionFilter(e.target.value)}
                  >
                    <option value="all">All Promotions</option>
                    <option value="trending">Trending</option>
                    <option value="new">New</option>
                    <option value="bestseller">Best Sellers</option>
                  </select>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Vendors Table */}
          <Card>
            <CardHeader>
              <CardTitle>Vendors ({filteredVendors.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-3">Vendor</th>
                      <th className="text-left p-3">Category</th>
                      <th className="text-left p-3">Performance</th>
                      <th className="text-left p-3">Promotions</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVendors.map((vendor) => (
                      <tr key={vendor.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{vendor.name}</div>
                            <div className="text-gray-500 text-xs">Joined: {vendor.joinedAt}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="capitalize">
                            {vendor.category.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1 text-xs">
                            <div>Sales: {vendor.totalSales}</div>
                            <div>Products: {vendor.totalProducts}</div>
                            <div>Orders: {vendor.totalOrders}</div>
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-yellow-400 mr-1" />
                              {vendor.rating.toFixed(1)}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            <div className="flex items-center space-x-1">
                              <Switch
                                checked={vendor.isTrending}
                                onCheckedChange={() => handleManualToggle(vendor.id, 'trending', false)}
                              />
                              <span className="text-xs">
                                Trending {vendor.autoTrending && <span className="text-green-600">(Auto)</span>}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Switch
                                checked={vendor.isNew}
                                onCheckedChange={() => handleManualToggle(vendor.id, 'new', false)}
                              />
                              <span className="text-xs">
                                New {vendor.autoNew && <span className="text-green-600">(Auto)</span>}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Switch
                                checked={vendor.isBestSeller}
                                onCheckedChange={() => handleManualToggle(vendor.id, 'bestSeller', false)}
                              />
                              <span className="text-xs">
                                Best Seller {vendor.autoBestSeller && <span className="text-green-600">(Auto)</span>}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}