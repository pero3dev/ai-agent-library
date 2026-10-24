#!/usr/bin/env node
// Read-only CI audit: the Release app must contain the exact generated normal package.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const normalContentRoot = fileURLToPath(new URL('../AILibrary/Content/', import.meta.url));
const sha256 = data => createHash('sha256').update(data).digest('hex');

async function regularFiles(directory, prefix = '') {
  const files = [];
  assert.ok((await lstat(directory)).isDirectory(), `Not a directory: ${directory}`);
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    assert.ok(!entry.isSymbolicLink(), `Symlink in Release content: ${relative}`);
    if (entry.isDirectory()) files.push(...await regularFiles(path.join(directory, entry.name), relative + '/'));
    else {
      assert.ok(entry.isFile(), `Non-regular Release content: ${relative}`);
      files.push(relative);
    }
  }
  return files.sort();
}

export async function verifyReleasePackage(appRoot, { sourceContentRoot = normalContentRoot } = {}) {
  const app = path.resolve(appRoot);
  assert.ok((await lstat(app)).isDirectory(), 'Release application must be a real directory');
  try {
    await lstat(path.join(app, 'TestContent'));
    assert.fail('Release application includes TestContent');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const content = path.join(app, 'Content');
  const manifestData = await readFile(path.join(content, 'manifest.json'));
  assert.deepEqual(manifestData, await readFile(path.join(sourceContentRoot, 'manifest.json')),
    'Release manifest differs from the audited normal package');
  const manifest = JSON.parse(manifestData);
  assert.equal(manifest.schema_version, 2, 'Expected native package schema 2');
  assert.ok(Array.isArray(manifest.articles) && manifest.articles.length > 0, 'Normal articles are missing');
  assert.ok(manifest.articles.every(article => article.is_test_fixture !== true
    && typeof article.id === 'string' && !article.id.startsWith('test-fixtures/')), 'Release manifest includes a test article');
  assert.ok(Array.isArray(manifest.audio), 'Audio metadata is missing');
  assert.ok(manifest.files && typeof manifest.files === 'object' && !Array.isArray(manifest.files), 'Invalid file inventory');
  assert.equal(manifest.revision, sha256(JSON.stringify({ schema_version: manifest.schema_version,
    articles: manifest.articles, audio: manifest.audio, files: manifest.files })), 'Manifest revision mismatch');
  const entries = Object.entries(manifest.files);
  assert.ok(entries.length > 0, 'Empty file inventory');
  for (const [relative, expected] of entries) {
    assert.ok(relative !== 'manifest.json' && !path.posix.isAbsolute(relative)
      && !/[\\\0]/.test(relative) && relative.split('/').every(part => part && part !== '.' && part !== '..'),
    `Unsafe manifest path: ${relative}`);
    assert.match(expected, /^[a-f0-9]{64}$/, `Invalid SHA-256: ${relative}`);
  }
  assert.deepEqual(await regularFiles(content), ['manifest.json', ...entries.map(([relative]) => relative)].sort(),
    'Release file inventory differs from the manifest');
  let verifiedBytes = 0;
  for (const [relative, expected] of entries) {
    const data = await readFile(path.join(content, relative));
    assert.equal(sha256(data), expected, `Release SHA-256 mismatch: ${relative}`);
    verifiedBytes += data.length;
  }
  return { schema_version: 1, status: 'passed', native_schema_version: manifest.schema_version,
    revision: manifest.revision, articles: manifest.articles.length, audio: manifest.audio.length,
    verified_files: entries.length, verified_bytes: verifiedBytes, test_content_absent: true };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assert.equal(process.argv.length, 3, 'Usage: node ios/tests/check-release-package.mjs <Release AILibrary.app>');
    console.log(JSON.stringify(await verifyReleasePackage(process.argv[2]), null, 2));
  } catch (error) {
    console.error(`Release package audit failed: ${error.message}`);
    process.exitCode = 1;
  }
}
