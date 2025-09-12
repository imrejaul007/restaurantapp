'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import TrainingSystem from '@/components/training/training-system';
import { useAuth } from '@/lib/auth/auth-provider';

// Mock training data
const mockTrainingModules = [
  {
    id: '1',
    title: 'Food Safety Fundamentals',
    description: 'Essential food safety practices including HACCP principles, temperature control, cross-contamination prevention, and proper hygiene protocols for restaurant staff.',
    category: 'food_safety' as const,
    level: 'beginner' as const,
    duration: 180, // 3 hours
    type: 'video' as const,
    requirements: [],
    objectives: [
      'Understand HACCP principles and their application',
      'Master proper food temperature control procedures',
      'Implement effective cross-contamination prevention',
      'Follow personal hygiene and sanitation protocols',
      'Recognize and respond to food safety hazards'
    ],
    content: {
      lessons: 8,
      assessments: 3,
      resources: 15
    },
    certification: {
      available: true,
      validityPeriod: 12,
      renewalRequired: true
    },
    createdBy: 'admin-1',
    createdAt: '2024-01-01T08:00:00Z',
    lastUpdated: '2024-01-15T10:30:00Z',
    isActive: true,
    tags: ['HACCP', 'hygiene', 'safety', 'certification'],
    difficulty: 2,
    rating: 4.8,
    enrollmentCount: 45,
    completionRate: 87
  },
  {
    id: '2',
    title: 'Customer Service Excellence',
    description: 'Comprehensive customer service training covering communication skills, complaint handling, upselling techniques, and creating memorable dining experiences.',
    category: 'customer_service' as const,
    level: 'intermediate' as const,
    duration: 240, // 4 hours
    type: 'interactive' as const,
    requirements: ['Basic Communication Skills'],
    objectives: [
      'Master effective communication with diverse customers',
      'Handle customer complaints professionally',
      'Implement upselling and cross-selling techniques',
      'Create positive customer experiences',
      'Manage difficult situations with confidence'
    ],
    content: {
      lessons: 12,
      assessments: 4,
      resources: 20
    },
    certification: {
      available: true,
      validityPeriod: 24,
      renewalRequired: false
    },
    createdBy: 'admin-1',
    createdAt: '2024-01-02T09:00:00Z',
    lastUpdated: '2024-01-16T14:20:00Z',
    isActive: true,
    tags: ['communication', 'upselling', 'customer experience'],
    difficulty: 3,
    rating: 4.6,
    enrollmentCount: 38,
    completionRate: 79
  },
  {
    id: '3',
    title: 'Kitchen Operations Management',
    description: 'Advanced training for kitchen managers covering workflow optimization, inventory management, cost control, and team leadership in fast-paced kitchen environments.',
    category: 'operations' as const,
    level: 'advanced' as const,
    duration: 360, // 6 hours
    type: 'document' as const,
    requirements: ['Food Safety Fundamentals', '2+ years kitchen experience'],
    objectives: [
      'Optimize kitchen workflow and efficiency',
      'Implement effective inventory control systems',
      'Control food costs and minimize waste',
      'Lead and motivate kitchen teams',
      'Ensure quality consistency during peak hours'
    ],
    content: {
      lessons: 15,
      assessments: 5,
      resources: 25
    },
    certification: {
      available: true,
      validityPeriod: 36,
      renewalRequired: true
    },
    createdBy: 'admin-2',
    createdAt: '2024-01-03T10:00:00Z',
    lastUpdated: '2024-01-17T16:45:00Z',
    isActive: true,
    tags: ['management', 'efficiency', 'inventory', 'leadership'],
    difficulty: 5,
    rating: 4.9,
    enrollmentCount: 22,
    completionRate: 68
  },
  {
    id: '4',
    title: 'Compliance and Legal Requirements',
    description: 'Comprehensive overview of restaurant compliance including labor laws, health regulations, licensing requirements, and documentation standards.',
    category: 'compliance' as const,
    level: 'intermediate' as const,
    duration: 150, // 2.5 hours
    type: 'document' as const,
    requirements: [],
    objectives: [
      'Understand relevant labor laws and regulations',
      'Maintain compliance with health department standards',
      'Manage licensing and permit requirements',
      'Implement proper documentation procedures',
      'Handle compliance audits and inspections'
    ],
    content: {
      lessons: 6,
      assessments: 2,
      resources: 30
    },
    certification: {
      available: true,
      validityPeriod: 12,
      renewalRequired: true
    },
    createdBy: 'admin-1',
    createdAt: '2024-01-04T11:00:00Z',
    lastUpdated: '2024-01-18T09:15:00Z',
    isActive: true,
    tags: ['legal', 'regulations', 'documentation', 'audits'],
    difficulty: 4,
    rating: 4.4,
    enrollmentCount: 31,
    completionRate: 82
  },
  {
    id: '5',
    title: 'Leadership and Team Development',
    description: 'Leadership skills for restaurant managers focusing on team building, performance management, conflict resolution, and creating positive work environments.',
    category: 'leadership' as const,
    level: 'advanced' as const,
    duration: 300, // 5 hours
    type: 'interactive' as const,
    requirements: ['2+ years management experience'],
    objectives: [
      'Develop effective leadership styles',
      'Build high-performing restaurant teams',
      'Manage employee performance and development',
      'Resolve workplace conflicts professionally',
      'Create positive and inclusive work cultures'
    ],
    content: {
      lessons: 10,
      assessments: 3,
      resources: 18
    },
    certification: {
      available: true,
      validityPeriod: 24,
      renewalRequired: false
    },
    createdBy: 'admin-2',
    createdAt: '2024-01-05T12:00:00Z',
    lastUpdated: '2024-01-19T11:30:00Z',
    isActive: true,
    tags: ['leadership', 'team building', 'management', 'conflict resolution'],
    difficulty: 4,
    rating: 4.7,
    enrollmentCount: 18,
    completionRate: 72
  },
  {
    id: '6',
    title: 'POS System Mastery',
    description: 'Complete training on restaurant point-of-sale systems including order processing, payment handling, reporting, and troubleshooting common issues.',
    category: 'technical' as const,
    level: 'beginner' as const,
    duration: 120, // 2 hours
    type: 'interactive' as const,
    requirements: [],
    objectives: [
      'Navigate POS system interfaces efficiently',
      'Process orders and payments accurately',
      'Generate and interpret sales reports',
      'Handle refunds and modifications',
      'Troubleshoot common technical issues'
    ],
    content: {
      lessons: 5,
      assessments: 2,
      resources: 12
    },
    certification: {
      available: false,
      renewalRequired: false
    },
    createdBy: 'admin-1',
    createdAt: '2024-01-06T13:00:00Z',
    lastUpdated: '2024-01-20T08:45:00Z',
    isActive: true,
    tags: ['POS', 'technology', 'payments', 'troubleshooting'],
    difficulty: 2,
    rating: 4.5,
    enrollmentCount: 52,
    completionRate: 91
  }
];

const mockEmployeeProgress = [
  {
    employeeId: 'emp-1',
    employeeName: 'Sarah Johnson',
    employeeRole: 'Server',
    avatar: '/avatars/sarah.jpg',
    moduleProgress: [
      {
        moduleId: '1',
        status: 'completed' as const,
        progress: 100,
        startDate: '2024-01-10T09:00:00Z',
        completionDate: '2024-01-12T16:30:00Z',
        score: 92,
        attempts: 1,
        timeSpent: 185
      },
      {
        moduleId: '2',
        status: 'in_progress' as const,
        progress: 65,
        startDate: '2024-01-15T10:00:00Z',
        score: 78,
        attempts: 1,
        timeSpent: 156
      },
      {
        moduleId: '6',
        status: 'completed' as const,
        progress: 100,
        startDate: '2024-01-08T14:00:00Z',
        completionDate: '2024-01-08T16:30:00Z',
        score: 96,
        attempts: 1,
        timeSpent: 125
      }
    ],
    certifications: [
      {
        id: 'cert-1',
        moduleId: '1',
        name: 'Food Safety Fundamentals Certificate',
        issuedDate: '2024-01-12T16:30:00Z',
        expiryDate: '2025-01-12T16:30:00Z',
        status: 'active' as const,
        score: 92
      }
    ],
    overallProgress: 75,
    joinedDate: '2024-01-08T08:00:00Z',
    lastActivity: '2024-01-19T14:20:00Z'
  },
  {
    employeeId: 'emp-2',
    employeeName: 'Mike Chen',
    employeeRole: 'Kitchen Manager',
    avatar: '/avatars/mike.jpg',
    moduleProgress: [
      {
        moduleId: '1',
        status: 'completed' as const,
        progress: 100,
        startDate: '2024-01-05T08:00:00Z',
        completionDate: '2024-01-07T17:00:00Z',
        score: 88,
        attempts: 1,
        timeSpent: 190
      },
      {
        moduleId: '3',
        status: 'in_progress' as const,
        progress: 80,
        startDate: '2024-01-12T09:00:00Z',
        score: 85,
        attempts: 1,
        timeSpent: 288
      },
      {
        moduleId: '4',
        status: 'completed' as const,
        progress: 100,
        startDate: '2024-01-08T11:00:00Z',
        completionDate: '2024-01-10T15:30:00Z',
        score: 94,
        attempts: 1,
        timeSpent: 155
      }
    ],
    certifications: [
      {
        id: 'cert-2',
        moduleId: '1',
        name: 'Food Safety Fundamentals Certificate',
        issuedDate: '2024-01-07T17:00:00Z',
        expiryDate: '2025-01-07T17:00:00Z',
        status: 'active' as const,
        score: 88
      },
      {
        id: 'cert-3',
        moduleId: '4',
        name: 'Compliance and Legal Requirements Certificate',
        issuedDate: '2024-01-10T15:30:00Z',
        expiryDate: '2025-01-10T15:30:00Z',
        status: 'active' as const,
        score: 94
      }
    ],
    overallProgress: 85,
    joinedDate: '2024-01-05T08:00:00Z',
    lastActivity: '2024-01-19T16:45:00Z'
  },
  {
    employeeId: 'emp-3',
    employeeName: 'Emma Rodriguez',
    employeeRole: 'Assistant Manager',
    avatar: '/avatars/emma.jpg',
    moduleProgress: [
      {
        moduleId: '2',
        status: 'completed' as const,
        progress: 100,
        startDate: '2024-01-09T10:00:00Z',
        completionDate: '2024-01-11T18:30:00Z',
        score: 91,
        attempts: 1,
        timeSpent: 245
      },
      {
        moduleId: '5',
        status: 'in_progress' as const,
        progress: 45,
        startDate: '2024-01-16T09:00:00Z',
        score: 82,
        attempts: 1,
        timeSpent: 135
      },
      {
        moduleId: '6',
        status: 'completed' as const,
        progress: 100,
        startDate: '2024-01-06T13:00:00Z',
        completionDate: '2024-01-06T15:30:00Z',
        score: 98,
        attempts: 1,
        timeSpent: 118
      }
    ],
    certifications: [
      {
        id: 'cert-4',
        moduleId: '2',
        name: 'Customer Service Excellence Certificate',
        issuedDate: '2024-01-11T18:30:00Z',
        expiryDate: '2026-01-11T18:30:00Z',
        status: 'active' as const,
        score: 91
      }
    ],
    overallProgress: 67,
    joinedDate: '2024-01-06T08:00:00Z',
    lastActivity: '2024-01-19T12:15:00Z'
  }
];

export default function TrainingPage() {
  const { user } = useAuth();
  const [modules, setModules] = useState(mockTrainingModules);
  const [employeeProgress, setEmployeeProgress] = useState(mockEmployeeProgress);

  const handleCreateModule = (newModule: any) => {
    const module = {
      ...newModule,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      createdBy: user?.id || 'current-user',
      enrollmentCount: 0,
      completionRate: 0,
      rating: 0
    };
    setModules(prev => [module, ...prev]);
  };

  const handleUpdateModule = (moduleId: string, updates: any) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { ...module, ...updates, lastUpdated: new Date().toISOString() }
        : module
    ));
  };

  const handleEnrollEmployee = (moduleId: string, employeeId: string) => {
    setEmployeeProgress(prev => prev.map(employee => {
      if (employee.employeeId === employeeId) {
        const existingProgress = employee.moduleProgress.find(p => p.moduleId === moduleId);
        if (!existingProgress) {
          return {
            ...employee,
            moduleProgress: [
              ...employee.moduleProgress,
              {
                moduleId,
                status: 'not_started' as const,
                progress: 0,
                attempts: 0,
                timeSpent: 0
              }
            ]
          };
        }
      }
      return employee;
    }));

    // Update module enrollment count
    setModules(prev => prev.map(module =>
      module.id === moduleId
        ? { ...module, enrollmentCount: module.enrollmentCount + 1 }
        : module
    ));
  };

  const handleStartTraining = (moduleId: string) => {
    const currentEmployeeId = user?.id || 'current-user';
    
    setEmployeeProgress(prev => prev.map(employee => {
      if (employee.employeeId === currentEmployeeId) {
        const updatedProgress = employee.moduleProgress.map(p =>
          p.moduleId === moduleId
            ? {
                ...p,
                status: 'in_progress' as const,
                startDate: p.startDate || new Date().toISOString()
              }
            : p
        );

        // If module not found, add it
        const moduleExists = employee.moduleProgress.some(p => p.moduleId === moduleId);
        if (!moduleExists) {
          updatedProgress.push({
            moduleId,
            status: 'in_progress' as const,
            progress: 0,
            startDate: new Date().toISOString(),
            attempts: 1,
            timeSpent: 0
          });
        }

        return {
          ...employee,
          moduleProgress: updatedProgress,
          lastActivity: new Date().toISOString()
        };
      }
      return employee;
    }));

    console.log(`Starting training for module: ${moduleId}`);
  };

  const handleCompleteLesson = (moduleId: string, lessonId: string) => {
    console.log(`Completing lesson ${lessonId} in module ${moduleId}`);
  };

  return (
    <DashboardLayout>
      <TrainingSystem
        modules={modules}
        employeeProgress={employeeProgress}
        userRole={user?.role as any || 'employee'}
        currentUserId={user?.id}
        onCreateModule={handleCreateModule}
        onUpdateModule={handleUpdateModule}
        onEnrollEmployee={handleEnrollEmployee}
        onStartTraining={handleStartTraining}
        onCompleteLesson={handleCompleteLesson}
      />
    </DashboardLayout>
  );
}