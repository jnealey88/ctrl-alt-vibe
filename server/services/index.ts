import { ProjectService } from './project-service';
import { BlogService } from './blog-service';
import { AuthService } from './auth-service';
import { NotificationService } from './notification-service';
import { AIService } from './ai-service';

// Create and export service instances
export const projectService = new ProjectService();
export const blogService = new BlogService();
export const authService = new AuthService();
export const notificationService = new NotificationService();
export const aiService = new AIService();

// This file will expand to include all services as they are created
// Example:
// export const userService = new UserService();
// export const commentService = new CommentService();
// etc.
