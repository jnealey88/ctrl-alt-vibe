import { Express, Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { ValidationError, fromZodError } from 'zod-validation-error';
import { commentInsertSchema, replyInsertSchema } from '@shared/schema';
import { isAuthenticated } from '../middleware/auth';

export function registerCommentRoutes(app: Express) {
  const apiPrefix = '/api';
  
  // Like a comment
  app.post(`${apiPrefix}/comments/:id/like`, isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      if (isNaN(commentId)) {
        return res.status(400).json({ message: 'Invalid comment ID' });
      }
      
      const userId = req.user!.id;
      
      await storage.likeComment(commentId, userId);
      
      // Create notification for comment author
      // First get the comment to find its author
      const comment = (await storage.getProjectComments(0, userId, commentId))[0];
      
      if (comment && comment.author.id !== userId) {
        await storage.createNotification({
          userId: comment.author.id,
          actorId: userId,
          type: 'like_comment',
          commentId
        });
        
        // Send real-time notification if user is connected
        const sendNotification = (global as any).sendNotificationToUser;
        if (typeof sendNotification === 'function') {
          const notification = {
            type: 'like_comment',
            actor: {
              id: userId,
              username: req.user!.username,
              avatarUrl: req.user!.avatarUrl
            },
            comment: {
              id: commentId,
              content: comment.content.substring(0, 50) + (comment.content.length > 50 ? '...' : '')
            },
            createdAt: new Date().toISOString()
          };
          sendNotification(comment.author.id, notification);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error liking comment:', error);
      res.status(500).json({ message: 'Failed to like comment' });
    }
  });
  
  // Unlike a comment
  app.delete(`${apiPrefix}/comments/:id/like`, isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      if (isNaN(commentId)) {
        return res.status(400).json({ message: 'Invalid comment ID' });
      }
      
      const userId = req.user!.id;
      
      await storage.unlikeComment(commentId, userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error unliking comment:', error);
      res.status(500).json({ message: 'Failed to unlike comment' });
    }
  });
  
  // Create reply to a comment
  app.post(`${apiPrefix}/comments/:id/replies`, isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      if (isNaN(commentId)) {
        return res.status(400).json({ message: 'Invalid comment ID' });
      }
      
      const { content } = req.body;
      if (!content || content.trim() === '') {
        return res.status(400).json({ message: 'Reply content cannot be empty' });
      }
      
      const userId = req.user!.id;
      
      // Validate using schema
      try {
        replyInsertSchema.parse({
          content,
          commentId,
          authorId: userId
        });
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          const prettyError = fromZodError(validationError);
          return res.status(400).json({ message: prettyError.message });
        }
        throw validationError;
      }
      
      // Create reply
      const reply = await storage.createCommentReply({
        content,
        commentId,
        authorId: userId
      });
      
      // Record activity
      await storage.recordUserActivity(userId, 'reply_created', reply.id);
      
      // Create notification for comment author
      // First get the comment to find its author
      const comment = (await storage.getProjectComments(0, userId, commentId))[0];
      
      if (comment && comment.author.id !== userId) {
        await storage.createNotification({
          userId: comment.author.id,
          actorId: userId,
          type: 'reply_comment',
          commentId,
          replyId: reply.id
        });
        
        // Send real-time notification if user is connected
        const sendNotification = (global as any).sendNotificationToUser;
        if (typeof sendNotification === 'function') {
          const notification = {
            type: 'reply_comment',
            actor: {
              id: userId,
              username: req.user!.username,
              avatarUrl: req.user!.avatarUrl
            },
            comment: {
              id: commentId,
              content: comment.content.substring(0, 50) + (comment.content.length > 50 ? '...' : '')
            },
            reply: {
              id: reply.id,
              content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
            },
            createdAt: new Date().toISOString()
          };
          sendNotification(comment.author.id, notification);
        }
      }
      
      res.status(201).json({ reply });
    } catch (error) {
      console.error('Error creating reply:', error);
      res.status(500).json({ message: 'Failed to create reply' });
    }
  });
  
  // Like a reply
  app.post(`${apiPrefix}/replies/:id/like`, isAuthenticated, async (req, res) => {
    try {
      const replyId = parseInt(req.params.id);
      if (isNaN(replyId)) {
        return res.status(400).json({ message: 'Invalid reply ID' });
      }
      
      const userId = req.user!.id;
      
      await storage.likeReply(replyId, userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error liking reply:', error);
      res.status(500).json({ message: 'Failed to like reply' });
    }
  });
  
  // Unlike a reply
  app.delete(`${apiPrefix}/replies/:id/like`, isAuthenticated, async (req, res) => {
    try {
      const replyId = parseInt(req.params.id);
      if (isNaN(replyId)) {
        return res.status(400).json({ message: 'Invalid reply ID' });
      }
      
      const userId = req.user!.id;
      
      await storage.unlikeReply(replyId, userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error unliking reply:', error);
      res.status(500).json({ message: 'Failed to unlike reply' });
    }
  });
  
  return app;
}
