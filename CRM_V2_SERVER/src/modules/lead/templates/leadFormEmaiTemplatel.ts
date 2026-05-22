// Email Template for New Lead Notification (Studio)
// Professional Purple + White Theme
// Email-safe using tables and inline styles

interface LeadData {
  name: string;
  email: string;
  contactNumber: string;
  whatsappNumber?: string;
  EnquiryType: string;
  EventDate?: Date | string;
  EventEndDate?: Date | string;
  Location?: string;
  Relation?: string;
  source: string;
  createdAt: Date;
}

interface StudioData {
  name: string;
  logo?: string;
  accentColor?: string;
  mainAddress?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
  };
}

export const leadNotificationEmailTemplate = (
  leadData: LeadData,
  studioData: StudioData,
  dashboardUrl: string
) => {
  const accentColor = studioData.accentColor || "#8B5CF6";

  const formattedDate = leadData.EventDate
    ? new Date(leadData.EventDate).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    : "Not Provided";

  const submittedAt = new Date(leadData.createdAt).toLocaleString("en-IN");

  return {
    subject: `📩 New Lead Inquiry — ${leadData.name}`,

    html: `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>New Lead</title>
</head>

<body style="margin:0; padding:0; background-color:#F3F4F6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">

<!-- Wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6; padding:24px 0;">
<tr>
<td align="center">

<!-- Main Card -->
<table width="600" cellpadding="0" cellspacing="0"
style="background:#FFFFFF; border-radius:14px; overflow:hidden; box-shadow:0 6px 14px rgba(0,0,0,0.08);">

<!-- Premium Minimal Header -->
<tr>
<td style="background:linear-gradient(135deg, ${accentColor}, #6D28D9); padding:26px 24px;">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>

<!-- Left -->
<td align="left" style="vertical-align:middle;">
<table cellpadding="0" cellspacing="0">
<tr>
${studioData.logo ? `
<td style="padding-right:10px;">
<img src="${studioData.logo}" width="42" height="42"
style="border-radius:10px; object-fit:cover; background:#fff;" />
</td>
` : ""}

<td>
<p style="margin:0; font-size:16px; font-weight:700; color:#fff;">
${studioData.name}
</p>
<p style="margin:2px 0 0; font-size:11px; color:rgba(255,255,255,0.8);">
New Lead Notification
</p>
</td>
</tr>
</table>
</td>

<!-- Right -->
<td align="right" style="vertical-align:middle;">
<span style="
background:rgba(255,255,255,0.18);
color:#fff;
padding:6px 12px;
border-radius:20px;
font-size:11px;
font-weight:600;
letter-spacing:0.3px;
">
NEW LEAD
</span>
</td>

</tr>
</table>

</td>
</tr>

<!-- Content -->
<tr>
<td style="padding:40px 36px;">

<!-- Intro -->
<h2 style="margin:0 0 14px; font-size:21px; font-weight:600; color:#111827;">
📢 New Client Inquiry Received
</h2>

<p style="margin:0 0 28px; font-size:15px; color:#4B5563; line-height:1.7;">
A potential client has submitted an inquiry through your platform. Please review the details below and follow up promptly.
</p>

<!-- Lead Card -->
<table width="100%" cellpadding="0" cellspacing="0"
style="background:linear-gradient(135deg, #FAFAFF 0%, #F4F3FF 100%); border:2px solid #EDE9FE; border-radius:12px; overflow:hidden; margin-bottom:30px;">

<!-- Accent -->
<tr>
<td colspan="2" style="height:4px; background:linear-gradient(90deg, ${accentColor}, #6D28D9);"></td>
</tr>

${renderRow("Full Name", leadData.name)}
${renderRow("Email Address", leadData.email)}
${renderRow("Contact Number", leadData.contactNumber)}
${renderRow("WhatsApp Number", leadData.whatsappNumber || "Same as Contact")}
${renderRow("Inquiry Type", leadData.EnquiryType)}
${renderRow("Event Date", formattedDate)}
${renderRow("Location", leadData.Location || "Not Provided")}
${renderRow("Relation", leadData.Relation || "Not Provided")}
${renderRow("Source", leadData.source)}
${renderRow("Submitted At", submittedAt)}

</table>

<!-- CTA -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px;">
<tr>
<td align="center">

<a href="${dashboardUrl}"
style="
display:inline-block;
background:linear-gradient(135deg, ${accentColor} 0%, #6D28D9 100%);
color:#FFFFFF;
text-decoration:none;
padding:18px 48px;
border-radius:8px;
font-size:15px;
font-weight:600;
letter-spacing:0.3px;
box-shadow:0 6px 14px rgba(139,92,246,0.35);
">
📂 OPEN IN DASHBOARD
</a>

</td>
</tr>
</table>

<!-- Closing -->
<p style="margin:0; font-size:14px; color:#6B7280; line-height:1.7;">
Responding quickly to inquiries increases your chances of conversion. We recommend contacting the client within 24 hours.
</p>

<p style="margin:22px 0 0; font-size:14px; font-weight:500; color:#111827;">
Best regards,<br/>
<span style="color:${accentColor};"> Plexis Team</span>
</p>

</td>
</tr>

<!-- Plexis Footer -->
<tr>
<td style="background:linear-gradient(135deg, #1F2937 0%, #111827 100%); padding:20px 24px;">

<table width="100%" cellpadding="0" cellspacing="0">

<!-- Brand Info -->
<tr>
<td style="padding-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.12);">

<p style="margin:0 0 4px 0; font-size:17px; font-weight:600; color:#FFFFFF; letter-spacing:0.3px;">
Plexis
</p>

<p style="
margin:12px 0 0;
font-size:13px;
color:rgba(255,255,255,0.75);
line-height:1.9;
max-width:420px;
">

Plexis helps photography studios streamline
lead management, client communication,
workflow tracking, bookings, and business
operations through a modern AI-powered CRM platform.

</p>

</td>
</tr>

<!-- Bottom Row -->
<tr>
<td style="padding-top:12px;">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>

<!-- Left: Copyright -->
<td align="left" style="vertical-align:middle;">

<p style="margin:0; font-size:12px; color:#FFFFFF; font-weight:500;">
© ${new Date().getFullYear()} Plexis Pvt. Ltd.
</p>


</td>

<!-- Right: Social + Powered -->
<td align="right" style="vertical-align:middle;">

<table cellpadding="0" cellspacing="0" style="margin-left:auto;">
<tr>

<!-- Instagram -->
<td style="padding-right:14px;">
<a href="https://www.instagram.com/plexis.in/" target="_blank" style="text-decoration:none;">
<img
src="https://cdn-icons-png.flaticon.com/512/174/174855.png"
width="20"
height="20"
style="display:block; opacity:0.75; border:0;"
/>
</a>
</td>

<!-- LinkedIn -->
<td style="padding-right:18px;">
<a href="https://www.linkedin.com/company/genz-galaxy/" target="_blank" style="text-decoration:none;">
<img
src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
width="20"
height="20"
style="display:block; opacity:0.75; border:0;"
/>
</a>
</td>

<!-- Powered -->
<td style="padding-right:8px;">
<span style="font-size:12px; color:rgba(255,255,255,0.6); font-weight:500;">
Powered by
</span>
</td>

<!-- Logo -->
<!-- Plexis Main Logo -->
<td>

<a href="https://www.plexis.in"
target="_blank"
style="text-decoration:none;">

<img
src="https://res.cloudinary.com/dbbb9clhp/image/upload/v1779455421/logo-CtWZqSaM_zbsfwe.png"
alt="Plexis"
width="90"

style="
display:block;
object-fit:contain;
border:0;
mix-blend-mode:multiply;
"
/>

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
</html>
`,
  };
};

/* Helper */
function renderRow(label: string, value: string) {
  return `
<tr>
<td style="padding:13px 18px; font-size:12px; font-weight:600; color:#6B7280; width:38%; border-bottom:1px solid #EDE9FE; text-transform:uppercase; letter-spacing:0.4px;">
${label}
</td>

<td style="padding:13px 18px; font-size:14px; color:#111827; font-weight:500; border-bottom:1px solid #EDE9FE;">
${value}
</td>
</tr>
`;
}
