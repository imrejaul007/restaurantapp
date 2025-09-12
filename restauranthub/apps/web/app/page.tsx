'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/auth-provider';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChefHat,
  Store,
  Users,
  Briefcase,
  ShoppingCart,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  ArrowRight,
  Star,
  Package,
  CreditCard,
  Shield,
  HeartHandshake,
  BarChart3,
  Zap,
  MapPin,
  DollarSign,
  MessageCircle,
  Heart,
  Eye,
  ThumbsUp,
  User,
  Sparkles,
  Play,
  Globe,
  Verified,
  TrendingDown,
  Coffee,
  Utensils,
  Building2,
  Target,
  Calendar
} from 'lucide-react';

// Enhanced types with better visual data
interface FeaturedVendor {
  id: string;
  name: string;
  image: string;
  rating: number;
  category: string;
  location: string;
  verified: boolean;
  products: number;
  description: string;
  bgColor: string;
  featured: boolean;
}

interface JobHighlight {
  id: string;
  title: string;
  company: string;
  logo: string;
  location: string;
  salary: string;
  type: 'full-time' | 'part-time' | 'contract';
  posted: string;
  urgent: boolean;
  requirements: string[];
  companyColor: string;
}

// Modern mock data with better visual appeal
const mockFeaturedVendors: FeaturedVendor[] = [
  {
    id: '1',
    name: 'Premium Spice Co.',
    image: '/api/placeholder/300/200',
    rating: 4.9,
    category: 'Premium Spices',
    location: 'Mumbai, Maharashtra',
    verified: true,
    products: 150,
    description: 'Authentic spices sourced directly from organic farms across India',
    bgColor: 'from-orange-400 to-red-500',
    featured: true
  },
  {
    id: '2',
    name: 'Fresh Farm Produce',
    image: '/api/placeholder/300/200',
    rating: 4.8,
    category: 'Fresh Vegetables',
    location: 'Punjab, India',
    verified: true,
    products: 200,
    description: 'Farm-to-table fresh vegetables delivered within 24 hours',
    bgColor: 'from-green-400 to-emerald-500',
    featured: true
  },
  {
    id: '3',
    name: 'Ocean Catch Seafood',
    image: '/api/placeholder/300/200',
    rating: 4.7,
    category: 'Premium Seafood',
    location: 'Kerala, India',
    verified: true,
    products: 80,
    description: 'Fresh seafood from coastal waters, sustainably sourced',
    bgColor: 'from-blue-400 to-cyan-500',
    featured: false
  }
];

const mockJobHighlights: JobHighlight[] = [
  {
    id: '1',
    title: 'Executive Chef',
    company: 'Luxury Resort Group',
    logo: '/api/placeholder/50/50',
    location: 'Goa, India',
    salary: '₹12-18 LPA',
    type: 'full-time',
    posted: '2 hours ago',
    urgent: true,
    requirements: ['5+ years experience', 'Multi-cuisine expertise', 'Team leadership'],
    companyColor: 'from-purple-500 to-indigo-600'
  },
  {
    id: '2',
    title: 'Restaurant Manager',
    company: 'Urban Dining Chain',
    logo: '/api/placeholder/50/50',
    location: 'Bangalore, Karnataka',
    salary: '₹8-12 LPA',
    type: 'full-time',
    posted: '5 hours ago',
    urgent: false,
    requirements: ['Operations management', 'P&L responsibility', 'Customer service'],
    companyColor: 'from-emerald-500 to-teal-600'
  },
  {
    id: '3',
    title: 'Pastry Chef',
    company: 'Artisan Bakery',
    logo: '/api/placeholder/50/50',
    location: 'Delhi NCR',
    salary: '₹6-9 LPA',
    type: 'full-time',
    posted: '1 day ago',
    urgent: false,
    requirements: ['Pastry expertise', 'Creative skills', 'French techniques'],
    companyColor: 'from-pink-500 to-rose-600'
  }
];

export default function HomePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mockFeaturedVendors.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gradient-to-r from-blue-600 to-purple-600"></div>
            <p className="text-slate-600 animate-pulse">Loading your experience...</p>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced role-based content
  const getRoleSpecificContent = () => {
    if (!isAuthenticated || !user) return null;

    const roleConfigs = {
      restaurant: {
        gradient: 'from-blue-500 to-indigo-600',
        icon: Store,
        title: 'Welcome back, Restaurant Owner!',
        subtitle: 'Your business dashboard is ready',
        actions: [
          { label: 'Dashboard', href: '/restaurant/dashboard', icon: BarChart3 },
          { label: 'Orders', href: '/restaurant/orders', icon: ShoppingCart },
          { label: 'Menu', href: '/restaurant/menu', icon: Utensils },
          { label: 'Staff', href: '/restaurant/staff', icon: Users }
        ]
      },
      vendor: {
        gradient: 'from-emerald-500 to-green-600',
        icon: Package,
        title: 'Vendor Control Center',
        subtitle: 'Manage your products and grow your business',
        actions: [
          { label: 'Dashboard', href: '/vendor/dashboard', icon: BarChart3 },
          { label: 'Products', href: '/vendor/products', icon: Package },
          { label: 'Orders', href: '/vendor/orders', icon: ShoppingCart },
          { label: 'Analytics', href: '/vendor/analytics', icon: TrendingUp }
        ]
      },
      employee: {
        gradient: 'from-purple-500 to-pink-600',
        icon: Briefcase,
        title: 'Your Career Hub',
        subtitle: 'Discover opportunities and manage your professional journey',
        actions: [
          { label: 'Dashboard', href: '/employee/dashboard', icon: User },
          { label: 'Schedule', href: '/employee/schedule', icon: Calendar },
          { label: 'Find Jobs', href: '/jobs', icon: Briefcase },
          { label: 'Training', href: '/training', icon: Award }
        ]
      },
      admin: {
        gradient: 'from-orange-500 to-red-600',
        icon: Shield,
        title: 'Admin Command Center',
        subtitle: 'Platform oversight and system management',
        actions: [
          { label: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
          { label: 'Users', href: '/admin/users', icon: Users },
          { label: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
          { label: 'Settings', href: '/admin/settings', icon: Shield }
        ]
      }
    };

    const config = roleConfigs[user.role as keyof typeof roleConfigs];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${config.gradient} p-8 mb-8 shadow-xl`}>
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
        <div className="relative z-10 flex items-start space-x-6">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <Icon className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white mb-2">{config.title}</h3>
            <p className="text-white/90 mb-6">{config.subtitle}</p>
            <div className="flex flex-wrap gap-3">
              {config.actions.map((action, index) => {
                const ActionIcon = action.icon;
                return (
                  <Link key={index} href={action.href}>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-200"
                    >
                      <ActionIcon className="h-4 w-4 mr-2" />
                      {action.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <main className="relative">
        {/* Role-specific welcome section */}
        <div className="container mx-auto px-4 pt-6">
          {getRoleSpecificContent()}
        </div>

        {/* Hero Section - Enhanced */}
        {!isAuthenticated && (
          <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
            {/* Animated background */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl"></div>
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
                <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
              </div>
            </div>

            <div className="relative z-10 container mx-auto px-4 py-20 lg:py-32">
              <div className="max-w-4xl mx-auto text-center">
                <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                  <Badge className="mb-6 px-4 py-2 bg-white/10 backdrop-blur-sm border-white/20 text-white">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Trusted by 10,000+ Restaurants Worldwide
                  </Badge>
                  
                  <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                    <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                      The Complete Platform
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      for Restaurant Success
                    </span>
                  </h1>
                  
                  <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                    Manage operations, connect with suppliers, hire talent, and grow your restaurant business - all in one powerful, intelligent platform.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link href="/auth/signup">
                      <Button size="lg" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105">
                        Start Free Trial
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Button size="lg" variant="outline" className="px-8 py-4 border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-semibold rounded-xl transition-all duration-300">
                      <Play className="mr-2 h-5 w-5" />
                      Watch Demo
                    </Button>
                  </div>
                  
                  <div className="mt-12 flex items-center justify-center space-x-8 text-sm text-slate-400">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />
                      No credit card required
                    </div>
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />
                      14-day free trial
                    </div>
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />
                      Cancel anytime
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom wave */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden">
              <svg className="relative block w-full h-20" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" className="fill-slate-50"></path>
              </svg>
            </div>
          </section>
        )}

        {/* Stats Section - Redesigned */}
        <section className="container mx-auto px-4 py-16 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: '10,000+', label: 'Active Restaurants', icon: Store, color: 'from-blue-500 to-blue-600' },
              { value: '50,000+', label: 'Happy Users', icon: Users, color: 'from-emerald-500 to-emerald-600' },
              { value: '₹100M+', label: 'Transactions', icon: TrendingUp, color: 'from-purple-500 to-purple-600' },
              { value: '98%', label: 'Satisfaction', icon: Star, color: 'from-orange-500 to-orange-600' }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center group">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${stat.color} mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{stat.value}</div>
                  <div className="text-slate-600 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Categories Grid - Enhanced */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">
              Explore Our Platform
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Discover all the tools and services designed to help your restaurant thrive
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { label: 'Marketplace', icon: ShoppingCart, href: '/marketplace', gradient: 'from-blue-500 to-blue-600', description: 'Find suppliers' },
              { label: 'Jobs', icon: Briefcase, href: '/jobs', gradient: 'from-purple-500 to-purple-600', description: 'Hire talent' },
              { label: 'Community', icon: Users, href: '/community', gradient: 'from-emerald-500 to-emerald-600', description: 'Connect & learn' },
              { label: 'Analytics', icon: BarChart3, href: '/analytics', gradient: 'from-orange-500 to-orange-600', description: 'Track performance' },
              { label: 'Training', icon: Award, href: '/training', gradient: 'from-pink-500 to-pink-600', description: 'Skill development' },
              { label: 'Support', icon: HeartHandshake, href: '/support', gradient: 'from-indigo-500 to-indigo-600', description: '24/7 assistance' },
              { label: 'Payments', icon: CreditCard, href: '/payments', gradient: 'from-teal-500 to-teal-600', description: 'Secure transactions' },
              { label: 'Services', icon: Store, href: '/services', gradient: 'from-red-500 to-red-600', description: 'Business solutions' }
            ].map((category, index) => {
              const Icon = category.icon;
              return (
                <Link key={index} href={category.href}>
                  <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardContent className="p-6 text-center">
                      <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${category.gradient} mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-bold text-slate-800 mb-1">{category.label}</h3>
                      <p className="text-sm text-slate-600">{category.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Featured Vendors - Redesigned */}
        <section className="bg-gradient-to-r from-slate-50 to-slate-100 py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
                  Featured Vendors
                </h2>
                <p className="text-xl text-slate-600">Trusted partners for your success</p>
              </div>
              <Link href="/marketplace">
                <Button variant="outline" className="hidden sm:flex items-center space-x-2 px-6 py-3 rounded-xl border-2 hover:shadow-lg transition-all duration-300">
                  <span>Explore All</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {mockFeaturedVendors.map((vendor, index) => (
                <Card key={vendor.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white border-0">
                  <div className={`relative h-48 bg-gradient-to-r ${vendor.bgColor}`}>
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute top-4 left-4 flex items-center space-x-2">
                      {vendor.verified && (
                        <Badge className="bg-green-500/20 backdrop-blur-sm border-green-500/30 text-green-100">
                          <Verified className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {vendor.featured && (
                        <Badge className="bg-yellow-500/20 backdrop-blur-sm border-yellow-500/30 text-yellow-100">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-white font-semibold">{vendor.rating}</span>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{vendor.name}</h3>
                    <p className="text-slate-600 mb-3">{vendor.description}</p>
                    
                    <div className="flex items-center text-sm text-slate-500 mb-4">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{vendor.location}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">{vendor.products} products</span>
                      <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg">
                        View Store
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Job Highlights - Enhanced */}
        <section className="container mx-auto px-4 py-20">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
                Latest Opportunities
              </h2>
              <p className="text-xl text-slate-600">Find your dream job in hospitality</p>
            </div>
            <Link href="/jobs">
              <Button variant="outline" className="hidden sm:flex items-center space-x-2 px-6 py-3 rounded-xl border-2 hover:shadow-lg transition-all duration-300">
                <span>Browse All Jobs</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {mockJobHighlights.map((job) => (
              <Card key={job.id} className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white border-0 overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${job.companyColor}`}></div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${job.companyColor} flex items-center justify-center`}>
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">{job.title}</h3>
                        <p className="text-slate-600">{job.company}</p>
                      </div>
                    </div>
                    {job.urgent && (
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        <Zap className="h-3 w-3 mr-1" />
                        Urgent
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-slate-600">
                      <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                      {job.location}
                    </div>
                    <div className="flex items-center text-green-600 font-semibold">
                      <DollarSign className="h-4 w-4 mr-2" />
                      {job.salary}
                    </div>
                    <div className="flex items-center text-slate-500 text-sm">
                      <Clock className="h-4 w-4 mr-2" />
                      Posted {job.posted}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {job.requirements.slice(0, 2).map((req, index) => (
                        <Badge key={index} variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg">
                      Quick Apply
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-lg">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        {!isAuthenticated && (
          <section className="bg-gradient-to-r from-indigo-900 to-purple-900 py-20">
            <div className="container mx-auto px-4 text-center">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Ready to Transform Your
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Restaurant Business?
                  </span>
                </h2>
                <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                  Join thousands of restaurants already growing with RestaurantHub
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                  <Link href="/auth/signup">
                    <Button size="lg" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="px-8 py-4 border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-semibold rounded-xl transition-all duration-300">
                    Contact Sales
                  </Button>
                </div>
                
                <div className="flex items-center justify-center space-x-6 text-sm text-slate-400">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />
                    No credit card required
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />
                    14-day free trial
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />
                    Cancel anytime
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Enhanced Footer */}
        <footer className="bg-slate-900 text-white">
          <div className="container mx-auto px-4 py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                    <ChefHat className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold">RestaurantHub</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  The complete platform for restaurant success. Empowering the hospitality industry with innovative solutions.
                </p>
                <div className="flex space-x-4">
                  {/* Social media icons would go here */}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4 text-lg">Product</h4>
                <ul className="space-y-3 text-slate-400">
                  <li><Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
                  <li><Link href="/jobs" className="hover:text-white transition-colors">Jobs</Link></li>
                  <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
                  <li><Link href="/analytics" className="hover:text-white transition-colors">Analytics</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4 text-lg">Company</h4>
                <ul className="space-y-3 text-slate-400">
                  <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                  <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                  <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                  <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4 text-lg">Support</h4>
                <ul className="space-y-3 text-slate-400">
                  <li><Link href="/support" className="hover:text-white transition-colors">Help Center</Link></li>
                  <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                  <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
                  <li><Link href="/status" className="hover:text-white transition-colors">Status</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-slate-800 text-center text-slate-400">
              <p>© 2024 RestaurantHub. All rights reserved. Built with ❤️ for the hospitality industry.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}