interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  fullName: string;
}

export const getThankYouEmailTemplate = (data: ContactFormData): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You for Contacting PLEXIS</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Thank You, ${data.firstName}!</h1>
                            <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">We've received your message</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                Dear ${data.firstName},
                            </p>
                            
                            <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                Thank you for reaching out to <strong style="color: #667eea;">PLEXIS</strong>! We're excited to hear from you and appreciate you taking the time to contact us.
                            </p>
                            
                            <div style="background: linear-gradient(135deg, #f8f9ff 0%, #fff5f8 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 25px 0;">
                                <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.6;">
                                    <strong style="color: #667eea;">✓</strong> We've received your inquiry and one of our sales representatives will connect with you within <strong>24 hours</strong>.
                                </p>
                            </div>
                            
                            <p style="margin: 25px 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                In the meantime, if you have any urgent questions, please feel free to reach out to us directly.
                            </p>
                            
                            <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                We look forward to assisting you!
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <p style="margin: 0; color: #666666; font-size: 14px; font-style: italic;">
                                    Best regards,<br>
                                    <strong style="color: #667eea; font-size: 16px;">The PLEXIS Team</strong>
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e5e5;">
                            <p style="margin: 0; color: #666666; font-size: 12px;">
                                This is an automated confirmation email. Please do not reply to this message.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `.trim();
};

