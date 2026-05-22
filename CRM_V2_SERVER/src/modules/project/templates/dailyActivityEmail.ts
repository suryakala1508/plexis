// ─────────────────────────────────────────────────────────────────────────────
// Daily Activity Email Template
// From:  Plexis Technologies Pvt. Ltd.
// To:    Studio owner (CRM user)
// Design: Dark header/footer, White compact card strips, Light Gray Body
// ─────────────────────────────────────────────────────────────────────────────

interface FollowUp {
  targetName: string;
  reason: string;
  status?: string;
}

interface CalendarEvent {
  title: string;
  startTime: string;
  location?: string;
}

interface Payment {
  projectTitle: string;
  clientName?: string;
  amount: string;
  dueDate?: string;
}

interface ActiveProject {
  title: string;
  clientName?: string;
  eventType?: string;
  status?: string;
}

interface Lead {
  name: string;
  source?: string;
  status?: string;
}

interface DailyActivityEmailData {
  userName: string;
  userEmail: string;
  date: Date | string;
  followUps?: FollowUp[];
  calendarEvents?: CalendarEvent[];
  payments?: Payment[];
  activeProjects?: ActiveProject[];
  newLeads?: Lead[];
}

export const dailyActivityEmailTemplate = (data: DailyActivityEmailData) => {
  const {
    userName,
    date,
    followUps = [],
    calendarEvents = [],
    payments = [],
    activeProjects = [],
    newLeads = [],
  } = data;

  const formattedDate = new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  })();

  const totalItems =
    followUps.length + calendarEvents.length + payments.length + activeProjects.length + newLeads.length;

  // ─── Logo ──────────────────────────────────────────────────────────────────
  const logoUrl = "https://crm-client-main-branch.vercel.app/assets/logo-CtWZqSaM.png";

  // ─── SVG icons ────────────────────────────────────────────────────────────
  const iconFollowUp  = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:7px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#9916B1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="7" r="4" stroke="#9916B1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#9916B1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#9916B1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const iconCalendar  = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:7px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="#9916B1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><line x1="16" y1="2" x2="16" y2="6" stroke="#9916B1" stroke-width="2.2" stroke-linecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="#9916B1" stroke-width="2.2" stroke-linecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="#9916B1" stroke-width="2.2" stroke-linecap="round"/></svg>`;
  const iconPayment   = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:7px;"><line x1="12" y1="1" x2="12" y2="23" stroke="#9916B1" stroke-width="2.2" stroke-linecap="round"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="#9916B1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const iconProject   = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:7px;"><rect x="2" y="3" width="20" height="14" rx="2" stroke="#9916B1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 21h8M12 17v4" stroke="#9916B1" stroke-width="2.2" stroke-linecap="round"/></svg>`;
  const iconLead      = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:7px;"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="#9916B1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const iconIG        = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="4" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17.5" cy="6.5" r="1" fill="#6B7280"/></svg>`;
  const iconLI        = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="2" y="9" width="4" height="12" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="4" cy="4" r="2" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  // ─── Stat cell ────────────────────────────────────────────────────────────
  // On mobile: stack vertically using block display, no border-right
  const statCell = (label: string, value: number, color: string, last = false) =>
    value === 0 ? "" : `
    <td class="stat-cell" align="center" style="padding:16px 8px;${!last ? "border-right:1px solid rgba(255,255,255,0.08);" : ""}">
      <p style="margin:0;font-size:21px;font-weight:800;color:${color};letter-spacing:-0.5px;">${value}</p>
      <p style="margin:5px 0 0 0;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:rgba(255,255,255,0.5);">${label}</p>
    </td>`;

  // ─── Section label ────────────────────────────────────────────────────────
  const sectionLabel = (icon: string, label: string, color: string, bgColor: string, borderColor: string, count: number) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;"><tr>
      <td style="vertical-align:middle;padding-bottom:8px;">
        ${icon}
        <span style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:${color};vertical-align:middle;">${label}</span>
        <span style="display:inline-block;margin-left:8px;font-size:10px;font-weight:700;color:${color};background:${bgColor};border:1px solid ${borderColor};padding:1px 8px;border-radius:20px;vertical-align:middle;">${count}</span>
      </td>
    </tr></table>`;

  // ─── Item row ─────────────────────────────────────────────────────────────
  // FIX: The colored left bar is already on the left side of each row correctly.
  // FIX: On mobile, the right-side content (status tags, amounts, times) wraps
  //      below using a block layout so it doesn't overflow or misalign.
  const itemRow = (
    barColor: string,
    title: string,
    subtitle: string | undefined,
    rightTop: string,
    rightBottom: string,
    divider: boolean
  ) => `
    <tr>
      <td style="padding:10px 0;${divider ? "border-bottom:1px solid #F3F4F6;" : ""}vertical-align:middle;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:middle;width:100%;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="width:3px;height:30px;background:${barColor};border-radius:2px;display:inline-block;vertical-align:middle;margin-right:12px;"></div>
                    <span style="font-size:13.5px;font-weight:600;color:#111827;vertical-align:middle;">${title}</span>
                    ${subtitle ? `<br/><span style="font-size:12px;color:#6B7280;padding-left:17px;line-height:2;">${subtitle}</span>` : ""}
                  </td>
                  ${(rightTop || rightBottom) ? `
                  <td align="right" style="vertical-align:middle;white-space:nowrap;padding-left:8px;">
                    ${rightTop ? `<span style="font-size:12px;">${rightTop}</span>` : ""}
                    ${rightBottom ? `<br/><span style="font-size:10.5px;color:#6B7280;">${rightBottom}</span>` : ""}
                  </td>` : ""}
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;

  // ─── Build section rows ───────────────────────────────────────────────────
  const followUpItemRows = followUps.map((f, i) => itemRow(
    "#818CF8", f.targetName, f.reason,
    f.status ? `<span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;color:#4F46E5;background:#EEF2FF;border:1px solid #C7D2FE;padding:3px 9px;border-radius:4px;">${f.status}</span>` : "",
    "",
    i < followUps.length - 1
  )).join("");

  const eventItemRows = calendarEvents.map((e, i) => itemRow(
    "#60A5FA", e.title, e.location || undefined,
    `<span style="font-size:12px;font-weight:700;color:#2563EB;background:#EFF6FF;border:1px solid #BFDBFE;padding:4px 12px;border-radius:4px;">${e.startTime}</span>`,
    "",
    i < calendarEvents.length - 1
  )).join("");

  const paymentItemRows = payments.map((p, i) => itemRow(
    "#34D399", p.projectTitle, p.clientName || undefined,
    `<span style="font-size:14px;font-weight:800;color:#059669;">${p.amount}</span>`,
    p.dueDate ? `due ${p.dueDate}` : "",
    i < payments.length - 1
  )).join("");

  const activeProjectItemRows = activeProjects.map((proj, i) => itemRow(
    "#FB923C", proj.title, proj.clientName || undefined,
    proj.eventType ? `<span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;color:#EA580C;background:#FFF7ED;border:1px solid #FED7AA;padding:3px 9px;border-radius:4px;">${proj.eventType}</span>` : "",
    proj.status ? proj.status : "",
    i < activeProjects.length - 1
  )).join("");

  const leadItemRows = newLeads.map((l, i) => itemRow(
    "#C084FC", l.name, l.source ? `via ${l.source}` : undefined,
    l.status ? `<span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;color:#9333EA;background:#FAF5FF;border:1px solid #E9D5FF;padding:3px 9px;border-radius:4px;">${l.status}</span>` : "",
    "",
    i < newLeads.length - 1
  )).join("");

  // ─── Section block ────────────────────────────────────────────────────────
  const buildSection = (
    icon: string, label: string, count: number,
    accentColor: string, bgColor: string, borderColor: string,
    rows: string
  ) => count === 0 ? "" : `
    <tr><td style="padding-bottom:4px;">
      ${sectionLabel(icon, label, accentColor, bgColor, borderColor, count)}
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:8px;overflow:hidden;border:1px solid #E5E7EB;">
        <tr><td style="padding:0 16px;">
          <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="height:16px;"></td></tr>`;

  // ─── HTML ─────────────────────────────────────────────────────────────────
  return {
    subject: `Your Daily Briefing — ${formattedDate}`,

    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Daily Briefing — Plexis</title>
<style>
  /* ── Reset ── */
  body, table, td, p, a, span { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }

  /* ── Mobile ── */
  @media only screen and (max-width: 620px) {

    /* Outer wrapper padding */
    .email-outer-pad { padding: 0 !important; }

    /* Main container: full width */
    .email-container { width: 100% !important; max-width: 100% !important; }

    /* Header / body / footer inner padding */
    .header-pad   { padding: 18px 20px 16px 20px !important; }
    .greeting-pad { padding: 8px 20px 20px 20px !important; }
    .stats-pad    { padding: 0 20px 20px 20px !important; }
    .body-pad     { padding: 20px 16px 12px 16px !important; }
    .footer-top   { padding: 18px 20px 14px 20px !important; }
    .footer-bot   { padding: 10px 20px 16px 20px !important; }

    /* Stats row: each cell stacks side-by-side but smaller */
    .stat-cell { padding: 12px 4px !important; }
    .stat-cell p:first-child { font-size: 18px !important; }
    .stat-cell p:last-child  { font-size: 8.5px !important; letter-spacing: 0.8px !important; }

    /* Header logo row: stack logo + date badge */
    .header-logo-row { display: block !important; width: 100% !important; }
    .header-logo-td  { display: block !important; width: 100% !important; padding-bottom: 8px !important; }
    .header-date-td  { display: block !important; width: 100% !important; text-align: left !important; }

    /* Greeting headline */
    .greeting-h1 { font-size: 20px !important; }

    /* Footer: stack logo block + social icons */
    .footer-inner-row { display: block !important; width: 100% !important; }
    .footer-logo-td   { display: block !important; width: 100% !important; padding-bottom: 12px !important; }
    .footer-social-td { display: block !important; width: 100% !important; text-align: left !important; }

    /* Footer links row */
    .footer-links-row  { display: block !important; width: 100% !important; }
    .footer-copy-td    { display: block !important; width: 100% !important; padding-bottom: 6px !important; }
    .footer-actions-td { display: block !important; width: 100% !important; text-align: left !important; white-space: normal !important; }

    /* CTA button */
    .cta-btn { padding: 13px 28px !important; font-size: 13px !important; }

    /* Item rows: allow right-side tag to wrap below on very small screens */
    .item-right-td { white-space: normal !important; padding-left: 6px !important; }
    .item-right-td span { display: inline-block !important; margin-top: 4px !important; }
  }

  @media only screen and (max-width: 400px) {
    /* On very narrow phones, force right-side content below */
    .item-inner-table { display: block !important; }
    .item-left-td  { display: block !important; width: 100% !important; }
    .item-right-td { display: block !important; width: 100% !important; text-align: left !important; padding-left: 17px !important; padding-top: 4px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:36px 16px;" class="email-outer-pad">
<tr><td align="center">

<table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;" class="email-container">

  <!-- ════ HEADER ════ -->
  <tr>
    <td style="background:#22031f;border-radius:14px 14px 0 0;overflow:hidden;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="height:3px;background:linear-gradient(90deg,#9916b1 0%,#f9b3d1 100%);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:22px 36px 16px 36px;" class="header-pad">
            <table width="100%" cellpadding="0" cellspacing="0" class="header-logo-row"><tr>
              <td style="vertical-align:middle;" class="header-logo-td">
                <a href="https://www.plexis.in" target="_blank" style="text-decoration:none;">
                  <img src="${logoUrl}" alt="Plexis" height="22" style="display:block;border:0;" />
                </a>
              </td>
              <td align="right" style="vertical-align:middle;" class="header-date-td">
                <span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:2.5px;color:rgba(255,255,255,0.7);">Daily Briefing</span>
                <span style="display:inline-block;margin-left:14px;font-size:10px;font-weight:600;color:rgba(167,139,250,0.95);background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.3);padding:3px 11px;border-radius:3px;letter-spacing:0.4px;">${formattedDate}</span>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 36px 24px 36px;" class="greeting-pad">
            <h1 class="greeting-h1" style="margin:0 0 6px 0;font-size:24px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;line-height:1.25;">${greeting},<br/><span style="color:#A78BFA;">${userName}</span>.</h1>
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.7);line-height:1.5;max-width:400px;">Here is your complete activity overview for today.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 36px 24px 36px;" class="stats-pad">
            ${totalItems > 0 ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;overflow:hidden;">
              <tr>
                ${statCell("Follow-ups", followUps.length, "#A78BFA")}
                ${statCell("Events", calendarEvents.length, "#FBBF24")}
                ${statCell("Payments", payments.length, "#34D399")}
                ${statCell("Projects", activeProjects.length, "#FB923C")}
                ${statCell("New Leads", newLeads.length, "#60A5FA", true)}
              </tr>
            </table>` : `
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;">
              <tr><td align="center" style="padding:16px;"><p style="margin:0;font-size:13px;color:rgba(255,255,255,0.3);">You have no activity scheduled for today.</p></td></tr>
            </table>`}
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ════ BODY ════ -->
  <tr>
    <td style="background:#F3F4F6;padding:24px 36px 16px 36px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;" class="body-pad">
      <table width="100%" cellpadding="0" cellspacing="0">

        ${buildSection(iconFollowUp, "Follow-ups & Reminders", followUps.length, "#9916b1", "transparent", "transparent", followUpItemRows)}
        ${buildSection(iconCalendar, "Calendar Events", calendarEvents.length, "#9916b1", "transparent", "transparent", eventItemRows)}
        ${buildSection(iconPayment, "Payments Due", payments.length, "#9916b1", "transparent", "transparent", paymentItemRows)}
        ${buildSection(iconProject, "Active Projects Today", activeProjects.length, "#9916b1", "transparent", "transparent", activeProjectItemRows)}
        ${buildSection(iconLead, "New Leads", newLeads.length, "#9916b1", "transparent", "transparent", leadItemRows)}

        ${totalItems === 0 ? `
        <tr>
          <td align="center" style="padding:16px 0;">
            <div style="background:#FFFFFF;border-radius:12px;padding:32px 24px;border:1px dashed #D1D5DB;text-align:center;">
              <p style="margin:0;font-size:16px;font-weight:700;color:#374151;">No activity scheduled for today.</p>
              <p style="margin:8px 0 0 0;font-size:13px;color:#6B7280;line-height:1.5;">Your calendar looks clear for now. Great time to catch up on planning!</p>
            </div>
          </td>
        </tr>` : ""}

        <!-- CTA -->
        <tr>
          <td align="center" style="padding:16px 0 8px 0;">
            <a href="https://www.plexis.in/dashboard" target="_blank" class="cta-btn" style="display:inline-block;background:#22031f;color:#FFFFFF;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.3px;padding:12px 36px;border-radius:6px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -1px rgba(0,0,0,0.1);">Open Dashboard &rarr;</a>
          </td>
        </tr>

      </table>
    </td>
  </tr>

  <!-- ════ FOOTER ════ -->
  <tr>
    <td style="background:#22031f;border-radius:0 0 14px 14px;overflow:hidden;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:22px 36px 16px 36px;border-bottom:1px solid rgba(255,255,255,0.06);" class="footer-top">
            <table width="100%" cellpadding="0" cellspacing="0" class="footer-inner-row"><tr>
              <td style="vertical-align:middle;" class="footer-logo-td">
                <a href="https://www.plexis.in" target="_blank" style="text-decoration:none;display:inline-block;margin-bottom:6px;">
                  <img src="${logoUrl}" alt="Plexis" height="18" style="display:block;border:0;opacity:0.9;" />
                </a>
                <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.6);line-height:1.5;">AI-Powered CRM Built for Creative Studios</p>
              </td>
              <td align="right" style="vertical-align:middle;" class="footer-social-td">
                <a href="https://www.instagram.com/plexis.in/" target="_blank" style="text-decoration:none;display:inline-block;margin-left:14px;">${iconIG}</a>
                <a href="https://www.linkedin.com/company/genz-galaxy/" target="_blank" style="text-decoration:none;display:inline-block;margin-left:14px;">${iconLI}</a>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 36px 18px 36px;" class="footer-bot">
            <table width="100%" cellpadding="0" cellspacing="0" class="footer-links-row"><tr>
              <td class="footer-copy-td">
                <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.5);line-height:1.5;">&copy; 2026 Plexis Technologies Pvt. Ltd. All rights reserved.</p>
              </td>
              <td align="right" style="white-space:nowrap;" class="footer-actions-td">
                <a href="https://www.plexis.in/settings" style="font-size:11px;color:rgba(255,255,255,0.6);text-decoration:none;">Manage preferences</a>
                <span style="color:rgba(255,255,255,0.3);margin:0 6px;">&middot;</span>
                <a href="https://www.plexis.in" style="font-size:11px;color:rgba(255,255,255,0.6);text-decoration:none;">plexis.in</a>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr><td style="height:3px;background:linear-gradient(90deg,#9916b1 0%,#f9b3d1 100%);font-size:0;line-height:0;">&nbsp;</td></tr>
      </table>
    </td>
  </tr>

</table>

</td></tr>
</table>

</body>
</html>`,
  };
};