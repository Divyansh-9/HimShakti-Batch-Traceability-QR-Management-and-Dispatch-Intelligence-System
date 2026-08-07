/**
 * expiryCalculator — status tiers, expiry maths, FEFO priority
 * ──────────────────────────────────────────────────────────────────
 * These are the numbers the whole dispatch flow rests on. A wrong
 * boundary here does not throw; it silently ships a batch a day late
 * or buries an urgent one in the queue, and nothing in the system
 * notices. Boundaries are therefore tested exactly, not approximately.
 */
const {
  calculateExpiry,
  getBatchStatus,
  calculatePriorityScore,
} = require('../src/services/expiryCalculator');

describe('getBatchStatus — tier boundaries', () => {
  // Documented contract: <=0 EXPIRED, <=7 URGENT, <=30 WARNING, else READY.
  it('treats today (0 days) as EXPIRED, not URGENT', () => {
    expect(getBatchStatus(0)).toBe('EXPIRED');
  });

  it('treats any past date as EXPIRED', () => {
    expect(getBatchStatus(-1)).toBe('EXPIRED');
    expect(getBatchStatus(-365)).toBe('EXPIRED');
  });

  it('marks 1..7 days as URGENT', () => {
    expect(getBatchStatus(1)).toBe('URGENT');
    expect(getBatchStatus(7)).toBe('URGENT');
  });

  it('flips to WARNING the day after the URGENT window closes', () => {
    expect(getBatchStatus(8)).toBe('WARNING');
  });

  it('marks up to and including 30 days as WARNING', () => {
    expect(getBatchStatus(30)).toBe('WARNING');
  });

  it('flips to READY the day after the WARNING window closes', () => {
    expect(getBatchStatus(31)).toBe('READY');
    expect(getBatchStatus(3650)).toBe('READY');
  });
});

describe('calculatePriorityScore — FEFO ordering', () => {
  // The formula in code is `365 - days` plus a risk bonus. README and
  // docs/DATABASE.md describe an older tiered 1000/500/200 scheme; the
  // code is the source of truth. This test pins the actual behaviour so
  // the discrepancy cannot be "fixed" in the wrong direction by accident.
  it('scores a sooner expiry higher than a later one', () => {
    expect(calculatePriorityScore(5, 'LOW')).toBeGreaterThan(calculatePriorityScore(200, 'LOW'));
  });

  it('never returns a negative score for a long-dated batch', () => {
    expect(calculatePriorityScore(500, 'LOW')).toBe(0);
  });

  it('adds 100 for HIGH risk and 50 for MEDIUM', () => {
    const base = calculatePriorityScore(65, undefined);
    expect(calculatePriorityScore(65, 'HIGH')).toBe(base + 100);
    expect(calculatePriorityScore(65, 'MEDIUM')).toBe(base + 50);
  });

  it('gives no bonus for LOW or unknown risk levels', () => {
    const base = calculatePriorityScore(65, undefined);
    expect(calculatePriorityScore(65, 'LOW')).toBe(base);
    expect(calculatePriorityScore(65, 'NONSENSE')).toBe(base);
  });

  it('ranks a high-risk batch above a low-risk one expiring slightly sooner', () => {
    // 100-point bonus is designed to outweigh a small date difference.
    expect(calculatePriorityScore(40, 'HIGH')).toBeGreaterThan(calculatePriorityScore(35, 'LOW'));
  });
});

describe('calculateExpiry — shelf life source selection', () => {
  const base = {
    productName: 'Test Product',
    sku: 'TEST',
    isActive: true,
    baseShelfLifeDays: 90,
  };

  it('prefers the predicted shelf life when present', () => {
    const r = calculateExpiry({ ...base, predictedShelfLifeDays: 45 }, new Date('2026-01-01'));
    expect(r.shelfLifeDays).toBe(45);
    expect(r.dataSource).toBe('predicted');
    expect(r.shelfLifeSource).toBe('predicted');
  });

  it('falls back to base shelf life when there is no prediction', () => {
    const r = calculateExpiry(base, new Date('2026-01-01'));
    expect(r.shelfLifeDays).toBe(90);
    expect(r.dataSource).toBe('fallback');
    expect(r.shelfLifeSource).toBe('base');
  });

  it('treats a predicted value of 0 as a real prediction, not a missing one', () => {
    // `!= null` rather than truthiness — 0 days is degenerate but explicit,
    // and silently substituting 90 would be worse than honouring it.
    const r = calculateExpiry({ ...base, predictedShelfLifeDays: 0 }, new Date('2026-01-01'));
    expect(r.shelfLifeDays).toBe(0);
    expect(r.dataSource).toBe('predicted');
  });

  it('adds shelf life to the pack date, not to today', () => {
    const r = calculateExpiry({ ...base, predictedShelfLifeDays: 10 }, new Date('2026-01-01T00:00:00Z'));
    expect(r.expiryDate.toISOString().slice(0, 10)).toBe('2026-01-11');
  });

  it('rejects a product that breaches the cross-team contract', () => {
    expect(() => calculateExpiry({ ...base, isActive: false }, new Date())).toThrow(/DB_CONTRACT/);
    expect(() => calculateExpiry(null, new Date())).toThrow(/DB_CONTRACT/);
  });
});
