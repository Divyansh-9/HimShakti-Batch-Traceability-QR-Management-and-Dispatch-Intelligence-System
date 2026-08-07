/**
 * Message.expiresAtFor — the TTL discriminator
 * ──────────────────────────────────────────────────────────────────
 * One collection backs two conversations. One TTL index serves both,
 * and Mongo's TTL monitor skips documents whose indexed field is null.
 * So this single function decides which messages are permanent audit
 * evidence and which expire after 90 days.
 *
 * Getting it backwards would not throw, would not fail a request, and
 * would not show up in any UI. It would quietly delete batch and
 * inspection comments — the audit trail — while letting role chatter
 * accumulate forever. Nothing else in the codebase enforces this.
 * These tests are the enforcement.
 */
const Message = require('../src/models/Message.model');

describe('Message.expiresAtFor', () => {
  it('returns null for record comments so the TTL never touches them', () => {
    // null is not "no opinion" here — it is what makes Mongo skip the doc.
    expect(Message.expiresAtFor('record')).toBeNull();
  });

  it('returns a future date for role channels', () => {
    const at = Message.expiresAtFor('channel');
    expect(at).toBeInstanceOf(Date);
    expect(at.getTime()).toBeGreaterThan(Date.now());
  });

  it('expires channels at 90 days, matching the documented retention', () => {
    const at = Message.expiresAtFor('channel');
    const days = (at.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(89.9);
    expect(days).toBeLessThan(90.1);
    expect(Message.CHANNEL_RETENTION_DAYS).toBe(90);
  });

  it('defaults to permanent for any unrecognised scope', () => {
    // Fail safe: an unknown scope must never be given an expiry. Keeping
    // a message too long is recoverable; deleting evidence is not.
    expect(Message.expiresAtFor(undefined)).toBeNull();
    expect(Message.expiresAtFor('')).toBeNull();
    expect(Message.expiresAtFor('inspection')).toBeNull();
    expect(Message.expiresAtFor('Channel')).toBeNull(); // case-sensitive by design
  });
});
