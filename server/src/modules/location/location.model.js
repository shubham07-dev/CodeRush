// ─────────────────────────────────────────────────────────
// CampusLocation Model – admin-managed college locations
// ─────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const campusLocationSchema = new mongoose.Schema(
  {
    // Name of the campus / college
    name: {
      type: String,
      required: true,
      trim: true
    },

    // Address for display
    address: {
      type: String,
      trim: true,
      default: ''
    },

    // GPS coordinates
    latitude: {
      type: Number,
      required: true
    },

    longitude: {
      type: Number,
      required: true
    },

    // Attendance radius in metres
    radiusMetres: {
      type: Number,
      default: 100
    },

    // Whether this location is active for attendance
    isActive: {
      type: Boolean,
      default: true
    },

    // Who added this location
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

export const CampusLocation = mongoose.model('CampusLocation', campusLocationSchema);
