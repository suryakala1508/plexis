import express from 'express';
import { downloadSingleImage,batchDownloadImages } from './downloadController';

const downloadRouter = express.Router();

downloadRouter.post("/single",downloadSingleImage);
downloadRouter.post("/batch",batchDownloadImages);

export default downloadRouter


