// ─────────────────────────────────────────────────────────
// Server Entry Point – connect DB, seed data, start Express
// ─────────────────────────────────────────────────────────

import http from 'http';
import app from './app.js';
import env from './config/env.js';
import { connectMongo } from './db/mongo.js';
import { seedDefaultLocation } from './modules/location/location.controller.js';
import { initSocket } from './utils/socket.js';
import cron from 'node-cron';
import { Assignment } from './modules/assignment/assignment.model.js';
import { Notification } from './modules/notification/notification.model.js';

async function startServer() {
  try {
    await connectMongo();

    // Seed default campus location if none exist
    await seedDefaultLocation();

    // Create HTTP Server for express and socket.io
    const httpServer = http.createServer(app);
    
    // Initialize WebSockets
    const io = initSocket(httpServer, { origin: env.clientOrigin });

    // Schedule automated reminders checking every hour
    cron.schedule('0 * * * *', async () => {
      console.log('Cron: Checking for upcoming assignments...');
      // Assignments due within the next 24 hours
      const now = new Date();
      const next24 = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const dueSoon = await Assignment.find({
        dueDate: { $gt: now, $lte: next24 }
      });
      // Further notification logic can dynamically fetch student matches here if needed
    });

    httpServer.listen(env.port, () => {
      console.log(`Smart Campus OS API listening on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
