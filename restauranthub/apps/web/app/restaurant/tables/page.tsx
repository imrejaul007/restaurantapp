'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Edit, Trash2, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function TableManagement() {
  const [tables, setTables] = useState([
    { id: 1, number: '1', seats: 2, section: 'Patio', status: 'available', reservedBy: null, reservedTime: null },
    { id: 2, number: '2', seats: 4, section: 'Main Dining', status: 'occupied', reservedBy: 'Smith Party', reservedTime: '19:00' },
    { id: 3, number: '3', seats: 2, section: 'Main Dining', status: 'available', reservedBy: null, reservedTime: null },
    { id: 4, number: '4', seats: 6, section: 'Main Dining', status: 'reserved', reservedBy: 'Johnson Party', reservedTime: '20:30' },
    { id: 5, number: '5', seats: 4, section: 'Bar Area', status: 'cleaning', reservedBy: null, reservedTime: null },
    { id: 6, number: '6', seats: 8, section: 'Private Room', status: 'available', reservedBy: null, reservedTime: null },
    { id: 7, number: '7', seats: 2, section: 'Patio', status: 'occupied', reservedBy: 'Davis Party', reservedTime: '18:45' },
    { id: 8, number: '8', seats: 4, section: 'Main Dining', status: 'available', reservedBy: null, reservedTime: null }
  ]);

  const [newTable, setNewTable] = useState({
    number: '',
    seats: '',
    section: ''
  });

  const [selectedSection, setSelectedSection] = useState('all');

  const sections = ['Main Dining', 'Patio', 'Bar Area', 'Private Room'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-red-500';
      case 'reserved': return 'bg-yellow-500';
      case 'cleaning': return 'bg-gray-500';
      case 'maintenance': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4" />;
      case 'occupied': return <Users className="h-4 w-4" />;
      case 'reserved': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const updateTableStatus = (tableId: number, newStatus: string) => {
    setTables(prev => prev.map(table => 
      table.id === tableId ? { ...table, status: newStatus } : table
    ));
  };

  const addTable = () => {
    if (newTable.number && newTable.seats && newTable.section) {
      const table = {
        id: Math.max(...tables.map(t => t.id)) + 1,
        number: newTable.number,
        seats: parseInt(newTable.seats),
        section: newTable.section,
        status: 'available',
        reservedBy: null,
        reservedTime: null
      };
      setTables(prev => [...prev, table]);
      setNewTable({ number: '', seats: '', section: '' });
    }
  };

  const filteredTables = selectedSection === 'all' 
    ? tables 
    : tables.filter(table => table.section === selectedSection);

  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
    totalSeats: tables.reduce((sum, table) => sum + table.seats, 0),
    occupiedSeats: tables.filter(t => t.status === 'occupied' || t.status === 'reserved')
                        .reduce((sum, table) => sum + table.seats, 0)
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Table Management</h1>
            <p className="text-muted-foreground">Manage restaurant seating and reservations</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="default">
                <Plus className="h-4 w-4 mr-2" />
                Add Table
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Table</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tableNumber">Table Number</Label>
                  <Input
                    id="tableNumber"
                    value={newTable.number}
                    onChange={(e) => setNewTable(prev => ({ ...prev, number: e.target.value }))}
                    placeholder="e.g., 9"
                  />
                </div>
                <div>
                  <Label htmlFor="seats">Number of Seats</Label>
                  <Input
                    id="seats"
                    type="number"
                    value={newTable.seats}
                    onChange={(e) => setNewTable(prev => ({ ...prev, seats: e.target.value }))}
                    placeholder="4"
                  />
                </div>
                <div>
                  <Label htmlFor="section">Section</Label>
                  <Select value={newTable.section} onValueChange={(value) => setNewTable(prev => ({ ...prev, section: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map(section => (
                        <SelectItem key={section} value={section}>{section}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addTable} className="w-full">
                  Add Table
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Tables</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.available}</div>
                <div className="text-sm text-gray-600">Available</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.occupied}</div>
                <div className="text-sm text-gray-600">Occupied</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.reserved}</div>
                <div className="text-sm text-gray-600">Reserved</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{stats.totalSeats}</div>
                <div className="text-sm text-gray-600">Total Seats</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{Math.round((stats.occupiedSeats / stats.totalSeats) * 100)}%</div>
                <div className="text-sm text-gray-600">Occupancy</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Section Filter */}
        <div className="flex items-center space-x-4">
          <Label>Filter by Section:</Label>
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {sections.map(section => (
                <SelectItem key={section} value={section}>{section}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTables.map((table, index) => (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {table.number}
                      </div>
                      <span>Table {table.number}</span>
                    </CardTitle>
                    <Badge className={getStatusColor(table.status)}>
                      {getStatusIcon(table.status)}
                      <span className="ml-1 capitalize">{table.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Seats</span>
                      <span className="font-medium">{table.seats}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Section</span>
                      <span className="font-medium">{table.section}</span>
                    </div>
                    {table.reservedBy && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Reserved By</span>
                          <span className="font-medium">{table.reservedBy}</span>
                        </div>
                        {table.reservedTime && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Time</span>
                            <span className="font-medium">{table.reservedTime}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 mt-4">
                    {table.status === 'available' && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => updateTableStatus(table.id, 'occupied')}
                        >
                          Seat Guests
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTableStatus(table.id, 'reserved')}
                        >
                          Reserve
                        </Button>
                      </>
                    )}
                    {table.status === 'occupied' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => updateTableStatus(table.id, 'cleaning')}
                        >
                          Clear Table
                        </Button>
                        <Button size="sm" variant="outline">
                          Bill
                        </Button>
                      </>
                    )}
                    {table.status === 'reserved' && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => updateTableStatus(table.id, 'occupied')}
                        >
                          Seat Party
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTableStatus(table.id, 'available')}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {table.status === 'cleaning' && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => updateTableStatus(table.id, 'available')}
                      >
                        Mark Clean
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Section Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sections.map((section, index) => {
            const sectionTables = tables.filter(t => t.section === section);
            const sectionStats = {
              total: sectionTables.length,
              available: sectionTables.filter(t => t.status === 'available').length,
              occupied: sectionTables.filter(t => t.status === 'occupied').length,
              reserved: sectionTables.filter(t => t.status === 'reserved').length
            };

            return (
              <motion.div
                key={section}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      {section}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Tables</span>
                        <span className="font-medium">{sectionStats.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">Available</span>
                        <span className="font-medium">{sectionStats.available}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-600">Occupied</span>
                        <span className="font-medium">{sectionStats.occupied}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-600">Reserved</span>
                        <span className="font-medium">{sectionStats.reserved}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}