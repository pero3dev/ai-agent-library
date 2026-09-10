import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { main, storage, pathAllowed, validateContract, readProfiles, reconcile } from './harness-run.mjs';
import { saveGeneration, recoverGeneration, queuedRuns, budgetStatus, acquireLock, releaseLock, snapshotOwned } from './lib/harness-state.mjs';

const json = (file, data) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(data)); };
function fixture(t) {
  const base = fs.realpathSync(os.tmpdir());
  const directory = fs.mkdtempSync(path.join(base, 'harness-runtime-test-'));
  t.after(() => {
    const resolved = fs.realpathSync(directory);
    assert.equal(path.dirname(resolved), base);
    assert.ok(path.basename(resolved).startsWith('harness-runtime-test-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  const root = path.join(directory, 'checkout'); fs.mkdirSync(root);
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init', '-b', 'main'); git('config', 'user.name', 'Harness Fixture'); git('config', 'user.email', 'fixture@example.invalid');
  for (const file of ['scripts/example.mjs', 'docs/01-concepts/article.md', 'website/app/page.tsx']) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), 'original\n');
  }
  git('add', '.'); git('commit', '-m', 'Fixture'); git('update-ref', 'refs/remotes/origin/main', 'HEAD'); git('switch', '-c', 'task/fixture');
  const contract = path.join(directory, 'contract.json');
  json(contract, { profile: 'harness', goal: 'Maintain one validation script', authorization: 'User requested implementation', owned_paths: ['scripts/example.mjs'], completion: 'local' });
  const deps = { runLocalCheck: () => ({ type: 'mock-local', command: 'fixture only', passed: true }) };
  const run = (...args) => main([...args, '--root', root], deps);
  return { base, directory, root, git, contract, deps, run, ...storage(root) };
}
const active = async f => f.run('start', '--contract', f.contract);
const release = (f, record) => f.run('release', '--run-id', record.run_id, '--attempt-id', record.attempt_id);

test('profiles reject traversal, generated files, credentials and broadened freshness work', () => {
  const profiles = readProfiles();
  for (const file of ['../private.md', 'scripts/../../x.md', 'C:/x.md', 'scripts/.env', 'scripts/auth.json', 'website/out/index.html', 'website/content/page.md']) assert.equal(pathAllowed(file, profiles.harness), false, file);
  assert.equal(pathAllowed('scripts/test.mjs', profiles.harness), true);
  assert.equal(pathAllowed('website/app/page.tsx', profiles.website), true);
  assert.equal(pathAllowed('scripts/test.mjs', profiles['article-update']), false);
  assert.throws(() => validateContract({ profile: 'freshness', goal: 'x', authorization: 'x', owned_paths: ['scripts/'] }), /freshness uses/);
  assert.throws(() => validateContract({ profile: 'harness', goal: 'x', authorization: 'x', owned_paths: ['scripts/../website/'] }), /outside profile/);
});

test('start and all dry-run variants preserve files; repeated start reuses the active task', async t => {
  const f = fixture(t);
  const before = f.git('status', '--porcelain=v1');
  const dry = await f.run('start', '--contract', f.contract, '--dry-run');
  assert.equal(dry.dry_run, true); assert.equal(fs.existsSync(f.dir), false);
  const record = await active(f);
  const saved = fs.readFileSync(record.checkpoint, 'utf8');
  for (const command of ['checkpoint', 'finish', 'verify']) assert.equal((await f.run(command, '--run-id', record.run_id, '--dry-run')).dry_run, true);
  assert.equal(fs.readFileSync(record.checkpoint, 'utf8'), saved);
  const duplicate = await active(f); assert.equal(duplicate.run_id, record.run_id); assert.equal(duplicate.status, 'existing_run');
  assert.equal(f.git('status', '--porcelain=v1'), before);
  await release(f, record);
});

test('general work and freshness use a shared lock while keeping separate records', async t => {
  const f = fixture(t), record = await active(f);
  assert.throws(() => acquireLock(f.locks, 'freshness-other'), /owns the lock/);
  assert.ok(fs.existsSync(path.join(f.dir, 'state.json')));
  assert.equal(fs.existsSync(path.join(f.locks, 'state.json')), false);
  await release(f, record);
});

test('checkpoint snapshots only owned files and leaves the user index and other work unchanged', async t => {
  const f = fixture(t), record = await active(f);
  fs.writeFileSync(path.join(f.root, 'scripts/example.mjs'), 'owned change\n');
  fs.writeFileSync(path.join(f.root, 'docs/01-concepts/article.md'), 'other author change\n');
  fs.writeFileSync(path.join(f.root, '.env'), 'FIXTURE_SECRET=excluded\n');
  f.git('add', 'docs/01-concepts/article.md');
  const status = f.git('status', '--porcelain=v1');
  const index = fs.readFileSync(path.join(f.root, '.git/index'));
  const saved = await f.run('checkpoint', '--run-id', record.run_id, '--attempt-id', record.attempt_id);
  assert.equal(f.git('show', `${saved.snapshot_commit}:scripts/example.mjs`), 'owned change');
  assert.equal(f.git('show', `${saved.snapshot_commit}:docs/01-concepts/article.md`), 'original');
  assert.equal(f.git('status', '--porcelain=v1'), status);
  assert.deepEqual(fs.readFileSync(path.join(f.root, '.git/index')), index);
  assert.doesNotMatch(f.git('ls-tree', '-r', '--name-only', saved.snapshot_commit), /\.env/);
  await release(f, record);
});

test('a lost linked worktree restores its snapshot into a clean detached worktree', async t => {
  const f = fixture(t);
  const lost = path.join(f.directory, 'lost'), replacement = path.join(f.directory, 'replacement');
  f.git('worktree', 'add', '--detach', lost, 'HEAD');
  const record = await main(['start', '--contract', f.contract, '--root', lost], f.deps);
  fs.writeFileSync(path.join(lost, 'scripts/example.mjs'), 'recover this exact work\n');
  const saved = await main(['suspend', '--run-id', record.run_id, '--attempt-id', record.attempt_id, '--root', lost], f.deps);
  assert.equal(path.dirname(path.resolve(lost)), f.directory);
  f.git('worktree', 'remove', '--force', lost);
  f.git('worktree', 'add', '--detach', replacement, 'HEAD');
  const resumed = await main(['resume', '--run-id', record.run_id, '--apply', '--root', replacement], f.deps);
  assert.equal(resumed.restored, true);
  assert.equal(fs.readFileSync(path.join(replacement, 'scripts/example.mjs'), 'utf8').replaceAll('\r\n', '\n'), 'recover this exact work\n');
  assert.equal(resumed.snapshot_commit, saved.snapshot_commit);
  await main(['release', '--run-id', resumed.run_id, '--attempt-id', resumed.attempt_id, '--root', replacement], f.deps);
});

test('resume preserves a dirty worktree and invalidates review after main or PR head drift', async t => {
  const f = fixture(t), record = await active(f);
  fs.writeFileSync(path.join(f.root, 'scripts/example.mjs'), 'saved work\n');
  const saved = await f.run('suspend', '--run-id', record.run_id, '--attempt-id', record.attempt_id);
  assert.equal(reconcile(f.root, saved).action, 'preserve_worktree');
  const before = fs.readFileSync(path.join(f.root, 'scripts/example.mjs'), 'utf8');
  const resumed = await f.run('resume', '--run-id', record.run_id, '--apply');
  assert.equal(resumed.restored, false); assert.equal(fs.readFileSync(path.join(f.root, 'scripts/example.mjs'), 'utf8'), before);
  await release(f, resumed);
  f.git('add', 'scripts/example.mjs'); f.git('commit', '-m', 'Integrate new main fixture'); f.git('update-ref', 'refs/remotes/origin/main', 'HEAD');
  assert.equal(reconcile(f.root, saved).action, 'rebase_and_review');
  assert.equal(reconcile(f.root, { ...saved, head_sha: '1'.repeat(40) }, { state: 'OPEN', headRefOid: '2'.repeat(40) }).action, 'pr_head_changed');
  assert.equal(reconcile(f.root, saved, { state: 'MERGED' }).action, 'verify_publication');
});

test('resume fences the previous attempt and refuses changing ownership through input JSON', async t => {
  const f = fixture(t), record = await active(f);
  await f.run('suspend', '--run-id', record.run_id, '--attempt-id', record.attempt_id);
  const resumed = await f.run('resume', '--run-id', record.run_id);
  await assert.rejects(f.run('checkpoint', '--run-id', record.run_id, '--attempt-id', record.attempt_id), /current lock attempt/);
  const input = path.join(f.directory, 'changed-contract.json');
  json(input, { ...resumed, owned_paths: ['scripts/', 'docs/'] });
  await assert.rejects(f.run('checkpoint', '--run', input, '--attempt-id', resumed.attempt_id), /contract field/);
  await release(f, resumed);
});

test('queue keeps external and decision waits while selecting runnable work', () => {
  const base = { started_at: '2026-09-10T00:00:00Z' };
  const q = queuedRuns([{ ...base, run_id: 'ready' }, { ...base, run_id: 'ci', queue_state: 'waiting_external', next_eligible_at: '2026-09-11T00:00:00Z' }, { ...base, run_id: 'decision', queue_state: 'needs_decision' }], new Date('2026-09-10T01:00:00Z'));
  assert.deepEqual(q.ready.map(run => run.run_id), ['ready']);
  assert.equal(q.waiting_external.length, 1); assert.equal(q.needs_decision.length, 1);
});

test('usage limit saves WIP and releases ownership without claiming completion', async t => {
  const f = fixture(t), record = await active(f);
  fs.writeFileSync(path.join(f.root, 'scripts/example.mjs'), 'preserve at limit\n');
  const saved = await f.run('checkpoint', '--run-id', record.run_id, '--attempt-id', record.attempt_id, '--usage-limit');
  assert.equal(saved.released, true); assert.equal(saved.queue_state, 'waiting_external'); assert.equal(saved.status, 'in_progress');
  assert.equal(saved.budget_status.usage, 'not_observed');
  assert.equal(f.git('show', `${saved.snapshot_commit}:scripts/example.mjs`), 'preserve at limit');
  assert.equal((await f.run('resume', '--run-id', record.run_id)).status, 'waiting');
  assert.equal(budgetStatus({ budget: { deadline_at: '2026-09-10T01:00:00Z', save_margin_seconds: 120 } }, new Date('2026-09-10T00:58:00Z')).must_save, true);
});

for (const phase of ['journal', 'state.json', 'runs/run-crash.json']) test(`journal recovers an interruption after ${phase} without rewriting during inspection`, t => {
  const f = fixture(t);
  const state = { schema_version: 1, generation: 0, runs: { 'run-crash': { status: 'in_progress' } } };
  const record = { schema_version: 1, run_id: 'run-crash', status: 'in_progress', notes: ['Saved before interruption'] };
  assert.throws(() => saveGeneration(f.dir, state, record, { fault: current => { if (current === phase) throw new Error('simulated interruption'); } }), /simulated/);
  const journal = fs.readFileSync(path.join(f.dir, 'journal.json'), 'utf8');
  assert.equal(recoverGeneration(f.dir).needed, true);
  assert.equal(fs.readFileSync(path.join(f.dir, 'journal.json'), 'utf8'), journal);
  recoverGeneration(f.dir, { dryRun: false });
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.dir, 'state.json'))).generation, 1);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.dir, 'runs/run-crash.json'))).notes, record.notes);
  assert.equal(recoverGeneration(f.dir).needed, false);
});

test('snapshot saved before the journal is discoverable after interruption', async t => {
  const f = fixture(t), record = await active(f);
  fs.writeFileSync(path.join(f.root, 'scripts/example.mjs'), 'orphan snapshot\n');
  const saved = snapshotOwned(f.root, f.dir, record.run_id, { candidates: record.owned_paths, accepts: file => file === 'scripts/example.mjs' });
  const result = reconcile(f.root, record);
  assert.equal(result.orphan_snapshot, true); assert.equal(result.snapshot_commit, saved.snapshot_commit);
  await release(f, record);
});

test('final completion requires current local evidence and performs GitHub verification again', async t => {
  const f = fixture(t);
  const contract = JSON.parse(fs.readFileSync(f.contract, 'utf8')); contract.completion = 'published'; json(f.contract, contract);
  const record = await active(f);
  await assert.rejects(f.run('finish', '--run-id', record.run_id, '--attempt-id', record.attempt_id), /local verify/);
  await f.run('verify', '--run-id', record.run_id, '--attempt-id', record.attempt_id);
  let calls = 0;
  f.deps.verifyGithubEvidence = () => { calls++; return { verified: true, merge_sha: '1'.repeat(40), publication: { verified: true } }; };
  await f.run('verify', '--run-id', record.run_id, '--attempt-id', record.attempt_id, '--external');
  assert.equal(calls, 1);
  f.deps.verifyGithubEvidence = () => { calls++; throw new Error('current GitHub check failed'); };
  await assert.rejects(f.run('finish', '--run-id', record.run_id, '--attempt-id', record.attempt_id), /current GitHub/);
  assert.equal(calls, 2);
  await release(f, record);
});

test('unsupported stored schema is reported without automatic migration', async t => {
  const f = fixture(t), file = path.join(f.dir, 'state.json');
  const legacy = '{"schema_version":99,"legacy":"preserve"}'; fs.mkdirSync(f.dir, { recursive: true }); fs.writeFileSync(file, legacy);
  const status = await f.run('status', '--dry-run');
  assert.equal(status.compatibility.migration_required, true);
  assert.equal(status.compatibility.automatic_migration, false);
  assert.equal(fs.readFileSync(file, 'utf8'), legacy);
});
