import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditNativeContent, assertNativeAuditArticleSet, assertNativeAuditDescriptions, expectedNativeAuditLink, parseNativeAuditOptions, publishedAuditSources, resolveNativeAuditContent } from '../../ios/tests/native-content-audit.mjs';
import { buildNativeContent } from '../../scripts/lib/ios-native-content.mjs';
import { sha256 } from '../../scripts/lib/ios-content.mjs';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const articlePaths = ['docs/01-concepts/one.md', 'docs/01-concepts/two.md', 'docs/11-llm-internals/three.md'];
const articleSource = (title, status = 'published') => `---\ntitle: "${title}"\ncategory: "concepts"\nlevel: "basic"\nstatus: "${status}"\nlast_updated: "2026-10-25"\n---\n\n# ${title}\n\n## この記事の目的\n\n原文の文章です。\n`;
const idFor = file => file.replace(/^docs\//, '').replace(/\.md$/, '');
const records = files => files.map(file => ({ source_path: file, id: idFor(file) }));
const mockDependencies = { async renderAssets(requests) {
  assert.equal(requests.size, 0, 'Text-only fixture must not use a browser');
  return { files: new Map([['assets/katex/LICENSE.txt', Buffer.from('KaTeX fixture notice')], ['assets/licenses/Mermaid-LICENSE.txt', Buffer.from('Mermaid fixture notice')]]), metadata: new Map() };
} };

async function fixture(t) {
  const temporary = await realpath(await mkdtemp(path.join(os.tmpdir(), 'ailibrary-ios-audit-test-')));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const root = path.join(temporary, 'source');
  const sources = new Map(articlePaths.map((file, index) => [file, articleSource(`記事${index + 1}`)]));
  const selection = { schema_version: 1, articles: articlePaths, audio_article: articlePaths[0], diagram_descriptions: {} };
  const episode = { id: 'test-episode', title: '音声', article_path: articlePaths[0], part: 1, parts: 1, script_sha256: 'b'.repeat(64), source_digest: sha256(sources.get(articlePaths[0])), audio_sha256: 'a'.repeat(64), audio_url: 'https://github.com/pero3dev/ai-agent-library/releases/download/test/audio.mp3', duration_seconds: 60, attribution: 'VOICEVOX Nemo', voices: [{ license_url: 'https://voicevox.hiroshiba.jp/nemo/term/' }], chapters: [{ id: 'intro', title: '導入', start_seconds: 0 }] };
  episode.audio_url = `https://github.com/pero3dev/ai-agent-library/releases/download/test-${episode.source_digest.slice(0, 16)}-${episode.script_sha256.slice(0, 16)}/episode-${episode.audio_sha256.slice(0, 16)}.mp3`;
  const trustedAudioDeclarations = [{ episode_id: episode.id, article_id: episode.article_path.slice(5, -3), article_path: episode.article_path, audio_url: episode.audio_url, audio_sha256: episode.audio_sha256, source_digest: episode.source_digest, script_sha256: episode.script_sha256, credit: episode.attribution, license_url: episode.voices[0].license_url }];
  const files = new Map([
    ['LICENSE', 'Documentation and source code fixture notices.'],
    ['ios/content-selection.json', JSON.stringify(selection)],
    ['ios/all-published-diagram-descriptions.json', JSON.stringify({ schema_version: 1, diagram_descriptions: {} })],
    ['website/audio/catalog.json', JSON.stringify({ schema_version: 1, episodes: [episode] })],
    ...sources
  ]);
  const put = async (file, content) => { await mkdir(path.dirname(path.join(root, file)), { recursive: true }); await writeFile(path.join(root, file), content); };
  for (const [file, content] of files) await put(file, content);
  return { temporary, root, selection, trustedAudioDeclarations, put, output: path.join(temporary, 'export', 'Content') };
}

test('audit CLI distinguishes representative, fixture, production and explicit temporary profiles', () => {
  assert.deepEqual(parseNativeAuditOptions([]), { profile: 'representative' });
  assert.deepEqual(parseNativeAuditOptions(['--fixtures']), { profile: 'fixtures' });
  assert.deepEqual(parseNativeAuditOptions(['--published-library']), { profile: 'published-library' });
  assert.deepEqual(parseNativeAuditOptions(['--content', '/tmp/example/Content', '--all-published']), { profile: 'all-published', content: '/tmp/example/Content' });
  for (const args of [['--all-published'], ['--content', 'x'], ['--fixtures', '--all-published', '--content', 'x'], ['--published-library', '--content', 'x'], ['--fixtures', '--published-library'], ['--fixtures', '--fixtures'], ['--content'], ['--content', '--all-published'], ['--all-published', '--content', ''], ['--all-published', '--content', 'x', '--content', 'y'], ['--unknown'], ['false']]) assert.throws(() => parseNativeAuditOptions(args), /Usage/);
});

test('audit input authority keeps canonical profiles fixed and temporary input separate without symlinks', async t => {
  const { root, temporary, output } = await fixture(t);
  const canonical = path.join(root, 'ios/AILibrary/Content');
  assert.equal(await resolveNativeAuditContent(root), canonical);
  assert.equal(await resolveNativeAuditContent(root, { profile: 'published-library' }), canonical);
  assert.equal(await resolveNativeAuditContent(root, { profile: 'fixtures' }), path.join(root, 'ios/AILibrary/TestContent'));
  assert.equal(await resolveNativeAuditContent(root, { profile: 'all-published', content: output }), output);
  await assert.rejects(resolveNativeAuditContent(root, { profile: 'published-library', content: output }), /Only the temporary/);
  for (const content of [canonical, path.join(root, 'ios/AILibrary/TestContent'), path.dirname(canonical), canonical + '/Content', path.join(temporary, 'Other'), path.join(os.tmpdir(), 'outside-audit/Content'), '/etc/Content']) await assert.rejects(resolveNativeAuditContent(root, { profile: 'all-published', content }));
  await mkdir(path.join(temporary, 'real'), { recursive: true });
  await symlink(path.join(temporary, 'real'), path.join(temporary, 'linked'));
  await assert.rejects(resolveNativeAuditContent(root, { profile: 'all-published', content: path.join(temporary, 'linked/Content') }), /Symlink/);
  await mkdir(path.dirname(canonical), { recursive: true });
  await symlink(path.join(temporary, 'real'), canonical);
  await assert.rejects(resolveNativeAuditContent(root), /Symlink/);
  await assert.rejects(resolveNativeAuditContent(root, { profile: 'unknown' }), /Unknown/);
});

test('published source inventory independently excludes README and draft while enforcing source status and symlinks', async t => {
  const { root, put } = await fixture(t);
  await put('docs/01-concepts/zero.md', articleSource('先頭'));
  await put('docs/01-concepts/draft.md', articleSource('下書き', 'draft'));
  await put('docs/01-concepts/README.md', 'README without article metadata');
  await put('docs/README.md', 'Root README');
  assert.deepEqual(await publishedAuditSources(root), ['docs/01-concepts/one.md', 'docs/01-concepts/two.md', 'docs/01-concepts/zero.md', 'docs/11-llm-internals/three.md']);
  await put('docs/01-concepts/draft.md', articleSource('不明', 'later'));
  await assert.rejects(publishedAuditSources(root), /Unknown source status/);
  await put('docs/01-concepts/draft.md', articleSource('下書き', 'draft').replace('status: "draft"', 'status: "draft"\nstatus: "published"'));
  await assert.rejects(publishedAuditSources(root), /exactly one/);
  await put('docs/01-concepts/draft.md', articleSource('下書き', 'draft'));
  await symlink(path.join(root, articlePaths[0]), path.join(root, 'docs/01-concepts/linked.md'));
  await assert.rejects(publishedAuditSources(root), /symlinks/);
});

test('article-set audit rejects missing, duplicate, reordered or rebound source IDs', () => {
  const expected = records(articlePaths);
  assert.doesNotThrow(() => assertNativeAuditArticleSet(expected, articlePaths));
  for (const actual of [expected.slice(1), [expected[0], expected[0], expected[2]], [...expected].reverse(), expected.map((value, index) => index ? value : { ...value, id: 'wrong/identity' })]) assert.throws(() => assertNativeAuditArticleSet(actual, articlePaths));
});

test('link audit covers selected fragments, site routes and safe repository fallbacks independently', () => {
  const article = { id: '01-concepts/one', source_path: articlePaths[0] }, selected = new Map(articlePaths.map(file => [file, idFor(file)]));
  assert.deepEqual(expectedNativeAuditLink('#%E8%A6%8B%E5%87%BA%E3%81%97', article, selected), { kind: 'article', article_id: article.id, heading_id: '見出し' });
  assert.deepEqual(expectedNativeAuditLink('two.md?ignored=1#%E8%A6%8B%E5%87%BA%E3%81%97', article, selected), { kind: 'article', article_id: '01-concepts/two', heading_id: '見出し' });
  assert.equal(expectedNativeAuditLink('README.md?q=1#section', article, selected).url, 'https://pero3dev.github.io/ai-agent-library/docs/concepts?q=1#section');
  assert.equal(expectedNativeAuditLink('../../GLOSSARY.md?ignored=1#term', article, selected).url, 'https://pero3dev.github.io/ai-agent-library/glossary#term');
  assert.equal(expectedNativeAuditLink('../../README.md?ignored=1#start', article, selected).url, 'https://pero3dev.github.io/ai-agent-library/#start');
  assert.equal(expectedNativeAuditLink('../../examples/python/sample/README.md?ignored=1#usage', article, selected).url, 'https://pero3dev.github.io/ai-agent-library/docs/examples/sample#usage');
  assert.equal(expectedNativeAuditLink('../../research/調査 note.md?ignored=1#考察', article, selected).url, 'https://github.com/pero3dev/ai-agent-library/blob/main/research/%E8%AA%BF%E6%9F%BB%20note.md#%E8%80%83%E5%AF%9F');
  assert.equal(expectedNativeAuditLink('HTTPS://example.com/a#式', article, selected).url, 'https://example.com/a#%E5%BC%8F');
  for (const href of ['http://example.com', 'https://user:secret@example.com/', '//example.com', 'javascript:alert(1)', '/etc/passwd', '..%2F..%2F..%2Fsecret', '..%5Csecret', '%00', '%ZZ', '#%ZZ']) assert.throws(() => expectedNativeAuditLink(href, article, selected));
});

test('full diagram-map audit rejects missing, stale or malformed source descriptions', () => {
  const first = 'a'.repeat(24), second = 'b'.repeat(24);
  assert.doesNotThrow(() => assertNativeAuditDescriptions(new Set([first]), { [first]: '図の説明' }));
  for (const descriptions of [{}, { [first]: '図の説明', [second]: '余分' }, { [first]: '' }, { invalid: '不正キー' }, { [first]: 'x'.repeat(16385) }, null, []]) assert.throws(() => assertNativeAuditDescriptions(new Set([first]), descriptions));
});

test('full audit accepts an actual text-only package and rejects exact-set, source SHA and source-path tampering', async t => {
  const { root, output, put, selection, trustedAudioDeclarations } = await fixture(t);
  await put('docs/01-concepts/four.md', articleSource('追加記事'));
  await put('docs/01-concepts/draft.md', articleSource('下書き', 'draft'));
  const manifest = await buildNativeContent({ root, allPublished: true, output, selection, trustedAudioDeclarations, dependencies: mockDependencies });
  const options = { root, profile: 'all-published', content: output };
  const passed = await auditNativeContent(options);
  assert.equal(passed.result, 'passed');
  assert.equal(passed.articles.length, 4);
  assert.equal(passed.source_bound_diagram_descriptions, 0);
  const saveManifest = async value => {
    value.revision = sha256(JSON.stringify({ schema_version: 2, articles: value.articles, audio: value.audio, files: value.files }));
    await writeFile(path.join(output, 'manifest.json'), JSON.stringify(value));
  };
  const missing = structuredClone(manifest); missing.articles.pop(); await saveManifest(missing);
  await assert.rejects(auditNativeContent(options), /Exact ordered source article set/);
  const stale = structuredClone(manifest); stale.articles[0].source_sha256 = 'f'.repeat(64); await saveManifest(stale);
  await assert.rejects(auditNativeContent(options), /Current source binding/);
  const escaped = structuredClone(manifest); escaped.articles[0].document_path = '../private.json'; await saveManifest(escaped);
  await assert.rejects(auditNativeContent(options), /document path is source-bound/);
  await rm(path.join(output, 'manifest.json'));
  await symlink(path.join(root, 'ios/content-selection.json'), path.join(output, 'manifest.json'));
  await assert.rejects(auditNativeContent(options), /Manifest must be a regular file/);
  await rm(path.join(output, 'manifest.json'));
  await saveManifest(structuredClone(manifest));
  const noticePath = path.join(output, 'assets/licenses/NOTICE.txt'), notice = await readFile(noticePath);
  const changedNotice = structuredClone(manifest);
  await writeFile(noticePath, 'Changed attribution');
  changedNotice.files['assets/licenses/NOTICE.txt'] = sha256('Changed attribution');
  await saveManifest(changedNotice);
  await assert.rejects(auditNativeContent(options), /attribution matches the current source/);
  await writeFile(noticePath, notice);
  await saveManifest(structuredClone(manifest));
  const licensePath = path.join(output, 'assets/katex/LICENSE.txt'), license = await readFile(licensePath);
  const missingLicense = structuredClone(manifest);
  delete missingLicense.files['assets/katex/LICENSE.txt'];
  await rm(licensePath); await saveManifest(missingLicense);
  await assert.rejects(auditNativeContent(options), /Required attribution file/);
  await writeFile(licensePath, license); await saveManifest(structuredClone(manifest));
  assert.equal((await auditNativeContent(options)).result, 'passed');
});

test('audit module import has no package-read or CLI side effect and invalid CLI emits compact failure JSON', () => {
  const moduleURL = new URL('../../ios/tests/native-content-audit.mjs', import.meta.url).href;
  const imported = execFileSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(moduleURL)}); console.log('imported');`], { cwd: repositoryRoot, encoding: 'utf8' });
  assert.equal(imported, 'imported\n');
  const failure = spawnSync(process.execPath, ['ios/tests/native-content-audit.mjs', '--all-published'], { cwd: repositoryRoot, encoding: 'utf8' });
  assert.equal(failure.status, 1);
  assert.equal(JSON.parse(failure.stdout).result, 'failed');
  assert.match(JSON.parse(failure.stdout).error, /Usage/);
  assert.equal(failure.stderr, '');
});
