import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const repo = process.cwd(), root = path.join(repo, '.local/ios-memory');
const evidence = path.join(root, 'evidence'), raw = path.join(evidence, 'raw');
const stage = process.argv[2]!, expected = process.env.EXPECTED_SOURCE_HEAD!;
const scenario = 'published-article-app-memory', method = 'testPublishedArticleAppMemory';
const selector = 'AILibraryUITests/PublishedPerformanceUITests/testPublishedArticleAppMemory';
const sourceFiles = [".github/workflows/ios-memory.yml","ios/AILibraryUITests/PublishedPerformanceUITests.swift","ios/tests/export-memory.mjs","tests/unit/ios-memory-export.test.mjs","ios/tests/export-memory.mts","tests/unit/ios-memory-export.test.mts",".github/scripts/ios-memory/driver.mts"];
const commandNames = ['inventory-head','inventory-tree','inventory-diff','xcode','runtimes','device-types',
  'audit-root','install-root','audit-native','install-native','install-chromium','tracked-docs',
  'generate-published','generate-fixtures','audit-content','audit-fixtures','audit-package','audit-fixture-package',
  'devices-before','create-simulator','boot-simulator','bootstatus','devices-after-boot','devices-after-boot-recovery',
  'build-head','build-diff','build','debug-package','debug-fixture','app-id','app-version','app-build',
  'measure-head','measure-diff','measure','export','cleanup-devices-before','cleanup-shutdown','cleanup-delete',
  'cleanup-devices-after'];
const digest = (b: import('node:crypto').BinaryLike) => createHash('sha256').update(b).digest('hex');
const strictText = (b: Uint8Array) => new TextDecoder('utf-8', { fatal: true }).decode(b);
const present = (location: string) => { try { fs.lstatSync(location); return true; } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false; throw error; } };
const smallError = (e: unknown) => String((e as {message?: unknown} | null)?.message ?? e).slice(0, 4096);
let compactOwned = false; const compactProof = new Map<string, { bytes: number; sha256: string; cap: number }>();
const uuidPattern = /^[A-Fa-f0-9]{8}(?:-[A-Fa-f0-9]{4}){3}-[A-Fa-f0-9]{12}$/;
const file = (dir: string, name: string) => {
  assert.ok(name && !path.isAbsolute(name) && !name.split('/').some(x => !x || x === '.' || x === '..'));
  assert.equal(fs.realpathSync(dir), dir);
  const location = path.join(dir, name);
  assert.equal(fs.realpathSync(path.dirname(location)), path.dirname(location));
  return location;
};
const regular = (location: string, cap = 512 * 1024) => {
  const st = fs.lstatSync(location);
  assert.ok(st.isFile() && !st.isSymbolicLink() && st.nlink === 1, location);
  assert.ok(st.size <= cap, location + ': byte cap');
  assert.equal(fs.realpathSync(location), location);
  return fs.readFileSync(location);
};
const put = (name: string, bytes: string | Uint8Array) => {
  const location = file(evidence, name);
  const fd = fs.openSync(location, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL |
    fs.constants.O_NOFOLLOW, 0o600);
  try { fs.writeFileSync(fd, bytes); } finally { fs.closeSync(fd); }
  assert.equal(fs.lstatSync(location).nlink, 1);
};
const json = (name: string, value: unknown) => put(name, JSON.stringify(value, null, 2) + '\n');
const read = (name: string) => record(JSON.parse(strictText(regular(file(evidence, name)))) as unknown);
const ownerContext = () => ({ expected_source_head: expected, repository: process.env.GITHUB_REPOSITORY,
  run_id: process.env.GITHUB_RUN_ID!, run_attempt: process.env.GITHUB_RUN_ATTEMPT!, event_name: process.env.OBSERVATION_EVENT });
const workStages = new Set(['inventory','dependencies','content','simulator','build','audit','measure']);
const remaining = (cap: number, deadline?: number) => {
  const ends = [Date.now() + cap];
  if (workStages.has(stage)) ends.push(number(read('budget.json').work_deadline_epoch_ms));
  if (deadline !== undefined) ends.push(deadline);
  return Math.floor(Math.min(...ends) - Date.now());
};
const run = (name: string, binary: string, args: string[], cap: number, options: { deadline?: number; cwd?: string; maxBuffer?: number; allowFailure?: boolean } = {}) => {
  assert.ok(commandNames.includes(name), name);
  const timeout = remaining(cap, options.deadline);
  json('raw/' + name + '.intent.json', { ...ownerContext(), binary, arguments: args, cwd: options.cwd ?? repo,
    timeout_ms: Math.max(0, timeout), spawn_planned: timeout > 0, resource_bound_not_product_budget: true });
  const started = Date.now();
  let result: { status: number | null; signal: NodeJS.Signals | null; stdout?: Buffer; stderr?: Buffer; error?: unknown };
  try {
    result = timeout > 0 ? spawnSync(binary, args, { cwd: options.cwd ?? repo, timeout,
      killSignal: 'SIGKILL', maxBuffer: options.maxBuffer ?? 16 * 1024 * 1024 }) :
      { status: null, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0),
        error: new Error('The reserved work/stage deadline was exhausted before spawn') };
  } catch (error) { result = { status: null, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0), error }; }
  const out = result.stdout ?? Buffer.alloc(0), err = result.stderr ?? Buffer.alloc(0);
  put('raw/' + name + '.stdout.log', out); put('raw/' + name + '.stderr.log', err);
  json('raw/' + name + '.exit.json', { ...ownerContext(), binary, arguments: args, timeout_ms: Math.max(0, timeout),
    elapsed_ms: Date.now() - started, exit_code: result.status, signal: result.signal,
    error: result.error ? smallError(result.error) : null, output_complete: !result.error,
    stdout_bytes: out.length, stdout_sha256: digest(out), stderr_bytes: err.length, stderr_sha256: digest(err) });
  if (result.error || result.status !== 0) {
    const error = new Error(name + ': bounded command failed: ' + (result.error ? smallError(result.error) : result.status));
    (error as Error & { exitCode: number }).exitCode = result.status === 2 ? 2 : 1;
    if (!options.allowFailure) throw error;
  }
  return { stdout: out, stderr: err, status: result.status, error: result.error };
};
const text = (...args: Parameters<typeof run>) => strictText(run(...args).stdout).trim();
const sameHead = (prefix: string) => {
  assert.match(expected, /^[0-9a-f]{40}$/);
  assert.equal(text(prefix + '-head', 'git', ['rev-parse', 'HEAD'], 15000), expected);
  text(prefix + '-diff', 'git', ['diff', '--exit-code', 'HEAD', '--', ...sourceFiles], 15000);
};
const sources = () => Object.fromEntries(sourceFiles.map(name => [name, digest(regular(path.join(repo, name), 1024 * 1024))]));
const deviceRows = (tree: Record<string, unknown>) => {
  assert.ok(tree && tree.devices && typeof tree.devices === 'object' && !Array.isArray(tree.devices));
  return Object.entries(tree.devices).flatMap(([runtime, rows]) => {
    assert.ok(Array.isArray(rows));
    return records(rows).map(device => { assert.match(string(device.udid), uuidPattern); return { runtime, device }; });
  });
};
const readOwner = () => {
  const intent = read('simulator-intent.json'), created = read('raw/create-simulator.exit.json');
  assert.equal(intent.source_head, expected); assert.equal(intent.run_id, process.env.GITHUB_RUN_ID);
  assert.equal(intent.run_attempt, process.env.GITHUB_RUN_ATTEMPT);
  assert.equal(intent.repository, process.env.GITHUB_REPOSITORY); assert.match(intent.token as string, uuidPattern);
  assert.equal(intent.name, 'AILibrary-memory-' + intent.run_id + '-' + intent.run_attempt + '-' + intent.token);
  assert.equal(intent.runtime_identifier, 'com.apple.CoreSimulator.SimRuntime.iOS-18-5');
  assert.equal(intent.device_type_identifier, 'com.apple.CoreSimulator.SimDeviceType.iPhone-16');
  assert.equal(created.exit_code, 0); assert.equal(created.error, null); assert.equal(created.output_complete, true);
  assert.equal(created.expected_source_head, expected); assert.equal(created.run_id, intent.run_id);
  assert.equal(created.run_attempt, intent.run_attempt); assert.equal(created.repository, intent.repository);
  assert.deepEqual(created.arguments, ['simctl','create',intent.name,intent.device_type_identifier,intent.runtime_identifier]);
  const uuidBytes = regular(path.join(raw, 'create-simulator.stdout.log'), 1024);
  assert.equal(created.stdout_bytes, uuidBytes.length); assert.equal(created.stdout_sha256, digest(uuidBytes));
  const UUID = strictText(uuidBytes).trim().toUpperCase();
  assert.match(UUID, uuidPattern); assert.ok(!strings(intent.preexisting_UUIDs).includes(UUID));
  if (present(file(evidence, 'owned-simulator.json'))) {
    const recorded = read('owned-simulator.json'); assert.equal(recorded.UUID, UUID); assert.equal(recorded.name, intent.name);
    assert.equal(recorded.source_head, expected); assert.equal(recorded.run_id, intent.run_id);
    assert.equal(recorded.run_attempt, intent.run_attempt); assert.equal(recorded.token, intent.token);
  }
  assertOwner(intent);
  return { ...intent, UUID };
};
const buildArgs = (owned: { UUID: string }) => ['-project', 'ios/AILibrary.xcodeproj', '-scheme', 'AILibrary', '-configuration', 'Debug',
  '-destination', 'platform=iOS Simulator,id=' + owned.UUID, '-destination-timeout', '120',
  '-derivedDataPath', path.join(root, 'DerivedData'), '-parallel-testing-enabled', 'NO', '-jobs', '2'];
const boundedDiagnosticExcerpt = (bytes: Buffer, cap: number) => {
  assert.ok(Buffer.isBuffer(bytes) && Number.isSafeInteger(cap) && cap >= 1024);
  if (bytes.length <= cap) return { bytes, truncated: false, prefix_bytes: bytes.length, tail_bytes: 0,
    marker_bytes: 0, omitted_bytes: 0, retention: 'complete-captured-command-output' };
  const marker = Buffer.from('\n[bounded diagnostic excerpt: middle bytes omitted]\n');
  const prefix = Math.floor((cap - marker.length) / 4), tail = cap - marker.length - prefix;
  return { bytes: Buffer.concat([bytes.subarray(0, prefix), marker, bytes.subarray(bytes.length - tail)]),
    truncated: true, prefix_bytes: prefix, tail_bytes: tail, marker_bytes: marker.length,
    omitted_bytes: bytes.length - prefix - tail, retention: 'prefix-and-tail-with-explicit-marker' };
};
const compact = () => {
  const target = path.join(root, 'compact'); fs.mkdirSync(target, { mode: 0o700 }); compactOwned = true;
  const aggregateCap = 2 * 1024 * 1024, payloadCap = aggregateCap - 73728;
  const entries: { path: string; bytes: number; sha256: string }[] = [], omitted: {path: string; reason: string; bytes?: number; sha256?: string}[] = []; let bytes = 0;
  const include = (location: string, name: string, cap: number) => {
    if (!present(location)) return;
    try {
      const st = fs.lstatSync(location); assert.ok(st.isFile() && !st.isSymbolicLink() && st.nlink === 1);
      assert.equal(fs.realpathSync(location), location);
      const b = fs.readFileSync(location), receipt = { path: name, bytes: b.length, sha256: digest(b) };
      if (b.length > cap || bytes + b.length > payloadCap || entries.length >= 180) {
        omitted.push({ ...receipt, reason: 'compact-size-or-member-cap; metric bytes were not truncated' }); return;
      }
      const dest = path.join(target, name); fs.mkdirSync(path.dirname(dest), { recursive: true, mode: 0o700 });
      assert.equal(fs.realpathSync(path.dirname(dest)), path.dirname(dest));
      fs.writeFileSync(dest, b, { flag: 'wx', mode: 0o600 });
      assert.ok(fs.lstatSync(dest).isFile() && fs.lstatSync(dest).nlink === 1);
      entries.push(receipt); bytes += b.length; compactProof.set(name,{ ...receipt,cap });
    } catch (error) { omitted.push({ path: name, reason: smallError(error) }); }
  };
  const top = ['budget.json','environment.json','source-provenance.json','published-sources.json','source-content-audit.json',
    'source-fixture-audit.json','source-package-audit.json','source-fixture-package-audit.json','simulator-selection.json',
    'simulator-intent.json','owned-simulator.json','postboot-list-decision.json','actual-application.json','context.json','cleanup.json'];
  const stages = ['prepare','inventory','dependencies','content','simulator','build','audit','measure','export','cleanup'];
  for (const name of [...top, ...stages.map(x => 'stage-' + x + '.json')])
    include(file(evidence, name), 'workflow/' + name, name.startsWith('stage-') ? 16384 : 512 * 1024);
  const logReceipts: Record<string, unknown>[] = [], tails: Buffer[] = [], measureLogReceipts: Record<string, unknown>[] = [];
  for (const name of commandNames) {
    for (const ext of ['intent.json','exit.json']) include(path.join(raw, name + '.' + ext), 'receipts/' + name + '.' + ext, 16384);
    for (const stream of ['stdout','stderr']) {
      const location = path.join(raw, name + '.' + stream + '.log');
      if (!present(location)) continue;
      const b = regular(location, 16 * 1024 * 1024), tail = b.subarray(Math.max(0, b.length - 512));
      logReceipts.push({ command: name, stream, captured_bytes: b.length, captured_sha256: digest(b),
        tail_bytes: tail.length, tail_is_not_complete_raw: b.length !== tail.length });
      tails.push(Buffer.from('[' + name + ' ' + stream + ']\n'), tail, Buffer.from('\n'));
      if (name === 'measure') {
        const cap = stream === 'stdout' ? 65536 : 16384, selected = boundedDiagnosticExcerpt(b, cap);
        const diagnosticName = 'measure-' + stream + '.log', diagnosticPath = 'diagnostics/' + diagnosticName;
        put(diagnosticName, selected.bytes);
        include(file(evidence, diagnosticName), diagnosticPath, cap);
        measureLogReceipts.push({ command: name, stream, path: diagnosticPath, cap_bytes: cap,
          captured_bytes: b.length, captured_sha256: digest(b), retained_bytes: selected.bytes.length,
          retained_sha256: digest(selected.bytes), truncated: selected.truncated, retention: selected.retention,
          prefix_bytes: selected.prefix_bytes, tail_bytes: selected.tail_bytes, marker_bytes: selected.marker_bytes,
          omitted_bytes: selected.omitted_bytes, byte_excerpt_not_metric_input: true,
          truncated_byte_boundaries_may_split_UTF8: selected.truncated });
      }
    }
  }
  const tailBytes = Buffer.concat(tails);
  if (tailBytes.length > 65536) omitted.push({ path: 'workflow/log-tails.log', bytes: tailBytes.length, reason: 'aggregate-log-tail-cap' });
  else {
    const loc = path.join(evidence, 'log-tails.log'); put('log-tails.log', tailBytes);
    include(loc, 'workflow/log-tails.log', 65536);
  }
  json('measure-log-retention.json', { schema_version: 1, ...ownerContext(), diagnostic_only: true,
    metric_acceptance: false, logs: measureLogReceipts, log_presence_is_not_spawn_or_case_completion_proof: true });
  include(file(evidence, 'measure-log-retention.json'), 'diagnostics/measure-log-retention.json', 16384);
  json('log-receipts.json', { all_raw_logs_uploaded: false, selected_bounded_logs: ['measure'], records: logReceipts });
  include(file(evidence, 'log-receipts.json'), 'workflow/log-receipts.json', 512 * 1024);
  const exportRoot = path.join(evidence, 'export');
  const exportNames = ['modern-tests.json','modern-details.json','legacy-root.json','legacy-plan.json','legacy-summary.json',
    'context.json','provenance.json','summary.json','commands.json','manifest.json',
    'csv-export-stdout.txt','csv-export-inventory.json','csv-export-manifest.json'];
  if (present(exportRoot)) {
    assert.ok(fs.lstatSync(exportRoot).isDirectory() && !fs.lstatSync(exportRoot).isSymbolicLink());
    assert.equal(fs.realpathSync(exportRoot), exportRoot);
    for (const name of exportNames) include(path.join(exportRoot, name), 'export/' + name,
      ['commands.json','csv-export-stdout.txt','csv-export-inventory.json','csv-export-manifest.json'].includes(name) ? 16384
        : name === 'legacy-summary.json' ? 1024 * 1024 : 512 * 1024);
    for (const name of fs.readdirSync(exportRoot)) if (!exportNames.includes(name) && name !== 'csv' && !/^\.csv-export-[A-Za-z0-9_-]+$/.test(name))
      omitted.push({ path: 'export/' + name, reason: 'not-in-fixed-export-allowlist' });
    const csvRoot = path.join(exportRoot, 'csv');
    if (present(csvRoot)) {
      assert.ok(fs.lstatSync(csvRoot).isDirectory() && !fs.lstatSync(csvRoot).isSymbolicLink());
      assert.equal(fs.realpathSync(csvRoot), csvRoot);
      const names = fs.readdirSync(csvRoot).sort();
      if (names.length > 16) omitted.push({ path: 'export/csv', reason: 'CSV candidate count exceeds 16' });
      for (const name of names.slice(0, 16)) {
        if (!/^[A-Za-z0-9._-]+\.csv$/.test(name) || name.startsWith('.'))
          omitted.push({ path: 'export/csv/' + name, reason: 'unsafe CSV member name' });
        else include(path.join(csvRoot, name), 'export/csv/' + name, 65536);
      }
    }
  }
  const report = { schema_version: 1, ...ownerContext(), status: omitted.length ? 'incomplete-rejected-members' : 'bounded-compact',
    files: entries, omitted_count: omitted.length, omitted: omitted.slice(0, 32), bytes_before_manifest: bytes,
    aggregate_cap_bytes: aggregateCap, metric_truncation_performed: false, raw_xcresult_and_app_uploaded: false };
  const encoded = Buffer.from(JSON.stringify(report, null, 2) + '\n');
  assert.ok(encoded.length <= 65536 && bytes + encoded.length <= aggregateCap - 8192);
  fs.writeFileSync(path.join(target, 'compact-manifest.json'), encoded, { flag: 'wx', mode: 0o600 });
  compactProof.set('compact-manifest.json',{ bytes:encoded.length,sha256:digest(encoded),cap:65536 });
  if (omitted.length) throw new Error('Compact artifact has omitted/unsafe/oversized members; observation remains unaccepted');
};
let status = 'passed', failure: string | null = null, exitCode = 0;
try {
  assert.ok(['prepare','inventory','dependencies','content','simulator','build','audit','measure','export','cleanup','compact'].includes(stage));
  assert.equal(fs.realpathSync(root), root); assert.equal(fs.realpathSync(evidence), evidence);
  if (stage === 'prepare') {
    assert.match(expected, /^[0-9a-f]{40}$/);
    assert.match(process.env.GITHUB_RUN_ID!, /^[1-9][0-9]*$/); assert.match(process.env.GITHUB_RUN_ATTEMPT!, /^[1-9][0-9]*$/);
    assert.ok(['push','pull_request','workflow_dispatch'].includes(process.env.OBSERVATION_EVENT!));
    if (process.env.OBSERVATION_EVENT === 'workflow_dispatch') {
      assert.equal(process.env.OBSERVATION_SHA, expected, 'Dispatch SHA must equal expected source');
      assert.equal(process.env.OBSERVATION_WORKFLOW_SHA, expected, 'Dispatch workflow SHA must equal expected source');
    }
    const started = Date.now();
    json('budget.json', { schema_version: 1, started_epoch_ms: started, work_deadline_epoch_ms: started + 31 * 60000,
      work_minutes: 31, job_minutes: 40, reserved_postprocessing_minutes: 6, limits_are_resource_bounds: true });
    json('environment.json', { ...ownerContext(), scenario, method, selector, configuration: 'Debug',
      developer_dir: process.env.DEVELOPER_DIR, metric_contract: 'xcode16.4-app-memory-v1', expected_export_exit_code: 0,
      limits: 'App-process interval in Debug Simulator; no startup, cold, lifetime peak, RSS, physical-device or product SLO claim.' });
  } else if (stage === 'inventory') {
    const deadline = Date.now() + 150000;
    sameHead('inventory');
    const tree = text('inventory-tree','git',['rev-parse','HEAD^{tree}'],15000,{ deadline });
    assert.match(tree,/^[0-9a-f]{40}$/);
    const xcode = text('xcode','xcodebuild',['-version'],30000,{ deadline });
    assert.match(xcode, /^Xcode 16\.4\nBuild version /);
    const runtimes = record(JSON.parse(text('runtimes','xcrun',['simctl','list','runtimes','--json'],120000,{ deadline, maxBuffer: 4 * 1024 * 1024 })) as unknown);
    const types = record(JSON.parse(text('device-types','xcrun',['simctl','list','devicetypes','--json'],120000,{ deadline, maxBuffer: 4 * 1024 * 1024 })) as unknown);
    assert.ok(Array.isArray(runtimes.runtimes) && Array.isArray(types.devicetypes));
    const runtime = records(runtimes.runtimes).filter(r => r.identifier === 'com.apple.CoreSimulator.SimRuntime.iOS-18-5' && r.isAvailable === true);
    const deviceType = records(types.devicetypes).filter(d => d.identifier === 'com.apple.CoreSimulator.SimDeviceType.iPhone-16' && d.name === 'iPhone 16');
    assert.equal(runtime.length, 1); assert.equal(deviceType.length, 1);
    json('simulator-selection.json', { ...ownerContext(), source_head: expected, runtime: runtime[0], device_type: deviceType[0] });
    json('source-provenance.json', { expected_source_head: expected, checkout_head: expected, source_tree: tree,
      source_sha256: sources(), github: { repository: process.env.GITHUB_REPOSITORY, event_name: process.env.OBSERVATION_EVENT,
        run_id: process.env.GITHUB_RUN_ID!, run_attempt: process.env.GITHUB_RUN_ATTEMPT!, sha: process.env.OBSERVATION_SHA,
        workflow_ref: process.env.OBSERVATION_WORKFLOW_REF, workflow_sha: process.env.OBSERVATION_WORKFLOW_SHA },
      Xcode: xcode, producer_context_is_not_independent_api_proof: true });
  } else if (stage === 'dependencies') {
    const deadline = Date.now() + 480000, native = path.join(repo, 'ios/tools');
    run('audit-root','npm',['audit','--package-lock-only','--audit-level=high'],90000,{ deadline });
    run('install-root','npm',['ci','--ignore-scripts'],120000,{ deadline });
    run('audit-native','npm',['audit','--package-lock-only','--audit-level=high'],90000,{ deadline, cwd: native });
    run('install-native','npm',['ci','--ignore-scripts'],120000,{ deadline, cwd: native });
    run('install-chromium',path.join(native,'node_modules/.bin/playwright'),['install','chromium'],120000,{ deadline, cwd: native });
  } else if (stage === 'content') {
    const deadline = Date.now() + 300000, require = createRequire(import.meta.url);
    const { load, JSON_SCHEMA } = require('js-yaml') as typeof import('js-yaml');
    const names = text('tracked-docs','git',['ls-files','-z','docs'],15000,{ deadline }).split('\0')
      .filter(n => /^docs\/\d{2}-[a-z0-9-]+\/[a-z0-9-]+\.md$/.test(n));
    const published = names.filter(name => {
      const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(strictText(regular(path.join(repo,name),1024*1024)));
      assert.ok(match, name); const fields = record(load(match[1], { schema: JSON_SCHEMA }));
      assert.ok(fields && ['published','draft'].includes(fields.status as string), name); return fields.status === 'published';
    }).sort();
    assert.ok(published.length >= 4 && published.length <= 2000);
    json('published-sources.json', { articles: published.length, source_paths: published });
    fs.appendFileSync(process.env.GITHUB_ENV!, 'PUBLISHED_ARTICLE_COUNT=' + published.length + '\n');
    run('generate-published','npm',['run','ios:prepare'],180000,{ deadline });
    run('generate-fixtures','npm',['run','ios:prepare:fixtures'],90000,{ deadline });
    for (const [name,args,out] of [
      ['audit-content',['run','--silent','ios:test:content'],'source-content-audit.json'],
      ['audit-fixtures',['run','--silent','ios:test:fixtures'],'source-fixture-audit.json'],
      ['audit-package',['run','--silent','ios:test:package','--',String(published.length)],'source-package-audit.json']] as [string, string[], string][])
      json(out, record(JSON.parse(text(name,'npm',args,60000,{ deadline })) as unknown));
    json('source-fixture-package-audit.json', record(JSON.parse(text('audit-fixture-package','bash',['ios/tests/check-package.sh','ios/AILibrary/TestContent','4'],60000,{ deadline })) as unknown));
  } else if (stage === 'simulator') {
    const deadline = Date.now() + 330000, selection = read('simulator-selection.json');
    const before = deviceRows(record(JSON.parse(text('devices-before','xcrun',['simctl','list','devices','--json'],90000,{ deadline, maxBuffer:4*1024*1024 })) as unknown));
    const preexisting_UUIDs = before.map(r => string(r.device.udid).toUpperCase()); assert.equal(new Set(preexisting_UUIDs).size, preexisting_UUIDs.length);
    const token = randomUUID(), name = 'AILibrary-memory-' + process.env.GITHUB_RUN_ID + '-' + process.env.GITHUB_RUN_ATTEMPT + '-' + token;
    const intent = { schema_version:1, ...ownerContext(), source_head:expected, token, name, preexisting_UUIDs,
      runtime_identifier:string(record(selection.runtime).identifier), device_type_identifier:string(record(selection.device_type).identifier) };
    json('simulator-intent.json', intent);
    const UUID = text('create-simulator','xcrun',['simctl','create',name,intent.device_type_identifier,intent.runtime_identifier],90000,{ deadline }).toUpperCase();
    assert.match(UUID,uuidPattern); assert.ok(!preexisting_UUIDs.includes(UUID));
    json('owned-simulator.json',{ ...intent, UUID, creation_exit_code:0 });
    run('boot-simulator','xcrun',['simctl','boot',UUID],60000,{ deadline });
    run('bootstatus','xcrun',['simctl','bootstatus',UUID,'-b'],240000,{ deadline });
    const firstPostboot = run('devices-after-boot','xcrun',['simctl','list','devices','--json'],60000,
      { deadline,maxBuffer:4*1024*1024,allowFailure:true });
    const recoveryPlanned = (firstPostboot.error as NodeJS.ErrnoException | undefined)?.code === 'ETIMEDOUT' && firstPostboot.status === null;
    json('postboot-list-decision.json',{ ...ownerContext(),first_command:'devices-after-boot',
      first_exit_code:firstPostboot.status,first_error_code:(firstPostboot.error as NodeJS.ErrnoException | undefined)?.code ?? null,
      first_error:firstPostboot.error ? smallError(firstPostboot.error) : null,
      recovery_planned:recoveryPlanned,maximum_additional_reads:1,recovery_command:'devices-after-boot-recovery',
      command_cap_ms:60000,stage_deadline_epoch_ms:deadline,
      recovery_performed:null,execution_evidence:'Not asserted by this decision; inspect recovery command intent and exit receipts.' });
    if (!recoveryPlanned && (firstPostboot.error || firstPostboot.status !== 0)) {
      const error = new Error('devices-after-boot: bounded command failed: ' +
        (firstPostboot.error ? smallError(firstPostboot.error) : firstPostboot.status));
      (error as Error & { exitCode: number }).exitCode = firstPostboot.status === 2 ? 2 : 1; throw error;
    }
    const postboot = recoveryPlanned ? run('devices-after-boot-recovery','xcrun',['simctl','list','devices','--json'],60000,
      { deadline,maxBuffer:4*1024*1024 }) : firstPostboot;
    const matches = deviceRows(record(JSON.parse(strictText(postboot.stdout).trim()) as unknown)).filter(r => string(r.device.udid).toUpperCase() === UUID);
    assert.equal(matches.length,1); assert.equal(matches[0].runtime,intent.runtime_identifier);
    assert.equal(matches[0].device.name,name); assert.equal(matches[0].device.state,'Booted'); assert.equal(matches[0].device.isAvailable,true);
  } else if (stage === 'build') {
    sameHead('build');
    run('build','xcodebuild',[...buildArgs(readOwner()),'-resultBundlePath',path.join(evidence,'build.xcresult'),
      'CODE_SIGNING_ALLOWED=NO','build-for-testing'],690000);
  } else if (stage === 'audit') {
    const app = path.join(root,'DerivedData/Build/Products/Debug-iphonesimulator/AILibrary.app');
    const count = read('published-sources.json').articles, manifest = regular(path.join(app,'Content/manifest.json'),8 * 1024 * 1024);
    assert.ok(manifest.equals(regular(path.join(repo,'ios/AILibrary/Content/manifest.json'),8 * 1024 * 1024)));
    assert.ok(regular(path.join(app,'TestContent/manifest.json'),8 * 1024 * 1024).equals(regular(path.join(repo,'ios/AILibrary/TestContent/manifest.json'),8 * 1024 * 1024)));
    const packageAudit = record(JSON.parse(text('debug-package','bash',['ios/tests/check-package.sh',path.join(app,'Content'),String(count)],60000)) as unknown);
    const fixtureAudit = record(JSON.parse(text('debug-fixture','bash',['ios/tests/check-package.sh',path.join(app,'TestContent'),'4'],60000)) as unknown);
    assert.equal(packageAudit.status,'passed'); assert.equal(packageAudit.articles,count); assert.equal(fixtureAudit.status,'passed'); assert.equal(fixtureAudit.articles,4);
    const plist = (key: string) => [ '-extract',key,'raw','-o','-',path.join(app,'Info.plist') ];
    const bundle = text('app-id','/usr/bin/plutil',plist('CFBundleIdentifier'),15000);
    const version = text('app-version','/usr/bin/plutil',plist('CFBundleShortVersionString'),15000);
    const build = text('app-build','/usr/bin/plutil',plist('CFBundleVersion'),15000);
    assert.equal(bundle,'dev.pero3.aiagentlibrary.prototype');
    const revision = record(JSON.parse(strictText(manifest)) as unknown).revision; assert.match(revision as string,/^[0-9a-f]{64}$/);
    const binary = regular(path.join(app,'AILibrary'),128*1024*1024), owned = readOwner();
    const application = { bundle_identifier:bundle,version,build,content_revision:revision,articles:count,
      content_audited:true,fixture_audited:true,executable_bytes:binary.length,executable_sha256:digest(binary),
      content_manifest_sha256:digest(manifest),package_audit:packageAudit,fixture_audit:fixtureAudit };
    json('actual-application.json',application);
    const provenance = read('source-provenance.json');
    assert.deepEqual(sources(),provenance.source_sha256);
    json('context.json',{ schema_version:1,scenario,test_method:method,target_application:bundle,
      metric_configuration:'XCTMemoryMetric(application: app)',article_id:'11-llm-internals/transformer-architecture',
      configuration:'Debug',expected_articles:count,expected_source_head:expected,checkout_head:provenance.checkout_head,
      source_tree:provenance.source_tree,source_sha256:provenance.source_sha256,github:provenance.github,
      destination:{ uuid:owned.UUID,device_type_identifier:owned.device_type_identifier,runtime_identifier:owned.runtime_identifier,
        device_name:owned.name,device_model_name:'iPhone 16',os_version:'18.5',owned:true },
      application,declared_recorded_iterations:3,discarded_warmup_invocations:1,
      Xcode:provenance.Xcode,limits:'Debug Simulator app-process interval; package audits and warm-up warm caches. No startup/cold/lifetime peak/RSS/physical-device/product target claim.' });
  } else if (stage === 'measure') {
    sameHead('measure'); const context = read('context.json'); assert.deepEqual(sources(),context.source_sha256);
    assert.equal(context.expected_source_head,expected); assert.equal(context.checkout_head,expected);
    const owned = readOwner(); assert.equal(record(context.destination).uuid,owned.UUID);
    run('measure','xcodebuild',[...buildArgs(owned),'-resultBundlePath',path.join(evidence,'memory.xcresult'),
      '-only-testing:' + selector,'CODE_SIGNING_ALLOWED=NO','test-without-building'],450000);
  } else if (stage === 'export') {
    assert.ok(!present(path.join(evidence,'export')));
    run('export',process.execPath,['ios/tests/export-memory.mjs','--result',path.join(evidence,'memory.xcresult'),
      '--output',path.join(evidence,'export'),'--context',path.join(evidence,'context.json'),'--expected-head',expected],
      170000,{ deadline:Date.now()+170000 });
    const summary = read('export/summary.json');
    assert.equal(summary.status,'matched-memory-observation');
    assert.equal(summary.metric_contract_id,'xcode16.4-app-memory-v1');
    assert.equal(summary.metric_contract_accepted,true);
    assert.ok(Array.isArray(summary.accepted_measurements) && summary.accepted_measurements.length===3);
    for (const metric of records(summary.accepted_measurements)) {
      assert.equal(metric.unit,'kB'); assert.equal(metric.sample_count,3);
      assert.ok(Array.isArray(metric.raw_samples) && metric.raw_samples.length===3);
      assert.ok(Array.isArray(metric.samples) && metric.samples.length===3 && metric.samples.every(Number.isFinite));
    }
    const csv = record(summary.csv_validation);
    assert.equal(csv.status,'matched-fixed-memory-csv');
    assert.equal(csv.schema_verified,true); assert.equal(csv.metric_set_correlated,true);
    assert.equal(csv.header_columns,11); assert.equal(csv.data_rows,1); assert.equal(csv.file_count,1);
    assert.equal(summary.protocol_payload_verified,false);
    assert.equal(summary.product_performance_acceptance,false);
  } else if (stage === 'cleanup') {
    const deadline = Date.now() + 55000;
    if (!present(file(evidence,'simulator-intent.json'))) json('cleanup.json',{ ...ownerContext(),status:'not-created',unrelated_devices_touched:false });
    else {
      const owned = readOwner(), current = deviceRows(record(JSON.parse(text('cleanup-devices-before','xcrun',['simctl','list','devices','--json'],15000,{ deadline,maxBuffer:4*1024*1024 })) as unknown));
      const matches = current.filter(r => string(r.device.udid).toUpperCase() === owned.UUID); assert.ok(matches.length<=1);
      if (matches.length) {
        assert.equal(matches[0].runtime,owned.runtime_identifier); assert.equal(matches[0].device.name,owned.name);
        if (matches[0].device.state !== 'Shutdown') run('cleanup-shutdown','xcrun',['simctl','shutdown',owned.UUID],15000,{ deadline,allowFailure:true });
        run('cleanup-delete','xcrun',['simctl','delete',owned.UUID],15000,{ deadline });
        const after = deviceRows(record(JSON.parse(text('cleanup-devices-after','xcrun',['simctl','list','devices','--json'],10000,{ deadline,maxBuffer:4*1024*1024 })) as unknown));
        assert.ok(!after.some(r => string(r.device.udid).toUpperCase() === owned.UUID));
      }
      json('cleanup.json',{ ...ownerContext(),status:matches.length?'owned-device-deleted':'owned-device-already-absent',
        UUID:owned.UUID,source_head:expected,only_created_UUID_used:true,unrelated_devices_touched:false });
    }
  } else if (stage === 'compact') compact();
} catch (error) {
  status = 'failed'; failure = smallError(error); exitCode = (error as Error & { exitCode: number }).exitCode === 2 ? 2 : 1;
  if (stage === 'export' && exitCode === 2) {
    try {
      const summary = record(JSON.parse(strictText(regular(path.join(evidence,'export/summary.json')))) as unknown);
      if (summary.status === 'metric-contract-unconfirmed' && summary.accepted_measurements === null) status = 'metric-contract-unconfirmed';
    } catch { /* Export failure remains failed; missing summary is not a pending observation. */ }
  }
  if (stage === 'cleanup' && !present(path.join(evidence,'cleanup.json'))) {
    try { json('cleanup.json',{ ...ownerContext(),status:'owned-cleanup-incomplete',error:failure,unrelated_devices_touched:false }); } catch {}
  }
  if (stage === 'compact') {
    const target = path.join(root,'compact');
    try {
      if (compactOwned && fs.realpathSync(target) === target) {
        const location = path.join(target,'compact-failure.json');
        const bytes = Buffer.from(JSON.stringify({ status:'compact-failed',error:failure,accepted:false })+'\n');
        assert.ok(bytes.length <= 8192); fs.writeFileSync(location,bytes,{ flag:'wx',mode:0o600 });
        compactProof.set('compact-failure.json',{ bytes:bytes.length,sha256:digest(bytes),cap:8192 });
      }
    } catch {}
  }
  console.error(stage + ': ' + failure);
} finally {
  if (stage === 'compact' && compactOwned) {
    try {
      const target = path.join(root,'compact'); let total = 0, count = 0;
      const walk = (dir: string): void => {
        assert.equal(fs.realpathSync(dir),dir); assert.ok(!fs.lstatSync(dir).isSymbolicLink());
        for (const name of fs.readdirSync(dir)) {
          const location = path.join(dir,name), st = fs.lstatSync(location);
          assert.ok(!st.isSymbolicLink());
          if (st.isDirectory()) { assert.ok(location.split(path.sep).length-target.split(path.sep).length<=2); walk(location); }
          else {
            const relative = path.relative(target,location).split(path.sep).join('/'), receipt = compactProof.get(relative);
            assert.ok(receipt,'Unowned compact member'); const bytes = regular(location,receipt.cap);
            assert.equal(bytes.length,receipt.bytes); assert.equal(digest(bytes),receipt.sha256);
            total += bytes.length; count++; assert.ok(total<=2*1024*1024 && count<=192);
          }
        }
      };
      walk(target); assert.equal(count,compactProof.size); assert.ok(count>0);
      fs.appendFileSync(process.env.GITHUB_OUTPUT!,'ready=true\n');
    } catch (error) { console.error('Compact upload gate rejected: '+smallError(error)); exitCode=1; }
  }
  if (stage !== 'compact') {
    try { json('stage-' + stage + '.json',{ ...ownerContext(),stage,status,error:failure,exit_code:exitCode,
      observation_is_not_product_performance_acceptance:true }); }
    catch (error) { console.error('Could not preserve stage receipt: ' + smallError(error)); exitCode=1; }
  }
  process.exitCode = exitCode;
}

// JSON receipts and process output remain untrusted until their consumed fields are checked.
function record(value: unknown): Record<string, unknown> {
  assert.ok(value !== null && typeof value === 'object' && !Array.isArray(value), 'Expected JSON object');
  return value as Record<string, unknown>;
}
function string(value: unknown): string {
  assert.equal(typeof value, 'string', 'Expected string field');
  return value as string;
}
function records(value: unknown): Record<string, unknown>[] {
  assert.ok(Array.isArray(value), 'Expected JSON array');
  return (value as unknown[]).map(record);
}

type Owner = { repository: string; source_head: string; run_id: string; run_attempt: string;
  token: string; name: string; runtime_identifier: string; device_type_identifier: string;
  preexisting_UUIDs: string[] };
function assertOwner(value: Record<string, unknown>): asserts value is Record<string, unknown> & Owner {
  for (const key of ['repository','source_head','run_id','run_attempt','token','name','runtime_identifier','device_type_identifier']) string(value[key]);
  strings(value.preexisting_UUIDs);
}
function strings(value: unknown): string[] {
  assert.ok(Array.isArray(value) && (value as unknown[]).every(item => typeof item === 'string'), 'Expected string array');
  return value as string[];
}
function number(value: unknown): number {
  assert.equal(typeof value, 'number', 'Expected numeric field');
  return value as number;
}
