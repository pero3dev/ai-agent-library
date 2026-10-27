import test from 'node:test';
import assert from 'node:assert/strict';
import { compareInstalledInventory } from '../../ios/tests/installed-inventory.mjs';

const observed = [
  'AILibrary.debug.dylib', 'Frameworks/Testing.framework/Testing',
  'Frameworks/XCTAutomationSupport.framework/XCTAutomationSupport',
  'Frameworks/XCTest.framework/XCTest', 'Frameworks/XCTestCore.framework/XCTestCore',
  'Frameworks/XCTestSupport.framework/XCTestSupport', 'Frameworks/XCUIAutomation.framework/XCUIAutomation',
  'Frameworks/XCUnit.framework/XCUnit', 'Frameworks/libXCTestBundleInject.dylib',
  'Frameworks/libXCTestSwiftSupport.dylib', 'PlugIns/AILibraryTests.xctest/AILibraryTests', '__preview.dylib',
];
const row = (path, mode = 0o755) => ({ path, bytes: 42, mode, sha256: 'a'.repeat(64) });
const baseline = () => [...observed.map(path => row(path)), row('AILibrary'), row('Content/articles/article.json', 0o644), row('Info.plist', 0o644)];
const clone = value => structuredClone(value);
const compare = (left, right) => compareInstalledInventory(clone(left), clone(right));

test('unchanged source/install inventory matches without normalizing modes', () => {
  const input = baseline(), result = compare(input, input);
  assert.equal(result.status, 'matched'); assert.deepEqual(result.mode_deltas, []); assert.deepEqual(result.deltas, []);
});
test('all twelve observed 0755 to 0644 transitions preserve complete content identity', () => {
  const source = baseline(), actual = clone(source);
  for (const entry of actual) if (observed.includes(entry.path)) entry.mode = 0o644;
  const result = compare(source, actual);
  assert.equal(result.status, 'matched'); assert.equal(result.mode_deltas.length, 12);
  assert.equal(result.deltas.length, 12); assert.equal(result.error_count, 0);
  for (const delta of result.deltas) { assert.deepEqual(delta.changes, ['mode']); assert.equal(delta.accepted, true); }
});
test('an installed subset may retain source 0755 and inventory ordering is immaterial', () => {
  const source = baseline(), actual = clone(source).reverse(); actual.find(x => x.path === observed[0]).mode = 0o644;
  const result = compare(source, actual); assert.equal(result.status, 'matched'); assert.equal(result.mode_deltas.length, 1);
});
test('comparison preserves caller arrays, rows and values', () => {
  const source = baseline(), actual = clone(source); actual[0].mode = 0o644;
  const before = JSON.stringify([source, actual]); compareInstalledInventory(source, actual);
  assert.equal(JSON.stringify([source, actual]), before);
});
for (const path of ['AILibrary', 'Content/articles/article.json', 'Info.plist', 'Frameworks/Unknown.framework/Unknown']) {
  test('refuses mode drift outside the exact twelve paths: ' + path, () => {
    const source = baseline(); if (!source.some(x => x.path === path)) source.push(row(path));
    const actual = clone(source); actual.find(x => x.path === path).mode ^= 0o111;
    const result = compare(source, actual); assert.equal(result.status, 'mismatch'); assert(result.error_count > 0);
  });
}
for (const mode of [0o750, 0o700, 0o666, 0o777, 0o600, 0]) {
  test('refuses an unobserved installed mode on an allowlisted binary: ' + mode, () => {
    const source = baseline(), actual = clone(source); actual[0].mode = mode;
    assert.equal(compare(source, actual).status, 'mismatch');
  });
}
test('refuses using the exception when source mode is already 0644', () => {
  const source = baseline(); source[0].mode = 0o644;
  assert.equal(compare(source, source).status, 'mismatch');
});
for (const field of ['bytes', 'sha256']) {
  test('refuses changed content even when its path also has an allowed mode change: ' + field, () => {
    const source = baseline(), actual = clone(source); actual[0].mode = 0o644;
    actual[0][field] = field === 'bytes' ? 43 : 'b'.repeat(64);
    assert.equal(compare(source, actual).status, 'mismatch');
  });
}
test('refuses missing and extra paths', () => {
  const source = baseline(), actual = clone(source).slice(1); actual.push(row('extra.dat', 0o644));
  const result = compare(source, actual); assert.equal(result.status, 'mismatch');
  assert.deepEqual(result.deltas.map(x => x.changes[0]).sort(), ['extra', 'missing']);
});
for (const side of ['expected', 'actual']) {
  test('refuses duplicate paths in ' + side, () => {
    const source = baseline(), actual = clone(source); (side === 'expected' ? source : actual).push(clone(source[0]));
    assert.equal(compare(source, actual).status, 'mismatch');
  });
}
for (const path of ['../outside', '/absolute', 'a//b', 'a/./b', 'a/../b', 'a\\b', 'a:b', 'a\0b', 'a/']) {
  test('refuses unsafe relative path ' + JSON.stringify(path), () => {
    assert.equal(compare([row(path)], [row(path)]).status, 'mismatch');
  });
}
for (const mutate of [
  x => { x.bytes = -1; }, x => { x.bytes = 1.5; }, x => { x.bytes = Number.MAX_SAFE_INTEGER + 1; },
  x => { x.mode = 0o1755; }, x => { x.mode = '0755'; }, x => { x.sha256 = 'abc'; },
  x => { x.sha256 = 'A'.repeat(64); }, x => { x.extra = true; }, x => { x.path = 2; },
]) {
  test('refuses malformed rows without throwing', () => {
    const value = row('AILibrary'); mutate(value);
    assert.equal(compare([row('AILibrary')], [value]).status, 'mismatch');
  });
}
test('refuses malformed containers and rows without throwing', () => {
  for (const input of [null, {}, 'not-an-array', [null], [1], [[]], new Array(2)]) {
    assert.equal(compareInstalledInventory(input, []).status, 'mismatch');
    assert.equal(compareInstalledInventory([], input).status, 'mismatch');
  }
});
test('refuses an oversized inventory and bounds diagnostic errors', () => {
  const many = Array.from({ length: 1025 }, (_, i) => row('file' + i));
  assert.equal(compareInstalledInventory(many, many).status, 'mismatch');
  const bad = Array.from({ length: 100 }, () => null), result = compareInstalledInventory(bad, bad);
  assert.equal(result.status, 'mismatch'); assert.equal(result.errors.length, 32);
  assert.equal(result.error_count, 200); assert.equal(result.errors_truncated, true);
});
