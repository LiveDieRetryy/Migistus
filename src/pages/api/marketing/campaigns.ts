import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";

// Mock email sending function (replace with actual email service like SendGrid, Mailgun, etc.)
async function sendEmail(to: string, subject: string, htmlContent: string, textContent: string) {
  // For demo purposes, we'll just log the email
  console.log(`📧 Email sent to ${to}:`);
  console.log(`Subject: ${subject}`);
  console.log(`Content: ${textContent.substring(0, 100)}...`);
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return { success: true, messageId: `mock_${Date.now()}` };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const campaigns = await db.getEmailCampaigns();
      return res.status(200).json({ campaigns });
    } catch (error) {
      console.error('Error in email campaigns GET:', error);
      return res.status(500).json({ error: "Failed to fetch email campaigns" });
    }
  }
  
  if (req.method === "POST") {
    try {
      const { 
        name,
        subject, 
        content,
        targetAudience,
        sendImmediately,
        scheduledFor
      } = req.body;
      
      if (!subject || !content || !name) {
        return res.status(400).json({ error: "Name, subject, and content are required" });
      }
      
      const users = await db.getAllUsers();
      let targetUsers: any[] = [];
      
      // Filter users based on target audience
      if (targetAudience.type === 'all') {
        targetUsers = users.filter((user: any) => user.email && !user.banned);
      } else if (targetAudience.type === 'marketing_optin') {
        targetUsers = users.filter((user: any) => 
          user.email && 
          !user.banned && 
          user.agree_to_marketing === true
        );
      } else if (targetAudience.type === 'specific_tiers') {
        targetUsers = users.filter((user: any) => 
          user.email && 
          !user.banned && 
          user.agree_to_marketing === true &&
          targetAudience.tiers?.includes(user.tier)
        );
      }
      
      if (targetUsers.length === 0) {
        return res.status(400).json({ error: "No users match the target criteria" });
      }
      
      const campaign = await db.createEmailCampaign({
        name,
        subject,
        content,
        targetTier: targetAudience.tiers?.[0] || null,
        status: sendImmediately ? 'sending' : 'scheduled',
        scheduledFor
      });
      
      if (sendImmediately) {
        console.log(`🚀 Starting email campaign: ${subject} to ${targetUsers.length} users`);
        
        let sentCount = 0;
        let failedCount = 0;
        
        for (const user of targetUsers) {
          try {
            const personalizedContent = content
              .replace(/{{firstName}}/g, user.first_name || user.username)
              .replace(/{{username}}/g, user.username)
              .replace(/{{tier}}/g, user.tier || 'Member');
            
            await sendEmail(user.email, subject, personalizedContent, personalizedContent);
            sentCount++;
          } catch (error) {
            console.error(`Failed to send email to ${user.email}:`, error);
            failedCount++;
          }
        }
        
        await db.updateEmailCampaign(campaign.id, {
          status: 'completed',
          sentAt: new Date().toISOString()
        });
        
        console.log(`✅ Email campaign completed: ${sentCount} sent, ${failedCount} failed`);
      }
      
      return res.status(201).json({ 
        success: true, 
        message: sendImmediately ? "Email campaign sent successfully" : "Email campaign scheduled successfully",
        campaign
      });
    } catch (error) {
      console.error('Error in email campaign POST:', error);
      return res.status(500).json({ error: "Failed to create email campaign" });
    }
  }
  
  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
