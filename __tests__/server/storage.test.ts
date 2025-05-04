import { storage } from '../../server/storage';
import { db } from '../../db';

// Mock the db object
jest.mock('../../db', () => ({
  db: {
    query: {
      blogCategories: {
        findMany: jest.fn(),
        findFirst: jest.fn()
      },
      tags: {
        findMany: jest.fn()
      },
      codingTools: {
        findMany: jest.fn()
      }
    },
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn()
  }
}));

describe('Storage Functions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBlogCategories', () => {
    it('should return categories when successful', async () => {
      const mockCategories = [
        { id: 1, name: 'Technology', slug: 'technology', createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: 'Design', slug: 'design', createdAt: new Date(), updatedAt: new Date() }
      ];
      
      // Mock the findMany function to resolve with mock categories
      (db.query.blogCategories.findMany as jest.Mock).mockResolvedValue(mockCategories);
      
      const result = await storage.getBlogCategories();
      
      expect(result).toEqual(mockCategories);
      expect(db.query.blogCategories.findMany).toHaveBeenCalled();
    });
    
    it('should handle empty results', async () => {
      // Mock the findMany function to resolve with an empty array
      (db.query.blogCategories.findMany as jest.Mock).mockResolvedValue([]);
      
      const result = await storage.getBlogCategories();
      
      expect(result).toEqual([]);
      expect(db.query.blogCategories.findMany).toHaveBeenCalled();
    });
    
    it('should propagate errors', async () => {
      const errorMessage = 'Database error';
      
      // Mock the findMany function to reject with an error
      (db.query.blogCategories.findMany as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      await expect(storage.getBlogCategories()).rejects.toThrow(errorMessage);
      expect(db.query.blogCategories.findMany).toHaveBeenCalled();
    });
  });
  
  describe('getBlogCategory', () => {
    it('should return a category when found', async () => {
      const mockCategory = { id: 1, name: 'Technology', slug: 'technology', createdAt: new Date(), updatedAt: new Date() };
      
      // Mock the findFirst function to resolve with a mock category
      (db.query.blogCategories.findFirst as jest.Mock).mockResolvedValue(mockCategory);
      
      const result = await storage.getBlogCategory(1);
      
      expect(result).toEqual(mockCategory);
      expect(db.query.blogCategories.findFirst).toHaveBeenCalled();
    });
    
    it('should return null when category not found', async () => {
      // Mock the findFirst function to resolve with null
      (db.query.blogCategories.findFirst as jest.Mock).mockResolvedValue(null);
      
      const result = await storage.getBlogCategory(999);
      
      expect(result).toBeNull();
      expect(db.query.blogCategories.findFirst).toHaveBeenCalled();
    });
    
    it('should propagate errors', async () => {
      const errorMessage = 'Database error';
      
      // Mock the findFirst function to reject with an error
      (db.query.blogCategories.findFirst as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      await expect(storage.getBlogCategory(1)).rejects.toThrow(errorMessage);
      expect(db.query.blogCategories.findFirst).toHaveBeenCalled();
    });
  });
  
  describe('getAllTags', () => {
    it('should return properly cased tags', async () => {
      const mockTags = [
        { id: 1, name: 'ai tools', createdAt: new Date() },
        { id: 2, name: 'business', createdAt: new Date() },
        { id: 3, name: 'unknown tag', createdAt: new Date() }
      ];
      
      // Mock the findMany function to resolve with mock tags
      (db.query.tags.findMany as jest.Mock).mockResolvedValue(mockTags);
      
      const result = await storage.getAllTags();
      
      // The function should properly case known tags and leave unknown tags as is
      expect(result).toContain('AI Tools');
      expect(result).toContain('Business');
      expect(result).toContain('unknown tag');
      expect(db.query.tags.findMany).toHaveBeenCalled();
    });
    
    it('should handle empty results', async () => {
      // Mock the findMany function to resolve with an empty array
      (db.query.tags.findMany as jest.Mock).mockResolvedValue([]);
      
      const result = await storage.getAllTags();
      
      expect(result).toEqual([]);
      expect(db.query.tags.findMany).toHaveBeenCalled();
    });
    
    it('should propagate errors', async () => {
      const errorMessage = 'Database error';
      
      // Mock the findMany function to reject with an error
      (db.query.tags.findMany as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      await expect(storage.getAllTags()).rejects.toThrow(errorMessage);
      expect(db.query.tags.findMany).toHaveBeenCalled();
    });
  });
  
  describe('getPopularCodingTools', () => {
    it('should return popular coding tools with the specified limit', async () => {
      const mockTools = [
        { id: 1, name: 'VSCode', category: 'Editor', isPopular: true, createdAt: new Date() },
        { id: 2, name: 'GitHub', category: 'Version Control', isPopular: true, createdAt: new Date() }
      ];
      
      // Mock the findMany function to resolve with mock tools
      (db.query.codingTools.findMany as jest.Mock).mockResolvedValue(mockTools);
      
      const result = await storage.getPopularCodingTools(2);
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('VSCode');
      expect(result[1].name).toBe('GitHub');
      expect(db.query.codingTools.findMany).toHaveBeenCalledWith({
        where: expect.anything(),
        orderBy: expect.anything(),
        limit: 2
      });
    });
    
    it('should use default limit of 10 when not specified', async () => {
      const mockTools = Array(5).fill(null).map((_, i) => ({ 
        id: i + 1, 
        name: `Tool ${i + 1}`, 
        category: 'Category', 
        isPopular: true, 
        createdAt: new Date() 
      }));
      
      // Mock the findMany function to resolve with mock tools
      (db.query.codingTools.findMany as jest.Mock).mockResolvedValue(mockTools);
      
      await storage.getPopularCodingTools();
      
      expect(db.query.codingTools.findMany).toHaveBeenCalledWith({
        where: expect.anything(),
        orderBy: expect.anything(),
        limit: 10
      });
    });
    
    it('should handle empty results', async () => {
      // Mock the findMany function to resolve with an empty array
      (db.query.codingTools.findMany as jest.Mock).mockResolvedValue([]);
      
      const result = await storage.getPopularCodingTools();
      
      expect(result).toEqual([]);
      expect(db.query.codingTools.findMany).toHaveBeenCalled();
    });
    
    it('should convert date objects to ISO strings', async () => {
      const date = new Date();
      const mockTools = [
        { id: 1, name: 'VSCode', category: 'Editor', isPopular: true, createdAt: date }
      ];
      
      // Mock the findMany function to resolve with mock tools
      (db.query.codingTools.findMany as jest.Mock).mockResolvedValue(mockTools);
      
      const result = await storage.getPopularCodingTools();
      
      expect(result[0].createdAt).toBe(date.toISOString());
    });
    
    it('should propagate errors', async () => {
      const errorMessage = 'Database error';
      
      // Mock the findMany function to reject with an error
      (db.query.codingTools.findMany as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      await expect(storage.getPopularCodingTools()).rejects.toThrow(errorMessage);
      expect(db.query.codingTools.findMany).toHaveBeenCalled();
    });
  });
});
