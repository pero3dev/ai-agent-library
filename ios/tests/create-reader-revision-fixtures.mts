import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const REVISION_ARTICLE_ID = 'reader-regression/revision';
export const REVISION_ARTICLE_TITLE = '保存位置の改訂回帰';
export const REVISION_TARGET_TEXT = 'REVISION-PARAGRAPH-WITNESS 読書位置は、画面上の座標だけではなく本文の意味と結び付けて保存します。' +
  'この記事では、内容を変えない段落を改訂後にも一つだけ残します。前に説明が追加され、見出しやブロックの識別子が変わっても、同じ意味の段落を読み続けられることを確かめます。' +
  '画面を横向きにすると一行に入る文字が増えて、この段落の折り返しと高さが変わります。先頭への偶然の移動を続きの復帰と見なさず、読書線の近くに来た本文を実測します。' +
  'しおりは記事の同じ識別子に結び付け、改訂の切替とアプリの終了を越えて保持します。';
const REPO = 'pero3dev/ai-agent-library';
const BUNDLE = 'dev.pero3.aiagentlibrary.prototype';
const UUID = /^[A-F0-9]{8}(?:-[A-F0-9]{4}){3}-[A-F0-9]{12}$/;
const TARGET = { A: 'revision-anchor-A', B: 'revision-anchor-B' };
const HEADING = { A: 'revision-section-A', B: 'revision-section-B' };
export type RevisionLabel = 'A' | 'B'
export type RevisionBlock = { type: 'paragraph'; id: string; inlines: { type: 'text'; text: string} []}  | { type: 'heading'; id: string; heading_id: string; level: number; inlines: { type: 'text'; text: string} []}
export type SeedContext = { repository: string; bundle_id: string; source_head: string; UUID: string; run_id: string; run_attempt: string; token: string; name: string; preexisting_UUIDs: string[]; data_container: string; installed_app: string}
export type RevisionFixtures = { A: ReturnType<typeof auditRevisionPackage>; B: ReturnType<typeof auditRevisionPackage>}
export type RevisionSeed = ReturnType<typeof seedStoredRevisionA>
/** @param {unknown} value @returns {asserts value is Record<string, unknown>} */
function object(value: unknown): asserts value is Record<string, unknown> { assert.ok(value !== null && typeof value === 'object' && !Array.isArray(value), 'Expected revision fixture object'); }
/** @param {RevisionLabel} label */
const headingTitle = (label: RevisionLabel) => label === 'A' ? '保存段落（改訂前）' : '保存段落（改訂後）';
/** @param {import('node:crypto').BinaryLike} bytes */
const digest = (bytes: import('node:crypto').BinaryLike) => createHash('sha256').update(bytes).digest('hex');
/** @param {unknown} value */
const encoded = (value: unknown) => Buffer.from(JSON.stringify(value, null, 2) + '\n');
/** @param {string} id @param {string} text @returns {Extract<RevisionBlock, {type: 'paragraph'}>} */
const paragraph = (id: string, text: string): Extract<RevisionBlock, { type: 'paragraph' }> => ({ id, type: 'paragraph', inlines: [{ type: 'text', text }] });
/** @param {string} id @param {string} title @returns {Extract<RevisionBlock, {type: 'heading'}>} */
const heading = (id: string, title: string): Extract<RevisionBlock, { type: 'heading' }> => ({ id: 'heading-' + id, type: 'heading', heading_id: id, level: 2,
  inlines: [{ type: 'text', text: title }] });

/** @param {string} label @returns {Record<string, Buffer>} */
export function revisionPackageBytes(label: string): Record<string, Buffer> {
  assert.ok(label === 'A' || label === 'B');
  const inserted = label === 'B' ? Array.from({ length: 4 }, (_, i) => paragraph('inserted-B-' + i,
    `改訂後に前方へ追加した説明 ${i + 1}。保存した段落の識別子や目次が変わっても、本文の意味を使って続きへ戻ります。`)) : [];
  const blocks = [heading('revision-intro-' + label, label === 'A' ? 'Aだけの開始地点' : 'Bだけの開始地点'),
    ...inserted,
    ...Array.from({ length: 6 }, (_, i) => paragraph('before-' + label + '-' + i,
      `開始から ${i + 1} 番目の説明です。保存対象はこの先の中間段落です。先頭の見出しを表示しただけでは復帰の成功にしません。`)),
    heading(HEADING[label], headingTitle(label)),
    ...Array.from({ length: 2 }, (_, i) => paragraph('lead-' + label + '-' + i,
      `保存対象の前置き ${i + 1}。本文の改訂、しおりの保持、画面の幅による折り返しを一つの画面操作で確認します。`)),
    paragraph(TARGET[label], REVISION_TARGET_TEXT),
    ...Array.from({ length: 6 }, (_, i) => paragraph('after-' + label + '-' + i,
      `保存対象の後ろにある説明 ${i + 1}。十分な末尾があるため、スクロール上限への到着を中間段落への復帰と取り違えません。`))];
  const source = Buffer.from(blocks.map((block) => block.type === 'heading'
    ? '## ' + block.inlines[0].text : block.inlines[0].text).join('\n\n') + '\n');
  const sourceSHA = digest(source), documentPath = 'articles/reader-regression/revision.json';
  const document = encoded({ schema_version: 1, article_id: REVISION_ARTICLE_ID, source_sha256: sourceSHA, blocks });
  const article = { id: REVISION_ARTICLE_ID, title: REVISION_ARTICLE_TITLE,
    summary: '実SHAを持つ有効な通常契約パッケージの改訂と、段落の表示位置を確認します。',
    category: 'Reader regression', level: '入門', last_updated: '2026-11-02',
    source_path: 'ios/tests/fixtures/reader-revision.md', source_sha256: sourceSHA,
    document_path: documentPath, search_text: blocks.map((block) => block.inlines[0].text).join('\n'),
    headings: blocks.filter((block) => block.type === 'heading').map((block) => ({
      id: block.heading_id, title: block.inlines[0].text, level: block.level })), audio_id: null };
  // Models.swift computes containsTestFixtures from reserved ID/source or an
  // explicit true flag. This is a synthetic normal-contract package like the
  // existing repository unit fixtures, not the reserved reader-test profile.
  assert.notEqual(article.id, 'test-fixtures/native-reader');
  assert.notEqual(article.source_path, 'ios/fixtures/native-reader.md');
  assert.equal(Object.hasOwn(article, 'is_test_fixture'), false);
  const manifest = encoded({ schema_version: 2, revision: 'reader-revision-' + label,
    articles: [article], audio: [], files: { [documentPath]: digest(document), 'source.txt': digest(source) } });
  return { 'manifest.json': manifest, [documentPath]: document, 'source.txt': source };
}

/** @param {string} directory */
function ordinaryDirectory(directory: string) {
  const stat = fs.lstatSync(directory); assert.ok(stat.isDirectory() && !stat.isSymbolicLink());
  assert.equal(fs.realpathSync(directory), directory); return directory;
}
/** @param {string} parent @param {string} name */
function missingChild(parent: string, name: string) {
  ordinaryDirectory(parent); assert.ok(name && path.basename(name) === name && name !== '.' && name !== '..');
  const child = path.join(parent, name); assert.ok(!fs.existsSync(child));
  assert.throws(() => fs.lstatSync(child), { code: 'ENOENT' }); return child;
}
/** @param {string} directory */
function exclusiveOutput(directory: string) {
  assert.ok(path.isAbsolute(directory)); assert.equal(path.normalize(directory), directory);
  return missingChild(path.dirname(directory), path.basename(directory));
}
/** @param {string} directory @param {Record<string, Buffer>} values */
function materialize(directory: string, values: Record<string, Buffer>) {
  fs.mkdirSync(directory, { mode: 0o700 });
  for (const [relative, bytes] of Object.entries(values)) {
    const pieces = relative.split('/'); assert.ok(pieces.every((p) => p && !['.', '..'].includes(p)));
    let parent = directory;
    for (const piece of pieces.slice(0, -1)) {
      const next = path.join(parent, piece);
      if (!fs.existsSync(next)) fs.mkdirSync(next, { mode: 0o700 });
      ordinaryDirectory(next); parent = next;
    }
    const leaf = pieces.at(-1); assert.ok(leaf); fs.writeFileSync(path.join(parent, leaf), bytes, { flag: 'wx', mode: 0o600 });
  }
}
/** @param {string} directory @param {string} label */
export function auditRevisionPackage(directory: string, label: string) {
  assert.ok(label === 'A' || label === 'B');
  ordinaryDirectory(directory);
  const expected = revisionPackageBytes(label);
  /** @type {string[]} */
  const actual: string[] = [];
  /** @type {string[]} */
  const directories: string[] = [];
  let entries = 0;
  /** @param {string} current @param {string} [prefix] @param {number} [depth] */
  function walk(current: string, prefix: string = '', depth: number = 0) {
    assert.ok(depth <= 2);
    for (const name of fs.readdirSync(current)) {
      assert.ok(++entries <= 8);
      const full = path.join(current, name), relative = prefix + name, stat = fs.lstatSync(full);
      assert.ok(!stat.isSymbolicLink());
      if (stat.isDirectory()) { directories.push(relative); walk(full, relative + '/', depth + 1); }
      else { assert.ok(stat.isFile() && stat.size <= 65536); actual.push(relative); }
      assert.ok(actual.length <= 3);
    }
  }
  walk(directory); assert.deepEqual(actual.sort(), Object.keys(expected).sort());
  assert.deepEqual(directories.sort(), ['articles', 'articles/reader-regression']);
  const inventory = [];
  for (const name of Object.keys(expected).sort()) {
    const bytes = fs.readFileSync(path.join(directory, name)); assert.ok(bytes.equals(expected[name]), name);
    inventory.push({ path: name, bytes: bytes.length, sha256: digest(bytes) });
  }
  // These are bytes generated by revisionPackageBytes and compared above.
  /** @type {{revision: string, articles: {document_path: string}[], files: Record<string, string>}} */
  const manifest: { revision: string; articles: { document_path: string }[]; files: Record<string, string> } = JSON.parse(expected['manifest.json'].toString('utf8'));
  /** @type {{source_sha256: string, blocks: RevisionBlock[]}} */
  const document: { source_sha256: string; blocks: RevisionBlock[] } = JSON.parse(expected[manifest.articles[0].document_path].toString('utf8'));
  assert.equal(manifest.files[manifest.articles[0].document_path], digest(expected[manifest.articles[0].document_path]));
  assert.equal(document.source_sha256, digest(expected['source.txt']));
  assert.equal(document.blocks.filter((block) => block.inlines[0].text === REVISION_TARGET_TEXT).length, 1);
  return { label, root: directory, revision: manifest.revision, document_sha256: manifest.files[manifest.articles[0].document_path],
    source_sha256: document.source_sha256, target_block_id: TARGET[label], heading_id: HEADING[label], inventory };
}

/** @param {{ownedRoot: string, bundledRoot: string}} options */
export function createRevisionFixtures({ ownedRoot, bundledRoot }: { ownedRoot: string; bundledRoot: string }) {
  assert.notEqual(ownedRoot, bundledRoot);
  exclusiveOutput(ownedRoot); exclusiveOutput(bundledRoot);
  assert.ok(!ownedRoot.startsWith(bundledRoot + path.sep) && !bundledRoot.startsWith(ownedRoot + path.sep));
  const A = revisionPackageBytes('A'), B = revisionPackageBytes('B');
  fs.mkdirSync(ownedRoot, { mode: 0o700 });
  const storedRoot = path.join(ownedRoot, 'A'); materialize(storedRoot, A); materialize(bundledRoot, B);
  const receipt = { schema_version: 1, kind: 'valid-normal-reader-revision-fixtures',
    article_id: REVISION_ARTICLE_ID, article_title: REVISION_ARTICLE_TITLE,
    target_text_sha256: digest(Buffer.from(REVISION_TARGET_TEXT)),
    A: auditRevisionPackage(storedRoot, 'A'), B: auditRevisionPackage(bundledRoot, 'B'),
    contains_reserved_reader_fixture: false,
    scope: 'Controlled normal-contract synthetic packages; not published corpus or proof of Swift consumer execution.' };
  assert.notEqual(receipt.A.document_sha256, receipt.B.document_sha256);
  fs.writeFileSync(path.join(ownedRoot, 'fixtures.json'), encoded(receipt), { flag: 'wx', mode: 0o600 });
  return receipt;
}

/** @param {unknown} context @param {string} devicesRoot @returns {SeedContext} */
export function validateSeedContext(context: unknown, devicesRoot: string): SeedContext {
  object(context);
  ordinaryDirectory(devicesRoot);
  assert.equal(context.repository, REPO); assert.equal(context.bundle_id, BUNDLE);
  assert.ok(typeof context.source_head === 'string' && typeof context.UUID === 'string');
  assert.match(context.source_head, /^[a-f0-9]{40}$/); assert.match(context.UUID, UUID);
  assert.ok(typeof context.run_id === 'string' && typeof context.run_attempt === 'string' && typeof context.token === 'string');
  assert.match(context.run_id, /^[0-9]+$/); assert.match(context.run_attempt, /^[0-9]+$/);
  assert.match(context.token, /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/);
  assert.equal(context.name, `AILibrary-reader-revision-${context.run_id}-${context.run_attempt}-${context.token}`);
  assert.ok(Array.isArray(context.preexisting_UUIDs) && !context.preexisting_UUIDs.includes(context.UUID));
  assert.ok(context.preexisting_UUIDs.every((value) => typeof value === 'string' && UUID.test(value)));
  const deviceData = path.join(devicesRoot, context.UUID, 'data', 'Containers');
  assert.ok(typeof context.data_container === 'string' && typeof context.installed_app === 'string');
  ordinaryDirectory(context.data_container); ordinaryDirectory(context.installed_app);
  const dataRelative = path.relative(deviceData, context.data_container).split(path.sep);
  assert.equal(dataRelative.length, 3); assert.equal(dataRelative[0], 'Data');
  assert.equal(dataRelative[1], 'Application'); assert.match(dataRelative[2], UUID);
  // get_app_container data ends at the application UUID, not a child folder.
  assert.equal(dataRelative[3], undefined);
  const appRelative = path.relative(deviceData, context.installed_app).split(path.sep);
  assert.equal(appRelative.length, 4); assert.equal(appRelative[0], 'Bundle'); assert.equal(appRelative[1], 'Application');
  assert.match(appRelative[2], UUID); assert.equal(appRelative[3], 'AILibrary.app');
  return (context as SeedContext);
}

// Paths are observation locations, not persistent app-data identities.
// This immutable subset binds both observations to the same exclusive seed run.
/** @param {SeedContext} context */
export function revisionOwnerIdentity(context: Pick<SeedContext, 'repository' | 'source_head' | 'UUID' | 'bundle_id' | 'run_id' | 'run_attempt' | 'token' | 'name' | 'preexisting_UUIDs'>) {
  return { repository: context.repository, source_head: context.source_head, UUID: context.UUID,
    bundle_id: context.bundle_id, run_id: context.run_id, run_attempt: context.run_attempt,
    token: context.token, name: context.name, preexisting_UUIDs: [...context.preexisting_UUIDs] };
}

/** @param {SeedContext} context */
function storagePath(context: SeedContext) {
  let current = context.data_container;
  for (const component of ['Library', 'Application Support']) {
    const next = path.join(current, component);
    if (fs.existsSync(next)) ordinaryDirectory(next);
    current = next;
  }
  return path.join(current, 'LibraryContent');
}
/** @param {SeedContext} context */
function makeSupport(context: SeedContext) {
  let current = context.data_container;
  for (const component of ['Library', 'Application Support']) {
    const next = path.join(current, component);
    if (!fs.existsSync(next)) fs.mkdirSync(next, { mode: 0o700 });
    ordinaryDirectory(next); current = next;
  }
  return current;
}
/** @param {unknown} value @returns {RevisionFixtures} */
function validatedFixtures(value: unknown): RevisionFixtures {
  object(value); object(value.A); object(value.B);
  assert.ok(typeof value.A.root === 'string' && typeof value.B.root === 'string');
  const A = auditRevisionPackage(value.A.root, 'A'), B = auditRevisionPackage(value.B.root, 'B');
  assert.deepEqual(A, value.A); assert.deepEqual(B, value.B);
  return { A, B };
}
/** @param {unknown} rawContext @param {unknown} rawFixtures @param {string} devicesRoot */
export function seedStoredRevisionA(rawContext: unknown, rawFixtures: unknown, devicesRoot: string) {
  const context = validateSeedContext(rawContext, devicesRoot), fixtures = validatedFixtures(rawFixtures);
  const A = auditRevisionPackage(fixtures.A.root, 'A'), B = auditRevisionPackage(fixtures.B.root, 'B');
  assert.deepEqual(A, fixtures.A); assert.deepEqual(B, fixtures.B);
  const storage = storagePath(context); assert.ok(!fs.existsSync(storage));
  assert.throws(() => fs.lstatSync(storage), { code: 'ENOENT' });
  makeSupport(context); fs.mkdirSync(storage, { mode: 0o700 });
  const versions = path.join(storage, 'versions'); fs.mkdirSync(versions, { mode: 0o700 });
  const generation = randomUUID().toUpperCase(); assert.match(generation, UUID);
  const target = path.join(versions, generation); materialize(target, revisionPackageBytes('A'));
  fs.writeFileSync(path.join(storage, 'current.json'), encoded({ directory: generation }), { flag: 'wx', mode: 0o600 });
  return { schema_version: 1, status: 'stored-A-seeded', source_head: context.source_head,
    UUID: context.UUID, bundle_id: BUNDLE, run_id: context.run_id, run_attempt: context.run_attempt,
    owner: revisionOwnerIdentity(context),
    data_container: context.data_container, storage_root: storage, generation_A: generation,
    stored_A: auditRevisionPackage(target, 'A'), bundled_B: fixtures.B,
    pointer_sha256: digest(fs.readFileSync(path.join(storage, 'current.json'))),
    scope: 'Setup only; actual A loading, public B selection, viewport and bookmark require UI.' };
}
/** @param {unknown} rawContext @param {unknown} rawFixtures @param {unknown} rawSeed @param {string} devicesRoot */
export function auditStoredRevisionB(rawContext: unknown, rawFixtures: unknown, rawSeed: unknown, devicesRoot: string) {
  const context = validateSeedContext(rawContext, devicesRoot), fixtures = validatedFixtures(rawFixtures);
  object(rawSeed); object(rawSeed.stored_A);
  // Every persisted seed field consumed below is checked against context,
  // deterministic package bytes and its original owned path relationships.
  const seed = (rawSeed as RevisionSeed);
  assert.equal(seed.source_head, context.source_head); assert.equal(seed.UUID, context.UUID);
  assert.equal(seed.bundle_id, context.bundle_id); assert.equal(seed.run_id, context.run_id);
  assert.equal(seed.run_attempt, context.run_attempt);
  assert.equal(seed.schema_version, 1); assert.equal(seed.status, 'stored-A-seeded');
  assert.deepEqual(seed.owner, revisionOwnerIdentity(context)); assert.match(seed.generation_A, UUID);
  // The historical root may no longer exist. Authenticate its exact relationship
  // to the seed's owned device and generation without reopening or rewriting it.
  assert.ok(path.isAbsolute(seed.data_container)); assert.equal(path.normalize(seed.data_container), seed.data_container);
  assert.equal(path.dirname(seed.data_container), path.join(devicesRoot, context.UUID, 'data/Containers/Data/Application'));
  assert.match(path.basename(seed.data_container), UUID);
  assert.equal(seed.storage_root, path.join(seed.data_container, 'Library/Application Support/LibraryContent'));
  assert.equal(seed.stored_A.root, path.join(seed.storage_root, 'versions', seed.generation_A));
  assert.equal(seed.pointer_sha256, digest(encoded({ directory: seed.generation_A })));
  assert.deepEqual(seed.bundled_B, fixtures.B);
  const storage = storagePath(context); ordinaryDirectory(storage);
  ordinaryDirectory(path.join(storage, 'versions'));
  const pointer = path.join(storage, 'current.json'), stat = fs.lstatSync(pointer);
  assert.ok(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 1024);
  /** @type {unknown} */
  const value: unknown = JSON.parse(fs.readFileSync(pointer, 'utf8')); object(value); assert.deepEqual(Object.keys(value), ['directory']);
  assert.ok(typeof value.directory === 'string');
  assert.match(value.directory, UUID); assert.notEqual(value.directory, seed.generation_A);
  const storedB = auditRevisionPackage(path.join(storage, 'versions', value.directory), 'B');
  const oldA = auditRevisionPackage(path.join(storage, 'versions', seed.generation_A), 'A');
  const { root: currentARoot, ...currentAIdentity } = oldA;
  const { root: seededARoot, ...seededAIdentity } = seed.stored_A;
  assert.equal(currentARoot, path.join(storage, 'versions', seed.generation_A));
  assert.deepEqual(currentAIdentity, seededAIdentity);
  assert.deepEqual(auditRevisionPackage(fixtures.B.root, 'B'), fixtures.B);
  assert.deepEqual(auditRevisionPackage(fixtures.A.root, 'A'), fixtures.A);
  return { schema_version: 1, status: 'stored-B-selected-and-A-retained', source_head: context.source_head,
    UUID: context.UUID, generation_A: seed.generation_A, generation_B: value.directory,
    owner: revisionOwnerIdentity(context), A_unchanged: true, A: oldA, B: storedB, bundled_B_unchanged: true,
    containers: { seeded_data_root: seed.data_container, current_data_root: context.data_container,
      seeded_storage_root: seed.storage_root, current_storage_root: storage,
      seeded_A_root: seededARoot, current_A_root: currentARoot,
      path_changed: seed.data_container !== context.data_container },
    seed_pointer_sha256: seed.pointer_sha256, current_pointer_sha256: digest(fs.readFileSync(pointer)) };
}

/** @param {string[]} values */
function args(values: string[]) {
  const command = values.shift(); assert.ok(command && ['generate', 'seed', 'after-ui'].includes(command));
  /** @type {Record<string, string>} */
  const out: Record<string, string> = { command };
  while (values.length) { const key = values.shift(); assert.ok(key && ['--owned-root', '--bundled-root', '--context', '--fixtures', '--seed'].includes(key));
    assert.equal(out[key], undefined); const value = values.shift(); assert.ok(value && path.isAbsolute(value)); out[key] = value; }
  return out;
}
/** @param {string} file @returns {unknown} */
function boundedJSON(file: string): unknown {
  const stat = fs.lstatSync(file); assert.ok(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 131072);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
export function runCli() {

  try {
    const options = args(process.argv.slice(2)); let result;
    if (options.command === 'generate') {
      assert.deepEqual(Object.keys(options).sort(), ['--bundled-root', '--owned-root', 'command']);
      result = createRevisionFixtures({ ownedRoot: options['--owned-root'], bundledRoot: options['--bundled-root'] });
    } else {
      const expected = options.command === 'seed' ? ['--context', '--fixtures', 'command']
        : ['--context', '--fixtures', '--seed', 'command'];
      assert.deepEqual(Object.keys(options).sort(), expected);
      assert.equal(process.env.GITHUB_ACTIONS, 'true'); assert.equal(process.env.GITHUB_REPOSITORY, REPO);
      const context = boundedJSON(options['--context']); object(context); assert.equal(context.source_head, process.env.EXPECTED_SOURCE_HEAD);
      assert.equal(context.run_id, process.env.GITHUB_RUN_ID); assert.equal(context.run_attempt, process.env.GITHUB_RUN_ATTEMPT);
      const fixtures = boundedJSON(options['--fixtures']);
      const devices = fs.realpathSync(path.join(os.homedir(), 'Library/Developer/CoreSimulator/Devices'));
      result = options.command === 'seed' ? seedStoredRevisionA(context, fixtures, devices)
        : auditStoredRevisionB(context, fixtures, boundedJSON(options['--seed']), devices);
    }
    console.log(JSON.stringify(result, null, 2));
  } catch (error) { console.error('Reader revision fixture operation failed: ' + (error instanceof Error ? error.message : String(error))); process.exitCode = 1; }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runCli()
