/**
 * traceToken — the public QR identifier
 * ──────────────────────────────────────────────────────────────────
 * This token is the only thing standing between an unauthenticated
 * endpoint and the full production record. Two properties matter and
 * neither is visible at a glance:
 *
 *   - deterministic, or the backfill migration stops being idempotent
 *     and a re-run orphans every printed label;
 *   - keyed, or an attacker recomputes tokens for the whole sequence
 *     and the batch code might as well still be in the URL.
 */

const SECRET_A = 'secret-alpha';
const SECRET_B = 'secret-beta';

let original;

beforeEach(() => {
  original = { t: process.env.TRACE_TOKEN_SECRET, j: process.env.JWT_SECRET };
});

afterEach(() => {
  process.env.TRACE_TOKEN_SECRET = original.t;
  process.env.JWT_SECRET = original.j;
  if (original.t === undefined) delete process.env.TRACE_TOKEN_SECRET;
  if (original.j === undefined) delete process.env.JWT_SECRET;
});

function load() {
  // Re-require per test: the module reads env at call time, but this
  // keeps each case independent of import order.
  delete require.cache[require.resolve('../src/utils/traceToken')];
  return require('../src/utils/traceToken');
}

describe('deriveTraceToken', () => {
  it('is deterministic for the same code and key', () => {
    process.env.TRACE_TOKEN_SECRET = SECRET_A;
    const { deriveTraceToken } = load();
    expect(deriveTraceToken('HS-2026-06-022')).toBe(deriveTraceToken('HS-2026-06-022'));
  });

  it('produces a different token for every batch code', () => {
    process.env.TRACE_TOKEN_SECRET = SECRET_A;
    const { deriveTraceToken } = load();
    const codes = ['HS-2026-06-001', 'HS-2026-06-002', 'HS-2026-06-003', 'HS-2026-07-001'];
    const tokens = new Set(codes.map(deriveTraceToken));
    expect(tokens.size).toBe(codes.length);
  });

  it('normalises case so a lowercased code resolves to the same token', () => {
    process.env.TRACE_TOKEN_SECRET = SECRET_A;
    const { deriveTraceToken } = load();
    expect(deriveTraceToken('hs-2026-06-022')).toBe(deriveTraceToken('HS-2026-06-022'));
  });

  it('changes completely when the key changes', () => {
    process.env.TRACE_TOKEN_SECRET = SECRET_A;
    const a = load().deriveTraceToken('HS-2026-06-022');
    process.env.TRACE_TOKEN_SECRET = SECRET_B;
    const b = load().deriveTraceToken('HS-2026-06-022');
    expect(a).not.toBe(b);
  });

  it('is url-safe and 22 characters', () => {
    process.env.TRACE_TOKEN_SECRET = SECRET_A;
    const { deriveTraceToken, TOKEN_LENGTH } = load();
    const token = deriveTraceToken('HS-2026-06-022');
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token).toHaveLength(TOKEN_LENGTH);
    expect(TOKEN_LENGTH).toBe(22);
  });

  it('falls back to JWT_SECRET when no dedicated key is set', () => {
    delete process.env.TRACE_TOKEN_SECRET;
    process.env.JWT_SECRET = SECRET_A;
    const viaFallback = load().deriveTraceToken('HS-2026-06-022');

    process.env.TRACE_TOKEN_SECRET = SECRET_A;
    const viaDedicated = load().deriveTraceToken('HS-2026-06-022');

    expect(viaFallback).toBe(viaDedicated);
  });

  it('refuses to derive a token when no key is configured', () => {
    // Silently deriving under an empty key would produce a token anyone
    // could recompute — worse than an outage, because it looks fine.
    delete process.env.TRACE_TOKEN_SECRET;
    delete process.env.JWT_SECRET;
    const { deriveTraceToken } = load();
    expect(() => deriveTraceToken('HS-2026-06-022')).toThrow(/DB_CONFIG/);
  });
});
