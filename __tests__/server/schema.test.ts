import * as schema from '../../shared/schema';
import { z } from 'zod';

describe('Schema Validation', () => {
  describe('User Schema', () => {
    it('should validate a valid user', () => {
      const validUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
        role: 'user'
      };
      
      const result = schema.userInsertSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });
    
    it('should reject a user with invalid email', () => {
      const invalidUser = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'Password123',
        role: 'user'
      };
      
      const result = schema.userInsertSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('email');
      }
    });
    
    it('should reject a user with too short username', () => {
      const invalidUser = {
        username: 'te', // Too short
        email: 'test@example.com',
        password: 'Password123',
        role: 'user'
      };
      
      const result = schema.userInsertSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('username');
      }
    });
    
    it('should reject a user with invalid role', () => {
      const invalidUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
        role: 'superadmin' // Invalid role
      };
      
      const result = schema.userInsertSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('role');
      }
    });
  });
  
  describe('Project Schema', () => {
    it('should validate a valid project', () => {
      const validProject = {
        title: 'Test Project',
        description: 'This is a test project',
        longDescription: 'This is a longer description for the test project',
        projectUrl: 'https://example.com/project',
        imageUrl: 'https://example.com/image.jpg',
        authorId: 1,
        vibeCodingTool: 'React',
        featured: false,
        isPrivate: false
      };
      
      const result = schema.projectInsertSchema.safeParse(validProject);
      expect(result.success).toBe(true);
    });
    
    it('should reject a project with missing required fields', () => {
      const invalidProject = {
        // Missing title
        description: 'This is a test project',
        authorId: 1
      };
      
      const result = schema.projectInsertSchema.safeParse(invalidProject);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('title');
      }
    });
    
    it('should reject a project with invalid URLs', () => {
      const invalidProject = {
        title: 'Test Project',
        description: 'This is a test project',
        projectUrl: 'invalid-url', // Not a valid URL
        imageUrl: 'also-invalid',
        authorId: 1,
        featured: false,
        isPrivate: false
      };
      
      const result = schema.projectInsertSchema.safeParse(invalidProject);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        // Should have at least one error about URLs
        const urlErrors = result.error.errors.filter(err => 
          err.path.includes('projectUrl') || err.path.includes('imageUrl')
        );
        expect(urlErrors.length).toBeGreaterThan(0);
      }
    });
    
    it('should allow optional fields to be omitted', () => {
      const minimalProject = {
        title: 'Test Project',
        description: 'This is a test project',
        projectUrl: 'https://example.com/project',
        imageUrl: 'https://example.com/image.jpg',
        authorId: 1,
        featured: false,
        isPrivate: false
      };
      
      // Omitting optional fields like longDescription and vibeCodingTool
      const result = schema.projectInsertSchema.safeParse(minimalProject);
      expect(result.success).toBe(true);
    });
  });
  
  describe('Comment Schema', () => {
    it('should validate a valid comment', () => {
      const validComment = {
        content: 'This is a test comment',
        projectId: 1,
        authorId: 1
      };
      
      const result = schema.commentInsertSchema.safeParse(validComment);
      expect(result.success).toBe(true);
    });
    
    it('should reject a comment with empty content', () => {
      const invalidComment = {
        content: '', // Empty content
        projectId: 1,
        authorId: 1
      };
      
      const result = schema.commentInsertSchema.safeParse(invalidComment);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('content');
      }
    });
    
    it('should reject a comment with invalid foreign keys', () => {
      const invalidComment = {
        content: 'This is a test comment',
        projectId: 'not-a-number' as any, // Invalid project ID
        authorId: 1
      };
      
      const result = schema.commentInsertSchema.safeParse(invalidComment);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('projectId');
      }
    });
  });
  
  describe('Reply Schema', () => {
    it('should validate a valid reply', () => {
      const validReply = {
        content: 'This is a test reply',
        commentId: 1,
        authorId: 1
      };
      
      const result = schema.replyInsertSchema.safeParse(validReply);
      expect(result.success).toBe(true);
    });
    
    it('should reject a reply with empty content', () => {
      const invalidReply = {
        content: '', // Empty content
        commentId: 1,
        authorId: 1
      };
      
      const result = schema.replyInsertSchema.safeParse(invalidReply);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('content');
      }
    });
  });
  
  describe('BlogPost Schema', () => {
    it('should validate a valid blog post', () => {
      const validPost = {
        title: 'Test Blog Post',
        content: 'This is the content of the test blog post',
        slug: 'test-blog-post',
        authorId: 1,
        published: true,
        categoryId: 1
      };
      
      const result = schema.blogPostInsertSchema.safeParse(validPost);
      expect(result.success).toBe(true);
    });
    
    it('should reject a blog post with duplicate slug', () => {
      // This test would need a database mock to properly test unique constraints
      // But we can at least validate the schema structure
      expect(schema.blogPosts.slug.unique).toBe(true);
    });
    
    it('should reject a blog post with invalid slug format', () => {
      const invalidPost = {
        title: 'Test Blog Post',
        content: 'This is the content of the test blog post',
        slug: 'Invalid Slug With Spaces', // Invalid slug format
        authorId: 1,
        published: true,
        categoryId: 1
      };
      
      const result = schema.blogPostInsertSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('slug');
      }
    });
  });
  
  describe('UserSkill Schema', () => {
    it('should validate a valid user skill', () => {
      const validSkill = {
        userId: 1,
        category: 'Programming Languages',
        skill: 'TypeScript'
      };
      
      const result = schema.userSkillInsertSchema.safeParse(validSkill);
      expect(result.success).toBe(true);
    });
    
    it('should reject a user skill with missing fields', () => {
      const invalidSkill = {
        userId: 1,
        // Missing category
        skill: 'TypeScript'
      };
      
      const result = schema.userSkillInsertSchema.safeParse(invalidSkill);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('category');
      }
    });
  });
  
  describe('Notification Schema', () => {
    it('should validate a valid notification', () => {
      const validNotification = {
        userId: 1,
        type: schema.notificationTypes.NEW_COMMENT,
        message: 'You have a new comment on your project',
        actorId: 2,
        projectId: 1
      };
      
      const result = schema.notificationInsertSchema.safeParse(validNotification);
      expect(result.success).toBe(true);
    });
    
    it('should reject a notification with invalid type', () => {
      const invalidNotification = {
        userId: 1,
        type: 'INVALID_TYPE' as any,
        message: 'You have a new comment on your project',
        actorId: 2,
        projectId: 1
      };
      
      const result = schema.notificationInsertSchema.safeParse(invalidNotification);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('type');
      }
    });
  });
});
