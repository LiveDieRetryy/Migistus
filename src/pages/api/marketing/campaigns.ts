import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const USERS_PATH = path.resolve("public/data/users.json");
const EMAIL_CAMPAIGNS_PATH = path.resolve("public/data/email-campaigns.json");

function readUsers() {
  try {
    if (!fs.existsSync(USERS_PATH)) {
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

function readEmailCampaigns() {
  try {
    if (!fs.existsSync(EMAIL_CAMPAIGNS_PATH)) {
      const initialData = { campaigns: [] };
      fs.writeFileSync(EMAIL_CAMPAIGNS_PATH, JSON.stringify(initialData, null, 2));
      return [];
    }
    
    const fileContent = fs.readFileSync(EMAIL_CAMPAIGNS_PATH, "utf-8");
    const data = JSON.parse(fileContent);
    
    return data.campaigns || [];
  } catch (error) {
    console.error("Error reading email campaigns file:", error);
    return [];
  }
}

function writeEmailCampaigns(campaigns: any[]) {
  try {
    const dir = path.dirname(EMAIL_CAMPAIGNS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const data = { campaigns };
    fs.writeFileSync(EMAIL_CAMPAIGNS_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing email campaigns file:", error);
    throw new Error("Failed to save email campaign");
  }
}

// Mock email sending function (replace with actual email service like SendGrid, Mailgun, etc.)
async function sendEmail(to: string, subject: string, htmlContent: string, textContent: string) {
  // For demo purposes, we'll just log the email
  console.log(`📧 Email sent to ${to}:`);
  console.log(`Subject: ${subject}`);
  console.log(`Content: ${textContent.substring(0, 100)}...`);
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // In a real implementation, you would use an email service:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to,
    from: 'noreply@migistus.com',
    subject,
    text: textContent,
    html: htmlContent,
  };
  
  await sgMail.send(msg);
  */
  
  return { success: true, messageId: `mock_${Date.now()}` };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      // Get all email campaigns
      const campaigns = readEmailCampaigns();
        return res.status(200).json({
        campaigns: campaigns.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      });
    } catch (error) {
      console.error('Error in email campaigns GET:', error);
      return res.status(500).json({ error: "Failed to fetch email campaigns" });
    }
  }
  
  if (req.method === "POST") {
    try {
      const { 
        subject, 
        htmlContent, 
        textContent, 
        targetAudience, // 'all', 'marketing_optin', 'specific_tiers'
        selectedTiers,  // ['New Member', 'Guild', 'MIGISTUS']
        sendImmediately,
        scheduledFor,
        adminId,
        adminUsername
      } = req.body;
      
      if (!subject || !htmlContent || !textContent) {
        return res.status(400).json({ error: "Subject, HTML content, and text content are required" });
      }
      
      const users = readUsers();
      let targetUsers: any[] = [];
      
      // Filter users based on target audience
      switch (targetAudience) {
        case 'all':
          targetUsers = users.filter((user: any) => user.email && !user.banned);
          break;
        case 'marketing_optin':
          targetUsers = users.filter((user: any) => 
            user.email && 
            !user.banned && 
            user.agreeToMarketing === true
          );
          break;
        case 'specific_tiers':
          targetUsers = users.filter((user: any) => 
            user.email && 
            !user.banned && 
            user.agreeToMarketing === true &&
            selectedTiers?.includes(user.tier)
          );
          break;
        default:
          return res.status(400).json({ error: "Invalid target audience" });
      }
      
      if (targetUsers.length === 0) {
        return res.status(400).json({ error: "No users match the target criteria" });
      }
      
      const campaignId = Date.now();      const campaign: any = {
        id: campaignId,
        subject,
        htmlContent,
        textContent,
        targetAudience,
        selectedTiers,
        targetUserCount: targetUsers.length,
        sentCount: 0,
        failedCount: 0,
        status: sendImmediately ? 'sending' : 'scheduled',
        scheduledFor: scheduledFor || null,
        createdAt: new Date().toISOString(),
        sentAt: null,
        completedAt: null,
        adminId,
        adminUsername,
        results: []
      };
      
      if (sendImmediately) {
        // Send emails immediately
        console.log(`🚀 Starting email campaign: ${subject} to ${targetUsers.length} users`);
        
        const results = [];
        let sentCount = 0;
        let failedCount = 0;
        
        for (const user of targetUsers) {
          try {
            // Personalize the content
            const personalizedHtml = htmlContent
              .replace(/{{firstName}}/g, user.firstName || user.username)
              .replace(/{{lastName}}/g, user.lastName || '')
              .replace(/{{username}}/g, user.username)
              .replace(/{{tier}}/g, user.tier || 'Member');
              
            const personalizedText = textContent
              .replace(/{{firstName}}/g, user.firstName || user.username)
              .replace(/{{lastName}}/g, user.lastName || '')
              .replace(/{{username}}/g, user.username)
              .replace(/{{tier}}/g, user.tier || 'Member');
            
            const result = await sendEmail(user.email, subject, personalizedHtml, personalizedText);
            
            results.push({
              userId: user.id,
              email: user.email,
              status: 'sent',
              messageId: result.messageId,
              sentAt: new Date().toISOString()
            });
            
            sentCount++;
          } catch (error) {
            console.error(`Failed to send email to ${user.email}:`, error);
              results.push({
              userId: user.id,
              email: user.email,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
              failedAt: new Date().toISOString()
            });
            
            failedCount++;
          }
        }
        
        campaign.sentCount = sentCount;
        campaign.failedCount = failedCount;
        campaign.status = 'completed';
        campaign.sentAt = new Date().toISOString();
        campaign.completedAt = new Date().toISOString();
        campaign.results = results;
        
        console.log(`✅ Email campaign completed: ${sentCount} sent, ${failedCount} failed`);
      }
      
      // Save campaign
      const campaigns = readEmailCampaigns();
      campaigns.push(campaign);
      writeEmailCampaigns(campaigns);
      
      return res.status(201).json({ 
        success: true, 
        message: sendImmediately ? "Email campaign sent successfully" : "Email campaign scheduled successfully",
        campaign: {
          id: campaign.id,
          subject: campaign.subject,
          targetUserCount: campaign.targetUserCount,
          sentCount: campaign.sentCount,
          failedCount: campaign.failedCount,
          status: campaign.status,
          createdAt: campaign.createdAt
        }
      });
    } catch (error) {
      console.error('Error in email campaign POST:', error);
      return res.status(500).json({ error: "Failed to create email campaign" });
    }
  }
  
  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
