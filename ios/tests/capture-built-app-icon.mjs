#!/usr/bin/env node
// Diagnostic capture only. This never establishes AppIcon acceptance.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const MiB = 1024 * 1024;
const LIMIT = Object.freeze({ info: MiB, car: 64 * MiB, pngCount: 16,
  pngTotal: 32 * MiB, pngRawTotal: MiB, output: 8 * MiB,
  receiptReserve: 128 * 1024, help: 256 * 1024, assetInfo: 4 * MiB,
  floor: 700000000, topLevelNames: 4096 });
const PHASES = new Set(['native-debug-icon-inputs', 'native-release-icon-inputs',
  'published-debug-icon-inputs', 'published-release-icon-inputs', 'archive-icon-inputs']);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const message = error => String(error?.message ?? error).replace(/[\r\n\0]/g, ' ').slice(0, 512);
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');

function realDirectory(directory) {
  const absolute = path.resolve(directory);
  for (let cursor = absolute;; cursor = path.dirname(cursor)) {
    const stat = fs.lstatSync(cursor);
    assert.ok(stat.isDirectory() && !stat.isSymbolicLink(), 'Symlink or non-directory path');
    if (cursor === path.dirname(cursor)) break;
  }
  assert.equal(fs.realpathSync(absolute), absolute, 'Directory must be canonical');
  return absolute;
}
function regularFD(file, maximum, callback) {
  const stat = fs.lstatSync(file);
  assert.ok(stat.isFile() && !stat.isSymbolicLink(), 'Expected regular input file');
  assert.ok(Number.isSafeInteger(stat.size) && stat.size > 0 && stat.size <= maximum, 'Input size cap');
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const opened = fs.fstatSync(fd);
    assert.ok(opened.isFile() && opened.size === stat.size, 'Input changed while opening');
    const result = callback(fd, stat.size);
    assert.equal(fs.fstatSync(fd).size, stat.size, 'Input size changed while reading');
    return result;
  } finally { fs.closeSync(fd); }
}
function readLimited(file, maximum) {
  return regularFD(file, maximum, (fd, size) => {
    const bytes = Buffer.alloc(size); let offset = 0;
    while (offset < size) {
      const count = fs.readSync(fd, bytes, offset, size - offset, offset);
      assert.ok(count > 0, 'Truncated input'); offset += count;
    }
    return bytes;
  });
}
function fileDigest(file, maximum, prefixMaximum = 0) {
  return regularFD(file, maximum, (fd, size) => {
    const digest = createHash('sha256'), chunk = Buffer.alloc(Math.min(64 * 1024, size));
    const prefix = Buffer.alloc(Math.min(prefixMaximum, size)); let offset = 0;
    while (offset < size) {
      const count = fs.readSync(fd, chunk, 0, Math.min(chunk.length, size - offset), offset);
      assert.ok(count > 0, 'Truncated input'); const part = chunk.subarray(0, count); digest.update(part);
      if (offset < prefix.length) part.copy(prefix, offset, 0, Math.min(count, prefix.length - offset));
      offset += count;
    }
    return { bytes: size, sha256: digest.digest('hex'), prefix };
  });
}
function pngHeader(prefix) {
  assert.ok(prefix.length >= 33 && prefix.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'PNG signature');
  let cursor = 8, optimized = false;
  for (let chunks = 0; chunks < 8 && cursor + 12 <= prefix.length; chunks++) {
    const length = prefix.readUInt32BE(cursor), type = prefix.toString('ascii', cursor + 4, cursor + 8);
    assert.ok(cursor + 12 + length <= prefix.length, 'PNG header prefix cap');
    if (type === 'CgBI') { assert.ok(cursor === 8 && length === 4, 'Unexpected CgBI header'); optimized = true; }
    else if (type === 'IHDR') {
      assert.equal(length, 13, 'IHDR length');
      return { width: prefix.readUInt32BE(cursor + 8), height: prefix.readUInt32BE(cursor + 12),
        bit_depth: prefix[cursor + 16], color_type: prefix[cursor + 17],
        compression: prefix[cursor + 18], filter: prefix[cursor + 19], interlace: prefix[cursor + 20],
        optimized_CgBI: optimized, verification: 'header-only; no CRC or pixel acceptance' };
    } else throw new Error('Unexpected chunk before IHDR');
    cursor += length + 12;
  }
  throw new Error('IHDR not found in bounded prefix');
}

export function captureBuiltAppIcon(appRoot, outputDirectory) {
  const workspace = realDirectory(process.cwd());
  const app = realDirectory(path.resolve(appRoot));
  assert.ok(app.startsWith(workspace + '/.local/') && path.basename(app) === 'AILibrary.app', 'Expected CI-owned built app');
  const output = path.resolve(outputDirectory), parent = path.dirname(output);
  const allowedParents = ['.local/ios-ci/evidence', '.local/ios-published-candidate/evidence', '.local/ios-sdk26/evidence']
    .map(relative => path.join(workspace, relative));
  assert.ok(allowedParents.includes(parent) && PHASES.has(path.basename(output)), 'Expected phase-unique CI evidence directory');
  realDirectory(parent);
  assert.ok(!fs.existsSync(output), 'Diagnostic directory must be fresh');
  const free = () => { const stat = fs.statfsSync(parent); return stat.bavail * stat.bsize; };
  assert.ok(free() >= LIMIT.floor + 4096, 'Diagnostic free-space floor');
  fs.mkdirSync(output, { mode: 0o700 });
  assert.ok(free() >= LIMIT.floor, 'Diagnostic post-mkdir free-space floor');
  let outputBytes = 0;
  const saved = [], errors = [];
  const record = { schema_version: 1, purpose: 'built-AppIcon-input-diagnostic-only', product_acceptance: false,
    status: 'partial', phase: path.basename(output), app, output,
    limits: LIMIT, source_of_tool_selection: 'Fixed /usr/bin/xcrun using this job DEVELOPER_DIR; no SDK selection or installation',
    developer_directory: typeof process.env.DEVELOPER_DIR === 'string' ? process.env.DEVELOPER_DIR.slice(0, 4096) : null,
    Info: null, PNGs: [], Assets_car: null, commands: [], errors, saved,
    not_verified: ['AppIcon acceptance', 'CAR rendition correctness', 'PNG pixels or opacity', 'Home Screen or Store'] };
  const error = (phase, reason) => { if (errors.length < 32) errors.push({ phase, message: message(reason) }); };
  function put(name, bytes, receipt = false) {
    assert.ok(/^[A-Za-z0-9][A-Za-z0-9_.-]{0,95}$/.test(name), 'Unsafe evidence filename');
    const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
    assert.ok(outputBytes + buffer.length <= LIMIT.output - (receipt ? 0 : LIMIT.receiptReserve), 'Diagnostic output cap');
    assert.ok(free() - buffer.length >= LIMIT.floor, 'Diagnostic pre-write floor');
    const file = path.join(output, name);
    fs.writeFileSync(file, buffer, { flag: 'wx', mode: 0o600 });
    outputBytes += buffer.length;
    assert.ok(free() >= LIMIT.floor, 'Diagnostic post-write floor');
    if (!receipt) saved.push({ filename: name, bytes: buffer.length, sha256: hash(buffer) });
  }
  function command(label, binary, args, maximum, timeout, input) {
    let result;
    try { result = spawnSync(binary, args, { input, encoding: 'buffer', shell: false,
      timeout, killSignal: 'SIGKILL', maxBuffer: maximum, windowsHide: true }); }
    catch (failure) { result = { status: null, signal: null, error: failure, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) }; }
    const stdout = Buffer.from(result.stdout ?? ''), stderr = Buffer.from(result.stderr ?? '');
    const keptOut = stdout.subarray(0, maximum), keptErr = stderr.subarray(0, Math.max(0, maximum - keptOut.length));
    const truncated = keptOut.length !== stdout.length || keptErr.length !== stderr.length;
    const receipt = { label, binary, arguments: args, timeout_ms: timeout, combined_output_cap: maximum,
      exit_code: Number.isInteger(result.status) ? result.status : null, signal: result.signal ?? null,
      error: result.error ? message(result.error) : null, truncated,
      stdout: label + '.stdout', stderr: label + '.stderr' };
    record.commands.push(receipt);
    put(receipt.stdout, keptOut); put(receipt.stderr, keptErr);
    if (receipt.error || receipt.exit_code !== 0 || receipt.signal || truncated) error(label, receipt.error ?? 'Nonzero, signalled or truncated diagnostic command');
    return { ...receipt, stdoutBytes: keptOut };
  }
  try {
    try {
      const bytes = readLimited(path.join(app, 'Info.plist'), LIMIT.info);
      put('Info.plist', bytes);
      record.Info = { bytes: bytes.length, sha256: hash(bytes), raw: 'Info.plist' };
      const decoded = command('info-plist', '/usr/bin/plutil', ['-convert', 'json', '-o', '-', '-'], LIMIT.info, 5000, bytes);
      if (decoded.exit_code === 0 && !decoded.error && !decoded.truncated) {
        const info = JSON.parse(decoded.stdoutBytes.toString('utf8'));
        assert.ok(info && typeof info === 'object' && !Array.isArray(info), 'Info must decode to object');
        const summary = { primary: info.CFBundleIcons?.CFBundlePrimaryIcon ?? null,
          UIDeviceFamily: info.UIDeviceFamily ?? null,
          CFBundleSupportedPlatforms: info.CFBundleSupportedPlatforms ?? null,
          CFBundlePackageType: info.CFBundlePackageType ?? null };
        if (json(summary).length <= 32 * 1024) Object.assign(record.Info, summary);
        else { record.Info.summary_omitted = 'Receipt summary cap; full plutil JSON is retained'; error('Info summary', 'Summary exceeds32KiB'); }
      }
    } catch (failure) { error('Info.plist', failure); }
    try {
      const names = fs.readdirSync(app);
      assert.ok(names.length <= LIMIT.topLevelNames, 'App top-level entry count cap');
      const pngs = names.filter(name => /icon/i.test(name) && /\.png$/i.test(name)).sort();
      record.discovered_icon_like_PNG_count = pngs.length;
      assert.ok(pngs.length <= LIMIT.pngCount, 'Icon PNG count cap');
      let total = 0;
      for (const name of pngs) {
        assert.ok(path.basename(name) === name && name.length <= 255 && !name.includes('\0'), 'Unsafe PNG basename');
        const stat = fs.lstatSync(path.join(app, name));
        assert.ok(stat.isFile() && !stat.isSymbolicLink(), 'Icon PNG must be regular without symlink');
        total += stat.size;
      }
      assert.ok(total <= LIMIT.pngTotal, 'Icon PNG total input cap');
      record.icon_like_PNG_total_bytes = total;
      let rawBytes = 0;
      for (let index = 0; index < pngs.length; index++) {
        const name = pngs[index], file = path.join(app, name);
        try {
          const digest = fileDigest(file, LIMIT.pngTotal, 128 * 1024);
          const entry = { filename: name, bytes: digest.bytes, sha256: digest.sha256, header: pngHeader(digest.prefix), raw: null };
          record.PNGs.push(entry);
          if (rawBytes + digest.bytes <= LIMIT.pngRawTotal) {
            const bytes = readLimited(file, LIMIT.pngRawTotal);
            assert.equal(hash(bytes), digest.sha256, 'PNG changed before raw capture');
            const raw = 'loose-' + String(index + 1).padStart(2, '0') + '.png';
            put(raw, bytes); rawBytes += bytes.length; entry.raw = raw;
          }
        } catch (failure) { error('PNG ' + name, failure); }
      }
      record.raw_PNG_bytes = rawBytes;
    } catch (failure) { error('PNG inventory', failure); }
    let car;
    try {
      car = fileDigest(path.join(app, 'Assets.car'), LIMIT.car);
      record.Assets_car = { bytes: car.bytes, sha256: car.sha256, raw_copy: false };
    } catch (failure) { error('Assets.car', failure); }
    try {
      const found = command('assetutil-path', '/usr/bin/xcrun', ['--find', 'assetutil'], LIMIT.help, 5000);
      record.assetutil_resolved_path = found.exit_code === 0 && !found.truncated ? found.stdoutBytes.toString('utf8').trim().slice(0, 4096) : null;
      if (car) {
        const inventory = command('assetutil-info', '/usr/bin/xcrun', ['assetutil', '--info', path.join(app, 'Assets.car')], LIMIT.assetInfo, 45000);
        if (inventory.exit_code === 0 && !inventory.error && !inventory.truncated) {
          const parsed = JSON.parse(inventory.stdoutBytes.toString('utf8'));
          record.assetutil_info_JSON_shape = Array.isArray(parsed) ? { kind: 'array', entries: parsed.length }
            : parsed && typeof parsed === 'object' ? { kind: 'object', keys: Object.keys(parsed).slice(0, 64).map(key => key.slice(0, 128)) } : { kind: typeof parsed };
          assert.ok(parsed && typeof parsed === 'object', 'Unexpected assetutil JSON root');
        }
      } else record.assetutil_info_not_run = 'No bounded regular Assets.car input';
    } catch (failure) { error('assetutil capture', failure); }
  } catch (failure) { error('capture', failure); }
  finally {
    record.status = errors.length ? 'partial' : 'captured';
    record.output_bytes_excluding_receipt = outputBytes;
    try {
      let receiptBytes = json(record);
      if (receiptBytes.length > LIMIT.receiptReserve) {
        record.status = 'partial';
        error('receipt summary', 'Receipt required compaction');
        receiptBytes = json({ schema_version: 1, purpose: record.purpose, product_acceptance: false,
          status: 'partial', phase: record.phase, receipt_compacted: true,
          error: 'Receipt exceeded reserved cap; inspect retained raw input and command files',
          output_bytes_excluding_receipt: outputBytes, saved });
      }
      assert.ok(receiptBytes.length <= LIMIT.receiptReserve, 'Receipt reserve cap');
      put('receipt.json', receiptBytes, true);
    }
    catch (failure) {
      return { status: 'receipt_failed', product_acceptance: false, phase: record.phase, error: message(failure) };
    }
  }
  return { status: record.status, product_acceptance: false, phase: record.phase,
    receipt: path.join(output, 'receipt.json'), errors: errors.length, output_bytes: outputBytes };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    assert.ok(args.length === 3 && args[1] === '--output', 'Usage: node capture-built-app-icon.mjs <built AILibrary.app> --output <fresh CI phase directory>');
    const result = captureBuiltAppIcon(args[0], args[2]);
    console.log(JSON.stringify(result));
    if (result.status !== 'captured') process.exitCode = 1;
  } catch (failure) {
    console.error(JSON.stringify({ status: 'refused', product_acceptance: false, error: message(failure) }));
    process.exitCode = 1;
  }
}
