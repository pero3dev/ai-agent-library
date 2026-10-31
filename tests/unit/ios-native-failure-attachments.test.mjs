import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter } from 'node:events';
import { readFileSync, mkdtempSync, writeFileSync, symlinkSync, rmSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { LIMITS, parseMetadata, testsReference, failedSummary, attachmentPlan,
  validateBinding, deadlineBudget, collectNativeFailure, executeGuard, runCLI, readBoundedRegularFile } from '../../ios/tests/native-failure-attachments.mjs';

const scalar = value => ({ _type: { _name: 'String' }, _value: value });
const array = value => ({ _type: { _name: 'Array' }, _values: value });
const ref = id => ({ _type: { _name: 'Reference' }, id: scalar(id) });
const caseID = 'ReadingRecoveryUITests/testExportFilePickerCancelKeepsHealthyPositionAndBookmarkAfterRelaunch()';
const anotherCase = 'NativeReaderUITests/testThreeArticlesHaveNativeBodyText()';
const image = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), Buffer.from('fixture')]);
const context = Buffer.from('attempt=0\nphase=finish-public-library-search\n');
const root = () => ({ actions: array([{ _type: { _name: 'ActionRecord' }, actionResult: {
  status: scalar('failed'), testsRef: ref('0~tests') } }]) });
const leaf = (identifier = caseID, id = '0~summary') => ({ _type: { _name: 'ActionTestMetadata', _supertype: { _name: 'ActionAbstractTestSummary' } },
  identifier: scalar(identifier), testStatus: scalar('Failure'), summaryRef: ref(id) });
const tests = () => ({ summaries: array([{ testableSummaries: array([{ tests: array([
  { _type: { _name: 'ActionTestSummaryGroup' }, subtests: array([leaf()]) }]) }]) }]) });
const attachment = (name, id, size, uti) => ({ _type: { _name: 'ActionTestAttachment' }, name: scalar(name), payloadRef: ref(id),
  payloadSize: { _type: { _name: 'Int' }, _value: String(size) }, uniformTypeIdentifier: scalar(uti) });
const summary = () => ({ _type: { _name: 'ActionTestSummary' }, identifier: scalar(caseID), testStatus: scalar('Failure'), activitySummaries: array([{ subactivities: array([{ attachments: array([
  attachment('Reading-export-cancel-0-failed', '0~image', image.length, 'public.png'),
  attachment('Reading-export-cancel-context', '0~context', context.length, 'public.plain-text'),
  attachment('Automatic screen recording', '0~video', 90000000, 'public.mpeg-4'),
]) }]) }]) });
const bytes = value => Buffer.from(JSON.stringify(value));
const env = () => ({ GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'pero3dev/ai-agent-library', GITHUB_EVENT_NAME: 'pull_request',
  GITHUB_RUN_ID: '41215473763', GITHUB_RUN_ATTEMPT: '1', GITHUB_SHA: 'a'.repeat(40), GITHUB_WORKSPACE: '/fixture/repo',
  GITHUB_EVENT_PATH: '/fixture/event.json', DEVELOPER_DIR: '/Applications/Xcode_16.4.app/Contents/Developer',
  AILIBRARY_NATIVE_UI_OUTCOME: 'failure', AILIBRARY_FULL_ARTIFACT_OUTCOME: 'success' });
const event = () => ({ repository: { full_name: 'pero3dev/ai-agent-library', private: false }, pull_request: { head: { sha: 'b'.repeat(40) } } });
const binding = () => validateBinding(env(), event());

function fixture(overrides = {}) {
  let clock = 0, manifest;
  const calls = [], retained = new Map();
  const objects = { root: bytes(root()), '0~tests': bytes(tests()), '0~summary': bytes(summary()) };
  const payloads = { '0~image': image, '0~context': context };
  const io = { bundleAvailable: true,
    invoke: async (kind, payload, acquirePermit) => {
      const call = { kind, payload, started: false }; calls.push(call);
      if (overrides.beforePermit) overrides.beforePermit({ kind, payload, setClock: n => { clock = n; } });
      const timeout = acquirePermit(); call.started = true; call.timeout = timeout;
      clock += 1;
      if (overrides.invoke) return overrides.invoke(kind, payload, timeout);
      return { ok: true, quiescent: true, exit_code: 0, signal: null,
        bytes: kind === 'export' ? payloads[payload.id] : objects[kind === 'root' ? 'root' : payload.id] };
    },
    retain: async (name, data) => { assert.ok(!retained.has(name)); retained.set(name, Buffer.from(data)); },
    close: async data => { manifest = JSON.parse(data); assert.ok(data.length + [...retained.values()].reduce((n, b) => n + b.length, 0) <= LIMITS.retained); },
  };
  return { io, calls, retained, objects, payloads, now: () => clock, setClock: value => { clock = value; }, manifest: () => manifest };
}

test('legacy bounded JSON rejects malformed, nonUTF8, empty, array and oversized input', () => {
  for (const value of [Buffer.alloc(0), Buffer.from('{'), Buffer.from([255]), bytes([]), Buffer.alloc(LIMITS.metadata + 1)]) {
    assert.throws(() => parseMetadata(value));
  }
  assert.deepEqual(parseMetadata(bytes(root())), root());
});

test('actual bounded regular-file reader accepts its owned file and rejects symlinks or oversize', { skip: process.platform === 'win32' ? 'Darwin collector symlink fixture requires a symlink-capable host' : false }, () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'ailibrary-native-compact-unit-')));
  try {
    const source = join(root, 'source.json'), link = join(root, 'link.json');
    writeFileSync(source, '{}'); symlinkSync(source, link);
    assert.equal(readBoundedRegularFile(source, 2).toString(), '{}');
    assert.throws(() => readBoundedRegularFile(link, 2));
    assert.throws(() => readBoundedRegularFile(source, 1));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('root requires exactly one failed action with an opaque reference', () => {
  assert.equal(testsReference(root()), '0~tests');
  for (const value of [{}, { actions: array([]) }, { actions: array([...root().actions._values, ...root().actions._values]) }]) assert.throws(() => testsReference(value));
  const bad = root(); bad.actions._values[0].actionResult.testsRef = ref('../other'); assert.throws(() => testsReference(bad));
});

test('failed summary follows actual typed group and leaf schema', () => {
  assert.deepEqual(failedSummary(tests()), { identifier: caseID, id: '0~summary', omitted_failed_cases: 0 });
});

test('multiple failed selected cases choose one deterministically and mark omission', () => {
  const value = { tests: array([leaf(), leaf(anotherCase, '0~second')]) };
  const result = failedSummary(value); assert.equal(result.identifier, anotherCase); assert.equal(result.omitted_failed_cases, 1);
});

test('missing known text produces partial diagnostic rather than a complete claim', async () => {
  const f = fixture(), value = summary();
  value.activitySummaries._values[0].subactivities._values[0].attachments._values.splice(1, 1);
  f.objects['0~summary'] = bytes(value);
  const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
  assert.equal(result.status, 'partial'); assert.equal(result.incomplete_reason, 'known_text_attachment_missing');
  assert.equal(result.files.length, 1); assert.equal(result.actual_UI_success, false);
});

test('unknown suite, duplicate case, absent failure or wrong typed failure is rejected', () => {
  for (const value of [{ tests: array([leaf('OtherTests/testPrivateAccount()')]) }, { tests: array([leaf(), leaf()]) },
    { tests: array([]) }, { tests: array([{ ...leaf(), _type: { _name: 'Other' } }]) }]) assert.throws(() => failedSummary(value));
});

test('metadata recursion is finite and cannot admit deeply nested or huge node arrays', () => {
  let value = leaf(); for (let i = 0; i < 70; i++) value = { child: value };
  assert.throws(() => failedSummary(value));
  assert.throws(() => failedSummary({ tests: new Array(LIMITS.maxNodes + 1).fill(null) }));
});

test('known screenshot and context are selected while videos are never exported', () => {
  const plan = attachmentPlan(summary()); assert.deepEqual(plan.map(x => x.filename), ['failure.png', 'context.txt']);
  assert.ok(plan.every(x => x.uti !== 'public.mpeg-4'));
});

test('public geometry and hierarchy retain separate small limits', () => {
  const value = { attachments: array([
    attachment('Public-UI-target-not-visible', '0~image', 8, 'public.png'),
    attachment('Public-UI-target-not-visible-geometry', '0~geometry', 2, 'public.plain-text'),
    attachment('Public-UI-target-not-visible-hierarchy', '0~hierarchy', 2, 'public.plain-text'),
  ]) };
  assert.deepEqual(attachmentPlan(value).map(x => [x.filename, x.limit]), [['failure.png', LIMITS.png], ['geometry.json', LIMITS.geometry], ['hierarchy.txt', LIMITS.hierarchy]]);
});

test('unknown-only or multiple distinct known screenshot candidates do not export', () => {
  assert.throws(() => attachmentPlan({ attachments: array([attachment('untrusted.png', '0~x', 8, 'public.png')]) }));
  const value = summary(); value.activitySummaries._values[0].subactivities._values[0].attachments._values.push(
    attachment('Reading-export-cancel-1-failed', '0~secondImage', 8, 'public.png'));
  assert.throws(() => attachmentPlan(value));
});

test('duplicate metadata must be exactly equal; distinct refs are ambiguous', () => {
  const value = summary(), entries = value.activitySummaries._values[0].subactivities._values[0].attachments._values;
  entries.push(structuredClone(entries[0])); assert.equal(attachmentPlan(value).length, 2);
  entries.at(-1).payloadRef = ref('0~different'); assert.throws(() => attachmentPlan(value));
});

test('oversized, malformed size, bad UTI, traversal ref and reused ID are rejected before export', () => {
  for (const change of [a => { a.payloadSize._value = String(LIMITS.png + 1); }, a => { a.payloadSize._value = '01'; },
    a => { a.uniformTypeIdentifier._value = 'public.mpeg-4'; }, a => { a.payloadRef = ref('../escape'); }]) {
    const value = summary(); change(value.activitySummaries._values[0].subactivities._values[0].attachments._values[0]); assert.throws(() => attachmentPlan(value));
  }
  const value = summary(); value.activitySummaries._values[0].subactivities._values[0].attachments._values[1].payloadRef = ref('0~image'); assert.throws(() => attachmentPlan(value));
});

test('oversized known hierarchy cannot be hidden by a small screenshot', () => {
  const value = { attachments: array([attachment('Public-UI-target-not-visible', '0~image', 8, 'public.png'),
    attachment('Public-UI-target-not-visible-hierarchy', '0~hierarchy', LIMITS.hierarchy + 1, 'public.plain-text')]) };
  assert.throws(() => attachmentPlan(value));
});

test('binding distinguishes workflow merge SHA, source head and actual full-upload outcome', () => {
  const result = binding(); assert.equal(result.workflow_SHA, 'a'.repeat(40)); assert.equal(result.source_head, 'b'.repeat(40));
  const e = env(); e.AILIBRARY_FULL_ARTIFACT_OUTCOME = 'failure'; assert.equal(validateBinding(e, event()).full_artifact_upload_outcome, 'failure');
});

test('binding rejects private or unknown repo, nonfailure UI and malformed run IDs', () => {
  for (const change of [e => { e.GITHUB_ACTIONS = 'false'; }, e => { e.GITHUB_RUN_ID = '0'; },
    e => { e.AILIBRARY_NATIVE_UI_OUTCOME = 'success'; }, e => { e.GITHUB_REPOSITORY = 'other/repo'; },
    e => { e.GITHUB_SHA = 'bad'; }, e => { e.AILIBRARY_FULL_ARTIFACT_OUTCOME = 'unknown'; }]) {
    const e = env(); change(e); assert.throws(() => validateBinding(e, event()));
  }
  const value = event(); value.repository.private = true; assert.throws(() => validateBinding(env(), value));
});

test('push source must equal workflow SHA', () => {
  const e = env(); e.GITHUB_EVENT_NAME = 'push'; const value = { ...event(), after: e.GITHUB_SHA };
  assert.equal(validateBinding(e, value).source_head, e.GITHUB_SHA); value.after = 'c'.repeat(40); assert.throws(() => validateBinding(e, value));
});

test('normal actual CLI orchestration exports only two fixed payloads and closes a diagnostic manifest', async () => {
  const f = fixture(); let factoryCalls = 0;
  const result = await runCLI({ env: env(), workspace: '/fixture/repo', readEvent: () => bytes(event()),
    makeIO: async (root, developer) => { assert.equal(root, '/fixture/repo'); assert.equal(developer, env().DEVELOPER_DIR); factoryCalls++; return f.io; }, now: f.now });
  assert.equal(factoryCalls, 1); assert.equal(result.status, 'collected'); assert.equal(result.actual_UI_success, false);
  assert.equal(result.original_UI_outcome, 'failure'); assert.equal(result.full_artifact_step_preserved, true);
  assert.deepEqual(f.calls.map(x => x.kind), ['root', 'object', 'object', 'export', 'export']);
  assert.deepEqual([...f.retained.keys()], ['failure.png', 'context.txt']);
  assert.ok(f.calls.every(x => x.started && x.timeout > 0 && x.timeout <= LIMITS.perChildMs));
  assert.equal(f.manifest().files[0].advertised_bytes, image.length);
});

test('actual CLI rejects bad event before invoking the output factory', async () => {
  let calls = 0;
  await assert.rejects(runCLI({ env: env(), workspace: '/fixture/repo', readEvent: () => Buffer.from('{'), makeIO: () => { calls++; }, now: () => 0 }));
  assert.equal(calls, 0);
});

test('unavailable bundle creates only an incomplete diagnostic, no child invocation', async () => {
  const f = fixture(); f.io.bundleAvailable = false;
  const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
  assert.equal(result.status, 'incomplete'); assert.equal(result.incomplete_reason, 'UI_bundle_unavailable'); assert.equal(f.calls.length, 0);
});

test('malformed metadata stops before any payload export and preserves incomplete status', async () => {
  const f = fixture(); f.objects['0~tests'] = bytes({});
  const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
  assert.equal(result.status, 'incomplete'); assert.equal(f.calls.filter(x => x.kind === 'export').length, 0); assert.equal(f.retained.size, 0);
});

test('fetched summary root must identify the selected failed typed case before exports', async () => {
  for (const change of [value => { value._type._name = 'ActionTestMetadata'; },
    value => { value.testStatus = scalar('Success'); }, value => { value.identifier = scalar(anotherCase); },
    value => { delete value.identifier; }, value => { delete value._type; }]) {
    const f = fixture(), value = summary(); change(value); f.objects['0~summary'] = bytes(value);
    const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
    assert.equal(result.status, 'incomplete'); assert.equal(result.incomplete_reason, 'summary_identity_mismatch');
    assert.deepEqual(f.calls.map(x => x.kind), ['root', 'object', 'object']);
    assert.equal(f.retained.size, 0); assert.equal(result.files.length, 0);
  }
});

test('failed query or failed export never turns the original failed test into success', async () => {
  for (const failedKind of ['root', 'export']) {
    const f = fixture({ invoke: (kind, payload) => ({ ok: kind !== failedKind, quiescent: true, exit_code: kind === failedKind ? 1 : 0, signal: null,
      bytes: kind === 'export' ? image : kind === 'root' ? bytes(root()) : bytes(payload.id === '0~tests' ? tests() : summary()) }) });
    const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
    assert.equal(result.status, 'incomplete'); assert.equal(result.original_UI_outcome, 'failure'); assert.equal(result.actual_UI_success, false);
  }
});

test('payload size, PNG magic and text encoding are checked before retaining', async () => {
  for (const [id, value] of [['0~image', Buffer.alloc(image.length)], ['0~image', Buffer.alloc(1)], ['0~context', Buffer.alloc(context.length, 255)]]) {
    const f = fixture(); f.payloads[id] = value;
    const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
    assert.equal(result.status, 'incomplete'); assert.ok(!result.files.some(x => x.payload_ref === id));
  }
});

test('failed retention is not reported as a retained file', async () => {
  const f = fixture(); f.io.retain = async () => { throw new Error('write refused'); };
  const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
  assert.equal(result.status, 'incomplete'); assert.equal(result.files.length, 0);
});

test('deadline exhausted during callback preparation prevents the actual fake spawn', async () => {
  const f = fixture({ beforePermit: ({ setClock }) => setClock(LIMITS.wholeMs) });
  const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
  assert.equal(result.incomplete_reason, 'deadline_exhausted_before_spawn'); assert.equal(f.calls.length, 1); assert.equal(f.calls[0].started, false);
});

test('remaining deadline clamps actual timeout below original planned timeout', async () => {
  const f = fixture({ beforePermit: ({ setClock }) => setClock(LIMITS.wholeMs - 10) });
  const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
  assert.equal(result.calls[0].planned_timeout_ms, LIMITS.perChildMs); assert.equal(result.calls[0].actual_timeout_ms, 10);
});

test('backwards and nonfinite clocks are refused rather than extending the deadline', () => {
  for (const clock of [() => NaN, () => Infinity]) assert.throws(() => deadlineBudget(clock));
  let value = 10; const budget = deadlineBudget(() => value); value = 9; assert.throws(() => budget.plan());
});

test('a callback cannot omit its fresh spawn permit', async () => {
  const f = fixture(); f.io.invoke = async () => ({ ok: true, quiescent: true, bytes: bytes(root()) });
  const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
  assert.equal(result.incomplete_reason, 'spawn_without_permit'); assert.equal(result.status, 'incomplete');
});

test('unverified child quiescence produces incomplete data and no payload retention', async () => {
  const f = fixture({ invoke: () => ({ ok: true, quiescent: false, bytes: bytes(root()), exit_code: 0, signal: null }) });
  const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
  assert.equal(result.incomplete_reason, 'child_quiescence_unverified'); assert.equal(f.retained.size, 0);
});

function fakeChild() {
  const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); child.pid = 12345;
  for (const pipe of [child.stdout, child.stderr]) {
    pipe.destroyed = false; pipe.destroy = () => { pipe.destroyed = true; };
  }
  return child;
}

test('actual process adapter uses one fresh permit, detached fixed executable and bounded streams', async () => {
  const child = fakeChild(); let permits = 0; const kills = [];
  const result = await executeGuard(['-I', '-B', '/fixture/guard.py'], () => { permits++; return 1000; }, {
    spawnChild: (exe, argv, options) => { assert.equal(exe, '/usr/bin/python3'); assert.deepEqual(argv, ['-I', '-B', '/fixture/guard.py']);
      assert.equal(options.detached, true); assert.deepEqual(options.stdio, ['ignore', 'pipe', 'pipe']);
      queueMicrotask(() => { child.stdout.emit('data', Buffer.from('{}')); child.emit('exit', 0, null); child.emit('close', 0, null); }); return child; },
    kill: (...args) => kills.push(args), exists: () => false, sleep: async () => {},
  });
  assert.equal(permits, 1); assert.equal(result.ok, true); assert.equal(result.bytes.toString(), '{}'); assert.deepEqual(kills, []);
});

test('actual process adapter stream overflow kills only its active owned group and rejects', async () => {
  const child = fakeChild(), kills = [];
  const result = await executeGuard([], () => 1000, { spawnChild: () => {
    queueMicrotask(() => { child.stdout.emit('data', Buffer.alloc(LIMITS.metadata + 1)); child.emit('exit', null, 'SIGKILL'); child.emit('close', null, 'SIGKILL'); }); return child; },
  kill: (...args) => kills.push(args), exists: () => false, sleep: async () => {} });
  assert.equal(result.ok, false); assert.deepEqual(kills, [[-12345, 'SIGKILL']]); assert.equal(result.bytes.length, 0);
});

test('actual process adapter never late-signals a group after its leader exits', async () => {
  const child = fakeChild(), kills = [];
  const result = await executeGuard([], () => 1000, { spawnChild: () => {
    queueMicrotask(() => { child.emit('exit', 0, null); child.emit('close', 0, null); }); return child; },
  kill: (...args) => kills.push(args), exists: () => true, sleep: async () => {} });
  assert.equal(result.ok, false); assert.equal(result.quiescent, false); assert.deepEqual(kills, []);
});

test('leader exit without close is bounded and abandons owned pipes without late kill or quiescence', { timeout: 2000 }, async () => {
  const child = fakeChild(), kills = []; let groupQueries = 0;
  const result = await executeGuard([], () => 20, { spawnChild: () => {
    queueMicrotask(() => { child.stdout.emit('data', Buffer.from('{}')); child.emit('exit', 0, null); }); return child; },
    kill: (...args) => kills.push(args), exists: () => { groupQueries++; return false; }, sleep: async () => {} });
  assert.equal(result.ok, false); assert.equal(result.quiescent, false);
  assert.equal(result.close_observed, false); assert.equal(result.abandoned_without_close, true);
  assert.equal(result.exit_code, 0); assert.deepEqual(kills, []); assert.equal(groupQueries, 0);
  assert.equal(child.stdout.destroyed, true); assert.equal(child.stderr.destroyed, true);
  assert.equal(result.bytes.toString(), '{}');
});

test('active child without close is killed once then abandoned with no publishable quiescence', { timeout: 2000 }, async () => {
  const child = fakeChild(), kills = [];
  const result = await executeGuard([], () => 20, { spawnChild: () => child,
    kill: (...args) => kills.push(args), exists: () => { throw new Error('must not infer quiescence after abandonment'); }, sleep: async () => {} });
  assert.equal(result.ok, false); assert.equal(result.quiescent, false);
  assert.equal(result.close_observed, false); assert.equal(result.abandoned_without_close, true);
  assert.deepEqual(kills, [[-12345, 'SIGKILL']]);
  assert.equal(child.stdout.destroyed, true); assert.equal(child.stderr.destroyed, true);
});

test('workflow keeps primary UI run and full artifact before optional nonblocking diagnostics', () => {
  const source = readFileSync(new URL('../../.github/workflows/ios-native.yml', import.meta.url), 'utf8');
  assert.ok(source.indexOf('id: native_full_evidence') < source.indexOf('id: native_failure_compact'));
  const ui = source.slice(source.indexOf('- name: Run native UI smoke'), source.indexOf('- name: Build and verify the Release'));
  assert.ok(ui.includes('id: native_ui')); assert.ok(!ui.includes('continue-on-error')); assert.ok(ui.includes('-only-testing:AILibraryUITests/ReadingRecoveryUITests'));
  assert.ok(source.includes('timeout-minutes: 40')); assert.ok(source.includes('AILIBRARY_FULL_ARTIFACT_OUTCOME: ${{ steps.native_full_evidence.outcome }}'));
  assert.ok(source.includes('path: .local/ios-ci/native-failure-compact/ready'));
  assert.ok(source.includes("steps.native_failure_compact.outputs.closed == 'true'"));
  assert.ok(source.includes("printf '%s\\n' 'closed=true' >> \"$GITHUB_OUTPUT\""));
});

test('Python guard source has only exact output write and no broad or fallback allowance', () => {
  const source = readFileSync(new URL('../../ios/tests/native-failure-export.py', import.meta.url), 'utf8');
  assert.ok(source.includes('(version 1) (deny default) (allow file-read*)'));
  assert.ok(source.includes('(allow file-write* (literal ')); assert.ok(!source.includes('(subpath'));
  assert.ok(source.includes('resource.RLIMIT_FSIZE')); assert.ok(source.includes('resource.RLIMIT_CORE'));
  assert.ok(source.includes("os.execve('/usr/bin/sandbox-exec'")); assert.ok(!source.includes('subprocess'));
});
