'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  User,
  UserCheck,
  UserX,
  Award,
  TrendingUp,
  ChefHat,
  Utensils,
  Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatDate, cn } from '@/lib/utils';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
  status: 'active' | 'inactive' | 'on-leave' | 'terminated';
  joiningDate: string;
  salary: number;
  experience: string;
  skills: string[];
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  documents: {
    aadhaar: boolean;
    pan: boolean;
    resume: boolean;
    photo: boolean;
  };
  performance: {
    rating: number;
    lastReview: string;
  };
  avatar?: string;
}

const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Amit Sharma',
    email: 'amit@restaurant.com',
    phone: '+91 9876543210',
    position: 'Head Chef',
    department: 'Kitchen',
    employmentType: 'full-time',
    status: 'active',
    joiningDate: '2023-03-15T00:00:00Z',
    salary: 65000,
    experience: '8 years',
    skills: ['Indian Cuisine', 'Team Leadership', 'Menu Planning', 'Food Safety'],
    address: 'Bandra West, Mumbai, Maharashtra',
    emergencyContact: {
      name: 'Priya Sharma',
      phone: '+91 9876543211',
      relationship: 'Spouse'
    },
    documents: {
      aadhaar: true,
      pan: true,
      resume: true,
      photo: true
    },
    performance: {
      rating: 4.8,
      lastReview: '2024-01-01T00:00:00Z'
    }
  },
  {
    id: '2',
    name: 'Priya Patel',
    email: 'priya@restaurant.com',
    phone: '+91 9876543212',
    position: 'Sous Chef',
    department: 'Kitchen',
    employmentType: 'full-time',
    status: 'active',
    joiningDate: '2023-06-20T00:00:00Z',
    salary: 42000,
    experience: '5 years',
    skills: ['Continental', 'Pastry', 'Food Safety', 'Kitchen Management'],
    address: 'Andheri East, Mumbai, Maharashtra',
    emergencyContact: {
      name: 'Raj Patel',
      phone: '+91 9876543213',
      relationship: 'Father'
    },
    documents: {
      aadhaar: true,
      pan: true,
      resume: true,
      photo: true
    },
    performance: {
      rating: 4.5,
      lastReview: '2024-01-01T00:00:00Z'
    }
  },
  {
    id: '3',
    name: 'Rajesh Kumar',
    email: 'rajesh@restaurant.com',
    phone: '+91 9876543214',
    position: 'Senior Waiter',
    department: 'Service',
    employmentType: 'full-time',
    status: 'active',
    joiningDate: '2023-08-10T00:00:00Z',
    salary: 28000,
    experience: '3 years',
    skills: ['Customer Service', 'Hindi', 'English', 'POS Systems'],
    address: 'Powai, Mumbai, Maharashtra',
    emergencyContact: {
      name: 'Sunita Kumar',
      phone: '+91 9876543215',
      relationship: 'Mother'
    },
    documents: {
      aadhaar: true,
      pan: false,
      resume: true,
      photo: true
    },
    performance: {
      rating: 4.2,
      lastReview: '2023-12-15T00:00:00Z'
    }
  },
  {
    id: '4',
    name: 'Sneha Reddy',
    email: 'sneha@restaurant.com',
    phone: '+91 9876543216',
    position: 'Bartender',
    department: 'Bar',
    employmentType: 'part-time',
    status: 'on-leave',
    joiningDate: '2023-09-05T00:00:00Z',
    salary: 25000,
    experience: '2 years',
    skills: ['Mixology', 'Customer Service', 'Inventory Management'],
    address: 'Juhu, Mumbai, Maharashtra',
    emergencyContact: {
      name: 'Arun Reddy',
      phone: '+91 9876543217',
      relationship: 'Brother'
    },
    documents: {
      aadhaar: true,
      pan: true,
      resume: true,
      photo: false
    },
    performance: {
      rating: 4.0,
      lastReview: '2023-12-01T00:00:00Z'
    }
  },
];

const employeeStats = [
  {
    title: 'Total Employees',
    value: '47',
    change: '+5',
    changeType: 'increase' as const,
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
  },
  {
    title: 'Active Staff',
    value: '43',
    change: '+3',
    changeType: 'increase' as const,
    icon: UserCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
  },
  {
    title: 'On Leave',
    value: '3',
    change: '+1',
    changeType: 'increase' as const,
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
  },
  {
    title: 'Avg. Rating',
    value: '4.4',
    change: '+0.2',
    changeType: 'increase' as const,
    icon: Award,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
  },
];

export default function RestaurantEmployees() {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const getStatusColor = (status: Employee['status']) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'on-leave':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'terminated':
        return 'bg-destructive/10 text-destructive dark:bg-destructive/20';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getEmploymentTypeColor = (type: Employee['employmentType']) => {
    switch (type) {
      case 'full-time':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'part-time':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'contract':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'internship':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getDepartmentIcon = (department: string) => {
    switch (department.toLowerCase()) {
      case 'kitchen':
        return <ChefHat className="h-4 w-4" />;
      case 'service':
        return <Utensils className="h-4 w-4" />;
      case 'bar':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getDocumentCompleteness = (documents: Employee['documents']) => {
    const total = Object.keys(documents).length;
    const completed = Object.values(documents).filter(Boolean).length;
    return Math.round((completed / total) * 100);
  };

  const filteredEmployees = mockEmployees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || employee.department.toLowerCase() === departmentFilter;
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(employee => employee.id));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Employee Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage your restaurant staff and track performance
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance Report
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {employeeStats.map((stat, index) => {
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
                            this month
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

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search employees by name, position, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="all">All Departments</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="service">Service</option>
                    <option value="bar">Bar</option>
                    <option value="management">Management</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="on-leave">On Leave</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedEmployees.length > 0 && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg border-l-4 border-primary">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-primary font-medium">
                      {selectedEmployees.length} employee{selectedEmployees.length > 1 ? 's' : ''} selected
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        Send Message
                      </Button>
                      <Button variant="outline" size="sm">
                        Export Data
                      </Button>
                      <Button variant="outline" size="sm">
                        Mark Leave
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Employee List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold">
                Staff Directory ({filteredEmployees.length})
              </CardTitle>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-border"
                />
                <label className="text-sm text-muted-foreground">Select All</label>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className={cn(
                      'p-6 rounded-lg border transition-colors hover:bg-accent/30',
                      selectedEmployees.includes(employee.id) ? 'bg-primary/5 border-primary/20' : 'bg-background'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(employee.id)}
                          onChange={() => handleSelectEmployee(employee.id)}
                          className="mt-1 rounded border-border"
                        />
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{employee.name}</h3>
                            <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(employee.status)}`}>
                              {employee.status.replace('-', ' ')}
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full ${getEmploymentTypeColor(employee.employmentType)}`}>
                              {employee.employmentType.replace('-', ' ')}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-3 text-sm">
                                <div className="flex items-center space-x-1">
                                  {getDepartmentIcon(employee.department)}
                                  <span className="font-medium">{employee.position}</span>
                                </div>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-muted-foreground">{employee.department}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span>{employee.email}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span>{employee.phone}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Joined: {formatDate(employee.joiningDate, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Experience: {employee.experience}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm">
                                <Award className="h-4 w-4 text-yellow-500" />
                                <span>Rating: {employee.performance.rating}/5</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="text-sm">
                                <span className="text-muted-foreground">Documents: </span>
                                <span className="font-medium">{getDocumentCompleteness(employee.documents)}% complete</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {employee.skills.slice(0, 3).map((skill, index) => (
                                  <span
                                    key={index}
                                    className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {employee.skills.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{employee.skills.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredEmployees.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No employees found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || departmentFilter !== 'all' || statusFilter !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Get started by adding your first employee'
                      }
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Employee
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}