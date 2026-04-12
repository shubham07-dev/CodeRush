// ─────────────────────────────────────────────────────────
// Attendance Controller
// ─────────────────────────────────────────────────────────

import { AttendanceSession, AttendanceRecord } from './attendance.model.js';
import { CampusLocation } from '../location/location.model.js';
import { isWithinCampus } from '../../utils/geo.js';

// ── POST /sessions – Teacher creates a new attendance session
export async function createSession(req, res, next) {
  try {
    const { subject, date, department, expiresInMinutes } = req.body;

    const expiresAt = expiresInMinutes
      ? new Date(Date.now() + expiresInMinutes * 60 * 1000)
      : undefined;

    const session = await AttendanceSession.create({
      subject,
      date: date || new Date(),
      department: department || req.user.department,
      createdBy: req.user._id,
      ...(expiresAt && { expiresAt })
    });

    return res.status(201).json({
      success: true,
      message: 'Attendance session created',
      data: { session }
    });
  } catch (error) {
    return next(error);
  }
}

// ── POST /mark – Student marks attendance via QR code + geolocation
export async function markAttendance(req, res, next) {
  try {
    const { qrCode, latitude, longitude } = req.body;

    // 1. Find the session by QR code
    const session = await AttendanceSession.findOne({ qrCode: qrCode.toUpperCase() });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Invalid attendance code – session not found'
      });
    }

    // 2. Check if session has expired
    if (new Date() > session.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'This attendance session has expired'
      });
    }

    // 3. Check if already marked
    const existing = await AttendanceRecord.findOne({
      session: session._id,
      student: req.user._id
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already marked for this session'
      });
    }

    // 4. Geolocation check – student must be within radius of ANY active campus
    const campusLocations = await CampusLocation.find({ isActive: true });

    if (campusLocations.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'No campus locations configured – contact admin'
      });
    }

    let nearestDistance = Infinity;
    let withinAnyCampus = false;

    for (const campus of campusLocations) {
      const result = isWithinCampus(
        latitude,
        longitude,
        campus.latitude,
        campus.longitude,
        campus.radiusMetres
      );

      if (result.distance < nearestDistance) {
        nearestDistance = result.distance;
      }

      if (result.within) {
        withinAnyCampus = true;
        break;
      }
    }

    if (!withinAnyCampus) {
      return res.status(403).json({
        success: false,
        message: `You are ${nearestDistance}m away from campus. Must be within 100m to mark attendance.`,
        data: { distance: nearestDistance }
      });
    }

    // 5. Determine if late (more than 10 minutes after session creation)
    const minutesSinceCreation = (Date.now() - session.createdAt.getTime()) / 60000;
    const status = minutesSinceCreation > 10 ? 'late' : 'present';

    // 6. Create attendance record
    const record = await AttendanceRecord.create({
      session: session._id,
      student: req.user._id,
      status,
      method: 'geolocation',
      coordinates: { latitude, longitude },
      distanceFromCampus: nearestDistance
    });

    return res.status(201).json({
      success: true,
      message: status === 'late'
        ? 'Attendance marked as LATE (arrived after 10 min window)'
        : 'Attendance marked successfully!',
      data: { record, distance: nearestDistance, status }
    });
  } catch (error) {
    return next(error);
  }
}

// ── PUT /manual – Teacher manually marks / edits a student's attendance
export async function manualMark(req, res, next) {
  try {
    const { sessionId, studentId, status } = req.body;

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const record = await AttendanceRecord.findOneAndUpdate(
      { session: sessionId, student: studentId },
      { status, method: 'manual', markedAt: new Date() },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: `Attendance manually set to ${status}`,
      data: { record }
    });
  } catch (error) {
    return next(error);
  }
}

// ── GET /sessions/:id/records – Teacher views all records for a session
export async function getSessionRecords(req, res, next) {
  try {
    const session = await AttendanceSession.findById(req.params.id)
      .populate('createdBy', 'fullName email');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const records = await AttendanceRecord.find({ session: session._id })
      .populate('student', 'fullName email department')
      .sort({ markedAt: 1 });

    return res.status(200).json({
      success: true,
      data: { session, records, totalPresent: records.filter(r => r.status !== 'absent').length }
    });
  } catch (error) {
    return next(error);
  }
}

// ── GET /sessions – List all sessions (teacher sees own, admin sees all)
export async function getSessions(req, res, next) {
  try {
    const filter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
    const sessions = await AttendanceSession.find(filter)
      .populate('createdBy', 'fullName')
      .sort({ date: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      data: { sessions }
    });
  } catch (error) {
    return next(error);
  }
}

// ── GET /my – Student views own attendance with auto-calculated percentage
export async function getMyAttendance(req, res, next) {
  try {
    const records = await AttendanceRecord.find({ student: req.user._id })
      .populate({
        path: 'session',
        select: 'subject date department createdBy',
        populate: { path: 'createdBy', select: 'fullName' }
      })
      .sort({ markedAt: -1 });

    // Calculate attendance percentage
    const total = records.length;
    const present = records.filter((r) => r.status === 'present' || r.status === 'late').length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';

    return res.status(200).json({
      success: true,
      data: {
        records,
        stats: {
          total,
          present,
          absent: total - present,
          percentage: parseFloat(percentage)
        }
      }
    });
  } catch (error) {
    return next(error);
  }
}
