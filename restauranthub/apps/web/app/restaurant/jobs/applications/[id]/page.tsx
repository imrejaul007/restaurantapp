'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Star,
  Download,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  ExternalLink,
  Award,
  School,
  Building,
  DollarSign,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { toast } from '@/lib/toast';
import { formatDate } from '@/lib/utils';

interface Application {
  id: string;
  candidateName: string;
  email: string;
  phone: string;
  location: string;
  experience: string;
  appliedAt: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  resumeUrl?: string;
  coverLetter?: string;
  portfolio?: string;
  expectedSalary?: number;
  noticePeriod?: string;
  skills: string[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  workExperience: {
    position: string;
    company: string;
    duration: string;
    description: string;
  }[];
  certifications: {
    name: string;
    issuer: string;
    year: string;
  }[];
  rating?: number;
  notes?: string;
  jobId: string;
  jobTitle: string;
}

export default function ApplicationReviewPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);

  useEffect(() => {
    // Simulate API call to fetch application details
    const fetchApplication = async () => {
      setLoading(true);
      try {
        // Mock data
        const mockApplication: Application = {
          id: params.id as string,
          candidateName: 'Rahul Sharma',
          email: 'rahul.sharma@email.com',
          phone: '+91 9876543210',
          location: 'Mumbai, Maharashtra',
          experience: '8 years',
          appliedAt: '2024-01-10T14:30:00Z',
          status: 'pending',
          resumeUrl: '/documents/rahul-sharma-resume.pdf',
          coverLetter: 'I am excited to apply for the Head Chef position at your restaurant. With 8 years of experience in leading kitchen operations and developing innovative menu items, I believe I would be a valuable addition to your team. My expertise spans Indian, Continental, and Asian cuisines, and I have successfully managed teams of up to 15 kitchen staff members.',
          portfolio: 'https://rahulsharmachef.com',
          expectedSalary: 55000,
          noticePeriod: '30 days',
          skills: [
            'Indian Cuisine',
            'Continental Cuisine', 
            'Asian Cuisine',
            'Team Leadership',
            'Menu Planning',
            'Cost Control',
            'Food Safety',
            'Inventory Management'
          ],
          education: [
            {
              degree: 'Diploma in Culinary Arts',
              institution: 'Institute of Hotel Management, Mumbai',
              year: '2015'
            },
            {
              degree: 'Bachelor of Hotel Management',
              institution: 'NCHM, Mumbai',
              year: '2013'
            }
          ],
          workExperience: [
            {
              position: 'Sous Chef',
              company: 'The Taj Hotel, Mumbai',
              duration: '2020 - Present',
              description: 'Leading a team of 12 kitchen staff, managing food preparation for 200+ covers daily, developing seasonal menu items, and maintaining food safety standards.'
            },
            {
              position: 'Chef de Partie',
              company: 'Oberoi Hotels, Delhi',
              duration: '2018 - 2020',
              description: 'Specialized in Indian cuisine preparation, trained junior staff, managed inventory for Indian section, and collaborated with head chef for menu development.'
            },
            {
              position: 'Commis Chef',
              company: 'Leela Palace, Bangalore',
              duration: '2016 - 2018',
              description: 'Assisted in food preparation, learned various cooking techniques, maintained kitchen hygiene, and supported senior chefs during peak hours.'
            }
          ],
          certifications: [
            {
              name: 'Food Safety Manager Certification',
              issuer: 'FSSAI',
              year: '2023'
            },
            {
              name: 'Advanced Culinary Techniques',
              issuer: 'Culinary Institute of America',
              year: '2022'
            }
          ],
          rating: 4.5,
          notes: '',
          jobId: 'job123',
          jobTitle: 'Senior Head Chef'
        };
        
        setApplication(mockApplication);
        setNotes(mockApplication.notes || '');
        setRating(mockApplication.rating || 0);
      } catch (error) {
        toast.error("Failed to load application details.");
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [params.id, toast]);

  const handleStatusChange = async (status: Application['status']) => {
    if (!application) return;
    
    setUpdating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setApplication(prev => prev ? { ...prev, status } : null);
      toast.success(`Application status changed to ${status}.`);
    } catch (error) {
      toast.error("Failed to update application status.");
    } finally {
      setUpdating(false);
    }
  };

  const saveNotes = async () => {
    if (!application) return;
    
    setUpdating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setApplication(prev => prev ? { ...prev, notes, rating } : null);
      toast.success("Your notes and rating have been saved.");
    } catch (error) {
      toast.error("Failed to save notes.");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'shortlisted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'hired':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!application) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Application not found</h2>
          <p className="text-muted-foreground">The application you're looking for doesn't exist.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{application.candidateName}</h1>
              <p className="text-muted-foreground">Applied for {application.jobTitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(application.status)}>
              {application.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStatusChange('reviewed')}>
                  <Eye className="h-4 w-4 mr-2" />
                  Mark as Reviewed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('shortlisted')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Shortlist Candidate
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Interview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('rejected')}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Application
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Contact Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <User className="h-5 w-5 mr-2" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{application.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{application.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{application.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{application.experience} experience</span>
                      </div>
                      {application.expectedSalary && (
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>Expected: ₹{application.expectedSalary.toLocaleString()}/month</span>
                        </div>
                      )}
                      {application.noticePeriod && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Notice Period: {application.noticePeriod}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Cover Letter */}
                {application.coverLetter && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <FileText className="h-5 w-5 mr-2" />
                          Cover Letter
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground leading-relaxed">
                          {application.coverLetter}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Skills */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Skills & Expertise</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {application.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="experience" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Briefcase className="h-5 w-5 mr-2" />
                        Work Experience
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {application.workExperience.map((exp, index) => (
                        <div key={index} className="border-l-2 border-primary/20 pl-4 relative">
                          <div className="absolute -left-2 top-0 w-4 h-4 bg-primary rounded-full"></div>
                          <h4 className="font-semibold">{exp.position}</h4>
                          <p className="text-sm text-muted-foreground flex items-center">
                            <Building className="h-3 w-3 mr-1" />
                            {exp.company} • {exp.duration}
                          </p>
                          <p className="text-sm mt-2">{exp.description}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Certifications */}
                {application.certifications.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Award className="h-5 w-5 mr-2" />
                          Certifications
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {application.certifications.map((cert, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{cert.name}</h4>
                              <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                            </div>
                            <span className="text-sm text-muted-foreground">{cert.year}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </TabsContent>

              <TabsContent value="education" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <School className="h-5 w-5 mr-2" />
                        Education
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {application.education.map((edu, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{edu.degree}</h4>
                            <p className="text-sm text-muted-foreground">{edu.institution}</p>
                          </div>
                          <span className="text-sm text-muted-foreground">{edu.year}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {application.resumeUrl && (
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span>Resume</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button  variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button  variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {application.portfolio && (
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <ExternalLink className="h-4 w-4" />
                            <span>Portfolio</span>
                          </div>
                          <Button  variant="outline">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Visit
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Application Status</CardTitle>
                  <CardDescription>
                    Applied {formatDate(application.appliedAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full"
                    variant={application.status === 'shortlisted' ? 'default' : 'outline'}
                    onClick={() => handleStatusChange('shortlisted')}
                    loading={updating}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Shortlist
                  </Button>
                  <Button
                    className="w-full"
                    variant={application.status === 'rejected' ? 'destructive' : 'outline'}
                    onClick={() => handleStatusChange('rejected')}
                    loading={updating}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Rating */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Rating</CardTitle>
                  <CardDescription>
                    Rate this candidate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`p-1 ${
                          star <= rating ? 'text-yellow-500' : 'text-gray-300'
                        }`}
                      >
                        <Star className="h-5 w-5 fill-current" />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {rating}/5 stars
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notes */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>
                    Add your review notes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Add notes about this candidate..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={saveNotes} loading={updating} className="w-full">
                    Save Notes
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Interview
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Candidate
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}