import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import { useWebSocketNotifications } from './use-websocket-notifications';
import { toast } from './use-toast';

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // Initialize WebSocket connection for real-time notifications
  const { status: wsStatus } = useWebSocketNotifications();
  
  // Get notifications
  const {
    data: notificationsData,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      if (!user) return { notifications: [], total: 0 };
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds as a fallback
    refetchOnWindowFocus: true
  });
  
  // Get unread count
  const {
    data: countData,
    isLoading: isCountLoading,
    isError: isCountError
  } = useQuery({
    queryKey: ['/api/notifications/count'],
    queryFn: async () => {
      if (!user) return { count: 0 };
      const res = await fetch('/api/notifications/count');
      if (!res.ok) throw new Error('Failed to fetch notification count');
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds as a fallback
    refetchOnWindowFocus: true
  });
  
  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Failed to mark notification as read');
      return res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh notification data
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    },
    onError: (error) => {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive'
      });
    }
  });
  
  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Failed to mark all notifications as read');
      return res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh notification data
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
        variant: 'default'
      });
    },
    onError: (error) => {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive'
      });
    }
  });
  
  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete notification');
      return res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh notification data
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    },
    onError: (error) => {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive'
      });
    }
  });
  
  return {
    notifications: notificationsData?.notifications || [],
    total: notificationsData?.total || 0,
    unreadCount: countData?.count || 0,
    isLoading,
    isError,
    isCountLoading,
    isCountError,
    wsStatus,
    markAsRead: (id: number) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    deleteNotification: (id: number) => deleteNotificationMutation.mutate(id)
  };
}
