import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { test } from 'node:test';
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, truncate, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { CORE_SOURCES, SCENARIOS, idsDigest, inventoryCorpus, sha256, summarize } from '../../ios/tests/core-performance-runner.mjs';
import { BYTE_CONTRACT, createObservationVerifier, parseVerificationArgs, verifyObservation as verifyProductionObservation } from '../../ios/tests/verify-core-performance.mjs';

const candidate = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const revision = 'c'.repeat(40); // Expected caller revision may differ while frozen bytes stay fixed.
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const savedRoot = '/private/tmp/frozen-host-observation', savedCorpus = '/private/tmp/frozen-host-Content';
const executable = `${savedRoot}/published-core-benchmark`;
const execute = promisify(execFile);
// Independently declared synthetic policy. No docs, Source4, harness, query or
// runner identity bytes are read from the evolving library to construct fixtures.
const fixtureSources = ['one', 'three', 'two'].map(name => [`docs/00-fixture/${name}.md`, sha256(`synthetic source ${name}\n`)]);
const fixtureSwift = Object.fromEntries(CORE_SOURCES.map((source, index) => [source, `// synthetic Source4 fixture ${index}\n`]));
const fixtureHarness = '// synthetic benchmark harness fixture\n';
const fixtureQueries = json(['', 'fixture', 'missing']);
const fixtureRunner = '// synthetic trusted runner identity fixture\n';
const fixtureContract = Object.freeze({
  production_source_sha256: Object.freeze(Object.fromEntries(CORE_SOURCES.map(source => [source, sha256(fixtureSwift[source])]))),
  harness_sha256: sha256(fixtureHarness), runner_sha256: sha256(fixtureRunner),
  query_source_sha256: sha256('// synthetic query source fixture\n'), query_sha256: sha256(fixtureQueries),
  query_count: 3, expected_article_count: 3, expected_count_method: 'synthetic preregistered source-pair declaration',
  published_sources_sha256: sha256(json(fixtureSources))
});

async function fixture(action) {
  const root = await mkdtemp(path.join(await realpath(os.tmpdir()), 'core-observation-acceptance-'));
  try {
    const observation = path.join(root, 'observation'), corpus = path.join(root, 'Content'), trustedRunnerDirectory = path.join(root, 'trusted-runner');
    await mkdir(observation); await mkdir(trustedRunnerDirectory);
    await writeFile(path.join(trustedRunnerDirectory, 'core-performance-runner.mjs'), fixtureRunner);
    await mkdir(corpus); await mkdir(path.join(corpus, 'articles'));
    const articleBytes = Buffer.from('{"synthetic_fixture":true}\n');
    await writeFile(path.join(corpus, 'articles/fixture.json'), articleBytes);
    const articles = fixtureSources.map(([source_path, source_sha256], index) => ({ id: `fixture-${index}`, source_path, source_sha256 }));
    await writeFile(path.join(corpus, 'manifest.json'), json({ schema_version: 2, revision: 'fixture-corpus', articles,
      files: { 'articles/fixture.json': sha256(articleBytes) } }));
    const { manifest, ...counts } = await inventoryCorpus(corpus);
    const binary = Buffer.from('synthetic binary bytes; must never be executed\n');
    const flags = ['-parse-as-library', '-swift-version', '5', '-O', '-whole-module-optimization', '-target', 'arm64-apple-macosx14.0',
      '-sdk', '/nonexistent/MacOSX15.2.sdk', '-module-cache-path', `${savedRoot}/module-cache`];
    const identity = { schema_version: 1, source_revision: revision, ...structuredClone(fixtureContract), ...counts,
      corpus_revision: manifest.revision, article_order_sha256: idsDigest(articles.map(article => article.id)),
      compiler_version: 'Apple Swift version 6.0.3 (synthetic fixture)\nTarget: arm64-apple-macosx14.0', compiler_flags: flags,
      compiler_command: ['/nonexistent/usr/bin/swiftc', ...flags, ...CORE_SOURCES.map(source => `${savedRoot}/${path.basename(source)}`),
        `${savedRoot}/PublishedCoreBenchmark.swift`, '-o', executable],
      toolchain_selection: { mode: 'explicit', requested: { swiftc: '/nonexistent/usr/bin/swiftc', sdk: '/nonexistent/MacOSX15.2.sdk', target: 'arm64-apple-macosx14.0', swift_version: '5' },
        resolved: { swiftc: '/nonexistent/usr/bin/swift', sdk: '/nonexistent/MacOSX15.2.sdk', target: 'arm64-apple-macosx14.0', swift_version: '5' },
        invocation: { swiftc: '/nonexistent/usr/bin/swiftc', sdk: '/nonexistent/MacOSX15.2.sdk' }, compiler_default_target: 'arm64-apple-macosx14.0',
        host_process_architecture: 'arm64', sdk: { canonical_name: 'macosx15.2', version: '15.2', settings_sha256: 'a'.repeat(64) } },
      spawn_environment: { keys: ['PATH', 'TMPDIR'], TMPDIR: `${savedRoot}/.process-tmp/`, temp_mode: '0700', operator_TMPDIR_inherited: false, caller_env_overrides_forwarded: false },
      executable_sha256: sha256(binary), executable_architecture: 'arm64', os: { platform: 'darwin', release: '24.0.0', version: 'synthetic Darwin', architecture: 'arm64' },
      clock: { source: 'DispatchTime.now().uptimeNanoseconds', unit: 'seconds', scope: 'elapsed monotonic wall time of named production operation' },
      memory: { source: 'Darwin getrusage(RUSAGE_SELF).ru_maxrss', unit: 'bytes', scope: 'whole fresh host process high-water through post-work pre-JSON probe; includes setup and post-timing result digests',
        unit_evidence: 'Darwin getrusage(2) ru_maxrss: maximum resident set size utilized (in bytes); independently verified local primary manual, see core-performance.md' },
      protocol: { warmup_per_scenario: 1, recorded_per_scenario: 5, fresh_process_each_invocation: true, sample_timeout_ms: 60_000,
        sample_output_max_bytes: 1_048_576, total_deadline_ms: 900_000, corpus_file_cache: 'warmed by inventory SHA checks; no cold-disk claim' } };
    for (const source of CORE_SOURCES) await writeFile(path.join(observation, path.basename(source)), fixtureSwift[source]);
    await writeFile(path.join(observation, 'PublishedCoreBenchmark.swift'), fixtureHarness);
    await writeFile(path.join(observation, 'core-performance-queries.json'), fixtureQueries);
    await writeFile(path.join(observation, 'published-core-benchmark'), binary);
    await writeFile(path.join(observation, 'compiler.stderr.txt'), '');
    const identityHash = sha256(json(identity)), order = [], records = [];
    const expected = [{ mode: 'correctness', kind: 'correctness', ordinal: 0 }];
    for (const mode of SCENARIOS) {
      expected.push({ mode, kind: 'discarded-warmup', ordinal: 0 });
      for (let ordinal = 1; ordinal <= 5; ordinal++) expected.push({ mode, kind: 'recorded', ordinal });
    }
    const queryResults = Array.from({ length: fixtureContract.query_count }, (_, query_index) => ({ query_index, result_count: query_index, ordered_ids_sha256: sha256(`query-${query_index}`) }));
    for (const [index, invocation] of expected.entries()) {
      const invocationID = `${String(index).padStart(8, '0')}-1111-4111-8111-111111111111`, pid = 1000 + index;
      const rawName = `${String(index).padStart(2, '0')}-${invocation.mode === 'correctness' ? 'correctness' : invocation.mode.split('.')[1]}-${invocation.kind}-${invocation.ordinal}`;
      const value = { schema_version: 1, mode: invocation.mode, invocation_id: invocationID, process_id: pid, identity_sha256: identityHash,
        manifest_sha256: identity.manifest_sha256, query_sha256: identity.query_sha256, query_count: fixtureContract.query_count, actual_article_count: fixtureContract.expected_article_count,
        corpus_revision: 'fixture-corpus', article_order_sha256: identity.article_order_sha256, executable_architecture: 'arm64', host_os_version: 'synthetic macOS 15.2',
        ...(invocation.mode === 'correctness' ? { correctness: 'ordered-indexed-equals-production-uncached' } : {
          wall_seconds: (invocation.ordinal === 0 ? 9 : [5, 1, 2, 4, 3][invocation.ordinal - 1]) / 1000,
          process_peak_resident_bytes: 10_000 + (invocation.ordinal === 0 ? 900 : [5, 1, 2, 4, 3][invocation.ordinal - 1]) * 100 }),
        ...(invocation.mode !== SCENARIOS[0] ? { query_results: structuredClone(queryResults) } : {}) };
      records.push(value);
      order.push({ ...invocation, process_id: pid, invocation_id: invocationID,
        command: [executable, invocation.mode, savedCorpus, `${savedRoot}/core-performance-queries.json`, `${savedRoot}/identity.json`, invocationID], raw_file: `${rawName}.json` });
    }
    const summary = { schema_version: 1, status: 'observed-host-baseline', identity_sha256: identityHash, order,
      scenarios: SCENARIOS.map((scenario, index) => ({ scenario, discarded_warmup: records[1 + index * 6],
        raw_samples: records.slice(2 + index * 6, 7 + index * 6), descriptive: summarize(records.slice(2 + index * 6, 7 + index * 6)) })),
      elapsed_runner_seconds: 3.25, limits: ['No timing threshold or SLO acceptance', 'No p95 estimate from five samples', 'Not iOS app memory/input latency/scrolling/image decoding',
        'RSS is not isolated allocation size; do not subtract high-water marks', 'IOS-15 remains open'] };
    const state = { root, observation, corpus, trustedRunnerDirectory, identity, summary, records, options: { observation, corpus, revision },
      verify: createObservationVerifier({ trustedByteContract: fixtureContract, trustedRunnerDirectory }) };
    state.save = async () => {
      const newHash = sha256(json(identity)); summary.identity_sha256 = newHash;
      await writeFile(path.join(observation, 'identity.json'), json(identity));
      for (const [index, record] of records.entries()) {
        record.identity_sha256 = newHash;
        await writeFile(path.join(observation, summary.order[index].raw_file), json(record));
        await writeFile(path.join(observation, summary.order[index].raw_file.replace(/\.json$/, '.stderr.txt')), '');
      }
      await writeFile(path.join(observation, 'summary.json'), json(summary));
    };
    await state.save();
    return await action(state);
  } finally { await rm(root, { recursive: true, force: true }); }
}

test('complete synthetic saved result accepts 19 raw records and recomputed 5x3 statistics without executing artifacts', async () => {
  await fixture(async state => {
    const receipt = await state.verify(state.options);
    assert.equal(receipt.status, 'accepted-host-observation'); assert.equal(receipt.performance_budget, 'unadopted');
    assert.equal(receipt.source_revision, revision); assert.equal(receipt.raw_invocations, 19); assert.equal(receipt.measured_samples, 15);
    assert.equal(state.identity.expected_article_count, 3); assert.equal(state.identity.query_count, 3);
    assert.match(receipt.revision_provenance, /independently bind/);
    assert.equal(state.summary.scenarios[0].descriptive.wall_seconds.median, 0.003);
    assert.equal(state.summary.scenarios[0].discarded_warmup.wall_seconds, 0.009);
  });
});

test('only explicit trusted JavaScript policy accepts synthetic observations; builtin API and CLI reject them', async () => {
  await fixture(async state => {
    await assert.rejects(verifyProductionObservation(state.options), /Preregistered byte identity mismatch|Trusted runner artifact contract changed/);
    await assert.rejects(verifyProductionObservation({ ...state.options, trustedByteContract: fixtureContract }), /Unexpected\/missing fields/);
    const cliArgs = [path.join(candidate, 'ios/tests/verify-core-performance.mjs'), '--observation', state.observation,
      '--corpus', state.corpus, '--revision', revision];
    await assert.rejects(execute(process.execPath, cliArgs, { timeout: 5000, maxBuffer: 256 * 1024,
      env: { ...process.env, CORE_PERFORMANCE_CONTRACT: json(fixtureContract), NODE_ENV: 'test' } }), error => {
      assert.equal(error.code, 1); assert.equal(error.stdout, '');
      assert.match(error.stderr, /Core observation rejected:.*(?:Preregistered byte identity mismatch|Trusted runner artifact contract changed)/s);
      return true;
    });
    await assert.rejects(execute(process.execPath, [...cliArgs, '--contract', 'candidate-policy.json'], { timeout: 5000, maxBuffer: 256 * 1024 }), /Expected --observation/);
    state.identity.trusted_byte_contract = structuredClone(fixtureContract); await state.save();
    await assert.rejects(state.verify(state.options), /Unexpected\/missing fields/);
  });
});

test('factory validates bounded exact policy shape and freezes a deep copy before candidate IO', async () => {
  const policy = () => ({ trustedByteContract: structuredClone(fixtureContract), trustedRunnerDirectory: '/nonexistent/trusted-runner' });
  for (const mutate of [
    value => { value.extra = true; },
    value => { value.trustedByteContract.extra = true; },
    value => { delete value.trustedByteContract.production_source_sha256[CORE_SOURCES[0]]; },
    value => { value.trustedByteContract.production_source_sha256[CORE_SOURCES[0]] = ['a'.repeat(64)]; },
    value => { value.trustedByteContract.runner_sha256 = 'not-a-digest'; },
    value => { value.trustedByteContract.query_count = 0; },
    value => { value.trustedByteContract.query_count = 4097; },
    value => { value.trustedByteContract.expected_article_count = 2001; },
    value => { value.trustedByteContract.expected_article_count = NaN; },
    value => { value.trustedByteContract.expected_count_method = ''; },
    value => { value.trustedByteContract.expected_count_method = 'x'.repeat(8193); },
    value => { value.trustedRunnerDirectory = '../candidate-policy'; }
  ]) { const value = policy(); mutate(value); assert.throws(() => createObservationVerifier(value)); }
  await fixture(async state => {
    const input = { trustedByteContract: structuredClone(fixtureContract), trustedRunnerDirectory: state.trustedRunnerDirectory };
    const verify = createObservationVerifier(input);
    input.trustedByteContract.production_source_sha256[CORE_SOURCES[0]] = 'f'.repeat(64);
    input.trustedByteContract.query_count = 100;
    input.trustedRunnerDirectory = '/nonexistent/mutated';
    assert.equal((await verify(state.options)).status, 'accepted-host-observation');
    assert(Object.isFrozen(BYTE_CONTRACT) && Object.isFrozen(BYTE_CONTRACT.production_source_sha256));
    assert.equal(BYTE_CONTRACT.expected_article_count, 199); assert.equal(BYTE_CONTRACT.query_count, 16);
    await writeFile(path.join(state.trustedRunnerDirectory, 'core-performance-runner.mjs'), 'forged runner proof');
    await assert.rejects(verify(state.options), /Trusted runner artifact contract changed/);
  });
});

test('synthetic acceptance runs once in a sparse module tree without docs or live Core/harness/query files',
  { skip: process.env.AILIBRARY_CORE_ACCEPTANCE_SPARSE_CHILD === '1' }, async () => {
    const root = await mkdtemp(path.join(await realpath(os.tmpdir()), 'core-observation-sparse-'));
    try {
      for (const relative of ['ios/tests/verify-core-performance.mjs', 'ios/tests/core-performance-runner.mjs', 'tests/unit/ios-core-performance-acceptance.test.mjs']) {
        const output = path.join(root, relative); await mkdir(path.dirname(output), { recursive: true });
        await writeFile(output, await readFile(path.join(candidate, relative)));
      }
      const childEnv = { ...process.env, AILIBRARY_CORE_ACCEPTANCE_SPARSE_CHILD: '1' };
      delete childEnv.NODE_TEST_CONTEXT; // Start one reporter-owning runner, not a nested worker protocol.
      const child = await execute(process.execPath, ['--test', '--test-reporter=spec',
        '--test-name-pattern=^complete synthetic saved result accepts', path.join(root, 'tests/unit/ios-core-performance-acceptance.test.mjs')],
      { timeout: 10_000, maxBuffer: 256 * 1024, env: childEnv });
      assert.match(child.stdout, /pass 1\b/); assert.match(child.stdout, /fail 0\b/); assert.equal(child.stderr, '');
    } finally { await rm(root, { recursive: true, force: true }); }
  });

test('missing raw correctness, measured sample, stderr, identity or summary fails closed', async () => {
  for (const name of ['00-correctness-correctness-0.json', '02-validation-recorded-1.json', '02-validation-recorded-1.stderr.txt', 'identity.json', 'summary.json']) {
    await fixture(async state => { await rm(path.join(state.observation, name)); await assert.rejects(state.verify(state.options)); });
  }
});

test('each invocation enforces the combined raw stdout/stderr byte bound, including its exact inclusive edge', async () => {
  for (const index of [0, 1, 2]) await fixture(async state => {
    const rawName = state.summary.order[index].raw_file;
    const raw = await readFile(path.join(state.observation, rawName));
    const stderrName = rawName.replace(/\.json$/, '.stderr.txt');
    const remaining = state.identity.protocol.sample_output_max_bytes - raw.length;
    await writeFile(path.join(state.observation, stderrName), Buffer.alloc(remaining, 0x78));
    assert.equal((await state.verify(state.options)).status, 'accepted-host-observation');
    await writeFile(path.join(state.observation, stderrName), Buffer.alloc(remaining + 1, 0x78));
    await assert.rejects(state.verify(state.options), /Combined invocation stdout\/stderr/);
  });
  await fixture(async state => {
    const rawName = state.summary.order[2].raw_file;
    const raw = await readFile(path.join(state.observation, rawName));
    await writeFile(path.join(state.observation, rawName), Buffer.concat([raw, Buffer.alloc(600_000 - raw.length, 0x20)]));
    await writeFile(path.join(state.observation, rawName.replace(/\.json$/, '.stderr.txt')), Buffer.alloc(600_000, 0x78));
    await assert.rejects(state.verify(state.options), /Combined invocation stdout\/stderr/);
  });
});

test('sequential warmup/sample timing totals must fit the deadline and runner elapsed time, allowing only documented clock precision', async () => {
  const saveConsistentStatistics = async state => {
    for (const scenario of state.summary.scenarios) scenario.descriptive = summarize(scenario.raw_samples);
    await state.save();
  };
  await fixture(async state => {
    for (const record of state.records.slice(1)) record.wall_seconds = 50.001;
    state.summary.elapsed_runner_seconds = 900.999;
    await saveConsistentStatistics(state);
    await assert.rejects(state.verify(state.options), /Sequential timed regions exceed total runner deadline/);
  });
  await fixture(async state => {
    for (const record of state.records.slice(1)) record.wall_seconds = 1;
    state.summary.elapsed_runner_seconds = 17.998;
    await saveConsistentStatistics(state);
    await assert.rejects(state.verify(state.options), /Sequential timed regions exceed runner elapsed time/);
  });
  await fixture(async state => {
    for (const [index, record] of state.records.entries()) if (index > 0) record.wall_seconds = state.summary.order[index].kind === 'discarded-warmup' ? 1 : 0.001;
    state.summary.elapsed_runner_seconds = 0.015;
    await saveConsistentStatistics(state);
    await assert.rejects(state.verify(state.options), /Sequential timed regions exceed runner elapsed time/);
  });
  await fixture(async state => {
    // The original 18 raw regions total 72 ms; 71 ms is the inclusive one-ms
    // endpoint-quantization allowance, including the sum's binary64 roundoff.
    state.summary.elapsed_runner_seconds = 0.071;
    await state.save();
    assert.equal((await state.verify(state.options)).status, 'accepted-host-observation');
    state.summary.elapsed_runner_seconds = 0.070;
    await state.save();
    await assert.rejects(state.verify(state.options), /Sequential timed regions exceed runner elapsed time/);
  });
});

test('wrong caller revision, Source4, harness, runner, query, or query-source identity fails even after rehashing metadata', async () => {
  await fixture(async state => { await assert.rejects(state.verify({ ...state.options, revision: 'd'.repeat(40) }), /revision mismatch/); });
  for (const mutate of [
    state => { state.identity.source_revision = 'd'.repeat(40); },
    state => { state.identity.production_source_sha256[CORE_SOURCES[2]] = 'd'.repeat(64); },
    ...['harness_sha256', 'runner_sha256', 'query_sha256', 'query_source_sha256'].map(name => state => { state.identity[name] = 'd'.repeat(64); }),
    state => { state.identity.query_count = fixtureContract.query_count + 1; }
  ]) await fixture(async state => { mutate(state); await state.save(); await assert.rejects(state.verify(state.options), /revision mismatch|byte identity/); });
  for (const name of ['ContentValidator.swift', 'PublishedCoreBenchmark.swift', 'core-performance-queries.json', 'published-core-benchmark']) {
    await fixture(async state => { await writeFile(path.join(state.observation, name), 'forged bytes'); await assert.rejects(state.verify(state.options), /Frozen/); });
  }
});

test('raw oracle digest/count/order/query identity and embedded sample disagreements fail', async () => {
  for (const mutate of [
    state => { state.records[8].query_results[0].ordered_ids_sha256 = 'f'.repeat(64); },
    state => { state.records[8].query_results[0].result_count++; },
    state => { state.records[8].query_results.reverse(); },
    state => { state.records[8].query_sha256 = 'f'.repeat(64); },
    state => { state.records[2].article_order_sha256 = 'f'.repeat(64); },
    state => { state.records[2].wall_seconds = 0.25; },
    state => { state.records[0].correctness = 'claimed-correct'; }
  ]) await fixture(async state => { mutate(state); await state.save(); await assert.rejects(state.verify(state.options)); });
  await fixture(async state => {
    const record = structuredClone(state.records[2]); record.wall_seconds = 0.25;
    await writeFile(path.join(state.observation, state.summary.order[2].raw_file), json(record));
    await assert.rejects(state.verify(state.options), /Recorded raw mismatch/);
  });
});

test('warmup mixing, reordered/incomplete protocol, PID or UUID reuse, and raw path traversal fail', async () => {
  for (const mutate of [
    state => { state.summary.order[1].kind = 'recorded'; },
    state => { state.summary.scenarios[0].raw_samples[0] = state.records[1]; },
    state => { state.summary.order.reverse(); },
    state => { state.summary.order.pop(); },
    state => { state.summary.order[2].process_id = state.summary.order[1].process_id; state.records[2].process_id = state.records[1].process_id; },
    state => { state.summary.order[2].invocation_id = state.summary.order[1].invocation_id; state.summary.order[2].command[5] = state.records[2].invocation_id = state.records[1].invocation_id; },
    state => { state.summary.order[2].raw_file = '../outside.json'; },
    state => { state.summary.order[2].raw_file = '/private/tmp/outside.json'; }
  ]) await fixture(async state => {
    mutate(state);
    // Keep filesystem fixture creation inside its owner; traversal is metadata only.
    await writeFile(path.join(state.observation, 'summary.json'), json(state.summary));
    await assert.rejects(state.verify(state.options));
  });
});

test('forged descriptive statistics and nonfinite, missing, zero or unsafe metrics are rejected', async () => {
  for (const metric of ['wall_seconds', 'process_peak_resident_bytes']) {
    for (const statistic of ['median', 'minimum', 'maximum', 'range']) await fixture(async state => {
      state.summary.scenarios[0].descriptive[metric][statistic] += 1;
      await state.save(); await assert.rejects(state.verify(state.options), /descriptive statistics/);
    });
    for (const value of [null, 0, -1, '0.5']) await fixture(async state => {
      state.records[2][metric] = value; await state.save(); await assert.rejects(state.verify(state.options));
    });
  }
  await fixture(async state => {
    delete state.records[2].wall_seconds; await state.save(); await assert.rejects(state.verify(state.options));
  });
  await fixture(async state => {
    state.records[2].process_peak_resident_bytes = Number.MAX_SAFE_INTEGER + 1; await state.save(); await assert.rejects(state.verify(state.options));
  });
  await fixture(async state => {
    state.records[2].wall_seconds = 61; await state.save(); await assert.rejects(state.verify(state.options), /lifetime bound/);
  });
  await fixture(async state => {
    await writeFile(path.join(state.observation, 'summary.json'), json(state.summary).replace('3.25', '1e999'));
    await assert.rejects(state.verify(state.options), /Nonfinite metadata/);
  });
});

test('compiler flags, targets, spawn policy, OS, protocol and command mismatch are rejected without opening metadata paths', async () => {
  for (const mutate of [
    state => { state.identity.compiler_flags[3] = '-Onone'; },
    state => { state.identity.toolchain_selection.resolved.swift_version = '6'; },
    state => { state.identity.toolchain_selection.resolved.target = 'arm64-apple-ios18.0'; },
    state => { state.identity.toolchain_selection.sdk.version = '13.0'; },
    state => { state.identity.toolchain_selection.sdk.version = '9'.repeat(500); },
    state => { state.identity.toolchain_selection.sdk.settings_sha256 = ['a'.repeat(64)]; },
    state => { state.identity.spawn_environment.operator_TMPDIR_inherited = true; },
    state => { state.identity.protocol.recorded_per_scenario = 4; },
    state => { state.identity.os.platform = 'linux'; },
    state => { state.identity.compiler_command[12] = '/private/tmp/other.swift'; },
    state => { state.summary.order[2].command[0] = '/private/tmp/untrusted-command'; },
    state => { state.records[2].host_os_version = 'different OS'; }
  ]) await fixture(async state => { mutate(state); await state.save(); await assert.rejects(state.verify(state.options)); });
});

test('corpus drift, forged article provenance, extra files and symlinks fail the shared inventory contract', async () => {
  for (const mutate of [
    async state => { await writeFile(path.join(state.corpus, 'articles/fixture.json'), 'changed'); },
    async state => { await writeFile(path.join(state.corpus, 'unexpected.txt'), 'extra'); },
    async state => { await symlink('articles/fixture.json', path.join(state.corpus, 'linked')); },
    async state => {
      const manifest = JSON.parse(await readFile(path.join(state.corpus, 'manifest.json'))); manifest.articles[0].source_sha256 = 'd'.repeat(64);
      await writeFile(path.join(state.corpus, 'manifest.json'), json(manifest));
      const { manifest: ignored, ...counts } = await inventoryCorpus(state.corpus); Object.assign(state.identity, counts); await state.save();
    }
  ]) await fixture(async state => { await mutate(state); await assert.rejects(state.verify(state.options)); });
});

test('artifact and ancestor symlinks, special files, oversized inputs and unnormalized paths fail before unbounded reads', async () => {
  await fixture(async state => {
    await symlink(state.observation, path.join(state.root, 'linked-observation'));
    await assert.rejects(state.verify({ ...state.options, observation: path.join(state.root, 'linked-observation') }), /symlink/);
    await symlink(state.corpus, path.join(state.root, 'linked-corpus'));
    await assert.rejects(state.verify({ ...state.options, corpus: path.join(state.root, 'linked-corpus') }), /symlink/);
    await assert.rejects(state.verify({ ...state.options, observation: `${state.observation}/../observation` }), /normalized/);
    await assert.rejects(state.verify({ ...state.options, corpus: state.observation }), /overlap/);
  });
  for (const name of ['identity.json', 'summary.json', '02-validation-recorded-1.json', 'ContentValidator.swift', 'published-core-benchmark']) await fixture(async state => {
    const original = path.join(state.observation, name), outside = path.join(state.root, 'outside');
    await writeFile(outside, await readFile(original)); await rm(original); await symlink(outside, original);
    await assert.rejects(state.verify(state.options), /linked/);
  });
  await fixture(async state => { await rm(path.join(state.observation, 'identity.json')); await mkdir(path.join(state.observation, 'identity.json')); await assert.rejects(state.verify(state.options), /special/); });
  for (const [name, size] of [['identity.json', 1_048_577], ['summary.json', 2_097_153], ['02-validation-recorded-1.json', 1_048_577], ['published-core-benchmark', 64 * 1_048_576 + 1]]) {
    await fixture(async state => { await truncate(path.join(state.observation, name), size); await assert.rejects(state.verify(state.options), /oversized/); });
  }
});

test('verification CLI requires exactly three named options and never accepts execution or arbitrary input selectors', () => {
  assert.equal(parseVerificationArgs(['--help']), null);
  assert.deepEqual(parseVerificationArgs(['--revision', revision, '--corpus', '/Content', '--observation', '/saved']), { revision, corpus: '/Content', observation: '/saved' });
  for (const args of [[], ['--run'], ['--observation', '/saved', '--corpus', '/Content', '--exec', '/bin/sh'],
    ['--observation', '/saved', '--observation', '/other', '--revision', revision]]) assert.throws(() => parseVerificationArgs(args));
});
