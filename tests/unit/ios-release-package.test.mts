import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { verifyReleasePackage } from '../../ios/tests/check-release-package.mjs';

/** @param {import('node:crypto').BinaryLike} data */
const digest = (data: import('node:crypto').BinaryLike) => createHash('sha256').update(data).digest('hex');
const executable = Buffer.from('ordinary Release executable\n');
const document = Buffer.from('{"text":"ネイティブ本文"}\n');

/** @param {import('node:test').TestContext} t */
async function fixture(t: import('node:test').TestContext) {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'ailibrary-ios-release-test-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourceContentRoot = path.join(root, 'generated');
  const app = path.join(root, 'AILibrary.app');
  const content = path.join(app, 'Content');
  const body = { schema_version: 2, articles: [{ id: 'example', is_test_fixture: false }], audio: [],
    files: { 'articles/example.json': digest(document) } };
  const manifest = { ...body, revision: digest(JSON.stringify(body)) };
  await mkdir(sourceContentRoot, { recursive: true });
  await mkdir(path.join(content, 'articles'), { recursive: true });
  for (const directory of [sourceContentRoot, content]) await writeFile(path.join(directory, 'manifest.json'), JSON.stringify(manifest));
  await writeFile(path.join(content, 'articles/example.json'), document);
  await writeFile(path.join(app, 'AILibrary'), executable);
  return { root, app, content, sourceContentRoot, manifest,
    verify: () => verifyReleasePackage(app, { sourceContentRoot }) };
}

test('Release package audit verifies all normal files without altering them', async (t) => {
  const value = await fixture(t);
  assert.deepEqual(await value.verify(), { schema_version: 1, status: 'passed', native_schema_version: 2,
    revision: value.manifest.revision, articles: 1, audio: 0, verified_files: 1,
    verified_bytes: document.length, test_content_absent: true,
    fresh_bundle_test_hooks_absent: true, checked_code_images: 1, checked_code_bytes: executable.length });
  assert.deepEqual(await readFile(path.join(value.content, 'articles/example.json')), document);
  assert.deepEqual(await readFile(path.join(value.app, 'AILibrary')), executable);
});

test('Release package audit rejects a missing listed file', async (t) => {
  const value = await fixture(t);
  await rm(path.join(value.content, 'articles/example.json'));
  await assert.rejects(value.verify(), /file inventory differs/);
});

test('Release package audit rejects changed bytes even when the inventory is complete', async (t) => {
  const value = await fixture(t);
  await writeFile(path.join(value.content, 'articles/example.json'), '破損した本文');
  await assert.rejects(value.verify(), /SHA-256 mismatch/);
});

test('Release package audit rejects an unlisted file', async (t) => {
  const value = await fixture(t);
  await writeFile(path.join(value.content, 'extra.txt'), 'not in manifest');
  await assert.rejects(value.verify(), /file inventory differs/);
});

test('Release package audit rejects a substituted manifest', async (t) => {
  const value = await fixture(t);
  await writeFile(path.join(value.content, 'manifest.json'), '{}');
  await assert.rejects(value.verify(), /manifest differs from the audited normal package/);
});

test('Release package audit rejects TestContent even if it is an empty directory', async (t) => {
  const value = await fixture(t);
  await mkdir(path.join(value.app, 'TestContent'));
  await assert.rejects(value.verify(), /includes TestContent/);
});

test('Release package audit rejects symlinks and a broken TestContent link', {
  skip: process.platform === 'win32' ? 'Windows symlink creation requires extra privileges' : false
}, async (t) => {
  const value = await fixture(t);
  const article = path.join(value.content, 'articles/example.json');
  await rm(article);
  await symlink(path.join(value.sourceContentRoot, 'manifest.json'), article);
  await assert.rejects(value.verify(), /Symlink in Release content/);
  await rm(article);
  await writeFile(article, document);
  await symlink('missing', path.join(value.app, 'TestContent'));
  await assert.rejects(value.verify(), /includes TestContent/);
  await rm(path.join(value.app, 'TestContent'));
  await rm(value.content, { recursive: true });
  await symlink(value.sourceContentRoot, value.content);
  await assert.rejects(value.verify(), /Not a directory/);
});

test('Release package audit rejects traversal and fixture metadata even when manifests agree', async (t) => {
  const value = await fixture(t);
/** @param {Record<string,unknown>} body */
  async function replace(body: Record<string, unknown>) {
    const manifest = { ...body, revision: digest(JSON.stringify(body)) };
    for (const directory of [value.sourceContentRoot, value.content]) await writeFile(path.join(directory, 'manifest.json'), JSON.stringify(manifest));
  }
  const { revision, ...body } = value.manifest;
  await replace({ ...body, files: { '../outside.json': digest(document) } });
  await assert.rejects(value.verify(), /Unsafe manifest path/);
  await replace({ ...body, articles: [{ id: 'test-fixtures/native-reader' }] });
  await assert.rejects(value.verify(), /includes a test article/);
});

test('Release code audit rejects fresh bundled launch hooks in the executable and code libraries', async (t) => {
  const tokens = [
    "AILIBRARY_UI_TEST_FRESH_BUNDLE_UUID",
    "AILIBRARY_UI_TEST_FRESH_BUNDLE_MODE",
    "LibraryFreshBundle-",
    "uitest-fresh-bundled-launch-proof",
    "同梱起動の試験証拠",
    "Invalid isolated fresh bundled launch",
    "Fresh bundled launch has no Application Support root",
    "UITestFreshBundledLaunch"
];
  for (const image of ['AILibrary', 'AILibrary.debug.dylib']) {
    for (const token of tokens) {
      await t.test(`${image}: ${token}`, async (t) => {
        const value = await fixture(t);
        const contents = Buffer.from(`ordinary code\0${token}\0ordinary code`, 'utf8');
        await writeFile(path.join(value.app, image), contents);
        await assert.rejects(value.verify(), /contains a fresh bundled launch test hook/);
        assert.deepEqual(await readFile(path.join(value.app, image)), contents);
      });
    }
  }
});

test('Release code audit rejects a missing application executable', async (t) => {
  const value = await fixture(t);
  await rm(path.join(value.app, 'AILibrary'));
  await assert.rejects(value.verify(), /ENOENT/);
});

test('Release code audit rejects a symlinked code library without changing its target', {
  skip: process.platform === 'win32' ? 'Windows symlink creation requires extra privileges' : false
}, async (t) => {
  const value = await fixture(t);
  const binary = path.join(value.app, 'AILibrary');
  const before = await readFile(binary);
  await symlink('AILibrary', path.join(value.app, 'AILibrary.debug.dylib'));
  await assert.rejects(value.verify(), /code image must be a regular file/);
  assert.deepEqual(await readFile(binary), before);
});

test('Release code audit leaves non-code bundle resources outside its token scan', async (t) => {
  const value = await fixture(t);
  await writeFile(path.join(value.app, 'DEBUG_NOTES.txt'), 'AILIBRARY_UI_TEST_FRESH_BUNDLE_UUID');
  const result = await value.verify();
  assert.equal(result.status, 'passed');
  assert.equal(result.fresh_bundle_test_hooks_absent, true);
  assert.equal(result.checked_code_images, 1);
});

test('Release code audit detects a hook split across bounded read chunks', async (t) => {
  const value = await fixture(t);
  const data = Buffer.concat([Buffer.alloc(64 * 1024 - 10, 0x61),
    Buffer.from('AILIBRARY_UI_TEST_FRESH_BUNDLE_UUID'), Buffer.alloc(10, 0x62)]);
  await writeFile(path.join(value.app, 'AILibrary'), data);
  await assert.rejects(value.verify(), /contains a fresh bundled launch test hook/);
  assert.deepEqual(await readFile(path.join(value.app, 'AILibrary')), data);
});
