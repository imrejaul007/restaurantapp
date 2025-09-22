'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import RestaurantProfile from '@/components/profiles/restaurant-profile';
import { useAuth } from '@/lib/auth/auth-provider';
import { UserRole } from '@/types/auth';

// Mock restaurant profile data
const mockRestaurantProfile = {
  id: 'restaurant-1',
  basicInfo: {
    name: 'Spice Garden Restaurant',
    tagline: 'Authentic Indian Cuisine with Modern Flair',
    description: 'Spice Garden Restaurant has been serving authentic Indian cuisine for over a decade. We pride ourselves on using traditional recipes passed down through generations, combined with modern cooking techniques to create an unforgettable dining experience. Our chefs source the finest ingredients and spices to ensure every dish is bursting with flavor.',
    founded: '2012',
    registrationNumber: 'REST-2012-001',
    gstNumber: '27AABCS1234F1ZR'
  },
  contact: {
    email: 'info@spicegardenrestaurant.com',
    phone: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    website: 'https://spicegardenrestaurant.com'
  },
  location: {
    address: '123 Main Street, Sector 15',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400001',
    country: 'India',
    coordinates: {
      latitude: 19.0760,
      longitude: 72.8777
    }
  },
  cuisine: {
    primary: ['North Indian', 'South Indian', 'Punjabi'],
    secondary: ['Chinese', 'Continental'],
    specialty: 'Traditional Tandoor Dishes'
  },
  capacity: {
    seatingCapacity: 120,
    staffCount: 25,
    kitchenSize: '800 sq ft',
    privateRooms: 2
  },
  operatingHours: [
    { day: 'Monday', isOpen: true, openTime: '11:00', closeTime: '23:00' },
    { day: 'Tuesday', isOpen: true, openTime: '11:00', closeTime: '23:00' },
    { day: 'Wednesday', isOpen: true, openTime: '11:00', closeTime: '23:00' },
    { day: 'Thursday', isOpen: true, openTime: '11:00', closeTime: '23:00' },
    { day: 'Friday', isOpen: true, openTime: '11:00', closeTime: '00:00' },
    { day: 'Saturday', isOpen: true, openTime: '11:00', closeTime: '00:00' },
    { day: 'Sunday', isOpen: true, openTime: '12:00', closeTime: '23:00' }
  ],
  socialMedia: [
    {
      platform: 'Instagram',
      url: 'https://instagram.com/spicegardenrestaurant',
      followers: 15420
    },
    {
      platform: 'Facebook',
      url: 'https://facebook.com/spicegardenrestaurant',
      followers: 8950
    },
    {
      platform: 'YouTube',
      url: 'https://youtube.com/spicegardenrestaurant',
      followers: 2340
    }
  ],
  certifications: [
    {
      id: '1',
      name: 'FSSAI License',
      issuer: 'Food Safety and Standards Authority of India',
      issuedDate: '2023-01-15',
      expiryDate: '2026-01-14',
      status: 'active' as const,
      documentUrl: '/documents/fssai-cert.pdf'
    },
    {
      id: '2',
      name: 'Fire Safety Certificate',
      issuer: 'Mumbai Fire Department',
      issuedDate: '2023-06-01',
      expiryDate: '2024-05-31',
      status: 'active' as const,
      documentUrl: '/documents/fire-safety-cert.pdf'
    },
    {
      id: '3',
      name: 'Halal Certification',
      issuer: 'Halal India Certification Services',
      issuedDate: '2023-03-10',
      expiryDate: '2025-03-09',
      status: 'active' as const,
      documentUrl: '/documents/halal-cert.pdf'
    }
  ],
  images: {
    logo: '/images/restaurant-logo.jpg',
    cover: '/images/restaurant-cover.jpg',
    gallery: [
      '/images/restaurant-interior-1.jpg',
      '/images/restaurant-interior-2.jpg',
      '/images/restaurant-kitchen.jpg',
      '/images/restaurant-dining.jpg'
    ]
  },
  verification: {
    isVerified: true,
    verifiedDate: '2023-02-01T10:00:00Z',
    documents: {
      businessLicense: true,
      foodSafetyCert: true,
      gstRegistration: true,
      ownershipProof: true
    }
  },
  stats: {
    rating: 4.6,
    reviewCount: 892,
    orderCount: 12543,
    joinedDate: '2023-01-15T08:00:00Z'
  },
  settings: {
    visibility: 'public' as const,
    allowReviews: true,
    autoAcceptOrders: false,
    minimumOrderValue: 500
  }
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(mockRestaurantProfile);

  const handleUpdateProfile = (updatedProfile: typeof mockRestaurantProfile) => {
    setProfile(updatedProfile);
    // Here you would typically make an API call to update the profile
    console.log('Profile updated:', updatedProfile);
  };

  const handleUploadImage = async (type: 'logo' | 'cover' | 'gallery', file: File): Promise<string> => {
    // Simulate image upload
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real app, you would upload the file to your storage service
        const fakeImageUrl = URL.createObjectURL(file);
        resolve(fakeImageUrl);
      }, 2000);
    });
  };

  // Only show restaurant profile for restaurant users
  if (user?.role !== UserRole.RESTAURANT) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Restaurant Profile
          </h2>
          <p className="text-muted-foreground">
            This feature is only available for restaurant accounts.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <RestaurantProfile
        profile={profile}
        isOwner={true}
        onUpdateProfile={handleUpdateProfile}
        onUploadImage={handleUploadImage}
      />
    </DashboardLayout>
  );
}