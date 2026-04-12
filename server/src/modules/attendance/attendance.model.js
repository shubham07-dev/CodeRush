// ─────────────────────────────────────────────────────────
// Attendance Models – Session + Record schemas
// ─────────────────────────────────────────────────────────

import mongoose from 'mongoose';
import crypto from 'crypto';

// ── Attendance Session – created by teacher ──────────────
const attendanceSessionSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true
    },

    date: {
      type: Date,
      required: true,
      default: Date.now
    },

    // Teacher who created this session
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Random token code for QR / entry-based attendance
    qrCode: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(4).toString('hex').toUpperCase()
    },

    // Session expiry (default: 30 minutes from creation)
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 60 * 1000)
    },

    // Department scope (optional)
    department: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
);

// ── Attendance Record – one per student per session ─────
const attendanceRecordSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: true
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      default: 'present'
    },

    // How the attendance was marked
    method: {
      type: String,
      enum: ['qr', 'geolocation', 'manual'],
      default: 'manual'
    },

    // Student's coordinates at time of marking (if geo-based)
    coordinates: {
      latitude: Number,
      longitude: Number
    },

    // Distance from campus when marked (metres)
    distanceFromCampus: {
      type: Number
    },

    markedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Prevent duplicate records: one student per session
attendanceRecordSchema.index({ session: 1, student: 1 }, { unique: true });

export const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);
export const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);
