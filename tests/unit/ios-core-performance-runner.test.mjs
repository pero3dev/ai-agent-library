import assert from 'node:assert/strict';
import { requiredFixture, objectFixture, stringFixture } from '../helpers/json-fixtures.mjs';
import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SCENARIOS, collectSamples, idsDigest, inventoryCorpus, literalQueries, parseArgs, publishedSource, runBounded, sha256, summarize, validateRecord } from '../../ios/tests/core-performance-runner.mjs';

const candidate = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const digest = 'a'.repeat(64), invocationID = '11111111-1111-4111-8111-111111111111';
const identity = { manifest_sha256: digest, query_sha256: digest, query_count: 2, expected_article_count: 3,
  corpus_revision: 'revision', article_order_sha256: digest, executable_architecture: 'arm64' };
const queryResults = [0, 1].map(index => ({ query_index: index, result_count: index, ordered_ids_sha256: digest }));
/** @param {string} [mode] @returns {import('../../ios/tests/core-performance-runner.mjs').PerformanceRecord} */
function record(mode = SCENARIOS[2]) {
  return { schema_version: 1, mode, invocation_id: invocationID, process_id: 123,
    executable_architecture: 'arm64', host_os_version: 'fixture macOS',
    identity_sha256: digest, manifest_sha256: digest, query_sha256: digest, query_count: 2,
    actual_article_count: 3, corpus_revision: 'revision', article_order_sha256: digest,
    ...(mode === 'correctness' ? { correctness: 'ordered-indexed-equals-production-uncached' } : { wall_seconds: 0.005, process_peak_resident_bytes: 123456 }),
    ...(mode !== SCENARIOS[0] ? { query_results: structuredClone(queryResults) } : {}) };
}
/** @param {ReturnType<typeof record>} value */
const validate = value => validateRecord(value, identity, digest, value.mode, invocationID, { query_results: queryResults }, 123);

/** @template T @param {(root:string)=>Promise<T>} action @returns {Promise<T>} */
async function fixture(action) {
  const location = await mkdtemp(path.join(candidate, '.core-performance-test-'));
  try { return await action(location); } finally { await rm(location, { recursive: true, force: true }); }
}
/** @param {string} root */
async function corpus(root) {
  const content = path.join(root, 'Content'); await mkdir(content);
  await mkdir(path.join(content, 'articles'));
  const document = Buffer.from('{"fixture":true}\n');
  await writeFile(path.join(content, 'articles/one.json'), document);
  await writeFile(path.join(content, 'manifest.json'), JSON.stringify({ schema_version: 2, revision: 'fixture-revision',
    articles: [{ id: 'one', source_path: 'docs/00-example/one.md', source_sha256: digest }], files: { 'articles/one.json': sha256(document) } }));
  return content;
}

test('accepted records preserve all three scenario identities and separate correctness', () => {
  for (const mode of [...SCENARIOS, 'correctness']) assert.equal(validate(record(mode)).mode, mode);
  const value = record('correctness'); value.wall_seconds = 0.1;
  assert.throws(() => validate(value));
});

test('missing/nonfinite/zero/negative metrics are rejected, without zero filling', () => {
  for (const key of ['wall_seconds', 'process_peak_resident_bytes']) {
    for (const invalid of [undefined, null, NaN, Infinity, -Infinity, 0, -1, '0.1']) {
      const value = record();
      if (invalid === undefined) Reflect.deleteProperty(value, key); else Reflect.set(value, key, invalid);
      assert.throws(() => validate(value), `${key}=${String(invalid)}`);
    }
  }
  for (const invalid of [0.5, Number.MAX_SAFE_INTEGER + 1]) {
    const value = record(); value.process_peak_resident_bytes = invalid; assert.throws(() => validate(value));
  }
});

test('SHA/count/order/revision/process/scenario mismatches fail closed', () => {
  for (const [key, invalid] of Object.entries({ schema_version: 2, invocation_id: 'other', process_id: 124, identity_sha256: 'b'.repeat(64),
    manifest_sha256: 'b'.repeat(64), query_sha256: 'b'.repeat(64), query_count: 1, actual_article_count: 2,
    corpus_revision: 'other', article_order_sha256: 'b'.repeat(64), executable_architecture: 'x86_64', host_os_version: '' })) {
    const value = record(); Reflect.set(value, key, invalid); assert.throws(() => validate(value), key);
  }
  const value = record(); Reflect.set(value, 'extraMetric', 5); assert.throws(() => validate(value));
  assert.throws(() => validateRecord(record(), identity, digest, SCENARIOS[1], invocationID, null, 123));
});

test('each ordered indexed result must equal the correctness oracle digest', () => {
  for (const mutate of /** @type {((value:ReturnType<typeof record>)=>void)[]} */ ([
    value => { Reflect.deleteProperty(value, 'query_results'); },
    value => { requiredFixture(value.query_results).pop(); },
    value => { requiredFixture(value.query_results).reverse(); },
    value => { requiredFixture(value.query_results)[1].result_count = -1; },
    value => { requiredFixture(value.query_results)[1].result_count = 4; },
    value => { requiredFixture(value.query_results)[1].ordered_ids_sha256 = 'b'.repeat(64); },
    value => { requiredFixture(value.query_results)[1].ordered_ids_sha256 = 'missing'; },
    value => { Reflect.set(requiredFixture(value.query_results)[0], 'extra', true); }
  ])) { const value = record(); mutate(value); assert.throws(() => validate(value)); }
  assert.notEqual(idsDigest(['ab', 'c']), idsDigest(['a', 'bc']));
  assert.notEqual(idsDigest(['one', 'two']), idsDigest(['two', 'one']));
  assert.equal(idsDigest(['ガイド']), sha256('9:ガイド\n'));
});

test('five-sample statistics retain median/minimum/maximum/range only', () => {
  const values = [5, 1, 2, 4, 3].map(wall_seconds => ({ wall_seconds, process_peak_resident_bytes: wall_seconds * 10 }));
  assert.deepEqual(summarize(values), { wall_seconds: { median: 3, minimum: 1, maximum: 5, range: 4 }, process_peak_resident_bytes: { median: 30, minimum: 10, maximum: 50, range: 40 } });
  assert.throws(() => summarize(values.slice(1)));
  assert.throws(() => summarize([...values.slice(1), { wall_seconds: NaN, process_peak_resident_bytes: 10 }]));
});

test('literal Swift escape conversion preserves width/kana/combining marks and whitespace', async () => {
  const parsedQueries = /** @type {unknown} */ (JSON.parse(await readFile(path.join(candidate, 'ios/tests/core-performance-queries.json'), 'utf8')));
  assert.ok(Array.isArray(parsedQueries));
  const queries = parsedQueries.map(stringFixture);
  assert.equal(queries.length, 16);
  assert.equal(queries[1], ' \t\n　');
  assert.equal(queries[11], 'cafe\u0301');
  assert.equal(queries[15], '__no_match_128__');
  assert.deepEqual(literalQueries('for query in ["", "cafe\\u{301}", "\\t\\n"] {'), ['', 'cafe\u0301', '\t\n']);
  assert.throws(() => literalQueries('for query in queryFactory() {'));
});

test('independent front matter scanner rejects ambiguous or unknown status', () => {
  assert(publishedSource('---\nstatus: published\n---\nbody', 'fixture'));
  assert(!publishedSource('---\r\nstatus: "draft"\r\n---\r\nbody', 'fixture'));
  for (const source of ['status: published', '---\nstatus: published\nstatus: draft\n---', '---\nstatus: archived\n---', '---\nstatus: &anchor published\n---']) {
    assert.throws(() => publishedSource(source, 'fixture'));
  }
});

test('bounded child collects one JSON record and rejects timeout/output/failure', async () => {
  const value = await runBounded(process.execPath, ['-e', 'process.stdout.write(JSON.stringify({fixture:true}))'], { timeoutMs: 2000 });
  assert.deepEqual(JSON.parse(value.stdout.toString('utf8')), { fixture: true });
  assert(Number.isSafeInteger(value.pid));
  await assert.rejects(runBounded(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { timeoutMs: 100 }), /time limit/);
  await assert.rejects(runBounded(process.execPath, ['-e', 'process.stdout.write("x".repeat(100000))'], { maxBytes: 128 }), /output limit/);
  await assert.rejects(runBounded(process.execPath, ['-e', 'process.stderr.write("fixture failure");process.exit(3)']), /fixture failure/);
  await assert.rejects(runBounded('/definitely/missing/benchmark-fixture', []), /ENOENT/);
  assert.throws(() => runBounded(process.execPath, [], { deadline: Date.now() - 1 }), /deadline/);
});

test('inventory accepts hashed miniature bytes, detects drift, and rejects unlisted/symlink input', { skip: process.platform === 'win32' ? "The immutable runner requires POSIX paths, /bin/bash or process group signals" : false }, async () => {
  await fixture(async root => {
    const content = await corpus(root), first = await inventoryCorpus(content);
    assert.equal(first.files_including_manifest, 2); assert.equal(first.listed_sha_files, 1);
    assert.equal(first.manifest.articles.length, 1); assert(first.bytes_including_manifest > 0);
    await writeFile(path.join(content, 'articles/one.json'), 'changed');
    await assert.rejects(inventoryCorpus(content), /SHA mismatch/);
  });
  await fixture(async root => {
    const content = await corpus(root); await writeFile(path.join(content, 'unlisted.txt'), 'extra');
    await assert.rejects(inventoryCorpus(content), /Unexpected or missing/);
  });
  await fixture(async root => {
    const content = await corpus(root); await symlink(content, path.join(root, 'linked'));
    await assert.rejects(inventoryCorpus(path.join(root, 'linked')), /Symlink ancestor/);
    await symlink('articles/one.json', path.join(content, 'inside-link'));
    await assert.rejects(inventoryCorpus(content), /symlink/);
  });
});

test('shell help and absent-run guard never reach a compiler', { skip: process.platform === 'win32' ? "The immutable runner requires POSIX paths, /bin/bash or process group signals" : false }, async () => {
  const script = path.join(candidate, 'ios/tests/check-core-performance.sh');
  const env = { NODE_BINARY: process.execPath };
  const help = await runBounded('/bin/bash', [script, '--help'], { env });
  assert.match(help.stdout.toString(), /explicit|Usage/);
  await assert.rejects(runBounded('/bin/bash', [script], { env }), /explicit --run/);
  assert.throws(() => parseArgs(['--run', '--repo', '/repo', '--revision', 'main', '--corpus', '/Content', '--output', '/new']), /immutable/);
  assert.throws(() => parseArgs(['--run', '--repo', '/repo', '--repo', '/other', '--corpus', '/Content', '--output', '/new']), /duplicate/);
  assert.equal(requiredFixture(parseArgs(['--run', '--repo', '/repo', '--revision', 'a'.repeat(40), '--corpus', '/Content', '--output', '/new']))['--revision'], 'a'.repeat(40));
});


test('complete protocol uses 19 distinct fixture processes and discards only warmups', async () => {
  /** @type {[string,string,number][]} */
  const calls = [];
  const pids = new Set();
  const scenarios = await collectSamples(async (mode, kind, ordinal, oracle) => {
    const value = record(mode);
    if (mode !== 'correctness') value.wall_seconds = kind === 'discarded-warmup' ? 999 : ordinal;
    const child = await runBounded(process.execPath, ['-e', 'const value=JSON.parse(process.argv[1]);value.process_id=process.pid;process.stdout.write(JSON.stringify(value))', JSON.stringify(value)], { timeoutMs: 2000 });
    assert(!pids.has(child.pid)); pids.add(child.pid);
    const actual = validateRecord(JSON.parse(child.stdout.toString('utf8')), identity, digest, mode, invocationID, oracle, child.pid);
    calls.push([mode, kind, ordinal]);
    return actual;
  });
  assert.equal(calls.length, 19); assert.equal(pids.size, 19);
  assert.deepEqual(calls[0], ['correctness', 'correctness', 0]);
  for (const [offset, mode] of SCENARIOS.entries()) {
    assert.deepEqual(calls[1 + offset * 6], [mode, 'discarded-warmup', 0]);
    assert.deepEqual(calls.slice(2 + offset * 6, 7 + offset * 6).map(c => c[2]), [1, 2, 3, 4, 5]);
    assert.equal(scenarios[offset].discarded_warmup.wall_seconds, 999);
    assert.equal(scenarios[offset].descriptive.wall_seconds.median, 3);
    assert.equal(scenarios[offset].descriptive.wall_seconds.maximum, 5);
  }
});


/** @param {()=>boolean|Promise<boolean>} predicate @param {string} message @param {number} [limitMs] */
async function waitFor(predicate, message, limitMs = 3000) {
  const deadline = Date.now() + limitMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  assert.fail(message);
}
/** @param {number} pid */
function isAlive(pid) {
  try { process.kill(pid, 0); return true; }
  catch (error) { if (error instanceof Error && 'code' in error && error.code === 'ESRCH') return false; throw error; }
}
/** @param {import('node:child_process').ChildProcess} child @returns {Promise<{code:number|null,signal:NodeJS.Signals|null}>} */
function closed(child) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => resolve({ code, signal }));
  });
}

for (const [ending, expectedCode] of /** @type {[NodeJS.Signals|'exit',number][]} */ ([['SIGINT', 130], ['SIGTERM', 143], ['exit', 7]])) {
  test(`parent ${ending} kills only its active child group and exits nonzero`, { skip: process.platform === 'win32' ? "The immutable runner requires POSIX paths, /bin/bash or process group signals" : false, timeout: 10000 }, async () => {
    await fixture(async root => {
      const marker = path.join(root, 'child.pid');
      const runnerURL = pathToFileURL(path.join(candidate, 'ios/tests/core-performance-runner.mjs')).href;
      const parentCode = `
        import { installProcessCleanup, runBounded } from ${JSON.stringify(runnerURL)};
        import { existsSync } from 'node:fs';
        installProcessCleanup();
        ${ending === 'exit' ? `const timer=setInterval(()=>{if(existsSync(process.argv[1])){clearInterval(timer);process.exit(7);}},20);` : ''}
        await runBounded(process.execPath, ['-e', 'require("node:fs").writeFileSync(process.argv[1], String(process.pid));setInterval(()=>{}, 1000)', process.argv[1]], { timeoutMs: 20000 });
      `;
      const control = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { stdio: 'ignore' });
      const controlClosed = closed(control);
      const parent = spawn(process.execPath, ['--input-type=module', '-e', parentCode, marker], { stdio: 'ignore' });
      const parentClosed = closed(parent);
      /** @type {number|undefined} */
      let ownedChildPID;
      try {
        await waitFor(async () => {
          try { ownedChildPID = Number(await readFile(marker, 'utf8')); return Number.isSafeInteger(ownedChildPID) && ownedChildPID > 0; }
          catch (error) { if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false; throw error; }
        }, 'Fixture child did not report its PID');
        if (ending !== 'exit') {
          assert(isAlive(requiredFixture(ownedChildPID)), 'Fixture child must be running before signal');
          assert(parent.kill(ending), 'Could not signal fixture parent');
        }
        const result = await Promise.race([parentClosed, new Promise((_, reject) => setTimeout(() => reject(new Error('Fixture parent did not terminate')), 3000).unref())]);
        assert.deepEqual(result, { code: expectedCode, signal: null });
        await waitFor(() => !isAlive(requiredFixture(ownedChildPID)), 'Owned long-running child survived parent cleanup');
        assert(isAlive(requiredFixture(control.pid)), 'Cleanup killed an unrelated control process');
      } finally {
        // Cleanup only fixture handles/PIDs created here, even if an assertion fails.
        if (parent.exitCode === null && parent.signalCode === null) parent.kill('SIGKILL');
        if (ownedChildPID && isAlive(ownedChildPID)) { try { process.kill(-ownedChildPID, 'SIGKILL'); } catch {} }
        control.kill('SIGKILL');
        await Promise.all([parentClosed, controlClosed]);
      }
    });
  });
}
