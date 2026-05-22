import cron from "node-cron";
import { User } from "../../models/userModel";
import { Project } from "../../models/projectModel";
import { sendMail } from "./mailer";
import { CalenderEventModel } from "../../models/calenderEventModel";
import { FollowUpModel } from "../../models/followUpModel";
import { PaymentScheduleModel } from "../../models/paymentScheduleModel";
import { dailyActivityEmailTemplate } from "../../modules/project/templates/dailyActivityEmail";

/**
 * Initialize all scheduled tasks
 */
export const initScheduler = () => {
  console.log("🕐 Initializing scheduled tasks...");
  
  // User validity check - runs every day at 09:00 AM IST
  startValidityCheckJob();

  // Daily activity email - runs every day at 08:00 AM IST
  startDailyActivityEmailJob();
};

/**
 * Cron job to check users whose subscription is expiring soon
 * Runs daily at 09:00 AM IST
 */
const startValidityCheckJob = () => {
  cron.schedule(
    "0 9 * * *", // Every day at 09:00 AM
    async () => {
      try {
        console.log("Running validity check job...");

        const now = new Date();
        const twoDaysFromNow = new Date(
          now.getTime() + 2 * 24 * 60 * 60 * 1000
        );

        // Find users whose subscription expires within 2 days
        const users = await User.find({
          validUntil: {
            $gte: now,
            $lte: twoDaysFromNow
          },
          role: "1"
        }).select("email firstName lastName validUntil");
        console.log(`Users expiring soon: ${users.length}`);

        // Send email notification to each user
        for (const user of users) {
          try {
            const daysRemaining = Math.ceil(
              (user.validUntil!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            await sendMail(
              user.email!,
              "⚠️ Your PLEXIS Subscription is Expiring Soon",
              `Hello ${user.firstName || "User"},\n\nThis is a friendly reminder that your PLEXIS subscription will expire in ${daysRemaining} day(s) on ${user.validUntil!.toLocaleDateString()}.\n\nPlease renew your subscription to continue enjoying uninterrupted access to all features.\n\nBest regards,\nThe PLEXIS Team`
            );

            console.log(`✅ Sent expiry reminder to ${user.email}`);
          } catch (emailError) {
            console.error(`Failed to send email to ${user.email}:`, emailError);
          }
        }

        console.log("Validity check job completed.");
      } catch (err) {
        console.error("Scheduler error:", err);
      }
    },
    {
      timezone: "Asia/Kolkata" // IST timezone
    }
  );

  console.log("✅ Validity check job scheduled (09:00 AM IST daily)");
};

/**
 * Cron job to send daily activity emails to users who opted in
 * Runs daily at 08:00 AM IST
 */

const BATCH_SIZE = 10;

const processUserDailyEmail = async (user: any, startOfDay: Date, endOfDay: Date, nowIST: Date) => {
  // Run all 4 DB queries in parallel instead of sequentially
  const [calendarEvents, followUps, payments, activeProjects] = await Promise.all([
    CalenderEventModel.find({
      createdBy: user._id,
      start: { $gte: startOfDay, $lte: endOfDay },
    }).lean(),

    FollowUpModel.find({
      userId: user._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: "completed" },
    })
      .populate("leadId", "name")
      .populate("clientId", "clientName")
      .lean(),

    PaymentScheduleModel.find({
      createdBy: user._id,
      status: { $ne: "paid" },
      dueDate: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate("projectId", "projectTitle clientName")
      .lean(),

    Project.find({
      createdBy: user._id,
      $or: [
        { startDate: { $lte: endOfDay }, endDate: { $gte: startOfDay } },
        { startDate: { $gte: startOfDay, $lte: endOfDay }, endDate: { $exists: false } },
        { startDate: { $gte: startOfDay, $lte: endOfDay }, endDate: null },
      ],
    })
      .select("projectTitle clientName eventType status")
      .lean(),
  ]);

  const mappedFollowUps = (followUps as any[]).map((f) => ({
    targetName: f.leadId?.name || f.clientId?.clientName || f.leadName || "Unknown",
    reason: f.reason || "",
    status: f.status || undefined,
  }));

  const mappedEvents = (calendarEvents as any[]).map((e) => ({
    title: e.title || "Untitled Event",
    startTime: new Date(e.start).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    location: e.location || undefined,
  }));

  const mappedPayments = (payments as any[]).map((p) => ({
    projectTitle: p.projectId?.projectTitle || "Project",
    clientName: p.projectId?.clientName || undefined,
    amount: (p.amount || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" }),
    dueDate: "today",
  }));

  const mappedActiveProjects = (activeProjects as any[]).map((proj) => ({
    title: proj.projectTitle || "Untitled Project",
    clientName: proj.clientName || undefined,
    eventType: proj.eventType || undefined,
    status: proj.status || undefined,
  }));

  const { subject, html } = dailyActivityEmailTemplate({
    userName: user.firstName || "there",
    userEmail: user.email!,
    date: nowIST,
    followUps: mappedFollowUps,
    calendarEvents: mappedEvents,
    payments: mappedPayments,
    activeProjects: mappedActiveProjects,
    newLeads: [],
  });

  await sendMail(
    user.email!,
    subject,
    `Here is your daily activity summary for ${nowIST.toLocaleDateString("en-IN")}.`,
    html
  );
};

const startDailyActivityEmailJob = () => {
  cron.schedule(
    "0 6 * * *", // Every day at 08:00 AM IST
    async () => {
      try {
        console.log("Running daily activity email job...");

        const now = new Date();
        const nowISTstr = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
        const nowIST = new Date(nowISTstr);

        const year = nowIST.getFullYear();
        const month = (nowIST.getMonth() + 1).toString().padStart(2, '0');
        const day = nowIST.getDate().toString().padStart(2, '0');

        const startOfDay = new Date(`${year}-${month}-${day}T00:00:00.000+05:30`);
        const endOfDay = new Date(`${year}-${month}-${day}T23:59:59.999+05:30`);

        const totalUsers = await User.countDocuments({ receiveDailyActivityEmail: true });

        if (totalUsers === 0) {
          console.log("No users opted in for daily activity email.");
          return;
        }

        console.log(`Sending daily activity emails to ${totalUsers} users in batches of ${BATCH_SIZE}...`);

        let processed = 0;
        let skip = 0;

        while (skip < totalUsers) {
          // Load one batch at a time — no full collection in memory
          const batch = await User.find({ receiveDailyActivityEmail: true })
            .select("_id email firstName lastName")
            .skip(skip)
            .limit(BATCH_SIZE)
            .lean();

          // Process each user in the batch, failures don't stop others
          await Promise.allSettled(
            batch.map(async (user) => {
              try {
                await processUserDailyEmail(user, startOfDay, endOfDay, nowIST);
                console.log(`✅ Sent daily activity email to ${user.email}`);
                processed++;
              } catch (err) {
                console.error(`Failed to send daily activity email to ${user.email}:`, err);
              }
            })
          );

          skip += BATCH_SIZE;
        }

        console.log(`Daily activity email job completed. Sent: ${processed}/${totalUsers}`);
      } catch (err) {
        console.error("Scheduler error [Daily Activity]:", err);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  console.log("✅ Daily activity email job scheduled (08:00 AM IST daily)");
};
