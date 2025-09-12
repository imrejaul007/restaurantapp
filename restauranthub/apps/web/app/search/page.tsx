'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Store,
  Briefcase,
  Users,
  MapPin,
  Star,
  Clock,
  DollarSign,
  CheckCircle2,
  Eye,
  Heart,
  MessageCircle,
  Package,
  User
} from 'lucide-react';

// Search result types
interface SearchResult {
  id: string;
  type: 'vendor' | 'product' | 'job' | 'community' | 'service';
  title: string;
  description: string;
  category: string;
  location?: string;
  rating?: number;
  price?: string;
  verified?: boolean;
  image?: string;
  metadata?: Record<string, any>;
}

// Mock search results
const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    type: 'vendor',
    title: 'Premium Spice Co.',
    description: 'Premium quality spices sourced directly from farmers',
    category: 'Spices & Seasonings',
    location: 'Mumbai, Maharashtra',
    rating: 4.8,
    verified: true,
    image: '/api/placeholder/200/150',
    metadata: { products: 150, orders: '500+' }
  },
  {
    id: '2',
    type: 'product',
    title: 'Commercial Pizza Oven',
    description: 'Professional-grade pizza oven for restaurants',
    category: 'Kitchen Equipment',
    location: 'Delhi, India',
    price: '₹2,50,000',
    rating: 4.6,
    image: '/api/placeholder/200/150',
    metadata: { brand: 'ChefMaster Pro', warranty: '2 years' }
  },
  {
    id: '3',
    type: 'job',
    title: 'Head Chef',
    description: 'Leading restaurant chain looking for experienced head chef',
    category: 'Kitchen Staff',
    location: 'Bangalore, Karnataka',
    price: '₹8-12 LPA',
    metadata: { company: 'Urban Dining', posted: '2 hours ago', type: 'full-time' }
  },
  {
    id: '4',
    type: 'community',
    title: 'Restaurant Management Best Practices',
    description: 'Discussion on effective restaurant management strategies',
    category: 'Management',
    metadata: { author: 'Chef Kumar', likes: 45, comments: 12, timestamp: '1 day ago' }
  },
  {
    id: '5',
    type: 'service',
    title: 'Restaurant POS System Setup',
    description: 'Complete point of sale system installation and training',
    category: 'Technology Services',
    location: 'Pan India',
    price: 'Starting ₹25,000',
    rating: 4.9,
    metadata: { provider: 'TechSolutions Ltd', installations: '1000+' }
  }
];

const filterOptions = [
  { value: 'all', label: 'All Results' },
  { value: 'vendor', label: 'Vendors' },
  { value: 'product', label: 'Products' },
  { value: 'job', label: 'Jobs' },
  { value: 'community', label: 'Community' },
  { value: 'service', label: 'Services' }
];

const sortOptions = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' }
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams?.get('q') || '');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('relevance');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Search function
  const performSearch = async () => {
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredResults = mockSearchResults;
    
    // Filter by query
    if (query.trim()) {
      filteredResults = filteredResults.filter(result => 
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description.toLowerCase().includes(query.toLowerCase()) ||
        result.category.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Filter by type
    if (selectedFilter !== 'all') {
      filteredResults = filteredResults.filter(result => result.type === selectedFilter);
    }
    
    // Sort results
    switch (selectedSort) {
      case 'rating':
        filteredResults.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        // Mock: newest first (in real app, would sort by created date)
        break;
      case 'price-low':
        filteredResults.sort((a, b) => {
          const priceA = parseFloat((a.price || '0').replace(/[₹,]/g, ''));
          const priceB = parseFloat((b.price || '0').replace(/[₹,]/g, ''));
          return priceA - priceB;
        });
        break;
      case 'price-high':
        filteredResults.sort((a, b) => {
          const priceA = parseFloat((a.price || '0').replace(/[₹,]/g, ''));
          const priceB = parseFloat((b.price || '0').replace(/[₹,]/g, ''));
          return priceB - priceA;
        });
        break;
    }
    
    setResults(filteredResults);
    setLoading(false);
  };

  // Perform search on component mount and when filters change
  useEffect(() => {
    performSearch();
  }, [query, selectedFilter, selectedSort]);

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  // Render search result card based on type
  const renderSearchResult = (result: SearchResult) => {
    const getTypeIcon = () => {
      switch (result.type) {
        case 'vendor': return <Store className="h-4 w-4" />;
        case 'product': return <Package className="h-4 w-4" />;
        case 'job': return <Briefcase className="h-4 w-4" />;
        case 'community': return <Users className="h-4 w-4" />;
        case 'service': return <CheckCircle2 className="h-4 w-4" />;
        default: return <Search className="h-4 w-4" />;
      }
    };

    const getTypeColor = () => {
      switch (result.type) {
        case 'vendor': return 'text-blue-600 bg-blue-50';
        case 'product': return 'text-green-600 bg-green-50';
        case 'job': return 'text-purple-600 bg-purple-50';
        case 'community': return 'text-orange-600 bg-orange-50';
        case 'service': return 'text-pink-600 bg-pink-50';
        default: return 'text-gray-600 bg-gray-50';
      }
    };

    return (
      <Card key={result.id} className="group hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-800/50 transition-all duration-300 hover:-translate-y-1 border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            {/* Result Image/Icon */}
            <div className="flex-shrink-0">
              {result.image ? (
                <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden group-hover:scale-105 transition-transform duration-300 shadow-md">
                  <img 
                    src={result.image} 
                    alt={result.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className={`w-16 h-16 rounded-xl ${getTypeColor()} flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-md`}>
                  <div className="group-hover:scale-110 transition-transform duration-300">
                    {getTypeIcon()}
                  </div>
                </div>
              )}
            </div>

            {/* Result Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold">{result.title}</h3>
                  {result.verified && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <Badge variant="outline" className={getTypeColor()}>
                  {result.type}
                </Badge>
              </div>

              <p className="text-muted-foreground mb-3">{result.description}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                <span className="flex items-center">
                  <span className="font-medium">{result.category}</span>
                </span>
                
                {result.location && (
                  <span className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {result.location}
                  </span>
                )}
                
                {result.rating && (
                  <span className="flex items-center">
                    <Star className="h-3 w-3 mr-1 text-yellow-400 fill-current" />
                    {result.rating}
                  </span>
                )}
                
                {result.price && (
                  <span className="flex items-center font-medium text-green-600">
                    {result.price}
                  </span>
                )}
              </div>

              {/* Type-specific metadata */}
              {result.type === 'vendor' && result.metadata && (
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span>{result.metadata.products} products</span>
                  <span>{result.metadata.orders} orders</span>
                </div>
              )}

              {result.type === 'job' && result.metadata && (
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {result.metadata.posted}
                  </span>
                  <span className="capitalize">{result.metadata.type}</span>
                  <span>{result.metadata.company}</span>
                </div>
              )}

              {result.type === 'community' && result.metadata && (
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    {result.metadata.author}
                  </span>
                  <span className="flex items-center">
                    <Heart className="h-3 w-3 mr-1" />
                    {result.metadata.likes}
                  </span>
                  <span className="flex items-center">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    {result.metadata.comments}
                  </span>
                  <span>{result.metadata.timestamp}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center space-x-3 mt-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                <Button size="sm" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200">
                  {result.type === 'job' ? 'Apply Now' : 
                   result.type === 'vendor' ? 'View Store' :
                   result.type === 'product' ? 'View Details' :
                   result.type === 'community' ? 'View Discussion' :
                   'Learn More'}
                </Button>
                <Button size="sm" variant="outline" className="hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105 transition-all duration-200 border-gray-200 dark:border-gray-700">
                  <Eye className="h-3 w-3 hover:scale-110 transition-transform" />
                </Button>
                <Button size="sm" variant="outline" className="hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 hover:border-red-200 dark:hover:border-red-800 hover:scale-105 transition-all duration-200 border-gray-200 dark:border-gray-700">
                  <Heart className="h-3 w-3 hover:scale-110 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Header />
      
      <main className="container mx-auto px-4 py-8 lg:px-6">
        {/* Search Header */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products, jobs, vendors, communities..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-lg border border-input rounded-full bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button type="submit" className="absolute right-2 top-2">
              Search
            </Button>
          </form>

          {query && (
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">
                Search Results for "{query}"
              </h1>
              <p className="text-muted-foreground">
                Found {results.length} results
              </p>
            </div>
          )}
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-1 border border-input rounded-md bg-background text-sm"
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="text-sm font-medium">Sort:</span>
            </div>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="px-3 py-1 border border-input rounded-md bg-background text-sm"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Results */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 mx-auto mb-6"></div>
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary mx-auto absolute top-0 left-1/2 -translate-x-1/2"></div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Searching...</p>
              <div className="flex justify-center space-x-1 mt-2">
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          ) : results.length > 0 ? (
            results.map((result, index) => (
              <div
                key={result.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {renderSearchResult(result)}
              </div>
            ))
          ) : query ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or filters
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="cursor-pointer" onClick={() => setQuery('spices')}>
                  spices
                </Badge>
                <Badge variant="outline" className="cursor-pointer" onClick={() => setQuery('chef jobs')}>
                  chef jobs
                </Badge>
                <Badge variant="outline" className="cursor-pointer" onClick={() => setQuery('restaurant equipment')}>
                  restaurant equipment
                </Badge>
                <Badge variant="outline" className="cursor-pointer" onClick={() => setQuery('pos system')}>
                  pos system
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Start your search</h3>
              <p className="text-muted-foreground mb-4">
                Find vendors, products, jobs, and community discussions
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="cursor-pointer" onClick={() => setQuery('indian spices')}>
                  indian spices
                </Badge>
                <Badge variant="outline" className="cursor-pointer" onClick={() => setQuery('head chef')}>
                  head chef
                </Badge>
                <Badge variant="outline" className="cursor-pointer" onClick={() => setQuery('kitchen equipment')}>
                  kitchen equipment
                </Badge>
                <Badge variant="outline" className="cursor-pointer" onClick={() => setQuery('restaurant management')}>
                  restaurant management
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Load More */}
        {results.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Results
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}