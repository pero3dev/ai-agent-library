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
  assert.ok(source.includes('timeout-minutes: 60')); assert.ok(source.includes('AILIBRARY_FULL_ARTIFACT_OUTCOME: ${{ steps.native_full_evidence.outcome }}'));
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


// Synthetic typed activities exercise the observed node-count boundary without retaining a real trace.
function countMetadataNodes(value) {
  let count = 0;
  const visit = item => { count++; if (item && typeof item === 'object') {
    for (const child of Array.isArray(item) ? item : Object.values(item)) visit(child);
  } };
  visit(value); return count;
}

test('representative typed activities above 20000 nodes remain bounded and collect the selected case', async () => {
  const f = fixture(), value = summary();
  value.activitySummaries._values.push(...Array.from({ length: 1200 }, (_, i) => ({
    _type: { _name: 'ActionTestActivitySummary' }, title: scalar('fixture activity'),
    activityType: scalar('com.apple.dt.xctest.activity-type.internal'), uuid: scalar(`fixture-${i}`),
    subactivities: array([]),
  })));
  const data = bytes(value), nodes = countMetadataNodes(value);
  assert.ok(nodes > 20000 && nodes < LIMITS.maxNodes); assert.equal(LIMITS.maxNodes, 32768);
  assert.ok(data.length < LIMITS.metadata); f.objects['0~summary'] = data;
  const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
  assert.equal(result.status, 'collected'); assert.equal(result.selected_case, caseID);
  assert.deepEqual(result.binding, binding()); assert.equal(result.actual_UI_success, false);
  assert.deepEqual([...f.retained.keys()], ['failure.png', 'context.txt']);
  assert.deepEqual(f.calls.map(x => x.kind), ['root', 'object', 'object', 'export', 'export']);
});

test('optional export hierarchy absence preserves collected PNG and required context with no extra call', async () => {
  const f = fixture();
  const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
  assert.equal(result.status, 'collected'); assert.equal(result.incomplete_reason, null);
  assert.deepEqual([...f.retained.keys()], ['failure.png', 'context.txt']); assert.equal(f.calls.length, 5);
});

test('optional export hierarchy retains one bounded UTF8 attachment while context stays required', async () => {
  const f = fixture(), value = summary(), hierarchy = Buffer.from('Application\n  保存画面\n');
  value.activitySummaries._values[0].subactivities._values[0].attachments._values.push(
    attachment('Reading-export-cancel-hierarchy', '0~hierarchy', hierarchy.length, 'public.plain-text'));
  f.objects['0~summary'] = bytes(value); f.payloads['0~hierarchy'] = hierarchy;
  const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
  assert.equal(result.status, 'collected'); assert.equal(result.actual_UI_success, false); assert.equal(f.calls.length, 6);
  assert.deepEqual([...f.retained.keys()], ['failure.png', 'context.txt', 'hierarchy.txt']);
  assert.deepEqual(f.retained.get('hierarchy.txt'), hierarchy);
  value.activitySummaries._values[0].subactivities._values[0].attachments._values.splice(1, 1);
  const second = fixture(); second.objects['0~summary'] = bytes(value); second.payloads['0~hierarchy'] = hierarchy;
  const missingContext = await collectNativeFailure({ binding: binding(), io: second.io, now: second.now });
  assert.equal(missingContext.status, 'partial'); assert.equal(missingContext.incomplete_reason, 'known_text_attachment_missing');
});

test('optional export hierarchy duplicate names are refused even when metadata matches', () => {
  for (const id of ['0~hierarchy', '0~secondHierarchy']) {
    const value = summary(), entries = value.activitySummaries._values[0].subactivities._values[0].attachments._values;
    entries.push(attachment('Reading-export-cancel-hierarchy', '0~hierarchy', 2, 'public.plain-text'),
      attachment('Reading-export-cancel-hierarchy', id, 2, 'public.plain-text'));
    assert.throws(() => attachmentPlan(value), /duplicate_optional_attachment/);
  }
});

test('optional export hierarchy malformed schema size type reference or excess bytes stops before exports', async () => {
  for (const change of [a => { a._type._name = 'Other'; }, a => { a.payloadSize._value = '01'; },
    a => { a.payloadSize._value = String(LIMITS.hierarchy + 1); }, a => { a.uniformTypeIdentifier._value = 'public.png'; },
    a => { a.payloadRef = ref('../escape'); }, a => { a.payloadRef = ref('0~context'); }]) {
    const f = fixture(), value = summary(), a = attachment('Reading-export-cancel-hierarchy', '0~hierarchy', 2, 'public.plain-text');
    change(a); value.activitySummaries._values[0].subactivities._values[0].attachments._values.push(a);
    f.objects['0~summary'] = bytes(value);
    const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
    assert.equal(result.status, 'incomplete'); assert.equal(result.files.length, 0);
    assert.equal(f.calls.filter(x => x.kind === 'export').length, 0);
  }
});

test('optional export hierarchy actual invalid UTF8 or size never retains the hierarchy', async () => {
  for (const payload of [Buffer.from([255, 255]), Buffer.from('x')]) {
    const f = fixture(), value = summary();
    value.activitySummaries._values[0].subactivities._values[0].attachments._values.push(
      attachment('Reading-export-cancel-hierarchy', '0~hierarchy', 2, 'public.plain-text'));
    f.objects['0~summary'] = bytes(value); f.payloads['0~hierarchy'] = payload;
    const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
    assert.equal(result.status, 'incomplete'); assert.equal(result.actual_UI_success, false);
    assert.ok(!result.files.some(x => x.filename === 'hierarchy.txt')); assert.equal(f.retained.has('hierarchy.txt'), false);
  }
});


// The confirmation-timeout role is a failure-only witness for the existing recovery cases.
const confirmationCaseIDs = [
  'ReadingRecoveryUITests/testCancelKeepsRecoveryNoticeAfterRelaunch()',
  'ReadingRecoveryUITests/testConfirmedRecoveryPreservesReadableAndCurrentBookmarksAfterRelaunch()',
  'ReadingRecoveryUITests/testRestoreFilePickerCancelKeepsHealthyBookmarksAfterRelaunch()',
  'ReadingRecoveryUITests/testConfirmedRecoveryPreservesCurrentPositionAndBookmarkAfterRelaunch()',
  'ReadingRecoveryUITests/testExportFilePickerCancelKeepsHealthyPositionAndBookmarkAfterRelaunch()',
];
const confirmationContext = Buffer.from('{"observedTitleWithinWait":false,"sampling":"after-title-wait-timeout-sequential"}\n');
function confirmationFixture(identifier = confirmationCaseIDs[2], overrides = {}) {
  const f = fixture(overrides), value = summary();
  value.identifier = scalar(identifier);
  value.activitySummaries._values[0].subactivities._values[0].attachments._values.splice(0, 2,
    attachment('Reading-recovery-confirmation-title-not-visible', '0~image', image.length, 'public.png'),
    attachment('Reading-recovery-confirmation-context', '0~context', confirmationContext.length, 'public.plain-text'));
  f.objects['0~tests'] = bytes({ tests: array([leaf(identifier)]) });
  f.objects['0~summary'] = bytes(value); f.payloads['0~context'] = confirmationContext;
  return { ...f, value };
}

test('confirmation timeout accepts exactly the fixed PNG and required context for each existing recovery case', async () => {
  for (const identifier of confirmationCaseIDs) {
    const f = confirmationFixture(identifier);
    const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
    assert.equal(result.status, 'collected'); assert.equal(result.selected_case, identifier);
    assert.equal(result.actual_UI_success, false); assert.equal(result.original_UI_outcome, 'failure');
    assert.deepEqual([...f.retained.keys()], ['failure.png', 'context.txt']);
    assert.deepEqual(f.retained.get('context.txt'), confirmationContext);
    assert.deepEqual(f.calls.map(x => x.kind), ['root', 'object', 'object', 'export', 'export']);
  }
});

test('confirmation role refuses a different selected suite or missing summary identity before payload exports', async () => {
  const f = confirmationFixture(anotherCase);
  const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
  assert.equal(result.status, 'incomplete'); assert.equal(result.incomplete_reason, 'recovery_confirmation_case_mismatch');
  assert.equal(f.calls.filter(x => x.kind === 'export').length, 0); assert.equal(f.retained.size, 0);
  const value = confirmationFixture().value; delete value.identifier;
  assert.throws(() => attachmentPlan(value), /recovery_confirmation_case_mismatch/);
});

test('confirmation role does not accept zero, lookalike, automatic or multiple known PNG witnesses', () => {
  for (const name of ['Reading-recovery-confirmation-title-not-visible-extra', 'Automatic Screenshot']) {
    const value = confirmationFixture().value;
    value.activitySummaries._values[0].subactivities._values[0].attachments._values[0].name = scalar(name);
    assert.throws(() => attachmentPlan(value), /known_failure_image_not_unique/);
  }
  const absent = confirmationFixture().value;
  absent.activitySummaries._values[0].subactivities._values[0].attachments._values.splice(0, 1);
  assert.throws(() => attachmentPlan(absent), /known_failure_image_not_unique/);
  const value = confirmationFixture().value, entries = value.activitySummaries._values[0].subactivities._values[0].attachments._values;
  entries.push(attachment('Public-UI-target-not-visible', '0~secondImage', image.length, 'public.png'));
  assert.throws(() => attachmentPlan(value), /known_failure_image_not_unique/);
});

test('confirmation PNG duplicate metadata coalesces only exact identity while changed refs remain ambiguous', () => {
  const value = confirmationFixture().value, entries = value.activitySummaries._values[0].subactivities._values[0].attachments._values;
  entries.push(structuredClone(entries[0])); assert.equal(attachmentPlan(value).length, 2);
  entries.at(-1).payloadRef = ref('0~different'); assert.throws(() => attachmentPlan(value), /ambiguous_attachment/);
});

test('confirmation optional hierarchy is bounded and context remains required', async () => {
  const f = confirmationFixture(), hierarchy = Buffer.from('Application\n  Sheet recovery confirmation\n');
  const entries = f.value.activitySummaries._values[0].subactivities._values[0].attachments._values;
  entries.push(attachment('Reading-recovery-confirmation-hierarchy', '0~hierarchy', hierarchy.length, 'public.plain-text'));
  f.objects['0~summary'] = bytes(f.value); f.payloads['0~hierarchy'] = hierarchy;
  const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
  assert.equal(result.status, 'collected'); assert.equal(result.actual_UI_success, false); assert.equal(f.calls.length, 6);
  assert.deepEqual([...f.retained.keys()], ['failure.png', 'context.txt', 'hierarchy.txt']);
  assert.deepEqual(f.retained.get('hierarchy.txt'), hierarchy);
  const missing = confirmationFixture(); missing.value.activitySummaries._values[0].subactivities._values[0].attachments._values.splice(1, 1);
  missing.objects['0~summary'] = bytes(missing.value);
  const partial = await collectNativeFailure({ binding: binding(), io: missing.io, now: missing.now });
  assert.equal(partial.status, 'partial'); assert.equal(partial.incomplete_reason, 'known_text_attachment_missing');
  assert.deepEqual([...missing.retained.keys()], ['failure.png']);
});

test('confirmation role rejects malformed and excessive PNG context or hierarchy before any export', async () => {
  const changes = [
    entries => { entries[0].payloadSize._value = String(LIMITS.png + 1); },
    entries => { entries[0].uniformTypeIdentifier._value = 'public.mpeg-4'; },
    entries => { entries[0].payloadRef = ref('../escape'); },
    entries => { entries[1].payloadSize._value = String(LIMITS.context + 1); },
    entries => { entries[1].payloadRef = ref('0~image'); },
    entries => { entries.push(attachment('Reading-recovery-confirmation-hierarchy', '0~hierarchy', LIMITS.hierarchy + 1, 'public.plain-text')); },
    entries => { entries.push(attachment('Reading-recovery-confirmation-hierarchy', '0~hierarchy', 2, 'public.png')); },
    entries => { entries.push(attachment('Reading-recovery-confirmation-hierarchy', '0~hierarchy', 2, 'public.plain-text'),
      attachment('Reading-recovery-confirmation-hierarchy', '0~hierarchy', 2, 'public.plain-text')); },
  ];
  for (const change of changes) {
    const f = confirmationFixture(), entries = f.value.activitySummaries._values[0].subactivities._values[0].attachments._values;
    change(entries); f.objects['0~summary'] = bytes(f.value);
    const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
    assert.equal(result.status, 'incomplete'); assert.equal(result.actual_UI_success, false);
    assert.equal(result.files.length, 0); assert.equal(f.calls.filter(x => x.kind === 'export').length, 0);
  }
});

test('confirmation context invalid UTF8 is not retained or counted as complete evidence', async () => {
  const f = confirmationFixture(); f.payloads['0~context'] = Buffer.alloc(confirmationContext.length, 255);
  const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
  assert.equal(result.status, 'incomplete'); assert.equal(result.actual_UI_success, false);
  assert.equal(result.incomplete_reason, 'actual_text_encoding'); assert.equal(f.retained.has('context.txt'), false);
});

test('confirmation export still requires a fresh permit within the unchanged whole deadline', async () => {
  const f = confirmationFixture(confirmationCaseIDs[2], {
    beforePermit: ({ kind, setClock }) => { if (kind === 'export') setClock(LIMITS.wholeMs); },
  });
  const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
  assert.equal(result.status, 'incomplete'); assert.equal(result.incomplete_reason, 'deadline_exhausted_before_spawn');
  assert.equal(result.actual_UI_success, false); assert.equal(f.retained.size, 0);
  assert.equal(f.calls.filter(x => x.kind === 'export' && x.started).length, 0);
});

function publicPlacementTraceFixture(traceSize = LIMITS.context) {
  const f = fixture();
  const body = bytes({ schemaVersion: 1, kind: 'reader-placement-record', status: 'observed',
    events: [{ kind: 'recordReturned', sampleFP: 'a'.repeat(32), resolvedFP: 'a'.repeat(32), matches: true }],
    bufferDropCount: 0, contextDropCount: 0, dropCount: 0 });
  assert.ok(body.length < traceSize);
  const trace = Buffer.concat([body, Buffer.alloc(traceSize - body.length, 0x20)]);
  const geometry = Buffer.from('{}'), hierarchy = Buffer.from('controlled hierarchy');
  const value = { _type: { _name: 'ActionTestSummary' }, identifier: scalar(caseID),
    testStatus: scalar('Failure'), activitySummaries: array([
      { attachments: array([
        attachment('Public-UI-target-not-visible', '0~public-image', image.length, 'public.png'),
        attachment('Public-UI-target-not-visible-geometry', '0~public-geometry', geometry.length, 'public.plain-text'),
        attachment('Public-UI-target-not-visible-hierarchy', '0~public-hierarchy', hierarchy.length, 'public.plain-text'),
      ]) },
      // Teardown is a different activity from the assertion's original failure image.
      { subactivities: array([{ attachments: array([
        attachment('Reading-placement-record-context', '0~placement-context', trace.length, 'public.plain-text'),
      ]) }]) },
    ]) };
  f.objects['0~summary'] = bytes(value);
  Object.assign(f.payloads, { '0~public-image': image, '0~public-geometry': geometry,
    '0~public-hierarchy': hierarchy, '0~placement-context': trace });
  return { ...f, value, trace };
}

test('public placement context at 2048 bytes keeps existing payload shape and fits the unchanged seven-call cap', async () => {
  const f = publicPlacementTraceFixture();
  assert.equal(LIMITS.context, 2048); assert.equal(LIMITS.maxCalls, 7);
  const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
  assert.equal(result.status, 'collected'); assert.equal(result.actual_UI_success, false);
  assert.equal(result.original_UI_outcome, 'failure');
  assert.equal(result.coverage, 'one_selected_failed_case_and_known_attachments_only');
  assert.deepEqual([...f.retained.keys()], ['failure.png', 'geometry.json', 'hierarchy.txt', 'context.txt']);
  assert.deepEqual(f.retained.get('context.txt'), f.trace);
  assert.equal(f.retained.get('context.txt').length, 2048);
  assert.equal(f.calls.length, LIMITS.maxCalls);
  assert.equal(f.calls.filter(call => call.kind === 'export').length, 4);
  assert.ok(f.calls.every(call => call.started && call.timeout <= LIMITS.perChildMs));
});

test('public placement context rejects 2049 bytes, wrong type or duplicate fixed names before any export', async () => {
  for (const change of ['oversized', 'wrong-UTI', 'duplicate']) {
    const f = publicPlacementTraceFixture(change === 'oversized' ? LIMITS.context + 1 : LIMITS.context);
    const entries = f.value.activitySummaries._values[1].subactivities._values[0].attachments._values;
    if (change === 'wrong-UTI') entries[0].uniformTypeIdentifier = scalar('public.png');
    if (change === 'duplicate') entries.push(structuredClone(entries[0]));
    f.objects['0~summary'] = bytes(f.value);
    const result = await collectNativeFailure({ binding: binding(), io: f.io, now: f.now });
    assert.equal(result.status, 'incomplete');
    assert.ok(['text_type_or_size', 'duplicate_optional_attachment'].includes(result.incomplete_reason));
    assert.equal(f.calls.filter(call => call.kind === 'export').length, 0);
    assert.equal(f.retained.size, 0);
  }
});

test('only the fixed placement context name in the public role can select context.txt', () => {
  const f = publicPlacementTraceFixture();
  const entries = f.value.activitySummaries._values[1].subactivities._values[0].attachments._values;
  entries[0].name = scalar('Reading-placement-record-context-other');
  assert.deepEqual(attachmentPlan(f.value).map(row => row.filename), ['failure.png', 'geometry.json', 'hierarchy.txt']);
  const otherRole = summary();
  otherRole.activitySummaries._values[0].subactivities._values[0].attachments._values.push(
    attachment('Reading-placement-record-context', '0~not-this-role', LIMITS.context, 'public.plain-text'));
  const plan = attachmentPlan(otherRole);
  assert.deepEqual(plan.map(row => row.name), ['Reading-export-cancel-0-failed', 'Reading-export-cancel-context']);
  assert.ok(plan.every(row => row.id !== '0~not-this-role'));
  assert.throws(() => attachmentPlan({ attachments: array([
    attachment('Reading-placement-record-failed', '0~unapproved-role', 8, 'public.png'),
  ]) }), /known_failure_image_not_unique/);
});
