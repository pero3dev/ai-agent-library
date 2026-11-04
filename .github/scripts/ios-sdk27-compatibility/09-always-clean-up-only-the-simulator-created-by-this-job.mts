import { array, object, objects, jsonObject, jsonArray, match, optionalMessage } from './contracts.mts'
type CommandRecord = { name?: string; label?: string; binary: string; arguments: string[]; exit_code: number | null; signal: NodeJS.Signals | null; error: unknown }
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const evidence = process.env.EVIDENCE_DIR!, report: Record<string, unknown> = { schema_version: 1, status: 'unresolved' };
const file = (name: string) => path.join(evidence, name);
const read = (name: string) => { assert.ok(lstatSync(file(name)).isFile() && !lstatSync(file(name)).isSymbolicLink()); return jsonObject(readFileSync(file(name), 'utf8')); };
const put = (name: string, value: string | Uint8Array) => writeFileSync(file(name), value, { flag: 'wx', mode: 0o600 });
const run = (name: string, args: string[], required = true) => {
  const result = spawnSync('xcrun', ['simctl', ...args], { encoding: 'utf8', timeout: 45000, maxBuffer: 16 * 1024 * 1024 });
  put(name + '.stdout.log', result.stdout ?? ''); put(name + '.stderr.log', result.stderr ?? '');
  put(name + '.exit.json', JSON.stringify({ exit_code: result.status, signal: result.signal, error: optionalMessage(result.error) ?? null }) + '\n');
  if (required) { assert.equal(result.error, undefined, name); assert.equal(result.status, 0, name); }
  return result;
};
const allDevices = (value: unknown) => {
  object(value);
  assert.ok(value.devices && typeof value.devices === 'object' && !Array.isArray(value.devices)); object(value.devices);
  const found = Object.entries(value.devices).flatMap(([runtime, rows]) => {
    assert.ok(Array.isArray(rows)); return objects(rows).map((device) => {
      match(device.udid, /^[A-Fa-f0-9]{8}(?:-[A-Fa-f0-9]{4}){3}-[A-Fa-f0-9]{12}$/);
      return { runtime, device } as { runtime: string; device: Record<string, unknown> & { udid: string } };
    });
  });
  assert.equal(new Set(found.map(({ device }) => device.udid.toUpperCase())).size, found.length);
  return found;
};
try {
  if (!existsSync(file('owned-simulator-intent.json'))) {
    assert.ok(!existsSync(file('create-simulator.exit.json')) && !existsSync(file('create-simulator.stdout.log')));
    report.status = 'not-created';
  } else {
    const intent = read('owned-simulator-intent.json');
    assert.equal(intent.repository, process.env.GITHUB_REPOSITORY); assert.equal(intent.source_head, process.env.EXPECTED_SOURCE_HEAD);
    assert.equal(intent.run_id, process.env.GITHUB_RUN_ID); assert.equal(intent.run_attempt, process.env.GITHUB_RUN_ATTEMPT);
    match(intent.token, /^[a-f0-9-]{36}$/);
    assert.equal(intent.name, `AILibrary-runtime27-${intent.run_id}-${intent.run_attempt}-${intent.token}`);
    const creation = read('create-simulator.exit.json');
    assert.equal(creation.exit_code, 0, 'Creation not proven; do not delete any device');
    assert.equal(creation.signal, null); assert.equal(creation.error, null);
    assert.equal(creation.binary, 'xcrun');
    assert.deepEqual(creation.arguments, ['simctl', 'create', intent.name, intent.device_type_identifier, intent.runtime_identifier]);
    const uuid = readFileSync(file('create-simulator.stdout.log'), 'utf8').trim().toUpperCase();
    match(uuid, /^[A-F0-9]{8}(?:-[A-F0-9]{4}){3}-[A-F0-9]{12}$/);
    assert.ok(Array.isArray(intent.preexisting_UUIDs)); assert.ok(!intent.preexisting_UUIDs.includes(uuid));
    const before = allDevices(read('devices-before-create.stdout.log'));
    assert.ok(before.every(({ device }) => String(device.udid).toUpperCase() !== uuid));
    if (existsSync(file('owned-simulator.json'))) {
      const owned = read('owned-simulator.json');
      assert.equal(owned.UUID, uuid); assert.equal(owned.token, intent.token);
      assert.equal(owned.name, intent.name); assert.equal(owned.runtime_identifier, intent.runtime_identifier);
    }
    report.UUID = uuid;
    const current = allDevices(jsonObject(run('cleanup-devices-before', ['list', 'devices', '--json']).stdout));
    const matches = current.filter(({ device }) => String(device.udid).toUpperCase() === uuid);
    assert.ok(matches.length <= 1, 'Ambiguous UUID ownership');
    if (matches.length === 0) report.status = 'already-absent';
    else {
      const { runtime, device } = matches[0];
      assert.equal(runtime, intent.runtime_identifier); assert.equal(device.name, intent.name);
      if (device.deviceTypeIdentifier !== undefined) assert.equal(device.deviceTypeIdentifier, intent.device_type_identifier);
      let shutdown;
      if (device.state === 'Shutdown') report.shutdown = 'already-shutdown';
      else { shutdown = run('cleanup-shutdown', ['shutdown', uuid], false); report.shutdown_exit_code = shutdown.status; }
      // Even a shutdown error must not prevent a delete attempt of this proven owned UUID.
      const deletion = run('cleanup-delete', ['delete', uuid], false);
      report.delete_exit_code = deletion.status;
      const after = allDevices(jsonObject(run('cleanup-devices-after', ['list', 'devices', '--json']).stdout));
      assert.ok(after.every(({ device }) => String(device.udid).toUpperCase() !== uuid));
      assert.equal(deletion.error, undefined); assert.equal(deletion.status, 0);
      if (shutdown) { assert.equal(shutdown.error, undefined); assert.equal(shutdown.status, 0); }
      report.status = 'owned-simulator-deleted';
    }
  }
} catch (error) { report.error = String(error); throw error; }
finally { put('cleanup.json', JSON.stringify(report, null, 2) + '\n'); }
