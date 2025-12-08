import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const usersFilePath = path.resolve("public/data/users.json");

function ensureDataDirectory() {
  const dataDir = path.dirname(usersFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readUsers() {
  ensureDataDirectory();
  if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify({ users: [] }, null, 2));
  }
  try {
    const data = JSON.parse(fs.readFileSync(usersFilePath, "utf-8"));
    return Array.isArray(data.users) ? data.users : [];
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

function writeUsers(users: any[]) {
  ensureDataDirectory();
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify({ users }, null, 2));
  } catch (error) {
    console.error('Error writing users file:', error);
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const userId = parseInt(String(id));

  if (req.method === "GET") {
    try {
      const users = readUsers();
      const user = users.find((u: any) => u.id === userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      return res.status(200).json(user);
    } catch (error) {
      console.error('Error in user GET:', error);
      return res.status(500).json({ error: "Failed to fetch user" });
    }
  }

  if (req.method === "PUT") {
    try {
      console.log(`📝 PUT request for user ID: ${userId}`);
      console.log('📦 Update data:', JSON.stringify(req.body, null, 2));
      
      const users = readUsers();
      const userIndex = users.findIndex((u: any) => u.id === userId);
      
      if (userIndex === -1) {
        console.error(`❌ User ${userId} not found in database`);
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log(`🎯 Found user: ${users[userIndex].username} at index ${userIndex}`);
      
      // Merge the updates with existing user data
      users[userIndex] = { 
        ...users[userIndex], 
        ...req.body,
        updatedAt: new Date().toISOString() // Track when user was last updated
      };
      
      writeUsers(users);
      console.log(`✅ User ${users[userIndex].username} updated successfully`);
      
      return res.status(200).json({ success: true, user: users[userIndex] });
    } catch (error) {
      console.error('❌ Error in user PUT:', error);
      return res.status(500).json({ 
        error: "Failed to update user",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === "DELETE") {
    try {
      console.log(`🗑️ DELETE request for user ID: ${userId}`);
      const users = readUsers();
      console.log(`📊 Total users before delete: ${users.length}`);
      
      const userToDelete = users.find((u: any) => u.id === userId);
      
      if (!userToDelete) {
        console.error(`❌ User ${userId} not found in database`);
        return res.status(404).json({ error: "User not found" });
      }

      console.log(`🎯 Found user to delete: ${userToDelete.username} (ID: ${userId})`);
      const filteredUsers = users.filter((u: any) => u.id !== userId);
      console.log(`📊 Users after filter: ${filteredUsers.length}`);
      
      writeUsers(filteredUsers);
      console.log(`✅ User ${userToDelete.username} removed from users.json`);

      // Clean up chat messages/reports
      try {
        const chatPath = path.resolve("public/data/chat-messages.json");
        if (fs.existsSync(chatPath)) {
          const messages = JSON.parse(fs.readFileSync(chatPath, "utf-8"));
          const filteredMessages = messages.filter((msg: any) => msg.userId !== userId);
          fs.writeFileSync(chatPath, JSON.stringify(filteredMessages, null, 2));
          console.log(`🧹 Cleaned up chat messages for user ${userId}`);
        }

        const reportsPath = path.resolve("public/data/reported-chats.json");
        if (fs.existsSync(reportsPath)) {
          const reports = JSON.parse(fs.readFileSync(reportsPath, "utf-8"));
          const filteredReports = reports.filter((report: any) => 
            report.reportedUserId !== userId && 
            report.reporterId !== userId
          );
          fs.writeFileSync(reportsPath, JSON.stringify(filteredReports, null, 2));
          console.log(`🧹 Cleaned up reports for user ${userId}`);
        }
      } catch (error) {
        console.error("⚠️ Error cleaning up user data files:", error);
        // Continue with deletion even if cleanup fails
      }

      console.log(`✅ Successfully deleted user ${userToDelete.username} (ID: ${userId})`);
      return res.status(200).json({
        success: true,
        message: `User ${userToDelete.username} and all associated data has been permanently deleted`,
        deletedUser: userToDelete,
        cleanupPerformed: true
      });
    } catch (error) {
      console.error('❌ Error in user DELETE:', error);
      return res.status(500).json({ 
        error: "Failed to delete user",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
