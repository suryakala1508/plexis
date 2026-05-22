import express from 'express';
import { getPricingItems, createPricingItem, updatePricingItem, deletePricingItem } from './pricingController';

const pricingRouter = express.Router();

pricingRouter.get('/', getPricingItems);
pricingRouter.post('/', createPricingItem);
pricingRouter.put('/:id', updatePricingItem);
pricingRouter.delete('/:id', deletePricingItem);

export default pricingRouter;
