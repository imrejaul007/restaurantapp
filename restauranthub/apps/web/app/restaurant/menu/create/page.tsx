'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Upload, Plus, Minus, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function CreateMenuItem() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    ingredients: [''],
    allergens: [] as string[],
    nutritionInfo: {
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    },
    preparationTime: '',
    servingSize: '',
    available: true,
    popular: false,
    spicyLevel: 0,
    dietaryTags: [] as string[]
  });

  const categories = [
    'Appetizers', 'Soups', 'Salads', 'Pizza', 'Pasta', 'Burgers', 
    'Sandwiches', 'Seafood', 'Chicken', 'Beef', 'Vegetarian', 
    'Desserts', 'Beverages', 'Specials'
  ];

  const availableAllergens = [
    'Gluten', 'Dairy', 'Eggs', 'Fish', 'Shellfish', 'Tree Nuts', 
    'Peanuts', 'Soy', 'Sesame', 'Mustard'
  ];

  const availableDietaryTags = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 
    'Low-Carb', 'High-Protein', 'Organic', 'Local', 'Spicy'
  ];

  const handleInputChange = (field: string, value: any) => {
    setItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNutritionChange = (field: string, value: string) => {
    setItem(prev => ({
      ...prev,
      nutritionInfo: {
        ...prev.nutritionInfo,
        [field]: value
      }
    }));
  };

  const addIngredient = () => {
    setItem(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }));
  };

  const removeIngredient = (index: number) => {
    setItem(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index: number, value: string) => {
    setItem(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => i === index ? value : ing)
    }));
  };

  const toggleAllergen = (allergen: string) => {
    setItem(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  const toggleDietaryTag = (tag: string) => {
    setItem(prev => ({
      ...prev,
      dietaryTags: prev.dietaryTags.includes(tag)
        ? prev.dietaryTags.filter(t => t !== tag)
        : [...prev.dietaryTags, tag]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/restaurant/menu');
    } catch (error) {
      console.error('Error creating menu item:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = item.name && item.description && item.price && item.category && item.preparationTime;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Menu
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Create Menu Item</h1>
              <p className="text-muted-foreground">Add a new item to your menu</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={!isFormValid || loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Create Item'}
          </Button>
        </div>

        {!isFormValid && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Please fill in all required fields: Name, Description, Price, Category, and Preparation Time.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Item Name *</Label>
                    <Input
                      id="name"
                      value={item.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Margherita Pizza"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={item.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your dish..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select value={item.category} onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category.toLowerCase()}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="price">Price ($) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="prepTime">Preparation Time (minutes) *</Label>
                      <Input
                        id="prepTime"
                        type="number"
                        value={item.preparationTime}
                        onChange={(e) => handleInputChange('preparationTime', e.target.value)}
                        placeholder="15"
                      />
                    </div>
                    <div>
                      <Label htmlFor="servingSize">Serving Size</Label>
                      <Input
                        id="servingSize"
                        value={item.servingSize}
                        onChange={(e) => handleInputChange('servingSize', e.target.value)}
                        placeholder="1 pizza (8 slices)"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Ingredients */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Ingredients</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {item.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={ingredient}
                        onChange={(e) => updateIngredient(index, e.target.value)}
                        placeholder="Enter ingredient"
                        className="flex-1"
                      />
                      {item.ingredients.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeIngredient(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addIngredient}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Ingredient
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Nutrition Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Nutrition Information</CardTitle>
                  <p className="text-sm text-muted-foreground">Per serving (optional)</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="calories">Calories</Label>
                      <Input
                        id="calories"
                        type="number"
                        value={item.nutritionInfo.calories}
                        onChange={(e) => handleNutritionChange('calories', e.target.value)}
                        placeholder="320"
                      />
                    </div>
                    <div>
                      <Label htmlFor="protein">Protein (g)</Label>
                      <Input
                        id="protein"
                        type="number"
                        value={item.nutritionInfo.protein}
                        onChange={(e) => handleNutritionChange('protein', e.target.value)}
                        placeholder="14"
                      />
                    </div>
                    <div>
                      <Label htmlFor="carbs">Carbs (g)</Label>
                      <Input
                        id="carbs"
                        type="number"
                        value={item.nutritionInfo.carbs}
                        onChange={(e) => handleNutritionChange('carbs', e.target.value)}
                        placeholder="35"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fat">Fat (g)</Label>
                      <Input
                        id="fat"
                        type="number"
                        value={item.nutritionInfo.fat}
                        onChange={(e) => handleNutritionChange('fat', e.target.value)}
                        placeholder="12"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Item Photo */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Item Photo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🍽️</div>
                      <p className="text-sm text-gray-500">Upload item photo</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Item Settings */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Item Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="available">Available</Label>
                    <Checkbox
                      id="available"
                      checked={item.available}
                      onCheckedChange={(checked) => handleInputChange('available', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="popular">Popular Item</Label>
                    <Checkbox
                      id="popular"
                      checked={item.popular}
                      onCheckedChange={(checked) => handleInputChange('popular', checked)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="spicy">Spicy Level</Label>
                    <Select value={item.spicyLevel.toString()} onValueChange={(value) => handleInputChange('spicyLevel', parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Not Spicy</SelectItem>
                        <SelectItem value="1">🌶️ Mild</SelectItem>
                        <SelectItem value="2">🌶️🌶️ Medium</SelectItem>
                        <SelectItem value="3">🌶️🌶️🌶️ Hot</SelectItem>
                        <SelectItem value="4">🌶️🌶️🌶️🌶️ Very Hot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Allergens */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                    Allergens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {availableAllergens.map(allergen => (
                      <div key={allergen} className="flex items-center space-x-2">
                        <Checkbox
                          id={`allergen-${allergen}`}
                          checked={item.allergens.includes(allergen)}
                          onCheckedChange={() => toggleAllergen(allergen)}
                        />
                        <Label htmlFor={`allergen-${allergen}`} className="text-sm">
                          {allergen}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {item.allergens.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">Selected:</p>
                      <div className="flex flex-wrap gap-1">
                        {item.allergens.map(allergen => (
                          <Badge key={allergen} className="bg-red-500 text-xs">
                            {allergen}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Dietary Tags */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Dietary Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {availableDietaryTags.map(tag => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={`diet-${tag}`}
                          checked={item.dietaryTags.includes(tag)}
                          onCheckedChange={() => toggleDietaryTag(tag)}
                        />
                        <Label htmlFor={`diet-${tag}`} className="text-sm">
                          {tag}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {item.dietaryTags.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">Selected:</p>
                      <div className="flex flex-wrap gap-1">
                        {item.dietaryTags.map(tag => (
                          <Badge key={tag} className="bg-green-500 text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}