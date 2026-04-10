'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import SupportSystem from '@/components/support/support-system';
import { useAuth } from '@/lib/auth/auth-provider';

// Mock FAQs data
const mockFAQs = [
  {
    id: '1',
    question: 'How do I create a new restaurant account?',
    answer: 'To create a new restaurant account, click on the "Sign Up" button and select "Restaurant Owner". Fill in your restaurant details including business name, address, contact information, and upload required documents like business license and FSSAI certificate. Once submitted, our team will verify your information within 24-48 hours.',
    category: 'account' as const,
    views: 1234,
    helpfulVotes: 89,
    unhelpfulVotes: 12,
    lastUpdated: '2024-01-15T10:30:00Z',
    tags: ['registration', 'account setup', 'verification']
  },
  {
    id: '2',
    question: 'How do I update my payment information?',
    answer: 'You can update your payment information by going to Settings > Billing > Payment Methods. Click "Add Payment Method" to add a new card or bank account, or click the edit icon next to existing payment methods to update them. All payment information is securely encrypted and processed through our certified payment partners.',
    category: 'billing' as const,
    views: 856,
    helpfulVotes: 67,
    unhelpfulVotes: 8,
    lastUpdated: '2024-01-18T14:20:00Z',
    tags: ['billing', 'payment', 'credit card', 'bank account']
  },
  {
    id: '3',
    question: 'Why is my order taking longer than expected?',
    answer: 'Order delays can occur due to several factors: high demand during peak hours, kitchen preparation time, delivery distance, or weather conditions. You can track your order status in real-time through the Orders section. If your order is significantly delayed, please contact the restaurant directly or reach out to our support team.',
    category: 'orders' as const,
    views: 2341,
    helpfulVotes: 156,
    unhelpfulVotes: 34,
    lastUpdated: '2024-01-20T09:15:00Z',
    tags: ['delivery', 'order tracking', 'delays']
  },
  {
    id: '4',
    question: 'I\'m having trouble logging into my account',
    answer: 'If you\'re having trouble logging in, first check that you\'re using the correct email and password. Try resetting your password using the "Forgot Password" link. Clear your browser cache and cookies, or try logging in from a different browser or device. If problems persist, contact our technical support team.',
    category: 'technical' as const,
    views: 1567,
    helpfulVotes: 123,
    unhelpfulVotes: 23,
    lastUpdated: '2024-01-19T16:45:00Z',
    tags: ['login issues', 'password reset', 'account access']
  },
  {
    id: '5',
    question: 'How do I cancel or modify my subscription?',
    answer: 'You can manage your subscription by going to Settings > Subscription. From there, you can upgrade, downgrade, or cancel your plan. Changes take effect at the next billing cycle. If you cancel, you\'ll continue to have access until the end of your current billing period. For immediate cancellation or refunds, please contact our billing team.',
    category: 'billing' as const,
    views: 923,
    helpfulVotes: 78,
    unhelpfulVotes: 15,
    lastUpdated: '2024-01-17T11:30:00Z',
    tags: ['subscription', 'cancellation', 'billing cycle']
  },
  {
    id: '6',
    question: 'How do I add new menu items to my restaurant?',
    answer: 'To add new menu items, go to your Restaurant Dashboard > Menu Management. Click "Add New Item" and fill in the details including item name, description, price, category, and upload high-quality images. You can also set availability schedules, dietary restrictions, and customization options. Changes are reflected immediately on your restaurant page.',
    category: 'general' as const,
    views: 1876,
    helpfulVotes: 142,
    unhelpfulVotes: 18,
    lastUpdated: '2024-01-16T13:20:00Z',
    tags: ['menu management', 'restaurant dashboard', 'food items']
  }
];

// Mock support tickets data
const mockTickets = [
  {
    id: 'TKT-001',
    userId: 'user-1',
    userName: 'Sarah Johnson',
    userEmail: 'sarah@example.com',
    userAvatar: '/avatars/sarah.jpg',
    subject: 'Payment not processing correctly',
    description: 'I\'ve been trying to process payments for the last few orders but they keep failing. The error message says "Payment gateway timeout". This is affecting my business operations and I need urgent help.',
    category: 'billing' as const,
    priority: 'high' as const,
    status: 'open' as const,
    assignedTo: 'agent-1',
    assignedToName: 'Mike Support',
    attachments: [
      {
        id: 'att-1',
        name: 'payment-error-screenshot.png',
        size: 245760,
        type: 'image/png',
        url: '/attachments/payment-error.png'
      }
    ],
    createdAt: '2024-01-20T10:30:00Z',
    updatedAt: '2024-01-20T14:45:00Z',
    responses: [
      {
        id: 'resp-1',
        ticketId: 'TKT-001',
        responderId: 'agent-1',
        responderName: 'Mike Support',
        responderType: 'agent' as const,
        message: 'Hi Sarah, thank you for reaching out. I can see the payment gateway timeout issues you\'re experiencing. This appears to be related to a temporary service disruption with our payment processor. I\'ve escalated this to our technical team and they\'re working on a fix. I\'ll keep you updated on the progress.',
        attachments: [],
        isInternal: false,
        createdAt: '2024-01-20T11:15:00Z',
        isEdited: false
      }
    ],
    tags: ['payment-gateway', 'urgent', 'business-impact']
  },
  {
    id: 'TKT-002',
    userId: 'user-2',
    userName: 'David Chen',
    userEmail: 'david@restaurant.com',
    userAvatar: '/avatars/david.jpg',
    subject: 'Request for inventory management feature',
    description: 'I would like to request an inventory management feature that allows me to track ingredient quantities, set low-stock alerts, and automatically calculate food costs based on recipe ingredients. This would really help streamline my restaurant operations.',
    category: 'feature_request' as const,
    priority: 'medium' as const,
    status: 'in_progress' as const,
    assignedTo: 'agent-2',
    assignedToName: 'Lisa Product',
    attachments: [],
    createdAt: '2024-01-18T09:00:00Z',
    updatedAt: '2024-01-19T16:30:00Z',
    responses: [
      {
        id: 'resp-2',
        ticketId: 'TKT-002',
        responderId: 'agent-2',
        responderName: 'Lisa Product',
        responderType: 'agent' as const,
        message: 'Hi David, thank you for this feature request! Inventory management is actually something we\'re actively working on. I\'ve added your specific requirements to our product roadmap. The feature is planned for our Q2 release and will include all the functionality you mentioned. I\'ll make sure to reach out when it\'s available for beta testing.',
        attachments: [],
        isInternal: false,
        createdAt: '2024-01-18T14:20:00Z',
        isEdited: false
      },
      {
        id: 'resp-3',
        ticketId: 'TKT-002',
        responderId: 'user-2',
        responderName: 'David Chen',
        responderType: 'customer' as const,
        message: 'That\'s great news! I\'d love to be part of the beta testing program. Please let me know what information you need from me to get signed up.',
        attachments: [],
        isInternal: false,
        createdAt: '2024-01-19T08:45:00Z',
        isEdited: false
      }
    ],
    tags: ['feature-request', 'inventory', 'roadmap']
  },
  {
    id: 'TKT-003',
    userId: 'user-3',
    userName: 'Emma Rodriguez',
    userEmail: 'emma@foodie.com',
    userAvatar: '/avatars/emma.jpg',
    subject: 'Can\'t upload restaurant photos',
    description: 'I\'m trying to upload photos of my restaurant and menu items, but every time I try to upload images, I get an error saying "File size too large" even though my images are under 2MB. I\'ve tried different browsers and image formats but the issue persists.',
    category: 'technical' as const,
    priority: 'medium' as const,
    status: 'resolved' as const,
    assignedTo: 'agent-3',
    assignedToName: 'Tom Tech',
    attachments: [],
    createdAt: '2024-01-15T13:30:00Z',
    updatedAt: '2024-01-16T10:20:00Z',
    resolvedAt: '2024-01-16T10:20:00Z',
    responses: [
      {
        id: 'resp-4',
        ticketId: 'TKT-003',
        responderId: 'agent-3',
        responderName: 'Tom Tech',
        responderType: 'agent' as const,
        message: 'Hi Emma, I\'ve identified the issue. There was a bug in our image upload validation that was incorrectly calculating file sizes. I\'ve deployed a fix and you should now be able to upload your images without any problems. Please try again and let me know if you encounter any further issues.',
        attachments: [],
        isInternal: false,
        createdAt: '2024-01-16T09:45:00Z',
        isEdited: false
      },
      {
        id: 'resp-5',
        ticketId: 'TKT-003',
        responderId: 'user-3',
        responderName: 'Emma Rodriguez',
        responderType: 'customer' as const,
        message: 'Perfect! The upload is working now. Thank you for the quick fix!',
        attachments: [],
        isInternal: false,
        createdAt: '2024-01-16T10:15:00Z',
        isEdited: false
      }
    ],
    rating: 5,
    feedback: 'Excellent support! Fast response and quick resolution.',
    tags: ['technical-issue', 'image-upload', 'resolved']
  }
];

// Mock knowledge articles data
const mockArticles = [
  {
    id: 'art-1',
    title: 'Getting Started with RestoPapa',
    content: 'Complete guide to setting up your restaurant account and getting started with our platform...',
    summary: 'Learn how to set up your restaurant account, create your profile, and start taking orders through our platform.',
    category: 'getting_started' as const,
    type: 'guide' as const,
    difficulty: 'beginner' as const,
    estimatedReadTime: 8,
    views: 3456,
    rating: 4.7,
    ratingCount: 234,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    author: 'RestoPapa Team',
    tags: ['onboarding', 'setup', 'restaurant account'],
    relatedArticles: ['art-2', 'art-3'],
    isPublished: true
  },
  {
    id: 'art-2',
    title: 'Managing Your Menu and Pricing',
    content: 'Comprehensive guide to menu management, pricing strategies, and item optimization...',
    summary: 'Master menu creation, pricing strategies, and learn how to optimize your items for maximum visibility and sales.',
    category: 'features' as const,
    type: 'tutorial' as const,
    difficulty: 'intermediate' as const,
    estimatedReadTime: 12,
    views: 2876,
    rating: 4.8,
    ratingCount: 189,
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-18T14:20:00Z',
    author: 'Product Team',
    tags: ['menu management', 'pricing', 'optimization'],
    relatedArticles: ['art-1', 'art-4'],
    isPublished: true
  },
  {
    id: 'art-3',
    title: 'Troubleshooting Common Issues',
    content: 'Solutions to frequently encountered problems and their step-by-step resolutions...',
    summary: 'Quick solutions to common problems including login issues, payment problems, and order management troubles.',
    category: 'troubleshooting' as const,
    type: 'article' as const,
    difficulty: 'beginner' as const,
    estimatedReadTime: 6,
    views: 4123,
    rating: 4.5,
    ratingCount: 312,
    createdAt: '2024-01-08T12:00:00Z',
    updatedAt: '2024-01-19T16:45:00Z',
    author: 'Support Team',
    tags: ['troubleshooting', 'common issues', 'solutions'],
    relatedArticles: ['art-1', 'art-5'],
    isPublished: true
  },
  {
    id: 'art-4',
    title: 'Understanding Analytics and Reports',
    content: 'Deep dive into analytics features, report generation, and data interpretation...',
    summary: 'Learn how to use our analytics dashboard to track performance, understand customer behavior, and grow your business.',
    category: 'advanced' as const,
    type: 'video' as const,
    difficulty: 'advanced' as const,
    estimatedReadTime: 25,
    views: 1567,
    rating: 4.9,
    ratingCount: 98,
    createdAt: '2024-01-10T15:00:00Z',
    updatedAt: '2024-01-20T09:15:00Z',
    author: 'Analytics Team',
    tags: ['analytics', 'reports', 'business intelligence'],
    relatedArticles: ['art-2', 'art-5'],
    isPublished: true
  },
  {
    id: 'art-5',
    title: 'Billing and Subscription Management',
    content: 'Complete guide to managing your billing, understanding charges, and subscription options...',
    summary: 'Everything you need to know about billing cycles, payment methods, subscription plans, and managing your account finances.',
    category: 'billing' as const,
    type: 'guide' as const,
    difficulty: 'intermediate' as const,
    estimatedReadTime: 10,
    views: 2234,
    rating: 4.6,
    ratingCount: 156,
    createdAt: '2024-01-12T11:00:00Z',
    updatedAt: '2024-01-17T13:30:00Z',
    author: 'Billing Team',
    tags: ['billing', 'subscription', 'payments'],
    relatedArticles: ['art-1', 'art-3'],
    isPublished: true
  }
];

export default function SupportPage() {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState(mockFAQs);
  const [tickets, setTickets] = useState(mockTickets);
  const [articles, setArticles] = useState(mockArticles);

  const handleCreateTicket = (newTicket: any) => {
    const ticket = {
      ...newTicket,
      id: `TKT-${String(tickets.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: []
    };
    setTickets(prev => [ticket, ...prev]);
  };

  const handleRespondToTicket = (ticketId: string, response: any) => {
    const newResponse = {
      ...response,
      id: `resp-${Date.now()}`,
      ticketId,
      createdAt: new Date().toISOString(),
      isEdited: false
    };
    
    setTickets(prev => prev.map(ticket =>
      ticket.id === ticketId
        ? {
            ...ticket,
            responses: [...ticket.responses, newResponse],
            updatedAt: new Date().toISOString(),
            status: (response.responderType === 'agent' ? 'waiting_customer' : 'in_progress') as any
          } as any
        : ticket
    ));
  };

  const handleUpdateTicketStatus = (ticketId: string, status: any) => {
    setTickets(prev => prev.map(ticket =>
      ticket.id === ticketId
        ? {
            ...ticket,
            status,
            updatedAt: new Date().toISOString(),
            resolvedAt: status === 'resolved' ? new Date().toISOString() : ticket.resolvedAt
          } as any
        : ticket
    ));
  };

  const handleRateSupport = (ticketId: string, rating: number, feedback?: string) => {
    setTickets(prev => prev.map(ticket =>
      ticket.id === ticketId
        ? { ...ticket, rating, feedback } as any
        : ticket
    ));
  };

  const handleVoteFAQ = (faqId: string, isHelpful: boolean) => {
    setFaqs(prev => prev.map(faq => 
      faq.id === faqId 
        ? {
            ...faq,
            helpfulVotes: isHelpful ? faq.helpfulVotes + 1 : faq.helpfulVotes,
            unhelpfulVotes: !isHelpful ? faq.unhelpfulVotes + 1 : faq.unhelpfulVotes,
            views: faq.views + 1
          }
        : faq
    ));
  };

  const handleRateArticle = (articleId: string, rating: number) => {
    setArticles(prev => prev.map(article => 
      article.id === articleId 
        ? {
            ...article,
            rating: ((article.rating * article.ratingCount) + rating) / (article.ratingCount + 1),
            ratingCount: article.ratingCount + 1,
            views: article.views + 1
          }
        : article
    ));
  };

  return (
    <DashboardLayout>
      <SupportSystem
        faqs={faqs}
        tickets={tickets}
        articles={articles}
        userRole={user?.role as any || 'customer'}
        currentUserId={user?.id}
        onCreateTicket={handleCreateTicket}
        onRespondToTicket={handleRespondToTicket}
        onUpdateTicketStatus={handleUpdateTicketStatus}
        onRateSupport={handleRateSupport}
        onVoteFAQ={handleVoteFAQ}
        onRateArticle={handleRateArticle}
      />
    </DashboardLayout>
  );
}