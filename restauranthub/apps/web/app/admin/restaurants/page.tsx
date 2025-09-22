'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { 
  BuildingStorefrontIcon,
  MagnifyingGlassIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  EyeIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

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
    gst: boolean;
    fssai: boolean;
    pan: boolean;
    businessLicense: boolean;
  };
  images: string[];
}

// Mock data for demonstration
const mockRestaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Pizza Palace',
    ownerName: 'Marco Rossi',
    email: 'owner@pizzapalace.com',
    phone: '+91-9876543210',
    address: {
      street: '123 Food Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
    },
    cuisine: ['Italian', 'Pizza', 'Pasta'],
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
      gst: true,
      fssai: true,
      pan: true,
      businessLicense: true,
    },
    images: ['/images/pizza-palace.jpg'],
  },
  {
    id: '2',
    name: 'Spice Garden',
    ownerName: 'Arjun Patel',
    email: 'owner@spicegarden.com',
    phone: '+91-9876543211',
    address: {
      street: '456 Curry Lane',
      city: 'Delhi',
      state: 'Delhi',
      zipCode: '110001',
    },
    cuisine: ['Indian', 'North Indian', 'Vegetarian'],
    status: 'PENDING_APPROVAL',
    verificationStatus: 'PENDING',
    rating: 0,
    reviewCount: 0,
    totalOrders: 0,
    totalRevenue: 0,
    registrationDate: '2024-01-18T09:20:00Z',
    isVerified: false,
    documents: {
      gst: true,
      fssai: true,
      pan: false,
      businessLicense: true,
    },
    images: [],
  },
  {
    id: '3',
    name: 'Burger Junction',
    ownerName: 'Sarah Wilson',
    email: 'owner@burgerjunction.com',
    phone: '+91-9876543212',
    address: {
      street: '789 Fast Food Ave',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560001',
    },
    cuisine: ['American', 'Burgers', 'Fast Food'],
    status: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    rating: 4.2,
    reviewCount: 890,
    totalOrders: 3250,
    totalRevenue: 1450000,
    registrationDate: '2023-12-05T14:15:00Z',
    lastOrderDate: '2024-01-19T20:30:00Z',
    isVerified: true,
    documents: {
      gst: true,
      fssai: true,
      pan: true,
      businessLicense: true,
    },
    images: ['/images/burger-junction.jpg'],
  },
  {
    id: '4',
    name: 'Sushi Zen',
    ownerName: 'Takeshi Yamamoto',
    email: 'owner@sushizen.com',
    phone: '+91-9876543213',
    address: {
      street: '321 Oriental Plaza',
      city: 'Pune',
      state: 'Maharashtra',
      zipCode: '411001',
    },
    cuisine: ['Japanese', 'Sushi', 'Asian'],
    status: 'SUSPENDED',
    verificationStatus: 'REJECTED',
    rating: 3.8,
    reviewCount: 420,
    totalOrders: 1580,
    totalRevenue: 890000,
    registrationDate: '2023-11-20T11:45:00Z',
    lastOrderDate: '2024-01-10T15:20:00Z',
    isVerified: false,
    documents: {
      gst: true,
      fssai: false,
      pan: true,
      businessLicense: false,
    },
    images: ['/images/sushi-zen.jpg'],
  },
];

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(mockRestaurants);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(mockRestaurants);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [restaurantsPerPage] = useState(10);

  useEffect(() => {
    let filtered = restaurants;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.cuisine.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())) ||
        restaurant.address.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(restaurant => restaurant.status === statusFilter);
    }

    // Verification filter
    if (verificationFilter) {
      filtered = filtered.filter(restaurant => restaurant.verificationStatus === verificationFilter);
    }

    setFilteredRestaurants(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, verificationFilter, restaurants]);

  // Pagination
  const indexOfLastRestaurant = currentPage * restaurantsPerPage;
  const indexOfFirstRestaurant = indexOfLastRestaurant - restaurantsPerPage;
  const currentRestaurants = filteredRestaurants.slice(indexOfFirstRestaurant, indexOfLastRestaurant);
  const totalPages = Math.ceil(filteredRestaurants.length / restaurantsPerPage);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'green';
      case 'INACTIVE':
        return 'gray';
      case 'SUSPENDED':
        return 'red';
      case 'PENDING_APPROVAL':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getVerificationBadgeColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'green';
      case 'PENDING':
        return 'yellow';
      case 'REJECTED':
        return 'red';
      default:
        return 'gray';
    }
  };

  const handleRestaurantAction = (action: string, restaurantId: string) => {
    console.log(`Action: ${action} for restaurant: ${restaurantId}`);
    
    if (action === 'approve') {
      setRestaurants(prev => prev.map(restaurant => 
        restaurant.id === restaurantId 
          ? { ...restaurant, status: 'ACTIVE' as const, verificationStatus: 'VERIFIED' as const }
          : restaurant
      ));
    } else if (action === 'reject') {
      setRestaurants(prev => prev.map(restaurant => 
        restaurant.id === restaurantId 
          ? { ...restaurant, verificationStatus: 'REJECTED' as const }
          : restaurant
      ));
    } else if (action === 'suspend') {
      setRestaurants(prev => prev.map(restaurant => 
        restaurant.id === restaurantId 
          ? { ...restaurant, status: 'SUSPENDED' as const }
          : restaurant
      ));
    }
  };

  const stats = {
    total: restaurants.length,
    active: restaurants.filter(r => r.status === 'ACTIVE').length,
    pending: restaurants.filter(r => r.status === 'PENDING_APPROVAL').length,
    suspended: restaurants.filter(r => r.status === 'SUSPENDED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restaurant Management</h1>
          <p className="text-gray-600 mt-1">Manage restaurant registrations and verifications</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button variant="outline" >
            Export Data
          </Button>
          <Button variant="outline" >
            Bulk Actions
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BuildingStorefrontIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Restaurants</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XMarkIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-gray-900">{stats.suspended}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search restaurants by name, owner, email, cuisine, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="SUSPENDED">Suspended</option>
            </Select>
            
            <Select
              value={verificationFilter}
              onValueChange={(value) => setVerificationFilter(value)}
            >
              <option value="">All Verification</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Restaurants Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Restaurant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner & Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location & Cuisine
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentRestaurants.map((restaurant) => (
                <tr key={restaurant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-lg bg-gray-300 flex items-center justify-center">
                          <BuildingStorefrontIcon className="h-6 w-6 text-gray-500" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {restaurant.name}
                          {restaurant.isVerified && (
                            <CheckIcon className="w-4 h-4 text-blue-500 ml-1" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          Registered: {format(new Date(restaurant.registrationDate), 'MMM dd, yyyy')}
                        </div>
                        {restaurant.rating > 0 && (
                          <div className="flex items-center text-sm text-gray-500">
                            <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
                            {restaurant.rating} ({restaurant.reviewCount} reviews)
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{restaurant.ownerName}</div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <EnvelopeIcon className="w-4 h-4 mr-1" />
                      {restaurant.email}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <PhoneIcon className="w-4 h-4 mr-1" />
                      {restaurant.phone}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-1" />
                      {restaurant.address.city}, {restaurant.address.state}
                    </div>
                    <div className="text-sm text-gray-500">
                      {restaurant.cuisine.slice(0, 2).join(', ')}
                      {restaurant.cuisine.length > 2 && ` +${restaurant.cuisine.length - 2} more`}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <Badge color={getStatusBadgeColor(restaurant.status)}>
                        {restaurant.status.replace('_', ' ')}
                      </Badge>
                      <br />
                      <Badge color={getVerificationBadgeColor(restaurant.verificationStatus)}>
                        {restaurant.verificationStatus}
                      </Badge>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>{restaurant.totalOrders} orders</div>
                      <div>₹{restaurant.totalRevenue.toLocaleString()}</div>
                      {restaurant.lastOrderDate && (
                        <div className="text-xs">
                          Last: {format(new Date(restaurant.lastOrderDate), 'MMM dd')}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <Badge color={restaurant.documents.gst ? 'green' : 'red'} >
                        GST
                      </Badge>
                      <Badge color={restaurant.documents.fssai ? 'green' : 'red'} >
                        FSSAI
                      </Badge>
                      <Badge color={restaurant.documents.pan ? 'green' : 'red'} >
                        PAN
                      </Badge>
                      <Badge color={restaurant.documents.businessLicense ? 'green' : 'red'} >
                        License
                      </Badge>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col space-y-1">
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          
                          onClick={() => handleRestaurantAction('view', restaurant.id)}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          
                          onClick={() => handleRestaurantAction('edit', restaurant.id)}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {restaurant.status === 'PENDING_APPROVAL' && (
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            
                            onClick={() => handleRestaurantAction('approve', restaurant.id)}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            
                            onClick={() => handleRestaurantAction('reject', restaurant.id)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      
                      {restaurant.status === 'ACTIVE' && (
                        <Button
                          variant="outline"
                          
                          onClick={() => handleRestaurantAction('suspend', restaurant.id)}
                          className="text-red-600 border-red-600 hover:bg-red-50 text-xs"
                        >
                          Suspend
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstRestaurant + 1} to {Math.min(indexOfLastRestaurant, filteredRestaurants.length)} of {filteredRestaurants.length} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}