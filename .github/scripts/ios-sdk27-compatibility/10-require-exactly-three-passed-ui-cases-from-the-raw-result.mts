import { array, object, objects, jsonObject, jsonArray, match, optionalMessage } from './contracts.mts'
type CommandRecord = { name?: string; label?: string; binary: string; arguments: string[]; exit_code: number | null; signal: NodeJS.Signals | null; error: unknown }
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const evidence = process.env.EVIDENCE_DIR!;
const put = (name: string, value: string | Uint8Array) => writeFileSync(path.join(evidence, name), value, { flag: 'wx', mode: 0o600 });
const result = spawnSync('xcrun', ['xcresulttool', 'get', 'test-results', 'tests', '--path', path.join(evidence, 'ui.xcresult')],
  { encoding: 'utf8', timeout: 120000, maxBuffer: 16 * 1024 * 1024 });
put('ui-test-results.stdout.json', result.stdout ?? ''); put('ui-test-results.stderr.log', result.stderr ?? '');
put('ui-test-results.exit.json', JSON.stringify({ exit_code: result.status, signal: result.signal, error: optionalMessage(result.error) ?? null }) + '\n');
assert.equal(result.error, undefined); assert.equal(result.status, 0);
const tree = jsonObject(result.stdout), tests: Record<string, unknown>[] = [];
assert.ok(Array.isArray(tree.testNodes));
// Bind the exact observed16.4 namespace; an unknown SDK27 shape fails closed.
const bundleURL = 'test://com.apple.xcode/AILibrary/AILibraryUITests';
const container = (node: unknown, type: string, name: string, count: number) => {
  object(node);
  assert.equal(node.nodeType, type); assert.equal(node.name, name);
  assert.equal(node.result, 'Passed', 'Failed or skipped parents are not acceptance');
  assert.ok(Array.isArray(node.children)); assert.equal(node.children.length, count);
  return objects(node.children);
};
assert.equal(tree.testNodes.length, 1);
const bundles = container(tree.testNodes[0], 'Test Plan', 'AILibrary', 1);
const suites = container(bundles[0], 'UI test bundle', 'AILibraryUITests', 1);
assert.equal(bundles[0].nodeIdentifierURL, bundleURL);
const leaves = container(suites[0], 'Test Suite', 'NativeReaderUITests', 3);
assert.equal(suites[0].nodeIdentifierURL, bundleURL + '/NativeReaderUITests');
for (const node of leaves) {
  assert.ok(node && typeof node === 'object' && !Array.isArray(node));
  assert.equal(node.nodeType, 'Test Case'); assert.equal(node.result, 'Passed');
  assert.equal(node.children, undefined, 'The known schema requires a childless leaf');
  assert.equal(typeof node.name, 'string'); match(node.name, /^test\w+\(\)$/);
  assert.equal(node.nodeIdentifier, 'NativeReaderUITests/' + node.name);
  assert.equal(node.nodeIdentifierURL, bundleURL + '/NativeReaderUITests/' + node.name.slice(0, -2));
  tests.push(node);
}
assert.equal(new Set(tests.map((test) => test.nodeIdentifier)).size, tests.length, 'No selected case may repeat');
const expected = ['NativeReaderUITests/testContentsBookmarkAndResumeAfterRelaunch()',
  'NativeReaderUITests/testHealthyLegacyHeadingPositionAndBookmarkPersistAfterNativeResumeAndRelaunch()',
  'NativeReaderUITests/testThreeArticlesHaveNativeBodyText()'].sort();
assert.equal(tests.length, 3, 'No skipped, extra, repeated or unknown UI cases may be accepted');
assert.deepEqual(tests.map((test) => test.nodeIdentifier).sort(), expected);
for (const test of tests) {
  assert.equal(test.result, 'Passed');
  assert.ok(test.children === undefined || (Array.isArray(test.children) && test.children.length === 0), 'Unexpected case detail/retry schema');
}
const devices = objects(tree.devices);
assert.ok(Array.isArray(devices)); assert.equal(devices.length, 1);
const owned = jsonObject(readFileSync(path.join(evidence, 'owned-simulator.json'), 'utf8'));
assert.ok(typeof devices[0].deviceId === 'string');
assert.equal(devices[0].deviceId.toUpperCase(), owned.UUID);
assert.equal(devices[0].osVersion, '27.0'); assert.equal(devices[0].platform, 'iOS Simulator');
if (devices[0].modelName !== undefined) assert.equal(devices[0].modelName, 'iPhone 17');
put('ui-acceptance.json', JSON.stringify({ schema_version: 1, status: 'exact-three-cases-passed',
  cases: tests.map(({ nodeIdentifier, result }) => ({ nodeIdentifier, result })), devices,
  scope: 'Representative public UI only; fixture resources audited separately. No minimum-iOS17 runtime, physical, VoiceOver or performance acceptance.' }, null, 2) + '\n');
