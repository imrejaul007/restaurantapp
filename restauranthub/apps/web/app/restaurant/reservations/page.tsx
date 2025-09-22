'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar as CalendarIcon,
  Clock,
  Users,
  Phone,
  Mail,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  Upload,
  MessageSquare,
  Star,
  MapPin,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Reservation {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  partySize: number;
  tableNumber?: string;
  status: 'confirmed' | 'pending' | 'seated' | 'completed' | 'cancelled' | 'no-show';
  specialRequests?: string;
  occasion?: string;
  source: 'phone' | 'online' | 'walk-in' | 'app';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

const mockReservations: Reservation[] = [
  {
    id: 'res-001',
    customerName: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1 (555) 123-4567',
    date: '2024-01-20',
    time: '19:00',
    partySize: 4,
    tableNumber: 'T-12',
    status: 'confirmed',
    specialRequests: 'Window seat preferred, celebrating anniversary',
    occasion: 'Anniversary',
    source: 'online',
    notes: 'VIP customer - regular visitor',
    createdAt: '2024-01-18 10:30',
    updatedAt: '2024-01-19 14:20',
    tags: ['VIP', 'Anniversary', 'Regular']
  },
  {
    id: 'res-002',
    customerName: 'Sarah Johnson',
    email: 'sarah.j@gmail.com',
    phone: '+1 (555) 987-6543',
    date: '2024-01-20',
    time: '18:30',
    partySize: 2,
    status: 'pending',
    specialRequests: 'Vegetarian options needed',
    source: 'phone',
    createdAt: '2024-01-19 15:45',
    updatedAt: '2024-01-19 15:45',
    tags: ['Vegetarian']
  },
  {
    id: 'res-003',
    customerName: 'Michael Brown',
    email: 'mike.brown@company.com',
    phone: '+1 (555) 456-7890',
    date: '2024-01-20',
    time: '20:00',
    partySize: 8,
    tableNumber: 'P-01',
    status: 'confirmed',
    specialRequests: 'Business dinner, private room requested',
    occasion: 'Business',
    source: 'phone',
    notes: 'Corporate account - invoice billing',
    createdAt: '2024-01-17 09:15',
    updatedAt: '2024-01-18 11:30',
    tags: ['Corporate', 'Private Room']
  },
  {
    id: 'res-004',
    customerName: 'Emily Davis',
    email: 'emily.davis@email.com',
    phone: '+1 (555) 321-0987',
    date: '2024-01-19',
    time: '19:30',
    partySize: 6,
    tableNumber: 'B-03',
    status: 'seated',
    specialRequests: 'Birthday celebration',
    occasion: 'Birthday',
    source: 'app',
    createdAt: '2024-01-19 12:00',
    updatedAt: '2024-01-19 19:25',
    tags: ['Birthday', 'Family']
  },
  {
    id: 'res-005',
    customerName: 'David Wilson',
    email: 'david.wilson@email.com',
    phone: '+1 (555) 654-3210',
    date: '2024-01-19',
    time: '18:00',
    partySize: 2,
    status: 'no-show',
    source: 'online',
    createdAt: '2024-01-18 20:30',
    updatedAt: '2024-01-19 18:15',
    tags: ['No-Show']
  }
];

export default function ReservationSystem() {
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isAddReservationOpen, setIsAddReservationOpen] = useState(false);
  const [isEditReservationOpen, setIsEditReservationOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [newReservation, setNewReservation] = useState({
    customerName: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    partySize: 2,
    specialRequests: '',
    occasion: '',
    source: 'phone',
    notes: '',
    tags: [] as string[]
  });

  const timeSlots = [
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', 
    '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  const occasions = [
    'Birthday', 'Anniversary', 'Business', 'Date Night', 
    'Family Gathering', 'Celebration', 'Other'
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500 text-white';
      case 'pending': return 'bg-yellow-500 text-white';
      case 'seated': return 'bg-blue-500 text-white';
      case 'completed': return 'bg-gray-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      case 'no-show': return 'bg-orange-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'seated': return <Users className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'no-show': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    const statusMatch = filterStatus === 'all' || reservation.status === filterStatus;
    const searchMatch = searchTerm === '' || 
      reservation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.phone.includes(searchTerm);
    
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const dateMatch = reservation.date === selectedDateStr;
    
    return statusMatch && searchMatch && dateMatch;
  });

  const updateReservationStatus = (reservationId: string, newStatus: Reservation['status']) => {
    setReservations(prev =>
      prev.map(reservation =>
        reservation.id === reservationId 
          ? { ...reservation, status: newStatus, updatedAt: new Date().toLocaleString() }
          : reservation
      )
    );
  };

  const addReservation = () => {
    const reservation: Reservation = {
      id: `res-${Date.now()}`,
      customerName: newReservation.customerName,
      email: newReservation.email,
      phone: newReservation.phone,
      date: newReservation.date,
      time: newReservation.time,
      partySize: newReservation.partySize,
      status: 'pending',
      specialRequests: newReservation.specialRequests || undefined,
      occasion: newReservation.occasion || undefined,
      source: newReservation.source as any,
      notes: newReservation.notes || undefined,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
      tags: newReservation.tags
    };

    setReservations(prev => [...prev, reservation]);
    setNewReservation({
      customerName: '',
      email: '',
      phone: '',
      date: '',
      time: '',
      partySize: 2,
      specialRequests: '',
      occasion: '',
      source: 'phone',
      notes: '',
      tags: []
    });
    setIsAddReservationOpen(false);
  };

  const openReservationDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsDetailsOpen(true);
  };

  const reservationStats = {
    total: reservations.filter(r => r.date === selectedDate.toISOString().split('T')[0]).length,
    confirmed: reservations.filter(r => r.date === selectedDate.toISOString().split('T')[0] && r.status === 'confirmed').length,
    pending: reservations.filter(r => r.date === selectedDate.toISOString().split('T')[0] && r.status === 'pending').length,
    seated: reservations.filter(r => r.date === selectedDate.toISOString().split('T')[0] && r.status === 'seated').length,
    totalGuests: reservations.filter(r => r.date === selectedDate.toISOString().split('T')[0]).reduce((sum, r) => sum + r.partySize, 0)
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reservation System</h1>
            <p className="text-muted-foreground mt-1">
              Manage restaurant reservations and table bookings
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button variant="outline"  size="default">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline"  size="default">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Dialog open={isAddReservationOpen} onOpenChange={setIsAddReservationOpen}>
              <DialogTrigger asChild>
                <Button  size="default" variant="default">
                  <Plus className="h-4 w-4 mr-2" />
                  New Reservation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Reservation</DialogTitle>
                  <DialogDescription>
                    Add a new table reservation for a customer
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer-name">Customer Name *</Label>
                    <Input
                      id="customer-name"
                      value={newReservation.customerName}
                      onChange={(e) => setNewReservation(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="party-size">Party Size *</Label>
                    <Select value={newReservation.partySize.toString()} onValueChange={(value) => setNewReservation(prev => ({ ...prev, partySize: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(size => (
                          <SelectItem key={size} value={size.toString()}>{size} {size === 1 ? 'person' : 'people'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newReservation.email}
                      onChange={(e) => setNewReservation(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={newReservation.phone}
                      onChange={(e) => setNewReservation(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newReservation.date}
                      onChange={(e) => setNewReservation(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time *</Label>
                    <Select value={newReservation.time} onValueChange={(value) => setNewReservation(prev => ({ ...prev, time: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="occasion">Occasion</Label>
                    <Select value={newReservation.occasion} onValueChange={(value) => setNewReservation(prev => ({ ...prev, occasion: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select occasion" />
                      </SelectTrigger>
                      <SelectContent>
                        {occasions.map(occasion => (
                          <SelectItem key={occasion} value={occasion}>{occasion}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="source">Source</Label>
                    <Select value={newReservation.source} onValueChange={(value) => setNewReservation(prev => ({ ...prev, source: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="walk-in">Walk-in</SelectItem>
                        <SelectItem value="app">App</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="special-requests">Special Requests</Label>
                    <Textarea
                      id="special-requests"
                      value={newReservation.specialRequests}
                      onChange={(e) => setNewReservation(prev => ({ ...prev, specialRequests: e.target.value }))}
                      placeholder="Any special requests or dietary requirements..."
                      rows={2}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="notes">Internal Notes</Label>
                    <Textarea
                      id="notes"
                      value={newReservation.notes}
                      onChange={(e) => setNewReservation(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Internal notes for staff..."
                      rows={2}
                    />
                  </div>
                  <div className="col-span-2 flex space-x-2">
                    <Button onClick={addReservation} className="flex-1" size="default" variant="default">
                      Create Reservation
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddReservationOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {/* Daily Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Daily Stats</CardTitle>
                <CardDescription>
                  {selectedDate.toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Reservations</span>
                  <span className="font-semibold">{reservationStats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Confirmed</span>
                  <span className="font-semibold text-green-600">{reservationStats.confirmed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="font-semibold text-yellow-600">{reservationStats.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Currently Seated</span>
                  <span className="font-semibold text-blue-600">{reservationStats.seated}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Guests</span>
                  <span className="font-semibold">{reservationStats.totalGuests}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reservations List */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="seated">Seated</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no-show">No-Show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reservations Cards */}
            <div className="space-y-4">
              <AnimatePresence>
                {filteredReservations.map((reservation, index) => (
                  <motion.div
                    key={reservation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openReservationDetails(reservation)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <Users className="h-6 w-6 text-primary" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-semibold truncate">{reservation.customerName}</h3>
                                <Badge className={cn("text-xs", getStatusColor(reservation.status))}>
                                  <div className="flex items-center space-x-1">
                                    {getStatusIcon(reservation.status)}
                                    <span className="capitalize">{reservation.status}</span>
                                  </div>
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{reservation.time}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Users className="h-4 w-4" />
                                  <span>{reservation.partySize} people</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Phone className="h-4 w-4" />
                                  <span>{reservation.phone}</span>
                                </div>
                                {reservation.tableNumber && (
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>Table {reservation.tableNumber}</span>
                                  </div>
                                )}
                              </div>
                              {reservation.specialRequests && (
                                <p className="text-sm text-orange-600 mt-1 truncate">
                                  <MessageSquare className="h-3 w-3 inline mr-1" />
                                  {reservation.specialRequests}
                                </p>
                              )}
                              {reservation.tags && reservation.tags.length > 0 && (
                                <div className="flex space-x-1 mt-2">
                                  {reservation.tags.slice(0, 3).map((tag, tagIndex) => (
                                    <Badge key={tagIndex} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {reservation.tags.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{reservation.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            {reservation.status === 'pending' && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateReservationStatus(reservation.id, 'confirmed');
                                  }}
                                >
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateReservationStatus(reservation.id, 'cancelled');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            )}
                            {reservation.status === 'confirmed' && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateReservationStatus(reservation.id, 'seated');
                                  }}
                                >
                                  Seat Party
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateReservationStatus(reservation.id, 'no-show');
                                  }}
                                >
                                  No-Show
                                </Button>
                              </div>
                            )}
                            {reservation.status === 'seated' && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateReservationStatus(reservation.id, 'completed');
                                }}
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredReservations.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Reservations Found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'Try adjusting your search or filters'
                        : `No reservations scheduled for ${selectedDate.toLocaleDateString()}`
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Reservation Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Reservation Details</span>
              </DialogTitle>
              <DialogDescription>
                Complete reservation information and management
              </DialogDescription>
            </DialogHeader>
            {selectedReservation && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Customer Name</Label>
                    <p className="font-semibold">{selectedReservation.customerName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge className={cn("ml-2", getStatusColor(selectedReservation.status))}>
                      {selectedReservation.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Date & Time</Label>
                    <p className="font-semibold">{selectedReservation.date} at {selectedReservation.time}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Party Size</Label>
                    <p className="font-semibold">{selectedReservation.partySize} people</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                    <p className="font-semibold">{selectedReservation.phone}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="font-semibold">{selectedReservation.email}</p>
                  </div>
                  {selectedReservation.tableNumber && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Table</Label>
                      <p className="font-semibold">Table {selectedReservation.tableNumber}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Source</Label>
                    <p className="font-semibold capitalize">{selectedReservation.source}</p>
                  </div>
                </div>

                {selectedReservation.occasion && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Occasion</Label>
                    <p className="font-semibold">{selectedReservation.occasion}</p>
                  </div>
                )}

                {selectedReservation.specialRequests && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Special Requests</Label>
                    <p className="p-2 bg-muted rounded">{selectedReservation.specialRequests}</p>
                  </div>
                )}

                {selectedReservation.notes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Internal Notes</Label>
                    <p className="p-2 bg-muted rounded">{selectedReservation.notes}</p>
                  </div>
                )}

                {selectedReservation.tags && selectedReservation.tags.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedReservation.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                    <p>{selectedReservation.createdAt}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                    <p>{selectedReservation.updatedAt}</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button className="flex-1" size="default" variant="default">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Reservation
                  </Button>
                  <Button variant="outline" size="default">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Customer
                  </Button>
                  <Button variant="outline" size="default">
                    <Bell className="h-4 w-4 mr-2" />
                    Send Reminder
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}