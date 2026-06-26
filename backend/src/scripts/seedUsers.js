const bcrypt  = require('bcryptjs');
const User    = require('../models/User.model');

/**
 * Seeds default admin + manager accounts on first boot.
 * Runs only when the users collection is empty — idempotent.
 */
async function seedUsers() {
  const count = await User.countDocuments();
  if (count > 0) {
    console.log('✅ [Auth] Users already seeded — skipping.');
    return;
  }

  const adminPw   = process.env.SEED_ADMIN_PASSWORD;
  const managerPw = process.env.SEED_MANAGER_PASSWORD;
  if (!adminPw || !managerPw) {
  console.error('❌ Set SEED_ADMIN_PASSWORD and SEED_MANAGER_PASSWORD in .env');
  return;
}

  await User.insertMany([
    {
      username:     'admin',
      passwordHash: await bcrypt.hash(adminPw, 12),
      name:         'System Administrator',
      email:        '',
      role:         'admin',
    },
    {
      username:     'manager',
      passwordHash: await bcrypt.hash(managerPw, 12),
      name:         'Factory Manager',
      email:        '',
      role:         'manager',
    },
  ]);

  console.log('✅ [Auth] Seeded default users: admin + manager');
}

module.exports = { seedUsers };
