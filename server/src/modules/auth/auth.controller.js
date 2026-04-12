// ─────────────────────────────────────────────────────────
// Auth Controller – register, login, me, refresh, logout
// ─────────────────────────────────────────────────────────

import { User } from './auth.model.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from '../../utils/authToken.js';

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/register
// Creates a new user and returns access + refresh tokens
// ─────────────────────────────────────────────────────────
export async function register(req, res, next) {
  try {
    const { fullName, email, password, role, department, avatarSeed } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user (password is hashed via pre-save hook)
    const user = await User.create({
      fullName,
      email,
      password,
      role: role || 'student',
      department,
      avatarSeed
    });

    // Generate tokens
    const userData = user.toSafeObject();
    const accessToken = signAccessToken(userData);
    const refreshToken = signRefreshToken(userData);

    // Persist refresh token on user document
    user.refreshToken = refreshToken;
    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: userData,
        token: accessToken,
        refreshToken
      }
    });
  } catch (error) {
    return next(error);
  }
}

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/login
// Authenticates user and returns access + refresh tokens
// ─────────────────────────────────────────────────────────
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Find user with password field included
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password +refreshToken'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const passwordMatch = await user.comparePassword(password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();

    // Generate fresh tokens
    const userData = user.toSafeObject();
    const accessToken = signAccessToken(userData);
    const refreshToken = signRefreshToken(userData);

    // Persist new refresh token (rotation)
    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token: accessToken,
        refreshToken
      }
    });
  } catch (error) {
    return next(error);
  }
}

// ─────────────────────────────────────────────────────────
// GET /api/v1/auth/me
// Returns the currently authenticated user's profile
// ─────────────────────────────────────────────────────────
export async function me(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user.toSafeObject()
    }
  });
}

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/refresh
// Accepts a refresh token and returns a new access token
// (+ a rotated refresh token for extra security)
// ─────────────────────────────────────────────────────────
export async function refreshAccessToken(req, res, next) {
  try {
    const { refreshToken } = req.body;

    // Verify the refresh token cryptographically
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Find user and compare with stored refresh token
    const user = await User.findById(decoded.sub).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      // Possible token reuse attack – invalidate all sessions
      if (user) {
        user.refreshToken = null;
        await user.save();
      }

      return res.status(401).json({
        success: false,
        message: 'Refresh token is invalid or has been revoked'
      });
    }

    // Issue new token pair (rotation)
    const userData = user.toSafeObject();
    const newAccessToken = signAccessToken(userData);
    const newRefreshToken = signRefreshToken(userData);

    user.refreshToken = newRefreshToken;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    return next(error);
  }
}

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/logout
// Invalidates the refresh token (server-side sign-out)
// ─────────────────────────────────────────────────────────
export async function logout(req, res, next) {
  try {
    // req.user is set by protect middleware
    const user = await User.findById(req.user._id).select('+refreshToken');

    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    return next(error);
  }
}
