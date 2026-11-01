import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { seedClipboardCanary } from '../../ios/tests/clipboard-canary-seed.mjs';

const UUID = '11111111-1111-4111-8111-111111111111';
const canaryText = 'AILibrary-code-copy-canary:9001:1:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa\n';
const canary = () => Buffer.from(canaryText);
const hash = value => createHash('sha256').update(value).digest('hex');
const passed = () => ({ exit_code: 0, signal: null, error_code: null, error: null });
const timeout = () => ({ exit_code: null, signal: 'SIGKILL',
  error_code: 'ETIMEDOUT', error: 'spawnSync xcrun ETIMEDOUT' });

const posixTimeoutStderr = "An error was encountered processing the command (domain=NSPOSIXErrorDomain, code=60):\nThe operation couldn’t be completed. Operation timed out\nOperation timed out\n";
const posixTimeout = () => ({ ...passed(), exit_code: 60, stderr_text: posixTimeoutStderr });

const executed = (receipt, plannedTimeout, permit) => {
  if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) return receipt;
  return { ...receipt, spawned: true, planned_timeout_ms: plannedTimeout, actual_timeout_ms: permit.timeout_ms };
};

function scripted(responses) {
  let clock = 0;
  const calls = [];
  return { calls, now: () => clock, execute: (name, destination, input, plannedTimeout, acquirePermit) => {
    const permit = acquirePermit(), limit = permit.timeout_ms;
    calls.push({ name, destination, input: Buffer.from(input), timeout_ms: limit, planned_timeout_ms: plannedTimeout });
    const response = responses[calls.length - 1]; assert.ok(response, 'Unexpected additional execution');
    clock += response.elapsed === 'timeout' ? limit : (response.elapsed ?? 1);
    return executed(response.receipt, plannedTimeout, permit);
  } };
}

test('first success seeds once and returns only input identity and receipts', () => {
  const fixture = scripted([{ receipt: passed() }]);
  const result = seedClipboardCanary(UUID, canary(), fixture.execute, fixture.now);
  assert.equal(fixture.calls.length, 1); assert.equal(result.accepted_attempt, 'seed');
  assert.equal(result.UUID, UUID); assert.equal(result.input_bytes, canary().length);
  assert.equal(result.input_SHA256, hash(canary())); assert.equal(result.attempts.length, 1);
  assert.ok(!JSON.stringify(result).includes(canaryText.trim()));
});

test('the exact observed timeout permits one second seed', () => {
  const fixture = scripted([{ receipt: timeout(), elapsed: 'timeout' }, { receipt: passed() }]);
  const result = seedClipboardCanary(UUID, canary(), fixture.execute, fixture.now);
  assert.equal(result.accepted_attempt, 'seed-timeout-retry-1');
  assert.deepEqual(fixture.calls.map(call => call.name), ['seed', 'seed-timeout-retry-1']);
  assert.ok(fixture.calls.every(call => call.destination === UUID && call.input.equals(canary())));
  assert.deepEqual(result.attempts.map(attempt => attempt.actual_timeout_ms), [30000, 30000]);
});

test('an ambiguous first write followed by the same write preserves canary bytes', () => {
  let clipboard, calls = 0, clock = 0;
  const result = seedClipboardCanary(UUID, canary(), (name, destination, input, plannedTimeout, acquirePermit) => {
    const permit = acquirePermit(), limit = permit.timeout_ms;
    assert.equal(destination, UUID); clipboard = Buffer.from(input); calls += 1;
    clock += calls === 1 ? limit : 1;
    return executed(calls === 1 ? timeout() : passed(), plannedTimeout, permit);
  }, () => clock);
  assert.equal(calls, 2); assert.ok(clipboard.equals(canary()));
  assert.equal(result.input_SHA256, hash(clipboard));
});

test('a second timeout fails without a third call', () => {
  const fixture = scripted([{ receipt: timeout(), elapsed: 'timeout' },
    { receipt: timeout(), elapsed: 'timeout' }]);
  assert.throws(() => seedClipboardCanary(UUID, canary(), fixture.execute, fixture.now), /seed-timeout-retry-1/);
  assert.equal(fixture.calls.length, 2);
});

test('a different second failure is not retried or accepted', () => {
  const fixture = scripted([{ receipt: timeout(), elapsed: 'timeout' },
    { receipt: { ...passed(), exit_code: 1 } }]);
  assert.throws(() => seedClipboardCanary(UUID, canary(), fixture.execute, fixture.now), /seed-timeout-retry-1/);
  assert.equal(fixture.calls.length, 2);
});

test('unknown errors never trigger a second write', () => {
  for (const error of ['spawnSync xcrun ENOENT', 'spawnSync other ETIMEDOUT', 'spawnSync xcrun ETIMEDOUT\n']) {
    const fixture = scripted([{ receipt: { ...timeout(), error } }]);
    assert.throws(() => seedClipboardCanary(UUID, canary(), fixture.execute, fixture.now));
    assert.equal(fixture.calls.length, 1);
  }
});

test('the status signal code and exact error must all match the observed timeout', () => {
  for (const changed of [{ exit_code: 0 }, { exit_code: 1 }, { signal: 'SIGTERM' },
    { signal: null }, { error_code: 'ENOENT' }, { error_code: null }]) {
    const fixture = scripted([{ receipt: { ...timeout(), ...changed } }]);
    assert.throws(() => seedClipboardCanary(UUID, canary(), fixture.execute, fixture.now));
    assert.equal(fixture.calls.length, 1);
  }
});

test('an ordinary nonzero exit fails after one write', () => {
  const fixture = scripted([{ receipt: { ...passed(), exit_code: 1 } }]);
  assert.throws(() => seedClipboardCanary(UUID, canary(), fixture.execute, fixture.now));
  assert.equal(fixture.calls.length, 1);
});

test('callback exceptions propagate without another attempt', () => {
  const error = new Error('receipt storage failed'); let calls = 0;
  assert.throws(() => seedClipboardCanary(UUID, canary(), () => {
    calls += 1; throw error;
  }, () => 0), thrown => thrown === error);
  assert.equal(calls, 1);
});

test('malformed result schemas fail without another attempt', () => {
  for (const receipt of [null, undefined, [], {}, { exit_code: 0, signal: null, error: null }]) {
    const fixture = scripted([{ receipt }]);
    assert.throws(() => seedClipboardCanary(UUID, canary(), fixture.execute, fixture.now));
    assert.equal(fixture.calls.length, 1);
  }
});

test('only canonical destinations and a bounded controlled canary can reach the callback', () => {
  for (const [destination, input] of [
    ['booted', canary()], [UUID.toLowerCase().replace('1', 'a'), canary()],
    [UUID, Buffer.alloc(0)], [UUID, Buffer.alloc(257)], [UUID, canaryText],
    [UUID, Buffer.from('def actual_copied_code():\n    pass\n')],
    [UUID, Buffer.from(canaryText.replace(':9001:', ':untrusted:'))],
    [UUID, Buffer.from(canaryText + '\n')],
  ]) {
    let calls = 0;
    assert.throws(() => seedClipboardCanary(destination, input, () => { calls += 1; return passed(); }, () => 0));
    assert.equal(calls, 0);
  }
});

test('a callback cannot change captured bytes or destination for the second attempt', () => {
  const original = canary(), expected = Buffer.from(original), inputs = []; let clock = 0;
  const result = seedClipboardCanary(UUID, original, (name, destination, input, plannedTimeout, acquirePermit) => {
    const permit = acquirePermit(), limit = permit.timeout_ms;
    assert.equal(destination, UUID); inputs.push(Buffer.from(input));
    if (name === 'seed') {
      input.fill(0); original.fill(0); clock += limit; return executed(timeout(), plannedTimeout, permit);
    }
    clock += 1; return executed(passed(), plannedTimeout, permit);
  }, () => clock);
  assert.equal(inputs.length, 2); assert.ok(inputs.every(input => input.equals(expected)));
  assert.equal(result.input_SHA256, hash(expected)); assert.equal(result.UUID, UUID);
});

test('the second per-call timeout is clamped to the remaining pair allowance', () => {
  const fixture = scripted([{ receipt: timeout(), elapsed: 45000 }, { receipt: passed() }]);
  seedClipboardCanary(UUID, canary(), fixture.execute, fixture.now);
  assert.deepEqual(fixture.calls.map(call => call.timeout_ms), [30000, 15000]);
});

test('an exhausted allowance before the first write causes no callback', () => {
  let reads = 0, calls = 0;
  assert.throws(() => seedClipboardCanary(UUID, canary(), () => { calls += 1; return passed(); },
    () => reads++ === 0 ? 0 : 60000), /exhausted/);
  assert.equal(calls, 0);
});

test('an exhausted allowance after the first timeout causes no additional write', () => {
  const fixture = scripted([{ receipt: timeout(), elapsed: 60000 }]);
  assert.throws(() => seedClipboardCanary(UUID, canary(), fixture.execute, fixture.now), /exhausted/);
  assert.equal(fixture.calls.length, 1);
});

test('non-finite or backwards clocks fail rather than granting a new allowance', () => {
  for (const values of [[Infinity], [0, -1], [0, 0, -1]]) {
    let index = 0, calls = 0;
    assert.throws(() => seedClipboardCanary(UUID, canary(), (name, destination, input, plannedTimeout, acquirePermit) => {
      calls += 1; return executed(passed(), plannedTimeout, acquirePermit());
    },
      () => values[Math.min(index++, values.length - 1)]));
    assert.ok(calls <= 1);
  }
});

test('a callback returning after the pair deadline is not accepted', () => {
  const fixture = scripted([{ receipt: passed(), elapsed: 60001 }]);
  assert.throws(() => seedClipboardCanary(UUID, canary(), fixture.execute, fixture.now), /exhausted/);
  assert.equal(fixture.calls.length, 1);
});

// Read actual workflow source; run its unchanged strict runner and the complete
// new slice branch with fake process/clock/receipt storage. No command or file
// write is provided to this code. The import bridge only supplies a fake clock.
function preparation({ slice = 'content-copy', seedResults = ['pass'], mutateFirstInput = false,
  pasteMismatch = false, canaryFailure = false, timeoutOverhead = 0, intentDelays = {} } = {}) {
  const source = readFileSync(new URL('../../.github/workflows/ios-published-candidate.yml', import.meta.url), 'utf8');
  const match = source.match(/^          const run = \(name, args, input,[\s\S]*?^          };\n/m);
  assert.ok(match, 'Expected original strict preparation runner');
  const runner = match[0].split('\n').map(line => line.slice(10)).join('\n');
  const start = source.indexOf('          // BEGIN CONTENT-COPY CANARY SEED RECOVERY\n');
  const marker = '          // END CONTENT-COPY CANARY SEED RECOVERY\n';
  const end = source.indexOf(marker, start) + marker.length;
  assert.ok(start >= 0 && end > start);
  const branch = source.slice(start, end).split('\n').map(line => line.slice(10)).join('\n');
  const afterStart = source.indexOf("          const observed = run('canary'", end);
  const afterEnd = source.indexOf('          console.log(UUID);\n', afterStart) + '          console.log(UUID);\n'.length;
  assert.ok(afterStart >= end && afterEnd > afterStart);
  const postSeed = source.slice(afterStart, afterEnd).split('\n').map(line => line.slice(10)).join('\n');
  const files = new Map(), spawns = [], printed = [];
  let clock = 0, label, seedCount = 0, moduleCalls = 0, clipboard = Buffer.from('old fixture pasteboard');
  const input = canary();
  const put = (name, value) => {
    assert.ok(!files.has(name), 'Attempt receipt overwrite: ' + name);
    files.set(name, Buffer.isBuffer(value) ? Buffer.from(value) : String(value));
  };
  const json = (name, value) => {
    put(name, JSON.stringify(value));
    if (name.endsWith('.intent.json')) {
      label = name.slice('copy-'.length, -'.intent.json'.length);
      clock += intentDelays[label] ?? 0;
    }
  };
  const context = vm.createContext({ assert, Buffer, UUID, canary: input, put, json, createHash,
    selection: { slice, source_head: 'a'.repeat(40), expected_case_IDs: ['fixed-fixture-id'],
      source_case_files: {}, contract_SHA256: 'b'.repeat(64) },
    runtimeID: 'com.apple.CoreSimulator.SimRuntime.iOS-18-5',
    device: { deviceTypeIdentifier: 'com.apple.CoreSimulator.SimDeviceType.iPhone-16' },
    event: { repository: { full_name: 'pero3dev/ai-agent-library' } },
    process: { env: { GITHUB_RUN_ID: '9001', GITHUB_RUN_ATTEMPT: '1', GITHUB_SHA: 'c'.repeat(40) } },
    console: { log: value => printed.push(value) },
    seedClipboardCanary: (destination, bytes, execute) => {
      moduleCalls += 1; return seedClipboardCanary(destination, bytes, execute, () => clock);
    },
    spawnSync: (binary, command, options) => {
      assert.equal(binary, 'xcrun'); assert.equal(options.killSignal, 'SIGKILL');
      const record = { label, command: [...command], timeout: options.timeout,
        input: options.input === undefined ? undefined : Buffer.from(options.input) };
      spawns.push(record);
      if (command[1] === 'pbcopy') {
        assert.equal(command[2], UUID); assert.ok(options.input.equals(input));
        assert.equal(options.maxBuffer, 1024 * 1024); assert.ok(options.timeout > 0 && options.timeout <= 30000);
        clipboard = Buffer.from(options.input); seedCount += 1;
        if (mutateFirstInput && seedCount === 1) options.input.fill(0);
        const result = seedResults[seedCount - 1]; assert.ok(result, 'Unexpected third seed');
        if (result === 'timeout') {
          clock += options.timeout + (seedCount === 1 ? timeoutOverhead : 0);
          const error = new Error('spawnSync xcrun ETIMEDOUT'); error.code = 'ETIMEDOUT';
          return { status: null, signal: 'SIGKILL', error, stdout: Buffer.alloc(0), stderr: Buffer.from('first seed timed out') };
        }
        if (result === 'posix-timeout' || result === 'other60') {
          clock += 10000;
          const stderr = result === 'posix-timeout' ? posixTimeoutStderr
            : posixTimeoutStderr.replace('NSPOSIXErrorDomain', 'OtherErrorDomain');
          return { status: 60, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.from(stderr) };
        }
        assert.equal(result, 'pass');
        clock += 1; return { status: 0, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) };
      }
      assert.deepEqual([...command], ['simctl', 'pbpaste', UUID]);
      clock += 1;
      if (canaryFailure) {
        const error = new Error('spawnSync xcrun ETIMEDOUT'); error.code = 'ETIMEDOUT';
        return { status: null, signal: 'SIGKILL', error, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) };
      }
      return { status: 0, signal: null,
        stdout: pasteMismatch ? Buffer.from('wrong pasteboard bytes') : Buffer.from(clipboard), stderr: Buffer.alloc(0) };
    } });
  vm.runInContext(runner, context);
  return { files, spawns, printed, input, moduleCalls: () => moduleCalls,
    seed: () => vm.runInContext(branch, context), postSeed: () => vm.runInContext(postSeed, context),
    runCanary: () => vm.runInContext("run('canary', ['simctl', 'pbpaste', UUID], undefined, 1024 * 1024, 90000)", context) };
}

test('actual B seed branch records input identity and still needs the unchanged canary proof', () => {
  const fixture = preparation(); fixture.seed(); fixture.postSeed();
  assert.equal(fixture.moduleCalls(), 1); assert.equal(fixture.spawns.length, 2);
  assert.equal(fixture.spawns[0].label, 'seed'); assert.equal(fixture.spawns[1].label, 'canary');
  assert.equal(fixture.spawns[1].timeout, 90000);
  const binding = JSON.parse(fixture.files.get('copy-seed-input.json'));
  assert.equal(binding.input_SHA256, hash(canary())); assert.equal(binding.UUID, UUID);
  assert.ok(!fixture.files.get('copy-seed-input.json').includes(canaryText.trim()));
  assert.equal(JSON.parse(fixture.files.get('copy-device.json')).status, 'unique-device-canary-roundtrip-verified');
});

test('actual B timeout recovery retains both receipts and uses identical UUID and bytes', () => {
  const fixture = preparation({ seedResults: ['timeout', 'pass'], mutateFirstInput: true, timeoutOverhead: 15000 });
  fixture.seed(); fixture.postSeed();
  const writes = fixture.spawns.filter(call => call.command[1] === 'pbcopy');
  assert.equal(writes.length, 2); assert.ok(writes.every(call => call.command[2] === UUID && call.input.equals(canary())));
  assert.deepEqual(writes.map(call => call.label), ['seed', 'seed-timeout-retry-1']);
  assert.deepEqual(writes.map(call => call.timeout), [30000, 15000]);
  assert.equal(JSON.parse(fixture.files.get('copy-seed.exit.json')).error_code, 'ETIMEDOUT');
  assert.equal(JSON.parse(fixture.files.get('copy-seed-timeout-retry-1.exit.json')).exit_code, 0);
  assert.equal(JSON.parse(fixture.files.get('copy-seed-accepted.json')).accepted_attempt, 'seed-timeout-retry-1');
  assert.equal(JSON.parse(fixture.files.get('copy-seed.intent.json')).input_SHA256,
    JSON.parse(fixture.files.get('copy-seed-timeout-retry-1.intent.json')).input_SHA256);
});

test('actual B repeated timeout stops before paste verification and keeps failure receipts', () => {
  const fixture = preparation({ seedResults: ['timeout', 'timeout'] });
  assert.throws(() => fixture.seed()); assert.equal(fixture.spawns.length, 2);
  assert.ok(fixture.files.has('copy-seed-input.json'));
  assert.ok(fixture.files.has('copy-seed.exit.json'));
  assert.ok(fixture.files.has('copy-seed-timeout-retry-1.exit.json'));
  assert.ok(!fixture.files.has('copy-seed-accepted.json')); assert.ok(!fixture.files.has('copy-device.json'));
});

test('actual A branch keeps its original single strict seed without using the helper', () => {
  for (const result of ['pass', 'timeout']) {
    const fixture = preparation({ slice: 'reading-state', seedResults: [result] });
    if (result === 'pass') { fixture.seed(); fixture.postSeed(); }
    else assert.throws(() => fixture.seed());
    assert.equal(fixture.moduleCalls(), 0);
    assert.equal(fixture.spawns.filter(call => call.command[1] === 'pbcopy').length, 1);
    assert.ok(!fixture.files.has('copy-seed-input.json'));
  }
});

test('unchanged paste verification rejects mismatches and nonseed timeouts without retries', () => {
  const mismatch = preparation({ pasteMismatch: true }); mismatch.seed();
  assert.throws(() => mismatch.postSeed(), /exact unique canary bytes/);
  assert.ok(!mismatch.files.has('copy-device.json'));
  const failure = preparation({ canaryFailure: true });
  assert.throws(() => failure.runCanary());
  assert.equal(failure.moduleCalls(), 0); assert.equal(failure.spawns.length, 1);
  assert.equal(failure.spawns[0].timeout, 90000);
});

test('actual intent storage exhausting the allowance blocks the first or second spawn', () => {
  for (const name of ['seed', 'seed-timeout-retry-1']) {
    const first = name === 'seed';
    const fixture = preparation({ seedResults: first ? ['pass'] : ['timeout', 'pass'],
      intentDelays: { [name]: first ? 60000 : 30000 } });
    assert.throws(() => fixture.seed(), /exhausted before spawn/);
    assert.equal(fixture.spawns.length, first ? 0 : 1, name);
    const planned = JSON.parse(fixture.files.get(`copy-${name}.intent.json`));
    assert.equal(planned.planned_timeout_ms, 30000); assert.ok(!Object.hasOwn(planned, 'timeout_ms'));
    assert.equal(planned.timeout_phase, 'planned-before-intent-storage');
    assert.ok(!fixture.files.has(`copy-${name}.exit.json`), 'No process exit is invented for a blocked spawn');
    assert.ok(!fixture.files.has('copy-seed-accepted.json'));
    if (!first) assert.equal(JSON.parse(fixture.files.get('copy-seed.exit.json')).error_code, 'ETIMEDOUT');
  }
});

test('actual intent storage clamps the first or second spawn and receipts separate planned from actual', () => {
  for (const name of ['seed', 'seed-timeout-retry-1']) {
    const first = name === 'seed';
    const fixture = preparation({ seedResults: first ? ['pass'] : ['timeout', 'pass'],
      intentDelays: { [name]: first ? 45000 : 15000 } });
    fixture.seed(); fixture.postSeed();
    const call = fixture.spawns.find(item => item.label === name);
    assert.equal(call.timeout, 15000, name);
    const planned = JSON.parse(fixture.files.get(`copy-${name}.intent.json`));
    const actual = JSON.parse(fixture.files.get(`copy-${name}.exit.json`));
    assert.equal(planned.planned_timeout_ms, 30000, name);
    assert.equal(actual.planned_timeout_ms, 30000, name);
    assert.equal(actual.actual_timeout_ms, 15000, name); assert.equal(actual.spawned, true, name);
    const accepted = JSON.parse(fixture.files.get('copy-seed-accepted.json'));
    const attempt = accepted.attempts.find(item => item.name === name);
    assert.equal(attempt.planned_timeout_ms, 30000); assert.equal(attempt.actual_timeout_ms, 15000);
    assert.equal(JSON.parse(fixture.files.get('copy-device.json')).status, 'unique-device-canary-roundtrip-verified');
  }
});

test('the exact observed POSIX timeout permits one seed with identical destination and bytes', () => {
  const fixture = scripted([{ receipt: posixTimeout(), elapsed: 10000 }, { receipt: passed() }]);
  const result = seedClipboardCanary(UUID, canary(), fixture.execute, fixture.now);
  assert.equal(fixture.calls.length, 2); assert.equal(result.accepted_attempt, 'seed-timeout-retry-1');
  assert.ok(fixture.calls.every(call => call.destination === UUID && call.input.equals(canary())));
  assert.equal(result.attempts[0].exit_code, 60);
  assert.equal(result.attempts[0].stderr_text, posixTimeoutStderr);
  assert.deepEqual(result.attempts.map(value => value.actual_timeout_ms), [30000, 30000]);
});

test('POSIX eligibility needs exact numeric status and null signal error and error code', () => {
  for (const changed of [{ exit_code: '60' }, { exit_code: null }, { exit_code: 1 }, { signal: 'SIGKILL' },
    { signal: undefined }, { error: 'spawnSync xcrun ETIMEDOUT' }, { error: undefined },
    { error_code: 'ETIMEDOUT' }, { error_code: undefined }]) {
    const fixture = scripted([{ receipt: { ...posixTimeout(), ...changed } }]);
    assert.throws(() => seedClipboardCanary(UUID, canary(), fixture.execute, fixture.now));
    assert.equal(fixture.calls.length, 1);
  }
  const success = scripted([{ receipt: { ...posixTimeout(), exit_code: 0 } }]);
  const result = seedClipboardCanary(UUID, canary(), success.execute, success.now);
  assert.equal(success.calls.length, 1); assert.equal(result.accepted_attempt, 'seed');
});

test('exit60 with unrelated incomplete or altered stderr never retries', () => {
  for (const stderr_text of [undefined, null, Buffer.from(posixTimeoutStderr), 'Operation timed out\n',
    posixTimeoutStderr.replace('NSPOSIXErrorDomain', 'OtherErrorDomain'),
    posixTimeoutStderr.replace('code=60', 'code=1'),
    posixTimeoutStderr.replace('couldn’t', "couldn't"),
    posixTimeoutStderr.trimEnd(), posixTimeoutStderr + '\n', 'prefix\n' + posixTimeoutStderr]) {
    const fixture = scripted([{ receipt: { ...posixTimeout(), stderr_text } }]);
    assert.throws(() => seedClipboardCanary(UUID, canary(), fixture.execute, fixture.now));
    assert.equal(fixture.calls.length, 1);
  }
});

test('a second POSIX timeout fails without any third seed', () => {
  const fixture = scripted([{ receipt: posixTimeout(), elapsed: 10000 }, { receipt: posixTimeout(), elapsed: 10000 }]);
  assert.throws(() => seedClipboardCanary(UUID, canary(), fixture.execute, fixture.now), /seed-timeout-retry-1/);
  assert.equal(fixture.calls.length, 2);
});

test('mixed Node and POSIX timeouts still share only two attempts and one deadline', () => {
  for (const receipts of [[timeout(), posixTimeout()], [posixTimeout(), timeout()]]) {
    const fixture = scripted(receipts.map(receipt => ({ receipt, elapsed: 10000 })));
    assert.throws(() => seedClipboardCanary(UUID, canary(), fixture.execute, fixture.now), /seed-timeout-retry-1/);
    assert.equal(fixture.calls.length, 2);
  }
});

test('actual B POSIX recovery preserves exact stderr receipts and unchanged paste verification', () => {
  const fixture = preparation({ seedResults: ['posix-timeout', 'pass'] });
  fixture.seed(); fixture.postSeed();
  const writes = fixture.spawns.filter(call => call.command[1] === 'pbcopy');
  assert.equal(writes.length, 2); assert.ok(writes.every(call => call.command[2] === UUID && call.input.equals(canary())));
  const first = JSON.parse(fixture.files.get('copy-seed.exit.json'));
  assert.equal(first.exit_code, 60); assert.equal(first.signal, null);
  assert.equal(first.error, null); assert.equal(first.error_code, null);
  assert.equal(first.stderr_text, posixTimeoutStderr);
  assert.equal(fixture.files.get('copy-seed.stderr.log').toString(), posixTimeoutStderr);
  assert.equal(JSON.parse(fixture.files.get('copy-seed-timeout-retry-1.exit.json')).exit_code, 0);
  assert.equal(JSON.parse(fixture.files.get('copy-seed-accepted.json')).accepted_attempt, 'seed-timeout-retry-1');
  assert.equal(JSON.parse(fixture.files.get('copy-device.json')).status, 'unique-device-canary-roundtrip-verified');
  assert.equal(fixture.spawns.find(call => call.command[1] === 'pbpaste').timeout, 90000);
});

test('actual B unrelated exit60 stays failed with one raw receipt and no paste proof', () => {
  const fixture = preparation({ seedResults: ['other60'] });
  assert.throws(() => fixture.seed()); assert.equal(fixture.spawns.length, 1);
  assert.equal(JSON.parse(fixture.files.get('copy-seed.exit.json')).exit_code, 60);
  assert.ok(fixture.files.get('copy-seed.stderr.log').toString().includes('OtherErrorDomain'));
  assert.ok(!fixture.files.has('copy-seed-timeout-retry-1.intent.json'));
  assert.ok(!fixture.files.has('copy-seed-accepted.json')); assert.ok(!fixture.files.has('copy-device.json'));
});

test('actual A POSIX failure remains its original single strict seed', () => {
  const fixture = preparation({ slice: 'reading-state', seedResults: ['posix-timeout'] });
  assert.throws(() => fixture.seed()); assert.equal(fixture.moduleCalls(), 0);
  assert.equal(fixture.spawns.length, 1); assert.equal(fixture.spawns[0].timeout, 30000);
  assert.ok(!fixture.files.has('copy-seed-input.json'));
  assert.ok(!fixture.files.has('copy-seed-accepted.json')); assert.ok(!fixture.files.has('copy-device.json'));
});
