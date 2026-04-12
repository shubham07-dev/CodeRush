import { Notification } from './notification.model.js';

// Get all notifications for the logged-in user
export async function getNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    return next(error);
  }
}

// Mark a specific notification as read
export async function markAsRead(req, res, next) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    return next(error);
  }
}

// Mark all as read
export async function markAllAsRead(req, res, next) {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    return next(error);
  }
}
