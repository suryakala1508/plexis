import { Request, Response } from "express";
import { sendMail } from "../../core/services/mailer";
import { ENV } from "../../config/env";
import { getContactFormEmailTemplate } from "./templates/contactFormTemplate";
import { getThankYouEmailTemplate } from "./templates/thankYouTemplate";

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  service: string;
  message: string;
}

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, service, message }: ContactFormData = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !service || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
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

    // Prepare data for email templates
    const formData = {
      firstName,
      lastName,
      email,
      phone,
      service,
      message,
      fullName: `${firstName} ${lastName}`,
    };

    // Send email to company (ourselves)
    const companyEmailHtml = getContactFormEmailTemplate(formData);
    const companyEmailText = `
New Contact Form Submission

Name: ${formData.fullName}
Email: ${formData.email}
Phone: ${formData.phone}
Service: ${formData.service}
Message: ${formData.message}
    `.trim();

    await sendMail(
      "founder@plexis.in",
      `New Contact Form Submission from ${formData.fullName}`,
      companyEmailText,
      companyEmailHtml
    );

    // Send auto-reply to user
    const thankYouEmailHtml = getThankYouEmailTemplate(formData);
    const thankYouEmailText = `
Thank you for contacting PLEXIS!

Dear ${formData.firstName},

Thank you for reaching out to us. We have received your message and one of our sales representatives will connect with you within 24 hours.

Best regards,
The PLEXIS Team
    `.trim();

    await sendMail(
      email,
      "Thank you for contacting PLEXIS",
      thankYouEmailText,
      thankYouEmailHtml
    );

    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Error sending contact message:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send message. Please try again later.",
    });
  }
};

