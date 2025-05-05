import { db } from '@db';
import { 
  notifications, 
  notificationTypes,
  type Notification,
  type InsertNotification
} from '@shared/schema';
import { eq, and, desc, count, inArray, not, isNull } from 'drizzle-orm';
import { pagination } from '../config';

export class NotificationService {
  /**
   * Create a new notification
   * @param data Notification data
   * @returns Created notification
   */
  async createNotification(data: {
    userId: number;    // User receiving the notification
    actorId?: number;  // User causing the notification (e.g., commenter)
    type: string;      // Type of notification (from notificationTypes)
    projectId?: number; // Related project if any
    commentId?: number; // Related comment if any
    replyId?: number;   // Related reply if any
  }): Promise<Notification> {
    // Validate notification type
    if (!Object.values(notificationTypes).includes(data.type)) {
      throw new Error(`Invalid notification type: ${data.type}`);
    }

    // Create notification
    const [notification] = await db.insert(notifications)
      .values({
        userId: data.userId,
        actorId: data.actorId,
        type: data.type,
        projectId: data.projectId,
        commentId: data.commentId,
        replyId: data.replyId,
        read: false,
        createdAt: new Date()
      })
      .returning();
    
    // Load associated data
    const fullNotification = await this.enrichNotification(notification);
    
    return fullNotification;
  }

  /**
   * Get notifications for a user
   * @param userId User ID
   * @param options Pagination and filtering options
   * @returns Notifications with total count
   */
  async getUserNotifications(userId: number, options: { 
    limit?: number; 
    offset?: number; 
    unreadOnly?: boolean;
  } = {}): Promise<{ notifications: Notification[]; total: number }> {
    const { 
      limit = pagination.defaultLimit, 
      offset = 0, 
      unreadOnly = false 
    } = options;
    
    // Build query
    let query = db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId));
    
    // Add read filter if needed
    if (unreadOnly) {
      query = query.where(eq(notifications.read, false));
    }
    
    // Count total
    const countQuery = db.select({ count: count() })
      .from(notifications)
      .where(query._entities[0].value); // Reuse the where conditions
    
    // Add ordering and pagination
    query = query
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Execute queries
    const [results, countResult] = await Promise.all([
      query,
      countQuery
    ]);
    
    // Enrich notifications with related data
    const enrichedNotifications = await Promise.all(
      results.map(notification => this.enrichNotification(notification))
    );
    
    return {
      notifications: enrichedNotifications,
      total: countResult[0].count
    };
  }

  /**
   * Get count of unread notifications
   * @param userId User ID
   * @returns Count of unread notifications
   */
  async getUnreadNotificationsCount(userId: number): Promise<number> {
    const result = await db.select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      ));
    
    return result[0].count;
  }

  /**
   * Mark a notification as read
   * @param notificationId Notification ID
   * @param userId User ID (for authorization)
   * @returns Success indicator
   */
  async markNotificationAsRead(notificationId: number, userId: number): Promise<boolean> {
    const [notification] = await db.update(notifications)
      .set({ read: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ))
      .returning();
    
    return !!notification;
  }

  /**
   * Mark all notifications as read for a user
   * @param userId User ID
   * @returns Success indicator
   */
  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ read: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      ));
    
    return true;
  }

  /**
   * Delete a notification
   * @param notificationId Notification ID
   * @param userId User ID (for authorization)
   * @returns Success indicator
   */
  async deleteNotification(notificationId: number, userId: number): Promise<boolean> {
    const result = await db.delete(notifications)
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));
    
    return result.rowCount > 0;
  }

  /**
   * Enrich a notification with related data
   * Helper method to load actor, project, comment details
   */
  private async enrichNotification(notification: any): Promise<Notification> {
    // Start with the base notification
    const enriched: Notification = {
      ...notification,
      actor: undefined,
      project: undefined,
      comment: undefined,
      reply: undefined
    };

    // Load actor information if present
    if (notification.actorId) {
      const actor = await db.query.users.findFirst({
        where: eq('id', notification.actorId),
        columns: {
          id: true,
          username: true,
          avatarUrl: true
        }
      });
      
      if (actor) {
        enriched.actor = actor;
      }
    }

    // Load project information if present
    if (notification.projectId) {
      const project = await db.query.projects.findFirst({
        where: eq('id', notification.projectId),
        columns: {
          id: true,
          title: true
        }
      });
      
      if (project) {
        enriched.project = project;
      }
    }

    // Load comment information if present
    if (notification.commentId) {
      const comment = await db.query.comments.findFirst({
        where: eq('id', notification.commentId),
        columns: {
          id: true,
          content: true
        }
      });
      
      if (comment) {
        enriched.comment = comment;
      }
    }

    // Load reply information if present
    if (notification.replyId) {
      const reply = await db.query.commentReplies.findFirst({
        where: eq('id', notification.replyId),
        columns: {
          id: true,
          content: true
        }
      });
      
      if (reply) {
        enriched.reply = reply;
      }
    }

    return enriched;
  }
  
  /**
   * Send a real-time notification via WebSocket
   * @param userId User ID to send notification to
   * @param notification Notification data
   */
  sendRealTimeNotification(userId: number, notification: any): void {
    const sendNotification = (global as any).sendNotificationToUser;
    if (typeof sendNotification === 'function') {
      sendNotification(userId, notification);
    }
  }
}
