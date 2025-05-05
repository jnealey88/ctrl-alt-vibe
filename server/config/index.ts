import path from 'path';
import fs from 'fs';

// Upload directory configuration
const persistentStorageDir = process.env.REPLIT_DB_URL ? path.join(process.cwd(), ".replit", "data") : null;
export const uploadDir = persistentStorageDir && fs.existsSync(persistentStorageDir) 
  ? path.join(persistentStorageDir, "uploads") 
  : path.join(process.cwd(), "uploads");

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created upload directory: ${uploadDir}`);
} else {
  console.log(`Using uploads directory at ${uploadDir}`);
}

// API configuration
export const apiPrefix = '/api';

// Cache TTL configuration (in milliseconds)
export const cacheTTL = {
  short: 1 * 60 * 1000,      // 1 minute
  medium: 5 * 60 * 1000,     // 5 minutes
  long: 30 * 60 * 1000,      // 30 minutes
  veryLong: 60 * 60 * 1000,  // 1 hour
  day: 24 * 60 * 60 * 1000   // 24 hours
};

// Pagination defaults
export const pagination = {
  defaultLimit: 10,
  maxLimit: 100
};

// File upload configuration
export const fileUpload = {
  maxSize: 5 * 1024 * 1024,  // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  dimensions: {
    avatar: { width: 200, height: 200 },
    projectImage: { width: 800, height: 600 },
    blogImage: { width: 1200, height: 800 }
  }
};

// Tags configuration
export const predefinedTags = [
  "AI Tools", "Analytics", "Art", "Business", 
  "Chatbots", "Code", "Creative", "Data Visualization", 
  "Development", "Education", "GPT Models", "Image Generation", 
  "Machine Learning", "Natural Language Processing", "Productivity", "Tools",
  "Collaboration", "Content Creation", "Developer Tools", 
  "Finance", "Gaming", "Health", "Lifestyle", 
  "Social", "Utilities", "Web Development", "Mobile", 
  "Design", "Communication"
];

export default {
  uploadDir,
  apiPrefix,
  cacheTTL,
  pagination,
  fileUpload,
  predefinedTags
};
