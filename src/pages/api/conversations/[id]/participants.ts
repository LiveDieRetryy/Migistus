// src/pages/api/conversations/[id]/participants.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { chatStorage } from '@/utils/chatStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const conversationId = parseInt(req.query.id as string);
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    // Verify user is participant
    const isParticipant = await chatStorage.isParticipant(conversationId, session.userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'You are not a participant in this conversation' });
    }

    switch (req.method) {
      case 'GET': {
        // Get conversation participants
        const participants = await chatStorage.getConversationParticipants(conversationId);
        return res.status(200).json({ participants });
      }

      case 'POST': {
        // Add participant (admin only)
        const participants = await chatStorage.getConversationParticipants(conversationId);
        const currentUser = participants.find((p: any) => p.user_id === session.userId);
        
        if (!currentUser || currentUser.role !== 'admin') {
          return res.status(403).json({ error: 'Only admins can add participants' });
        }

        const { userId, role } = req.body;

        if (!userId || isNaN(parseInt(userId as string))) {
          return res.status(400).json({ error: 'Valid user ID is required' });
        }

        const parsedUserId = parseInt(userId as string);

        // Check if already a participant
        const alreadyParticipant = await chatStorage.isParticipant(conversationId, parsedUserId);
        if (alreadyParticipant) {
          return res.status(400).json({ error: 'User is already a participant' });
        }

        // Validate role
        const validRoles = ['admin', 'member'];
        const participantRole = role && validRoles.includes(role) ? role : 'member';

        const participant = await chatStorage.addParticipant({
          conversationId,
          userId: parsedUserId,
          role: participantRole
        });

        return res.status(201).json({ participant });
      }

      case 'DELETE': {
        // Remove participant
        const { userId } = req.body;

        if (!userId || isNaN(parseInt(userId as string))) {
          return res.status(400).json({ error: 'Valid user ID is required' });
        }

        const parsedUserId = parseInt(userId as string);

        // Check if user is removing themselves or if they're an admin
        const participants = await chatStorage.getConversationParticipants(conversationId);
        const currentUser = participants.find((p: any) => p.user_id === session.userId);
        
        const isSelf = parsedUserId === session.userId;
        const isAdmin = currentUser && currentUser.role === 'admin';

        if (!isSelf && !isAdmin) {
          return res.status(403).json({ error: 'Only admins can remove other participants' });
        }

        await chatStorage.removeParticipant(conversationId, parsedUserId);
        return res.status(200).json({ message: 'Participant removed successfully' });
      }

      case 'PATCH': {
        // Update participant role (admin only)
        const participants = await chatStorage.getConversationParticipants(conversationId);
        const currentUser = participants.find((p: any) => p.user_id === session.userId);
        
        if (!currentUser || currentUser.role !== 'admin') {
          return res.status(403).json({ error: 'Only admins can update participant roles' });
        }

        const { userId, role } = req.body;

        if (!userId || isNaN(parseInt(userId as string))) {
          return res.status(400).json({ error: 'Valid user ID is required' });
        }

        const validRoles = ['admin', 'member'];
        if (!role || !validRoles.includes(role)) {
          return res.status(400).json({ error: 'Role must be "admin" or "member"' });
        }

        const parsedUserId = parseInt(userId as string);

        await chatStorage.updateParticipantRole(conversationId, parsedUserId, role);
        return res.status(200).json({ message: 'Participant role updated successfully' });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'PATCH']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    console.error('Participants API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
