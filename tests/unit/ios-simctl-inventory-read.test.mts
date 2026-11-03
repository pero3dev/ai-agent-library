import assert from 'node:assert/strict';
import { requiredFixture, objectFixture, objectArrayFixture, stringFixture } from '../helpers/json-fixtures.mjs';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { readSimctlInventory } from '../../ios/tests/simctl-inventory-read.mjs';

// Load the tracked implementation invoked by the workflow, then erase only its
// types before running the same production functions in the isolated VM.
function workflowDriverSource(workflow: string): string {
  const driver = '.github/scripts/' + workflow.replace(/\.yml$/, '') + '/driver.mts';
  const yaml = readFileSync(new URL('../../.github/workflows/' + workflow, import.meta.url), 'utf8');
  assert.ok(yaml.includes('DRIVER_PATH: ${{ github.workspace }}/' + driver));
  assert.ok(yaml.includes('run: node "$DRIVER_PATH" inventory'));
  const source = stripTypeScriptTypes(readFileSync(new URL('../../' + driver, import.meta.url), 'utf8'), { mode: 'transform' });
  return yaml.replaceAll('\r\n', '\n') + '\n' + source.split('\n').map(line => '          ' + line).join('\n');
}

/** @type {[string,string[]][]} */
const requests: [string, string[]][] = [
  ['runtimes', ['simctl', 'list', 'runtimes', '--json']],
  ['device-types', ['simctl', 'list', 'devicetypes', '--json']],
  ['devices-before-create', ['simctl', 'list', 'devices', '--json']],
  ['devices-after-boot', ['simctl', 'list', 'devices', '--json']],
];
const args = requests[0][1];
/** @param {string} stdout */
const passed = (stdout: string) => ({ exit_code: 0, signal: null, error: null, stdout });
const timedOut = () => ({ exit_code: null, signal: 'SIGKILL',
  error: 'spawnSync xcrun ETIMEDOUT', stdout: '' });

test('successful exact reads return their original output with one execution', () => {
  for (const [name, request] of requests) {
    /** @type {string[]} */
  const calls: string[] = [];
    const output = '  {"value":"' + name + '"}\n';
    assert.deepEqual(readSimctlInventory(name, Object.freeze([...request]), (attempt) => {
      calls.push(attempt); return passed(output);
    }), { attempt: name, stdout: output });
    assert.deepEqual(calls, [name]);
  }
});

test('one exact timeout can recover with a distinct second attempt', () => {
  /** @type {string[]} */
  const calls: string[] = [];
  const first = timedOut();
  const output = '{"runtimes":[{"isAvailable":true}]}';
  assert.deepEqual(readSimctlInventory('runtimes', args, (attempt) => {
    calls.push(attempt); return calls.length === 1 ? first : passed(output);
  }), { attempt: 'runtimes-timeout-retry-1', stdout: output });
  assert.deepEqual(calls, ['runtimes', 'runtimes-timeout-retry-1']);
  assert.deepEqual(first, timedOut());
});

test('a second timeout fails without a third execution', () => {
  /** @type {string[]} */
  const calls: string[] = [];
  assert.throws(() => readSimctlInventory('runtimes', args, (attempt) => {
    calls.push(attempt); return timedOut();
  }), /runtimes-timeout-retry-1/);
  assert.deepEqual(calls, ['runtimes', 'runtimes-timeout-retry-1']);
});

test('a failed second receipt is never accepted or retried again', () => {
  let calls = 0;
  assert.throws(() => readSimctlInventory('runtimes', args, () => {
    calls += 1; return calls === 1 ? timedOut() : { ...passed('{}'), exit_code: 1 };
  }), /runtimes-timeout-retry-1/);
  assert.equal(calls, 2);
});

test('nonzero exit without a timeout fails after one execution', () => {
  let calls = 0;
  assert.throws(() => readSimctlInventory('runtimes', args, () => {
    calls += 1; return { ...passed('{}'), exit_code: 1 };
  }), /runtimes/);
  assert.equal(calls, 1);
});

test('other errors never trigger an additional execution', () => {
  for (const error of ['spawnSync xcrun ENOENT', 'Stage budget exhausted',
    'spawnSync another-binary ETIMEDOUT', 'spawnSync xcrun ETIMEDOUT\n']) {
    let calls = 0;
    assert.throws(() => readSimctlInventory('runtimes', args, () => {
      calls += 1; return { ...timedOut(), error };
    }), /runtimes/);
    assert.equal(calls, 1);
  }
});

test('timeout text with the wrong status or signal cannot trigger a repeat', () => {
  for (const changed of [{ exit_code: 1 }, { exit_code: 0 }, { signal: 'SIGTERM' }, { signal: null }]) {
    let calls = 0;
    assert.throws(() => readSimctlInventory('runtimes', args, () => {
      calls += 1; return { ...timedOut(), ...changed };
    }), /runtimes/);
    assert.equal(calls, 1);
  }
});

test('an executor exception is propagated without an additional call', () => {
  const error = new Error('receipt storage failed'); let calls = 0;
  assert.throws(() => readSimctlInventory('runtimes', args, () => {
    calls += 1; throw error;
  }), (thrown) => thrown === error);
  assert.equal(calls, 1);
});

test('malformed receipts fail rather than yielding missing output', () => {
  for (const value of [undefined, null, [], {}, { ...passed('{}'), stdout: undefined }]) {
    let calls = 0;
    assert.throws(() => readSimctlInventory('runtimes', args, () => {
      calls += 1; return value;
    }));
    assert.equal(calls, 1);
  }
});

test('unknown reads and altered commands are rejected before execution', () => {
  for (const [name, request] of ([
    ['create-simulator', ['simctl', 'create', 'anything']],
    ['boot-simulator', ['simctl', 'boot', 'anything']],
    ['cleanup-before', ['simctl', 'list', 'devices', '--json']],
    ['runtimes-timeout-retry-1', args],
    ['runtimes', ['simctl', 'list', 'runtimes']],
    ['runtimes', ['simctl', 'list', 'runtimes', '--json', '--extra']],
    ['devices-after-boot', ['simctl', 'list', 'devices', 'available', '--json']],
  ] as [string,string[]][])) {
    let calls = 0;
    assert.throws(() => readSimctlInventory(name, request, () => {
      calls += 1; return passed('{}');
    }));
    assert.equal(calls, 0);
  }
});

test('malformed JSON from a successful read is not retried', () => {
  let calls = 0;
  assert.throws(() => JSON.parse(readSimctlInventory('runtimes', args, () => {
    calls += 1; return passed('{not-json');
  }).stdout), SyntaxError);
  assert.equal(calls, 1);
});

test('valid JSON failing runtime validation is not retried', () => {
  let calls = 0;
  assert.throws(() => {
    const value = JSON.parse(readSimctlInventory('runtimes', args, () => {
      calls += 1; return passed('{"runtimes":[]}');
    }).stdout);
    assert.equal(objectArrayFixture(objectFixture(value).runtimes).filter((row) => row.version === '18.5').length, 1);
  });
  assert.equal(calls, 1);
});

// Evaluate the production run function with an in-memory clock, process runner
// and receipt store. No command, Simulator, timer or filesystem write is used.
type ProcessResponse = { status: number | null; signal: string | null; error?: Error; stdout?: string; stderr?: string; elapsed: number | 'timeout'}
/** @param {string} workflow @param {number} budget @param {ProcessResponse[]} responses */
function boundedProductionRun(workflow: string, budget: number, responses: ProcessResponse[]) {
  const source = workflowDriverSource(workflow);
  const match = requiredFixture(source.match(/^          function run\(name, binary, args,[\s\S]*?^          }\n/m));
  assert.ok(match, 'Expected one production bounded run function');
  assert.equal(requiredFixture(source.match(/^          function run\(/gm)).length, 1);
  const functionSource = match[0].split('\n').map((line) => line.slice(10)).join('\n');
  let now = 0;
  /** @type {Map<string,string>} */
  const files: Map<string, string> = new Map();
  /** @type {{binary:string,command:string[],timeout:number}[]} */
  const spawns: { binary: string; command: string[]; timeout: number }[] = [];
  /** @param {string} name @param {unknown} value */
  const put = (name: string, value: unknown) => {
    assert.ok(!files.has(name), 'Attempt evidence must not overwrite: ' + name);
    files.set(name, String(value));
  };
  const context = vm.createContext({ assert, workspace: '/fake/workspace', deadline: budget,
    stage: 'inventory', performance: { now: () => now }, process: { env: { PATH: '/fake/tools' } },
    put, json: /** @param {string} name @param {unknown} value */ (name: string, value: unknown) => put(name, JSON.stringify(value)),
    spawnSync: /** @param {string} binary @param {string[]} command @param {{timeout:number,killSignal:string,maxBuffer:number,encoding:string,cwd:string}} options */ (binary: string, command: string[], options: { timeout: number; killSignal: string; maxBuffer: number; encoding: string; cwd: string }) => {
      assert.equal(binary, 'xcrun'); assert.ok(options.timeout > 0);
      assert.equal(options.killSignal, 'SIGKILL'); assert.equal(options.maxBuffer, 8 * 1024 * 1024);
      assert.equal(options.encoding, 'utf8'); assert.equal(options.cwd, '/fake/workspace');
      spawns.push({ binary, command: [...command], timeout: options.timeout });
      const result = responses[spawns.length - 1]; assert.ok(result, 'Unexpected process execution');
      now += result.elapsed === 'timeout' ? options.timeout : result.elapsed;
      return { status: result.status, signal: result.signal, error: result.error,
        stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
    } });
  const run = functionFixture(vm.runInContext('(' + functionSource + ')', context));
  return { execute: /** @param {string} name */ (name: string) => (Reflect.apply(run, undefined, [name, 'xcrun', args, 30000, '/fake/workspace', false]) as unknown), files, spawns };
}

/** @returns {ProcessResponse} */
function processTimeout(): ProcessResponse {
  return { status: null, signal: 'SIGKILL', error: new Error('spawnSync xcrun ETIMEDOUT'),
    stdout: '', stderr: 'first timed-out read', elapsed: 'timeout' };
}
/** @returns {ProcessResponse} */
const processPass = (): ProcessResponse => ({ status: 0, signal: null, stdout: '{"runtimes":[]}', elapsed: 1 });

for (const workflow of ['ios-reader-reflow.yml', 'ios-reader-dynamic-type.yml']) {
  test(workflow + ': recovery retains distinct first and second production receipts', () => {
    const harness = boundedProductionRun(workflow, 90000, [processTimeout(), processPass()]);
    assert.deepEqual(readSimctlInventory('runtimes', args, harness.execute),
      { attempt: 'runtimes-timeout-retry-1', stdout: '{"runtimes":[]}' });
    assert.deepEqual(harness.spawns.map((row) => row.timeout), [30000, 30000]);
    assert.ok(harness.spawns.every((row) => JSON.stringify(row.command) === JSON.stringify(args)));
    assert.equal(harness.files.size, 8);
    const first = parseReceipt(harness.files.get('runtimes.exit.json'));
    assert.deepEqual(first, { exit_code: null, signal: 'SIGKILL', error: 'spawnSync xcrun ETIMEDOUT' });
    assert.equal(harness.files.get('runtimes.stderr.log'), 'first timed-out read');
    assert.deepEqual(parseReceipt(harness.files.get('runtimes-timeout-retry-1.exit.json')),
      { exit_code: 0, signal: null, error: null });
    assert.equal(parseReceipt(harness.files.get('runtimes-timeout-retry-1.intent.json')).remaining_ms, 60000);
  });

  test(workflow + ': second read is clamped to the original remaining stage budget', () => {
    const harness = boundedProductionRun(workflow, 45000, [processTimeout(), processPass()]);
    readSimctlInventory('runtimes', args, harness.execute);
    assert.deepEqual(harness.spawns.map((row) => row.timeout), [30000, 15000]);
    const intent = parseReceipt(harness.files.get('runtimes-timeout-retry-1.intent.json'));
    assert.equal(intent.stage_deadline_monotonic_ms, 45000);
    assert.equal(intent.timeout_ms, 15000);
  });

  test(workflow + ': exhausted stage records the failed repeat without spawning', () => {
    const harness = boundedProductionRun(workflow, 30000, [processTimeout()]);
    assert.throws(() => readSimctlInventory('runtimes', args, harness.execute), /runtimes-timeout-retry-1/);
    assert.equal(harness.spawns.length, 1);
    const intent = parseReceipt(harness.files.get('runtimes-timeout-retry-1.intent.json'));
    assert.equal(intent.timeout_ms, 0); assert.equal(intent.spawn_planned, false);
    assert.equal(parseReceipt(harness.files.get('runtimes-timeout-retry-1.exit.json')).error, 'Stage budget exhausted');
  });
}

/** @param {string} source @param {string} name */
function workflowFunction(source: string, name: string) {
  const match = requiredFixture(source.match(new RegExp('^          function ' + name + '\\([\\s\\S]*?^          }\\n', 'm')));
  assert.ok(match, 'Expected production ' + name + ' function');
  return match[0].split('\n').map((line) => line.slice(10)).join('\n');
}

for (const stem of ['ios-memory', 'ios-reader-reflow', 'ios-reader-dynamic-type', 'ios-reader-revision']) {
  test(stem + ': JSON boundary preserves legacy metadata and rejects malformed ownership before commands', () => {
    const source = stripTypeScriptTypes(readFileSync(new URL('../../.github/scripts/' + stem + '/driver.mts', import.meta.url), 'utf8'), { mode: 'transform' })
      .split('\n').map(line => '          ' + line).join('\n');
    const functions = ['record', 'string', 'records', 'strings', 'assertOwner'].map(name => workflowFunction(source, name)).join('\n');
    let commands = 0;
    const context = vm.createContext({ assert, command: () => { commands++; } });
    vm.runInContext(functions, context);
    assert.equal(vm.runInContext("const legacy = { status: 'old', metadata: { optional: [null, 17] } }; record(legacy) === legacy", context), true);
    const owner = { repository: 'repo', source_head: 'head', run_id: '1', run_attempt: '1', token: 'token', name: 'name',
      runtime_identifier: 'runtime', device_type_identifier: 'device', preexisting_UUIDs: [], legacy_extra: { retained: true } };
    context.owner = owner;
    assert.equal(vm.runInContext('assertOwner(record(owner)); record(owner).legacy_extra.retained', context), true);
    for (const malformed of [null, [], 'text', { ...owner, preexisting_UUIDs: [1] }, { ...owner, name: 1 }]) {
      context.owner = malformed;
      assert.throws(() => vm.runInContext('assertOwner(record(owner)); command()', context));
      assert.equal(commands, 0);
    }
  });
}

// Execute the actual helper and simulator/ownership/cleanup functions together.
// Only process responses and files are faked; no command or filesystem write is
// available to these functions. Keeping all evaluated code in one VM realm also
// preserves production deep-strict comparisons between parsed JSON and arrays.
/** @param {string} workflow @param {{timeoutBeforeCreate?:boolean,firstOutput?:string}} [settings] */
function ownershipClosure(workflow: string, { timeoutBeforeCreate = true, firstOutput = '' }: { timeoutBeforeCreate?: boolean; firstOutput?: string } = {}) {
  const source = workflowDriverSource(workflow);
  const helper = stripTypeScriptTypes(readFileSync(new URL('../../ios/tests/simctl-inventory-read.mts', import.meta.url), 'utf8'), { mode: 'strip' })
    .replace("import assert from 'node:assert/strict';\n", '')
    .replace('export function readSimctlInventory(', 'function readSimctlInventory(');
  const root = '/fake/evidence';
  const runtime = 'com.apple.CoreSimulator.SimRuntime.iOS-18-5';
  const deviceType = 'com.apple.CoreSimulator.SimDeviceType.iPhone-16';
  const oldUUID = '11111111-1111-4111-8111-111111111111';
  const newUUID = 'BBBBBBBB-BBBB-4BBB-8BBB-BBBBBBBBBBBB';
  const expected = '9eca95f3fe571291999803424e724bd733583db2';
  const files = new Map([['selection.json', JSON.stringify({ source_head: expected,
    runtime: { identifier: runtime }, device_type: { identifier: deviceType } })]]);
  /** @type {{name:string,command:string[],timeout:number}[]} */
  const spawns: { name: string; command: string[]; timeout: number }[] = [];
  /** @type {string[]} */
  const reads: string[] = [];
  let now = 0, currentIntent = '', createdName = '', state = 'Shutdown', deleted = false;
  /** @param {import('node:crypto').BinaryLike} value */
  const hash = (value: import('node:crypto').BinaryLike) => createHash('sha256').update(value).digest('hex');
  /** @param {string} full */
  const filename = (full: string) => {
    const name = path.relative(root, full);
    assert.ok(name && path.basename(name) === name && !name.includes('..'));
    return name;
  };
  /** @param {string} name */
  const getRaw = (name: string) => {
    reads.push(name); assert.ok(files.has(name), 'Unexpected evidence read: ' + name);
    return requiredFixture(files.get(name));
  };
  /** @param {string} name @param {unknown} value */
  const put = (name: string, value: unknown) => {
    assert.ok(!files.has(name), 'Receipt overwrite: ' + name);
    files.set(name, String(value));
  };
  /** @param {string} name @param {unknown} value */
  const json = (name: string, value: unknown) => {
    put(name, JSON.stringify(value));
    if (name.endsWith('.intent.json')) currentIntent = name.slice(0, -'.intent.json'.length);
  };
  /** @param {boolean} includeOwned */
  const inventory = (includeOwned: boolean) => JSON.stringify({ devices: { [runtime]: [
    { udid: oldUUID, name: 'preexisting', state: 'Shutdown', isAvailable: true },
    ...(includeOwned && !deleted ? [{ udid: newUUID, name: createdName, state,
      isAvailable: true, deviceTypeIdentifier: deviceType }] : []),
  ] } });
  const context = vm.createContext({ assert, path, evidence: root, expected, hash, getRaw, put, json,
    workspace: '/fake/workspace', stage: 'simulator', deadline: 180000,
    performance: { now: () => now },
    process: { env: { GITHUB_REPOSITORY: 'pero3dev/ai-agent-library',
      GITHUB_RUN_ID: '9001', GITHUB_RUN_ATTEMPT: '1', PATH: '/fake/tools' } },
    randomUUID: () => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    fs: {
      readFileSync: /** @param {string} full @param {string} encoding */ (full: string, encoding: string) => {
        const value = getRaw(filename(full));
        return encoding === 'utf8' ? value : Buffer.from(value);
      },
      existsSync: /** @param {string} full */ (full: string) => files.has(filename(full)),
      lstatSync: /** @param {string} full */ (full: string) => {
        const value = getRaw(filename(full));
        return { isFile: () => true, isSymbolicLink: () => false, size: Buffer.byteLength(value) };
      },
    },
    spawnSync: /** @param {string} binary @param {string[]} command @param {{timeout:number,killSignal:string,maxBuffer:number,encoding:string,cwd:string}} options */ (binary: string, command: string[], options: { timeout: number; killSignal: string; maxBuffer: number; encoding: string; cwd: string }) => {
      assert.equal(binary, 'xcrun'); assert.ok(options.timeout > 0);
      assert.equal(options.killSignal, 'SIGKILL');
      spawns.push({ name: currentIntent, command: [...command], timeout: options.timeout });
      let stdout = '';
      if (currentIntent === 'devices-before-create' && timeoutBeforeCreate) {
        now += options.timeout;
        return { status: null, signal: 'SIGKILL', error: new Error('spawnSync xcrun ETIMEDOUT'),
          stdout: firstOutput, stderr: 'retained initial read' };
      }
      if (['devices-before-create', 'devices-before-create-timeout-retry-1'].includes(currentIntent)) {
        assert.equal(JSON.stringify(command), JSON.stringify(['simctl', 'list', 'devices', '--json']));
        stdout = inventory(false);
      } else if (currentIntent === 'create-simulator') {
        assert.equal(JSON.stringify(command.slice(0, 2)), JSON.stringify(['simctl', 'create']));
        assert.equal(command[3], deviceType); assert.equal(command[4], runtime);
        createdName = command[2]; stdout = newUUID + '\n';
      } else if (currentIntent === 'boot-simulator') {
        assert.equal(JSON.stringify(command), JSON.stringify(['simctl', 'boot', newUUID])); state = 'Booted';
      } else if (currentIntent === 'bootstatus-simulator') {
        assert.equal(JSON.stringify(command), JSON.stringify(['simctl', 'bootstatus', newUUID, '-b']));
      } else if (['devices-after-boot', 'cleanup-before', 'cleanup-after'].includes(currentIntent)) {
        assert.equal(JSON.stringify(command), JSON.stringify(['simctl', 'list', 'devices', '--json']));
        stdout = inventory(true);
      } else if (currentIntent === 'cleanup-shutdown') {
        assert.equal(JSON.stringify(command), JSON.stringify(['simctl', 'shutdown', newUUID])); state = 'Shutdown';
      } else if (currentIntent === 'cleanup-delete') {
        assert.equal(JSON.stringify(command), JSON.stringify(['simctl', 'delete', newUUID])); deleted = true;
      } else assert.fail('Unexpected process: ' + currentIntent);
      now += 1;
      return { status: 0, signal: null, stdout, stderr: '' };
    } });
  const functions = ['record', 'string', 'records', 'strings', 'assertOwner', 'run', 'listInventory', 'acceptedBeforeCreate', 'allDevices', 'owned', 'simulator', 'cleanup']
    .map((name) => workflowFunction(source, name)).join('\n');
  vm.runInContext("const read = name => JSON.parse(getRaw(name));\n"
    + "const uuidPattern = /^[A-F0-9]{8}(?:-[A-F0-9]{4}){3}-[A-F0-9]{12}$/;\n"
    + 'function sameSource() { return read(\'selection.json\'); }\n'
    + helper + '\n' + functions, context);
  return { files, spawns, reads, hash, newUUID, oldUUID, runtime,
    simulator: () => (vm.runInContext('simulator()', context) as unknown),
    owned: () => objectFixture(vm.runInContext('owned()', context)),
    cleanup: () => {
      context.stage = 'cleanup'; context.deadline = now + 150000;
      return (vm.runInContext('cleanup()', context) as unknown);
    } };
}

for (const workflow of ['ios-reader-reflow.yml', 'ios-reader-dynamic-type.yml']) {
  test(workflow + ': accepted before-create retry binds actual simulator ownership and cleanup', () => {
    for (const firstOutput of ['', '{truncated-json']) {
      const harness = ownershipClosure(workflow, { firstOutput });
      harness.simulator();
      assert.equal(harness.owned().UUID, harness.newUUID);
      const accepted = parseReceipt(harness.files.get('devices-before-create.accepted.json'));
      assert.equal(accepted.attempt, 'devices-before-create-timeout-retry-1');
      assert.equal(harness.files.get('devices-before-create.stdout.log'), firstOutput);
      assert.equal(parseReceipt(harness.files.get('devices-before-create.exit.json')).error,
        'spawnSync xcrun ETIMEDOUT');
      assert.equal(accepted.stdout_sha256,
        harness.hash(requiredFixture(harness.files.get('devices-before-create-timeout-retry-1.stdout.log'))));
      harness.cleanup();
      assert.equal(parseReceipt(harness.files.get('cleanup.json')).status, 'owned-simulator-deleted');
      for (const name of ['create-simulator', 'boot-simulator', 'bootstatus-simulator',
        'cleanup-shutdown', 'cleanup-delete']) {
        assert.equal(harness.spawns.filter((row) => row.name === name).length, 1, name);
      }
      assert.equal(harness.spawns.filter((row) => row.name.startsWith('devices-before-create')).length, 2);
    }
  });

  test(workflow + ': first successful before-create read remains the accepted ownership source', () => {
    const harness = ownershipClosure(workflow, { timeoutBeforeCreate: false });
    harness.simulator();
    const accepted = parseReceipt(harness.files.get('devices-before-create.accepted.json'));
    assert.equal(accepted.attempt, 'devices-before-create');
    assert.equal(harness.owned().UUID, harness.newUUID);
    assert.equal(harness.spawns.filter((row) => row.name.startsWith('devices-before-create')).length, 1);
    harness.cleanup();
    assert.equal(parseReceipt(harness.files.get('cleanup.json')).status, 'owned-simulator-deleted');
  });

  test(workflow + ': tampered accepted read provenance blocks owned-only cleanup before mutation', () => {
    const variants = ['attempt', 'raw', 'hash', 'success-receipt', 'issued-command',
      'issued-stage', 'first-timeout-receipt', 'source', 'owned-UUID-in-before'];
    for (const variant of variants) {
      const harness = ownershipClosure(workflow);
      harness.simulator(); assert.equal(harness.owned().UUID, harness.newUUID);
      const accepted = parseReceipt(harness.files.get('devices-before-create.accepted.json'));
      const attempt = accepted.attempt;
      /** @param {string} name @param {(record:Record<string,unknown>)=>void} change */
      const changeJSON = (name: string, change: (record: Record<string, unknown>) => void) => {
        const value = parseReceipt(harness.files.get(name)); change(value);
        harness.files.set(name, JSON.stringify(value));
      };
      if (variant === 'attempt') accepted.attempt = '../unrelated';
      if (variant === 'raw') harness.files.set(attempt + '.stdout.log', '{"devices":{}}');
      if (variant === 'hash') accepted.stdout_sha256 = '0'.repeat(64);
      if (variant === 'success-receipt') changeJSON(attempt + '.exit.json', (value) => { value.exit_code = 1; });
      if (variant === 'issued-command') changeJSON(attempt + '.intent.json', (value) => {
        value.arguments = ['simctl', 'list', 'devices', 'available', '--json'];
      });
      if (variant === 'issued-stage') changeJSON(attempt + '.intent.json', (value) => { value.stage = 'cleanup'; });
      if (variant === 'first-timeout-receipt') changeJSON('devices-before-create.exit.json', (value) => {
        value.exit_code = 0; value.signal = null; value.error = null;
      });
      if (variant === 'source') accepted.source_head = '0'.repeat(40);
      if (variant === 'owned-UUID-in-before') {
        const raw = JSON.stringify({ devices: { [harness.runtime]: [
          { udid: harness.newUUID, name: 'already-existing', state: 'Shutdown', isAvailable: true },
        ] } });
        harness.files.set(attempt + '.stdout.log', raw); accepted.stdout_sha256 = harness.hash(raw);
        // The saved intent still excludes newUUID. The independent raw check
        // must reject this even though receipt and raw SHA are consistent.
      }
      harness.files.set('devices-before-create.accepted.json', JSON.stringify(accepted));
      const count = harness.spawns.length;
      assert.throws(() => harness.owned(), variant);
      assert.throws(() => harness.cleanup(), variant);
      assert.equal(harness.spawns.length, count, 'No cleanup command after invalid provenance: ' + variant);
      const cleanup = parseReceipt(harness.files.get('cleanup.json'));
      assert.equal(cleanup.status, 'not-completed', variant); assert.ok(cleanup.error, variant);
      assert.ok(!harness.reads.some((name) => name.includes('unrelated')), variant);
    }
  });
}

// Caller-budget integration: evaluate the actual workflow run/listInventory/
// acceptedBeforeCreate/owned/cleanup functions in one VM. The executor below
// models latency against the timeout that production actually requests; it does
// not sleep, spawn a process, or write a file. The older 30s harness remains
// unchanged above as historical lower-level run coverage.
type ReadPlan = { timeout: true; stdout?: string; latency?: number}  | { timeout?: false; stdout?: string; latency: number}
/** @param {string} workflow @param {{stage?:string,remaining?:number,latency?:number,plans?:Record<string,ReadPlan[]>,oldCallerNegativeControl?:boolean}} [settings] */
function inventoryReadBudgetClosure(workflow: string, { stage = 'inventory', remaining,
  latency = 45000, plans = {}, oldCallerNegativeControl = false }: { stage?: string; remaining?: number; latency?: number; plans?: Record<string, ReadPlan[]>; oldCallerNegativeControl?: boolean } = {}) {
  const source = workflowDriverSource(workflow);
  const helper = stripTypeScriptTypes(readFileSync(new URL('../../ios/tests/simctl-inventory-read.mts', import.meta.url), 'utf8'), { mode: 'strip' })
    .replace("import assert from 'node:assert/strict';\n", '')
    .replace('export function readSimctlInventory(', 'function readSimctlInventory(');
  const capMatch = requiredFixture(source.match(/^          const caps = (\{[\s\S]*?\});$/m));
  assert.ok(capMatch, 'Actual workflow caps must be available');
  const root = '/fake/budget-evidence', workspace = '/fake/workspace';
  const runtime = 'com.apple.CoreSimulator.SimRuntime.iOS-18-5';
  const deviceType = 'com.apple.CoreSimulator.SimDeviceType.iPhone-16';
  const oldUUID = '11111111-1111-4111-8111-111111111111';
  const newUUID = 'CCCCCCCC-CCCC-4CCC-8CCC-CCCCCCCCCCCC';
  const expected = '5826e13b19ae1f71b6d6a67f282245e3d37bd5a2';
  /** @param {import('node:crypto').BinaryLike} value */
  const hash = (value: import('node:crypto').BinaryLike) => createHash('sha256').update(value).digest('hex');
  const files = new Map([['selection.json', JSON.stringify({ source_head: expected,
    runtime: { identifier: runtime }, device_type: { identifier: deviceType } })]]);
  /** @type {{name:string,command:string[],timeout:number}[]} */
  const spawns: { name: string; command: string[]; timeout: number }[] = [];
  /** @type {string[]} */
  const reads: string[] = [];
  /** @type {Map<string,number>} */
  const counts: Map<string, number> = new Map();
  let now = 0, currentIntent = '', createdName = '', state = 'Shutdown', deleted = false;
  /** @param {string} full */
  const filename = (full: string) => {
    const name = path.relative(root, full);
    assert.ok(name && path.basename(name) === name && !name.includes('..'));
    return name;
  };
  /** @param {string} name */
  const getRaw = (name: string) => {
    reads.push(name); assert.ok(files.has(name), 'Unexpected evidence read: ' + name);
    return requiredFixture(files.get(name));
  };
  /** @param {string} name @param {unknown} value */
  const put = (name: string, value: unknown) => {
    assert.ok(!files.has(name), 'Budget evidence must not overwrite: ' + name);
    files.set(name, String(value));
  };
  /** @param {string} name @param {unknown} value */
  const json = (name: string, value: unknown) => {
    put(name, JSON.stringify(value));
    if (name.endsWith('.intent.json')) currentIntent = name.slice(0, -'.intent.json'.length);
  };
  /** @param {boolean} includeOwned */
  const devices = (includeOwned: boolean) => JSON.stringify({ devices: { [runtime]: [
    { udid: oldUUID, name: 'preexisting', state: 'Shutdown', isAvailable: true },
    ...(includeOwned && !deleted ? [{ udid: newUUID, name: createdName, state,
      isAvailable: true, deviceTypeIdentifier: deviceType }] : []),
  ] } });
  const context = vm.createContext({ assert, path, evidence: root, workspace, expected, hash, getRaw, put, json,
    stage, deadline: 0, performance: { now: () => now },
    process: { env: { GITHUB_REPOSITORY: 'pero3dev/ai-agent-library',
      GITHUB_RUN_ID: '9002', GITHUB_RUN_ATTEMPT: '1', PATH: '/fake/tools' } },
    randomUUID: () => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    fs: {
      readFileSync: /** @param {string} full @param {string} encoding */ (full: string, encoding: string) => {
        const value = getRaw(filename(full)); return encoding === 'utf8' ? value : Buffer.from(value);
      },
      existsSync: /** @param {string} full */ (full: string) => files.has(filename(full)),
      lstatSync: /** @param {string} full */ (full: string) => {
        const value = getRaw(filename(full));
        return { isFile: () => true, isSymbolicLink: () => false, size: Buffer.byteLength(value) };
      },
    },
    spawnSync: /** @param {string} binary @param {string[]} command @param {{timeout:number,killSignal:string,maxBuffer:number,encoding:string,cwd:string}} options */ (binary: string, command: string[], options: { timeout: number; killSignal: string; maxBuffer: number; encoding: string; cwd: string }) => {
      assert.equal(binary, 'xcrun'); assert.equal(options.cwd, workspace);
      assert.ok(options.timeout > 0); assert.equal(options.killSignal, 'SIGKILL');
      assert.equal(options.maxBuffer, 8 * 1024 * 1024); assert.equal(options.encoding, 'utf8');
      spawns.push({ name: currentIntent, command: [...command], timeout: options.timeout });
      const baseName = currentIntent.replace(/-timeout-retry-1$/, '');
      const request = requests.find(([name]) => name === baseName);
      if (request) {
        assert.equal(JSON.stringify(command), JSON.stringify(request[1]));
        const count = counts.get(baseName) ?? 0; counts.set(baseName, count + 1);
        const response = plans[baseName]?.[count] ?? { latency };
        assert.ok(response.timeout === true || Number.isFinite(response.latency));
        if (response.timeout === true || response.latency > options.timeout) {
          now += options.timeout;
          return { status: null, signal: 'SIGKILL', error: new Error('spawnSync xcrun ETIMEDOUT'),
            stdout: response.stdout ?? '', stderr: 'modeled read ceiling reached' };
        }
        now += response.latency;
        let stdout;
        if (baseName === 'runtimes') stdout = JSON.stringify({ runtimes: [
          { identifier: runtime, version: '18.5', name: 'iOS 18.5', isAvailable: true }] });
        else if (baseName === 'device-types') stdout = JSON.stringify({ devicetypes: [
          { identifier: deviceType, name: 'iPhone 16' }] });
        else stdout = devices(baseName === 'devices-after-boot');
        return { status: 0, signal: null, stdout, stderr: '' };
      }
      let stdout = '';
      if (currentIntent === 'create-simulator') {
        assert.equal(JSON.stringify(command.slice(0, 2)), JSON.stringify(['simctl', 'create']));
        assert.equal(command[3], deviceType); assert.equal(command[4], runtime);
        createdName = command[2]; stdout = newUUID + '\n';
      } else if (currentIntent === 'boot-simulator') {
        assert.equal(JSON.stringify(command), JSON.stringify(['simctl', 'boot', newUUID])); state = 'Booted';
      } else if (currentIntent === 'bootstatus-simulator') {
        assert.equal(JSON.stringify(command), JSON.stringify(['simctl', 'bootstatus', newUUID, '-b']));
      } else if (['cleanup-before', 'cleanup-after'].includes(currentIntent)) {
        assert.equal(JSON.stringify(command), JSON.stringify(['simctl', 'list', 'devices', '--json']));
        stdout = devices(true);
      } else if (currentIntent === 'cleanup-shutdown') {
        assert.equal(JSON.stringify(command), JSON.stringify(['simctl', 'shutdown', newUUID])); state = 'Shutdown';
      } else if (currentIntent === 'cleanup-delete') {
        assert.equal(JSON.stringify(command), JSON.stringify(['simctl', 'delete', newUUID])); deleted = true;
      } else assert.fail('Unexpected fake executor command: ' + currentIntent);
      now += 1;
      return { status: 0, signal: null, stdout, stderr: '' };
    } });
  const caps = numberRecord(vm.runInContext('(' + capMatch[1] + ')', context));
  assert.ok(Object.hasOwn(caps, stage)); context.deadline = remaining ?? caps[stage];
  const functions = ['record', 'string', 'records', 'strings', 'assertOwner', 'run', 'listInventory', 'acceptedBeforeCreate', 'allDevices', 'owned', 'simulator', 'cleanup']
    .map((name) => {
      const actual = workflowFunction(source, name);
      if (name !== 'listInventory' || !oldCallerNegativeControl) return actual;
      const needle = "run(attempt, 'xcrun', args, 60000, workspace, false)";
      assert.equal(actual.split(needle).length, 2, 'Controlled old-ceiling negative must alter one caller literal');
      return actual.replace(needle, "run(attempt, 'xcrun', args, 30000, workspace, false)");
    }).join('\n');
  vm.runInContext("const read = name => JSON.parse(getRaw(name));\n"
    + "const uuidPattern = /^[A-F0-9]{8}(?:-[A-F0-9]{4}){3}-[A-F0-9]{12}$/;\n"
    + "function sameSource() { return read('selection.json'); }\n"
    + helper + '\n' + functions, context);
  return { source, caps, files, spawns, reads, hash, newUUID, oldUUID, runtime,
    list: /** @param {string} name */ (name: string) => {
      const request = requests.find(([key]) => key === name); assert.ok(request);
      return stringFixture(vm.runInContext('listInventory(' + JSON.stringify(name) + ', ' + JSON.stringify(request[1]) + ')', context));
    },
    simulator: () => (vm.runInContext('simulator()', context) as unknown),
    owned: () => objectFixture(vm.runInContext('owned()', context)),
    cleanup: () => {
      context.stage = 'cleanup'; context.deadline = now + caps.cleanup;
      return (vm.runInContext('cleanup()', context) as unknown);
    } };
}

for (const workflow of ['ios-reader-reflow.yml', 'ios-reader-dynamic-type.yml']) {
  test(workflow + ': actual 60s caller accepts modeled 45s reads that the old30s caller rejects', () => {
    for (const [name] of requests) {
      const harness = inventoryReadBudgetClosure(workflow);
      const output = harness.list(name); assert.equal(typeof output, 'string'); assert.ok(output.length > 0);
      assert.deepEqual(harness.spawns.map((row) => row.timeout), [60000]);
      assert.equal(parseReceipt(harness.files.get(name + '.intent.json')).timeout_ms, 60000);
      const old = inventoryReadBudgetClosure(workflow, { oldCallerNegativeControl: true });
      assert.throws(() => old.list(name), new RegExp(name + '-timeout-retry-1'));
      assert.deepEqual(old.spawns.map((row) => row.timeout), [30000, 30000]);
    }
  });

  test(workflow + ': actual 60s caller keeps one exact timeout and a distinct successful retry', () => {
    const harness = inventoryReadBudgetClosure(workflow, { plans: {
      runtimes: [{ timeout: true, stdout: '{partial' }, { latency: 45000 }],
    } });
    harness.list('runtimes');
    assert.deepEqual(harness.spawns.map((row) => row.timeout), [60000, 60000]);
    assert.equal(harness.files.get('runtimes.stdout.log'), '{partial');
    assert.equal(parseReceipt(harness.files.get('runtimes.exit.json')).error, 'spawnSync xcrun ETIMEDOUT');
    assert.equal(parseReceipt(harness.files.get('runtimes.accepted.json')).attempt, 'runtimes-timeout-retry-1');
    const intent = parseReceipt(harness.files.get('runtimes-timeout-retry-1.intent.json'));
    assert.equal(intent.remaining_ms, 120000); assert.equal(intent.stage_deadline_monotonic_ms, 180000);
    assert.equal(parseReceipt(harness.files.get('runtimes-timeout-retry-1.exit.json')).exit_code, 0);
  });

  test(workflow + ': two real caller timeouts never spawn a third attempt', () => {
    const harness = inventoryReadBudgetClosure(workflow, { plans: { runtimes: [{ timeout: true }, { timeout: true }] } });
    assert.throws(() => harness.list('runtimes'), /runtimes-timeout-retry-1/);
    assert.deepEqual(harness.spawns.map((row) => row.timeout), [60000, 60000]);
    assert.equal([...harness.files.keys()].filter((name) => name.endsWith('.intent.json')).length, 2);
    assert.ok(!harness.files.has('runtimes.accepted.json'));
  });

  test(workflow + ': actual caller clamps to remaining20s and remaining0 never spawns', () => {
    const clamped = inventoryReadBudgetClosure(workflow, { remaining: 20000, latency: 15000 });
    clamped.list('runtimes'); assert.deepEqual(clamped.spawns.map((row) => row.timeout), [20000]);
    const issued = parseReceipt(clamped.files.get('runtimes.intent.json'));
    assert.equal(issued.remaining_ms, 20000); assert.equal(issued.stage_deadline_monotonic_ms, 20000);
    const retryClamped = inventoryReadBudgetClosure(workflow, { remaining: 80000, plans: {
      runtimes: [{ timeout: true }, { latency: 15000 }],
    } });
    retryClamped.list('runtimes');
    assert.deepEqual(retryClamped.spawns.map((row) => row.timeout), [60000, 20000]);
    const retryIntent = parseReceipt(retryClamped.files.get('runtimes-timeout-retry-1.intent.json'));
    assert.equal(retryIntent.remaining_ms, 20000); assert.equal(retryIntent.stage_deadline_monotonic_ms, 80000);
    const expiredRetry = inventoryReadBudgetClosure(workflow, { remaining: 60000, plans: {
      runtimes: [{ timeout: true }],
    } });
    assert.throws(() => expiredRetry.list('runtimes'), /runtimes-timeout-retry-1/);
    assert.deepEqual(expiredRetry.spawns.map((row) => row.timeout), [60000]);
    const expired = parseReceipt(expiredRetry.files.get('runtimes-timeout-retry-1.intent.json'));
    assert.equal(expired.timeout_ms, 0); assert.equal(expired.spawn_planned, false);
    const empty = inventoryReadBudgetClosure(workflow, { remaining: 0 });
    assert.throws(() => empty.list('runtimes'), /runtimes/); assert.equal(empty.spawns.length, 0);
    const zero = parseReceipt(empty.files.get('runtimes.intent.json'));
    assert.equal(zero.timeout_ms, 0); assert.equal(zero.spawn_planned, false);
    assert.equal(parseReceipt(empty.files.get('runtimes.exit.json')).error, 'Stage budget exhausted');
  });

  test(workflow + ': 60s before-create receipts pass the actual owner and cleanup chain', () => {
    for (const retry of [false, true]) {
      const harness = inventoryReadBudgetClosure(workflow, { stage: 'simulator', plans: {
        'devices-before-create': retry ? [{ timeout: true }, { latency: 45000 }] : [{ latency: 45000 }],
      } });
      harness.simulator();
      assert.equal(harness.owned().UUID, harness.newUUID);
      const accepted = parseReceipt(harness.files.get('devices-before-create.accepted.json'));
      assert.equal(accepted.attempt, retry ? 'devices-before-create-timeout-retry-1' : 'devices-before-create');
      assert.equal(parseReceipt(harness.files.get(accepted.attempt + '.intent.json')).timeout_ms, 60000);
      harness.cleanup();
      assert.equal(parseReceipt(harness.files.get('cleanup.json')).status, 'owned-simulator-deleted');
      for (const name of ['create-simulator', 'boot-simulator', 'bootstatus-simulator', 'cleanup-shutdown', 'cleanup-delete']) {
        assert.equal(harness.spawns.filter((row) => row.name === name).length, 1, name);
      }
      assert.ok(harness.spawns.filter((row) => row.name.startsWith('devices-')).every((row) => row.timeout === 60000));
    }
    const clamped = inventoryReadBudgetClosure(workflow, { stage: 'simulator', remaining: 50000, latency: 1000 });
    clamped.simulator(); assert.equal(clamped.owned().UUID, clamped.newUUID);
    assert.equal(parseReceipt(clamped.files.get('devices-before-create.intent.json')).timeout_ms, 50000);
    clamped.cleanup(); assert.equal(parseReceipt(clamped.files.get('cleanup.json')).status, 'owned-simulator-deleted');
  });

  test(workflow + ': tampered 60s ownership proof blocks all cleanup commands before mutation', () => {
    for (const variant of ['limit60001', 'limit0', 'negative', 'fraction', 'remaining-lt-timeout', 'source', 'raw', 'hash', 'owned-UUID-in-before', 'attempt', 'issued-stage', 'issued-command']) {
      const harness = inventoryReadBudgetClosure(workflow, { stage: 'simulator' });
      harness.simulator(); assert.equal(harness.owned().UUID, harness.newUUID);
      const accepted = parseReceipt(harness.files.get('devices-before-create.accepted.json'));
      const issuedName = accepted.attempt + '.intent.json';
      const issued = parseReceipt(harness.files.get(issuedName));
      if (variant === 'limit60001') issued.timeout_ms = 60001;
      if (variant === 'limit0') issued.timeout_ms = 0;
      if (variant === 'negative') issued.timeout_ms = -1;
      if (variant === 'fraction') issued.timeout_ms = 59999.5;
      if (variant === 'remaining-lt-timeout') issued.remaining_ms = 59999;
      if (variant === 'source') accepted.source_head = '0'.repeat(40);
      if (variant === 'raw') harness.files.set(accepted.attempt + '.stdout.log', '{tampered');
      if (variant === 'hash') accepted.stdout_sha256 = '0'.repeat(64);
      if (variant === 'attempt') accepted.attempt = '../unrelated';
      if (variant === 'issued-stage') issued.stage = 'cleanup';
      if (variant === 'issued-command') issued.arguments = ['simctl', 'list', 'devices', 'available', '--json'];
      if (variant === 'owned-UUID-in-before') {
        const raw = JSON.stringify({ devices: { [harness.runtime]: [
          { udid: harness.newUUID, name: 'preexisting', state: 'Shutdown', isAvailable: true },
        ] } });
        harness.files.set(accepted.attempt + '.stdout.log', raw); accepted.stdout_sha256 = harness.hash(raw);
      }
      harness.files.set(issuedName, JSON.stringify(issued));
      harness.files.set('devices-before-create.accepted.json', JSON.stringify(accepted));
      const count = harness.spawns.length;
      assert.throws(() => harness.owned(), variant);
      assert.throws(() => harness.cleanup(), variant);
      assert.equal(harness.spawns.length, count, 'No command after invalid proof: ' + variant);
      assert.equal(parseReceipt(harness.files.get('cleanup.json')).status, 'not-completed');
      assert.ok(!harness.reads.some((name) => name.includes('unrelated')));
    }
  });

  test(workflow + ': declared stage and job budgets retain UI limits and cover every capped step plus1', () => {
    const harness = inventoryReadBudgetClosure(workflow);
    assert.equal(harness.caps.inventory, 180000); assert.equal(harness.caps.simulator, 300000);
    const steps = [...harness.source.matchAll(/^        timeout-minutes: (\d+)$/gm)].map((match) => Number(match[1]));
    const job = Number(requiredFixture(harness.source.match(/^    timeout-minutes: (\d+)$/m))[1]);
    const dynamic = workflow === 'ios-reader-dynamic-type.yml';
    assert.equal(steps.length, 15); assert.equal(steps.reduce((a, b) => a + b, 0), dynamic ? 51 : 50);
    assert.equal(job, dynamic ? 52 : 51); assert.equal(job - steps.reduce((a, b) => a + b, 0), 1);
    assert.equal(harness.caps.ui, dynamic ? 720000 : 600000);
    assert.equal(Number(requiredFixture(harness.source.match(/id: ui\n        timeout-minutes: (\d+)/))[1]), dynamic ? 13 : 12);
    assert.equal(Number(requiredFixture(harness.source.match(/id: inventory\n        timeout-minutes: (\d+)/))[1]), 4);
    assert.equal(Number(requiredFixture(harness.source.match(/id: simulator\n        timeout-minutes: (\d+)/))[1]), 6);
  });
}

/** @param {unknown} value */
function functionFixture(value: unknown) { assert.equal(typeof value, 'function'); if(typeof value !== 'function') throw new Error('Expected workflow function'); return value; }
/** @param {unknown} value @returns {Record<string,number>} */
function numberRecord(value: unknown): Record<string, number> { const row=objectFixture(value); return Object.fromEntries(Object.entries(row).map(([key,value])=>{assert.equal(typeof value,'number');if(typeof value!=='number')throw new Error('Expected stage budget');return [key,value];})); }
/** @param {string|undefined} value */
function parseReceipt(value: string | undefined) { return objectFixture(JSON.parse(requiredFixture(value))); }
