import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { commandSpec, LIMITS, MIRROR_FILE, MIRROR_WRITER, parseMirror, parsePlaywrightPackages,
  prepare, realIo, runChild, validateHost, validateSources } from '../../.github/scripts/prepare-playwright-linux-deps.mjs';

const ROOT = '/ci-workspace/ai-agent-library/ai-agent-library';
const SOURCE = '/etc/apt/sources.list.d/ubuntu.sources';
const OS = 'ID=ubuntu\nVERSION_ID="24.04"\nVERSION_CODENAME=noble\n';
const MIRROR = Buffer.from('http://azure.archive.ubuntu.com/ubuntu/\tpriority:1\nhttps://archive.ubuntu.com/ubuntu/\tpriority:2\nhttps://security.ubuntu.com/ubuntu/\tpriority:3\n');
const FALLBACK = Buffer.from('https://archive.ubuntu.com/ubuntu/\tpriority:2\nhttps://security.ubuntu.com/ubuntu/\tpriority:3\n');
const SOURCES = 'Types: deb\nURIs: mirror+file:/etc/apt/apt-mirrors.txt\nSuites: noble noble-updates noble-backports\nComponents: main restricted universe multiverse\nSigned-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg\n\nTypes: deb\nURIs: http://security.ubuntu.com/ubuntu/\nSuites: noble-security\nComponents: main restricted universe multiverse\nSigned-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg\n';
const ARRAYS = [['xvfb', 'fonts-noto-color-emoji'], ['libnss3', 'libasound2t64'], ['libnss3', 'libavcodec60']];
const VERSIONS = Array(5).fill('1.63.0');
const TABLE = `      "ubuntu24.04-x64": {\n        tools: ${JSON.stringify(ARRAYS[0])},\n        chromium: ${JSON.stringify(ARRAYS[1])},\n        firefox: ${JSON.stringify(ARRAYS[2])},\n        webkit: [`;

function context() {
  return { platform: 'linux', arch: 'x64', uid: 1001, cwd: ROOT,
    scriptPath: `${ROOT}/.github/scripts/prepare-playwright-linux-deps.mjs`, env: {
      GITHUB_ACTIONS: 'true', RUNNER_OS: 'Linux', RUNNER_ARCH: 'X64', RUNNER_ENVIRONMENT: 'github-hosted',
      GITHUB_REPOSITORY: 'pero3dev/ai-agent-library', PLAYWRIGHT_DEPS_PUBLIC_REPOSITORY: 'true', GITHUB_WORKSPACE: ROOT,
    } };
}

function fixture(codes = [0, 0, 0]) {
  let inode = 1;
  const files = new Map();
  const put = (name, value, extra = {}) => files.set(name, { bytes: Buffer.from(value), mode: 0o644, dev: 1, ino: inode++, uid: 0, ...extra });
  put('/usr/lib/os-release', OS);
  put(`${ROOT}/website/package-lock.json`, JSON.stringify({ lockfileVersion: 3, packages: Object.fromEntries(
    ['playwright', 'playwright-core', '@playwright/test'].map((name) => [`node_modules/${name}`, { version: '1.63.0' }])) }));
  for (const name of ['playwright-core', 'playwright']) put(`${ROOT}/website/node_modules/${name}/package.json`, JSON.stringify({ name, version: '1.63.0' }));
  put(`${ROOT}/website/node_modules/playwright-core/lib/coreBundle.js`, TABLE);
  put(SOURCE, SOURCES);
  put(MIRROR_FILE, MIRROR);
  const calls = [], writes = [], logs = [];
  let hook = async () => {};
  let writeHook = async () => {};
  const sourceNames = [SOURCE];
  const io = {
    async read(name, limit) {
      const file = files.get(name);
      assert.ok(file, `unexpected read ${name}`);
      if (file.link || file.bytes.length > limit) throw new Error('Unsupported regular-file identity or size.');
      return { ...file, bytes: Buffer.from(file.bytes) };
    },
    async directory(name) { assert.equal(name, ROOT); return { uid: 1001 }; },
    async sourceNames() { return [...sourceNames].sort(); },
    log(value) { logs.push(value); },
    async run(options) {
      calls.push(options);
      await hook(options, calls.length);
      return { code: codes.shift() ?? 0 };
    },
    async rewrite(original, expected, replacement) {
      const actual = files.get(MIRROR_FILE);
      assert.ok(expected.some((bytes) => bytes.equals(actual.bytes)));
      assert.equal(actual.mode, original.mode);
      assert.equal(actual.ino, original.ino);
      writes.push(Buffer.from(replacement));
      actual.bytes = Buffer.from(replacement);
      await writeHook(writes.length);
    },
  };
  return { io, files, calls, writes, logs, sourceNames, put, context: context(),
    hook(fn) { hook = fn; }, writeHook(fn) { writeHook = fn; },
    run(signal) { return prepare({ io, context: this.context, signal }); } };
}

test('all three dependency groups form a sorted union without executing bundle code', () => {
  assert.deepEqual(parsePlaywrightPackages(TABLE, VERSIONS), ['fonts-noto-color-emoji', 'libasound2t64', 'libavcodec60', 'libnss3', 'xvfb']);
});
for (let index = 0; index < 5; index++) test(`lock/install version ${index} must be reviewed`, () => {
  const versions = [...VERSIONS]; versions[index] = '1.64.0';
  assert.throws(() => parsePlaywrightPackages(TABLE, versions), /manual/);
});
for (const [name, table] of [
  ['missing group', TABLE.replace('        firefox:', '        other:')],
  ['duplicate platform', `${TABLE}\n${TABLE}`],
  ['shell package', TABLE.replace('"libavcodec60"', '"libavcodec60;id"')],
  ['option package', TABLE.replace('"libavcodec60"', '"--allow-unauthenticated"')],
  ['JS expression', TABLE.replace('["xvfb","fonts-noto-color-emoji"]', '[process.exit()]')],
  ['empty group', TABLE.replace(JSON.stringify(ARRAYS[0]), '[]')],
  ['duplicate group member', TABLE.replace(JSON.stringify(ARRAYS[0]), '["xvfb","xvfb"]')],
  ['nonstring member', TABLE.replace(JSON.stringify(ARRAYS[0]), '[null]')],
]) test(`reject ${name} dependency table`, () => assert.throws(() => parsePlaywrightPackages(table, VERSIONS)));

test('official priority fixture removes Azure only and keeps security bytes', () => assert.deepEqual(parseMirror(MIRROR), FALLBACK));
for (const [name, text] of [
  ['empty', ''], ['extra URI', `${MIRROR}https://evil.invalid/ubuntu/\tpriority:4\n`],
  ['wrong priority', MIRROR.toString().replace('priority:2', 'priority:1')],
  ['spaces instead of tab', MIRROR.toString().replaceAll('\t', ' ')],
  ['credential URI', MIRROR.toString().replace('https://archive.', 'https://user:secret@archive.')],
  ['missing newline', MIRROR.toString().trimEnd()], ['duplicate Azure', `${MIRROR}${MIRROR}`],
]) test(`reject ${name} mirror before sudo`, async () => {
  const f = fixture(); f.files.get(MIRROR_FILE).bytes = Buffer.from(text);
  await assert.rejects(f.run(), /mirror-list/);
  assert.equal(f.calls.length + f.writes.length, 0);
  assert.ok(f.logs.some((entry) => entry.phase === 'configuration' && /^[a-f0-9]{64}$/.test(entry.mirror.sha256)));
});

test('noble source and a shared security mirror retain suites and Signed-By', () => {
  validateSources([{ name: SOURCE, text: SOURCES.replace('http://security.ubuntu.com/ubuntu/', 'mirror+file:/etc/apt/apt-mirrors.txt') }]);
});
test('reviewed one-line Ubuntu/third-party source formats are accepted unchanged', () => {
  validateSources([{ name: '/etc/apt/sources.list', text: 'deb [arch=amd64 signed-by=/usr/share/keyrings/ubuntu-archive-keyring.gpg] mirror+file:/etc/apt/apt-mirrors.txt noble main\n' },
    { name: '/etc/apt/sources.list.d/google-chrome.list', text: 'deb [arch=amd64] https://dl.google.com/linux/chrome/deb/ stable main\n' }]);
});
for (const [name, text] of [
  ['unknown suite', SOURCES.replace('noble-updates', 'oracular-updates')],
  ['unknown keyring', SOURCES.replaceAll('ubuntu-archive-keyring.gpg', 'other.gpg')],
  ['signature bypass', `${SOURCES}\nTrusted: yes\n`],
  ['duplicate fields', SOURCES.replace('Types: deb', 'Types: deb\nTypes: deb')],
  ['credential source', SOURCES.replace('http://security.', 'https://user:secret@security.')],
  ['unreviewed source', SOURCES.replace('http://security.ubuntu.com/ubuntu/', 'https://evil.invalid/ubuntu/')],
  ['unknown component', SOURCES.replace('main restricted', 'main unsafe')],
]) test(`reject ${name} source before sudo`, async () => {
  const f = fixture(); f.files.get(SOURCE).bytes = Buffer.from(text);
  await assert.rejects(f.run()); assert.equal(f.calls.length + f.writes.length, 0);
  assert.ok(!JSON.stringify(f.logs).includes('secret'));
});
test('one-line trusted=yes is refused', () => assert.throws(() => validateSources([{ name: '/etc/apt/sources.list', text: 'deb [trusted=yes] mirror+file:/etc/apt/apt-mirrors.txt noble main\n' }]), /options/));

for (const [name, mutate] of [
  ['non-Linux', (c) => { c.platform = 'darwin'; }], ['wrong arch', (c) => { c.arch = 'arm64'; }],
  ['local CLI', (c) => { c.env.GITHUB_ACTIONS = 'false'; }], ['self hosted', (c) => { c.env.RUNNER_ENVIRONMENT = 'self-hosted'; }],
  ['private repository', (c) => { c.env.PLAYWRIGHT_DEPS_PUBLIC_REPOSITORY = 'false'; }],
  ['wrong repository', (c) => { c.env.GITHUB_REPOSITORY = 'other/repository'; }],
  ['outside workspace', (c) => { c.cwd = '/other'; }], ['wrong script', (c) => { c.scriptPath += '.other'; }],
]) test(`reject ${name} host before sudo`, async () => {
  const f = fixture(); mutate(f.context); await assert.rejects(f.run()); assert.equal(f.calls.length + f.writes.length, 0);
});
for (const os of [OS.replace('ubuntu', 'debian'), OS.replace('24.04', '26.04'), OS.replace('noble', 'oracular'), `${OS}ID=ubuntu\n`]) {
  test(`unknown OS identity ${JSON.stringify(os)} is refused`, () => assert.throws(() => validateHost(context(), os)));
}
test('workspace must belong to this runner user', async () => {
  const f = fixture(); f.io.directory = async () => ({ uid: 0 }); await assert.rejects(f.run(), /ownership/); assert.equal(f.calls.length, 0);
});
for (const [name, mutate] of [
  ['mirror symlink', (f) => { f.files.get(MIRROR_FILE).link = true; }],
  ['mirror wrong mode', (f) => { f.files.get(MIRROR_FILE).mode = 0o666; }],
  ['source writable', (f) => { f.files.get(SOURCE).mode = 0o666; }],
  ['source not root owned', (f) => { f.files.get(SOURCE).uid = 1001; }],
  ['invalid lock JSON', (f) => { f.files.get(`${ROOT}/website/package-lock.json`).bytes = Buffer.from('{"secret":"credential'); }],
]) test(`reject ${name} input before sudo`, async () => {
  const f = fixture(); mutate(f); const error = await f.run().catch((e) => e);
  assert.ok(error instanceof Error); assert.ok(!error.message.includes('credential')); assert.equal(f.calls.length + f.writes.length, 0);
});

test('primary acquisition succeeds once; installation uses no-download and no deadline', async () => {
  const f = fixture(); await f.run();
  assert.deepEqual(f.calls.map((c) => c.phase), ['metadata', 'download', 'install']);
  assert.deepEqual(f.calls.map((c) => c.seconds), [60, 180, null]); assert.equal(f.writes.length, 0);
  assert.ok(f.calls[0].args.includes('APT::Update::Error-Mode=any'));
  assert.ok(f.calls[1].args.includes('--download-only'));
  const install = f.calls[2]; assert.ok(install.args.includes('--no-download')); assert.ok(!install.args.includes('--download-only'));
  assert.equal(install.interruptible, false); assert.equal(install.signal, undefined);
  assert.deepEqual(install.args.slice(4), parsePlaywrightPackages(TABLE, VERSIONS));
  assert.ok(!JSON.stringify(f.calls).match(/ForceIPv4|allow-unauthenticated|AllowInsecure|--with-deps/));
});
for (const [name, codes, phases] of [
  ['metadata timeout', [124, 0, 0, 0], ['metadata', 'metadata', 'download', 'install']],
  ['download timeout', [0, 124, 0, 0, 0], ['metadata', 'download', 'metadata', 'download', 'install']],
  ['download error', [0, 100, 0, 0, 0], ['metadata', 'download', 'metadata', 'download', 'install']],
]) test(`${name} uses one fallback and restores exact bytes before install`, async () => {
  const f = fixture(codes); const original = { ...f.files.get(MIRROR_FILE) };
  f.hook(async (c) => { if (c.phase === 'install') assert.deepEqual(f.files.get(MIRROR_FILE), original); });
  await f.run(); assert.deepEqual(f.calls.map((c) => c.phase), phases);
  assert.deepEqual(f.writes, [FALLBACK, MIRROR]); assert.deepEqual(f.files.get(MIRROR_FILE), original);
  assert.equal(f.logs.filter((l) => l.phase === 'fallback').length, 1);
});
for (const codes of [[124, 124], [0, 100, 0, 100]]) test(`fallback failure ${codes} restores without install or third fetch`, async () => {
  const f = fixture([...codes]); await assert.rejects(f.run(), /one official/);
  assert.ok(!f.calls.some((c) => c.phase === 'install')); assert.deepEqual(f.files.get(MIRROR_FILE).bytes, MIRROR); assert.equal(f.writes.length, 2);
});
test('dpkg-capable installation failure is never retried or followed by mirror changes', async () => {
  const f = fixture([0, 0, 100]); await assert.rejects(f.run(), /no retry/);
  assert.deepEqual(f.calls.map((c) => c.phase), ['metadata', 'download', 'install']); assert.equal(f.writes.length, 0);
});
for (const stage of ['metadata', 'fallback-download', 'fallback-write']) test(`interrupt during ${stage} prevents install and restores if necessary`, async () => {
  const f = fixture(stage === 'metadata' ? [0] : [124, 0, 0]); const controller = new AbortController();
  f.hook(async (c) => { if ((stage === 'metadata' && c.phase === 'metadata') || (stage === 'fallback-download' && c.attempt === 2 && c.phase === 'download')) controller.abort(); });
  if (stage === 'fallback-write') f.writeHook(async (n) => { if (n === 1) controller.abort(); });
  await assert.rejects(f.run(controller.signal), /interrupted/);
  assert.ok(!f.calls.some((c) => c.phase === 'install')); assert.deepEqual(f.files.get(MIRROR_FILE).bytes, MIRROR);
  if (stage === 'metadata') assert.equal(f.writes.length, 0); else assert.equal(f.writes.length, 2);
});
test('writer reports an error after changing bytes; finally still restores original', async () => {
  const f = fixture([124]); f.writeHook(async (n) => { if (n === 1) throw new Error('writer failed'); });
  await assert.rejects(f.run(), /writer failed/); assert.deepEqual(f.files.get(MIRROR_FILE).bytes, MIRROR); assert.equal(f.writes.length, 2);
});
test('restoration failure blocks installation', async () => {
  const f = fixture([124, 0, 0]); f.writeHook(async (n) => { if (n === 2) throw new Error('restore failed'); });
  await assert.rejects(f.run(), /restore failed/); assert.ok(!f.calls.some((c) => c.phase === 'install'));
});
for (const [name, mutate] of [
  ['source bytes', (f) => { f.files.get(SOURCE).bytes = Buffer.from(`${SOURCES}# changed\n`); }],
  ['mirror bytes', (f) => { f.files.get(MIRROR_FILE).bytes = Buffer.from('changed'); }],
  ['source identity', (f) => { f.files.get(SOURCE).ino++; }],
  ['mirror mode', (f) => { f.files.get(MIRROR_FILE).mode = 0o600; }],
  ['source inventory', (f) => { f.sourceNames.push('/etc/apt/sources.list.d/new.list'); }],
]) test(`changed ${name} after metadata prevents download and fallback`, async () => {
  const f = fixture(); f.hook(async () => mutate(f)); await assert.rejects(f.run(), /changed/);
  assert.equal(f.calls.length, 1); assert.equal(f.writes.length, 0);
});

test('root timeout applies only to metadata/download, never installation', () => {
  const acquired = commandSpec({ args: ['update'], seconds: 60 });
  assert.deepEqual(acquired, { command: '/usr/bin/sudo', args: ['-n', '/usr/bin/timeout', '--signal=TERM', '--kill-after=5s', '60s', '/usr/bin/apt-get', 'update'] });
  assert.deepEqual(commandSpec({ args: ['install', '--no-download'], seconds: null }), { command: '/usr/bin/sudo', args: ['-n', '/usr/bin/apt-get', 'install', '--no-download'] });
});
test('filesystem adapter preserves the final sudo/root-timeout argument vector', async () => {
  const calls = []; const io = realIo({ run: async (spec) => { calls.push(spec); return { code: 0 }; } });
  await io.run({ phase: 'metadata', args: ['-o', 'Acquire::Retries=0', 'update'], seconds: 60, interruptible: true });
  await io.run({ phase: 'install', args: ['install', '--no-download', 'libnss3'], seconds: null, interruptible: false });
  assert.deepEqual(calls[0].args, ['-n', '/usr/bin/timeout', '--signal=TERM', '--kill-after=5s', '60s', '/usr/bin/apt-get', '-o', 'Acquire::Retries=0', 'update']);
  assert.deepEqual(calls[1].args, ['-n', '/usr/bin/apt-get', 'install', '--no-download', 'libnss3']);
  assert.equal(calls[0].command, '/usr/bin/sudo');
});
function childFixture() {
  const calls = [], kills = [];
  let child;
  return { calls, kills, get child() { return child; }, options: {
    spawnChild(command, args, options) { child = new EventEmitter(); child.pid = 123;
      child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); child.stdin = new EventEmitter(); child.stdin.end = () => {};
      calls.push({ command, args, options }); return child; },
    killGroup(pid, signal) { kills.push([pid, signal]); },
  } };
}
test('abort signals the group once and waits for child close before settling', async () => {
  const f = childFixture(), controller = new AbortController(); let settled = false;
  const promise = runChild({ command: '/usr/bin/sudo', args: [], interruptible: true, signal: controller.signal }, f.options).then((r) => { settled = true; return r; });
  controller.abort(); assert.deepEqual(f.kills, [[123, 'SIGTERM']]); await Promise.resolve(); assert.equal(settled, false);
  f.child.emit('close', 124, null); assert.equal((await promise).code, 124);
  assert.equal(f.calls[0].options.shell, false); assert.equal(f.calls[0].options.detached, true);
  assert.deepEqual(Object.keys(f.calls[0].options.env).sort(), ['DEBIAN_FRONTEND', 'LANG', 'LC_ALL', 'PATH']);
});
test('acquisition output limit stops once, retains no child URL text, and waits for close', async () => {
  const f = childFixture(); const promise = runChild({ command: '/usr/bin/sudo', args: [], interruptible: true }, f.options);
  f.child.stderr.emit('data', Buffer.alloc(LIMITS.outputBytes + 1, 120)); f.child.stdout.emit('data', Buffer.from('https://user:secret@host/'));
  assert.equal(f.kills.length, 1); f.child.emit('close', 128, 'SIGTERM'); await assert.rejects(promise, /output limit/);
});
test('install output and abort do not kill dpkg-capable child', async () => {
  const f = childFixture(), controller = new AbortController();
  const promise = runChild({ command: '/usr/bin/sudo', args: [], interruptible: false, signal: controller.signal }, f.options);
  controller.abort(); f.child.stdout.emit('data', Buffer.alloc(LIMITS.outputBytes + 1)); assert.equal(f.kills.length, 0);
  f.child.emit('close', 0, null); assert.equal((await promise).code, 0);
});
test('safe root writer uses stdin data, no-follow/identity checks and same-fd rollback', async () => {
  const calls = []; const io = realIo({ run: async (spec) => { calls.push(spec); return { code: 0 }; } });
  await io.rewrite({ dev: 1, ino: 2, uid: 0, mode: 0o644 }, [MIRROR, FALLBACK], MIRROR);
  assert.deepEqual(calls[0].args.slice(0, 4), ['-n', '/usr/bin/python3', '-I', '-c']);
  assert.equal(calls[0].interruptible, false); assert.deepEqual(Buffer.from(JSON.parse(calls[0].input).replacement, 'base64'), MIRROR);
  for (const guard of ['os.O_NOFOLLOW', "s.st_ino!=r['ino']", "stat.S_IMODE(s.st_mode)!=r['mode']", 'except BaseException:', 'replace(current)']) assert.ok(MIRROR_WRITER.includes(guard));
});
for (const [name, stat, realpath] of [
  ['symlink', { link: true }, '/etc/apt/real'], ['wrong realpath', {}, '/other'], ['special file', { regular: false }, MIRROR_FILE],
]) test(`filesystem adapter refuses ${name} before open`, async () => {
  let opened = false;
  const io = realIo({ fsApi: { async lstat() { return { isFile: () => stat.regular !== false, isSymbolicLink: () => !!stat.link, size: 12 }; },
    async realpath() { return realpath; }, async open() { opened = true; throw new Error('must not open'); } } });
  await assert.rejects(io.read(MIRROR_FILE, 4096)); assert.equal(opened, false);
});
test('filesystem adapter detects an open race before reading file contents', async () => {
  let read = false, closed = false;
  const io = realIo({ fsApi: { async lstat() { return { isFile: () => true, isSymbolicLink: () => false, size: 1, dev: 1, ino: 2, uid: 0, mode: 0o100644 }; },
    async realpath(name) { return name; }, async open() { return {
      async stat() { return { dev: 1, ino: 3, uid: 0, mode: 0o100644 }; },
      async readFile() { read = true; return Buffer.from('x'); }, async close() { closed = true; },
    }; } } });
  await assert.rejects(io.read(MIRROR_FILE, 4096), /changed/); assert.equal(read, false); assert.equal(closed, true);
});
test('unknown source filenames are rejected without reading or logging them', async () => {
  const io = realIo({ fsApi: {
    async lstat(name) { if (name === '/etc/apt/sources.list') throw Object.assign(new Error(), { code: 'ENOENT' }); return { isDirectory: () => true, isSymbolicLink: () => false }; },
    async realpath(name) { return name; }, async readdir() { return ['bad\nsecret.list']; },
  } });
  await assert.rejects(io.sourceNames(), /filename/);
});
