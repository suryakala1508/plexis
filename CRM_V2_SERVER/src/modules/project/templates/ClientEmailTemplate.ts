// Project Created Email Template
// Premium purple studio-branded client email (Editorial Style)

interface ProjectEmailData {
  projectTitle: string;
  projectType: string;
  startDate: Date | string;
  endDate?: Date | string;
  location: string;
}

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

interface ClientData {
  name: string;
  email?: string;
}

export const projectCreatedEmailTemplate = (
  projectData: ProjectEmailData,
  studioData: StudioData,
  clientData: ClientData,
  projectPortalUrl: string
) => {
  const primary = studioData.accentColor || "#6D28D9";
  const dark = "#4C1D95";
  const light = "#F5F3FF";

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const start = formatDate(projectData.startDate);
  const end = projectData.endDate ? formatDate(projectData.endDate) : null;

  const dateRange =
    end && start !== end
      ? `${start} – ${end}`
      : start;

  return {
    subject: `🎉 Your Project Has Been Created – ${projectData.projectTitle}`,

    html: `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${studioData.name} - Project Created</title>
</head>

<body style="margin:0;padding:0;background:#FAFAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAFB;padding:40px 20px;">
<tr>
<td align="center">

<!-- MAIN CARD -->
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 10px 25px rgba(109,40,217,0.08);">

<!-- HEADER -->
<tr>
<td style="padding:36px 40px;background:linear-gradient(180deg, ${light} 0%, #FFFFFF 100%);border-bottom:1px solid #EEE;">
<table width="100%">
<tr>
<td align="left" style="display:flex;align-items:center;gap:10px;">
<div style="width:28px;height:28px;color:${primary};">
<svg viewBox="0 0 48 48" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="${primary}"/>
</svg>
</div>
<strong style="font-size:20px;font-family:Georgia,serif;font-weight:700;color:#111;">
${studioData.name}
</strong>
</td>

<td align="right" style="font-size:10px;letter-spacing:3px;color:${primary};font-weight:700;text-transform:uppercase;">
Project Initiation
</td>
</tr>
</table>
</td>
</tr>
<!-- INTRO / HERO -->
<tr>
<td style="padding:36px 32px 22px 32px;text-align:center;">

<h1 style="margin:0;
font-size:28px;
font-weight:400;
color:#111;
line-height:1.25;
font-family:Georgia,serif;">
Your vision,<br/>
<span style="color:${primary};font-style:italic;">brought to life.</span>
</h1>

<p style="margin:16px auto 0 auto;
font-size:15px;
color:#6B7280;
line-height:1.6;
max-width:420px;">
Hello ${clientData.name},<br/><br/>
We’re delighted to welcome you to <strong>${studioData.name}</strong>.
Your project <strong>“${projectData.projectTitle}”</strong> has been officially created,
and our team has begun shaping the experience around your vision.
</p>

<p style="margin:10px auto 0 auto;
font-size:14px;
color:#6B7280;
line-height:1.6;
max-width:420px;">
From planning to execution, every detail will be thoughtfully crafted
to deliver a meaningful and memorable experience.
</p>

</td>
</tr>
<!-- PROJECT OVERVIEW (CENTERED COMPACT CARD) -->
<tr>
  <td align="center" style="padding:18px 16px;">

    <!-- Card -->
    <table cellpadding="0" cellspacing="0"
      style="width:100%;max-width:450px;
      background:${light};
      border-radius:14px;
      padding:18px 18px;
      border:1px solid #EDE9FE;">

      <!-- Header -->
      <tr>
        <td align="center" style="padding-bottom:12px;">
          <p style="margin:0;
            font-size:11px;
            font-weight:700;
            color:${primary};
            letter-spacing:2px;
            text-transform:uppercase;">
            Project Overview
          </p>
        </td>
      </tr>

      <!-- Content -->
      <tr>
        <td>

          <table width="100%" cellpadding="0" cellspacing="0">

            <!-- Row 1 -->
            <tr>

              <!-- Project -->
              <td width="50%" align="center" style="padding:8px 6px;vertical-align:top;">
                <p style="margin:0;
                  font-size:10px;
                  color:#6B7280;
                  font-weight:600;
                  letter-spacing:1.4px;
                  text-transform:uppercase;">
                  Project Title
                </p>

                <p style="margin-top:4px;
                  font-size:14px;
                  font-weight:600;
                  color:#111;">
                  ${projectData.projectTitle}
                </p>
              </td>

              <!-- Type -->
              <td width="50%" align="center" style="padding:8px 6px;vertical-align:top;">
                <p style="margin:0;
                  font-size:10px;
                  color:#6B7280;
                  font-weight:600;
                  letter-spacing:1.4px;
                  text-transform:uppercase;">
                  Project Type
                </p>

                <p style="margin-top:4px;
                  font-size:14px;
                  font-weight:600;
                  color:#111;">
                  ${projectData.projectType}
                </p>
              </td>

            </tr>

            <!-- Row 2 -->
            <tr>

              <!-- Dates -->
              <td width="50%" align="center" style="padding:8px 6px;vertical-align:top;">
                <p style="margin:0;
                  font-size:10px;
                  color:#6B7280;
                  font-weight:600;
                  letter-spacing:1.4px;
                  text-transform:uppercase;">
                  Dates
                </p>

                <p style="margin-top:4px;
                  font-size:14px;
                  font-weight:600;
                  color:#111;">
                  ${dateRange}
                </p>
              </td>

              <!-- Location -->
              <td width="50%" align="center" style="padding:8px 6px;vertical-align:top;">
                <p style="margin:0;
                  font-size:10px;
                  color:#6B7280;
                  font-weight:600;
                  letter-spacing:1.4px;
                  text-transform:uppercase;">
                  Location
                </p>

                <p style="margin-top:4px;
                  font-size:14px;
                  font-weight:600;
                  color:#111;">
                  ${projectData.location}
                </p>
              </td>

            </tr>

          </table>

        </td>
      </tr>

    </table>

  </td>
</tr>


<!-- WHAT'S NEXT (COMPACT) -->
<tr>
  <td style="padding:20px 24px 8px 24px;">

    <p style="margin:0 0 10px 0;
      font-size:16px;
      font-weight:600;
      color:#111;">
      What’s Next
    </p>

    <p style="margin:0;
      font-size:14px;
      color:#6B7280;
      line-height:1.6;
      max-width:480px;">
      Our team will reach out soon to coordinate timelines, planning, and creative execution.
      We’ll guide you through every step to ensure everything flows seamlessly.
    </p>

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
                                                        ${studioData.address ? `${studioData.address.addressLine1}${studioData.address.addressLine2 ? ', ' + studioData.address.addressLine2 : ''}<br>
                                                        ${studioData.address.city}, ${studioData.address.state}, ${studioData.address.country}` : ''}
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
                <!-- END MAIN CARD -->
                
            </td>
        </tr>
    </table>
    
</body>
</html>
    `,
  };
};
