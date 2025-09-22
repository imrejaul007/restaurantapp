'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Shield,
  Edit,
  Ban,
  CheckCircle,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Building2,
  Users,
  Package,
  Star,
  Activity,
  Settings,
  Download,
  Eye,
  MessageSquare,
  Flag,
  MoreHorizontal,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: 'restaurant' | 'employee' | 'vendor' | 'user';
  status: 'active' | 'suspended' | 'pending' | 'banned';
  verified: boolean;
  joinedAt: string;
  lastLogin: string;
  location: string;
  stats: {
    totalOrders: number;
    totalSpent: number;
    reviews: number;
    rating: number;
  };
  profile: any;
}

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  details: string;
  severity: 'low' | 'medium' | 'high';
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data
      const mockUser: User = {
        id: userId,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        phone: '+1 (555) 123-4567',
        avatar: '/avatars/sarah.jpg',
        role: 'restaurant',
        status: 'active',
        verified: true,
        joinedAt: '2023-06-15T10:30:00Z',
        lastLogin: '2024-01-15T14:20:00Z',
        location: 'New York, NY',
        stats: {
          totalOrders: 156,
          totalSpent: 12450.50,
          reviews: 89,
          rating: 4.7
        },
        profile: {
          restaurantName: 'The Golden Spoon',
          cuisine: 'Italian',
          description: 'Authentic Italian cuisine with a modern twist',
          seatingCapacity: 45,
          website: 'https://goldespoon.com'
        }
      };

      const mockLogs: ActivityLog[] = [
        {
          id: '1',
          action: 'Login',
          timestamp: '2024-01-15T14:20:00Z',
          details: 'Successful login from 192.168.1.1',
          severity: 'low'
        },
        {
          id: '2',
          action: 'Profile Updated',
          timestamp: '2024-01-14T09:15:00Z',
          details: 'Updated restaurant description and hours',
          severity: 'low'
        },
        {
          id: '3',
          action: 'Payment Issue',
          timestamp: '2024-01-12T16:45:00Z',
          details: 'Failed payment attempt for subscription',
          severity: 'medium'
        },
        {
          id: '4',
          action: 'Review Flagged',
          timestamp: '2024-01-10T11:30:00Z',
          details: 'Review flagged by customer for inappropriate content',
          severity: 'high'
        }
      ];

      setUser(mockUser);
      setActivityLogs(mockLogs);
    } catch (error) {
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspendUser = () => {
    router.push(`/admin/users/${userId}/ban?action=suspend`);
  };

  const handleBanUser = () => {
    router.push(`/admin/users/${userId}/ban?action=ban`);
  };

  const handleEditUser = () => {
    toast.success('Edit functionality would open a modal or dedicated page');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'suspended': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'banned': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'restaurant': return Building2;
      case 'employee': return Users;
      case 'vendor': return Package;
      default: return Star;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-muted rounded animate-pulse" />
              <div className="h-96 bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-muted rounded animate-pulse" />
              <div className="h-64 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">User Not Found</h3>
          <p className="text-muted-foreground mb-4">The user you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const RoleIcon = getRoleIcon(user.role);

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => router.back()}
            variant="outline"
            
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">User Details</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleEditUser} variant="outline" >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleSuspendUser}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Suspend User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBanUser} className="text-destructive">
                <Ban className="h-4 w-4 mr-2" />
                Ban User
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-lg">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h2 className="text-xl font-semibold">{user.name}</h2>
                      {user.verified && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                      <RoleIcon className="h-4 w-4" />
                      <span className="capitalize">{user.role}</span>
                      <span>•</span>
                      <span>ID: {user.id}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                      {user.role === 'restaurant' && (
                        <Badge variant="outline">
                          {user.profile.restaurantName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{user.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{user.location}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {new Date(user.joinedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Last login {new Date(user.lastLogin).toLocaleDateString()}</span>
                  </div>
                  {user.role === 'restaurant' && user.profile.website && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={user.profile.website} target="_blank" rel="noopener noreferrer" 
                         className="text-primary hover:underline">
                        {user.profile.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Information Tabs */}
          <Card>
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="activity" className="space-y-4">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                        <div className={cn("w-2 h-2 rounded-full mt-2", getSeverityColor(log.severity))} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm">{log.action}</h4>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{log.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </TabsContent>

              <TabsContent value="orders" className="space-y-4">
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Order history would be displayed here</p>
                  </div>
                </CardContent>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                <CardHeader>
                  <CardTitle>Reviews & Ratings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Reviews would be displayed here</p>
                  </div>
                </CardContent>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Account settings would be displayed here</p>
                  </div>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{user.stats.totalOrders}</div>
                  <div className="text-xs text-muted-foreground">Total Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">${user.stats.totalSpent.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Total Spent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{user.stats.reviews}</div>
                  <div className="text-xs text-muted-foreground">Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{user.stats.rating}</div>
                  <div className="text-xs text-muted-foreground">Avg Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Eye className="h-4 w-4 mr-2" />
                View Profile Page
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Flag className="h-4 w-4 mr-2" />
                Flag for Review
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive">
                <Ban className="h-4 w-4 mr-2" />
                Manage Access
              </Button>
            </CardContent>
          </Card>

          {/* Profile Specific Info */}
          {user.role === 'restaurant' && (
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium">Cuisine Type</div>
                  <div className="text-sm text-muted-foreground">{user.profile.cuisine}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Seating Capacity</div>
                  <div className="text-sm text-muted-foreground">{user.profile.seatingCapacity} seats</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Description</div>
                  <div className="text-sm text-muted-foreground">{user.profile.description}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}