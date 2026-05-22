// Professional Email Template for Project Creation
// Email-safe using only tables, inline styles, and compatible CSS

interface ProjectEmailData {
    projectTitle: string;
    projectDescription?: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    budget?: number;
}

interface StudioData {
    name: string;
    tagline?: string;
    logo?: string;
    mainAddress: {
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        country: string;
    };
    accentColor?: string;
}

interface ClientData {
    name: string;
    email: string;
}

export const projectEmailTemplate = (
    projectData: ProjectEmailData,
    studioData: StudioData,
    clientData: ClientData
) => {
    const accentColor = studioData.accentColor || '#8B5CF6';
    const formattedStartDate = new Date(projectData.startDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    const formattedEndDate = new Date(projectData.endDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    return {
        subject: `🎉 Welcome to Your New Project: ${projectData.projectTitle}`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Project Created - ${studioData.name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background-color: #F3F4F6; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
    
    <!-- Main Container -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F3F4F6; padding: 20px 0;">
        <tr>
            <td align="center" style="padding: 0;">
                
                <!-- Email Card -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header with Gradient -->
                    <tr>
                        <td align="center" style="background: linear-gradient(135deg, ${accentColor} 0%, #6D28D9 100%); padding: 40px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                ${studioData.logo ? `
                                <tr>
                                    <td align="center" style="padding-bottom: 16px;">
                                        <img src="${studioData.logo}" alt="${studioData.name}" width="80" height="80" style="display: block; border-radius: 50%; border: 4px solid rgba(255, 255, 255, 0.3); object-fit: cover;">
                                    </td>
                                </tr>
                                ` : ''}
                                <tr>
                                    <td align="center">
                                        <h1 style="margin: 0; padding: 0; font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">
                                            ${studioData.name}
                                        </h1>
                                    </td>
                                </tr>
                                ${studioData.tagline ? `
                                <tr>
                                    <td align="center" style="padding-top: 8px;">
                                        <p style="margin: 0; padding: 0; font-size: 14px; font-weight: 400; color: rgba(255, 255, 255, 0.9); line-height: 1.4;">
                                            ${studioData.tagline}
                                        </p>
                                    </td>
                                </tr>
                                ` : ''}
                                <tr>
                                    <td align="center" style="padding-top: 20px;">
                                        <table border="0" cellpadding="0" cellspacing="0" style="background-color: rgba(255, 255, 255, 0.15); border-radius: 8px; padding: 12px 24px;">
                                            <tr>
                                                <td align="center">
                                                    <p style="margin: 0; padding: 0; font-size: 16px; font-weight: 600; color: #FFFFFF;">
                                                        🎬 New Project Created
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Content Body -->
                    <tr>
                        <td style="padding: 40px 35px;">
                            
                            <!-- Greeting -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="padding-bottom: 24px;">
                                        <h2 style="margin: 0; padding: 0; font-size: 20px; font-weight: 600; color: #111827; line-height: 1.4;">
                                            Hello ${clientData.name},
                                        </h2>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 30px;">
                                        <p style="margin: 0; padding: 0; font-size: 16px; font-weight: 400; color: #4B5563; line-height: 1.6;">
                                            We're excited to inform you that your project <strong style="color: #111827;">"${projectData.projectTitle}"</strong> has been successfully created! We're looking forward to working with you and bringing your vision to life.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Project Info Card -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); border-radius: 12px; border: 2px solid #E5E7EB; margin-bottom: 30px; overflow: hidden;">
                                <!-- Top Border Accent -->
                                <tr>
                                    <td colspan="2" style="background: linear-gradient(90deg, ${accentColor}, #6D28D9); height: 4px; padding: 0;"></td>
                                </tr>
                                
                                <!-- Project Details -->
                                <tr>
                                    <td colspan="2" style="padding: 24px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 16px;">
                                                    <h3 style="margin: 0; padding: 0; font-size: 18px; font-weight: 600; color: #111827;">
                                                        📋 Project Details
                                                    </h3>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                        <tr>
                                                            <td style="width: 40%; vertical-align: top;">
                                                                <p style="margin: 0; padding: 0; font-size: 13px; font-weight: 600; color: #6B7280;">
                                                                    Project Name
                                                                </p>
                                                            </td>
                                                            <td style="width: 60%; vertical-align: top;">
                                                                <p style="margin: 0; padding: 0; font-size: 14px; font-weight: 600; color: #111827;">
                                                                    ${projectData.projectTitle}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            ${projectData.projectDescription ? `
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                        <tr>
                                                            <td style="width: 40%; vertical-align: top;">
                                                                <p style="margin: 0; padding: 0; font-size: 13px; font-weight: 600; color: #6B7280;">
                                                                    Description
                                                                </p>
                                                            </td>
                                                            <td style="width: 60%; vertical-align: top;">
                                                                <p style="margin: 0; padding: 0; font-size: 14px; font-weight: 500; color: #4B5563; line-height: 1.5;">
                                                                    ${projectData.projectDescription}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            ` : ''}
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                        <tr>
                                                            <td style="width: 40%; vertical-align: top;">
                                                                <p style="margin: 0; padding: 0; font-size: 13px; font-weight: 600; color: #6B7280;">
                                                                    Start Date
                                                                </p>
                                                            </td>
                                                            <td style="width: 60%; vertical-align: top;">
                                                                <p style="margin: 0; padding: 0; font-size: 14px; font-weight: 600; color: #111827;">
                                                                    📅 ${formattedStartDate}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                        <tr>
                                                            <td style="width: 40%; vertical-align: top;">
                                                                <p style="margin: 0; padding: 0; font-size: 13px; font-weight: 600; color: #6B7280;">
                                                                    End Date
                                                                </p>
                                                            </td>
                                                            <td style="width: 60%; vertical-align: top;">
                                                                <p style="margin: 0; padding: 0; font-size: 14px; font-weight: 600; color: #111827;">
                                                                    📅 ${formattedEndDate}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            ${projectData.location ? `
                                            <tr>
                                                <td style="padding: 12px 0;">
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                        <tr>
                                                            <td style="width: 40%; vertical-align: top;">
                                                                <p style="margin: 0; padding: 0; font-size: 13px; font-weight: 600; color: #6B7280;">
                                                                    Location
                                                                </p>
                                                            </td>
                                                            <td style="width: 60%; vertical-align: top;">
                                                                <p style="margin: 0; padding: 0; font-size: 14px; font-weight: 600; color: #111827;">
                                                                    📍 ${projectData.location}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            ` : ''}
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Next Steps Section -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%); border-radius: 12px; border: 2px solid #DBEAFE; padding: 28px 24px; margin-bottom: 30px;">
                                <tr>
                                    <td align="center" style="padding-bottom: 8px;">
                                        <h3 style="margin: 0; padding: 0; font-size: 18px; font-weight: 600; color: #111827;">
                                            What's Next?
                                        </h3>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 16px;">
                                        <p style="margin: 0; padding: 0; font-size: 14px; font-weight: 400; color: #6B7280; line-height: 1.6; text-align: center;">
                                            Our team will be in touch with you shortly to discuss the project timeline and next steps. We're committed to delivering exceptional results!
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Closing Message -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td>
                                        <p style="margin: 0; padding: 0; font-size: 14px; font-weight: 400; color: #6B7280; line-height: 1.6;">
                                            If you have any questions or need to discuss any aspect of your project, please don't hesitate to reach out to us. We're here to ensure everything goes smoothly.
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-top: 24px;">
                                        <p style="margin: 0; padding: 0; font-size: 14px; font-weight: 500; color: #111827;">
                                            Best regards,<br>
                                            <span style="color: ${accentColor};">${studioData.name}</span>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1F2937 0%, #111827 100%); padding: 28px 35px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <!-- Studio Info -->
                                <tr>
                                    <td style="padding-bottom: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td>
                                                    <p style="margin: 0; padding: 0 0 6px 0; font-size: 16px; font-weight: 600; color: #FFFFFF;">
                                                        ${studioData.name}
                                                    </p>
                                                    <p style="margin: 0; padding: 0; font-size: 13px; font-weight: 400; color: rgba(255, 255, 255, 0.7); line-height: 1.5;">
                                                        ${studioData.mainAddress.addressLine1}${studioData.mainAddress.addressLine2 ? ', ' + studioData.mainAddress.addressLine2 : ''}<br>
                                                        ${studioData.mainAddress.city}, ${studioData.mainAddress.state}, ${studioData.mainAddress.country}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Powered by Plexis -->
                                <tr>
                                    <td align="right" style="padding-top: 20px;">
                                        <table border="0" cellpadding="0" cellspacing="0" style="margin-left: auto;">
                                            <tr>
                                                <td align="center" style="vertical-align: middle; padding-right: 8px;">
                                                    <span style="font-weight: 500; color: rgba(255, 255, 255, 0.6); font-family: Arial, sans-serif; font-size: 12px;">Powered by</span>
                                                </td>
                                                <td align="center" style="vertical-align: middle;">
                                                    <a href="https://www.plexis.in" target="_blank" style="text-decoration: none;">
                                                        <img src="https://crm-client-main-branch.vercel.app/assets/logo-CtWZqSaM.png" alt="Plexis" width="65" height="22" style="display: block; opacity: 0.8; border: 0;">
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                </table>
                
            </td>
        </tr>
    </table>
    
</body>
</html>
        `
    };
};
