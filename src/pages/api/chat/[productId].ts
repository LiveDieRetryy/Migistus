import type { NextApiRequest, NextApiResponse } from "next";
import { emitChatMessage } from '@/utils/socketEmitter';
import { db } from "@/lib/db";

async function getProfanityList() {
  try {
    const moderation = await db.getModerationSettings();
    return Array.isArray(moderation?.profanityList) ? moderation.profanityList : [];
  } catch (error) {
    // fallback
    return [
      "damn", "hell", "crap", "shit", "fuck", "bitch", "ass", "bastard", "piss",
      "scam", "fake", "spam", "bot", "phishing", "virus", "malware",
      "better deal", "cheaper elsewhere", "dont buy", "don't buy", "overpriced", "ripoff", "rip off"
    ];
  }
}

function filterProfanity(text: string, list: string[]) {
  let filtered = text;
  list.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    filtered = filtered.replace(regex, "*".repeat(word.length));
  });
  return filtered;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { productId } = req.query;
  if (!productId || typeof productId !== "string") {
    return res.status(400).json({ error: "Missing productId" });
  }
  
  const profanityList = await getProfanityList();
  const productIdNum = parseInt(productId);

  if (req.method === "GET") {
    try {
      const messages = await db.getChatMessages(productIdNum);
      res.status(200).json(messages);
    } catch (err) {
      console.error("Failed to load chat:", err);
      res.status(500).json({ error: "Failed to load chat" });
    }
  } else if (req.method === "POST") {
    try {
      const message = req.body;
      
      // Profanity filter on backend
      let filteredMessage = message.message;
      let filtered = false;
      profanityList.forEach((word: string) => {
        const regex = new RegExp(`\\b${word}\\b`, "i");
        if (regex.test(filteredMessage)) filtered = true;
      });
      if (filtered) {
        filteredMessage = filterProfanity(filteredMessage, profanityList);
      }
      
      const newMessage = await db.createChatMessage({
        productId: productIdNum,
        senderId: message.senderId || 0,
        senderName: message.senderName || 'Anonymous',
        message: filteredMessage,
        filtered
      });
      
      // Emit real-time message via Socket.IO
      emitChatMessage({
        id: newMessage.id.toString(),
        conversationId: `product-${productId}`,
        senderId: newMessage.sender_id,
        senderName: newMessage.sender_name,
        senderAvatar: null,
        content: newMessage.message,
        createdAt: newMessage.created_at,
        read: false
      });
      
      res.status(201).json({ success: true, message: newMessage });
    } catch (err) {
      console.error("Failed to save message:", err);
      res.status(500).json({ error: "Failed to save message" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
