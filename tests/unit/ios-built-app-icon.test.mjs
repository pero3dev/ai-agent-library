import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { deflateRawSync, deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { inspectCompiledAppIconCatalog, verifyBuiltAppIcon } from '../../ios/tests/check-built-app-icon.mjs';
import { resultObject } from '../../ios/tests/xcresult-json.mjs';
/** @typedef {Record<string, unknown>[]} CatalogRows */
/** @param {unknown} value @returns {CatalogRows} */
function catalogRows(value) { assert.ok(Array.isArray(value)); return value.map(row => { resultObject(row); return row; }); }

// These are synthetic file/metadata fixtures. Their nonempty CAR is a sentinel,
// never a claim that actool compiled a catalog or that CAR internals are valid.
const helper = fileURLToPath(new URL('../../ios/tests/check-built-app-icon.mjs', import.meta.url));
/** @param {string} name */
const derived = name => new URL('../fixtures/ios-built-app-icon/' + name, import.meta.url);
const archiveCatalog = catalogRows(/** @type {unknown} */ (JSON.parse(await readFile(derived('archive-car.derived.json'), 'utf8'))));
const debugCatalog = catalogRows(/** @type {unknown} */ (JSON.parse(await readFile(derived('debug-car.derived.json'), 'utf8'))));
const stateCatalog = catalogRows(/** @type {unknown} */ (JSON.parse(await readFile(derived('debug-state9-car.derived.json'), 'utf8'))));
/** @type {{debug: {Info: ReturnType<typeof info>}, debug_state9: {reader_stdout_SHA256: string}}} */
const observations = JSON.parse(await readFile(derived('observations.derived.json'), 'utf8'));
/** @template T @param {T} value @returns {T} */
const clone = value => JSON.parse(JSON.stringify(value));
/** @param {CatalogRows} rows */
const primaryMap = rows => { const row = rows.find(row => row.AssetType === 'MultiSized Image' && row.Name === 'AppIcon' && row.Idiom === 'phone' && !Object.hasOwn(row, 'Subtype')); assert.ok(row); const sizes = row.Sizes; assert.ok(Array.isArray(sizes) && sizes.every(value => typeof value === 'string')); return /** @type {Record<string, unknown> & {Sizes: string[]}} */ (row); };
/** @param {CatalogRows} rows */
const primaryImages = rows => rows.filter(row => row.AssetType === 'Icon Image' && row.Name === 'AppIcon' && row.Idiom === 'phone' && row['Icon Index'] === 4 && !Object.hasOwn(row, 'Subtype'));
/** @param {CatalogRows} rows @param {number} [scale] */
const primaryImage = (rows, scale = 3) => { const row = primaryImages(rows).find(row => row.Scale === scale); assert.ok(row); return row; };
/** @param {CatalogRows} rows */
const keyFormat = rows => { const value = rows[0]['Key Format']; assert.ok(Array.isArray(value)); return /** @type {unknown[]} */ (value); };
/** @param {CatalogRows} rows */
const appearances = rows => { const value = rows[0].Appearances; resultObject(value); return value; };
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
/** @param {import('node:crypto').BinaryLike} bytes */
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
/** @param {string} type @param {Buffer} data */
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
/** @param {number} size @param {boolean} [optimized] */
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
/** @param {import('node:test').TestContext} t @param {{scales?: number[], catalog?: CatalogRows, metadata?: ReturnType<typeof info>}} [options] */
async function fixture(t, { scales = [2, 3], catalog = archiveCatalog, metadata: sourceInfo } = {}) {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'ailibrary-built-icon-test-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const app = path.join(root, 'AILibrary.app');
  await mkdir(path.join(app, 'Content'), { recursive: true });
  const metadata = clone(sourceInfo ?? info());
  const writeInfo = () => writeFile(path.join(app, 'Info.plist'), JSON.stringify(metadata));
  await writeInfo();
  await writeFile(path.join(app, 'Assets.car'), 'SYNTHETIC-presence-only-not-real-CAR');
  await writeFile(path.join(app, 'Content', 'manifest.json'), '{}');
  for (const scale of scales) await writeFile(path.join(app, `AppIcon60x60@${scale}x.png`), png(60 * scale, scale === 3));
  return { root, app, metadata, writeInfo,
    /** @param {NonNullable<Parameters<typeof verifyBuiltAppIcon>[1]>} [options] */
    verify: (options = {}) => verifyBuiltAppIcon(app, { decodePlist: bytes => /** @type {unknown} */ (JSON.parse(bytes.toString('utf8'))),
      readAssetCatalog: async carPath => { assert.equal(carPath, path.join(app, 'Assets.car')); return clone(catalog); }, ...options }) };
}
/** @param {string} app */
async function snapshots(app) {
  return Object.fromEntries(await Promise.all((await readdir(app)).filter(name => name !== 'Content').map(async name =>
    [name, hash(await readFile(path.join(app, name)))])));
}

test('full synthetic bundle accepts standard and CgBI icon metadata without changing files', async t => {
  const value = await fixture(t), before = await snapshots(value.app);
  const result = await value.verify();
  assert.equal(result.scope, 'built-AppIcon-file-and-CAR-metadata-only');
  assert.equal(result.Assets_car.stable_across_reader, true);
  assert.deepEqual(result.CAR.required_scales, [2, 3]);
  assert.deepEqual(result.CAR.images.map(image => [image.scale, image.width, image.height]), [[2, 120, 120], [3, 180, 180]]);
  assert.deepEqual(result.required_iphone_scales, [2, 3]);
  assert.deepEqual(result.PNGs.map(image => [image.width, image.height, image.optimized_CgBI]), [[120, 120, false], [180, 180, true]]);
  assert.ok(result.not_verified.includes('CAR pixel decoding or independent opacity verification'));
  assert.deepEqual(await snapshots(value.app), before);
});

test('observed Debug catalog supplies required3x despite only loose2x while generic Release requires both CAR scales', async t => {
  const value = await fixture(t, { scales: [2], catalog: debugCatalog, metadata: observations.debug.Info });
  const result = await value.verify({ requiredScales: [3] });
  assert.equal(result.PNGs.length, 1);
  assert.equal(result.PNGs[0].scale, 2);
  assert.deepEqual(result.CAR.required_scales, [3]);
  assert.deepEqual(result.CAR.images.map(image => [image.scale, image.width, image.height]), [[3, 180, 180]]);
  await assert.rejects(value.verify());
});

test('iPhoneOS bundle and explicit .png Info file entries resolve the same scale-bound files', async t => {
  const value = await fixture(t);
  value.metadata.CFBundleSupportedPlatforms = ['iPhoneOS'];
  value.metadata.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconFiles = ['AppIcon60x60@2x.png', 'AppIcon60x60@3x.png'];
  await value.writeInfo();
  assert.equal((await value.verify()).platform, 'iPhoneOS');
});

test('wrong or missing primary icon metadata is rejected', async t => {
  for (const change of /** @type {((metadata: ReturnType<typeof info>) => void)[]} */ ([metadata => { metadata.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconName = 'OldIcon'; },
    metadata => { Reflect.deleteProperty(metadata, 'CFBundleIcons'); }, metadata => { metadata.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconFiles = []; }])) {
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
  for (const change of /** @type {((bytes: Buffer) => Buffer)[]} */ ([bytes => Buffer.alloc(bytes.length), bytes => bytes.subarray(0, bytes.length - 3),
    bytes => { const changed = Buffer.from(bytes); changed[changed.length - 5] ^= 1; return changed; },
    bytes => Buffer.concat([bytes, Buffer.from('unexpected')])])) {
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


// These rows are derived regression inputs from captured metadata, not raw CAR
// bytes or a second actool run. The size/index/identifier relation is an explicit
// observed-format inference; neither fixture nor inspector proves pixels/Home.
test('derived archive and Debug catalogs bind phone60 points to their required scales', () => {
  const archive = inspectCompiledAppIconCatalog(clone(archiveCatalog));
  assert.equal(archive.schema_version, 2); assert.equal(archive.storage_version, 17);
  assert.equal(archive.primary_name, 'AppIcon');
  assert.equal(archive.mapping.points, 60); assert.equal(archive.mapping.idiom, 'phone');
  assert.equal(archive.mapping.subtype, null);
  assert.deepEqual(archive.images.map(image => [image.scale, image.width, image.height]).sort((a, b) => a[0] - b[0]), [[2, 120, 120], [3, 180, 180]]);
  const debug = inspectCompiledAppIconCatalog(clone(debugCatalog), { requiredScales: [3] });
  assert.equal(debug.dump_tool_version, 918.8);
  assert.deepEqual(debug.images.map(image => [image.scale, image.width, image.height]), [[3, 180, 180]]);
  assert.throws(() => inspectCompiledAppIconCatalog(clone(debugCatalog)));
});

test('mapping index and NameIdentifier are derived rather than hardcoded to the first observation', () => {
  const rows = clone(archiveCatalog);
  primaryMap(rows).Sizes = primaryMap(rows).Sizes.map(value => value.replace('60x60 index:4 ', '60x60 index:9 '));
  for (const row of primaryImages(rows)) row['Icon Index'] = 9;
  for (const row of rows.filter(row => row.Name === 'AppIcon')) row.NameIdentifier = 321;
  const result = inspectCompiledAppIconCatalog(rows);
  assert.equal(result.mapping.index, 9); assert.equal(result.mapping.name_identifier, 321);
  assert.deepEqual(result.images.map(image => image.scale).sort(), [2, 3]);
});

test('nonbinding extra metadata is permitted and positive finite fractional DumpToolVersion is preserved', () => {
  const rows = clone(debugCatalog);
  rows[0].FutureDiagnosticField = { note: 'nonbinding metadata' };
  primaryImage(rows).FutureDiagnosticField = 'nonbinding metadata';
  rows[0].DumpToolVersion = 918.8;
  assert.equal(inspectCompiledAppIconCatalog(rows, { requiredScales: [3] }).dump_tool_version, 918.8);
});

test('catalog root, header, schema, storage and numeric header types fail closed', () => {
  for (const rows of [null, {}, [], [null]]) assert.throws(() => inspectCompiledAppIconCatalog(rows));
  /** @type {[string, (rows: CatalogRows) => unknown][]} */
  const changes = [
    ['missing header', rows => rows.shift()],
    ['duplicate header', rows => rows.push(clone(rows[0]))],
    ['wrong schema', rows => { rows[0].SchemaVersion = 3; }],
    ['wrong storage', rows => { rows[0].StorageVersion = 18; }],
    ['string schema', rows => { rows[0].SchemaVersion = '2'; }],
    ['string storage', rows => { rows[0].StorageVersion = '17'; }],
    ['missing CoreUIVersion', rows => { delete rows[0].CoreUIVersion; }],
    ['nonfinite CoreUIVersion', rows => { rows[0].CoreUIVersion = NaN; }],
    ['nonfinite DumpToolVersion', rows => { rows[0].DumpToolVersion = Infinity; }],
    ['nonpositive DumpToolVersion', rows => { rows[0].DumpToolVersion = 0; }],
    ['wrong platform', rows => { rows[0].Platform = 'macos'; }]
  ];
  for (const [name, change] of changes) { const rows = clone(archiveCatalog); change(rows); assert.throws(() => inspectCompiledAppIconCatalog(rows), name); }
});

test('wrong namespace, marketing or PackedImage cannot substitute for the primary phone icon', () => {
  /** @type {[string, (rows: CatalogRows) => unknown][]} */
  const changes = [
    ['other namespace', rows => { primaryImage(rows).Name = 'OtherIcon'; }],
    ['marketing', rows => { primaryImage(rows).Idiom = 'marketing'; }],
    ['PackedImage', rows => { primaryImage(rows).AssetType = 'PackedImage'; }],
    ['unknown binding type', rows => { primaryImage(rows).AssetType = 'Future Icon'; }]
  ];
  for (const [name, change] of changes) { const rows = clone(archiveCatalog); change(rows); assert.throws(() => inspectCompiledAppIconCatalog(rows), name); }
});

test('missing or malformed scale, dimensions, subtype and identifier bridges are rejected', () => {
  /** @type {[string, (rows: CatalogRows) => unknown][]} */
  const changes = [
    ['missing3x', rows => rows.splice(rows.indexOf(primaryImage(rows)), 1)],
    ['wrong scale', rows => { primaryImage(rows).Scale = 4; }],
    ['string scale', rows => { primaryImage(rows).Scale = '3'; }],
    ['wrong width', rows => { primaryImage(rows).PixelWidth = 179; }],
    ['wrong height', rows => { primaryImage(rows).PixelHeight = 179; }],
    ['string dimension', rows => { primaryImage(rows).PixelWidth = '180'; }],
    ['unexpected image subtype', rows => { primaryImage(rows).Subtype = 1792; }],
    ['identifier mismatch', rows => { primaryImage(rows).NameIdentifier = 999; }],
    ['identifier type', rows => { primaryImage(rows).NameIdentifier = '6849'; }],
    ['mapping identifier mismatch', rows => { primaryMap(rows).NameIdentifier = 999; }],
    ['mapping identifier type', rows => { primaryMap(rows).NameIdentifier = '6849'; }],
    ['missing60-point map', rows => { primaryMap(rows).Sizes = primaryMap(rows).Sizes.filter(value => !value.startsWith('60x60 ')); }],
    ['map idiom mismatch', rows => { primaryMap(rows).Sizes = primaryMap(rows).Sizes.map(value => value.replace('60x60 index:4 idiom:phone', '60x60 index:4 idiom:marketing')); }]
  ];
  for (const [name, change] of changes) { const rows = clone(archiveCatalog); change(rows); assert.throws(() => inspectCompiledAppIconCatalog(rows), name); }
});

test('primary binding requires opaque RGB8 metadata rather than merely correctly sized image bytes', () => {
  for (const [field, value] of /** @type {[string, unknown][]} */ ([['Opaque', false], ['Opaque', 1], ['ColorModel', 'Gray'], ['BitsPerComponent', 16], ['BitsPerComponent', '8']])) {
    const rows = clone(archiveCatalog); primaryImage(rows)[field] = value;
    assert.throws(() => inspectCompiledAppIconCatalog(rows), String(field));
  }
  for (const field of ['Opaque', 'ColorModel', 'BitsPerComponent']) {
    const rows = clone(archiveCatalog); delete primaryImage(rows)[field];
    assert.throws(() => inspectCompiledAppIconCatalog(rows), 'missing ' + field);
  }
});

test('duplicate mapping, duplicate primary rendition and ambiguous size links are rejected', () => {
  /** @type {[string, (rows: CatalogRows) => unknown][]} */
  const changes = [
    ['mapping duplicate', rows => rows.push(clone(primaryMap(rows)))],
    ['rendition duplicate', rows => rows.push(clone(primaryImage(rows)))],
    ['ambiguous duplicate', rows => rows.push({ ...clone(primaryImage(rows)), RenditionName: 'Other180.png' })],
    ['second60-point map link', rows => primaryMap(rows).Sizes.push('60x60 index:9 idiom:phone')]
  ];
  for (const [name, change] of changes) { const rows = clone(archiveCatalog); change(rows); assert.throws(() => inspectCompiledAppIconCatalog(rows), name); }
});

test('CAR reader failure, malformed output and same-length CAR mutation cannot pass bundle audit', async t => {
  const value = await fixture(t);
  await assert.rejects(value.verify({ readAssetCatalog: async () => { throw new Error('synthetic reader failure'); } }), /reader failure/);
  await assert.rejects(value.verify({ readAssetCatalog: async () => ({}) }));
  await assert.rejects(value.verify({ readAssetCatalog: async carPath => {
    const before = await readFile(carPath), changed = Buffer.from(before); changed[0] ^= 1;
    await writeFile(carPath, changed);
    return clone(archiveCatalog);
  } }));
});

/** @param {unknown} value @returns {string} */
const xmlValue = value => Array.isArray(value) ? '<array>' + value.map(xmlValue).join('') + '</array>'
  : value !== null && typeof value === 'object' ? '<dict>' + Object.entries(value).map(([key, item]) => '<key>' + key + '</key>' + xmlValue(item)).join('') + '</dict>'
  : typeof value === 'number' ? '<integer>' + value + '</integer>' : '<string>' + value + '</string>';

test('macOS production plist adapter reads XML and binary Info with injected derived CAR rows', { skip: process.platform !== 'darwin' }, async t => {
  const value = await fixture(t), plist = path.join(value.app, 'Info.plist');
  const xml = Buffer.from('<?xml version="1.0" encoding="UTF-8"?><plist version="1.0">' + xmlValue(value.metadata) + '</plist>');
  await writeFile(plist, xml);
  assert.equal((await verifyBuiltAppIcon(value.app, { readAssetCatalog: async () => clone(archiveCatalog) })).primary_icon_name, 'AppIcon');
  const binary = execFileSync('/usr/bin/plutil', ['-convert', 'binary1', '-o', '-', '-'], { input: xml });
  await writeFile(plist, binary);
  assert.equal((await verifyBuiltAppIcon(value.app, { readAssetCatalog: async () => clone(archiveCatalog) })).Info_plist_sha256, hash(binary));
  // Positive CLI execution needs an actual compiled CAR; synthetic CAR rows
  // are injected only into the API. Exact-head Hosted remains the CLI evidence.
  await writeFile(plist, 'invalid plist');
  await assert.rejects(verifyBuiltAppIcon(value.app, { readAssetCatalog: async () => clone(archiveCatalog) }), /plutil|Unexpected token|JSON|Command failed/);
});

test('CLI rejects an unspecified or unsupported scale policy', () => {
  const result = spawnSync(process.execPath, [helper, 'unused.app', '--required-scales', 'any'], { encoding: 'utf8' });
  assert.equal(result.status, 1); assert.match(result.stderr, /Usage:/);
});

// Controlled state9 rows derive from a verified capture. They omit timestamps,
// absolute paths and nonbinding diagnostics; they are not raw CAR/pixel data.
test('observed state9 metadata binds the required phone60@3x without changing its derived input', () => {
  const rows = clone(stateCatalog), before = JSON.stringify(rows);
  const result = inspectCompiledAppIconCatalog(rows, { requiredScales: [3] });
  assert.equal(result.mapping.name_identifier, 6849); assert.equal(result.mapping.index, 4);
  assert.equal(result.mapping.points, 60); assert.equal(result.mapping.idiom, 'phone');
  assert.equal(result.mapping.subtype, null);
  assert.deepEqual(result.images.map(image => [image.scale, image.width, image.height]), [[3, 180, 180]]);
  assert.equal(JSON.stringify(rows), before);
  assert.throws(() => inspectCompiledAppIconCatalog(rows), /required CAR iPhone60@2x/);
  assert.equal(observations.debug_state9.reader_stdout_SHA256, '676744fc671b3e2a9fe617484f12ac87a8e0d64b49746e012906a555e60a474f');
  assert.equal(Object.hasOwn(rows[0], 'Timestamp'), false);
  assert.equal(Object.hasOwn(rows[0], 'ThinningParameters'), false);
});

test('state9 uses named mapping joins rather than row order or fixed identifier/index values', () => {
  const rows = clone(stateCatalog), image = primaryImage(rows);
  primaryMap(rows).Sizes = primaryMap(rows).Sizes.map(value => value.replace('60x60 index:4 ', '60x60 index:9 '));
  image['Icon Index'] = 9;
  for (const row of rows.slice(1).filter(row => row.Name === 'AppIcon')) row.NameIdentifier = 321;
  const reordered = [rows[0], ...rows.slice(1).reverse()];
  const result = inspectCompiledAppIconCatalog(reordered, { requiredScales: [3] });
  assert.equal(result.mapping.name_identifier, 321); assert.equal(result.mapping.index, 9);
  assert.deepEqual(result.images.map(value => [value.scale, value.width]), [[3, 180]]);
});

test('state9 bundle still binds real synthetic file hashes while CAR3x is separate from loose2x', async t => {
  const value = await fixture(t, { scales: [2], catalog: stateCatalog }), before = await snapshots(value.app);
  const result = await value.verify({ requiredScales: [3] });
  assert.equal(result.Assets_car.stable_across_reader, true);
  assert.deepEqual(result.PNGs.map(row => row.scale), [2]);
  assert.deepEqual(result.CAR.images.map(row => [row.scale, row.width, row.height]), [[3, 180, 180]]);
  assert.deepEqual(await snapshots(value.app), before);
  await assert.rejects(value.verify(), /required CAR iPhone60@2x/);
});

test('only complete own string columns in either exact known Key Format order are accepted', () => {
  /** @type {[string, (rows: CatalogRows) => unknown][]} */
  const changes = [
    ['missing', rows => { delete rows[0]['Key Format']; }],
    ['null', rows => { rows[0]['Key Format'] = null; }],
    ['string', rows => { rows[0]['Key Format'] = keyFormat(rows).join(','); }],
    ['empty', rows => { rows[0]['Key Format'] = []; }],
    ['short', rows => { keyFormat(rows).pop(); }],
    ['extra', rows => { keyFormat(rows).push('kCRThemeUnobservedName'); }],
    ['unknown', rows => { keyFormat(rows)[0] = 'kCRThemeUnobservedName'; }],
    ['duplicate', rows => { keyFormat(rows)[1] = keyFormat(rows)[0]; }],
    ['order', rows => { [keyFormat(rows)[0], keyFormat(rows)[1]] = [keyFormat(rows)[1], keyFormat(rows)[0]]; }],
    ['numeric', rows => { keyFormat(rows)[0] = 0; }],
    ['sparse', rows => { delete keyFormat(rows)[0]; }],
    ['inherited sparse', rows => {
      const value = keyFormat(rows)[0], proto = Object.create(Array.prototype);
      proto[0] = value; delete keyFormat(rows)[0]; Object.setPrototypeOf(rows[0]['Key Format'], proto);
    }]
  ];
  for (const catalog of [debugCatalog, stateCatalog]) for (const [name, change] of changes) {
    const rows = clone(catalog); change(rows);
    assert.throws(() => inspectCompiledAppIconCatalog(rows, { requiredScales: [3] }), /Unknown catalog key format/, name);
  }
});

test('state9 requires its observed full tool/platform/appearance/normal-state combination', () => {
  /** @type {[string, (rows: CatalogRows) => unknown][]} */
  const changes = [
    ['schema', rows => { rows[0].SchemaVersion = 3; }],
    ['storage', rows => { rows[0].StorageVersion = 18; }],
    ['platform', rows => { rows[0].Platform = 'macos'; }],
    ['CoreUI future', rows => { rows[0].CoreUIVersion = 919; }],
    ['CoreUI type', rows => { rows[0].CoreUIVersion = '918'; }],
    ['dump future', rows => { rows[0].DumpToolVersion = 918.9; }],
    ['dump nonfinite', rows => { rows[0].DumpToolVersion = Infinity; }],
    ['storage tool', rows => { rows[0].AssetStorageVersion = 'Xcode unknown'; }],
    ['platform version', rows => { rows[0].PlatformVersion = '18.5'; }],
    ['appearance absent', rows => { delete rows[0].Appearances; }],
    ['appearance null', rows => { rows[0].Appearances = null; }],
    ['appearance array', rows => { rows[0].Appearances = []; }],
    ['appearance empty', rows => { rows[0].Appearances = {}; }],
    ['appearance bool', rows => { appearances(rows).UIAppearanceAny = false; }],
    ['appearance string', rows => { appearances(rows).UIAppearanceAny = '0'; }],
    ['appearance value', rows => { appearances(rows).UIAppearanceAny = 1; }],
    ['appearance extra', rows => { appearances(rows).UIAppearanceDark = 1; }],
    ['appearance nonenumerable extra', rows => { Object.defineProperty(rows[0].Appearances, 'UIAppearanceDark', { value: 1 }); }],
    ['appearance inherited any', rows => { rows[0].Appearances = Object.create({ UIAppearanceAny: 0 }); }],
    ['appearance other key', rows => { rows[0].Appearances = { UIAppearanceLight: 0 }; }],
    ['icon State missing', rows => { delete primaryImage(rows).State; }],
    ['icon State selected', rows => { primaryImage(rows).State = 'Selected'; }],
    ['mapping State', rows => { primaryMap(rows).State = 'Highlighted'; }],
    ['packed State', rows => { Object.assign(rows.find(row => row.AssetType === 'PackedImage') ?? assert.fail('PackedImage fixture'), {State: false}); }]
  ];
  for (const [name, change] of changes) {
    const rows = clone(stateCatalog); change(rows);
    assert.throws(() => inspectCompiledAppIconCatalog(rows, { requiredScales: [3] }), name);
  }
});

test('state9 preserves namespace/id/idiom/subtype/index/scale/dimension/opaqueRGB8 rendition checks', () => {
  /** @type {[string, (rows: CatalogRows) => unknown][]} */
  const changes = [
    ['namespace', rows => { primaryImage(rows).Name = 'OtherIcon'; }],
    ['identifier', rows => { primaryImage(rows).NameIdentifier = 999; }],
    ['index', rows => { primaryImage(rows)['Icon Index'] = 9; }],
    ['idiom', rows => { primaryImage(rows).Idiom = 'marketing'; }],
    ['subtype', rows => { primaryImage(rows).Subtype = 1792; }],
    ['map idiom', rows => { primaryMap(rows).Sizes[3] = '60x60 index:4 idiom:marketing'; }],
    ['duplicate map', rows => { primaryMap(rows).Sizes.push(primaryMap(rows).Sizes[3]); }],
    ['duplicate rendition', rows => { rows.push(clone(primaryImage(rows))); }],
    ['width', rows => { primaryImage(rows).PixelWidth = 179; }],
    ['height', rows => { primaryImage(rows).PixelHeight = 179; }],
    ['scale type', rows => { primaryImage(rows).Scale = '3'; }],
    ['scale dimension', rows => { primaryImage(rows).Scale = 2; }],
    ['opaque', rows => { primaryImage(rows).Opaque = false; }],
    ['RGB', rows => { primaryImage(rows).ColorModel = 'Gray'; }],
    ['bitdepth', rows => { primaryImage(rows).BitsPerComponent = 16; }],
    ['encoding', rows => { primaryImage(rows).Encoding = 'RGBA'; }],
    ['rendition missing', rows => { delete primaryImage(rows).RenditionName; }],
    ['no required3x', rows => { rows.splice(rows.indexOf(primaryImage(rows)), 1); }],
    ['PackedImage substitute', rows => { primaryImage(rows).AssetType = 'PackedImage'; }]
  ];
  for (const [name, change] of changes) {
    const rows = clone(stateCatalog); change(rows);
    assert.throws(() => inspectCompiledAppIconCatalog(rows, { requiredScales: [3] }), name);
  }
});
