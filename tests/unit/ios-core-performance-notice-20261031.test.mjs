import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { test } from 'node:test';
import { appendFile, copyFile, mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { BYTE_CONTRACT, verifyObservation as verifyLegacyObservation } from '../../ios/tests/verify-core-performance.mjs';
import { NOTICE_BYTE_CONTRACT, main, verifyNoticeObservation } from '../../ios/tests/verify-core-performance-notice-20261031.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const installation = path.resolve(here, '../../ios/tests');
const entryName = 'verify-core-performance-notice-20261031.mjs';
const entry = path.join(installation, entryName);
const revision = 'a'.repeat(40);
const execute = promisify(execFile);
const metadataNames = ['manifest_sha256', 'corpus_sha256', 'files_including_manifest', 'listed_sha_files',
  'bytes_including_manifest', 'png_files', 'corpus_revision', 'article_order_sha256', 'compiler_version',
  'compiler_flags', 'compiler_command', 'toolchain_selection', 'spawn_environment', 'executable_sha256',
  'executable_architecture', 'os', 'clock', 'memory', 'protocol'];
// A deliberately incomplete observation: real policy checks must run first, then
// stop at the known invalid manifest digest. This never claims full acceptance,
// executes saved code, needs production articles, or fabricates 19 measurements.
const identity = contract => ({ schema_version: 1, source_revision: revision,
  ...structuredClone(contract), ...Object.fromEntries(metadataNames.map(name => [name, null])) });
async function fixture(t) {
  const root = await mkdtemp(path.join(await realpath(os.tmpdir()), 'notice-verifier-boundary-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const observation = path.join(root, 'observation'), corpus = path.join(root, 'Content');
  await mkdir(observation); await mkdir(corpus);
  const options = { observation, corpus, revision };
  return { root, observation, corpus, options,
    async save(value) { await writeFile(path.join(observation, 'identity.json'), JSON.stringify(value) + '\n'); },
    args: ['--observation', observation, '--corpus', corpus, '--revision', revision] };
}
const byteMismatch = /Preregistered byte identity mismatch: production_source_sha256/;
const metadataBoundary = /Invalid manifest_sha256/;

test('dated policy freezes Notice Source4 while retaining the legacy non-source identities', () => {
  assert.deepEqual(NOTICE_BYTE_CONTRACT.production_source_sha256, {
    'ios/AILibrary/Sources/Models.swift': '459423194145e677834d35b57201ae60f0c9e9b5ab449a620cb519f5a070292c',
    'ios/AILibrary/Sources/NativeDocument.swift': 'ce96e4960eef766e325b1b4b7d3701d4a7d5b5c3b1e69ae9599fd0f2622af2ab',
    'ios/AILibrary/Sources/ContentValidator.swift': 'ffcdab90f0a8f39fc8b7cfceea0ba48aac7f18df1c033b237d2da311562e385a',
    'ios/AILibrary/Sources/ReadingStore.swift': 'da88bdb3ef99a93ddb842f53e7e92bdba2dfc4e95bff0f78f9d467387e9acfe7'
  });
  for (const key of Object.keys(BYTE_CONTRACT).filter(key => key !== 'production_source_sha256'))
    assert.deepEqual(NOTICE_BYTE_CONTRACT[key], BYTE_CONTRACT[key]);
  assert(Object.isFrozen(NOTICE_BYTE_CONTRACT) && Object.isFrozen(NOTICE_BYTE_CONTRACT.production_source_sha256));
  assert.throws(() => { NOTICE_BYTE_CONTRACT.query_count = 1; }, TypeError);
  assert.throws(() => { NOTICE_BYTE_CONTRACT.production_source_sha256['ios/AILibrary/Sources/Models.swift'] = '0'.repeat(64); }, TypeError);
  assert.equal(NOTICE_BYTE_CONTRACT.query_count, 16); assert.equal(NOTICE_BYTE_CONTRACT.expected_article_count, 199);
});

test('legacy identity cannot pass Notice policy and Notice identity reaches the next metadata boundary', async t => {
  const f = await fixture(t);
  await f.save(identity(BYTE_CONTRACT));
  await assert.rejects(verifyNoticeObservation(f.options), byteMismatch);
  await f.save(identity(NOTICE_BYTE_CONTRACT));
  await assert.rejects(verifyNoticeObservation(f.options), metadataBoundary);
  // The dated entrypoint does not expand the old verifier's accepted byte set.
  await assert.rejects(verifyLegacyObservation(f.options), byteMismatch);
});

test('every Source4 digest remains mandatory even when saved candidate metadata is regenerated', async t => {
  const f = await fixture(t);
  for (const source of Object.keys(NOTICE_BYTE_CONTRACT.production_source_sha256)) {
    const candidate = identity(NOTICE_BYTE_CONTRACT);
    candidate.production_source_sha256[source] = '0'.repeat(64);
    await f.save(candidate);
    await assert.rejects(verifyNoticeObservation(f.options), byteMismatch);
  }
});

test('API and candidate identity cannot inject a replacement profile or runner directory', async t => {
  const f = await fixture(t);
  for (const extra of [{ trustedByteContract: BYTE_CONTRACT }, { trustedRunnerDirectory: f.observation }, { profile: 'legacy' }])
    await assert.rejects(verifyNoticeObservation({ ...f.options, ...extra }), /Unexpected\/missing fields/);
  for (const extra of [{ trusted_byte_contract: BYTE_CONTRACT }, { profile: NOTICE_BYTE_CONTRACT }, { runner_directory: f.observation }]) {
    await f.save({ ...identity(NOTICE_BYTE_CONTRACT), ...extra });
    await assert.rejects(verifyNoticeObservation(f.options), /Unexpected\/missing fields/);
  }
});

test('existing CLI grammar rejects profile files, unknown flags and duplicate arguments before observation IO', async t => {
  const f = await fixture(t);
  const profileFile = path.join(f.root, 'candidate-profile.json');
  await writeFile(profileFile, JSON.stringify(BYTE_CONTRACT));
  for (const flag of ['--contract', '--profile', '--runner-directory']) {
    await assert.rejects(main([...f.args, flag, profileFile]), /Expected --observation/);
    await assert.rejects(main([flag, profileFile, '--corpus', f.corpus, '--revision', revision]), /Unknown\/duplicate verification argument/);
  }
  await assert.rejects(main(['--observation', f.observation, '--observation', f.observation, '--revision', revision]), /Unknown\/duplicate verification argument/);
});

test('CLI environment values cannot cause an old observation to select legacy policy', async t => {
  const f = await fixture(t); await f.save(identity(BYTE_CONTRACT));
  await assert.rejects(execute(process.execPath, [entry, ...f.args], { timeout: 3000, maxBuffer: 128 * 1024,
    env: { PATH: process.env.PATH ?? '', HOME: process.env.HOME ?? '', TMPDIR: os.tmpdir(),
      CORE_PERFORMANCE_CONTRACT: JSON.stringify(BYTE_CONTRACT), AILIBRARY_CORE_PROFILE: 'legacy' } }), error => {
    assert.equal(error.code, 1); assert.equal(error.stdout, '');
    assert.match(error.stderr, /Notice Core observation rejected:.*Preregistered byte identity mismatch: production_source_sha256/s);
    return true;
  });
});

test('fixed runner directory binds actual installation bytes and rejects later tampering', async t => {
  const f = await fixture(t), trusted = path.join(f.root, 'trusted-installation');
  await mkdir(trusted);
  for (const name of [entryName, 'verify-core-performance.mjs', 'core-performance-runner.mjs'])
    await copyFile(path.join(installation, name), path.join(trusted, name));
  const copied = await import(pathToFileURL(path.join(trusted, entryName)).href);
  await f.save(identity(NOTICE_BYTE_CONTRACT));
  await assert.rejects(copied.verifyNoticeObservation(f.options), metadataBoundary);
  await appendFile(path.join(trusted, 'core-performance-runner.mjs'), '\n// private boundary tamper fixture\n');
  await assert.rejects(copied.verifyNoticeObservation(f.options), /Trusted runner artifact contract changed/);
});

test('dated CLI retains the existing help-only path and advertises no profile selector', async () => {
  const result = await execute(process.execPath, [entry, '--help'], { timeout: 3000, maxBuffer: 128 * 1024 });
  assert.equal(result.stderr, ''); assert.match(result.stdout, /--observation .*--corpus .*--revision/);
  assert.doesNotMatch(result.stdout, /--profile|--contract|--runner-directory/);
});
