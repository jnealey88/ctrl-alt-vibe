import { Express, Request, Response } from 'express';
import { storage } from '../storage';
import { notificationService } from '../services';
import { isAuthenticated } from '../middleware/auth';

export function registerNotificationRoutes(app: Express) {
  const apiPrefix = '/api';
  
  // Get user notifications
  app.get(`${apiPrefix}/notifications`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const unreadOnly = req.query.unreadOnly === 'true';
      
      // Use the notification service instead of direct storage access
      const result = await notificationService.getUserNotifications(userId, { limit, offset, unreadOnly });
      res.json(result);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });
  
  // Get unread notifications count
  app.get(`${apiPrefix}/notifications/count`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.json({ count: 0 });
      }
      
      const userId = req.user!.id;
      const count = await notificationService.getUnreadNotificationsCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
      res.status(500).json({ message: 'Failed to fetch notifications count' });
    }
  });
  
  // Mark notification as read
  app.patch(`${apiPrefix}/notifications/:id`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: 'Invalid notification ID' });
      }
      
      const userId = req.user!.id;
      const success = await notificationService.markNotificationAsRead(notificationId, userId);
      
      if (success) {
        res.json({ message: 'Notification marked as read' });
      } else {
        res.status(404).json({ message: 'Notification not found' });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to update notification' });
    }
  });
  
  // Mark all notifications as read
  app.patch(`${apiPrefix}/notifications`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const userId = req.user!.id;
      const success = await storage.markAllNotificationsAsRead(userId);
      
      if (success) {
        res.json({ message: 'All notifications marked as read' });
      } else {
        res.status(500).json({ message: 'Failed to mark notifications as read' });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Failed to update notifications' });
    }
  });
  
  // Delete notification
  app.delete(`${apiPrefix}/notifications/:id`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: 'Invalid notification ID' });
      }
      
      const userId = req.user!.id;
      const success = await storage.deleteNotification(notificationId, userId);
      
      if (success) {
        res.json({ message: 'Notification deleted' });
      } else {
        res.status(404).json({ message: 'Notification not found' });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: 'Failed to delete notification' });
    }
  });
  
  return app;
}
