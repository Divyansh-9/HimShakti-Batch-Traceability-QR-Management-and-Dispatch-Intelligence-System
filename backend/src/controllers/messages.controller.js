/**
 * ──────────────────────────────────────────────────────────────────────
 *  Messages — record threads and role channels
 * ──────────────────────────────────────────────────────────────────────
 *
 *  Two conversations, one collection, different rules:
 *
 *   Record threads   Comments on a batch or an inspection. Any signed-in user
 *                    can read and post; nothing is ever hard-deleted; edits
 *                    keep the previous text. This is audit evidence.
 *
 *   Role channels    One channel per role. You get your own; Super Admin gets
 *                    all of them, matching the existing rule in server.js
 *                    where super-admin also joins the role:admin socket room.
 *                    Messages age out after 90 days.
 *
 *  Everything here is REST-first. The backend runs serverless, where there is
 *  no persistent socket layer, so sockets are only used to nudge clients that
 *  are already connected — every view works from its REST fetch alone.
 * ──────────────────────────────────────────────────────────────────────
 */
const mongoose = require('mongoose');
const Message    = require('../models/Message.model');
const Batch      = require('../models/Batch.model');
const Inspection = require('../models/Inspection.model');
const User       = require('../models/User.model');

const ALL_CHANNELS = ['admin', 'manager', 'factory-manager', 'quality-inspector', 'dispatch-coordinator'];
const MAX_PAGE = 100;

function isSuperAdmin(u) {
  if (!u) return false;
  return !!u.isSuperAdmin
    || u.email?.toLowerCase() === 'divyanshuniyal185@gmail.com'
    || u.username?.toLowerCase() === 'divyansh';
}

/**
 * Channels a user may read and post in.
 *
 * Super Admin is Tier 0 and sees every channel — the same "absolute" rule the
 * socket layer already applies. Everyone else gets exactly their own, so a
 * manager cannot read what the quality inspectors say about them.
 */
function channelsFor(user) {
  if (isSuperAdmin(user)) return [...ALL_CHANNELS];
  return ALL_CHANNELS.includes(user?.role) ? [user.role] : [];
}

function canUseChannel(user, role) {
  return channelsFor(user).includes(role);
}

/** Shape sent to clients. Deleted messages keep their slot but lose the body. */
function present(m, user) {
  const mine = String(m.authorId) === String(user?._id);
  if (m.isDeleted) {
    return {
      _id: m._id, isDeleted: true, deletedAt: m.deletedAt,
      authorName: m.authorName, authorRole: m.authorRole,
      createdAt: m.createdAt, mine,
    };
  }
  return {
    _id: m._id,
    body: m.body,
    authorId: m.authorId,
    authorName: m.authorName,
    authorRole: m.authorRole,
    editedAt: m.editedAt,
    editCount: m.editHistory?.length || 0,
    createdAt: m.createdAt,
    expiresAt: m.expiresAt,
    mine,
    isDeleted: false,
  };
}

/** Confirm the referenced record exists before letting a thread hang off it. */
async function refExists(refType, refId) {
  if (!mongoose.Types.ObjectId.isValid(refId)) return false;
  if (refType === 'batch')      return !!(await Batch.exists({ _id: refId }));
  if (refType === 'inspection') return !!(await Inspection.exists({ _id: refId }));
  return false;
}

// ──────────────────────────────────────────────────────────────────────
//  Record threads
// ──────────────────────────────────────────────────────────────────────

/**
 * @desc    Comments on one batch or inspection, oldest first
 * @route   GET /api/messages/record/:refType/:refId
 * @access  Private
 */
async function getThread(req, res, next) {
  try {
    const { refType, refId } = req.params;
    if (!['batch', 'inspection'].includes(refType)) {
      return res.status(400).json({ success: false, error: 'refType must be batch or inspection' });
    }
    if (!mongoose.Types.ObjectId.isValid(refId)) {
      return res.status(400).json({ success: false, error: 'Invalid record id' });
    }

    const messages = await Message.find({ scope: 'record', refType, refId })
      .sort({ createdAt: 1 })
      .limit(MAX_PAGE);

    res.json({
      success: true,
      count: messages.length,
      data: messages.map(m => present(m, req.user)),
    });
  } catch (err) { next(err); }
}

/**
 * @desc    Add a comment to a batch or inspection
 * @route   POST /api/messages/record/:refType/:refId
 * @access  Private
 */
async function postToThread(req, res, next) {
  try {
    const { refType, refId } = req.params;
    const body = String(req.body?.body || '').trim();

    if (!['batch', 'inspection'].includes(refType)) {
      return res.status(400).json({ success: false, error: 'refType must be batch or inspection' });
    }
    if (!body)             return res.status(400).json({ success: false, error: 'Message body is required' });
    if (body.length > 2000) return res.status(400).json({ success: false, error: 'Message cannot exceed 2000 characters' });
    if (!(await refExists(refType, refId))) {
      return res.status(404).json({ success: false, error: `No ${refType} with that id` });
    }

    const msg = await Message.create({
      scope: 'record',
      refType,
      refId,
      body,
      authorId:   req.user._id,
      authorName: req.user.name || req.user.username || 'unknown',
      authorRole: req.user.role || 'unknown',
      expiresAt:  Message.expiresAtFor('record'),   // null — permanent
    });

    const io = req.app.get('io');
    // Broadcast: record comments are readable by every signed-in user, so
    // there is no room to scope this to. Clients filter on refId.
    if (io) io.emit('message:new', { scope: 'record', refType, refId: String(refId) });

    res.status(201).json({ success: true, data: present(msg, req.user) });
  } catch (err) { next(err); }
}

// ──────────────────────────────────────────────────────────────────────
//  Role channels
// ──────────────────────────────────────────────────────────────────────

/**
 * @desc    Which channels the caller may open
 * @route   GET /api/messages/channels
 * @access  Private
 */
async function listChannels(req, res, next) {
  try {
    const allowed = channelsFor(req.user);

    // Head counts per channel. Numbers only — no names, no contact details —
    // so this stays safe for every role, unlike the manager-gated directory.
    const grouped = await User.aggregate([
      { $match: { isDeleted: { $ne: true }, isActive: true, role: { $in: allowed } } },
      { $group: { _id: '$role', n: { $sum: 1 } } },
    ]);
    const memberCounts = Object.fromEntries(grouped.map(g => [g._id, g.n]));

    // Rail preview: last message per allowed channel. Only channels this user
    // may already open are included, so the snippet exposes nothing they could
    // not read by clicking through. Bodies are truncated server-side rather
    // than shipping 2 KB per channel to render 80 characters.
    const latest = await Message.aggregate([
      { $match: { scope: 'channel', channelRole: { $in: allowed }, isDeleted: { $ne: true } } },
      { $sort: { createdAt: -1 } },
      { $group: {
        _id:   '$channelRole',
        at:    { $first: '$createdAt' },
        body:  { $first: '$body' },
        who:   { $first: '$authorName' },
        n:     { $sum: 1 },
      } },
      { $project: {
        at: 1, who: 1, n: 1,
        body: { $substrCP: ['$body', 0, 90] },
      } },
    ]);
    const activity = Object.fromEntries(latest.map(l => [l._id, {
      lastAt:     l.at,
      lastBody:   l.body,
      lastAuthor: l.who,
      total:      l.n,
    }]));

    res.json({
      success: true,
      data: {
        channels: allowed,
        isSuperAdmin: isSuperAdmin(req.user),
        retentionDays: Message.CHANNEL_RETENTION_DAYS,
        memberCounts,
        activity,
      },
    });
  } catch (err) { next(err); }
}

/**
 * @desc    Messages in a role channel, newest first
 * @route   GET /api/messages/channel/:role
 * @access  Private (own channel; Super Admin any)
 */
async function getChannel(req, res, next) {
  try {
    const { role } = req.params;
    if (!ALL_CHANNELS.includes(role)) {
      return res.status(400).json({ success: false, error: 'Unknown channel' });
    }
    if (!canUseChannel(req.user, role)) {
      return res.status(403).json({ success: false, error: 'You do not have access to that channel' });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 50, MAX_PAGE);
    const messages = await Message.find({ scope: 'channel', channelRole: role })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      count: messages.length,
      // Reverse so the client renders oldest-to-newest without re-sorting.
      data: messages.reverse().map(m => present(m, req.user)),
    });
  } catch (err) { next(err); }
}

/**
 * @desc    Post to a role channel
 * @route   POST /api/messages/channel/:role
 * @access  Private (own channel; Super Admin any)
 */
async function postToChannel(req, res, next) {
  try {
    const { role } = req.params;
    const body = String(req.body?.body || '').trim();

    if (!ALL_CHANNELS.includes(role)) {
      return res.status(400).json({ success: false, error: 'Unknown channel' });
    }
    if (!canUseChannel(req.user, role)) {
      return res.status(403).json({ success: false, error: 'You do not have access to that channel' });
    }
    if (!body)              return res.status(400).json({ success: false, error: 'Message body is required' });
    if (body.length > 2000) return res.status(400).json({ success: false, error: 'Message cannot exceed 2000 characters' });

    const msg = await Message.create({
      scope: 'channel',
      channelRole: role,
      body,
      authorId:   req.user._id,
      authorName: req.user.name || req.user.username || 'unknown',
      authorRole: req.user.role || 'unknown',
      expiresAt:  Message.expiresAtFor('channel'),   // 90 days
    });

    const io = req.app.get('io');
    // Role rooms already exist (server.js auth:join). Super Admin is joined to
    // role:admin there, so posting to the admin channel reaches them too.
    if (io) io.to(`role:${role}`).emit('message:new', { scope: 'channel', channelRole: role });

    res.status(201).json({ success: true, data: present(msg, req.user) });
  } catch (err) { next(err); }
}

// ──────────────────────────────────────────────────────────────────────
//  Editing and removal
// ──────────────────────────────────────────────────────────────────────

/**
 * @desc    Edit your own message
 * @route   PATCH /api/messages/:id
 * @access  Private (author only)
 *
 * The previous text is pushed to editHistory before the body changes, so an
 * edit cannot be used to quietly rewrite what was said on a record.
 */
async function editMessage(req, res, next) {
  try {
    const body = String(req.body?.body || '').trim();
    if (!body)              return res.status(400).json({ success: false, error: 'Message body is required' });
    if (body.length > 2000) return res.status(400).json({ success: false, error: 'Message cannot exceed 2000 characters' });

    const msg = await Message.findById(req.params.id);
    if (!msg)            return res.status(404).json({ success: false, error: 'Message not found' });
    if (msg.isDeleted)   return res.status(409).json({ success: false, error: 'Message has been deleted' });
    // Authorship only. Not even an admin may reword somebody else's comment —
    // that would make the audit trail worthless.
    if (String(msg.authorId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, error: 'You can only edit your own messages' });
    }

    msg.editHistory.push({ body: msg.body, editedAt: new Date() });
    msg.body     = body;
    msg.editedAt = new Date();
    await msg.save();

    res.json({ success: true, data: present(msg, req.user) });
  } catch (err) { next(err); }
}

/**
 * @desc    Remove a message
 * @route   DELETE /api/messages/:id
 * @access  Private (author, or admin/super-admin for moderation)
 *
 * Soft delete. The row stays so a thread cannot be made to look like the
 * conversation never happened; the body is withheld from the response.
 */
async function deleteMessage(req, res, next) {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg)          return res.status(404).json({ success: false, error: 'Message not found' });
    if (msg.isDeleted) return res.json({ success: true, data: present(msg, req.user) });

    const mine    = String(msg.authorId) === String(req.user._id);
    const canMod  = isSuperAdmin(req.user) || req.user.role === 'admin';
    if (!mine && !canMod) {
      return res.status(403).json({ success: false, error: 'You can only delete your own messages' });
    }

    msg.isDeleted = true;
    msg.deletedAt = new Date();
    msg.deletedBy = req.user.name || req.user.username || 'unknown';
    await msg.save();

    res.json({ success: true, data: present(msg, req.user) });
  } catch (err) { next(err); }
}

module.exports = {
  getThread, postToThread,
  listChannels, getChannel, postToChannel,
  editMessage, deleteMessage,
  channelsFor, ALL_CHANNELS,
};
