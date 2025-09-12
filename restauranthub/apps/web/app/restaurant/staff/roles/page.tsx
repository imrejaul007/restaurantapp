'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Users, 
  Edit,
  Trash2,
  Plus,
  Eye,
  Settings,
  UserCheck,
  UserX,
  Crown,
  Key,
  Search,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'orders' | 'menu' | 'staff' | 'settings' | 'reports' | 'inventory';
}

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: string[];
  staffCount: number;
  isDefault: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mock data
const permissions: Permission[] = [
  // Orders permissions
  { id: 'orders.view', name: 'View Orders', description: 'View all restaurant orders', category: 'orders' },
  { id: 'orders.create', name: 'Create Orders', description: 'Create new orders', category: 'orders' },
  { id: 'orders.edit', name: 'Edit Orders', description: 'Modify existing orders', category: 'orders' },
  { id: 'orders.delete', name: 'Delete Orders', description: 'Cancel or delete orders', category: 'orders' },
  { id: 'orders.refund', name: 'Process Refunds', description: 'Handle order refunds', category: 'orders' },
  
  // Menu permissions
  { id: 'menu.view', name: 'View Menu', description: 'View restaurant menu items', category: 'menu' },
  { id: 'menu.create', name: 'Create Menu Items', description: 'Add new menu items', category: 'menu' },
  { id: 'menu.edit', name: 'Edit Menu', description: 'Modify menu items and prices', category: 'menu' },
  { id: 'menu.delete', name: 'Delete Menu Items', description: 'Remove menu items', category: 'menu' },
  
  // Staff permissions
  { id: 'staff.view', name: 'View Staff', description: 'View staff members', category: 'staff' },
  { id: 'staff.create', name: 'Hire Staff', description: 'Add new staff members', category: 'staff' },
  { id: 'staff.edit', name: 'Edit Staff', description: 'Modify staff information', category: 'staff' },
  { id: 'staff.delete', name: 'Remove Staff', description: 'Remove staff members', category: 'staff' },
  { id: 'staff.roles', name: 'Manage Roles', description: 'Create and assign roles', category: 'staff' },
  
  // Inventory permissions
  { id: 'inventory.view', name: 'View Inventory', description: 'View inventory levels', category: 'inventory' },
  { id: 'inventory.edit', name: 'Manage Inventory', description: 'Update inventory quantities', category: 'inventory' },
  { id: 'inventory.purchase', name: 'Purchase Orders', description: 'Create purchase orders', category: 'inventory' },
  
  // Reports permissions
  { id: 'reports.view', name: 'View Reports', description: 'Access restaurant reports', category: 'reports' },
  { id: 'reports.export', name: 'Export Reports', description: 'Export report data', category: 'reports' },
  
  // Settings permissions
  { id: 'settings.general', name: 'General Settings', description: 'Modify restaurant settings', category: 'settings' },
  { id: 'settings.payment', name: 'Payment Settings', description: 'Configure payment methods', category: 'settings' },
  { id: 'settings.system', name: 'System Settings', description: 'Advanced system configuration', category: 'settings' },
];

const roles: Role[] = [
  {
    id: '1',
    name: 'Owner',
    description: 'Full access to all restaurant operations and settings',
    color: 'bg-purple-500',
    permissions: permissions.map(p => p.id),
    staffCount: 1,
    isDefault: false,
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Manager',
    description: 'Manage daily operations, staff, and reports',
    color: 'bg-blue-500',
    permissions: [
      'orders.view', 'orders.create', 'orders.edit', 'orders.refund',
      'menu.view', 'menu.edit',
      'staff.view', 'staff.edit',
      'inventory.view', 'inventory.edit',
      'reports.view', 'reports.export',
      'settings.general'
    ],
    staffCount: 3,
    isDefault: true,
    isSystem: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '3',
    name: 'Head Chef',
    description: 'Manage kitchen operations, menu, and inventory',
    color: 'bg-orange-500',
    permissions: [
      'orders.view',
      'menu.view', 'menu.create', 'menu.edit', 'menu.delete',
      'inventory.view', 'inventory.edit', 'inventory.purchase',
      'reports.view'
    ],
    staffCount: 2,
    isDefault: false,
    isSystem: false,
    createdAt: '2024-01-05T14:20:00Z',
    updatedAt: '2024-01-20T16:45:00Z',
  },
  {
    id: '4',
    name: 'Server',
    description: 'Handle orders and customer service',
    color: 'bg-green-500',
    permissions: [
      'orders.view', 'orders.create', 'orders.edit',
      'menu.view'
    ],
    staffCount: 8,
    isDefault: false,
    isSystem: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-25T09:15:00Z',
  },
  {
    id: '5',
    name: 'Cook',
    description: 'Access to kitchen orders and basic menu information',
    color: 'bg-yellow-500',
    permissions: [
      'orders.view',
      'menu.view',
      'inventory.view'
    ],
    staffCount: 5,
    isDefault: false,
    isSystem: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-18T11:30:00Z',
  },
];

const categoryColors = {
  orders: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  menu: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  staff: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  inventory: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  reports: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  settings: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export default function StaffRoleManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    color: 'bg-blue-500'
  });

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRole = () => {
    console.log('Creating role:', { ...newRole, permissions: selectedPermissions });
    setIsCreateDialogOpen(false);
    setNewRole({ name: '', description: '', color: 'bg-blue-500' });
    setSelectedPermissions([]);
  };

  const handleEditRole = () => {
    if (!selectedRole) return;
    console.log('Editing role:', selectedRole.id, { permissions: selectedPermissions });
    setIsEditDialogOpen(false);
    setSelectedRole(null);
    setSelectedPermissions([]);
  };

  const handleDeleteRole = (roleId: string) => {
    if (window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      console.log('Deleting role:', roleId);
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Staff Role Management</h1>
            <p className="text-muted-foreground mt-1">
              Define roles and permissions for your restaurant staff
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>
                  Define a new role with specific permissions for your staff
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="roleName">Role Name</Label>
                    <Input
                      id="roleName"
                      placeholder="e.g., Assistant Manager"
                      value={newRole.name}
                      onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roleColor">Color</Label>
                    <Select
                      value={newRole.color}
                      onValueChange={(color) => setNewRole({ ...newRole, color })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bg-blue-500">Blue</SelectItem>
                        <SelectItem value="bg-green-500">Green</SelectItem>
                        <SelectItem value="bg-purple-500">Purple</SelectItem>
                        <SelectItem value="bg-orange-500">Orange</SelectItem>
                        <SelectItem value="bg-red-500">Red</SelectItem>
                        <SelectItem value="bg-yellow-500">Yellow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roleDescription">Description</Label>
                  <Textarea
                    id="roleDescription"
                    placeholder="Describe the role responsibilities..."
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  />
                </div>
                <div className="space-y-4">
                  <Label>Permissions</Label>
                  {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-medium text-sm capitalize flex items-center">
                        <Badge variant="secondary" className={categoryColors[category as keyof typeof categoryColors]}>
                          {category}
                        </Badge>
                      </h4>
                      <div className="grid grid-cols-1 gap-2 ml-4">
                        {categoryPermissions.map(permission => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission.id}
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={() => togglePermission(permission.id)}
                            />
                            <Label htmlFor={permission.id} className="text-sm">
                              <div>
                                <div className="font-medium">{permission.name}</div>
                                <div className="text-xs text-muted-foreground">{permission.description}</div>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRole}>
                    Create Role
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search roles..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${role.color}`}>
                        {role.isSystem ? (
                          <Crown className="h-5 w-5 text-white" />
                        ) : (
                          <Shield className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {role.name}
                          {role.isDefault && <Badge variant="secondary">Default</Badge>}
                          {role.isSystem && <Badge variant="destructive">System</Badge>}
                        </CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {role.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Staff Members</span>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{role.staffCount}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Permissions</span>
                    <div className="flex items-center space-x-1">
                      <Key className="h-4 w-4" />
                      <span className="font-medium">{role.permissions.length}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRole(role);
                          setSelectedPermissions(role.permissions);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      {!role.isSystem && (
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRole(role);
                              setSelectedPermissions(role.permissions);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRole(role.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Edit/View Role Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedRole?.isSystem ? 'View Role' : 'Edit Role'}: {selectedRole?.name}
              </DialogTitle>
              <DialogDescription>
                {selectedRole?.isSystem 
                  ? 'System roles cannot be modified'
                  : 'Modify role permissions and settings'
                }
              </DialogDescription>
            </DialogHeader>
            {selectedRole && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role Name</Label>
                    <Input
                      value={selectedRole.name}
                      disabled={selectedRole.isSystem}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Staff Members</Label>
                    <Input
                      value={`${selectedRole.staffCount} members`}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={selectedRole.description}
                    disabled={selectedRole.isSystem}
                    readOnly
                  />
                </div>
                <div className="space-y-4">
                  <Label>Permissions</Label>
                  {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-medium text-sm capitalize flex items-center">
                        <Badge variant="secondary" className={categoryColors[category as keyof typeof categoryColors]}>
                          {category}
                        </Badge>
                      </h4>
                      <div className="grid grid-cols-1 gap-2 ml-4">
                        {categoryPermissions.map(permission => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-${permission.id}`}
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={() => !selectedRole.isSystem && togglePermission(permission.id)}
                              disabled={selectedRole.isSystem}
                            />
                            <Label htmlFor={`edit-${permission.id}`} className="text-sm">
                              <div>
                                <div className="font-medium">{permission.name}</div>
                                <div className="text-xs text-muted-foreground">{permission.description}</div>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    {selectedRole.isSystem ? 'Close' : 'Cancel'}
                  </Button>
                  {!selectedRole.isSystem && (
                    <Button onClick={handleEditRole}>
                      Save Changes
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}