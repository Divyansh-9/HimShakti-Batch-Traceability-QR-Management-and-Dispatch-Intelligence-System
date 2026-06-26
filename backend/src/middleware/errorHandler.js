function errorHandler(err, req, res, next) {
  console.error('[Intern2 Error]:', err.message);

  if (err.code === 11000) {
    return res.status(409).json({ success: false, error: 'Duplicate — batch code already exists' });
  }
  if (err.message?.startsWith('DB_CONTRACT')) {
    return res.status(503).json({ success: false, error: err.message });
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, error: messages.join('; ') });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
}

module.exports = errorHandler;
