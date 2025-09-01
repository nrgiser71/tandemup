import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
});

const domain = process.env.MAILGUN_DOMAIN || '';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, text, from }: EmailData) {
  try {
    const result = await mg.messages.create(domain, {
      from: from || `TandemUp <noreply@${domain}>`,
      to: [to],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML if no text provided
    });
    
    console.log('Email sent successfully:', result);
    return { success: true, result };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

export function generateSessionReminderEmail(
  firstName: string,
  sessionTime: string,
  sessionDuration: number
): { subject: string; html: string } {
  const subject = `TandemUp session reminder - Starting in 15 minutes`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Session Reminder</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
        <h1 style="color: #1e293b; margin: 0; text-align: center;">
          📚 Session Starting Soon!
        </h1>
      </div>
      
      <div style="background-color: white; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
        <p>Hi ${firstName},</p>
        
        <p>Your TandemUp session is starting in <strong>15 minutes</strong>!</p>
        
        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1e293b;">📅 Session Details:</h3>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${sessionTime}</p>
          <p style="margin: 5px 0;"><strong>Duration:</strong> ${sessionDuration} minutes</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://tandemup.work/dashboard" 
             style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Join Your Session
          </a>
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>💡 Reminder:</strong> Make sure you're ready to work with your camera on for accountability!
          </p>
        </div>
        
        <p>See you soon!</p>
        <p>The TandemUp Team</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 14px;">
        <p>TandemUp - Virtual Coworking Platform</p>
      </div>
    </body>
    </html>
  `;
  
  return { subject, html };
}

export function generateWelcomeEmail(firstName: string): { subject: string; html: string } {
  const subject = `Welcome to TandemUp! 🎉`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to TandemUp</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
        <h1 style="color: #1e293b; margin: 0; text-align: center;">
          🎉 Welcome to TandemUp!
        </h1>
      </div>
      
      <div style="background-color: white; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
        <p>Hi ${firstName},</p>
        
        <p>Welcome to TandemUp! We're excited to help you boost your productivity with focused coworking sessions.</p>
        
        <h3 style="color: #1e293b;">🚀 Your 14-day free trial has started!</h3>
        <p>You can book unlimited sessions during your trial period - no credit card required.</p>
        
        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #1e293b;">✨ What you can do:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Book 25 or 50-minute focused work sessions</li>
            <li>Get matched with accountability partners</li>
            <li>Join video sessions with camera-on accountability</li>
            <li>Track your productivity progress</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://tandemup.work/book" 
             style="display: inline-block; background-color: #3b82f6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            Book Your First Session
          </a>
        </div>
        
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #065f46;">
            <strong>💡 Pro tip:</strong> Sessions work best when you have a specific task ready to work on!
          </p>
        </div>
        
        <p>If you have any questions, just reply to this email. We're here to help!</p>
        
        <p>Happy coworking!</p>
        <p>The TandemUp Team</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 14px;">
        <p>TandemUp - Virtual Coworking Platform</p>
      </div>
    </body>
    </html>
  `;
  
  return { subject, html };
}

export function generateTrialExpiryEmail(firstName: string): { subject: string; html: string } {
  const subject = `Your TandemUp trial is ending soon`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Trial Ending Soon</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #fef3c7; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
        <h1 style="color: #92400e; margin: 0; text-align: center;">
          ⏰ Trial Ending Soon
        </h1>
      </div>
      
      <div style="background-color: white; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
        <p>Hi ${firstName},</p>
        
        <p>Your 14-day free trial of TandemUp is ending in <strong>3 days</strong>.</p>
        
        <p>We hope you've enjoyed the focused productivity sessions and found value in working with accountability partners!</p>
        
        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #1e293b;">💰 Choose your plan:</h3>
          <p style="margin: 5px 0;"><strong>Monthly:</strong> €9.99/month</p>
          <p style="margin: 5px 0;"><strong>Yearly:</strong> €79.99/year (save 33%!)</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://tandemup.work/pricing" 
             style="display: inline-block; background-color: #059669; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            Choose Your Plan
          </a>
        </div>
        
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b;">
            <strong>⚠️ Important:</strong> After your trial ends, you won't be able to book new sessions until you subscribe.
          </p>
        </div>
        
        <p>Thank you for trying TandemUp!</p>
        <p>The TandemUp Team</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 14px;">
        <p>TandemUp - Virtual Coworking Platform</p>
      </div>
    </body>
    </html>
  `;
  
  return { subject, html };
}

export function generateSessionCompletedEmail(
  firstName: string,
  sessionDuration: number,
  partnerName?: string
): { subject: string; html: string } {
  const subject = `Session completed! Great work 🎉`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Session Completed</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #ecfdf5; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
        <h1 style="color: #065f46; margin: 0; text-align: center;">
          🎉 Session Completed!
        </h1>
      </div>
      
      <div style="background-color: white; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
        <p>Hi ${firstName},</p>
        
        <p>Congratulations on completing your ${sessionDuration}-minute focused work session!</p>
        
        ${partnerName ? `<p>You worked alongside <strong>${partnerName}</strong> - great teamwork!</p>` : ''}
        
        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #1e293b;">📊 Session Stats:</h3>
          <p style="margin: 5px 0;"><strong>Duration:</strong> ${sessionDuration} minutes</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> Completed ✅</p>
          ${partnerName ? `<p style="margin: 5px 0;"><strong>Partner:</strong> ${partnerName}</p>` : ''}
        </div>
        
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #065f46;">
            <strong>💪 Keep the momentum going!</strong> Book another session to maintain your productivity streak.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://tandemup.work/book" 
             style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Book Another Session
          </a>
        </div>
        
        <p>Keep up the great work!</p>
        <p>The TandemUp Team</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 14px;">
        <p>TandemUp - Virtual Coworking Platform</p>
      </div>
    </body>
    </html>
  `;
  
  return { subject, html };
}