import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyEmailConnection } from '@/lib/email';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const isConnected = await verifyEmailConnection();
    
    if (isConnected) {
      return res.status(200).json({
        success: true,
        message: 'Email server connection verified',
        config: {
          host: process.env.SMTP_HOST || 'not configured',
          port: process.env.SMTP_PORT || 'not configured',
          user: process.env.SMTP_USER ? '✓ configured' : '✗ not configured',
          from: process.env.FROM_EMAIL || 'noreply@migistus.com',
        }
      });
    } else {
      return res.status(503).json({
        success: false,
        message: 'Email server connection failed',
        error: 'Could not connect to SMTP server. Check your environment variables.'
      });
    }
  } catch (error) {
    console.error('Email health check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Email health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
