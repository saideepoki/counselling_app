import express from 'express';
import { sendPasscodeEmail } from '../controllers/emailController.js';


const router = express.Router();

router.post('/send-email', sendPasscodeEmail);

export default router;