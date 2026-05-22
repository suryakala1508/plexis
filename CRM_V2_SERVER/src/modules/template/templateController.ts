import { AuthRequest } from '../../core/middleware';
import { Response } from 'express';
import { TemplateModel } from '../../models/templateModel';
import { User } from '../../models/userModel';
import { StudioModel } from '../../models/studioModel';

const normalizeTemplateCustomization = (customization: any = {}) => {
    const rawIntro = customization?.introPageBackground || {};
    const nestedIntro = rawIntro?.type && typeof rawIntro.type === 'object' ? rawIntro.type : {};

    return {
        ...customization,
        coverDescription: customization?.coverDescription || '',
        introPageBackground: {
            ...rawIntro,
            ...nestedIntro,
            type: typeof rawIntro?.type === 'string' ? rawIntro.type : (nestedIntro?.type || 'solid'),
        },
        portfolioPageBackgrounds:
            customization?.portfolioPageBackgrounds && typeof customization.portfolioPageBackgrounds === 'object'
                ? customization.portfolioPageBackgrounds
                : {},
    };
};

const normalizePortfolioImages = (images: unknown, variantMap: any = {}) => {
    const source = Array.isArray(images) ? images : [];
    const map = variantMap && typeof variantMap === 'object' ? variantMap : {};
    return Array.from(new Set(source.map((url) => map[url] || url).filter(Boolean)));
};

const applyStudioPortfolioVariantsToTemplate = (template: any, variantMap: any = {}) => {
    if (!template?.customization) return template;
    return {
        ...template,
        customization: {
            ...template.customization,
            portfolioImages: normalizePortfolioImages(template.customization.portfolioImages, variantMap),
        },
    };
};

const getStudioPortfolioVariants = async (userId?: string) => {
    if (!userId) return {};
    const user = await User.findById(userId).select('refNo').lean() as any;
    if (!user?.refNo) return {};
    const studio = await StudioModel.findOne({ refNo: user.refNo }).select('quotationBackgroundPortfolioVariants').lean() as any;
    return studio?.quotationBackgroundPortfolioVariants || {};
};

export const getTemplates = async (req: AuthRequest, res: Response) => {
    try {
        const variantMap = await getStudioPortfolioVariants(req.user?._id?.toString?.());
        const templates = await TemplateModel.find({ userId: req.user?._id, isDeleted: false }).sort({ isDefault: -1, createdAt: -1 }).lean();
        return res.status(200).json({
            success: true,
            data: templates.map((template: any) => applyStudioPortfolioVariantsToTemplate({
                ...template,
                customization: normalizeTemplateCustomization(template.customization || {})
            }, variantMap))
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server Error', error });
    }
};

export const createTemplate = async (req: AuthRequest, res: Response) => {
    try {
        console.log("📝 createTemplate hit with body:", req.body);
        const { name, background, quotationBackground, welcomeMessage, fields, serviceColumns, customization, notes, termsAndConditions, deliverables, complimentary } = req.body;
        const normalizedCustomization = customization !== undefined ? normalizeTemplateCustomization(customization) : undefined;
        if (!name) return res.status(400).json({ success: false, message: 'Template name is required' });
        const template = new TemplateModel({
            userId: req.user?._id,
            name,
            ...(background !== undefined && { background }),
            ...(quotationBackground !== undefined && { quotationBackground }),
            ...(welcomeMessage !== undefined && { welcomeMessage }),
            ...(fields !== undefined && { fields }),
            ...(serviceColumns !== undefined && { serviceColumns }),
            ...(normalizedCustomization !== undefined && { customization: normalizedCustomization }),
            ...(notes !== undefined && { notes }),
            ...(termsAndConditions !== undefined && { termsAndConditions }),
            ...(deliverables !== undefined && { deliverables }),
            ...(complimentary !== undefined && { complimentary }),
        });
        await template.save();
        const variantMap = await getStudioPortfolioVariants(req.user?._id?.toString?.());
        return res.status(201).json({ success: true, data: applyStudioPortfolioVariantsToTemplate(template.toObject(), variantMap) });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server Error', error });
    }
};

export const updateTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, background, quotationBackground, welcomeMessage, fields, serviceColumns, customization, notes, termsAndConditions, deliverables, complimentary, isDefault } = req.body;
        const normalizedCustomization = customization !== undefined ? normalizeTemplateCustomization(customization) : undefined;

        const template = await TemplateModel.findOne({ _id: id, userId: req.user?._id, isDeleted: false });
        if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

        if (name !== undefined) template.name = name;
        if (welcomeMessage !== undefined) template.welcomeMessage = welcomeMessage;
        if (notes !== undefined) template.notes = notes;
        if (termsAndConditions !== undefined) template.termsAndConditions = termsAndConditions;
        if (deliverables !== undefined) template.deliverables = deliverables;
        if (complimentary !== undefined) template.complimentary = complimentary;

        if (background !== undefined) {
            template.background = background;
            template.markModified('background');
        }
        if (quotationBackground !== undefined) {
            template.quotationBackground = quotationBackground;
            template.markModified('quotationBackground');
        }
        if (fields !== undefined) {
            template.fields = fields;
            template.markModified('fields');
        }
        if (serviceColumns !== undefined) {
            template.serviceColumns = serviceColumns;
            template.markModified('serviceColumns');
        }
        if (normalizedCustomization !== undefined) {
            template.customization = normalizedCustomization;
            template.markModified('customization');
        }

        if (typeof isDefault === 'boolean') {
            if (isDefault) {
                await TemplateModel.updateMany(
                    { userId: req.user?._id, isDeleted: false, _id: { $ne: template._id }, isDefault: true },
                    { $set: { isDefault: false } }
                );
            }

            template.isDefault = isDefault;
        }

        await template.save();
        const variantMap = await getStudioPortfolioVariants(req.user?._id?.toString?.());
        return res.status(200).json({ success: true, data: applyStudioPortfolioVariantsToTemplate(template.toObject(), variantMap) });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server Error', error });
    }
};

export const duplicateTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const original = await TemplateModel.findOne({ _id: id, userId: req.user?._id, isDeleted: false });
        if (!original) return res.status(404).json({ success: false, message: 'Template not found' });

        const copy = new TemplateModel({
            userId: req.user?._id,
            name: `${original.name} (Copy)`,
            background: original.background,
            quotationBackground: original.quotationBackground,
            welcomeMessage: original.welcomeMessage,
            fields: original.fields,
            serviceColumns: original.serviceColumns,
            customization: original.customization,
            notes: original.notes,
            termsAndConditions: original.termsAndConditions,
            deliverables: original.deliverables,
            complimentary: original.complimentary,
            isDefault: false,
        });
        await copy.save();
        const variantMap = await getStudioPortfolioVariants(req.user?._id?.toString?.());
        return res.status(201).json({ success: true, data: applyStudioPortfolioVariantsToTemplate(copy.toObject(), variantMap) });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server Error', error });
    }
};

export const setDefaultTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;

        console.log('[template:setDefault] request received', {
            templateId: id,
            userId: userId?.toString?.(),
            collection: TemplateModel.collection.name,
        });

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const template = await TemplateModel.findOne({ _id: id, userId, isDeleted: false });
        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }

        await TemplateModel.updateMany(
            { userId, isDeleted: false, _id: { $ne: template._id }, isDefault: true },
            { $set: { isDefault: false } }
        );

        console.log('[template:setDefault] cleared previous defaults for user', userId?.toString?.());

        template.isDefault = true;
        await template.save();

        console.log('[template:setDefault] saved default template', {
            templateId: template._id?.toString?.(),
            isDefault: template.isDefault,
            collection: TemplateModel.collection.name,
        });

        const variantMap = await getStudioPortfolioVariants(req.user?._id?.toString?.());
        return res.status(200).json({
            success: true,
            data: applyStudioPortfolioVariantsToTemplate({
                ...template.toObject(),
                customization: normalizeTemplateCustomization(template.customization || {})
            }, variantMap)
        });
    } catch (error) {
            console.error('[template:setDefault] failed', error);
        return res.status(500).json({ success: false, message: 'Server Error', error });
    }
};

export const deleteTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const template = await TemplateModel.findOneAndUpdate(
            { _id: id, userId: req.user?._id, isDeleted: false },
            { isDeleted: true },
            { new: true }
        );
        if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
        return res.status(200).json({ success: true, message: 'Template deleted' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server Error', error });
    }
};
