import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { caseIDsForSlice, validateUITestTree } from './ui-slice-contract.mts';
import { readPublishedSimulatorReady } from '../../../ios/tests/native-simulator-prepare.mjs';
const owned = readPublishedSimulatorReady();
assert.equal(process.env.AILIBRARY_PUBLISHED_DESTINATION, owned.destination);
const evidence = '.local/ios-published-candidate/evidence';
const put = (name: string, value: string | NodeJS.ArrayBufferView) => writeFileSync(`${evidence}/${name}`, value, { flag: 'wx', mode: 0o600 });
const json = (name: string, value: unknown) => put(name, JSON.stringify(value, null, 2) + '\n');
const binding = JSON.parse(readFileSync(`${evidence}/copy-device.json`, 'utf8')) as Record<string, unknown>;
assert.equal(process.env.GITHUB_ACTIONS, 'true');
assert.equal(binding.status, 'unique-device-canary-roundtrip-verified');
assert.equal(binding.repository, process.env.GITHUB_REPOSITORY);
assert.equal(binding.run_id, process.env.GITHUB_RUN_ID); assert.equal(binding.run_attempt, process.env.GITHUB_RUN_ATTEMPT);
assert.equal(binding.event_commit, process.env.GITHUB_SHA);
assert.equal(binding.UUID, process.env.COPY_SIMULATOR_ID);
assert.equal(binding.UUID, owned.UUID);
assert.deepEqual(binding.owned_simulator, { context: owned.context, token: owned.token, UUID: owned.UUID });
assert.equal(binding.slice, process.env.UI_SLICE);
assert.equal(binding.source_head, process.env.EXPECTED_SOURCE_HEAD);
assert.deepEqual(binding.expected_case_IDs, caseIDsForSlice(binding.slice as string));
assert.equal(binding.contract_SHA256, createHash('sha256').update(readFileSync('.github/scripts/ios-published-candidate/ui-slice-contract.mts')).digest('hex'));
assert.match(binding.UUID as string, /^[A-F0-9]{8}(?:-[A-F0-9]{4}){3}-[A-F0-9]{12}$/);
const run = (name: string, args: string[], timeout: number, limit: number) => {
  json(`copy-${name}.intent.json`, { binary: 'xcrun', arguments: args, timeout_ms: timeout, max_buffer_bytes: limit });
  const result = spawnSync('xcrun', args, { timeout, killSignal: 'SIGKILL', maxBuffer: limit });
  put(`copy-${name}.stdout.bin`, result.stdout ?? Buffer.alloc(0));
  put(`copy-${name}.stderr.log`, result.stderr ?? Buffer.alloc(0));
  json(`copy-${name}.exit.json`, { exit_code: result.status, signal: result.signal, error: result.error?.message ?? null });
  assert.equal(result.error, undefined); assert.equal(result.status, 0);
  return result.stdout;
};
const raw = run('results', ['xcresulttool', 'get', 'test-results', 'tests', '--path', `${evidence}/ui.xcresult`], 60000, 16 * 1024 * 1024);
const tree = JSON.parse(raw.toString('utf8')) as Parameters<typeof validateUITestTree>[0];
const { cases, device, expectedCaseIDs } = validateUITestTree(tree, binding, process.env.UI_SLICE);
json('ui-slice-summary.json', { schema_version: 1, status: 'exact-selected-UI-slice-passed',
  slice: binding.slice, selected_UI_passed: cases.length, selected_case_IDs: expectedCaseIDs,
  repository: binding.repository, run_id: binding.run_id, run_attempt: binding.run_attempt,
  event_commit: binding.event_commit, source_head: binding.source_head, pull_request_head: binding.pull_request_head,
  source_case_files: binding.source_case_files,
  UUID: binding.UUID, osVersion: device.osVersion, contract_SHA256: binding.contract_SHA256 });
if (binding.slice === 'content-copy') {
const caseID = 'PublishedReaderUITests/testFixtureFirstCodeCopyUsesThePublicButton()';
assert.equal(cases.filter(test => test.nodeIdentifier === caseID).length, 1);
const expected = readFileSync('ios/fixtures/first-code-copy-expected.txt');
assert.equal(expected.length, 374);
assert.equal(createHash('sha256').update(expected).digest('hex'), 'e29cb525957fb4bd72350927aa1cf47659da4aef9964ecbf0d43edb4dfe2cee8');
const actual = run('actual', ['simctl', 'pbpaste', binding.UUID as string], 30000, 1024 * 1024);
json('code-copy-summary.json', { schema_version: 1, status: actual.equals(expected) ? 'exact-first-code-copy-passed' : 'copy-mismatch',
  run_id: binding.run_id, run_attempt: binding.run_attempt, event_commit: binding.event_commit,
  pull_request_head: binding.pull_request_head, UUID: binding.UUID, osVersion: device.osVersion, copy_case: caseID,
  slice: binding.slice, source_head: binding.source_head, selected_case_IDs: expectedCaseIDs,
  selected_UI_passed: cases.length, expected_bytes: expected.length, actual_bytes: actual.length,
  expected_SHA256: createHash('sha256').update(expected).digest('hex'), actual_SHA256: createHash('sha256').update(actual).digest('hex'),
  coverage: 'First nonempty fixture code only; exact UTF8 including indentation, tab, emoji, long line and final newline',
  remaining: 'Empty/second/inline-math copies, physical pasteboard, first offline launch and legacy UI migration are unverified' });
assert.ok(actual.equals(expected), 'Device pasteboard must exactly match the independent first-code bytes');
console.log('Verified exact 374-byte first code copy on the actual UI destination.');
}
