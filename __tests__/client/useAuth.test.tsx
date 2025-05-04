import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAuth } from '../../client/src/hooks/use-auth';

// Mock the apiRequest and toast utilities
jest.mock('../../client/src/lib/queryClient', () => ({
  apiRequest: jest.fn(),
  queryClient: {
    setQueryData: jest.fn(),
    invalidateQueries: jest.fn()
  }
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Import after mocking
import { apiRequest, queryClient } from '../../client/src/lib/queryClient';

// Create a wrapper component with the QueryClientProvider
const createQueryClientWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should handle successful login', async () => {
      const mockUser = { id: 1, username: 'testuser', role: 'user' };
      
      // Mock a successful login response
      (apiRequest as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockUser)
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createQueryClientWrapper()
      });

      await act(async () => {
        await result.current.login({ username: 'testuser', password: 'password123' });
      });

      expect(apiRequest).toHaveBeenCalledWith(
        'POST',
        '/api/login',
        expect.objectContaining({ username: 'testuser', password: 'password123' })
      );
      
      expect(queryClient.setQueryData).toHaveBeenCalledWith(
        ['/api/user'],
        mockUser
      );
    });

    it('should handle login error', async () => {
      const errorMessage = 'Invalid credentials';
      
      // Mock a failed login response
      (apiRequest as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useAuth(), {
        wrapper: createQueryClientWrapper()
      });

      let error;
      await act(async () => {
        try {
          await result.current.login({ username: 'testuser', password: 'wrongpassword' });
        } catch (e) {
          error = e;
        }
      });

      expect(error).toBeDefined();
      expect(error.message).toBe(errorMessage);
      expect(queryClient.setQueryData).not.toHaveBeenCalled();
    });

    it('should handle server errors with appropriate message', async () => {
      // Mock a failed login response with a server error
      (apiRequest as jest.Mock).mockRejectedValueOnce(new Error('Internal Server Error'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: createQueryClientWrapper()
      });

      let error;
      await act(async () => {
        try {
          await result.current.login({ username: 'testuser', password: 'password123' });
        } catch (e) {
          error = e;
        }
      });

      expect(error).toBeDefined();
      expect(error.message).toBe('Internal Server Error');
    });
  });

  describe('logout', () => {
    it('should handle successful logout', async () => {
      // Mock a successful logout response
      (apiRequest as jest.Mock).mockResolvedValueOnce({});

      const { result } = renderHook(() => useAuth(), {
        wrapper: createQueryClientWrapper()
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(apiRequest).toHaveBeenCalledWith('POST', '/api/logout');
      expect(queryClient.setQueryData).toHaveBeenCalledWith(['/api/user'], null);
    });

    it('should handle logout errors', async () => {
      const errorMessage = 'Session store error';
      
      // Mock a failed logout response
      (apiRequest as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useAuth(), {
        wrapper: createQueryClientWrapper()
      });

      let error;
      await act(async () => {
        try {
          await result.current.logout();
        } catch (e) {
          error = e;
        }
      });

      expect(error).toBeDefined();
      expect(error.message).toBe(errorMessage);
      expect(queryClient.setQueryData).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should handle successful registration', async () => {
      const mockUser = { id: 1, username: 'newuser', email: 'new@example.com', role: 'user' };
      
      // Mock a successful registration response
      (apiRequest as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockUser)
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createQueryClientWrapper()
      });

      await act(async () => {
        await result.current.register({ 
          username: 'newuser', 
          password: 'password123', 
          email: 'new@example.com' 
        });
      });

      expect(apiRequest).toHaveBeenCalledWith(
        'POST',
        '/api/register',
        expect.objectContaining({ 
          username: 'newuser', 
          password: 'password123', 
          email: 'new@example.com' 
        })
      );
      
      expect(queryClient.setQueryData).toHaveBeenCalledWith(
        ['/api/user'],
        mockUser
      );
    });

    it('should handle registration validation errors', async () => {
      const errorMessage = 'Validation failed';
      
      // Mock a failed registration response
      (apiRequest as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useAuth(), {
        wrapper: createQueryClientWrapper()
      });

      let error;
      await act(async () => {
        try {
          await result.current.register({ 
            username: '', // Empty username should fail validation
            password: 'short', 
            email: 'invalid-email' 
          });
        } catch (e) {
          error = e;
        }
      });

      expect(error).toBeDefined();
      expect(error.message).toBe(errorMessage);
      expect(queryClient.setQueryData).not.toHaveBeenCalled();
    });

    it('should handle username conflict errors', async () => {
      const errorMessage = 'Username already exists';
      
      // Mock a failed registration response with conflict error
      (apiRequest as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useAuth(), {
        wrapper: createQueryClientWrapper()
      });

      let error;
      await act(async () => {
        try {
          await result.current.register({ 
            username: 'existinguser', 
            password: 'password123', 
            email: 'existing@example.com' 
          });
        } catch (e) {
          error = e;
        }
      });

      expect(error).toBeDefined();
      expect(error.message).toBe(errorMessage);
    });
  });
});
