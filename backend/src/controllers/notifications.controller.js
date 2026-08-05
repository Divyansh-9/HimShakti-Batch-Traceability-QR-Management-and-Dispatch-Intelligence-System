/**
 * notifications.controller.js
 *
 * REST endpoints for the notification bell panel:
 *  GET  /api/notifications          — fetch last 30 for the current user's role
 *  GET  /api/notifications/unread   — count of unread
 *  PATCH /api/notifications/:id/read — mark one as read
 *  PATCH /api/notifications/read-all — mark all as read
 *  DELETE /api/notifications/clear  — delete all read notifications
 */
const Notification = require('../models/Notification.model');

/** Fetch last 30 notifications relevant to the authenticated user's role. */
async function getNotifications(req, res, next) {
  try {
    const { role, _id: userId } = req.user;

    // Match docs targeted at this role OR targeted specifically at this user
    const query = {
      $or: [
        { recipientRole: role },
        { recipientUserId: userId },
      ],
    };
    // Super admin sees admin-tier notifications too
    if (role === 'super-admin') {
      query.$or.push({ recipientRole: 'admin' });
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.json({ success: true, data: notifications });
  } catch (err) { next(err); }
}

/** Fast unread count — used for the badge number. */
async function getUnreadCount(req, res, next) {
  try {
    const { role, _id: userId } = req.user;

    const query = {
      read: false,
      $or: [
        { recipientRole: role },
        { recipientUserId: userId },
      ],
    };
    if (role === 'super-admin') {
      query.$or.push({ recipientRole: 'admin' });
    }

    const count = await Notification.countDocuments(query);
    res.json({ success: true, count });
  } catch (err) { next(err); }
}

/** Mark a single notification as read. */
async function markOneRead(req, res, next) {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (err) { next(err); }
}

/** Mark all notifications for this user's role as read. */
async function markAllRead(req, res, next) {
  try {
    const { role, _id: userId } = req.user;
    const query = {
      read: false,
      $or: [
        { recipientRole: role },
        { recipientUserId: userId },
      ],
    };
    if (role === 'super-admin') query.$or.push({ recipientRole: 'admin' });

    await Notification.updateMany(query, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) { next(err); }
}

/** Delete all read notifications for this user's role. */
async function clearRead(req, res, next) {
  try {
    const { role, _id: userId } = req.user;
    const query = {
      read: true,
      $or: [
        { recipientRole: role },
        { recipientUserId: userId },
      ],
    };
    if (role === 'super-admin') query.$or.push({ recipientRole: 'admin' });

    const result = await Notification.deleteMany(query);
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) { next(err); }
}

module.exports = { getNotifications, getUnreadCount, markOneRead, markAllRead, clearRead };
