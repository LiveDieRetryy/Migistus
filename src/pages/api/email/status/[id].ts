import type { NextApiRequest, NextApiResponse } from 'next';
import { notificationStorage } from '@/utils/notificationStorage';
import { getSessionFromRequest } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const session = await getSessionFromRequest(req);
    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid email ID' });
    }
    
    const emailId = parseInt(id, 10);
    if (isNaN(emailId)) {
      return res.status(400).json({ error: 'Invalid email ID format' });
    }

    const emailStatus = await notificationStorage.getEmailStatus(emailId);

    if (!emailStatus) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Only allow users to check their own email status, or admins to check any
    if (emailStatus.recipient_email !== session.email && session.tier !== 'Master') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.status(200).json(emailStatus);
  } catch (error) {
    console.error('Email status API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
