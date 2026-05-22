import express from 'express';
import { getTemplates, createTemplate, updateTemplate, duplicateTemplate, deleteTemplate, setDefaultTemplate } from './templateController';

const templateRouter = express.Router();

templateRouter.get('/', (req, res, next) => { console.log("🔍 GET /api/templates hit"); next(); }, getTemplates);
templateRouter.post('/', (req, res, next) => { console.log("🔍 POST /api/templates hit"); next(); }, createTemplate);
templateRouter.put('/:id', updateTemplate);
templateRouter.put('/:id/default', setDefaultTemplate);
templateRouter.post('/:id/duplicate', duplicateTemplate);
templateRouter.delete('/:id', deleteTemplate);

export default templateRouter;
