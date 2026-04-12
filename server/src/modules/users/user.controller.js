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
