'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Calendar, Shield, Clock, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function AddEmployee() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [employee, setEmployee] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    role: '',
    department: '',
    hireDate: '',
    salary: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    schedule: {
      monday: { start: '09:00', end: '17:00', off: false },
      tuesday: { start: '09:00', end: '17:00', off: false },
      wednesday: { start: '09:00', end: '17:00', off: false },
      thursday: { start: '09:00', end: '17:00', off: false },
      friday: { start: '09:00', end: '17:00', off: false },
      saturday: { start: '09:00', end: '17:00', off: true },
      sunday: { start: '09:00', end: '17:00', off: true }
    },
    permissions: [] as string[],
    notes: ''
  });

  const roles = [
    'Manager', 'Assistant Manager', 'Server', 'Chef', 'Sous Chef', 
    'Cook', 'Prep Cook', 'Host', 'Cashier', 'Bartender', 'Busser', 'Dishwasher'
  ];

  const departments = [
    'Management', 'Front of House', 'Kitchen', 'Bar', 'Cleaning'
  ];

  const availablePermissions = [
    { id: 'orders', label: 'Manage Orders' },
    { id: 'menu', label: 'Edit Menu' },
    { id: 'customers', label: 'View Customer Data' },
    { id: 'inventory', label: 'Manage Inventory' },
    { id: 'reports', label: 'View Reports' },
    { id: 'employees', label: 'Manage Staff' },
    { id: 'settings', label: 'System Settings' }
  ];

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEmployee(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as object),
          [child]: value
        }
      }));
    } else {
      setEmployee(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleScheduleChange = (day: string, field: string, value: any) => {
    setEmployee(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day as keyof typeof prev.schedule],
          [field]: value
        }
      }
    }));
  };

  const togglePermission = (permissionId: string) => {
    setEmployee(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/restaurant/employees');
    } catch (error) {
      console.error('Error adding employee:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = employee.firstName && employee.lastName && employee.email && employee.role && employee.hireDate;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost"  onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Team
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Add New Employee</h1>
              <p className="text-muted-foreground">Create a new team member profile</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={!isFormValid || loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Adding...' : 'Add Employee'}
          </Button>
        </div>

        {!isFormValid && (
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription>
              Please fill in all required fields: First Name, Last Name, Email, Role, and Hire Date.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={employee.firstName}
                        onChange={(e) => e.target.value}
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={employee.lastName}
                        onChange={(e) => e.target.value}
                        placeholder="Smith"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          value={employee.email}
                          onChange={(e) => e.target.value}
                          className="pl-10"
                          placeholder="john.smith@restaurant.com"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          value={employee.phone}
                          onChange={(e) => e.target.value}
                          className="pl-10"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="address"
                        value={employee.address}
                        onChange={(e) => e.target.value}
                        className="pl-10"
                        placeholder="123 Main St, City, State 12345"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Employment Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Employment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role">Role *</Label>
                      <Select value={employee.role} onValueChange={(value) => handleInputChange('role', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Select value={employee.department} onValueChange={(value) => handleInputChange('department', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hireDate">Hire Date *</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="hireDate"
                          type="date"
                          value={employee.hireDate}
                          onChange={(e) => e.target.value}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="salary">Salary (Annual)</Label>
                      <Input
                        id="salary"
                        type="number"
                        value={employee.salary}
                        onChange={(e) => e.target.value}
                        placeholder="50000"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Emergency Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="emergencyName">Contact Name</Label>
                    <Input
                      id="emergencyName"
                      value={employee.emergencyContact.name}
                      onChange={(e) => e.target.value}
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="relationship">Relationship</Label>
                      <Input
                        id="relationship"
                        value={employee.emergencyContact.relationship}
                        onChange={(e) => e.target.value}
                        placeholder="Spouse, Parent, etc."
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyPhone">Phone Number</Label>
                      <Input
                        id="emergencyPhone"
                        value={employee.emergencyContact.phone}
                        onChange={(e) => e.target.value}
                        placeholder="+1 (555) 987-6543"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Work Schedule */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Default Work Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(employee.schedule).map(([day, hours]) => (
                    <div key={day} className="flex items-center space-x-4">
                      <div className="w-24">
                        <span className="font-medium capitalize">{day}</span>
                      </div>
                      <Checkbox
                        id={`${day}-off`}
                        checked={hours.off}
                        onChange={(e) => handleScheduleChange(day, 'off', (e.target as HTMLInputElement).checked)}
                      />
                      <Label htmlFor={`${day}-off`} className="text-sm">Off</Label>
                      {!hours.off && (
                        <>
                          <Input
                            type="time"
                            value={hours.start}
                            onChange={(e) => e.target.value}
                            className="w-32"
                          />
                          <span>to</span>
                          <Input
                            type="time"
                            value={hours.end}
                            onChange={(e) => e.target.value}
                            className="w-32"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Photo */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Profile Photo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-center">
                      <User className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Upload photo</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* System Permissions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>System Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {availablePermissions.map(permission => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.id}
                          checked={employee.permissions.includes(permission.id)}
                          onCheckedChange={() => togglePermission(permission.id)}
                        />
                        <Label htmlFor={permission.id} className="text-sm">
                          {permission.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notes */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={employee.notes}
                    onChange={(e) => e.target.value}
                    placeholder="Add any notes about this employee..."
                    rows={4}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}