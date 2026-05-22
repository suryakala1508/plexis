interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  fullName: string;
}

export const getContactFormEmailTemplate = (data: ContactFormData): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Submission</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">New Contact Form Submission</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                You have received a new contact form submission from your website.
                            </p>
                            
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                                        <strong style="color: #667eea; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Full Name</strong>
                                    </td>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
                                        <span style="color: #333333; font-size: 14px;">${data.fullName}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                                        <strong style="color: #667eea; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Email Address</strong>
                                    </td>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
                                        <a href="mailto:${data.email}" style="color: #667eea; font-size: 14px; text-decoration: none;">${data.email}</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                                        <strong style="color: #667eea; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Phone Number</strong>
                                    </td>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
                                        <a href="tel:${data.phone}" style="color: #333333; font-size: 14px; text-decoration: none;">${data.phone}</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                                        <strong style="color: #667eea; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Service/Role</strong>
                                    </td>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
                                        <span style="color: #333333; font-size: 14px;">${data.service}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding: 20px 0 12px 0;">
                                        <strong style="color: #667eea; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 10px;">Message</strong>
                                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
                                            <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                                <p style="margin: 0; color: #666666; font-size: 12px; text-align: center;">
                                    This email was sent from your website contact form.
                                </p>
                            </div>
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

