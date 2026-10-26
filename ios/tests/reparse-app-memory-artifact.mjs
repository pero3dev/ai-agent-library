// Read an existing immutable artifact. Never run/build/launch the application.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chmodSync, copyFileSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureAppMemory, captureExitCode, fingerprintResult } from './capture-app-memory.mjs';

export const RAW_ARTIFACT = Object.freeze({ repository: 'pero3dev/ai-agent-library', run_id: 40243885319,
  job_id: 121321292208, artifact_id: 12618446606, run_attempt: 1,
  head_sha: '4b6978dec80af528248df9dc186ba1d9feda227b', tree: '9cdd4459334565ffcbd4db89e16d70f0532d479f',
  original_branch: 'codex/ios-app-memory-observation', artifact_name: 'ios-app-memory-observation-evidence-40243885319-1',
  zip_bytes: 1303267, zip_sha256: '5c6104728aedad0cdfa0a15354e283b29de75f61f5a284fd66ff2a41ae613dab',
  entries: 163, expanded_bytes: 2633016, artifact_expires_at: '2027-01-23T23:14:59Z',
  original_seal: '4d093284c6f2fbe007d9b7e741c3c3fff1af70bf032a222d34cc0b24bd3faf93',
  snapshot_seal: 'c3a242ef76a94e8b8996ff1e1ec4a22ec619861a26f6d1712a9a19fe4c7b8a38', app_version: '0.2.14', app_build: '16' });
export const PARSER_GATE = Object.freeze({ branch: 'codex/ios-app-memory-raw-reparse', base: '955c066c8dc0fdbedf6f0c845a461abda39ac476', expires_at: '2026-11-02T00:00:00Z' });
export function verifyParserEvent(event, now = Date.now()) {
  const pr = event.pull_request;
  assert.ok(now < Date.parse(PARSER_GATE.expires_at), 'Temporary workflow expired');
  assert.equal(event.repository?.full_name, RAW_ARTIFACT.repository); assert.equal(event.repository?.private, false);
  assert.equal(pr?.draft, true); assert.equal(pr?.head?.repo?.full_name, RAW_ARTIFACT.repository);
  assert.equal(pr?.head?.ref, PARSER_GATE.branch); assert.equal(pr?.base?.ref, 'main');
  assert.equal(pr?.base?.sha, PARSER_GATE.base, 'Rebind actual latest main before publication');
  return { base: PARSER_GATE.base, branch: PARSER_GATE.branch, expires_at: PARSER_GATE.expires_at };
}
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const put = (root, name, value) => writeFileSync(path.join(root, name), typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
export class UnknownReparseEvidence extends Error {}
function required(value, label) { if (value === undefined || value === null) throw new UnknownReparseEvidence('Unobserved metadata field: ' + label); return value; }

export function verifyArtifactMetadata(run, artifact, expected = RAW_ARTIFACT) {
  assert.equal(required(run.id, 'run.id'), expected.run_id);
  assert.equal(required(run.head_sha, 'run.head_sha'), expected.head_sha);
  assert.equal(required(run.repository?.full_name, 'run.repository'), expected.repository);
  assert.equal(required(run.head_repository?.full_name, 'run.head_repository'), expected.repository);
  assert.equal(required(run.repository?.private, 'run.repository.private'), false);
  assert.equal(required(run.event, 'run.event'), 'pull_request');
  assert.equal(required(run.head_branch, 'run.head_branch'), expected.original_branch);
  assert.equal(required(run.run_attempt, 'run.run_attempt'), expected.run_attempt);
  assert.equal(required(run.status, 'run.status'), 'completed');
  assert.equal(required(run.conclusion, 'run.conclusion'), 'failure'); // Original seal failure is preserved.
  assert.equal(required(artifact.id, 'artifact.id'), expected.artifact_id);
  assert.equal(required(artifact.name, 'artifact.name'), expected.artifact_name);
  assert.equal(required(artifact.expired, 'artifact.expired'), false);
  assert.equal(required(artifact.expires_at, 'artifact.expires_at'), expected.artifact_expires_at);
  assert.ok(Number.isSafeInteger(artifact.size_in_bytes) && artifact.size_in_bytes > 0 && artifact.size_in_bytes <= 4 * 1024 * 1024);
  assert.equal(required(artifact.workflow_run?.id, 'artifact.workflow_run.id'), expected.run_id);
  assert.equal(required(artifact.workflow_run?.head_sha, 'artifact.workflow_run.head_sha'), expected.head_sha);
  assert.equal(required(artifact.workflow_run?.repository_id, 'artifact.repository_id'), required(run.repository?.id, 'run.repository.id'));
  assert.equal(required(artifact.workflow_run?.head_repository_id, 'artifact.head_repository_id'), required(run.head_repository?.id, 'run.head_repository.id'));
  if (artifact.digest != null) assert.equal(artifact.digest, 'sha256:' + expected.zip_sha256);
  return { repository: expected.repository, run_id: run.id, head_sha_external: run.head_sha, event: run.event,
    run_attempt: run.run_attempt, original_workflow_conclusion: run.conclusion, artifact_id: artifact.id,
    source_job_id_external: expected.job_id, job_metadata_verified: false, name: artifact.name, expires_at: artifact.expires_at, API_size_bytes: artifact.size_in_bytes, API_digest: artifact.digest ?? null,
    identity_role: 'External GitHub execution/artifact evidence; not xcresult source attestation.' };
}

export async function downloadExistingArtifact(output, token, { request = fetch, expected = RAW_ARTIFACT } = {}) {
  assert.ok(typeof token === 'string' && token.length > 0, 'Missing Actions read token');
  const deadline = performance.now() + 120000;
  const bounded = async (url, authenticated, limit, milliseconds) => {
    const remaining = Math.floor(Math.min(milliseconds, deadline - performance.now())); assert.ok(remaining > 0, 'Acquisition time bound');
    let response;
    try { response = await request(url, { redirect: 'manual', signal: AbortSignal.timeout(remaining),
      headers: authenticated ? { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } : {} }); }
    catch { throw new Error('GitHub acquisition unavailable; request details redacted'); }
    if ([301, 302, 303, 307, 308].includes(response.status)) { await response.body?.cancel(); return { response, bytes: null }; }
    assert.equal(response.status, 200, 'GitHub acquisition non-200 status');
    const chunks = []; let total = 0;
    for await (const chunk of response.body) { total += chunk.length; assert.ok(total <= limit, 'Acquisition byte bound'); assert.ok(performance.now() < deadline, 'Acquisition time bound'); chunks.push(Buffer.from(chunk)); }
    return { response, bytes: Buffer.concat(chunks) };
  };
  const api = 'https://api.github.com/repos/' + expected.repository;
  const runReply = await bounded(api + '/actions/runs/' + expected.run_id, true, 256 * 1024, 20000);
  const artifactReply = await bounded(api + '/actions/artifacts/' + expected.artifact_id, true, 256 * 1024, 20000);
  assert.ok(runReply.bytes && artifactReply.bytes, 'Unexpected metadata redirect');
  const proof = verifyArtifactMetadata(JSON.parse(runReply.bytes), JSON.parse(artifactReply.bytes), expected);
  put(output, 'GitHub-metadata-proof.json', { ...proof, run_response_sha256: sha(runReply.bytes), artifact_response_sha256: sha(artifactReply.bytes), secret_urls_and_token_recorded: false });
  let reply = await bounded(api + '/actions/artifacts/' + expected.artifact_id + '/zip', true, 2 * 1024 * 1024, 40000);
  if (reply.bytes === null) {
    let location; try { location = new URL(reply.response.headers.get('location')); } catch { throw new Error('Artifact redirect unavailable; details redacted'); }
    assert.equal(location.protocol, 'https:', 'Unsafe artifact redirect protocol');
    if (!location.hostname.endsWith('.blob.core.windows.net') && !location.hostname.endsWith('.githubusercontent.com')) throw new UnknownReparseEvidence('Unobserved artifact redirect host; details redacted');
    reply = await bounded(location.href, false, 2 * 1024 * 1024, 40000); // Never forward Authorization.
  }
  assert.ok(reply.bytes, 'Unexpected additional artifact redirect');
  assert.equal(reply.bytes.length, expected.zip_bytes, 'Artifact ZIP byte mismatch'); assert.equal(sha(reply.bytes), expected.zip_sha256, 'Artifact ZIP SHA mismatch');
  const file = path.join(output, 'artifact-original.zip'); writeFileSync(file, reply.bytes, { flag: 'wx', mode: 0o400 });
  put(output, 'acquisition.json', { artifact_id: expected.artifact_id, zip_bytes: reply.bytes.length, sha256: sha(reply.bytes), request_urls_headers_token_logged: false });
  return file;
}

// Python's standard ZIP reader validates CRC while streaming. No opaque/SQLite interpretation.
const SAFE_EXTRACT = String.raw`import sys,json,zipfile,os,stat,pathlib
archive,target,entries,expanded=sys.argv[1:];entries=int(entries);expanded=int(expanded);root=pathlib.Path(target)
assert not root.exists();root.mkdir(mode=0o700)
with zipfile.ZipFile(archive) as z:
 infos=z.infolist();assert len(infos)==entries<=256;assert sum(i.file_size for i in infos)==expanded<=4*1024*1024
 seen=set()
 for i in infos:
  name=i.filename;assert name and '\\' not in name and ':' not in name and '\x00' not in name and not name.startswith('/')
  pieces=name.rstrip('/').split('/');assert len(pieces)<=16 and all(p not in ('','..','.') for p in pieces)
  canonical='/'.join(pieces);assert canonical not in seen;seen.add(canonical)
  kind=(i.external_attr>>16)&0o170000;assert kind in (0,stat.S_IFREG,stat.S_IFDIR);assert not i.flag_bits&1
  assert (kind in (0,stat.S_IFDIR) if i.is_dir() else kind in (0,stat.S_IFREG))
  assert i.compress_type in (zipfile.ZIP_STORED,zipfile.ZIP_DEFLATED) and i.file_size<=2*1024*1024
  dest=root.joinpath(*pieces)
  if i.is_dir():
   assert i.file_size==0 and i.CRC==0;dest.mkdir(parents=True,exist_ok=True,mode=0o700);continue
  dest.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
  with z.open(i) as source,open(dest,'xb') as out:
   count=0
   while True:
    data=source.read(65536)
    if not data:break
    count+=len(data);assert count<=i.file_size;out.write(data)
   assert count==i.file_size
print(json.dumps({'entries':len(infos),'expanded_bytes':expanded,'CRC':'all streamed entries verified','safepath_no_links':True}))`;

export function extractExistingArtifact(zip, output, expected = RAW_ARTIFACT) {
  const bytes = readFileSync(zip); assert.equal(bytes.length, expected.zip_bytes); assert.equal(sha(bytes), expected.zip_sha256);
  assert.ok(bytes.length <= 2 * 1024 * 1024, 'ZIP byte bound');
  const temporary = output + '.zip-tmp'; mkdirSync(temporary, { mode: 0o700 });
  let result, cacheEntries = 0, cacheBytes = 0;
  try {
    result = spawnSync('/usr/bin/python3', ['-c', SAFE_EXTRACT, zip, output, String(expected.entries), String(expected.expanded_bytes)], { timeout: 30000, maxBuffer: 1024 * 1024, detached: true, killSignal: 'SIGKILL', env: { ...process.env, TMPDIR: temporary }, cwd: path.dirname(output) });
    if (result.pid) { try { process.kill(-result.pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw new Error('Owned ZIP child cleanup unavailable'); } }
  } finally {
    const check = (file, depth = 0) => { assert.ok(depth <= 4 && ++cacheEntries <= 64, 'ZIP cache entry/depth bound'); const stat = lstatSync(file); assert.ok(!stat.isSymbolicLink()); if (stat.isDirectory()) for (const name of readdirSync(file)) check(path.join(file, name), depth + 1); else { cacheBytes += stat.size; assert.ok(cacheBytes <= 1024 * 1024, 'ZIP cache byte bound'); } };
    check(temporary); rmSync(temporary, { recursive: true });
  }
  assert.ok(!result.error && result.status === 0, 'ZIP safe extraction failed; no unconditional retry');
  return { ...JSON.parse(result.stdout), owned_ZIP_cache_entries: cacheEntries, owned_ZIP_cache_bytes: cacheBytes, owned_cache_removed: true };
}

function protectTree(root) { for (const name of readdirSync(root)) { const file = path.join(root, name), stat = lstatSync(file); assert.ok(!stat.isSymbolicLink()); if (stat.isDirectory()) protectTree(file); else chmodSync(file, 0o400); } chmodSync(root, 0o500); }

export function prepareDerivedContext(original, output, parser, expected = RAW_ARTIFACT) {
  const contextBytes = readFileSync(path.join(original, 'context-sealed.json')), context = JSON.parse(contextBytes);
  const failed = JSON.parse(readFileSync(path.join(original, 'raw-capture/memory-observation-summary.json')));
  assert.equal(context.source_head, expected.head_sha); assert.equal(context.source_tree, expected.tree);
  assert.equal(context.Xcode, 'Xcode 16.4\nBuild version 16F6');
  assert.equal(context.app_version, expected.app_version); assert.equal(context.app_build, expected.app_build);
  assert.equal(context.result_binding.inventory_sha256, expected.original_seal); assert.equal(context.result_binding.expected_configuration_id, null);
  assert.equal(failed.status, 'failed-or-unavailable'); assert.match(failed.error, /Stale or wrong context result inventory/);
  assert.deepEqual(JSON.parse(readFileSync(path.join(original, 'raw-capture/capture-commands.json'))), []);
  const snapshot = fingerprintResult(path.join(original, 'memory-search.xcresult'));
  assert.equal(snapshot.sha256, expected.snapshot_seal); assert.deepEqual(snapshot, JSON.parse(readFileSync(path.join(original, 'raw-capture/result-inventory.raw.json'))));
  assert.equal(failed.result_seal.before_sha256, snapshot.sha256); assert.equal(failed.result_seal.after_sha256, snapshot.sha256);
  const seed = path.join(output, 'reader-seed.xcresult'); mkdirSync(seed, { mode: 0o700 });
  assert.ok(snapshot.files.reduce((sum, file) => sum + file.bytes, 0) <= 2 * 1024 * 1024);
  for (const file of snapshot.files) { const target = path.join(seed, file.path); mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 }); copyFileSync(path.join(original, 'memory-search.xcresult', file.path), target); chmodSync(target, 0o600); }
  assert.equal(fingerprintResult(seed).sha256, snapshot.sha256);
  const derived = structuredClone(context);
  derived.result_binding.inventory_sha256 = snapshot.sha256; derived.result_binding.preseal_inventory = snapshot;
  derived.artifact_reparse_provenance = { role: 'artifact-snapshot-derived-context-only', original_context_sha256: sha(contextBytes),
    original_context_seal: expected.original_seal, artifact_snapshot_seal: snapshot.sha256,
    original_bind_success: false, source_head_tree_xcresult_verified: false, original_UI_head_external: context.source_head,
    original_app_version: context.app_version, original_app_build: context.app_build, parser_checkout_external: parser,
    expected_configuration_id_stays_null: true, reader_seed_role: 'Writable byte-identical input seed; official tools target a separate v6-owned reader copy only.' };
  const file = path.join(output, 'derived-artifact-context.json'); put(output, 'derived-artifact-context.json', derived);
  put(output, 'artifact-snapshot-preseal.json', snapshot); protectTree(original);
  return { context: file, seed, original_context_sha256: sha(contextBytes), snapshot };
}

export async function reparseExistingArtifact(output, token, parser) {
  assert.match(parser.head, /^[a-f0-9]{40}$/); assert.match(parser.tree, /^[a-f0-9]{40}$/);
  assert.notEqual(parser.head, RAW_ARTIFACT.head_sha, 'Parser checkout is separate from original UI head');
  mkdirSync(output, { mode: 0o700 });
  let original = null, originalInventory = null, zip = null, code = 1, summary = null, originalFailureVerified = false;
  try {
    zip = await downloadExistingArtifact(output, token); original = path.join(output, 'original-artifact');
    put(output, 'ZIP-validation.json', extractExistingArtifact(zip, original)); originalInventory = fingerprintResult(original);
    put(output, 'original-artifact.before.json', originalInventory); protectTree(original);
    const derived = prepareDerivedContext(original, output, parser); originalFailureVerified = true;
    summary = captureAppMemory({ result: derived.seed, context: derived.context, output: path.join(output, 'reparse-capture') }); code = captureExitCode(summary);
  } catch (error) { code = error instanceof UnknownReparseEvidence ? 2 : 1; summary = { status: code === 2 ? 'raw-unbound-awaiting-binding-review' : 'failed-or-unavailable', safe_error: error instanceof UnknownReparseEvidence ? error.message : 'Acquisition, ZIP, original identity or reader check failed; inspect bounded receipts.', measurements: null }; }
  finally {
    try {
      if (zip) assert.equal(sha(readFileSync(zip)), RAW_ARTIFACT.zip_sha256);
      if (originalInventory) { const after = fingerprintResult(original); put(output, 'original-artifact.after.json', after); assert.deepEqual(after, originalInventory); }
      if (readdirSync(output).length > 0) { const retained = fingerprintResult(output); assert.ok(retained.files.reduce((sum, file) => sum + file.bytes, 0) <= 64 * 1024 * 1024, 'Retained artifact bound'); }
    } catch { code = 1; summary = { ...summary, status: 'failed-or-unavailable', safe_error: 'Original preservation or retained-output bound failed', measurements: null }; }
  }
  put(output, 'reparse-summary.json', { schema_version: 1, status: summary.status, exit_code: code,
    original_run: RAW_ARTIFACT.run_id, original_job_id_external: RAW_ARTIFACT.job_id, original_head_external: RAW_ARTIFACT.head_sha, original_app_version: RAW_ARTIFACT.app_version, original_app_build: RAW_ARTIFACT.app_build,
    parser_checkout_external: parser, original_collector_failure_preserved: true, original_failure_verified_in_this_run: originalFailureVerified, original_bind_success: false,
    source_attestation: false, external_configuration_id: null, metric_adoption: null, normalization: null, product_budget: null,
    new_build_Simulator_UI_measurements: 0, capture_summary: summary });
  return code;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2); assert.ok(args.length === 2 && args[0] === '--output');
    const parser = JSON.parse(process.env.PARSER_CHECKOUT_CONTEXT);
    process.exitCode = await reparseExistingArtifact(path.resolve(args[1]), process.env.GITHUB_TOKEN, parser);
    console.log(JSON.stringify({ status: 'existing-artifact-reparse-finished-unadopted', exit_code: process.exitCode, details: 'owned reparse-summary.json; no token or download URL output' }));
  } catch { console.error(JSON.stringify({ status: 'failed-or-unavailable', safe_error: 'Reparse setup failed; request details redacted', metric_adoption: null })); process.exitCode = 1; }
}
