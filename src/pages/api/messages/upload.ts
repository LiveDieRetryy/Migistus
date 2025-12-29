// pages/api/messages/upload.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';
import fs from 'fs';
import path from 'path';
import { sql } from '@vercel/postgres';

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, formidable will handle it
  },
};

// Helper to parse form data
const parseForm = (req: NextApiRequest): Promise<{ fields: any; files: any }> => {
  return new Promise((resolve, reject) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'messages');
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB max
      filename: (name, ext, part) => {
        // Generate unique filename
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `${timestamp}-${random}${ext}`;
      },
    });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

const getMimeType = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

const getFileType = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.cookies.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { fields, files } = await parseForm(req);
    
    const messageId = Array.isArray(fields.messageId) ? fields.messageId[0] : fields.messageId;
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file || !messageId) {
      return res.status(400).json({ error: 'Missing file or message ID' });
    }

    // Verify user owns the message
    const messageCheck = await sql`
      SELECT dm.id, dm.sender_id
      FROM direct_messages dm
      WHERE dm.id = ${messageId}
      AND dm.sender_id = ${userId}
      LIMIT 1
    `;

    if (messageCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized to upload to this message' });
    }

    // Get file info
    const fileName = (file as any).originalFilename || 'unknown';
    const filePath = (file as any).filepath;
    const fileSize = (file as any).size;
    
    // Create public URL path
    const relativePath = path.relative(path.join(process.cwd(), 'public'), filePath);
    const fileUrl = '/' + relativePath.replace(/\\/g, '/');
    
    const mimeType = getMimeType(fileName);
    const fileType = getFileType(mimeType);

    // Store attachment in database
    const result = await sql`
      INSERT INTO message_attachments (
        message_id,
        file_url,
        file_name,
        file_type,
        file_size,
        mime_type
      ) VALUES (
        ${messageId},
        ${fileUrl},
        ${fileName},
        ${fileType},
        ${fileSize},
        ${mimeType}
      )
      RETURNING id, file_url, file_name, file_type, file_size, mime_type
    `;

    const attachment = result.rows[0];

    res.status(200).json({
      success: true,
      attachment: {
        id: attachment.id,
        url: attachment.file_url,
        name: attachment.file_name,
        type: attachment.file_type,
        size: attachment.file_size,
        mimeType: attachment.mime_type
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
}
