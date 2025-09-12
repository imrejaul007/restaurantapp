'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/lib/auth/auth-provider';
import toast from 'react-hot-toast';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: any;
  timestamp: Date;
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  notifications: Notification[];
  clearNotifications: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  notifications: [],
  clearNotifications: () => {},
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Try to get user, but don't throw error if AuthProvider is not available
  let user = null;
  let token = null;
  try {
    const auth = useAuth();
    user = auth.user;
    token = auth.token;
  } catch (error) {
    // AuthProvider not available, which is fine
  }

  useEffect(() => {
    if (user && token) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3000';
      const newSocket = io(socketUrl, {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        setConnected(false);
      });

      newSocket.on('connected', (data) => {
        toast.success('Connected to real-time notifications');
      });

      newSocket.on('error', (error) => {
        // Socket error handled silently
      });

      // Real-time order notifications
      newSocket.on('orderStatusUpdate', (data) => {
        const notification: Notification = {
          id: Date.now(),
          type: 'order-update',
          title: 'Order Status Updated',
          message: `Order ${data.orderNumber || data.orderId} status changed to ${data.status}`,
          data,
          timestamp: new Date(),
        };
        setNotifications(prev => [...prev, notification]);
        toast.success(notification.message, {
          icon: '📦',
          duration: 5000,
        });
      });

      newSocket.on('newOrder', (data) => {
        const notification: Notification = {
          id: Date.now(),
          type: 'new-order',
          title: 'New Order Received',
          message: `New order #${data.orderNumber} from ${data.customerName}`,
          data,
          timestamp: new Date(),
        };
        setNotifications(prev => [...prev, notification]);
        toast.success(notification.message, {
          icon: '🍽️',
          duration: 5000,
        });
      });

      newSocket.on('notification', (data) => {
        const notification: Notification = {
          id: Date.now(),
          type: 'notification',
          title: data.title || 'Notification',
          message: data.message || data.content,
          data,
          timestamp: new Date(),
        };
        setNotifications(prev => [...prev, notification]);
        toast(notification.message, {
          icon: '🔔',
          duration: 4000,
        });
      });

      // Handle pending notifications
      newSocket.on('pendingNotifications', (pendingNotifications) => {
        const mappedNotifications: Notification[] = pendingNotifications.map((notification: any) => ({
          id: notification.id,
          type: 'pending',
          title: notification.title,
          message: notification.content,
          data: notification.data,
          timestamp: new Date(notification.createdAt),
        }));
        setNotifications(prev => [...prev, ...mappedNotifications]);
        if (mappedNotifications.length > 0) {
          toast(`You have ${mappedNotifications.length} pending notifications`, {
            icon: '📬',
          });
        }
      });

      // Auto-join user room
      newSocket.emit('joinRoom', { room: user.id });
      
      // Auto-join role room  
      newSocket.emit('joinRoom', { room: `role:${user.role}` });

      // Auto-join restaurant room if user is restaurant owner
      if (user.role === 'RESTAURANT' && user.restaurant?.id) {
        newSocket.emit('joinRoom', { room: `restaurant:${user.restaurant.id}` });
      }

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [user, token]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <SocketContext.Provider value={{ 
      socket, 
      connected, 
      notifications, 
      clearNotifications 
    }}>
      {children}
    </SocketContext.Provider>
  );
}