import { array, object, objects, jsonObject, jsonArray, match, optionalMessage } from './contracts.mts'
type CommandRecord = { name?: string; label?: string; binary: string; arguments: string[]; exit_code: number | null; signal: NodeJS.Signals | null; error: unknown }
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const evidence = process.env.EVIDENCE_DIR!;
const put = (name: string, value: string | Uint8Array) => writeFileSync(path.join(evidence, name), value, { flag: 'wx', mode: 0o600 });
const json = (name: string, value: unknown) => put(name, JSON.stringify(value, null, 2) + '\n');
const read = (name: string) => jsonObject(readFileSync(path.join(evidence, name), 'utf8'));
const owned = read('owned-simulator.json'), intent = read('owned-simulator-intent.json'), selection = read('selection.json');
const uuidPattern = /^[A-F0-9]{8}(?:-[A-F0-9]{4}){3}-[A-F0-9]{12}$/;
assert.equal(owned.creation_exit_code, 0); assert.equal(owned.source_head, process.env.EXPECTED_SOURCE_HEAD);
assert.equal(owned.run_id, process.env.GITHUB_RUN_ID); assert.equal(owned.run_attempt, process.env.GITHUB_RUN_ATTEMPT);
assert.equal(owned.repository, process.env.GITHUB_REPOSITORY); match(owned.UUID, uuidPattern);
match(owned.token, /^[a-f0-9-]{36}$/);
assert.equal(owned.name, `AILibrary-runtime27-${owned.run_id}-${owned.run_attempt}-${owned.token}`);
assert.deepEqual(owned, { ...intent, UUID: owned.UUID, creation_exit_code: 0 } as Record<string, unknown>);
assert.equal(selection.status, 'selected-from-actual-inventory');
assert.equal(selection.source_head, process.env.EXPECTED_SOURCE_HEAD);
object(selection.runtime); object(selection.device_type);
assert.equal(owned.runtime_identifier, selection.runtime.identifier);
assert.equal(owned.device_type_identifier, selection.device_type.identifier);
assert.ok(Array.isArray(owned.preexisting_UUIDs)); assert.ok(!owned.preexisting_UUIDs.includes(owned.UUID));
const destinations = spawnSync('xcodebuild', ['-showdestinations', '-project', 'ios/AILibrary.xcodeproj', '-scheme', 'AILibrary'],
  { encoding: 'utf8', timeout: 120000, maxBuffer: 16 * 1024 * 1024 });
put('showdestinations.stdout.log', destinations.stdout ?? ''); put('showdestinations.stderr.log', destinations.stderr ?? '');
put('showdestinations.exit.json', JSON.stringify({ exit_code: destinations.status, signal: destinations.signal, error: optionalMessage(destinations.error) ?? null }) + '\n');
json('showdestinations.json', { schema_version: 1, status: 'diagnostic-only', owned_UUID: owned.UUID,
  owned_uuid_listed: (destinations.stdout ?? '').toUpperCase().includes(owned.UUID) });
assert.equal(destinations.error, undefined); assert.equal(destinations.status, 0);
// Unbound listing is diagnostic. The exact UUID test below owns the bounded destination lookup.
const args = ['simctl', 'list', 'devices', '--json'], timeoutMs = 30000, maxBuffer = 16 * 1024 * 1024;
json('devices-before-test.intent.json', { schema_version: 1, binary: 'xcrun', arguments: args,
  timeout_ms: timeoutMs, max_buffer_bytes: maxBuffer, run_id: owned.run_id,
  run_attempt: owned.run_attempt, source_head: owned.source_head, owned_UUID: owned.UUID });
let current;
try { current = spawnSync('xcrun', args, { encoding: 'utf8', timeout: timeoutMs, killSignal: 'SIGKILL', maxBuffer }); }
catch (error) { current = { status: null, signal: null, stdout: '', stderr: '', error }; }
put('devices-before-test.stdout.log', current.stdout ?? ''); put('devices-before-test.stderr.log', current.stderr ?? '');
json('devices-before-test.exit.json', { binary: 'xcrun', arguments: args, exit_code: current.status,
  signal: current.signal, error: optionalMessage(current.error) ?? (current.error === undefined ? null : String(current.error)) });
assert.equal(current.error, undefined); assert.equal(current.status, 0);
const inventory = jsonObject(current.stdout);
assert.ok(inventory.devices && typeof inventory.devices === 'object' && !Array.isArray(inventory.devices)); object(inventory.devices);
const devices = Object.entries(inventory.devices).flatMap(([runtime, rows]) => {
  assert.ok(Array.isArray(rows)); return objects(rows).map((device) => {
    assert.ok(typeof device.udid === 'string');
    match(device.udid.toUpperCase(), uuidPattern); return { runtime, device } as { runtime: string; device: Record<string, unknown> & { udid: string } };
  });
});
assert.equal(new Set(devices.map(({ device }) => device.udid.toUpperCase())).size, devices.length);
const matches = devices.filter(({ device }) => device.udid.toUpperCase() === owned.UUID);
assert.equal(matches.length, 1, 'Exactly one owned UUID must remain before the test');
assert.equal(matches[0].runtime, owned.runtime_identifier); assert.equal(matches[0].device.name, owned.name);
assert.equal(matches[0].device.deviceTypeIdentifier, owned.device_type_identifier);
assert.equal(matches[0].device.state, 'Booted'); assert.equal(matches[0].device.isAvailable, true);
json('owned-simulator-before-test.json', { schema_version: 1, status: 'owned-identity-revalidated',
  run_id: owned.run_id, run_attempt: owned.run_attempt, source_head: owned.source_head,
  UUID: owned.UUID, runtime_identifier: matches[0].runtime, device: matches[0].device });
console.log(owned.UUID);
