// Compact Email Template for Gallery Invitation
// Redesigned with space-efficient sections

interface GalleryEmailData {
  projectTitle: string;
  projectDate: Date;
  folderCount: number;
  imageCount: number;
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
  phone?: string;
  email?: string;
  website?: string;
}

interface ClientData {
  name: string;
  email: string;
}

export const galleryEmailTemplate = (
  galleryData: GalleryEmailData,
  studioData: StudioData,
  clientData: ClientData,
  viewUrl: string,
  galleryPin?: string,
) => {
  const primary = studioData.accentColor || "#6D28D9";
  const dark = "#4C1D95";
  const light = "#F5F3FF";

  const formattedProjectDate = new Date(
    galleryData.projectDate,
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const pinSection = galleryPin
    ? `
<!-- Gallery PIN Section -->
<table border="0" cellpadding="0" cellspacing="0" width="100%"
style="background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
border-radius: 12px;
border: 2px solid #86EFAC;
margin-bottom: 30px;
overflow: hidden;">

<tr>
<td>

<table border="0" cellpadding="0" cellspacing="0" width="100%"
style="background: linear-gradient(135deg, ${light} 0%, #EDE9FE 100%);
border-radius: 12px;
overflow: hidden;
border: 2px solid ${primary};">

<tr>
<td style="padding: 20px 24px;">

<table width="100%">

<tr>

<td style="width: 40%; vertical-align: middle;">

<p style="
margin: 0;
font-size: 11px;
font-weight: 700;
color: ${primary};
text-transform: uppercase;
letter-spacing: 1px;
padding-bottom: 4px;
">
🔐 Your PIN
</p>

<p style="
margin: 0;
font-size: 13px;
font-weight: 500;
color: #6B7280;
line-height: 1.4;
">
Use to download hi-res photos
</p>

</td>

<td align="right" style="width: 60%; vertical-align: middle;">

<table style="
background: #FFFFFF;
border-radius: 8px;
padding: 12px 28px;
box-shadow: 0 2px 8px rgba(124, 58, 237, 0.15);
margin-left: auto;
">

<tr>
<td align="center">

<p style="
margin: 0;
font-size: 24px;
font-weight: 800;
color: ${primary};
letter-spacing: 6px;
font-family: 'Courier New', monospace;
">
${galleryPin}
</p>

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
`
    : "";

  return {
    subject: `🎬 Your ${studioData.name} Gallery is Ready - ${galleryData.projectTitle}`,

    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FAFAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;background:#FAFAFB;">
<tr>
<td align="center">

<!-- MAIN CARD -->
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 10px 25px rgba(109,40,217,0.08);">

<!-- ✅ EDITORIAL HEADER (FROM PROJECT EMAIL) -->
<tr>
<td style="padding:36px 40px;background:linear-gradient(180deg, ${light} 0%, #FFFFFF 100%);border-bottom:1px solid #EEE;">
<table width="100%">
<tr>

<td align="left" style="display:flex;align-items:center;gap:10px;">
<div style="width:28px;height:28px;color:${primary};">
<svg viewBox="0 0 48 48" width="28" height="28" fill="none">
<path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="${primary}"/>
</svg>
</div>
<strong style="font-size:20px;font-family:Georgia,serif;font-weight:700;color:#111;">
${studioData.name}
</strong>
</td>

<td align="right" style="font-size:10px;letter-spacing:3px;color:${primary};font-weight:700;text-transform:uppercase;">
Gallery Delivery
</td>

</tr>
</table>
</td>
</tr>

<!-- ✅ HERO INTRO -->
<tr>
<td style="padding:36px 32px 10px 32px;text-align:center;">

<h1 style="margin:0;font-size:28px;font-weight:400;color:#111;line-height:1.25;font-family:Georgia,serif;">
Your memories,<br/>
<span style="color:${primary};font-style:italic;">beautifully captured.</span>
</h1>

<p style="margin:16px auto 0 auto;font-size:15px;color:#6B7280;line-height:1.6;max-width:420px;">
Hello ${clientData.name},<br/><br/>
Your gallery for <strong>“${galleryData.projectTitle}”</strong> is now ready.
Relive every moment, download favorites, and share with loved ones.
</p>

</td>
</tr>

<!-- ✅ YOUR EXISTING GALLERY BODY STARTS HERE -->
<tr>
<td style="padding: 30px 35px;">

<!-- Project Summary Card -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:${light};border-radius:14px;border:1px solid #EDE9FE;margin-bottom:22px;">
<tr>
<td style="padding:18px;">

<table width="100%">
<tr>

<td width="25%" align="center">
<p style="font-size:10px;color:#6B7280;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;">Project</p>
<p style="font-size:14px;font-weight:600;color:#111;">${galleryData.projectTitle}</p>
</td>

<td width="25%" align="center">
<p style="font-size:10px;color:#6B7280;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;">Date</p>
<p style="font-size:14px;font-weight:600;color:#111;">${formattedProjectDate}</p>
</td>

<td width="25%" align="center">
<p style="font-size:10px;color:#6B7280;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;">Folders</p>
<p style="font-size:14px;font-weight:600;color:#111;">${galleryData.folderCount}</p>
</td>

<td width="25%" align="center">
<p style="font-size:10px;color:#6B7280;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;">Photos</p>
<p style="font-size:14px;font-weight:600;color:#111;">${galleryData.imageCount}</p>
</td>

</tr>
</table>

</td>
</tr>
</table>

${pinSection}

<!-- CTA -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;margin-bottom:10px;">
<tr>
<td align="center">
<a href="${viewUrl}" style="background:${primary};color:#fff;text-decoration:none;padding:14px 44px;border-radius:10px;font-weight:700;display:inline-block;">
View Gallery
</a>
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
`,
  };
};