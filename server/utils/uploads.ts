import multer from 'multer';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs';
import { Request } from 'express';
import { uploadDir, fileUpload } from '../config';

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
  // Accept only specified image files
  if (fileUpload.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${fileUpload.allowedTypes.join(', ')} are allowed.`));
  }
};

// Initialize multer with our configuration
export const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: fileUpload.maxSize,
  },
  fileFilter: fileFilter
});

/**
 * Process an uploaded image with sharp
 * @param sourcePath Path to the uploaded image
 * @param type The type of image (avatar, projectImage, blogImage)
 * @returns Path to the processed image
 */
export async function processImage(sourcePath: string, type: keyof typeof fileUpload.dimensions): Promise<string> {
  const dimensions = fileUpload.dimensions[type];
  const filename = path.basename(sourcePath);
  const optimizedImagePath = path.join(uploadDir, `${type}-${filename}`);
  
  try {
    // Process based on image type
    switch (type) {
      case 'avatar':
        // Avatar images are square and cropped to fit
        await sharp(sourcePath)
          .resize(dimensions.width, dimensions.height, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toFile(optimizedImagePath);
        break;
        
      default:
        // Other images are resized to fit within dimensions while maintaining aspect ratio
        await sharp(sourcePath)
          .resize(dimensions.width, dimensions.height, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(optimizedImagePath);
    }
    
    // Remove the original if optimization succeeded
    fs.unlinkSync(sourcePath);
    
    // Return the public URL path
    return `/uploads/${path.basename(optimizedImagePath)}`;
  } catch (error) {
    console.error(`Error processing ${type} image:`, error);
    // Return the original if processing fails
    return `/uploads/${filename}`;
  }
}

/**
 * Clean up an old image file if it exists and isn't a default image
 * @param imageUrl URL of the image to clean up
 * @param defaultPattern Pattern to identify default images that shouldn't be deleted
 */
export function cleanupOldImage(imageUrl: string | undefined | null, defaultPattern: string = 'default'): void {
  if (!imageUrl || !imageUrl.startsWith('/uploads/') || imageUrl.includes(defaultPattern)) {
    return;
  }
  
  try {
    const imagePath = path.join(process.cwd(), imageUrl.substr(1));
    fs.unlink(imagePath, (err) => {
      if (err) console.error('Failed to remove old image:', err);
    });
  } catch (error) {
    console.error('Error cleaning up old image:', error);
  }
}
