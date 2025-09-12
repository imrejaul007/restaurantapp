'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import toast from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Star, 
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Users,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  Calendar,
  Package,
  Globe,
  Building2,
  Truck,
  Shield,
  Send,
  Heart,
  Eye,
  ShoppingCart,
  Filter,
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';

interface VendorProfile {
  id: string;
  name: string;
  businessName: string;
  description: string;
  logo: string;
  coverImage: string;
  rating: number;
  totalReviews: number;
  totalOrders: number;
  responseTime: string;
  memberSince: string;
  verified: boolean;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
    whatsapp?: string;
  };
  businessInfo: {
    type: string;
    gstNumber: string;
    licenseNumber: string;
    employees: string;
    established: string;
  };
  stats: {
    totalProducts: number;
    totalSales: number;
    repeatCustomers: number;
    avgDeliveryTime: string;
  };
  certifications: string[];
  services: string[];
  paymentMethods: string[];
  deliveryAreas: string[];
  operatingHours: {
    [key: string]: string;
  };
  products: Array<{
    id: string;
    name: string;
    price: number;
    unit: string;
    image: string;
    rating: number;
    inStock: boolean;
  }>;
  reviews: Array<{
    id: string;
    customerName: string;
    rating: number;
    comment: string;
    date: string;
    verified: boolean;
  }>;
}

export default function VendorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    orderType: 'bulk'
  });
  const [productSearch, setProductSearch] = useState('');
  const [productFilter, setProductFilter] = useState('all');

  // Mock vendor data - in real app this would come from API
  const vendor: VendorProfile = {
    id: params.id as string,
    name: 'Rajesh Kumar',
    businessName: 'Fresh Ingredients Co.',
    description: 'We are a leading supplier of premium quality food ingredients, specializing in bulk supply to restaurants, hotels, and catering businesses. With over 15 years of experience in the food industry, we ensure consistent quality and timely delivery.',
    logo: '/api/placeholder/150/150',
    coverImage: '/api/placeholder/1200/400',
    rating: 4.8,
    totalReviews: 245,
    totalOrders: 1250,
    responseTime: 'Within 2 hours',
    memberSince: 'March 2020',
    verified: true,
    location: {
      address: 'Plot 45, Industrial Area Phase-2',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400001'
    },
    contact: {
      phone: '+91-9876543210',
      email: 'sales@freshingredients.com',
      website: 'www.freshingredients.com',
      whatsapp: '+91-9876543210'
    },
    businessInfo: {
      type: 'Food Ingredient Supplier',
      gstNumber: '27AABCU9603R1ZY',
      licenseNumber: 'FL-2020-001234',
      employees: '25-50',
      established: '2008'
    },
    stats: {
      totalProducts: 156,
      totalSales: 2500000,
      repeatCustomers: 85,
      avgDeliveryTime: '2-3 days'
    },
    certifications: ['ISO 9001:2015', 'FSSAI Certified', 'HACCP', 'Organic India'],
    services: ['Bulk Supply', 'Custom Packaging', 'Same Day Delivery', '24/7 Support'],
    paymentMethods: ['Bank Transfer', 'UPI', 'Credit Card', 'Net Banking', 'COD'],
    deliveryAreas: ['Mumbai', 'Pune', 'Nashik', 'Aurangabad', 'Nagpur'],
    operatingHours: {
      'Monday': '9:00 AM - 6:00 PM',
      'Tuesday': '9:00 AM - 6:00 PM',
      'Wednesday': '9:00 AM - 6:00 PM',
      'Thursday': '9:00 AM - 6:00 PM',
      'Friday': '9:00 AM - 6:00 PM',
      'Saturday': '9:00 AM - 2:00 PM',
      'Sunday': 'Closed'
    },
    products: [
      {
        id: 'prod-1',
        name: 'Premium Basmati Rice',
        price: 45.99,
        unit: 'kg',
        image: '/api/placeholder/200/200',
        rating: 4.7,
        inStock: true
      },
      {
        id: 'prod-2',
        name: 'Organic Olive Oil',
        price: 28.50,
        unit: 'bottle',
        image: '/api/placeholder/200/200',
        rating: 4.5,
        inStock: true
      },
      {
        id: 'prod-3',
        name: 'Whole Wheat Flour',
        price: 22.00,
        unit: 'kg',
        image: '/api/placeholder/200/200',
        rating: 4.6,
        inStock: false
      }
    ],
    reviews: [
      {
        id: 'rev-1',
        customerName: 'Amit Sharma',
        rating: 5,
        comment: 'Excellent quality products and very reliable supplier. Always delivers on time.',
        date: '2024-01-15',
        verified: true
      },
      {
        id: 'rev-2',
        customerName: 'Priya Restaurant',
        rating: 4,
        comment: 'Good quality rice, competitive pricing. Will order again.',
        date: '2024-01-10',
        verified: true
      }
    ]
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Sending message...');
    
    try {
      // Simulate API call to submit contact form
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock API call - in real app, this would be an actual API endpoint
      const contactData = {
        ...contactForm,
        vendorId: params.id,
        timestamp: new Date().toISOString()
      };
      
      toast.dismiss(loadingToast);
      toast.success('Message sent successfully!', 'The vendor will contact you soon.');
      
      setContactForm({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        orderType: 'bulk'
      });
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to send message', 'Please try again later.');
    }
  };

  const handleProductView = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const filteredProducts = vendor.products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesFilter = productFilter === 'all' || 
                         (productFilter === 'instock' && product.inStock) ||
                         (productFilter === 'outofstock' && !product.inStock);
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/marketplace">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
        </div>

        {/* Vendor Header */}
        <Card className="mb-8">
          <div className="relative h-48 bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10 rounded-t-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
          </div>
          
          <CardContent className="relative px-6 pb-6">
            <div className="flex flex-col md:flex-row gap-6 -mt-16">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-white border-4 border-white rounded-full shadow-lg flex items-center justify-center">
                  <Building2 className="h-16 w-16 text-primary" />
                </div>
              </div>
              
              <div className="flex-1 pt-16 md:pt-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold">{vendor.businessName}</h1>
                      {vendor.verified && (
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-lg text-muted-foreground mb-2">
                      Owned by {vendor.name}
                    </p>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center space-x-1">
                        {renderStarRating(vendor.rating)}
                        <span className="font-medium">{vendor.rating}</span>
                        <span className="text-muted-foreground">
                          ({vendor.totalReviews} reviews)
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground max-w-2xl">
                      {vendor.description}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button size="lg" className="bg-gradient-to-r from-primary to-blue-600">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Now
                    </Button>
                    <Button size="lg" variant="outline">
                      <Heart className="h-4 w-4 mr-2" />
                      Follow
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{vendor.stats.totalProducts}</div>
                <div className="text-sm text-muted-foreground">Products</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{vendor.totalOrders}+</div>
                <div className="text-sm text-muted-foreground">Orders Completed</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{vendor.stats.repeatCustomers}%</div>
                <div className="text-sm text-muted-foreground">Repeat Customers</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{vendor.stats.avgDeliveryTime}</div>
                <div className="text-sm text-muted-foreground">Avg Delivery</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <div className="flex space-x-6">
              {['overview', 'products', 'reviews', 'contact'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-sm font-medium capitalize pb-2 border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </CardHeader>
          
          <CardContent>
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Business Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Business Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Business Type:</span>
                        <span className="font-medium">{vendor.businessInfo.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Established:</span>
                        <span className="font-medium">{vendor.businessInfo.established}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Employees:</span>
                        <span className="font-medium">{vendor.businessInfo.employees}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">GST Number:</span>
                        <span className="font-medium font-mono text-sm">{vendor.businessInfo.gstNumber}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Location & Contact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-muted-foreground text-sm">Address:</span>
                        <p className="font-medium">
                          {vendor.location.address}, {vendor.location.city}, 
                          {vendor.location.state} - {vendor.location.pincode}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{vendor.contact.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{vendor.contact.email}</span>
                      </div>
                      {vendor.contact.website && (
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{vendor.contact.website}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Certifications & Services */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Certifications
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {vendor.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline" className="text-green-700 border-green-200">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Services
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {vendor.services.map((service, index) => (
                        <Badge key={index} variant="secondary">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Operating Hours */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Operating Hours
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(vendor.operatingHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between p-2 bg-muted/50 rounded">
                        <span className="font-medium">{day}</span>
                        <span className="text-muted-foreground">{hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="space-y-6">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select
                      value={productFilter}
                      onChange={(e) => setProductFilter(e.target.value)}
                      className="px-3 py-2 border border-border rounded-md bg-background"
                    >
                      <option value="all">All Products</option>
                      <option value="instock">In Stock</option>
                      <option value="outofstock">Out of Stock</option>
                    </select>
                  </div>
                </div>
                
                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-square bg-muted flex items-center justify-center">
                        <Package className="h-16 w-16 text-muted-foreground" />
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">{product.name}</h4>
                        <div className="flex items-center space-x-2 mb-2">
                          {renderStarRating(product.rating)}
                          <span className="text-sm text-muted-foreground">{product.rating}</span>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-lg font-bold">₹{product.price}</span>
                          <span className="text-sm text-muted-foreground">per {product.unit}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant={product.inStock ? "secondary" : "destructive"}>
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </Badge>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleProductView(product.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm"
                              disabled={!product.inStock}
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
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Customer Reviews</h3>
                  <Button variant="outline">Write a Review</Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-4xl font-bold mb-2">{vendor.rating}</div>
                      {renderStarRating(vendor.rating)}
                      <div className="text-sm text-muted-foreground mt-2">
                        Based on {vendor.totalReviews} reviews
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="md:col-span-2 space-y-4">
                    {vendor.reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium">{review.customerName}</span>
                                {review.verified && (
                                  <Badge variant="secondary" className="text-xs">
                                    Verified Purchase
                                  </Badge>
                                )}
                              </div>
                              {renderStarRating(review.rating)}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{review.comment}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Contact Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Send Message</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleContactSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                              id="name"
                              value={contactForm.name}
                              onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={contactForm.email}
                              onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              value={contactForm.phone}
                              onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="orderType">Order Type</Label>
                            <select
                              id="orderType"
                              value={contactForm.orderType}
                              onChange={(e) => setContactForm({...contactForm, orderType: e.target.value})}
                              className="w-full px-3 py-2 border border-border rounded-md bg-background"
                            >
                              <option value="bulk">Bulk Order</option>
                              <option value="regular">Regular Order</option>
                              <option value="custom">Custom Requirements</option>
                              <option value="partnership">Business Partnership</option>
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="subject">Subject</Label>
                          <Input
                            id="subject"
                            value={contactForm.subject}
                            onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="message">Message</Label>
                          <Textarea
                            id="message"
                            value={contactForm.message}
                            onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                            rows={4}
                            required
                          />
                        </div>
                        
                        <Button type="submit" className="w-full">
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                  
                  {/* Quick Contact */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Quick Contact</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full justify-start">
                          <Phone className="h-4 w-4 mr-2" />
                          {vendor.contact.phone}
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Mail className="h-4 w-4 mr-2" />
                          {vendor.contact.email}
                        </Button>
                        {vendor.contact.whatsapp && (
                          <Button variant="outline" className="w-full justify-start text-green-600 border-green-200">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            WhatsApp: {vendor.contact.whatsapp}
                          </Button>
                        )}
                        <Button className="w-full bg-gradient-to-r from-primary to-blue-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Meeting
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Business Hours</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(vendor.operatingHours).slice(0, 3).map(([day, hours]) => (
                            <div key={day} className="flex justify-between text-sm">
                              <span className="font-medium">{day}</span>
                              <span className="text-muted-foreground">{hours}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                          Response time: <span className="font-medium text-primary">{vendor.responseTime}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}