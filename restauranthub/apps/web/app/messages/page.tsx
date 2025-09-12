'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  Plus,
  Send,
  Phone,
  Video,
  MoreHorizontal,
  Paperclip,
  Smile,
  Star,
  Archive,
  Trash2,
  User,
  Building2,
  Package,
  Users,
  Circle,
  Check,
  CheckCheck,
  Image as ImageIcon,
  File,
  MapPin,
  Calendar
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatDate, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-provider';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'location';
  status: 'sent' | 'delivered' | 'read';
  attachments?: {
    type: 'image' | 'file';
    url: string;
    name: string;
    size?: string;
  }[];
}

interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    avatar?: string;
    role: 'admin' | 'restaurant' | 'employee' | 'vendor';
    status: 'online' | 'offline' | 'away';
  }[];
  lastMessage: Message;
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
  pinned: boolean;
  archived: boolean;
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    participants: [
      {
        id: 'restaurant-1',
        name: 'Mumbai Spice Restaurant',
        role: 'restaurant',
        status: 'online'
      }
    ],
    lastMessage: {
      id: '1',
      content: 'Thanks for your application for Senior Head Chef. We\'d like to schedule an interview this Friday at 2 PM.',
      senderId: 'restaurant-1',
      senderName: 'Mumbai Spice Restaurant',
      timestamp: '2024-01-10T14:30:00Z',
      type: 'text',
      status: 'delivered'
    },
    unreadCount: 1,
    isGroup: false,
    pinned: true,
    archived: false
  },
  {
    id: '2',
    participants: [
      {
        id: 'restaurant-2',
        name: 'The Grand Hotel',
        role: 'restaurant',
        status: 'online'
      }
    ],
    lastMessage: {
      id: '2',
      content: 'Your profile looks great for our Sous Chef position. Can you tell me about your experience with fine dining?',
      senderId: 'restaurant-2',
      senderName: 'The Grand Hotel',
      timestamp: '2024-01-10T13:15:00Z',
      type: 'text',
      status: 'read'
    },
    unreadCount: 0,
    isGroup: false,
    pinned: false,
    archived: false
  },
  {
    id: '3',
    participants: [
      {
        id: 'restaurant-3',
        name: 'Cafe Delight',
        role: 'restaurant',
        status: 'away'
      }
    ],
    lastMessage: {
      id: '3',
      content: 'We received your application for Barista position. The salary range is ₹25,000 - ₹30,000. Are you comfortable with this?',
      senderId: 'restaurant-3',
      senderName: 'Cafe Delight',
      timestamp: '2024-01-10T11:45:00Z',
      type: 'text',
      status: 'read'
    },
    unreadCount: 0,
    isGroup: false,
    pinned: false,
    archived: false
  },
  {
    id: '4',
    participants: [
      {
        id: 'employee-1',
        name: 'Rahul Sharma',
        role: 'employee',
        status: 'online'
      }
    ],
    lastMessage: {
      id: '4',
      content: 'Thank you for considering my application. I have 8+ years experience and would love to join your team.',
      senderId: 'employee-1',
      senderName: 'Rahul Sharma',
      timestamp: '2024-01-10T10:30:00Z',
      type: 'text',
      status: 'sent'
    },
    unreadCount: 2,
    isGroup: false,
    pinned: false,
    archived: false
  },
  {
    id: '5',
    participants: [
      {
        id: 'employee-2',
        name: 'Priya Patel',
        role: 'employee',
        status: 'offline'
      }
    ],
    lastMessage: {
      id: '5',
      content: 'I\'m very interested in the Restaurant Manager position. When can we discuss the role in detail?',
      senderId: 'employee-2',
      senderName: 'Priya Patel',
      timestamp: '2024-01-09T16:20:00Z',
      type: 'text',
      status: 'delivered'
    },
    unreadCount: 0,
    isGroup: false,
    pinned: false,
    archived: false
  }
];

const mockMessages: Message[] = [
  {
    id: '1',
    content: 'Hi! Thank you for considering my application for the Senior Head Chef position.',
    senderId: 'employee-1',
    senderName: 'Rahul Sharma',
    timestamp: '2024-01-10T10:00:00Z',
    type: 'text',
    status: 'read'
  },
  {
    id: '2',
    content: 'Hello Rahul! We reviewed your resume and were impressed with your experience at The Taj Group. Can you tell us more about your specialties?',
    senderId: 'restaurant-1',
    senderName: 'Mumbai Spice Restaurant',
    timestamp: '2024-01-10T10:15:00Z',
    type: 'text',
    status: 'read'
  },
  {
    id: '3',
    content: 'I specialize in North Indian, South Indian, and Maharashtrian cuisines. I have 8+ years of experience in fine dining and can manage teams of up to 15 staff members.',
    senderId: 'employee-1',
    senderName: 'Rahul Sharma',
    timestamp: '2024-01-10T10:30:00Z',
    type: 'text',
    status: 'read'
  },
  {
    id: '4',
    content: 'That sounds perfect for our restaurant! We specialize in authentic regional Indian cuisine. What\'s your expected salary range?',
    senderId: 'restaurant-1',
    senderName: 'Mumbai Spice Restaurant',
    timestamp: '2024-01-10T11:00:00Z',
    type: 'text',
    status: 'read'
  },
  {
    id: '5',
    content: 'I\'m looking for something in the range of ₹50,000 - ₹60,000 per month, based on my experience and the responsibilities involved.',
    senderId: 'employee-1',
    senderName: 'Rahul Sharma',
    timestamp: '2024-01-10T11:15:00Z',
    type: 'text',
    status: 'read'
  },
  {
    id: '6',
    content: 'That works within our budget. Would you be available for an interview this Friday at 2 PM? We\'d like to meet you in person and show you our kitchen.',
    senderId: 'restaurant-1',
    senderName: 'Mumbai Spice Restaurant',
    timestamp: '2024-01-10T14:30:00Z',
    type: 'text',
    status: 'delivered'
  }
];

export default function MessagesPage() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string>('1');
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredConversations = mockConversations.filter(conversation => {
    const participantNames = conversation.participants.map(p => p.name.toLowerCase());
    const groupName = conversation.groupName?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    
    return participantNames.some(name => name.includes(searchLower)) || 
           groupName.includes(searchLower) ||
           conversation.lastMessage.content.toLowerCase().includes(searchLower);
  });

  const selectedConv = mockConversations.find(c => c.id === selectedConversation);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    // Here you would send the message via WebSocket/API
    console.log('Sending message:', newMessage);
    setNewMessage('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'restaurant':
        return <Building2 className="h-4 w-4" />;
      case 'employee':
        return <Users className="h-4 w-4" />;
      case 'vendor':
        return <Package className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'restaurant':
        return 'text-green-600';
      case 'employee':
        return 'text-purple-600';
      case 'vendor':
        return 'text-orange-600';
      default:
        return 'text-blue-600';
    }
  };

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-primary" />;
      default:
        return <Circle className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-success-500';
      case 'away':
        return 'bg-warning-500';
      case 'offline':
        return 'bg-muted-foreground';
      default:
        return 'bg-muted-foreground';
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex bg-background">
        
        {/* Conversations Sidebar */}
        <div className="w-80 border-r border-border flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-foreground">Messages</h1>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'p-4 cursor-pointer border-b border-border/50 hover:bg-accent/50 transition-colors',
                  selectedConversation === conversation.id ? 'bg-accent' : ''
                )}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {getRoleIcon(conversation.participants[0]?.role)}
                    </div>
                    <div className={cn(
                      'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background',
                      getStatusColor(conversation.participants[0]?.status)
                    )} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-foreground truncate">
                        {conversation.isGroup 
                          ? conversation.groupName 
                          : conversation.participants[0]?.name
                        }
                      </h3>
                      <div className="flex items-center space-x-1">
                        {conversation.pinned && (
                          <Star className="h-3 w-3 text-warning-500 fill-warning-500" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(conversation.lastMessage.timestamp, {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage.content}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 font-medium">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConv ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {getRoleIcon(selectedConv.participants[0]?.role)}
                    </div>
                    <div className={cn(
                      'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background',
                      getStatusColor(selectedConv.participants[0]?.status)
                    )} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">
                      {selectedConv.participants[0]?.name}
                    </h2>
                    <p className="text-sm text-muted-foreground capitalize">
                      {selectedConv.participants[0]?.status} • {selectedConv.participants[0]?.role}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {mockMessages.map((message) => {
                const isOwn = message.senderId === user?.id;
                
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex',
                      isOwn ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div className={cn(
                      'max-w-xs lg:max-w-md px-4 py-2 rounded-2xl',
                      isOwn 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-foreground'
                    )}>
                      <p className="text-sm">{message.content}</p>
                      <div className={cn(
                        'flex items-center justify-end space-x-1 mt-1',
                        isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      )}>
                        <span className="text-xs">
                          {formatDate(message.timestamp, {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {isOwn && getStatusIcon(message.status)}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-background">
              <div className="flex items-end space-x-2">
                <Button variant="ghost" size="sm" className="p-2">
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 pr-12 border border-border rounded-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 p-2"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  size="sm"
                  className="p-2"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Empty State
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No conversation selected</h3>
              <p className="text-muted-foreground">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}