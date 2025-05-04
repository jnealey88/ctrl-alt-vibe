import multer from 'multer';
import express from 'express';
import supertest from 'supertest';
import path from 'path';
import fs from 'fs';

// Extract the file filter logic from routes.ts
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Only accept certain image formats
  const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (acceptedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP files are allowed.'));
  }
};

describe('File Upload Functionality', () => {
  let app: express.Application;
  let request: supertest.SuperTest<supertest.Test>;
  const testUploadDir = path.join(__dirname, '../../__tests__/uploads');

  beforeAll(() => {
    // Create a temporary upload directory for testing
    if (!fs.existsSync(testUploadDir)) {
      fs.mkdirSync(testUploadDir, { recursive: true });
    }

    // Set up test app with multer
    app = express();
    
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, testUploadDir);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
      }
    });
    
    const upload = multer({ 
      storage: storage,
      fileFilter: fileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
      }
    });

    // Set up a test route for uploading
    app.post('/api/test-upload', upload.single('image'), (req, res) => {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      return res.status(200).json({ 
        message: 'File uploaded successfully',
        file: req.file
      });
    });

    // Set up error handling
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Maximum file size is 5MB.' });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      } else {
        return res.status(500).json({ message: err.message || 'Unknown error' });
      }
    });

    request = supertest(app);
  });

  afterAll(() => {
    // Clean up - remove test files
    if (fs.existsSync(testUploadDir)) {
      const files = fs.readdirSync(testUploadDir);
      for (const file of files) {
        fs.unlinkSync(path.join(testUploadDir, file));
      }
      fs.rmdirSync(testUploadDir);
    }
  });

  it('should accept valid image files', async () => {
    // Create a small test buffer to simulate a valid image
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==', 
      'base64'
    );

    const response = await request
      .post('/api/test-upload')
      .attach('image', testImageBuffer, {
        filename: 'test-image.png',
        contentType: 'image/png'
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('File uploaded successfully');
    expect(response.body.file).toBeDefined();
    expect(response.body.file.mimetype).toBe('image/png');
  });

  it('should reject non-image files', async () => {
    const testTextBuffer = Buffer.from('Test file content', 'utf-8');

    const response = await request
      .post('/api/test-upload')
      .attach('image', testTextBuffer, {
        filename: 'test.txt',
        contentType: 'text/plain'
      });

    expect(response.status).toBe(500); // Error handler catches this
    expect(response.body.message).toContain('Invalid file type');
  });

  it('should reject files exceeding the size limit', async () => {
    // Create a buffer slightly larger than 5MB
    const largeBuffer = Buffer.alloc(5.1 * 1024 * 1024); 

    const response = await request
      .post('/api/test-upload')
      .attach('image', largeBuffer, {
        filename: 'large-image.png',
        contentType: 'image/png'
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('File too large');
  });

  it('should handle missing files', async () => {
    const response = await request
      .post('/api/test-upload')
      .field('someOtherField', 'value');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('No file uploaded');
  });
});
