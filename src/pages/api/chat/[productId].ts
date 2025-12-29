import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { emitChatMessage } from '@/utils/socketEmitter';

const MODERATION_PATH = path.resolve("public/data/moderation.json");

function getProfanityList() {
  try {
    if (fs.existsSync(MODERATION_PATH)) {
      const moderation = JSON.parse(fs.readFileSync(MODERATION_PATH, "utf-8"));
      return Array.isArray(moderation.profanityList) ? moderation.profanityList : [];
    }
  } catch {}
  // fallback
  return [
    "damn", "hell", "crap", "shit", "fuck", "bitch", "ass", "bastard", "piss",
    "scam", "fake", "spam", "bot", "phishing", "virus", "malware",
    "better deal", "cheaper elsewhere", "dont buy", "don't buy", "overpriced", "ripoff", "rip off"
  ];
}

function filterProfanity(text: string, list: string[]) {
  let filtered = text;
  list.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    filtered = filtered.replace(regex, "*".repeat(word.length));
  });
  return filtered;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { productId } = req.query;
  if (!productId || typeof productId !== "string") {
    return res.status(400).json({ error: "Missing productId" });
  }
  const filePath = path.resolve("public/data", `chat-${productId}.json`);
  const profanityList = getProfanityList();

  if (req.method === "GET") {
    try {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "[]");
      }
      const messages = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      res.status(200).json(messages);
    } catch (err) {
      res.status(500).json({ error: "Failed to load chat" });
    }
  } else if (req.method === "POST") {
    try {
      const message = req.body;
      let messages: any[] = [];
      if (fs.existsSync(filePath)) {
        messages = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      }
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
      const newMessage = {
        ...message,
        id: Date.now().toString(),
        message: filteredMessage,
        content: filteredMessage,
        filtered,
        timestamp: new Date().toISOString()
      };
      
      messages.push(newMessage);
      fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));
      
      // Emit real-time message via Socket.IO
      const conversationId = `product-${productId}`;
      emitChatMessage(conversationId, {
        id: newMessage.id,
        senderId: message.senderId || 0,
        content: filteredMessage,
        timestamp: newMessage.timestamp
      });
      
      res.status(201).json({ success: true, message: newMessage });
    } catch (err) {
      res.status(500).json({ error: "Failed to save message" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
