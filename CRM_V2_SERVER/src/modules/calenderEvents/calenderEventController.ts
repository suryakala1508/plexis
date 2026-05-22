import { Response } from "express";
import { AuthRequest } from "../../core/middleware";
import { CalenderEventModel } from "../../models/calenderEventModel";
import { Event } from "../../models/eventModel";
import { FollowUpModel } from "../../models/followUpModel";
import { Project } from "../../models/projectModel";

export const createCalenderEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { title, start, end, color, description, location, attendees, eventType } =
      req.body;
    const newEvent = new CalenderEventModel({
      title,
      start,
      end,
      color,
      description,
      location,
      eventType,
      attendees,
      createdBy: req.user!._id,
    });
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

export const getCalenderEvents = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const calenderEvents = await CalenderEventModel.find({
      createdBy: req.user._id,
    }).catch((err) => {
      console.error("Error fetching calenderEvents:", err);
      return [];
    });
    const events = await Project.find({ createdBy: req.user._id }).catch(
      (err) => {
        console.error("Error fetching events:", err);
        return [];
      }
    );
    const followUps = await FollowUpModel.find({ userId: req.user._id })
      .populate("leadId", "name")
      .populate("clientId", "clientName")
      .catch((err) => {
        console.error("Error fetching followUps:", err);
        return [];
      });
    res.status(200).json({ success: true, calenderEvents, events, followUps });
  } catch (error) {
    console.error("Error in getCalenderEvents:", error);
    res.status(500).json({ message: "Server Error", error });
  }
};

export const updateCalenderEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, start, end, color, description, location, attendees, eventType } =
      req.body;

    const updatedEvent = await CalenderEventModel.findOneAndUpdate(
      { _id: id, createdBy: req.user!._id },
      { title, start, end, color, description, location, attendees, eventType },
      { new: true }
    );
    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

export const deleteCalenderEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deletedEvent = await CalenderEventModel.findOneAndDelete({
      _id: id,
      createdBy: req.user!._id,
    });
    if (!deletedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};
