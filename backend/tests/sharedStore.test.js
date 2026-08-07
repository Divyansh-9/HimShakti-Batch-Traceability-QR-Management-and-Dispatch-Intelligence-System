/**
 * sharedStore — the degraded path
 * ──────────────────────────────────────────────────────────────────
 * This module's whole purpose is to be optional. Every branch tested
 * here is a failure branch, because the failure branches are the ones
 * that run in local development, in CI, and during any Upstash outage.
 *
 * The rule it must never break: a cache or rate-limit backend being
 * down must degrade the app to its previous behaviour, never fail a
 * user's request.
 */
const store = require('../src/services/sharedStore');

const ENV = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'];
let saved;
let originalFetch;

beforeEach(() => {
  saved = ENV.map(k => process.env[k]);
  ENV.forEach(k => delete process.env[k]);
  originalFetch = global.fetch;
});

afterEach(() => {
  ENV.forEach((k, i) => {
    if (saved[i] === undefined) delete process.env[k];
    else process.env[k] = saved[i];
  });
  global.fetch = originalFetch;
});

function configure() {
  process.env.UPSTASH_REDIS_REST_URL   = 'https://example.upstash.test';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
}

describe('isEnabled', () => {
  it('is false when neither variable is set', () => {
    expect(store.isEnabled()).toBe(false);
  });

  it('is false when only one of the two is set', () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.test';
    expect(store.isEnabled()).toBe(false);
  });

  it('is true only when both are set', () => {
    configure();
    expect(store.isEnabled()).toBe(true);
  });
});

describe('when unconfigured', () => {
  it('returns null without attempting any network call', async () => {
    let called = false;
    global.fetch = async () => { called = true; };

    expect(await store.getJSON('k')).toBeNull();
    expect(await store.incrementWithin('k', 60)).toBeNull();
    expect(called).toBe(false);
  });
});

describe('when the backend misbehaves', () => {
  it('returns null on a network error rather than throwing', async () => {
    configure();
    global.fetch = async () => { throw new Error('ECONNREFUSED'); };
    await expect(store.getJSON('k')).resolves.toBeNull();
    await expect(store.incrementWithin('k', 60)).resolves.toBeNull();
  });

  it('returns null on a non-2xx response', async () => {
    configure();
    global.fetch = async () => ({ ok: false, status: 500 });
    expect(await store.getJSON('k')).toBeNull();
  });

  it('returns null when the stored value is not valid JSON', async () => {
    configure();
    global.fetch = async () => ({ ok: true, json: async () => ({ result: 'not json{' }) });
    expect(await store.getJSON('k')).toBeNull();
  });

  it('returns null when the key is absent', async () => {
    configure();
    global.fetch = async () => ({ ok: true, json: async () => ({ result: null }) });
    expect(await store.getJSON('k')).toBeNull();
  });
});

describe('when the backend works', () => {
  it('parses a stored JSON value', async () => {
    configure();
    global.fetch = async () => ({ ok: true, json: async () => ({ result: JSON.stringify({ a: 1 }) }) });
    expect(await store.getJSON('k')).toEqual({ a: 1 });
  });

  it('sets an expiry only on the first increment of a window', async () => {
    configure();
    const sent = [];
    global.fetch = async (_url, init) => {
      const args = JSON.parse(init.body);
      sent.push(args[0]);
      return { ok: true, json: async () => ({ result: args[0] === 'INCR' ? 1 : 'OK' }) };
    };

    expect(await store.incrementWithin('k', 900)).toBe(1);
    expect(sent).toEqual(['INCR', 'EXPIRE']);
  });

  it('does not re-set the expiry on later increments', async () => {
    configure();
    const sent = [];
    global.fetch = async (_url, init) => {
      const args = JSON.parse(init.body);
      sent.push(args[0]);
      return { ok: true, json: async () => ({ result: 7 }) };
    };

    expect(await store.incrementWithin('k', 900)).toBe(7);
    // Re-setting EXPIRE every call would slide the window forward and
    // let a steady stream of requests never reset the counter.
    expect(sent).toEqual(['INCR']);
  });
});
