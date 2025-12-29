import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@migistus.com';
const FROM_NAME = process.env.FROM_NAME || 'MIGISTUS Platform';

// Create reusable transporter
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport(EMAIL_CONFIG);
  }
  return transporter;
}

// Email template types
export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

// Send email function
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transport = getTransporter();
    
    const mailOptions = {
      from: options.from || `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
      replyTo: options.replyTo || 'support@migistus.com',
      headers: {
        'X-Mailer': 'MIGISTUS Platform',
        'X-Priority': '3',
        'List-Unsubscribe': '<mailto:unsubscribe@migistus.com>',
        ...options.headers,
      },
    };

    const info = await transport.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Pre-defined email templates
export const emailTemplates = {
  welcome: (username: string, loginUrl: string) => ({
    subject: 'Welcome to MIGISTUS - Your Account is Ready!',
    text: `Welcome to MIGISTUS, ${username}!\n\nThank you for joining The Guilded Marketplace. Your account is ready!\n\nYou can now:\n- Vote on upcoming products\n- Participate in exclusive Community Drops\n- Connect with other members\n- Track your orders and pledges\n- Explore curated collections\n\nGet Started: ${loginUrl}\n\nBest regards,\nThe MIGISTUS Team`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #18181b;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #18181b; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #27272a; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                <!-- Header with Logo -->
                <tr>
                  <td style="background: linear-gradient(135deg, #27272a 0%, #18181b 100%); padding: 40px 30px; text-align: center; border-bottom: 3px solid #FFD700;">
                    <img src="https://migistus.com/images/migistus_logo.png" alt="MIGISTUS" style="height: 140px; margin-bottom: 4px; display: block; margin-left: auto; margin-right: auto;">
                    <h1 style="color: #FFD700; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 1px;">Welcome to The Guilded Marketplace</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px; color: #e4e4e7;">
                    <h2 style="color: #FFD700; font-size: 24px; margin: 0 0 20px 0;">Hi ${username},</h2>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; color: #d4d4d8;">Thank you for joining MIGISTUS! Your account is now active and ready to explore.</p>
                    
                    <div style="background-color: #3f3f46; border-left: 4px solid #FFD700; padding: 20px; margin: 25px 0; border-radius: 4px;">
                      <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #FFD700;">What You Can Do Now:</p>
                      <ul style="margin: 0; padding-left: 20px; color: #d4d4d8;">
                        <li style="margin-bottom: 10px;">🗳️ Vote on upcoming products</li>
                        <li style="margin-bottom: 10px;">🔥 Participate in exclusive Community Drops</li>
                        <li style="margin-bottom: 10px;">👥 Connect with other members</li>
                        <li style="margin-bottom: 10px;">📦 Track your orders and pledges</li>
                        <li style="margin-bottom: 10px;">✨ Explore curated collections</li>
                      </ul>
                    </div>
                    
                    <!-- CTA Buttons -->
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #FFD700 0%, #B8860B 100%); color: #000; font-size: 16px; font-weight: bold; text-decoration: none; padding: 14px 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(255, 215, 0, 0.3);">Get Started</a>
                        </td>
                      </tr>
                    </table>
                    
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0;">
                      <tr>
                        <td width="32%" align="center" style="padding: 5px;">
                          <a href="${process.env.APP_URL || 'http://localhost:3000'}/live-drops" style="display: block; background-color: #3f3f46; color: #FFD700; text-decoration: none; padding: 12px 10px; border-radius: 6px; font-size: 14px; font-weight: 600; border: 1px solid #52525b;">Live Drops</a>
                        </td>
                        <td width="32%" align="center" style="padding: 5px;">
                          <a href="${process.env.APP_URL || 'http://localhost:3000'}/products" style="display: block; background-color: #3f3f46; color: #FFD700; text-decoration: none; padding: 12px 10px; border-radius: 6px; font-size: 14px; font-weight: 600; border: 1px solid #52525b;">Products</a>
                        </td>
                        <td width="32%" align="center" style="padding: 5px;">
                          <a href="${process.env.APP_URL || 'http://localhost:3000'}/community" style="display: block; background-color: #3f3f46; color: #FFD700; text-decoration: none; padding: 12px 10px; border-radius: 6px; font-size: 14px; font-weight: 600; border: 1px solid #52525b;">Community</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #18181b; padding: 30px; text-align: center; border-top: 1px solid #3f3f46;">
                    <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 10px 0;">Best regards,<br><strong style="color: #FFD700;">The MIGISTUS Team</strong></p>
                    <p style="color: #71717a; font-size: 12px; margin: 10px 0 0 0;">© ${new Date().getFullYear()} MIGISTUS. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  }),

  emailVerification: (username: string, verificationCode: string, expiryMinutes: number = 60) => ({
    subject: 'Verify Your MIGISTUS Email Address',
    text: `Hi ${username},\n\nWelcome to MIGISTUS! Please verify your email address to activate your account.\n\nYour verification code is: ${verificationCode}\n\nThis code will expire in ${expiryMinutes} minutes.\n\nIf you didn't create this account, please ignore this email.\n\nBest regards,\nThe MIGISTUS Team`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #18181b;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #18181b; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #27272a; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #27272a 0%, #18181b 100%); padding: 40px 30px; text-align: center; border-bottom: 3px solid #FFD700;">
                    <img src="https://migistus.com/images/migistus_logo.png" alt="MIGISTUS" style="height: 140px; margin-bottom: 4px; display: block; margin-left: auto; margin-right: auto;">
                    <h1 style="color: #FFD700; margin: 0; font-size: 28px; font-weight: bold;">Verify Your Email</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px; color: #e4e4e7;">
                    <h2 style="color: #FFD700; font-size: 24px; margin: 0 0 20px 0;">Hi ${username},</h2>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; color: #d4d4d8;">Welcome to MIGISTUS! We're excited to have you join The Guilded Marketplace.</p>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 25px 0; color: #d4d4d8;">To complete your registration and activate your account, please enter this verification code:</p>
                    
                    <!-- Verification Code -->
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <div style="background: linear-gradient(135deg, #FFD700 0%, #B8860B 100%); display: inline-block; padding: 20px 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(255, 215, 0, 0.3);">
                            <span style="color: #000; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">${verificationCode}</span>
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    <div style="background-color: #3f3f46; border-radius: 6px; padding: 20px; margin: 25px 0;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #d4d4d8;"><strong style="color: #FFD700;">⏱️ Important:</strong></p>
                      <p style="margin: 0; font-size: 14px; color: #a1a1aa;">This verification code will expire in ${expiryMinutes} minutes. If it expires, you can request a new one from your account settings.</p>
                    </div>
                    
                    <p style="font-size: 14px; line-height: 1.6; margin: 25px 0 0 0; color: #a1a1aa;">If you didn't create an account on MIGISTUS, please ignore this email.</p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #18181b; padding: 30px; text-align: center; border-top: 1px solid #3f3f46;">
                    <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 10px 0;">Best regards,<br><strong style="color: #FFD700;">The MIGISTUS Team</strong></p>
                    <p style="color: #71717a; font-size: 12px; margin: 10px 0 0 0;">© ${new Date().getFullYear()} MIGISTUS. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  }),

  passwordReset: (username: string, resetUrl: string, expiryMinutes: number = 60) => ({
    subject: 'Reset Your MIGISTUS Password',
    text: `Hi ${username},\n\nYou requested to reset your password. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in ${expiryMinutes} minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe MIGISTUS Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Reset Your Password</h1>
        <p>Hi ${username},</p>
        <p>You requested to reset your password. Click the button below to set a new password:</p>
        <p><a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; border-radius: 4px;">Reset Password</a></p>
        <p style="color: #666; font-size: 14px;">This link will expire in ${expiryMinutes} minutes.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The MIGISTUS Team</p>
      </div>
    `,
  }),

  orderConfirmation: (username: string, orderNumber: string, orderTotal: string, orderDetailsUrl: string) => ({
    subject: `Order Confirmation #${orderNumber}`,
    text: `Hi ${username},\n\nThank you for your order!\n\nOrder Number: ${orderNumber}\nTotal: ${orderTotal}\n\nView details: ${orderDetailsUrl}\n\nYou'll receive a shipping notification once your order ships.\n\nBest regards,\nThe MIGISTUS Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Order Confirmation</h1>
        <p>Hi ${username},</p>
        <p>Thank you for your order!</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>Total:</strong> ${orderTotal}</p>
        </div>
        <p><a href="${orderDetailsUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; border-radius: 4px;">View Order Details</a></p>
        <p>You'll receive a shipping notification once your order ships.</p>
        <p>Best regards,<br>The MIGISTUS Team</p>
      </div>
    `,
  }),

  dropNotification: (username: string, productName: string, dropUrl: string, endsIn: string) => ({
    subject: `🔥 Community Drop Live: ${productName}`,
    text: `Hi ${username},\n\nA new Community Drop is now live!\n\nProduct: ${productName}\nEnds: ${endsIn}\n\nGet it before it's gone: ${dropUrl}\n\nBest regards,\nThe MIGISTUS Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF5722;">🔥 Community Drop Live!</h1>
        <p>Hi ${username},</p>
        <p>A new Community Drop is now live:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #333;">${productName}</h2>
          <p><strong>Ends:</strong> ${endsIn}</p>
        </div>
        <p><a href="${dropUrl}" style="background-color: #FF5722; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; border-radius: 4px;">View Drop Now</a></p>
        <p style="color: #666;">Get it before it's gone!</p>
        <p>Best regards,<br>The MIGISTUS Team</p>
      </div>
    `,
  }),

  supplierWelcome: (supplierName: string, supplierId: string, loginUrl: string) => ({
    subject: 'Welcome to MIGISTUS Supplier Portal',
    text: `Welcome ${supplierName},\n\nYour supplier application has been approved!\n\nSupplier ID: ${supplierId}\nLogin: ${loginUrl}\n\nYou can now add products and manage your inventory through the supplier portal.\n\nBest regards,\nThe MIGISTUS Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to MIGISTUS Supplier Portal</h1>
        <p>Hi ${supplierName},</p>
        <p>Congratulations! Your supplier application has been approved.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Supplier ID:</strong> ${supplierId}</p>
        </div>
        <p>You can now:</p>
        <ul>
          <li>Add and manage your products</li>
          <li>Track orders and sales</li>
          <li>Update inventory</li>
          <li>Manage your supplier profile</li>
        </ul>
        <p><a href="${loginUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; border-radius: 4px;">Access Supplier Portal</a></p>
        <p>Best regards,<br>The MIGISTUS Team</p>
      </div>
    `,
  }),

  messageNotification: (username: string, senderName: string, messagePreview: string, messagesUrl: string) => ({
    subject: `New message from ${senderName}`,
    text: `Hi ${username},\n\nYou have a new message from ${senderName}:\n\n"${messagePreview}"\n\nView and reply: ${messagesUrl}\n\nBest regards,\nThe MIGISTUS Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">New Message</h1>
        <p>Hi ${username},</p>
        <p>You have a new message from <strong>${senderName}</strong>:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #2196F3;">
          <p style="margin: 0; font-style: italic;">"${messagePreview}"</p>
        </div>
        <p><a href="${messagesUrl}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; border-radius: 4px;">View and Reply</a></p>
        <p>Best regards,<br>The MIGISTUS Team</p>
      </div>
    `,
  }),
};

// Verify email connection
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log('Email server connection verified');
    return true;
  } catch (error) {
    console.error('Email server connection failed:', error);
    return false;
  }
}
