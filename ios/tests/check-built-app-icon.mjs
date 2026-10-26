#!/usr/bin/env node
// Read-only AppIcon metadata audit. MIT; compilation and visual acceptance are separate.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const crcTable = Array.from({ length: 256 }, (_, initial) => {
  let value = initial;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = crcTable[(value ^ byte) & 255] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

async function regular(file, maximum) {
  const stat = await lstat(file);
  assert.ok(stat.isFile() && !stat.isSymbolicLink(), `Expected regular file: ${file}`);
  assert.ok(stat.size > 0 && stat.size <= maximum, `Invalid file size: ${file}`);
  const bytes = await readFile(file);
  assert.ok(bytes.length > 0 && bytes.length <= maximum, `Invalid read size: ${file}`);
  return bytes;
}

// plutil is the existing macOS plist reader; input is the bytes just read from
// this app's Info.plist. No temporary files, package dependency, shell or SDK.
export function decodeApplePlist(bytes) {
  return JSON.parse(execFileSync('/usr/bin/plutil', ['-convert', 'json', '-o', '-', '-'], {
    input: bytes, encoding: 'utf8', timeout: 5000, maxBuffer: 1024 * 1024
  }));
}

export function inspectCompiledIconPng(bytes) {
  assert.ok(Buffer.isBuffer(bytes) && bytes.length >= 45 && bytes.length <= 32 * 1024 * 1024, 'Invalid compiled icon PNG byte length');
  assert.ok(bytes.subarray(0, 8).equals(PNG_SIGNATURE), 'Invalid icon PNG signature');
  let cursor = 8, header, cgbi = false, idatBytes = 0, ended = false, chunks = 0;
  while (cursor < bytes.length) {
    assert.ok(++chunks <= 4096 && cursor + 12 <= bytes.length, 'Truncated or excessive icon PNG chunks');
    const length = bytes.readUInt32BE(cursor), end = cursor + 12 + length;
    assert.ok(end <= bytes.length, 'Truncated icon PNG data');
    const type = bytes.toString('ascii', cursor + 4, cursor + 8);
    assert.equal(crc32(bytes.subarray(cursor + 4, end - 4)), bytes.readUInt32BE(end - 4), 'Icon PNG CRC mismatch');
    if (!header && type !== 'CgBI') assert.equal(type, 'IHDR', 'Icon PNG must begin with IHDR or CgBI/IHDR');
    if (type === 'CgBI') {
      assert.ok(cursor === 8 && !header && !cgbi && length === 4, 'Invalid CgBI icon header');
      cgbi = true;
    } else if (type === 'IHDR') {
      assert.ok(!header && length === 13, 'Invalid or duplicate icon IHDR');
      const width = bytes.readUInt32BE(cursor + 8), height = bytes.readUInt32BE(cursor + 12);
      assert.ok(width > 0 && height > 0 && width <= 4096 && height <= 4096, 'Invalid icon dimensions');
      assert.equal(bytes[cursor + 16], 8, 'Expected 8-bit compiled icon PNG');
      assert.ok([2, 6].includes(bytes[cursor + 17]), 'Expected RGB/RGBA compiled icon PNG');
      assert.equal(bytes[cursor + 18], 0); assert.equal(bytes[cursor + 19], 0); assert.equal(bytes[cursor + 20], 0);
      header = { width, height, color_type: bytes[cursor + 17] };
    } else if (type === 'IDAT') {
      assert.ok(header, 'Missing icon IHDR');
      idatBytes += length;
    } else if (type === 'IEND') {
      assert.ok(header && length === 0 && idatBytes > 0, 'Incomplete icon PNG');
      ended = true; cursor = end; break;
    }
    cursor = end;
  }
  assert.ok(ended && cursor === bytes.length, 'Incomplete icon PNG or trailing data');
  return { ...header, optimized_CgBI: cgbi, bytes: bytes.length, sha256: hash(bytes) };
}

/** decodePlist is injectable only to keep synthetic metadata tests portable.
 * CLI and Hosted use the fixed macOS reader on the actual built Info bytes.
 * Initial, unobserved Hosted policy: [3] for the iPhone16 Debug destination,
 * [2,3] for generic Release/Archive. Synthetic thinning is tested; real built
 * bundle scale availability still needs Hosted observation. No CAR/pixel decode.
 */
export async function verifyBuiltAppIcon(appRoot, { requiredScales = [2, 3], decodePlist = decodeApplePlist } = {}) {
  assert.ok(Array.isArray(requiredScales) && requiredScales.length > 0
    && requiredScales.every(scale => [2, 3].includes(scale))
    && new Set(requiredScales).size === requiredScales.length, 'Invalid required iPhone scales');
  const app = path.resolve(appRoot), rootStat = await lstat(app);
  assert.ok(rootStat.isDirectory() && !rootStat.isSymbolicLink(), 'Expected real built app directory');
  const infoBytes = await regular(path.join(app, 'Info.plist'), 1024 * 1024);
  const info = decodePlist(infoBytes);
  assert.equal(info?.CFBundlePackageType, 'APPL', 'Expected built application Info.plist');
  assert.deepEqual(info.UIDeviceFamily, [1], 'Expected the adopted iPhone-only target');
  assert.ok(Array.isArray(info.CFBundleSupportedPlatforms) && info.CFBundleSupportedPlatforms.length === 1
    && ['iPhoneOS', 'iPhoneSimulator'].includes(info.CFBundleSupportedPlatforms[0]), 'Unexpected built app platform');
  const primary = info.CFBundleIcons?.CFBundlePrimaryIcon;
  assert.equal(primary?.CFBundleIconName, 'AppIcon', 'Built primary icon name must be AppIcon');
  const entries = primary.CFBundleIconFiles;
  assert.ok(Array.isArray(entries) && entries.length > 0 && entries.length <= 16
    && new Set(entries).size === entries.length, 'Invalid CFBundleIconFiles');
  const car = await regular(path.join(app, 'Assets.car'), 64 * 1024 * 1024);
  const names = await readdir(app), files = new Map();
  for (const entry of entries) {
    assert.equal(typeof entry, 'string', 'Invalid icon file stem');
    const parts = /^AppIcon([1-9][0-9]{0,3})x([1-9][0-9]{0,3})(?:@([123])x)?(?:~iphone)?(?:\.png)?$/.exec(entry);
    assert.ok(parts && parts[1] === parts[2], 'Unsafe or unsupported primary icon file stem');
    const stem = `AppIcon${parts[1]}x${parts[2]}`;
    const pattern = new RegExp(`^${stem}(?:@([123])x)?(?:~iphone)?\\.png$`);
    const matches = names.flatMap(name => {
      const match = pattern.exec(name), scale = Number(match?.[1] ?? 1);
      return match && (!parts[3] || scale === Number(parts[3])) ? [{ name, scale }] : [];
    });
    assert.ok(matches.length > 0, `No built PNG resolves icon file stem: ${entry}`);
    for (const { name, scale } of matches) {
      const image = inspectCompiledIconPng(await regular(path.join(app, name), 32 * 1024 * 1024));
      const expected = Number(parts[1]) * scale;
      assert.equal(image.width, expected, `Icon width does not match its stem/scale: ${name}`);
      assert.equal(image.height, expected, `Icon height does not match its stem/scale: ${name}`);
      files.set(name, { filename: name, points: Number(parts[1]), scale, ...image });
    }
  }
  for (const scale of requiredScales) {
    assert.ok([...files.values()].some(image => image.points === 60 && image.scale === scale),
      `Missing required iPhone60@${scale}x PNG`);
  }
  return { schema_version: 1, status: 'passed', scope: 'built-AppIcon-file-metadata-only',
    platform: info.CFBundleSupportedPlatforms[0], primary_icon_name: primary.CFBundleIconName,
    primary_icon_files: entries, required_iphone_scales: requiredScales,
    Info_plist_sha256: hash(infoBytes), Assets_car: { bytes: car.length, sha256: hash(car) },
    PNGs: [...files.values()].sort((a, b) => a.filename.localeCompare(b.filename)),
    not_verified: ['CAR internals', 'PNG pixel decoding or opacity', 'Home Screen appearance', 'signing', 'Store acceptance'] };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    assert.ok(args.length === 3 && args[1] === '--required-scales' && ['3', '2,3'].includes(args[2]),
      'Usage: node ios/tests/check-built-app-icon.mjs <built AILibrary.app> --required-scales <3|2,3>');
    console.log(JSON.stringify(await verifyBuiltAppIcon(args[0], { requiredScales: args[2].split(',').map(Number) }), null, 2));
  } catch (error) {
    console.error(`Built AppIcon audit failed: ${error.message}`); process.exitCode = 1;
  }
}
