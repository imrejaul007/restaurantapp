'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import ReviewSystem from '@/components/reviews/review-system';
import { useAuth } from '@/lib/auth/auth-provider';
import toast from '@/lib/toast';

// Mock reviews data
const mockReviews = [
  {
    id: '1',
    reviewerId: 'customer-1',
    reviewerName: 'Priya Sharma',
    reviewerAvatar: '/avatars/priya.jpg',
    reviewerLevel: 'gold' as const,
    targetType: 'restaurant' as const,
    targetId: 'restaurant-1',
    targetName: 'Spice Garden Restaurant',
    rating: 5,
    title: 'Outstanding dining experience!',
    content: 'Had an absolutely wonderful evening at Spice Garden. The ambiance was perfect for our anniversary dinner, and the service was impeccable. Every dish was expertly prepared and beautifully presented. The staff went above and beyond to make our evening special.',
    pros: [
      'Excellent food quality and presentation',
      'Attentive and friendly staff',
      'Beautiful ambiance and decor',
      'Great value for money'
    ],
    cons: [
      'Slightly noisy during peak hours'
    ],
    images: ['/reviews/spice-garden-1.jpg', '/reviews/spice-garden-2.jpg'],
    videos: [],
    categories: {
      food: 5,
      service: 5,
      ambiance: 4,
      value: 5,
      cleanliness: 5
    },
    isVerified: true,
    visitDate: '2024-01-15T19:30:00Z',
    orderValue: 2850,
    orderType: 'dine_in' as const,
    createdAt: '2024-01-16T10:30:00Z',
    updatedAt: '2024-01-16T10:30:00Z',
    status: 'active' as const,
    likes: 24,
    dislikes: 1,
    replies: [
      {
        id: 'reply-1',
        reviewId: '1',
        replierType: 'owner' as const,
        replierId: 'owner-1',
        replierName: 'Raj Patel - Owner',
        content: 'Thank you so much for your kind words, Priya! We\'re thrilled that you had such a wonderful anniversary dinner with us. We really appreciate your feedback about the noise levels during peak hours and will work on improving that. Looking forward to welcoming you back soon!',
        createdAt: '2024-01-16T14:20:00Z',
        isEdited: false
      }
    ],
    helpfulVotes: 18,
    reportCount: 0,
    isEdited: false,
    tags: ['anniversary', 'excellent service', 'romantic']
  },
  {
    id: '2',
    reviewerId: 'customer-2',
    reviewerName: 'David Johnson',
    reviewerAvatar: '/avatars/david.jpg',
    reviewerLevel: 'silver' as const,
    targetType: 'restaurant' as const,
    targetId: 'restaurant-1',
    targetName: 'Spice Garden Restaurant',
    rating: 4,
    title: 'Great food, but room for improvement',
    content: 'The food at Spice Garden is definitely above average with authentic flavors and generous portions. The butter chicken and garlic naan were particularly good. However, the service was a bit slow during our visit, and we had to wait longer than expected for our main courses.',
    pros: [
      'Authentic and flavorful dishes',
      'Generous portion sizes',
      'Good variety on the menu',
      'Reasonable prices'
    ],
    cons: [
      'Slow service during busy periods',
      'Long wait times between courses',
      'Could improve staff attentiveness'
    ],
    images: ['/reviews/spice-garden-food.jpg'],
    videos: [],
    categories: {
      food: 5,
      service: 3,
      ambiance: 4,
      value: 4,
      cleanliness: 4
    },
    isVerified: true,
    visitDate: '2024-01-12T20:00:00Z',
    orderValue: 1650,
    orderType: 'dine_in' as const,
    createdAt: '2024-01-13T09:15:00Z',
    updatedAt: '2024-01-13T09:15:00Z',
    status: 'active' as const,
    likes: 12,
    dislikes: 3,
    replies: [
      {
        id: 'reply-2',
        reviewId: '2',
        replierType: 'owner' as const,
        replierId: 'owner-1',
        replierName: 'Raj Patel - Owner',
        content: 'Hi David, thank you for your honest feedback. We apologize for the slow service during your visit. We\'ve been experiencing higher than usual demand, but that\'s no excuse for making you wait. We\'re working on optimizing our kitchen workflow and have added more staff to ensure better service times. Please give us another chance!',
        createdAt: '2024-01-13T16:45:00Z',
        isEdited: false
      }
    ],
    helpfulVotes: 8,
    reportCount: 0,
    isEdited: false,
    tags: ['slow service', 'good food', 'authentic']
  },
  {
    id: '3',
    reviewerId: 'customer-3',
    reviewerName: 'Sarah Mitchell',
    reviewerAvatar: '/avatars/sarah-m.jpg',
    reviewerLevel: 'bronze' as const,
    targetType: 'restaurant' as const,
    targetId: 'restaurant-1',
    targetName: 'Spice Garden Restaurant',
    rating: 3,
    title: 'Average experience, mixed feelings',
    content: 'My experience at Spice Garden was quite mixed. While some dishes were good, others were disappointing. The dal was oversalted, and the rice was a bit dry. The ambiance is nice, but it feels like they\'re trying to do too much without perfecting the basics.',
    pros: [
      'Nice interior decoration',
      'Friendly staff members',
      'Good location and parking'
    ],
    cons: [
      'Inconsistent food quality',
      'Some dishes were oversalted',
      'Rice was dry and not fresh',
      'Overpriced for the quality'
    ],
    images: [],
    videos: [],
    categories: {
      food: 3,
      service: 4,
      ambiance: 4,
      value: 2,
      cleanliness: 4
    },
    isVerified: false,
    visitDate: '2024-01-10T18:45:00Z',
    orderValue: 1200,
    orderType: 'dine_in' as const,
    createdAt: '2024-01-11T11:30:00Z',
    updatedAt: '2024-01-11T11:30:00Z',
    status: 'active' as const,
    likes: 5,
    dislikes: 8,
    replies: [],
    helpfulVotes: 3,
    reportCount: 0,
    isEdited: false,
    tags: ['inconsistent quality', 'overpriced']
  },
  {
    id: '4',
    reviewerId: 'customer-4',
    reviewerName: 'Raj Kumar',
    reviewerAvatar: '/avatars/raj.jpg',
    reviewerLevel: 'platinum' as const,
    targetType: 'restaurant' as const,
    targetId: 'restaurant-1',
    targetName: 'Spice Garden Restaurant',
    rating: 5,
    title: 'Best Indian restaurant in the area!',
    content: 'As someone who has tried Indian restaurants across the city, I can confidently say that Spice Garden stands out. The chef clearly knows what they\'re doing - every spice is perfectly balanced, and the cooking techniques are traditional yet refined. This is authentic Indian cuisine at its finest.',
    pros: [
      'Exceptional food quality and authenticity',
      'Perfect spice balance in all dishes',
      'Knowledgeable staff about ingredients',
      'Traditional cooking methods',
      'Clean and hygienic kitchen practices'
    ],
    cons: [],
    images: ['/reviews/spice-garden-thali.jpg', '/reviews/spice-garden-dessert.jpg'],
    videos: [],
    categories: {
      food: 5,
      service: 5,
      ambiance: 5,
      value: 5,
      cleanliness: 5
    },
    isVerified: true,
    visitDate: '2024-01-18T19:15:00Z',
    orderValue: 3200,
    orderType: 'dine_in' as const,
    createdAt: '2024-01-19T08:45:00Z',
    updatedAt: '2024-01-19T08:45:00Z',
    status: 'active' as const,
    likes: 35,
    dislikes: 0,
    replies: [
      {
        id: 'reply-3',
        reviewId: '4',
        replierType: 'owner' as const,
        replierId: 'owner-1',
        replierName: 'Raj Patel - Owner',
        content: 'Raj, thank you so much for this incredible review! Your words mean the world to us. As someone who clearly appreciates authentic Indian cuisine, your endorsement is especially valuable. We work hard to maintain traditional cooking methods while ensuring the highest quality. Thank you for being such a valued customer!',
        createdAt: '2024-01-19T12:30:00Z',
        isEdited: false
      }
    ],
    helpfulVotes: 28,
    reportCount: 0,
    isEdited: false,
    tags: ['authentic', 'best restaurant', 'traditional cooking']
  },
  {
    id: '5',
    reviewerId: 'customer-5',
    reviewerName: 'Lisa Chen',
    reviewerAvatar: '/avatars/lisa.jpg',
    reviewerLevel: 'silver' as const,
    targetType: 'restaurant' as const,
    targetId: 'restaurant-1',
    targetName: 'Spice Garden Restaurant',
    rating: 2,
    title: 'Disappointing experience, not recommended',
    content: 'I had high expectations based on other reviews, but my experience was quite disappointing. The food took over an hour to arrive, and when it did, it was lukewarm. The chicken tikka was dry and seemed like it had been sitting under heat lamps. For the price we paid, I expected much better quality and service.',
    pros: [
      'Good portion sizes',
      'Nice presentation of dishes'
    ],
    cons: [
      'Extremely long wait times',
      'Food arrived lukewarm',
      'Dry and overcooked chicken',
      'Poor value for money',
      'Inattentive service staff',
      'No compensation for the delays'
    ],
    images: [],
    videos: [],
    categories: {
      food: 2,
      service: 1,
      ambiance: 3,
      value: 2,
      cleanliness: 3
    },
    isVerified: true,
    visitDate: '2024-01-14T19:30:00Z',
    orderValue: 2100,
    orderType: 'dine_in' as const,
    createdAt: '2024-01-15T10:20:00Z',
    updatedAt: '2024-01-15T10:20:00Z',
    status: 'flagged' as const,
    likes: 8,
    dislikes: 15,
    replies: [
      {
        id: 'reply-4',
        reviewId: '5',
        replierType: 'owner' as const,
        replierId: 'owner-1',
        replierName: 'Raj Patel - Owner',
        content: 'Lisa, I am deeply sorry about your disappointing experience. This is not the standard we strive for, and I take full responsibility. We had some kitchen equipment issues that night which caused significant delays, but we should have communicated this better and offered compensation. Please reach out to me directly so I can make this right. We would love the opportunity to show you what Spice Garden is really about.',
        createdAt: '2024-01-15T14:45:00Z',
        isEdited: false
      }
    ],
    helpfulVotes: 6,
    reportCount: 2,
    isEdited: false,
    tags: ['poor service', 'long wait', 'disappointing']
  }
];

const mockStats = {
  totalReviews: 127,
  averageRating: 4.2,
  ratingDistribution: {
    1: 5,
    2: 8,
    3: 15,
    4: 34,
    5: 65
  },
  categoryAverages: {
    food: 4.3,
    service: 3.9,
    ambiance: 4.1,
    value: 4.0,
    cleanliness: 4.2
  },
  verifiedReviews: 89,
  responseRate: 85,
  averageResponseTime: 4.2,
  recentTrend: 'up' as const,
  topTags: [
    { tag: 'authentic', count: 23 },
    { tag: 'excellent service', count: 18 },
    { tag: 'good food', count: 35 },
    { tag: 'slow service', count: 12 },
    { tag: 'overpriced', count: 8 }
  ]
};

const mockTargetInfo = {
  id: 'restaurant-1',
  name: 'Spice Garden Restaurant',
  type: 'restaurant' as const,
  image: '/restaurants/spice-garden.jpg'
};

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState(mockReviews);
  const [stats, setStats] = useState(mockStats);

  const handleSubmitReview = (newReview: any) => {
    const review = {
      ...newReview,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      replies: [],
      helpfulVotes: 0,
      reportCount: 0
    };
    setReviews(prev => [review, ...prev]);
    
    // Update stats
    setStats(prev => ({
      ...prev,
      totalReviews: prev.totalReviews + 1,
      averageRating: ((prev.averageRating * prev.totalReviews) + newReview.rating) / (prev.totalReviews + 1),
      ratingDistribution: {
        ...prev.ratingDistribution,
        [newReview.rating]: prev.ratingDistribution[newReview.rating as keyof typeof prev.ratingDistribution] + 1
      }
    }));
  };

  const handleReplyToReview = (reviewId: string, reply: any) => {
    const newReply = {
      ...reply,
      id: Date.now().toString(),
      reviewId,
      createdAt: new Date().toISOString(),
      isEdited: false
    };
    
    setReviews(prev => prev.map(review => 
      review.id === reviewId 
        ? { ...review, replies: [...review.replies, newReply] }
        : review
    ));
    
    // Update response rate
    setStats(prev => ({ ...prev, responseRate: Math.min(100, prev.responseRate + 1) }));
  };

  const handleLikeReview = (reviewId: string, isLike: boolean) => {
    setReviews(prev => prev.map(review => 
      review.id === reviewId 
        ? {
            ...review,
            likes: isLike ? review.likes + 1 : review.likes,
            dislikes: !isLike ? review.dislikes + 1 : review.dislikes
          }
        : review
    ));
  };

  const handleReportReview = (reviewId: string, reason: string) => {
    setReviews(prev => prev.map(review =>
      review.id === reviewId
        ? {
            ...review,
            reportCount: review.reportCount + 1,
            status: review.reportCount >= 2 ? ('flagged' as any) : review.status
          }
        : review
    ));
    toast.warning('Review Reported', `Review has been reported for: ${reason}`);
  };

  const handleModerateReview = (reviewId: string, action: string, reason?: string) => {
    if (action === 'delete') {
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      setStats(prev => ({
        ...prev,
        totalReviews: Math.max(0, prev.totalReviews - 1)
      }));
    } else {
      const newStatus = action === 'hide' ? 'hidden' : action === 'approve' ? 'active' : 'flagged';
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, status: newStatus as any }
          : review
      ));
    }
    const actionMessages = {
      delete: 'Review Deleted',
      hide: 'Review Hidden',
      approve: 'Review Approved'
    };
    const message = actionMessages[action as keyof typeof actionMessages] || `Review ${action}ed`;
    toast.info(message, reason ? `Reason: ${reason}` : undefined);
  };

  const handleMarkHelpful = (reviewId: string) => {
    setReviews(prev => prev.map(review => 
      review.id === reviewId 
        ? { ...review, helpfulVotes: review.helpfulVotes + 1 }
        : review
    ));
  };

  return (
    <DashboardLayout>
      <ReviewSystem
        reviews={reviews}
        stats={stats}
        userRole={user?.role as any || 'customer'}
        currentUserId={user?.id}
        targetInfo={mockTargetInfo}
        onSubmitReview={handleSubmitReview}
        onReplyToReview={handleReplyToReview}
        onLikeReview={handleLikeReview}
        onReportReview={handleReportReview}
        onModerateReview={handleModerateReview}
        onMarkHelpful={handleMarkHelpful}
      />
    </DashboardLayout>
  );
}