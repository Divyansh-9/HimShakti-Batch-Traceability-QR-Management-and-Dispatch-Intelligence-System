/**
 * notificationService.js
 *
 * Central service for creating notifications and broadcasting them
 * to the correct Socket.io role rooms in real-time.
 *
 * Usage (in any controller):
 *   const { notify } = require('../services/notificationService');
 *   notify(req.app, {
 *     recipientRole: 'factory-manager',
 *     type: 'batch_created',
 *     title: 'New batch registered',
 *     message: `Batch ${batchCode} — ${productName} packed by ${farmerName}`,
 *     refId: batchCode,
 *     refType: 'batch',
 *     triggeredBy: { userId: req.user._id, name: req.user.name, role: req.user.role },
 *   });
 *
 * This is fire-and-forget (async, no await). If it fails, it logs but
 * never crashes the request.
 */
const Notification = require('../models/Notification.model');

/**
 * Create a notification document and push it to the relevant Socket.io room.
 *
 * @param {object} app   - Express app (for app.get('io'))
 * @param {object} opts  - Notification fields
 */
async function notify(app, opts) {
  try {
    const doc = await Notification.create({
      recipientRole:    opts.recipientRole,
      recipientUserId:  opts.recipientUserId  || null,
      type:             opts.type,
      title:            opts.title,
      message:          opts.message,
      refId:            opts.refId            || null,
      refType:          opts.refType          || null,
      triggeredBy:      opts.triggeredBy      || { name: 'System' },
    });

    // Broadcast to the role room so all connected clients with that role
    // receive it instantly without polling.
    const io = app?.get('io');
    if (io) {
      io.to(`role:${opts.recipientRole}`).emit('notification:new', {
        _id:           doc._id,
        type:          doc.type,
        title:         doc.title,
        message:       doc.message,
        refId:         doc.refId,
        refType:       doc.refType,
        triggeredBy:   doc.triggeredBy,
        read:          false,
        createdAt:     doc.createdAt,
      });
    }
  } catch (err) {
    // Never let notification errors break the main request flow
    console.error('[notificationService] Failed to create notification:', err.message);
  }
}

/**
 * Convenience: notify multiple roles at once.
 *
 * @param {object} app
 * @param {string[]} roles
 * @param {object} opts  - same as notify() but without recipientRole
 */
async function notifyRoles(app, roles, opts) {
  await Promise.all(roles.map(role => notify(app, { ...opts, recipientRole: role })));
}

module.exports = { notify, notifyRoles };
