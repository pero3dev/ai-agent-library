import { array, object, objects, jsonObject, jsonArray, match, optionalMessage } from './contracts.mts'
type CommandRecord = { name?: string; label?: string; binary: string; arguments: string[]; exit_code: number | null; signal: NodeJS.Signals | null; error: unknown }
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { closeSync, copyFileSync, lstatSync, mkdirSync, openSync, readSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const source = process.env.EVIDENCE_DIR!, target = path.join(path.dirname(source), 'artifact');
const budget = 16 * 1024 * 1024, reserved = 128 * 1024, rawCap = 256 * 1024, metadataCap = 1024 * 1024;
const diagnosticCap = 4 * 1024 * 1024;
const diagnosticName = /^reader-diagnostic-(?:summary\.json|(?:devices|geometry|attachments-help|attachments-export)\.(?:stdout\.log|stderr\.log|exit\.json)|attachment-\d{3}\.(?:png|json|txt))$/;
const entries: Record<string, unknown>[] = [], rejected: string[] = [];
let retained = 0, diagnosticBytes = 0;
mkdirSync(target, { mode: 0o700 });
const put = (name: string, data: Uint8Array) => {
  assert.ok(retained + data.length <= budget - reserved, 'Artifact total budget exceeded');
  writeFileSync(path.join(target, name), data, { flag: 'wx', mode: 0o600 }); retained += data.length;
};
const slice = (file: string, bytes: number, start: number) => {
  const fd = openSync(file, 'r');
  try { const data = Buffer.alloc(bytes); assert.equal(readSync(fd, data, 0, bytes, start), bytes); return data; }
  finally { closeSync(fd); }
};
const files = readdirSync(source).sort();
try {
  assert.ok(files.length <= 256, 'Evidence entry count exceeds finite staging limit');
  for (const name of files) {
    const file = path.join(source, name), stat = lstatSync(file);
    if (stat.isDirectory()) { entries.push({ name, retention: 'omitted-binary-result-directory' }); continue; }
    assert.ok(stat.isFile() && !stat.isSymbolicLink(), 'Only direct regular evidence files are allowed');
    const diagnostic = name.startsWith('reader-diagnostic-');
    if (diagnostic) {
      match(name, diagnosticName, 'Only the named diagnostic outputs may be staged');
      diagnosticBytes += stat.size;
      assert.ok(diagnosticBytes <= diagnosticCap, 'Diagnostic artifact budget exceeded');
    }
    const attachment = /^reader-diagnostic-attachment-\d{3}\.(?:png|json|txt)$/.test(name);
    assert.ok(/^[A-Za-z0-9._-]+\.(?:json|log|plist)$/.test(name) || attachment);
    const isRaw = name.endsWith('.log');
    const cap = attachment ? (name.endsWith('.png') ? 1024 * 1024 : 128 * 1024)
      : name === 'reader-diagnostic-summary.json' ? 128 * 1024 : isRaw ? rawCap : metadataCap;
    if (attachment && name.endsWith('.png')) {
      assert.ok(stat.size >= 8 && stat.size <= cap, 'Failure PNG size exceeds cap');
      assert.ok(slice(file, 8, 0).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'Failure PNG signature required');
    }
    if (stat.size <= cap) {
      const bytes = slice(file, stat.size, 0); put(name, bytes);
      entries.push({ name, original_bytes: stat.size, retained_bytes: bytes.length, complete: true,
        SHA256: createHash('sha256').update(bytes).digest('hex') });
    } else {
      const head = slice(file, rawCap / 4, 0), tail = slice(file, rawCap * 3 / 4, stat.size - rawCap * 3 / 4);
      put(name + '.head.log', head); put(name + '.tail.log', tail);
      entries.push({ name, original_bytes: stat.size, retained_bytes: head.length + tail.length, complete: false,
        head_file: name + '.head.log', tail_file: name + '.tail.log', reason: 'explicit bounded raw portions; middle not retained' });
      if (!isRaw) rejected.push(name + ': required metadata exceeds limit');
    }
  }
} catch (error) { rejected.push(String(error)); }
const report: Record<string, unknown> = { schema_version: 1, status: rejected.length ? 'artifact-scope-rejected' : 'bounded-evidence-staged',
  source_head: process.env.EXPECTED_SOURCE_HEAD, budget_bytes: budget, retained_payload_bytes: retained,
  raw_file_cap_bytes: rawCap, metadata_file_cap_bytes: metadataCap,
  diagnostic_cap_bytes: diagnosticCap, diagnostic_source_bytes: diagnosticBytes, entries, rejected,
  xcarchive_app_xcresult_retained: false, scope: 'Logs above cap retain literal head/tail portions with incomplete=true; not complete raw logs.' };
const bytes = Buffer.from(JSON.stringify(report, null, 2) + '\n');
assert.ok(bytes.length <= reserved && retained + bytes.length <= budget);
writeFileSync(path.join(target, 'artifact-scope.json'), bytes, { flag: 'wx', mode: 0o600 });
assert.deepEqual(rejected, [], 'Required metadata or artifact staging limits failed; inspect bounded evidence');
