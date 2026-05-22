import { Response } from "express"
import { AuthRequest } from "../../core/middleware"
import Ticket from "../../models/ticketModel"
import { sendMail } from "../../core/services/mailer"
import { ticketSubmissionTemplate } from "./EmailTemplate"
import { teamNotificationTemplate } from "./EmailTemplate"

export const createTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { title, issueType, description, priority, attachments } = req.body

    if (!title || !issueType || !description) {
      return res.status(400).json({
        success: false,
        message: "Missing fields",
      })
    }

    const ticket = await Ticket.create({
      refNo: req.user!.refNo,
      title,
      issueType,
      description,
      priority,
      status: "open",
      attachments: attachments || [],
    })

    // 📧 Email notification to USER
    try {
      const userEmail = req.user?.email
      if (userEmail) {
        const { subject, text, html } = ticketSubmissionTemplate(ticket as any, req.user!)
        await sendMail(userEmail, subject, text, html)
        console.log("✅ User confirmation email sent to:", userEmail)
      }
    } catch (emailErr) {
      console.error("❌ User email send failed:", emailErr)
    }

    // 📧 Email notification to TEAM
    try {
      const teamEmails = ['founder@plexis.in', 'genzgalaxytech@gmail.com']
      const { subject, text, html } = teamNotificationTemplate(ticket as any, req.user!)
      
      for (const teamEmail of teamEmails) {
        await sendMail(teamEmail, subject, text, html)
        console.log("✅ Team notification sent to:", teamEmail)
      }
    } catch (emailErr) {
      console.error("❌ Team email send failed:", emailErr)
    }

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticket,
    })
  } catch (error) {
    console.error("🔥 Ticket creation error:", error)
    return res.status(500).json({
      success: false,
      message: "Ticket creation failed",
    })
  }
}

export const getMyTickets = async (req: AuthRequest, res: Response) => {
  try {

    const tickets = await Ticket.find({ refNo: req.user!.refNo })
      .sort({ createdAt: -1 })
      .select("-attachments") // 🚀 CRITICAL FIX


    return res.json({
      success: true,
      tickets,
    })
  } catch (err) {
    console.error("❌ Failed to load tickets:", err)
    return res.status(500).json({
      success: false,
      message: "Failed to load tickets",
    })
  }
}
