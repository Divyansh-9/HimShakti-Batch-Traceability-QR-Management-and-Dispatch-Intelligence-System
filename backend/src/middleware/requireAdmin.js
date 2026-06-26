/**
 * requireAdmin middleware
 * Must be used AFTER protect() — assumes req.user is already populated.
 * Rejects any user whose role is not 'admin'.
 */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error:   'Admin access required',
    });
  }
  next();
}

module.exports = requireAdmin;
