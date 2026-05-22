import { AuthRequest } from '../../core/middleware';
import { Response } from 'express';
import { PricingItemModel } from '../../models/pricingItemModel';

export const getPricingItems = async (req: AuthRequest, res: Response) => {
    try {
        const items = await PricingItemModel.find({ userId: req.user?._id }).sort({ createdAt: 1 });
        return res.status(200).json({ success: true, data: items });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server Error', error });
    }
};

export const createPricingItem = async (req: AuthRequest, res: Response) => {
    try {
        console.log('--- Create Pricing Item ---');
        console.log('Body:', JSON.stringify(req.body, null, 2));
        console.log('User:', req.user?._id);

        const { name, type, amount, packageItems, quantity } = req.body;
        if (!name || !type || amount === undefined) {
            return res.status(400).json({ success: false, message: 'name, type, and amount are required' });
        }

        const finalAmount = isNaN(Number(amount)) ? 0 : Number(amount);

        const item = new PricingItemModel({ userId: req.user?._id, name, type, amount: finalAmount, packageItems, quantity });
        await item.save();
        return res.status(201).json({ success: true, data: item });
    } catch (error: any) {
        console.error('Error creating pricing item:', error);
        return res.status(500).json({ success: false, message: 'Server Error', error: error.message || error });
    }
};

export const updatePricingItem = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, type, amount, packageItems, quantity } = req.body;
        const item = await PricingItemModel.findOneAndUpdate(
            { _id: id, userId: req.user?._id },
            {
                ...(name !== undefined && { name }),
                ...(type !== undefined && { type }),
                ...(amount !== undefined && { amount }),
                ...(packageItems !== undefined && { packageItems }),
                ...(quantity !== undefined && { quantity })
            },
            { new: true }
        );
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        return res.status(200).json({ success: true, data: item });
    } catch (error: any) {
        console.error('Error updating pricing item:', error);
        return res.status(500).json({ success: false, message: 'Server Error', error: error.message || error });
    }
};

export const deletePricingItem = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const item = await PricingItemModel.findOneAndDelete({ _id: id, userId: req.user?._id });
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        return res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server Error', error });
    }
};
