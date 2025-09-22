'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import InventoryManagement from '@/components/inventory/inventory-management';
import { useAuth } from '@/lib/auth/auth-provider';

// Mock inventory data
const mockInventoryItems = [
  {
    id: '1',
    productId: 'prod-1',
    name: 'Organic Tomatoes',
    description: 'Fresh organic tomatoes, Grade A quality',
    category: 'Vegetables',
    brand: 'Fresh Farms',
    sku: 'FF-TOM-001',
    barcode: '1234567890123',
    images: [],
    pricing: {
      cost: 80,
      sellingPrice: 120,
      margin: 33.33,
      currency: 'INR'
    },
    stock: {
      current: 45,
      reserved: 5,
      available: 40,
      unit: 'kg',
      location: 'Cold Storage A1',
      minThreshold: 20,
      maxCapacity: 100
    },
    supplier: {
      id: 'supplier-1',
      name: 'Green Valley Farms',
      contact: '+91 98765 43210'
    },
    status: 'active' as 'active' | 'out_of_stock',
    quality: {
      grade: 'Grade A',
      expiryDate: '2024-02-15T23:59:59Z',
      batchNumber: 'GVF-240115',
      certifications: ['Organic', 'FSSAI']
    },
    analytics: {
      demand: 'high' as const,
      velocity: 8.5,
      turnoverRate: 2.3,
      profitability: 'high' as const
    },
    lastUpdated: '2024-01-19T14:30:00Z',
    createdAt: '2024-01-01T08:00:00Z'
  },
  {
    id: '2',
    productId: 'prod-2',
    name: 'Basmati Rice',
    description: '1121 Premium Basmati Rice, 25kg bag',
    category: 'Grains',
    brand: 'Golden Harvest',
    sku: 'GH-RIC-001',
    barcode: '1234567890124',
    images: [],
    pricing: {
      cost: 1800,
      sellingPrice: 2200,
      margin: 18.18,
      currency: 'INR'
    },
    stock: {
      current: 12,
      reserved: 2,
      available: 10,
      unit: 'bags',
      location: 'Dry Storage B2',
      minThreshold: 15,
      maxCapacity: 50
    },
    supplier: {
      id: 'supplier-2',
      name: 'Punjab Rice Mills',
      contact: '+91 98765 43211'
    },
    status: 'active' as 'active' | 'out_of_stock',
    quality: {
      grade: 'Premium',
      expiryDate: '2025-01-15T23:59:59Z',
      batchNumber: 'PRM-240110',
      certifications: ['ISO 22000', 'FSSAI']
    },
    analytics: {
      demand: 'medium' as const,
      velocity: 3.2,
      turnoverRate: 1.8,
      profitability: 'medium' as const
    },
    lastUpdated: '2024-01-18T16:45:00Z',
    createdAt: '2024-01-02T10:00:00Z'
  },
  {
    id: '3',
    productId: 'prod-3',
    name: 'Fresh Chicken Breast',
    description: 'Antibiotic-free chicken breast, skinless',
    category: 'Meat & Poultry',
    brand: 'Farm Fresh',
    sku: 'FF-CHK-001',
    barcode: '1234567890125',
    images: [],
    pricing: {
      cost: 280,
      sellingPrice: 350,
      margin: 20,
      currency: 'INR'
    },
    stock: {
      current: 0,
      reserved: 0,
      available: 0,
      unit: 'kg',
      location: 'Freezer C1',
      minThreshold: 10,
      maxCapacity: 50
    },
    supplier: {
      id: 'supplier-3',
      name: 'Poultry Plus',
      contact: '+91 98765 43212'
    },
    status: 'out_of_stock' as 'active' | 'out_of_stock',
    quality: {
      grade: 'Grade A',
      expiryDate: '2024-01-25T23:59:59Z',
      batchNumber: 'PP-240120',
      certifications: ['Halal', 'FSSAI']
    },
    analytics: {
      demand: 'high' as const,
      velocity: 12.8,
      turnoverRate: 4.2,
      profitability: 'high' as const
    },
    lastUpdated: '2024-01-19T08:30:00Z',
    createdAt: '2024-01-03T12:00:00Z'
  },
  {
    id: '4',
    productId: 'prod-4',
    name: 'Olive Oil Extra Virgin',
    description: 'Cold-pressed extra virgin olive oil, 1L bottle',
    category: 'Oils & Condiments',
    brand: 'Mediterranean Gold',
    sku: 'MG-OIL-001',
    barcode: '1234567890126',
    images: [],
    pricing: {
      cost: 450,
      sellingPrice: 580,
      margin: 22.41,
      currency: 'INR'
    },
    stock: {
      current: 28,
      reserved: 3,
      available: 25,
      unit: 'bottles',
      location: 'Pantry D1',
      minThreshold: 15,
      maxCapacity: 60
    },
    supplier: {
      id: 'supplier-4',
      name: 'Gourmet Imports',
      contact: '+91 98765 43213'
    },
    status: 'active' as 'active' | 'out_of_stock',
    quality: {
      grade: 'Premium',
      expiryDate: '2025-06-15T23:59:59Z',
      batchNumber: 'GI-240105',
      certifications: ['Organic', 'Import License']
    },
    analytics: {
      demand: 'low' as const,
      velocity: 1.8,
      turnoverRate: 0.9,
      profitability: 'medium' as const
    },
    lastUpdated: '2024-01-17T11:20:00Z',
    createdAt: '2024-01-04T15:30:00Z'
  },
  {
    id: '5',
    productId: 'prod-5',
    name: 'Fresh Mozzarella Cheese',
    description: 'Artisan fresh mozzarella, 500g pack',
    category: 'Dairy',
    brand: 'Artisan Dairy',
    sku: 'AD-CHE-001',
    barcode: '1234567890127',
    images: [],
    pricing: {
      cost: 320,
      sellingPrice: 420,
      margin: 23.81,
      currency: 'INR'
    },
    stock: {
      current: 8,
      reserved: 1,
      available: 7,
      unit: 'packs',
      location: 'Dairy Cooler E1',
      minThreshold: 12,
      maxCapacity: 30
    },
    supplier: {
      id: 'supplier-5',
      name: 'Local Artisan Dairy',
      contact: '+91 98765 43214'
    },
    status: 'active' as 'active' | 'out_of_stock',
    quality: {
      grade: 'Artisan',
      expiryDate: '2024-01-28T23:59:59Z',
      batchNumber: 'LAD-240122',
      certifications: ['FSSAI', 'Organic']
    },
    analytics: {
      demand: 'medium' as const,
      velocity: 4.2,
      turnoverRate: 2.1,
      profitability: 'medium' as const
    },
    lastUpdated: '2024-01-19T09:15:00Z',
    createdAt: '2024-01-05T14:00:00Z'
  }
];

// Mock stock movements
const mockStockMovements = [
  {
    id: '1',
    itemId: '1',
    type: 'in' as const,
    quantity: 50,
    reason: 'New stock received from supplier',
    reference: 'PO-2024-001',
    performedBy: 'Inventory Manager',
    timestamp: '2024-01-19T08:00:00Z',
    notes: 'Quality checked and stored'
  },
  {
    id: '2',
    itemId: '1',
    type: 'out' as const,
    quantity: 15,
    reason: 'Order fulfillment',
    reference: 'ORD-2024-001',
    performedBy: 'Kitchen Staff',
    timestamp: '2024-01-19T12:30:00Z'
  },
  {
    id: '3',
    itemId: '2',
    type: 'adjustment' as const,
    quantity: -3,
    reason: 'Damaged during transport',
    performedBy: 'Inventory Manager',
    timestamp: '2024-01-18T16:45:00Z',
    notes: 'Three bags damaged, insurance claim filed'
  },
  {
    id: '4',
    itemId: '3',
    type: 'out' as const,
    quantity: 25,
    reason: 'Order fulfillment - sold out',
    reference: 'ORD-2024-002',
    performedBy: 'Kitchen Staff',
    timestamp: '2024-01-18T14:20:00Z'
  },
  {
    id: '5',
    itemId: '4',
    type: 'in' as const,
    quantity: 30,
    reason: 'New stock received',
    reference: 'PO-2024-002',
    performedBy: 'Receiving Staff',
    timestamp: '2024-01-17T10:00:00Z'
  }
];

export default function InventoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState(mockInventoryItems);
  const [movements, setMovements] = useState(mockStockMovements);

  const handleUpdateItem = (updatedItem: any) => {
    setItems(prev => prev.map(item => 
      item.id === updatedItem.id ? { ...updatedItem, lastUpdated: new Date().toISOString() } : item
    ));
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleStockMovement = (movement: any) => {
    const newMovement = {
      ...movement,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    
    setMovements(prev => [newMovement, ...prev]);

    // Update item stock based on movement
    setItems(prev => prev.map(item => {
      if (item.id === movement.itemId) {
        let newStock = item.stock.current;
        
        switch (movement.type) {
          case 'in':
            newStock += movement.quantity;
            break;
          case 'out':
            newStock = Math.max(0, newStock - movement.quantity);
            break;
          case 'adjustment':
            newStock = Math.max(0, newStock + movement.quantity);
            break;
          case 'transfer':
            // Handle transfer logic
            break;
        }
        
        return {
          ...item,
          stock: {
            ...item.stock,
            current: newStock,
            available: newStock - item.stock.reserved
          },
          status: (newStock === 0 ? 'out_of_stock' : 'active') as 'active' | 'out_of_stock',
          lastUpdated: new Date().toISOString()
        };
      }
      return item;
    }));
  };

  const handleReorder = (itemId: string, quantity: number) => {
    // Simulate creating a purchase order
    console.log(`Reordering ${quantity} units of item ${itemId}`);
    
    // You could add logic here to:
    // 1. Create a purchase order
    // 2. Notify supplier
    // 3. Add to pending stock
    // 4. Update item status
  };

  return (
    <DashboardLayout>
      <InventoryManagement
        items={items}
        movements={movements}
        userRole={user?.role as any || 'restaurant'}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
        onStockMovement={handleStockMovement}
        onReorder={handleReorder}
      />
    </DashboardLayout>
  );
}