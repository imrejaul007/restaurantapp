'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  ChefHat, 
  Timer, 
  CheckCircle, 
  AlertTriangle, 
  Flame,
  Users,
  UtensilsCrossed,
  Play,
  Pause,
  RotateCcw,
  Bell,
  Settings,
  Maximize2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KitchenOrder {
  id: string;
  orderNumber: string;
  tableNumber?: string;
  customerName?: string;
  orderType: 'dine-in' | 'takeout' | 'delivery';
  status: 'new' | 'preparing' | 'ready' | 'served' | 'delayed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  items: OrderItem[];
  totalItems: number;
  estimatedTime: number;
  elapsedTime: number;
  orderTime: string;
  specialInstructions?: string;
  allergens?: string[];
  station: string;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  modifications?: string[];
  cookingTime: number;
  station: string;
  status: 'pending' | 'preparing' | 'ready';
  allergens?: string[];
}

const mockOrders: KitchenOrder[] = [
  {
    id: 'order-001',
    orderNumber: '#2024-001',
    tableNumber: 'T-12',
    customerName: 'John Doe',
    orderType: 'dine-in',
    status: 'new',
    priority: 'high',
    totalItems: 3,
    estimatedTime: 18,
    elapsedTime: 0,
    orderTime: '12:45 PM',
    specialInstructions: 'Extra spicy, no onions',
    allergens: ['gluten', 'dairy'],
    station: 'grill',
    items: [
      {
        id: 'item-001',
        name: 'Grilled Chicken Burger',
        quantity: 1,
        modifications: ['No pickles', 'Extra cheese'],
        cookingTime: 12,
        station: 'grill',
        status: 'pending',
        allergens: ['gluten', 'dairy']
      },
      {
        id: 'item-002',
        name: 'Truffle Fries',
        quantity: 1,
        modifications: [],
        cookingTime: 8,
        station: 'fryer',
        status: 'pending'
      },
      {
        id: 'item-003',
        name: 'Caesar Salad',
        quantity: 1,
        modifications: ['Dressing on side'],
        cookingTime: 5,
        station: 'salad',
        status: 'pending',
        allergens: ['dairy']
      }
    ]
  },
  {
    id: 'order-002',
    orderNumber: '#2024-002',
    customerName: 'Sarah Wilson',
    orderType: 'takeout',
    status: 'preparing',
    priority: 'normal',
    totalItems: 2,
    estimatedTime: 15,
    elapsedTime: 8,
    orderTime: '12:38 PM',
    station: 'saute',
    items: [
      {
        id: 'item-004',
        name: 'Pasta Carbonara',
        quantity: 1,
        modifications: ['Extra parmesan'],
        cookingTime: 12,
        station: 'saute',
        status: 'preparing'
      },
      {
        id: 'item-005',
        name: 'Garlic Bread',
        quantity: 1,
        modifications: [],
        cookingTime: 6,
        station: 'oven',
        status: 'ready'
      }
    ]
  },
  {
    id: 'order-003',
    orderNumber: '#2024-003',
    tableNumber: 'T-05',
    customerName: 'Mike Chen',
    orderType: 'dine-in',
    status: 'ready',
    priority: 'normal',
    totalItems: 4,
    estimatedTime: 22,
    elapsedTime: 20,
    orderTime: '12:25 PM',
    station: 'mixed',
    items: [
      {
        id: 'item-006',
        name: 'Fish & Chips',
        quantity: 2,
        modifications: [],
        cookingTime: 15,
        station: 'fryer',
        status: 'ready'
      },
      {
        id: 'item-007',
        name: 'Coleslaw',
        quantity: 2,
        modifications: [],
        cookingTime: 3,
        station: 'salad',
        status: 'ready'
      }
    ]
  },
  {
    id: 'order-004',
    orderNumber: '#2024-004',
    customerName: 'Lisa Park',
    orderType: 'delivery',
    status: 'delayed',
    priority: 'urgent',
    totalItems: 1,
    estimatedTime: 25,
    elapsedTime: 30,
    orderTime: '12:15 PM',
    specialInstructions: 'Customer called - running late',
    station: 'grill',
    items: [
      {
        id: 'item-008',
        name: 'Premium Steak',
        quantity: 1,
        modifications: ['Medium rare', 'No mushrooms'],
        cookingTime: 25,
        station: 'grill',
        status: 'preparing'
      }
    ]
  }
];

const kitchenStations = [
  { id: 'all', name: 'All Stations', icon: UtensilsCrossed, color: 'blue' },
  { id: 'grill', name: 'Grill', icon: Flame, color: 'red' },
  { id: 'saute', name: 'Sauté', icon: ChefHat, color: 'orange' },
  { id: 'fryer', name: 'Fryer', icon: Timer, color: 'yellow' },
  { id: 'salad', name: 'Cold Prep', icon: Users, color: 'green' },
  { id: 'oven', name: 'Oven', icon: Timer, color: 'purple' }
];

export default function KitchenDisplaySystem() {
  const [orders, setOrders] = useState<KitchenOrder[]>(mockOrders);
  const [selectedStation, setSelectedStation] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused) {
        setCurrentTime(new Date());
        setOrders(prev => 
          prev.map(order => ({
            ...order,
            elapsedTime: order.status === 'preparing' ? order.elapsedTime + 1 : order.elapsedTime
          }))
        );
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const filteredOrders = selectedStation === 'all' 
    ? orders 
    : orders.filter(order => order.station === selectedStation || order.items.some(item => item.station === selectedStation));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'ready': return 'bg-green-500';
      case 'served': return 'bg-gray-500';
      case 'delayed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'normal': return 'border-blue-500 bg-blue-50';
      case 'low': return 'border-gray-500 bg-gray-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const updateOrderStatus = (orderId: string, newStatus: KitchenOrder['status']) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const updateItemStatus = (orderId: string, itemId: string, newStatus: OrderItem['status']) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId
          ? {
              ...order,
              items: order.items.map(item =>
                item.id === itemId ? { ...item, status: newStatus } : item
              )
            }
          : order
      )
    );
  };

  const formatTime = (minutes: number) => {
    return `${Math.floor(minutes / 60)}:${(minutes % 60).toString().padStart(2, '0')}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kitchen Display System</h1>
            <p className="text-muted-foreground mt-1">
              Real-time order management for kitchen operations - {currentTime.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Alerts
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Fullscreen
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Kitchen Stations Filter */}
        <div className="flex flex-wrap gap-2">
          {kitchenStations.map((station) => {
            const Icon = station.icon;
            const isSelected = selectedStation === station.id;
            
            return (
              <Button
                key={station.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStation(station.id)}
                className={cn(
                  "flex items-center space-x-2",
                  isSelected && `bg-${station.color}-600 hover:bg-${station.color}-700`
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{station.name}</span>
                <Badge variant="secondary" className="ml-1">
                  {station.id === 'all' 
                    ? orders.length 
                    : orders.filter(order => 
                        order.station === station.id || 
                        order.items.some(item => item.station === station.id)
                      ).length
                  }
                </Badge>
              </Button>
            );
          })}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">New Orders</p>
                  <p className="text-2xl font-bold">
                    {orders.filter(o => o.status === 'new').length}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Preparing</p>
                  <p className="text-2xl font-bold">
                    {orders.filter(o => o.status === 'preparing').length}
                  </p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ChefHat className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ready</p>
                  <p className="text-2xl font-bold">
                    {orders.filter(o => o.status === 'ready').length}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Delayed</p>
                  <p className="text-2xl font-bold">
                    {orders.filter(o => o.status === 'delayed').length}
                  </p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={cn(
                  "relative overflow-hidden",
                  getPriorityColor(order.priority),
                  order.status === 'delayed' && "animate-pulse"
                )}>
                  {/* Priority Indicator */}
                  {order.priority === 'urgent' && (
                    <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-red-500" />
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                        <CardDescription className="flex items-center space-x-2">
                          {order.tableNumber && (
                            <span>Table {order.tableNumber}</span>
                          )}
                          {order.customerName && (
                            <span>{order.customerName}</span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge 
                          className={cn("text-white text-xs", getStatusColor(order.status))}
                        >
                          {order.status.toUpperCase()}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {order.orderTime}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Order Type & Time */}
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline">
                        {order.orderType}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <Timer className="h-4 w-4" />
                        <span className={cn(
                          order.elapsedTime > order.estimatedTime ? "text-red-600 font-semibold" : "text-muted-foreground"
                        )}>
                          {formatTime(order.elapsedTime)} / {formatTime(order.estimatedTime)}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-background rounded border">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">{item.quantity}x</span>
                              <span className="text-sm">{item.name}</span>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  item.status === 'ready' && "bg-green-100 text-green-800",
                                  item.status === 'preparing' && "bg-orange-100 text-orange-800",
                                  item.status === 'pending' && "bg-gray-100 text-gray-800"
                                )}
                              >
                                {item.status}
                              </Badge>
                            </div>
                            {item.modifications && item.modifications.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                • {item.modifications.join(', ')}
                              </p>
                            )}
                            {item.allergens && item.allergens.length > 0 && (
                              <p className="text-xs text-red-600 mt-1">
                                ⚠️ {item.allergens.join(', ')}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            {item.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateItemStatus(order.id, item.id, 'preparing')}
                                className="h-8 w-8 p-0"
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                            )}
                            {item.status === 'preparing' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateItemStatus(order.id, item.id, 'ready')}
                                className="h-8 w-8 p-0"
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Special Instructions */}
                    {order.specialInstructions && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs font-medium text-yellow-800">Special Instructions:</p>
                        <p className="text-xs text-yellow-700">{order.specialInstructions}</p>
                      </div>
                    )}

                    {/* Allergens */}
                    {order.allergens && order.allergens.length > 0 && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs font-medium text-red-800">Allergen Alert:</p>
                        <p className="text-xs text-red-700">{order.allergens.join(', ')}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      {order.status === 'new' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="flex-1"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Ready
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'served')}
                          className="flex-1"
                        >
                          <UtensilsCrossed className="h-4 w-4 mr-1" />
                          Served
                        </Button>
                      )}
                      {(order.status === 'preparing' || order.status === 'delayed') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateOrderStatus(order.id, 'new')}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredOrders.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <ChefHat className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Orders</h3>
              <p className="text-muted-foreground">
                {selectedStation === 'all' 
                  ? 'No orders in the kitchen right now'
                  : `No orders for ${kitchenStations.find(s => s.id === selectedStation)?.name} station`
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}