import { hash } from 'bcrypt';
import passport from 'passport';
import * as z from 'zod';
import express from 'express';
import supertest from 'supertest';
import { setupAuth } from '../../server/auth';
import { db } from '../../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Mock modules
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockImplementation((password) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn().mockImplementation((password, hash) => {
    return Promise.resolve(hash === `hashed_${password}`);
  })
}));

jest.mock('../../db', () => ({
  db: {
    query: {
      users: {
        findFirst: jest.fn(),
        findMany: jest.fn()
      }
    },
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis()
  }
}));

jest.mock('passport', () => ({
  initialize: jest.fn(() => jest.fn()),
  session: jest.fn(() => jest.fn()),
  use: jest.fn(),
  authenticate: jest.fn(() => (req, res, next) => next()),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn()
}));

// Create a sample express app for testing
const createApp = () => {
  const app = express();
  app.use(express.json());
  setupAuth(app);
  return app;
};

describe('Auth Module', () => {
  let app: express.Application;
  let request: supertest.SuperTest<supertest.Test>;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
    request = supertest(app);
  });

  describe('Login endpoint', () => {
    it('should return 401 for invalid credentials', async () => {
      // Mock passport.authenticate to fail authentication
      (passport.authenticate as jest.Mock).mockImplementation(() => {
        return (req: any, res: any) => {
          return res.status(401).json({ message: 'Invalid username or password' });
        };
      });

      const response = await request
        .post('/api/login')
        .send({ username: 'nonexistent', password: 'wrong' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid username or password');
    });

    it('should handle missing credentials', async () => {
      const response = await request
        .post('/api/login')
        .send({});

      expect(response.status).toBe(401);
    });

    it('should handle server errors during login', async () => {
      // Mock passport.authenticate to throw an error
      (passport.authenticate as jest.Mock).mockImplementation(() => {
        return (req: any, res: any, next: any) => {
          return next(new Error('Database connection failed'));
        };
      });

      const response = await request
        .post('/api/login')
        .send({ username: 'test', password: 'password' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Registration endpoint', () => {
    it('should return 400 for invalid registration data', async () => {
      const response = await request
        .post('/api/register')
        .send({ username: '', password: 'short' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should return 409 when username is already taken', async () => {
      // Mock the query to simulate an existing user
      (db.query.users.findFirst as jest.Mock).mockResolvedValue({ id: 1, username: 'existinguser' });

      const response = await request
        .post('/api/register')
        .send({ username: 'existinguser', password: 'password123', email: 'existing@example.com' });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('message', expect.stringContaining('already exists'));
    });

    it('should handle database errors during registration', async () => {
      // Mock the query to throw an error
      (db.query.users.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request
        .post('/api/register')
        .send({ username: 'newuser', password: 'password123', email: 'new@example.com' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', expect.stringContaining('registration failed'));
    });
  });

  describe('Logout endpoint', () => {
    it('should handle errors during logout', async () => {
      // Create a mock request object with a logout function that throws an error
      const mockReq = {
        logout: jest.fn().mockImplementation((callback) => {
          callback(new Error('Session store error'));
        })
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Access the logout route handler directly
      const routes = app._router.stack.filter((layer: any) => 
        layer.route && layer.route.path === '/api/logout'
      );

      // Call the logout route handler with our mocks
      if (routes.length > 0) {
        const handler = routes[0].route.stack[0].handle;
        await handler(mockReq, mockRes);

        expect(mockReq.logout).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: expect.stringContaining('Error during logout')
        });
      } else {
        fail('Logout route not found');
      }
    });
  });

  describe('User profile endpoint', () => {
    it('should return 401 for unauthenticated requests to protected endpoints', async () => {
      // Mock req.isAuthenticated to return false
      const mockIsAuthenticated = jest.fn().mockReturnValue(false);
      const mockReq = { isAuthenticated: mockIsAuthenticated };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockNext = jest.fn();

      // Find the middleware that checks authentication
      const middlewares = app._router.stack.filter((layer: any) => 
        layer.name === 'isAuthenticated' || (layer.handle && layer.handle.name === 'isAuthenticated')
      );

      if (middlewares.length > 0) {
        await middlewares[0].handle(mockReq, mockRes, mockNext);

        expect(mockIsAuthenticated).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          message: expect.stringContaining('not authenticated')
        }));
        expect(mockNext).not.toHaveBeenCalled();
      } else {
        fail('Authentication middleware not found');
      }
    });
  });
});
