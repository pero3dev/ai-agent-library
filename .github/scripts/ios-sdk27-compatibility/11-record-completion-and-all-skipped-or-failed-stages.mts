import { array, object, objects, jsonObject, jsonArray, match, optionalMessage } from './contracts.mts'
type CommandRecord = { name?: string; label?: string; binary: string; arguments: string[]; exit_code: number | null; signal: NodeJS.Signals | null; error: unknown }
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const outcomes = Object.fromEntries(['INVENTORY', 'ROOT_AUDIT', 'ROOT_INSTALL', 'TOOLS_AUDIT', 'TOOLS_INSTALL', 'BROWSER', 'CONTENT', 'SIMULATOR', 'UI', 'APP', 'RESULTS', 'CLEANUP']
  .map((key) => [key.toLowerCase(), process.env[key + '_OUTCOME']]));
const completed = Object.values(outcomes).every((value) => value === 'success');
let failure = null;
try {
  assert.ok(completed, 'Skipped, failed, cancelled or unknown stages are not successful acceptance');
  const accepted = jsonObject(readFileSync(path.join(process.env.EVIDENCE_DIR!, 'ui-acceptance.json'), 'utf8'));
  assert.equal(accepted.status, 'exact-three-cases-passed');
  const cleanup = jsonObject(readFileSync(path.join(process.env.EVIDENCE_DIR!, 'cleanup.json'), 'utf8'));
  assert.ok((['owned-simulator-deleted', 'already-absent'] as readonly unknown[]).includes(cleanup.status));
} catch (error) { failure = String(error); }
const result = { schema_version: 1, status: failure === null ? 'representative-new-runtime-smoke-passed' : 'not-completed',
  source_head: process.env.EXPECTED_SOURCE_HEAD, outcomes,
  failure,
  coverage: 'Existing NativeReaderUITests exact3 on iOS27.0/iPhone17 only; separate representative3/fixture4 resource audits',
  minimum_iOS17_physical_VoiceOver_performance: 'not-verified' };
writeFileSync(path.join(process.env.EVIDENCE_DIR!, 'summary.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
assert.equal(failure, null);
