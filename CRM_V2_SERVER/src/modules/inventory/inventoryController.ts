import { AuthRequest } from "../../core/middleware";
import { Response } from "express";
import { InventoryModel } from "../../models/inventoryModel";
import { Project } from "../../models/projectModel";

export const getInventoryItems = async (req: AuthRequest, res: Response) => {
  try {
    const items = await InventoryModel.find({
      addedBy: req.user?._id,
    }).populate({
      path: "assignedTo.projectId",
      select: "projectTitle projectStatus",
    });

    // DISABLED: Auto-cleanup of completed project assignments
    // Equipment should stay assigned until explicitly released via the "Release" button
    // This allows users to see which projects have equipment that needs to be returned

    // Process each inventory item to clean up completed project assignments
    // for (const item of items) {
    //   let quantityToRelease = 0;
    //   const assignmentsToRemove: number[] = [];

    //   // Find assignments for completed projects
    //   item.assignedTo.forEach((assignment, index) => {
    //     const project = assignment.projectId as any;

    //     // If project is completed, mark for removal
    //     if (project && ((project.projectStatus === 'Completed' || project.projectStatus === 'Cancelled') || project.endDate < new Date())) {
    //       quantityToRelease += assignment.quantity;
    //       assignmentsToRemove.push(index);
    //     }
    //   });

    //   // If we found completed projects, update the inventory item
    //   if (assignmentsToRemove.length > 0) {
    //     // Remove assignments in reverse order to maintain correct indices
    //     for (let i = assignmentsToRemove.length - 1; i >= 0; i--) {
    //       item.assignedTo.splice(assignmentsToRemove[i], 1);
    //     }

    //     // Release the quantity back to available
    //     item.available += quantityToRelease;

    //     // Save the updated item
    //     await item.save();
    //   }
    // }

    // Re-fetch to get clean data with proper population
    const finalItems = await InventoryModel.find({
      addedBy: req.user?._id,
    }).populate({
      path: "assignedTo.projectId",
      select: "projectTitle projectStatus",
    });

    return res.status(200).json({
      success: true,
      data: finalItems,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error,
    });
  }
};

export const addInventoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const { itemName, itemDescription, quantity, category, customCategory, notes } = req.body;
    const newItem = new InventoryModel({
      itemName,
      itemDescription,
      quantity,
      available: quantity,
      addedBy: req.user?._id,
      category,
      customCategory,
      notes: notes || ""
    });
    await newItem.save();
    return res.status(201).json({ success: true, data: newItem });
  }
  catch (error) {
    return res.status(500).json({ success: false, message: "Server Error", error });
  }
};

export const assignInventoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const { itemId, projectId, quantity, assignedFrom, assignedTo } = req.body;
    const item = await InventoryModel.findById(itemId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    // Check if already assigned to this project
    const existingAssignmentIndex = item.assignedTo.findIndex(
      (a) => a.projectId && a.projectId.toString() === projectId,
    );

    if (existingAssignmentIndex > -1) {
      // Update existing assignment
      const oldQuantity = item.assignedTo[existingAssignmentIndex].quantity;

      if (quantity <= 0) {
        // Remove assignment
        item.assignedTo.splice(existingAssignmentIndex, 1);
        item.available += oldQuantity;
      } else {
        // Update existing assignment with new quantity
        const diff = quantity - oldQuantity;

        if (item.available < diff) {
          return res
            .status(400)
            .json({ success: false, message: "Insufficient available quantity" });
        }

        item.assignedTo[existingAssignmentIndex].quantity = quantity;
        item.assignedTo[existingAssignmentIndex].assignedFrom =
          assignedFrom || item.assignedTo[existingAssignmentIndex].assignedFrom;
        item.assignedTo[existingAssignmentIndex].assignedTo =
          assignedTo || item.assignedTo[existingAssignmentIndex].assignedTo;
        item.available -= diff;
      }
    } else if (quantity > 0) {
      // New assignment
      if (item.available < quantity) {
        return res
          .status(400)
          .json({ success: false, message: "Insufficient available quantity" });
      }
      item.assignedTo.push({ projectId, quantity, assignedFrom, assignedTo });
      item.available -= quantity;
    }

    // Safety check: ensure available doesn't exceed total quantity
    if (item.available > item.quantity) {
      item.available = item.quantity;
    }
    if (item.available < 0) {
      item.available = 0;
    }

    await item.save();
    return res.status(200).json({ success: true, data: item });
  }
  catch (error) {
    console.error("❌ [assignInventoryItem] Error:", error);
    return res.status(500).json({ success: false, message: "Server Error", error });
  }
};

export const batchAssignInventory = async (req: AuthRequest, res: Response) => {
  try {
    const { assignments, projectId, assignedFrom, assignedTo } = req.body;
    
    if (!Array.isArray(assignments)) {
      return res.status(400).json({ success: false, message: "Assignments must be an array" });
    }

    const results = [];
    const errors = [];

    // Process each assignment
    for (const assignment of assignments) {
      const { itemId, quantity } = assignment;
      const item = await InventoryModel.findById(itemId);
      
      if (!item) {
        errors.push({ itemId, message: "Item not found" });
        continue;
      }

      const existingAssignmentIndex = item.assignedTo.findIndex(
        (a) => a.projectId && a.projectId.toString() === projectId,
      );

      if (existingAssignmentIndex > -1) {
        // Update existing assignment
        const oldQuantity = item.assignedTo[existingAssignmentIndex].quantity;

        if (quantity <= 0) {
          // Remove assignment
          item.assignedTo.splice(existingAssignmentIndex, 1);
          item.available += oldQuantity;
        } else {
          // Update existing assignment with new quantity
          const diff = quantity - oldQuantity;

          if (item.available < diff) {
            errors.push({ itemId, message: `Insufficient available quantity for ${item.itemName}` });
            continue;
          }

          item.assignedTo[existingAssignmentIndex].quantity = quantity;
          item.assignedTo[existingAssignmentIndex].assignedFrom =
            assignedFrom || item.assignedTo[existingAssignmentIndex].assignedFrom;
          item.assignedTo[existingAssignmentIndex].assignedTo =
            assignedTo || item.assignedTo[existingAssignmentIndex].assignedTo;
          item.available -= diff;
        }
      } else if (quantity > 0) {
        // New assignment
        if (item.available < quantity) {
          errors.push({ itemId, message: `Insufficient available quantity for ${item.itemName}` });
          continue;
        }
        item.assignedTo.push({ projectId, quantity, assignedFrom, assignedTo });
        item.available -= quantity;
      }

      // Safety checks
      if (item.available > item.quantity) item.available = item.quantity;
      if (item.available < 0) item.available = 0;

      await item.save();
      results.push(item);
    }

    return res.status(200).json({ 
      success: true, 
      data: results, 
      errors: errors.length > 0 ? errors : undefined 
    });
  } catch (error: any) {
    console.error("❌ [batchAssignInventory] Error:", error);
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

export const updateInventoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const { itemId, itemName, itemDescription, quantity, notes, category } =
      req.body;
    const item = await InventoryModel.findById(itemId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }
    item.itemName = itemName !== undefined ? itemName : item.itemName;
    item.itemDescription = itemDescription !== undefined ? itemDescription : item.itemDescription;
    item.category = category !== undefined ? category : item.category;
    if (quantity !== undefined) {
      const diff = quantity - item.quantity;
      item.quantity = quantity;
      item.available += diff;

      // Safety checks
      if (item.available > item.quantity) {
        item.available = item.quantity;
      }
      if (item.available < 0) {
        item.available = 0;
      }
    }
    item.notes = notes !== undefined ? notes : item.notes;
    await item.save();
    return res.status(200).json({ success: true, data: item });

  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server Error", error });
  }
};

export const deleteInventoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;

    const item = await InventoryModel.findByIdAndDelete(itemId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server Error", error });
  }
};
