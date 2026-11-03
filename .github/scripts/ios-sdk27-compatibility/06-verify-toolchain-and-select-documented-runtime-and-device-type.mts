import { array, object, objects, record, jsonObject, jsonArray, match, optionalMessage, sourceHashes } from './contracts.mts'
type CommandRecord = { name?: string; label?: string; binary: string; arguments: string[]; exit_code: number | null; signal: NodeJS.Signals | null; error: unknown }
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const evidence = process.env.EVIDENCE_DIR!;
const put = (name: string, value: string | Uint8Array) => writeFileSync(path.join(evidence, name), value, { flag: 'wx', mode: 0o600 });
const json = (name: string, value: unknown) => put(name, JSON.stringify(value, null, 2) + '\n');
const inventoryStartedMonotonicMs = performance.now();
const inventoryDeadlineMonotonicMs = inventoryStartedMonotonicMs + 150000;
const read = (name: string, binary: string, args: string[]) => {
  const readMonotonicMs = performance.now();
  const remainingBudgetMs = Math.floor(inventoryDeadlineMonotonicMs - readMonotonicMs);
  const timeoutMs = Math.min(120000, Math.max(0, remainingBudgetMs));
  json(name + '.intent.json', { schema_version: 1, binary, arguments: args,
    timeout_ms: timeoutMs, remaining_budget_ms: remainingBudgetMs,
    started_monotonic_ms: inventoryStartedMonotonicMs, deadline_monotonic_ms: inventoryDeadlineMonotonicMs,
    read_monotonic_ms: readMonotonicMs, spawn_planned: remainingBudgetMs > 0 });
  let result;
  if (remainingBudgetMs <= 0) {
    result = { status: null, signal: null, stdout: '', stderr: '',
      error: new Error('Inventory read budget exhausted before spawn') };
  } else {
    try {
      result = spawnSync(binary, args, { encoding: 'utf8', timeout: timeoutMs,
        killSignal: 'SIGKILL', maxBuffer: 16 * 1024 * 1024 });
    } catch (error) {
      result = { status: null, signal: null, stdout: '', stderr: '',
        error: error ?? new Error('Unknown inventory spawn exception') };
    }
  }
  put(name + '.stdout.log', result.stdout ?? ''); put(name + '.stderr.log', result.stderr ?? '');
  json(name + '.exit.json', { binary, arguments: args, exit_code: result.status, signal: result.signal,
    error: optionalMessage(result.error) ?? (result.error === undefined ? null : String(result.error)) });
  assert.equal(result.error, undefined, name); assert.equal(result.status, 0, name);
  assert.ok(performance.now() < inventoryDeadlineMonotonicMs, name + ': inventory deadline exceeded');
  return result.stdout.trim();
};
assert.equal(process.env.GITHUB_REPOSITORY, 'pero3dev/ai-agent-library');
assert.equal(process.env.REPOSITORY_IS_PRIVATE, 'false');
assert.equal(process.env.DEVELOPER_DIR, '/Applications/Xcode_27.app/Contents/Developer');
assert.ok(existsSync(process.env.DEVELOPER_DIR), 'Documented Xcode missing; no fallback or download');
const macOS = read('macos', 'sw_vers', ['-productVersion']);
const architecture = read('architecture', 'uname', ['-m']);
const Xcode = read('xcode', 'xcodebuild', ['-version']);
assert.equal(macOS.split('.')[0], '27'); assert.equal(architecture, 'arm64');
assert.equal(Xcode, 'Xcode 27.0\nBuild version 27A266a');
const sdk = read('simulator-sdk-version', 'xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-version']);
assert.equal(sdk, '27.0');
const sdkBuild = read('simulator-sdk-build', 'xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-build-version']);
const sdkPath = read('simulator-sdk-path', 'xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-path']);
match(sdkBuild, /^[A-Za-z0-9]+$/); assert.ok(path.isAbsolute(sdkPath) && existsSync(sdkPath));
const head = read('source-head', 'git', ['rev-parse', 'HEAD']);
match(head, /^[a-f0-9]{40}$/); assert.equal(head, process.env.EXPECTED_SOURCE_HEAD);
const tree = read('source-tree', 'git', ['rev-parse', 'HEAD^{tree}']);
match(tree, /^[a-f0-9]{40}$/);
const runtimeInventory = jsonObject(read('simctl-runtimes', 'xcrun', ['simctl', 'list', 'runtimes', '--json']));
const typeInventory = jsonObject(read('simctl-device-types', 'xcrun', ['simctl', 'list', 'devicetypes', '--json']));
assert.ok(Array.isArray(runtimeInventory.runtimes)); assert.ok(Array.isArray(typeInventory.devicetypes));
const iosVersionRows = runtimeInventory.runtimes.filter((row): row is Record<string, unknown> => record(row) && row.version === '27.0' &&
  (row.platform === 'iOS' || row.name === 'iOS 27.0' || String(row.identifier).startsWith('com.apple.CoreSimulator.SimRuntime.iOS-')));
for (const row of iosVersionRows) {
  assert.equal(row.name, 'iOS 27.0');
  match(row.identifier, /^com\.apple\.CoreSimulator\.SimRuntime\.iOS-[A-Za-z0-9.-]+$/);
  assert.equal(typeof row.isAvailable, 'boolean', 'Unknown availability must fail closed');
  if (row.platform !== undefined) assert.equal(row.platform, 'iOS');
}
const available = iosVersionRows.filter((row) => row.isAvailable === true);
assert.equal(available.length, 1, 'Exactly one available iOS 27.0 runtime is required');
const runtime = available[0];
assert.equal(typeof runtime.buildversion, 'string'); assert.ok((runtime.buildversion as string).length > 0);
const types = typeInventory.devicetypes.filter((row): row is Record<string, unknown> => record(row) && row.name === 'iPhone 17');
assert.equal(types.length, 1, 'Exactly one iPhone 17 device type is required');
const deviceType = types[0];
match(deviceType.identifier, /^com\.apple\.CoreSimulator\.SimDeviceType\.[A-Za-z0-9.-]+$/);
if (deviceType.productFamily !== undefined) assert.equal(deviceType.productFamily, 'iPhone');
json('selection.json', { schema_version: 1, source_sha256: sourceHashes(() => assert.ok(performance.now() < inventoryDeadlineMonotonicMs, 'Inventory source binding deadline exceeded')), status: 'selected-from-actual-inventory', source_head: head,
  source_tree: tree, repository: process.env.GITHUB_REPOSITORY, repository_private: false,
  runner_label: 'xcode-27', standard_runner: true, macOS, architecture, Xcode,
  developer_directory: process.env.DEVELOPER_DIR, image_OS: process.env.ImageOS ?? null,
  image_version: process.env.ImageVersion ?? null, sdk, sdk_build: sdkBuild, sdk_path: sdkPath,
  runtime, device_type: deviceType,
  inventory_reference: 'https://github.com/actions/runner-images/blob/main/images/macos/xcode-27-arm64-Readme.md#installed-simulators',
  scope: 'Preview iOS27.0 representative smoke only; actual runtime build is captured from inventory. No minimum-iOS17, device, VoiceOver or performance acceptance.' });
