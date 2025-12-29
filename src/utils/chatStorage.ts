// src/utils/chatStorage.ts
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const USE_DATABASE = 
  process.env.NEXT_PUBLIC_USE_DATABASE === 'true' ||
  process.env.VERCEL_ENV === 'production' ||
  process.env.NODE_ENV === 'production';

// ============ DATABASE STORAGE ============
class DatabaseChatStorage {
  // Conversations
  async createConversation(data: {
    type: 'direct' | 'group';
    name?: string;
    createdBy: number;
    participantIds: number[];
  }) {
    const conversation = await db.createConversation({
      type: data.type,
      name: data.name,
      createdBy: data.createdBy
    });

    // Add participants
    for (const userId of data.participantIds) {
      await db.addParticipant({
        conversationId: conversation.id,
        userId,
        role: userId === data.createdBy ? 'admin' : 'member'
      });
    }

    return conversation;
  }

  async getConversation(conversationId: number) {
    return await db.getConversation(conversationId);
  }

  async getUserConversations(userId: number, limit: number = 50, offset: number = 0) {
    return await db.getUserConversations(userId, limit, offset);
  }

  async updateConversation(conversationId: number, data: { name?: string; isArchived?: boolean }) {
    return await db.updateConversation(conversationId, data);
  }

  async deleteConversation(conversationId: number) {
    return await db.deleteConversation(conversationId);
  }

  // Participants
  async addParticipant(data: { conversationId: number; userId: number; role?: string }) {
    return await db.addParticipant(data);
  }

  async getConversationParticipants(conversationId: number) {
    return await db.getConversationParticipants(conversationId);
  }

  async removeParticipant(conversationId: number, userId: number) {
    return await db.removeParticipant(conversationId, userId);
  }

  async isParticipant(conversationId: number, userId: number) {
    return await db.isParticipant(conversationId, userId);
  }

  async updateParticipantRole(conversationId: number, userId: number, role: string) {
    return await db.updateParticipantRole(conversationId, userId, role);
  }

  // Messages
  async createMessage(data: {
    conversationId: number;
    senderId: number;
    content: string;
    messageType?: string;
    replyToId?: number;
    metadata?: any;
  }) {
    return await db.createMessage(data);
  }

  async getMessage(messageId: number) {
    return await db.getMessage(messageId);
  }

  async getConversationMessages(
    conversationId: number,
    limit: number = 50,
    offset: number = 0,
    beforeMessageId?: number
  ) {
    return await db.getConversationMessages(conversationId, limit, offset, beforeMessageId);
  }

  async updateMessage(messageId: number, content: string) {
    return await db.updateMessage(messageId, { content });
  }

  async deleteMessage(messageId: number, hardDelete: boolean = false) {
    return await db.deleteMessage(messageId, hardDelete);
  }

  async searchMessages(conversationId: number, searchTerm: string, limit: number = 20) {
    return await db.searchMessages(conversationId, searchTerm, limit);
  }

  // Attachments
  async createAttachment(data: {
    messageId: number;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }) {
    return await db.createAttachment(data);
  }

  async getMessageAttachments(messageId: number) {
    return await db.getMessageAttachments(messageId);
  }

  async deleteAttachment(attachmentId: number) {
    return await db.deleteAttachment(attachmentId);
  }

  // Reactions
  async addReaction(data: { messageId: number; userId: number; emoji: string }) {
    return await db.addReaction(data);
  }

  async removeReaction(data: { messageId: number; userId: number; emoji: string }) {
    return await db.removeReaction(data);
  }

  async getMessageReactions(messageId: number) {
    return await db.getMessageReactions(messageId);
  }

  async getReactionCounts(messageId: number) {
    return await db.getReactionCounts(messageId);
  }

  // Read Status
  async markMessageAsRead(data: { messageId: number; userId: number }) {
    return await db.markMessageAsRead(data);
  }

  async markConversationAsRead(conversationId: number, userId: number) {
    return await db.markConversationAsRead(conversationId, userId);
  }

  async getUnreadMessageCount(userId: number, conversationId?: number) {
    return await db.getUnreadMessageCount(userId, conversationId);
  }

  async getMessageReadStatus(messageId: number) {
    return await db.getMessageReadStatus(messageId);
  }

  // Typing Indicators
  async setTypingStatus(data: { conversationId: number; userId: number; isTyping: boolean }) {
    return await db.setTypingStatus(data);
  }

  async getTypingUsers(conversationId: number) {
    return await db.getTypingUsers(conversationId);
  }
}

// ============ FILE STORAGE ============
class FileChatStorage {
  private dataDir = path.join(process.cwd(), 'public', 'data');
  private conversationsFile = path.join(this.dataDir, 'conversations.json');
  private messagesFile = path.join(this.dataDir, 'messages.json');
  private participantsFile = path.join(this.dataDir, 'participants.json');
  private attachmentsFile = path.join(this.dataDir, 'attachments.json');
  private reactionsFile = path.join(this.dataDir, 'reactions.json');
  private readStatusFile = path.join(this.dataDir, 'read_status.json');

  private ensureFile(filePath: string) {
    if (!fs.existsSync(filePath)) {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(filePath, '[]');
    }
  }

  private readJSON(filePath: string): any[] {
    this.ensureFile(filePath);
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }

  private writeJSON(filePath: string, data: any[]) {
    this.ensureFile(filePath);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  // Conversations
  async createConversation(data: {
    type: 'direct' | 'group';
    name?: string;
    createdBy: number;
    participantIds: number[];
  }) {
    const conversations = this.readJSON(this.conversationsFile);
    const conversation = {
      id: conversations.length > 0 ? Math.max(...conversations.map((c: any) => c.id)) + 1 : 1,
      type: data.type,
      name: data.name || null,
      created_by: data.createdBy,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    conversations.push(conversation);
    this.writeJSON(this.conversationsFile, conversations);

    // Add participants
    for (const userId of data.participantIds) {
      await this.addParticipant({
        conversationId: conversation.id,
        userId,
        role: userId === data.createdBy ? 'admin' : 'member'
      });
    }

    return conversation;
  }

  async getConversation(conversationId: number) {
    const conversations = this.readJSON(this.conversationsFile);
    return conversations.find((c: any) => c.id === conversationId) || null;
  }

  async getUserConversations(userId: number, limit: number = 50, offset: number = 0) {
    const participants = this.readJSON(this.participantsFile);
    const userConvIds = participants
      .filter((p: any) => p.user_id === userId && p.is_active)
      .map((p: any) => p.conversation_id);

    const conversations = this.readJSON(this.conversationsFile);
    const messages = this.readJSON(this.messagesFile);

    return conversations
      .filter((c: any) => userConvIds.includes(c.id))
      .map((c: any) => {
        const convMessages = messages.filter((m: any) => m.conversation_id === c.id);
        return {
          ...c,
          message_count: convMessages.length,
          last_message_at: convMessages.length > 0 
            ? convMessages[convMessages.length - 1].created_at 
            : null
        };
      })
      .sort((a: any, b: any) => {
        const aTime = a.last_message_at || a.created_at;
        const bTime = b.last_message_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      })
      .slice(offset, offset + limit);
  }

  async updateConversation(conversationId: number, data: { name?: string; isArchived?: boolean }) {
    const conversations = this.readJSON(this.conversationsFile);
    const index = conversations.findIndex((c: any) => c.id === conversationId);
    
    if (index === -1) return null;

    if (data.name !== undefined) conversations[index].name = data.name;
    if (data.isArchived !== undefined) conversations[index].is_archived = data.isArchived;
    conversations[index].updated_at = new Date().toISOString();

    this.writeJSON(this.conversationsFile, conversations);
    return conversations[index];
  }

  async deleteConversation(conversationId: number) {
    let conversations = this.readJSON(this.conversationsFile);
    conversations = conversations.filter((c: any) => c.id !== conversationId);
    this.writeJSON(this.conversationsFile, conversations);

    // Also delete related data
    let messages = this.readJSON(this.messagesFile);
    messages = messages.filter((m: any) => m.conversation_id !== conversationId);
    this.writeJSON(this.messagesFile, messages);

    let participants = this.readJSON(this.participantsFile);
    participants = participants.filter((p: any) => p.conversation_id !== conversationId);
    this.writeJSON(this.participantsFile, participants);
  }

  // Participants
  async addParticipant(data: { conversationId: number; userId: number; role?: string }) {
    const participants = this.readJSON(this.participantsFile);
    
    // Check if already exists
    const existingIndex = participants.findIndex(
      (p: any) => p.conversation_id === data.conversationId && p.user_id === data.userId
    );

    if (existingIndex >= 0) {
      participants[existingIndex].is_active = true;
      participants[existingIndex].left_at = null;
      this.writeJSON(this.participantsFile, participants);
      return participants[existingIndex];
    }

    const participant = {
      id: participants.length > 0 ? Math.max(...participants.map((p: any) => p.id)) + 1 : 1,
      conversation_id: data.conversationId,
      user_id: data.userId,
      role: data.role || 'member',
      is_active: true,
      joined_at: new Date().toISOString(),
      left_at: null
    };
    participants.push(participant);
    this.writeJSON(this.participantsFile, participants);
    return participant;
  }

  async getConversationParticipants(conversationId: number) {
    const participants = this.readJSON(this.participantsFile);
    return participants.filter(
      (p: any) => p.conversation_id === conversationId && p.is_active
    );
  }

  async removeParticipant(conversationId: number, userId: number) {
    const participants = this.readJSON(this.participantsFile);
    const index = participants.findIndex(
      (p: any) => p.conversation_id === conversationId && p.user_id === userId
    );
    
    if (index >= 0) {
      participants[index].is_active = false;
      participants[index].left_at = new Date().toISOString();
      this.writeJSON(this.participantsFile, participants);
    }
  }

  async isParticipant(conversationId: number, userId: number) {
    const participants = this.readJSON(this.participantsFile);
    return participants.some(
      (p: any) => p.conversation_id === conversationId && 
                  p.user_id === userId && 
                  p.is_active
    );
  }

  async updateParticipantRole(conversationId: number, userId: number, role: string) {
    const participants = this.readJSON(this.participantsFile);
    const index = participants.findIndex(
      (p: any) => p.conversation_id === conversationId && p.user_id === userId
    );
    
    if (index >= 0) {
      participants[index].role = role;
      this.writeJSON(this.participantsFile, participants);
    }
  }

  // Messages
  async createMessage(data: {
    conversationId: number;
    senderId: number;
    content: string;
    messageType?: string;
    replyToId?: number;
    metadata?: any;
  }) {
    const messages = this.readJSON(this.messagesFile);
    const message = {
      id: messages.length > 0 ? Math.max(...messages.map((m: any) => m.id)) + 1 : 1,
      conversation_id: data.conversationId,
      sender_id: data.senderId,
      content: data.content,
      message_type: data.messageType || 'text',
      reply_to_id: data.replyToId || null,
      metadata: data.metadata || null,
      is_edited: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      edited_at: null,
      deleted_at: null
    };
    messages.push(message);
    this.writeJSON(this.messagesFile, messages);
    return message;
  }

  async getMessage(messageId: number) {
    const messages = this.readJSON(this.messagesFile);
    return messages.find((m: any) => m.id === messageId) || null;
  }

  async getConversationMessages(
    conversationId: number,
    limit: number = 50,
    offset: number = 0,
    beforeMessageId?: number
  ) {
    const messages = this.readJSON(this.messagesFile);
    let filtered = messages.filter(
      (m: any) => m.conversation_id === conversationId && !m.is_deleted
    );

    if (beforeMessageId) {
      filtered = filtered.filter((m: any) => m.id < beforeMessageId);
    }

    filtered.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return filtered.slice(0, limit).reverse();
  }

  async updateMessage(messageId: number, content: string) {
    const messages = this.readJSON(this.messagesFile);
    const index = messages.findIndex((m: any) => m.id === messageId);
    
    if (index === -1) return null;

    messages[index].content = content;
    messages[index].is_edited = true;
    messages[index].edited_at = new Date().toISOString();

    this.writeJSON(this.messagesFile, messages);
    return messages[index];
  }

  async deleteMessage(messageId: number, hardDelete: boolean = false) {
    let messages = this.readJSON(this.messagesFile);
    
    if (hardDelete) {
      messages = messages.filter((m: any) => m.id !== messageId);
    } else {
      const index = messages.findIndex((m: any) => m.id === messageId);
      if (index >= 0) {
        messages[index].is_deleted = true;
        messages[index].content = '[Deleted]';
        messages[index].deleted_at = new Date().toISOString();
      }
    }

    this.writeJSON(this.messagesFile, messages);
  }

  async searchMessages(conversationId: number, searchTerm: string, limit: number = 20) {
    const messages = this.readJSON(this.messagesFile);
    return messages
      .filter((m: any) => 
        m.conversation_id === conversationId && 
        !m.is_deleted &&
        m.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  // Attachments
  async createAttachment(data: {
    messageId: number;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }) {
    const attachments = this.readJSON(this.attachmentsFile);
    const attachment = {
      id: attachments.length > 0 ? Math.max(...attachments.map((a: any) => a.id)) + 1 : 1,
      message_id: data.messageId,
      file_url: data.fileUrl,
      file_name: data.fileName,
      file_type: data.fileType,
      file_size: data.fileSize,
      created_at: new Date().toISOString()
    };
    attachments.push(attachment);
    this.writeJSON(this.attachmentsFile, attachments);
    return attachment;
  }

  async getMessageAttachments(messageId: number) {
    const attachments = this.readJSON(this.attachmentsFile);
    return attachments.filter((a: any) => a.message_id === messageId);
  }

  async deleteAttachment(attachmentId: number) {
    let attachments = this.readJSON(this.attachmentsFile);
    attachments = attachments.filter((a: any) => a.id !== attachmentId);
    this.writeJSON(this.attachmentsFile, attachments);
  }

  // Reactions
  async addReaction(data: { messageId: number; userId: number; emoji: string }) {
    const reactions = this.readJSON(this.reactionsFile);
    
    // Check if already exists
    const exists = reactions.some(
      (r: any) => r.message_id === data.messageId && 
                  r.user_id === data.userId && 
                  r.emoji === data.emoji
    );

    if (exists) return null;

    const reaction = {
      id: reactions.length > 0 ? Math.max(...reactions.map((r: any) => r.id)) + 1 : 1,
      message_id: data.messageId,
      user_id: data.userId,
      emoji: data.emoji,
      created_at: new Date().toISOString()
    };
    reactions.push(reaction);
    this.writeJSON(this.reactionsFile, reactions);
    return reaction;
  }

  async removeReaction(data: { messageId: number; userId: number; emoji: string }) {
    let reactions = this.readJSON(this.reactionsFile);
    reactions = reactions.filter(
      (r: any) => !(r.message_id === data.messageId && 
                    r.user_id === data.userId && 
                    r.emoji === data.emoji)
    );
    this.writeJSON(this.reactionsFile, reactions);
  }

  async getMessageReactions(messageId: number) {
    const reactions = this.readJSON(this.reactionsFile);
    return reactions.filter((r: any) => r.message_id === messageId);
  }

  async getReactionCounts(messageId: number) {
    const reactions = this.readJSON(this.reactionsFile);
    const messageReactions = reactions.filter((r: any) => r.message_id === messageId);
    
    const counts: any = {};
    messageReactions.forEach((r: any) => {
      if (!counts[r.emoji]) {
        counts[r.emoji] = { emoji: r.emoji, count: 0, users: [] };
      }
      counts[r.emoji].count++;
      counts[r.emoji].users.push({ userId: r.user_id });
    });

    return Object.values(counts);
  }

  // Read Status
  async markMessageAsRead(data: { messageId: number; userId: number }) {
    const readStatuses = this.readJSON(this.readStatusFile);
    
    const index = readStatuses.findIndex(
      (rs: any) => rs.message_id === data.messageId && rs.user_id === data.userId
    );

    if (index >= 0) {
      readStatuses[index].read_at = new Date().toISOString();
    } else {
      const readStatus = {
        id: readStatuses.length > 0 ? Math.max(...readStatuses.map((rs: any) => rs.id)) + 1 : 1,
        message_id: data.messageId,
        user_id: data.userId,
        read_at: new Date().toISOString()
      };
      readStatuses.push(readStatus);
    }

    this.writeJSON(this.readStatusFile, readStatuses);
    return readStatuses[index >= 0 ? index : readStatuses.length - 1];
  }

  async markConversationAsRead(conversationId: number, userId: number) {
    const messages = this.readJSON(this.messagesFile);
    const conversationMessages = messages.filter(
      (m: any) => m.conversation_id === conversationId && m.sender_id !== userId
    );

    let count = 0;
    for (const message of conversationMessages) {
      await this.markMessageAsRead({ messageId: message.id, userId });
      count++;
    }

    return count;
  }

  async getUnreadMessageCount(userId: number, conversationId?: number) {
    const messages = this.readJSON(this.messagesFile);
    const readStatuses = this.readJSON(this.readStatusFile);
    
    let filtered = messages.filter((m: any) => m.sender_id !== userId);
    
    if (conversationId) {
      filtered = filtered.filter((m: any) => m.conversation_id === conversationId);
    } else {
      // Filter by conversations user is part of
      const participants = this.readJSON(this.participantsFile);
      const userConvIds = participants
        .filter((p: any) => p.user_id === userId && p.is_active)
        .map((p: any) => p.conversation_id);
      filtered = filtered.filter((m: any) => userConvIds.includes(m.conversation_id));
    }

    const unreadMessages = filtered.filter((m: any) => {
      return !readStatuses.some(
        (rs: any) => rs.message_id === m.id && rs.user_id === userId
      );
    });

    return unreadMessages.length;
  }

  async getMessageReadStatus(messageId: number) {
    const readStatuses = this.readJSON(this.readStatusFile);
    return readStatuses.filter((rs: any) => rs.message_id === messageId);
  }

  // Typing Indicators
  async setTypingStatus(data: { conversationId: number; userId: number; isTyping: boolean }) {
    // In file mode, typing indicators are not persisted
    // They should be handled via WebSocket/real-time only
    return null;
  }

  async getTypingUsers(conversationId: number) {
    // In file mode, return empty array
    // Typing indicators are real-time only
    return [];
  }
}

// Export unified interface
export const chatStorage = USE_DATABASE 
  ? new DatabaseChatStorage()
  : new FileChatStorage();
