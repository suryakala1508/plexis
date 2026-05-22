import { sendMail } from "@/core/services/mailer"

/* -------------------- Types -------------------- */

interface StudioData {
  name: string
  tagline?: string
  logo?: string
  accentColor?: string
  address?: {
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    country: string
  }
  email?: string
  phone?: string
}

interface StudioInvitationEmailParams {
  name: string
  roles: string[]
  access?: string[]
  studioName: string
  setPasswordLink: string
  studioData: StudioData
}

/* -------------------- Template -------------------- */

export const studioInvitationEmail = ({
  name,
  roles,
  access = [],
  studioName,
  setPasswordLink,
  studioData,
}: StudioInvitationEmailParams) => {
  const primary = studioData.accentColor || "#6D28D9"
  const light = "#F5F3FF"

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${studioName} – Studio Invitation</title>
</head>

<body style="margin:0;padding:0;background:#FAFAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAFB;padding:40px 20px;">
<tr>
<td align="center">

<!-- MAIN CARD -->
<table width="600" cellpadding="0" cellspacing="0"
style="max-width:600px;background:#FFFFFF;border-radius:20px;overflow:hidden;
box-shadow:0 10px 25px rgba(109,40,217,0.08);">

<!-- HEADER -->
<tr>
<td style="padding:36px 40px;background:linear-gradient(180deg, ${light} 0%, #FFFFFF 100%);
border-bottom:1px solid #EEE;">
<table width="100%">
<tr>

<td align="left">
<strong style="font-size:20px;font-family:Georgia,serif;font-weight:700;color:#111;">
${studioData.name || studioName}
</strong>
</td>

<td align="right"
style="font-size:10px;letter-spacing:3px;color:${primary};
font-weight:700;text-transform:uppercase;">
Team Invitation
</td>

</tr>
</table>
</td>
</tr>

<!-- HERO -->
<tr>
<td style="padding:36px 32px 20px 32px;text-align:center;">

<h1 style="margin:0;
font-size:28px;
font-weight:400;
color:#111;
line-height:1.25;
font-family:Georgia,serif;">
A place for your craft,<br/>
<span style="color:${primary};font-style:italic;">and your voice.</span>
</h1>

<p style="margin:16px auto 0 auto;
font-size:15px;
color:#6B7280;
line-height:1.6;
max-width:420px;">
Hello ${name},<br/><br/>
You’ve been invited to join <strong>${studioName}</strong> as
<strong>${roles.join(", ")}</strong>.
We believe your experience will be a meaningful addition to our creative team.
</p>

</td>
</tr>

<!-- ROLE CARD -->
<tr>
<td align="center" style="padding:16px 16px 10px 16px;">

<table cellpadding="0" cellspacing="0"
style="width:100%;max-width:420px;
background:${light};
border-radius:14px;
padding:18px;
border:1px solid #EDE9FE;">

<tr>
<td align="center">
<p style="margin:0;
font-size:11px;
font-weight:700;
color:${primary};
letter-spacing:2px;
text-transform:uppercase;">
Your Role
</p>

<p style="margin-top:6px;
font-size:15px;
font-weight:600;
color:#111;">
${roles.join(", ")}
</p>
</td>
</tr>

</table>

</td>
</tr>

<!-- CTA -->
<tr>
<td align="center" style="padding:26px 24px 12px 24px;">

<a href="${setPasswordLink}"
style="display:inline-block;
padding:14px 34px;
background:linear-gradient(135deg,#5B21B6,#7C3AED);
color:#FFFFFF;
text-decoration:none;
border-radius:10px;
font-weight:600;
font-size:15px;
box-shadow:0 8px 20px rgba(124,58,237,0.35);">
Accept Invitation
</a>

</td>
</tr>

<!-- NEXT STEPS -->
<tr>
<td style="padding:18px 32px 30px 32px;">

<p style="margin:0 0 8px 0;
font-size:16px;
font-weight:600;
color:#111;">
What happens next
</p>

<p style="margin:0;
font-size:14px;
color:#6B7280;
line-height:1.6;">
After accepting, you’ll set your password and gain access to your studio dashboard.
We’ll guide you through onboarding and introduce you to the team.
</p>

</td>
</tr>

<!-- FOOTER -->
<tr>
<td style="background:linear-gradient(135deg,#5B21B6,#7C3AED);padding:20px 22px;">

<table width="100%" cellpadding="0" cellspacing="0">

<tr>
<td style="padding-bottom:12px;">

<p style="margin:0 0 4px 0;
font-size:14px;font-weight:700;color:#FFFFFF;">
${studioData.name || studioName}
</p>

${
  studioData.address
    ? `
<p style="margin:0;font-size:11px;color:rgba(255,255,255,0.75);line-height:1.45;">
${studioData.address.addressLine1}${studioData.address.addressLine2 ? ", " + studioData.address.addressLine2 : ""}<br>
${studioData.address.city}, ${studioData.address.state}, ${studioData.address.country}
</p>`
    : ``
}

</td>
</tr>

<tr>
<td style="padding-bottom:10px;">
<div style="height:1px;background:rgba(255,255,255,0.25);"></div>
</td>
</tr>

<tr>
<td style="text-align:right;">
<p style="margin:0;
font-size:10px;color:rgba(255,255,255,0.85);">
Powered by <strong>PLEXIS</strong>
</p>
</td>
</tr>

<tr>
<td align="center" style="padding-top:10px;">
<p style="margin:0;font-size:9px;color:rgba(255,255,255,0.7);">
© ${new Date().getFullYear()} Plexis · All rights reserved
</p>
</td>
</tr>

</table>

</td>
</tr>

</table>
<!-- END CARD -->

</td>
</tr>
</table>

</body>
</html>
`
}
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
  })

  await sendMail(
    to,
    `You're invited to join ${studioName} as ${roles.join(", ")}`,
    `You have been invited to ${studioName}. Please use the link to set your password and accept the invitation.`,
    html,
  )
}