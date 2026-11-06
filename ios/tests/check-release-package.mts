#!/usr/bin/env node
// Read-only CI audit: the Release app must contain the exact generated normal package.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, open, readFile, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const normalContentRoot = fileURLToPath(new URL('../AILibrary/Content/', import.meta.url));
/** @param {import('node:crypto').BinaryLike} data */
const sha256 = (data: import('node:crypto').BinaryLike) => createHash('sha256').update(data).digest('hex');

/** @param {string} directory @param {string} [prefix] @returns {Promise<string[]>} */
async function regularFiles(directory: string, prefix: string = ''): Promise<string[]> {
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


const freshBundleDebugTokens = [
  "AILIBRARY_UI_TEST_FRESH_BUNDLE_UUID",
  "AILIBRARY_UI_TEST_FRESH_BUNDLE_MODE",
  "LibraryFreshBundle-",
  "uitest-fresh-bundled-launch-proof",
  "同梱起動の試験証拠",
  "Invalid isolated fresh bundled launch",
  "Fresh bundled launch has no Application Support root",
  "UITestFreshBundledLaunch"
] as const;

// Audit this target's executable and top-level code libraries. This checks the
// fresh-launch DEBUG hooks; content integrity and Mach-O validation are separate.
async function verifyFreshBundleTestHooksAbsent(app: string) {
  const libraries = (await readdir(app, { withFileTypes: true }))
    .filter((entry) => entry.name.endsWith('.dylib')).map((entry) => entry.name);
  const images = ['AILibrary', ...libraries].sort();
  assert.ok(images.length <= 16, 'Too many Release code images');
  const forbidden = freshBundleDebugTokens.map((token) => ({ token, bytes: Buffer.from(token, 'utf8') }));
  const overlap = Math.max(...forbidden.map(({ bytes }) => bytes.length)) - 1;
  const identity = (info: import('node:fs').BigIntStats) =>
    [info.dev, info.ino, info.mode, info.size, info.mtimeNs, info.ctimeNs];
  let checkedCodeBytes = 0;
  for (const name of images) {
    const file = path.join(app, name);
    const metadata = await lstat(file, { bigint: true });
    assert.ok(metadata.isFile() && !metadata.isSymbolicLink(),
      `Release code image must be a regular file: ${name}`);
    assert.ok(metadata.size > 0n && metadata.size <= 64n * 1024n * 1024n,
      `Release code image exceeds its size budget: ${name}`);
    const expectedBytes = Number(metadata.size);
    checkedCodeBytes += expectedBytes;
    assert.ok(checkedCodeBytes <= 128 * 1024 * 1024, 'Release code images exceed their total budget');
    const handle = await open(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
    try {
      const opened = await handle.stat({ bigint: true });
      assert.ok(opened.isFile(), `Release code image is no longer regular: ${name}`);
      assert.deepEqual(identity(opened), identity(metadata), `Release code image changed before audit: ${name}`);
      const chunk = Buffer.alloc(64 * 1024);
      let tail = Buffer.alloc(0);
      let readBytes = 0;
      // At most the pinned size plus one EOF-probe byte is ever requested.
      // Read requests use a 64KiB buffer; only token overlap crosses chunks.
      while (readBytes <= expectedBytes) {
        const { bytesRead } = await handle.read(chunk, 0,
          Math.min(chunk.length, expectedBytes + 1 - readBytes), null);
        if (bytesRead === 0) break;
        readBytes += bytesRead;
        assert.ok(readBytes <= expectedBytes, `Release code image grew during audit: ${name}`);
        const window = Buffer.concat([tail, chunk.subarray(0, bytesRead)]);
        for (const { token, bytes } of forbidden) {
          assert.ok(!window.includes(bytes),
            `Release code image contains a fresh bundled launch test hook: ${name} (${token})`);
        }
        tail = Buffer.from(window.subarray(Math.max(0, window.length - overlap)));
      }
      assert.equal(readBytes, expectedBytes, `Release code image changed size during audit: ${name}`);
      assert.deepEqual(identity(await handle.stat({ bigint: true })), identity(opened),
        `Release code image changed during audit: ${name}`);
      assert.deepEqual(identity(await lstat(file, { bigint: true })), identity(opened),
        `Release code image path changed during audit: ${name}`);
    } finally {
      await handle.close();
    }
  }
  return { fresh_bundle_test_hooks_absent: true, checked_code_images: images.length,
    checked_code_bytes: checkedCodeBytes };
}

/** @param {string} appRoot @param {{sourceContentRoot?: string}} [options] */
export async function verifyReleasePackage(appRoot: string, { sourceContentRoot = normalContentRoot }: { sourceContentRoot?: string } = {}) {
  const app = path.resolve(appRoot);
  assert.ok((await lstat(app)).isDirectory(), 'Release application must be a real directory');
  try {
    await lstat(path.join(app, 'TestContent'));
    assert.fail('Release application includes TestContent');
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
  }
  const content = path.join(app, 'Content');
  const manifestData = await readFile(path.join(content, 'manifest.json'));
  assert.deepEqual(manifestData, await readFile(path.join(sourceContentRoot, 'manifest.json')),
    'Release manifest differs from the audited normal package');
  /** @type {{schema_version: number, revision: string, articles: {id: string, is_test_fixture?: boolean}[], audio: unknown[], files: Record<string, string>}} */
  const manifest: { schema_version: number; revision: string; articles: { id: string; is_test_fixture?: boolean }[]; audio: unknown[]; files: Record<string, string> } = JSON.parse(manifestData.toString('utf8'));
  assert.equal(manifest.schema_version, 2, 'Expected native package schema 2');
  assert.ok(Array.isArray(manifest.articles) && manifest.articles.length > 0, 'Normal articles are missing');
  assert.ok(manifest.articles.every((article) => article.is_test_fixture !== true
    && typeof article.id === 'string' && !article.id.startsWith('test-fixtures/')), 'Release manifest includes a test article');
  assert.ok(Array.isArray(manifest.audio), 'Audio metadata is missing');
  assert.ok(manifest.files && typeof manifest.files === 'object' && !Array.isArray(manifest.files), 'Invalid file inventory');
  assert.equal(manifest.revision, sha256(JSON.stringify({ schema_version: manifest.schema_version,
    articles: manifest.articles, audio: manifest.audio, files: manifest.files })), 'Manifest revision mismatch');
  const entries = Object.entries(manifest.files);
  assert.ok(entries.length > 0, 'Empty file inventory');
  for (const [relative, expected] of entries) {
    assert.ok(relative !== 'manifest.json' && !path.posix.isAbsolute(relative)
      && !/[\\\0]/.test(relative) && relative.split('/').every((part) => part && part !== '.' && part !== '..'),
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
  const codeAudit = await verifyFreshBundleTestHooksAbsent(app);
  return { schema_version: 1, status: 'passed', native_schema_version: manifest.schema_version,
    revision: manifest.revision, articles: manifest.articles.length, audio: manifest.audio.length,
    verified_files: entries.length, verified_bytes: verifiedBytes, test_content_absent: true, ...codeAudit };
}

export async function runCli() {

  try {
    assert.equal(process.argv.length, 3, 'Usage: node ios/tests/check-release-package.mjs <Release AILibrary.app>');
    console.log(JSON.stringify(await verifyReleasePackage(process.argv[2]), null, 2));
  } catch (error) {
    console.error(`Release package audit failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await runCli()
