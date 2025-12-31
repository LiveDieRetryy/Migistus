import type { NextApiRequest, NextApiResponse } from "next";
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const userId = parseInt(String(id));

  if (req.method === "GET") {
    try {
      console.log("🔐 Fetching user from database");
      const user = await db.getUserById(userId);
      
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
      
      const { action, reason, durationMinutes, ...updateData } = req.body;
      
      // Handle enforcement actions
      if (action) {
        console.log(`⚖️ Enforcement action: ${action} for user ${userId}`);
        
        let result;
        try {
          switch (action) {
            case 'ban':
              result = await db.banUser(userId, updateData.adminId || 1, reason);
              break;
            case 'unban':
              result = await db.unbanUser(userId, updateData.adminId || 1);
              break;
            case 'mute':
              if (!durationMinutes) {
                return res.status(400).json({ error: 'Duration required for mute action' });
              }
              result = await db.muteUser(userId, updateData.adminId || 1, durationMinutes, reason);
              break;
            case 'unmute':
              result = await db.unmuteUser(userId, updateData.adminId || 1);
              break;
            default:
              return res.status(400).json({ error: 'Invalid action' });
          }

          if (!result) {
            return res.status(404).json({ error: 'User not found' });
          }

          console.log(`✅ User ${action}ned successfully`);
          const { password_hash, ...safeUser } = result;
          return res.status(200).json({ 
            success: true, 
            message: `User ${action}ned successfully`,
            user: safeUser 
          });
        } catch (enforcementError) {
          console.error('❌ Enforcement error:', enforcementError);
          return res.status(500).json({ 
            error: 'Failed to execute enforcement action',
            details: enforcementError instanceof Error ? enforcementError.message : 'Unknown error'
          });
        }
      }
      
      // Regular user update
      console.log("🔐 Updating user in database");
      const updatedUser = await db.updateUser(userId, updateData);
      
      if (!updatedUser) {
        console.error(`❌ User ${userId} not found in database`);
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log(`✅ User ${updatedUser.username} updated successfully`);
      
      return res.status(200).json({ success: true, user: updatedUser });
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
      console.log("🔐 Deleting user from database");
      
      const deletedUser = await db.deleteUser(userId);
      
      if (!deletedUser) {
        console.error(`❌ User ${userId} not found for deletion`);
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log(`✅ User ${deletedUser.username} deleted successfully`);
      console.log(`✅ Successfully deleted user ${deletedUser.username} (ID: ${userId})`);
      
      return res.status(200).json({
        success: true,
        message: `User ${deletedUser.username} and all associated data has been permanently deleted`,
        deletedUser: deletedUser,
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
