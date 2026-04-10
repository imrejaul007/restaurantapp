'use client';

import React, { useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function MessagesPage() {
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No messages yet</h2>
            <p className="text-muted-foreground mb-6">
              Messaging between restaurants, employees, and vendors is coming soon. Check back later.
            </p>
            <Button disabled className="opacity-50 cursor-not-allowed">
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
