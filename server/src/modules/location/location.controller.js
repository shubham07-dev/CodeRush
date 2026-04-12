// ─────────────────────────────────────────────────────────
// Location Controller – CRUD for campus locations
// ─────────────────────────────────────────────────────────

import { CampusLocation } from './location.model.js';

// ── Seed default location if no locations exist ─────────
export async function seedDefaultLocation() {
  const count = await CampusLocation.countDocuments();
  if (count === 0) {
    await CampusLocation.create({
      name: 'BBD NIIT – Old Block',
      address: 'Babu Banarasi Das Northern India Institute of Technology, Lucknow',
      latitude: 26.886316,
      longitude: 81.059048,
      radiusMetres: 100,
      isActive: true
    });
    console.log('Seeded default campus location: BBD NIIT Lucknow');
  }
}

// ── POST /api/v1/locations – Admin adds a new campus location
export async function addLocation(req, res, next) {
  try {
    const { name, address, latitude, longitude, radiusMetres } = req.body;

    const location = await CampusLocation.create({
      name,
      address,
      latitude,
      longitude,
      radiusMetres: radiusMetres || 100,
      addedBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: 'Campus location added',
      data: { location }
    });
  } catch (error) {
    return next(error);
  }
}

// ── GET /api/v1/locations – List all campus locations
export async function getLocations(req, res, next) {
  try {
    const locations = await CampusLocation.find()
      .sort({ createdAt: -1 })
      .populate('addedBy', 'fullName');

    return res.status(200).json({
      success: true,
      data: { locations }
    });
  } catch (error) {
    return next(error);
  }
}

// ── PUT /api/v1/locations/:id – Admin updates a location
export async function updateLocation(req, res, next) {
  try {
    const location = await CampusLocation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Location updated',
      data: { location }
    });
  } catch (error) {
    return next(error);
  }
}

// ── DELETE /api/v1/locations/:id – Admin removes a location
export async function deleteLocation(req, res, next) {
  try {
    const location = await CampusLocation.findByIdAndDelete(req.params.id);

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Location deleted'
    });
  } catch (error) {
    return next(error);
  }
}
