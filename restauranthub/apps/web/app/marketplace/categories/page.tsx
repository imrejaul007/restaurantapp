'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, X, TrendingUp, Star, Users, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  description: string;
  emoji: string;
  image: string;
  productCount: number;
  vendorCount: number;
  avgRating: number;
  avgDeliveryTime: string;
  priceRange: string;
  isTrending: boolean;
  isPopular: boolean;
  subcategories: string[];
  popularItems: string[];
  topVendors: {
    id: string;
    name: string;
    rating: number;
  }[];
  stats: {
    ordersToday: number;
    weeklyGrowth: number;
    averageOrderValue: number;
  };
}

const mockCategories: Category[] = [
  {
    id: 'pizza',
    name: 'Pizza',
    description: 'From classic margherita to gourmet wood-fired creations, discover the best pizzas in your area.',
    emoji: '🍕',
    image: '🍕',
    productCount: 127,
    vendorCount: 23,
    avgRating: 4.6,
    avgDeliveryTime: '25-35 min',
    priceRange: '$12-$28',
    isTrending: true,
    isPopular: true,
    subcategories: ['Margherita', 'Pepperoni', 'Vegetarian', 'Meat Lovers', 'Gourmet', 'Gluten Free'],
    popularItems: ['Margherita Pizza', 'Pepperoni Supreme', 'Four Cheese'],
    topVendors: [
      { id: 'bella-vista', name: 'Bella Vista Italian', rating: 4.8 },
      { id: 'pizza-palace', name: 'Pizza Palace', rating: 4.7 },
      { id: 'wood-fire', name: 'Wood Fire Co.', rating: 4.6 }
    ],
    stats: {
      ordersToday: 342,
      weeklyGrowth: 15,
      averageOrderValue: 24.50
    }
  },
  {
    id: 'sushi',
    name: 'Sushi & Japanese',
    description: 'Fresh sashimi, creative rolls, and authentic Japanese cuisine prepared by expert sushi chefs.',
    emoji: '🍣',
    image: '🍣',
    productCount: 89,
    vendorCount: 12,
    avgRating: 4.8,
    avgDeliveryTime: '20-30 min',
    priceRange: '$18-$45',
    isTrending: true,
    isPopular: true,
    subcategories: ['Sushi Rolls', 'Sashimi', 'Nigiri', 'Bento Boxes', 'Ramen', 'Tempura'],
    popularItems: ['Rainbow Roll', 'Salmon Sashimi', 'Dragon Roll'],
    topVendors: [
      { id: 'tokyo-sushi', name: 'Tokyo Sushi Bar', rating: 4.9 },
      { id: 'sakura', name: 'Sakura Japanese', rating: 4.8 },
      { id: 'zen-sushi', name: 'Zen Sushi', rating: 4.7 }
    ],
    stats: {
      ordersToday: 189,
      weeklyGrowth: 22,
      averageOrderValue: 32.80
    }
  },
  {
    id: 'burgers',
    name: 'Burgers',
    description: 'Juicy beef, crispy chicken, and creative plant-based burgers that satisfy every craving.',
    emoji: '🍔',
    image: '🍔',
    productCount: 156,
    vendorCount: 18,
    avgRating: 4.5,
    avgDeliveryTime: '15-25 min',
    priceRange: '$8-$22',
    isTrending: false,
    isPopular: true,
    subcategories: ['Beef Burgers', 'Chicken Burgers', 'Veggie Burgers', 'Gourmet', 'Sliders', 'Breakfast'],
    popularItems: ['Classic Cheeseburger', 'BBQ Bacon Burger', 'Veggie Deluxe'],
    topVendors: [
      { id: 'burger-palace', name: 'Burger Palace', rating: 4.6 },
      { id: 'gourmet-burgers', name: 'Gourmet Burger Co.', rating: 4.5 },
      { id: 'smash-burger', name: 'Smash Burger', rating: 4.4 }
    ],
    stats: {
      ordersToday: 456,
      weeklyGrowth: 8,
      averageOrderValue: 16.25
    }
  },
  {
    id: 'indian',
    name: 'Indian Cuisine',
    description: 'Aromatic spices and traditional flavors from across India, from mild to spicy hot.',
    emoji: '🍛',
    image: '🍛',
    productCount: 134,
    vendorCount: 15,
    avgRating: 4.7,
    avgDeliveryTime: '30-40 min',
    priceRange: '$10-$25',
    isTrending: true,
    isPopular: false,
    subcategories: ['Curry', 'Biryani', 'Tandoor', 'Vegetarian', 'Breads', 'Desserts'],
    popularItems: ['Butter Chicken', 'Chicken Biryani', 'Palak Paneer'],
    topVendors: [
      { id: 'spice-garden', name: 'Spice Garden', rating: 4.8 },
      { id: 'mumbai-express', name: 'Mumbai Express', rating: 4.7 },
      { id: 'curry-house', name: 'Curry House', rating: 4.6 }
    ],
    stats: {
      ordersToday: 234,
      weeklyGrowth: 18,
      averageOrderValue: 19.75
    }
  },
  {
    id: 'chinese',
    name: 'Chinese Food',
    description: 'Traditional and modern Chinese dishes with bold flavors and fresh ingredients.',
    emoji: '🥡',
    image: '🥡',
    productCount: 178,
    vendorCount: 22,
    avgRating: 4.4,
    avgDeliveryTime: '25-35 min',
    priceRange: '$9-$24',
    isTrending: false,
    isPopular: true,
    subcategories: ['Stir Fry', 'Dim Sum', 'Noodles', 'Rice Dishes', 'Soups', 'Dumplings'],
    popularItems: ['Sweet & Sour Chicken', 'Fried Rice', 'Dumplings'],
    topVendors: [
      { id: 'dragons-kitchen', name: 'Dragon\'s Kitchen', rating: 4.5 },
      { id: 'golden-wok', name: 'Golden Wok', rating: 4.4 },
      { id: 'panda-express', name: 'Panda Express', rating: 4.3 }
    ],
    stats: {
      ordersToday: 378,
      weeklyGrowth: 5,
      averageOrderValue: 17.60
    }
  },
  {
    id: 'mexican',
    name: 'Mexican Food',
    description: 'Spicy and flavorful Mexican cuisine from tacos to burritos, made with authentic ingredients.',
    emoji: '🌮',
    image: '🌮',
    productCount: 92,
    vendorCount: 11,
    avgRating: 4.5,
    avgDeliveryTime: '20-30 min',
    priceRange: '$7-$18',
    isTrending: false,
    isPopular: false,
    subcategories: ['Tacos', 'Burritos', 'Quesadillas', 'Nachos', 'Salsa', 'Desserts'],
    popularItems: ['Chicken Tacos', 'Beef Burrito', 'Loaded Nachos'],
    topVendors: [
      { id: 'el-mariachi', name: 'El Mariachi', rating: 4.6 },
      { id: 'taco-bell', name: 'Taco Bell', rating: 4.4 },
      { id: 'mexican-grill', name: 'Mexican Grill', rating: 4.3 }
    ],
    stats: {
      ordersToday: 167,
      weeklyGrowth: 12,
      averageOrderValue: 14.30
    }
  },
  {
    id: 'healthy',
    name: 'Healthy & Salads',
    description: 'Fresh, nutritious meals perfect for a healthy lifestyle. Organic ingredients and balanced nutrition.',
    emoji: '🥗',
    image: '🥗',
    productCount: 73,
    vendorCount: 8,
    avgRating: 4.6,
    avgDeliveryTime: '20-30 min',
    priceRange: '$8-$22',
    isTrending: true,
    isPopular: false,
    subcategories: ['Salads', 'Bowls', 'Smoothies', 'Protein Boxes', 'Vegan', 'Keto'],
    popularItems: ['Power Bowl', 'Greek Salad', 'Protein Smoothie'],
    topVendors: [
      { id: 'green-bowl', name: 'Green Bowl', rating: 4.7 },
      { id: 'fresh-greens', name: 'Fresh Greens', rating: 4.6 },
      { id: 'salad-bar', name: 'Salad Bar', rating: 4.5 }
    ],
    stats: {
      ordersToday: 145,
      weeklyGrowth: 28,
      averageOrderValue: 16.90
    }
  },
  {
    id: 'desserts',
    name: 'Desserts & Sweets',
    description: 'Indulgent desserts, cakes, and sweet treats to satisfy your sweet tooth cravings.',
    emoji: '🍰',
    image: '🍰',
    productCount: 85,
    vendorCount: 14,
    avgRating: 4.7,
    avgDeliveryTime: '15-25 min',
    priceRange: '$5-$15',
    isTrending: false,
    isPopular: false,
    subcategories: ['Cakes', 'Ice Cream', 'Cookies', 'Pastries', 'Chocolate', 'Seasonal'],
    popularItems: ['Chocolate Cake', 'Vanilla Ice Cream', 'Tiramisu'],
    topVendors: [
      { id: 'sweet-treats', name: 'Sweet Treats', rating: 4.8 },
      { id: 'cake-palace', name: 'Cake Palace', rating: 4.7 },
      { id: 'ice-cream-shop', name: 'Ice Cream Shop', rating: 4.6 }
    ],
    stats: {
      ordersToday: 98,
      weeklyGrowth: 7,
      averageOrderValue: 11.20
    }
  }
];

export default function CategoriesPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>(mockCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    let filtered = [...categories];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.subcategories.some(sub => sub.toLowerCase().includes(searchQuery.toLowerCase())) ||
        category.popularItems.some(item => item.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by type
    switch (selectedFilter) {
      case 'trending':
        filtered = filtered.filter(category => category.isTrending);
        break;
      case 'popular':
        filtered = filtered.filter(category => category.isPopular);
        break;
      case 'high-rated':
        filtered = filtered.filter(category => category.avgRating >= 4.6);
        break;
      case 'fast-delivery':
        filtered = filtered.filter(category => parseInt(category.avgDeliveryTime.split('-')[0]) <= 25);
        break;
      default:
        // Show all
        break;
    }

    // Sort by popularity (trending first, then by order count)
    filtered.sort((a, b) => {
      if (a.isTrending && !b.isTrending) return -1;
      if (!a.isTrending && b.isTrending) return 1;
      return b.stats.ordersToday - a.stats.ordersToday;
    });

    setFilteredCategories(filtered);
  }, [categories, searchQuery, selectedFilter]);

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/marketplace/category/${categoryId}`);
  };

  const handleVendorClick = (vendorId: string) => {
    router.push(`/marketplace/vendor/${vendorId}`);
  };

  const filterOptions = [
    { id: 'all', name: 'All Categories', count: categories.length },
    { id: 'trending', name: 'Trending', count: categories.filter(c => c.isTrending).length },
    { id: 'popular', name: 'Popular', count: categories.filter(c => c.isPopular).length },
    { id: 'high-rated', name: 'Highly Rated', count: categories.filter(c => c.avgRating >= 4.6).length },
    { id: 'fast-delivery', name: 'Fast Delivery', count: categories.filter(c => parseInt(c.avgDeliveryTime.split('-')[0]) <= 25).length }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/marketplace')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
          <div className="text-sm text-muted-foreground">
            <span className="cursor-pointer hover:text-foreground" onClick={() => router.push('/marketplace')}>
              Marketplace
            </span>
            <span className="mx-2">›</span>
            <span>Categories</span>
          </div>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
            <span className="text-4xl">🍽️</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold">Food Categories</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Explore different cuisines and discover your new favorite dishes
            </p>
            <div className="flex items-center justify-center space-x-4 mt-4">
              <Badge variant="secondary">{filteredCategories.length} categories</Badge>
              <Badge variant="outline">{categories.reduce((acc, cat) => acc + cat.vendorCount, 0)} vendors</Badge>
              <Badge variant="outline">{categories.reduce((acc, cat) => acc + cat.productCount, 0)} dishes</Badge>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search categories, dishes, or cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto">
            {filterOptions.map((option) => (
              <Button
                key={option.id}
                variant={selectedFilter === option.id ? 'default' : 'outline'}
                
                onClick={() => setSelectedFilter(option.id)}
                className="whitespace-nowrap"
              >
                {option.name}
                <Badge variant="secondary" className="ml-2 h-4 text-xs">
                  {option.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Categories Grid */}
        {filteredCategories.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">No categories found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or filters
            </p>
            <Button onClick={() => {
              setSearchQuery('');
              setSelectedFilter('all');
            }}>
              Clear Search & Filters
            </Button>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200" onClick={() => handleCategoryClick(category.id)}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-4xl">{category.emoji}</div>
                      <div className="flex items-center space-x-1">
                        {category.isTrending && (
                          <Badge className="bg-red-500">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                        {category.isPopular && (
                          <Badge className="bg-blue-500">Popular</Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {category.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {category.description}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{category.productCount}</div>
                        <div className="text-xs text-muted-foreground">Dishes</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{category.vendorCount}</div>
                        <div className="text-xs text-muted-foreground">Vendors</div>
                      </div>
                    </div>

                    {/* Rating and Delivery */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{category.avgRating}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{category.avgDeliveryTime}</span>
                      </div>
                    </div>

                    {/* Price Range */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Price Range:</span>
                      <span className="font-semibold">{category.priceRange}</span>
                    </div>

                    {/* Popular Items */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Popular Items:</h4>
                      <div className="flex flex-wrap gap-1">
                        {category.popularItems.slice(0, 3).map(item => (
                          <Badge key={item} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Top Vendors */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Top Vendors:</h4>
                      <div className="space-y-1">
                        {category.topVendors.slice(0, 2).map(vendor => (
                          <div
                            key={vendor.id}
                            className="flex items-center justify-between text-xs cursor-pointer hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVendorClick(vendor.id);
                            }}
                          >
                            <span>{vendor.name}</span>
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{vendor.rating}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Daily Stats */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="text-center">
                          <div className="font-semibold text-green-600">{category.stats.ordersToday}</div>
                          <div className="text-muted-foreground">Orders Today</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <span className={`font-semibold ${category.stats.weeklyGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {category.stats.weeklyGrowth > 0 ? '+' : ''}{category.stats.weeklyGrowth}%
                            </span>
                            <TrendingUp className={`h-3 w-3 ${category.stats.weeklyGrowth > 0 ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
                          </div>
                          <div className="text-muted-foreground">This Week</div>
                        </div>
                      </div>
                    </div>

                    {/* View Category Button */}
                    <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground" size="default" variant="default">
                      Explore {category.name}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-8 text-center text-white"
        >
          <h2 className="text-2xl font-bold mb-2">Can't find what you're looking for?</h2>
          <p className="mb-6">Use our smart search to find exactly what you're craving!</p>
          <Button variant="secondary" onClick={() => router.push('/marketplace/search')}>
            Advanced Search
          </Button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}