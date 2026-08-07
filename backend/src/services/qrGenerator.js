const QRCode = require('qrcode');
const { deriveTraceToken } = require('../utils/traceToken');

/**
 * Render the QR PNG for a batch.
 *
 * The encoded URL points at the opaque trace token, not the batch code:
 * `/trace/t/<token>`. The batch code stays the human-facing label, but
 * keeping it out of the public URL stops anyone walking the sequence
 * (`HS-2026-06-001`, `-002`, …) to harvest the production record from
 * an endpoint that is unauthenticated by design.
 *
 * @param   {string} batchCode
 * @returns {{ dataUrl: string, absoluteUrl: string, traceToken: string }}
 */
async function generateBatchQR(batchCode) {
  const traceToken  = deriveTraceToken(batchCode);
  const absoluteUrl = `${process.env.PUBLIC_BASE_URL}/trace/t/${traceToken}`;

  const dataUrl = await QRCode.toDataURL(absoluteUrl, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 300,
    margin: 2,
    color: {
      dark: '#1a4731',
      light: '#ffffff'
    }
  });

  return { dataUrl, absoluteUrl, traceToken };
}

module.exports = { generateBatchQR };
