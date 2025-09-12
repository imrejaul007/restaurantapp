'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Search, Filter, AlertTriangle, TrendingDown, Edit, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function InventoryManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [inventory, setInventory] = useState([
    {
      id: 1,
      name: 'Tomatoes',
      category: 'Vegetables',
      currentStock: 15,
      minStock: 20,
      maxStock: 100,
      unit: 'lbs',
      costPerUnit: 2.50,
      supplier: 'Fresh Farms Co',
      lastOrdered: '2024-01-08',
      expiryDate: '2024-01-15',
      status: 'low'
    },
    {
      id: 2,
      name: 'Mozzarella Cheese',
      category: 'Dairy',
      currentStock: 45,
      minStock: 25,
      maxStock: 80,
      unit: 'lbs',
      costPerUnit: 4.25,
      supplier: 'Dairy Fresh Inc',
      lastOrdered: '2024-01-09',
      expiryDate: '2024-01-20',
      status: 'good'
    },
    {
      id: 3,
      name: 'Chicken Breast',
      category: 'Meat',
      currentStock: 8,
      minStock: 15,
      maxStock: 50,
      unit: 'lbs',
      costPerUnit: 6.99,
      supplier: 'Premium Meats',
      lastOrdered: '2024-01-07',
      expiryDate: '2024-01-14',
      status: 'critical'
    },
    {
      id: 4,
      name: 'Olive Oil',
      category: 'Pantry',
      currentStock: 12,
      minStock: 8,
      maxStock: 30,
      unit: 'bottles',
      costPerUnit: 8.50,
      supplier: 'Mediterranean Imports',
      lastOrdered: '2024-01-05',
      expiryDate: '2024-12-31',
      status: 'good'
    },
    {
      id: 5,
      name: 'Lettuce',
      category: 'Vegetables',
      currentStock: 2,
      minStock: 10,
      maxStock: 40,
      unit: 'heads',
      costPerUnit: 1.25,
      supplier: 'Fresh Farms Co',
      lastOrdered: '2024-01-06',
      expiryDate: '2024-01-13',
      status: 'critical'
    },
    {
      id: 6,
      name: 'Flour',
      category: 'Pantry',
      currentStock: 25,
      minStock: 20,
      maxStock: 100,
      unit: 'lbs',
      costPerUnit: 0.85,
      supplier: 'Bakery Supply Co',
      lastOrdered: '2024-01-04',
      expiryDate: '2024-06-30',
      status: 'good'
    }
  ]);

  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    currentStock: '',
    minStock: '',
    maxStock: '',
    unit: '',
    costPerUnit: '',
    supplier: '',
    expiryDate: ''
  });

  const categories = ['Vegetables', 'Meat', 'Dairy', 'Pantry', 'Beverages', 'Spices', 'Frozen'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'low': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      case 'out': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStockStatus = (item: any) => {
    if (item.currentStock === 0) return 'out';
    if (item.currentStock <= item.minStock * 0.5) return 'critical';
    if (item.currentStock <= item.minStock) return 'low';
    return 'good';
  };

  const updateItemStock = (itemId: number, newStock: number) => {
    setInventory(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, currentStock: newStock, status: getStockStatus({ ...item, currentStock: newStock }) }
        : item
    ));
  };

  const addItem = () => {
    if (newItem.name && newItem.category && newItem.currentStock) {
      const item = {
        id: Math.max(...inventory.map(i => i.id)) + 1,
        name: newItem.name,
        category: newItem.category,
        currentStock: parseInt(newItem.currentStock),
        minStock: parseInt(newItem.minStock) || 10,
        maxStock: parseInt(newItem.maxStock) || 100,
        unit: newItem.unit || 'units',
        costPerUnit: parseFloat(newItem.costPerUnit) || 0,
        supplier: newItem.supplier || 'TBD',
        lastOrdered: new Date().toISOString().split('T')[0],
        expiryDate: newItem.expiryDate || '',
        status: 'good'
      };
      item.status = getStockStatus(item);
      setInventory(prev => [...prev, item]);
      setNewItem({
        name: '', category: '', currentStock: '', minStock: '', maxStock: '',
        unit: '', costPerUnit: '', supplier: '', expiryDate: ''
      });
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    totalItems: inventory.length,
    lowStock: inventory.filter(i => i.status === 'low' || i.status === 'critical').length,
    totalValue: inventory.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0),
    outOfStock: inventory.filter(i => i.status === 'out').length
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground">Track and manage restaurant inventory</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Inventory Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="itemName">Item Name</Label>
                    <Input
                      id="itemName"
                      value={newItem.name}
                      onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Fresh Basil"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newItem.category} onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="currentStock">Current Stock</Label>
                      <Input
                        id="currentStock"
                        type="number"
                        value={newItem.currentStock}
                        onChange={(e) => setNewItem(prev => ({ ...prev, currentStock: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit">Unit</Label>
                      <Input
                        id="unit"
                        value={newItem.unit}
                        onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                        placeholder="lbs, bottles, etc."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="minStock">Min Stock</Label>
                      <Input
                        id="minStock"
                        type="number"
                        value={newItem.minStock}
                        onChange={(e) => setNewItem(prev => ({ ...prev, minStock: e.target.value }))}
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxStock">Max Stock</Label>
                      <Input
                        id="maxStock"
                        type="number"
                        value={newItem.maxStock}
                        onChange={(e) => setNewItem(prev => ({ ...prev, maxStock: e.target.value }))}
                        placeholder="100"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="costPerUnit">Cost per Unit ($)</Label>
                    <Input
                      id="costPerUnit"
                      type="number"
                      step="0.01"
                      value={newItem.costPerUnit}
                      onChange={(e) => setNewItem(prev => ({ ...prev, costPerUnit: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={newItem.supplier}
                      onChange={(e) => setNewItem(prev => ({ ...prev, supplier: e.target.value }))}
                      placeholder="Supplier name"
                    />
                  </div>
                  <Button onClick={addItem} className="w-full">
                    Add Item
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Alerts */}
        {stats.lowStock > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have {stats.lowStock} items with low stock levels that need attention.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Items</p>
                    <h3 className="text-2xl font-bold mt-2">{stats.totalItems}</h3>
                  </div>
                  <Package className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Low Stock</p>
                    <h3 className="text-2xl font-bold mt-2 text-yellow-600">{stats.lowStock}</h3>
                  </div>
                  <TrendingDown className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Value</p>
                    <h3 className="text-2xl font-bold mt-2">${stats.totalValue.toLocaleString()}</h3>
                  </div>
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">$</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                    <h3 className="text-2xl font-bold mt-2 text-red-600">{stats.outOfStock}</h3>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Inventory Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredInventory.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold">{item.name}</h3>
                          <Badge variant="outline">{item.category}</Badge>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Stock: </span>
                            {item.currentStock} {item.unit}
                          </div>
                          <div>
                            <span className="font-medium">Min: </span>
                            {item.minStock} {item.unit}
                          </div>
                          <div>
                            <span className="font-medium">Cost: </span>
                            ${item.costPerUnit}/{item.unit}
                          </div>
                          <div>
                            <span className="font-medium">Supplier: </span>
                            {item.supplier}
                          </div>
                          <div>
                            <span className="font-medium">Last Ordered: </span>
                            {new Date(item.lastOrdered).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Expires: </span>
                            {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Stock Level</span>
                            <span>{item.currentStock} / {item.maxStock}</span>
                          </div>
                          <Progress value={(item.currentStock / item.maxStock) * 100} className="h-2" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Input
                          type="number"
                          value={item.currentStock}
                          onChange={(e) => updateItemStock(item.id, parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}