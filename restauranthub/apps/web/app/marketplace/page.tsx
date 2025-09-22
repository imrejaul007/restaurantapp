'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  Bell,
  User,
  Heart,
  MapPin,
  Filter,
  ChevronRight,
  ChevronLeft,
  Clock,
  TrendingUp,
  Star,
  Package,
  Truck,
  Timer,
  Gift,
  Award,
  Users,
  ShieldCheck,
  Headphones,
  CreditCard,
  RefreshCw,
  ArrowRight,
  Wallet,
  Store,
  Flame,
  Zap,
  Eye,
  Plus,
  Minus,
  X,
  Building2,
  Wrench,
  Calendar,
  Play,
  MessageSquare,
  Video,
  RotateCcw,
  Target,
  Gamepad2,
  Coins,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Globe,
  Phone,
  Mail,
  CheckCircle,
  Percent,
  Grid3X3,
  List,
  Building,
  Home,
  Car,
  Scissors,
  Briefcase,
  Settings,
  Repeat,
  Crown,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

// Comprehensive categories including Real Estate and Services
const categories = [
  { id: 1, name: 'Fresh Produce', icon: '🥬', count: 256, color: 'bg-green-100 text-green-700' },
  { id: 2, name: 'Ingredients', icon: '🧂', count: 312, color: 'bg-orange-100 text-orange-700' },
  { id: 3, name: 'Equipment', icon: '🍳', count: 189, color: 'bg-blue-100 text-blue-700' },
  { id: 4, name: 'Cleaning', icon: '🧹', count: 156, color: 'bg-pink-100 text-pink-700' },
  { id: 5, name: 'Real Estate', icon: '🏢', count: 87, color: 'bg-purple-100 text-purple-700' },
  { id: 6, name: 'Services', icon: '⚡', count: 234, color: 'bg-yellow-100 text-yellow-700' },
  { id: 7, name: 'Beverages', icon: '🥤', count: 198, color: 'bg-cyan-100 text-cyan-700' },
  { id: 8, name: 'Frozen Foods', icon: '❄️', count: 143, color: 'bg-indigo-100 text-indigo-700' }
];

const banners = [
  {
    id: 1,
    title: 'Fresh Weekend Deals',
    subtitle: 'Save up to 40% on fresh produce',
    color: 'from-green-500 to-emerald-500',
    action: 'Shop Fresh'
  },
  {
    id: 2,
    title: 'Bulk Order Discounts',
    subtitle: 'Special prices for restaurants - Up to 40% OFF',
    color: 'from-blue-500 to-indigo-500',
    action: 'Get Quote'
  },
  {
    id: 3,
    title: 'New Vendor Launch',
    subtitle: 'Premium seafood supplier now available',
    color: 'from-purple-500 to-pink-500',
    action: 'Explore'
  }
];

// Search suggestions for autocomplete
const searchSuggestions = [
  { type: 'product', name: 'Organic Tomatoes', category: 'Fresh Produce' },
  { type: 'vendor', name: 'Fresh Farms Direct', category: 'Organic Produce' },
  { type: 'category', name: 'Kitchen Equipment', category: 'Equipment' },
  { type: 'product', name: 'Commercial Oven', category: 'Equipment' },
  { type: 'service', name: 'LPG Delivery', category: 'Services' },
  { type: 'product', name: 'Cleaning Supplies', category: 'Cleaning' },
];

export default function MarketplacePage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // State management
  const [currentBanner, setCurrentBanner] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [userStreak, setUserStreak] = useState(7);
  const [coins, setCoins] = useState(250);

  // Flash deals with countdown
  const [flashDeals] = useState([
    { id: 1, name: 'Premium Chicken Breast', price: 12.99, oldPrice: 18.99, discount: 32, timeLeft: '02:45:30', stock: 15 },
    { id: 2, name: 'Fresh Atlantic Salmon', price: 24.99, oldPrice: 34.99, discount: 29, timeLeft: '01:23:45', stock: 8 },
    { id: 3, name: 'Organic Vegetables Box', price: 18.99, oldPrice: 28.99, discount: 35, timeLeft: '03:12:15', stock: 23 },
    { id: 4, name: 'Italian Pasta Bundle', price: 15.99, oldPrice: 22.99, discount: 30, timeLeft: '00:45:20', stock: 5 }
  ]);

  // Trending products
  const trendingProducts = [
    { id: 1, name: 'Wagyu Beef Cuts', vendor: 'Premium Meats Co.', price: 89.99, rating: 4.9, reviews: 234 },
    { id: 2, name: 'Artisan Cheese Selection', vendor: 'Dairy Delights', price: 45.99, rating: 4.8, reviews: 156 },
    { id: 3, name: 'Fresh Sushi Grade Tuna', vendor: 'Ocean Fresh', price: 56.99, rating: 4.9, reviews: 189 },
    { id: 4, name: 'Organic Honey Collection', vendor: 'Sweet Harvest', price: 28.99, rating: 4.7, reviews: 312 }
  ];

  // New Arrivals
  const newArrivals = [
    { id: 1, name: 'Japanese Kitchen Knives Set', vendor: 'Elite Tools', price: 299.99, isNew: true },
    { id: 2, name: 'Molecular Gastronomy Kit', vendor: 'Modern Chef', price: 179.99, isNew: true },
    { id: 3, name: 'Organic Truffle Oil', vendor: 'Gourmet Essentials', price: 89.99, isNew: true },
    { id: 4, name: 'Smart Food Scale', vendor: 'Tech Kitchen', price: 129.99, isNew: true }
  ];

  // Top vendors
  const topVendors = [
    { id: 1, name: 'Fresh Farms Direct', rating: 4.9, products: 256, speciality: 'Organic Produce', verified: true },
    { id: 2, name: 'Ocean Fresh Seafood', rating: 4.8, products: 143, speciality: 'Premium Seafood', verified: true },
    { id: 3, name: 'Artisan Bakery Hub', rating: 4.9, products: 97, speciality: 'Fresh Baked Goods', verified: true },
    { id: 4, name: 'Global Spice Market', rating: 4.7, products: 189, speciality: 'Exotic Spices', verified: true }
  ];

  // Personalized recommendations
  const recommendations = [
    { id: 1, name: 'Based on your orders', reason: 'You frequently order pasta ingredients' },
    { id: 2, name: 'Recommended for restaurants', reason: 'Popular with similar businesses' },
    { id: 3, name: 'Trending in your area', reason: 'High demand nearby' }
  ];

  // Recently viewed items
  const recentlyViewed = [
    { id: 1, name: 'Commercial Blender', price: 249.99, viewedAt: '2 hours ago' },
    { id: 2, name: 'Olive Oil Premium', price: 34.99, viewedAt: '1 day ago' },
    { id: 3, name: 'Restaurant POS System', price: 899.99, viewedAt: '2 days ago' }
  ];

  // Reorder essentials
  const reorderEssentials = [
    { id: 1, name: 'Weekly Produce Box', price: 45.99, lastOrdered: '1 week ago' },
    { id: 2, name: 'Cooking Oil 5L', price: 12.99, lastOrdered: '2 weeks ago' },
    { id: 3, name: 'Paper Towels Bulk', price: 28.99, lastOrdered: '3 weeks ago' }
  ];

  // Community highlights
  const communityHighlights = [
    { id: 1, user: 'ChefMario', content: 'Amazing truffle pasta recipe using @GourmetTruffles ingredients!', likes: 234, product: 'Black Truffle Oil' },
    { id: 2, user: 'RestaurantOwner', content: 'Our customers love the fresh seafood from @OceanFresh', likes: 189, product: 'Daily Fresh Fish' },
    { id: 3, user: 'HomeChef', content: 'Best kitchen equipment I\'ve ever used! @EliteTools', likes: 156, product: 'Professional Knife Set' }
  ];

  // Top reviews
  const topReviews = [
    { id: 1, user: 'Restaurant Manager', rating: 5, comment: 'Excellent quality, fast delivery!', product: 'Premium Beef' },
    { id: 2, user: 'Chef Antonio', rating: 5, comment: 'Fresh ingredients, perfect for my restaurant', product: 'Daily Vegetable Box' },
    { id: 3, user: 'Café Owner', rating: 4.8, comment: 'Great bulk pricing and quality service', product: 'Coffee Beans' }
  ];

  // Service subscriptions
  const serviceSubscriptions = [
    { id: 1, name: 'LPG Delivery', price: 25.99, frequency: 'Monthly', description: 'Regular gas cylinder delivery' },
    { id: 2, name: 'Laundry Service', price: 89.99, frequency: 'Weekly', description: 'Commercial laundry pickup & delivery' },
    { id: 3, name: 'Marketing Plans', price: 199.99, frequency: 'Monthly', description: 'Social media & digital marketing' }
  ];

  // Bulk order shortcuts
  const bulkOrderShortcuts = [
    { id: 1, name: 'Order 50kg Flour', icon: '🌾', category: 'Bulk Ingredients' },
    { id: 2, name: '200 Cleaning Supplies', icon: '🧽', category: 'Bulk Cleaning' },
    { id: 3, name: 'Restaurant Starter Kit', icon: '🍽️', category: 'Equipment Bundle' }
  ];

  // Business deals of the week
  const businessDeals = [
    { id: 1, name: 'Wholesale Meat Package', discount: 45, originalPrice: 899.99, salePrice: 494.99 },
    { id: 2, name: 'B2B Kitchen Equipment', discount: 35, originalPrice: 1299.99, salePrice: 844.99 },
    { id: 3, name: 'Restaurant Supply Bundle', discount: 40, originalPrice: 699.99, salePrice: 419.99 }
  ];

  // Auto-rotate banners
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  // Filtered search suggestions
  const filteredSuggestions = searchSuggestions.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Button handlers
  const handleSearch = () => {
    if (searchQuery.trim()) {
      toast({
        title: "Searching...",
        description: `Searching for "${searchQuery}"`,
      });
      setShowSuggestions(false);
      router.push(`/marketplace/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    toast({
      title: `Selected ${suggestion.type}`,
      description: suggestion.name,
    });
  };

  const handleCategoryClick = (categoryId: number) => {
    setSelectedCategory(categoryId);
    const category = categories.find(c => c.id === categoryId);
    toast({
      title: "Category Selected",
      description: `Viewing ${category?.name} products`,
    });
    router.push(`/marketplace/category/${categoryId}`);
  };

  const handleAddToCart = (product: any) => {
    setCartCount(prev => prev + 1);
    setCartItems(prev => [...prev, { ...product, quantity: 1 }]);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart`,
    });
  };

  const handleAddToWishlist = (product: any) => {
    setWishlistCount(prev => prev + 1);
    toast({
      title: "Added to Wishlist",
      description: `${product.name} has been saved to your wishlist`,
    });
  };

  const handleViewProduct = (productId: number) => {
    router.push(`/marketplace/product/${productId}`);
  };

  const handleViewVendor = (vendorId: number) => {
    router.push(`/marketplace/vendor/${vendorId}`);
  };

  const handleBannerAction = (banner: any) => {
    toast({
      title: banner.title,
      description: "Redirecting to deals page...",
    });
    router.push('/marketplace/deals');
  };

  const handleNotifications = () => {
    setNotificationCount(0);
    toast({
      title: "Notifications",
      description: "All notifications marked as read",
    });
    router.push('/notifications');
  };

  const handleProfile = () => {
    router.push('/profile');
  };

  const handleWallet = () => {
    router.push('/wallet');
  };

  const handleSpinWheel = () => {
    setShowSpinWheel(true);
    // Simulate spin result
    setTimeout(() => {
      const reward = Math.floor(Math.random() * 50) + 10;
      setCoins(prev => prev + reward);
      toast({
        title: "🎉 Congratulations!",
        description: `You won ${reward} coins!`,
      });
      setShowSpinWheel(false);
    }, 3000);
  };

  const handleReorderEssentials = (item: any) => {
    handleAddToCart(item);
    toast({
      title: "Reordered!",
      description: `${item.name} has been reordered`,
    });
  };

  const updateCartQuantity = (itemId: number, change: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (itemId: number) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
    setCartCount(prev => Math.max(0, prev - 1));
    toast({
      title: "Removed from Cart",
      description: "Item has been removed from your cart",
    });
  };

  const calculateCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const handleB2BQuote = (deal: any) => {
    toast({
      title: "B2B Quote Request",
      description: `Requesting quote for ${deal.name}`,
    });
    router.push(`/marketplace/b2b-quote?product=${encodeURIComponent(deal.name)}&price=${deal.salePrice}`);
  };

  const handleSubscribeService = (service: any) => {
    toast({
      title: "Service Subscription",
      description: `Opening subscription for ${service.name}`,
    });
    router.push(`/marketplace/services/${service.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Enhanced Header with Smart Search and Quick Actions */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Smart Search Bar with Autocomplete */}
            <div className="flex-1 max-w-2xl relative">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Smart search: products, vendors, categories, tags..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(e.target.value.length > 0);
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={() => searchQuery && setShowSuggestions(true)}
                  className="pl-10 pr-24 py-3 w-full border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400" />
                <Button
                  onClick={handleSearch}
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white"
                 variant="default">
                  Search
                </Button>
              </div>
              
              {/* Autocomplete Suggestions */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg mt-1 z-50">
                  {filteredSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="flex items-center gap-3">
                        {suggestion.type === 'product' && <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                        {suggestion.type === 'vendor' && <Store className="h-4 w-4 text-green-600 dark:text-green-400" />}
                        {suggestion.type === 'category' && <Grid3X3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                        {suggestion.type === 'service' && <Wrench className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">{suggestion.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{suggestion.category}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions with Gamification */}
            <div className="flex items-center gap-4">
              {/* Gamification Elements */}
              <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/50 px-3 py-2 rounded-full border border-yellow-200 dark:border-yellow-700">
                <Coins className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-bold text-yellow-800 dark:text-yellow-200">{coins}</span>
              </div>

              <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/50 px-3 py-2 rounded-full border border-orange-200 dark:border-orange-700">
                <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-bold text-orange-800 dark:text-orange-200">{userStreak} day streak</span>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                onClick={handleNotifications}
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {notificationCount}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                onClick={handleWallet}
              >
                <Wallet className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                onClick={() => setShowCart(true)}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                onClick={handleProfile}
              >
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Category Shortcuts - Complete List */}
          <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 transition-all ${
                  selectedCategory === category.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
                onClick={() => handleCategoryClick(category.id)}
              >
                <span className="text-lg">{category.icon}</span>
                <span className="font-medium">{category.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedCategory === category.id
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                }`}>
                  {category.count}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section with Enhanced Banners */}
      <div className="container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className={`relative bg-gradient-to-r ${banners[currentBanner].color} rounded-lg p-8 text-white overflow-hidden`}
          >
            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-2">{banners[currentBanner].title}</h1>
              <p className="text-lg mb-4 opacity-90">{banners[currentBanner].subtitle}</p>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => handleBannerAction(banners[currentBanner])}
              >
                {banners[currentBanner].action}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            {/* Banner Navigation */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === currentBanner ? 'bg-white w-8' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Quick-Access Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" onClick={() => router.push('/marketplace/categories')}>
            <CardContent className="p-6 text-center">
              <Grid3X3 className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Shop by Category</h3>
              <p className="text-gray-600 dark:text-gray-300">Browse all product categories</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" onClick={() => router.push('/marketplace/vendors')}>
            <CardContent className="p-6 text-center">
              <Award className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Top Vendors</h3>
              <p className="text-gray-600 dark:text-gray-300">Verified premium suppliers</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" onClick={() => router.push('/marketplace/deals')}>
            <CardContent className="p-6 text-center">
              <Percent className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-3" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Latest Deals</h3>
              <p className="text-gray-600 dark:text-gray-300">Best offers and discounts</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Flash Deals Section */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg p-6 border border-red-100 dark:border-red-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-red-600 dark:text-red-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Flash Deals & Sales</h2>
              <span className="text-sm text-gray-700 dark:text-gray-300">⏰ Countdown timers</span>
            </div>
            <Button
              variant="outline"
              className="border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/50"
              onClick={() => router.push('/marketplace/deals')}
            >
              View All Deals
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {flashDeals.map((deal) => (
              <Card key={deal.id} className="relative overflow-hidden hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                  -{deal.discount}%
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">{deal.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">${deal.price}</span>
                    <span className="text-sm line-through text-gray-500 dark:text-gray-400">${deal.oldPrice}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
                    <Timer className="h-4 w-4" />
                    <span>{deal.timeLeft}</span>
                    <span className="ml-auto">Stock: {deal.stock}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleAddToCart(deal)}
                    >
                      Add to Cart
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                      onClick={() => handleViewProduct(deal.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Discovery Blocks */}
      <div className="container mx-auto px-4 py-6">
        {/* Trending Products */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-green-500" />
              <h2 className="text-2xl font-bold">📈 Trending Products</h2>
              <span className="text-sm text-gray-600">Most ordered this week</span>
            </div>
            <Button 
              variant="outline"
              onClick={() => router.push('/marketplace/trending')}
            >
              See More
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="aspect-video bg-gray-200 rounded mb-3 flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="font-semibold mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">by {product.vendor}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm ml-1">{product.rating}</span>
                    </div>
                    <span className="text-sm text-gray-400">({product.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold">${product.price}</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddToWishlist(product)}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleAddToCart(product)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Top Vendors */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Store className="h-6 w-6 text-purple-500" />
              <h2 className="text-2xl font-bold">🏪 Top Vendors</h2>
              <span className="text-sm text-gray-600">With ratings & verified badges</span>
            </div>
            <Button 
              variant="outline"
              onClick={() => router.push('/marketplace/vendors')}
            >
              All Vendors
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topVendors.map((vendor) => (
              <Card 
                key={vendor.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleViewVendor(vendor.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Award className="h-8 w-8 text-yellow-500" />
                      {vendor.verified && <ShieldCheck className="h-4 w-4 text-green-500" />}
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm ml-1 font-semibold">{vendor.rating}</span>
                    </div>
                  </div>
                  <h3 className="font-semibold mb-1">{vendor.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{vendor.speciality}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{vendor.products} products</span>
                    <Button size="sm" variant="outline">
                      Visit Store
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* New Arrivals */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-500" />
              <h2 className="text-2xl font-bold">🆕 New Arrivals</h2>
              <span className="text-sm text-gray-600">Latest marketplace additions</span>
            </div>
            <Button 
              variant="outline"
              onClick={() => router.push('/marketplace/new-arrivals')}
            >
              See All New
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {newArrivals.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow relative">
                <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                  NEW
                </div>
                <CardContent className="p-4">
                  <div className="aspect-video bg-gray-200 rounded mb-3 flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="font-semibold mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">by {product.vendor}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold">${product.price}</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddToWishlist(product)}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleAddToCart(product)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Personalized Section */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">👤 Personalized for You</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Recommended for You */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  Recommended for You
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="p-3 bg-white rounded border">
                      <p className="font-medium text-sm">{rec.name}</p>
                      <p className="text-xs text-gray-600 mt-1">{rec.reason}</p>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4" variant="outline" size="default">
                  View All Recommendations
                </Button>
              </CardContent>
            </Card>

            {/* Reorder Essentials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-green-500" />
                  Reorder Essentials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reorderEssentials.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-600">Last ordered: {item.lastOrdered}</p>
                        <p className="text-sm font-bold text-green-600">${item.price}</p>
                      </div>
                      <Button  onClick={() => handleReorderEssentials(item)}>
                        Reorder
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recently Viewed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-500" />
                  Recently Viewed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentlyViewed.map((item) => (
                    <div key={item.id} className="p-3 bg-white rounded border cursor-pointer" onClick={() => handleViewProduct(item.id)}>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-600">{item.viewedAt}</p>
                      <p className="text-sm font-bold">${item.price}</p>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4" variant="outline" size="default">
                  View All History
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Community & Social Integration */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">👥 Community & Social</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Community Highlights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-500" />
                  📢 Community Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {communityHighlights.map((post) => (
                    <div key={post.id} className="p-4 bg-white rounded border">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{post.user}</p>
                          <p className="text-sm text-gray-700 mt-1">{post.content}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Heart className="h-3 w-3" />
                              {post.likes}
                            </div>
                            <Button size="sm" variant="ghost" className="text-xs">
                              View Product
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4" variant="outline" size="default">
                  View More Posts
                </Button>
              </CardContent>
            </Card>

            {/* Top Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  💬 Top Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topReviews.map((review) => (
                    <div key={review.id} className="p-4 bg-white rounded border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <span className="text-xs font-medium">{review.rating}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">"{review.comment}"</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">- {review.user}</p>
                        <p className="text-xs text-blue-600">{review.product}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4" variant="outline" size="default">
                  View All Reviews
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Short Videos / Demos */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Play className="h-5 w-5 text-red-500" />
              🎥 Short Videos & Demos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Recipe Tutorial', 'Equipment Unboxing', 'Vendor Showcase'].map((title, index) => (
                <div key={index} className="relative bg-gray-200 aspect-video rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors">
                  <div className="text-center">
                    <Play className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">{title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* B2B Power Features */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">💼 B2B Power Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bulk Order Shortcuts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  📦 Bulk Order Shortcuts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bulkOrderShortcuts.map((shortcut) => (
                    <Button 
                      key={shortcut.id}
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => router.push(`/marketplace/bulk/${shortcut.id}`)}
                    >
                      <span className="mr-3 text-lg">{shortcut.icon}</span>
                      <div className="text-left">
                        <p className="font-medium">{shortcut.name}</p>
                        <p className="text-xs text-gray-600">{shortcut.category}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Service Subscriptions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-500" />
                  🏢 Service Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {serviceSubscriptions.map((service) => (
                    <div key={service.id} className="p-3 border rounded">
                      <h4 className="font-medium">{service.name}</h4>
                      <p className="text-xs text-gray-600 mb-2">{service.description}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-green-600">${service.price}</p>
                          <p className="text-xs text-gray-500">{service.frequency}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleSubscribeService(service)}
                        >
                          Subscribe
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Business Deals of the Week */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-purple-500" />
                  💼 Business Deals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {businessDeals.map((deal) => (
                    <div key={deal.id} className="p-3 border rounded">
                      <h4 className="font-medium">{deal.name}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <p className="text-lg font-bold text-green-600">${deal.salePrice}</p>
                          <p className="text-xs line-through text-gray-500">${deal.originalPrice}</p>
                        </div>
                        <div className="text-right">
                          <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                            -{deal.discount}%
                          </div>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-2"
                        size="sm"
                        variant="default"
                        onClick={() => handleB2BQuote(deal)}
                      >
                        Get B2B Quote
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Trust & Support Section */}
      <div className="container mx-auto px-4 py-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg">
            <ShieldCheck className="h-8 w-8 text-green-500" />
            <div>
              <h4 className="font-semibold">✅ Verified Vendors</h4>
              <p className="text-sm text-gray-600">100% authenticated & certified</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg">
            <Truck className="h-8 w-8 text-blue-500" />
            <div>
              <h4 className="font-semibold">🚚 Same-Day Delivery</h4>
              <p className="text-sm text-gray-600">Available in metro areas</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg">
            <CreditCard className="h-8 w-8 text-purple-500" />
            <div>
              <h4 className="font-semibold">🔒 Secure Payments</h4>
              <p className="text-sm text-gray-600">Buyer protection guaranteed</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg">
            <Headphones className="h-8 w-8 text-orange-500" />
            <div>
              <h4 className="font-semibold">📞 24/7 Support</h4>
              <p className="text-sm text-gray-600">Always here to help</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gamified Elements */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">🎮 Rewards & Games</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <Gamepad2 className="h-16 w-16 text-purple-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Spin the Wheel</h3>
                <p className="text-gray-600 mb-4">Win extra coins and special discounts!</p>
                <Button onClick={handleSpinWheel} disabled={showSpinWheel} className="w-full" size="default" variant="default">
                  {showSpinWheel ? 'Spinning...' : 'Spin for Coins! 🎰'}
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <Flame className="h-8 w-8 text-orange-500 mr-2" />
                  <span className="text-4xl font-bold text-orange-600">{userStreak}</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Daily Streak</h3>
                <p className="text-gray-600 mb-4">Keep ordering to maintain your streak!</p>
                <div className="flex justify-center gap-1">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className={`w-6 h-6 rounded-full ${i < userStreak ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">7-day streak = 100 bonus coins!</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Comprehensive Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">📑 Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/about" className="hover:text-gray-300">About Us</a></li>
                <li><a href="/contact" className="hover:text-gray-300">Contact</a></li>
                <li><a href="/help" className="hover:text-gray-300">Help Center</a></li>
                <li><a href="/privacy" className="hover:text-gray-300">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-gray-300">Terms of Service</a></li>
                <li><a href="/careers" className="hover:text-gray-300">Careers</a></li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Categories</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/marketplace/fresh-produce" className="hover:text-gray-300">Fresh Produce</a></li>
                <li><a href="/marketplace/ingredients" className="hover:text-gray-300">Ingredients</a></li>
                <li><a href="/marketplace/equipment" className="hover:text-gray-300">Equipment</a></li>
                <li><a href="/marketplace/real-estate" className="hover:text-gray-300">Real Estate</a></li>
                <li><a href="/marketplace/services" className="hover:text-gray-300">Services</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>support@restauranthub.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Headphones className="h-4 w-4" />
                  <span>24/7 Live Chat</span>
                </div>
              </div>
            </div>

            {/* Social & Language */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect</h3>
              <div className="flex gap-4 mb-4">
                <Facebook className="h-6 w-6 cursor-pointer hover:text-blue-400" />
                <Twitter className="h-6 w-6 cursor-pointer hover:text-blue-400" />
                <Instagram className="h-6 w-6 cursor-pointer hover:text-pink-400" />
                <Youtube className="h-6 w-6 cursor-pointer hover:text-red-400" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4" />
                <select className="bg-gray-800 text-white text-sm rounded px-2 py-1">
                  <option>🇺🇸 English (USD)</option>
                  <option>🇪🇸 Español (EUR)</option>
                  <option>🇫🇷 Français (EUR)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="border-t border-gray-800 mt-8 pt-8">
            <h3 className="text-lg font-semibold mb-4">💳 Payment Methods Supported</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="bg-white text-black px-3 py-1 rounded text-sm font-medium">VISA</div>
              <div className="bg-white text-black px-3 py-1 rounded text-sm font-medium">Mastercard</div>
              <div className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium">PayPal</div>
              <div className="bg-black text-white px-3 py-1 rounded text-sm font-medium">Apple Pay</div>
              <div className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium">Google Pay</div>
              <div className="bg-orange-500 text-white px-3 py-1 rounded text-sm font-medium">Bitcoin</div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 RestaurantHub Marketplace. All rights reserved.</p>
            <p>Empowering restaurants with premium suppliers and services.</p>
          </div>
        </div>
      </footer>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 overflow-y-auto"
            >
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Shopping Cart ({cartCount})</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCart(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="p-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Your cart is empty</p>
                    <Button 
                      className="mt-4"
                      onClick={() => setShowCart(false)}
                    >
                      Continue Shopping
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded">
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{item.name}</h4>
                            <p className="text-sm text-gray-600">${item.price}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => updateCartQuantity(item.id, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => updateCartQuantity(item.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="ml-auto text-red-500"
                                onClick={() => removeFromCart(item.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t mt-4 pt-4">
                      <div className="flex justify-between mb-4">
                        <span className="font-semibold">Total:</span>
                        <span className="text-xl font-bold">${calculateCartTotal()}</span>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => {
                          setShowCart(false);
                          router.push('/checkout');
                        }}
                      >
                        Proceed to Checkout
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spin Wheel Modal */}
      <AnimatePresence>
        {showSpinWheel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <Card className="w-80">
              <CardContent className="p-8 text-center">
                <div className="animate-spin">
                  <div className="w-32 h-32 mx-auto mb-4 border-8 border-dashed border-purple-500 rounded-full flex items-center justify-center">
                    <Crown className="h-12 w-12 text-purple-500" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Spinning the Wheel!</h3>
                <p className="text-gray-600">Good luck! 🍀</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}