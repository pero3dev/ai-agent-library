import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOptions, summarizeEvents } from './eval-harness.mjs';

test('evaluation never invokes an Agent implicitly and rejects ambiguous execution modes', () => {
  assert.equal(parseOptions([]).mode, 'fixture');
  for (const args of [['--mode', 'live'], ['--binary'], ['--mode', 'agent'], ['--mode', 'collect'], ['--scenario', '../other']]) assert.throws(() => parseOptions(args));
});
test('event evidence distinguishes failed commands, failed turns, and unavailable usage', () => {
  const lines = [{ type: 'thread.started', thread_id: 'owned' }, { type: 'item.completed', item: { type: 'command_execution', command: 'node check', exit_code: 1 } }, { type: 'turn.failed' }].map(value => JSON.stringify(value)).join('\n');
  const result = summarizeEvents(lines);
  assert.equal(result.command_count, 1); assert.equal(result.command_failures, 1); assert.equal(result.failed_turns, 1); assert.equal(result.completed_turns, 0); assert.equal(result.usage, null);
  assert.throws(() => summarizeEvents('not-json'));
});
