import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { deflateRawSync, deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { verifyBuiltAppIcon } from '../../ios/tests/check-built-app-icon.mjs';

// These are synthetic file/metadata fixtures. Their nonempty CAR is a sentinel,
// never a claim that actool compiled a catalog or that CAR internals are valid.
const helper = fileURLToPath(new URL('../../ios/tests/check-built-app-icon.mjs', import.meta.url));
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function chunk(type, data) {
  const name = Buffer.from(type), body = Buffer.concat([name, data]);
  let crc = 0xffffffff;
  for (const byte of body) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  const result = Buffer.alloc(data.length + 12);
  result.writeUInt32BE(data.length); name.copy(result, 4); data.copy(result, 8);
  result.writeUInt32BE((crc ^ 0xffffffff) >>> 0, result.length - 4);
  return result;
}
function png(size, optimized = false) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
  const pixels = Buffer.alloc((size * 4 + 1) * size);
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      const p = row * (size * 4 + 1) + 1 + column * 4;
      pixels[p] = 11; pixels[p + 1] = 23; pixels[p + 2] = 40; pixels[p + 3] = 255;
    }
  }
  return Buffer.concat([signature, ...(optimized ? [chunk('CgBI', Buffer.from([80, 0, 32, 6]))] : []),
    chunk('IHDR', header), chunk('IDAT', optimized ? deflateRawSync(pixels) : deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
}
function info() {
  return { CFBundlePackageType: 'APPL', UIDeviceFamily: [1], CFBundleSupportedPlatforms: ['iPhoneSimulator'],
    CFBundleIcons: { CFBundlePrimaryIcon: { CFBundleIconName: 'AppIcon', CFBundleIconFiles: ['AppIcon60x60'] } } };
}
async function fixture(t, { scales = [2, 3] } = {}) {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'ailibrary-built-icon-test-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const app = path.join(root, 'AILibrary.app');
  await mkdir(path.join(app, 'Content'), { recursive: true });
  const metadata = info();
  const writeInfo = () => writeFile(path.join(app, 'Info.plist'), JSON.stringify(metadata));
  await writeInfo();
  await writeFile(path.join(app, 'Assets.car'), 'SYNTHETIC-presence-only-not-real-CAR');
  await writeFile(path.join(app, 'Content', 'manifest.json'), '{}');
  for (const scale of scales) await writeFile(path.join(app, `AppIcon60x60@${scale}x.png`), png(60 * scale, scale === 3));
  return { root, app, metadata, writeInfo,
    verify: (options = {}) => verifyBuiltAppIcon(app, { decodePlist: bytes => JSON.parse(bytes.toString('utf8')), ...options }) };
}
async function snapshots(app) {
  return Object.fromEntries(await Promise.all((await readdir(app)).filter(name => name !== 'Content').map(async name =>
    [name, hash(await readFile(path.join(app, name)))])));
}

test('full synthetic bundle accepts standard and CgBI icon metadata without changing files', async t => {
  const value = await fixture(t), before = await snapshots(value.app);
  const result = await value.verify();
  assert.equal(result.scope, 'built-AppIcon-file-metadata-only');
  assert.deepEqual(result.required_iphone_scales, [2, 3]);
  assert.deepEqual(result.PNGs.map(image => [image.width, image.height, image.optimized_CgBI]), [[120, 120, false], [180, 180, true]]);
  assert.ok(result.not_verified.includes('CAR internals'));
  assert.deepEqual(await snapshots(value.app), before);
});

test('a thinned iPhone16 Debug fixture permits 3x only while generic Release requires both scales', async t => {
  const value = await fixture(t, { scales: [3] });
  assert.equal((await value.verify({ requiredScales: [3] })).PNGs.length, 1);
  await assert.rejects(value.verify(), /Missing required iPhone60@2x/);
});

test('iPhoneOS bundle and explicit .png Info file entries resolve the same scale-bound files', async t => {
  const value = await fixture(t);
  value.metadata.CFBundleSupportedPlatforms = ['iPhoneOS'];
  value.metadata.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconFiles = ['AppIcon60x60@2x.png', 'AppIcon60x60@3x.png'];
  await value.writeInfo();
  assert.equal((await value.verify()).platform, 'iPhoneOS');
});

test('wrong or missing primary icon metadata is rejected', async t => {
  for (const change of [metadata => { metadata.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconName = 'OldIcon'; },
    metadata => { delete metadata.CFBundleIcons; }, metadata => { metadata.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconFiles = []; }]) {
    const value = await fixture(t); change(value.metadata); await value.writeInfo();
    await assert.rejects(value.verify(), /primary icon name|CFBundleIconFiles/);
  }
});

test('unsafe, duplicate, unsupported, or stale icon stems cannot be satisfied by unrelated PNGs', async t => {
  for (const stems of [['../outside'], ['OtherIcon60x60'], ['AppIcon60x60', 'AppIcon60x60'], ['AppIcon29x29']]) {
    const value = await fixture(t);
    value.metadata.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconFiles = stems; await value.writeInfo();
    await assert.rejects(value.verify(), /file stem|CFBundleIconFiles/);
  }
});

test('absent, empty, or symlink CAR is rejected despite valid icon PNGs', async t => {
  for (const mode of ['missing', 'empty', ...(process.platform === 'win32' ? [] : ['symlink'])]) {
    const value = await fixture(t), car = path.join(value.app, 'Assets.car');
    await rm(car);
    if (mode === 'empty') await writeFile(car, '');
    if (mode === 'symlink') await symlink(path.join(value.app, 'Info.plist'), car);
    await assert.rejects(value.verify(), /ENOENT|file size|regular file/);
  }
});

test('a valid PNG with wrong dimensions cannot satisfy its filename scale', async t => {
  const value = await fixture(t);
  await writeFile(path.join(value.app, 'AppIcon60x60@3x.png'), png(120, true));
  await assert.rejects(value.verify(), /width does not match/);
});

test('invalid signature, truncated chunks, CRC corruption, and trailing data are rejected', async t => {
  for (const change of [bytes => Buffer.alloc(bytes.length), bytes => bytes.subarray(0, bytes.length - 3),
    bytes => { const changed = Buffer.from(bytes); changed[changed.length - 5] ^= 1; return changed; },
    bytes => Buffer.concat([bytes, Buffer.from('unexpected')])]) {
    const value = await fixture(t), file = path.join(value.app, 'AppIcon60x60@3x.png');
    await writeFile(file, change(await readFile(file)));
    await assert.rejects(value.verify(), /PNG signature|Truncated|CRC mismatch|trailing data/);
  }
});

test('misplaced CgBI metadata and missing image payload are rejected', async t => {
  const value = await fixture(t), file = path.join(value.app, 'AppIcon60x60@3x.png');
  const original = png(180);
  await writeFile(file, Buffer.concat([original.subarray(0, 33), chunk('CgBI', Buffer.from([80, 0, 32, 6])), original.subarray(33)]));
  await assert.rejects(value.verify(), /Invalid CgBI/);
  const headerOnly = Buffer.concat([original.subarray(0, 33), chunk('IEND', Buffer.alloc(0))]);
  await writeFile(file, headerOnly);
  await assert.rejects(value.verify(), /Incomplete icon PNG/);
});

test('app, Info, and referenced image symlinks are rejected', { skip: process.platform === 'win32' }, async t => {
  const value = await fixture(t), alias = path.join(value.root, 'alias.app');
  await symlink(value.app, alias);
  await assert.rejects(verifyBuiltAppIcon(alias), /real built app directory/);
  const file = path.join(value.app, 'AppIcon60x60@3x.png'), target = path.join(value.root, 'real.png');
  await writeFile(target, await readFile(file)); await rm(file); await symlink(target, file);
  await assert.rejects(value.verify(), /regular file/);
  await rm(file); await writeFile(file, png(180));
  const plist = path.join(value.app, 'Info.plist'), saved = path.join(value.root, 'saved.plist');
  await writeFile(saved, await readFile(plist)); await rm(plist); await symlink(saved, plist);
  await assert.rejects(value.verify(), /regular file/);
});

test('missing Info, partial Info, wrong target platform, and malformed scale policy are rejected', async t => {
  const value = await fixture(t);
  value.metadata.CFBundleSupportedPlatforms = ['MacOSX']; await value.writeInfo();
  await assert.rejects(value.verify(), /Unexpected built app platform/);
  await writeFile(path.join(value.app, 'Info.plist'), JSON.stringify({ CFBundleIcons: value.metadata.CFBundleIcons }));
  await assert.rejects(value.verify(), /built application Info/);
  await rm(path.join(value.app, 'Info.plist'));
  await assert.rejects(value.verify(), /ENOENT/);
  await assert.rejects(value.verify({ requiredScales: [] }), /Invalid required/);
});

const xmlValue = value => Array.isArray(value) ? '<array>' + value.map(xmlValue).join('') + '</array>'
  : typeof value === 'object' ? '<dict>' + Object.entries(value).map(([key, item]) => '<key>' + key + '</key>' + xmlValue(item)).join('') + '</dict>'
  : typeof value === 'number' ? '<integer>' + value + '</integer>' : '<string>' + value + '</string>';

test('macOS production adapter and CLI read the actual XML and binary Info bytes', { skip: process.platform !== 'darwin' }, async t => {
  const value = await fixture(t), plist = path.join(value.app, 'Info.plist');
  const xml = Buffer.from('<?xml version="1.0" encoding="UTF-8"?><plist version="1.0">' + xmlValue(value.metadata) + '</plist>');
  await writeFile(plist, xml);
  assert.equal((await verifyBuiltAppIcon(value.app)).primary_icon_name, 'AppIcon');
  const binary = execFileSync('/usr/bin/plutil', ['-convert', 'binary1', '-o', '-', '-'], { input: xml });
  await writeFile(plist, binary);
  assert.equal((await verifyBuiltAppIcon(value.app)).Info_plist_sha256, hash(binary));
  const cli = spawnSync(process.execPath, [helper, value.app, '--required-scales', '2,3'], { encoding: 'utf8' });
  assert.equal(cli.status, 0, cli.stderr);
  assert.equal(JSON.parse(cli.stdout).scope, 'built-AppIcon-file-metadata-only');
  await writeFile(plist, 'invalid plist');
  await assert.rejects(verifyBuiltAppIcon(value.app), /plutil|Unexpected token|JSON|Command failed/);
});

test('CLI rejects an unspecified or unsupported scale policy', () => {
  const result = spawnSync(process.execPath, [helper, 'unused.app', '--required-scales', 'any'], { encoding: 'utf8' });
  assert.equal(result.status, 1); assert.match(result.stderr, /Usage:/);
});
