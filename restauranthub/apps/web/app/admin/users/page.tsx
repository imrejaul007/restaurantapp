'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/badge';
import { 
  UserIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'RESTAURANT' | 'EMPLOYEE' | 'VENDOR' | 'CUSTOMER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  emailVerified: boolean;
  phoneVerified: boolean;
  registrationDate: string;
  lastLoginDate?: string;
  totalOrders?: number;
  totalSpent?: number;
  profileImage?: string;
}

// Mock data for demonstration
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+91-9876543210',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    emailVerified: true,
    phoneVerified: true,
    registrationDate: '2024-01-15T10:30:00Z',
    lastLoginDate: '2024-01-20T14:45:00Z',
    totalOrders: 45,
    totalSpent: 12500,
  },
  {
    id: '2',
    name: 'Pizza Palace',
    email: 'owner@pizzapalace.com',
    phone: '+91-9876543211',
    role: 'RESTAURANT',
    status: 'ACTIVE',
    emailVerified: true,
    phoneVerified: false,
    registrationDate: '2024-01-10T09:15:00Z',
    lastLoginDate: '2024-01-19T16:20:00Z',
  },
  {
    id: '3',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    phone: '+91-9876543212',
    role: 'EMPLOYEE',
    status: 'PENDING_VERIFICATION',
    emailVerified: true,
    phoneVerified: true,
    registrationDate: '2024-01-18T11:20:00Z',
  },
  {
    id: '4',
    name: 'Fresh Foods Supply',
    email: 'vendor@freshfoods.com',
    phone: '+91-9876543213',
    role: 'VENDOR',
    status: 'ACTIVE',
    emailVerified: true,
    phoneVerified: true,
    registrationDate: '2024-01-05T08:45:00Z',
    lastLoginDate: '2024-01-20T12:30:00Z',
  },
  {
    id: '5',
    name: 'Mike Johnson',
    email: 'mike.j@example.com',
    phone: '+91-9876543214',
    role: 'CUSTOMER',
    status: 'SUSPENDED',
    emailVerified: false,
    phoneVerified: true,
    registrationDate: '2024-01-12T15:10:00Z',
    lastLoginDate: '2024-01-17T10:15:00Z',
    totalOrders: 8,
    totalSpent: 2340,
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm)
      );
    }

    // Role filter
    if (roleFilter) {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, users]);

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'red';
      case 'RESTAURANT':
        return 'blue';
      case 'EMPLOYEE':
        return 'green';
      case 'VENDOR':
        return 'purple';
      case 'CUSTOMER':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'green';
      case 'INACTIVE':
        return 'gray';
      case 'SUSPENDED':
        return 'red';
      case 'PENDING_VERIFICATION':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const handleUserAction = (action: string, userId: string) => {
    // Implementation would make API calls to backend
    console.log(`Action: ${action} for user: ${userId}`);
    
    if (action === 'suspend') {
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: 'SUSPENDED' as const } : user
      ));
    } else if (action === 'activate') {
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: 'ACTIVE' as const } : user
      ));
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    pending: users.filter(u => u.status === 'PENDING_VERIFICATION').length,
    suspended: users.filter(u => u.status === 'SUSPENDED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage all platform users and their accounts</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button variant="outline" size="sm">
            Export Users
          </Button>
          <Button size="sm" className="flex items-center space-x-2">
            <PlusIcon className="w-4 h-4" />
            <span>Add User</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShieldCheckIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ShieldExclamationIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Verification</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ShieldExclamationIcon className="w-6 h-6 text-red-600" />
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
                placeholder="Search users by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="min-w-[140px]"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="RESTAURANT">Restaurant</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="VENDOR">Vendor</option>
              <option value="CUSTOMER">Customer</option>
            </Select>
            
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-w-[140px]"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING_VERIFICATION">Pending</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-500" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.phone}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge color={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge color={getStatusBadgeColor(user.status)}>
                      {user.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <Badge color={user.emailVerified ? 'green' : 'red'} size="sm">
                        📧 {user.emailVerified ? 'Verified' : 'Pending'}
                      </Badge>
                      <Badge color={user.phoneVerified ? 'green' : 'red'} size="sm">
                        📱 {user.phoneVerified ? 'Verified' : 'Pending'}
                      </Badge>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>Joined: {format(new Date(user.registrationDate), 'MMM dd, yyyy')}</div>
                      {user.lastLoginDate && (
                        <div>Last login: {format(new Date(user.lastLoginDate), 'MMM dd, yyyy')}</div>
                      )}
                      {user.totalOrders && (
                        <div>{user.totalOrders} orders • ₹{user.totalSpent}</div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserAction('view', user.id)}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserAction('edit', user.id)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      {user.status === 'ACTIVE' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction('suspend', user.id)}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction('activate', user.id)}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          Activate
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
                Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
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