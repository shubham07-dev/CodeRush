import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import env from './config/env.js';
import healthRoutes from './modules/health/health.routes.js';
import campusRoutes from './modules/campus/campus.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientOrigin
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Smart Campus OS API is running' });
});

app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/campus', campusRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
