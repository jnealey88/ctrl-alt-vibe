import express from 'express';
import supertest from 'supertest';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { storage } from '../../server/storage';

// Mock dependencies
jest.mock('../../server/storage');
jest.mock('../../db');
jest.mock('../../server/auth', () => ({
  setupAuth: jest.fn((app) => {
    // Mock isAuthenticated middleware
    app.use((req, res, next) => {
      req.isAuthenticated = jest.fn().mockReturnValue(true);
      req.user = { id: 1, username: 'testuser', role: 'user' };
      next();
    });
  })
}));

// Import the original module after mocking dependencies
import { registerRoutes } from '../../server/routes';

describe('API Routes', () => {
  let app: express.Application;
  let server: any;
  let request: supertest.SuperTest<supertest.Test>;
  let wss: WebSocketServer;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = createServer(app);
    wss = new WebSocketServer({ server });
    await registerRoutes(app);
    request = supertest(app);
  });

  afterAll(() => {
    wss.close();
    server.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Blog category endpoints', () => {
    it('should handle errors when fetching blog categories', async () => {
      // Mock storage to throw an error
      (storage.getBlogCategories as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request.get('/api/blog/categories');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Failed to fetch blog categories');
    });

    it('should handle invalid category ID when fetching a specific category', async () => {
      const response = await request.get('/api/blog/categories/invalid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid category ID');
    });

    it('should handle non-existent category ID', async () => {
      // Mock storage to return null for a non-existent category
      (storage.getBlogCategory as jest.Mock).mockResolvedValue(null);

      const response = await request.get('/api/blog/categories/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Category not found');
    });

    it('should handle errors when creating a blog category', async () => {
      // Mock the mutation to throw an error
      (storage.createBlogCategory as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request
        .post('/api/blog/categories')
        .send({ name: 'Test Category', slug: 'test-category' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Failed to create blog category');
    });

    it('should handle invalid input when creating a blog category', async () => {
      const response = await request
        .post('/api/blog/categories')
        .send({ name: '' }); // Missing required field 'slug'

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should handle errors when deleting a blog category', async () => {
      // Mock the mutation to throw an error
      (storage.deleteBlogCategory as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request.delete('/api/blog/categories/1');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Failed to delete blog category');
    });
  });

  describe('Blog post endpoints', () => {
    it('should handle invalid post ID when fetching a specific post', async () => {
      const response = await request.get('/api/blog/posts/invalid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid post ID');
    });

    it('should handle non-existent post ID', async () => {
      // Mock storage to return null for a non-existent post
      (storage.getBlogPost as jest.Mock).mockResolvedValue(null);

      const response = await request.get('/api/blog/posts/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Post not found');
    });

    it('should handle errors when creating a blog post', async () => {
      // Mock the mutation to throw an error
      (storage.createBlogPost as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request
        .post('/api/blog/posts')
        .send({
          title: 'Test Post',
          content: 'This is a test post',
          authorId: 1,
          slug: 'test-post'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Failed to create blog post');
    });

    it('should handle invalid input when creating a blog post', async () => {
      const response = await request
        .post('/api/blog/posts')
        .send({
          title: '', // Empty title
          content: 'This is a test post',
          authorId: 1,
          slug: 'test-post'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('Project endpoints', () => {
    it('should handle errors when fetching featured project', async () => {
      // Mock storage to throw an error
      (storage.getFeaturedProject as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request.get('/api/projects/featured');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Failed to fetch featured project');
    });

    it('should handle errors when fetching a specific project', async () => {
      // Mock storage to throw an error
      (storage.getProjectById as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request.get('/api/projects/1');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Failed to fetch project');
    });

    it('should handle invalid project ID when fetching a specific project', async () => {
      const response = await request.get('/api/projects/invalid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid project ID');
    });

    it('should handle non-existent project ID', async () => {
      // Mock storage to return null for a non-existent project
      (storage.getProjectById as jest.Mock).mockResolvedValue(null);

      const response = await request.get('/api/projects/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Project not found');
    });
  });

  describe('Comment endpoints', () => {
    it('should handle errors when fetching project comments', async () => {
      // Mock storage to throw an error
      (storage.getProjectComments as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request.get('/api/projects/1/comments');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Failed to fetch comments');
    });

    it('should handle invalid project ID when fetching comments', async () => {
      const response = await request.get('/api/projects/invalid/comments');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid project ID');
    });

    it('should handle invalid input when creating a comment', async () => {
      const response = await request
        .post('/api/comments')
        .send({
          content: '', // Empty content
          projectId: 1,
          authorId: 1
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should handle errors when creating a comment', async () => {
      // Mock the mutation to throw an error
      (storage.createComment as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request
        .post('/api/comments')
        .send({
          content: 'This is a test comment',
          projectId: 1,
          authorId: 1
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Failed to create comment');
    });
  });

  describe('Like/Bookmark endpoints', () => {
    it('should handle errors when liking a project', async () => {
      // Mock the mutation to throw an error
      (storage.likeProject as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request
        .post('/api/projects/1/like')
        .send();

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Failed to like project');
    });

    it('should handle invalid project ID when liking a project', async () => {
      const response = await request
        .post('/api/projects/invalid/like')
        .send();

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid project ID');
    });

    it('should handle errors when bookmarking a project', async () => {
      // Mock the mutation to throw an error
      (storage.bookmarkProject as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request
        .post('/api/projects/1/bookmark')
        .send();

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Failed to bookmark project');
    });
  });
});
