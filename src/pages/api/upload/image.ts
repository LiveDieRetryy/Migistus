import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'public', 'images', 'uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      const error = new Error('Only image files are allowed!') as any;
      cb(error, false);
    }
  }
});

// Disable body parser for this API route
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
    await new Promise<void>((resolve, reject) => {
      uploadMiddleware(req as any, res as any, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    const file = (req as any).file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the URL path to the uploaded file
    const imageUrl = `/images/uploads/${file.filename}`;
    
    res.status(200).json({
      success: true,
      imageUrl: imageUrl,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('File too large')) {
        return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
      }
      if (error.message.includes('Only image files')) {
        return res.status(400).json({ error: 'Only image files are allowed.' });
      }
    }
    
    res.status(500).json({ error: 'Failed to upload image' });
  }
}
