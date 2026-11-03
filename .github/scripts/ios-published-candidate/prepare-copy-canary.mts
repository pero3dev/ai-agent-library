type EventInput = { repository: { full_name: unknown; private: unknown }; pull_request?: { head: { sha?: unknown } } };
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { caseIDsForSlice } from './ui-slice-contract.mts';
import { seedClipboardCanary } from '../../../ios/tests/clipboard-canary-seed.mjs';
import { readPublishedSimulatorReady } from '../../../ios/tests/native-simulator-prepare.mjs';
const owned = readPublishedSimulatorReady();
assert.equal(process.env.AILIBRARY_PUBLISHED_DESTINATION, owned.destination);
const evidence = '.local/ios-published-candidate/evidence';
const selection = JSON.parse(readFileSync(`${evidence}/ui-selection.json`, 'utf8')) as Record<string, unknown> & { destination: { id: unknown } };
assert.equal(selection.status, 'fixed-disjoint-full-UI-slice');
assert.equal(selection.slice, process.env.UI_SLICE);
assert.equal(selection.source_head, process.env.EXPECTED_SOURCE_HEAD);
assert.equal(selection.event_commit, process.env.GITHUB_SHA);
assert.deepEqual(selection.expected_case_IDs, caseIDsForSlice(process.env.UI_SLICE));
assert.deepEqual(selection.owned_simulator, { context: owned.context, token: owned.token, UUID: owned.UUID });
assert.equal(selection.destination.id, owned.UUID);
assert.equal(selection.contract_SHA256, createHash('sha256').update(readFileSync('.github/scripts/ios-published-candidate/ui-slice-contract.mts')).digest('hex'));
const put = (name: string, value: string | NodeJS.ArrayBufferView) => writeFileSync(`${evidence}/${name}`, value, { flag: 'wx', mode: 0o600 });
const json = (name: string, value: unknown) => put(name, JSON.stringify(value, null, 2) + '\n');
assert.equal(process.env.GITHUB_ACTIONS, 'true');
const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH as string, 'utf8')) as EventInput;
assert.equal(event.repository.full_name, 'pero3dev/ai-agent-library');
assert.equal(event.repository.private, false);
const run = (name: string, args: string[], input: Buffer | undefined, limit = 1024 * 1024, timeout = 30000) => {
  json(`copy-${name}.intent.json`, { binary: 'xcrun', arguments: args, timeout_ms: timeout, max_buffer_bytes: limit });
  const result = spawnSync('xcrun', args, { input, timeout, killSignal: 'SIGKILL', maxBuffer: limit });
  put(`copy-${name}.stdout.bin`, result.stdout ?? Buffer.alloc(0));
  put(`copy-${name}.stderr.log`, result.stderr ?? Buffer.alloc(0));
  json(`copy-${name}.exit.json`, { exit_code: result.status, signal: result.signal, error: result.error?.message ?? null });
  assert.equal(result.error, undefined); assert.equal(result.status, 0);
  return result.stdout;
};
const raw = run('devices', ['simctl', 'list', 'devices', 'available', '--json'], undefined, 16 * 1024 * 1024);
const inventory: unknown = JSON.parse(raw.toString('utf8'));
const runtimeID = 'com.apple.CoreSimulator.SimRuntime.iOS-18-5';
assert.ok(inventory && typeof inventory === 'object' && !Array.isArray(inventory));
assert.ok((inventory as Record<string, unknown>).devices && typeof (inventory as Record<string, unknown>).devices === 'object' && !Array.isArray((inventory as Record<string, unknown>).devices));
assert.ok(Array.isArray(((inventory as Record<string, unknown>).devices as Record<string, unknown>)?.[runtimeID]));
const UUID = owned.UUID;
const matches = ((((inventory as Record<string, unknown>).devices as Record<string, unknown>)[runtimeID]) as unknown[]).filter((device): device is Record<string, unknown> & { udid: string } => {
  assert.ok(device && typeof device === 'object' && !Array.isArray(device));
  assert.equal(typeof (device as Record<string, unknown>).udid, 'string');
  return ((device as Record<string, unknown>).udid as string).toUpperCase() === UUID;
});
assert.equal(matches.length, 1, 'Exactly the proven owned UUID must own the clipboard test');
const device = matches[0];
assert.equal(device.name, owned.name); assert.equal(device.isAvailable, true);
assert.equal(device.deviceTypeIdentifier, owned.device_type_identifier);
assert.equal(device.state, 'Booted', 'The prepared owned UUID must remain Booted; no named-device fallback');
const canary = Buffer.from(`AILibrary-code-copy-canary:${process.env.GITHUB_RUN_ID}:${process.env.GITHUB_RUN_ATTEMPT}:${randomUUID()}\n`, 'utf8');
// BEGIN CONTENT-COPY CANARY SEED RECOVERY
if (selection.slice === 'content-copy') {
  const seed: Parameters<typeof seedClipboardCanary>[2] = (name, destination, input, plannedTimeout, acquirePermit) => {
    assert.ok(['seed', 'seed-timeout-retry-1'].includes(name));
    assert.equal(destination, UUID);
    assert.ok(Buffer.isBuffer(input) && input.equals(canary));
    assert.ok(Number.isInteger(plannedTimeout) && plannedTimeout > 0 && plannedTimeout <= 30000);
    assert.equal(typeof acquirePermit, 'function');
    const args = ['simctl', 'pbcopy', destination], limit = 1024 * 1024;
    json(`copy-${name}.intent.json`, { binary: 'xcrun', arguments: args,
      planned_timeout_ms: plannedTimeout, timeout_phase: 'planned-before-intent-storage',
      max_buffer_bytes: limit, input_bytes: input.length,
      input_SHA256: createHash('sha256').update(input).digest('hex') });
    const actualTimeout = acquirePermit().timeout_ms;
    const result = spawnSync('xcrun', args, { input, timeout: actualTimeout, killSignal: 'SIGKILL', maxBuffer: limit });
    put(`copy-${name}.stdout.bin`, result.stdout ?? Buffer.alloc(0));
    put(`copy-${name}.stderr.log`, result.stderr ?? Buffer.alloc(0));
    const receipt = { spawned: true, planned_timeout_ms: plannedTimeout, actual_timeout_ms: actualTimeout,
      exit_code: result.status, signal: result.signal,
      error_code: (result.error as NodeJS.ErrnoException | undefined)?.code ?? null, error: result.error?.message ?? null,
      stderr_text: Buffer.isBuffer(result.stderr) && result.stderr.length <= 512 ? result.stderr.toString('utf8') : null };
    json(`copy-${name}.exit.json`, receipt); return receipt;
  };
  json('copy-seed-input.json', { schema_version: 1, source_head: selection.source_head,
    run_id: process.env.GITHUB_RUN_ID, run_attempt: process.env.GITHUB_RUN_ATTEMPT, UUID,
    input_bytes: canary.length, input_SHA256: createHash('sha256').update(canary).digest('hex') });
  const seeded = seedClipboardCanary(UUID, canary, seed);
  json('copy-seed-accepted.json', { schema_version: 1, source_head: selection.source_head,
    run_id: process.env.GITHUB_RUN_ID, run_attempt: process.env.GITHUB_RUN_ATTEMPT, ...seeded });
} else {
  run('seed', ['simctl', 'pbcopy', UUID], canary);
}
// END CONTENT-COPY CANARY SEED RECOVERY
const observed = run('canary', ['simctl', 'pbpaste', UUID], undefined, 1024 * 1024, 90000);
assert.ok(observed.equals(canary), 'Device pasteboard must first return the exact unique canary bytes');
json('copy-device.json', { schema_version: 1, status: 'unique-device-canary-roundtrip-verified',
  repository: event.repository.full_name, run_id: process.env.GITHUB_RUN_ID, run_attempt: process.env.GITHUB_RUN_ATTEMPT,
  event_commit: process.env.GITHUB_SHA, pull_request_head: event.pull_request?.head.sha ?? null,
  slice: selection.slice, expected_case_IDs: selection.expected_case_IDs, source_head: selection.source_head,
  source_case_files: selection.source_case_files,
  contract_SHA256: selection.contract_SHA256, runtime_identifier: runtimeID, device_type_identifier: device.deviceTypeIdentifier, UUID,
  owned_simulator: { context: owned.context, token: owned.token, UUID: owned.UUID },
  canary_bytes: canary.length, canary_SHA256: createHash('sha256').update(canary).digest('hex') });
console.log(UUID);
