import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import ImageRegistry from '@/utils/imageRegistry';

// Create unique filename with hash to prevent conflicts
const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const hash = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9-_]/g, '-');
  return `${baseName}-${timestamp}-${hash}${ext}`;
};

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'images', 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and hash
    const uniqueFilename = generateUniqueFilename(file.originalname);
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Disable default body parser for multer
export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadMiddleware = upload.single('image');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use multer middleware
    await new Promise<void>((resolve, reject) => {
      uploadMiddleware(req as any, res as any, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    const file = (req as any).file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the relative path to the uploaded file
    const filePath = `/images/uploads/${file.filename}`;
    
    // Register image in the registry system
    const imageRegistry = ImageRegistry.getInstance();
    const imageId = imageRegistry.registerImage(
      file.filename,
      file.originalname,
      filePath,
      file.size,
      req.body?.productId || 'upload-temp'
    );
    
    // Log successful upload for debugging
    console.log(`✅ Image uploaded successfully: ${filePath} (ID: ${imageId})`);
    
    res.status(200).json({
      success: true,
      url: filePath,  // Use 'url' instead of 'filePath' for consistency
      filePath,       // Keep for backward compatibility
      originalName: file.originalname,
      size: file.size,
      filename: file.filename, // Add filename for tracking
      imageId         // Add imageId for tracking
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Only image files are allowed') {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('File too large')) {
        return res.status(400).json({ error: 'File size too large. Maximum 5MB allowed.' });
      }
    }
    
    res.status(500).json({ error: 'Failed to upload file' });
  }
}
