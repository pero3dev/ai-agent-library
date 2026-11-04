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
const knownTypes = new Set<unknown>(['Test Plan', 'UI test bundle', 'Test Suite', 'Test Case']);
const visit = (nodes: unknown[]) => { for (const node of nodes) {
  object(node);
  assert.ok(knownTypes.has(node.nodeType), 'Unknown test node schema must fail closed');
  assert.equal(node.result, 'Passed', 'Skipped or failed test containers are not acceptance');
  if (node.nodeType === 'Test Case') tests.push(node);
  if (node.children !== undefined) { assert.ok(Array.isArray(node.children)); visit(node.children); }
} };
visit(tree.testNodes);
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
assert.equal(devices[0].osVersion, '26.5'); assert.equal(devices[0].platform, 'iOS Simulator');
if (devices[0].modelName !== undefined) assert.equal(devices[0].modelName, 'iPhone 17');
put('ui-acceptance.json', JSON.stringify({ schema_version: 1, status: 'exact-three-cases-passed',
  cases: tests.map(({ nodeIdentifier, result }) => ({ nodeIdentifier, result })), devices,
  scope: 'Representative public UI only; fixture resources audited separately. No current iOS27, min17 runtime, physical, VoiceOver or performance acceptance.' }, null, 2) + '\n');
