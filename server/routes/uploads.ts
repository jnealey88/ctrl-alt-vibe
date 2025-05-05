import { Express, Request, Response } from 'express';
import { isAuthenticated } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

// Set up storage for uploaded files
const persistentStorageDir = process.env.REPLIT_DB_URL ? path.join(process.cwd(), ".replit", "data") : null;
const uploadDir = persistentStorageDir && fs.existsSync(persistentStorageDir) 
  ? path.join(persistentStorageDir, "uploads") 
  : path.join(process.cwd(), "uploads");

// Create the uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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

export function registerUploadRoutes(app: Express) {
  const apiPrefix = '/api';
  
  // Upload avatar image
  app.post(`${apiPrefix}/uploads/avatar`, isAuthenticated, upload.single('avatar'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
      }
      
      // Resize and crop avatar to square
      const size = 200; // Standard avatar size
      const optimizedImagePath = path.join(uploadDir, 'avatar-' + req.file.filename);
      
      try {
        await sharp(req.file.path)
          .resize(size, size, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toFile(optimizedImagePath);
        
        // Now use the optimized image instead
        const avatarUrl = `/uploads/avatar-${req.file.filename}`;
        
        // Remove the original if optimization succeeded
        fs.unlinkSync(req.file.path);
        
        // Update user's avatar URL in database
        const userId = req.user!.id;
        const updatedUser = await storage.updateUser(userId, { avatarUrl });
        
        if (!updatedUser) {
          return res.status(500).json({ message: 'Failed to update avatar' });
        }
        
        // Remove sensitive data
        delete updatedUser.password;
        
        res.json({ user: updatedUser, avatarUrl });
      } catch (sharpError) {
        console.error('Error optimizing avatar image:', sharpError);
        // Fallback to original image if optimization fails
        const avatarUrl = `/uploads/${req.file.filename}`;
        
        // Update user's avatar URL in database
        const userId = req.user!.id;
        const updatedUser = await storage.updateUser(userId, { avatarUrl });
        
        if (!updatedUser) {
          return res.status(500).json({ message: 'Failed to update avatar' });
        }
        
        // Remove sensitive data
        delete updatedUser.password;
        
        res.json({ user: updatedUser, avatarUrl });
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      res.status(500).json({ message: 'Failed to upload avatar' });
    }
  });
  
  // Generic file upload endpoint
  app.post(`${apiPrefix}/uploads/file`, isAuthenticated, upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
      }
      
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ fileUrl });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });
  
  return app;
}

// Export upload configuration for use in other route files
export { upload, uploadDir };
