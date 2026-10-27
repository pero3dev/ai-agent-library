#!/usr/bin/env node
// Compile the existing MIT website brand; no new design or runtime dependency.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = path.join(root, 'website/public/favicon.svg');
const catalog = path.join(root, 'ios/AILibrary/Assets.xcassets');
const icons = path.join(catalog, 'AppIcon.appiconset');
const SOURCE_SHA256 = 'f9fc05866f8a15027f02e4e76c1a7bf58ece9aa89f573638d06ab5ed5ef37de1';
const PNG_SHA256 = {
  "40": "bad6cf046206b780cb1051e2c2b6120c1fe528253f9cd4bfafc12c1ea3ab9b74",
  "58": "2c5e256e24f64930ee931b9bfeb453001cb556dba418cbf73cefa0788e1bba96",
  "60": "3220774d82f9eba35dea8f42495f6dcd6a498d3e4f6c539dfbddac373c75b974",
  "80": "9e78ef6fcc7d19e77a0f0124d1d1a9f8ccfbdcdbba4657f42f4639c7f45622f9",
  "87": "0c656a0f91e3dee021bad05d007bde696562a6945c09dec4c3b609a9ede7f1b2",
  "120": "97146d5f53c516f86958fd524c362a8e9a24c0ee9e71d960c87ab60d62f47904",
  "180": "2caa4cdc4a7a310f428565d6abfa625371d4a5c5ce59d20bbfc7513ade852ab7",
  "1024": "509db727dc026807f3313e867c3014814f041bdab6f3f1a1814543a469cf98d3"
};
const info = { author: 'dev.pero3.aiagentlibrary.prototype', version: 1 };
const images = [
  ...[20, 29, 40, 60].flatMap(points => [2, 3].map(scale => ({
    idiom: 'iphone', size: `${points}x${points}`, scale: `${scale}x`, filename: `AppIcon-${points * scale}.png`
  }))),
  { idiom: 'ios-marketing', size: '1024x1024', scale: '1x', filename: 'AppIcon-1024.png' }
];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const regular = file => {
  const stat = lstatSync(file);
  assert.ok(stat.isFile() && !stat.isSymbolicLink() && stat.size > 0 && stat.size <= 1024 * 1024, `Invalid icon input: ${file}`);
  return readFileSync(file);
};
function png(bytes, size) {
  assert.ok(bytes.length >= 45 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'PNG signature');
  assert.equal(bytes.readUInt32BE(8), 13); assert.equal(bytes.toString('ascii', 12, 16), 'IHDR');
  assert.equal(bytes.readUInt32BE(16), Number(size)); assert.equal(bytes.readUInt32BE(20), Number(size));
  assert.equal(bytes[24], 8, '8-bit PNG required'); assert.equal(bytes[25], 2, 'RGB without alpha required');
  assert.equal(bytes[26], 0); assert.equal(bytes[27], 0); assert.equal(bytes[28], 0, 'Non-interlaced PNG required');
  let offset = 8, data = false, end = false;
  while (offset < bytes.length) {
    assert.ok(offset + 12 <= bytes.length, 'Truncated PNG chunk');
    const length = bytes.readUInt32BE(offset), type = bytes.toString('ascii', offset + 4, offset + 8);
    assert.ok(offset + 12 + length <= bytes.length, 'Truncated PNG data');
    assert.notEqual(type, 'tRNS', 'Transparency chunk prohibited');
    if (type === 'IDAT') data = true;
    offset += 12 + length;
    if (type === 'IEND') { assert.equal(length, 0); end = true; break; }
  }
  assert.ok(data && end && offset === bytes.length, 'Complete PNG required');
  assert.equal(hash(bytes), PNG_SHA256[size], 'PNG does not match frozen source/renderer fingerprint');
}
function directory(folder, create = false) {
  if (create) mkdirSync(folder, { recursive: true });
  const stat = lstatSync(folder);
  assert.ok(stat.isDirectory() && !stat.isSymbolicLink(), `Invalid catalog directory: ${folder}`);
}
function put(file, bytes) {
  try { assert.ok(lstatSync(file).isFile() && !lstatSync(file).isSymbolicLink(), `Invalid output: ${file}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  writeFileSync(file, bytes);
}
async function main() {
  const args = process.argv.slice(2);
  assert.ok(args.length === 1 && ['--write', '--check'].includes(args[0]), 'Use --write or --check');
  const svg = regular(source);
  assert.equal(hash(svg), SOURCE_SHA256, 'Brand source changed; explicitly review and regenerate fingerprints');
  for (const folder of ['ios', 'ios/AILibrary']) directory(path.join(root, folder));
  if (args[0] === '--write') {
    // Resolve only for generation. --check requires Node built-ins only.
    const sharp = createRequire(path.join(root, 'website/package.json'))('sharp');
    assert.equal(sharp.versions.sharp, '0.35.5', 'Use the existing pinned website Sharp');
    const generated = [];
    for (const size of Object.keys(PNG_SHA256)) {
      const bytes = await sharp(svg, { density: 72 * Number(size) / 32, limitInputPixels: 1024 * 1024 })
        .resize(Number(size), Number(size)).flatten({ background: '#0b1728' }).removeAlpha().toColourspace('srgb')
        .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false }).toBuffer();
      png(bytes, size); generated.push([size, bytes]);
    }
    directory(catalog, true); directory(icons, true);
    for (const [size, bytes] of generated) put(path.join(icons, `AppIcon-${size}.png`), bytes);
    put(path.join(catalog, 'Contents.json'), JSON.stringify({ info }, null, 2) + '\n');
    put(path.join(icons, 'Contents.json'), JSON.stringify({ images, info }, null, 2) + '\n');
  }
  directory(catalog); directory(icons);
  assert.deepEqual(JSON.parse(regular(path.join(catalog, 'Contents.json'))), { info });
  assert.deepEqual(JSON.parse(regular(path.join(icons, 'Contents.json'))), { images, info });
  assert.deepEqual(readdirSync(catalog).sort(), ['AppIcon.appiconset', 'Contents.json']);
  assert.deepEqual(readdirSync(icons).sort(), ['Contents.json', ...Object.keys(PNG_SHA256).map(size => `AppIcon-${size}.png`)].sort());
  for (const size of Object.keys(PNG_SHA256)) png(regular(path.join(icons, `AppIcon-${size}.png`)), size);
  console.log(JSON.stringify({ status: 'checked', source: 'website/public/favicon.svg', source_SHA256: SOURCE_SHA256,
    slots: images.length, unique_PNGs: Object.keys(PNG_SHA256).length, PNG_SHA256, opacity: 'RGB; no alpha channel/tRNS',
    actual_assetcompiler_or_Home_Store_acceptance: 'not verified' }, null, 2));
}
main().catch(error => { console.error(`AppIcon validation failed: ${error.message}`); process.exitCode = 1; });
