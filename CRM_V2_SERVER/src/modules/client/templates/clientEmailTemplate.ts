// Email Template for New Client Notification (Studio)
// Professional Purple + White Theme
// Email-safe using tables and inline styles

interface ClientData {
  name: string;
  email?: string;
  phone?: string;
  relation: string;
  status: string;
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

export const clientNotificationEmailTemplate = (
  clientData: ClientData,
  studioData: StudioData,
  dashboardUrl: string
) => {
  const accentColor = studioData.accentColor || "#8B5CF6";
  const submittedAt = new Date(clientData.createdAt).toLocaleString("en-IN");

  return {
    subject: `📩 New Client Added — ${clientData.name}`,

    html: `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>New Client</title>
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
New Client Notification
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
NEW CLIENT
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
📢 New Client Added
</h2>

<p style="margin:0 0 28px; font-size:15px; color:#4B5563; line-height:1.7;">
A new client has been added to your CRM. Please review the details below.
</p>

<!-- Client Card -->
<table width="100%" cellpadding="0" cellspacing="0"
style="background:linear-gradient(135deg, #FAFAFF 0%, #F4F3FF 100%); border:2px solid #EDE9FE; border-radius:12px; overflow:hidden; margin-bottom:30px;">

<!-- Accent -->
<tr>
<td colspan="2" style="height:4px; background:linear-gradient(90deg, ${accentColor}, #6D28D9);"></td>
</tr>

${renderRow("Client Name", clientData.name)}
${renderRow("Email Address", clientData.email || "Not Provided")}
${renderRow("Phone Number", clientData.phone || "Not Provided")}
${renderRow("Relation", clientData.relation)}
${renderRow("Status", clientData.status)}
${renderRow("Added At", submittedAt)}

</table>

<!-- CTA -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px;">
<tr>
<td align="center">

<a href="${dashboardUrl}/clients"
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
📂 VIEW CLIENTS
</a>

</td>
</tr>
</table>

<!-- Closing -->
<p style="margin:0; font-size:14px; color:#6B7280; line-height:1.7;">
Keep your client database up to date for better relationship management.
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

<p style="margin:0; font-size:13px; color:rgba(255,255,255,0.75); line-height:1.6;">
AI-Powered CRM Built for Photography Studios
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
© ${new Date().getFullYear()} Plexis Technologies Pvt. Ltd.
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
<td>
<a href="https://www.plexis.in" target="_blank" style="text-decoration:none;">
<table cellpadding="0" cellspacing="0"
style="background:#ffffff;
border-radius:8px;
padding:6px;
border:1px solid #EDE9FE;">
<tr>
<td align="center" valign="middle">
<img
src="https://res.cloudinary.com/dnjl0jih4/image/upload/v1769701552/favicon-32x32_hbgldf.png"
width="24"
height="24"
alt="Plexis"
style="display:block;border:0;"
/>
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
