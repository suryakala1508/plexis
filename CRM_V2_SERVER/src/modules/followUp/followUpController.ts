import { AuthRequest } from "../../core/middleware";
import { Response } from "express";
import { FollowUpModel } from "../../models/followUpModel";

export const addFollowUp = async (req: AuthRequest, res: Response) => {
    try {
        const { leadId: paramLeadId, clientId: paramClientId } = req.params;
        const { date, notes, type, reason, clientId: bodyClientId, leadId: bodyLeadId } = req.body;

        const leadId = paramLeadId || bodyLeadId;
        const clientId = paramClientId || bodyClientId;

        const newFollowUp = new FollowUpModel({
            leadId: leadId || undefined,
            clientId: clientId || undefined,
            userId: req.user?._id,
            date,
            notes: notes || '',
            type: type || 'call',
            reason: reason || type || 'Follow-up'
        });
        await newFollowUp.save();
        return res.status(201).json({ success: true, data: newFollowUp });
    } catch (err) {
        console.error('Error adding follow-up:', err);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getFollowUps = async (req: AuthRequest, res: Response) => {
    try {
        const { leadId, clientId } = req.params;
        const query: any = {};
        if (leadId) query.leadId = leadId;
        if (clientId) query.clientId = clientId;

        if (!leadId && !clientId) {
            return res.status(400).json({ success: false, message: "Lead ID or Client ID is required" });
        }

        const followUps = await FollowUpModel.find(query).sort({ date: -1, createdAt: -1 });
        return res.status(200).json({ success: true, data: followUps });
    } catch (err) {
        console.error('Error fetching follow-ups:', err);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const updateFollowUp = async (req: AuthRequest, res: Response) => {
    try {
        const followUpId = req.params.followUpId;
        const { date, notes, type, reason } = req.body;
        const updateData: any = {};
        if (date) updateData.date = date;
        if (notes !== undefined) updateData.notes = notes;
        if (type) updateData.type = type;
        if (reason) updateData.reason = reason;

        const followUp = await FollowUpModel.findByIdAndUpdate(
            followUpId,
            updateData,
            { new: true }
        );
        if (!followUp) {
            return res.status(404).json({ success: false, message: "Follow-up not found" });
        }
        return res.status(200).json({ success: true, data: followUp });
    } catch (err) {
        console.error('Error updating follow-up:', err);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const deleteFollowUp = async (req: AuthRequest, res: Response) => {
    try {
        const followUpId = req.params.followUpId;
        const followUp = await FollowUpModel.findByIdAndDelete(followUpId);
        if (!followUp) {
            return res.status(404).json({ success: false, message: "Follow-up not found" });
        }
        return res.status(200).json({ success: true, message: "Follow-up deleted successfully" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const markFollowUpCompleted = async (req: AuthRequest, res: Response) => {
    try {
        const followUpId = req.params.followUpId;
        const status = req.body.status;
        const updateData: any = {
            status: (status === true || status === 'completed') ? 'completed' : 'pending'
        };
        if (status === true || status === 'completed') {
            updateData.completedAt = new Date();
        }
        const followUp = await FollowUpModel.findByIdAndUpdate(
            followUpId,
            updateData,
            { new: true }
        );
        if (!followUp) {
            return res.status(404).json({ success: false, message: "Follow-up not found" });
        }
        return res.status(200).json({ success: true, data: followUp });
    } catch (err) {
        console.error('Error marking follow-up:', err);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

