import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const staffPicksFilePath = path.join(process.cwd(), "public", "data", "staff-picks.json");

// Initialize staff picks file if it doesn't exist
const initializeStaffPicksFile = () => {
  if (!fs.existsSync(staffPicksFilePath)) {
    fs.writeFileSync(staffPicksFilePath, JSON.stringify([], null, 2));
  }
};

type StaffPickData = {
  id: string;
  productId: number;
  pickDate: string;
  dropStartDate: string;
  dropEndDate: string;
  limitedQuantity?: number;
  staffNote?: string;
  priority: number;
  createdBy: string;
  isActive: boolean;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  initializeStaffPicksFile();

  if (req.method === "GET") {
    try {
      const staffPicks = JSON.parse(fs.readFileSync(staffPicksFilePath, "utf8"));
      res.status(200).json(staffPicks);
    } catch (error) {
      console.error("Error reading staff picks:", error);
      res.status(500).json({ error: "Failed to load staff picks" });
    }
  }

  else if (req.method === "POST") {
    try {
      const { productId, dropStartDate, dropEndDate, limitedQuantity, staffNote, priority, createdBy } = req.body;

      if (!productId || !dropStartDate || !dropEndDate || !priority || !createdBy) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const staffPicks = JSON.parse(fs.readFileSync(staffPicksFilePath, "utf8"));
      
      const newStaffPick: StaffPickData = {
        id: Date.now().toString(),
        productId,
        pickDate: new Date().toISOString(),
        dropStartDate,
        dropEndDate,
        limitedQuantity,
        staffNote,
        priority,
        createdBy,
        isActive: true
      };

      staffPicks.push(newStaffPick);
      fs.writeFileSync(staffPicksFilePath, JSON.stringify(staffPicks, null, 2));

      res.status(201).json(newStaffPick);
    } catch (error) {
      console.error("Error creating staff pick:", error);
      res.status(500).json({ error: "Failed to create staff pick" });
    }
  }

  else if (req.method === "DELETE") {
    try {
      const { productId } = req.query;

      if (!productId) {
        return res.status(400).json({ error: "Product ID is required" });
      }

      const staffPicks = JSON.parse(fs.readFileSync(staffPicksFilePath, "utf8"));
      
      const updatedStaffPicks = staffPicks.filter((pick: StaffPickData) => 
        pick.productId !== parseInt(productId as string)
      );

      fs.writeFileSync(staffPicksFilePath, JSON.stringify(updatedStaffPicks, null, 2));

      res.status(200).json({ message: "Staff pick removed successfully" });
    } catch (error) {
      console.error("Error removing staff pick:", error);
      res.status(500).json({ error: "Failed to remove staff pick" });
    }
  }

  else if (req.method === "PUT") {
    try {
      const { id, ...updates } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Staff pick ID is required" });
      }

      const staffPicks = JSON.parse(fs.readFileSync(staffPicksFilePath, "utf8"));
      
      const pickIndex = staffPicks.findIndex((pick: StaffPickData) => pick.id === id);
      
      if (pickIndex === -1) {
        return res.status(404).json({ error: "Staff pick not found" });
      }

      staffPicks[pickIndex] = { ...staffPicks[pickIndex], ...updates };
      fs.writeFileSync(staffPicksFilePath, JSON.stringify(staffPicks, null, 2));

      res.status(200).json(staffPicks[pickIndex]);
    } catch (error) {
      console.error("Error updating staff pick:", error);
      res.status(500).json({ error: "Failed to update staff pick" });
    }
  }

  else {
    res.setHeader("Allow", ["GET", "POST", "DELETE", "PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
