import {Response} from "express";
import { AuthRequest } from "../../core/middleware";
import { Event } from "../../models/eventModel";


export const createEvent = async(req:AuthRequest, res:Response) => {
    const {eventTitle, eventDescription, eventDate, location,Project} = req.body;
    if(!eventTitle || !eventDescription || !eventDate || !Project){
        return res.status(400).json({success:false, message:"All required fields must be provided"});
    }
    try{
        const newEvent= new Event({
            eventTitle,
            eventDescription,
            eventDate,
            location,
            Project,
            createdBy: req.user?._id
        });
        await newEvent.save();
        return res.status(201).json({success:true, message:"Event created successfully", event:newEvent});

    }catch(error){
        return res.status(500).json({success:false, message:"Server Error"});
    }
}

export const getAllEvents =async (req:AuthRequest, res:Response) => {
    const {Project}=req.query;
    try{
        const allEvents= await Event.find({Project:Project});
        return res.status(200).json({success:true, events:allEvents});
    }catch(err){
        return res.status(500).json({success:false, message:"Server Error"});
    }
}

export const getEventById = (req:AuthRequest, res:Response) => {
    try{
        const eventId= req.params.id;
        const event= Event.findById(eventId);
        if(!event){
            return res.status(404).json({success:false, message:"Event not found"});
        }
        return res.status(200).json({success:true, event:event});

    }catch(err){
        return res.status(500).json({success:false, message:"Server Error"});
    }
}

export const updateEvent = (req:AuthRequest, res:Response) => {
    try{
        const eventId= req.params.id;
        const updatedData= req.body;
        const event= Event.findByIdAndUpdate(eventId, updatedData, {new:true});
        if(!event){
            return res.status(404).json({success:false, message:"Event not found"});
        }
        return res.status(200).json({success:true, event:event});

    }catch(err){
        return res.status(500).json({success:false, message:"Server Error"});
    }
}

export const deleteEvent = (req:AuthRequest, res:Response) => {
    try{
        const eventId= req.params.id;
        const event= Event.findByIdAndDelete(eventId);
        if(!event){
            return res.status(404).json({success:false, message:"Event not found"});
        }
        return res.status(200).json({success:true, message:"Event deleted successfully"});

    }catch(err){
        return res.status(500).json({success:false, message:"Server Error"});
    }
}