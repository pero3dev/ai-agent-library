import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { audioMetadata, buildContent, parseArticle, readSource, renderArticle, rewriteLink, sha256, validateOutput } from '../../scripts/lib/ios-content.mjs';
import { parseLegacyBuildOptions, validateLegacyBuildOutput } from '../../scripts/build-ios-content.mjs';

const source = (title, body = '本文です。') => `---\ntitle: "${title}"\ncategory: "concepts"\nlevel: "basic"\nstatus: "published"\nlast_updated: "2026-10-22"\n---\n\n# ${title}\n\n## この記事の目的\n\n${body}\n`;
const paths = ['docs/01-concepts/one.md', 'docs/01-concepts/two.md', 'docs/11-llm-internals/three.md'];
const mockDependencies = {
  renderMath: (value, display) => `<math data-display="${display}"><mtext>${value.replaceAll('<', '&lt;')}</mtext></math>`,
  renderDiagrams: async charts => new Map([...charts.keys()].flatMap(key => ['light', 'dark'].map(theme => [`assets/diagrams/${key}-${theme}.svg`, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')]))),
  mathAssets: new Map([['assets/katex/katex.min.css', Buffer.from('/* offline fixture */')]])
};

async function fixture(t) {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'ailibrary-ios-test-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const files = new Map([
    ['LICENSE', 'Fixture documentation attribution and MIT notice.'],
    [paths[0], source('第一記事', '検索対象の原文。\n\n[次](two.md#見出し)\n\n```python\nprint("offline")\n```')],
    [paths[1], source('第二記事', '| 方式 | 条件 |\n| --- | --- |\n| 保存 | オフライン |\n\n```mermaid\nflowchart LR\nA --> B\n```')],
    [paths[2], source('第三記事', '式 $x^2$ です。\n\n$$\nx = y + 1\n$$')],
    ['ios/renderer/reader.js', 'window.reader = {};'],
    ['ios/renderer/reader.css', 'body { color: black; }']
  ]);
  for (const [name, content] of files) { await mkdir(path.dirname(path.join(root, name)), { recursive: true }); await writeFile(path.join(root, name), content); }
  const episode = { id: 'test-episode', title: '第一記事 音声', article_path: paths[0], parts: 1, source_digest: sha256(files.get(paths[0])), audio_sha256: 'a'.repeat(64), audio_url: 'https://github.com/pero3dev/ai-agent-library/releases/download/test/episode.mp3', duration_seconds: 123, attribution: 'VOICEVOX Nemo（女声1・男声1）', voices: [{ license_url: 'https://voicevox.hiroshiba.jp/nemo/term/' }], chapters: [{ id: 'intro', title: '導入', start_seconds: 0 }, { id: 'main', title: '本文', start_seconds: 60 }] };
  await mkdir(path.join(root, 'website/audio'), { recursive: true });
  await writeFile(path.join(root, 'website/audio/catalog.json'), JSON.stringify({ schema_version: 1, episodes: [episode] }));
  return { root, files, episode, selection: { schema_version: 1, articles: paths, audio_article: paths[0] }, output: path.join(root, 'bundle/Content') };
}

test('legacy CLI requires one explicit output and importing it cannot start generation', async t => {
  assert.deepEqual(parseLegacyBuildOptions(['--output', 'comparison/Content']), { output: path.resolve('comparison/Content') });
  for (const args of [[], ['--output'], ['--output', ''], ['--output', '--fixtures'], ['--fixtures'],
    ['--output', 'one', '--output', 'two'], ['--output', 'one', 'extra'], ['--unknown', 'one']]) {
    assert.throws(() => parseLegacyBuildOptions(args), /exactly one explicit/);
  }
  const value = await fixture(t);
  const script = new URL('../../scripts/build-ios-content.mjs', import.meta.url);
  const env = { ...process.env, IOS_TOOLS_DIR: path.join(value.root, 'missing-rendering-dependencies') };
  const imported = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(script.href)}); console.log('import-only');`],
    { cwd: value.root, env, encoding: 'utf8' });
  assert.equal(imported.status, 0, imported.stderr);
  assert.equal(imported.stdout.trim(), 'import-only');
  assert.equal(imported.stderr, '');
  const noOutput = spawnSync(process.execPath, [fileURLToPath(script)], { cwd: value.root, env, encoding: 'utf8' });
  assert.equal(noOutput.status, 1);
  assert.match(noOutput.stderr, /requires exactly one explicit --output/);
  assert.doesNotMatch(noOutput.stderr, /Rendering dependencies/);
});

test('legacy CLI accepts temporary output only and preserves both native package directories', async t => {
  const value = await fixture(t);
  const regular = path.join(value.root, 'ios/AILibrary/Content');
  const testing = path.join(value.root, 'ios/AILibrary/TestContent');
  for (const directory of [regular, testing]) {
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, 'sentinel'), 'keep');
  }
  assert.equal(await validateLegacyBuildOutput(value.root, value.output), value.output);
  for (const output of [regular, path.join(regular, 'child'), testing, path.join(testing, 'child'), path.dirname(regular), value.root]) {
    await assert.rejects(validateLegacyBuildOutput(value.root, output), /Output must|Legacy HTML output/);
  }
  await assert.rejects(validateLegacyBuildOutput(value.root, path.join(os.tmpdir(), 'unrelated-comparison-output')), /Output must/);
  for (const directory of [regular, testing]) assert.equal(await readFile(path.join(directory, 'sentinel'), 'utf8'), 'keep');
});

test('audio metadata obeys the same positive 24-hour limit as the native package consumer', async t => {
  const value = await fixture(t);
  const article = parseArticle(value.files.get(paths[0]), paths[0]);
  const metadata = duration => audioMetadata({ schema_version: 1, episodes: [{ ...value.episode, duration_seconds: duration,
    chapters: [{ id: 'intro', title: '導入', start_seconds: 0 }] }] }, article, paths[0]);
  assert.equal(metadata(0.25).duration_seconds, 0.25);
  assert.equal(metadata(86_400).duration_seconds, 86_400);
  for (const duration of [0, -1, NaN, Infinity, -Infinity, 86_400 + Number.EPSILON * 86_400, 1e300]) {
    assert.throws(() => metadata(duration), /Invalid audio metadata/);
  }
});

test('article parser requires published articles and preserves source SHA', () => {
  const text = source('試験');
  const parsed = parseArticle(text.replaceAll('\n', '\r\n'), paths[0]);
  assert.equal(parsed.id, '01-concepts/one');
  assert.equal(parsed.normalized_digest, sha256(text));
  assert.equal(parsed.source_sha256, sha256(text.replaceAll('\n', '\r\n')));
  assert.throws(() => parseArticle(text.replace('published', 'draft'), paths[0]), /published/);
  assert.throws(() => parseArticle(text, '../outside.md'), /Invalid article/);
});

test('article links resolve from the original file, selected links remain offline', () => {
  const selected = new Set(paths);
  assert.deepEqual(rewriteLink('two.md#見出し', paths[0], selected), { href: '01-concepts--two.html#見出し', article_id: '01-concepts/two', fragment: '見出し' });
  assert.equal(rewriteLink('../02-architecture/error-handling-and-retries.md#例', paths[0], selected).href, 'https://pero3dev.github.io/ai-agent-library/docs/architecture/error-handling-and-retries#例');
  assert.equal(rewriteLink('../../examples/python/tool-use/README.md', paths[0], selected).href, 'https://pero3dev.github.io/ai-agent-library/docs/examples/tool-use');
  assert.equal(rewriteLink('../../GLOSSARY.md#agent', paths[0], selected).href, 'https://pero3dev.github.io/ai-agent-library/glossary#agent');
  assert.throws(() => rewriteLink('javascript:alert(1)', paths[0], selected), /Unsupported/);
  assert.throws(() => rewriteLink('../../../outside.md', paths[0], selected), /escapes/);
  assert.throws(() => rewriteLink('//attacker.example/script.js', paths[0], selected), /Unsupported/);
  assert.throws(() => rewriteLink('https://user:pass@example.com', paths[0], selected), /Credentials/);
});

test('renderer escapes raw HTML, renders math, and supplies accessible scrolling and code copy', () => {
  const article = parseArticle(source('試験', '<script>alert("bad")</script>\n\n## 同名\n\n## 同名\n\n[次](two.md)\n\n```js\n<script>\n```\n\n| A | B |\n| --- | --- |\n| x | y |\n\n式 $x$\n\n$$\ny\n$$'), paths[0]);
  const rendered = renderArticle(article, { selected: new Set(paths), diagrams: new Map(), ...mockDependencies });
  assert.match(rendered.html, /&lt;script&gt;alert/);
  assert.doesNotMatch(rendered.html, /<script>alert/);
  assert.match(rendered.html, /data-article-id="01-concepts\/two"/);
  assert.match(rendered.html, /data-copy="code-1"/);
  assert.match(rendered.html, /aria-label="表。左右にスクロールできます"/);
  assert.match(rendered.html, /<math data-display="false"/);
  assert.match(rendered.html, /<math data-display="true"/);
  assert.match(rendered.html, /connect-src &#39;none&#39;/);
  assert.deepEqual(rendered.headings.slice(-2).map(heading => heading.id), ['同名', '同名-1']);
  assert.match(rendered.search_text, /式 x/);
  assert.throws(() => renderArticle(parseArticle(source('画像', '![画像](https://example.com/remote.png)'), paths[0]), { selected: new Set(paths), diagrams: new Map(), ...mockDependencies }), /explicitly bundled/);
});

test('bundle generation is deterministic, hashes every output, and uses only audio metadata', async t => {
  const value = await fixture(t);
  const options = { ...value, dependencies: mockDependencies };
  const manifest = await buildContent(options);
  const previous = await readFile(path.join(value.output, 'manifest.json'), 'utf8');
  const again = await buildContent(options);
  assert.equal(manifest.revision, again.revision);
  assert.equal(await readFile(path.join(value.output, 'manifest.json'), 'utf8'), previous);
  assert.equal(manifest.articles.length, 3);
  assert.equal(manifest.audio.length, 1);
  assert.equal(manifest.audio[0].source_is_current, true);
  assert.equal(manifest.audio[0].credit, value.episode.attribution);
  assert.equal(manifest.audio[0].sha256, value.episode.audio_sha256);
  assert.equal(manifest.audio[0].chapters.length, 2);
  assert.equal(manifest.articles[0].audio_id, value.episode.id);
  assert.equal(manifest.files['manifest.json'], undefined);
  for (const [name, hash] of Object.entries(manifest.files)) assert.equal(sha256(await readFile(path.join(value.output, name))), hash);
  assert.equal(Object.keys(manifest.files).filter(name => name.endsWith('.svg')).length, 2);
  assert.equal(Object.keys(manifest.files).some(name => /\.mp3$/.test(name)), false);
  assert.match(await readFile(path.join(value.output, manifest.articles[0].html_path), 'utf8'), /01-concepts--two\.html#%E8%A6%8B%E5%87%BA%E3%81%97/);
});

test('stale audio remains explicitly marked without silently changing the source binding', async t => {
  const value = await fixture(t);
  await writeFile(path.join(value.root, paths[0]), source('改訂済み'));
  const manifest = await buildContent({ ...value, dependencies: mockDependencies });
  assert.equal(manifest.audio[0].source_is_current, false);
  assert.equal(manifest.audio[0].source_digest, value.episode.source_digest);
});

test('output restrictions and source traversal fail before touching unrelated files', async t => {
  const value = await fixture(t);
  const sentinel = path.join(value.root, 'sentinel');
  await writeFile(sentinel, 'keep');
  await assert.rejects(buildContent({ ...value, output: value.root, dependencies: mockDependencies }), /Output must/);
  await assert.rejects(readSource(value.root, '../sentinel'), /Unsafe source/);
  await assert.rejects(readSource(value.root, 'docs/../../sentinel'), /Unsafe source/);
  await assert.rejects(readSource(value.root, 'docs\\sentinel'), /Unsafe source/);
  assert.equal(await readFile(sentinel, 'utf8'), 'keep');
  assert.equal(await validateOutput(value.root, path.join(value.root, 'ios/AILibrary/Content')), path.join(value.root, 'ios/AILibrary/Content'));
});

test('application-controlled output and source symlinks are refused', { skip: process.platform === 'win32' ? 'Windows symlink creation requires extra privileges' : false }, async t => {
  const value = await fixture(t);
  await symlink(path.join(value.root, 'docs'), path.join(value.root, 'linked-docs'));
  await assert.rejects(readSource(value.root, 'linked-docs/01-concepts/one.md'), /Symlink/);
  await mkdir(path.join(value.root, 'bundle'), { recursive: true });
  await symlink(path.join(value.root, 'docs'), value.output);
  await assert.rejects(buildContent({ ...value, dependencies: mockDependencies }), /Symlink/);
  assert.match(await readFile(path.join(value.root, paths[0]), 'utf8'), /第一記事/);
});

test('invalid catalog URL and chapter order are rejected before bundle write', async t => {
  const value = await fixture(t);
  const catalogFile = path.join(value.root, 'website/audio/catalog.json');
  value.episode.audio_url = 'https://attacker.example/episode.mp3';
  await writeFile(catalogFile, JSON.stringify({ schema_version: 1, episodes: [value.episode] }));
  await assert.rejects(buildContent({ ...value, dependencies: mockDependencies }), /versioned repository/);
  value.episode.audio_url = 'https://github.com/pero3dev/ai-agent-library/releases/download/test/episode.mp3';
  value.episode.chapters.reverse();
  await writeFile(catalogFile, JSON.stringify({ schema_version: 1, episodes: [value.episode] }));
  await assert.rejects(buildContent({ ...value, dependencies: mockDependencies }), /Invalid audio chapter/);
});

test('reader restores an exact fraction and offers a separate explicit heading jump without a native bridge', async () => {
  const reader = await readFile(new URL('../../ios/renderer/reader.js', import.meta.url), 'utf8');
  const positions = [];
  const scales = [];
  let jumped = 0;
  const heading = { id: 'section', scrollIntoView: () => jumped++, getBoundingClientRect: () => ({ top: 0 }) };
  const window = { scrollTo: (x, y) => positions.push(y) };
  const handlers = {};
  runInNewContext(reader, {
    window, innerHeight: 100, scrollY: 0,
    document: { querySelectorAll: () => [heading], getElementById: id => id === 'section' ? heading : null, addEventListener: () => {}, documentElement: { scrollHeight: 1000, style: { setProperty: (key, value) => scales.push(value) } } },
    requestAnimationFrame: callback => { callback(); return 1; }, cancelAnimationFrame: () => {}, addEventListener: (name, callback) => { handlers[name] = callback; }
  });
  window.reader.restore({ heading: 'section', fraction: .6, fontScale: 1.2 });
  assert.equal(positions.at(-1), 540);
  assert.equal(jumped, 0);
  assert.equal(window.reader.goToHeading('section'), true);
  assert.equal(jumped, 1);
  window.reader.restore({ heading: 'section', fraction: 0 });
  assert.equal(jumped, 2);
  window.reader.setFontScale(20);
  assert.equal(scales.at(-1), 4);
  assert.equal(window.reader.goToHeading('missing'), false);
  assert.doesNotThrow(() => handlers.pagehide());
});
