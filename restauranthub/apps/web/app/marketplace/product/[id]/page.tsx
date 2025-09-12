'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Share2, ShoppingCart, Plus, Minus, Star, Clock, MapPin, Shield, Truck, Users, MessageCircle, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  category: string;
  vendor: {
    id: string;
    name: string;
    rating: number;
    location: string;
    isVerified: boolean;
    responseTime: string;
  };
  images: string[];
  features: string[];
  specifications: Record<string, string>;
  availability: {
    inStock: boolean;
    quantity: number;
    estimatedDelivery: string;
  };
  reviews: Array<{
    id: string;
    user: string;
    rating: number;
    comment: string;
    date: string;
    verified: boolean;
  }>;
  relatedProducts: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
    rating: number;
  }>;
}

const mockProducts: Record<string, Product> = {
  '1': {
    id: '1',
    name: 'Artisan Margherita Pizza',
    description: 'Handcrafted with San Marzano tomatoes, fresh mozzarella di bufala, and basil grown in our own garden. Wood-fired to perfection in our traditional Italian oven.',
    price: 18.99,
    originalPrice: 22.99,
    rating: 4.8,
    reviewCount: 342,
    category: 'Pizza',
    vendor: {
      id: 'bella-vista',
      name: 'Bella Vista Italian',
      rating: 4.9,
      location: 'Downtown, 2.3km away',
      isVerified: true,
      responseTime: '~15 min'
    },
    images: ['🍕', '🧀', '🍅', '🌿'],
    features: [
      'Wood-fired oven cooked',
      'Fresh buffalo mozzarella',
      'San Marzano tomatoes',
      'Garden-fresh basil',
      'Traditional Italian recipe'
    ],
    specifications: {
      'Size': '12 inch',
      'Serving': '2-3 people',
      'Prep Time': '15-20 minutes',
      'Calories': '~850 per pizza',
      'Dietary': 'Vegetarian'
    },
    availability: {
      inStock: true,
      quantity: 15,
      estimatedDelivery: '25-35 min'
    },
    reviews: [
      {
        id: '1',
        user: 'Maria Rodriguez',
        rating: 5,
        comment: 'Absolutely incredible! The best pizza I\'ve had outside of Italy. The crust is perfect and the mozzarella is divine.',
        date: '2024-01-15',
        verified: true
      },
      {
        id: '2',
        user: 'James Wilson',
        rating: 4,
        comment: 'Great taste and quality ingredients. Delivery was fast and the pizza arrived hot.',
        date: '2024-01-12',
        verified: true
      },
      {
        id: '3',
        user: 'Sarah Chen',
        rating: 5,
        comment: 'This has become our go-to pizza place. Never disappoints!',
        date: '2024-01-10',
        verified: false
      }
    ],
    relatedProducts: [
      { id: '2', name: 'Pepperoni Classic', price: 21.99, image: '🍕', rating: 4.6 },
      { id: '3', name: 'Truffle Mushroom', price: 26.99, image: '🍕', rating: 4.9 },
      { id: '4', name: 'Caesar Salad', price: 12.99, image: '🥗', rating: 4.4 }
    ]
  },
  '2': {
    id: '2',
    name: 'Premium Sushi Roll Set',
    description: 'Fresh sashimi-grade salmon and tuna, perfectly seasoned sushi rice, and crisp nori. Includes wasabi, pickled ginger, and soy sauce.',
    price: 28.50,
    originalPrice: 32.00,
    rating: 4.9,
    reviewCount: 189,
    category: 'Japanese',
    vendor: {
      id: 'tokyo-sushi',
      name: 'Tokyo Sushi Bar',
      rating: 4.8,
      location: 'Midtown, 1.8km away',
      isVerified: true,
      responseTime: '~20 min'
    },
    images: ['🍣', '🐟', '🍚', '🥢'],
    features: [
      'Sashimi-grade fish',
      'Daily fresh preparation',
      'Traditional Japanese rice',
      'Includes condiments',
      'Made by certified sushi chef'
    ],
    specifications: {
      'Pieces': '12 pieces',
      'Serving': '1-2 people',
      'Prep Time': '10-15 minutes',
      'Calories': '~420 per set',
      'Dietary': 'Pescatarian, Gluten-free option'
    },
    availability: {
      inStock: true,
      quantity: 8,
      estimatedDelivery: '20-30 min'
    },
    reviews: [
      {
        id: '1',
        user: 'Yuki Tanaka',
        rating: 5,
        comment: 'Authentic and fresh! Reminds me of home in Tokyo.',
        date: '2024-01-14',
        verified: true
      }
    ],
    relatedProducts: [
      { id: '1', name: 'Artisan Margherita Pizza', price: 18.99, image: '🍕', rating: 4.8 },
      { id: '5', name: 'Miso Soup', price: 6.50, image: '🍜', rating: 4.5 }
    ]
  }
};

export default function ProductPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    const productId = params.id as string;
    const foundProduct = mockProducts[productId];
    
    if (foundProduct) {
      setProduct(foundProduct);
    } else {
      toast({
        title: "Product not found",
        description: "The requested product could not be found.",
        variant: "destructive"
      });
      router.push('/marketplace');
    }
  }, [params.id, toast, router]);

  if (!product) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Loading product...</h2>
            <p className="text-muted-foreground">Please wait while we fetch the product details.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleAddToCart = () => {
    toast({
      title: "Added to cart!",
      description: `${quantity}x ${product.name} added to your cart.`
    });
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      description: `${product.name} ${isWishlisted ? 'removed from' : 'added to'} your wishlist.`
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Product link has been copied to clipboard."
      });
    }
  };

  const handleVendorClick = () => {
    router.push(`/marketplace/vendor/${product.vendor.id}`);
  };

  const handleRelatedProductClick = (productId: string) => {
    router.push(`/marketplace/product/${productId}`);
  };

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
            <span className="cursor-pointer hover:text-foreground" onClick={() => router.push(`/marketplace/category/${product.category.toLowerCase()}`)}>
              {product.category}
            </span>
            <span className="mx-2">›</span>
            <span>{product.name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-8xl">
              {product.images[selectedImage]}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-2xl border-2 ${
                    selectedImage === index ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  {image}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold">{product.name}</h1>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={handleWishlist}>
                    <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleShare}>
                    <Share2 className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Flag className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{product.rating}</span>
                  <span className="text-muted-foreground">({product.reviewCount} reviews)</span>
                </div>
                <Badge variant="secondary">{product.category}</Badge>
              </div>

              <p className="text-muted-foreground mb-6">{product.description}</p>

              <div className="flex items-center space-x-4 mb-6">
                <div className="text-3xl font-bold">${product.price}</div>
                {product.originalPrice && (
                  <div className="text-lg text-muted-foreground line-through">
                    ${product.originalPrice}
                  </div>
                )}
                <Badge className="bg-green-100 text-green-800">
                  {Math.round(((product.originalPrice || product.price) - product.price) / (product.originalPrice || product.price) * 100)}% OFF
                </Badge>
              </div>
            </div>

            {/* Vendor Info */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleVendorClick}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={`/vendor-${product.vendor.id}.jpg`} />
                    <AvatarFallback>{product.vendor.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{product.vendor.name}</h3>
                      {product.vendor.isVerified && (
                        <Shield className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{product.vendor.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{product.vendor.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{product.vendor.responseTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Availability */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${product.availability.inStock ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="font-medium">
                      {product.availability.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                    <span className="text-muted-foreground">
                      ({product.availability.quantity} available)
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Truck className="h-4 w-4" />
                    <span>{product.availability.estimatedDelivery}</span>
                  </div>
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center space-x-4 mb-6">
                  <span className="font-medium">Quantity:</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.min(product.availability.quantity, quantity + 1))}
                      disabled={quantity >= product.availability.quantity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Button 
                    className="flex-1" 
                    size="lg" 
                    onClick={handleAddToCart}
                    disabled={!product.availability.inStock}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart - ${(product.price * quantity).toFixed(2)}
                  </Button>
                  <Button variant="outline" size="lg">
                    Buy Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Key Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-primary rounded-full" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm font-medium">{key}:</span>
                    <span className="text-sm text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reviews Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Customer Reviews</span>
                <Button variant="ghost" size="sm" onClick={() => setShowReviews(!showReviews)}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {product.reviews.slice(0, 2).map((review) => (
                  <div key={review.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
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
                      <span className="text-sm font-medium">{review.user}</span>
                      {review.verified && (
                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Related Products */}
        <Card>
          <CardHeader>
            <CardTitle>Related Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {product.relatedProducts.map((relatedProduct) => (
                <motion.div
                  key={relatedProduct.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleRelatedProductClick(relatedProduct.id)}
                >
                  <div className="text-4xl mb-2 text-center">{relatedProduct.image}</div>
                  <h3 className="font-medium text-sm mb-1">{relatedProduct.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">${relatedProduct.price}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">{relatedProduct.rating}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}