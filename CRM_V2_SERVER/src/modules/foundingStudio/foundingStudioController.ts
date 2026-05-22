import { Request, Response } from "express";
import { sendMail } from "../../core/services/mailer";

interface FoundingStudioFormData {
  studioName: string;
  email: string;
  phone: string;
  location?: string;
  instagramHandle?: string;
  demoCallOptIn: boolean;
}

export const submitFoundingStudioForm = async (req: Request, res: Response) => {
  try {
    const { 
      studioName, 
      email, 
      phone, 
      location = "", 
      instagramHandle = "", 
      demoCallOptIn = false 
    }: FoundingStudioFormData = req.body;

    // Validate required fields
    if (!studioName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Studio Name, Email, and Phone are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Validate phone format (exactly 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits",
      });
    }

    // Prepare formatted email content
    const emailSubject = `New Founding Studio Onboard Request from ${studioName}`;
    
    const emailText = `
New Founding Studio Onboard Request

Studio Name: ${studioName}
Email: ${email}
Phone: ${phone}
Location: ${location || 'Not provided'}
Instagram Handle: ${instagramHandle || 'Not provided'}
Demo Call Interested: ${demoCallOptIn ? 'Yes' : 'No'}

---
Submitted via Founding Studio Onboard Form
`.trim();

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a365d; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: 600; color: #1f2937; margin-bottom: 5px; }
    .value { color: #4b5563; padding: 8px 12px; background-color: white; border-radius: 4px; border-left: 3px solid #3b82f6; }
    .footer { color: #9ca3af; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">New Founding Studio Onboard Request</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Studio Name</div>
        <div class="value">${studioName}</div>
      </div>
      <div class="field">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${email}">${email}</a></div>
      </div>
      <div class="field">
        <div class="label">Phone</div>
        <div class="value">${phone}</div>
      </div>
      <div class="field">
        <div class="label">Location</div>
        <div class="value">${location || 'Not provided'}</div>
      </div>
      <div class="field">
        <div class="label">Instagram Handle</div>
        <div class="value">${instagramHandle || 'Not provided'}</div>
      </div>
      <div class="field">
        <div class="label">Demo Call Interested</div>
        <div class="value">${demoCallOptIn ? '<span style="color: #059669; font-weight: 600;">Yes</span>' : 'No'}</div>
      </div>
      <div class="footer">
        <p>This inquiry was submitted via the Founding Studio Onboard form on plexis.in</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    console.log('📧 [foundingStudio] Submitting founding studio form:', {
      studioName,
      email,
      phone,
      demoCallOptIn
    });

    // Send email to founder
    await sendMail(
      "founder@plexis.in",
      emailSubject,
      emailText,
      emailHtml
    );

    console.log('✅ [foundingStudio] Founding studio form submitted successfully');

    return res.status(200).json({
      success: true,
      message: "Form submitted successfully. We will be in touch soon.",
    });
  } catch (error) {
    console.error("❌ [foundingStudio] Error submitting founding studio form:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit form. Please try again later.",
    });
  }
};
