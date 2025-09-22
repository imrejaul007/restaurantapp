'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CreditCard,
  Smartphone,
  Wifi,
  Settings,
  CheckCircle,
  AlertCircle,
  Link2,
  TestTube,
  Zap,
  Plug,
  Shield,
  FileText,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Plus,
  Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface POSProvider {
  id: string;
  name: string;
  logo: string;
  type: 'hardware' | 'software' | 'hybrid';
  status: 'connected' | 'disconnected' | 'error';
  isActive: boolean;
  features: string[];
  setupDate?: string;
  lastSync?: string;
}

interface POSTerminal {
  id: string;
  name: string;
  location: string;
  type: 'main' | 'mobile' | 'kiosk';
  status: 'online' | 'offline' | 'maintenance';
  ipAddress: string;
  version: string;
  lastActivity: string;
}

const mockPOSProviders: POSProvider[] = [
  {
    id: 'square',
    name: 'Square POS',
    logo: '🟦',
    type: 'hybrid',
    status: 'connected',
    isActive: true,
    features: ['Payment Processing', 'Inventory Sync', 'Analytics', 'Customer Management'],
    setupDate: '2024-01-15',
    lastSync: '2024-01-20 14:30'
  },
  {
    id: 'toast',
    name: 'Toast POS',
    logo: '🍞',
    type: 'software',
    status: 'disconnected',
    isActive: false,
    features: ['Order Management', 'Staff Management', 'Reporting', 'Menu Sync']
  },
  {
    id: 'clover',
    name: 'Clover',
    logo: '🍀',
    type: 'hardware',
    status: 'error',
    isActive: false,
    features: ['Card Processing', 'Cash Management', 'Receipt Printing', 'Customer Display']
  }
];

const mockTerminals: POSTerminal[] = [
  {
    id: 'terminal-01',
    name: 'Main Counter',
    location: 'Front Desk',
    type: 'main',
    status: 'online',
    ipAddress: '192.168.1.100',
    version: '2.4.1',
    lastActivity: '2024-01-20 14:35'
  },
  {
    id: 'terminal-02',
    name: 'Waiter Station',
    location: 'Dining Area',
    type: 'mobile',
    status: 'online',
    ipAddress: '192.168.1.101',
    version: '2.4.1',
    lastActivity: '2024-01-20 14:32'
  },
  {
    id: 'terminal-03',
    name: 'Kitchen Display',
    location: 'Kitchen',
    type: 'kiosk',
    status: 'maintenance',
    ipAddress: '192.168.1.102',
    version: '2.3.8',
    lastActivity: '2024-01-20 12:15'
  }
];

export default function POSIntegrationSettings() {
  const [providers, setProviders] = useState<POSProvider[]>(mockPOSProviders);
  const [terminals, setTerminals] = useState<POSTerminal[]>(mockTerminals);
  const [isAddProviderOpen, setIsAddProviderOpen] = useState(false);
  const [isAddTerminalOpen, setIsAddTerminalOpen] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [syncingData, setSyncingData] = useState<string | null>(null);

  const [newProvider, setNewProvider] = useState({
    name: '',
    apiKey: '',
    secretKey: '',
    environment: 'sandbox'
  });

  const [newTerminal, setNewTerminal] = useState({
    name: '',
    location: '',
    type: 'main',
    ipAddress: ''
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'online':
        return 'bg-green-500';
      case 'disconnected':
      case 'offline':
        return 'bg-gray-500';
      case 'error':
      case 'maintenance':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'disconnected':
      case 'offline':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      case 'error':
      case 'maintenance':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const toggleProvider = (id: string) => {
    setProviders(prev =>
      prev.map(provider =>
        provider.id === id
          ? { ...provider, isActive: !provider.isActive }
          : provider
      )
    );
  };

  const testConnection = async (providerId: string) => {
    setTestingConnection(providerId);
    setTimeout(() => {
      setProviders(prev =>
        prev.map(provider =>
          provider.id === providerId
            ? { ...provider, status: 'connected', lastSync: new Date().toLocaleString() }
            : provider
        )
      );
      setTestingConnection(null);
    }, 3000);
  };

  const syncData = async (providerId: string) => {
    setSyncingData(providerId);
    setTimeout(() => {
      setProviders(prev =>
        prev.map(provider =>
          provider.id === providerId
            ? { ...provider, lastSync: new Date().toLocaleString() }
            : provider
        )
      );
      setSyncingData(null);
    }, 2000);
  };

  const addProvider = () => {
    const provider: POSProvider = {
      id: `provider-${Date.now()}`,
      name: newProvider.name,
      logo: '🔗',
      type: 'software',
      status: 'disconnected',
      isActive: false,
      features: ['Payment Processing', 'Order Management'],
      setupDate: new Date().toLocaleDateString()
    };

    setProviders(prev => [...prev, provider]);
    setNewProvider({ name: '', apiKey: '', secretKey: '', environment: 'sandbox' });
    setIsAddProviderOpen(false);
  };

  const addTerminal = () => {
    const terminal: POSTerminal = {
      id: `terminal-${Date.now()}`,
      name: newTerminal.name,
      location: newTerminal.location,
      type: newTerminal.type as any,
      status: 'offline',
      ipAddress: newTerminal.ipAddress,
      version: '2.4.1',
      lastActivity: new Date().toLocaleString()
    };

    setTerminals(prev => [...prev, terminal]);
    setNewTerminal({ name: '', location: '', type: 'main', ipAddress: '' });
    setIsAddTerminalOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">POS Integration Settings</h1>
            <p className="text-muted-foreground mt-1">
              Configure and manage your Point of Sale system integrations
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button variant="outline" size="default">
              <Download className="h-4 w-4 mr-2" />
              Export Config
            </Button>
            <Button variant="outline" size="default">
              <Upload className="h-4 w-4 mr-2" />
              Import Config
            </Button>
            <Button variant="outline" size="default">
              <FileText className="h-4 w-4 mr-2" />
              Documentation
            </Button>
          </div>
        </div>

        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="providers">POS Providers</TabsTrigger>
            <TabsTrigger value="terminals">Terminals</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          {/* POS Providers Tab */}
          <TabsContent value="providers" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Connected Providers</h2>
              <Dialog open={isAddProviderOpen} onOpenChange={setIsAddProviderOpen}>
                <DialogTrigger asChild>
                  <Button size="default">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Provider
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add POS Provider</DialogTitle>
                    <DialogDescription>
                      Connect a new POS system to your restaurant
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="provider-name">Provider Name</Label>
                      <Input
                        id="provider-name"
                        value={newProvider.name}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Square, Toast, Clover"
                      />
                    </div>
                    <div>
                      <Label htmlFor="api-key">API Key</Label>
                      <Input
                        id="api-key"
                        type="password"
                        value={newProvider.apiKey}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="Enter API key"
                      />
                    </div>
                    <div>
                      <Label htmlFor="secret-key">Secret Key</Label>
                      <Input
                        id="secret-key"
                        type="password"
                        value={newProvider.secretKey}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, secretKey: e.target.value }))}
                        placeholder="Enter secret key"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={addProvider} className="flex-1">
                        Connect Provider
                      </Button>
                      <Button variant="outline" onClick={() => setIsAddProviderOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((provider) => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={cn(
                    "relative",
                    provider.isActive && "ring-2 ring-primary"
                  )}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{provider.logo}</div>
                          <div>
                            <CardTitle className="text-lg">{provider.name}</CardTitle>
                            <CardDescription className="flex items-center space-x-2">
                              {getStatusIcon(provider.status)}
                              <span className="capitalize">{provider.status}</span>
                            </CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={provider.isActive}
                          onCheckedChange={() => toggleProvider(provider.id)}
                        />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge variant="outline" className="capitalize">
                          {provider.type}
                        </Badge>
                      </div>

                      {provider.setupDate && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Setup Date:</span>
                          <span>{provider.setupDate}</span>
                        </div>
                      )}

                      {provider.lastSync && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Last Sync:</span>
                          <span>{provider.lastSync}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <span className="text-sm font-medium">Features:</span>
                        <div className="flex flex-wrap gap-1">
                          {provider.features.map((feature, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testConnection(provider.id)}
                          disabled={testingConnection === provider.id}
                          className="flex-1"
                        >
                          {testingConnection === provider.id ? (
                            <>
                              <TestTube className="h-3 w-3 mr-1 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            <>
                              <TestTube className="h-3 w-3 mr-1" />
                              Test
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => syncData(provider.id)}
                          disabled={syncingData === provider.id || provider.status !== 'connected'}
                          className="flex-1"
                        >
                          {syncingData === provider.id ? (
                            <>
                              <RotateCcw className="h-3 w-3 mr-1 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Sync
                            </>
                          )}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Terminals Tab */}
          <TabsContent value="terminals" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">POS Terminals</h2>
              <Dialog open={isAddTerminalOpen} onOpenChange={setIsAddTerminalOpen}>
                <DialogTrigger asChild>
                  <Button size="default">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Terminal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add POS Terminal</DialogTitle>
                    <DialogDescription>
                      Register a new terminal device
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="terminal-name">Terminal Name</Label>
                      <Input
                        id="terminal-name"
                        value={newTerminal.name}
                        onChange={(e) => setNewTerminal(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Main Counter, Waiter Station"
                      />
                    </div>
                    <div>
                      <Label htmlFor="terminal-location">Location</Label>
                      <Input
                        id="terminal-location"
                        value={newTerminal.location}
                        onChange={(e) => setNewTerminal(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="e.g., Front Desk, Kitchen"
                      />
                    </div>
                    <div>
                      <Label htmlFor="terminal-ip">IP Address</Label>
                      <Input
                        id="terminal-ip"
                        value={newTerminal.ipAddress}
                        onChange={(e) => setNewTerminal(prev => ({ ...prev, ipAddress: e.target.value }))}
                        placeholder="192.168.1.100"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={addTerminal} className="flex-1">
                        Add Terminal
                      </Button>
                      <Button variant="outline" onClick={() => setIsAddTerminalOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {terminals.map((terminal) => (
                <motion.div
                  key={terminal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            {terminal.type === 'main' && <CreditCard className="h-5 w-5 text-blue-600" />}
                            {terminal.type === 'mobile' && <Smartphone className="h-5 w-5 text-blue-600" />}
                            {terminal.type === 'kiosk' && <Settings className="h-5 w-5 text-blue-600" />}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{terminal.name}</CardTitle>
                            <CardDescription>{terminal.location}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(terminal.status)}
                          <Badge
                            className={cn("text-white text-xs", getStatusColor(terminal.status))}
                          >
                            {terminal.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <p className="font-medium capitalize">{terminal.type}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Version:</span>
                          <p className="font-medium">{terminal.version}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">IP Address:</span>
                          <p className="font-medium">{terminal.ipAddress}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Activity:</span>
                          <p className="font-medium">{terminal.lastActivity}</p>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Wifi className="h-3 w-3 mr-1" />
                          Ping
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Restart
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Security Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable API Encryption</Label>
                      <p className="text-sm text-muted-foreground">Encrypt all API communications</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Authentication</Label>
                      <p className="text-sm text-muted-foreground">Require auth for all requests</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Log All Transactions</Label>
                      <p className="text-sm text-muted-foreground">Keep detailed transaction logs</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Performance Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="sync-interval">Sync Interval (minutes)</Label>
                    <Input id="sync-interval" type="number" defaultValue="5" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="timeout">Connection Timeout (seconds)</Label>
                    <Input id="timeout" type="number" defaultValue="30" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="retry-attempts">Retry Attempts</Label>
                    <Input id="retry-attempts" type="number" defaultValue="3" className="mt-1" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Monitor POS integration activity and events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { time: '14:35', event: 'Payment processed', details: 'Square POS - $45.99', type: 'success' },
                    { time: '14:30', event: 'Menu sync completed', details: 'Toast POS - 150 items', type: 'info' },
                    { time: '14:25', event: 'Connection error', details: 'Clover Terminal - Timeout', type: 'error' },
                    { time: '14:20', event: 'Order transmitted', details: 'Square POS - Order #2024-001', type: 'success' },
                    { time: '14:15', event: 'Terminal restarted', details: 'Kitchen Display - Terminal-03', type: 'warning' }
                  ].map((log, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        log.type === 'success' && "bg-green-500",
                        log.type === 'error' && "bg-red-500",
                        log.type === 'warning' && "bg-yellow-500",
                        log.type === 'info' && "bg-blue-500"
                      )} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{log.event}</span>
                          <span className="text-sm text-muted-foreground">{log.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{log.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}