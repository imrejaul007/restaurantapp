'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus,
  Search,
  Filter,
  TrendingUp,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  User,
  Building2,
  Package,
  Users,
  Camera,
  Link as LinkIcon,
  MapPin,
  Clock,
  Award,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatDate, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-provider';
import CreatePostModal from '@/components/community/create-post-modal';
import CommentsSection from '@/components/community/comments-section';

interface CommunityPost {
  id: string;
  author: {
    id: string;
    name: string;
    role: 'admin' | 'restaurant' | 'employee' | 'vendor';
    avatar?: string;
    verified: boolean;
    location?: string;
  };
  content: {
    text: string;
    images?: string[];
    links?: {
      url: string;
      title: string;
      description: string;
    }[];
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    isLiked: boolean;
    isBookmarked: boolean;
  };
  tags: string[];
  category: 'discussion' | 'tip' | 'recipe' | 'job' | 'news' | 'review';
  createdAt: string;
  trending: boolean;
  featured: boolean;
}

const mockPosts: CommunityPost[] = [
  {
    id: '1',
    author: {
      id: 'restaurant-1',
      name: 'The Spice Route',
      role: 'restaurant',
      verified: true,
      location: 'Mumbai, Maharashtra'
    },
    content: {
      text: 'Just launched our new seasonal menu featuring authentic Rajasthani cuisine! The response has been overwhelming. Here are some tips for fellow restaurant owners on introducing regional dishes to urban markets...',
      images: ['/community/post1-img1.jpg', '/community/post1-img2.jpg']
    },
    engagement: {
      likes: 127,
      comments: 23,
      shares: 8,
      views: 1456,
      isLiked: false,
      isBookmarked: true
    },
    tags: ['Menu Planning', 'Regional Cuisine', 'Restaurant Tips'],
    category: 'tip',
    createdAt: '2024-01-10T10:30:00Z',
    trending: true,
    featured: false
  },
  {
    id: '2',
    author: {
      id: 'employee-1',
      name: 'Amit Sharma',
      role: 'employee',
      verified: false,
      location: 'Mumbai, Maharashtra'
    },
    content: {
      text: 'After 8 years in the restaurant industry, here\'s what I\'ve learned about building a successful culinary career. Thread 🧵',
      images: []
    },
    engagement: {
      likes: 89,
      comments: 34,
      shares: 15,
      views: 892,
      isLiked: true,
      isBookmarked: false
    },
    tags: ['Career Advice', 'Chef Life', 'Professional Growth'],
    category: 'discussion',
    createdAt: '2024-01-10T08:15:00Z',
    trending: false,
    featured: true
  },
  {
    id: '3',
    author: {
      id: 'vendor-1',
      name: 'Fresh Farm Suppliers',
      role: 'vendor',
      verified: true,
      location: 'Pune, Maharashtra'
    },
    content: {
      text: 'Quality organic vegetables now available for bulk orders! We\'ve implemented new packaging to ensure freshness during transport. Special discounts for restaurant partnerships.',
      images: ['/community/post3-img1.jpg'],
      links: [{
        url: 'https://freshfarm.com/organic-vegetables',
        title: 'Organic Vegetable Catalog',
        description: 'Browse our complete range of fresh organic produce'
      }]
    },
    engagement: {
      likes: 45,
      comments: 12,
      shares: 6,
      views: 567,
      isLiked: false,
      isBookmarked: false
    },
    tags: ['Organic Produce', 'Bulk Orders', 'Restaurant Supplies'],
    category: 'news',
    createdAt: '2024-01-09T16:45:00Z',
    trending: false,
    featured: false
  }
];

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>(mockPosts);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [showComments, setShowComments] = useState<Set<string>>(new Set());

  const handleLikePost = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? {
            ...post,
            engagement: {
              ...post.engagement,
              likes: post.engagement.isLiked ? post.engagement.likes - 1 : post.engagement.likes + 1,
              isLiked: !post.engagement.isLiked
            }
          }
        : post
    ));
  };

  const handleBookmarkPost = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? {
            ...post,
            engagement: {
              ...post.engagement,
              isBookmarked: !post.engagement.isBookmarked
            }
          }
        : post
    ));
  };

  const handleCreatePost = async (postData: {
    content: string;
    category: string;
    visibility: 'public' | 'private' | 'followers';
    images?: string[];
    tags?: string[];
    location?: string;
  }) => {
    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      author: {
        id: user?.id || 'current-user',
        name: user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'Current User',
        role: user?.role as any || 'employee',
        verified: true,
        location: postData.location
      },
      content: {
        text: postData.content,
        images: postData.images
      },
      engagement: {
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
        isLiked: false,
        isBookmarked: false
      },
      tags: postData.tags || [],
      category: postData.category as any,
      createdAt: new Date().toISOString(),
      trending: false,
      featured: false
    };

    setPosts(prev => [newPost, ...prev]);
  };

  const handleToggleComments = (postId: string) => {
    setShowComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleAddComment = async (postId: string, content: string, parentId?: string) => {
    // Increment comment count
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? {
            ...post,
            engagement: {
              ...post.engagement,
              comments: post.engagement.comments + 1
            }
          }
        : post
    ));
    
    // In a real app, this would make an API call to create the comment
    console.log('Adding comment:', { postId, content, parentId });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'restaurant':
        return <Building2 className="h-4 w-4" />;
      case 'employee':
        return <Users className="h-4 w-4" />;
      case 'vendor':
        return <Package className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'restaurant':
        return 'text-green-600';
      case 'employee':
        return 'text-purple-600';
      case 'vendor':
        return 'text-orange-600';
      default:
        return 'text-blue-600';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tip':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'discussion':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'recipe':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'job':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'news':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'review':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.content.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'All Posts' },
    { value: 'discussion', label: 'Discussions' },
    { value: 'tip', label: 'Tips & Advice' },
    { value: 'recipe', label: 'Recipes' },
    { value: 'job', label: 'Job Related' },
    { value: 'news', label: 'Industry News' },
    { value: 'review', label: 'Reviews' }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Community</h1>
            <p className="text-muted-foreground mt-1">
              Connect with fellow restaurant professionals, share knowledge, and grow together
            </p>
          </div>
          <Button onClick={() => setShowCreatePost(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search posts, people, or topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-6">
          {filteredPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {/* Author Avatar */}
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        {getRoleIcon(post.author.role)}
                      </div>
                      
                      {/* Author Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-foreground">{post.author.name}</h3>
                          {post.author.verified && (
                            <Award className="h-4 w-4 text-primary" />
                          )}
                          <div className={cn('p-1 rounded', getRoleColor(post.author.role))}>
                            {getRoleIcon(post.author.role)}
                          </div>
                          {post.trending && (
                            <Badge variant="secondary" className="text-xs">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Trending
                            </Badge>
                          )}
                          {post.featured && (
                            <Badge className="text-xs">
                              Featured
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-1">
                          {post.author.location && (
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{post.author.location}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(post.createdAt, { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(post.category)}`}>
                        {post.category}
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Post Content */}
                  <div className="space-y-4">
                    <p className="text-foreground leading-relaxed">{post.content.text}</p>
                    
                    {/* Images */}
                    {post.content.images && post.content.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
                        {post.content.images.map((image, imgIndex) => (
                          <div
                            key={imgIndex}
                            className="aspect-video bg-muted rounded-lg flex items-center justify-center"
                          >
                            <Camera className="h-8 w-8 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Links */}
                    {post.content.links && post.content.links.length > 0 && (
                      <div className="space-y-2">
                        {post.content.links.map((link, linkIndex) => (
                          <div
                            key={linkIndex}
                            className="p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-start space-x-3">
                              <LinkIcon className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                              <div>
                                <h4 className="font-medium text-foreground text-sm">{link.title}</h4>
                                <p className="text-sm text-muted-foreground">{link.description}</p>
                                <span className="text-xs text-primary">{link.url}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline" className="text-xs">
                            #{tag.replace(/\s+/g, '')}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Engagement Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{post.engagement.views}</span>
                      </div>
                      <span>•</span>
                      <span>{post.engagement.likes} likes</span>
                      <span>•</span>
                      <span>{post.engagement.comments} comments</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-3">
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikePost(post.id)}
                        className={cn(
                          'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950',
                          post.engagement.isLiked ? 'text-red-600' : ''
                        )}
                      >
                        <Heart className={cn(
                          'h-4 w-4 mr-2',
                          post.engagement.isLiked ? 'fill-red-600' : ''
                        )} />
                        {post.engagement.likes}
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                        onClick={() => handleToggleComments(post.id)}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {post.engagement.comments}
                      </Button>
                      
                      <Button variant="ghost" size="sm" className="hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950">
                        <Share2 className="h-4 w-4 mr-2" />
                        {post.engagement.shares}
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBookmarkPost(post.id)}
                      className={cn(
                        'hover:bg-yellow-50 hover:text-yellow-600 dark:hover:bg-yellow-950',
                        post.engagement.isBookmarked ? 'text-yellow-600' : ''
                      )}
                    >
                      <Bookmark className={cn(
                        'h-4 w-4',
                        post.engagement.isBookmarked ? 'fill-yellow-600' : ''
                      )} />
                    </Button>
                  </div>
                  
                  {/* Comments Section */}
                  {showComments.has(post.id) && (
                    <div className="pt-4 border-t border-border mt-4">
                      <CommentsSection
                        postId={post.id}
                        comments={[]} // Mock empty comments for now
                        totalComments={post.engagement.comments}
                        currentUserId={user?.id || 'current-user'}
                        currentUserRole={user?.role as any || 'employee'}
                        onAddComment={handleAddComment}
                        onUpdateComment={async () => {}}
                        onDeleteComment={async () => {}}
                        onLikeComment={() => {}}
                        onReportComment={() => {}}
                        onPinComment={() => {}}
                        isPostAuthor={post.author.id === user?.id}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No posts found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || categoryFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Be the first to share something with the community!'
              }
            </p>
            <Button onClick={() => setShowCreatePost(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Post
            </Button>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onCreatePost={handleCreatePost}
        userRole={user?.role as any || 'employee'}
      />
    </DashboardLayout>
  );
}