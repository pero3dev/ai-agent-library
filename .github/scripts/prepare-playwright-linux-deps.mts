import fs from 'node:fs/promises';
// The supported Ubuntu APT layout uses POSIX paths on every fixture host.
import path from 'node:path/posix';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// This reader deliberately supports only the reviewed, locked Playwright table.
// Updating Playwright requires reviewing its table and this contract together.
export const SUPPORTED_PLAYWRIGHT = '1.63.0';
export const MIRROR_FILE = '/etc/apt/apt-mirrors.txt';
export const LIMITS = Object.freeze({ metadataSeconds: 60, downloadSeconds: 180, outputBytes: 64 * 1024 });
const MIRROR_URI = `mirror+file:${MIRROR_FILE}`;
const REPOSITORY = 'pero3dev/ai-agent-library';
/** @param {import('node:crypto').BinaryLike} bytes */
const hash = (bytes: import('node:crypto').BinaryLike) => createHash('sha256').update(bytes).digest('hex');
/** @param {string} message @returns {never} */
function fail(message: string): never { throw new Error(message); }
/** @param {AbortSignal | undefined} signal */
const checkAbort = (signal: AbortSignal | undefined) => { if (signal?.aborted) fail('Preparation interrupted; no install will start.'); };

/** @param {string} bundle @param {unknown[]} versions */
export function parsePlaywrightPackages(bundle: string, versions: unknown[]) {
  if (versions.length !== 5 || versions.some((version) => version !== SUPPORTED_PLAYWRIGHT))
    fail('Unsupported Playwright lock/install version; manual dependency-table review required.');
  const pattern = /^      "ubuntu24\.04-x64": \{\n        tools: (\[[\s\S]*?\]),\n        chromium: (\[[\s\S]*?\]),\n        firefox: (\[[\s\S]*?\]),\n        webkit: \[/gm;
  const tables = [...bundle.matchAll(pattern)];
  if (tables.length !== 1) fail('Unknown or ambiguous Playwright dependency-table format.');
  const arrays = tables[0].slice(1).map((text) => {
    /** @type {unknown} */
    let packages: unknown;
    try { packages = JSON.parse(text); } catch { fail('Dependency table is not a plain JSON string array.'); }
    if (!Array.isArray(packages) || packages.length === 0 || packages.length > 128
        || packages.some((token) => typeof token !== 'string' || !/^[a-z0-9][a-z0-9+.-]*$/.test(token))
        || new Set(packages).size !== packages.length)
      fail('Invalid dependency package array.');
    return (packages as string[]);
  });
  return [...new Set(arrays.flat())].sort();
}

/** @param {import('./linux-deps-types.d.mts').HostContext} context @param {string} osRelease */
export function validateHost(context: import('./linux-deps-types.d.mts').HostContext, osRelease: string) {
  const env = context.env;
  if (context.platform !== 'linux' || context.arch !== 'x64' || env.GITHUB_ACTIONS !== 'true'
      || env.RUNNER_OS !== 'Linux' || env.RUNNER_ARCH !== 'X64'
      || env.RUNNER_ENVIRONMENT !== 'github-hosted' || env.GITHUB_REPOSITORY !== REPOSITORY
      || env.PLAYWRIGHT_DEPS_PUBLIC_REPOSITORY !== 'true')
    fail('Only this public repository on a GitHub-hosted Linux x64 CI runner is supported.');
  if (typeof env.GITHUB_WORKSPACE !== 'string' || !path.isAbsolute(env.GITHUB_WORKSPACE) || path.normalize(env.GITHUB_WORKSPACE) !== env.GITHUB_WORKSPACE
      || context.cwd !== env.GITHUB_WORKSPACE
      || context.scriptPath !== path.join(env.GITHUB_WORKSPACE, '.github/scripts/prepare-playwright-linux-deps.mjs'))
    fail('The script must run from its owned GitHub workspace.');
  const values = new Map();
  for (const line of osRelease.split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const match = /^([A-Z_]+)=(?:"([^"\\]*)"|([A-Za-z0-9._-]+))$/.exec(line);
    // Descriptive fields may contain spaces; only the three identity keys matter.
    const key = line.split('=')[0];
    if (!['ID', 'VERSION_ID', 'VERSION_CODENAME'].includes(key)) continue;
    if (!match || values.has(key)) fail('Unknown OS identity format.');
    values.set(key, match[2] ?? match[3]);
  }
  if (values.get('ID') !== 'ubuntu' || values.get('VERSION_ID') !== '24.04' || values.get('VERSION_CODENAME') !== 'noble')
    fail('Only Ubuntu 24.04 noble is supported; review sources before changing this guard.');
}

/** @param {Buffer} bytes */
export function parseMirror(bytes: Buffer) {
  // actions/runner-images configure-apt-sources.sh, reviewed at c74a28e5f894
  // (blob b3f5b2b180df8eb39fcbba034f616e03a69e775c).
  // EC2 east2 was observed on ubuntu24/20261018.96; Canonical cloud-init
  // documents regional EC2 archives. Only this exact extra profile is reviewed.
  const azure = 'http://azure.archive.ubuntu.com/ubuntu/\tpriority:1\n';
  const ec2East2 = 'http://us-east-2.ec2.archive.ubuntu.com/ubuntu/\tpriority:1\n';
  const retained = 'https://archive.ubuntu.com/ubuntu/\tpriority:2\nhttps://security.ubuntu.com/ubuntu/\tpriority:3\n';
  if (!bytes.equals(Buffer.from(azure + retained)) && !bytes.equals(Buffer.from(ec2East2 + retained)))
    fail('Unknown mirror-list bytes, priorities or hosts; no sudo operation permitted.');
  // Remove only the first reviewed cloud candidate; retain both official alternatives
  // byte-for-byte, including security and its priority. Never rewrite a source.
  return Buffer.from(retained);
}

/** @param {string} uri */
function safeUri(uri: string) {
  if (uri === MIRROR_URI) return;
  let parsed;
  try { parsed = new URL(uri); } catch { fail('Unknown APT source URI.'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash)
    fail('Unsupported APT source URI; values are intentionally omitted.');
  const ubuntu = ['azure.archive.ubuntu.com', 'archive.ubuntu.com', 'security.ubuntu.com'].includes(parsed.hostname)
    && ['/ubuntu', '/ubuntu/'].includes(parsed.pathname);
  const thirdParty = parsed.protocol === 'https:' && (
    parsed.hostname === 'packages.microsoft.com'
    || (parsed.hostname === 'dl.google.com' && parsed.pathname === '/linux/chrome/deb/')
    || (parsed.hostname === 'download.docker.com' && ['/linux/ubuntu', '/linux/ubuntu/'].includes(parsed.pathname)));
  if (parsed.port || (!ubuntu && !thirdParty)) fail('Unreviewed APT source host/path; no URI values are logged.');
}

/** @param {{name: string, text: string}[]} files */
export function validateSources(files: { name: string; text: string }[]) {
  let mirrorStanzas = 0;
  for (const { name, text } of files) {
    /** @type {{uris: string[], suites: string[], components: string[], signedBy?: string}[]} */
    const stanzas: { uris: string[]; suites: string[]; components: string[]; signedBy?: string }[] = [];
    if (name.endsWith('.sources')) {
      for (const block of text.split(/\n\s*\n/)) {
        /** @type {Map<string, string>} */
        const fields: Map<string, string> = new Map();
        for (const line of block.split('\n')) {
          if (!line.trim() || line.startsWith('#')) continue;
          const match = /^([A-Za-z][A-Za-z-]*): +([^\r\n]+)$/.exec(line);
          if (!match || fields.has(match[1]) || !['Types', 'URIs', 'Suites', 'Components', 'Signed-By', 'Architectures', 'Enabled'].includes(match[1]))
            fail('Unknown deb822 source format or options.');
          fields.set(match[1], match[2]);
        }
        if (!fields.size) continue;
        if (fields.has('Enabled') && fields.get('Enabled') !== 'yes') fail('Unsupported Enabled source option.');
        if (!fields.get('Types')?.split(' ').every((type) => ['deb', 'deb-src'].includes(type))
            || !fields.get('URIs') || !fields.get('Suites') || !fields.get('Components'))
          fail('Incomplete deb822 source stanza.');
        stanzas.push({ uris: (fields.get('URIs') ?? '').split(/ +/), suites: (fields.get('Suites') ?? '').split(/ +/),
          components: (fields.get('Components') ?? '').split(/ +/), signedBy: fields.get('Signed-By') });
      }
    } else if (name.endsWith('.list')) {
      for (const line of text.split('\n')) {
        if (!line.trim() || line.startsWith('#')) continue;
        const match = /^deb(?:-src)? (?:\[([^\]]+)\] )?(\S+) (\S+) (\S+(?: \S+)*?)(?: +#.*)?$/.exec(line);
        if (!match) fail('Unknown one-line APT source format.');
        const options = new Map();
        for (const option of (match[1] || '').split(' ').filter(Boolean)) {
          const pair = /^(arch|signed-by)=([A-Za-z0-9_./,+-]+)$/.exec(option);
          if (!pair || options.has(pair[1])) fail('Unsupported APT source options.');
          options.set(pair[1], pair[2]);
        }
        stanzas.push({ uris: [match[2]], suites: [match[3]], components: match[4].split(' '), signedBy: options.get('signed-by') });
      }
    } else fail('Unknown APT source file format.');
    for (const stanza of stanzas) {
      stanza.uris.forEach(safeUri);
      if (!stanza.uris.includes(MIRROR_URI)) continue;
      mirrorStanzas++;
      if (stanza.uris.length !== 1 || stanza.signedBy !== '/usr/share/keyrings/ubuntu-archive-keyring.gpg'
          || stanza.suites.length === 0 || stanza.suites.some((suite) => !['noble', 'noble-updates', 'noble-backports', 'noble-security'].includes(suite))
          || stanza.components.some((component) => !['main', 'restricted', 'universe', 'multiverse'].includes(component)))
        fail('Unsupported Ubuntu mirror source; no sudo operation permitted.');
    }
  }
  if (!mirrorStanzas) fail('No reviewed Ubuntu archive mirror source was found.');
}

/** @param {import('./linux-deps-types.d.mts').Snapshot} actual @param {import('./linux-deps-types.d.mts').Snapshot} expected */
function sameSnapshot(actual: import('./linux-deps-types.d.mts').Snapshot, expected: import('./linux-deps-types.d.mts').Snapshot) {
  return actual.mode === expected.mode && actual.dev === expected.dev && actual.ino === expected.ino
    && actual.uid === expected.uid && actual.bytes.equals(expected.bytes);
}

/** @param {import('./linux-deps-types.d.mts').PreparationIo} io @param {import('./linux-deps-types.d.mts').NamedSnapshot[]} snapshots */
async function unchanged(io: import('./linux-deps-types.d.mts').PreparationIo, snapshots: import('./linux-deps-types.d.mts').NamedSnapshot[]) {
  const expectedNames = snapshots.filter((file) => file.path !== MIRROR_FILE).map((file) => file.path).sort();
  if (JSON.stringify(await io.sourceNames()) !== JSON.stringify(expectedNames))
    fail('APT source inventory changed during preparation.');
  for (const snapshot of snapshots) {
    if (!sameSnapshot(await io.read(snapshot.path, snapshot.limit), snapshot))
      fail('APT configuration changed during preparation; refusing the next operation.');
  }
}

/** @param {{io: import('./linux-deps-types.d.mts').PreparationIo, context: import('./linux-deps-types.d.mts').HostContext, signal?: AbortSignal}} options */
export async function prepare({ io, context, signal }: { io: import('./linux-deps-types.d.mts').PreparationIo; context: import('./linux-deps-types.d.mts').HostContext; signal?: AbortSignal }) {
  const os = await io.read('/usr/lib/os-release', 8192);
  validateHost(context, os.bytes.toString('utf8'));
  const workspace = await io.directory(context.cwd);
  if (workspace.uid !== context.uid) fail('Workspace ownership does not match this runner user.');
  const root = context.cwd;
  /** @param {string} name @param {number} limit @returns {Promise<Record<string, unknown>>} */
  const readJson = async (name: string, limit: number): Promise<Record<string, unknown>> => {
    const file = await io.read(name, limit);
    try {
      /** @type {unknown} */
      const value: unknown = JSON.parse(file.bytes.toString('utf8'));
      if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Unknown package JSON format; input values are intentionally omitted.');
      return (value as Record<string, unknown>);
    } catch { fail('Unknown package JSON format; input values are intentionally omitted.'); }
  };
  const lock = await readJson(path.join(root, 'website/package-lock.json'), 2 * 1024 * 1024);
  const core = await readJson(path.join(root, 'website/node_modules/playwright-core/package.json'), 16384);
  const playwright = await readJson(path.join(root, 'website/node_modules/playwright/package.json'), 16384);
  if (lock.lockfileVersion !== 3 || core.name !== 'playwright-core' || playwright.name !== 'playwright') fail('Unsupported installed package identity or lock schema.');
  /** @param {unknown} value @returns {Record<string, unknown>} */
  const fields = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const lockPackages = fields(lock.packages);
  const versions = [fields(lockPackages['node_modules/playwright-core']).version, fields(lockPackages['node_modules/playwright']).version,
    fields(lockPackages['node_modules/@playwright/test']).version, core.version, playwright.version];
  const bundle = await io.read(path.join(root, 'website/node_modules/playwright-core/lib/coreBundle.js'), 12 * 1024 * 1024);
  const packages = parsePlaywrightPackages(bundle.bytes.toString('utf8'), versions);
  /** @type {import('./linux-deps-types.d.mts').NamedSnapshot[]} */
  const sources: import('./linux-deps-types.d.mts').NamedSnapshot[] = [];
  const names = await io.sourceNames();
  if (names.length === 0 || names.length > 32) fail('Unexpected APT source-file count.');
  for (const name of names) {
    const file = await io.read(name, 16 * 1024);
    if (file.uid !== 0 || (file.mode & 0o022)) fail('APT source ownership or permissions are not supported.');
    sources.push({ ...file, path: name, limit: 16 * 1024 });
  }
  const mirror = { ...await io.read(MIRROR_FILE, 4096), path: MIRROR_FILE, limit: 4096 };
  /** @param {import('./linux-deps-types.d.mts').NamedSnapshot} file */
  const snapshotSummary = (file: import('./linux-deps-types.d.mts').NamedSnapshot) => ({ path: file.path, sha256: hash(file.bytes), bytes: file.bytes.length, mode: file.mode.toString(8), realpath: file.path });
  // Save bounded identity/hash diagnostics even when a future source/mirror
  // layout is rejected. Never print source contents or arbitrary URI values.
  io.log({ phase: 'configuration', sources: sources.map(snapshotSummary), mirror: snapshotSummary(mirror) });
  validateSources(sources.map((file) => ({ name: file.path, text: file.bytes.toString('utf8') })));
  if (mirror.uid !== 0 || mirror.mode !== 0o644) fail('Unexpected mirror-list owner or mode.');
  const fallback = parseMirror(mirror.bytes);
  let activeMirror = mirror;
  io.log({ phase: 'preflight', ubuntu: '24.04', codename: 'noble', playwright: SUPPORTED_PLAYWRIGHT,
    packages: packages.length, sources: sources.map(snapshotSummary), mirror: snapshotSummary(mirror) });
  /** @param {number} attempt */
  const runFetch = async (attempt: number) => {
    for (const [phase, seconds, args] of ([
      ['metadata', LIMITS.metadataSeconds, ['-o', 'Acquire::Retries=0', '-o', 'APT::Update::Error-Mode=any', 'update']],
      ['download', LIMITS.downloadSeconds, ['-o', 'Acquire::Retries=0', 'install', '-y', '--download-only', '--no-install-recommends', ...packages]],
    ] as [string, number, string[]][])) {
      checkAbort(signal);
      await unchanged(io, [...sources, activeMirror]);
      io.log({ phase, attempt, timeout_seconds: seconds });
      const result = await io.run({ phase, attempt, args, seconds, signal, interruptible: true });
      checkAbort(signal);
      if (result.code !== 0) {
        io.log({ phase, attempt, result: 'failed', code: result.code, timed_out: [124, 137].includes(result.code) });
        return false;
      }
    }
    return true;
  };
  let changed = false;
  try {
    checkAbort(signal);
    await unchanged(io, [...sources, mirror]);
    if (!await runFetch(1)) {
      checkAbort(signal);
      await unchanged(io, [...sources, mirror]);
      // Mark before writing so even a partial writer failure must enter restore.
      changed = true;
      await io.rewrite(mirror, [mirror.bytes], fallback);
      activeMirror = { ...mirror, bytes: fallback };
      io.log({ phase: 'fallback', attempt: 2, mirror_sha256: hash(fallback) });
      if (!await runFetch(2)) fail('Ubuntu dependency acquisition failed after one official archive fallback.');
    }
  } finally {
    if (changed) {
      await io.rewrite(mirror, [mirror.bytes, fallback], mirror.bytes);
      await unchanged(io, [...sources, mirror]);
      io.log({ phase: 'restored', mirror_sha256: hash(mirror.bytes), mode: mirror.mode.toString(8) });
    }
  }
  checkAbort(signal);
  await unchanged(io, [...sources, mirror]);
  io.log({ phase: 'install', timeout_seconds: null, retries: 0 });
  // Downloads have finished and the original mirror is already restored.
  // Never apply our timeout, abort kill or retry to an operation that can run dpkg.
  const installed = await io.run({ phase: 'install', attempt: 1, args: ['install', '-y', '--no-download', '--no-install-recommends', ...packages],
    seconds: null, signal: undefined, interruptible: false });
  if (installed.code !== 0) fail('Dependency installation failed; no retry was attempted.');
  checkAbort(signal);
  io.log({ phase: 'complete', packages: packages.length });
}

// Fixed root-side writer: no shell, no link traversal, exact inode/mode/bytes
// compare, in-place contents only. stdin contains data, never executable text.
export const MIRROR_WRITER = `import os,sys,json,base64,stat,hashlib
r=json.load(sys.stdin)
p='/etc/apt/apt-mirrors.txt'
if os.path.realpath(p)!=p: raise RuntimeError('mirror realpath changed')
fd=os.open(p,os.O_RDWR|os.O_NOFOLLOW)
try:
 s=os.fstat(fd)
 if not stat.S_ISREG(s.st_mode) or s.st_dev!=r['dev'] or s.st_ino!=r['ino'] or s.st_uid!=r['uid'] or stat.S_IMODE(s.st_mode)!=r['mode']: raise RuntimeError('mirror identity changed')
 current=os.read(fd,4097)
 if len(current)>4096 or current not in [base64.b64decode(b) for b in r['expected']]: raise RuntimeError('mirror bytes changed')
 data=base64.b64decode(r['replacement'])
 if len(data)>4096: raise RuntimeError('mirror too large')
 def replace(data):
  os.lseek(fd,0,os.SEEK_SET)
  view=memoryview(data)
  while view:
   written=os.write(fd,view)
   if written<=0: raise RuntimeError('mirror write failed')
   view=view[written:]
  os.ftruncate(fd,len(data))
  os.fsync(fd)
 try:
  replace(data)
 except BaseException:
  replace(current)
  raise
finally:
 os.close(fd)
`;

/** @param {{args: string[], seconds: number | null}} options */
export function commandSpec({ args, seconds }: { args: string[]; seconds: number | null }) {
  return { command: '/usr/bin/sudo', args: seconds === null
    ? ['-n', '/usr/bin/apt-get', ...args]
    : ['-n', '/usr/bin/timeout', '--signal=TERM', '--kill-after=5s', `${seconds}s`, '/usr/bin/apt-get', ...args] };
}

/** @param {import('./linux-deps-types.d.mts').ProcessSpec} spec @param {import('./linux-deps-types.d.mts').ChildOptions} [options] @returns {Promise<import('./linux-deps-types.d.mts').ProcessResult>} */
export async function runChild(spec: import('./linux-deps-types.d.mts').ProcessSpec, { spawnChild = (command, args, options) => spawn(command, args, { ...options, stdio: 'pipe' }), killGroup = (pid, signal) => process.kill(-pid, signal) }: import('./linux-deps-types.d.mts').ChildOptions = {}): Promise<import('./linux-deps-types.d.mts').ProcessResult> {
  const { command, args } = spec;
  return await new Promise((resolve, reject) => {
    // timeout runs as root so its process-group deadline also reaches root apt.
    const child = spawnChild(command, args, { detached: true, shell: false, stdio: ['pipe', 'pipe', 'pipe'],
      env: { PATH: '/usr/sbin:/usr/bin:/sbin:/bin', LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8', DEBIAN_FRONTEND: 'noninteractive' } });
    let bytes = 0;
    let stopped = false;
    /** @type {unknown} */
    let failure: unknown;
    const stop = () => {
      if (stopped || !spec.interruptible) return;
      stopped = true;
      // sudo relays this signal to root timeout. Wait for close before restoring
      // config; the root deadline remains the backstop if relay is delayed.
      try { if (child.pid !== undefined) killGroup(child.pid, 'SIGTERM'); } catch (error) { if (!(error instanceof Error) || !('code' in error) || error.code !== 'ESRCH') failure = error; }
    };
    /** @param {Uint8Array} chunk */
    const consume = (chunk: Uint8Array) => {
      bytes += chunk.length;
      // Do not echo APT output: source URLs can contain credentials. Log phase,
      // result and capped byte counts only; no raw child stdout/stderr is saved.
      if (bytes > LIMITS.outputBytes && spec.interruptible) { failure = new Error('APT diagnostic output limit exceeded.'); stop(); }
    };
    child.stdout.on('data', consume);
    child.stderr.on('data', consume);
    const abort = () => stop();
    spec.signal?.addEventListener('abort', abort, { once: true });
    if (spec.signal?.aborted) abort();
    child.once('error', (error) => { failure = error; });
    child.once('close', (code, signal) => {
      spec.signal?.removeEventListener('abort', abort);
      if (failure) reject(failure);
      else resolve({ code: code ?? 128, signal, output_bytes: Math.min(bytes, LIMITS.outputBytes) });
    });
    child.stdin.on('error', () => {});
    child.stdin.end(spec.input || '');
  });
}

/** @param {{fsApi?: import('./linux-deps-types.d.mts').PreparationFilesystem, run?: (spec: import('./linux-deps-types.d.mts').ProcessSpec) => Promise<import('./linux-deps-types.d.mts').ProcessResult>}} [options] @returns {import('./linux-deps-types.d.mts').PreparationIo} */
export function realIo({ fsApi = fs, run = runChild }: { fsApi?: import('./linux-deps-types.d.mts').PreparationFilesystem; run?: (spec: import('./linux-deps-types.d.mts').ProcessSpec) => Promise<import('./linux-deps-types.d.mts').ProcessResult> } = {}): import('./linux-deps-types.d.mts').PreparationIo {
  let loggedBytes = 0;
  /** @param {string} name */
  const directory = async (name: string) => {
    const st = await fsApi.lstat(name);
    if (!st.isDirectory?.() || st.isSymbolicLink() || await fsApi.realpath(name) !== name) fail('Unsupported directory identity.');
    return { ...st, uid: st.uid };
  };
  /** @param {string} name @param {number} limit */
  const read = async (name: string, limit: number) => {
    const st = await fsApi.lstat(name);
    if (!st.isFile?.() || st.isSymbolicLink() || typeof st.size !== 'number' || st.size > limit || await fsApi.realpath(name) !== name)
      fail('Unsupported regular-file identity or size.');
    if (!fsApi.open || typeof st.dev !== 'number' || typeof st.ino !== 'number' || typeof st.uid !== 'number' || typeof st.mode !== 'number') fail('Unsupported regular-file identity or size.');
    const handle = await fsApi.open(name, 'r');
    try {
      const opened = await handle.stat();
      if (opened.dev !== st.dev || opened.ino !== st.ino || opened.mode !== st.mode || opened.uid !== st.uid)
        fail('Input identity changed while opening.');
      const bytes = await handle.readFile();
      if (bytes.length > limit) fail('Input exceeded size limit.');
      return { bytes, mode: st.mode & 0o7777, dev: st.dev, ino: st.ino, uid: st.uid };
    } finally { await handle.close(); }
  };
  return {
    read, directory,
    async sourceNames() {
      const names = [];
      try { await fsApi.lstat('/etc/apt/sources.list'); names.push('/etc/apt/sources.list'); } catch (error) { if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error; }
      await directory('/etc/apt/sources.list.d');
      if (!fsApi.readdir) fail('Source directory enumeration is unavailable.');
      for (const name of await fsApi.readdir('/etc/apt/sources.list.d')) {
        if (name.endsWith('.list') || name.endsWith('.sources')) {
          if (!/^[A-Za-z0-9_.-]+\.(?:list|sources)$/.test(name)) fail('Unsupported APT source filename.');
          names.push(path.join('/etc/apt/sources.list.d', name));
        }
      }
      return names.sort();
    },
    log(value) {
      const line = `${JSON.stringify(value)}\n`;
      loggedBytes += Buffer.byteLength(line);
      if (loggedBytes > 24 * 1024) fail('Preparation diagnostic output limit exceeded.');
      process.stdout.write(line);
    },
    async run(options) { return await run({ ...options, ...commandSpec(options) }); },
    async rewrite(original, expected, replacement) {
      const result = await run({ command: '/usr/bin/sudo', args: ['-n', '/usr/bin/python3', '-I', '-c', MIRROR_WRITER], interruptible: false,
        input: JSON.stringify({ dev: original.dev, ino: original.ino, uid: original.uid, mode: original.mode,
          expected: expected.map((bytes) => bytes.toString('base64')), replacement: replacement.toString('base64') }) });
      if (result.code !== 0) fail('Mirror compare-and-write failed.');
    },
  };
}

export async function runCli(entryUrl: string = import.meta.url) {

  const controller = new AbortController();
  const interrupt = () => controller.abort();
  process.on('SIGINT', interrupt);
  process.on('SIGTERM', interrupt);
  try {
    await prepare({ io: realIo(), signal: controller.signal, context: { platform: process.platform, arch: process.arch,
      uid: process.getuid?.(), cwd: process.cwd(), env: process.env, scriptPath: fileURLToPath(entryUrl) } });
  } catch (error) {
    // Errors never include raw source/child contents or arbitrary URI values.
    process.stderr.write(`Playwright Linux dependencies: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = controller.signal.aborted ? 130 : 1;
  } finally {
    process.off('SIGINT', interrupt);
    process.off('SIGTERM', interrupt);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await runCli(import.meta.url)
