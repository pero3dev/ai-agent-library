import test from 'node:test';
import { requiredFixture, objectFixture, stringFixture } from '../helpers/json-fixtures.mjs';
import { revisionManifestFixture } from '../helpers/ios-fixtures.mjs';
import { nativeDocumentFixture } from '../helpers/native-document-fixture.mts';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { revisionPackageBytes, createRevisionFixtures, auditRevisionPackage,
  validateSeedContext, seedStoredRevisionA, auditStoredRevisionB,
  REVISION_TARGET_TEXT } from '../../ios/tests/create-reader-revision-fixtures.mjs';

/** @param {import('node:crypto').BinaryLike} bytes */
const sha = (bytes: import('node:crypto').BinaryLike) => createHash('sha256').update(bytes).digest('hex');
/** @param {import('node:test').TestContext} t */
function scope(t: import('node:test').TestContext) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'reader-revision-control-')));
  t.after(() => fs.rmSync(root, { recursive: true }));
  const fixtures = createRevisionFixtures({ ownedRoot: path.join(root, 'fixtures'), bundledRoot: path.join(root, 'Content') });
  const devices = path.join(root, 'Devices'); const UUID = randomUUID().toUpperCase();
  const base = path.join(devices, UUID, 'data/Containers');
  const app = path.join(base, 'Bundle/Application', randomUUID().toUpperCase(), 'AILibrary.app');
  const data = path.join(base, 'Data/Application', randomUUID().toUpperCase());
  fs.mkdirSync(app, { recursive: true }); fs.mkdirSync(data, { recursive: true });
  const token = randomUUID();
  const context = { repository: 'pero3dev/ai-agent-library', bundle_id: 'dev.pero3.aiagentlibrary.prototype',
    source_head: 'a'.repeat(40), run_id: '123', run_attempt: '1', token,
    name: `AILibrary-reader-revision-123-1-${token}`, UUID, preexisting_UUIDs: [],
    installed_app: app, data_container: data };
  return { root, fixtures, devices, context };
}
/** @param {string} root @param {ReturnType<typeof revisionPackageBytes>} files */
function materialize(root: string, files: ReturnType<typeof revisionPackageBytes>) {
  fs.mkdirSync(root);
  for (const [relative, bytes] of Object.entries(files)) {
    const file = path.join(root, relative); fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, bytes, { flag: 'wx' });
  }
}

test('actual A/B native bytes and source bytes have distinct real manifest digests and one common semantic paragraph', () => {
  const A = revisionPackageBytes('A'), B = revisionPackageBytes('B');
  const ma = revisionManifestFixture(JSON.parse(A['manifest.json'].toString('utf8'))), mb = revisionManifestFixture(JSON.parse(B['manifest.json'].toString('utf8')));
  const file = ma.articles[0].document_path;
  for (const [files, manifest] of ([[A, ma], [B, mb]] as [ReturnType<typeof revisionPackageBytes>,ReturnType<typeof revisionManifestFixture>][])) {
    assert.deepEqual(Object.keys(files).sort(), ['manifest.json', file, 'source.txt'].sort());
    assert.equal(manifest.files[file], sha(files[file])); assert.equal(manifest.files['source.txt'], sha(files['source.txt']));
    const doc = nativeDocumentFixture(JSON.parse(files[file].toString('utf8')));
    assert.equal(doc.source_sha256, sha(files['source.txt']));
    assert.equal(doc.source_sha256, manifest.articles[0].source_sha256);
    assert.equal(doc.blocks.filter((b) => 'inlines' in b && 'text' in b.inlines[0] && b.inlines[0].text === REVISION_TARGET_TEXT).length, 1);
    assert.equal(manifest.articles[0].is_test_fixture, undefined);
    assert.notEqual(manifest.articles[0].id, 'test-fixtures/native-reader');
    assert.notEqual(manifest.articles[0].source_path, 'ios/fixtures/native-reader.md');
  }
  assert.notEqual(ma.files[file], mb.files[file]);
  const da = nativeDocumentFixture(JSON.parse(A[file].toString('utf8'))), db = nativeDocumentFixture(JSON.parse(B[file].toString('utf8')));
  assert.notEqual(requiredFixture(da.blocks.find((b) => 'inlines' in b && 'text' in b.inlines[0] && b.inlines[0].text === REVISION_TARGET_TEXT)).id,
    requiredFixture(db.blocks.find((b) => 'inlines' in b && 'text' in b.inlines[0] && b.inlines[0].text === REVISION_TARGET_TEXT)).id);
  assert.ok(db.blocks.length > da.blocks.length);
  assert.notDeepEqual(ma.articles[0].headings, mb.articles[0].headings);
});

test('fixture output is exclusive: an existing package or symlink is never replaced', { skip: process.platform === 'win32' ? "This revision ownership fixture requires file and directory symlinks" : false }, (t) => {
  const s = scope(t); const old = fs.readFileSync(path.join(s.fixtures.B.root, 'manifest.json'));
  const same = path.join(s.root, 'same');
  assert.throws(() => createRevisionFixtures({ ownedRoot: same, bundledRoot: same }));
  assert.equal(fs.existsSync(same), false);
  assert.throws(() => createRevisionFixtures({ ownedRoot: path.join(s.root, 'other'), bundledRoot: s.fixtures.B.root }));
  assert.equal(fs.existsSync(path.join(s.root, 'other')), false);
  assert.ok(fs.readFileSync(path.join(s.fixtures.B.root, 'manifest.json')).equals(old));
  fs.symlinkSync(s.fixtures.B.root, path.join(s.root, 'alias'));
  assert.throws(() => createRevisionFixtures({ ownedRoot: path.join(s.root, 'alias'), bundledRoot: path.join(s.root, 'unused') }));
  assert.equal(fs.existsSync(path.join(s.root, 'unused')), false);
});

test('wrong bytes, extra files, extra directories, and symlinks fail the exact-case package audit', { skip: process.platform === 'win32' ? "This revision ownership fixture requires file and directory symlinks" : false }, (t) => {
  const s = scope(t), file = path.join(s.fixtures.A.root, 'source.txt');
  assert.throws(() => auditRevisionPackage(s.fixtures.A.root, 'B'));
  assert.throws(() => auditRevisionPackage(s.fixtures.B.root, 'A'));
  const old = fs.readFileSync(file); fs.appendFileSync(file, 'changed');
  assert.throws(() => auditRevisionPackage(s.fixtures.A.root, 'A'));
  fs.writeFileSync(file, old); fs.writeFileSync(path.join(s.fixtures.A.root, 'extra.txt'), 'extra');
  assert.throws(() => auditRevisionPackage(s.fixtures.A.root, 'A'));
  fs.unlinkSync(path.join(s.fixtures.A.root, 'extra.txt')); fs.mkdirSync(path.join(s.fixtures.A.root, 'extra'));
  assert.throws(() => auditRevisionPackage(s.fixtures.A.root, 'A'));
  fs.rmdirSync(path.join(s.fixtures.A.root, 'extra')); fs.unlinkSync(file); fs.symlinkSync(path.join(s.fixtures.B.root, 'source.txt'), file);
  assert.throws(() => auditRevisionPackage(s.fixtures.A.root, 'A'));
});

test('a different device, different app, preexisting UUID, or different run is not seed authority', (t) => {
  const s = scope(t);
  for (const delta of [{ UUID: randomUUID().toUpperCase() }, { bundle_id: 'other.app' },
    { preexisting_UUIDs: [s.context.UUID] }, { run_attempt: '2' },
    { data_container: s.context.data_container + '/child' }, { token: '-'.repeat(36) }]) {
    assert.throws(() => seedStoredRevisionA({ ...s.context, ...delta }, s.fixtures, s.devices));
    assert.equal(fs.existsSync(path.join(s.context.data_container, 'Library/Application Support/LibraryContent')), false);
  }
  assert.equal(validateSeedContext(s.context, s.devices), s.context);
});

test('fresh seed copies real A, writes a UUID pointer, and rejects a second seed without changing bytes', (t) => {
  const s = scope(t), seed = seedStoredRevisionA(s.context, s.fixtures, s.devices);
  assert.equal(seed.status, 'stored-A-seeded');
  const pointer = path.join(seed.storage_root, 'current.json'), before = fs.readFileSync(pointer);
  assert.equal(objectFixture(JSON.parse(before.toString('utf8'))).directory, seed.generation_A);
  assert.equal(seed.stored_A.document_sha256, s.fixtures.A.document_sha256);
  assert.throws(() => seedStoredRevisionA(s.context, s.fixtures, s.devices));
  assert.ok(fs.readFileSync(pointer).equals(before));
  assert.deepEqual(auditRevisionPackage(s.fixtures.B.root, 'B'), s.fixtures.B);
});

test('an existing storage directory or a symlinked Library is never modified by seed', { skip: process.platform === 'win32' ? "This revision ownership fixture requires file and directory symlinks" : false }, (t) => {
  const s = scope(t); const library = path.join(s.context.data_container, 'Library');
  fs.symlinkSync(s.root, library);
  assert.throws(() => seedStoredRevisionA(s.context, s.fixtures, s.devices));
  assert.equal(fs.readlinkSync(library), s.root);
  fs.unlinkSync(library); fs.mkdirSync(path.join(library, 'Application Support/LibraryContent'), { recursive: true });
  const marker = path.join(library, 'Application Support/LibraryContent/user-marker.txt'); fs.writeFileSync(marker, 'keep');
  assert.throws(() => seedStoredRevisionA(s.context, s.fixtures, s.devices));
  assert.equal(fs.readFileSync(marker, 'utf8'), 'keep');
});

test('post-UI audit requires changed selection of exact B and preserves exact A and bundle B', (t) => {
  const s = scope(t), seed = seedStoredRevisionA(s.context, s.fixtures, s.devices);
  assert.throws(() => auditStoredRevisionB(s.context, s.fixtures, seed, s.devices));
  const generationB = randomUUID().toUpperCase();
  materialize(path.join(seed.storage_root, 'versions', generationB), revisionPackageBytes('B'));
  fs.writeFileSync(path.join(seed.storage_root, 'current.json'), JSON.stringify({ directory: generationB }));
  assert.throws(() => auditStoredRevisionB(s.context, s.fixtures, { ...seed, run_attempt: '2' }, s.devices));
  const result = auditStoredRevisionB(s.context, s.fixtures, seed, s.devices);
  assert.equal(result.status, 'stored-B-selected-and-A-retained'); assert.equal(result.A_unchanged, true);
  assert.equal(result.B.document_sha256, s.fixtures.B.document_sha256);
  fs.appendFileSync(path.join(seed.storage_root, 'versions', seed.generation_A, 'source.txt'), 'damage');
  assert.throws(() => auditStoredRevisionB(s.context, s.fixtures, seed, s.devices));
});

test('post-UI pointer cannot escape versions or select a fake digest package', (t) => {
  const s = scope(t), seed = seedStoredRevisionA(s.context, s.fixtures, s.devices);
  for (const directory of ['../elsewhere', 'bundle', '', 'not-a-uuid']) {
    fs.writeFileSync(path.join(seed.storage_root, 'current.json'), JSON.stringify({ directory }));
    assert.throws(() => auditStoredRevisionB(s.context, s.fixtures, seed, s.devices));
  }
});


/** @param {ReturnType<typeof scope>} s @param {ReturnType<typeof seedStoredRevisionA>} seed */
function selectRevisionB(s: ReturnType<typeof scope>, seed: ReturnType<typeof seedStoredRevisionA>) {
  const generationB = randomUUID().toUpperCase();
  materialize(path.join(seed.storage_root, 'versions', generationB), revisionPackageBytes('B'));
  fs.writeFileSync(path.join(seed.storage_root, 'current.json'), JSON.stringify({ directory: generationB }));
  return generationB;
}

test('a real data-root rename retains the original A generation, all bytes, owner, and B selection', (t) => {
  const s = scope(t), seed = seedStoredRevisionA(s.context, s.fixtures, s.devices);
  const generationB = selectRevisionB(s, seed), seedBefore = JSON.stringify(seed);
  const currentRoot = path.join(path.dirname(s.context.data_container), randomUUID().toUpperCase());
  fs.renameSync(s.context.data_container, currentRoot);
  assert.equal(fs.existsSync(s.context.data_container), false);
  const context = { ...s.context, data_container: currentRoot };
  const result = auditStoredRevisionB(context, s.fixtures, seed, s.devices);
  assert.equal(result.status, 'stored-B-selected-and-A-retained');
  assert.equal(result.generation_A, seed.generation_A); assert.equal(result.generation_B, generationB);
  assert.equal(result.containers.path_changed, true);
  assert.equal(result.containers.seeded_data_root, seed.data_container);
  assert.equal(result.containers.current_data_root, currentRoot);
  assert.equal(result.A.document_sha256, seed.stored_A.document_sha256);
  assert.deepEqual(result.A.inventory, seed.stored_A.inventory);
  assert.deepEqual(result.owner, seed.owner); assert.equal(JSON.stringify(seed), seedBefore);
});

test('same-root post-UI audit also emits the old and current roots without changing the seed receipt', (t) => {
  const s = scope(t), seed = seedStoredRevisionA(s.context, s.fixtures, s.devices);
  selectRevisionB(s, seed); const before = JSON.stringify(seed);
  const result = auditStoredRevisionB(s.context, s.fixtures, seed, s.devices);
  assert.equal(result.containers.path_changed, false);
  assert.equal(result.containers.current_storage_root, seed.storage_root);
  assert.deepEqual(result.A, seed.stored_A); assert.equal(JSON.stringify(seed), before);
  assert.equal(result.seed_pointer_sha256, seed.pointer_sha256);
  assert.notEqual(result.current_pointer_sha256, seed.pointer_sha256);
});

test('post-UI ownership rejects each changed immutable seed field, even with valid-shaped values', (t) => {
  const s = scope(t), seed = seedStoredRevisionA(s.context, s.fixtures, s.devices); selectRevisionB(s, seed);
  const replacements = { repository: 'other/repository', source_head: 'b'.repeat(40), UUID: randomUUID().toUpperCase(),
    bundle_id: 'other.app', run_id: '124', run_attempt: '2', token: randomUUID(), name: seed.owner.name + '-other',
    preexisting_UUIDs: [randomUUID().toUpperCase()] };
  for (const [field, value] of Object.entries(replacements)) {
    const changed = structuredClone(seed); Reflect.set(changed.owner, field, value);
    assert.throws(() => auditStoredRevisionB(s.context, s.fixtures, changed, s.devices), field);
  }
  for (const field of ['source_head', 'UUID', 'bundle_id', 'run_id', 'run_attempt']) {
    assert.throws(() => auditStoredRevisionB(s.context, s.fixtures, { ...seed, [field]: Reflect.get(replacements, field) }, s.devices), field);
  }
  const token = randomUUID();
  assert.throws(() => auditStoredRevisionB({ ...s.context, token,
    name: `AILibrary-reader-revision-123-1-${token}` }, s.fixtures, seed, s.devices));
});

test('historical root relationships, generation, pointer SHA, and seed kind remain mandatory', (t) => {
  const s = scope(t), seed = seedStoredRevisionA(s.context, s.fixtures, s.devices); selectRevisionB(s, seed);
  /** @type {((value:ReturnType<typeof seedStoredRevisionA>)=>void)[]} */
  const mutations: ((value: ReturnType<typeof seedStoredRevisionA>) => void)[] = [
    (value) => { value.data_container += '/child'; },
    (value) => { value.data_container = path.join(s.root, randomUUID().toUpperCase()); },
    (value) => { value.data_container += '/../' + path.basename(value.data_container); },
    (value) => { value.storage_root += '/elsewhere'; },
    (value) => { value.stored_A.root += '/elsewhere'; },
    (value) => { value.generation_A = randomUUID().toUpperCase(); },
    (value) => { value.pointer_sha256 = '0'.repeat(64); },
    (value) => { value.status = 'other'; },
    (value) => { value.schema_version = 2; },
    (value) => { value.bundled_B.document_sha256 = '0'.repeat(64); }
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(seed); mutate(changed);
    assert.throws(() => auditStoredRevisionB(s.context, s.fixtures, changed, s.devices));
  }
});

test('current container must be canonical, direct, on the owned device, and not a symlink or empty replacement', { skip: process.platform === 'win32' ? "This revision ownership fixture requires file and directory symlinks" : false }, (t) => {
  const s = scope(t), seed = seedStoredRevisionA(s.context, s.fixtures, s.devices); selectRevisionB(s, seed);
  const empty = path.join(path.dirname(s.context.data_container), randomUUID().toUpperCase()); fs.mkdirSync(empty);
  const alias = path.join(path.dirname(s.context.data_container), randomUUID().toUpperCase());
  fs.symlinkSync(s.context.data_container, alias);
  for (const context of [{ ...s.context, data_container: empty }, { ...s.context, data_container: alias },
    { ...s.context, data_container: s.context.data_container + '/child' },
    { ...s.context, data_container: s.context.data_container + '/../' + path.basename(s.context.data_container) },
    { ...s.context, UUID: randomUUID().toUpperCase() }, { ...s.context, bundle_id: 'other.app' }]) {
    assert.throws(() => auditStoredRevisionB(context, s.fixtures, seed, s.devices));
  }
  const versions = path.join(seed.storage_root, 'versions'), moved = path.join(s.root, 'held-versions');
  fs.renameSync(versions, moved); fs.symlinkSync(moved, versions);
  assert.throws(() => auditStoredRevisionB(s.context, s.fixtures, seed, s.devices));
});

test('the current root must retain the original A generation and every A file, not just a valid selected B', (t) => {
  const s = scope(t), seed = seedStoredRevisionA(s.context, s.fixtures, s.devices); selectRevisionB(s, seed);
  const originalA = path.join(seed.storage_root, 'versions', seed.generation_A), hidden = path.join(s.root, 'old-a');
  fs.renameSync(originalA, hidden);
  assert.throws(() => auditStoredRevisionB(s.context, s.fixtures, seed, s.devices)); fs.renameSync(hidden, originalA);
  for (const relative of Object.keys(revisionPackageBytes('A'))) {
    const file = path.join(originalA, relative), bytes = fs.readFileSync(file);
    fs.appendFileSync(file, 'changed');
    assert.throws(() => auditStoredRevisionB(s.context, s.fixtures, seed, s.devices), () => true, relative);
    fs.writeFileSync(file, bytes);
  }
  const storedB = stringFixture(objectFixture(JSON.parse(fs.readFileSync(path.join(seed.storage_root, 'current.json'), 'utf8'))).directory);
  const bFile = path.join(seed.storage_root, 'versions', storedB, 'source.txt'); fs.appendFileSync(bFile, 'changed');
  assert.throws(() => auditStoredRevisionB(s.context, s.fixtures, seed, s.devices));
});
