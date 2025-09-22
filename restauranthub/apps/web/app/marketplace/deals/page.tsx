'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Star, Heart, ShoppingCart, Zap, TrendingUp, Timer, AlertCircle, Gift, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface Deal {
  id: string;
  name: string;
  description: string;
  originalPrice: number;
  dealPrice: number;
  discountPercentage: number;
  image: string;
  vendor: {
    id: string;
    name: string;
    location: string;
  };
  category: string;
  rating: number;
  reviewCount: number;
  totalQuantity: number;
  soldQuantity: number;
  remainingQuantity: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  isExpired: boolean;
  isSoldOut: boolean;
  dealType: 'flash' | 'daily' | 'weekend' | 'combo' | 'new-user';
}

const mockDeals: Deal[] = [
  {
    id: '1',
    name: 'Flash Sale: Premium Pizza Combo',
    description: 'Two large pizzas + garlic bread + 2L cola. Limited time only!',
    originalPrice: 49.99,
    dealPrice: 29.99,
    discountPercentage: 40,
    image: '🍕',
    vendor: { id: 'bella-vista', name: 'Bella Vista Italian', location: 'Downtown' },
    category: 'Pizza',
    rating: 4.8,
    reviewCount: 342,
    totalQuantity: 100,
    soldQuantity: 73,
    remainingQuantity: 27,
    startTime: '2024-01-15T10:00:00Z',
    endTime: '2024-01-15T23:59:59Z',
    isActive: true,
    isExpired: false,
    isSoldOut: false,
    dealType: 'flash'
  },
  {
    id: '2',
    name: 'Weekend Special: Sushi Platter',
    description: 'Fresh sushi platter with 24 pieces + miso soup. Weekend only!',
    originalPrice: 59.99,
    dealPrice: 39.99,
    discountPercentage: 33,
    image: '🍣',
    vendor: { id: 'tokyo-sushi', name: 'Tokyo Sushi Bar', location: 'Midtown' },
    category: 'Japanese',
    rating: 4.9,
    reviewCount: 189,
    totalQuantity: 50,
    soldQuantity: 45,
    remainingQuantity: 5,
    startTime: '2024-01-13T00:00:00Z',
    endTime: '2024-01-14T23:59:59Z',
    isActive: true,
    isExpired: false,
    isSoldOut: false,
    dealType: 'weekend'
  },
  {
    id: '3',
    name: 'Daily Deal: Burger & Fries',
    description: 'Gourmet burger with loaded fries and drink. Available all day!',
    originalPrice: 24.99,
    dealPrice: 16.99,
    discountPercentage: 32,
    image: '🍔',
    vendor: { id: 'burger-hub', name: 'Burger Hub', location: 'Uptown' },
    category: 'Burgers',
    rating: 4.6,
    reviewCount: 267,
    totalQuantity: 200,
    soldQuantity: 200,
    remainingQuantity: 0,
    startTime: '2024-01-15T00:00:00Z',
    endTime: '2024-01-15T23:59:59Z',
    isActive: false,
    isExpired: false,
    isSoldOut: true,
    dealType: 'daily'
  },
  {
    id: '4',
    name: 'New User Special: Indian Feast',
    description: 'First-time customers get 50% off on Indian combo meal!',
    originalPrice: 35.99,
    dealPrice: 17.99,
    discountPercentage: 50,
    image: '🍛',
    vendor: { id: 'spice-garden', name: 'Spice Garden', location: 'Eastside' },
    category: 'Indian',
    rating: 4.7,
    reviewCount: 198,
    totalQuantity: 150,
    soldQuantity: 89,
    remainingQuantity: 61,
    startTime: '2024-01-10T00:00:00Z',
    endTime: '2024-01-20T23:59:59Z',
    isActive: true,
    isExpired: false,
    isSoldOut: false,
    dealType: 'new-user'
  },
  {
    id: '5',
    name: 'Combo Deal: Chinese Takeaway',
    description: 'Fried rice + noodles + sweet & sour chicken. Perfect for sharing!',
    originalPrice: 42.99,
    dealPrice: 28.99,
    discountPercentage: 33,
    image: '🥡',
    vendor: { id: 'dragon-kitchen', name: 'Dragon Kitchen', location: 'Chinatown' },
    category: 'Chinese',
    rating: 4.5,
    reviewCount: 234,
    totalQuantity: 80,
    soldQuantity: 67,
    remainingQuantity: 13,
    startTime: '2024-01-15T12:00:00Z',
    endTime: '2024-01-15T20:00:00Z',
    isActive: true,
    isExpired: false,
    isSoldOut: false,
    dealType: 'combo'
  },
  {
    id: '6',
    name: 'Flash Deal: Dessert Paradise',
    description: 'Assorted desserts: cake, ice cream, cookies. Sweet endings!',
    originalPrice: 19.99,
    dealPrice: 12.99,
    discountPercentage: 35,
    image: '🍰',
    vendor: { id: 'sweet-treats', name: 'Sweet Treats', location: 'Mall District' },
    category: 'Desserts',
    rating: 4.4,
    reviewCount: 123,
    totalQuantity: 60,
    soldQuantity: 60,
    remainingQuantity: 0,
    startTime: '2024-01-14T14:00:00Z',
    endTime: '2024-01-14T18:00:00Z',
    isActive: false,
    isExpired: true,
    isSoldOut: true,
    dealType: 'flash'
  }
];

export default function DealsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [deals, setDeals] = useState<Deal[]>(mockDeals);
  const [selectedTab, setSelectedTab] = useState('all');
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const newTimeRemaining: Record<string, string> = {};
      
      deals.forEach(deal => {
        if (deal.isActive && !deal.isExpired) {
          const endTime = new Date(deal.endTime).getTime();
          const timeDiff = endTime - now;
          
          if (timeDiff > 0) {
            const hours = Math.floor(timeDiff / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
            
            newTimeRemaining[deal.id] = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          } else {
            newTimeRemaining[deal.id] = 'EXPIRED';
          }
        }
      });
      
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [deals]);

  const getFilteredDeals = () => {
    switch (selectedTab) {
      case 'active':
        return deals.filter(deal => deal.isActive && !deal.isExpired && !deal.isSoldOut);
      case 'flash':
        return deals.filter(deal => deal.dealType === 'flash');
      case 'weekend':
        return deals.filter(deal => deal.dealType === 'weekend');
      case 'new-user':
        return deals.filter(deal => deal.dealType === 'new-user');
      default:
        return deals;
    }
  };

  const handleDealClick = (dealId: string) => {
    router.push(`/marketplace/product/${dealId}`);
  };

  const handleAddToCart = (deal: Deal) => {
    if (deal.isSoldOut || deal.isExpired) {
      toast({
        title: "Deal unavailable",
        description: "This deal is no longer available.",
        variant: "error"
      });
      return;
    }

    toast({
      title: "Added to cart!",
      description: `${deal.name} has been added to your cart at the deal price.`,
    });
  };

  const handleWishlist = (deal: Deal) => {
    toast({
      title: "Added to wishlist!",
      description: `${deal.name} has been added to your wishlist.`,
    });
  };

  const getProgressPercentage = (sold: number, total: number) => {
    return Math.min((sold / total) * 100, 100);
  };

  const getDealTypeIcon = (type: Deal['dealType']) => {
    switch (type) {
      case 'flash':
        return <Zap className="h-4 w-4" />;
      case 'weekend':
        return <TrendingUp className="h-4 w-4" />;
      case 'new-user':
        return <Gift className="h-4 w-4" />;
      case 'combo':
        return <Target className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getDealTypeColor = (type: Deal['dealType']) => {
    switch (type) {
      case 'flash':
        return 'bg-red-500';
      case 'weekend':
        return 'bg-purple-500';
      case 'new-user':
        return 'bg-green-500';
      case 'combo':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

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
            <span>Flash Deals</span>
          </div>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto">
            <Zap className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Flash Deals & Special Offers
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Limited time offers with massive savings on your favorite foods!
            </p>
          </div>
        </motion.div>

        {/* Stats Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-red-600">
                {deals.filter(d => d.isActive && !d.isExpired).length}
              </div>
              <div className="text-sm text-muted-foreground">Active Deals</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {Math.max(...deals.map(d => d.discountPercentage))}%
              </div>
              <div className="text-sm text-muted-foreground">Max Discount</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                ${Math.max(...deals.map(d => d.originalPrice - d.dealPrice)).toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">Max Savings</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {deals.reduce((acc, d) => acc + d.soldQuantity, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Items Sold</div>
            </div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Deals</TabsTrigger>
            <TabsTrigger value="active">Active Now</TabsTrigger>
            <TabsTrigger value="flash">Flash Sales</TabsTrigger>
            <TabsTrigger value="weekend">Weekend</TabsTrigger>
            <TabsTrigger value="new-user">New User</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {getFilteredDeals().map((deal, index) => (
                <motion.div
                  key={deal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`group cursor-pointer hover:shadow-lg transition-all duration-200 ${
                    deal.isExpired || deal.isSoldOut ? 'opacity-60' : ''
                  }`}>
                    <CardContent className="p-0">
                      {/* Deal Image */}
                      <div 
                        className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center text-8xl relative"
                        onClick={() => handleDealClick(deal.id)}
                      >
                        {deal.image}
                        
                        {/* Deal Type Badge */}
                        <div className={`absolute top-3 left-3 ${getDealTypeColor(deal.dealType)} text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1`}>
                          {getDealTypeIcon(deal.dealType)}
                          <span className="uppercase">{deal.dealType.replace('-', ' ')}</span>
                        </div>

                        {/* Discount Badge */}
                        <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-2 rounded-full text-lg font-bold">
                          -{deal.discountPercentage}%
                        </div>

                        {/* Status Overlay */}
                        {(deal.isExpired || deal.isSoldOut) && (
                          <div className="absolute inset-0 bg-black bg-opacity-60 rounded-t-lg flex items-center justify-center">
                            <Badge variant="destructive" className="text-lg px-4 py-2">
                              {deal.isExpired ? 'EXPIRED' : 'SOLD OUT'}
                            </Badge>
                          </div>
                        )}

                        {/* Timer for Active Deals */}
                        {deal.isActive && !deal.isExpired && timeRemaining[deal.id] && (
                          <div className="absolute bottom-3 left-3 bg-black bg-opacity-80 text-white px-3 py-2 rounded-lg flex items-center space-x-2">
                            <Timer className="h-4 w-4" />
                            <span className="font-mono font-semibold">
                              {timeRemaining[deal.id]}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Deal Info */}
                      <div className="p-6 space-y-4">
                        <div onClick={() => handleDealClick(deal.id)}>
                          <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">
                            {deal.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {deal.description}
                          </p>

                          {/* Vendor & Rating */}
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">{deal.rating}</span>
                              <span className="text-sm text-muted-foreground">
                                ({deal.reviewCount})
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">{deal.vendor.name}</span>
                          </div>

                          {/* Price */}
                          <div className="flex items-center space-x-3 mb-4">
                            <span className="text-3xl font-bold text-red-600">
                              ${deal.dealPrice}
                            </span>
                            <span className="text-lg text-muted-foreground line-through">
                              ${deal.originalPrice}
                            </span>
                            <Badge className="bg-green-100 text-green-800">
                              Save ${(deal.originalPrice - deal.dealPrice).toFixed(2)}
                            </Badge>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Sold: {deal.soldQuantity}/{deal.totalQuantity}</span>
                              <span className={`font-semibold ${deal.remainingQuantity <= 10 ? 'text-red-600' : 'text-green-600'}`}>
                                {deal.remainingQuantity} left
                              </span>
                            </div>
                            <Progress 
                              value={getProgressPercentage(deal.soldQuantity, deal.totalQuantity)} 
                              className="h-2"
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 pt-2">
                          <Button
                            className="flex-1"
                            onClick={() => handleAddToCart(deal)}
                            disabled={deal.isExpired || deal.isSoldOut}
                            variant={deal.isExpired || deal.isSoldOut ? 'secondary' : 'default'}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {deal.isExpired ? 'Expired' : deal.isSoldOut ? 'Sold Out' : 'Add to Cart'}
                          </Button>
                          <Button
                            variant="outline"
                            
                            onClick={() => handleWishlist(deal)}
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {getFilteredDeals().length === 0 && (
              <Card className="p-12 text-center">
                <h3 className="text-lg font-semibold mb-2">No deals found</h3>
                <p className="text-muted-foreground mb-4">
                  No active deals match your current filter. Check back soon for new offers!
                </p>
                <Button onClick={() => setSelectedTab('all')}>
                  View All Deals
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Newsletter Signup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-8 text-center text-white"
        >
          <h2 className="text-2xl font-bold mb-2">Never Miss a Deal!</h2>
          <p className="mb-6">Subscribe to get notifications about flash sales and exclusive offers.</p>
          <div className="flex items-center space-x-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-lg text-black"
            />
            <Button variant="secondary">
              Subscribe
            </Button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}