import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, readFile, writeFile, chmod, rm, symlink, realpath } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, selectToolchain, compileCommand, runBounded, sha256, validateRecord } from '../../ios/tests/core-performance-runner.mjs';

const candidate = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baseArgs = ['--run', '--repo', '/repo', '--revision', 'a'.repeat(40), '--corpus', '/Content', '--output', '/new'];
const architecture = os.arch() === 'x64' ? 'x86_64' : os.arch();
const triple = `${architecture}-apple-macosx14.0`;
const otherArchitecture = architecture === 'arm64' ? 'x86_64' : 'arm64';
async function fixture(action, { compilerMajor = 6 } = {}) {
  const root = await mkdtemp(path.join(candidate, '.core-toolchain-test-'));
  try {
    const toolchainRoot = path.join(root, "tool chain 'literal'"), sdk = path.join(root, 'MacOSX15.2.sdk');
    await mkdir(toolchainRoot); await mkdir(sdk);
    const realCompiler = path.join(toolchainRoot, 'frontend-fixture');
    await writeFile(realCompiler, `#!${process.execPath}\nconst args=process.argv.slice(2);\nif(args.length===1&&args[0]==='--version')process.stdout.write(${JSON.stringify(`Apple Swift version ${compilerMajor}.0.3 (Node fixture)\nTarget: ${triple}\n`)});else process.stdout.write(JSON.stringify({args,fixture:true}));\n`);
    await chmod(realCompiler, 0o755);
    const compiler = path.join(toolchainRoot, 'swiftc'); await symlink('frontend-fixture', compiler);
    const sdkAlias = path.join(root, 'MacOSX.sdk'); await symlink('MacOSX15.2.sdk', sdkAlias);
    await writeFile(path.join(sdk, 'SDKSettings.json'), JSON.stringify({ CanonicalName: 'macosx15.2', Version: '15.2' }));
    const options = parseArgs([...baseArgs, '--swiftc', compiler, '--sdk', sdkAlias, '--target', triple, '--swift-version', '5']);
    return await action({ root, compiler, realCompiler, sdk, sdkAlias, options });
  } finally { await rm(root, { recursive: true, force: true }); }
}

test('strict CLI accepts all four selectors and rejects unknown/duplicate/partial/freeform flags', () => {
  const explicit = ['--swiftc', '/tool/swiftc', '--sdk', '/sdk', '--target', triple, '--swift-version', '5'];
  assert.equal(parseArgs([...baseArgs, ...explicit])['--swift-version'], '5');
  assert.equal(parseArgs(baseArgs)['--revision'], 'a'.repeat(40));
  for (const suffix of [
    ['--swiftc', '/compiler'], [...explicit, '--sdk', '/other'], [...explicit, '--compiler-args', '-Onone'],
    [...explicit, '--eval', 'process.exit(0)'], [...explicit, '--shell', '/bin/bash'],
    ['--swiftc', '/compiler', '--sdk', '/sdk', '--target', triple, '--swift-version', 'latest'],
    ['--swiftc', '/compiler', '--sdk', '/sdk', '--target', 'arm64-apple-ios17.0-simulator', '--swift-version', '5'],
    ['--swiftc', '/compiler', '--sdk', '/sdk', '--target', `${triple};touch /tmp/unwanted`, '--swift-version', '5']
  ]) assert.throws(() => parseArgs([...baseArgs, ...suffix]));
});

test('compiler and SDK symlinks resolve in identity while swiftc invocation name is retained', async () => {
  await fixture(async ({ compiler, realCompiler, sdk, sdkAlias, options }) => {
    const selected = await selectToolchain(options);
    assert.equal(selected.compiler, compiler);
    assert.equal(selected.sdk, await realpath(sdk));
    assert.equal(selected.selection.mode, 'explicit');
    assert.equal(selected.selection.requested.swiftc, compiler);
    assert.equal(selected.selection.requested.sdk, sdkAlias);
    assert.equal(selected.selection.resolved.swiftc, await realpath(realCompiler));
    assert.equal(selected.selection.resolved.sdk, await realpath(sdk));
    assert.equal(selected.selection.invocation.swiftc, compiler);
    assert.equal(selected.selection.invocation.sdk, await realpath(sdk));
  });
});

test('actual Node fake-compiler process receives exact typed Swift5/O/WMO/target/SDK flags and source argv', async () => {
  await fixture(async ({ root, compiler, sdk, options }) => {
    const selected = await selectToolchain(options);
    const sources = ['Models', 'NativeDocument', 'ContentValidator', 'ReadingStore'].map(name => path.join(root, `${name}.swift`));
    const harness = path.join(root, 'PublishedCoreBenchmark.swift'), output = path.join(root, 'binary'), cache = path.join(root, 'module cache');
    const command = compileCommand(selected, sources, harness, cache, output);
    assert.equal(command.executable, compiler);
    assert.deepEqual(command.flags, ['-parse-as-library', '-swift-version', '5', '-O', '-whole-module-optimization', '-target', triple, '-sdk', await realpath(sdk), '-module-cache-path', cache]);
    assert.deepEqual(command.args, [...command.flags, ...sources, harness, '-o', output]);
    const executed = await runBounded(command.executable, command.args);
    const actual = JSON.parse(executed.stdout);
    assert.deepEqual(actual.args, command.args);
    assert(actual.fixture);
    const identity = { compiler_command: [command.executable, ...command.args], compiler_flags: command.flags, toolchain_selection: selected.selection,
      executable_architecture: selected.architecture, manifest_sha256: 'a'.repeat(64), query_sha256: 'b'.repeat(64), query_count: 16,
      expected_article_count: 199, corpus_revision: 'fixture', article_order_sha256: 'c'.repeat(64) };
    const identityHash = sha256(JSON.stringify(identity));
    const raw = { schema_version: 1, mode: 'published-core.validation.v1', invocation_id: '11111111-1111-4111-8111-111111111111', process_id: executed.pid,
      identity_sha256: identityHash, manifest_sha256: identity.manifest_sha256, query_sha256: identity.query_sha256, query_count: 16,
      actual_article_count: 199, corpus_revision: 'fixture', article_order_sha256: identity.article_order_sha256,
      executable_architecture: architecture, host_os_version: 'fixture host', wall_seconds: 1, process_peak_resident_bytes: 1024 };
    validateRecord(raw, identity, identityHash, raw.mode, raw.invocation_id, null, executed.pid);
    assert.throws(() => validateRecord({ ...raw, identity_sha256: 'd'.repeat(64) }, identity, identityHash, raw.mode, raw.invocation_id, null, executed.pid));
    assert.throws(() => validateRecord({ ...raw, executable_architecture: otherArchitecture }, identity, identityHash, raw.mode, raw.invocation_id, null, executed.pid));
  });
});

test('default selection records xcrun paths/default target and explicit Swift5 mode without real xcrun', async () => {
  await fixture(async ({ compiler, sdkAlias }) => {
    const calls = [];
    const bounded = async (executable, args) => {
      calls.push([executable, args]);
      if (executable === '/usr/bin/xcrun') return { stdout: Buffer.from(args[0] === '--find' ? compiler : sdkAlias) };
      return runBounded(executable, args);
    };
    const selected = await selectToolchain(parseArgs(baseArgs), bounded);
    assert.equal(selected.target, triple); assert.equal(selected.swiftVersion, '5');
    assert.equal(selected.selection.mode, 'xcrun-defaults');
    assert.equal(selected.selection.requested.target, null); assert.equal(selected.selection.requested.swift_version, null);
    assert.deepEqual(calls.slice(0, 2), [['/usr/bin/xcrun', ['--find', 'swiftc']], ['/usr/bin/xcrun', ['--show-sdk-path']]]);
  });
});

test('invalid architecture/deployment/SDK/platform/missing paths fail before any compile', async () => {
  await fixture(async ({ root, sdk, options }) => {
    await assert.rejects(selectToolchain({ ...options, '--target': `${otherArchitecture}-apple-macosx14.0` }), /architecture/);
    await assert.rejects(selectToolchain(options, runBounded, 'unsupported'), /architecture/);
    await assert.rejects(selectToolchain({ ...options, '--target': `${architecture}-apple-macosx16.0` }), /exceeds/);
    await assert.rejects(selectToolchain({ ...options, '--sdk': path.join(root, 'absent') }), /ENOENT/);
    await assert.rejects(selectToolchain({ ...options, '--swiftc': sdk }), /file/);
    const nonExecutable = path.join(root, 'not-executable'); await writeFile(nonExecutable, 'fixture'); await chmod(nonExecutable, 0o600);
    await assert.rejects(selectToolchain({ ...options, '--swiftc': nonExecutable }), /EACCES/);
    await writeFile(path.join(sdk, 'SDKSettings.json'), JSON.stringify({ CanonicalName: 'iphonesimulator18.2', Version: '18.2' }));
    await assert.rejects(selectToolchain(options), /macOS SDK/);
    await writeFile(path.join(sdk, 'SDKSettings.json'), JSON.stringify({ CanonicalName: 'macosx15.2', Version: 'unknown' }));
    await assert.rejects(selectToolchain(options), /macOS SDK/);
  });
});

test('Swift6 mode cannot be selected with a Swift5 compiler; unknown mode is rejected', async () => {
  await fixture(async ({ options }) => {
    await assert.rejects(selectToolchain({ ...options, '--swift-version': '6' }), /unsupported/);
    await assert.rejects(selectToolchain({ ...options, '--swift-version': '4.2' }), /unsupported/);
  }, { compilerMajor: 5 });
});
