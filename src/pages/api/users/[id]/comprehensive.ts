import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const COMPREHENSIVE_DATA_PATH = path.resolve("public/data/comprehensive-user-data.json");

function ensureDataDirectory() {
  const dataDir = path.dirname(COMPREHENSIVE_DATA_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readComprehensiveData() {
  ensureDataDirectory();
  if (!fs.existsSync(COMPREHENSIVE_DATA_PATH)) {
    fs.writeFileSync(COMPREHENSIVE_DATA_PATH, "{}");
  }
  try {
    return JSON.parse(fs.readFileSync(COMPREHENSIVE_DATA_PATH, "utf-8"));
  } catch (error) {
    console.error('Error reading comprehensive data:', error);
    return {};
  }
}

function writeComprehensiveData(data: any) {
  ensureDataDirectory();
  try {
    fs.writeFileSync(COMPREHENSIVE_DATA_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing comprehensive data:', error);
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const userId = parseInt(String(id));

  if (req.method === "GET") {
    try {
      const allData = readComprehensiveData();
      const userData = allData[userId];
      
      if (!userData) {
        return res.status(404).json({ error: "User data not found" });
      }
      
      return res.status(200).json(userData);
    } catch (error) {
      console.error('Error in comprehensive GET:', error);
      return res.status(500).json({ error: "Failed to fetch user data" });
    }
  }

  if (req.method === "POST") {
    try {
      const comprehensiveData = req.body;
      const allData = readComprehensiveData();
      
      allData[userId] = {
        ...comprehensiveData,
        lastUpdated: new Date().toISOString()
      };
      
      writeComprehensiveData(allData);
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in comprehensive POST:', error);
      return res.status(500).json({ error: "Failed to save user data" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
