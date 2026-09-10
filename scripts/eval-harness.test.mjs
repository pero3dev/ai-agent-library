import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseOptions, summarizeEvents, assertArchiveTree, assertUnlinked, articleStatus, prepareExecutionEnvironment, executionEnvironment, seedDependencies, consoleSummary, SCRATCH_DIRECTORY } from './eval-harness.mjs';

function fixture(t) {
  const parent = fs.realpathSync.native(os.tmpdir());
  const directory = fs.mkdtempSync(path.join(parent, 'harness-eval-path-'));
  t.after(() => {
    const actual = fs.realpathSync.native(directory);
    assert.equal(path.dirname(actual), parent);
    assert.ok(path.basename(actual).startsWith('harness-eval-path-'));
    fs.rmSync(actual, { recursive: true, force: true });
  });
  const checkout = path.join(directory, 'checkout');
  fs.mkdirSync(checkout);
  const git = (...args) => {
    const result = spawnSync('git', args, { cwd: checkout, encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout;
  };
  git('init', '-b', 'main');
  return { directory, checkout, git };
}

test('evaluation never invokes an Agent implicitly and rejects ambiguous execution modes', () => {
  assert.equal(parseOptions([]).mode, 'fixture');
  for (const args of [['--mode', 'live'], ['--binary'], ['--mode', 'agent'], ['--mode', 'collect'], ['--scenario', '../other']]) assert.throws(() => parseOptions(args));
});
test('archive extraction refuses symlinks and submodules before any writes', () => {
  assertArchiveTree(`100644 blob ${'a'.repeat(40)}\tROADMAP.md\0`);
  for (const mode of ['120000', '160000']) assert.throws(() => assertArchiveTree(`${mode} blob ${'a'.repeat(40)}\tROADMAP.md\0`));
  for (const name of [SCRATCH_DIRECTORY, `${SCRATCH_DIRECTORY}/source.txt`, `${SCRATCH_DIRECTORY.toUpperCase()}/source.txt`, '.git/config']) assert.throws(() => assertArchiveTree(`100644 blob ${'a'.repeat(40)}\t${name}\0`), /collides/);
});
test('evaluation ownership rejects dangling links and traversal', t => {
  const { directory } = fixture(t);
  assert.throws(() => assertUnlinked(path.dirname(directory), directory));
  const linked = path.join(directory, 'linked');
  fs.symlinkSync(path.join(directory, 'missing'), linked, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => assertUnlinked(path.join(linked, 'evaluation.json'), directory));
});

test('prepared child processes use only the dedicated ignored scratch area for temporary files', t => {
  const { directory, checkout, git } = fixture(t);
  const contract = prepareExecutionEnvironment(checkout, directory);
  const parent = { ...process.env, HARNESS_TEST_PARENT: 'retained', TEMP: 'do-not-use', TMP: 'do-not-use', TMPDIR: 'do-not-use', NODE_DISABLE_COMPILE_CACHE: '0', NPM_CONFIG_CACHE: 'do-not-use' };
  const environment = executionEnvironment(contract, parent);
  const result = spawnSync(process.execPath, ['-e', "const os=require('node:os'),fs=require('node:fs'),path=require('node:path');fs.writeFileSync(path.join(os.tmpdir(),'child-check.txt'),'ok');fs.writeFileSync(path.join(process.env.npm_config_cache,'seed-check.txt'),'ok');console.log(JSON.stringify({temp:os.tmpdir(),cache:process.env.npm_config_cache,disabled:process.env.NODE_DISABLE_COMPILE_CACHE,parent:process.env.HARNESS_TEST_PARENT}))"], { cwd: checkout, env: environment, encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr);
  const observed = JSON.parse(result.stdout);
  assert.equal(observed.temp, contract.temporary_directory);
  assert.equal(observed.cache, contract.npm_cache_directory);
  assert.equal(environment.NPM_CONFIG_CACHE, undefined);
  assert.equal(observed.disabled, '1'); assert.equal(observed.parent, 'retained');
  assert.equal(parent.TEMP, 'do-not-use', 'the parent process environment is not changed');
  assert.equal(fs.readFileSync(path.join(contract.temporary_directory, 'child-check.txt'), 'utf8'), 'ok');
  assert.equal(git('status', '--porcelain=v1', '--untracked-files=all'), '');
  assert.equal(git('check-ignore', `${SCRATCH_DIRECTORY}/tmp/child-check.txt`).trim(), `${SCRATCH_DIRECTORY}/tmp/child-check.txt`);
  const activeExcludes = fs.readFileSync(path.join(checkout, '.git/info/exclude'), 'utf8').split(/\r?\n/).filter(line => line.trim() && !line.startsWith('#'));
  assert.deepEqual(activeExcludes, [`/${SCRATCH_DIRECTORY}/`]);
  assert.deepEqual(Object.keys(contract.environment).sort(), ['NODE_DISABLE_COMPILE_CACHE', 'TEMP', 'TMP', 'TMPDIR', 'npm_config_cache']);
});

test('scratch name collisions preserve archived content without changing the Git exclusion', t => {
  const { directory, checkout } = fixture(t);
  const scratch = path.join(checkout, SCRATCH_DIRECTORY);
  fs.writeFileSync(scratch, 'archived content');
  const exclude = fs.readFileSync(path.join(checkout, '.git/info/exclude'), 'utf8');
  assert.throws(() => prepareExecutionEnvironment(checkout, directory), /already exists/);
  assert.equal(fs.readFileSync(scratch, 'utf8'), 'archived content');
  assert.equal(fs.readFileSync(path.join(checkout, '.git/info/exclude'), 'utf8'), exclude);
});

test('scratch preparation rejects linked or outside paths before writing through them', t => {
  const { directory, checkout } = fixture(t);
  const outside = path.join(directory, 'outside');
  fs.mkdirSync(outside);
  assert.throws(() => prepareExecutionEnvironment(outside, checkout), /escaped|owned run checkout/);
  const link = path.join(checkout, SCRATCH_DIRECTORY);
  fs.symlinkSync(outside, link, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => prepareExecutionEnvironment(checkout, directory), /Linked/);
  assert.deepEqual(fs.readdirSync(outside), []);
});

test('scratch preparation rejects a linked Git info directory and does not create scratch first', t => {
  const { directory, checkout } = fixture(t);
  const gitInfo = path.join(checkout, '.git/info');
  const outside = path.join(directory, 'outside-info');
  fs.renameSync(gitInfo, outside);
  fs.symlinkSync(outside, gitInfo, process.platform === 'win32' ? 'junction' : 'dir');
  const before = fs.readFileSync(path.join(outside, 'exclude'), 'utf8');
  assert.throws(() => prepareExecutionEnvironment(checkout, directory), /Linked/);
  assert.equal(fs.existsSync(path.join(checkout, SCRATCH_DIRECTORY)), false);
  assert.equal(fs.readFileSync(path.join(outside, 'exclude'), 'utf8'), before);
});

test('launch environment refuses missing, modified and newly linked scratch directories', t => {
  for (const key of ['temporary_directory', 'npm_cache_directory']) {
    const { directory, checkout } = fixture(t);
    const contract = prepareExecutionEnvironment(checkout, directory);
    assert.throws(() => executionEnvironment({ ...contract, cwd: 'relative' }), /Invalid/);
    assert.throws(() => executionEnvironment({ ...contract, environment: { ...contract.environment, NODE_OPTIONS: '--eval=unexpected' } }), /Invalid/);
    const old = path.join(contract.scratch_directory, 'old-directory');
    fs.renameSync(contract[key], old);
    assert.throws(() => executionEnvironment(contract));
    fs.symlinkSync(old, contract[key], process.platform === 'win32' ? 'junction' : 'dir');
    assert.throws(() => executionEnvironment(contract), /Linked/);
  }
});

test('dependency preparation seeds the same child cache and records attempted installation failures', t => {
  const { directory, checkout } = fixture(t);
  const contract = prepareExecutionEnvironment(checkout, directory);
  const prepared = { directory, checkout, execution_contract: contract };
  const recordFile = path.join(directory, 'evaluation.json');
  fs.writeFileSync(recordFile, JSON.stringify({ schema_version: 1, execution_contract: contract }));
  const environment = seedDependencies(prepared, (binary, args, options) => {
    assert.equal(binary, process.platform === 'win32' ? 'npm.cmd' : 'npm');
    assert.deepEqual(args, ['ci', '--ignore-scripts']);
    assert.equal(options.cwd, checkout);
    assert.equal(options.env.npm_config_cache, contract.npm_cache_directory);
    assert.equal(options.env.TEMP, contract.temporary_directory);
    assert.equal(JSON.parse(fs.readFileSync(recordFile, 'utf8')).dependency_install.result, 'running');
    fs.writeFileSync(path.join(options.env.npm_config_cache, 'seed.txt'), 'offline fixture');
  });
  assert.equal(fs.readFileSync(path.join(environment.npm_config_cache, 'seed.txt'), 'utf8'), 'offline fixture');
  assert.equal(JSON.parse(fs.readFileSync(recordFile, 'utf8')).dependency_install.result, 'passed');
  assert.throws(() => seedDependencies(prepared, () => { throw new Error('installation failed'); }), /installation failed/);
  const failed = JSON.parse(fs.readFileSync(recordFile, 'utf8')).dependency_install;
  assert.equal(failed.result, 'failed');
  assert.ok(Date.parse(failed.completed_at) >= Date.parse(failed.started_at));
});

test('stdout previews disclose omissions while preserving every saved-summary path and command', () => {
  const report = { schema_version: 1, evidence_class: 'actual-agent', summary_file: '/owned/summary.json', changes: Array.from({ length: 650 }, (_, i) => `?? research/cache-${i}`), committed_changes: [], observed: { command_count: 30, commands: Array.from({ length: 30 }, () => 'node check') } };
  const original = JSON.stringify(report);
  const summary = consoleSummary(report);
  assert.equal(summary.changes_count, 650);
  assert.equal(summary.changes_preview.length, 10);
  assert.equal(summary.preview_truncated, true);
  assert.equal(summary.full_report, report.summary_file);
  assert.equal(summary.observed.commands_saved, 30);
  assert.equal(summary.observed.commands, undefined);
  assert.equal(JSON.stringify(report), original);
  assert.ok(JSON.stringify(summary).length < 2000);
});
test('article status comes only from valid front matter, never the article code', () => {
  assert.equal(articleStatus('---\nstatus: "published" # confirmed\n---\n```yaml\nstatus: draft\n```'), 'published');
  assert.equal(articleStatus('```yaml\nstatus: draft\n```'), null);
  assert.equal(articleStatus('---\nstatus: "draft"\n---\n'), 'draft');
});
test('event evidence distinguishes failed commands, failed turns, and unavailable usage', () => {
  const lines = [{ type: 'thread.started', thread_id: 'owned' }, { type: 'item.completed', item: { type: 'command_execution', command: 'node check', exit_code: 1 } }, { type: 'turn.failed' }].map(value => JSON.stringify(value)).join('\n');
  const result = summarizeEvents(lines);
  assert.equal(result.command_count, 1); assert.equal(result.command_failures, 1); assert.equal(result.failed_turns, 1); assert.equal(result.completed_turns, 0); assert.equal(result.usage, null);
  assert.throws(() => summarizeEvents('not-json'));
});
