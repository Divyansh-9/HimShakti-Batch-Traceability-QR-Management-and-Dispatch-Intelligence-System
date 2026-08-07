/**
 * backfillTraceTokens.js
 * ──────────────────────────────────────────────────────────────────
 * One-time (idempotent) migration for batches created before the
 * public trace flow moved off sequential batch codes.
 *
 * Does two things per batch:
 *   1. Derives and stores `traceToken` — deterministic HMAC, so re-runs
 *      always produce the same value and the script is safe to repeat.
 *   2. Regenerates `qrCodeDataUrl` / `qrAbsoluteUrl` so newly printed
 *      labels encode the token URL.
 *
 * Labels already printed keep working: `/trace/:batchCode` still
 * resolves, at reduced detail. See qr.controller.js.
 *
 * Also backfills `qualityCheck` from the most recent surviving
 * Inspection. Inspections have a 30-day TTL, so anything older than
 * that is already gone and cannot be recovered — those batches simply
 * show no quality verdict, which is accurate.
 *
 * Usage (from backend/, with MONGODB_URI in .env):
 *   node src/scripts/backfillTraceTokens.js
 *   node src/scripts/backfillTraceTokens.js --dry-run
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Batch      = require('../models/Batch.model');
const Inspection = require('../models/Inspection.model');
const { deriveTraceToken } = require('../utils/traceToken');
const { generateBatchQR }  = require('../services/qrGenerator');

const DRY_RUN = process.argv.includes('--dry-run');

async function run() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set.');
  if (!process.env.PUBLIC_BASE_URL) {
    throw new Error('PUBLIC_BASE_URL is not set — regenerated QR codes would encode "undefined/trace/...".');
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log(`[backfill] connected${DRY_RUN ? ' (DRY RUN — no writes)' : ''}`);

  // Deleted batches are included on purpose: they are soft-deleted, can
  // be restored, and their QR labels may still be on physical stock.
  const batches = await Batch.find({}, { batchCode: 1, traceToken: 1, qualityCheck: 1 }).lean();
  console.log(`[backfill] ${batches.length} batches found`);

  let tokensWritten = 0;
  let qualityWritten = 0;
  let skipped = 0;

  for (const b of batches) {
    const expected = deriveTraceToken(b.batchCode);
    const needsToken = b.traceToken !== expected;

    // Only look for an inspection if the batch has no snapshot yet —
    // never overwrite a verdict already recorded.
    let qualityUpdate = null;
    if (!b.qualityCheck || !b.qualityCheck.status) {
      const latest = await Inspection.findOne({ batchId: b._id })
        .sort({ createdAt: -1 })
        .lean();
      if (latest) {
        qualityUpdate = {
          status:        latest.status,
          rating:        latest.rating,
          inspectedAt:   latest.createdAt,
          inspectorName: latest.inspectedBy?.name || null,
        };
      }
    }

    if (!needsToken && !qualityUpdate) { skipped++; continue; }

    const $set = {};
    if (needsToken) {
      const { dataUrl, absoluteUrl } = await generateBatchQR(b.batchCode);
      $set.traceToken    = expected;
      $set.qrCodeDataUrl = dataUrl;
      $set.qrAbsoluteUrl = absoluteUrl;
      tokensWritten++;
    }
    if (qualityUpdate) {
      $set.qualityCheck = qualityUpdate;
      qualityWritten++;
    }

    if (!DRY_RUN) await Batch.updateOne({ _id: b._id }, { $set });
    console.log(`  ${b.batchCode}  ${needsToken ? 'token+qr ' : ''}${qualityUpdate ? 'quality' : ''}`);
  }

  console.log(`\n[backfill] tokens/QR: ${tokensWritten}  quality: ${qualityWritten}  unchanged: ${skipped}`);
  if (DRY_RUN) console.log('[backfill] dry run — nothing written.');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[backfill] FAILED:', err.message);
  process.exit(1);
});
