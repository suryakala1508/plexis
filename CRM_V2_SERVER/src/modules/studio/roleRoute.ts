import { verifyInvite,setInvitePassword } from './studioController';
import express from 'express';

const roleRouter = express.Router();

roleRouter.get("/verify", verifyInvite);
roleRouter.post("/set-password", setInvitePassword);

export default roleRouter;