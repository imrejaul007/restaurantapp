'use client';

import React, { useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import PaymentDashboard from '../../../components/payments/PaymentDashboard';
import {
  ChartBarIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ShoppingCartIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
} from 'recharts';

// Mock data for demonstration
const monthlyRevenueData = [
  { month: 'Jan', revenue: 1200000, orders: 2400, users: 150 },
  { month: 'Feb', revenue: 1400000, orders: 2800, users: 180 },
  { month: 'Mar', revenue: 1100000, orders: 2200, users: 165 },
  { month: 'Apr', revenue: 1600000, orders: 3200, users: 220 },
  { month: 'May', revenue: 1800000, orders: 3600, users: 280 },
  { month: 'Jun', revenue: 2100000, orders: 4200, users: 350 },
  { month: 'Jul', revenue: 2300000, orders: 4600, users: 390 },
  { month: 'Aug', revenue: 2500000, orders: 5000, users: 420 },
  { month: 'Sep', revenue: 2200000, orders: 4400, users: 400 },
  { month: 'Oct', revenue: 2600000, orders: 5200, users: 450 },
  { month: 'Nov', revenue: 2800000, orders: 5600, users: 480 },
  { month: 'Dec', revenue: 3200000, orders: 6400, users: 520 },
];

const userGrowthData = [
  { month: 'Jan', customers: 1200, restaurants: 45, vendors: 25, employees: 180 },
  { month: 'Feb', customers: 1350, restaurants: 52, vendors: 28, employees: 210 },
  { month: 'Mar', customers: 1500, restaurants: 58, vendors: 32, employees: 240 },
  { month: 'Apr', customers: 1680, restaurants: 65, vendors: 35, employees: 275 },
  { month: 'May', customers: 1890, restaurants: 72, vendors: 40, employees: 310 },
  { month: 'Jun', customers: 2100, restaurants: 80, vendors: 45, employees: 350 },
];

const orderDistributionData = [
  { name: 'Dine-in', value: 35, color: '#8884d8' },
  { name: 'Delivery', value: 45, color: '#82ca9d' },
  { name: 'Pickup', value: 20, color: '#ffc658' },
];

const topCitiesData = [
  { city: 'Mumbai', revenue: 850000, orders: 1700 },
  { city: 'Delhi', revenue: 720000, orders: 1440 },
  { city: 'Bangalore', revenue: 650000, orders: 1300 },
  { city: 'Chennai', revenue: 480000, orders: 960 },
  { city: 'Pune', revenue: 420000, orders: 840 },
];

const topRestaurantsData = [
  { name: 'Pizza Palace', revenue: 180000, orders: 450, rating: 4.5 },
  { name: 'Burger Junction', revenue: 165000, orders: 380, rating: 4.3 },
  { name: 'Spice Garden', revenue: 142000, orders: 290, rating: 4.7 },
  { name: 'Sushi Zen', revenue: 128000, orders: 220, rating: 4.2 },
  { name: 'Thai Corner', revenue: 115000, orders: 195, rating: 4.4 },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30'); // days
  const [activeTab, setActiveTab] = useState('overview');

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCurrentPeriodStats = () => {
    const currentRevenue = 2800000;
    const previousRevenue = 2600000;
    const revenueGrowth = ((currentRevenue - previousRevenue) / previousRevenue) * 100;

    const currentOrders = 5600;
    const previousOrders = 5200;
    const orderGrowth = ((currentOrders - previousOrders) / previousOrders) * 100;

    const currentUsers = 480;
    const previousUsers = 450;
    const userGrowth = ((currentUsers - previousUsers) / previousUsers) * 100;

    const avgOrderValue = currentRevenue / currentOrders;
    const previousAvgOrderValue = previousRevenue / previousOrders;
    const aovGrowth = ((avgOrderValue - previousAvgOrderValue) / previousAvgOrderValue) * 100;

    return {
      revenue: { current: currentRevenue, growth: revenueGrowth },
      orders: { current: currentOrders, growth: orderGrowth },
      users: { current: currentUsers, growth: userGrowth },
      aov: { current: avgOrderValue, growth: aovGrowth },
    };
  };

  const stats = getCurrentPeriodStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Business insights and performance metrics</p>
        </div>
        
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="min-w-[140px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" >
            <CalendarDaysIcon className="w-4 h-4 mr-2" />
            Custom Range
          </Button>
          
          <Button >
            Export Report
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'revenue', name: 'Revenue' },
            { id: 'users', name: 'Users' },
            { id: 'restaurants', name: 'Restaurants' },
            { id: 'payments', name: 'Payments' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.revenue.current)}
                  </p>
                  <div className="flex items-center mt-1">
                    {stats.revenue.growth > 0 ? (
                      <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      stats.revenue.growth > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(stats.revenue.growth).toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last period</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCartIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.orders.current.toLocaleString()}
                  </p>
                  <div className="flex items-center mt-1">
                    {stats.orders.growth > 0 ? (
                      <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      stats.orders.growth > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(stats.orders.growth).toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last period</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UsersIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.users.current.toLocaleString()}
                  </p>
                  <div className="flex items-center mt-1">
                    {stats.users.growth > 0 ? (
                      <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      stats.users.growth > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(stats.users.growth).toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last period</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.aov.current)}
                  </p>
                  <div className="flex items-center mt-1">
                    {stats.aov.growth > 0 ? (
                      <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      stats.aov.growth > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(stats.aov.growth).toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last period</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₹${value / 100000}L`} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Order Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Order Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={orderDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {orderDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Cities */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Cities by Revenue</h3>
              <div className="space-y-3">
                {topCitiesData.map((city, index) => (
                  <div key={city.city} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <span className="font-medium">{city.city}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(city.revenue)}</div>
                      <div className="text-sm text-gray-500">{city.orders} orders</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Restaurants */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Restaurants</h3>
              <div className="space-y-3">
                {topRestaurantsData.map((restaurant, index) => (
                  <div key={restaurant.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium text-green-600">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{restaurant.name}</div>
                        <div className="flex items-center text-sm text-gray-500">
                          ⭐ {restaurant.rating} • {restaurant.orders} orders
                        </div>
                      </div>
                    </div>
                    <div className="font-semibold">{formatCurrency(restaurant.revenue)}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="grid grid-cols-1 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Monthly Revenue & Orders</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" orientation="left" tickFormatter={(value) => `₹${value / 100000}L`} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    name === 'revenue' ? formatCurrency(value as number) : value,
                    name === 'revenue' ? 'Revenue' : 'Orders'
                  ]}
                />
                <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#82ca9d" strokeWidth={3} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">User Growth by Type</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="customers" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="restaurants" stroke="#82ca9d" strokeWidth={2} />
                <Line type="monotone" dataKey="vendors" stroke="#ffc658" strokeWidth={2} />
                <Line type="monotone" dataKey="employees" stroke="#ff7c7c" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <PaymentDashboard />
      )}
    </div>
  );
}