import { ITicket } from "../../models/ticketModel";
import { UserData } from "../../types/authTypes";

const priorityColors: Record<string, string> = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#EF4444',
  urgent: '#EF4444'
};

const issueTypeLabels: Record<string, string> = {
  billing: 'Billing & Payments',
  technical: 'Technical Support',
  account: 'Account Access',
  feature_request: 'Feature Request',
  general: 'General Inquiry',
};

function formatSubmittedAt(date = new Date()) {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export const ticketSubmissionTemplate = (
  ticket: ITicket,
  user: UserData,
  submittedAt?: string
) => {
  const idStr = String((ticket as any)._id || ticket['id'] || '').slice(0, 8).toUpperCase();
  const priority = (ticket.priority as string) || 'medium';
  const priorityColor = priorityColors[priority] || '#8B5CF6';
  const issueLabel = issueTypeLabels[ticket.issueType] || ticket.issueType || 'General';
  const when = submittedAt || formatSubmittedAt();

  const subject = `✓ Ticket #${idStr} - ${ticket.title}`;

  const text = `Hi ${user.firstName || 'Customer'},\n\n` +
    `Thanks for reaching out — we received your ticket.\n\n` +
    `Ticket ID: #${idStr}\n` +
    `Subject: ${ticket.title}\n` +
    `Category: ${issueLabel}\n` +
    `Priority: ${priority}\n` +
    `Submitted: ${when}\n\n` +
    `Our team will review this and get back to you via email.\n\n` +
    `Regards,\nPlexis Support Team`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F9FAFB;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(139, 92, 246, 0.15);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #C084FC 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 70px; height: 70px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; line-height: 70px;">
                <span style="font-size: 32px; color: #ffffff;">✓</span>
              </div>
              <h1 style="color: #ffffff; margin: 0 0 8px; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Ticket Received!
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 0; font-size: 16px; font-weight: 400;">
                Support Team @plexis
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 35px 30px 20px;">
              <p style="color: #374151; margin: 0; font-size: 17px; line-height: 1.6;">
                Hi <strong style="color: #8B5CF6;">${user.firstName || 'Valued Customer'}</strong>,
              </p>
              <p style="color: #6B7280; margin: 15px 0 0; font-size: 15px; line-height: 1.7;">
                Thank you for reaching out! We've received your support request and our team is on it. Here are your ticket details:
              </p>
            </td>
          </tr>

          <!-- Ticket Card -->
          <tr>
            <td style="padding: 10px 30px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%); border-radius: 12px; border: 1px solid #E9D5FF;">
                
                <!-- Ticket ID -->
                <tr>
                  <td style="padding: 20px 20px 15px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="color: #7C3AED; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                          Ticket ID
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #4C1D95; font-size: 18px; font-weight: 700; font-family: 'Courier New', monospace; padding-top: 6px;">
                          #${idStr}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 20px;">
                    <hr style="border: none; height: 1px; background-color: #DDD6FE; margin: 0;">
                  </td>
                </tr>

                <!-- Title -->
                <tr>
                  <td style="padding: 15px 20px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="color: #7C3AED; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                          Subject
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #1F2937; font-size: 16px; font-weight: 500; padding-top: 6px; line-height: 1.5;">
                          ${ticket.title}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 20px;">
                    <hr style="border: none; height: 1px; background-color: #DDD6FE; margin: 0;">
                  </td>
                </tr>

                <!-- Issue Type & Priority Row -->
                <tr>
                  <td style="padding: 15px 20px 20px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="width: 50%; vertical-align: top;">
                          <p style="color: #7C3AED; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0;">
                            Category
                          </p>
                          <p style="color: #1F2937; font-size: 14px; margin: 6px 0 0; font-weight: 500;">
                            ${issueLabel}
                          </p>
                        </td>
                        <td style="width: 50%; vertical-align: top;">
                          <p style="color: #7C3AED; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0;">
                            Priority
                          </p>
                          <p style="margin: 6px 0 0;">
                            <span style="display: inline-block; background-color: ${priorityColor}; color: #ffffff; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; text-transform: capitalize;">
                              ${priority}
                            </span>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Submitted At -->
                <tr>
                  <td style="padding: 0 20px 20px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: rgba(139, 92, 246, 0.1); border-radius: 8px;">
                      <tr>
                        <td style="padding: 12px; text-align: center;">
                          <span style="color: #7C3AED; font-size: 13px;">
                            📅 Submitted on <strong>${when}</strong>
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What's Next Section -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <h3 style="color: #8B5CF6; margin: 0 0 15px; font-size: 16px; font-weight: 600;">
                ⚡ What happens next?
              </h3>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0;">
                    <table role="presentation" style="border-collapse: collapse;">
                      <tr>
                        <td style="width: 30px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: #8B5CF6; color: #ffffff; font-size: 12px; font-weight: 700; text-align: center; line-height: 24px; border-radius: 50%;">1</span>
                        </td>
                        <td style="color: #4B5563; font-size: 14px; line-height: 1.6; padding-left: 10px;">
                          Our support team will review your request
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <table role="presentation" style="border-collapse: collapse;">
                      <tr>
                        <td style="width: 30px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: #A855F7; color: #ffffff; font-size: 12px; font-weight: 700; text-align: center; line-height: 24px; border-radius: 50%;">2</span>
                        </td>
                        <td style="color: #4B5563; font-size: 14px; line-height: 1.6; padding-left: 10px;">
                          You'll receive updates via email as we work on your issue
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <table role="presentation" style="border-collapse: collapse;">
                      <tr>
                        <td style="width: 30px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: #C084FC; color: #ffffff; font-size: 12px; font-weight: 700; text-align: center; line-height: 24px; border-radius: 50%;">3</span>
                        </td>
                        <td style="color: #4B5563; font-size: 14px; line-height: 1.6; padding-left: 10px;">
                          Track your ticket status in "My Tickets"
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #1F2937 0%, #111827 100%); padding: 20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                
                <!-- Brand Info -->
                <tr>
                  <td style="padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.12);">
                    <p style="margin: 0 0 4px 0; font-size: 17px; font-weight: 600; color: #FFFFFF; letter-spacing: 0.3px;">
                      Plexis
                    </p>
                    <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.75); line-height: 1.6;">
                      AI-Powered CRM Built for Photography Studios
                    </p>
                  </td>
                </tr>

                <!-- Bottom Row -->
                <tr>
                  <td style="padding-top: 12px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        
                        <!-- Left: Copyright -->
                        <td align="left" style="vertical-align: middle;">
                          <p style="margin: 0; font-size: 12px; color: #FFFFFF; font-weight: 500;">
                            © ${new Date().getFullYear()} Plexis Technologies Pvt. Ltd.
                          </p>
                        </td>

                        <!-- Right: Social + Powered -->
                        <td align="right" style="vertical-align: middle;">
                          <table cellpadding="0" cellspacing="0" style="margin-left: auto;">
                            <tr>
                              <!-- Instagram -->
                              <td style="padding-right: 14px;">
                                <a href="https://www.instagram.com/plexis.in/" target="_blank" style="text-decoration: none;">
                                  <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" width="20" height="20" style="display: block; opacity: 0.75; border: 0;" />
                                </a>
                              </td>
                              
                              <!-- LinkedIn -->
                              <td style="padding-right: 18px;">
                                <a href="https://www.linkedin.com/company/genz-galaxy/" target="_blank" style="text-decoration: none;">
                                  <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" width="20" height="20" style="display: block; opacity: 0.75; border: 0;" />
                                </a>
                              </td>
                              
                              <!-- Powered -->
                              <td style="padding-right: 8px;">
                                <span style="font-size: 12px; color: rgba(255,255,255,0.6); font-weight: 500;">
                                  Powered by
                                </span>
                              </td>
                              
                              <!-- Logo -->
                              <td>
                                <a href="https://www.plexis.in" target="_blank" style="text-decoration: none;">
                                  <table cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; padding: 6px; border: 1px solid #EDE9FE;">
                                    <tr>
                                      <td align="center" valign="middle">
                                        <img src="https://res.cloudinary.com/dnjl0jih4/image/upload/v1769701552/favicon-32x32_hbgldf.png" width="24" height="24" alt="Plexis" style="display: block; border: 0;" />
                                      </td>
                                    </tr>
                                  </table>
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
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
};
export const teamNotificationTemplate = (
  ticket: ITicket,
  user: UserData,
  submittedAt?: string
) => {
  const idStr = String((ticket as any)._id || ticket['id'] || '').slice(0, 8).toUpperCase();
  const priority = (ticket.priority as string) || 'medium';
  const priorityColor = priorityColors[priority] || '#8B5CF6';
  const issueLabel = issueTypeLabels[ticket.issueType] || ticket.issueType || 'General';
  const when = submittedAt || formatSubmittedAt();

  const subject = `🎫 New Ticket #${idStr} - ${ticket.title}`;

  const text = `New Support Ticket Submitted\n\n` +
    `Ticket ID: #${idStr}\n` +
    `Customer: ${user.firstName} ${user.lastName} (${user.email})\n` +
    `Ref No: ${user.refNo}\n\n` +
    `Title: ${ticket.title}\n` +
    `Category: ${issueLabel}\n` +
    `Priority: ${priority}\n` +
    `Status: ${ticket.status || 'open'}\n\n` +
    `Description:\n${ticket.description}\n\n` +
    `Submitted: ${when}\n\n` +
    `Please review and respond accordingly.\n\n` +
    `Plexis Support System`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Ticket Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 650px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #8B5CF6; padding: 24px 30px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">
                🎫 New Support Ticket
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 14px;">
                Plexis Support System
              </p>
            </td>
          </tr>

          <!-- Alert Banner -->
          <tr>
            <td style="padding: 20px 30px; background-color: ${priority === 'critical' || priority === 'urgent' ? '#FEF2F2' : priority === 'high' ? '#FFF7ED' : '#F9FAFB'};">
              <p style="margin: 0; color: ${priority === 'critical' || priority === 'urgent' ? '#991B1B' : priority === 'high' ? '#9A3412' : '#374151'}; font-size: 14px; font-weight: 500;">
                ${priority === 'critical' || priority === 'urgent' ? '⚠️ HIGH PRIORITY TICKET' : priority === 'high' ? '⚡ Requires Prompt Attention' : '📋 New ticket awaiting review'}
              </p>
            </td>
          </tr>

          <!-- Ticket Details -->
          <tr>
            <td style="padding: 30px;">
              
              <!-- Ticket ID -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 16px; background-color: #f9fafb; border-left: 4px solid #8B5CF6; border-radius: 4px;">
                    <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                      Ticket ID
                    </p>
                    <p style="margin: 0; font-size: 20px; font-weight: 700; color: #111827; font-family: 'Courier New', monospace;">
                      #${idStr}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Customer Info -->
              <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">
                Customer Information
              </h3>
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 6px;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; width: 30%; background-color: #f9fafb;">
                    <strong style="color: #6b7280; font-size: 13px;">Name</strong>
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px;">
                    ${user.firstName} ${user.lastName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; background-color: #f9fafb;">
                    <strong style="color: #6b7280; font-size: 13px;">Email</strong>
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px;">
                    <a href="mailto:${user.email}" style="color: #8B5CF6; text-decoration: none;">${user.email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; background-color: #f9fafb;">
                    <strong style="color: #6b7280; font-size: 13px;">Ref No</strong>
                  </td>
                  <td style="padding: 12px 16px; color: #111827; font-size: 14px;">
                    ${user.refNo}
                  </td>
                </tr>
              </table>

              <!-- Ticket Details -->
              <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">
                Ticket Details
              </h3>
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 6px;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; width: 30%; background-color: #f9fafb;">
                    <strong style="color: #6b7280; font-size: 13px;">Title</strong>
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px; font-weight: 500;">
                    ${ticket.title}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; background-color: #f9fafb;">
                    <strong style="color: #6b7280; font-size: 13px;">Category</strong>
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px;">
                    ${issueLabel}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; background-color: #f9fafb;">
                    <strong style="color: #6b7280; font-size: 13px;">Priority</strong>
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                    <span style="display: inline-block; background-color: ${priorityColor}; color: #ffffff; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 12px; text-transform: uppercase;">
                      ${priority}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; background-color: #f9fafb;">
                    <strong style="color: #6b7280; font-size: 13px;">Status</strong>
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px; text-transform: capitalize;">
                    ${ticket.status || 'open'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; background-color: #f9fafb;">
                    <strong style="color: #6b7280; font-size: 13px;">Submitted</strong>
                  </td>
                  <td style="padding: 12px 16px; color: #111827; font-size: 14px;">
                    ${when}
                  </td>
                </tr>
              </table>

              <!-- Description -->
              <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">
                Description
              </h3>
              <div style="padding: 16px; background-color: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb; margin-bottom: 24px;">
                <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${ticket.description}</p>
              </div>

              ${ticket.attachments && ticket.attachments.length > 0 ? `
              <!-- Attachments -->
              <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">
                Attachments
              </h3>
              <div style="padding: 16px; background-color: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #6b7280; font-size: 13px;">
                  📎 ${ticket.attachments.length} attachment(s) included
                </p>
              </div>
              ` : ''}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                Plexis Support System - Team Notification
              </p>
              <p style="margin: 8px 0 0; color: #9ca3af; font-size: 11px;">
                © ${new Date().getFullYear()} Plexis Studio. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
};

