import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { lstatSync, realpathSync, mkdirSync, readFileSync, writeFileSync, readdirSync, renameSync, statfsSync,
  openSync, readSync, fstatSync, closeSync, constants } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LIMITS = Object.freeze({ metadata: 1048576, stderr: 8192, retained: 2097152,
  manifest: 65536, png: 1048576, hierarchy: 131072, geometry: 8192, context: 2048,
  wholeMs: 75000, perChildMs: 15000, maxCalls: 7, maxNodes: 32768, freeFloor: 67108864 });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const refPattern = /^0~[A-Za-z0-9_-]{1,150}={0,2}$/;
const shaPattern = /^[0-9a-f]{40}$/;
const allowedCases = new Set([
  'NativeReaderUITests/testThreeArticlesHaveNativeBodyText()',
  'NativeReaderUITests/testContentsBookmarkAndResumeAfterRelaunch()',
  'NativeReaderUITests/testHealthyLegacyHeadingPositionAndBookmarkPersistAfterNativeResumeAndRelaunch()',
  'ReadingRecoveryUITests/testCancelKeepsRecoveryNoticeAfterRelaunch()',
  'ReadingRecoveryUITests/testConfirmedRecoveryPreservesReadableAndCurrentBookmarksAfterRelaunch()',
  'ReadingRecoveryUITests/testRestoreFilePickerCancelKeepsHealthyBookmarksAfterRelaunch()',
  'ReadingRecoveryUITests/testConfirmedRecoveryPreservesCurrentPositionAndBookmarkAfterRelaunch()',
  'ReadingRecoveryUITests/testExportFilePickerCancelKeepsHealthyPositionAndBookmarkAfterRelaunch()',
]);
const recoveryConfirmationCases = new Set([...allowedCases].filter(identifier => identifier.startsWith('ReadingRecoveryUITests/')));
const pngNames = new Map([
  ['Public-UI-target-not-visible', 'public'], ['Reading-restore-picker-not-identified', 'restore'],
  ['Reading-recovery-confirmation-title-not-visible', 'confirmation'],
  ...[0, 1, 2].map(i => [`Reading-export-cancel-${i}-failed`, 'export']),
]);
const textNames = Object.freeze({ public: [
  ['Public-UI-target-not-visible-geometry', 'geometry.json', LIMITS.geometry],
  ['Public-UI-target-not-visible-hierarchy', 'hierarchy.txt', LIMITS.hierarchy],
], restore: [['Reading-restore-picker-context', 'context.txt', LIMITS.context]],
export: [['Reading-export-cancel-context', 'context.txt', LIMITS.context]],
confirmation: [['Reading-recovery-confirmation-context', 'context.txt', LIMITS.context]] });
const optionalTextNames = Object.freeze({ public: [
  ['Reading-placement-record-context', 'context.txt', LIMITS.context],
], export: [
  ['Reading-export-cancel-hierarchy', 'hierarchy.txt', LIMITS.hierarchy],
], confirmation: [
  ['Reading-recovery-confirmation-hierarchy', 'hierarchy.txt', LIMITS.hierarchy],
] });
const filenames = new Set(['failure.png', 'context.txt', 'geometry.json', 'hierarchy.txt']);
const fileLimits = Object.freeze({ 'failure.png': LIMITS.png, 'context.txt': LIMITS.context,
  'geometry.json': LIMITS.geometry, 'hierarchy.txt': LIMITS.hierarchy });
class Incomplete extends Error { constructor(code) { super(code); this.code = code; } }
const requireThat = (test, code) => { if (!test) throw new Incomplete(code); };
const scalar = value => value && typeof value === 'object' && !Array.isArray(value) ? value._value : undefined;
const values = value => value && Array.isArray(value._values) ? value._values : [];
const reference = value => { const id = scalar(value?.id); requireThat(typeof id === 'string' && refPattern.test(id), 'invalid_reference'); return id; };

export function parseMetadata(bytes) {
  requireThat(Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= LIMITS.metadata, 'metadata_size');
  let value;
  try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new Incomplete('invalid_metadata_JSON'); }
  requireThat(value && typeof value === 'object' && !Array.isArray(value), 'metadata_root');
  return value;
}

function walk(value, visit) {
  let count = 0;
  function next(item, depth) {
    requireThat(depth <= 64 && ++count <= LIMITS.maxNodes, 'metadata_tree_limit');
    if (!item || typeof item !== 'object') return;
    visit(item);
    for (const child of Array.isArray(item) ? item : Object.values(item)) next(child, depth + 1);
  }
  next(value, 0);
}

export function testsReference(root) {
  const actions = values(root.actions).filter(action => scalar(action.actionResult?.status) === 'failed');
  requireThat(actions.length === 1, 'failed_action_not_unique');
  return reference(actions[0].actionResult.testsRef);
}

export function failedSummary(tests) {
  const leaves = [];
  walk(tests, item => {
    if (scalar(item.testStatus) !== 'Failure') return;
    requireThat(item._type?._name === 'ActionTestMetadata', 'failed_test_schema');
    const identifier = scalar(item.identifier);
    requireThat(allowedCases.has(identifier), 'failed_test_outside_selected_scope');
    leaves.push({ identifier, id: reference(item.summaryRef) });
  });
  requireThat(leaves.length > 0 && leaves.length <= 8, 'failed_case_count');
  const unique = new Set(leaves.map(x => x.identifier));
  requireThat(unique.size === leaves.length, 'duplicate_failed_case');
  leaves.sort((a, b) => a.identifier.localeCompare(b.identifier, 'en'));
  return { ...leaves[0], omitted_failed_cases: leaves.length - 1 };
}

export function attachmentPlan(summary) {
  const candidates = [];
  walk(summary, item => {
    if (!item.attachments) return;
    requireThat(Array.isArray(item.attachments._values), 'attachments_schema');
    for (const attachment of item.attachments._values) candidates.push(attachment);
  });
  requireThat(candidates.length <= 256, 'attachment_count');
  const known = new Map();
  const optionalNames = new Set(Object.values(optionalTextNames).flat().map(x => x[0]));
  const allKnownNames = new Set([...pngNames.keys(), ...Object.values(textNames).flat().map(x => x[0]), ...optionalNames]);
  for (const a of candidates) {
    const name = scalar(a.name);
    if (!allKnownNames.has(name)) continue; // Never export an automatic recording or arbitrary attachment.
    requireThat(a._type?._name === 'ActionTestAttachment', 'attachment_schema');
    const id = reference(a.payloadRef), sizeText = scalar(a.payloadSize), uti = scalar(a.uniformTypeIdentifier);
    requireThat(typeof sizeText === 'string' && /^(0|[1-9][0-9]{0,7})$/.test(sizeText), 'payload_size_schema');
    const size = Number(sizeText), row = { name, id, size, uti };
    if (known.has(name)) {
      requireThat(!optionalNames.has(name), 'duplicate_optional_attachment');
      requireThat(JSON.stringify(known.get(name)) === JSON.stringify(row), 'ambiguous_attachment');
    } else known.set(name, row);
  }
  const images = [...known.values()].filter(x => pngNames.has(x.name));
  requireThat(images.length === 1, 'known_failure_image_not_unique');
  const image = images[0];
  requireThat(image.uti === 'public.png' && image.size >= 8 && image.size <= LIMITS.png, 'image_type_or_size');
  const result = [{ ...image, filename: 'failure.png', limit: LIMITS.png }];
  const role = pngNames.get(image.name);
  requireThat(role !== 'confirmation' || recoveryConfirmationCases.has(scalar(summary.identifier)), 'recovery_confirmation_case_mismatch');
  for (const [name, filename, limit] of [...textNames[role], ...(optionalTextNames[role] ?? [])]) {
    const row = known.get(name);
    if (!row) continue;
    requireThat(row.uti === 'public.plain-text' && row.size <= limit, 'text_type_or_size');
    result.push({ ...row, filename, limit });
  }
  requireThat(new Set(result.map(x => x.id)).size === result.length, 'reused_payload_reference');
  requireThat(result.reduce((sum, x) => sum + x.size, 0) + LIMITS.manifest <= LIMITS.retained, 'retained_plan_limit');
  return result;
}

export function validateBinding(env, event) {
  requireThat(env.GITHUB_ACTIONS === 'true' && env.GITHUB_REPOSITORY === 'pero3dev/ai-agent-library'
    && env.AILIBRARY_NATIVE_UI_OUTCOME === 'failure', 'unsupported_CI_context');
  requireThat(event?.repository?.full_name === env.GITHUB_REPOSITORY && event.repository.private === false, 'repository_not_public');
  requireThat(['success', 'failure'].includes(env.AILIBRARY_FULL_ARTIFACT_OUTCOME), 'full_artifact_outcome');
  requireThat(['pull_request', 'push'].includes(env.GITHUB_EVENT_NAME), 'unsupported_event');
  requireThat(/^[1-9][0-9]{0,19}$/.test(env.GITHUB_RUN_ID ?? '') && /^[1-9][0-9]{0,8}$/.test(env.GITHUB_RUN_ATTEMPT ?? '')
    && shaPattern.test(env.GITHUB_SHA ?? ''), 'run_identity');
  const source = env.GITHUB_EVENT_NAME === 'pull_request' ? event.pull_request?.head?.sha : event.after;
  requireThat(shaPattern.test(source ?? ''), 'source_identity');
  requireThat(env.GITHUB_EVENT_NAME !== 'push' || source === env.GITHUB_SHA, 'push_identity_mismatch');
  return Object.freeze({ repository: env.GITHUB_REPOSITORY, event: env.GITHUB_EVENT_NAME,
    run_id: env.GITHUB_RUN_ID, run_attempt: env.GITHUB_RUN_ATTEMPT, workflow_SHA: env.GITHUB_SHA, source_head: source,
    full_artifact_upload_outcome: env.AILIBRARY_FULL_ARTIFACT_OUTCOME });
}

export function deadlineBudget(now) {
  let previous = now(); requireThat(Number.isFinite(previous) && previous >= 0, 'clock_invalid');
  const deadline = previous + LIMITS.wholeMs; requireThat(Number.isFinite(deadline), 'clock_invalid');
  function remaining() {
    const current = now(); requireThat(Number.isFinite(current) && current >= previous, 'clock_invalid');
    previous = current; return Math.max(0, Math.floor(deadline - current));
  }
  return { plan: () => { const limit = Math.min(LIMITS.perChildMs, remaining()); requireThat(limit > 0, 'deadline_exhausted'); return limit; },
    permit: plan => { const limit = Math.min(plan, remaining()); requireThat(limit > 0, 'deadline_exhausted_before_spawn'); return limit; },
    checkpoint: () => requireThat(remaining() > 0, 'deadline_exhausted_after_child') };
}

export async function collectNativeFailure({ binding, io, now = () => performance.now(), budget = deadlineBudget(now) }) {
  const calls = [], files = [];
  let selected = null, status = 'incomplete', code = null;
  async function invoke(kind, payload) {
    requireThat(calls.length < LIMITS.maxCalls, 'child_count_limit');
    const planned = budget.plan();
    const receipt = { kind, planned_timeout_ms: planned, actual_timeout_ms: null, completed: false, quiescent: false };
    calls.push(receipt); let used = false;
    const acquirePermit = () => { requireThat(!used, 'permit_reused'); used = true; const timeout = budget.permit(planned); receipt.actual_timeout_ms = timeout; return timeout; };
    const result = await io.invoke(kind, payload, acquirePermit);
    requireThat(used, 'spawn_without_permit');
    receipt.completed = result.ok === true; receipt.quiescent = result.quiescent === true;
    receipt.exit_code = result.exit_code ?? null; receipt.signal = result.signal ?? null;
    requireThat(receipt.quiescent, 'child_quiescence_unverified');
    requireThat(receipt.completed, 'child_failed');
    budget.checkpoint();
    return result.bytes;
  }
  try {
    requireThat(io.bundleAvailable === true, 'UI_bundle_unavailable');
    const root = parseMetadata(await invoke('root', null));
    const tests = parseMetadata(await invoke('object', { id: testsReference(root) }));
    selected = failedSummary(tests);
    const summary = parseMetadata(await invoke('object', { id: selected.id }));
    requireThat(summary._type?._name === 'ActionTestSummary' && scalar(summary.testStatus) === 'Failure'
      && scalar(summary.identifier) === selected.identifier, 'summary_identity_mismatch');
    const plan = attachmentPlan(summary);
    for (const payload of plan) {
      const bytes = await invoke('export', payload);
      requireThat(Buffer.isBuffer(bytes) && bytes.length === payload.size && bytes.length <= payload.limit, 'actual_payload_size');
      if (payload.filename === 'failure.png') requireThat(bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])), 'actual_PNG_magic');
      else { try { new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { throw new Incomplete('actual_text_encoding'); } }
      await io.retain(payload.filename, bytes);
      files.push({ filename: payload.filename, attachment_name: payload.name, payload_ref: payload.id,
        advertised_bytes: payload.size, bytes: bytes.length, SHA256: hash(bytes) });
    }
    budget.checkpoint();
    const expectedText = textNames[pngNames.get(plan[0].name)].map(x => x[0]);
    const missingText = expectedText.filter(name => !plan.some(x => x.name === name)).length;
    status = selected.omitted_failed_cases || missingText ? 'partial' : 'collected';
    if (selected.omitted_failed_cases) code = 'other_failed_cases_omitted';
    else if (missingText) code = 'known_text_attachment_missing';
  } catch (error) { code = error instanceof Incomplete ? error.code : 'collector_internal_error'; }
  const manifest = { schema_version: 1, diagnostic_only: true, original_UI_outcome: 'failure', full_artifact_step_preserved: true,
    binding, status, incomplete_reason: code, selected_case: selected?.identifier ?? null,
    omitted_failed_cases: selected?.omitted_failed_cases ?? null, files, calls,
    coverage: 'one_selected_failed_case_and_known_attachments_only',
    limits: LIMITS, OS_write_controls: 'exact-output sandbox and RLIMIT configured; platform probe required separately',
    actual_UI_success: false, no_live_AX_or_simulator_queries: true };
  const data = Buffer.from(JSON.stringify(manifest, null, 2) + '\n');
  requireThat(data.length <= LIMITS.manifest && files.reduce((s, x) => s + x.bytes, data.length) <= LIMITS.retained, 'manifest_or_retained_limit');
  await io.close(data);
  return manifest;
}

function regular(p, cap) { const s = lstatSync(p); requireThat(s.isFile() && !s.isSymbolicLink() && s.size <= cap && realpathSync(p) === p, 'regular_path_required'); return s; }
export function readBoundedRegularFile(p, cap) {
  const pathBefore = regular(p, cap); const fd = openSync(p, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const before = fstatSync(fd); requireThat(before.isFile() && before.size <= cap, 'regular_path_required');
    requireThat(pathBefore.dev === before.dev && pathBefore.ino === before.ino, 'bounded_file_drift');
    const buffer = Buffer.alloc(cap + 1); let used = 0;
    while (used < buffer.length) { const count = readSync(fd, buffer, used, buffer.length - used, null); if (!count) break; used += count; }
    const after = fstatSync(fd); requireThat(used <= cap && before.dev === after.dev && before.ino === after.ino && before.size === after.size && used === after.size, 'bounded_file_drift');
    const pathAfter = regular(p, cap); requireThat(after.dev === pathAfter.dev && after.ino === pathAfter.ino && after.size === pathAfter.size, 'bounded_file_drift');
    return buffer.subarray(0, used);
  } finally { closeSync(fd); }
}
function directory(p) { const s = lstatSync(p); requireThat(s.isDirectory() && !s.isSymbolicLink() && realpathSync(p) === p, 'directory_path_required'); }
function verifyBundle(p) {
  let count = 0;
  const visit = current => { for (const entry of readdirSync(current, { withFileTypes: true })) {
    requireThat(++count <= 10000 && !entry.isSymbolicLink(), 'input_bundle_tree_limit');
    const file = join(current, entry.name); if (entry.isDirectory()) visit(file); else requireThat(entry.isFile(), 'input_bundle_special_file');
  } }; visit(p);
}
const pause = milliseconds => new Promise(resolvePause => setTimeout(resolvePause, milliseconds));
function groupExists(pid) { try { process.kill(-pid, 0); return true; } catch (e) { if (e.code === 'ESRCH') return false; throw e; } }

/** Only the detached group created by this invocation may be signalled. */
export async function executeGuard(argv, acquirePermit, { spawnChild = spawn, kill = (pid, signal) => process.kill(pid, signal), exists = groupExists, sleep = pause } = {}) {
  const options = { detached: true, stdio: ['ignore', 'pipe', 'pipe'], env: { PATH: '/usr/bin:/bin:/usr/sbin:/sbin', LANG: 'C', LC_ALL: 'C' } };
  const actualTimeout = acquirePermit(); // No filesystem operation between this check and spawn.
  const child = spawnChild('/usr/bin/python3', argv, options);
  const stdout = [], stderr = []; let outBytes = 0, errBytes = 0, limitFailure = false, timeoutFailure = false;
  let exitCode = null, signal = null, childError = false, settled = false, childExited = false;
  let closeObserved = false, abandonedWithoutClose = false, timer;
  const ownedPID = child.pid;
  const hasOwnedPID = Number.isInteger(ownedPID) && ownedPID > 1;
  if (!hasOwnedPID) childError = true;
  const stop = () => { if (hasOwnedPID && !childExited) { try { kill(-ownedPID, 'SIGKILL'); } catch (e) { if (e.code !== 'ESRCH') childError = true; } } };
  await new Promise(resolveExit => {
    const finish = () => { if (!settled) { settled = true; resolveExit(); } };
    const abandon = () => {
      if (settled) return;
      abandonedWithoutClose = true;
      finish(); // Stop event callbacks before destroying streams can emit errors.
      // Pipes may remain open after leader exit. Bound this wait without ever
      // signalling an exited leader's group or claiming its quiescence.
      stop();
      for (const pipe of [child.stdout, child.stderr]) {
        try { pipe.destroy(); } catch { childError = true; }
      }
    };
    child.stdout.on('data', bytes => { if (settled) return; outBytes += bytes.length; if (outBytes <= LIMITS.metadata) stdout.push(bytes); else { limitFailure = true; stop(); } });
    child.stderr.on('data', bytes => { if (settled) return; errBytes += bytes.length; if (errBytes <= LIMITS.stderr) stderr.push(bytes); else { limitFailure = true; stop(); } });
    child.stdout.on('error', () => { if (!settled) { childError = true; stop(); } });
    child.stderr.on('error', () => { if (!settled) { childError = true; stop(); } });
    child.on('error', () => { if (!settled) { childError = true; abandon(); } });
    child.on('exit', (code, sig) => { childExited = true; exitCode = code; signal = sig; });
    child.on('close', (code, sig) => {
      childExited = true; closeObserved = true; exitCode = code; signal = sig; finish();
    });
    timer = setTimeout(() => { timeoutFailure = true; abandon(); }, actualTimeout);
  });
  clearTimeout(timer);
  let quiescent = closeObserved && !abandonedWithoutClose && !hasOwnedPID;
  if (hasOwnedPID && closeObserved && !abandonedWithoutClose) {
    // Never signal a group after its leader has exited: a surviving/unproven
    // group causes refusal instead of a late signal that could target PID reuse.
    for (let i = 0; i < 20; i++) {
      try { if (!exists(ownedPID)) { quiescent = true; break; } } catch { childError = true; break; }
      await sleep(25);
    }
  }
  return { ok: !childError && !limitFailure && !timeoutFailure && exitCode === 0 && signal === null && quiescent,
    bytes: Buffer.concat(stdout), exit_code: exitCode, signal, quiescent, actual_timeout_ms: actualTimeout,
    close_observed: closeObserved, abandoned_without_close: abandonedWithoutClose,
    stdout_bytes: outBytes, stderr_bytes: errBytes, stderr_SHA256: hash(Buffer.concat(stderr)) };
}

function productionIO(workspace, developerDir) {
  const root = resolve(workspace); directory(root);
  requireThat(root === workspace && ['darwin'].includes(process.platform), 'unsupported_platform_or_root');
  requireThat(developerDir === '/Applications/Xcode_16.4.app/Contents/Developer', 'unexpected_Hosted_Xcode');
  const helper = join(root, 'ios/tests/native-failure-export.py'); regular(helper, 32768);
  requireThat(fileURLToPath(import.meta.url) === join(root, 'ios/tests/native-failure-attachments.mjs'), 'collector_source_location');
  const parent = join(root, '.local/ios-ci'); directory(parent);
  const bundle = join(parent, 'evidence/ui.xcresult'); let bundleAvailable = false;
  try { directory(bundle); verifyBundle(bundle); bundleAvailable = true; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const free = statfsSync(parent); requireThat(free.bavail * free.bsize >= LIMITS.freeFloor + LIMITS.retained, 'free_space');
  const out = join(parent, 'native-failure-compact'); mkdirSync(out, { mode: 0o700 });
  const exportsRoot = join(out, 'exports'), ready = join(out, 'ready'); mkdirSync(exportsRoot, { mode: 0o700 }); mkdirSync(ready, { mode: 0o700 });
  let unquiescent = false;
  return { bundleAvailable,
    async invoke(kind, payload, acquirePermit) {
      const argv = ['-I', '-B', helper, '--workspace-root', root, '--developer-dir', developerDir, '--mode', kind];
      if (payload?.id) argv.push('--id', payload.id);
      if (kind === 'export') argv.push('--output-name', payload.filename, '--limit-bytes', String(Math.max(1, payload.size)));
      let result;
      try { result = await executeGuard(argv, acquirePermit); }
      catch (error) { unquiescent = true; throw error; }
      if (!result.quiescent) unquiescent = true;
      if (result.ok && kind === 'export') {
        const file = join(exportsRoot, payload.filename), before = regular(file, payload.limit);
        const bytes = readBoundedRegularFile(file, payload.limit), after = regular(file, payload.limit);
        requireThat(before.dev === after.dev && before.ino === after.ino && before.size === after.size, 'export_inode_drift');
        result.bytes = bytes;
      }
      return result;
    },
    async retain(name, bytes) {
      requireThat(!unquiescent && filenames.has(name), 'retain_not_safe');
      const source = join(exportsRoot, name); regular(source, bytes.length);
      requireThat(readFileSync(source).equals(bytes), 'export_drift');
      renameSync(source, join(ready, name));
    },
    async close(bytes) {
      // Do not remove/rewrite a possibly active export. Full xcresult is already retained.
      requireThat(!unquiescent, 'output_close_quiescence_unverified');
      const all = [...readdirSync(exportsRoot), ...readdirSync(ready)]; requireThat(all.every(x => filenames.has(x)), 'unexpected_output_file');
      let retained = bytes.length;
      for (const folder of [exportsRoot, ready]) for (const name of readdirSync(folder)) retained += regular(join(folder, name), fileLimits[name]).size;
      requireThat(retained <= LIMITS.retained, 'actual_output_limit');
      writeFileSync(join(ready, 'manifest.json'), bytes, { flag: 'wx', mode: 0o600 });
    },
  };
}

export async function runCLI({ env = process.env, workspace = process.cwd(), readEvent = path => readBoundedRegularFile(path, 262144), makeIO = productionIO, now } = {}) {
  const budget = deadlineBudget(now ?? (() => performance.now()));
  requireThat(typeof env.GITHUB_EVENT_PATH === 'string' && env.GITHUB_EVENT_PATH.length < 4096, 'event_path');
  const eventBytes = readEvent(env.GITHUB_EVENT_PATH); requireThat(Buffer.isBuffer(eventBytes) && eventBytes.length <= 262144, 'event_size');
  let event; try { event = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(eventBytes)); } catch { throw new Incomplete('event_JSON'); }
  const binding = validateBinding(env, event);
  requireThat(env.GITHUB_WORKSPACE === workspace, 'workspace_binding');
  const io = await makeIO(workspace, env.DEVELOPER_DIR);
  return collectNativeFailure({ binding, io, now, budget });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 2) { console.error('Native failure compact: incomplete (unsupported_arguments)'); process.exitCode = 1; }
  else runCLI().then(value => console.log(JSON.stringify({ diagnostic_only: true, status: value.status, incomplete_reason: value.incomplete_reason,
    compact_files: value.files.length, original_UI_outcome: 'failure' }))).catch(() => { console.error('Native failure compact: incomplete (preflight_or_output_failure)'); process.exitCode = 1; });
}
