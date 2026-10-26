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

// This adapter observes only the captured assetutil format. It does not decode
// CAR pixels or establish a general Apple asset catalog specification.
export function readAppleAssetCatalog(carPath) {
  const output = execFileSync('/usr/bin/xcrun', ['assetutil', '--info', carPath], {
    encoding: 'utf8', timeout: 45000, maxBuffer: 4 * 1024 * 1024, killSignal: 'SIGKILL'
  });
  assert.ok(Buffer.byteLength(output, 'utf8') <= 4 * 1024 * 1024, 'Asset catalog reader output cap');
  return JSON.parse(output);
}

export function inspectCompiledAppIconCatalog(rows, { requiredScales = [2, 3], primaryName = 'AppIcon' } = {}) {
  assert.ok(Array.isArray(requiredScales) && requiredScales.length > 0
    && requiredScales.every(scale => [2, 3].includes(scale))
    && new Set(requiredScales).size === requiredScales.length, 'Invalid required iPhone scales');
  assert.ok(typeof primaryName === 'string' && primaryName.length > 0 && primaryName.length <= 256, 'Invalid primary catalog name');
  assert.ok(Array.isArray(rows) && rows.length >= 2 && rows.length <= 4096, 'Unknown asset catalog root');
  assert.ok(Buffer.byteLength(JSON.stringify(rows), 'utf8') <= 4 * 1024 * 1024, 'Asset catalog parsed input cap');
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const integer = value => Number.isSafeInteger(value) && value > 0 && value <= 0x7fffffff;
  const finiteVersion = value => typeof value === 'number' && Number.isFinite(value) && value > 0;
  const text = value => typeof value === 'string' && value.length > 0 && value.length <= 512 && !value.includes('\0');
  const has = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const subtype = row => {
    if (!has(row, 'Subtype')) return null;
    assert.ok(integer(row.Subtype), 'Invalid catalog subtype'); return row.Subtype;
  };
  const header = rows[0];
  assert.ok(object(header) && !has(header, 'AssetType'), 'Unknown asset catalog header');
  assert.equal(header.SchemaVersion, 2, 'Unknown asset catalog schema');
  assert.equal(header.StorageVersion, 17, 'Unknown asset catalog storage');
  assert.equal(header.Platform, 'ios', 'Unknown asset catalog platform');
  assert.ok(text(header.AssetStorageVersion) && typeof header.PlatformVersion === 'string'
    && /^\d+(?:\.\d+){0,2}$/.test(header.PlatformVersion), 'Invalid catalog storage/platform version');
  assert.ok(finiteVersion(header.CoreUIVersion) && finiteVersion(header.DumpToolVersion), 'Invalid catalog tool version');
  const keyFormat = ['kCRThemeAppearanceName', 'kCRThemeLocalizationName', 'kCRThemeScaleName',
    'kCRThemeIdiomName', 'kCRThemeSubtypeName', 'kCRThemeDimension2Name',
    'kCRThemeDimension1Name', 'kCRThemeIdentifierName', 'kCRThemeElementName', 'kCRThemePartName'];
  assert.ok(Array.isArray(header['Key Format']) && header['Key Format'].length === keyFormat.length
    && header['Key Format'].every((key, index) => key === keyFormat[index]), 'Unknown catalog key format');
  const mappings = [], icons = [];
  for (const row of rows.slice(1)) {
    assert.ok(object(row) && Object.keys(row).length <= 128, 'Unknown asset catalog row');
    assert.ok(['Icon Image', 'MultiSized Image', 'PackedImage'].includes(row.AssetType), 'Unknown asset catalog asset type');
    assert.ok(text(row.Name) && ['phone', 'marketing'].includes(row.Idiom), 'Invalid catalog name or idiom');
    assert.ok(Number.isSafeInteger(row.Scale) && row.Scale >= 1 && row.Scale <= 3, 'Invalid catalog scale');
    if (row.AssetType === 'PackedImage') continue; // Never a primary icon candidate.
    assert.ok(integer(row.NameIdentifier), 'Invalid catalog name identifier');
    const common = { name: row.Name, name_identifier: row.NameIdentifier, idiom: row.Idiom, subtype: subtype(row) };
    if (row.AssetType === 'MultiSized Image') {
      assert.equal(row.Scale, 1, 'Invalid MultiSized mapping scale');
      assert.ok(Array.isArray(row.Sizes) && row.Sizes.length > 0 && row.Sizes.length <= 64, 'Invalid MultiSized sizes');
      const sizes = row.Sizes.map(value => {
        assert.ok(typeof value === 'string' && value.length <= 256, 'Invalid MultiSized size row');
        const match = /^([1-9][0-9]{0,3})x([1-9][0-9]{0,3}) index:([1-9][0-9]{0,9}) idiom:(phone|marketing)(?: subtype:([1-9][0-9]{0,9}))?$/.exec(value);
        assert.ok(match, 'Unknown MultiSized size mapping');
        const width = Number(match[1]), height = Number(match[2]), index = Number(match[3]);
        const sizeSubtype = match[5] ? Number(match[5]) : null;
        assert.ok(integer(index) && width === height && width <= 4096, 'Invalid MultiSized index or size');
        assert.equal(match[4], common.idiom, 'MultiSized idiom bridge mismatch');
        assert.equal(sizeSubtype, common.subtype, 'MultiSized subtype bridge mismatch');
        return { ...common, points: width, index };
      });
      mappings.push({ ...common, sizes });
    } else {
      assert.ok(integer(row['Icon Index']), 'Invalid Icon Image index');
      assert.equal(row.BitsPerComponent, 8, 'Expected RGB8 icon metadata');
      assert.equal(row.ColorModel, 'RGB', 'Expected RGB icon metadata');
      assert.equal(row.Opaque, true, 'Expected opaque icon metadata');
      assert.equal(row.Encoding, 'ARGB', 'Unknown icon image encoding');
      assert.ok(integer(row.PixelWidth) && integer(row.PixelHeight) && row.PixelWidth <= 4096 && row.PixelHeight <= 4096,
        'Invalid catalog icon dimensions');
      assert.ok(text(row.RenditionName), 'Invalid catalog rendition name');
      icons.push({ ...common, index: row['Icon Index'], scale: row.Scale,
        width: row.PixelWidth, height: row.PixelHeight, rendition_name: row.RenditionName,
        bits_per_component: row.BitsPerComponent, color_model: row.ColorModel, opaque_metadata: row.Opaque });
    }
  }
  const indexKey = entry => JSON.stringify([entry.name, entry.name_identifier, entry.idiom, entry.subtype, entry.index]);
  const pointsKey = entry => JSON.stringify([entry.name, entry.name_identifier, entry.idiom, entry.subtype, entry.points]);
  const byIndex = new Map(), byPoints = new Set();
  for (const mapping of mappings) for (const size of mapping.sizes) {
    const key = indexKey(size), point = pointsKey(size);
    assert.ok(!byIndex.has(key) && !byPoints.has(point), 'Duplicate or ambiguous MultiSized mapping');
    byIndex.set(key, size); byPoints.add(point);
  }
  const imageKeys = new Set();
  for (const image of icons) {
    const key = indexKey(image), unique = key + ':' + image.scale;
    assert.ok(!imageKeys.has(unique), 'Duplicate catalog icon rendition'); imageKeys.add(unique);
    const size = byIndex.get(key);
    assert.ok(size, 'Icon Image has no same-name/id/idiom/subtype/index mapping');
    assert.equal(image.width, size.points * image.scale, 'Icon Image width does not match mapping/scale');
    assert.equal(image.height, size.points * image.scale, 'Icon Image height does not match mapping/scale');
  }
  const standard = mappings.filter(mapping => mapping.name === primaryName && mapping.idiom === 'phone' && mapping.subtype === null);
  assert.equal(standard.length, 1, 'Missing or ambiguous standard phone primary mapping');
  const target = standard[0].sizes.filter(size => size.points === 60);
  assert.equal(target.length, 1, 'Missing or ambiguous phone60pt primary mapping');
  const mapping = target[0], images = [];
  for (const scale of requiredScales) {
    const matches = icons.filter(image => indexKey(image) === indexKey(mapping) && image.scale === scale);
    assert.equal(matches.length, 1, `Missing or ambiguous required CAR iPhone60@${scale}x rendition`);
    images.push(matches[0]);
  }
  return { schema_version: header.SchemaVersion, storage_version: header.StorageVersion,
    core_ui_version: header.CoreUIVersion, dump_tool_version: header.DumpToolVersion,
    primary_name: primaryName, mapping, required_scales: [...requiredScales], images,
    inference: 'Observed Schema2/Storage17 MultiSized size/index/name-id join; not a general Apple format specification or pixel decode' };
}

/** decodePlist is injectable only to keep synthetic metadata tests portable.
 * CLI and Hosted use the fixed macOS reader on the actual built Info bytes.
 * Required [3] for iPhone16 Debug and [2,3] for generic Release/Archive are
 * verified by the observed CAR mapping, not loose PNG layout. Legacy Info/PNG
 * resolution remains independently checked. CAR pixels are not decoded.
 */
export async function verifyBuiltAppIcon(appRoot, { requiredScales = [2, 3], decodePlist = decodeApplePlist, readAssetCatalog = readAppleAssetCatalog } = {}) {
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
  const carPath = path.join(app, 'Assets.car');
  const car = await regular(carPath, 64 * 1024 * 1024);
  const carBefore = hash(car);
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
  const catalogRows = await readAssetCatalog(carPath);
  const carAfter = await regular(carPath, 64 * 1024 * 1024);
  assert.equal(carAfter.length, car.length, 'Assets.car changed during catalog read');
  assert.equal(hash(carAfter), carBefore, 'Assets.car changed during catalog read');
  const catalog = inspectCompiledAppIconCatalog(catalogRows, { requiredScales, primaryName: primary.CFBundleIconName });
  return { schema_version: 1, status: 'passed', scope: 'built-AppIcon-file-and-CAR-metadata-only',
    platform: info.CFBundleSupportedPlatforms[0], primary_icon_name: primary.CFBundleIconName,
    primary_icon_files: entries, required_iphone_scales: requiredScales,
    Info_plist_sha256: hash(infoBytes), Assets_car: { bytes: car.length, sha256: carBefore, stable_across_reader: true },
    CAR: catalog,
    PNGs: [...files.values()].sort((a, b) => a.filename.localeCompare(b.filename)),
    not_verified: ['CAR pixel decoding or independent opacity verification', 'PNG pixel decoding or opacity', 'Home Screen appearance', 'signing', 'Store acceptance'] };
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
