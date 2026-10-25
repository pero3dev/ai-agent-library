import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { lstat, stat, access, readFile, readdir, mkdir, writeFile, realpath } from 'node:fs/promises';
import { constants, lstatSync, realpathSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SCENARIOS = ['published-core.validation.v1', 'published-core.index-construction.v1', 'published-core.indexed-filter.v1'];
export const CORE_SOURCES = ['Models.swift', 'NativeDocument.swift', 'ContentValidator.swift', 'ReadingStore.swift'].map(name => `ios/AILibrary/Sources/${name}`);
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const digestPattern = /^[a-f0-9]{64}$/;
const integer = value => Number.isSafeInteger(value) && value > 0;
const exactKeys = (value, keys) => assert.deepEqual(Object.keys(value).sort(), [...keys].sort());
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const activeChildren = new Set();
const ownedTempRoots = new Map();
const maximumFiles = 4096;
const maximumBytes = 256 * 1024 * 1024;

function validatePrivateTempRoot(context) {
  assert(context && ownedTempRoots.get(context.root) === context, 'Unregistered private temp ownership');
  assert(path.isAbsolute(context.root) && path.dirname(context.root) === context.parent, 'Private temp must stay inside its absolute owner directory');
  const parent = lstatSync(context.parent), root = lstatSync(context.root), marker = lstatSync(context.marker);
  assert(parent.isDirectory() && !parent.isSymbolicLink() && realpathSync(context.parent) === context.parent &&
    parent.dev === context.parentDev && parent.ino === context.parentIno && parent.uid === context.uid, 'Private temp owner directory changed');
  assert(root.isDirectory() && !root.isSymbolicLink() && realpathSync(context.root) === context.root &&
    root.dev === context.dev && root.ino === context.ino && root.uid === context.uid && (root.mode & 0o7777) === 0o700, 'Private temp directory identity/mode changed');
  assert(marker.isFile() && !marker.isSymbolicLink() && marker.uid === context.uid && (marker.mode & 0o7777) === 0o600, 'Private temp owner marker changed');
  const owner = JSON.parse(readFileSync(context.marker, 'utf8'));
  assert(owner.token === context.token && owner.pid === context.pid, 'Private temp ownership token mismatch');
  return context.root;
}

export function createPrivateTempRoot(parent) {
  assert(typeof parent === 'string' && path.isAbsolute(parent) && path.resolve(parent) === parent && typeof process.getuid === 'function', 'Private temp owner must be an absolute directory');
  const parentInfo = lstatSync(parent), uid = process.getuid();
  assert(parentInfo.isDirectory() && !parentInfo.isSymbolicLink() && realpathSync(parent) === parent && parentInfo.uid === uid, 'Private temp owner boundary is not a real owned directory');
  const root = path.join(parent, '.process-tmp');
  mkdirSync(root, { mode: 0o700 }); // Existing entries fail; never fall back elsewhere.
  const info = lstatSync(root);
  const context = Object.freeze({ root, parent, marker: path.join(root, '.owner.json'), token: randomUUID(), pid: process.pid,
    uid, dev: info.dev, ino: info.ino, parentDev: parentInfo.dev, parentIno: parentInfo.ino });
  try {
    assert(info.isDirectory() && !info.isSymbolicLink() && info.uid === uid && (info.mode & 0o7777) === 0o700, 'Could not create 0700 private temp');
    writeFileSync(context.marker, json({ token: context.token, pid: context.pid }), { flag: 'wx', mode: 0o600 });
    ownedTempRoots.set(root, context);
    validatePrivateTempRoot(context);
    return context;
  } catch (error) {
    ownedTempRoots.delete(root);
    const current = lstatSync(root);
    if (current.isDirectory() && !current.isSymbolicLink() && current.dev === info.dev && current.ino === info.ino && current.uid === uid) rmSync(root, { recursive: true });
    throw error;
  }
}

export function controlledChildEnvironment(context) {
  return { PATH: process.env.PATH, TMPDIR: validatePrivateTempRoot(context) + path.sep };
}

export function cleanupPrivateTempRoot(context) {
  validatePrivateTempRoot(context); // Reject changed ownership; delete no substitute.
  rmSync(context.root, { recursive: true });
  ownedTempRoots.delete(context.root);
}

function cleanupPrivateTemps() {
  const failures = [];
  for (const context of [...ownedTempRoots.values()]) {
    try { cleanupPrivateTempRoot(context); }
    catch (error) { failures.push(error.message); }
  }
  if (failures.length) process.stderr.write(`Private temp cleanup rejected: ${failures.join('; ')}\n`);
  return failures.length === 0;
}

// Only groups created by this module's runBounded are registered. Never scan
// process tables or signal a caller's group. Exit handlers must remain synchronous.
function killActiveChildGroups() {
  for (const child of activeChildren) {
    activeChildren.delete(child);
    if (child.pid) {
      try { process.platform === 'win32' ? child.kill('SIGKILL') : process.kill(-child.pid, 'SIGKILL'); } catch {}
    }
  }
}

export function installProcessCleanup() {
  const onExit = code => { killActiveChildGroups(); if (!cleanupPrivateTemps() && code === 0) process.exitCode = 1; };
  const onInterrupt = () => { killActiveChildGroups(); cleanupPrivateTemps(); process.exit(130); };
  const onTerminate = () => { killActiveChildGroups(); cleanupPrivateTemps(); process.exit(143); };
  process.once('exit', onExit);
  process.once('SIGINT', onInterrupt);
  process.once('SIGTERM', onTerminate);
  return () => {
    process.removeListener('exit', onExit);
    process.removeListener('SIGINT', onInterrupt);
    process.removeListener('SIGTERM', onTerminate);
  };
}

// One child at a time; bounded lifetime and combined stdout/stderr bytes. A detached
// process group allows a timed-out compiler/fixture and its descendants to be killed.
export function runBounded(command, args, { cwd, timeoutMs = 60_000, maxBytes = 1_048_576, deadline = Infinity, env = {}, privateTempRoot } = {}) {
  assert(integer(timeoutMs) && timeoutMs <= 180_000, 'Invalid subprocess timeout');
  assert(integer(maxBytes) && maxBytes <= 8 * 1_048_576, 'Invalid output bound');
  // Production contexts ignore all operator/caller environment overrides. Legacy
  // exported callers without a context retain the existing explicit env API.
  const childEnv = privateTempRoot === undefined ? { PATH: process.env.PATH, ...env } :
    controlledChildEnvironment(privateTempRoot);
  const remaining = Math.min(timeoutMs, deadline - Date.now());
  assert(remaining > 0, 'Total runner deadline exceeded');
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: childEnv, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
    activeChildren.add(child);
    const stdout = [], stderr = [];
    let size = 0, failure;
    function kill(reason) {
      failure ??= new Error(reason);
      if (child.pid) { try { process.platform === 'win32' ? child.kill('SIGKILL') : process.kill(-child.pid, 'SIGKILL'); } catch {} }
    }
    const timer = setTimeout(() => kill('Subprocess time limit exceeded'), remaining);
    for (const [stream, chunks] of [[child.stdout, stdout], [child.stderr, stderr]]) stream.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) kill('Subprocess output limit exceeded');
      else chunks.push(chunk);
    });
    child.on('error', error => { failure ??= error; });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      activeChildren.delete(child);
      if (failure) reject(failure);
      else if (code !== 0) reject(new Error(`Subprocess failed (${code ?? signal}): ${Buffer.concat(stderr).toString('utf8').slice(0, 1000)}`));
      else resolve({ stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr), pid: child.pid, command, args });
    });
  });
}

export function literalQueries(swift) {
  const match = swift.match(/for query in (\[[\s\S]*?\]) \{/);
  assert(match, 'Missing literal SearchIndexTests array');
  const array = match[1].replace(/\\u\{([a-fA-F0-9]+)\}/g, (_, hex) => {
    const point = Number.parseInt(hex, 16);
    assert(point <= 0xffff, 'Unsupported query scalar; review decoder');
    return `\\u${point.toString(16).padStart(4, '0')}`;
  });
  const queries = JSON.parse(array);
  assert(Array.isArray(queries) && queries.length > 0 && queries.every(q => typeof q === 'string'), 'Invalid literal query array');
  return queries;
}

export function publishedSource(source, sourcePath) {
  const match = source.replace(/\r\n?/g, '\n').match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  assert(match, `Front matter missing: ${sourcePath}`);
  // Intentionally narrow independent scanner. Unrecognized YAML fails for review;
  // it never guesses a count or imports the candidate generator's selection code.
  const lines = match[1].split('\n').filter(line => /^status\s*:/.test(line));
  assert(lines.length === 1, `Ambiguous status: ${sourcePath}`);
  const status = lines[0].match(/^status: *(?:([a-z]+)|"([a-z]+)"|'([a-z]+)') *(?:#.*)?$/);
  assert(status && ['draft', 'published'].includes(status[1] ?? status[2] ?? status[3]), `Unsupported status: ${sourcePath}`);
  return (status[1] ?? status[2] ?? status[3]) === 'published';
}

async function rejectSymlinkAncestors(location) {
  const full = path.resolve(location);
  const parts = full.split(path.sep).filter(Boolean);
  let current = path.parse(full).root;
  for (const part of parts) {
    current = path.join(current, part);
    assert(!(await lstat(current)).isSymbolicLink(), `Symlink ancestor rejected: ${current}`);
  }
  return full;
}

export async function inventoryCorpus(root) {
  await rejectSymlinkAncestors(root);
  assert((await lstat(root)).isDirectory(), 'Corpus root must be a directory');
  const files = [];
  let bytes = 0, entries = 0;
  async function walk(directory, prefix = '') {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      assert(++entries <= maximumFiles * 2, 'Corpus entry bound exceeded');
      const relative = prefix + entry.name;
      assert(!/[\\:%\x00-\x1f\x7f]/.test(relative), 'Unsafe corpus path');
      const full = path.join(directory, entry.name), stat = await lstat(full);
      assert(!stat.isSymbolicLink(), 'Corpus symlink rejected');
      if (stat.isDirectory()) { await walk(full, `${relative}/`); continue; }
      assert(stat.isFile(), 'Corpus special file rejected');
      assert(files.length < maximumFiles && stat.size <= maximumBytes - bytes, 'Corpus size bound exceeded');
      const data = await readFile(full);
      assert(data.length === stat.size, 'Corpus changed while reading');
      bytes += data.length;
      files.push([relative, data.length, sha256(data)]);
    }
  }
  await walk(root);
  files.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
  const manifestItem = files.find(file => file[0] === 'manifest.json');
  assert(manifestItem && manifestItem[1] <= 8 * 1_048_576, 'Manifest missing/oversized');
  const manifestData = await readFile(path.join(root, 'manifest.json'));
  assert(sha256(manifestData) === manifestItem[2], 'Manifest changed during inventory');
  const manifest = JSON.parse(manifestData);
  assert(manifest.schema_version === 2 && typeof manifest.revision === 'string' && manifest.revision.length > 0, 'Invalid manifest identity');
  assert(Array.isArray(manifest.articles) && integer(manifest.articles.length) && manifest.articles.length <= 2000, 'Invalid article count');
  assert(manifest.files && typeof manifest.files === 'object' && !Array.isArray(manifest.files), 'Missing listed files');
  assert.deepEqual(files.map(f => f[0]), ['manifest.json', ...Object.keys(manifest.files)].sort(), 'Unexpected or missing corpus file');
  for (const [name, , digest] of files) if (name !== 'manifest.json') {
    assert(digestPattern.test(manifest.files[name]) && manifest.files[name] === digest, `Listed file SHA mismatch: ${name}`);
  }
  return { manifest, manifest_sha256: manifestItem[2], corpus_sha256: sha256(json(files)), files_including_manifest: files.length,
    listed_sha_files: files.length - 1, bytes_including_manifest: bytes, png_files: files.filter(f => f[0].toLowerCase().endsWith('.png')).length };
}

export function idsDigest(ids) {
  return sha256(ids.map(id => `${Buffer.byteLength(id)}:${id}\n`).join(''));
}

export function validateRecord(record, identity, identityHash, mode, invocationID, oracle, pid) {
  const common = ['schema_version', 'mode', 'invocation_id', 'process_id', 'identity_sha256', 'manifest_sha256', 'query_sha256', 'query_count',
    'actual_article_count', 'corpus_revision', 'article_order_sha256', 'executable_architecture', 'host_os_version'];
  exactKeys(record, [...common, ...(mode === 'correctness' ? ['correctness', 'query_results'] : ['wall_seconds', 'process_peak_resident_bytes']),
    ...([SCENARIOS[1], SCENARIOS[2]].includes(mode) ? ['query_results'] : [])]);
  assert(record.schema_version === 1 && record.mode === mode && record.invocation_id === invocationID, 'Invocation identity mismatch');
  assert(integer(record.process_id) && record.process_id === pid, 'Process identity mismatch');
  assert(record.executable_architecture === identity.executable_architecture && typeof record.host_os_version === 'string' && record.host_os_version.length > 0, 'Executable architecture/OS identity mismatch');
  assert(record.identity_sha256 === identityHash && record.manifest_sha256 === identity.manifest_sha256 && record.query_sha256 === identity.query_sha256, 'Input SHA mismatch');
  assert(record.query_count === identity.query_count && record.actual_article_count === identity.expected_article_count && record.corpus_revision === identity.corpus_revision, 'Consumed corpus count/revision mismatch');
  assert(record.article_order_sha256 === identity.article_order_sha256, 'Consumed article order mismatch');
  if (mode === 'correctness') assert.equal(record.correctness, 'ordered-indexed-equals-production-uncached');
  else {
    assert(typeof record.wall_seconds === 'number' && Number.isFinite(record.wall_seconds) && record.wall_seconds > 0, 'Missing/nonfinite wall_seconds');
    assert(integer(record.process_peak_resident_bytes), 'Missing/invalid process peak RSS bytes');
  }
  if (mode !== SCENARIOS[0]) {
    assert(Array.isArray(record.query_results) && record.query_results.length === identity.query_count, 'Missing query result batch');
    for (const [index, result] of record.query_results.entries()) {
      exactKeys(result, ['query_index', 'result_count', 'ordered_ids_sha256']);
      assert(result.query_index === index && Number.isSafeInteger(result.result_count) && result.result_count >= 0 && result.result_count <= identity.expected_article_count && digestPattern.test(result.ordered_ids_sha256), 'Invalid ordered result digest');
    }
    if (oracle) assert.deepEqual(record.query_results, oracle.query_results, 'Indexed results differ from correctness invocation');
  }
  return record;
}

export function summarize(records) {
  assert(records.length === 5, 'Exactly five recorded samples required');
  const result = {};
  for (const name of ['wall_seconds', 'process_peak_resident_bytes']) {
    const values = records.map(record => record[name]).sort((a, b) => a - b);
    assert(values.every(v => typeof v === 'number' && Number.isFinite(v) && v > 0), 'Invalid sample metric');
    result[name] = { median: values[2], minimum: values[0], maximum: values[4], range: values[4] - values[0] };
  }
  return result;
}

export async function collectSamples(invoke) {
  const oracle = await invoke('correctness', 'correctness', 0);
  const scenarios = [];
  for (const mode of SCENARIOS) {
    const warmup = await invoke(mode, 'discarded-warmup', 0, oracle);
    const recorded = [];
    for (let sample = 1; sample <= 5; sample++) recorded.push(await invoke(mode, 'recorded', sample, oracle));
    scenarios.push({ scenario: mode, discarded_warmup: warmup, raw_samples: recorded, descriptive: summarize(recorded) });
  }
  return scenarios;
}

const TOOLCHAIN_OPTIONS = ['--swiftc', '--sdk', '--target', '--swift-version'];

export function targetSpec(target) {
  const match = typeof target === 'string' && target.match(/^(arm64|x86_64)-apple-macosx(\d+(?:\.\d+){0,2})$/);
  assert(match, 'Target must be an arm64/x86_64 Apple macOS deployment triple');
  return { architecture: match[1], version: match[2].split('.').map(Number) };
}

export function parseArgs(args) {
  if (args.length === 1 && args[0] === '--help') return null;
  assert(args[0] === '--run', 'No execution: use --help; explicit --run is required');
  assert(args.length >= 9 && (args.length - 1) % 2 === 0, 'Expected named option/value pairs after --run');
  const options = {};
  for (let i = 1; i < args.length; i += 2) {
    assert(['--repo', '--revision', '--corpus', '--output', ...TOOLCHAIN_OPTIONS].includes(args[i]) && !Object.hasOwn(options, args[i]), 'Unknown/duplicate argument');
    assert(typeof args[i + 1] === 'string' && args[i + 1].length > 0 && !args[i + 1].startsWith('--'), 'Missing/invalid argument value');
    options[args[i]] = args[i + 1];
  }
  for (const name of ['--repo', '--revision', '--corpus', '--output']) assert(Object.hasOwn(options, name), `Missing required option: ${name}`);
  assert(/^[a-f0-9]{40}$/.test(options['--revision']), 'Use an immutable full source commit');
  const selected = TOOLCHAIN_OPTIONS.filter(name => Object.hasOwn(options, name));
  assert(selected.length === 0 || selected.length === TOOLCHAIN_OPTIONS.length, 'Specify all four toolchain options or omit all four');
  if (selected.length) {
    targetSpec(options['--target']);
    assert(['5', '6'].includes(options['--swift-version']), 'Swift language mode must be 5 or 6');
  }
  return options;
}

const versionAtMost = (target, sdk) => {
  for (let i = 0; i < 3; i++) {
    const difference = (target[i] ?? 0) - (sdk[i] ?? 0);
    if (difference !== 0) return difference < 0;
  }
  return true;
};

export async function selectToolchain(options, bounded = runBounded, hostArch = os.arch()) {
  const selected = TOOLCHAIN_OPTIONS.filter(name => Object.hasOwn(options, name));
  assert(selected.length === 0 || selected.length === TOOLCHAIN_OPTIONS.length, 'Incomplete explicit toolchain selection');
  const explicit = selected.length > 0;
  const compilerRequest = explicit ? options['--swiftc'] : (await bounded('/usr/bin/xcrun', ['--find', 'swiftc'])).stdout.toString().trim();
  const sdkRequest = explicit ? options['--sdk'] : (await bounded('/usr/bin/xcrun', ['--show-sdk-path'])).stdout.toString().trim();
  assert(compilerRequest && sdkRequest, 'Compiler/SDK paths unavailable');
  // Official toolchains/SDKs may use symlinks. Resolve them and record both paths;
  // keep the absolute swiftc invocation name: its resolved binary can dispatch
  // behavior from argv[0]. Corpus symlink rejection is a separate contract.
  const compiler = path.resolve(compilerRequest), compilerRealPath = await realpath(compiler), sdk = await realpath(path.resolve(sdkRequest));
  assert((await stat(compilerRealPath)).isFile() && (await stat(sdk)).isDirectory(), 'Compiler must be a file and SDK a directory');
  await access(compilerRealPath, constants.X_OK);
  const settingsBytes = await readFile(path.join(sdk, 'SDKSettings.json'));
  const settings = JSON.parse(settingsBytes);
  assert(typeof settings.CanonicalName === 'string' && /^macosx\d/.test(settings.CanonicalName) && typeof settings.Version === 'string' && /^\d+(?:\.\d+){0,2}$/.test(settings.Version), 'A versioned macOS SDK is required');
  const compilerVersion = (await bounded(compiler, ['--version'])).stdout.toString().trim();
  const compilerMajor = Number(compilerVersion.match(/^Apple Swift version (\d+)\./m)?.[1]);
  assert(Number.isSafeInteger(compilerMajor) && compilerMajor >= 5, 'Missing supported Apple Swift compiler identity');
  const compilerDefaultTarget = compilerVersion.match(/^Target: ([^\r\n]+)$/m)?.[1];
  const compilerSpec = targetSpec(compilerDefaultTarget);
  const target = explicit ? options['--target'] : compilerDefaultTarget;
  const spec = targetSpec(target), architecture = hostArch === 'x64' ? 'x86_64' : hostArch;
  assert(['arm64', 'x86_64'].includes(architecture) && spec.architecture === architecture && compilerSpec.architecture === architecture, 'Compiler and selected target must match the host process architecture');
  assert(versionAtMost(spec.version, settings.Version.split('.').map(Number)), 'Deployment target exceeds selected SDK version');
  const swiftVersion = explicit ? options['--swift-version'] : '5';
  assert(['5', '6'].includes(swiftVersion) && Number(swiftVersion) <= compilerMajor, 'Swift language mode is unsupported by selected compiler');
  return { compiler, sdk, target, swiftVersion, architecture, compilerVersion,
    selection: { mode: explicit ? 'explicit' : 'xcrun-defaults',
      requested: { swiftc: compilerRequest, sdk: sdkRequest, target: explicit ? options['--target'] : null, swift_version: explicit ? options['--swift-version'] : null },
      resolved: { swiftc: compilerRealPath, sdk, target, swift_version: swiftVersion },
      invocation: { swiftc: compiler, sdk },
      compiler_default_target: compilerDefaultTarget, host_process_architecture: hostArch,
      sdk: { canonical_name: settings.CanonicalName, version: settings.Version, settings_sha256: sha256(settingsBytes) } } };
}

export function compileCommand(toolchain, sources, harness, moduleCache, executable) {
  assert(sources.length === CORE_SOURCES.length && [...sources, harness, moduleCache, executable].every(value => typeof value === 'string' && path.isAbsolute(value)), 'Compile inputs/outputs must be absolute paths');
  const flags = ['-parse-as-library', '-swift-version', toolchain.swiftVersion, '-O', '-whole-module-optimization',
    '-target', toolchain.target, '-sdk', toolchain.sdk, '-module-cache-path', moduleCache];
  return { executable: toolchain.compiler, flags, args: [...flags, ...sources, harness, '-o', executable] };
}

export async function main(args) {
  const options = parseArgs(args);
  if (!options) {
    console.log('Usage: check-core-performance.sh --run --repo <repo> --revision <40hex> --corpus <preserved Content> --output <new directory> [--swiftc <compiler> --sdk <macOS SDK> --target <macOS triple> --swift-version <5|6>]\nAll four toolchain options must be supplied together; otherwise xcrun paths/compiler target and Swift5 mode are selected. Runs macOS host compilation and 19 fresh benchmark processes. See core-performance.md for boundaries and limits.');
    return;
  }
  assert(process.platform === 'darwin', 'Only Darwin RSS byte semantics are accepted');
  const started = Date.now(), deadline = started + 15 * 60_000;
  // Includes async filesystem work outside child timers. Kill any active group
  // before exiting; the one-second allowance lets a deadline-killed child close.
  const watchdog = setTimeout(() => {
    killActiveChildGroups();
    console.error('Core performance runner rejected: total deadline exceeded');
    process.exit(1);
  }, 15 * 60_000 + 1000);
  watchdog.unref();
  let privateTempRoot;
  try {
    const repo = await realpath(options['--repo']);
    const corpus = await rejectSymlinkAncestors(options['--corpus']);
    const output = path.resolve(options['--output']);
    await rejectSymlinkAncestors(path.dirname(output));
    // Never overwrite an existing output or place artifacts inside the input corpus/repo.
    for (const input of [corpus, repo]) assert(output !== input && !output.startsWith(input + path.sep) && !input.startsWith(output + path.sep), 'Output overlaps an input');
    await mkdir(output);
    privateTempRoot = createPrivateTempRoot(output);
    const bounded = (command, argv, limits = {}) => runBounded(command, argv, { deadline, ...limits, privateTempRoot });
    const revision = options['--revision'];
    const git = async argv => (await bounded('/usr/bin/git', ['-C', repo, ...argv], { timeoutMs: 10_000, maxBytes: 8 * 1_048_576 })).stdout;
    assert.equal((await git(['rev-parse', `${revision}^{commit}`])).toString().trim(), revision);
    const productionHashes = {}, sourceFiles = [];
    for (const relative of CORE_SOURCES) {
      const data = await git(['show', `${revision}:${relative}`]);
      productionHashes[relative] = sha256(data);
      const frozen = path.join(output, path.basename(relative));
      await writeFile(frozen, data, { flag: 'wx' }); sourceFiles.push(frozen);
    }
    const here = path.dirname(fileURLToPath(import.meta.url));
    const harnessData = await readFile(path.join(here, 'PublishedCoreBenchmark.swift'));
    const queryData = await readFile(path.join(here, 'core-performance-queries.json'));
    const querySource = await git(['show', `${revision}:ios/AILibraryTests/SearchIndexTests.swift`]);
    assert.deepEqual(JSON.parse(queryData), literalQueries(querySource.toString()), 'Queries differ from immutable production test literals');
    const frozenHarness = path.join(output, 'PublishedCoreBenchmark.swift'), frozenQueries = path.join(output, 'core-performance-queries.json');
    await writeFile(frozenHarness, harnessData, { flag: 'wx' }); await writeFile(frozenQueries, queryData, { flag: 'wx' });
    const tree = (await git(['ls-tree', '-r', '-z', revision, '--', 'docs'])).toString().split('\0').filter(Boolean);
    assert(tree.length <= 10_000, 'Immutable docs tree bound exceeded');
    const published = [];
    for (const entry of tree) {
      const match = entry.match(/^(100644|100755) blob [a-f0-9]{40}\t(docs\/\d{2}-[a-z0-9-]+\/[a-z0-9-]+\.md)$/);
      if (!match || /\/readme\.md$/i.test(match[2])) continue;
      const source = await git(['show', `${revision}:${match[2]}`]);
      if (publishedSource(source.toString(), match[2])) published.push([match[2], sha256(source)]);
    }
    assert(integer(published.length) && published.length <= 2000, 'Independent immutable source count unavailable');
    published.sort((a, b) => a[0] < b[0] ? -1 : 1);
    const inventory = await inventoryCorpus(corpus);
    assert.equal(inventory.manifest.articles.length, published.length, 'Actual corpus articles differ from independent immutable published count');
    const consumedSources = inventory.manifest.articles.map(a => [a.source_path, a.source_sha256]).sort((a, b) => a[0] < b[0] ? -1 : 1);
    assert.deepEqual(consumedSources, published, 'Corpus does not match immutable published source bytes');
    // Toolchain/SDK execution is reachable only after the explicit --run gate.
    const toolchain = await selectToolchain(options, bounded);
    const executable = path.join(output, 'published-core-benchmark');
    const command = compileCommand(toolchain, sourceFiles, frozenHarness, path.join(output, 'module-cache'), executable);
    const compile = await bounded(command.executable, command.args, { timeoutMs: 180_000 });
    await writeFile(path.join(output, 'compiler.stderr.txt'), compile.stderr, { flag: 'wx' });
    const { manifest, ...counts } = inventory;
    const identity = {
      schema_version: 1, source_revision: revision, production_source_sha256: productionHashes,
      harness_sha256: sha256(harnessData), runner_sha256: sha256(await readFile(fileURLToPath(import.meta.url))),
      query_source_sha256: sha256(querySource), query_sha256: sha256(queryData), query_count: JSON.parse(queryData).length,
      ...counts, corpus_revision: manifest.revision, expected_article_count: published.length,
      expected_count_method: 'independent immutable docs NN-section Markdown front-matter status scanner',
      published_sources_sha256: sha256(json(published)), article_order_sha256: idsDigest(manifest.articles.map(a => a.id)),
      compiler_version: toolchain.compilerVersion, compiler_flags: command.flags, compiler_command: [command.executable, ...command.args],
      toolchain_selection: toolchain.selection,
      spawn_environment: { keys: ['PATH', 'TMPDIR'], TMPDIR: privateTempRoot.root + path.sep, temp_mode: '0700', operator_TMPDIR_inherited: false, caller_env_overrides_forwarded: false },
      executable_sha256: sha256(await readFile(executable)), executable_architecture: toolchain.architecture, os: { platform: os.platform(), release: os.release(), version: os.version(), architecture: os.arch() },
      clock: { source: 'DispatchTime.now().uptimeNanoseconds', unit: 'seconds', scope: 'elapsed monotonic wall time of named production operation' },
      memory: { source: 'Darwin getrusage(RUSAGE_SELF).ru_maxrss', unit: 'bytes', scope: 'whole fresh host process high-water through post-work pre-JSON probe; includes setup and post-timing result digests',
        unit_evidence: 'Darwin getrusage(2) ru_maxrss: maximum resident set size utilized (in bytes); independently verified local primary manual, see core-performance.md' },
      protocol: { warmup_per_scenario: 1, recorded_per_scenario: 5, fresh_process_each_invocation: true, sample_timeout_ms: 60_000,
        sample_output_max_bytes: 1_048_576, total_deadline_ms: 900_000, corpus_file_cache: 'warmed by inventory SHA checks; no cold-disk claim' }
    };
    const identityData = json(identity), identityPath = path.join(output, 'identity.json'), identityHash = sha256(identityData);
    await writeFile(identityPath, identityData, { flag: 'wx' });
    const seenPIDs = new Set(), order = [];
    async function invocation(mode, kind, ordinal, oracle) {
      assert.equal((await inventoryCorpus(corpus)).corpus_sha256, identity.corpus_sha256, 'Corpus changed before invocation');
      const id = randomUUID(), argv = [mode, corpus, frozenQueries, identityPath, id];
      const result = await bounded(executable, argv);
      assert(!seenPIDs.has(result.pid), 'Fresh process identity was reused'); seenPIDs.add(result.pid);
      const record = validateRecord(JSON.parse(result.stdout), identity, identityHash, mode, id, oracle, result.pid);
      assert.equal((await inventoryCorpus(corpus)).corpus_sha256, identity.corpus_sha256, 'Corpus changed during invocation');
      const name = `${String(order.length).padStart(2, '0')}-${mode === 'correctness' ? 'correctness' : mode.split('.')[1]}-${kind}-${ordinal}`;
      await writeFile(path.join(output, `${name}.json`), result.stdout, { flag: 'wx' });
      await writeFile(path.join(output, `${name}.stderr.txt`), result.stderr, { flag: 'wx' });
      order.push({ mode, kind, ordinal, process_id: result.pid, invocation_id: id, command: [executable, ...argv], raw_file: `${name}.json` });
      return record;
    }
    const scenarios = await collectSamples(invocation);
    assert.equal(order.length, 19);
    await writeFile(path.join(output, 'summary.json'), json({ schema_version: 1, status: 'observed-host-baseline', identity_sha256: identityHash,
      order, scenarios, elapsed_runner_seconds: (Date.now() - started) / 1000,
      limits: ['No timing threshold or SLO acceptance', 'No p95 estimate from five samples', 'Not iOS app memory/input latency/scrolling/image decoding', 'RSS is not isolated allocation size; do not subtract high-water marks', 'IOS-15 remains open'] }), { flag: 'wx' });
    console.log(`Host baseline preserved in ${output}`);
  } finally {
    clearTimeout(watchdog);
    if (privateTempRoot) cleanupPrivateTempRoot(privateTempRoot);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const removeCleanup = installProcessCleanup();
  main(process.argv.slice(2)).catch(error => { console.error(`Core performance runner rejected: ${error.message}`); process.exitCode = 1; }).finally(removeCleanup);
}
