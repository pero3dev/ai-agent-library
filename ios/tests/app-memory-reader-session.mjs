import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { constants, copyFileSync, lstatSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

export const READER_LIMITS = Object.freeze({ copy_bytes: 32 * 1024 * 1024, total_bytes: 40 * 1024 * 1024,
  source_files: 1024, output_entries: 2048, depth: 12, command_bytes: 16 * 1024 * 1024,
  command_ms: 60000, total_ms: 180000 });
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const within = (root, file) => { const relative = path.relative(root, file); return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith('..' + path.sep)); };

export function inventoryDifference(before, after) {
  if (!after) return { status: 'unavailable', added: [], removed: [], changed: [] };
  const old = new Map(before.files.map(file => [file.path, file])), current = new Map(after.files.map(file => [file.path, file]));
  return { status: before.sha256 === after.sha256 ? 'identical' : 'different',
    added: after.files.filter(file => !old.has(file.path)).map(file => file.path),
    removed: before.files.filter(file => !current.has(file.path)).map(file => file.path),
    changed: after.files.filter(file => old.has(file.path) && (old.get(file.path).bytes !== file.bytes || old.get(file.path).sha256 !== file.sha256)).map(file => file.path) };
}

// Caller owns a new exclusive output root. Original data is never a tool target.
// This is a receipt/budget boundary, not a filesystem sandbox or continuous peak monitor.
export function beginReaderSession({ source, output, expected, fingerprint, write, owned, run, limits = READER_LIMITS, clock = () => performance.now() }) {
  source = path.resolve(source); output = path.resolve(output);
  for (const key of Object.keys(READER_LIMITS)) assert.ok(Number.isInteger(limits[key]) && limits[key] > 0 && limits[key] <= READER_LIMITS[key], 'Invalid reader resource limit');
  let lastTime = -Infinity;
  const monotonicNow = () => { const value = clock(); assert.ok(Number.isFinite(value) && value >= lastTime, 'Invalid/nonmonotonic reader clock'); lastTime = value; return value; };
  const sessionStarted = monotonicNow(), deadline = sessionStarted + limits.total_ms;
  const timing = (phase, commandDeadline = null) => { const now = monotonicNow(); return { phase, monotonic_ms: now, session_started_ms: sessionStarted,
    session_deadline_ms: deadline, command_deadline_ms: commandDeadline, session_exceeded: now >= deadline, command_exceeded: commandDeadline !== null && now >= commandDeadline }; };
  const enforceTime = value => assert.ok(!value.session_exceeded && !value.command_exceeded, 'Monotonic reader deadline exceeded: ' + value.phase);
  const initial = fingerprint(source);
  const initialTime = timing('after-initial-source-hash');
  write('reader-initial-deadline.json', JSON.stringify(initialTime, null, 2) + '\n'); enforceTime(initialTime);
  assert.equal(expected?.algorithm, initial.algorithm, 'Missing/unobserved preseal inventory algorithm');
  assert.ok(Array.isArray(expected.files), 'Missing preseal file inventory');
  assert.equal(digest(expected.files), expected.sha256, 'Corrupt preseal inventory');
  const comparison = inventoryDifference(expected, initial);
  write('reader-preseal-comparison.json', JSON.stringify(comparison, null, 2) + '\n');
  assert.equal(comparison.status, 'identical', 'Preseal relative file inventory mismatch');
  assert.ok(initial.files.length <= limits.source_files, 'Reader source file limit');
  assert.ok(initial.files.reduce((sum, file) => sum + file.bytes, 0) <= limits.copy_bytes, 'Reader copy byte limit');
  let existingBytes = 0;
  const admission = directory => { for (const name of readdirSync(directory)) { const file = path.join(directory, name), stat = lstatSync(file); assert.ok(!stat.isSymbolicLink(), 'Symlink before reader copy'); if (stat.isDirectory()) admission(file); else { assert.ok(stat.isFile()); existingBytes += stat.size; } } };
  admission(output);
  const copyBytes = initial.files.reduce((sum, file) => sum + file.bytes, 0);
  assert.ok(existingBytes + copyBytes + Buffer.byteLength(JSON.stringify(initial)) <= limits.total_bytes, 'Reader total copy admission byte limit');
  assert.ok(initial.files.every(file => file.path.split('/').length <= limits.depth), 'Reader source depth limit');
  const result = path.join(output, 'reader-copy.xcresult'), temporary = path.join(output, 'reader-tmp'), cache = path.join(output, 'reader-cache');
  owned(); mkdirSync(result, { mode: 0o700 }); mkdirSync(temporary, { mode: 0o700 }); mkdirSync(cache, { mode: 0o700 });
  for (const file of initial.files) {
    const target = path.join(result, file.path); assert.ok(within(result, target));
    mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    copyFileSync(path.join(source, file.path), target, constants.COPYFILE_EXCL);
  }
  const copied = fingerprint(result);
  write('reader-copy.initial.json', JSON.stringify(copied, null, 2) + '\n');
  assert.equal(copied.sha256, initial.sha256, 'Reader copy differs before first command');
  assert.equal(fingerprint(source).sha256, initial.sha256, 'Original changed while copying');
  const preparedTime = timing('after-copy-and-source-hash');
  write('reader-prepared-deadline.json', JSON.stringify(preparedTime, null, 2) + '\n'); enforceTime(preparedTime);
  let sequence = 0, failure = null;
  const budget = () => {
    owned(); let bytes = 0, entries = 0;
    const visit = (directory, depth = 0) => {
      assert.ok(depth <= limits.depth, 'Reader output depth limit');
      for (const name of readdirSync(directory)) {
        assert.ok(++entries <= limits.output_entries, 'Reader output entry limit');
        const file = path.join(directory, name), stat = lstatSync(file);
        assert.ok(!stat.isSymbolicLink(), 'Symlink in reader output');
        if (stat.isDirectory()) visit(file, depth + 1);
        else { assert.ok(stat.isFile()); bytes += stat.size; assert.ok(bytes <= limits.total_bytes, 'Reader total output byte limit'); }
      }
    }; visit(output); return { bytes, entries };
  };
  const snapshot = (label, file) => { const value = fingerprint(file); write(label + '.json', JSON.stringify(value, null, 2) + '\n'); return value; };
  const command = args => {
    assert.equal(failure, null, 'Reader session already failed; no retry');
    const commandStarted = monotonicNow(), commandDeadline = Math.min(deadline, commandStarted + limits.command_ms);
    const prefix = 'reader-command-' + String(++sequence).padStart(2, '0'), actual = [...args], index = actual.indexOf('--path');
    assert.ok(index >= 0 && [source, result].includes(path.resolve(actual[index + 1])), 'Unknown reader command source'); actual[index + 1] = result;
    assert.ok(actual[0] === 'get' || actual[0] === 'export', 'Unsupported reader operation');
    if (actual.includes('--output-path')) { const target = actual.indexOf('--output-path') + 1; actual[target] = path.resolve(actual[target]); assert.ok(within(output, actual[target]), 'Reader export outside owned output'); }
    budget();
    const originalBefore = snapshot(prefix + '.original-before', source), before = snapshot(prefix + '.copy-before', result);
    assert.equal(originalBefore.sha256, initial.sha256, 'Original changed before reader command');
    assert.equal(before.sha256, initial.sha256, 'Reader copy changed between commands');
    const afterPrehash = timing('after-command-prehash', commandDeadline);
    const remaining = Math.max(0, Math.floor(Math.min(deadline, commandDeadline) - afterPrehash.monotonic_ms));
    const intent = { arguments: ['xcresulttool', ...actual], timeout_ms: remaining, monotonic_clock: 'performance.now by default; injectable fixture clock',
      timing: { after_prehash: afterPrehash }, max_output_bytes: limits.command_bytes,
      original_before_sha256: originalBefore.sha256, copy_before_sha256: before.sha256,
      environment: { TMPDIR: temporary, CFFIXED_USER_HOME: cache, cwd: output, HOME_home_CODEX_HOME_modified: false } };
    write(prefix + '.intent.json', JSON.stringify(intent, null, 2) + '\n');
    let bytes = Buffer.alloc(0), stderr = Buffer.alloc(0), status = null, problem = null, processReceipt = null;
    try {
      enforceTime(afterPrehash);
      const beforeSpawn = timing('immediately-before-runner', commandDeadline); intent.timing.before_runner = beforeSpawn; enforceTime(beforeSpawn);
      const spawnRemaining = Math.floor(Math.min(deadline, commandDeadline) - beforeSpawn.monotonic_ms);
      assert.ok(spawnRemaining >= 1, 'Monotonic reader deadline has no complete millisecond before runner');
      intent.actual_runner_timeout_ms = Math.min(intent.timeout_ms, spawnRemaining);
      const answer = run(actual, { timeout: intent.actual_runner_timeout_ms, maxBuffer: limits.command_bytes,
        monotonic_now: monotonicNow, session_deadline_ms: deadline, command_deadline_ms: commandDeadline,
        env: { ...process.env, TMPDIR: temporary, CFFIXED_USER_HOME: cache }, cwd: output });
      if (Buffer.isBuffer(answer) || typeof answer === 'string') { bytes = Buffer.from(answer); status = 0; }
      else { bytes = Buffer.from(answer.stdout ?? ''); stderr = Buffer.from(answer.stderr ?? ''); status = answer.status; processReceipt = answer.process_receipt ?? null; if (answer.error) throw answer.error; }
      assert.ok(bytes.length + stderr.length <= limits.command_bytes, 'Reader command output limit');
      assert.equal(status, 0, 'Official reader command failed');
    } catch (error) { problem = error; status ??= error.status ?? null; bytes = Buffer.from(error.stdout ?? bytes); stderr = Buffer.from(error.stderr ?? stderr); }
    try { intent.timing.after_return = timing('after-runner-return', commandDeadline); enforceTime(intent.timing.after_return); } catch (error) { problem ??= error; }
    // Retain even an output from a reader that changed its copy or then failed.
    if (bytes.length <= limits.command_bytes) write(prefix + '.stdout.raw', bytes);
    if (stderr.length <= limits.command_bytes) write(prefix + '.stderr.raw', stderr);
    let after = null, originalAfter = null, sealError = null;
    try { after = snapshot(prefix + '.copy-after', result); } catch (error) { sealError = error; }
    try { originalAfter = snapshot(prefix + '.original-after', source); } catch (error) { sealError ??= error; }
    const copyDifference = inventoryDifference(before, after), originalDifference = inventoryDifference(initial, originalAfter);
    try { intent.timing.after_rehash = timing('after-command-rehash', commandDeadline); enforceTime(intent.timing.after_rehash); } catch (error) { problem ??= error; }
    write(prefix + '.receipt.json', JSON.stringify({ ...intent, exit_code: status, process_receipt: processReceipt,
      stdout_bytes: bytes.length, stderr_bytes: stderr.length, copy_difference: copyDifference, original_difference: originalDifference,
      error: problem?.message ?? sealError?.message ?? null }, null, 2) + '\n');
    try {
      if (problem) throw problem; if (sealError) throw sealError;
      assert.equal(copyDifference.status, 'identical', 'Reader copy changed during command; retained unclassified mismatch');
      assert.equal(originalDifference.status, 'identical', 'Original changed during reader command'); budget();
      const beforeReturn = timing('before-command-return', commandDeadline); enforceTime(beforeReturn);
    } catch (error) { failure = error.message; write(prefix + '.deadline-or-validation-failure.json', JSON.stringify({ error: failure, timing: timing('command-failure', commandDeadline) }, null, 2) + '\n'); throw error; }
    return bytes;
  };
  const finish = () => {
    let error = null, original = null, reader = null, cleanup = null;
    const finishTiming = {};
    try { finishTiming.before = timing('before-finish'); enforceTime(finishTiming.before); } catch (problem) { error = problem; }
    try { original = snapshot('reader-original.final', source); } catch (problem) { error = problem; }
    try { reader = snapshot('reader-copy.final', result); } catch (problem) { error ??= problem; }
    try { assert.equal(original?.sha256, initial.sha256, 'Original changed during reader session');
      assert.equal(reader?.sha256, initial.sha256, 'Reader copy changed during session'); budget(); }
    catch (problem) { error ??= problem; }
    try { budget(); owned(); rmSync(temporary, { recursive: true }); rmSync(cache, { recursive: true }); cleanup = 'owned-temp-cache-removed'; }
    catch (problem) { cleanup = 'retained-overbound-or-unavailable: ' + problem.message; error ??= problem; }
    try { finishTiming.after_cleanup = timing('after-finish-hash-and-cleanup'); enforceTime(finishTiming.after_cleanup); } catch (problem) { error ??= problem; }
    write('reader-isolation.final.json', JSON.stringify({ timing: finishTiming, source_initial_sha256: initial.sha256, original_difference: inventoryDifference(initial, original),
      reader_difference: inventoryDifference(initial, reader), copy_retained: reader !== null, copy_path: result, command_count: sequence, cleanup, limits,
      error: error?.message ?? failure, source_identity_verified: false }, null, 2) + '\n');
    try { const afterReceipt = timing('after-finish-receipt'); enforceTime(afterReceipt); } catch (problem) { error ??= problem; write('reader-finish-deadline-failure.json', JSON.stringify({error: error.message, timing: timing('finish-failure')}, null, 2) + '\n'); }
    if (error) throw error;
  };
  return { result, output, command, finish, limits };
}
