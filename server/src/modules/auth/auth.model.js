// ─────────────────────────────────────────────────────────
// User Model – Mongoose schema for authentication
// ─────────────────────────────────────────────────────────
// Fields: fullName, email, password (hashed), role,
//         department, avatarSeed, refreshToken, lastLoginAt
// ─────────────────────────────────────────────────────────

import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { USER_ROLES } from './auth.constants.js';

const userSchema = new mongoose.Schema(
  {
    // Display name
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 70
    },

    // Unique login identifier
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    // Hashed password – excluded from queries by default (select: false)
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },

    // Role-Based Access Control
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'student'
    },

    // Optional metadata
    department: {
      type: String,
      trim: true,
      default: ''
    },

    avatarSeed: {
      type: String,
      default: 'campus'
    },

    // Persisted refresh token (hashed) – for refresh-token rotation
    refreshToken: {
      type: String,
      select: false
    },

    lastLoginAt: {
      type: Date
    }
  },
  { timestamps: true } // adds createdAt, updatedAt automatically
);

// ── Pre-save hook: hash password before persisting ──────
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  // Salt rounds = 12 for strong bcrypt hash
  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

// ── Instance method: compare candidate password with stored hash ─
userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance method: return a safe user object (no password / refreshToken) ─
userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    fullName: this.fullName,
    email: this.email,
    role: this.role,
    department: this.department,
    avatarSeed: this.avatarSeed,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt
  };
};

export const User = mongoose.model('User', userSchema);
