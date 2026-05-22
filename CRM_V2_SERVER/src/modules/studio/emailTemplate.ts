import { sendMail } from "../../core/services/mailer";
/* -------------------- Types -------------------- */

interface StudioData {
  name: string;
  mainAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
  };
  accentColor?: string;
  logo?: string;
}

interface StudioInvitationEmailParams {
  name: string;
  roles: string[];
  studioName: string;
  access?: string[];
  setPasswordLink: string;
  studioData?: StudioData;
}

/* -------------------- Email Template -------------------- */

const studioInvitationEmail = ({
  name,
  roles,
  studioName,
  access = [],
  setPasswordLink,
  studioData,
}: StudioInvitationEmailParams): string => {
  const year = new Date().getFullYear();
  const roleTitle = roles.join(", ");
  const accentColor = studioData?.accentColor || "#8B5CF6";

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Invitation to Join ${studioName}</title>
      <style>
      @media only screen and (min-width: 768px) {
        /* Compact Desktop Styles */
        .header-section { padding: 25px 20px !important; }
        .body-section { padding: 25px 20px !important; }
        .footer-section { padding: 20px 20px !important; }
        
        .main-heading { font-size: 22px !important; }
        .greeting-heading { font-size: 18px !important; }
        .body-text { font-size: 14px !important; line-height: 1.5 !important; }
        .role-title { font-size: 14px !important; }
        .small-text { font-size: 11px !important; }
        .sub-heading { font-size: 14px !important; }
        
        .desktop-pb-reduce { padding-bottom: 20px !important; }
        .desktop-pb-reduce-md { padding-bottom: 16px !important; }
        .desktop-mb-reduce { margin-bottom: 20px !important; }
        
        .card-padding { padding: 16px 16px !important; }
        
        .cta-button { padding: 10px 24px !important; font-size: 14px !important; }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background-color: #F3F4F6; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
    
    <!-- Main Container -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F3F4F6; padding: 20px 0;">
      <tr>
        <td align="center" style="padding: 0;">
          
          <!-- Email Card -->
<table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">            
            <!-- Header with gradient to match first template -->
            <tr>
              <td align="center" class="header-section" style="background: linear-gradient(135deg, ${accentColor} 0%, #6D28D9 100%); padding: 40px 30px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  ${
                    studioData?.logo
                      ? `
                  <tr>
                    <td align="center" style="padding-bottom: 16px;">
                      <img src="${studioData.logo}" alt="${studioName}" width="80" height="80" style="display: block; border-radius: 50%; border: 4px solid rgba(255, 255, 255, 0.3); object-fit: cover;">
                    </td>
                  </tr>
                  `
                      : ""
                  }
                  <tr>
                    <td align="center">
                      <h1 class="main-heading" style="margin: 0; padding: 0; font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">
                        Invitation to Join Our Studio Team
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-top: 8px;">
                      <p style="margin: 0; padding: 0; font-size: 14px; font-weight: 400; color: rgba(255, 255, 255, 0.9); line-height: 1.4;">
                        ${studioName}
                      </p>
                    </td>
                  </tr>
    
                </table>
              </td>
            </tr>
            
            <!-- Content Body with table-based structure -->
            <tr>
              <td class="body-section" style="padding: 40px 35px;">
                
                <!-- Greeting -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td class="desktop-pb-reduce-md" style="padding-bottom: 24px;">
                      <h2 class="greeting-heading" style="margin: 0; padding: 0; font-size: 20px; font-weight: 600; color: #111827; line-height: 1.4;">
                        Hi ${name},
                      </h2>
                    </td>
                  </tr>
                  <tr>
                    <td class="desktop-pb-reduce" style="padding-bottom: 30px;">
                      <p class="body-text" style="margin: 0; padding: 0; font-size: 16px; font-weight: 400; color: #4B5563; line-height: 1.6;">
                        We're excited to invite you to join our studio! Your skills and experience make you a great fit for our team, and we'd love to have you on board.
                      </p>
                    </td>
                  </tr>
                </table>
                
                <!-- Role Info Card styled like first template -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="desktop-mb-reduce" style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); border-radius: 12px; border: 2px solid #E5E7EB; margin-bottom: 30px; overflow: hidden;">
                  <!-- Top Border Accent -->
                  <tr>
                    <td colspan="2" style="background: linear-gradient(90deg, ${accentColor}, #6D28D9); height: 4px; padding: 0;"></td>
                  </tr>
                  
                  <tr>
                    <td class="card-padding" style="padding: 24px 24px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="padding-bottom: 4px;">
                            <p style="margin: 0; padding: 0; font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">
                              Your Role
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <p class="role-title" style="margin: 0; padding: 0; font-size: 15px; font-weight: 600; color: #111827;">
                              ${roleTitle}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                
                <!-- Content Text -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="desktop-mb-reduce" style="margin-bottom: 30px;">
                  <tr>
                    <td>
                      <p class="body-text" style="margin: 0 0 16px 0; padding: 0; font-size: 16px; font-weight: 400; color: #4B5563; line-height: 1.6;">
                        Please confirm your acceptance of this role by clicking the button below. Once you accept, we'll share the next steps, including onboarding details and your official start date.
                      </p>
                    </td>
                  </tr>
                </table>
                
                <!-- CTA Button Section styled like first template -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="desktop-mb-reduce" style="margin-bottom: 30px;">
                  <tr>
                    <td align="center">
                      <a href="${setPasswordLink}" class="cta-button" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, ${accentColor} 0%, #6D28D9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                        Accept Invitation
                      </a>
                    </td>
                  </tr>
                </table>
                
                <!-- Next Steps Box -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="desktop-mb-reduce" style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); border-radius: 12px; border: 2px solid #E5E7EB; border-left: 4px solid ${accentColor}; margin-bottom: 30px; overflow: hidden;">
                  <tr>
                    <td class="card-padding" style="padding: 24px 24px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="padding-bottom: 8px;">
                            <h3 class="sub-heading" style="margin: 0; padding: 0; font-size: 15px; font-weight: 600; color: #1F2937;">
                              What happens next?
                            </h3>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <p class="body-text" style="margin: 0; padding: 0; font-size: 14px; font-weight: 400; color: #6B7280; line-height: 1.6;">
                              After accepting, you'll set up your password and gain immediate access to your studio dashboard. We'll guide you through the onboarding process and introduce you to the team.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                
                <!-- Welcome Message -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" style="padding: 20px 0;">
                      <p class="body-text" style="margin: 0; padding: 0; font-size: 16px; font-weight: 500; color: #1F2937;">
                        Welcome to the team — we're thrilled to have you with us! 🎉
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <p class="small-text" style="margin: 0; padding: 0; font-size: 13px; font-weight: 400; color: #9CA3AF; font-style: italic;">
                        If you didn't expect this invitation, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                </table>
                
              </td>
            </tr>
            
            <!-- Footer matching first template design -->
            <tr>
              <td class="footer-section" style="background: linear-gradient(135deg, #1F2937 0%, #111827 100%); padding: 28px 35px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <!-- Studio Info -->
                  <tr>
                    <td style="padding-bottom: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td>
                            <p style="margin: 0; padding: 0 0 6px 0; font-size: 16px; font-weight: 600; color: #FFFFFF;">
                              ${studioData?.name || studioName}
                            </p>
                            ${
                              studioData?.mainAddress
                                ? `
                            <p style="margin: 0; padding: 0; font-size: 13px; font-weight: 400; color: rgba(255, 255, 255, 0.7); line-height: 1.5;">
                              ${studioData.mainAddress.addressLine1}${studioData.mainAddress.addressLine2 ? ", " + studioData.mainAddress.addressLine2 : ""}<br>
                              ${studioData.mainAddress.city}, ${studioData.mainAddress.state}, ${studioData.mainAddress.country}
                            </p>
                            `
                                : `
                            <p style="margin: 0; padding: 0; font-size: 13px; font-weight: 400; color: rgba(255, 255, 255, 0.7);">
                              Professional photography studio management platform
                            </p>
                            `
                            }
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
                          <!-- Social Icons -->
                          <td align="center" style="vertical-align: middle; padding-right: 15px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                              <tr>
                                <td align="center" style="padding-right: 10px;">
                                  <a href="https://www.instagram.com/plexis.in/" target="_blank" style="text-decoration: none;">
                                    <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" width="20" height="20" style="display: block; opacity: 0.7; border: 0;">
                                  </a>
                                </td>
                                <td align="center">
                                  <a href="https://www.linkedin.com/company/genz-galaxy/" target="_blank" style="text-decoration: none;">
                                    <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" width="20" height="20" style="display: block; opacity: 0.7; border: 0;">
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                          
                          <!-- Powered by text -->
                          <td align="center" style="vertical-align: middle; padding-right: 8px;">
                            <span style="font-weight: 500; color: rgba(255, 255, 255, 0.6); font-family: Arial, sans-serif; font-size: 12px;">Powered by</span>
                          </td>
                          
                          <!-- Plexis logo -->
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
  `;
};

/* -------------------- Public Function -------------------- */

export const sendStudioInvite = async (
  to: string,
  name: string,
  roles: string[],
  studioName: string,
  link: string,
  studioData: StudioData,
  access: string[] = [],
): Promise<void> => {
  const html = studioInvitationEmail({
    name,
    roles,
    studioName,
    access,
    setPasswordLink: link,
    studioData,
  });

  await sendMail(
    to,
    `You're invited to join ${studioName} as ${roles.join(", ")}`,
    `You have been invited to ${studioName}. Please use the link to set your password and accept the invitation.`,
    html,
  );
};
