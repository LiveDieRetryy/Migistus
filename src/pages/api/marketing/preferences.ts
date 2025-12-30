import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { db, isProduction } from '@/lib/db';

const USERS_PATH = path.resolve("public/data/users.json");
const MARKETING_PREFERENCES_PATH = path.resolve("public/data/marketing-preferences.json");

function readUsers() {
  try {
    if (!fs.existsSync(USERS_PATH)) {
      const initialData = { users: [] };
      fs.writeFileSync(USERS_PATH, JSON.stringify(initialData, null, 2));
      return [];
    }
    
    const fileContent = fs.readFileSync(USERS_PATH, "utf-8");
    const data = JSON.parse(fileContent);
    
    if (Array.isArray(data)) {
      return data;
    } else if (data.users && Array.isArray(data.users)) {
      return data.users;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error reading users file:", error);
    return [];
  }
}

function writeUsers(users: any[]) {
  try {
    const dir = path.dirname(USERS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const data = { users };
    fs.writeFileSync(USERS_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing users file:", error);
    throw new Error("Failed to save user data");
  }
}

function readMarketingPreferences() {
  try {
    if (!fs.existsSync(MARKETING_PREFERENCES_PATH)) {
      const initialData = { preferences: [] };
      fs.writeFileSync(MARKETING_PREFERENCES_PATH, JSON.stringify(initialData, null, 2));
      return [];
    }
    
    const fileContent = fs.readFileSync(MARKETING_PREFERENCES_PATH, "utf-8");
    const data = JSON.parse(fileContent);
    
    return data.preferences || [];
  } catch (error) {
    console.error("Error reading marketing preferences file:", error);
    return [];
  }
}

function writeMarketingPreferences(preferences: any[]) {
  try {
    const dir = path.dirname(MARKETING_PREFERENCES_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const data = { preferences };
    fs.writeFileSync(MARKETING_PREFERENCES_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing marketing preferences file:", error);
    throw new Error("Failed to save marketing preferences");
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const useProduction = isProduction();

  if (req.method === "GET") {
    try {
      const { userId } = req.query;
      
      if (useProduction) {
        // ============================================
        // PRODUCTION: Use database
        // ============================================
        
        if (userId) {
          // Get specific user's marketing preferences
          const user = await db.getUserById(parseInt(String(userId)));
          
          if (!user) {
            return res.status(404).json({ error: "User not found" });
          }
          
          const settings = await db.getUserSettings(user.id);
          
          return res.status(200).json({
            userId: user.id,
            agreeToMarketing: settings?.marketing_emails || false,
            emailNotifications: settings?.email_notifications ?? true,
            marketingEmails: settings?.marketing_emails || false,
            productUpdates: settings?.preferences?.productUpdates ?? true,
            orderUpdates: settings?.preferences?.orderUpdates ?? true
          });
        } else {
          // Get all users with marketing preferences enabled (for admin)
          const usersWithSettings = await db.getUsersWithMarketingOptIn();
          
          return res.status(200).json({
            totalUsers: usersWithSettings.totalUsers,
            marketingOptInUsers: usersWithSettings.optInUsers,
            users: usersWithSettings.users.map((user: any) => ({
              id: user.id,
              username: user.username,
              email: user.email,
              firstName: user.first_name,
              lastName: user.last_name,
              tier: user.tier,
              joinDate: user.created_at,
              agreeToMarketing: user.marketing_emails,
              emailNotifications: user.email_notifications,
              marketingEmails: user.marketing_emails
            }))
          });
        }

      } else {
        // ============================================
        // DEVELOPMENT: Use file system (legacy)
        // ============================================
        
        if (userId) {
          // Get specific user's marketing preferences
          const users = readUsers();
          const user = users.find((u: any) => u.id === parseInt(String(userId)));
          
          if (!user) {
            return res.status(404).json({ error: "User not found" });
          }
          
          return res.status(200).json({
            userId: user.id,
            agreeToMarketing: user.agreeToMarketing || false,
            emailNotifications: user.emailNotifications || true,
            marketingEmails: user.marketingEmails || false,
            productUpdates: user.productUpdates || true,
            orderUpdates: user.orderUpdates || true
          });
        } else {
          // Get all users with marketing preferences enabled (for admin)
          const users = readUsers();
          const marketingUsers = users.filter((user: any) => user.agreeToMarketing === true);
          
          return res.status(200).json({
            totalUsers: users.length,
            marketingOptInUsers: marketingUsers.length,
            users: marketingUsers.map((user: any) => ({
              id: user.id,
              username: user.username,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              tier: user.tier,
              joinDate: user.joinDate,
              agreeToMarketing: user.agreeToMarketing,
              emailNotifications: user.emailNotifications,
              marketingEmails: user.marketingEmails
            }))
          });
        }
      }
    } catch (error) {
      console.error('Error in marketing preferences GET:', error);
      return res.status(500).json({ error: "Failed to fetch marketing preferences" });
    }
  }
  
  if (req.method === "PUT") {
    try {
      const { userId, agreeToMarketing, emailNotifications, marketingEmails, productUpdates, orderUpdates } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      if (useProduction) {
        // ============================================
        // PRODUCTION: Use database
        // ============================================
        
        const user = await db.getUserById(parseInt(String(userId)));
        
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        
        // Get current settings
        let settings = await db.getUserSettings(user.id);
        
        // Create settings if they don't exist
        if (!settings) {
          settings = await db.createUserSettings(user.id);
        }
        
        // Build preferences object
        const currentPreferences = settings.preferences || {};
        const newPreferences = {
          ...currentPreferences,
          productUpdates: productUpdates !== undefined ? productUpdates : currentPreferences.productUpdates ?? true,
          orderUpdates: orderUpdates !== undefined ? orderUpdates : currentPreferences.orderUpdates ?? true
        };
        
        // Update settings
        await db.updateUserSettings(user.id, {
          emailNotifications: emailNotifications !== undefined ? emailNotifications : settings.email_notifications,
          marketingEmails: agreeToMarketing !== undefined ? agreeToMarketing : marketingEmails !== undefined ? marketingEmails : settings.marketing_emails,
          preferences: newPreferences
        });
        
        // Get updated settings
        const updatedSettings = await db.getUserSettings(user.id);
        
        return res.status(200).json({ 
          success: true, 
          message: "Marketing preferences updated successfully",
          preferences: {
            agreeToMarketing: updatedSettings?.marketing_emails || false,
            emailNotifications: updatedSettings?.email_notifications ?? true,
            marketingEmails: updatedSettings?.marketing_emails || false,
            productUpdates: updatedSettings?.preferences?.productUpdates ?? true,
            orderUpdates: updatedSettings?.preferences?.orderUpdates ?? true
          }
        });

      } else {
        // ============================================
        // DEVELOPMENT: Use file system (legacy)
        // ============================================
        
        const users = readUsers();
        const userIndex = users.findIndex((u: any) => u.id === parseInt(String(userId)));
        
        if (userIndex === -1) {
          return res.status(404).json({ error: "User not found" });
        }
        
        // Update user's marketing preferences
        users[userIndex] = {
          ...users[userIndex],
          agreeToMarketing: agreeToMarketing !== undefined ? agreeToMarketing : users[userIndex].agreeToMarketing,
          emailNotifications: emailNotifications !== undefined ? emailNotifications : users[userIndex].emailNotifications,
          marketingEmails: marketingEmails !== undefined ? marketingEmails : users[userIndex].marketingEmails,
          productUpdates: productUpdates !== undefined ? productUpdates : users[userIndex].productUpdates,
          orderUpdates: orderUpdates !== undefined ? orderUpdates : users[userIndex].orderUpdates,
          updatedAt: new Date().toISOString()
        };
        
        writeUsers(users);
        
        // Log the preference change
        const preferences = readMarketingPreferences();
        preferences.push({
          userId: parseInt(String(userId)),
          username: users[userIndex].username,
          email: users[userIndex].email,
          action: agreeToMarketing ? 'opted_in' : 'opted_out',
          timestamp: new Date().toISOString(),
          previousValue: users[userIndex].agreeToMarketing,
          newValue: agreeToMarketing
        });
        
        writeMarketingPreferences(preferences);
        
        return res.status(200).json({ 
          success: true, 
          message: "Marketing preferences updated successfully",
          preferences: {
            agreeToMarketing: users[userIndex].agreeToMarketing,
            emailNotifications: users[userIndex].emailNotifications,
            marketingEmails: users[userIndex].marketingEmails,
            productUpdates: users[userIndex].productUpdates,
            orderUpdates: users[userIndex].orderUpdates
          }
        });
      }
    } catch (error) {
      console.error('Error in marketing preferences PUT:', error);
      return res.status(500).json({ error: "Failed to update marketing preferences" });
    }
  }
  
  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
