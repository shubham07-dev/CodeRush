import { User } from '../auth/auth.model.js';

// Get list of users based on permissions
export async function getUsers(req, res, next) {
  try {
    let filter = {};
    if (req.user.role === 'admin') {
      // Admin sees teachers and students
      filter.role = { $in: ['teacher', 'student'] };
    } else if (req.user.role === 'teacher') {
      // Teacher only sees students
      filter.role = 'student';
    } else {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const users = await User.find(filter)
      .select('-password -__v')
      .populate('campus', 'name code')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: { users } });
  } catch (error) {
    return next(error);
  }
}

// Update a user's details
export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    // Authorization check
    if (req.user.role === 'teacher' && targetUser.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Teachers can only edit students' });
    }

    // Do not allow password update here
    delete updateData.password;
    delete updateData.email; // Usually emails belong to identity, restricted
    delete updateData.role; // Role shifting restricted

    const updated = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select('-password');
    return res.status(200).json({ success: true, message: 'User updated', data: { user: updated } });
  } catch (error) {
    return next(error);
  }
}

// Delete a user
export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    // Authorization check
    if (req.user.role === 'teacher' && targetUser.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Teachers can only delete students' });
    }

    await User.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    return next(error);
  }
}

// Upload/Update Profile Picture for Logged in User
export async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
    const profilePicture = req.file.path; // Cloudinary URL
    const user = await User.findByIdAndUpdate(req.user._id, { profilePicture }, { new: true });
    return res.status(200).json({ success: true, message: 'Profile picture updated', data: { user: user.toSafeObject() } });
  } catch (error) {
    return next(error);
  }
}

// Remove Profile Picture for Logged in User
export async function removeAvatar(req, res, next) {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { $unset: { profilePicture: 1 } }, { new: true });
    return res.status(200).json({ success: true, message: 'Profile picture removed', data: { user: user.toSafeObject() } });
  } catch (error) {
    return next(error);
  }
}

// Bulk Promote Students
export async function bulkPromote(req, res, next) {
  try {
    // Only teachers/admins
    if (req.user.role === 'student') return res.status(403).json({ success: false, message: 'Unauthorized' });

    const { targetDepartment, targetYear, targetSection, newYear, newSection } = req.body;
    if (!targetDepartment || !targetYear) {
      return res.status(400).json({ success: false, message: 'Target Department and Target Year are required.' });
    }

    const filter = { role: 'student', department: targetDepartment, enrollmentYear: targetYear };
    if (targetSection) filter.section = targetSection;

    const updatePlayload = {};
    if (newYear) updatePlayload.enrollmentYear = newYear;
    if (newSection) updatePlayload.section = newSection;
    if (Object.keys(updatePlayload).length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    const result = await User.updateMany(filter, { $set: updatePlayload });
    return res.status(200).json({ success: true, message: `Successfully updated ${result.modifiedCount} students.` });
  } catch (error) {
    return next(error);
  }
}
