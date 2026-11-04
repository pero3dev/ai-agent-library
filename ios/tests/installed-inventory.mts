import assert from 'node:assert/strict';

const modePaths = new Set([
  'AILibrary.debug.dylib',
  'Frameworks/Testing.framework/Testing',
  'Frameworks/XCTAutomationSupport.framework/XCTAutomationSupport',
  'Frameworks/XCTest.framework/XCTest',
  'Frameworks/XCTestCore.framework/XCTestCore',
  'Frameworks/XCTestSupport.framework/XCTestSupport',
  'Frameworks/XCUIAutomation.framework/XCUIAutomation',
  'Frameworks/XCUnit.framework/XCUnit',
  'Frameworks/libXCTestBundleInject.dylib',
  'Frameworks/libXCTestSwiftSupport.dylib',
  'PlugIns/AILibraryTests.xctest/AILibraryTests',
  '__preview.dylib',
]);
/** @param {unknown} value @returns {value is Record<string, unknown>} */
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
/** @param {unknown} value @returns {value is string} */
const safePath = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 512 &&
  !value.startsWith('/') && !/[\\:\x00-\x1f\x7f]/.test(value) &&
  value.split('/').every((part) => part !== '' && part !== '.' && part !== '..');

// This is the observed Xcode16.4 Simulator install boundary, not a general
// filesystem permission normalizer. The host inventory must remain exact.
export type InventoryFile = { path: string; bytes: number; mode: number; sha256: string}
/** @param {unknown} expected @param {unknown} actual */
export function compareInstalledInventory(expected: unknown, actual: unknown) {
  /** @type {{reason: string, path?: string}[]} */
  const errors: { reason: string; path?: string }[] = [];
  let errorCount = 0;
  /** @param {string} reason @param {string} [path] */
  const fail = (reason: string, path?: string) => {
    errorCount += 1;
    if (errors.length < 32) errors.push({ reason, ...(path === undefined ? {} : { path }) });
  };
  /** @param {unknown} rows @param {string} label @returns {Map<string, InventoryFile>} */
  function index(rows: unknown, label: string): Map<string, InventoryFile> {
    /** @type {Map<string, InventoryFile>} */
    const map: Map<string, InventoryFile> = new Map();
    if (!Array.isArray(rows) || rows.length > 1024) { fail(label + ': inventory must be an array of at most 1024 files'); return map; }
    for (const row of rows) {
      if (!record(row) || Object.keys(row).sort().join(',') !== 'bytes,mode,path,sha256' ||
          !safePath(row.path) || typeof row.bytes !== 'number' || !Number.isSafeInteger(row.bytes) || row.bytes < 0 ||
          typeof row.mode !== 'number' || !Number.isInteger(row.mode) || row.mode < 0 || row.mode > 0o777 ||
          typeof row.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(row.sha256)) {
        fail(label + ': malformed file row'); continue;
      }
      if (map.has(row.path)) { fail(label + ': duplicate path', row.path); continue; }
      // All four fields and the exact key set were checked above.
      map.set(row.path, (row as InventoryFile));
    }
    return map;
  }
  const left = index(expected, 'expected'), right = index(actual, 'actual');
  const deltas = [];
  for (const path of [...new Set([...left.keys(), ...right.keys()])].sort()) {
    const before = left.get(path), after = right.get(path);
    if (!before || !after) {
      deltas.push({ path, accepted: false, changes: [before ? 'missing' : 'extra'], ...(before ? { expected: before } : { actual: after }) });
      fail(before ? 'Missing installed path' : 'Unexpected installed path', path); continue;
    }
    if (modePaths.has(path) && before.mode !== 0o755) fail('Observed exception requires source mode 0755', path);
    /** @type {('bytes' | 'sha256' | 'mode')[]} */
    const fields: ('bytes' | 'sha256' | 'mode')[] = ['bytes', 'sha256', 'mode'];
    const changes = fields.filter((field) => before[field] !== after[field]);
    const accepted = changes.length === 1 && changes[0] === 'mode' &&
      modePaths.has(path) && before.mode === 0o755 && after.mode === 0o644;
    if (changes.length) {
      deltas.push({ path, accepted, changes, expected: before, actual: after });
      if (!accepted) fail('Installed file differs outside the observed mode transition', path);
    }
  }
  const modeDeltas = deltas.filter((delta) => delta.accepted).map((delta) => {
    assert.ok(delta.expected && delta.actual, 'An accepted mode transition must have both file inventories');
    return { path: delta.path, expected_mode: delta.expected.mode, actual_mode: delta.actual.mode };
  });
  const result = { status: errorCount === 0 ? 'matched' : 'mismatch', expected_files: left.size,
    actual_files: right.size, mode_deltas: modeDeltas, deltas, error_count: errorCount,
    errors, errors_truncated: errorCount > errors.length };
  assert.ok(modeDeltas.length <= 12);
  return result;
}
