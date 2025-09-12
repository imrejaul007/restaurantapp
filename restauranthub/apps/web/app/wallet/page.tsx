'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function WalletPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-foreground mb-4">Wallet & Credits</h1>
        <div className="bg-card rounded-lg shadow p-6">
          <p className="text-muted-foreground">
            Wallet system coming soon. This feature will allow you to:
          </p>
          <ul className="mt-4 space-y-2 text-muted-foreground">
            <li>• Add money to your wallet</li>
            <li>• View transaction history</li>
            <li>• Manage credit lines</li>
            <li>• Track cashback and rewards</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}