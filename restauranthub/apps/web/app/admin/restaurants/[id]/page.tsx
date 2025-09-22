'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs';
import {
  BuildingStorefrontIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  PencilIcon,
  EyeIcon,
  PhotoIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Restaurant {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: { lat: number; lng: number };
  };
  cuisine: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED';
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  rating: number;
  reviewCount: number;
  totalOrders: number;
  totalRevenue: number;
  registrationDate: string;
  lastOrderDate?: string;
  isVerified: boolean;
  documents: {
    gst: { uploaded: boolean; verified: boolean; url?: string };
    fssai: { uploaded: boolean; verified: boolean; url?: string };
    pan: { uploaded: boolean; verified: boolean; url?: string };
    businessLicense: { uploaded: boolean; verified: boolean; url?: string };
  };
  images: string[];
  operatingHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  menuItems: number;
  employees: number;
  subscriptionPlan: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  analytics: {
    monthlyRevenue: number;
    monthlyOrders: number;
    avgOrderValue: number;
    customerRetention: number;
    popularItems: string[];
  };
  auditLog: {
    id: string;
    action: string;
    performedBy: string;
    timestamp: string;
    details: string;
  }[];
}

// Mock restaurant data
const mockRestaurant: Restaurant = {
  id: '1',
  name: 'Pizza Palace',
  ownerName: 'Marco Rossi',
  email: 'owner@pizzapalace.com',
  phone: '+91-9876543210',
  address: {
    street: '123 Food Street, Near Central Mall',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400001',
    coordinates: { lat: 19.0760, lng: 72.8777 },
  },
  cuisine: ['Italian', 'Pizza', 'Pasta', 'Continental'],
  status: 'ACTIVE',
  verificationStatus: 'VERIFIED',
  rating: 4.5,
  reviewCount: 1250,
  totalOrders: 5420,
  totalRevenue: 2840000,
  registrationDate: '2023-10-15T10:30:00Z',
  lastOrderDate: '2024-01-20T18:45:00Z',
  isVerified: true,
  documents: {
    gst: { uploaded: true, verified: true, url: '/docs/gst-certificate.pdf' },
    fssai: { uploaded: true, verified: true, url: '/docs/fssai-license.pdf' },
    pan: { uploaded: true, verified: true, url: '/docs/pan-card.pdf' },
    businessLicense: { uploaded: true, verified: false, url: '/docs/business-license.pdf' },
  },
  images: ['/images/pizza-palace-1.jpg', '/images/pizza-palace-2.jpg', '/images/pizza-palace-3.jpg'],
  operatingHours: {
    monday: { open: '11:00', close: '23:00', closed: false },
    tuesday: { open: '11:00', close: '23:00', closed: false },
    wednesday: { open: '11:00', close: '23:00', closed: false },
    thursday: { open: '11:00', close: '23:00', closed: false },
    friday: { open: '11:00', close: '23:00', closed: false },
    saturday: { open: '11:00', close: '23:00', closed: false },
    sunday: { open: '12:00', close: '22:00', closed: false },
  },
  menuItems: 42,
  employees: 15,
  subscriptionPlan: 'PREMIUM',
  analytics: {
    monthlyRevenue: 285000,
    monthlyOrders: 425,
    avgOrderValue: 670,
    customerRetention: 78,
    popularItems: ['Margherita Pizza', 'Chicken Alfredo', 'Garlic Bread'],
  },
  auditLog: [
    {
      id: '1',
      action: 'Restaurant Approved',
      performedBy: 'Admin (John Doe)',
      timestamp: '2024-01-20T14:30:00Z',
      details: 'Restaurant verification completed and approved',
    },
    {
      id: '2',
      action: 'Documents Updated',
      performedBy: 'Owner (Marco Rossi)',
      timestamp: '2024-01-19T10:15:00Z',
      details: 'Business license document updated',
    },
    {
      id: '3',
      action: 'Status Changed',
      performedBy: 'Admin (Jane Smith)',
      timestamp: '2024-01-18T16:45:00Z',
      details: 'Status changed from PENDING_APPROVAL to ACTIVE',
    },
  ],
};

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const loadRestaurant = async () => {
      setIsLoading(true);
      try {
        // In real app, fetch restaurant data by ID
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRestaurant(mockRestaurant);
      } catch (error) {
        toast.error('Failed to load restaurant details');
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurant();
  }, [params.id]);

  const handleStatusChange = async (newStatus: Restaurant['status']) => {
    try {
      // In real app, make API call to update status
      setRestaurant(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(`Restaurant status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update restaurant status');
    }
  };

  const handleVerificationStatusChange = async (newStatus: Restaurant['verificationStatus']) => {
    try {
      // In real app, make API call to update verification status
      setRestaurant(prev => prev ? { ...prev, verificationStatus: newStatus } : null);
      toast.success(`Verification status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update verification status');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'green';
      case 'INACTIVE': return 'gray';
      case 'SUSPENDED': return 'red';
      case 'PENDING_APPROVAL': return 'yellow';
      default: return 'gray';
    }
  };

  const getVerificationBadgeColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'green';
      case 'PENDING': return 'yellow';
      case 'REJECTED': return 'red';
      default: return 'gray';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Restaurant Not Found</h2>
          <p className="text-gray-600 mb-4">The restaurant you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BuildingStorefrontIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'documents', label: 'Documents', icon: DocumentTextIcon },
    { id: 'employees', label: 'Employees', icon: UserGroupIcon },
    { id: 'orders', label: 'Orders', icon: ShoppingBagIcon },
    { id: 'audit', label: 'Audit Log', icon: ClockIcon },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
              {restaurant.isVerified && (
                <CheckCircleIcon className="w-6 h-6 text-blue-500" />
              )}
            </div>
            <p className="text-gray-600">Managed by {restaurant.ownerName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button variant="outline" >
            <PencilIcon className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" >
            <EyeIcon className="w-4 h-4 mr-2" />
            View as Customer
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge color={getStatusBadgeColor(restaurant.status)} className="mt-1">
                {restaurant.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="space-y-1">
              <Button
                variant="outline"
                
                onClick={() => handleStatusChange('ACTIVE')}
                className="text-green-600 border-green-600 hover:bg-green-50 text-xs"
                disabled={restaurant.status === 'ACTIVE'}
              >
                Activate
              </Button>
              <Button
                variant="outline"
                
                onClick={() => handleStatusChange('SUSPENDED')}
                className="text-red-600 border-red-600 hover:bg-red-50 text-xs"
                disabled={restaurant.status === 'SUSPENDED'}
              >
                Suspend
              </Button>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verification</p>
              <Badge color={getVerificationBadgeColor(restaurant.verificationStatus)} className="mt-1">
                {restaurant.verificationStatus}
              </Badge>
            </div>
            <div className="space-y-1">
              <Button
                variant="outline"
                
                onClick={() => handleVerificationStatusChange('VERIFIED')}
                className="text-green-600 border-green-600 hover:bg-green-50 text-xs"
                disabled={restaurant.verificationStatus === 'VERIFIED'}
              >
                Verify
              </Button>
              <Button
                variant="outline"
                
                onClick={() => handleVerificationStatusChange('REJECTED')}
                className="text-red-600 border-red-600 hover:bg-red-50 text-xs"
                disabled={restaurant.verificationStatus === 'REJECTED'}
              >
                Reject
              </Button>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">₹{restaurant.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBagIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-xl font-bold text-gray-900">{restaurant.totalOrders.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="overview" className="p-6">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Restaurant Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{restaurant.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <PhoneIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{restaurant.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPinIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">
                        {restaurant.address.street}, {restaurant.address.city}, {restaurant.address.state} {restaurant.address.zipCode}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StarIcon className="w-5 h-5 text-yellow-400" />
                      <span className="text-gray-900">
                        {restaurant.rating} ({restaurant.reviewCount} reviews)
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Cuisine Types</p>
                    <div className="flex flex-wrap gap-2">
                      {restaurant.cuisine.map((type) => (
                        <Badge key={type} color="blue" variant="outline">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Subscription Plan</p>
                    <Badge className="px-3 py-1 text-sm">
                      {restaurant.subscriptionPlan}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Operating Hours</h3>
                  
                  <div className="space-y-2">
                    {Object.entries(restaurant.operatingHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-gray-900 capitalize">{day}</span>
                        <span className="text-sm text-gray-600">
                          {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Images */}
              {restaurant.images.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {restaurant.images.map((image, index) => (
                      <div key={index} className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                        <PhotoIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Analytics Overview</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-green-600">₹{restaurant.analytics.monthlyRevenue.toLocaleString()}</p>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Monthly Orders</p>
                    <p className="text-2xl font-bold text-blue-600">{restaurant.analytics.monthlyOrders}</p>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Avg Order Value</p>
                    <p className="text-2xl font-bold text-purple-600">₹{restaurant.analytics.avgOrderValue}</p>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Customer Retention</p>
                    <p className="text-2xl font-bold text-orange-600">{restaurant.analytics.customerRetention}%</p>
                  </div>
                </Card>
              </div>

              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Popular Items</h4>
                <div className="space-y-2">
                  {restaurant.analytics.popularItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-900">{item}</span>
                      <Badge color="green">#{index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Verification Documents</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(restaurant.documents).map(([docType, doc]) => (
                  <Card key={docType} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 capitalize">{docType.replace(/([A-Z])/g, ' $1').trim()}</h4>
                      <div className="flex items-center space-x-2">
                        {doc.uploaded ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-red-500" />
                        )}
                        <Badge color={doc.verified ? 'green' : 'yellow'}>
                          {doc.verified ? 'Verified' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Status: {doc.uploaded ? 'Uploaded' : 'Not Uploaded'}
                      </p>
                      {doc.uploaded && (
                        <div className="flex space-x-2">
                          <Button variant="outline" >
                            <EyeIcon className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          {!doc.verified && (
                            <>
                              <Button 
                                variant="outline" 
                                
                                className="text-green-600 border-green-600 hover:bg-green-50"
                              >
                                Approve
                              </Button>
                              <Button 
                                variant="outline" 
                                
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="employees" className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Employee Management</h3>
                <Button variant="outline" >
                  View All Employees
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="text-center">
                    <UserGroupIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Total Employees</p>
                    <p className="text-2xl font-bold text-gray-900">{restaurant.employees}</p>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="text-center">
                    <CheckCircleIcon className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-green-600">{restaurant.employees - 2}</p>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="text-center">
                    <ClockIcon className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">2</p>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
                <Button variant="outline" >
                  View All Orders
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{restaurant.totalOrders}</p>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-blue-600">{restaurant.analytics.monthlyOrders}</p>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Avg Order Value</p>
                    <p className="text-2xl font-bold text-green-600">₹{restaurant.analytics.avgOrderValue}</p>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Menu Items</p>
                    <p className="text-2xl font-bold text-purple-600">{restaurant.menuItems}</p>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Audit Log</h3>
              
              <div className="space-y-4">
                {restaurant.auditLog.map((log) => (
                  <Card key={log.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{log.action}</h4>
                      <span className="text-sm text-gray-500">
                        {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{log.details}</p>
                    <p className="text-xs text-gray-500">Performed by: {log.performedBy}</p>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </motion.div>
  );
}