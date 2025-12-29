// src/pages/api/migrate/chat-data.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db';

interface FileConversation {
  id: number;
  type: 'direct' | 'group';
  name: string | null;
  created_by: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface FileParticipant {
  id: number;
  conversation_id: number;
  user_id: number;
  role: string;
  is_active: boolean;
  joined_at: string;
  left_at: string | null;
}

interface FileMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  message_type: string;
  reply_to_id: number | null;
  metadata: any;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

interface FileAttachment {
  id: number;
  message_id: number;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

interface FileReaction {
  id: number;
  message_id: number;
  user_id: number;
  emoji: string;
  created_at: string;
}

interface FileReadStatus {
  id: number;
  message_id: number;
  user_id: number;
  read_at: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only Master tier can migrate data
    if (session.tier !== 'Master') {
      return res.status(403).json({ error: 'Only Master tier users can migrate data' });
    }

    const dataDir = path.join(process.cwd(), 'public', 'data');
    
    // File paths
    const conversationsFile = path.join(dataDir, 'conversations.json');
    const participantsFile = path.join(dataDir, 'participants.json');
    const messagesFile = path.join(dataDir, 'messages.json');
    const attachmentsFile = path.join(dataDir, 'attachments.json');
    const reactionsFile = path.join(dataDir, 'reactions.json');
    const readStatusFile = path.join(dataDir, 'read_status.json');

    // Check if files exist
    if (!fs.existsSync(conversationsFile)) {
      return res.status(404).json({ error: 'No chat data files found to migrate' });
    }

    const stats = {
      conversations: 0,
      participants: 0,
      messages: 0,
      attachments: 0,
      reactions: 0,
      readStatus: 0,
      errors: [] as string[]
    };

    // 1. Migrate Conversations
    console.log('Migrating conversations...');
    try {
      const conversations: FileConversation[] = JSON.parse(
        fs.readFileSync(conversationsFile, 'utf-8')
      );

      for (const conv of conversations) {
        try {
          await sql`
            INSERT INTO conversations (
              type, name, created_by, is_archived, created_at, updated_at
            ) VALUES (
              ${conv.type}, ${conv.name}, ${conv.created_by}, ${conv.is_archived},
              ${conv.created_at}, ${conv.updated_at}
            )
            ON CONFLICT DO NOTHING
          `;
          stats.conversations++;
        } catch (error: any) {
          stats.errors.push(`Conversation ${conv.id}: ${error.message}`);
        }
      }
    } catch (error: any) {
      stats.errors.push(`Conversations file: ${error.message}`);
    }

    // 2. Migrate Participants
    console.log('Migrating participants...');
    if (fs.existsSync(participantsFile)) {
      try {
        const participants: FileParticipant[] = JSON.parse(
          fs.readFileSync(participantsFile, 'utf-8')
        );

        for (const participant of participants) {
          try {
            await sql`
              INSERT INTO conversation_participants (
                conversation_id, user_id, role, is_active, joined_at, left_at
              ) VALUES (
                ${participant.conversation_id}, ${participant.user_id}, ${participant.role},
                ${participant.is_active}, ${participant.joined_at}, ${participant.left_at}
              )
              ON CONFLICT DO NOTHING
            `;
            stats.participants++;
          } catch (error: any) {
            stats.errors.push(`Participant ${participant.id}: ${error.message}`);
          }
        }
      } catch (error: any) {
        stats.errors.push(`Participants file: ${error.message}`);
      }
    }

    // 3. Migrate Messages
    console.log('Migrating messages...');
    if (fs.existsSync(messagesFile)) {
      try {
        const messages: FileMessage[] = JSON.parse(
          fs.readFileSync(messagesFile, 'utf-8')
        );

        for (const message of messages) {
          try {
            await sql`
              INSERT INTO messages (
                conversation_id, sender_id, content, message_type, reply_to_id,
                metadata, is_edited, is_deleted, created_at, edited_at, deleted_at
              ) VALUES (
                ${message.conversation_id}, ${message.sender_id}, ${message.content},
                ${message.message_type}, ${message.reply_to_id}, ${JSON.stringify(message.metadata)},
                ${message.is_edited}, ${message.is_deleted}, ${message.created_at},
                ${message.edited_at}, ${message.deleted_at}
              )
              ON CONFLICT DO NOTHING
            `;
            stats.messages++;
          } catch (error: any) {
            stats.errors.push(`Message ${message.id}: ${error.message}`);
          }
        }
      } catch (error: any) {
        stats.errors.push(`Messages file: ${error.message}`);
      }
    }

    // 4. Migrate Attachments
    console.log('Migrating attachments...');
    if (fs.existsSync(attachmentsFile)) {
      try {
        const attachments: FileAttachment[] = JSON.parse(
          fs.readFileSync(attachmentsFile, 'utf-8')
        );

        for (const attachment of attachments) {
          try {
            await sql`
              INSERT INTO message_attachments (
                message_id, file_url, file_name, file_type, file_size, created_at
              ) VALUES (
                ${attachment.message_id}, ${attachment.file_url}, ${attachment.file_name},
                ${attachment.file_type}, ${attachment.file_size}, ${attachment.created_at}
              )
              ON CONFLICT DO NOTHING
            `;
            stats.attachments++;
          } catch (error: any) {
            stats.errors.push(`Attachment ${attachment.id}: ${error.message}`);
          }
        }
      } catch (error: any) {
        stats.errors.push(`Attachments file: ${error.message}`);
      }
    }

    // 5. Migrate Reactions
    console.log('Migrating reactions...');
    if (fs.existsSync(reactionsFile)) {
      try {
        const reactions: FileReaction[] = JSON.parse(
          fs.readFileSync(reactionsFile, 'utf-8')
        );

        for (const reaction of reactions) {
          try {
            await sql`
              INSERT INTO message_reactions (
                message_id, user_id, emoji, created_at
              ) VALUES (
                ${reaction.message_id}, ${reaction.user_id}, ${reaction.emoji}, ${reaction.created_at}
              )
              ON CONFLICT DO NOTHING
            `;
            stats.reactions++;
          } catch (error: any) {
            stats.errors.push(`Reaction ${reaction.id}: ${error.message}`);
          }
        }
      } catch (error: any) {
        stats.errors.push(`Reactions file: ${error.message}`);
      }
    }

    // 6. Migrate Read Status
    console.log('Migrating read status...');
    if (fs.existsSync(readStatusFile)) {
      try {
        const readStatuses: FileReadStatus[] = JSON.parse(
          fs.readFileSync(readStatusFile, 'utf-8')
        );

        for (const readStatus of readStatuses) {
          try {
            await sql`
              INSERT INTO message_read_status (
                message_id, user_id, read_at
              ) VALUES (
                ${readStatus.message_id}, ${readStatus.user_id}, ${readStatus.read_at}
              )
              ON CONFLICT DO NOTHING
            `;
            stats.readStatus++;
          } catch (error: any) {
            stats.errors.push(`Read status ${readStatus.id}: ${error.message}`);
          }
        }
      } catch (error: any) {
        stats.errors.push(`Read status file: ${error.message}`);
      }
    }

    console.log('Chat migration completed:', stats);

    return res.status(200).json({
      message: 'Chat data migration completed',
      stats: {
        conversations: stats.conversations,
        participants: stats.participants,
        messages: stats.messages,
        attachments: stats.attachments,
        reactions: stats.reactions,
        readStatus: stats.readStatus,
        totalErrors: stats.errors.length
      },
      errors: stats.errors.slice(0, 10), // Return first 10 errors
      hasMoreErrors: stats.errors.length > 10
    });
  } catch (error: any) {
    console.error('Chat migration error:', error);
    return res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
}
