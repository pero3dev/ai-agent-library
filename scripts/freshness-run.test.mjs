import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { acquireLock, releaseLock, automaticMode, applyCompletion, parseArgs, loadState, main, storageDirectory, interruptedRuns } from './freshness-run.mjs';

const blank = () => ({ schema_version: 1, systems: {}, pending: [], runs: {} });
const now = new Date('2026-09-10T01:00:00Z');

function temporaryDirectory(t) {
  const parent = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(parent, 'freshness-run-test-'));
  t.after(() => {
    const actual = fs.realpathSync(dir);
    const relative = path.relative(parent, actual);
    assert.equal(path.dirname(relative), '.');
    assert.ok(path.basename(relative).startsWith('freshness-run-test-'));
    assert.ok(!path.isAbsolute(relative) && !relative.startsWith('..'));
    fs.rmSync(actual, { recursive: true, force: true });
  });
  return dir;
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function gitFixture(t) {
  const directory = temporaryDirectory(t);
  const root = path.join(directory, 'checkout');
  fs.mkdirSync(root);
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init', '-b', 'main');
  git('config', 'user.name', 'Freshness Fixture');
  git('config', 'user.email', 'fixture@example.invalid');
  for (const file of ['docs/01-concepts/models.md', 'docs/08-coding-agents/coding.md', 'research/core/models.md']) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), '# Fixture\n');
  }
  fs.writeFileSync(path.join(root, 'ROADMAP.md'), [
    '<!-- freshness-registry:start -->',
    '| ID | 系統 | 記事対象 | 調査起点 | 周期(日) |',
    '| --- | --- | --- | --- | --- |',
    '| `models-prompting` | モデル | `docs/01-concepts/*.md` | `research/core/*.md` | 7 |',
    '| `coding-agents` | コーディング | `docs/08-coding-agents/*.md` | `research/core/*.md` | 7 |',
    '<!-- freshness-registry:end -->',
    ''
  ].join('\n'));
  fs.writeFileSync(path.join(root, 'GLOSSARY.md'), '# Fixture glossary\n');
  fs.writeFileSync(path.join(root, 'README.md'), '# Fixture index\n');
  git('add', '--', 'docs', 'research', 'ROADMAP.md', 'GLOSSARY.md', 'README.md');
  git('commit', '-m', 'Initialize isolated fixture');
  git('update-ref', 'refs/remotes/origin/main', 'HEAD');
  return { directory, root, git, dir: storageDirectory(root), run: (...args) => main([...args, '--root', root]) };
}
test('weekly mode uses JST rather than runner timezone', () => {
  assert.equal(automaticMode(new Date('2026-09-13T22:23:00Z')), 'weekly_focus');
  assert.equal(automaticMode(new Date('2026-09-16T22:23:00Z')), 'rotation');
});
test('locks exclude other worktrees and reject release by another run', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'freshness-lock-test-'));
  acquireLock(dir, 'run-one', now);
  assert.throws(() => acquireLock(dir, 'run-two', now), /owns the lock/);
  assert.throws(() => releaseLock(dir, 'run-two'), /owner changed/);
  releaseLock(dir, 'run-one');
  acquireLock(dir, 'run-two', now);
  releaseLock(dir, 'run-two');
  fs.rmdirSync(dir);
});
test('unfinished observations do not move last verified date', () => {
  const initial = blank();
  initial.systems.models = { last_verified_at: '2026-08-01T00:00:00Z' };
  const result = applyCompletion(initial, { run_id: 'run-one', systems: ['models'], pending: [{ id: 'source-1', system_id: 'models', reason: 'Access restricted', next_retry_at: '2026-10-01T00:00:00Z' }] }, 'held', now);
  assert.equal(result.systems.models.last_verified_at, initial.systems.models.last_verified_at);
  assert.equal(result.systems.models.next_retry_at, '2026-10-01T00:00:00Z');
  assert.equal(result.pending.length, 1);
  assert.equal(initial.pending.length, 0);
});
test('pending evidence cannot simultaneously certify a whole system', () => {
  assert.throws(() => applyCompletion(blank(), { run_id: 'run-one', systems: ['models'], completed_systems: ['models'], pending: [{ id: 'one', system_id: 'models', reason: 'Not fetched' }] }, 'observed', now), /fully verified/);
});
test('unrelated pending IDs survive completion and repeat does not duplicate items', () => {
  const initial = blank();
  initial.pending = [{ id: 'other', system_id: 'coding', reason: 'Pending' }];
  const checkpoint = { run_id: 'run-one', systems: ['models'], pending: [{ id: 'one', system_id: 'models', reason: 'Pending' }] };
  const first = applyCompletion(initial, checkpoint, 'held', now);
  const second = applyCompletion(first, checkpoint, 'held', now);
  assert.deepEqual(second.pending.map(item => item.id), ['other', 'one']);
});
test('merge completion requires real identifiers and is distinct from observation', () => {
  assert.throws(() => applyCompletion(blank(), { run_id: 'run-one', systems: ['models'] }, 'merged', now), /merge SHA/);
  const result = applyCompletion(blank(), { run_id: 'run-one', systems: ['models'], completed_systems: ['models'] }, 'observed', now);
  assert.equal(result.systems.models.last_verified_at, now.toISOString());
  assert.equal(result.runs['run-one'].merge_sha, null);
});
test('invalid run IDs and CLI flags are rejected before file operations', () => {
  assert.throws(() => acquireLock('unused', '../escape'), /Invalid run/);
  assert.throws(() => parseArgs(['prepare', '--mode']), /Missing/);
  assert.throws(() => parseArgs(['prepare', '--shell', 'x']), /Unknown/);
});
test('missing local state starts empty without pretending an earlier audit was current', () => {
  assert.deepEqual(loadState(path.join(os.tmpdir(), `absent-${Date.now()}`)), blank());
});

test('interrupted checkpoint resumes the same run, selected systems, pending items and notes', t => {
  const fixture = gitFixture(t);
  const first = fixture.run('prepare', '--mode', 'manual', '--ids', 'models-prompting');
  const checkpoint = JSON.parse(fs.readFileSync(first.checkpoint, 'utf8'));
  checkpoint.pending = [{ id: 'official-unavailable', system_id: 'models-prompting', reason: 'Official page requires another verification', next_retry_at: '2030-01-01T00:00:00Z' }];
  checkpoint.notes = ['Confirmed the release note; pricing remains unverified.'];
  const input = path.join(fixture.directory, 'checkpoint-input.json');
  writeJson(input, checkpoint);
  fixture.run('checkpoint', '--run', input);
  assert.equal(loadState(fixture.dir).systems['models-prompting']?.last_verified_at, undefined);
  assert.equal(loadState(fixture.dir).runs[first.run_id], undefined);
  fixture.run('release', '--run-id', first.run_id, '--attempt-id', first.attempt_id);

  const resumed = fixture.run('prepare', '--mode', 'manual', '--ids', 'coding-agents');
  assert.equal(resumed.resuming, true);
  assert.equal(resumed.run_id, first.run_id);
  assert.notEqual(resumed.attempt_id, first.attempt_id);
  assert.equal(resumed.base_sha, first.base_sha);
  assert.deepEqual(resumed.systems, ['models-prompting']);
  assert.deepEqual(resumed.pending, checkpoint.pending);
  assert.deepEqual(resumed.notes, checkpoint.notes);
  assert.equal(resumed.checkpoint, first.checkpoint);
  fixture.run('release', '--run-id', resumed.run_id, '--attempt-id', resumed.attempt_id);
});

test('unresolved persisted pending prevents certification even if checkpoint pending is empty', () => {
  const initial = blank();
  initial.pending = [{ id: 'prior-unknown', system_id: 'models', reason: 'Source unavailable in preceding run' }];
  initial.systems.models = { last_verified_at: '2026-08-01T00:00:00Z' };
  const checkpoint = { run_id: 'run-current', systems: ['models'], completed_systems: ['models'], pending: [] };
  assert.throws(() => applyCompletion(initial, checkpoint, 'observed', now), /Existing pending items/);
  assert.equal(initial.systems.models.last_verified_at, '2026-08-01T00:00:00Z');
  const resolved = applyCompletion(initial, { ...checkpoint, resolved_pending_ids: ['prior-unknown'] }, 'observed', now);
  assert.equal(resolved.pending.length, 0);
  assert.equal(resolved.systems.models.last_verified_at, now.toISOString());
});

test('pending IDs cannot be resolved or overwritten by an unrelated system', () => {
  const initial = blank();
  initial.pending = [{ id: 'coding-source', system_id: 'coding', reason: 'Needs a different observer' }];
  const checkpoint = { run_id: 'run-current', systems: ['models'], pending: [] };
  assert.throws(() => applyCompletion(initial, { ...checkpoint, resolved_pending_ids: ['coding-source'] }, 'held', now), /another system/);
  assert.throws(() => applyCompletion(initial, {
    ...checkpoint, pending: [{ id: 'coding-source', system_id: 'models', reason: 'Attempted ID takeover' }]
  }, 'held', now), /different system/);
  assert.deepEqual(initial.pending, [{ id: 'coding-source', system_id: 'coding', reason: 'Needs a different observer' }]);
});

test('unknown resolved IDs are rejected instead of silently losing a misspelled follow-up', () => {
  const initial = blank();
  initial.pending = [{ id: 'source-real', system_id: 'models', reason: 'Needs verification' }];
  assert.throws(() => applyCompletion(initial, {
    run_id: 'run-current', systems: ['models'], resolved_pending_ids: ['source-typo'], pending: []
  }, 'held', now), /Unknown resolved pending|unknown pending|not found/i);
});

test('committed completion suppresses a stale in-progress checkpoint after a crash', t => {
  const fixture = gitFixture(t);
  const first = fixture.run('prepare', '--mode', 'manual', '--ids', 'models-prompting');
  const checkpoint = JSON.parse(fs.readFileSync(first.checkpoint, 'utf8'));
  checkpoint.completed_systems = ['models-prompting'];
  const input = path.join(fixture.directory, 'finished-input.json');
  writeJson(input, checkpoint);
  fixture.run('finish', '--run', input, '--outcome', 'observed');
  const verifiedAt = loadState(fixture.dir).systems['models-prompting'].last_verified_at;
  // Simulate interruption after state.json was saved but before the checkpoint status was saved.
  writeJson(first.checkpoint, { ...checkpoint, status: 'in_progress' });
  assert.deepEqual(interruptedRuns(fixture.dir), []);
  const next = fixture.run('prepare', '--mode', 'manual', '--ids', 'coding-agents');
  assert.equal(next.resuming, false);
  assert.notEqual(next.run_id, first.run_id);
  assert.deepEqual(next.systems, ['coding-agents']);
  assert.equal(loadState(fixture.dir).systems['models-prompting'].last_verified_at, verifiedAt);
  fixture.run('release', '--run-id', next.run_id, '--attempt-id', next.attempt_id);
});

test('expired lock is reclaimed once and stale owner cannot release the new owner', t => {
  const dir = temporaryDirectory(t);
  const first = acquireLock(dir, 'run-expired', now);
  const boundary = new Date(first.expires_at);
  assert.throws(() => acquireLock(dir, 'run-new', new Date(boundary.getTime() - 1)), /owns the lock/);
  acquireLock(dir, 'run-new', boundary);
  const retained = fs.readdirSync(dir).filter(name => name.startsWith('expired-lock-'));
  assert.equal(retained.length, 1);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, retained[0], 'owner.json'), 'utf8')).run_id, 'run-expired');
  assert.throws(() => releaseLock(dir, 'run-expired'), /owner changed/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'lock', 'owner.json'), 'utf8')).run_id, 'run-new');
  releaseLock(dir, 'run-new');
});

test('linked worktrees share a single freshness lock and state directory', t => {
  const fixture = gitFixture(t);
  const worktree = path.join(fixture.directory, 'linked-worktree');
  fixture.git('worktree', 'add', '--detach', worktree, 'HEAD');
  assert.equal(storageDirectory(worktree), fixture.dir);
  acquireLock(fixture.dir, 'run-primary', now);
  assert.throws(() => acquireLock(storageDirectory(worktree), 'run-linked', now), /owns the lock/);
  releaseLock(fixture.dir, 'run-primary');
});

test('recovery mutex blocks both acquisition and release without altering lock ownership', t => {
  const dir = temporaryDirectory(t);
  const owner = acquireLock(dir, 'run-owner', now);
  const mutex = path.join(dir, 'lock-mutex');
  fs.mkdirSync(mutex);
  assert.throws(() => acquireLock(dir, 'run-racer', new Date(owner.expires_at)), /recovery is already running/);
  assert.throws(() => releaseLock(dir, 'run-owner'), /recovery is already running/);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'lock', 'owner.json'), 'utf8')), owner);
  fs.rmdirSync(mutex);
  releaseLock(dir, 'run-owner');
  assert.equal(fs.existsSync(path.join(dir, 'lock')), false);
});

test('expired same-run recovery fences the old attempt from releasing the replacement owner', t => {
  const dir = temporaryDirectory(t);
  const expired = acquireLock(dir, 'run-resumed', now);
  const replacement = acquireLock(dir, 'run-resumed', new Date(expired.expires_at));
  assert.equal(replacement.run_id, expired.run_id);
  assert.notEqual(replacement.attempt_id, expired.attempt_id);
  assert.match(replacement.attempt_id, /^[a-f0-9-]{36}$/);
  assert.throws(() => releaseLock(dir, expired.run_id, expired.attempt_id), /owner changed/);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'lock', 'owner.json'), 'utf8')), replacement);
  releaseLock(dir, replacement.run_id, replacement.attempt_id);
  assert.equal(fs.existsSync(path.join(dir, 'lock')), false);
});

test('resumed CLI run rejects the prior attempt for publication, checkpoint, completion and release', t => {
  const fixture = gitFixture(t);
  const first = fixture.run('prepare', '--mode', 'manual', '--ids', 'models-prompting');
  const oldCheckpoint = JSON.parse(fs.readFileSync(first.checkpoint, 'utf8'));
  const staleInput = path.join(fixture.directory, 'stale-input.json');
  writeJson(staleInput, oldCheckpoint);
  const ownerFile = path.join(fixture.dir, 'lock', 'owner.json');
  const expiredOwner = JSON.parse(fs.readFileSync(ownerFile, 'utf8'));
  writeJson(ownerFile, { ...expiredOwner, expires_at: '2000-01-01T00:00:00Z' });

  const resumed = fixture.run('prepare', '--mode', 'rotation');
  assert.equal(resumed.run_id, first.run_id);
  assert.notEqual(resumed.attempt_id, first.attempt_id);
  assert.throws(() => fixture.run('assert-lock', '--run-id', first.run_id, '--attempt-id', first.attempt_id), /current lock attempt/);
  assert.throws(() => fixture.run('release', '--run-id', first.run_id, '--attempt-id', first.attempt_id), /current lock attempt/);
  assert.throws(() => fixture.run('release', '--run-id', first.run_id), /--attempt-id.*required/);
  assert.throws(() => fixture.run('checkpoint', '--run', staleInput), /current lock attempt/);
  assert.throws(() => fixture.run('finish', '--run', staleInput, '--outcome', 'observed'), /current lock attempt/);
  const missingAttemptInput = path.join(fixture.directory, 'missing-attempt-input.json');
  const { attempt_id: omittedAttempt, ...missingAttempt } = oldCheckpoint;
  assert.equal(omittedAttempt, first.attempt_id);
  writeJson(missingAttemptInput, missingAttempt);
  assert.throws(() => fixture.run('checkpoint', '--run', missingAttemptInput), /attempt/i);
  assert.throws(() => fixture.run('finish', '--run', missingAttemptInput, '--outcome', 'observed'), /attempt/i);
  assert.equal(loadState(fixture.dir).runs[first.run_id], undefined);
  assert.equal(JSON.parse(fs.readFileSync(ownerFile, 'utf8')).attempt_id, resumed.attempt_id);
  assert.equal(fixture.run('assert-lock', '--run-id', resumed.run_id, '--attempt-id', resumed.attempt_id).ok, true);
  fixture.run('release', '--run-id', resumed.run_id, '--attempt-id', resumed.attempt_id);
});

test('checkpoint pending survives interruption and repeated resolution is idempotent through finish', t => {
  const fixture = gitFixture(t);
  const prepared = fixture.run('prepare', '--mode', 'manual', '--ids', 'models-prompting');
  const checkpoint = JSON.parse(fs.readFileSync(prepared.checkpoint, 'utf8'));
  const input = path.join(fixture.directory, 'pending-resolution-input.json');
  const pending = { id: 'checkpoint-source', system_id: 'models-prompting', reason: 'Official source did not respond', next_retry_at: '2030-01-01T00:00:00Z' };
  checkpoint.pending = [pending];
  writeJson(input, checkpoint);
  fixture.run('checkpoint', '--run', input, '--attempt-id', prepared.attempt_id);
  const pendingState = loadState(fixture.dir);
  assert.deepEqual(pendingState.pending, [{ ...pending, run_id: prepared.run_id }]);
  assert.deepEqual(pendingState.systems, {});
  assert.deepEqual(pendingState.runs, {});
  fixture.run('release', '--run-id', prepared.run_id, '--attempt-id', prepared.attempt_id);

  const resumed = fixture.run('prepare', '--mode', 'rotation');
  assert.equal(resumed.run_id, prepared.run_id);
  assert.deepEqual(resumed.previous_pending, [{ ...pending, run_id: prepared.run_id }]);
  const resolution = JSON.parse(fs.readFileSync(resumed.checkpoint, 'utf8'));
  resolution.pending = [];
  resolution.resolved_pending_ids = [pending.id];
  resolution.completed_systems = ['models-prompting'];
  writeJson(input, resolution);
  fixture.run('checkpoint', '--run', input, '--attempt-id', resumed.attempt_id);
  const resolvedState = loadState(fixture.dir);
  assert.deepEqual(resolvedState.pending, []);
  assert.deepEqual(resolvedState.pending_resolutions[pending.id], { run_id: prepared.run_id, system_id: 'models-prompting' });
  assert.deepEqual(resolvedState.systems, {});
  assert.deepEqual(resolvedState.runs, {});
  fixture.run('checkpoint', '--run', input, '--attempt-id', resumed.attempt_id);
  assert.deepEqual(loadState(fixture.dir), resolvedState);
  const unknown = { ...resolution, resolved_pending_ids: ['never-pending'] };
  writeJson(input, unknown);
  assert.throws(() => fixture.run('checkpoint', '--run', input, '--attempt-id', resumed.attempt_id), /Unknown resolved pending/i);
  assert.deepEqual(loadState(fixture.dir), resolvedState);
  writeJson(input, resolution);
  fixture.run('finish', '--run', input, '--attempt-id', resumed.attempt_id, '--outcome', 'observed');
  const finishedState = loadState(fixture.dir);
  assert.deepEqual(finishedState.pending, []);
  assert.ok(finishedState.systems['models-prompting'].last_verified_at);
  assert.equal(finishedState.runs[prepared.run_id].outcome, 'observed');
});

test('checkpoint snapshots article and research changes without changing index, branch or working files', t => {
  const fixture = gitFixture(t);
  const prepared = fixture.run('prepare', '--mode', 'manual', '--ids', 'models-prompting');
  const article = path.join(fixture.root, 'docs/01-concepts/models.md');
  fs.writeFileSync(article, '# Staged article\n');
  fixture.git('add', '--', 'docs/01-concepts/models.md');
  fs.writeFileSync(article, '# Article edited after staging\n');
  fs.appendFileSync(path.join(fixture.root, 'ROADMAP.md'), '\nFollow-up observation.\n');
  fs.appendFileSync(path.join(fixture.root, 'GLOSSARY.md'), '\nUpdated term.\n');
  fs.appendFileSync(path.join(fixture.root, 'README.md'), '\nUpdated index.\n');
  fs.writeFileSync(path.join(fixture.root, 'research/core/new-observation.md'), '# New untracked research\n');
  fs.writeFileSync(path.join(fixture.root, 'scratch-local.txt'), 'Unrelated staged work\n');
  fs.writeFileSync(path.join(fixture.root, '.env'), 'FIXTURE_SECRET=do-not-snapshot\n');
  fs.writeFileSync(path.join(fixture.root, 'research/core/private.env'), 'FIXTURE_SECRET=do-not-snapshot\n');
  fixture.git('add', '--', 'scratch-local.txt');
  const headBefore = fixture.git('rev-parse', 'HEAD');
  const branchBefore = fixture.git('symbolic-ref', 'HEAD');
  const statusBefore = fixture.git('status', '--porcelain=v1', '--untracked-files=all');
  const indexFile = path.resolve(fixture.root, fixture.git('rev-parse', '--git-path', 'index'));
  const indexBefore = fs.readFileSync(indexFile);
  const workingFiles = ['docs/01-concepts/models.md', 'ROADMAP.md', 'GLOSSARY.md', 'README.md', 'research/core/new-observation.md', 'scratch-local.txt', '.env', 'research/core/private.env'];
  const beforeContents = workingFiles.map(file => fs.readFileSync(path.join(fixture.root, file), 'utf8'));

  fixture.run('checkpoint', '--run', prepared.checkpoint, '--attempt-id', prepared.attempt_id);
  const saved = JSON.parse(fs.readFileSync(prepared.checkpoint, 'utf8'));
  assert.match(saved.snapshot_commit, /^[a-f0-9]{40}$/);
  assert.equal(saved.snapshot_head, headBefore);
  assert.equal(fixture.git('rev-parse', `refs/freshness/checkpoints/${prepared.run_id}`), saved.snapshot_commit);
  assert.equal(fixture.git('rev-parse', `${saved.snapshot_commit}^`), headBefore);
  assert.equal(fixture.git('show', `${saved.snapshot_commit}:docs/01-concepts/models.md`), '# Article edited after staging');
  assert.equal(fixture.git('show', `${saved.snapshot_commit}:research/core/new-observation.md`), '# New untracked research');
  assert.match(fixture.git('show', `${saved.snapshot_commit}:ROADMAP.md`), /Follow-up observation/);
  assert.match(fixture.git('show', `${saved.snapshot_commit}:GLOSSARY.md`), /Updated term/);
  assert.match(fixture.git('show', `${saved.snapshot_commit}:README.md`), /Updated index/);
  const snapshotFiles = new Set(fixture.git('ls-tree', '-r', '--name-only', saved.snapshot_commit).split('\n'));
  assert.equal(snapshotFiles.has('scratch-local.txt'), false);
  assert.equal(snapshotFiles.has('.env'), false);
  assert.equal(snapshotFiles.has('research/core/private.env'), false);
  assert.deepEqual(fs.readFileSync(indexFile), indexBefore);
  assert.equal(fixture.git('rev-parse', 'HEAD'), headBefore);
  assert.equal(fixture.git('symbolic-ref', 'HEAD'), branchBefore);
  assert.equal(fixture.git('status', '--porcelain=v1', '--untracked-files=all'), statusBefore);
  assert.deepEqual(workingFiles.map(file => fs.readFileSync(path.join(fixture.root, file), 'utf8')), beforeContents);
  fixture.run('release', '--run-id', prepared.run_id, '--attempt-id', prepared.attempt_id);
});

test('suspend persists unfinished work and PR then releases its attempt for same-run resumption', t => {
  const fixture = gitFixture(t);
  const prepared = fixture.run('prepare', '--mode', 'manual', '--ids', 'models-prompting');
  const checkpoint = JSON.parse(fs.readFileSync(prepared.checkpoint, 'utf8'));
  checkpoint.pr_url = 'https://github.com/pero3dev/ai-agent-library/pull/999';
  checkpoint.notes = ['Independent review passed; waiting for CI.'];
  checkpoint.pending = [{ id: 'source-still-unavailable', system_id: 'models-prompting', reason: 'Source remains inaccessible' }];
  const input = path.join(fixture.directory, 'suspended-input.json');
  writeJson(input, checkpoint);
  fixture.run('suspend', '--run', input, '--attempt-id', prepared.attempt_id);
  assert.equal(fs.existsSync(path.join(fixture.dir, 'lock')), false);
  const saved = JSON.parse(fs.readFileSync(prepared.checkpoint, 'utf8'));
  assert.equal(saved.status, 'in_progress');
  assert.match(saved.snapshot_commit, /^[a-f0-9]{40}$/);
  assert.equal(loadState(fixture.dir).runs[prepared.run_id], undefined);
  assert.equal(loadState(fixture.dir).pending[0].id, 'source-still-unavailable');
  const resumed = fixture.run('prepare', '--mode', 'rotation');
  assert.equal(resumed.run_id, prepared.run_id);
  assert.notEqual(resumed.attempt_id, prepared.attempt_id);
  assert.equal(resumed.resuming, true);
  assert.equal(resumed.pr_url, checkpoint.pr_url);
  assert.deepEqual(resumed.notes, checkpoint.notes);
  assert.equal(resumed.snapshot_commit, saved.snapshot_commit);
  fixture.run('release', '--run-id', resumed.run_id, '--attempt-id', resumed.attempt_id);
});
