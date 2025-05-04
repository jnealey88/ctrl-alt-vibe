import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler, AppError } from '../../server/middleware/errorHandler';

describe('Error Handling Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      originalUrl: '/test-url',
      method: 'GET'
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis()
    };
    
    nextFunction = jest.fn();
  });

  describe('errorHandler', () => {
    it('should handle standard errors with default 500 status', () => {
      const error = new Error('Standard error');
      
      errorHandler(error as AppError, mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Internal Server Error',
        error: 'Standard error'
      });
    });

    it('should respect custom status codes in AppError', () => {
      const error = new Error('Bad request') as AppError;
      error.status = 400;
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Bad Request',
        error: 'Bad request'
      });
    });

    it('should use statusCode if status is not present', () => {
      const error = new Error('Not found') as AppError;
      error.statusCode = 404;
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Not Found',
        error: 'Not found'
      });
    });

    it('should include additional data if present', () => {
      const error = new Error('Validation failed') as AppError;
      error.status = 422;
      error.data = { fields: ['email', 'password'] };
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Unprocessable Entity',
        error: 'Validation failed',
        data: { fields: ['email', 'password'] }
      });
    });

    it('should include specific error code if present', () => {
      const error = new Error('Resource conflict') as AppError;
      error.status = 409;
      error.code = 'DUPLICATE_ENTRY';
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Conflict',
        error: 'Resource conflict',
        code: 'DUPLICATE_ENTRY'
      });
    });
  });

  describe('notFoundHandler', () => {
    it('should create a 404 error for unknown routes', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      const error = nextFunction.mock.calls[0][0] as AppError;
      
      expect(error).toBeInstanceOf(Error);
      expect(error.status).toBe(404);
      expect(error.message).toContain('Not Found');
      expect(error.message).toContain('/test-url');
    });

    it('should include the request method in the error message', () => {
      mockRequest.method = 'POST';
      
      notFoundHandler(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const error = nextFunction.mock.calls[0][0] as AppError;
      expect(error.message).toContain('POST');
    });

    it('should handle undefined original URL', () => {
      mockRequest.originalUrl = undefined;
      
      notFoundHandler(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const error = nextFunction.mock.calls[0][0] as AppError;
      expect(error.message).toContain('Not Found');
      expect(error.message).not.toContain('undefined');
    });
  });
});
