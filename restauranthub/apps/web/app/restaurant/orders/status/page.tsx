'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChefHat,
  Truck,
  Package,
  Eye,
  Edit,
  MoreHorizontal,
  Filter,
  Search,
  Bell,
  Timer,
  MessageSquare,
  Phone,
  MapPin,
  ArrowUpDown,
  RefreshCw
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
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  type: 'dine-in' | 'takeaway' | 'delivery';
  status: 'received' | 'confirmed' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered' | 'completed' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  estimatedTime?: string;
  actualCompletionTime?: string;
  tableNumber?: string;
  deliveryAddress?: string;
  notes?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedTo?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
}

// Mock data
const orders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    customerName: 'John Doe',
    customerPhone: '+91 98765 43210',
    type: 'dine-in',
    status: 'preparing',
    items: [
      { id: '1', name: 'Butter Chicken', quantity: 2, price: 320, status: 'preparing' },
      { id: '2', name: 'Garlic Naan', quantity: 4, price: 60, status: 'ready' },
      { id: '3', name: 'Basmati Rice', quantity: 2, price: 80, status: 'preparing' }
    ],
    subtotal: 1000,
    tax: 180,
    total: 1180,
    createdAt: '2024-01-15T12:30:00Z',
    estimatedTime: '25 minutes',
    tableNumber: 'T-12',
    priority: 'normal',
    assignedTo: 'Chef Maria',
    paymentStatus: 'paid'
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    customerName: 'Sarah Smith',
    customerPhone: '+91 87654 32109',
    type: 'delivery',
    status: 'out-for-delivery',
    items: [
      { id: '4', name: 'Chicken Biryani', quantity: 1, price: 280, status: 'ready' },
      { id: '5', name: 'Raita', quantity: 1, price: 60, status: 'ready' }
    ],
    subtotal: 340,
    tax: 61,
    total: 401,
    createdAt: '2024-01-15T11:45:00Z',
    deliveryAddress: '123 Main Street, Apartment 4B',
    priority: 'high',
    assignedTo: 'Driver Raj',
    paymentStatus: 'paid'
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-003',
    customerName: 'Mike Johnson',
    customerPhone: '+91 76543 21098',
    type: 'takeaway',
    status: 'ready',
    items: [
      { id: '6', name: 'Masala Dosa', quantity: 2, price: 120, status: 'ready' },
      { id: '7', name: 'Coffee', quantity: 2, price: 40, status: 'ready' }
    ],
    subtotal: 320,
    tax: 58,
    total: 378,
    createdAt: '2024-01-15T13:15:00Z',
    estimatedTime: 'Ready for pickup',
    priority: 'normal',
    assignedTo: 'Chef David',
    paymentStatus: 'paid'
  },
  {
    id: '4',
    orderNumber: 'ORD-2024-004',
    customerName: 'Lisa Wilson',
    customerPhone: '+91 65432 10987',
    type: 'dine-in',
    status: 'received',
    items: [
      { id: '8', name: 'Paneer Tikka', quantity: 1, price: 240, status: 'pending' },
      { id: '9', name: 'Dal Makhani', quantity: 1, price: 180, status: 'pending' },
      { id: '10', name: 'Roti', quantity: 3, price: 30, status: 'pending' }
    ],
    subtotal: 510,
    tax: 92,
    total: 602,
    createdAt: '2024-01-15T13:45:00Z',
    estimatedTime: '30 minutes',
    tableNumber: 'T-08',
    priority: 'urgent',
    paymentStatus: 'pending'
  }
];

const statusColors = {
  'received': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'confirmed': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  'preparing': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'ready': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'out-for-delivery': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'delivered': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  'completed': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

const priorityColors = {
  'low': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  'normal': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'urgent': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

const itemStatusColors = {
  'pending': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  'preparing': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'ready': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'served': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'received':
    case 'confirmed':
      return <Clock className="h-4 w-4" />;
    case 'preparing':
      return <ChefHat className="h-4 w-4" />;
    case 'ready':
      return <CheckCircle className="h-4 w-4" />;
    case 'out-for-delivery':
      return <Truck className="h-4 w-4" />;
    case 'delivered':
    case 'completed':
      return <Package className="h-4 w-4" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export default function OrderStatusManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredOrders = orders
    .filter(order => {
      if (searchTerm && !order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !order.customerName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (typeFilter !== 'all' && order.type !== typeFilter) return false;
      if (priorityFilter !== 'all' && order.priority !== priorityFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof Order];
      const bValue = b[sortBy as keyof Order];
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    console.log('Updating order status:', orderId, newStatus);
    // Here you would update the order status in your state/API
  };

  const handleItemStatusChange = (orderId: string, itemId: string, newStatus: string) => {
    console.log('Updating item status:', orderId, itemId, newStatus);
    // Here you would update the item status in your state/API
  };

  const getTimeElapsed = (createdAt: string) => {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffMs = now.getTime() - orderTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}h ${diffMins % 60}m ago`;
    }
  };

  const orderStats = {
    total: orders.length,
    received: orders.filter(o => o.status === 'received').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    inProgress: orders.filter(o => ['received', 'confirmed', 'preparing'].includes(o.status)).length
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Order Status Management</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage order progress in real-time
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{orderStats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg dark:bg-blue-900">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{orderStats.inProgress}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg dark:bg-orange-900">
                  <ChefHat className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ready</p>
                  <p className="text-2xl font-bold">{orderStats.ready}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg dark:bg-green-900">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">New Orders</p>
                  <p className="text-2xl font-bold">{orderStats.received}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg dark:bg-purple-900">
                  <AlertCircle className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search orders..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="out-for-delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="dine-in">Dine-in</SelectItem>
                <SelectItem value="takeaway">Takeaway</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>
              Manage order progress and status updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Order Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="font-medium text-lg">{order.orderNumber}</div>
                          <Badge variant="secondary" className={statusColors[order.status]}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1 capitalize">{order.status.replace('-', ' ')}</span>
                          </Badge>
                          <Badge variant="outline" className={priorityColors[order.priority]}>
                            {order.priority}
                          </Badge>
                          <Badge variant="outline">
                            {order.type}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(order.total)}</div>
                          <div className="text-sm text-muted-foreground">
                            {getTimeElapsed(order.createdAt)}
                          </div>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="font-medium">{order.customerName}</div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {order.customerPhone}
                            </div>
                          </div>
                          {order.tableNumber && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Table:</span> {order.tableNumber}
                            </div>
                          )}
                          {order.deliveryAddress && (
                            <div className="text-sm flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate max-w-40">{order.deliveryAddress}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {order.estimatedTime && (
                            <div className="text-sm flex items-center">
                              <Timer className="h-3 w-3 mr-1" />
                              {order.estimatedTime}
                            </div>
                          )}
                          {order.assignedTo && (
                            <div className="text-sm text-muted-foreground">
                              Assigned to: {order.assignedTo}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-2">
                        {order.items.map(item => (
                          <div key={item.id} className="flex items-center justify-between bg-muted/20 rounded p-2">
                            <div className="flex items-center space-x-3">
                              <span className="font-medium">{item.quantity}x</span>
                              <span>{item.name}</span>
                              {item.notes && (
                                <span className="text-xs text-muted-foreground">({item.notes})</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">{formatCurrency(item.price * item.quantity)}</span>
                              <Select
                                value={item.status}
                                onValueChange={(value) => handleItemStatusChange(order.id, item.id, value)}
                              >
                                <SelectTrigger className="w-[120px] h-8">
                                  <SelectValue>
                                    <Badge variant="secondary" className={itemStatusColors[item.status]}>
                                      {item.status}
                                    </Badge>
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="preparing">Preparing</SelectItem>
                                  <SelectItem value="ready">Ready</SelectItem>
                                  <SelectItem value="served">Served</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center space-x-2">
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleStatusChange(order.id, value)}
                          >
                            <SelectTrigger className="w-[160px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="received">Received</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="preparing">Preparing</SelectItem>
                              <SelectItem value="ready">Ready</SelectItem>
                              <SelectItem value="out-for-delivery">Out for Delivery</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Details
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contact
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Order
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Bell className="h-4 w-4 mr-2" />
                                Send Notification
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
              <DialogDescription>
                Complete order information and timeline
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Customer</Label>
                    <div className="font-medium">{selectedOrder.customerName}</div>
                    <div className="text-sm text-muted-foreground">{selectedOrder.customerPhone}</div>
                  </div>
                  <div>
                    <Label>Order Type</Label>
                    <div className="font-medium capitalize">{selectedOrder.type}</div>
                    {selectedOrder.tableNumber && (
                      <div className="text-sm text-muted-foreground">Table: {selectedOrder.tableNumber}</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label>Items</Label>
                  <div className="space-y-2 mt-2">
                    {selectedOrder.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-muted/20 rounded">
                        <span>{item.quantity}x {item.name}</span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t mt-2">
                    <span className="font-medium">Total</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>

                {selectedOrder.deliveryAddress && (
                  <div>
                    <Label>Delivery Address</Label>
                    <div className="font-medium">{selectedOrder.deliveryAddress}</div>
                  </div>
                )}

                {selectedOrder.notes && (
                  <div>
                    <Label>Notes</Label>
                    <div className="font-medium">{selectedOrder.notes}</div>
                  </div>
                )}

                <div>
                  <Label>Order Timeline</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Order received at {formatTime(selectedOrder.createdAt)}</span>
                    </div>
                    {selectedOrder.estimatedTime && (
                      <div className="flex items-center space-x-2">
                        <Timer className="h-4 w-4" />
                        <span>Estimated completion: {selectedOrder.estimatedTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}