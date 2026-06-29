/**
 * seedRichData.js — Idempotent rich dataset seed for HimShakti dashboard.
 *
 * USAGE:
 *   node src/scripts/seedRichData.js          # Append / upsert (safe, default)
 *   node src/scripts/seedRichData.js --clear   # Clear batches + scans first, then seed
 *
 * Design principles:
 * - --clear is OPT-IN, not the default — safe for shared/dev environments
 * - Each batch is upserted by batchCode — idempotent, can run multiple times
 * - Diverse data: 6 farmers, 4 villages, 5 product types, all 4 status states
 * - Includes scan events so the "Scans" column has real data
 */

require('dotenv').config();
const mongoose   = require('mongoose');
const Batch      = require('../models/Batch.model');
const ScanEvent  = require('../models/ScanEvent.model');

const args       = process.argv.slice(2);
const CLEAR_FIRST = args.includes('--clear');

// ── Helpers ──────────────────────────────────────────────────────────
function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function daysAgo(days) {
  return daysFromNow(-days);
}

// ── Products reference (mirrored from Intern 1's collection) ──────────
// We don't fetch live — we use known SKUs and names for seed stability.
const PRODUCTS = {
  WBJC: { productName: 'Wild Berry Juice Concentrate', sku: 'WBJC', shelfDays: 180, riskLevel: 'LOW' },
  KMGC: { productName: 'Kumaon Royal Multigrain Crackers', sku: 'KMGC', shelfDays: 90, riskLevel: 'MEDIUM' },
  RHSLT: { productName: 'Himalayan Rock Salt (Sendha Namak)', sku: 'RHSLT', shelfDays: 730, riskLevel: 'LOW' },
  ABHJAM: { productName: 'Apricot & Berry Himalayan Jam', sku: 'ABHJAM', shelfDays: 365, riskLevel: 'MEDIUM' },
  WBDRP:  { productName: 'Wild Berry Dried Pulp (Tray-Dried)', sku: 'WBDRP', shelfDays: 270, riskLevel: 'LOW' },
};

// ── Farmers & Locations ───────────────────────────────────────────────
const FARMERS = [
  { farmerName: 'Ramesh Singh',     village: 'Tehri' },
  { farmerName: 'Sunita Devi',      village: 'Pauri' },
  { farmerName: 'Bhavya Gogia',     village: 'Near Rishikesh' },
  { farmerName: 'Harish Negi',      village: 'Chamoli' },
  { farmerName: 'Kamla Rawat',      village: 'Tehri' },
  { farmerName: 'Dinesh Bisht',     village: 'Pauri' },
];

function makeBatch(code, productKey, farmerIdx, packDaysAgo, extraDaysUntilExpiry, status, buyerInfo = null) {
  const p = PRODUCTS[productKey];
  const packDate   = daysAgo(packDaysAgo);
  const expiryDate = daysFromNow(extraDaysUntilExpiry);
  const farmer     = FARMERS[farmerIdx];

  return {
    batchCode:        code,
    productName:      p.productName,
    sku:              p.sku,
    productId:        new mongoose.Types.ObjectId(), // placeholder — real app uses product lookup
    sourceLotCode:    `LOT-${code}`,
    farmerName:       farmer.farmerName,
    village:          farmer.village,
    quantityProduced: [100, 150, 200, 250, 300, 75][farmerIdx % 6],
    unit:             ['Kg', 'Units', 'Liters', 'Kg', 'Kg', 'Units'][farmerIdx % 6] === 'Liters' ? 'Kg' : 'Kg',
    yieldPercent:     [88, 76, 91, 65, 82, 93][farmerIdx % 6],
    packDate,
    expiryDate,
    dataSource:       'predicted',
    shelfLifeSource:  'predicted',
    status,
    priorityScore:    status === 'URGENT' ? 340 : status === 'WARNING' ? 280 : status === 'DISPATCHED' ? 0 : 200,
    qrCodeDataUrl:    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    qrAbsoluteUrl:    `${process.env.PUBLIC_BASE_URL || 'http://localhost:5001'}/trace/${code}`,
    traceabilityNote: `Batch ${code} — packed from ${farmer.village} harvest. Best before ${expiryDate.toDateString()}.`,
    createdBy:        'manager',
    ...(status === 'DISPATCHED' && buyerInfo ? {
      buyerName:    buyerInfo.buyer,
      dispatchDate: daysAgo(buyerInfo.daysAgo),
    } : {}),
  };
}

// ── Rich batch dataset ────────────────────────────────────────────────
// 20 batches: 4 statuses, 5 products, 6 farmers, 4 villages
const RICH_BATCHES = [
  // --- READY batches (healthy, in stock) ---
  makeBatch('HS-2026-06-002', 'WBJC',   0, 5,  172, 'READY'),
  makeBatch('HS-2026-06-003', 'WBJC',   0, 6,  171, 'READY'),
  makeBatch('HS-2026-06-004', 'WBJC',   4, 8,  169, 'READY'),
  makeBatch('HS-2026-06-005', 'WBJC',   4, 9,  168, 'READY'),
  makeBatch('HS-2026-06-010', 'RHSLT',  2, 15, 715, 'READY'),
  makeBatch('HS-2026-06-011', 'RHSLT',  5, 20, 710, 'READY'),
  makeBatch('HS-2026-06-014', 'WBDRP',  3, 10, 260, 'READY'),
  makeBatch('HS-2026-06-015', 'WBDRP',  1, 12, 258, 'READY'),

  // --- WARNING batches (21–30 days to expiry) ---
  makeBatch('HS-2026-06-016', 'ABHJAM', 2, 340, 25, 'WARNING'),
  makeBatch('HS-2026-06-017', 'ABHJAM', 5, 345, 22, 'WARNING'),
  makeBatch('HS-2026-06-018', 'KMGC',   1, 65,  28, 'WARNING'),
  makeBatch('HS-2026-06-019', 'KMGC',   3, 67,  23, 'WARNING'),

  // --- URGENT batches (≤7 days to expiry) ---
  makeBatch('HS-2026-06-020', 'ABHJAM', 0, 360, 5,  'URGENT'),
  makeBatch('HS-2026-06-021', 'KMGC',   1, 85,  3,  'URGENT'),
  makeBatch('HS-2026-06-022', 'WBJC',   3, 175, 6,  'URGENT'),

  // --- DISPATCHED batches (fulfilled orders) ---
  makeBatch('HS-2026-06-001', 'WBJC',   0, 30, 147, 'DISPATCHED', { buyer: 'Nature Fresh Distributors, Delhi',      daysAgo: 25 }),
  makeBatch('HS-2026-06-006', 'WBJC',   4, 35, 142, 'DISPATCHED', { buyer: 'Himalayan Organic Mart, Dehradun',      daysAgo: 20 }),
  makeBatch('HS-2026-06-007', 'KMGC',   1, 25,  62, 'DISPATCHED', { buyer: 'Organic India Pvt Ltd, Bangalore',      daysAgo: 18 }),
  makeBatch('HS-2026-06-008', 'ABHJAM', 5, 180, 182,'DISPATCHED', { buyer: 'Pure Nature Stores, Mumbai',            daysAgo: 12 }),
  makeBatch('HS-2026-06-009', 'RHSLT',  2, 60,  667,'DISPATCHED', { buyer: 'Uttarakhand State Co-op, Dehradun',     daysAgo: 8  }),
];

// ── Scan events ───────────────────────────────────────────────────────
// Generates realistic consumer QR scans for select batches
async function makeScanEvents(batchCode, count) {
  // Look up the actual batchId from the DB
  const batch = await Batch.findOne({ batchCode }).select('_id');
  if (!batch) return [];

  const SOURCES      = ['factory', 'buyer', 'QA'];
  const DEVICE_TYPES = ['Mobile', 'Tablet', 'Desktop', 'Unknown'];
  const events = [];

  for (let i = 0; i < count; i++) {
    const daysBack = Math.floor(Math.random() * 20);
    events.push({
      batchId:    batch._id,
      batchCode,
      scannedAt:  daysAgo(daysBack),
      source:     SOURCES[i % SOURCES.length],
      deviceType: DEVICE_TYPES[Math.floor(Math.random() * DEVICE_TYPES.length)],
      ipHash:     `hash_${Math.random().toString(36).slice(2, 10)}`,
    });
  }
  return events;
}

const SCAN_DATA = [
  { code: 'HS-2026-06-001', count: 14 },
  { code: 'HS-2026-06-002', count: 7  },
  { code: 'HS-2026-06-007', count: 11 },
  { code: 'HS-2026-06-008', count: 5  },
  { code: 'HS-2026-06-009', count: 3  },
  { code: 'HS-2026-06-016', count: 2  },
  { code: 'HS-2026-06-020', count: 8  },
  { code: 'HS-2026-06-021', count: 4  },
];

// ── Main ──────────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    if (CLEAR_FIRST) {
      console.log('⚠️  --clear flag detected — removing existing batches and scan events...');
      await Batch.deleteMany({});
      await ScanEvent.deleteMany({});
      console.log('🗑️  Cleared.');
    }

    console.log(`\n📦 Seeding ${RICH_BATCHES.length} batches (upsert by batchCode)...`);
    let created = 0;
    let updated = 0;

    for (const b of RICH_BATCHES) {
      const result = await Batch.findOneAndUpdate(
        { batchCode: b.batchCode },
        b,
        { upsert: true, new: true, runValidators: false }
      );
      // Mongoose upsert: if _id existed it's an update, else create
      if (result.createdAt && (new Date() - result.createdAt) < 5000) {
        created++;
      } else {
        updated++;
      }
    }
    console.log(`   ↳ ${created} inserted, ${updated} updated`);

    // Seed scan events (non-destructive — always appends)
    if (!CLEAR_FIRST) {
      // Remove only scans for the batchCodes we're about to seed
      const scanCodes = SCAN_DATA.map(s => s.code);
      await ScanEvent.deleteMany({ batchCode: { $in: scanCodes } });
    }

    const allScanEvents = (await Promise.all(
      SCAN_DATA.map(({ code, count }) => makeScanEvents(code, count))
    )).flat();
    await ScanEvent.insertMany(allScanEvents);
    console.log(`📡 Seeded ${allScanEvents.length} scan events across ${SCAN_DATA.length} batches`);

    console.log('\n🎉 Rich seed complete! Summary:');
    console.log(`   READY:      ${RICH_BATCHES.filter(b => b.status === 'READY').length} batches`);
    console.log(`   WARNING:    ${RICH_BATCHES.filter(b => b.status === 'WARNING').length} batches`);
    console.log(`   URGENT:     ${RICH_BATCHES.filter(b => b.status === 'URGENT').length} batches`);
    console.log(`   DISPATCHED: ${RICH_BATCHES.filter(b => b.status === 'DISPATCHED').length} batches`);
    console.log(`   Products:   ${[...new Set(RICH_BATCHES.map(b => b.productName))].length} types`);
    console.log(`   Farmers:    ${[...new Set(RICH_BATCHES.map(b => b.farmerName))].length} unique`);
    console.log(`   Villages:   ${[...new Set(RICH_BATCHES.map(b => b.village))].length} locations\n`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
