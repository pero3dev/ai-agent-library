import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { buildNativeLearningIndex, NATIVE_LEARNING_PATH } from '../../scripts/lib/ios-learning-content.mjs';
import { parseArticle, sha256 } from '../../scripts/lib/ios-content.mjs';
import { parseMarkdownLinks } from '../../scripts/lib/markdown-links.mjs';

const source = (title, content, tags = '["first-tag", "second-tag"]') => `---\ntitle: "${title}"\ncategory: "overview"\nlevel: "basic"\nstatus: "published"\nlast_updated: "2026-10-25"\ntags: ${tags}\n---\n\n# ${title}\n\n${content}\n`;
const roadmap = (route = '[章](../01-concepts/README.md) を全部 → 前提なら [本文][article] → [前提](#前提) → [例](https://example.com/path?x=1#sample)') => source('学習', `### 読者タイプ別の推奨ルート\n\n| タイプ | 状況 | 推奨ルート |\n| --- | --- | --- |\n${[...'ABCDEFGH'].map(id => `| ${id}: ${id}担当 | 状況${id} | ${route} |`).join('\n')}\n\n[article]: ../01-concepts/one.md#本文\n\n### 前提\n\n前提本文。`);
const readme = (id, links) => `# ${id} — 見出し\n\n章の**説明**です。\n\n\`\`\`markdown\n| [偽物](fake.md) |\n\`\`\`\n\n| ファイル | 内容 |\n| --- | --- |\n${links}\n`;

async function fixture(t) {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'ailibrary-ios-learning-test-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const files = new Map([
    ['docs/00-overview/learning-roadmap.md', roadmap()],
    ['docs/01-concepts/one.md', source('第一記事', '## 本文\n\n定義。')],
    ['docs/01-concepts/two.md', source('第二記事', '## 二番目\n\n定義。')],
    ['docs/00-overview/README.md', readme('00-overview', '| [学習](learning-roadmap.md) | 道順 |')],
    ['docs/01-concepts/README.md', readme('01-concepts', '| [紛らわしい一番目](two.md) | 第二を先に |\n| [第一][first] | 第一 |\n\n[first]: one.md')],
    ['GLOSSARY.md', '# 用語\n\n```markdown\n### 偽用語(Fake)\n\n[偽](docs/01-concepts/missing.md)\n```\n\n## 一覧\n\n### 用語(Term)\n\n定義の**太字**。→ [第一](docs/01-concepts/one.md#本文) / [第二][second]\n\n[second]: docs/01-concepts/two.md\n\n### 用語(Term)\n\n詳細は執筆予定。\n']
  ]);
  const save = async (file, data) => { files.set(file, data); await mkdir(path.dirname(path.join(root, file)), { recursive: true }); await writeFile(path.join(root, file), data); };
  for (const [file, data] of files) await save(file, data);
  const articles = async () => [...files].filter(([file]) => /^docs\/[^/]+\/(?!README)[^/]+\.md$/.test(file)).map(([file, data]) => {
    const article = parseArticle(data, file);
    return { ...article, headings: parseMarkdownLinks(data).headings };
  });
  return { root, files, save, articles, build: async () => buildNativeLearningIndex({ root, articles: await articles() }) };
}

test('learning metadata preserves chapter table destinations, route qualifiers, real glossary anchors and all detail links', async t => {
  const value = await fixture(t);
  const data = await value.build();
  assert.equal(NATIVE_LEARNING_PATH, 'assets/learning/index.json');
  assert.equal(data.schema_version, 1);
  assert.deepEqual(data.chapters.map(chapter => chapter.id), ['00-overview', '01-concepts']);
  assert.equal(data.chapters[1].title, '01-concepts — 見出し');
  assert.equal(data.chapters[1].description, '章の説明です。');
  assert.deepEqual(data.chapters[1].article_ids, ['01-concepts/two', '01-concepts/one']);
  assert.deepEqual(data.article_tags['01-concepts/one'], ['first-tag', 'second-tag']);
  assert.equal(data.routes.map(route => route.id).join(''), 'ABCDEFGH');
  assert.deepEqual(data.routes[0].steps[0].inlines, [{ type: 'link', text: '章', target: { type: 'chapter', chapter_id: '01-concepts' } }, { type: 'text', text: ' を全部' }]);
  assert.equal(data.routes[0].steps[1].inlines[0].text, '前提なら ');
  assert.deepEqual(data.routes[0].steps[1].inlines[1].target, { type: 'article', article_id: '01-concepts/one', heading_id: '本文' });
  assert.deepEqual(data.routes[0].steps[2].inlines[0].target, { type: 'article', article_id: '00-overview/learning-roadmap', heading_id: '前提' });
  assert.deepEqual(data.routes[0].steps[3].inlines[0].target, { type: 'external', url: 'https://example.com/path?x=1#sample' });
  assert.deepEqual(data.glossary.map(term => term.id), ['用語term', '用語term-1']);
  assert.equal(data.glossary[0].name, '用語');
  assert.equal(data.glossary[0].english, 'Term');
  assert.equal(data.glossary[0].summary, '定義の太字。→ 第一 / 第二');
  assert.deepEqual(data.glossary[0].links.map(link => link.target.article_id), ['01-concepts/one', '01-concepts/two']);
  assert.deepEqual(data.glossary[1].links, []);
  assert.equal(data.source_sha256['GLOSSARY.md'], sha256(value.files.get('GLOSSARY.md')));
  assert.deepEqual(Object.keys(data.source_sha256), [...value.files.keys()].sort());
  assert.deepEqual(await value.build(), data, 'Identical source bytes produce identical metadata');
});

test('learning metadata rejects malformed, duplicate, oversized and stale article tags or identities', async t => {
  const value = await fixture(t);
  const file = 'docs/01-concepts/one.md';
  for (const tags of ['["same", "same"]', '["UPPER"]', 'invalid', '["' + 'a'.repeat(129) + '"]', '[' + Array.from({ length: 65 }, (_, index) => `"tag-${index}"`).join(',') + ']']) {
    await value.save(file, source('第一記事', '## 本文\n\n定義。', tags));
    await assert.rejects(value.build(), /learning tags/);
  }
  await value.save(file, source('第一記事', '## 本文\n\n定義。').replace('tags: ["first-tag", "second-tag"]\n', ''));
  await assert.rejects(value.build(), /learning tags/);
  await value.save(file, source('第一記事', '## 本文\n\n定義。'));
  const articles = await value.articles();
  await assert.rejects(buildNativeLearningIndex({ root: value.root, articles: [...articles, articles[0]] }), /duplicate learning article/);
  articles[0].source_sha256 = 'a'.repeat(64);
  await assert.rejects(buildNativeLearningIndex({ root: value.root, articles }), /Stale learning article/);
  await assert.rejects(buildNativeLearningIndex({ root: value.root, articles: (await value.articles()).filter(article => article.id !== '00-overview/learning-roadmap') }), /requires the published learning-roadmap/);
});

test('learning metadata rejects missing or duplicate chapter order and route identities', async t => {
  const value = await fixture(t);
  const file = 'docs/01-concepts/README.md';
  const original = value.files.get(file);
  await value.save(file, original.replace('| [第一][first] | 第一 |', '| `one.md` | 未掲載 |'));
  await assert.rejects(value.build(), /Incomplete learning chapter order/);
  await value.save(file, original.replace('| [第一][first] | 第一 |', '| [第一][first] と [同じ](one.md) | 重複 |'));
  await assert.rejects(value.build(), /Duplicate learning chapter article/);
  await value.save(file, original);
  await value.save('docs/00-overview/learning-roadmap.md', roadmap().replace('| H: H担当', '| G: H担当'));
  await assert.rejects(value.build(), /A through H/);
});

test('learning chapter order excludes verified drafts but does not silently discard missing or unselected published files', async t => {
  const value = await fixture(t);
  const readmePath = 'docs/01-concepts/README.md';
  const original = value.files.get(readmePath);
  await value.save(readmePath, original.replace('| [第一][first] | 第一 |', '| [第一][first] | 第一 |\n| [追加](extra.md) | 追加 |'));
  await assert.rejects(value.build(), /ENOENT/);
  const extraPath = path.join(value.root, 'docs/01-concepts/extra.md');
  await writeFile(extraPath, source('追加', '下書き。').replace('status: "published"', 'status: "draft"'));
  const draftExcluded = await value.build();
  assert.deepEqual(draftExcluded.chapters[1].article_ids, ['01-concepts/two', '01-concepts/one']);
  assert.equal(Object.hasOwn(draftExcluded.source_sha256, 'docs/01-concepts/extra.md'), false);
  await writeFile(extraPath, source('追加', '公開済み。'));
  await assert.rejects(value.build(), /Unknown learning chapter article/);
});

test('learning metadata rejects unsafe, unknown and query-altered internal route or glossary destinations', async t => {
  const value = await fixture(t);
  const file = 'docs/00-overview/learning-roadmap.md';
  for (const target of ['../01-concepts/one.md#missing', '../01-concepts/missing.md', '../01-concepts/one.md?changed=1', 'http://example.com/', 'https://name:password@example.com/', '../../../../escape.md']) {
    await value.save(file, roadmap().replace('https://example.com/path?x=1#sample', target));
    await assert.rejects(value.build(), /learning|Learning|Invalid URL/);
  }
  await value.save(file, roadmap().replace('https://example.com/path?x=1#sample', 'javascript:alert(1)'));
  const inert = await value.build();
  assert.ok(inert.routes[0].steps[3].inlines.every(inline => inline.type === 'text'), 'Markdown rejects the unsafe scheme as a link and retains inert source text');
  await value.save(file, roadmap());
  await value.save('GLOSSARY.md', '# 用語\n\n### 用語\n\n[不正](docs/01-concepts/one.md#missing)\n');
  await assert.rejects(value.build(), /Unknown learning article heading/);
});

test('learning source reads reject symlinks and sources over the byte budget before output generation', async t => {
  const value = await fixture(t);
  const glossary = path.join(value.root, 'GLOSSARY.md');
  const data = await readFile(glossary);
  await writeFile(path.join(value.root, 'glossary-copy.md'), data);
  await rm(glossary);
  await symlink(path.join(value.root, 'glossary-copy.md'), glossary);
  await assert.rejects(value.build(), /Symlink/);
  await rm(glossary);
  await writeFile(glossary, 'x'.repeat(16 * 1024 * 1024 + 1));
  await assert.rejects(value.build(), /oversized learning source/);
});

test('learning metadata bounds the serialized JSON separately from individual source and text limits', async t => {
  const value = await fixture(t);
  const glossary = '# 用語\n\n' + Array.from({ length: 520 }, (_, index) => `### 用語${index}\n\n${'a'.repeat(8150)}\n\n`).join('');
  assert.ok(Buffer.byteLength(glossary) < 16 * 1024 * 1024);
  await value.save('GLOSSARY.md', glossary);
  await assert.rejects(value.build(), /Learning metadata exceeds 4194304 bytes/);
});

test('learning metadata bounds route steps and inlines and glossary detail links for the native consumer', async t => {
  const value = await fixture(t);
  const file = 'docs/00-overview/learning-roadmap.md';
  const link = '[章](../01-concepts/README.md)';
  await value.save(file, roadmap(Array.from({ length: 128 }, () => link).join(' → ')));
  assert.equal((await value.build()).routes[0].steps.length, 128);
  await value.save(file, roadmap(Array.from({ length: 129 }, () => link).join(' → ')));
  await assert.rejects(value.build(), /exceeds 128 steps/);
  const inlines = '前提 ' + Array.from({ length: 32 }, () => link).join(' ');
  await value.save(file, roadmap(inlines));
  assert.equal((await value.build()).routes[0].steps[0].inlines.length, 64);
  await value.save(file, roadmap(inlines + ' 完了'));
  await assert.rejects(value.build(), /exceeds 64 inlines/);
  await value.save(file, roadmap());
  const details = count => '# 用語\n\n### 用語\n\n' + Array.from({ length: count }, () => '[本文](docs/01-concepts/one.md)').join(' / ') + '\n';
  await value.save('GLOSSARY.md', details(256));
  assert.equal((await value.build()).glossary[0].links.length, 256);
  await value.save('GLOSSARY.md', details(257));
  await assert.rejects(value.build(), /exceeds 256 links/);
});
