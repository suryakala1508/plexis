import nodemailer from "nodemailer";
import { ENV } from "../../config/env";

export const sendMail = async (
  to: string,
  subject: string,
  text: string,
  html?: string,
  attachments?: any[]
) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.in",
      port: 465,
      secure: true,
      auth: {
        user: ENV.EMAIL,
        pass: ENV.PASS,
      },
    });

    const mailOptions: any = {
      from: `"PLEXIS" <${ENV.EMAIL}>`,
      to,
      subject,
      text,
      html,
    };

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    console.log('📧 [mailer] Sending email:', {
      to,
      subject,
      from: mailOptions.from,
      hasHtml: !!html,
      hasText: !!text
    });

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ [mailer] Email sent successfully:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });

    return info;
  } catch (err: any) {
    console.error("❌ [mailer] Failed to send email:", err);
    console.error("❌ [mailer] Error details:", {
      message: err?.message,
      code: err?.code,
      command: err?.command,
      response: err?.response,
      responseCode: err?.responseCode
    });
    throw err;
  }
};
