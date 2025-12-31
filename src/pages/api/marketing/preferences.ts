import type { NextApiRequest, NextApiResponse } from "next";
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method === "GET") {
    try {
      const { userId } = req.query;
      
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
    } catch (error) {
      console.error('Error in marketing preferences PUT:', error);
      return res.status(500).json({ error: "Failed to update marketing preferences" });
    }
  }
  
  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
