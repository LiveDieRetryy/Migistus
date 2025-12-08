import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/session';

const pledgesPath = path.join(process.cwd(), 'public', 'data', 'pledges.json');

function ensurePledgesFile() {
  if (!fs.existsSync(pledgesPath)) {
    fs.writeFileSync(pledgesPath, '[]');
  }
}

function getPledges() {
  ensurePledgesFile();
  const data = fs.readFileSync(pledgesPath, 'utf-8');
  return JSON.parse(data);
}

function savePledges(pledges: any[]) {
  fs.writeFileSync(pledgesPath, JSON.stringify(pledges, null, 2));
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require authentication - this validates the session
  const session = requireAuth(req, res);
  if (!session) {
    return; // requireAuth already sent the 401 response
  }

  try {
    let pledges = getPledges();

    if (req.method === 'GET') {
      // Always return only the authenticated user's pledges
      const userPledges = pledges.filter((pledge: any) => pledge.userId === session.userId);
      return res.status(200).json({
        success: true,
        data: userPledges,
        total: userPledges.length
      });
    } else if (req.method === 'POST') {
      const newPledge = {
        id: Date.now(),
        ...req.body,
        userId: session.userId, // Force the userId to match the authenticated user
        username: session.username,
        createdAt: new Date().toISOString()
      };
      pledges.push(newPledge);
      savePledges(pledges);
      return res.status(201).json({
        success: true,
        data: newPledge,
        message: 'Pledge created successfully'
      });
    } else if (req.method === 'DELETE') {
      const { pledgeId } = req.query;
      const pledgeIdNum = parseInt(pledgeId as string);
      
      // Find the pledge and verify it belongs to the authenticated user
      const pledgeIndex = pledges.findIndex((p: any) => p.id === pledgeIdNum);
      if (pledgeIndex === -1) {
        return res.status(404).json({ 
          success: false,
          error: 'Pledge not found' 
        });
      }
      
      if (pledges[pledgeIndex].userId !== session.userId) {
        return res.status(403).json({ 
          success: false,
          error: 'You can only delete your own pledges',
          code: 'FORBIDDEN'
        });
      }
      
      pledges = pledges.filter((pledge: any) => pledge.id !== pledgeIdNum);
      savePledges(pledges);
      return res.status(200).json({ 
        success: true,
        message: 'Pledge deleted successfully'
      });
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Pledges API error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}
