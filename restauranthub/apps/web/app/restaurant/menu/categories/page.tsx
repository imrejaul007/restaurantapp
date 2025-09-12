'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FolderOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  ArrowUp, 
  ArrowDown,
  Settings,
  Save,
  X,
  Check,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

interface MenuCategory {
  id: number;
  name: string;
  description: string;
  isVisible: boolean;
  sortOrder: number;
  itemCount: number;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export default function MenuCategoryManagement() {
  const [categories, setCategories] = useState<MenuCategory[]>([
    {
      id: 1,
      name: 'Appetizers',
      description: 'Start your meal with our delicious appetizers',
      isVisible: true,
      sortOrder: 1,
      itemCount: 8,
      color: '#FF6B6B',
      icon: '🥗',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-02-01T14:30:00Z'
    },
    {
      id: 2,
      name: 'Main Courses',
      description: 'Hearty and satisfying main dishes',
      isVisible: true,
      sortOrder: 2,
      itemCount: 15,
      color: '#4ECDC4',
      icon: '🍽️',
      createdAt: '2024-01-15T10:05:00Z',
      updatedAt: '2024-02-01T15:00:00Z'
    },
    {
      id: 3,
      name: 'Desserts',
      description: 'Sweet endings to your perfect meal',
      isVisible: true,
      sortOrder: 3,
      itemCount: 6,
      color: '#FFE66D',
      icon: '🍰',
      createdAt: '2024-01-15T10:10:00Z',
      updatedAt: '2024-02-01T16:00:00Z'
    },
    {
      id: 4,
      name: 'Beverages',
      description: 'Refreshing drinks and specialty beverages',
      isVisible: false,
      sortOrder: 4,
      itemCount: 12,
      color: '#A8E6CF',
      icon: '🥤',
      createdAt: '2024-01-15T10:15:00Z',
      updatedAt: '2024-02-01T17:00:00Z'
    },
    {
      id: 5,
      name: 'Seasonal Specials',
      description: 'Limited time seasonal offerings',
      isVisible: true,
      sortOrder: 5,
      itemCount: 4,
      color: '#FF8B94',
      icon: '⭐',
      createdAt: '2024-02-01T09:00:00Z',
      updatedAt: '2024-02-01T18:00:00Z'
    }
  ]);

  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCategory, setNewCategory] = useState<Partial<MenuCategory>>({
    name: '',
    description: '',
    isVisible: true,
    color: '#4ECDC4',
    icon: '📁'
  });
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  const colorOptions = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
  ];

  const iconOptions = [
    '🥗', '🍽️', '🍰', '🥤', '🍕', '🍔', '🍜', '🍣', '🥘', '🍖',
    '🥙', '🍳', '🥞', '🧆', '🍲', '⭐', '🔥', '💎', '🎯', '📁'
  ];

  const handleCreateCategory = () => {
    const category: MenuCategory = {
      id: Math.max(...categories.map(c => c.id)) + 1,
      name: newCategory.name || '',
      description: newCategory.description || '',
      isVisible: newCategory.isVisible ?? true,
      sortOrder: categories.length + 1,
      itemCount: 0,
      color: newCategory.color || '#4ECDC4',
      icon: newCategory.icon || '📁',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setCategories(prev => [...prev, category]);
    setNewCategory({ name: '', description: '', isVisible: true, color: '#4ECDC4', icon: '📁' });
    setShowCreateDialog(false);
  };

  const handleUpdateCategory = (id: number, updates: Partial<MenuCategory>) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id 
        ? { ...cat, ...updates, updatedAt: new Date().toISOString() }
        : cat
    ));
  };

  const handleDeleteCategory = (id: number) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newCategories = [...categories];
    const [removed] = newCategories.splice(fromIndex, 1);
    newCategories.splice(toIndex, 0, removed);
    
    // Update sort order
    const reorderedCategories = newCategories.map((cat, index) => ({
      ...cat,
      sortOrder: index + 1,
      updatedAt: new Date().toISOString()
    }));
    
    setCategories(reorderedCategories);
  };

  const moveCategory = (id: number, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(cat => cat.id === id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < categories.length) {
      handleReorder(currentIndex, newIndex);
    }
  };

  const toggleVisibility = (id: number) => {
    handleUpdateCategory(id, { isVisible: !categories.find(cat => cat.id === id)?.isVisible });
  };

  const stats = {
    total: categories.length,
    visible: categories.filter(cat => cat.isVisible).length,
    hidden: categories.filter(cat => !cat.isVisible).length,
    totalItems: categories.reduce((sum, cat) => sum + cat.itemCount, 0)
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Menu Categories</h1>
            <p className="text-muted-foreground">Organize your menu items into categories</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Appetizers, Main Courses"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this category"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category Color</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {colorOptions.map(color => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${
                            newCategory.color === color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Category Icon</Label>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {iconOptions.map(icon => (
                        <button
                          key={icon}
                          className={`w-8 h-8 rounded border text-lg ${
                            newCategory.icon === icon ? 'border-gray-800 bg-gray-100' : 'border-gray-300'
                          }`}
                          onClick={() => setNewCategory(prev => ({ ...prev, icon }))}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newCategory.isVisible}
                    onCheckedChange={(checked) => setNewCategory(prev => ({ ...prev, isVisible: checked }))}
                  />
                  <Label>Visible to customers</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCategory} disabled={!newCategory.name}>
                    Create Category
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Categories</p>
                    <h3 className="text-2xl font-bold mt-2">{stats.total}</h3>
                  </div>
                  <FolderOpen className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Visible</p>
                    <h3 className="text-2xl font-bold mt-2 text-green-600">{stats.visible}</h3>
                  </div>
                  <Eye className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hidden</p>
                    <h3 className="text-2xl font-bold mt-2 text-gray-600">{stats.hidden}</h3>
                  </div>
                  <EyeOff className="h-8 w-8 text-gray-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Items</p>
                    <h3 className="text-2xl font-bold mt-2 text-purple-600">{stats.totalItems}</h3>
                  </div>
                  <Settings className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Categories List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle>Category Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 border rounded-lg transition-all ${
                      editingCategory?.id === category.id ? 'border-blue-300 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    draggable
                    onDragStart={() => setDraggedItem(category.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedItem && draggedItem !== category.id) {
                        const fromIndex = categories.findIndex(c => c.id === draggedItem);
                        const toIndex = categories.findIndex(c => c.id === category.id);
                        handleReorder(fromIndex, toIndex);
                        setDraggedItem(null);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Drag Handle */}
                      <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
                      
                      {/* Category Icon */}
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-xl text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.icon}
                      </div>
                      
                      {/* Category Info */}
                      <div className="flex-1">
                        {editingCategory?.id === category.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editingCategory.name}
                              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                              className="font-semibold"
                            />
                            <Textarea
                              value={editingCategory.description}
                              onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                              rows={2}
                            />
                          </div>
                        ) : (
                          <div>
                            <h3 className="font-semibold text-lg">{category.name}</h3>
                            <p className="text-gray-600 text-sm">{category.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>Order: {category.sortOrder}</span>
                              <span>Items: {category.itemCount}</span>
                              <span>Updated: {new Date(category.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Status & Actions */}
                      <div className="flex items-center space-x-2">
                        <Badge variant={category.isVisible ? 'default' : 'secondary'}>
                          {category.isVisible ? 'Visible' : 'Hidden'}
                        </Badge>
                        
                        {editingCategory?.id === category.id ? (
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              onClick={() => {
                                handleUpdateCategory(category.id, {
                                  name: editingCategory.name,
                                  description: editingCategory.description
                                });
                                setEditingCategory(null);
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingCategory(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveCategory(category.id, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveCategory(category.id, 'down')}
                              disabled={index === categories.length - 1}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleVisibility(category.id)}
                            >
                              {category.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingCategory(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
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