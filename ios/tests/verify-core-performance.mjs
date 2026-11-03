import assert from 'node:assert/strict';
import { constants } from 'node:fs';
import { lstat, open } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CORE_SOURCES, SCENARIOS, idsDigest, inventoryCorpus, sha256, summarize, targetSpec, validateRecord } from './core-performance-runner.mjs';

// Preregistered byte contract from cb66343ddc18f28f780b8f240c07910839e7cc6a.
// Revision provenance is supplied independently by the caller; JSON is not a signature.
export const BYTE_CONTRACT = Object.freeze({
  production_source_sha256: Object.freeze({
    'ios/AILibrary/Sources/Models.swift': 'f355ff9ae41e39d3c78224c097afc7e6d64ce59ac91740ee57868c56068534af',
    'ios/AILibrary/Sources/NativeDocument.swift': 'ce96e4960eef766e325b1b4b7d3701d4a7d5b5c3b1e69ae9599fd0f2622af2ab',
    'ios/AILibrary/Sources/ContentValidator.swift': 'ffcdab90f0a8f39fc8b7cfceea0ba48aac7f18df1c033b237d2da311562e385a',
    'ios/AILibrary/Sources/ReadingStore.swift': 'd3dcbb95874b8f377d0f4a528425e75adca525f6329869a06d2e1eb895ed118f'
  }),
  harness_sha256: '92d8005e1d0fe98008e6deeff54773ee0866e0fb75c4b9dc80ce5507a03d71aa',
  runner_sha256: '4276643f3c0df1e21d62f020c0ebd5ec32639b536fa6933806e7ad611edcaf5f',
  query_source_sha256: '3bb988b77a8d8da65ae3e401d092a3ff5cfdebbad73e11e99c5efd6fb8d98eb7',
  query_sha256: '39995c2b75ba04eec4e1dc610b35c28b1b0f386cc5b250eaeab5211d13cfa31b',
  query_count: 16, expected_article_count: 199,
  expected_count_method: 'independent immutable docs NN-section Markdown front-matter status scanner',
  published_sources_sha256: '4ba18c1b5d72fdd3acfdac32ece203a1d8c2a1bbf7c11fa9a0a4169c1feacaee'
});
const MiB = 1_048_576;
const digest = /^[a-f0-9]{64}$/;
const isDigest = value => typeof value === 'string' && digest.test(value);
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const exactKeys = (value, keys) => {
  assert(value && typeof value === 'object' && !Array.isArray(value), 'Expected object');
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort(), 'Unexpected/missing fields');
};
const nonempty = value => typeof value === 'string' && value.length > 0 && value.length <= 8192 && !/[\x00-\x1f\x7f]/.test(value);
const positiveInteger = value => Number.isSafeInteger(value) && value > 0;
const absolute = value => nonempty(value) && path.isAbsolute(value) && path.resolve(value) === value;
const numericVersion = value => typeof value === 'string' && /^\d+(?:\.\d+){0,2}$/.test(value) && value.split('.').every(part => Number.isSafeInteger(Number(part)));
const contains = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
};

async function realDirectory(location) {
  assert(absolute(location), 'Use a normalized absolute directory path');
  let current = path.parse(location).root;
  for (const part of location.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    const info = await lstat(current);
    assert(!info.isSymbolicLink() && info.isDirectory(), 'Directory symlink/special ancestor rejected');
  }
  return location;
}

// Read only caller-selected directories and fixed basenames. Saved command/path strings
// are compared as metadata, never opened or executed. Bound before and during reads.
async function boundedFile(directory, name, maximum) {
  assert(path.basename(name) === name && name !== '.' && name !== '..', 'Unsafe artifact basename');
  await realDirectory(directory);
  const location = path.join(directory, name), before = await lstat(location);
  assert(before.isFile() && !before.isSymbolicLink() && before.size <= maximum, `Artifact missing, special, linked or oversized: ${name}`);
  const handle = await open(location, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const opened = await handle.stat();
    assert(opened.isFile() && opened.dev === before.dev && opened.ino === before.ino && opened.size === before.size, `Artifact changed: ${name}`);
    const chunks = []; let bytes = 0;
    while (true) {
      const chunk = Buffer.alloc(Math.min(64 * 1024, maximum + 1 - bytes));
      const { bytesRead } = await handle.read(chunk, 0, chunk.length, null);
      if (bytesRead === 0) break;
      bytes += bytesRead; assert(bytes <= maximum, `Artifact size bound exceeded: ${name}`);
      chunks.push(chunk.subarray(0, bytesRead));
    }
    const after = await handle.stat(), entry = await lstat(location);
    assert(bytes === before.size && after.size === before.size && after.mtimeMs === before.mtimeMs && after.ctimeMs === before.ctimeMs &&
      entry.dev === before.dev && entry.ino === before.ino && !entry.isSymbolicLink(), `Artifact changed while reading: ${name}`);
    return Buffer.concat(chunks, bytes);
  } finally { await handle.close(); }
}

function finiteJSON(value, depth = 0) {
  assert(depth <= 32, 'JSON nesting bound exceeded');
  if (typeof value === 'number') assert(Number.isFinite(value), 'Nonfinite metadata');
  else if (typeof value === 'string') assert(value.length <= 8192, 'Metadata string bound exceeded');
  else if (value && typeof value === 'object') for (const item of Object.values(value)) finiteJSON(item, depth + 1);
}
async function artifactJSON(directory, name, maximum) {
  const data = await boundedFile(directory, name, maximum), value = JSON.parse(data);
  finiteJSON(value);
  return { data, value };
}

function validateToolchain(identity) {
  const selection = identity.toolchain_selection;
  exactKeys(selection, ['mode', 'requested', 'resolved', 'invocation', 'compiler_default_target', 'host_process_architecture', 'sdk']);
  exactKeys(selection.requested, ['swiftc', 'sdk', 'target', 'swift_version']);
  exactKeys(selection.resolved, ['swiftc', 'sdk', 'target', 'swift_version']);
  exactKeys(selection.invocation, ['swiftc', 'sdk']);
  exactKeys(selection.sdk, ['canonical_name', 'version', 'settings_sha256']);
  assert(['explicit', 'xcrun-defaults'].includes(selection.mode), 'Unknown toolchain selection');
  assert([selection.requested.swiftc, selection.requested.sdk, selection.resolved.swiftc, selection.resolved.sdk,
    selection.invocation.swiftc, selection.invocation.sdk].every(absolute), 'Invalid compiler/SDK path metadata');
  assert(selection.invocation.swiftc === selection.requested.swiftc && selection.invocation.sdk === selection.resolved.sdk, 'Compiler/SDK invocation mismatch');
  assert(selection.resolved.swift_version === '5', 'Preregistered Swift5 mode required');
  const target = targetSpec(selection.resolved.target), defaultTarget = targetSpec(selection.compiler_default_target);
  assert([...target.version, ...defaultTarget.version].every(Number.isSafeInteger), 'Invalid numeric target version');
  const hostArch = selection.host_process_architecture === 'x64' ? 'x86_64' : selection.host_process_architecture;
  assert(target.architecture === hostArch && defaultTarget.architecture === hostArch && identity.executable_architecture === hostArch, 'Target/host architecture mismatch');
  assert(identity.os.architecture === selection.host_process_architecture, 'OS/toolchain host architecture mismatch');
  if (selection.mode === 'explicit') assert(selection.requested.target === selection.resolved.target && selection.requested.swift_version === '5', 'Explicit selector mismatch');
  else assert(selection.requested.target === null && selection.requested.swift_version === null && selection.resolved.target === selection.compiler_default_target, 'Default selector mismatch');
  const compilerMajor = Number(identity.compiler_version.match(/^Apple Swift version (\d+)\./m)?.[1]);
  assert(Number.isSafeInteger(compilerMajor) && compilerMajor >= 5 && identity.compiler_version.match(/^Target: ([^\r\n]+)$/m)?.[1] === selection.compiler_default_target, 'Compiler version/default target mismatch');
  assert(numericVersion(selection.sdk.version) && selection.sdk.canonical_name === `macosx${selection.sdk.version}` && isDigest(selection.sdk.settings_sha256), 'Invalid SDK metadata');
  const sdk = selection.sdk.version.split('.').map(Number);
  for (let index = 0; index < 3; index++) {
    const difference = (target.version[index] ?? 0) - (sdk[index] ?? 0);
    if (difference !== 0) { assert(difference < 0, 'Target exceeds SDK version'); break; }
  }
  const command = identity.compiler_command;
  assert(Array.isArray(command) && command.length === 19 && command.every(nonempty), 'Invalid compiler command');
  const executable = command.at(-1);
  assert(absolute(executable) && path.basename(executable) === 'published-core-benchmark', 'Invalid saved executable path');
  const output = path.dirname(executable);
  const flags = ['-parse-as-library', '-swift-version', '5', '-O', '-whole-module-optimization', '-target', selection.resolved.target,
    '-sdk', selection.resolved.sdk, '-module-cache-path', path.join(output, 'module-cache')];
  assert.deepEqual(identity.compiler_flags, flags, 'Compiler flags differ from preregistered optimized profile');
  assert.deepEqual(command, [selection.invocation.swiftc, ...flags, ...CORE_SOURCES.map(source => path.join(output, path.basename(source))),
    path.join(output, 'PublishedCoreBenchmark.swift'), '-o', executable], 'Compiler command/source order mismatch');
  assert.deepEqual(identity.spawn_environment, { keys: ['PATH', 'TMPDIR'], TMPDIR: path.join(output, '.process-tmp') + path.sep,
    temp_mode: '0700', operator_TMPDIR_inherited: false, caller_env_overrides_forwarded: false }, 'Spawn environment mismatch');
  return { output, executable };
}

function validateIdentity(identity, revision, contract) {
  exactKeys(identity, ['schema_version', 'source_revision', ...Object.keys(contract), 'manifest_sha256', 'corpus_sha256',
    'files_including_manifest', 'listed_sha_files', 'bytes_including_manifest', 'png_files', 'corpus_revision', 'article_order_sha256',
    'compiler_version', 'compiler_flags', 'compiler_command', 'toolchain_selection', 'spawn_environment', 'executable_sha256',
    'executable_architecture', 'os', 'clock', 'memory', 'protocol']);
  assert(identity.schema_version === 1 && identity.source_revision === revision, 'Expected source revision mismatch');
  for (const [name, expected] of Object.entries(contract)) assert.deepEqual(identity[name], expected, `Preregistered byte identity mismatch: ${name}`);
  for (const name of ['manifest_sha256', 'corpus_sha256', 'article_order_sha256', 'executable_sha256']) assert(isDigest(identity[name]), `Invalid ${name}`);
  for (const name of ['files_including_manifest', 'listed_sha_files', 'bytes_including_manifest']) assert(positiveInteger(identity[name]), `Invalid ${name}`);
  assert(identity.files_including_manifest === identity.listed_sha_files + 1 && identity.files_including_manifest <= 4096 &&
    identity.bytes_including_manifest <= 256 * MiB && Number.isSafeInteger(identity.png_files) && identity.png_files >= 0 &&
    identity.png_files <= identity.listed_sha_files && nonempty(identity.corpus_revision), 'Invalid corpus metadata');
  exactKeys(identity.os, ['platform', 'release', 'version', 'architecture']);
  assert(identity.os.platform === 'darwin' && nonempty(identity.os.release) && nonempty(identity.os.version), 'Darwin host OS metadata required');
  assert(typeof identity.compiler_version === 'string' && identity.compiler_version.length > 0, 'Missing compiler version');
  assert.deepEqual(identity.clock, { source: 'DispatchTime.now().uptimeNanoseconds', unit: 'seconds', scope: 'elapsed monotonic wall time of named production operation' });
  assert.deepEqual(identity.memory, { source: 'Darwin getrusage(RUSAGE_SELF).ru_maxrss', unit: 'bytes',
    scope: 'whole fresh host process high-water through post-work pre-JSON probe; includes setup and post-timing result digests',
    unit_evidence: 'Darwin getrusage(2) ru_maxrss: maximum resident set size utilized (in bytes); independently verified local primary manual, see core-performance.md' });
  assert.deepEqual(identity.protocol, { warmup_per_scenario: 1, recorded_per_scenario: 5, fresh_process_each_invocation: true,
    sample_timeout_ms: 60_000, sample_output_max_bytes: MiB, total_deadline_ms: 900_000, corpus_file_cache: 'warmed by inventory SHA checks; no cold-disk claim' });
  return validateToolchain(identity);
}

async function verifyWithContract({ observation, corpus, revision }, contract, trustedRunnerDirectory) {
  assert(typeof revision === 'string' && /^[a-f0-9]{40}$/.test(revision), 'Expected immutable full source revision required');
  await realDirectory(observation); await realDirectory(corpus);
  assert(!contains(observation, corpus) && !contains(corpus, observation), 'Observation and corpus overlap');
  assert.equal(sha256(await boundedFile(trustedRunnerDirectory, 'core-performance-runner.mjs', MiB)), contract.runner_sha256, 'Trusted runner artifact contract changed');
  const { data: identityData, value: identity } = await artifactJSON(observation, 'identity.json', MiB);
  const saved = validateIdentity(identity, revision, contract), identityHash = sha256(identityData);
  for (const source of CORE_SOURCES) assert.equal(sha256(await boundedFile(observation, path.basename(source), MiB)), contract.production_source_sha256[source], `Frozen source mismatch: ${source}`);
  for (const [name, hash] of [['PublishedCoreBenchmark.swift', contract.harness_sha256], ['core-performance-queries.json', contract.query_sha256],
    ['published-core-benchmark', identity.executable_sha256]]) assert.equal(sha256(await boundedFile(observation, name, name === 'published-core-benchmark' ? 64 * MiB : MiB)), hash, `Frozen artifact mismatch: ${name}`);
  await boundedFile(observation, 'compiler.stderr.txt', MiB);
  const inventory = await inventoryCorpus(corpus), { manifest, ...counts } = inventory;
  for (const [name, value] of Object.entries(counts)) assert.equal(identity[name], value, `Corpus inventory mismatch: ${name}`);
  assert(manifest.revision === identity.corpus_revision && manifest.articles.length === identity.expected_article_count, 'Corpus revision/count mismatch');
  const sources = manifest.articles.map(article => {
    assert(article && nonempty(article.id) && typeof article.source_path === 'string' && /^docs\/\d{2}-[a-z0-9-]+\/[a-z0-9-]+\.md$/.test(article.source_path) &&
      isDigest(article.source_sha256), 'Invalid manifest article identity');
    return [article.source_path, article.source_sha256];
  }).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
  assert.equal(new Set(manifest.articles.map(article => article.id)).size, manifest.articles.length, 'Duplicate article ID');
  assert.equal(new Set(sources.map(source => source[0])).size, sources.length, 'Duplicate source path');
  assert.equal(sha256(json(sources)), contract.published_sources_sha256, 'Published source corpus mismatch');
  assert.equal(idsDigest(manifest.articles.map(article => article.id)), identity.article_order_sha256, 'Corpus article order mismatch');
  const { value: summary } = await artifactJSON(observation, 'summary.json', 2 * MiB);
  exactKeys(summary, ['schema_version', 'status', 'identity_sha256', 'order', 'scenarios', 'elapsed_runner_seconds', 'limits']);
  assert(summary.schema_version === 1 && summary.status === 'observed-host-baseline' && summary.identity_sha256 === identityHash, 'Summary identity mismatch');
  assert(typeof summary.elapsed_runner_seconds === 'number' && summary.elapsed_runner_seconds > 0 && summary.elapsed_runner_seconds <= 901, 'Invalid runner elapsed time');
  assert.deepEqual(summary.limits, ['No timing threshold or SLO acceptance', 'No p95 estimate from five samples', 'Not iOS app memory/input latency/scrolling/image decoding',
    'RSS is not isolated allocation size; do not subtract high-water marks', 'IOS-15 remains open']);
  assert(Array.isArray(summary.order) && summary.order.length === 19 && Array.isArray(summary.scenarios) && summary.scenarios.length === 3, 'Incomplete 19-process/three-scenario protocol');
  const expectedOrder = [{ mode: 'correctness', kind: 'correctness', ordinal: 0 }];
  for (const mode of SCENARIOS) {
    expectedOrder.push({ mode, kind: 'discarded-warmup', ordinal: 0 });
    for (let ordinal = 1; ordinal <= 5; ordinal++) expectedOrder.push({ mode, kind: 'recorded', ordinal });
  }
  const pids = new Set(), ids = new Set(), records = [];
  let savedCorpus, hostOS;
  for (const [index, expected] of expectedOrder.entries()) {
    const entry = summary.order[index];
    exactKeys(entry, ['mode', 'kind', 'ordinal', 'process_id', 'invocation_id', 'command', 'raw_file']);
    for (const [name, value] of Object.entries(expected)) assert.equal(entry[name], value, 'Invocation order/warmup mismatch');
    assert(positiveInteger(entry.process_id) && !pids.has(entry.process_id) && uuid.test(entry.invocation_id) && !ids.has(entry.invocation_id), 'Duplicate/invalid PID or invocation UUID');
    pids.add(entry.process_id); ids.add(entry.invocation_id);
    const name = `${String(index).padStart(2, '0')}-${expected.mode === 'correctness' ? 'correctness' : expected.mode.split('.')[1]}-${expected.kind}-${expected.ordinal}`;
    assert.equal(entry.raw_file, `${name}.json`, 'Unexpected raw basename');
    assert(Array.isArray(entry.command) && entry.command.length === 6, 'Invalid invocation command');
    savedCorpus ??= entry.command[2];
    assert(absolute(savedCorpus), 'Invalid saved corpus path');
    assert.deepEqual(entry.command, [saved.executable, expected.mode, savedCorpus, path.join(saved.output, 'core-performance-queries.json'),
      path.join(saved.output, 'identity.json'), entry.invocation_id], 'Invocation command mismatch');
    const { data: rawData, value: record } = await artifactJSON(observation, entry.raw_file, MiB);
    validateRecord(record, identity, identityHash, expected.mode, entry.invocation_id, records[0], entry.process_id);
    if (expected.mode !== 'correctness') assert(record.wall_seconds <= identity.protocol.sample_timeout_ms / 1000, 'Raw timed region exceeds subprocess lifetime bound');
    assert(nonempty(record.host_os_version), 'Invalid raw host OS metadata');
    hostOS ??= record.host_os_version; assert.equal(record.host_os_version, hostOS, 'Raw host OS changed');
    const stderrData = await boundedFile(observation, `${name}.stderr.txt`, MiB);
    assert(rawData.length + stderrData.length <= identity.protocol.sample_output_max_bytes, 'Combined invocation stdout/stderr exceeds runner output bound');
    records.push(record);
  }
  for (const [index, scenario] of summary.scenarios.entries()) {
    exactKeys(scenario, ['scenario', 'discarded_warmup', 'raw_samples', 'descriptive']);
    assert.equal(scenario.scenario, SCENARIOS[index], 'Scenario order mismatch');
    assert.deepEqual(scenario.discarded_warmup, records[1 + index * 6], 'Warmup raw mismatch');
    const samples = records.slice(2 + index * 6, 7 + index * 6);
    assert.deepEqual(scenario.raw_samples, samples, 'Recorded raw mismatch');
    assert.deepEqual(scenario.descriptive, summarize(samples), 'Recalculated descriptive statistics mismatch');
  }
  // collectSamples awaits correctness plus 18 nonoverlapping timed warmup/sample
  // processes. Date.now() records integer milliseconds at both runner endpoints:
  // their difference can underreport an unchanged wall clock by less than 1 ms.
  // Allow only that quantization and a binary64 roundoff bound for one division
  // per raw region plus their sum; the watchdog's shutdown second is not work time.
  const timed = records.filter(record => record.mode !== 'correctness');
  const timedSeconds = timed.reduce((sum, record) => sum + record.wall_seconds, 0);
  const deadlineSeconds = identity.protocol.total_deadline_ms / 1000;
  const roundoffSeconds = Number.EPSILON * 2 * timed.length * Math.max(1, timedSeconds, deadlineSeconds, summary.elapsed_runner_seconds);
  assert(timedSeconds <= deadlineSeconds + roundoffSeconds, 'Sequential timed regions exceed total runner deadline');
  assert(timedSeconds <= summary.elapsed_runner_seconds + 0.001 + roundoffSeconds, 'Sequential timed regions exceed runner elapsed time');
  // Detect corpus drift during the read-only replay, using the runner's same bounded inventory.
  assert.equal((await inventoryCorpus(corpus)).corpus_sha256, inventory.corpus_sha256, 'Corpus changed during verification');
  return { schema_version: 1, status: 'accepted-host-observation', source_revision: revision, identity_sha256: identityHash,
    corpus_sha256: inventory.corpus_sha256, raw_invocations: 19, measured_samples: 15, performance_budget: 'unadopted',
    revision_provenance: 'caller must independently bind expected revision to preregistered frozen bytes; no Git/signature verification',
    scope: 'saved optimized macOS host CLI observation consistency; no new execution, iOS Release/device acceptance or IOS-15 completion' };
}

// Trusted JavaScript policy only, fixed before candidate IO. Neither candidate
// metadata nor CLI flags/environment/files may choose this contract or directory.
// A small synthetic policy tests the same implementation without live library bytes.
function validateTrustedByteContract(contract) {
  exactKeys(contract, Object.keys(BYTE_CONTRACT));
  exactKeys(contract.production_source_sha256, CORE_SOURCES);
  assert(Object.values(contract.production_source_sha256).every(isDigest), 'Invalid trusted production source SHA');
  for (const name of ['harness_sha256', 'runner_sha256', 'query_source_sha256', 'query_sha256', 'published_sources_sha256']) assert(isDigest(contract[name]), `Invalid trusted ${name}`);
  assert(positiveInteger(contract.query_count) && contract.query_count <= 4096, 'Invalid trusted query count');
  assert(positiveInteger(contract.expected_article_count) && contract.expected_article_count <= 2000, 'Invalid trusted article count');
  assert(nonempty(contract.expected_count_method), 'Invalid trusted expected count method');
}

export function createObservationVerifier(policy) {
  exactKeys(policy, ['trustedByteContract', 'trustedRunnerDirectory']);
  assert(absolute(policy.trustedRunnerDirectory), 'Invalid trusted runner directory');
  const trustedRunnerDirectory = policy.trustedRunnerDirectory;
  validateTrustedByteContract(policy.trustedByteContract); // Bound shape/values before cloning.
  const contract = structuredClone(policy.trustedByteContract);
  validateTrustedByteContract(contract);
  Object.freeze(contract.production_source_sha256); Object.freeze(contract);
  return async function verifyObservation(options) {
    exactKeys(options, ['observation', 'corpus', 'revision']);
    return verifyWithContract(options, contract, trustedRunnerDirectory);
  };
}

// Production is one fixed instance. main() never constructs an injected instance.
export const verifyObservation = createObservationVerifier({ trustedByteContract: BYTE_CONTRACT,
  trustedRunnerDirectory: path.dirname(fileURLToPath(import.meta.url)) });

export function parseVerificationArgs(args) {
  if (args.length === 1 && args[0] === '--help') return null;
  assert(args.length === 6, 'Expected --observation <directory> --corpus <directory> --revision <40hex>');
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index];
    assert(['--observation', '--corpus', '--revision'].includes(name) && !Object.hasOwn(options, name), 'Unknown/duplicate verification argument');
    assert(typeof args[index + 1] === 'string' && args[index + 1].length > 0, 'Missing verification argument');
    options[name] = args[index + 1];
  }
  return { observation: options['--observation'], corpus: options['--corpus'], revision: options['--revision'] };
}

export async function main(args) {
  const options = parseVerificationArgs(args);
  if (!options) { console.log('Usage: node ios/tests/verify-core-performance.mjs --observation <absolute saved directory> --corpus <absolute preserved Content> --revision <expected 40hex>\nOffline read-only verification; no compiler, benchmark or saved command is executed. See core-performance.md.'); return; }
  console.log(json(await verifyObservation(options)).trimEnd());
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => { console.error(`Core observation rejected: ${error.message}`); process.exitCode = 1; });
}
