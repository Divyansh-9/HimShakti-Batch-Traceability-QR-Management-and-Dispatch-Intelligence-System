const { onRequest } = require('firebase-functions/v2/https');
const app = require('./server');

// Export Express app as a Firebase Cloud Function (v2 HTTPS)
exports.api = onRequest({ cors: true, region: 'us-central1' }, app);
