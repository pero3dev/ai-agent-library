import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';
import { buildNativeContent, parseNativeArticle, validateNativePackageBounds } from '../../scripts/lib/ios-native-content.mjs';
import { installMath, NATIVE_READER_FIXTURE, parseArticle, renderArticle, rewriteLink, sha256, validateOutput } from '../../scripts/lib/ios-content.mjs';
import { nativePaintGeometry, nativeRasterGeometry } from '../../scripts/lib/ios-native-assets.mjs';
import { parseNativeBuildOptions } from '../../scripts/build-ios-native-content.mjs';

test('paint geometry clips wide square-root SVGs and retains visible tall fractions and accents', () => {
  const main = { left: 10, top: 20, right: 40, bottom: 45 };
  const sqrt = { bounds: { left: 10, top: 18, right: 10010, bottom: 43 }, clips: [{ bounds: { left: 10, top: 18, right: 40, bottom: 43 }, x: true, y: true }] };
  assert.deepEqual(nativePaintGeometry(main, [sqrt]), { width: 34, height: 31, offsetX: 2, offsetY: 4 });
  const accent = { bounds: { left: 12, top: 12, right: 38, bottom: 22 }, clips: [] };
  const denominator = { bounds: { left: 12, top: 40, right: 38, bottom: 54 }, clips: [] };
  const hidden = { bounds: { left: 0, top: 0, right: 9000, bottom: 9000 }, clips: [{ bounds: { left: 10000, top: 10000, right: 10001, bottom: 10001 }, x: true, y: true }] };
  assert.deepEqual(nativePaintGeometry(main, [sqrt, accent, denominator, hidden]), { width: 34, height: 46, offsetX: 2, offsetY: 10 });
  assert.deepEqual(nativePaintGeometry(main, [{ bounds: { left: 0, top: 0, right: 100, bottom: 50 }, clips: [{ bounds: { left: 10, top: 20, right: 40, bottom: 45 }, x: true, y: false }] }]), { width: 34, height: 54, offsetX: 2, offsetY: 22 });
});

test('large raster assets retain aspect ratio within the native decoder budget', () => {
  for (const [width, height] of [[10047, 141], [8000, 8000], [250, 40000], [30, 20]]) {
    const raster = nativeRasterGeometry(width, height);
    assert.ok(raster.width * 3 <= 8192 && raster.height * 3 <= 8192);
    assert.ok(raster.width * raster.height * 9 <= 32000000);
    assert.ok(Math.abs(raster.width - width * raster.factor) < 1);
    assert.ok(Math.abs(raster.height - height * raster.factor) < 1);
  }
  assert.throws(() => nativeRasterGeometry(Infinity, 10));
  assert.throws(() => nativeRasterGeometry(1, 0));
});

const source = (title, body = '本文です。') => `---\ntitle: "${title}"\ncategory: "concepts"\nlevel: "basic"\nstatus: "published"\nlast_updated: "2026-10-22"\n---\n\n# ${title}\n\n## この記事の目的\n\n${body}\n`;
const fixtureSource = body => source('テスト専用', body).replace('status: "published"', 'status: "test-fixture"');
const paths = ['docs/01-concepts/one.md', 'docs/01-concepts/two.md', 'docs/11-llm-internals/three.md'];
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
const mockDependencies = {
  async renderAssets(requests) {
    const files = new Map([['assets/katex/LICENSE.txt', Buffer.from('Fixture KaTeX notice')], ['assets/licenses/Mermaid-LICENSE.txt', Buffer.from('Fixture Mermaid notice')]]);
    const metadata = new Map();
    for (const [key, request] of requests) {
      const asset = { light: `assets/native/${key}-light.png`, dark: `assets/native/${key}-dark.png`, width: 1, height: 1, scale: 1, ...(request.kind === 'math' && !request.display ? { baseline: 0 } : {}) };
      for (const name of [asset.light, asset.dark]) files.set(name, png);
      metadata.set(key, { asset, accessibility_text: `読み上げ: ${request.source}` });
    }
    return { files, metadata };
  }
};

test('native package bounds include manifest.json in the file and byte totals', () => {
  const maximumBytes = 256 * 1024 * 1024;
  const maximumManifest = 8 * 1024 * 1024;
  assert.doesNotThrow(() => validateNativePackageBounds({ fileCount: 4096, totalBytes: maximumBytes, manifestBytes: maximumManifest }));
  assert.throws(() => validateNativePackageBounds({ fileCount: 4097, totalBytes: 1, manifestBytes: 1 }), /file count or byte size limit/);
  assert.throws(() => validateNativePackageBounds({ fileCount: 1, totalBytes: maximumBytes + 1, manifestBytes: 1 }), /file count or byte size limit/);
  assert.throws(() => validateNativePackageBounds({ fileCount: 1, totalBytes: maximumManifest + 1, manifestBytes: maximumManifest + 1 }), /manifest exceeds/);
  for (const invalid of [
    { fileCount: 0, totalBytes: 1, manifestBytes: 1 },
    { fileCount: 1.5, totalBytes: 1, manifestBytes: 1 },
    { fileCount: 1, totalBytes: Infinity, manifestBytes: 1 },
    { fileCount: 1, totalBytes: 1, manifestBytes: 2 },
    { fileCount: 1, totalBytes: 1, manifestBytes: 0 }
  ]) assert.throws(() => validateNativePackageBounds(invalid), /Invalid native package size/);
});

function nodes(value) {
  if (!value || typeof value !== 'object') return [];
  return [value, ...Object.values(value).flatMap(child => Array.isArray(child) ? child.flatMap(nodes) : nodes(child))];
}
const plain = values => values.map(value => value.text || (value.children ? plain(value.children) : '')).join('');

async function fixture(t) {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'ailibrary-ios-native-test-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const files = new Map([
    ['LICENSE', 'Fixture documentation attribution and MIT notice.'],
    [paths[0], source('第一記事', '検索対象の原文。\n\n[次](two.md#見出し)\n\n```python\nprint("offline")\n```')],
    [paths[1], source('第二記事', '## 見出し\n\n| 方式 | 条件 |\n| :--- | ---: |\n| **保存** | [原文](https://example.com/) |\n\n```mermaid\nflowchart LR\nA --> B\n```')],
    [paths[2], source('第三記事', '式 $x^2$ です。\n\n$$\nx = y + 1\n$$')],
    [NATIVE_READER_FIXTURE.source_path, fixtureSource('## CASE-START\n\n[同じ記事](#case-end)と[同じファイル](native-reader.md#case-end)と[元記事](../../docs/01-concepts/one.md#第一記事)。\n\n## CASE-END\n\n到着。')]
  ]);
  const episode = { id: 'test-episode', title: '第一記事 音声', article_path: paths[0], parts: 1, source_digest: sha256(files.get(paths[0])), audio_sha256: 'a'.repeat(64), audio_url: 'https://github.com/pero3dev/ai-agent-library/releases/download/test/episode.mp3', duration_seconds: 123, attribution: 'VOICEVOX Nemo（女声1・男声1）', voices: [{ license_url: 'https://voicevox.hiroshiba.jp/nemo/term/' }], chapters: [{ id: 'intro', title: '導入', start_seconds: 0 }, { id: 'main', title: '本文', start_seconds: 60 }] };
  files.set('website/audio/catalog.json', JSON.stringify({ schema_version: 1, episodes: [episode] }));
  for (const [name, content] of files) { await mkdir(path.dirname(path.join(root, name)), { recursive: true }); await writeFile(path.join(root, name), content); }
  return { root, files, episode, selection: { schema_version: 1, articles: paths, audio_article: paths[0] }, output: path.join(root, 'bundle/Content') };
}

test('native parser preserves styled inline content, typed links, nested lists, quotes and tables', () => {
  const parsed = parseNativeArticle(parseArticle(source('構造', '## 章\n\n**太字と *強調* と `code`** と [同じ章](#章)。  \n改行。\n\n3. 項目\n   - 子項目 $x$\n   - 二番目\n\n> 引用です。\n>\n> - 引用内の項目\n\n| 左 | 中 | 右 |\n| :--- | :---: | ---: |\n| *強調* | $x$ | [次](two.md) |\n\n---\n\n```js\nconst x = 1;\n```\n\n$$\nx + y\n$$\n\n```mermaid\nflowchart TD\nA --> B\n```'), paths[0]), { selected: new Set(paths) });
  const all = nodes(parsed.document);
  assert.equal(parsed.document.schema_version, 1);
  assert.equal(parsed.document.article_id, '01-concepts/one');
  for (const type of ['heading', 'paragraph', 'strong', 'emphasis', 'code', 'link', 'hard_break', 'list', 'quote', 'table', 'math', 'diagram', 'thematic_break']) assert.ok(all.some(node => node.type === type), type);
  const ordered = all.find(node => node.type === 'list' && node.ordered);
  assert.equal(ordered.start, 3);
  assert.equal(ordered.items[0].blocks[1].type, 'list');
  assert.equal(all.find(node => node.type === 'quote').blocks[1].type, 'list');
  const table = all.find(node => node.type === 'table').table;
  assert.deepEqual(table.alignments, ['left', 'center', 'right']);
  assert.equal(table.rows[0][0][0].type, 'emphasis');
  assert.equal(table.rows[0][1][0].type, 'math');
  assert.deepEqual(table.rows[0][2][0].target, { kind: 'article', article_id: '01-concepts/two' });
  assert.ok(all.some(node => node.target?.article_id === '01-concepts/one' && node.target.heading_id === '章'));
  assert.equal(parsed.requests.size, 3); // Repeated inline x is deduplicated; display x+y and the diagram remain distinct.
  assert.match(parsed.search_text, /子項目 x/);
  assert.equal(new Set(all.filter(node => node.id).map(node => node.id)).size, all.filter(node => node.id).length);
});

test('test articles require an exact fixture path, explicit opt-in and dedicated status', () => {
  const text = fixtureSource('テスト専用です。');
  assert.throws(() => parseArticle(text, NATIVE_READER_FIXTURE.source_path), /Invalid article/);
  assert.throws(() => parseArticle(text, 'docs/01-concepts/test.md'), /Only published/);
  assert.throws(() => parseArticle(text, paths[0], { fixture: true }), /Invalid article/);
  assert.throws(() => parseArticle(text, 'ios/fixtures/other.md', { fixture: true }), /Invalid article/);
  assert.throws(() => parseArticle(source('公開'), NATIVE_READER_FIXTURE.source_path, { fixture: true }), /Only explicit test-fixture/);
  const article = parseArticle(text, NATIVE_READER_FIXTURE.source_path, { fixture: true });
  assert.equal(article.id, 'test-fixtures/native-reader');
  assert.equal(article.is_test_fixture, true);
  assert.equal(parseArticle(source('公開'), paths[0]).is_test_fixture, undefined);
});

test('selected path-to-ID maps preserve fixture own-file links and article heading targets', () => {
  const selected = new Map([[paths[0], '01-concepts/one'], [NATIVE_READER_FIXTURE.source_path, NATIVE_READER_FIXTURE.id]]);
  const article = parseArticle(fixtureSource('[fragment](#章) [filename](native-reader.md#章) [base](../../docs/01-concepts/one.md#第一記事)\n\n## 章'), NATIVE_READER_FIXTURE.source_path, { fixture: true });
  const links = nodes(parseNativeArticle(article, { selected }).document).filter(node => node.type === 'link').map(node => node.target);
  assert.deepEqual(links, [{ kind: 'article', article_id: NATIVE_READER_FIXTURE.id, heading_id: '章' }, { kind: 'article', article_id: NATIVE_READER_FIXTURE.id, heading_id: '章' }, { kind: 'article', article_id: '01-concepts/one', heading_id: '第一記事' }]);
  assert.equal(rewriteLink('native-reader.md#章', article.source_path, selected).article_id, NATIVE_READER_FIXTURE.id);
  assert.throws(() => rewriteLink('native-reader.md', article.source_path, new Map([[article.source_path, '../bad']])), /Invalid selected article ID/);
});

test('native CLI explicitly separates fixture and ordinary generation', () => {
  assert.deepEqual(parseNativeBuildOptions([]), { fixtures: false });
  assert.deepEqual(parseNativeBuildOptions(['--fixtures']), { fixtures: true });
  assert.deepEqual(parseNativeBuildOptions(['--fixtures', '--output', 'scratch']), { fixtures: true, output: path.resolve('scratch') });
  assert.deepEqual(parseNativeBuildOptions(['--output', 'scratch']), { fixtures: false, output: path.resolve('scratch') });
  for (const args of [['--output'], ['--output', '--fixtures'], ['--fixtures', '--fixtures'], ['--unknown'], ['--output', 'one', '--output', 'two']]) assert.throws(() => parseNativeBuildOptions(args));
});

test('fixture generation writes a separate package and cannot overwrite ordinary Content', async t => {
  const value = await fixture(t);
  const { output, ...options } = value;
  const normalRoot = path.join(value.root, 'ios/AILibrary/Content');
  const testRoot = path.join(value.root, 'ios/AILibrary/TestContent');
  const normal = await buildNativeContent({ ...options, dependencies: mockDependencies });
  const normalManifest = await readFile(path.join(normalRoot, 'manifest.json'), 'utf8');
  const testPackage = await buildNativeContent({ ...options, dependencies: mockDependencies, fixtures: true });
  assert.equal(normal.articles.length, 3);
  assert.ok(normal.articles.every(article => article.is_test_fixture === undefined));
  assert.equal(testPackage.articles.length, 4);
  assert.equal(testPackage.articles.filter(article => article.is_test_fixture).length, 1);
  assert.equal(testPackage.articles.at(-1).id, NATIVE_READER_FIXTURE.id);
  assert.equal(testPackage.articles.at(-1).source_path, NATIVE_READER_FIXTURE.source_path);
  assert.equal(await readFile(path.join(normalRoot, 'manifest.json'), 'utf8'), normalManifest);
  const testManifest = await readFile(path.join(testRoot, 'manifest.json'), 'utf8');
  await assert.rejects(buildNativeContent({ ...options, fixtures: 'yes', dependencies: mockDependencies }), /boolean/);
  await assert.rejects(buildNativeContent({ ...options, fixtures: true, output: normalRoot, dependencies: mockDependencies }), /Output must be ios\/AILibrary\/TestContent/);
  await assert.rejects(buildNativeContent({ ...options, fixtures: true, output: path.join(normalRoot, 'child'), dependencies: mockDependencies }), /Output must/);
  await assert.rejects(buildNativeContent({ ...options, fixtures: true, output: path.dirname(normalRoot), dependencies: mockDependencies }), /Output must/);
  await assert.rejects(buildNativeContent({ ...options, output: testRoot, dependencies: mockDependencies }), /Output must be ios\/AILibrary\/Content/);
  await assert.rejects(validateOutput(value.root, testRoot), /Output must/);
  assert.equal(await validateOutput(value.root, testRoot, { fixtures: true }), testRoot);
  assert.equal(await readFile(path.join(normalRoot, 'manifest.json'), 'utf8'), normalManifest);
  assert.equal(await readFile(path.join(testRoot, 'manifest.json'), 'utf8'), testManifest);
  const regenerated = await buildNativeContent({ ...options, fixtures: true, dependencies: mockDependencies });
  assert.equal(regenerated.revision, testPackage.revision);
  const testDocument = JSON.parse(await readFile(path.join(testRoot, testPackage.articles.at(-1).document_path)));
  assert.deepEqual(nodes(testDocument).filter(node => node.type === 'link').map(node => node.target), [
    { kind: 'article', article_id: NATIVE_READER_FIXTURE.id, heading_id: 'case-end' },
    { kind: 'article', article_id: NATIVE_READER_FIXTURE.id, heading_id: 'case-end' },
    { kind: 'article', article_id: '01-concepts/one', heading_id: '第一記事' }
  ]);
  const tempPackage = await buildNativeContent({ ...value, fixtures: true, dependencies: mockDependencies });
  assert.equal(tempPackage.articles.length, 4);
  await writeFile(path.join(value.root, NATIVE_READER_FIXTURE.source_path), fixtureSource('[不明](#unknown)'));
  await assert.rejects(buildNativeContent({ ...options, fixtures: true, dependencies: mockDependencies }), /Unknown native article or heading/);
  assert.equal(await readFile(path.join(normalRoot, 'manifest.json'), 'utf8'), normalManifest);
  assert.equal(await readFile(path.join(testRoot, 'manifest.json'), 'utf8'), testManifest);
});

test('the real fixture covers mixed structures, copy boundaries, duplicate headings and all selected heading links', async () => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const selection = JSON.parse(await readFile(path.join(root, 'ios/content-selection.json')));
  const sourcePaths = [...selection.articles, NATIVE_READER_FIXTURE.source_path];
  const articles = await Promise.all(sourcePaths.map(async file => parseArticle(await readFile(path.join(root, file), 'utf8'), file, { fixture: file === NATIVE_READER_FIXTURE.source_path })));
  const selected = new Map(articles.map(article => [article.source_path, article.id]));
  const parsed = articles.map(article => parseNativeArticle(article, { selected }));
  const destinations = new Map(articles.map((article, index) => [article.id, new Set(parsed[index].headings.map(heading => heading.id))]));
  const document = parsed.at(-1).document;
  const all = nodes(document);
  for (const { target } of all.filter(node => node.type === 'link' && node.target.kind === 'article')) {
    assert.ok(destinations.has(target.article_id));
    assert.ok(!target.heading_id || destinations.get(target.article_id).has(target.heading_id), JSON.stringify(target));
  }
  const table = all.find(node => node.type === 'table');
  assert.deepEqual(table.table.alignments, ['left', 'center', 'right']);
  for (const type of ['strong', 'emphasis', 'math', 'link', 'code']) assert.ok(nodes(table).some(node => node.type === type));
  const depth = (blocks, value = 0) => Math.max(value, ...blocks.map(block => block.type === 'list' ? Math.max(value + 1, ...block.items.map(item => depth(item.blocks, value + 1))) : depth(block.blocks || [], value)));
  assert.equal(depth(document.blocks), 3);
  assert.ok(all.some(node => node.type === 'list' && node.ordered && node.start === 8));
  assert.ok(all.some(node => node.type === 'quote' && nodes(node.blocks).some(child => child.type === 'list')));
  assert.ok(all.filter(node => node.type === 'hard_break').length >= 2);
  assert.ok(all.some(node => node.type === 'thematic_break'));
  const duplicates = parsed.at(-1).headings.filter(heading => heading.title === '同じ見出し');
  assert.deepEqual(duplicates.map(heading => heading.id), ['同じ見出し', '同じ見出し-1']);
  const code = all.find(node => node.type === 'code' && node.id && node.text.startsWith('BEGIN-COPY-01\n'));
  assert.ok(code.text.endsWith('END-COPY-01\n'));
  assert.ok(code.text.includes('\n\ttab-indented:'));
  assert.ok(code.text.includes('\n```\n'));
  assert.ok(all.some(node => node.type === 'code' && node.id && node.text === ''));
  const mathOnly = all.filter(node => node.type === 'link' && node.children.length === 1 && node.children[0].type === 'math');
  assert.ok(mathOnly.length >= 2);
  assert.ok(all.some(node => node.type === 'link' && node.children.some(child => child.type === 'text') && node.children.some(child => child.type === 'math')));
  const md = new MarkdownIt({ html: false, linkify: false, typographer: false });
  installMath(md, () => { throw new Error('unused'); });
  const sourceLeaves = values => values.flatMap(token => token.children ? sourceLeaves(token.children) : ['text', 'code_inline', 'math_inline', 'math_block', 'fence', 'code_block'].includes(token.type) ? [token.content] : ['hardbreak', 'softbreak'].includes(token.type) ? ['\n'] : []);
  const nativeLeaves = all.flatMap(node => ['text', 'code'].includes(node.type) ? [node.text] : ['math', 'diagram'].includes(node.type) ? [node.source] : ['soft_break', 'hard_break'].includes(node.type) ? ['\n'] : []);
  assert.deepEqual(nativeLeaves, sourceLeaves(md.parse(articles.at(-1).body, {})));
});

test('fixture source and TestContent symlinks fail without changing existing output', { skip: process.platform === 'win32' ? 'Windows symlinks require extra privileges' : false }, async t => {
  const value = await fixture(t);
  const { output, ...options } = value;
  const destination = path.join(value.root, 'ios/AILibrary/TestContent');
  await mkdir(path.dirname(destination), { recursive: true });
  await symlink(path.join(value.root, 'docs'), destination);
  await assert.rejects(buildNativeContent({ ...options, fixtures: true, dependencies: mockDependencies }), /Symlink/);
  await rm(destination);
  const sourcePath = path.join(value.root, NATIVE_READER_FIXTURE.source_path);
  await rm(sourcePath);
  await symlink(path.join(value.root, paths[0]), sourcePath);
  await mkdir(destination); await writeFile(path.join(destination, 'sentinel'), 'keep');
  await assert.rejects(buildNativeContent({ ...options, fixtures: true, dependencies: mockDependencies }), /Symlink/);
  assert.equal(await readFile(path.join(destination, 'sentinel'), 'utf8'), 'keep');
});

test('block and list item IDs survive unrelated content insertion in the same section', () => {
  const first = '## 安定した章\n\n保持する段落。\n\n- 保持する項目\n- 他の項目\n\n同じ段落。\n\n同じ段落。';
  const parse = body => parseNativeArticle(parseArticle(source('ID', body), paths[0])).document;
  const before = parse(first), after = parse(first.replace('保持する段落。', '先に追加した段落。\n\n保持する段落。'));
  const find = (document, value) => nodes(document).find(node => node.type === 'paragraph' && plain(node.inlines) === value);
  assert.equal(find(before, '保持する段落。').id, find(after, '保持する段落。').id);
  assert.deepEqual(nodes(before).filter(node => node.blocks && !node.type).map(node => node.id), nodes(after).filter(node => node.blocks && !node.type).map(node => node.id));
  const repeated = nodes(before).filter(node => node.type === 'paragraph' && plain(node.inlines) === '同じ段落。');
  assert.notEqual(repeated[0].id, repeated[1].id);
});

test('representative source documents retain legacy heading IDs and all mathematical expressions', async () => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const selection = JSON.parse(await readFile(path.join(root, 'ios/content-selection.json')));
  const types = new Set();
  let inlineMath = 0, blockMath = 0, diagrams = 0;
  for (const file of selection.articles) {
    const article = parseArticle(await readFile(path.join(root, file), 'utf8'), file);
    const value = parseNativeArticle(article, { selected: new Set(selection.articles) });
    const rendered = renderArticle(article, { selected: new Set(selection.articles), diagrams: new Map([...value.requests.values()].filter(request => request.kind === 'diagram').map(request => [sha256(request.source.trim()).slice(0, 24), request.source])), renderMath: () => '<math />' });
    assert.deepEqual(value.headings, rendered.headings);
    assert.equal(value.summary, rendered.summary);
    assert.equal(value.search_text, rendered.search_text);
    const md = new MarkdownIt({ html: false, linkify: false, typographer: false });
    installMath(md, () => { throw new Error('unused renderer'); });
    const sourceTokens = md.parse(article.body, {});
    const leaves = values => values.flatMap(token => token.children ? leaves(token.children) : ['text', 'code_inline', 'math_inline', 'math_block', 'fence', 'code_block'].includes(token.type) ? [token.content] : ['hardbreak', 'softbreak'].includes(token.type) ? ['\n'] : []);
    const nativeLeaves = nodes(value.document).flatMap(node => ['text', 'code'].includes(node.type) ? [node.text] : ['math', 'diagram'].includes(node.type) ? [node.source] : ['soft_break', 'hard_break'].includes(node.type) ? ['\n'] : []);
    assert.deepEqual(nativeLeaves, leaves(sourceTokens), `all source content survives: ${file}`);
    const expectedLinks = sourceTokens.flatMap(token => nodes(token.children || [])).filter(token => token.type === 'link_open').map(token => {
      const href = token.attrGet('href');
      if (href.startsWith('#')) return { kind: 'article', article_id: article.id, ...(href.length > 1 ? { heading_id: decodeURIComponent(href.slice(1)) } : {}) };
      const target = rewriteLink(href, file, new Set(selection.articles));
      return target.article_id ? { kind: 'article', article_id: target.article_id, ...(target.fragment ? { heading_id: target.fragment } : {}) } : { kind: 'external', url: target.href };
    });
    assert.deepEqual(nodes(value.document).filter(node => node.type === 'link').map(node => node.target), expectedLinks, `all typed links survive: ${file}`);
    for (const node of nodes(value.document)) if (node.type) types.add(node.type);
    for (const request of value.requests.values()) {
      if (request.kind === 'diagram') diagrams++;
      else if (request.display) blockMath++;
      else inlineMath++;
      assert.ok(request.source.trim());
    }
    assert.equal(value.document.source_sha256, article.source_sha256);
  }
  for (const type of ['heading', 'paragraph', 'list', 'code', 'table', 'strong', 'link', 'math', 'diagram']) assert.ok(types.has(type), type);
  assert.equal(diagrams, 3);
  assert.ok(inlineMath > 30); assert.ok(blockMath >= 10);
});

test('diagram descriptions follow their source digest and stale or missing descriptions fail before rendering', async t => {
  const value = await fixture(t);
  const parsed = parseNativeArticle(parseArticle(value.files.get(paths[1]), paths[1]));
  const key = [...parsed.requests].find(([, request]) => request.kind === 'diagram')[0];
  value.selection.diagram_descriptions = { [key]: 'AからBへ進む図です。' };
  const manifest = await buildNativeContent({ ...value, dependencies: mockDependencies });
  const document = JSON.parse(await readFile(path.join(value.output, manifest.articles[1].document_path)));
  const diagram = nodes(document).find(node => node.type === 'diagram');
  assert.ok(diagram.accessibility_text.startsWith('AからBへ進む図です。\n図中のラベル: '));
  let invoked = false;
  const dependencies = { renderAssets() { invoked = true; throw new Error('must not render'); } };
  value.selection.diagram_descriptions = { ['f'.repeat(24)]: '古い図の説明。' };
  await assert.rejects(buildNativeContent({ ...value, dependencies }), /Unknown or stale native diagram description/);
  value.selection.diagram_descriptions = {};
  await assert.rejects(buildNativeContent({ ...value, dependencies }), /Missing native diagram description/);
  assert.equal(invoked, false);
});

test('native generator writes only JSON, PNG, notices and hashes every file deterministically', async t => {
  const value = await fixture(t);
  const manifest = await buildNativeContent({ ...value, dependencies: mockDependencies });
  const previous = await readFile(path.join(value.output, 'manifest.json'), 'utf8');
  assert.equal(manifest.revision, (await buildNativeContent({ ...value, dependencies: mockDependencies })).revision);
  assert.equal(await readFile(path.join(value.output, 'manifest.json'), 'utf8'), previous);
  assert.equal(manifest.schema_version, 2);
  assert.equal(manifest.articles.length, 3); assert.equal(manifest.audio.length, 1);
  assert.equal(manifest.audio[0].source_is_current, true);
  assert.equal(manifest.audio[0].sha256, value.episode.audio_sha256);
  assert.equal(manifest.articles[0].audio_id, value.episode.id);
  assert.ok(manifest.files['assets/katex/LICENSE.txt']);
  assert.ok(manifest.files['assets/licenses/NOTICE.txt']);
  for (const [file, hash] of Object.entries(manifest.files)) {
    assert.match(file, /\.(json|png|txt)$/);
    assert.equal(hash, sha256(await readFile(path.join(value.output, file))));
  }
  for (const article of manifest.articles) {
    assert.equal(article.html_path, undefined);
    const document = JSON.parse(await readFile(path.join(value.output, article.document_path)));
    assert.equal(document.article_id, article.id);
    assert.deepEqual(nodes(document).filter(node => node.type === 'heading').map(node => ({ id: node.heading_id, title: plain(node.inlines), level: node.level })), article.headings);
    for (const node of nodes(document)) if (node.asset) {
      assert.ok(manifest.files[node.asset.light]); assert.ok(manifest.files[node.asset.dark]);
      assert.match(node.accessibility_text, /^読み上げ:/);
    }
  }
  const body = JSON.parse(await readFile(path.join(value.output, manifest.articles[0].document_path)));
  assert.deepEqual(nodes(body).find(node => node.type === 'link').target, { kind: 'article', article_id: '01-concepts/two', heading_id: '見出し' });
});

test('unknown inline types, images, HTTP URLs and excessive nesting fail early', () => {
  for (const [body, error] of [
    ['~~取り消し~~', /Unsupported native inline token s_open/],
    ['![画像](https://example.com/image.png)', /Unsupported native inline token image/],
    ['[外部](http://example.com/)', /require HTTPS/],
    ['[外部](https://user:pass@example.com/)', /Credentials/],
    [`${'> '.repeat(34)}深すぎる引用`, /exceeds depth/],
    ['$$\n閉じない数式', /Unclosed display math/]
  ]) assert.throws(() => parseNativeArticle(parseArticle(source('拒否', body), paths[0])), error);
});

test('invalid references and asset output preserve a previous generated package', async t => {
  const value = await fixture(t);
  await mkdir(value.output, { recursive: true });
  const sentinel = path.join(value.output, 'sentinel'); await writeFile(sentinel, 'keep');
  await writeFile(path.join(value.root, paths[0]), source('第一記事', '[不存在](two.md#不明)'));
  await assert.rejects(buildNativeContent({ ...value, dependencies: mockDependencies }), /Unknown native article or heading/);
  assert.equal(await readFile(sentinel, 'utf8'), 'keep');
  await writeFile(path.join(value.root, paths[0]), value.files.get(paths[0]));
  const invalid = mutate => ({ async renderAssets(requests) { const result = await mockDependencies.renderAssets(requests); mutate(result); return result; } });
  await assert.rejects(buildNativeContent({ ...value, dependencies: invalid(result => result.metadata.clear()) }), /Missing native rendered metadata/);
  await assert.rejects(buildNativeContent({ ...value, dependencies: invalid(result => result.metadata.values().next().value.asset.width = 100) }), /dimensions disagree/);
  await assert.rejects(buildNativeContent({ ...value, dependencies: invalid(result => result.files.set('assets/bad.js', Buffer.from('bad'))) }), /Unsafe native output/);
  await assert.rejects(buildNativeContent({ ...value, dependencies: invalid(result => result.metadata.values().next().value.accessibility_text = '') }), /Missing native asset accessibility/);
  assert.equal(await readFile(sentinel, 'utf8'), 'keep');
});

test('too many native files fail before replacing an existing package', async t => {
  const value = await fixture(t);
  await mkdir(value.output, { recursive: true });
  await writeFile(path.join(value.output, 'sentinel'), 'keep');
  const dependencies = { async renderAssets(requests) {
    const rendered = await mockDependencies.renderAssets(requests);
    for (let index = 0; index < 4096; index++) rendered.files.set(`assets/boundary-${index}.txt`, Buffer.alloc(0));
    return rendered;
  } };
  await assert.rejects(buildNativeContent({ ...value, dependencies }), /file count or byte size limit/);
  assert.equal(await readFile(path.join(value.output, 'sentinel'), 'utf8'), 'keep');
});

test('a PNG beyond the consumer byte limit is rejected even when its dimensions match', async t => {
  const value = await fixture(t);
  await mkdir(value.output, { recursive: true });
  await writeFile(path.join(value.output, 'sentinel'), 'keep');
  const dependencies = { async renderAssets(requests) {
    const rendered = await mockDependencies.renderAssets(requests);
    const [file, original] = [...rendered.files].find(([file]) => file.endsWith('.png'));
    const oversized = Buffer.alloc(32 * 1024 * 1024 + 1);
    original.copy(oversized); // Retain the valid 1×1 PNG header and dimensions.
    rendered.files.set(file, oversized);
    return rendered;
  } };
  await assert.rejects(buildNativeContent({ ...value, dependencies }), /Native PNG exceeds 33554432 bytes/);
  assert.equal(await readFile(path.join(value.output, 'sentinel'), 'utf8'), 'keep');
});

test('output restrictions, symlinks and invalid audio metadata remain guarded', async t => {
  const value = await fixture(t);
  await assert.rejects(buildNativeContent({ ...value, output: value.root, dependencies: mockDependencies }), /Output must/);
  const original = await readFile(path.join(value.root, paths[0]), 'utf8');
  if (process.platform !== 'win32') {
    await mkdir(path.dirname(value.output), { recursive: true }); await symlink(path.join(value.root, 'docs'), value.output);
    await assert.rejects(buildNativeContent({ ...value, dependencies: mockDependencies }), /Symlink/);
    assert.equal(await readFile(path.join(value.root, paths[0]), 'utf8'), original);
    await rm(value.output);
  }
  value.episode.audio_url = 'https://example.com/episode.mp3';
  await writeFile(path.join(value.root, 'website/audio/catalog.json'), JSON.stringify({ schema_version: 1, episodes: [value.episode] }));
  await assert.rejects(buildNativeContent({ ...value, dependencies: mockDependencies }), /versioned repository/);
});
