import { array, object, objects, jsonObject, jsonArray, match, optionalMessage, sourceHashes } from './contracts.mts'
type CommandRecord = { name?: string; label?: string; binary: string; arguments: string[]; exit_code: number | null; signal: NodeJS.Signals | null; error: unknown }
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const evidence = process.env.EVIDENCE_DIR!, commands: CommandRecord[] = [];
const put = (name: string, value: string | Uint8Array) => writeFileSync(path.join(evidence, name), value, { flag: 'wx', mode: 0o600 });
const read = (name: string, binary: string, args: string[]) => {
  const result = spawnSync(binary, args, { encoding: 'utf8', timeout: 120000, maxBuffer: 8 * 1024 * 1024 });
  put(name + '.stdout.log', result.stdout ?? ''); put(name + '.stderr.log', result.stderr ?? '');
  commands.push({ name, binary, arguments: args, exit_code: result.status, signal: result.signal, error: optionalMessage(result.error) ?? null });
  assert.equal(result.error, undefined, name); assert.equal(result.status, 0, name);
  return result.stdout.trim();
};
try {
  assert.equal(process.env.GITHUB_REPOSITORY, 'pero3dev/ai-agent-library');
  assert.equal(process.env.REPOSITORY_IS_PRIVATE, 'false');
  assert.equal(process.env.DEVELOPER_DIR, '/Applications/Xcode_27.app/Contents/Developer');
  assert.ok(existsSync(process.env.DEVELOPER_DIR), 'Documented Xcode must exist; no fallback');
  const macOS = read('macos', 'sw_vers', ['-productVersion']);
  const architecture = read('architecture', 'uname', ['-m']);
  assert.equal(macOS.split('.')[0], '27'); assert.equal(architecture, 'arm64');
  const Xcode = read('xcode', 'xcodebuild', ['-version']);
  const xcodeBuild = /^Xcode 27\.0\nBuild version ([A-Za-z0-9]+)$/.exec(Xcode)?.[1];
  assert.equal(xcodeBuild, '27A266a');
  assert.equal(Xcode, 'Xcode 27.0\nBuild version 27A266a');
  read('available-sdks', 'xcodebuild', ['-showsdks']);
  const sdk = read('iphoneos-sdk-version', 'xcrun', ['--sdk', 'iphoneos', '--show-sdk-version']);
  assert.equal(sdk, '27.0');
  const sdkBuild = read('iphoneos-sdk-build', 'xcrun', ['--sdk', 'iphoneos', '--show-sdk-build-version']);
  match(sdkBuild, /^[A-Za-z0-9]+$/);
  const sdkPath = read('iphoneos-sdk-path', 'xcrun', ['--sdk', 'iphoneos', '--show-sdk-path']);
  const head = read('source-head', 'git', ['rev-parse', 'HEAD']);
  match(head, /^[a-f0-9]{40}$/); assert.equal(head, process.env.EXPECTED_SOURCE_HEAD);
  const tree = read('source-tree', 'git', ['rev-parse', 'HEAD^{tree}']);
  put('toolchain.json', JSON.stringify({
    schema_version: 1, status: 'toolchain-verified', source_sha256: sourceHashes(), source_head: head, source_tree: tree,
    runner_label: 'xcode-27', standard_runner: true, repository: process.env.GITHUB_REPOSITORY,
    repository_private: false, macOS, architecture, Xcode, xcode_build: xcodeBuild, sdk, sdk_build: sdkBuild, sdk_path: sdkPath,
    developer_directory: process.env.DEVELOPER_DIR,
    image_OS: process.env.ImageOS ?? null, image_version: process.env.ImageVersion ?? null,
    Node: process.version, configuration: 'Release', destination: 'generic/platform=iOS',
    scope: 'Preview SDK27 unsigned archive experiment only; actual SDK build is captured and compared to archived App Info. No local OS, signing, distribution or device adoption.'
  }, null, 2) + '\n');
} finally { put('toolchain-commands.json', JSON.stringify(commands, null, 2) + '\n'); }
