import { array, object, objects, jsonObject, jsonArray, match, optionalMessage } from './contracts.mts'
type CommandRecord = { name?: string; label?: string; binary: string; arguments: string[]; exit_code: number | null; signal: NodeJS.Signals | null; error: unknown }
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const outcomes = Object.fromEntries(['TOOLCHAIN', 'SOURCES', 'GENERATION', 'ARCHIVE', 'PACKAGE', 'BINARY']
  .map((name) => [name.toLowerCase(), process.env[name + '_OUTCOME']]));
const auditFile = path.join(process.env.EVIDENCE_DIR!, 'archive-audit.json');
const audit = existsSync(auditFile) ? jsonObject(readFileSync(auditFile, 'utf8')) : null;
const complete = Object.values(outcomes).every((value) => value === 'success') && audit?.status === 'passed';
const summary = {
  schema_version: 1, status: complete ? 'signing-disabled-archive-compatibility-observed' : 'failed-or-incomplete',
  outcomes, source_head: process.env.EXPECTED_SOURCE_HEAD, archive_audit_status: audit?.status ?? 'unavailable',
  distribution_acceptance: 'unadopted', paid_or_larger_runner_adoption: false, local_OS_adoption: false,
  signed_export_upload: false, Simulator_device_UI_VoiceOver_performance: 'not-run-in-this-workflow'
};
writeFileSync(path.join(process.env.EVIDENCE_DIR!, 'preflight-summary.json'),
  JSON.stringify(summary, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
console.log(JSON.stringify(summary, null, 2));
