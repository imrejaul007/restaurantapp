'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Select } from '../../../../components/ui/Select';
import { 
  ChartBarIcon,
  CurrencyRupeeIcon,
  ShoppingBagIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MapPinIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Mock drill-down data
const drillDownData = {
  revenue: {
    total: 15420000,
    growth: 12.5,
    breakdown: {
      'Mumbai': { value: 5420000, growth: 15.2, restaurants: 45 },
      'Delhi': { value: 3890000, growth: 8.7, restaurants: 32 },
      'Bangalore': { value: 2980000, growth: 22.1, restaurants: 28 },
      'Chennai': { value: 1890000, growth: -3.4, restaurants: 18 },
      'Kolkata': { value: 1240000, growth: 18.9, restaurants: 15 },
    }
  },
  orders: {
    total: 125890,
    growth: 18.2,
    breakdown: {
      'Dine-in': { value: 45230, percentage: 35.9, growth: 12.4 },
      'Takeaway': { value: 38940, percentage: 30.9, growth: 22.1 },
      'Delivery': { value: 41720, percentage: 33.2, growth: 20.8 },
    }
  },
  restaurants: {
    total: 138,
    active: 125,
    pending: 8,
    suspended: 5,
    byCategory: {
      'Fine Dining': 34,
      'Casual Dining': 58,
      'Quick Service': 32,
      'Cafe': 14,
    }
  },
  topPerformers: [
    { name: 'Pizza Palace', revenue: 890000, orders: 2340, growth: 28.5 },
    { name: 'Spice Garden', revenue: 720000, orders: 1890, growth: 22.1 },
    { name: 'Urban Cafe', revenue: 650000, orders: 2120, growth: 19.8 },
    { name: 'Dragon Palace', revenue: 580000, orders: 1650, growth: 15.2 },
    { name: 'Fresh Bites', revenue: 520000, orders: 1780, growth: 12.9 },
  ]
};

export default function DrillDownReportsPage() {
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    toast.success(`Exporting drill-down report as ${format.toUpperCase()}...`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return (
      <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
        ) : (
          <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
        )}
        {Math.abs(growth).toFixed(1)}%
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drill-Down Reports</h1>
          <p className="text-gray-600 mt-1">Deep dive into platform analytics and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
            Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Metric</label>
            <Select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
            >
              <option value="revenue">Revenue</option>
              <option value="orders">Orders</option>
              <option value="restaurants">Restaurants</option>
              <option value="customers">Customers</option>
            </Select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </Select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <Select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <option value="all">All Regions</option>
              <option value="mumbai">Mumbai</option>
              <option value="delhi">Delhi</option>
              <option value="bangalore">Bangalore</option>
              <option value="chennai">Chennai</option>
              <option value="kolkata">Kolkata</option>
            </Select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="fine-dining">Fine Dining</option>
              <option value="casual-dining">Casual Dining</option>
              <option value="quick-service">Quick Service</option>
              <option value="cafe">Cafe</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(drillDownData.revenue.total)}</p>
              <div className="mt-1">{formatGrowth(drillDownData.revenue.growth)}</div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CurrencyRupeeIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{drillDownData.orders.total.toLocaleString()}</p>
              <div className="mt-1">{formatGrowth(drillDownData.orders.growth)}</div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingBagIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Restaurants</p>
              <p className="text-2xl font-bold text-gray-900">{drillDownData.restaurants.active}</p>
              <p className="text-sm text-gray-500">of {drillDownData.restaurants.total} total</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <BuildingStorefrontIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{Math.round(drillDownData.revenue.total / drillDownData.orders.total)}</p>
              <div className="mt-1">{formatGrowth(-2.1)}</div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Region */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPinIcon className="w-5 h-5 mr-2" />
            Revenue by Region
          </h3>
          
          <div className="space-y-4">
            {Object.entries(drillDownData.revenue.breakdown).map(([region, data]) => (
              <div key={region} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{region}</div>
                  <div className="text-sm text-gray-500">{data.restaurants} restaurants</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatCurrency(data.value)}</div>
                  <div>{formatGrowth(data.growth)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Orders by Type */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ChartPieIcon className="w-5 h-5 mr-2" />
            Orders by Type
          </h3>
          
          <div className="space-y-4">
            {Object.entries(drillDownData.orders.breakdown).map(([type, data]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{type}</div>
                  <div className="text-sm text-gray-500">{data.percentage}% of total</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{data.value.toLocaleString()}</div>
                  <div>{formatGrowth(data.growth)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ArrowTrendingUpIcon className="w-5 h-5 mr-2" />
            Top Performing Restaurants
          </h3>
          
          <div className="space-y-3">
            {drillDownData.topPerformers.map((restaurant, index) => (
              <div key={restaurant.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-sm">#{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{restaurant.name}</div>
                    <div className="text-sm text-gray-500">{restaurant.orders.toLocaleString()} orders</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatCurrency(restaurant.revenue)}</div>
                  <div>{formatGrowth(restaurant.growth)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Restaurant Categories */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BuildingStorefrontIcon className="w-5 h-5 mr-2" />
            Restaurant Categories
          </h3>
          
          <div className="space-y-4">
            {Object.entries(drillDownData.restaurants.byCategory).map(([category, count]) => {
              const percentage = (count / drillDownData.restaurants.total) * 100;
              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">{category}</span>
                    <span className="text-sm text-gray-500">{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Detailed Metrics Table */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Metrics</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Previous Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total Revenue
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(15420000)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(13700000)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {formatGrowth(12.5)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(16000000)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge color="yellow">96% of target</Badge>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total Orders
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  125,890
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  106,542
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {formatGrowth(18.2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  120,000
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge color="green">105% of target</Badge>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Active Restaurants
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  125
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  118
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {formatGrowth(5.9)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  130
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge color="yellow">96% of target</Badge>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Customer Retention
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  78.5%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  75.2%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {formatGrowth(4.4)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  80%
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge color="yellow">98% of target</Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}