'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  MapPin,
  DollarSign,
  Clock,
  Users,
  Plus,
  X,
  AlertCircle,
  Loader2,
  Save,
  Eye,
  ChefHat,
  Briefcase,
  Calendar,
  Building,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth/auth-provider';
import { cn } from '@/lib/utils';

const jobSchema = z.object({
  title: z.string().min(3, 'Job title must be at least 3 characters'),
  department: z.string().min(1, 'Department is required'),
  location: z.object({
    type: z.enum(['on-site', 'remote', 'hybrid']),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    address: z.string().optional()
  }),
  employment: z.object({
    type: z.enum(['full-time', 'part-time', 'contract', 'temporary', 'internship']),
    schedule: z.enum(['morning', 'afternoon', 'evening', 'night', 'flexible', 'rotating']),
    hoursPerWeek: z.number().min(1).max(60)
  }),
  salary: z.object({
    type: z.enum(['hourly', 'monthly', 'yearly']),
    min: z.number().min(0),
    max: z.number().min(0),
    currency: z.string().default('INR'),
    negotiable: z.boolean().default(false)
  }).refine(data => data.max >= data.min, {
    message: 'Maximum salary must be greater than or equal to minimum salary',
    path: ['max']
  }),
  description: z.string().min(50, 'Job description must be at least 50 characters'),
  requirements: z.array(z.string().min(1)).min(1, 'At least one requirement is needed'),
  responsibilities: z.array(z.string().min(1)).min(1, 'At least one responsibility is needed'),
  benefits: z.array(z.string().min(1)).optional(),
  skills: z.array(z.string().min(1)).min(1, 'At least one skill is required'),
  experience: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
    required: z.boolean().default(false)
  }).refine(data => data.max >= data.min, {
    message: 'Maximum experience must be greater than or equal to minimum experience',
    path: ['max']
  }),
  applicationDeadline: z.string().min(1, 'Application deadline is required'),
  startDate: z.string().min(1, 'Start date is required'),
  isUrgent: z.boolean().default(false),
  contactInfo: z.object({
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    contactPerson: z.string().min(1, 'Contact person is required')
  })
});

type JobForm = z.infer<typeof jobSchema>;

const departments = [
  'Kitchen',
  'Service',
  'Management',
  'Administration',
  'Maintenance',
  'Security',
  'Marketing',
  'Finance',
  'Other'
];

const commonSkills = [
  'Food Preparation',
  'Customer Service',
  'Team Leadership',
  'Cash Handling',
  'Food Safety',
  'Inventory Management',
  'POS Systems',
  'Communication',
  'Time Management',
  'Problem Solving',
  'Multitasking',
  'Menu Knowledge',
  'Cooking Techniques',
  'Hygiene Standards',
  'Conflict Resolution'
];

export default function CreateJobPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const form = useForm<JobForm>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      department: '',
      location: {
        type: 'on-site',
        city: '',
        state: '',
        address: ''
      },
      employment: {
        type: 'full-time',
        schedule: 'flexible',
        hoursPerWeek: 40
      },
      salary: {
        type: 'monthly',
        min: 20000,
        max: 30000,
        currency: 'INR',
        negotiable: false
      },
      description: '',
      requirements: [''],
      responsibilities: [''],
      benefits: [''],
      skills: [],
      experience: {
        min: 0,
        max: 5,
        required: false
      },
      applicationDeadline: '',
      startDate: '',
      isUrgent: false,
      contactInfo: {
        email: user?.email || '',
        phone: '',
        contactPerson: ''
      }
    }
  });

  // Verify user is restaurant owner
  if (user?.role !== 'restaurant') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Access Denied
          </h2>
          <p className="text-muted-foreground">
            Only restaurant owners can post jobs. Please contact support if you need access.
          </p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Go to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const onSubmit = async (data: JobForm) => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Job posted:', data);
      router.push('/restaurant/jobs?posted=true');
    } catch (error) {
      console.error('Failed to post job:', error);
    } finally {
      setLoading(false);
    }
  };

  const addArrayField = (fieldName: keyof Pick<JobForm, 'requirements' | 'responsibilities' | 'benefits'>) => {
    const currentValues = form.getValues(fieldName) as string[];
    form.setValue(fieldName, [...currentValues, ''] as any);
  };

  const removeArrayField = (fieldName: keyof Pick<JobForm, 'requirements' | 'responsibilities' | 'benefits'>, index: number) => {
    const currentValues = form.getValues(fieldName) as string[];
    form.setValue(fieldName, currentValues.filter((_, i) => i !== index) as any);
  };

  const addSkill = (skill: string) => {
    const currentSkills = form.getValues('skills');
    if (!currentSkills.includes(skill)) {
      form.setValue('skills', [...currentSkills, skill]);
    }
  };

  const removeSkill = (skill: string) => {
    const currentSkills = form.getValues('skills');
    form.setValue('skills', currentSkills.filter(s => s !== skill));
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Post New Job</h1>
            <p className="text-muted-foreground">
              Create a job posting to attract qualified candidates
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button
              onClick={() => router.back()}
              variant="ghost"
            >
              Cancel
            </Button>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Job Details
              </CardTitle>
              <CardDescription>
                Basic information about the position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Job Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Job Title *
                </label>
                <input
                  {...form.register('title')}
                  placeholder="e.g. Head Chef, Restaurant Manager, Waiter"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{form.formState.errors.title.message}</span>
                  </p>
                )}
              </div>

              {/* Department */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Department *
                </label>
                <select
                  {...form.register('department')}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {form.formState.errors.department && (
                  <p className="text-sm text-destructive flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{form.formState.errors.department.message}</span>
                  </p>
                )}
              </div>

              {/* Employment Type and Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Employment Type *
                  </label>
                  <select
                    {...form.register('employment.type')}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="temporary">Temporary</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Schedule
                  </label>
                  <select
                    {...form.register('employment.schedule')}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="night">Night</option>
                    <option value="flexible">Flexible</option>
                    <option value="rotating">Rotating</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Hours/Week
                  </label>
                  <input
                    {...form.register('employment.hoursPerWeek', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    max="60"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Work Type *
                  </label>
                  <select
                    {...form.register('location.type')}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="on-site">On-site</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    City *
                  </label>
                  <input
                    {...form.register('location.city')}
                    placeholder="e.g. Mumbai"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    State *
                  </label>
                  <input
                    {...form.register('location.state')}
                    placeholder="e.g. Maharashtra"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Full Address (Optional)
                </label>
                <input
                  {...form.register('location.address')}
                  placeholder="Complete address of the workplace"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </CardContent>
          </Card>

          {/* Salary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Compensation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Salary Type *
                  </label>
                  <select
                    {...form.register('salary.type')}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="hourly">Per Hour</option>
                    <option value="monthly">Per Month</option>
                    <option value="yearly">Per Year</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Minimum Salary *
                  </label>
                  <input
                    {...form.register('salary.min', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    placeholder="20000"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Maximum Salary *
                  </label>
                  <input
                    {...form.register('salary.max', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    placeholder="30000"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Currency
                  </label>
                  <select
                    {...form.register('salary.currency')}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center space-x-2">
                <input
                  {...form.register('salary.negotiable')}
                  type="checkbox"
                  className="rounded border-border"
                />
                <span className="text-sm text-foreground">Salary is negotiable</span>
              </label>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                Clear Form
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="px-6"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Posting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Save className="h-4 w-4" />
                    <span>Post Job</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}