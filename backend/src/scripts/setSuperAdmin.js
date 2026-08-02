/**
 * setSuperAdmin.js — One-time Super Admin migration script
 *
 * Identifies Divyansh's account and sets isSuperAdmin: true.
 * Idempotent — safe to run multiple times.
 *
 * Matching strategy (in order of priority):
 *   1. googleEmail === 'divyanshuniyal185@gmail.com'
 *   2. username    === 'divyansh'   (fallback if Google not yet linked)
 *
 * Usage:
 *   node src/scripts/setSuperAdmin.js
 *
 * Requires MONGODB_URI in .env (loaded automatically via dotenv).
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User     = require('../models/User.model');

const SUPER_ADMIN_GOOGLE_EMAIL = 'divyanshuniyal185@gmail.com';
const SUPER_ADMIN_USERNAME_FALLBACK = 'divyansh';

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI not found in .env');
    process.exit(1);
  }

  console.log('🔌  Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('✅  Connected.\n');

  // ── Step 1: Clear any existing (accidental) super-admin flags ──
  const existing = await User.find({ isSuperAdmin: true });
  if (existing.length > 0) {
    console.log(`⚠️   Found ${existing.length} existing super-admin(s):`);
    existing.forEach(u => console.log(`    - ${u.username} (${u.googleEmail || 'no google email'})`));
    console.log('    Clearing all existing flags first...');
    await User.updateMany({ isSuperAdmin: true }, { $set: { isSuperAdmin: false } });
    console.log('    Cleared.\n');
  }

  // ── Step 2: Find Divyansh's account ───────────────────────────
  let target = await User.findOne({ googleEmail: SUPER_ADMIN_GOOGLE_EMAIL });

  if (!target) {
    console.log(`⚠️   No user found with googleEmail '${SUPER_ADMIN_GOOGLE_EMAIL}'.`);
    console.log(`    Trying fallback username '${SUPER_ADMIN_USERNAME_FALLBACK}'...`);
    target = await User.findOne({ username: SUPER_ADMIN_USERNAME_FALLBACK });
  }

  if (!target) {
    console.error(`❌  Could not find a user matching:`);
    console.error(`    googleEmail: ${SUPER_ADMIN_GOOGLE_EMAIL}`);
    console.error(`    username:    ${SUPER_ADMIN_USERNAME_FALLBACK}`);
    console.error('    Please check the database and update the script values.');
    await mongoose.disconnect();
    process.exit(1);
  }

  // ── Step 3: Set isSuperAdmin flag ─────────────────────────────
  target.isSuperAdmin = true;
  target.role         = 'admin';          // Super Admin must also have role: 'admin'
  target.isActive     = true;             // Ensure account is active
  await target.save();

  console.log('👑  Super Admin flag set successfully:');
  console.log(`    Username:    ${target.username}`);
  console.log(`    Name:        ${target.name}`);
  console.log(`    Email:       ${target.email || '—'}`);
  console.log(`    Google:      ${target.googleEmail || '—'}`);
  console.log(`    Role:        ${target.role}`);
  console.log(`    isSuperAdmin: ${target.isSuperAdmin}`);
  console.log('\n✅  Done. Divyansh is now the immutable Super Admin.');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('❌  Script failed:', err.message);
  process.exit(1);
});
