'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Loader2, 
  User,
  Building2,
  Users,
  Package,
  ArrowRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-provider';
import { TwoFactorChallenge } from '@/components/auth/two-factor-challenge';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'restaurant', 'employee', 'vendor'], {
    required_error: 'Please select your role'
  }),
  rememberMe: z.boolean().optional()
});

type LoginForm = z.infer<typeof loginSchema>;

interface DemoAccount {
  role: 'admin' | 'restaurant' | 'employee' | 'vendor';
  email: string;
  password: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
}

const demoAccounts: DemoAccount[] = [
  {
    role: 'admin',
    email: 'admin@restauranthub.com',
    password: 'admin123',
    name: 'Platform Admin',
    description: 'Full platform access with user management',
    icon: User,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900'
  },
  {
    role: 'restaurant',
    email: 'owner@spiceroute.com',
    password: 'restaurant123',
    name: 'Restaurant Owner',
    description: 'Manage staff, orders, and marketplace',
    icon: Building2,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900'
  },
  {
    role: 'employee',
    email: 'amit@example.com',
    password: 'employee123',
    name: 'Job Seeker',
    description: 'Search jobs and manage applications',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900'
  },
  {
    role: 'vendor',
    email: 'contact@freshfarm.com',
    password: 'vendor123',
    name: 'Supplier/Vendor',
    description: 'Manage inventory and process orders',
    icon: Package,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900'
  }
];

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [loginData, setLoginData] = useState<LoginForm | null>(null);
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const onSubmit = async (data: LoginForm) => {
    setLoginError('');

    try {
      await login(data.email, data.password, data.role);
      
      // Login function handles redirect, but check for custom redirect
      if (redirectTo && !redirectTo.includes('/auth/')) {
        router.push(redirectTo);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      
      // Check if error is related to 2FA requirement
      if (message.includes('2FA') || message.includes('two-factor') || message.includes('authentication required')) {
        setLoginData(data);
        setNeedsTwoFactor(true);
      } else {
        setLoginError(message);
      }
    }
  };

  const handleTwoFactorSubmit = async (twoFactorToken: string) => {
    if (!loginData) return;

    try {
      await login(loginData.email, loginData.password, loginData.role, twoFactorToken);
      
      // Login successful, redirect
      if (redirectTo && !redirectTo.includes('/auth/')) {
        router.push(redirectTo);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '2FA verification failed. Please try again.';
      setLoginError(message);
    }
  };

  const handleBackToLogin = () => {
    setNeedsTwoFactor(false);
    setLoginData(null);
    setLoginError('');
  };

  const fillDemoCredentials = (account: DemoAccount) => {
    form.setValue('email', account.email);
    form.setValue('password', account.password);
    form.setValue('role', account.role);
    setSelectedRole(account.role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      {needsTwoFactor ? (
        <TwoFactorChallenge
          email={loginData?.email || ''}
          onSubmit={handleTwoFactorSubmit}
          onBack={handleBackToLogin}
          loading={isLoading}
          error={loginError}
        />
      ) : (
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Branding */}
        <div className="text-center lg:text-left">
          <div className="mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Welcome to
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent block">
                RestaurantHub
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg">
              The all-in-one platform connecting restaurants, employees, and suppliers in the food industry.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-success-500" />
              <span className="text-muted-foreground">Streamlined hiring process</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-success-500" />
              <span className="text-muted-foreground">Integrated marketplace</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-success-500" />
              <span className="text-muted-foreground">Real-time collaboration</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div>
          <Card className="shadow-2xl border-0">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
              <CardDescription>
                Choose your role and enter your credentials
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Role Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Select Your Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {demoAccounts.map((account) => {
                    const Icon = account.icon;
                    const isSelected = selectedRole === account.role;
                    
                    return (
                      <button
                        key={account.role}
                        type="button"
                        onClick={() => {
                          setSelectedRole(account.role);
                          form.setValue('role', account.role);
                        }}
                        className={cn(
                          'p-3 border rounded-lg transition-all text-left hover:bg-accent/50',
                          isSelected 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                            : 'border-border'
                        )}
                      >
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            'p-1.5 rounded',
                            isSelected ? account.bgColor : 'bg-muted'
                          )}>
                            <Icon className={cn(
                              'h-4 w-4',
                              isSelected ? account.color : 'text-muted-foreground'
                            )} />
                          </div>
                          <span className={cn(
                            'font-medium text-sm',
                            isSelected ? 'text-primary' : 'text-foreground'
                          )}>
                            {account.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {form.formState.errors.role && (
                  <p className="text-sm text-destructive flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{form.formState.errors.role.message}</span>
                  </p>
                )}
              </div>

              {/* Login Form */}
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      {...form.register('email')}
                      type="email"
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{form.formState.errors.email.message}</span>
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      {...form.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-12 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-sm text-destructive flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{form.formState.errors.password.message}</span>
                    </p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      {...form.register('rememberMe')}
                      type="checkbox"
                      className="rounded border-border"
                    />
                    <span className="text-sm text-muted-foreground">Remember me</span>
                  </label>
                  <Link 
                    href="/auth/forgot-password"
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Error Message */}
                {loginError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>{loginError}</span>
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 font-medium"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>

              {/* Demo Accounts */}
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Quick Access Demo Accounts
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {demoAccounts.map((account) => {
                    const Icon = account.icon;
                    
                    return (
                      <button
                        key={account.role}
                        type="button"
                        onClick={() => fillDemoCredentials(account)}
                        className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-1.5 rounded ${account.bgColor}`}>
                            <Icon className={`h-4 w-4 ${account.color}`} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{account.name}</p>
                            <p className="text-xs text-muted-foreground">{account.description}</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link 
                    href="/auth/signup"
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Sign up here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      )}
    </div>
  );
}