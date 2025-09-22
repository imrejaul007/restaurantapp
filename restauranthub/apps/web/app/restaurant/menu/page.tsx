'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Eye,
  EyeOff,
  Star,
  Clock,
  Users,
  ChefHat,
  Package,
  DollarSign,
  Image,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Utensils,
  Coffee,
  Cake,
  Pizza,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth/auth-provider';
import { cn } from '@/lib/utils';

interface MenuCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  isActive: boolean;
  itemCount: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  categoryId: string;
  images: string[];
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isSpicy: boolean;
  preparationTime: number; // in minutes
  calories?: number;
  ingredients: string[];
  allergens: string[];
  tags: string[];
  rating: number;
  reviewCount: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Mock data
const mockCategories: MenuCategory[] = [
  { id: '1', name: 'Starters', description: 'Delicious appetizers to begin your meal', icon: '🥗', order: 1, isActive: true, itemCount: 8 },
  { id: '2', name: 'Main Course', description: 'Hearty dishes that satisfy', icon: '🍽️', order: 2, isActive: true, itemCount: 15 },
  { id: '3', name: 'Desserts', description: 'Sweet treats to end your meal', icon: '🍰', order: 3, isActive: true, itemCount: 6 },
  { id: '4', name: 'Beverages', description: 'Refreshing drinks and hot beverages', icon: '🥤', order: 4, isActive: true, itemCount: 12 },
  { id: '5', name: 'Specials', description: 'Chef\'s special recommendations', icon: '⭐', order: 5, isActive: false, itemCount: 4 }
];

const mockMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Paneer Tikka Masala',
    description: 'Tender cottage cheese cubes in rich, creamy tomato-based curry with aromatic spices',
    price: 320,
    originalPrice: 350,
    categoryId: '2',
    images: ['/menu/paneer-tikka.jpg'],
    isAvailable: true,
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: true,
    isSpicy: true,
    preparationTime: 25,
    calories: 450,
    ingredients: ['Paneer', 'Tomatoes', 'Cream', 'Onions', 'Spices'],
    allergens: ['Dairy'],
    tags: ['Popular', 'Chef Special'],
    rating: 4.6,
    reviewCount: 89,
    order: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2', 
    name: 'Butter Chicken',
    description: 'Classic North Indian curry with tender chicken in creamy tomato sauce',
    price: 380,
    categoryId: '2',
    images: ['/menu/butter-chicken.jpg'],
    isAvailable: true,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: true,
    isSpicy: false,
    preparationTime: 30,
    calories: 520,
    ingredients: ['Chicken', 'Butter', 'Tomatoes', 'Cream', 'Spices'],
    allergens: ['Dairy'],
    tags: ['Signature', 'Popular'],
    rating: 4.8,
    reviewCount: 156,
    order: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Samosa Chaat',
    description: 'Crispy samosas topped with yogurt, chutneys, and fresh garnishes',
    price: 180,
    categoryId: '1',
    images: ['/menu/samosa-chaat.jpg'],
    isAvailable: true,
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: true,
    preparationTime: 10,
    calories: 320,
    ingredients: ['Samosa', 'Yogurt', 'Chutneys', 'Onions', 'Sev'],
    allergens: ['Gluten', 'Dairy'],
    tags: ['Street Food', 'Quick'],
    rating: 4.4,
    reviewCount: 67,
    order: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

export default function MenuManagementPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

  const filteredItems = mockMenuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.categoryId === selectedCategory;
    const matchesAvailability = showUnavailable || item.isAvailable;
    
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const getCategoryIcon = (iconString: string) => {
    const iconMap: { [key: string]: any } = {
      '🥗': Utensils,
      '🍽️': ChefHat,
      '🍰': Cake,
      '🥤': Coffee,
      '⭐': Star
    };
    return iconMap[iconString] || Utensils;
  };

  const MenuItemCard = ({ item }: { item: MenuItem }) => {
    const category = mockCategories.find(cat => cat.id === item.categoryId);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={cn(
          "group hover:shadow-lg transition-all duration-300",
          !item.isAvailable && "opacity-60"
        )}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              {/* Image */}
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                <ChefHat className="h-6 w-6 text-muted-foreground" />
              </div>

              {/* Content */}
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground line-clamp-1">{item.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setEditingItem(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1">
                  {item.isVegetarian && <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Veg</Badge>}
                  {item.isVegan && <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Vegan</Badge>}
                  {item.isGlutenFree && <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">GF</Badge>}
                  {item.isSpicy && <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">🌶️ Spicy</Badge>}
                  {!item.isAvailable && <Badge variant="destructive" className="text-xs">Unavailable</Badge>}
                </div>

                {/* Details */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{item.preparationTime}min</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Star className="h-3 w-3 mr-1 text-yellow-400 fill-current" />
                      <span>{item.rating}</span>
                      <span className="text-xs">({item.reviewCount})</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      {item.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          ₹{item.originalPrice}
                        </span>
                      )}
                      <span className="text-lg font-bold text-foreground">
                        ₹{item.price}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const CategoryCard = ({ category }: { category: MenuCategory }) => {
    const IconComponent = getCategoryIcon(category.icon);
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card 
          className={cn(
            "cursor-pointer hover:shadow-lg transition-all duration-300 group",
            selectedCategory === category.id && "ring-2 ring-primary ring-offset-2",
            !category.isActive && "opacity-60"
          )}
          onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <IconComponent className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{category.name}</h3>
                <p className="text-sm text-muted-foreground">{category.itemCount} items</p>
              </div>
              {!category.isActive && (
                <Badge variant="secondary" className="text-xs">Inactive</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Menu Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage your restaurant's menu items and categories
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Preview Menu
            </Button>
            <Button onClick={() => setShowAddItem(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { 
              title: 'Total Items', 
              value: mockMenuItems.length, 
              icon: Utensils,
              color: 'text-blue-600',
              bgColor: 'bg-blue-100'
            },
            { 
              title: 'Available', 
              value: mockMenuItems.filter(item => item.isAvailable).length, 
              icon: CheckCircle,
              color: 'text-green-600',
              bgColor: 'bg-green-100'
            },
            { 
              title: 'Categories', 
              value: mockCategories.filter(cat => cat.isActive).length, 
              icon: Package,
              color: 'text-purple-600',
              bgColor: 'bg-purple-100'
            },
            { 
              title: 'Avg Rating', 
              value: '4.6', 
              icon: Star,
              color: 'text-yellow-600',
              bgColor: 'bg-yellow-100'
            }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                      <Icon className={cn('h-5 w-5', stat.color)} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Categories</CardTitle>
                <CardDescription>Organize your menu items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-auto p-3"
                  onClick={() => setShowAddCategory(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
                
                <div 
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent",
                    selectedCategory === null && "bg-primary/10 text-primary"
                  )}
                  onClick={() => setSelectedCategory(null)}
                >
                  <div className="flex items-center space-x-2">
                    <Utensils className="h-4 w-4" />
                    <span className="font-medium">All Items</span>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {mockMenuItems.length}
                    </span>
                  </div>
                </div>

                {mockCategories.map(category => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search menu items..."
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={showUnavailable ? "default" : "outline"}
                      
                      onClick={() => setShowUnavailable(!showUnavailable)}
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Show Unavailable
                    </Button>
                    <Button variant="outline" >
                      <Filter className="h-4 w-4 mr-2" />
                      More Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Menu Items */}
            <div className="space-y-3">
              {filteredItems.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <ChefHat className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No menu items found
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {searchQuery ? 'Try adjusting your search query' : 'Start by adding your first menu item'}
                    </p>
                    <Button onClick={() => setShowAddItem(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Item
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredItems.map(item => (
                  <MenuItemCard key={item.id} item={item} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}