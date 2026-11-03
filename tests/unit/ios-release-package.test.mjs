import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { verifyReleasePackage } from '../../ios/tests/check-release-package.mjs';

const digest = data => createHash('sha256').update(data).digest('hex');
const document = Buffer.from('{"text":"ネイティブ本文"}\n');

async function fixture(t) {
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
  return { root, app, content, sourceContentRoot, manifest,
    verify: () => verifyReleasePackage(app, { sourceContentRoot }) };
}

test('Release package audit verifies all normal files without altering them', async t => {
  const value = await fixture(t);
  assert.deepEqual(await value.verify(), { schema_version: 1, status: 'passed', native_schema_version: 2,
    revision: value.manifest.revision, articles: 1, audio: 0, verified_files: 1,
    verified_bytes: document.length, test_content_absent: true });
  assert.deepEqual(await readFile(path.join(value.content, 'articles/example.json')), document);
});

test('Release package audit rejects a missing listed file', async t => {
  const value = await fixture(t);
  await rm(path.join(value.content, 'articles/example.json'));
  await assert.rejects(value.verify(), /file inventory differs/);
});

test('Release package audit rejects changed bytes even when the inventory is complete', async t => {
  const value = await fixture(t);
  await writeFile(path.join(value.content, 'articles/example.json'), '破損した本文');
  await assert.rejects(value.verify(), /SHA-256 mismatch/);
});

test('Release package audit rejects an unlisted file', async t => {
  const value = await fixture(t);
  await writeFile(path.join(value.content, 'extra.txt'), 'not in manifest');
  await assert.rejects(value.verify(), /file inventory differs/);
});

test('Release package audit rejects a substituted manifest', async t => {
  const value = await fixture(t);
  await writeFile(path.join(value.content, 'manifest.json'), '{}');
  await assert.rejects(value.verify(), /manifest differs from the audited normal package/);
});

test('Release package audit rejects TestContent even if it is an empty directory', async t => {
  const value = await fixture(t);
  await mkdir(path.join(value.app, 'TestContent'));
  await assert.rejects(value.verify(), /includes TestContent/);
});

test('Release package audit rejects symlinks and a broken TestContent link', {
  skip: process.platform === 'win32' ? 'Windows symlink creation requires extra privileges' : false
}, async t => {
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

test('Release package audit rejects traversal and fixture metadata even when manifests agree', async t => {
  const value = await fixture(t);
  async function replace(body) {
    const manifest = { ...body, revision: digest(JSON.stringify(body)) };
    for (const directory of [value.sourceContentRoot, value.content]) await writeFile(path.join(directory, 'manifest.json'), JSON.stringify(manifest));
  }
  const { revision, ...body } = value.manifest;
  await replace({ ...body, files: { '../outside.json': digest(document) } });
  await assert.rejects(value.verify(), /Unsafe manifest path/);
  await replace({ ...body, articles: [{ id: 'test-fixtures/native-reader' }] });
  await assert.rejects(value.verify(), /includes a test article/);
});
