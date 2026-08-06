/**
 * @fileoverview RFC 4180 CSV parser — zero dependencies.
 *
 * Written by hand rather than pulled from npm on purpose. The obvious
 * candidate for reading spreadsheets in the browser is SheetJS (`xlsx`),
 * but the registry copy is pinned at an old release carrying published
 * prototype-pollution and ReDoS advisories. A regulated traceability system
 * should not take that on to save an afternoon, and the file we actually
 * need to read — comma-separated text — is a small, well-specified grammar.
 *
 * Handles the parts naive `split(',')` gets wrong:
 *   - quoted fields containing commas, newlines and doubled quotes ("")
 *   - CRLF, LF and lone-CR line endings
 *   - a UTF-8 BOM at the start of the file (Excel writes one)
 *   - a trailing newline that should not produce a phantom empty row
 *
 * Tab-separated files are supported by passing delimiter: '\t'.
 */

/** Strip a UTF-8 byte-order mark, which Excel prepends to CSV exports. */
function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * Guess the delimiter by counting candidates outside quoted regions in the
 * first few lines. Excel writes semicolons in locales where comma is the
 * decimal separator, and those files are otherwise indistinguishable.
 */
export function detectDelimiter(text) {
  const sample = stripBom(text).slice(0, 8192);
  const counts = { ',': 0, ';': 0, '\t': 0 };
  let inQuotes = false;

  for (let i = 0; i < sample.length; i++) {
    const ch = sample[i];
    if (ch === '"') {
      if (inQuotes && sample[i + 1] === '"') { i++; continue; }
      inQuotes = !inQuotes;
    } else if (!inQuotes && ch in counts) {
      counts[ch]++;
    }
  }

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][1] > 0
    ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
    : ',';
}

/**
 * Parse CSV text into a rectangular array of string cells.
 *
 * @param {string} text
 * @param {{ delimiter?: string }} [options]
 * @returns {string[][]} rows, each an array of raw cell strings
 */
export function parseCsv(text, { delimiter } = {}) {
  const src = stripBom(String(text ?? ''));
  const sep = delimiter || detectDelimiter(src);

  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let fieldWasQuoted = false;

  const endField = () => {
    // Unquoted fields get trimmed; quoted ones are taken literally, because
    // the quotes are the author saying "this whitespace is meaningful".
    row.push(fieldWasQuoted ? field : field.trim());
    field = '';
    fieldWasQuoted = false;
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }  // escaped quote
        else inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"' && field === '') {
      inQuotes = true;
      fieldWasQuoted = true;
    } else if (ch === sep) {
      endField();
    } else if (ch === '\n') {
      endRow();
    } else if (ch === '\r') {
      // CRLF or a lone CR both terminate the row; swallow the paired LF.
      if (src[i + 1] === '\n') i++;
      endRow();
    } else {
      field += ch;
    }
  }

  // Flush the last field unless the file ended on a clean newline.
  if (field !== '' || fieldWasQuoted || row.length) endRow();

  return rows;
}

/**
 * Parse into { headers, rows } where each row is an object keyed by header.
 *
 * Blank rows are dropped — spreadsheets routinely carry trailing empties —
 * and ragged rows are padded so downstream code can index by header without
 * guarding for undefined.
 *
 * `sheetRow` is the 1-based line number in the original file, so validation
 * errors can point at the row the user actually sees in Excel.
 */
export function parseCsvToObjects(text, options) {
  const grid = parseCsv(text, options);
  if (!grid.length) return { headers: [], rows: [] };

  const headers = grid[0].map((h, i) => (h || `Column ${i + 1}`));
  const rows = [];

  for (let r = 1; r < grid.length; r++) {
    const cells = grid[r];
    if (cells.every(c => c === '')) continue;   // blank line

    const obj = {};
    for (let c = 0; c < headers.length; c++) obj[headers[c]] = cells[c] ?? '';
    obj.__sheetRow = r + 1;                      // header is row 1
    rows.push(obj);
  }

  return { headers, rows };
}

/** Read a File/Blob as text. Wraps FileReader so callers can await it. */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Could not read the file'));
    reader.readAsText(file, 'utf-8');
  });
}

/**
 * Build a CSV string from headers + row objects, for the downloadable
 * template and the error report. Anything containing the delimiter, a quote
 * or a newline gets quoted, per the same spec we parse.
 */
export function toCsv(headers, rows) {
  const escape = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.map(escape).join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ].join('\r\n');
}
