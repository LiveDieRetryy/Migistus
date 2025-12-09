import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const chatPath = path.join(process.cwd(), 'public', 'data', 'product-chat.json');
const sessionsPath = path.join(process.cwd(), 'public', 'data', 'user-sessions.json');
const moderationPath = path.join(process.cwd(), 'public', 'data', 'moderation.json');

interface ChatMessage {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  message: string;
  createdAt: string;
  moderated?: boolean;
}

// Profanity filter - comprehensive list
const PROFANITY_LIST = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'hell', 'crap', 'piss', 'dick', 'cock',
  'pussy', 'slut', 'whore', 'fag', 'nigger', 'nigga', 'retard', 'bastard', 'cunt',
  'asshole', 'motherfucker', 'bullshit', 'goddamn', 'jesus christ', 'prick', 'douche',
  'twat', 'wanker', 'bollocks', 'arse', 'bugger', 'bloody', 'tosser', 'shithead',
  'dickhead', 'fucktard', 'dumbass', 'jackass', 'dipshit', 'scumbag'
];

// Spam patterns
const SPAM_PATTERNS = [
  /(.)\1{4,}/gi, // Repeated characters (e.g., "aaaaaaa")
  /^[A-Z\s!]{20,}$/g, // ALL CAPS messages
  /(https?:\/\/|www\.)/gi, // URLs
  /(\d{10,})/g, // Long number sequences (phone numbers)
  /[@#]\w+/g, // Social media handles (when excessive)
];

const containsProfanity = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return PROFANITY_LIST.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });
};

const containsSpam = (text: string): boolean => {
  // Check for URL spam
  if (/https?:\/\/|www\./gi.test(text)) return true;
  
  // Check for excessive repetition
  if (/(.)\1{5,}/gi.test(text)) return true;
  
  // Check for all caps (if message is longer than 20 chars)
  if (text.length > 20 && text === text.toUpperCase() && /[A-Z]/.test(text)) return true;
  
  return false;
};

const filterProfanity = (text: string): string => {
  let filtered = text;
  PROFANITY_LIST.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, (match) => '*'.repeat(match.length));
  });
  return filtered;
};

const logModeration = (userId: number, productId: number, message: string, reason: string) => {
  try {
    let logs: any[] = [];
    if (fs.existsSync(moderationPath)) {
      logs = JSON.parse(fs.readFileSync(moderationPath, 'utf8'));
    }
    
    logs.push({
      userId,
      productId,
      message,
      reason,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 1000 entries
    if (logs.length > 1000) {
      logs = logs.slice(-1000);
    }
    
    fs.writeFileSync(moderationPath, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error logging moderation:', error);
  }
};

const getChatMessages = (): ChatMessage[] => {
  try {
    if (!fs.existsSync(chatPath)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(chatPath, 'utf8'));
  } catch (error) {
    console.error('Error reading chat messages:', error);
    return [];
  }
};

const saveChatMessages = (messages: ChatMessage[]) => {
  fs.writeFileSync(chatPath, JSON.stringify(messages, null, 2));
};

const getUserFromSession = (sessionId: string | undefined): { userId: number; userName: string } | null => {
  if (!sessionId) return null;
  
  try {
    if (!fs.existsSync(sessionsPath)) {
      console.log('Sessions file does not exist');
      return null;
    }
    const fileContent = fs.readFileSync(sessionsPath, 'utf8');
    if (!fileContent || fileContent.trim() === '') {
      console.log('Sessions file is empty');
      return null;
    }
    const sessions = JSON.parse(fileContent);
    if (!Array.isArray(sessions)) {
      console.log('Sessions data is not an array');
      return null;
    }
    const session = sessions.find((s: any) => s.sessionId === sessionId);
    return session ? { userId: session.userId, userName: session.userName || `User ${session.userId}` } : null;
  } catch (error) {
    console.error('Error reading sessions:', error);
    return null;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const productId = parseInt(id as string, 10);

  if (isNaN(productId)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  // GET - Fetch chat messages for a product
  if (req.method === 'GET') {
    const { limit = '50', offset = '0' } = req.query;
    const messages = getChatMessages();
    const productMessages = messages
      .filter(msg => msg.productId === productId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string));

    return res.status(200).json(productMessages.reverse()); // Return in chronological order
  }

  // POST - Send a new chat message
  if (req.method === 'POST') {
    const sessionId = req.cookies.sessionId;
    const user = getUserFromSession(sessionId);

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (message.trim().length > 500) {
      return res.status(400).json({ error: 'Message too long (max 500 characters)' });
    }

    const trimmedMessage = message.trim();

    // Check for spam
    if (containsSpam(trimmedMessage)) {
      logModeration(user.userId, productId, trimmedMessage, 'spam_detected');
      return res.status(400).json({ 
        error: 'Message flagged as spam. Please avoid URLs, excessive caps, or repeated characters.' 
      });
    }

    // Check for profanity and filter it
    let finalMessage = trimmedMessage;
    let wasModerated = false;
    
    if (containsProfanity(trimmedMessage)) {
      finalMessage = filterProfanity(trimmedMessage);
      wasModerated = true;
      logModeration(user.userId, productId, trimmedMessage, 'profanity_filtered');
    }

    const messages = getChatMessages();

    // Rate limiting: Check if user sent message in last 3 seconds
    const recentUserMessages = messages.filter(
      m => m.userId === user.userId && 
      new Date(m.createdAt).getTime() > Date.now() - 3000
    );

    if (recentUserMessages.length > 0) {
      return res.status(429).json({ 
        error: 'Please wait a few seconds before sending another message' 
      });
    }

    const newMessage: ChatMessage = {
      id: messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1,
      productId,
      userId: user.userId,
      userName: user.userName,
      message: finalMessage,
      createdAt: new Date().toISOString(),
      moderated: wasModerated
    };

    messages.push(newMessage);
    saveChatMessages(messages);

    return res.status(201).json(newMessage);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
