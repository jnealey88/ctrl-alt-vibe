import { Express, Request, Response } from 'express';
import { storage } from '../storage';
import { blogService } from '../services';
import { z } from 'zod';
import { ValidationError, fromZodError } from 'zod-validation-error';
import { blogPostInsertSchema, blogCategoryInsertSchema, blogTagInsertSchema } from '@shared/schema';
import { isAuthenticated, isAdmin } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

// Set up storage for uploaded files - copied from routes.ts
// In a more thorough refactoring, this would be extracted to a common config file
const persistentStorageDir = process.env.REPLIT_DB_URL ? path.join(process.cwd(), ".replit", "data") : null;
const uploadDir = persistentStorageDir && fs.existsSync(persistentStorageDir) 
  ? path.join(persistentStorageDir, "uploads") 
  : path.join(process.cwd(), "uploads");

// Configure multer for file storage
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with the original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// File filter to only allow certain image types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

// Initialize multer with our configuration
const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter
});

export function registerBlogRoutes(app: Express) {
  const apiPrefix = '/api';
  
  // Get all blog categories
  app.get(`${apiPrefix}/blog/categories`, async (req, res) => {
    try {
      const categories = await storage.getBlogCategories();
      res.json({ categories });
    } catch (error) {
      console.error('Error fetching blog categories:', error);
      res.status(500).json({ message: 'Failed to fetch blog categories' });
    }
  });
  
  // Get blog category by ID
  app.get(`${apiPrefix}/blog/categories/:id`, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }
      
      const category = await storage.getBlogCategory(categoryId);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json({ category });
    } catch (error) {
      console.error('Error fetching blog category:', error);
      res.status(500).json({ message: 'Failed to fetch blog category' });
    }
  });
  
  // Get blog category by slug
  app.get(`${apiPrefix}/blog/categories/slug/:slug`, async (req, res) => {
    try {
      const slug = req.params.slug;
      
      const category = await storage.getBlogCategoryBySlug(slug);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json({ category });
    } catch (error) {
      console.error('Error fetching blog category by slug:', error);
      res.status(500).json({ message: 'Failed to fetch blog category' });
    }
  });
  
  // Create blog category (admin only)
  app.post(`${apiPrefix}/blog/categories`, isAdmin, async (req, res) => {
    try {
      const { name, slug, description } = req.body;
      
      // Validate input
      try {
        blogCategoryInsertSchema.parse(req.body);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          const prettyError = fromZodError(validationError);
          return res.status(400).json({ message: prettyError.message });
        }
        throw validationError;
      }
      
      // Create category
      const category = await storage.createBlogCategory({
        name,
        slug,
        description
      });
      
      res.status(201).json({ category });
    } catch (error) {
      console.error('Error creating blog category:', error);
      res.status(500).json({ message: 'Failed to create blog category' });
    }
  });
  
  // Update blog category (admin only)
  app.patch(`${apiPrefix}/blog/categories/:id`, isAdmin, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }
      
      const { name, slug, description } = req.body;
      
      // Check if category exists
      const existingCategory = await storage.getBlogCategory(categoryId);
      if (!existingCategory) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      // Update category
      const category = await storage.updateBlogCategory(categoryId, {
        name,
        slug,
        description
      });
      
      if (!category) {
        return res.status(500).json({ message: 'Failed to update category' });
      }
      
      res.json({ category });
    } catch (error) {
      console.error('Error updating blog category:', error);
      res.status(500).json({ message: 'Failed to update blog category' });
    }
  });
  
  // Delete blog category (admin only)
  app.delete(`${apiPrefix}/blog/categories/:id`, isAdmin, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }
      
      // Check if category exists
      const existingCategory = await storage.getBlogCategory(categoryId);
      if (!existingCategory) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      // Delete category
      const success = await storage.deleteBlogCategory(categoryId);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete category' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting blog category:', error);
      res.status(500).json({ message: 'Failed to delete blog category' });
    }
  });
  
  // Get all blog tags
  app.get(`${apiPrefix}/blog/tags`, async (req, res) => {
    try {
      const tags = await storage.getBlogTags();
      res.json({ tags });
    } catch (error) {
      console.error('Error fetching blog tags:', error);
      res.status(500).json({ message: 'Failed to fetch blog tags' });
    }
  });
  
  // Create blog tag (admin only)
  app.post(`${apiPrefix}/blog/tags`, isAdmin, async (req, res) => {
    try {
      const { name, slug } = req.body;
      
      // Validate input
      try {
        blogTagInsertSchema.parse(req.body);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          const prettyError = fromZodError(validationError);
          return res.status(400).json({ message: prettyError.message });
        }
        throw validationError;
      }
      
      // Create tag
      const tag = await storage.createBlogTag({
        name,
        slug
      });
      
      res.status(201).json({ tag });
    } catch (error) {
      console.error('Error creating blog tag:', error);
      res.status(500).json({ message: 'Failed to create blog tag' });
    }
  });
  
  // Get blog posts with pagination and filtering
  app.get(`${apiPrefix}/blog/posts`, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      const categoryId = req.query.category ? parseInt(req.query.category as string) : undefined;
      const tagId = req.query.tag ? parseInt(req.query.tag as string) : undefined;
      const authorId = req.query.author ? parseInt(req.query.author as string) : undefined;
      const search = req.query.search as string;
      
      const result = await storage.getBlogPosts({
        offset,
        limit,
        categoryId,
        tagId,
        authorId,
        search
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      res.status(500).json({ message: 'Failed to fetch blog posts' });
    }
  });
  
  // Get blog post by ID
  app.get(`${apiPrefix}/blog/posts/:id`, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: 'Invalid post ID' });
      }
      
      const post = await storage.getBlogPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Increment view count in background
      storage.incrementBlogPostViews(postId).catch(error => {
        console.error('Error incrementing blog post views:', error);
      });
      
      res.json({ post });
    } catch (error) {
      console.error('Error fetching blog post:', error);
      res.status(500).json({ message: 'Failed to fetch blog post' });
    }
  });
  
  // Get blog post by slug
  app.get(`${apiPrefix}/blog/posts/slug/:slug`, async (req, res) => {
    try {
      const slug = req.params.slug;
      
      const post = await storage.getBlogPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Increment view count in background
      storage.incrementBlogPostViews(post.id).catch(error => {
        console.error('Error incrementing blog post views:', error);
      });
      
      res.json({ post });
    } catch (error) {
      console.error('Error fetching blog post by slug:', error);
      res.status(500).json({ message: 'Failed to fetch blog post' });
    }
  });
  
  // Create blog post
  app.post(`${apiPrefix}/blog/posts`, isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      const postData = JSON.parse(req.body.post);
      const tagIds = req.body.tagIds ? JSON.parse(req.body.tagIds) : [];
      
      // Set the author ID
      postData.authorId = req.user!.id;
      
      // Validate input
      try {
        blogPostInsertSchema.parse(postData);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          const prettyError = fromZodError(validationError);
          return res.status(400).json({ message: prettyError.message });
        }
        throw validationError;
      }
      
      // Handle image upload
      if (req.file) {
        // Resize and optimize the image
        const optimizedImagePath = path.join(uploadDir, 'opt-' + req.file.filename);
        
        try {
          await sharp(req.file.path)
            .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toFile(optimizedImagePath);
          
          // Now use the optimized image instead
          postData.featuredImage = `/uploads/opt-${req.file.filename}`;
          
          // Remove the original if optimization succeeded
          fs.unlinkSync(req.file.path);
        } catch (sharpError) {
          console.error('Error optimizing image:', sharpError);
          // Fallback to original image if optimization fails
          postData.featuredImage = `/uploads/${req.file.filename}`;
        }
      } else if (!postData.featuredImage) {
        // Set a default image if none provided
        postData.featuredImage = '/images/default-blog.jpg';
      }
      
      // Create the post
      const post = await storage.createBlogPost(postData, tagIds);
      
      res.status(201).json({ post });
    } catch (error) {
      console.error('Error creating blog post:', error);
      res.status(500).json({ message: 'Failed to create blog post' });
    }
  });
  
  // Update blog post
  app.patch(`${apiPrefix}/blog/posts/:id`, isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: 'Invalid post ID' });
      }
      
      // Get existing post
      const existingPost = await storage.getBlogPost(postId);
      if (!existingPost) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Check if user is the author or an admin
      const userId = req.user!.id;
      if (existingPost.author.id !== userId && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update this post' });
      }
      
      const postData = JSON.parse(req.body.post);
      const tagIds = req.body.tagIds ? JSON.parse(req.body.tagIds) : undefined;
      
      // Handle image upload
      if (req.file) {
        // Resize and optimize the image
        const optimizedImagePath = path.join(uploadDir, 'opt-' + req.file.filename);
        
        try {
          await sharp(req.file.path)
            .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toFile(optimizedImagePath);
          
          // Now use the optimized image instead
          postData.featuredImage = `/uploads/opt-${req.file.filename}`;
          
          // Remove the original if optimization succeeded
          fs.unlinkSync(req.file.path);
          
          // If there was a previous image that wasn't the default, try to remove it
          if (existingPost.featuredImage && 
              !existingPost.featuredImage.includes('default-blog.jpg') && 
              existingPost.featuredImage.startsWith('/uploads/')) {
            const oldImagePath = path.join(process.cwd(), existingPost.featuredImage.substr(1));
            fs.unlink(oldImagePath, (err) => {
              if (err) console.error('Failed to remove old image:', err);
            });
          }
        } catch (sharpError) {
          console.error('Error optimizing image:', sharpError);
          // Fallback to original image if optimization fails
          postData.featuredImage = `/uploads/${req.file.filename}`;
        }
      }
      
      // Update the post
      const post = await storage.updateBlogPost(postId, postData, tagIds);
      
      if (!post) {
        return res.status(500).json({ message: 'Failed to update post' });
      }
      
      res.json({ post });
    } catch (error) {
      console.error('Error updating blog post:', error);
      res.status(500).json({ message: 'Failed to update blog post' });
    }
  });
  
  // Delete blog post
  app.delete(`${apiPrefix}/blog/posts/:id`, isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: 'Invalid post ID' });
      }
      
      // Get existing post
      const existingPost = await storage.getBlogPost(postId);
      if (!existingPost) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Check if user is the author or an admin
      const userId = req.user!.id;
      if (existingPost.author.id !== userId && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to delete this post' });
      }
      
      // Delete the post
      const success = await storage.deleteBlogPost(postId);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete post' });
      }
      
      // Try to remove the post image if it wasn't the default
      if (existingPost.featuredImage && 
          !existingPost.featuredImage.includes('default-blog.jpg') && 
          existingPost.featuredImage.startsWith('/uploads/')) {
        const imagePath = path.join(process.cwd(), existingPost.featuredImage.substr(1));
        fs.unlink(imagePath, (err) => {
          if (err) console.error('Failed to remove post image:', err);
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting blog post:', error);
      res.status(500).json({ message: 'Failed to delete blog post' });
    }
  });
  
  return app;
}
