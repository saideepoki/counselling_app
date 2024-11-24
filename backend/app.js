import express from 'express';
import emailRoutes from './routes/emailRoutes.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/email', emailRoutes);

export default app;
