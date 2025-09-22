'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, MapPin, Clock, Phone, Mail, Heart, Shield, Award, Truck, Users, MessageCircle, Share2, Filter, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface VendorProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  category: string;
  isPopular: boolean;
  inStock: boolean;
}

interface VendorReview {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
  orderItems: string[];
}

interface Vendor {
  id: string;
  name: string;
  description: string;
  cuisine: string[];
  rating: number;
  reviewCount: number;
  location: {
    address: string;
    city: string;
    coordinates: { lat: number; lng: number };
  };
  contact: {
    phone: string;
    email: string;
  };
  operatingHours: {
    [key: string]: { open: string; close: string; isOpen: boolean };
  };
  deliveryInfo: {
    fee: number;
    minOrder: number;
    estimatedTime: string;
    radius: number;
  };
  stats: {
    totalOrders: number;
    responseTime: string;
    acceptanceRate: number;
    joinedDate: string;
  };
  features: string[];
  certifications: string[];
  images: {
    logo: string;
    cover: string;
    gallery: string[];
  };
  isVerified: boolean;
  isOpen: boolean;
  products: VendorProduct[];
  reviews: VendorReview[];
}

const mockVendors: Record<string, Vendor> = {
  'bella-vista': {
    id: 'bella-vista',
    name: 'Bella Vista Italian',
    description: 'Authentic Italian cuisine with a modern twist. Our family recipes have been passed down for generations, bringing you the true taste of Italy with fresh ingredients and traditional cooking methods.',
    cuisine: ['Italian', 'Pizza', 'Pasta'],
    rating: 4.8,
    reviewCount: 1247,
    location: {
      address: '123 Main Street, Downtown',
      city: 'New York',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    contact: {
      phone: '+1 (555) 123-4567',
      email: 'info@bellavista.com'
    },
    operatingHours: {
      'Monday': { open: '11:00', close: '22:00', isOpen: true },
      'Tuesday': { open: '11:00', close: '22:00', isOpen: true },
      'Wednesday': { open: '11:00', close: '22:00', isOpen: true },
      'Thursday': { open: '11:00', close: '22:00', isOpen: true },
      'Friday': { open: '11:00', close: '23:00', isOpen: true },
      'Saturday': { open: '11:00', close: '23:00', isOpen: true },
      'Sunday': { open: '12:00', close: '21:00', isOpen: true }
    },
    deliveryInfo: {
      fee: 3.99,
      minOrder: 25.00,
      estimatedTime: '25-35 minutes',
      radius: 5
    },
    stats: {
      totalOrders: 12543,
      responseTime: '~15 min',
      acceptanceRate: 98,
      joinedDate: '2019-03-15'
    },
    features: [
      'Wood-fired oven',
      'Fresh daily ingredients',
      'Gluten-free options',
      'Vegan menu available',
      'Family recipes',
      'Wine pairing'
    ],
    certifications: [
      'FSSAI Certified',
      'Organic Ingredients',
      'Halal Certified'
    ],
    images: {
      logo: '🍕',
      cover: '🏪',
      gallery: ['🍝', '🥗', '🍷', '👨‍🍳']
    },
    isVerified: true,
    isOpen: true,
    products: [
      {
        id: '1',
        name: 'Artisan Margherita Pizza',
        description: 'Wood-fired pizza with San Marzano tomatoes and fresh mozzarella',
        price: 18.99,
        originalPrice: 22.99,
        rating: 4.8,
        reviewCount: 342,
        image: '🍕',
        category: 'Pizza',
        isPopular: true,
        inStock: true
      },
      {
        id: '2',
        name: 'Truffle Pasta',
        description: 'Handmade pasta with truffle oil and parmesan',
        price: 24.99,
        rating: 4.9,
        reviewCount: 189,
        image: '🍝',
        category: 'Pasta',
        isPopular: true,
        inStock: true
      },
      {
        id: '3',
        name: 'Caesar Salad',
        description: 'Fresh romaine with homemade dressing and croutons',
        price: 12.99,
        rating: 4.6,
        reviewCount: 98,
        image: '🥗',
        category: 'Salads',
        isPopular: false,
        inStock: true
      },
      {
        id: '4',
        name: 'Tiramisu',
        description: 'Traditional Italian dessert with espresso and mascarpone',
        price: 8.99,
        rating: 4.7,
        reviewCount: 156,
        image: '🍰',
        category: 'Desserts',
        isPopular: false,
        inStock: true
      }
    ],
    reviews: [
      {
        id: '1',
        user: 'Maria Rodriguez',
        rating: 5,
        comment: 'Amazing food and service! The pizza was perfectly cooked and the pasta was incredibly fresh. Definitely coming back!',
        date: '2024-01-15',
        verified: true,
        orderItems: ['Artisan Margherita Pizza', 'Truffle Pasta']
      },
      {
        id: '2',
        user: 'James Wilson',
        rating: 4,
        comment: 'Great authentic Italian food. The delivery was quick and everything arrived hot. Highly recommend the tiramisu!',
        date: '2024-01-12',
        verified: true,
        orderItems: ['Caesar Salad', 'Tiramisu']
      },
      {
        id: '3',
        user: 'Sarah Chen',
        rating: 5,
        comment: 'This is my go-to place for Italian food. Never disappoints!',
        date: '2024-01-10',
        verified: false,
        orderItems: []
      }
    ]
  },
  'tokyo-sushi': {
    id: 'tokyo-sushi',
    name: 'Tokyo Sushi Bar',
    description: 'Authentic Japanese sushi and sashimi prepared by certified sushi chefs. We source only the freshest fish and use traditional Japanese techniques.',
    cuisine: ['Japanese', 'Sushi', 'Sashimi'],
    rating: 4.9,
    reviewCount: 892,
    location: {
      address: '456 Oak Avenue, Midtown',
      city: 'New York',
      coordinates: { lat: 40.7549, lng: -73.9840 }
    },
    contact: {
      phone: '+1 (555) 987-6543',
      email: 'info@tokyosushi.com'
    },
    operatingHours: {
      'Monday': { open: '17:00', close: '22:00', isOpen: true },
      'Tuesday': { open: '17:00', close: '22:00', isOpen: true },
      'Wednesday': { open: '17:00', close: '22:00', isOpen: true },
      'Thursday': { open: '17:00', close: '22:00', isOpen: true },
      'Friday': { open: '17:00', close: '23:00', isOpen: true },
      'Saturday': { open: '17:00', close: '23:00', isOpen: true },
      'Sunday': { open: '17:00', close: '21:00', isOpen: true }
    },
    deliveryInfo: {
      fee: 4.99,
      minOrder: 30.00,
      estimatedTime: '20-30 minutes',
      radius: 3
    },
    stats: {
      totalOrders: 8934,
      responseTime: '~20 min',
      acceptanceRate: 95,
      joinedDate: '2020-06-20'
    },
    features: [
      'Sashimi-grade fish',
      'Certified sushi chefs',
      'Daily fresh preparation',
      'Traditional techniques',
      'Omakase available',
      'Sake selection'
    ],
    certifications: [
      'FSSAI Certified',
      'Fresh Fish Guarantee',
      'Japanese Certified Chef'
    ],
    images: {
      logo: '🍣',
      cover: '🏮',
      gallery: ['🐟', '🍚', '🥢', '🍶']
    },
    isVerified: true,
    isOpen: false,
    products: [
      {
        id: '5',
        name: 'Premium Sushi Roll Set',
        description: 'Fresh sashimi-grade salmon and tuna sushi rolls',
        price: 28.50,
        originalPrice: 32.00,
        rating: 4.9,
        reviewCount: 189,
        image: '🍣',
        category: 'Sushi',
        isPopular: true,
        inStock: true
      }
    ],
    reviews: [
      {
        id: '4',
        user: 'Yuki Tanaka',
        rating: 5,
        comment: 'Authentic and fresh! Reminds me of home in Tokyo.',
        date: '2024-01-14',
        verified: true,
        orderItems: ['Premium Sushi Roll Set']
      }
    ]
  }
};

export default function VendorPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<VendorProduct[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const vendorId = params.id as string;
    const foundVendor = mockVendors[vendorId];
    
    if (foundVendor) {
      setVendor(foundVendor);
      setFilteredProducts(foundVendor.products);
    } else {
      toast({
        title: "Vendor not found",
        description: "The requested vendor could not be found.",
        variant: "error"
      });
      router.push('/marketplace');
    }
  }, [params.id, toast, router]);

  useEffect(() => {
    if (!vendor) return;
    
    let filtered = [...vendor.products];
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category.toLowerCase() === selectedCategory);
    }
    
    setFilteredProducts(filtered);
  }, [vendor, selectedCategory]);

  const handleProductClick = (productId: string) => {
    router.push(`/marketplace/product/${productId}`);
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast({
      title: isFollowing ? "Unfollowed" : "Following",
      description: `You ${isFollowing ? 'unfollowed' : 'are now following'} ${vendor?.name}.`
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: vendor?.name,
        text: vendor?.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Vendor link has been copied to clipboard."
      });
    }
  };

  const handleContact = (method: 'phone' | 'email') => {
    if (!vendor) return;
    
    if (method === 'phone') {
      window.open(`tel:${vendor.contact.phone}`);
    } else {
      window.open(`mailto:${vendor.contact.email}`);
    }
  };

  if (!vendor) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Loading vendor...</h2>
            <p className="text-muted-foreground">Please wait while we fetch the vendor details.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const categories = ['all', ...Array.from(new Set(vendor.products.map(p => p.category.toLowerCase())))];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-sm text-muted-foreground">
            <span className="cursor-pointer hover:text-foreground" onClick={() => router.push('/marketplace')}>
              Marketplace
            </span>
            <span className="mx-2">›</span>
            <span className="cursor-pointer hover:text-foreground" onClick={() => router.push('/marketplace/vendors')}>
              Vendors
            </span>
            <span className="mx-2">›</span>
            <span>{vendor.name}</span>
          </div>
        </div>

        {/* Vendor Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Cover Image */}
          <div className="h-64 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-8xl text-white">
            {vendor.images.cover}
          </div>

          {/* Vendor Info Overlay */}
          <Card className="absolute -bottom-16 left-6 right-6 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start space-x-6">
                {/* Logo */}
                <div className="w-32 h-32 bg-white rounded-lg shadow-md flex items-center justify-center text-6xl border-4 border-white">
                  {vendor.images.logo}
                </div>

                {/* Basic Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <h1 className="text-3xl font-bold">{vendor.name}</h1>
                        {vendor.isVerified && (
                          <Shield className="h-6 w-6 text-blue-500" />
                        )}
                        <Badge variant={vendor.isOpen ? "default" : "destructive"}>
                          {vendor.isOpen ? 'Open' : 'Closed'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-2">{vendor.description}</p>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-lg">{vendor.rating}</span>
                          <span className="text-muted-foreground">({vendor.reviewCount} reviews)</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{vendor.location.address}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{vendor.deliveryInfo.estimatedTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button variant="outline" onClick={handleShare}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button variant="outline" onClick={handleFollow}>
                        <Heart className={`h-4 w-4 mr-2 ${isFollowing ? 'fill-red-500 text-red-500' : ''}`} />
                        {isFollowing ? 'Following' : 'Follow'}
                      </Button>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="font-semibold text-lg">{vendor.stats.totalOrders.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Orders</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-lg">{vendor.stats.responseTime}</div>
                      <div className="text-sm text-muted-foreground">Response</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-lg">{vendor.stats.acceptanceRate}%</div>
                      <div className="text-sm text-muted-foreground">Accept Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-lg">${vendor.deliveryInfo.fee}</div>
                      <div className="text-sm text-muted-foreground">Delivery Fee</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Content Tabs */}
        <div className="mt-20">
          <Tabs defaultValue="menu" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="menu">Menu</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="info">Information</TabsTrigger>
            </TabsList>

            {/* Menu Tab */}
            <TabsContent value="menu" className="space-y-6">
              {/* Category Filter & View Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Categories:</span>
                    {categories.map(category => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'outline'}
                        
                        onClick={() => setSelectedCategory(category)}
                        className="capitalize"
                      >
                        {category === 'all' ? 'All Items' : category}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Products */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="cursor-pointer"
                    onClick={() => handleProductClick(product.id)}
                  >
                    {viewMode === 'grid' ? (
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-0">
                          <div className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center text-6xl relative">
                            {product.image}
                            {product.isPopular && (
                              <Badge className="absolute top-2 left-2 bg-red-500">Popular</Badge>
                            )}
                            {product.originalPrice && (
                              <Badge className="absolute top-2 right-2 bg-green-500">
                                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                              </Badge>
                            )}
                          </div>
                          
                          <div className="p-4">
                            <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {product.description}
                            </p>
                            
                            <div className="flex items-center space-x-2 mb-3">
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">{product.rating}</span>
                                <span className="text-sm text-muted-foreground">
                                  ({product.reviewCount})
                                </span>
                              </div>
                              <Badge variant="outline" className="text-xs">{product.category}</Badge>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-xl font-bold">${product.price}</span>
                                {product.originalPrice && (
                                  <span className="text-sm text-muted-foreground line-through">
                                    ${product.originalPrice}
                                  </span>
                                )}
                              </div>
                              <Button >Add to Cart</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex space-x-6">
                            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-4xl flex-shrink-0">
                              {product.image}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between">
                                <h3 className="font-semibold text-xl">{product.name}</h3>
                                <div className="flex items-center space-x-2">
                                  {product.isPopular && (
                                    <Badge className="bg-red-500">Popular</Badge>
                                  )}
                                  {product.originalPrice && (
                                    <Badge className="bg-green-500">
                                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <p className="text-muted-foreground">{product.description}</p>
                              
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">{product.rating}</span>
                                  <span className="text-muted-foreground">
                                    ({product.reviewCount} reviews)
                                  </span>
                                </div>
                                <Badge variant="outline">{product.category}</Badge>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <span className="text-2xl font-bold">${product.price}</span>
                                  {product.originalPrice && (
                                    <span className="text-lg text-muted-foreground line-through">
                                      ${product.originalPrice}
                                    </span>
                                  )}
                                </div>
                                <Button>Add to Cart</Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </TabsContent>

            {/* About Tab */}
            <TabsContent value="about" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About Us</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>{vendor.description}</p>
                    <div>
                      <h4 className="font-semibold mb-2">Cuisines</h4>
                      <div className="flex flex-wrap gap-2">
                        {vendor.cuisine.map(cuisine => (
                          <Badge key={cuisine} variant="outline">{cuisine}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Features</h4>
                      <ul className="space-y-1">
                        {vendor.features.map(feature => (
                          <li key={feature} className="text-sm flex items-center space-x-2">
                            <div className="h-2 w-2 bg-primary rounded-full" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Gallery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {vendor.images.gallery.map((image, index) => (
                        <div key={index} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-4xl">
                          {image}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Reviews ({vendor.reviewCount})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {vendor.reviews.map(review => (
                      <div key={review.id} className="border-b last:border-b-0 pb-6 last:pb-0">
                        <div className="flex items-start space-x-4">
                          <Avatar>
                            <AvatarImage src={`/user-${review.user.replace(' ', '').toLowerCase()}.jpg`} />
                            <AvatarFallback>{review.user.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold">{review.user}</h4>
                              {review.verified && (
                                <Badge variant="secondary" className="text-xs">Verified Purchase</Badge>
                              )}
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-200'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-muted-foreground mb-2">{review.comment}</p>
                            {review.orderItems.length > 0 && (
                              <div className="text-sm text-muted-foreground">
                                Ordered: {review.orderItems.join(', ')}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground mt-2">
                              {new Date(review.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Information Tab */}
            <TabsContent value="info" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact & Hours */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact & Hours</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4" />
                        <span>{vendor.contact.phone}</span>
                        <Button  variant="outline" onClick={() => handleContact('phone')}>
                          Call
                        </Button>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4" />
                        <span>{vendor.contact.email}</span>
                        <Button  variant="outline" onClick={() => handleContact('email')}>
                          Email
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Operating Hours</h4>
                      <div className="space-y-1 text-sm">
                        {Object.entries(vendor.operatingHours).map(([day, hours]) => (
                          <div key={day} className="flex justify-between">
                            <span>{day}</span>
                            <span className={hours.isOpen ? '' : 'text-red-500'}>
                              {hours.isOpen ? `${hours.open} - ${hours.close}` : 'Closed'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Delivery Fee:</span>
                        <span className="font-semibold">${vendor.deliveryInfo.fee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Minimum Order:</span>
                        <span className="font-semibold">${vendor.deliveryInfo.minOrder}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated Time:</span>
                        <span className="font-semibold">{vendor.deliveryInfo.estimatedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Radius:</span>
                        <span className="font-semibold">{vendor.deliveryInfo.radius} km</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Certifications</h4>
                      <div className="space-y-1">
                        {vendor.certifications.map(cert => (
                          <div key={cert} className="flex items-center space-x-2">
                            <Award className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{cert}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}