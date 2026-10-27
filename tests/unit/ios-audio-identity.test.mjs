import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import { createHash } from 'node:crypto';
import { createDeclaredAudioResolver, DEFAULT_NATIVE_AUDIO_IDENTITIES } from '../../scripts/lib/ios-audio-identity.mjs';
import { audioMetadata, parseArticle } from '../../scripts/lib/ios-content.mjs';

const fixture = JSON.parse(await readFile(new URL('../fixtures/ios-audio-identities.json', import.meta.url)));
const catalog = { schema_version: 1, episodes: fixture.episodes };
const sources = new Map(await Promise.all(fixture.episodes.map(async episode => [episode.article_path,
  await readFile(new URL('../../' + episode.article_path, import.meta.url), 'utf8')])));
const clone = value => structuredClone(value);
const sha = value => createHash('sha256').update(value).digest('hex');
const declarations = () => [...DEFAULT_NATIVE_AUDIO_IDENTITIES.map(clone), clone(fixture.history_declaration)];
const context = (episode = fixture.episodes[0]) => ({ catalog: clone(catalog), sourcePath: episode.article_path,
  sourceText: sources.get(episode.article_path), article: parseArticle(sources.get(episode.article_path), episode.article_path) });
const metadata = (resolve, input) => audioMetadata({ schema_version: 1, episodes: [resolve(input)] }, input.article, input.sourcePath);

test('production declaration remains exactly the existing Agent-loop tuple and singleton output bytes', () => {
  assert.equal(DEFAULT_NATIVE_AUDIO_IDENTITIES.length, 1);
  const input = context(), before = JSON.stringify(input);
  const expected = audioMetadata(input.catalog, input.article, input.sourcePath);
  const actual = metadata(createDeclaredAudioResolver(), input);
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
  assert.equal(actual.source_is_current, true);
  assert.equal(actual.id, DEFAULT_NATIVE_AUDIO_IDENTITIES[0].episode_id);
  assert.equal(JSON.stringify([actual]), JSON.stringify([expected]));
  assert.equal(JSON.stringify(input), before);
});

test('AI-history metadata is independently resolvable only through explicit mock declarations', () => {
  assert.equal(fixture.mock_only_not_production_adoption, true);
  const resolve = createDeclaredAudioResolver(declarations());
  assert.equal(resolve(context()).id, fixture.episodes[0].id);
  assert.equal(resolve(context(fixture.episodes[1])).id, fixture.episodes[1].id);
  assert.throws(() => createDeclaredAudioResolver()(context(fixture.episodes[1])), /not declared/);
  assert.equal(DEFAULT_NATIVE_AUDIO_IDENTITIES.length, 1);
});

test('URL host, release version and complete asset path cannot replace a declared identity', () => {
  const original = fixture.episodes[0].audio_url;
  for (const url of [original.replace('https:', 'http:'), original.replace('github.com/', 'github.com.evil/'),
    original.replace('github.com/', 'user@github.com/'), original.replace('pero3dev/', 'another/'), original + '?x=1', original + '#x',
    original.replace('audio-agent-loop-', 'different-release-'), original.replace('.mp3', '-other.mp3'), fixture.episodes[1].audio_url]) {
    const input = context(); input.catalog.episodes[0].audio_url = url;
    assert.throws(() => createDeclaredAudioResolver()(input), /versioned repository/);
  }
});

test('episode ID and audio/source/script SHA are matched against declarations, not self claims', () => {
  for (const key of ['id', 'audio_sha256', 'source_digest', 'script_sha256']) {
    const input = context(); input.catalog.episodes[0][key] = key === 'id' ? 'self-declared-episode' : 'f'.repeat(64);
    assert.throws(() => createDeclaredAudioResolver()(input), /tuple/);
  }
});

test('selected article ID/path and actual source bytes must bind to the same identity', () => {
  for (const mutate of [input => { input.article.id = '01-concepts/other'; },
    input => { input.article.source_path = 'docs/01-concepts/other.md'; },
    input => { input.sourcePath = fixture.episodes[1].article_path; },
    input => { input.sourceText += '\nchanged\n'; },
    input => { input.article.source_sha256 = 'f'.repeat(64); },
    input => { input.article.normalized_digest = 'f'.repeat(64); }]) {
    const input = context(); mutate(input);
    assert.throws(() => createDeclaredAudioResolver()(input), /article\/source|source SHA|not declared/);
  }
  const forged = context(); forged.sourceText += '\nchanged\n';
  forged.article.source_sha256 = sha(forged.sourceText); forged.article.normalized_digest = sha(forged.sourceText);
  assert.throws(() => createDeclaredAudioResolver()(forged), /source SHA mismatch/);
});

test('CRLF normalization preserves the declared full Markdown digest without trimming', () => {
  const input = context(); input.sourceText = input.sourceText.replaceAll('\n', '\r\n');
  input.article = parseArticle(input.sourceText, input.sourcePath);
  assert.equal(createDeclaredAudioResolver()(input).source_digest, DEFAULT_NATIVE_AUDIO_IDENTITIES[0].source_digest);
  input.sourceText = '\n' + input.sourceText; input.article = { ...input.article,
    source_sha256: sha(input.sourceText), normalized_digest: sha(input.sourceText.replace(/\r\n?/g, '\n')) };
  assert.throws(() => createDeclaredAudioResolver()(input), /source SHA/);
});

test('credit and terms cannot be dropped or replaced even on the known host', () => {
  for (const mutate of [e => { e.attribution = ''; }, e => { e.attribution += ' altered'; },
    e => { e.voices = []; }, e => { e.voices[0].license_url = 'https://example.com/terms'; },
    e => { e.voices[0].license_url += '?version=other'; }]) {
    const input = context(); mutate(input.catalog.episodes[0]);
    assert.throws(() => createDeclaredAudioResolver()(input), /tuple\/credit\/terms/);
  }
});

test('only one complete episode with valid bounded duration and chapters is resolved', () => {
  for (const mutate of [e => { e.part = 2; }, e => { e.parts = 2; }, e => { e.duration_seconds = Infinity; },
    e => { e.duration_seconds = 0; }, e => { e.duration_seconds = 86401; }, e => { e.chapters = []; },
    e => { e.chapters[0].id = e.chapters[1].id; }, e => { e.chapters[1].start_seconds = 0; },
    e => { e.chapters[0].start_seconds = -1; }, e => { e.chapters[0].title = ''; },
    e => { e.chapters.at(-1).start_seconds = e.duration_seconds; }]) {
    const input = context(); mutate(input.catalog.episodes[0]);
    assert.throws(() => createDeclaredAudioResolver()(input), /tuple|metadata|chapter/);
  }
});

test('duplicate and ambiguous declarations reject before any catalog access', () => {
  let touched = false;
  const unread = { get schema_version() { touched = true; throw Error('catalog accessed'); } };
  const duplicateID = declarations(); duplicateID[1].episode_id = duplicateID[0].episode_id;
  const ambiguousArticle = declarations(); ambiguousArticle[1] = { ...ambiguousArticle[0], episode_id: 'another-episode' };
  for (const values of [[...DEFAULT_NATIVE_AUDIO_IDENTITIES, ...DEFAULT_NATIVE_AUDIO_IDENTITIES], duplicateID, ambiguousArticle]) {
    assert.throws(() => createDeclaredAudioResolver(values)({ ...context(), catalog: unread }), /duplicate or ambiguous/);
    assert.equal(touched, false);
  }
});

test('malformed declarations reject before selection, including incomplete tuples and unversioned URLs', () => {
  for (const mutate of [d => { delete d.script_sha256; }, d => { d.article_id = 'wrong'; },
    d => { d.audio_sha256 = 'self-reported'; }, d => { d.credit = ''; },
    d => { d.license_url = 'http://voicevox.hiroshiba.jp/nemo/term/'; },
    d => { d.audio_url = 'https://github.com/pero3dev/ai-agent-library/releases/download/latest/episode.mp3'; }]) {
    const declaration = clone(DEFAULT_NATIVE_AUDIO_IDENTITIES[0]); mutate(declaration);
    assert.throws(() => createDeclaredAudioResolver([declaration]), /invalid trusted/);
  }
  for (const value of [null, [], {}, Array(33).fill(DEFAULT_NATIVE_AUDIO_IDENTITIES[0])]) assert.throws(() => createDeclaredAudioResolver(value), /declarations/);
});

test('duplicate catalog IDs and ambiguous article episodes are rejected', () => {
  const duplicate = context(); duplicate.catalog.episodes.push(clone(duplicate.catalog.episodes[0]));
  assert.throws(() => createDeclaredAudioResolver()(duplicate), /duplicate catalog/);
  const ambiguous = context(); ambiguous.catalog.episodes.push({ ...ambiguous.catalog.episodes[0], id: 'another-episode' });
  assert.throws(() => createDeclaredAudioResolver()(ambiguous), /ambiguous catalog article/);
});

test('catalog or selection-like data cannot provide a trusted policy', () => {
  const input = context(fixture.episodes[1]);
  input.catalog.trustedAudioDeclarations = declarations(); input.catalog.trustedDeclarations = declarations();
  input.selection = { trustedAudioDeclarations: declarations() }; input.manifest = { trustedDeclarations: declarations() };
  assert.throws(() => createDeclaredAudioResolver()(input), /not declared/);
  for (const sourcePath of fixture.other_catalog_article_paths) assert.throws(() => createDeclaredAudioResolver()({ sourcePath }), /not declared/);
});

test('a resolver snapshots trusted declarations and never mutates caller data', () => {
  const values = declarations(), input = context(), frozenInput = JSON.stringify(input);
  const resolve = createDeclaredAudioResolver(values); values[0].credit = 'changed after binding';
  assert.equal(resolve(input).attribution, DEFAULT_NATIVE_AUDIO_IDENTITIES[0].credit);
  assert.equal(JSON.stringify(input), frozenInput);
});

test('pure module initialization and identity resolution make no network request', async t => {
  let calls = 0;
  const fail = () => { calls++; throw Error('network attempted'); };
  const oldFetch = globalThis.fetch; globalThis.fetch = fail; t.after(() => { globalThis.fetch = oldFetch; });
  for (const target of [http, https]) for (const key of ['get', 'request']) {
    const original = target[key]; target[key] = fail; t.after(() => { target[key] = original; });
  }
  const isolated = await import(new URL('../../scripts/lib/ios-audio-identity.mjs?offline-fixture', import.meta.url));
  assert.equal(isolated.createDeclaredAudioResolver()(context()).id, fixture.episodes[0].id);
  assert.equal(calls, 0);
});

test('native producer binds the trusted JS policy before any root/catalog IO', async () => {
  const { buildNativeContent } = await import('../../scripts/lib/ios-native-content.mjs');
  const duplicate = [...DEFAULT_NATIVE_AUDIO_IDENTITIES, ...DEFAULT_NATIVE_AUDIO_IDENTITIES];
  await assert.rejects(buildNativeContent({ root: '/missing-identity-preflight-only', trustedAudioDeclarations: duplicate }), /duplicate or ambiguous/);
});

test('native CLI cannot supply a declaration policy or a selection override argument', async () => {
  const { parseNativeBuildOptions } = await import('../../scripts/build-ios-native-content.mjs');
  for (const args of [['--trustedAudioDeclarations', 'fixture.json'], ['--audio-identities', 'fixture.json'], ['--selection', 'fixture.json']]) {
    assert.throws(() => parseNativeBuildOptions(args), /Usage|Unknown|unknown|Unsupported|Unexpected/);
  }
});
