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
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const safePath = value => typeof value === 'string' && value.length > 0 && value.length <= 512 &&
  !value.startsWith('/') && !/[\\:\x00-\x1f\x7f]/.test(value) &&
  value.split('/').every(part => part !== '' && part !== '.' && part !== '..');

// This is the observed Xcode16.4 Simulator install boundary, not a general
// filesystem permission normalizer. The host inventory must remain exact.
export function compareInstalledInventory(expected, actual) {
  const errors = [];
  let errorCount = 0;
  const fail = (reason, path) => {
    errorCount += 1;
    if (errors.length < 32) errors.push({ reason, ...(path === undefined ? {} : { path }) });
  };
  function index(rows, label) {
    const map = new Map();
    if (!Array.isArray(rows) || rows.length > 1024) { fail(label + ': inventory must be an array of at most 1024 files'); return map; }
    for (const row of rows) {
      if (!record(row) || Object.keys(row).sort().join(',') !== 'bytes,mode,path,sha256' ||
          !safePath(row.path) || !Number.isSafeInteger(row.bytes) || row.bytes < 0 ||
          !Number.isInteger(row.mode) || row.mode < 0 || row.mode > 0o777 ||
          typeof row.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(row.sha256)) {
        fail(label + ': malformed file row'); continue;
      }
      if (map.has(row.path)) { fail(label + ': duplicate path', row.path); continue; }
      map.set(row.path, row);
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
    const changes = ['bytes', 'sha256', 'mode'].filter(field => before[field] !== after[field]);
    const accepted = changes.length === 1 && changes[0] === 'mode' &&
      modePaths.has(path) && before.mode === 0o755 && after.mode === 0o644;
    if (changes.length) {
      deltas.push({ path, accepted, changes, expected: before, actual: after });
      if (!accepted) fail('Installed file differs outside the observed mode transition', path);
    }
  }
  const modeDeltas = deltas.filter(delta => delta.accepted).map(delta => ({
    path: delta.path, expected_mode: delta.expected.mode, actual_mode: delta.actual.mode,
  }));
  const result = { status: errorCount === 0 ? 'matched' : 'mismatch', expected_files: left.size,
    actual_files: right.size, mode_deltas: modeDeltas, deltas, error_count: errorCount,
    errors, errors_truncated: errorCount > errors.length };
  assert.ok(modeDeltas.length <= 12);
  return result;
}
