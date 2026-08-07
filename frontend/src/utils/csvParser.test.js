/**
 * csvParser — RFC 4180 parsing for the bulk import wizard
 * ──────────────────────────────────────────────────────────────────
 * The browser parses the sheet and POSTs canonical rows, so no file
 * ever reaches the server and this parser is the only thing standing
 * between a user's spreadsheet and the batch collection.
 *
 * Its failure mode is silent and expensive: a mis-split quoted field
 * does not error, it imports a village called `Chamoli` and a farmer
 * called ` Uttarakhand"` into a permanent, append-only production
 * record. Quoting, embedded separators and line endings are therefore
 * the bulk of what is tested here.
 */
import { describe, it, expect } from 'vitest';
import { parseCsv, parseCsvToObjects, detectDelimiter, toCsv } from './csvParser';

describe('detectDelimiter', () => {
  it('detects a comma', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',');
  });

  it('detects a semicolon, which Excel writes in comma-decimal locales', () => {
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';');
  });

  it('detects a tab', () => {
    expect(detectDelimiter('a\tb\tc\n1\t2\t3')).toBe('\t');
  });

  it('ignores separators inside quoted fields', () => {
    // The quoted commas must not outvote the real semicolon separators.
    expect(detectDelimiter('"a,b,c,d,e";"f";"g"\n"1,2,3,4,5";"6";"7"')).toBe(';');
  });

  it('defaults to comma when there is no separator at all', () => {
    expect(detectDelimiter('single-column\nvalue')).toBe(',');
  });
});

describe('parseCsv — RFC 4180', () => {
  it('parses a plain grid', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('keeps a separator that appears inside a quoted field', () => {
    expect(parseCsv('name,village\n"Negi, Harish",Chamoli'))
      .toEqual([['name', 'village'], ['Negi, Harish', 'Chamoli']]);
  });

  it('unescapes a doubled quote into a single literal quote', () => {
    expect(parseCsv('note\n"He said ""fresh"""'))
      .toEqual([['note'], ['He said "fresh"']]);
  });

  it('preserves a newline inside a quoted field', () => {
    expect(parseCsv('note\n"line one\nline two"'))
      .toEqual([['note'], ['line one\nline two']]);
  });

  it('handles CRLF line endings, which Windows Excel always writes', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('preserves empty cells rather than dropping them', () => {
    // Dropping one would shift every later column into the wrong field.
    expect(parseCsv('a,b,c\n1,,3')).toEqual([['a', 'b', 'c'], ['1', '', '3']]);
  });

  it('strips a UTF-8 BOM from the first header', () => {
    const rows = parseCsv('﻿sku,qty\nABC,10');
    expect(rows[0][0]).toBe('sku');
  });

  it('returns an empty result for empty input instead of throwing', () => {
    expect(parseCsv('')).toEqual([]);
    expect(parseCsv(null)).toEqual([]);
    expect(parseCsv(undefined)).toEqual([]);
  });
});

describe('parseCsvToObjects', () => {
  it('keys each row by its header', () => {
    const { headers, rows } = parseCsvToObjects('sku,qty\nABC,10');
    expect(headers).toEqual(['sku', 'qty']);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ sku: 'ABC', qty: '10' });
  });

  it('tags each row with its 1-based line number in the original sheet', () => {
    // Validation errors have to point at the row the user sees in Excel,
    // not at a zero-based index into an array they never look at.
    const { rows } = parseCsvToObjects('sku\nA\nB');
    expect(rows.map(r => r.__sheetRow)).toEqual([2, 3]);
  });

  it('returns no rows when the file has only headers', () => {
    expect(parseCsvToObjects('sku,qty')).toEqual({ headers: ['sku', 'qty'], rows: [] });
  });

  it('returns empty headers and rows for empty input', () => {
    expect(parseCsvToObjects('')).toEqual({ headers: [], rows: [] });
  });

  it('skips fully blank lines rather than importing empty batches', () => {
    const { rows } = parseCsvToObjects('sku,qty\nABC,10\n,\nDEF,20');
    expect(rows.map(r => r.sku)).toEqual(['ABC', 'DEF']);
  });

  it('names an unlabelled column instead of keying rows on an empty string', () => {
    const { headers } = parseCsvToObjects('sku,,qty\nA,B,C');
    expect(headers).toEqual(['sku', 'Column 2', 'qty']);
  });

  it('fills short rows with empty strings instead of undefined', () => {
    const { rows } = parseCsvToObjects('a,b,c\n1,2');
    expect(rows[0].c).toBe('');
  });
});

describe('toCsv round-trip', () => {
  it('re-parses to the values it was given, quotes and separators intact', () => {
    const headers = ['name', 'note'];
    const rows = [
      { name: 'Negi, Harish', note: 'said "fresh"' },
      { name: 'Kamla Rawat', note: 'line one\nline two' },
    ];
    const { rows: parsed } = parseCsvToObjects(toCsv(headers, rows));
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject(rows[0]);
    expect(parsed[1]).toMatchObject(rows[1]);
  });
});
