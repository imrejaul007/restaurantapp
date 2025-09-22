'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar,
  Clock,
  Users,
  Plus,
  Edit,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Upload,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle,
  MoreHorizontal
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatDate, formatTime } from '@/lib/utils';

interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar?: string;
  hourlyRate: number;
}

interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in hours
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  department: string;
  notes?: string;
  clockIn?: string;
  clockOut?: string;
  breaks: { start: string; end: string; duration: number }[];
  totalPay: number;
}

interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  department: string;
  role: string;
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
  isActive: boolean;
}

// Mock data
const staff: Staff[] = [
  { id: '1', name: 'John Smith', role: 'Server', department: 'Front of House', hourlyRate: 15 },
  { id: '2', name: 'Maria Garcia', role: 'Chef', department: 'Kitchen', hourlyRate: 22 },
  { id: '3', name: 'David Chen', role: 'Manager', department: 'Management', hourlyRate: 25 },
  { id: '4', name: 'Sarah Johnson', role: 'Bartender', department: 'Bar', hourlyRate: 18 },
  { id: '5', name: 'Mike Wilson', role: 'Cook', department: 'Kitchen', hourlyRate: 16 },
  { id: '6', name: 'Lisa Brown', role: 'Host', department: 'Front of House', hourlyRate: 14 },
];

const shifts: Shift[] = [
  {
    id: '1',
    staffId: '1',
    staffName: 'John Smith',
    role: 'Server',
    date: '2024-01-15',
    startTime: '09:00',
    endTime: '17:00',
    duration: 8,
    status: 'completed',
    department: 'Front of House',
    clockIn: '08:58',
    clockOut: '17:05',
    breaks: [{ start: '12:00', end: '12:30', duration: 0.5 }],
    totalPay: 120,
  },
  {
    id: '2',
    staffId: '2',
    staffName: 'Maria Garcia',
    role: 'Chef',
    date: '2024-01-15',
    startTime: '10:00',
    endTime: '22:00',
    duration: 12,
    status: 'completed',
    department: 'Kitchen',
    clockIn: '09:55',
    clockOut: '22:10',
    breaks: [
      { start: '14:00', end: '14:30', duration: 0.5 },
      { start: '18:00', end: '18:15', duration: 0.25 }
    ],
    totalPay: 264,
  },
  {
    id: '3',
    staffId: '3',
    staffName: 'David Chen',
    role: 'Manager',
    date: '2024-01-16',
    startTime: '08:00',
    endTime: '16:00',
    duration: 8,
    status: 'in-progress',
    department: 'Management',
    clockIn: '07:58',
    breaks: [],
    totalPay: 200,
  },
  {
    id: '4',
    staffId: '4',
    staffName: 'Sarah Johnson',
    role: 'Bartender',
    date: '2024-01-16',
    startTime: '18:00',
    endTime: '02:00',
    duration: 8,
    status: 'scheduled',
    department: 'Bar',
    breaks: [{ start: '22:00', end: '22:30', duration: 0.5 }],
    totalPay: 144,
  },
  {
    id: '5',
    staffId: '5',
    staffName: 'Mike Wilson',
    role: 'Cook',
    date: '2024-01-16',
    startTime: '11:00',
    endTime: '19:00',
    duration: 8,
    status: 'scheduled',
    department: 'Kitchen',
    breaks: [{ start: '15:00', end: '15:30', duration: 0.5 }],
    totalPay: 128,
  },
];

const shiftTemplates: ShiftTemplate[] = [
  {
    id: '1',
    name: 'Morning Shift',
    startTime: '09:00',
    endTime: '17:00',
    department: 'Front of House',
    role: 'Server',
    daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
    isActive: true,
  },
  {
    id: '2',
    name: 'Evening Shift',
    startTime: '17:00',
    endTime: '01:00',
    department: 'Front of House',
    role: 'Server',
    daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday to Saturday
    isActive: true,
  },
  {
    id: '3',
    name: 'Kitchen Day',
    startTime: '10:00',
    endTime: '22:00',
    department: 'Kitchen',
    role: 'Chef',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All week
    isActive: true,
  },
];

const departments = ['All', 'Front of House', 'Kitchen', 'Bar', 'Management'];
const roles = ['All', 'Server', 'Chef', 'Cook', 'Bartender', 'Manager', 'Host'];

export default function ShiftManagement() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedRole, setSelectedRole] = useState('All');
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [isCreateShiftOpen, setIsCreateShiftOpen] = useState(false);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [newShift, setNewShift] = useState({
    staffId: '',
    date: '',
    startTime: '',
    endTime: '',
    department: '',
    notes: ''
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in-progress':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'no-show':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'in-progress':
        return <UserCheck className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <UserX className="h-4 w-4" />;
      case 'no-show':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredShifts = shifts.filter(shift => {
    if (selectedDepartment !== 'All' && shift.department !== selectedDepartment) return false;
    if (selectedRole !== 'All' && shift.role !== selectedRole) return false;
    return true;
  });

  const calculateWeeklyHours = (staffId: string) => {
    return shifts
      .filter(shift => shift.staffId === staffId && shift.status !== 'cancelled')
      .reduce((total, shift) => total + shift.duration, 0);
  };

  const handleCreateShift = () => {
    console.log('Creating shift:', newShift);
    setIsCreateShiftOpen(false);
    setNewShift({
      staffId: '',
      date: '',
      startTime: '',
      endTime: '',
      department: '',
      notes: ''
    });
  };

  const handleClockIn = (shiftId: string) => {
    console.log('Clocking in for shift:', shiftId);
  };

  const handleClockOut = (shiftId: string) => {
    console.log('Clocking out for shift:', shiftId);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Shift Management</h1>
            <p className="text-muted-foreground mt-1">
              Schedule and manage staff shifts, track attendance and hours
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button variant="outline" size="default">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="default">
                  <Copy className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              </DialogTrigger>
            </Dialog>
            <Dialog open={isCreateShiftOpen} onOpenChange={setIsCreateShiftOpen}>
              <DialogTrigger asChild>
                <Button size="default">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Shift
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule New Shift</DialogTitle>
                  <DialogDescription>
                    Create a new shift assignment for staff
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="staff">Staff Member</Label>
                      <Select
                        value={newShift.staffId}
                        onValueChange={(value) => setNewShift({ ...newShift, staffId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff" />
                        </SelectTrigger>
                        <SelectContent>
                          {staff.map(member => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name} - {member.role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newShift.date}
                        onChange={(e) => setNewShift({ ...newShift, date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={newShift.startTime}
                        onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={newShift.endTime}
                        onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={newShift.department}
                      onValueChange={(value) => setNewShift({ ...newShift, department: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.filter(dept => dept !== 'All').map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Special instructions or notes..."
                      value={newShift.notes}
                      onChange={(e) => setNewShift({ ...newShift, notes: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateShiftOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateShift}>
                      Schedule Shift
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today's Shifts</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg dark:bg-blue-900">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Now</p>
                  <p className="text-2xl font-bold">7</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg dark:bg-green-900">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Weekly Hours</p>
                  <p className="text-2xl font-bold">324</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg dark:bg-purple-900">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Labor Cost</p>
                  <p className="text-2xl font-bold">₹5,680</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg dark:bg-orange-900">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and View Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="default"
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="default"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="default"
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-6">
            {/* Shifts List */}
            <Card>
              <CardHeader>
                <CardTitle>Current Shifts</CardTitle>
                <CardDescription>
                  Manage scheduled shifts and track attendance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredShifts.map((shift, index) => (
                    <motion.div
                      key={shift.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{shift.staffName}</h4>
                          <p className="text-sm text-muted-foreground">{shift.role} • {shift.department}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className={getStatusColor(shift.status)}>
                              {getStatusIcon(shift.status)}
                              <span className="ml-1">{shift.status}</span>
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(shift.date, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {shift.startTime} - {shift.endTime}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {shift.duration}h • ₹{shift.totalPay}
                        </div>
                        {shift.clockIn && (
                          <div className="text-xs text-muted-foreground mt-1">
                            In: {shift.clockIn} {shift.clockOut && `• Out: ${shift.clockOut}`}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {shift.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleClockIn(shift.id)}
                          >
                            Clock In
                          </Button>
                        )}
                        {shift.status === 'in-progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleClockOut(shift.id)}
                          >
                            Clock Out
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Shift
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Cancel Shift
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timesheets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Staff Timesheets</CardTitle>
                <CardDescription>
                  Review worked hours and calculate payroll
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staff.map((member, index) => {
                    const weeklyHours = calculateWeeklyHours(member.id);
                    const weeklyPay = weeklyHours * member.hourlyRate;
                    return (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">{member.name}</h4>
                            <p className="text-sm text-muted-foreground">{member.role} • {member.department}</p>
                            <p className="text-xs text-muted-foreground">₹{member.hourlyRate}/hour</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{weeklyHours}h this week</div>
                          <div className="text-sm text-muted-foreground">₹{weeklyPay} earned</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {weeklyHours > 40 ? `${weeklyHours - 40}h overtime` : 'Regular hours'}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shift Templates</CardTitle>
                <CardDescription>
                  Create reusable shift patterns for quick scheduling
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shiftTemplates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center dark:bg-purple-900">
                          <Calendar className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {template.startTime} - {template.endTime} • {template.role}
                          </p>
                          <p className="text-xs text-muted-foreground">{template.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm">
                            {template.daysOfWeek.length === 7 ? 'Every day' : 
                             template.daysOfWeek.length === 5 ? 'Weekdays' : 
                             `${template.daysOfWeek.length} days/week`}
                          </div>
                          <Badge variant={template.isActive ? 'default' : 'secondary'}>
                            {template.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}