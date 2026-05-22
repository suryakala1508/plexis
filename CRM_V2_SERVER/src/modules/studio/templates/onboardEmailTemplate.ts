interface StudioData {
  name: string;
  tagline?: string;
  logo?: string;
  accentColor?: string;
  address?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
  };
  email?: string;
  phone?: string;
}

export const studioOnboardedEmailTemplate = (
  studioData: StudioData,
  dashboardUrl: string
) => {
  const primary = studioData.accentColor || "#6D28D9";
  const purpleDark = "#4C1D95";
  const purpleSoft = "#EEF2FF";
  const purpleLight = "#F5F3FF";

  return {
    subject: `🎉 ${studioData.name} is Now Live on Plexis`,

    html: `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${studioData.name} - Studio Onboarded</title>
</head>

<body style="margin:0;padding:0;background:${purpleLight};
font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0"
style="background:${purpleLight};padding:40px 20px;">
<tr>
<td align="center">

<table width="640" cellpadding="0" cellspacing="0"
style="max-width:640px;background:#FFFFFF;border-radius:20px;
overflow:hidden;box-shadow:0 10px 25px rgba(109,40,217,0.08);">

<!-- ===== CLEAN HEADER (ICON ONLY) ===== -->
<tr>
<td style="
padding:36px 40px;
background:linear-gradient(180deg, ${purpleLight} 0%, #FFFFFF 100%);
border-bottom:1px solid #EEE;">

<table width="100%">
<tr>

<td align="left" style="vertical-align:middle;">
<img
src="https://res.cloudinary.com/dnjl0jih4/image/upload/v1769871521/logo_illsdb.png"
width="120"
height="40"
style="display:block;border:0;"
/>
</td>

<td align="right"
style="font-size:10px;letter-spacing:3px;color:${primary};
font-weight:700;text-transform:uppercase;">
Studio Activation
</td>

</tr>
</table>

</td>
</tr>


<!-- ===== HERO INTRO ===== -->
<tr>
<td style="padding:46px 34px 10px 34px;text-align:center;position:relative;">

<div style="position:absolute;top:10px;left:20px;opacity:0.04;">
<img src="IMAGE_ICON_URL" width="180"/>
</div>

<h1 style="
margin:0;
font-size:30px;
font-weight:400;
color:#111;
line-height:1.25;
font-family:Georgia,serif;">
Welcome to<br/>
<span style="color:${primary};font-style:italic;">
the new way of running your studio.
</span>
</h1>

<p style="
margin:18px auto 0 auto;
font-size:15px;
color:#6B7280;
line-height:1.7;
max-width:460px;">
Hi <strong>${studioData.name}</strong>,<br/><br/>
The creative chaos ends here. You’ve officially upgraded from juggling multiple tools
to a single AI-powered command center.
</p>

</td>
</tr>

<!-- ===== FIRST STEP CARD ===== -->
<tr>
<td align="center" style="padding:28px;">
<table cellpadding="0" cellspacing="0"
style="width:100%;max-width:460px;background:${purpleSoft};
border-radius:14px;padding:22px;border:1px solid #E0E7FF;">

<tr>
<td align="center" style="padding-bottom:8px;">
<p style="margin:0;font-size:11px;font-weight:800;
letter-spacing:2px;color:${primary};text-transform:uppercase;">
The First Step
</p>
</td>
</tr>

<tr>
<td align="center">
<p style="margin:0 0 16px 0;font-size:14px;color:#475569;line-height:1.6;">
Head to your dashboard to sync active projects and start managing
your studio the Plexis way.
</p>

<a href="${dashboardUrl}"
style="display:inline-block;text-decoration:none;
background:linear-gradient(135deg, ${primary}, ${purpleDark});
color:#FFFFFF;font-weight:700;font-size:13px;
padding:12px 26px;border-radius:10px;">
Go to Studio Dashboard →
</a>
</td>
</tr>

</table>
</td>
</tr>

<!-- ===== ABOUT PLEXIS ===== -->
<tr>
<td style="padding:10px 40px 30px 40px;text-align:left;">

<p style="margin:0 0 8px 0;font-size:11px;font-weight:800;
letter-spacing:2px;color:${primary};text-transform:uppercase;">
What is Plexis?
</p>

<p style="margin:0 0 18px 0;font-size:14px;color:#475569;line-height:1.7;">
Plexis is an AI-native operating system crafted specifically for photography studios.
Project management, client collaboration, and resource planning —
all unified into one intelligent interface.
</p>

<p style="margin:0;font-size:14px;color:#111827;">
Stay creative,<br/>
<strong>The Plexis Team</strong>
</p>

</td>
</tr>

<!-- ===== PREMIUM FOOTER ===== -->
<tr>
<td style="background:linear-gradient(135deg, #1F2937 0%, #111827 100%); padding:20px 24px;">

<table width="100%" cellpadding="0" cellspacing="0">

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

<tr>
<td style="padding-top:12px;">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>

<td align="left" style="vertical-align:middle;">
<p style="margin:0; font-size:12px; color:#FFFFFF; font-weight:500;">
© ${new Date().getFullYear()} Plexis Technologies Pvt. Ltd.
</p>
</td>

<td align="right" style="vertical-align:middle;">
<table cellpadding="0" cellspacing="0" style="margin-left:auto;">
<tr>

<td style="padding-right:14px;">
<a href="https://www.instagram.com/plexis.in/" target="_blank">
<img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" width="20" height="20" style="opacity:0.75;border:0;"/>
</a>
</td>

<td style="padding-right:18px;">
<a href="https://www.linkedin.com/company/genz-galaxy/" target="_blank">
<img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" width="20" height="20" style="opacity:0.75;border:0;"/>
</a>
</td>

<td style="padding-right:8px;">
<span style="font-size:12px; color:rgba(255,255,255,0.6); font-weight:500;">
Powered by
</span>
</td>

<td>
<a href="https://www.plexis.in" target="_blank">
<table cellpadding="0" cellspacing="0"
style="background:#ffffff;border-radius:8px;padding:6px;border:1px solid #EDE9FE;">
<tr>
<td align="center" valign="middle">
<img
src="https://res.cloudinary.com/dnjl0jih4/image/upload/v1769701552/favicon-32x32_hbgldf.png"
width="24"
height="24"
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
</td>
</tr>
</table>

</body>
</html>
`,
  };
};
