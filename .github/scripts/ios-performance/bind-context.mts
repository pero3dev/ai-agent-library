import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { performanceScenario, bindLongScrollInput } from '../../../ios/tests/export-performance.mjs';
const selected = performanceScenario(process.env.PERFORMANCE_SCENARIO!);
if (selected.method !== process.env.PERFORMANCE_TEST_METHOD) throw new Error('Selected scenario and test method differ');
const read = (binary: string, args: string[]) => execFileSync(binary, args, { encoding: 'utf8' }).trim();
const expected = Number(process.env.PUBLISHED_ARTICLE_COUNT);
const app = '.local/ios-performance/DebugDerivedData/Build/Products/Debug-iphonesimulator/AILibrary.app';
const packageAudit = record(JSON.parse(readFileSync('.local/ios-performance/evidence/debug-app-package.json', 'utf8')) as unknown);
if (!Number.isInteger(expected) || expected < 4 || packageAudit.status !== 'passed' || packageAudit.articles !== expected) {
  throw new Error('The actual Debug package must match the independently counted full source set');
}
const context: Record<string, unknown> = {
  source_head: read('git', ['rev-parse', 'HEAD']),
  source_tree: read('git', ['rev-parse', 'HEAD^{tree}']),
  source_sha256: Object.fromEntries([".github/workflows/ios-performance.yml","ios/AILibraryUITests/PublishedPerformanceUITests.swift","ios/tests/export-performance.mjs","ios/tests/export-performance.mts","tests/unit/ios-performance-export.test.mjs","tests/unit/ios-performance-export.test.mts",".github/scripts/ios-performance/count-published.mts",".github/scripts/ios-performance/bind-context.mts"].map(file => [file, createHash('sha256').update(readFileSync(file)).digest('hex')])),
  configuration: 'Debug', expected_articles: expected, actual_app_package: packageAudit,
  app_version: read('/usr/bin/plutil', ['-extract', 'CFBundleShortVersionString', 'raw', '-o', '-', app + '/Info.plist']),
  app_build: read('/usr/bin/plutil', ['-extract', 'CFBundleVersion', 'raw', '-o', '-', app + '/Info.plist']),
  Xcode: read('xcodebuild', ['-version']),
  host_architecture: read('uname', ['-m']),
  host_model: read('/usr/sbin/sysctl', ['-n', 'hw.model']),
  host_memory_bytes: read('/usr/sbin/sysctl', ['-n', 'hw.memsize']),
  locale: 'ja_JP', text_size: 'fresh Simulator default, not overridden',
  appearance: 'fresh Simulator default, not overridden',
  scenario: selected.name, test_method: selected.method, search_witness: (selected as typeof selected & {search_witness?: unknown}).search_witness ?? null,
  declared_recorded_iterations: 3,
  discarded_warmup_invocations: 1,
  test_source_sha256: createHash('sha256').update(readFileSync('ios/AILibraryUITests/PublishedPerformanceUITests.swift')).digest('hex'),
  limits: 'The package audit warmed file caches before launches. No disk-cold, first-install, Release, physical-device or product-target claim.'
};
if (selected.name === 'long-article-bounded-scroll') {
  context.scroll_witness = selected.scroll_witness;
  context.scroll_input_binding = bindLongScrollInput(
    readFileSync(selected.scroll_witness.source_path),
    readFileSync(app + '/Content/manifest.json'),
    readFileSync(app + '/Content/' + selected.scroll_witness.document_path), packageAudit);
}
writeFileSync('.local/ios-performance/evidence/context.json', JSON.stringify(context, null, 2) + '\n');

// JSON receipts and process output remain untrusted until their consumed fields are checked.
function record(value: unknown): Record<string, unknown> {
  assert.ok(value !== null && typeof value === 'object' && !Array.isArray(value), 'Expected JSON object');
  return value as Record<string, unknown>;
}
