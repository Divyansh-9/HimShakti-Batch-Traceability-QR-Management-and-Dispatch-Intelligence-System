const { UAParser } = require('ua-parser-js');
const LoginEvent   = require('../models/LoginEvent.model');

/**
 * Appends a login event for the user.
 * Best-effort only — any failure is caught and logged, but will never block
 * the authentication flow. IP is read for geo-lookup and immediately discarded.
 */
async function appendLoginEvent(user, req, method = 'password') {
  try {
    // 1. Parse UA — synchronous, no I/O
    const ua      = new UAParser(req.headers['user-agent'] || '').getResult();
    const browser = ua.browser.name || 'Unknown';
    const os      = ua.os.name      || 'Unknown';
    const device  = ua.device.type  || 'desktop';

    // 2. Extract IP from headers (Vercel sets x-forwarded-for)
    const rawIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
      .split(',')[0].trim();

    // 3. Geo lookup — 3s timeout, best-effort only
    let city = 'Unknown', country = 'Unknown', countryCode = '';
    
    // Skip lookup for local IPv6/IPv4 addresses
    if (rawIp && rawIp !== '::1' && rawIp !== '127.0.0.1') {
      try {
        const ac  = new AbortController();
        const tid = setTimeout(() => ac.abort(), 3000);
        
        const geo = await fetch(
          `http://ip-api.com/json/${rawIp}?fields=city,country,countryCode`,
          { signal: ac.signal }
        );
        
        clearTimeout(tid);
        
        if (geo.ok) {
          const j  = await geo.json();
          city        = j.city        || city;
          country     = j.country     || country;
          countryCode = j.countryCode || countryCode;
        }
      } catch {
        // timeout / rate-limit — silently use defaults
      }
    }
    // rawIp is not stored past this point

    // 4. Write — if this fails the login is already complete
    await LoginEvent.create({
      userId: user._id, 
      username: user.username,
      city, 
      country, 
      countryCode,
      browser, 
      os, 
      device, 
      method,
    });

  } catch (err) {
    // Logging failure must never propagate into auth flow
    console.error('[LoginHistory] Failed to record event (non-fatal):', err.message);
  }
}

module.exports = { appendLoginEvent };
