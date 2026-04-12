// ─────────────────────────────────────────────────────────
// Server Entry Point – connect DB, seed data, start Express
// ─────────────────────────────────────────────────────────

import app from './app.js';
import env from './config/env.js';
import { connectMongo } from './db/mongo.js';
import { seedDefaultLocation } from './modules/location/location.controller.js';

async function startServer() {
  try {
    await connectMongo();

    // Seed default campus location if none exist
    await seedDefaultLocation();

    app.listen(env.port, () => {
      console.log(`Smart Campus OS API listening on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
