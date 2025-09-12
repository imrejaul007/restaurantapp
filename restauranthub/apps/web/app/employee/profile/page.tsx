'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from '@/lib/toast';
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Award,
  Upload,
  Download,
  Eye,
  Edit,
  Plus,
  X,
  Save,
  CheckCircle,
  AlertCircle,
  FileText,
  Camera
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatDate, cn } from '@/lib/utils';

const profileSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  
  // Address
  address: z.object({
    street: z.string().min(5, 'Street address must be at least 5 characters'),
    city: z.string().min(2, 'City must be at least 2 characters'),
    state: z.string().min(2, 'State must be at least 2 characters'),
    pincode: z.string().min(6, 'Pincode must be 6 digits').max(6, 'Pincode must be 6 digits'),
    country: z.string().min(2, 'Country is required')
  }),
  
  // Professional Information
  currentSalary: z.number().optional(),
  expectedSalary: z.number().min(1, 'Expected salary is required'),
  experience: z.number().min(0, 'Experience cannot be negative'),
  noticePeriod: z.enum(['immediate', '15-days', '1-month', '2-months', '3-months']),
  
  // Preferences
  jobTypes: z.array(z.string()).min(1, 'Select at least one job type'),
  preferredLocations: z.array(z.string()).min(1, 'Select at least one preferred location'),
  willingToRelocate: z.boolean(),
  
  // About
  summary: z.string().max(500, 'Summary must be less than 500 characters').optional()
});

type ProfileForm = z.infer<typeof profileSchema>;

interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  skills: string[];
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
  percentage?: number;
}

interface Skill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  verified: boolean;
  endorsements: number;
}

interface Document {
  id: string;
  type: 'resume' | 'aadhaar' | 'pan' | 'passport' | 'certificate' | 'photo';
  name: string;
  uploadedAt: string;
  verified: boolean;
  size: string;
}

const mockExperience: WorkExperience[] = [
  {
    id: '1',
    company: 'Royal Kitchen Restaurant',
    position: 'Sous Chef',
    startDate: '2022-06-01',
    endDate: '2023-12-31',
    current: false,
    description: 'Managed kitchen operations, supervised junior chefs, and maintained food quality standards. Specialized in Indian and Continental cuisine.',
    skills: ['Indian Cuisine', 'Kitchen Management', 'Food Safety', 'Team Leadership']
  },
  {
    id: '2',
    company: 'Hotel Grand Palace',
    position: 'Junior Chef',
    startDate: '2020-03-15',
    endDate: '2022-05-30',
    current: false,
    description: 'Assisted head chef in daily operations, prepared various dishes, and maintained kitchen hygiene standards.',
    skills: ['Food Preparation', 'Kitchen Hygiene', 'Continental Cuisine']
  }
];

const mockEducation: Education[] = [
  {
    id: '1',
    institution: 'Institute of Hotel Management',
    degree: 'Diploma',
    field: 'Hotel Management & Culinary Arts',
    startYear: '2018',
    endYear: '2020',
    percentage: 85
  },
  {
    id: '2',
    institution: 'Mumbai University',
    degree: 'Bachelor of Commerce',
    field: 'Commerce',
    startYear: '2015',
    endYear: '2018',
    percentage: 72
  }
];

const mockSkills: Skill[] = [
  { id: '1', name: 'Indian Cuisine', level: 'expert', verified: true, endorsements: 15 },
  { id: '2', name: 'Continental Cuisine', level: 'advanced', verified: true, endorsements: 12 },
  { id: '3', name: 'Kitchen Management', level: 'advanced', verified: false, endorsements: 8 },
  { id: '4', name: 'Food Safety & Hygiene', level: 'expert', verified: true, endorsements: 20 },
  { id: '5', name: 'Team Leadership', level: 'intermediate', verified: false, endorsements: 6 },
  { id: '6', name: 'Menu Planning', level: 'intermediate', verified: false, endorsements: 4 }
];

const mockDocuments: Document[] = [
  { id: '1', type: 'resume', name: 'Resume_AmitSharma.pdf', uploadedAt: '2024-01-01T00:00:00Z', verified: true, size: '245 KB' },
  { id: '2', type: 'aadhaar', name: 'Aadhaar_Card.pdf', uploadedAt: '2023-12-15T00:00:00Z', verified: true, size: '180 KB' },
  { id: '3', type: 'pan', name: 'PAN_Card.pdf', uploadedAt: '2023-12-15T00:00:00Z', verified: false, size: '150 KB' },
  { id: '4', type: 'certificate', name: 'HACCP_Certificate.pdf', uploadedAt: '2024-01-05T00:00:00Z', verified: true, size: '320 KB' },
  { id: '5', type: 'photo', name: 'Profile_Photo.jpg', uploadedAt: '2023-12-01T00:00:00Z', verified: true, size: '95 KB' }
];

export default function EmployeeProfile() {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [showAddExperience, setShowAddExperience] = useState(false);
  const [showAddEducation, setShowAddEducation] = useState(false);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: 'Amit',
      lastName: 'Sharma',
      email: 'amit.sharma@example.com',
      phone: '+91 9876543210',
      dateOfBirth: '1995-05-15',
      gender: 'male',
      address: {
        street: '123 Linking Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
        country: 'India'
      },
      expectedSalary: 45000,
      experience: 4,
      noticePeriod: '1-month',
      jobTypes: ['full-time'],
      preferredLocations: ['Mumbai', 'Pune'],
      willingToRelocate: false,
      summary: 'Experienced chef with 4+ years in hotel and restaurant industry. Specialized in Indian and Continental cuisine with strong leadership skills.'
    }
  });

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Award },
    { id: 'documents', label: 'Documents', icon: FileText },
  ];

  const onSubmit = async (data: ProfileForm) => {
    const loadingToast = toast.loading('Saving profile...');
    
    try {
      // Simulate API call to save profile
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock API call - in real app, this would be an actual API endpoint
      const profileUpdateData = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      toast.dismiss(loadingToast);
      toast.success('Profile updated successfully!', 'Your changes have been saved.');
      setIsEditing(false);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to update profile', 'Please try again later.');
    }
  };

  const getSkillLevelColor = (level: Skill['level']) => {
    switch (level) {
      case 'beginner':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'advanced':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'expert':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getDocumentTypeIcon = (type: Document['type']) => {
    switch (type) {
      case 'resume':
        return <FileText className="h-5 w-5" />;
      case 'photo':
        return <Camera className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const profileCompletion = 85; // Mock calculation

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground mt-1">
              Manage your professional information and preferences
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <div className="text-sm">
              <span className="text-muted-foreground">Profile Completion: </span>
              <span className="font-medium text-primary">{profileCompletion}%</span>
            </div>
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={form.handleSubmit(onSubmit)}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Profile Completion Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Profile Completion</h3>
                <span className="text-sm text-muted-foreground">{profileCompletion}% Complete</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mb-3">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200 px-2 py-1 rounded-full">
                  ✓ Basic Info
                </span>
                <span className="bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200 px-2 py-1 rounded-full">
                  ✓ Experience
                </span>
                <span className="bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200 px-2 py-1 rounded-full">
                  ! Skills Verification
                </span>
                <span className="bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200 px-2 py-1 rounded-full">
                  ! Document Upload
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-0">
              <div className="flex flex-wrap border-b">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors hover:text-primary',
                        activeTab === tab.id
                          ? 'border-b-2 border-primary text-primary bg-primary/5'
                          : 'text-muted-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'personal' && (
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">First Name</label>
                      <input
                        {...form.register('firstName')}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      {form.formState.errors.firstName && (
                        <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Last Name</label>
                      <input
                        {...form.register('lastName')}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      {form.formState.errors.lastName && (
                        <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Email</label>
                      <input
                        {...form.register('email')}
                        disabled={!isEditing}
                        type="email"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      {form.formState.errors.email && (
                        <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Phone</label>
                      <input
                        {...form.register('phone')}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      {form.formState.errors.phone && (
                        <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Date of Birth</label>
                      <input
                        {...form.register('dateOfBirth')}
                        disabled={!isEditing}
                        type="date"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Gender</label>
                      <select
                        {...form.register('gender')}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">Address</h4>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Street Address</label>
                      <input
                        {...form.register('address.street')}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">City</label>
                        <input
                          {...form.register('address.city')}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">State</label>
                        <input
                          {...form.register('address.state')}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Pincode</label>
                        <input
                          {...form.register('address.pincode')}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Country</label>
                        <input
                          {...form.register('address.country')}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Professional Summary</label>
                    <textarea
                      {...form.register('summary')}
                      disabled={!isEditing}
                      rows={4}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      placeholder="Brief description of your professional background and career objectives..."
                    />
                    <p className="text-xs text-muted-foreground">Maximum 500 characters</p>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === 'experience' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Work Experience</CardTitle>
                  <CardDescription>
                    Add your work history and achievements
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowAddExperience(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Experience
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockExperience.map((exp, index) => (
                    <div key={exp.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{exp.position}</h4>
                          <p className="text-sm text-muted-foreground">{exp.company}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(exp.startDate, { month: 'short', year: 'numeric' })} - 
                            {exp.current ? ' Present' : formatDate(exp.endDate!, { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{exp.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {exp.skills.map((skill, skillIndex) => (
                          <span
                            key={skillIndex}
                            className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'skills' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Skills & Expertise</CardTitle>
                  <CardDescription>
                    Showcase your professional skills and get verified
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Skill
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockSkills.map((skill) => (
                    <div key={skill.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-foreground">{skill.name}</h4>
                        <div className="flex items-center space-x-2">
                          {skill.verified && (
                            <CheckCircle className="h-4 w-4 text-success-500" />
                          )}
                          <div className={`text-xs px-2 py-1 rounded-full ${getSkillLevelColor(skill.level)}`}>
                            {skill.level}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{skill.endorsements} endorsements</span>
                        {!skill.verified && (
                          <Button variant="ghost" size="sm" className="text-xs">
                            Take Test
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'documents' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>
                    Upload and manage your important documents
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {getDocumentTypeIcon(doc.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground text-sm">{doc.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-muted-foreground">{doc.size}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(doc.uploadedAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              doc.verified 
                                ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {doc.verified ? 'Verified' : 'Pending'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}