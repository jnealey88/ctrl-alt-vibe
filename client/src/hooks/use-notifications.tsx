import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';

type Notification = {
  id: number;
  type: string;
  read: boolean;
  createdAt: string;
  actor?: {
    id: number;
    username: string;
    avatarUrl?: string;
  };
  project?: {
    id: number;
    title: string;
  };
  comment?: {
    id: number;
    content: string;
  };
  reply?: {
    id: number;
    content: string;
  };
};

type NotificationsResponse = {
  notifications: Notification[];
  total: number;
};

export function useNotifications() {
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  
  // Get notifications count
  const { data: countData, isLoading: isCountLoading } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/count'],
  });
  
  // Get notifications list with optional filters
  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ['/api/notifications', { unreadOnly }],
    enabled: true
  });
  
  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest('PATCH', `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    },
  });
  
  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('PATCH', '/api/notifications');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    },
  });
  
  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest('DELETE', `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    },
  });
  
  return {
    notifications: data?.notifications || [],
    totalNotifications: data?.total || 0,
    unreadCount: countData?.count || 0,
    isLoading,
    isCountLoading,
    unreadOnly,
    setUnreadOnly,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
  };
}
