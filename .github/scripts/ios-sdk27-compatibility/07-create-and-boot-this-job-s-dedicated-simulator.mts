import { array, object, objects, property, jsonObject, jsonArray, match, optionalMessage } from './contracts.mts'
type CommandRecord = { name?: string; label?: string; binary: string; arguments: string[]; exit_code: number | null; signal: NodeJS.Signals | null; error: unknown }
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const evidence = process.env.EVIDENCE_DIR!;
const put = (name: string, value: string | Uint8Array) => writeFileSync(path.join(evidence, name), value, { flag: 'wx', mode: 0o600 });
const json = (name: string, value: unknown) => put(name, JSON.stringify(value, null, 2) + '\n');
const run = (name: string, args: string[], timeoutMs = 120000) => {
  const result = spawnSync('xcrun', ['simctl', ...args], { encoding: 'utf8', timeout: timeoutMs, maxBuffer: 16 * 1024 * 1024 });
  put(name + '.stdout.log', result.stdout ?? ''); put(name + '.stderr.log', result.stderr ?? '');
  json(name + '.exit.json', { binary: 'xcrun', arguments: ['simctl', ...args], timeout_ms: timeoutMs, exit_code: result.status, signal: result.signal, error: optionalMessage(result.error) ?? null });
  assert.equal(result.error, undefined, name); assert.equal(result.status, 0, name);
  return result.stdout.trim();
};
const selection = jsonObject(readFileSync(path.join(evidence, 'selection.json'), 'utf8'));
assert.equal(selection.status, 'selected-from-actual-inventory');
assert.equal(selection.source_head, process.env.EXPECTED_SOURCE_HEAD);
const before = jsonObject(run('devices-before-create', ['list', 'devices', '--json']));
assert.ok(before.devices && typeof before.devices === 'object' && !Array.isArray(before.devices)); object(before.devices);
const uuidPattern = /^[A-Fa-f0-9]{8}(?:-[A-Fa-f0-9]{4}){3}-[A-Fa-f0-9]{12}$/;
const preexisting = [];
for (const rows of Object.values(before.devices)) {
  assert.ok(Array.isArray(rows));
  for (const row of objects(rows)) { match(row.udid, uuidPattern); preexisting.push(row.udid.toUpperCase()); }
}
assert.equal(new Set(preexisting).size, preexisting.length);
const token = randomUUID();
const name = `AILibrary-runtime27-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT}-${token}`;
object(selection.runtime); object(selection.device_type);
assert.ok(typeof selection.runtime.identifier === 'string' && typeof selection.device_type.identifier === 'string');
const intent = { schema_version: 1, repository: process.env.GITHUB_REPOSITORY,
  run_id: process.env.GITHUB_RUN_ID, run_attempt: process.env.GITHUB_RUN_ATTEMPT,
  source_head: selection.source_head, token, name, runtime_identifier: selection.runtime.identifier,
  device_type_identifier: selection.device_type.identifier, preexisting_UUIDs: preexisting };
// Durable intent precedes create. Raw create output/exit survive a later failure.
json('owned-simulator-intent.json', intent);
const uuid = run('create-simulator', ['create', name, intent.device_type_identifier, intent.runtime_identifier]);
match(uuid, uuidPattern); assert.ok(!preexisting.includes(uuid.toUpperCase()));
json('owned-simulator.json', { ...intent, UUID: uuid.toUpperCase(), creation_exit_code: 0 });
run('boot-simulator', ['boot', uuid]);
run('bootstatus-simulator', ['bootstatus', uuid, '-b'], 240000);
const afterBoot = jsonObject(run('devices-after-boot', ['list', 'devices', '--json']));
assert.ok(afterBoot.devices && typeof afterBoot.devices === 'object' && !Array.isArray(afterBoot.devices)); object(afterBoot.devices);
const matches = Object.entries(afterBoot.devices).flatMap(([runtime, rows]) => {
  assert.ok(Array.isArray(rows));
  return objects(rows.filter((device) => String(property(device, 'udid')).toUpperCase() === uuid.toUpperCase()))
    .map((device) => ({ runtime, device }));
});
assert.equal(matches.length, 1); assert.equal(matches[0].runtime, intent.runtime_identifier);
assert.equal(matches[0].device.name, name); assert.equal(matches[0].device.state, 'Booted');
assert.equal(matches[0].device.isAvailable, true);
