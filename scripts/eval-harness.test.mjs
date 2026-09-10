import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseOptions, summarizeEvents, assertArchiveTree, assertUnlinked, articleStatus } from './eval-harness.mjs';

test('evaluation never invokes an Agent implicitly and rejects ambiguous execution modes', () => {
  assert.equal(parseOptions([]).mode, 'fixture');
  for (const args of [['--mode', 'live'], ['--binary'], ['--mode', 'agent'], ['--mode', 'collect'], ['--scenario', '../other']]) assert.throws(() => parseOptions(args));
});
test('archive extraction refuses symlinks and submodules before any writes', () => {
  assertArchiveTree(`100644 blob ${'a'.repeat(40)}\tROADMAP.md\0`);
  for (const mode of ['120000', '160000']) assert.throws(() => assertArchiveTree(`${mode} blob ${'a'.repeat(40)}\tROADMAP.md\0`));
});
test('evaluation ownership rejects dangling links and traversal', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-eval-path-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  assert.throws(() => assertUnlinked(path.dirname(directory), directory));
  const linked = path.join(directory, 'linked');
  fs.symlinkSync(path.join(directory, 'missing'), linked, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => assertUnlinked(path.join(linked, 'evaluation.json'), directory));
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
