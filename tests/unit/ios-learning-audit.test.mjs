import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, truncate, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditNativeLearningContent } from '../../ios/tests/learning-content-audit.mjs';

// This fixture is authored by hand, without the learning producer or its parser.
// Rehashing a changed index is deliberate: package integrity alone cannot prove
// its semantic agreement with the independently retained Markdown sources.
const digest = data => createHash('sha256').update(data).digest('hex');
const roadmapPath = 'docs/00-overview/learning-roadmap.md';
const firstID = '01-concepts/one', secondID = '01-concepts/two', roadmapID = '00-overview/learning-roadmap';
const link = (text, target) => ({ type: 'link', text, target });
const text = value => ({ type: 'text', text: value });
const article = (id, heading) => ({ type: 'article', article_id: id, ...(heading ? { heading_id: heading } : {}) });
const step = (...inlines) => ({ inlines });
const heading = (id, title, level) => ({ id, title, level });
const source = (title, tags, body, status = 'published') => `---\ntitle: "${title}"\ncategory: "concepts"\nlevel: "basic"\nstatus: "${status}"\nlast_updated: "2026-10-25"\ntags: ${JSON.stringify(tags)}\n---\n\n# ${title}\n\n${body}\n`;

async function fixture(t) {
  const temporary = await realpath(await mkdtemp(path.join(os.tmpdir(), 'ailibrary-ios-learning-audit-')));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const root = path.join(temporary, 'source'), content = path.join(temporary, 'export', 'Content');
  const external = 'https://github.com/pero3dev/ai-agent-library/blob/0123456789abcdef/examples/README.md';
  const sourceRoutes = [
    '[章][chapter] を上から順に → [第一][first]',
    '[第二](../01-concepts/two.md) を全部',
    `[例](${external})`,
    '[本文](../01-concepts/one.md#本文) → 条件なら本文だけ',
    '[第二](../01-concepts/two.md)',
    '[F前提](#fの前提)',
    '弱い領域を README の順に → 組織定着なら [第一](../01-concepts/one.md) ほか組織層',
    '[H前提](#hの前提) → [重複見出し](../01-concepts/one.md#本文-1)'
  ];
  const files = new Map([
    [roadmapPath, source('学習', ['overview'], `### 読者タイプ別の推奨ルート\n\n| タイプ | 状況 | 推奨ルート |\n| --- | --- | --- |\n${sourceRoutes.map((route, index) => `| ${'ABCDEFGH'[index]}: 担当${index} | 状況${index} | ${route} |`).join('\n')}\n\n[chapter]: ../01-concepts/README.md\n[first]: ../01-concepts/one.md\n\n### Fの前提\n\n前提本文。\n\n### Hの前提\n\n前提本文。`)],
    [`docs/${firstID}.md`, source('第一', ['first-tag', 'shared'], '## 本文\n\n第一の本文。\n\n## 本文\n\n重複見出しの本文。')],
    [`docs/${secondID}.md`, source('第二', ['shared'], '## 二番目\n\n第二の本文。')],
    ['docs/01-concepts/draft.md', source('下書き', [], 'まだ公開しない。', 'draft')],
    ['docs/00-overview/README.md', '# 00-overview — 全体像\n\n章の**説明**です。\n\n| 記事 | 内容 |\n| --- | --- |\n| [学習](learning-roadmap.md) | 道順 |\n'],
    ['docs/01-concepts/README.md', '# 01-concepts — 基礎\n\n第一と`第二`を学びます。\n\n```markdown\n| [偽記事](fake.md) | コード例 |\n```\n\n| 記事 | 内容 |\n| --- | --- |\n| [紛らわしい第一][second] | 第二を先に |\n| [第一](one.md) | 第一 |\n| [下書き](draft.md) | 下書き |\n| `planned.md` | 計画 |\n\n[second]: ./two.md\n'],
    ['GLOSSARY.md', '# 用語集\n\n```markdown\n### 偽用語(Fake)\n\n[偽](docs/01-concepts/missing.md)\n```\n\n## 一覧\n\n### 用語(Term)\n\n定義の**太字**。\n次の行。→ [第一](docs/01-concepts/one.md#本文) / [第二][second]\n\n後段の[関連](docs/01-concepts/one.md#本文-1)。\n\n[second]: docs/01-concepts/two.md\n\n### 用語(Term)\n\n詳細は執筆予定。\n\n## 別一覧\n\n### 別語\n\n`別`の定義。\n']
  ]);
  const put = async (file, data) => { await mkdir(path.dirname(path.join(root, file)), { recursive: true }); await writeFile(path.join(root, file), data); };
  for (const [file, value] of files) await put(file, value);
  const sourcePaths = [roadmapPath, `docs/${firstID}.md`, `docs/${secondID}.md`];
  const headings = [
    [heading('学習', '学習', 1), heading('読者タイプ別の推奨ルート', '読者タイプ別の推奨ルート', 3), heading('fの前提', 'Fの前提', 3), heading('hの前提', 'Hの前提', 3)],
    [heading('第一', '第一', 1), heading('本文', '本文', 2), heading('本文-1', '本文', 2)],
    [heading('第二', '第二', 1), heading('二番目', '二番目', 2)]
  ];
  const index = {
    schema_version: 1,
    source_sha256: Object.fromEntries([...files].filter(([file]) => !file.endsWith('/draft.md')).sort(([a], [b]) => a.localeCompare(b)).map(([file, value]) => [file, digest(value)])),
    article_tags: { [roadmapID]: ['overview'], [firstID]: ['first-tag', 'shared'], [secondID]: ['shared'] },
    chapters: [
      { id: '00-overview', title: '00-overview — 全体像', description: '章の説明です。', article_ids: [roadmapID] },
      { id: '01-concepts', title: '01-concepts — 基礎', description: '第一と第二を学びます。', article_ids: [secondID, firstID] }
    ],
    routes: [
      [step(link('章', { type: 'chapter', chapter_id: '01-concepts' }), text(' を上から順に')), step(link('第一', article(firstID)))],
      [step(link('第二', article(secondID)), text(' を全部'))],
      [step(link('例', { type: 'external', url: external }))],
      [step(link('本文', article(firstID, '本文'))), step(text('条件なら本文だけ'))],
      [step(link('第二', article(secondID)))],
      [step(link('F前提', article(roadmapID, 'fの前提')))],
      [step(text('弱い領域を README の順に')), step(text('組織定着なら '), link('第一', article(firstID)), text(' ほか組織層'))],
      [step(link('H前提', article(roadmapID, 'hの前提'))), step(link('重複見出し', article(firstID, '本文-1')))]
    ].map((steps, position) => ({ id: 'ABCDEFGH'[position], label: `担当${position}`, persona: `状況${position}`, steps })),
    glossary: [
      { id: '用語term', name: '用語', english: 'Term', summary: '定義の太字。\n次の行。→ 第一 / 第二', links: [{ label: '第一', target: article(firstID, '本文') }, { label: '第二', target: article(secondID) }, { label: '関連', target: article(firstID, '本文-1') }] },
      { id: '用語term-1', name: '用語', english: 'Term', summary: '詳細は執筆予定。', links: [] },
      { id: '別語', name: '別語', english: null, summary: '別の定義。', links: [] }
    ]
  };
  const manifest = { schema_version: 2, revision: '', articles: sourcePaths.map((file, position) => ({ id: file.replace(/^docs\//, '').replace(/\.md$/, ''), source_path: file, source_sha256: digest(files.get(file)), headings: headings[position] })), audio: [], files: {} };
  const saveRaw = async (bytes, valueManifest = manifest) => {
    await mkdir(path.join(content, 'assets/learning'), { recursive: true });
    await writeFile(path.join(content, 'assets/learning/index.json'), bytes);
    valueManifest.files['assets/learning/index.json'] = digest(bytes);
    valueManifest.revision = digest(JSON.stringify({ schema_version: 2, articles: valueManifest.articles, audio: valueManifest.audio, files: valueManifest.files }));
    await writeFile(path.join(content, 'manifest.json'), JSON.stringify(valueManifest));
    return valueManifest;
  };
  const save = (value = index, valueManifest = manifest) => saveRaw(JSON.stringify(value, null, 2) + '\n', valueManifest);
  const options = { root, content };
  await save();
  return { temporary, root, content, files, put, index, manifest, save, saveRaw, options, audit: () => auditNativeLearningContent(options) };
}

test('independent learning audit accepts hand-authored sources and preserves canonical text, scope, links and SHA coverage', async t => {
  const value = await fixture(t);
  const result = await value.audit();
  assert.equal(result.result, 'passed');
  assert.equal(result.surface, 'static/learning-source-integrity');
  assert.equal(result.articles, 3); assert.equal(result.chapters, 2); assert.equal(result.routes, 8);
  assert.equal(result.glossary_terms, 3); assert.equal(result.glossary_terms_with_multiple_links, 1);
  assert.equal(result.source_files, 6);
  assert.deepEqual(result.source_sha256, value.index.source_sha256);
  assert.equal(result.native_ui_test, false); assert.equal(result.voiceover_test, false);
  assert.equal(result.index_sha256, value.manifest.files['assets/learning/index.json']);
  assert.equal((await auditNativeLearningContent({ ...value.options, manifest: value.manifest })).result, 'passed');
  await assert.rejects(auditNativeLearningContent({ ...value.options, manifest: { ...value.manifest, revision: 'f'.repeat(64) } }), /actual package/);
  // Token segmentation is not meaning: canonical prose still matches across
  // emphasis boundaries after adjacent text fragments are joined.
  const split = structuredClone(value.index);
  split.routes[6].steps[0].inlines = [text('弱い領域を '), text('README の順に')];
  await value.save(split);
  assert.equal((await value.audit()).result, 'passed');
  // An actual H3 remains an entry inside a quote; fence examples do not. Use
  // source lines for term boundaries instead of scanning only root headings.
  const quoted = value.files.get('GLOSSARY.md').replace('### 用語(Term)', '> ### 用語(Term)');
  await value.put('GLOSSARY.md', quoted);
  split.source_sha256['GLOSSARY.md'] = digest(quoted);
  await value.save(split);
  assert.equal((await value.audit()).glossary_terms, 3);
});

test('rehashing metadata cannot hide tags, README order/title/description, article coverage or route prose changes', async t => {
  const cases = [
    ['tags', data => data.article_tags[firstID] = ['shared'], /canonical article tags/],
    ['tag order', data => data.article_tags[firstID].reverse(), /canonical article tags/],
    ['unknown tags article', data => data.article_tags['01-concepts/unknown'] = [], /tag article coverage/],
    ['missing tags article', data => delete data.article_tags[secondID], /tag article coverage/],
    ['README order', data => data.chapters[1].article_ids.reverse(), /README article order/],
    ['chapter title', data => data.chapters[1].title = '違う題名', /canonical chapter title/],
    ['chapter description', data => data.chapters[1].description = '違う説明', /canonical chapter description/],
    ['chapter order', data => data.chapters.reverse(), /canonical chapter order/],
    ['missing chapter article', data => data.chapters[1].article_ids.pop(), /README article order/],
    ['duplicate chapter article', data => data.chapters[1].article_ids.push(firstID), /Duplicate learning chapter articles/],
    ['wrong own chapter', data => data.chapters[0].article_ids.push(firstID), /README article order/],
    ['route label', data => data.routes[0].label = '変更', /canonical route/],
    ['route persona', data => data.routes[0].persona = '変更', /canonical route/],
    ['route optional wording', data => data.routes[6].steps[1].inlines[0].text = '必ず ', /canonical route/],
    ['route unlinked condition', data => data.routes[3].steps.pop(), /canonical route/],
    ['route all wording', data => data.routes[1].steps[0].inlines.pop(), /canonical route/],
    ['route order', data => data.routes.reverse(), /canonical A–H/],
    ['route link label', data => data.routes[0].steps[1].inlines[0].text = '変更', /canonical route/],
    ['external C example', data => data.routes[2].steps[0].inlines[0].target.url = 'https://example.com/other', /canonical route/],
    ['F anchor', data => data.routes[5].steps[0].inlines[0].target.heading_id = 'hの前提', /canonical route/],
    ['H anchor removed', data => delete data.routes[7].steps[0].inlines[0].target.heading_id, /canonical route/]
  ];
  for (const [name, mutate, error] of cases) await t.test(name, async t => {
    const value = await fixture(t), data = structuredClone(value.index);
    mutate(data); await value.save(data);
    await assert.rejects(value.audit(), error);
  });
});

test('rehashing a glossary cannot hide IDs, names, summaries, later links, duplicates, fence examples or term omissions', async t => {
  const cases = [
    ['ID', data => data.glossary[0].id = 'arbitrary-id'],
    ['name', data => data.glossary[0].name = '変更'],
    ['English', data => data.glossary[0].english = 'Changed'],
    ['summary', data => data.glossary[0].summary = '違う定義。'],
    ['second detail link', data => data.glossary[0].links.splice(1, 1)],
    ['later paragraph link', data => data.glossary[0].links.pop()],
    ['link label', data => data.glossary[0].links[0].label = '変更'],
    ['valid wrong anchor', data => data.glossary[0].links[0].target.heading_id = '本文-1'],
    ['duplicate slug suffix', data => data.glossary[1].id = 'wrong-suffix'],
    ['missing term', data => data.glossary.pop()],
    ['fence example', data => data.glossary.push({ id: '偽用語fake', name: '偽用語', english: 'Fake', summary: '偽。', links: [] })]
  ];
  for (const [name, mutate] of cases) await t.test(name, async t => {
    const value = await fixture(t), data = structuredClone(value.index);
    mutate(data); await value.save(data);
    await assert.rejects(value.audit(), /canonical glossary/);
  });
});

test('learning audit checks the exact canonical source SHA set and its published manifest and heading projection', async t => {
  for (const name of ['stale', 'missing', 'extra', 'unsafe', 'draft']) await t.test(`SHA ${name}`, async t => {
    const value = await fixture(t), data = structuredClone(value.index);
    if (name === 'stale') data.source_sha256['GLOSSARY.md'] = 'f'.repeat(64);
    if (name === 'missing') delete data.source_sha256[roadmapPath];
    if (name === 'extra') data.source_sha256['README.md'] = 'a'.repeat(64);
    if (name === 'unsafe') data.source_sha256['../private.md'] = 'a'.repeat(64);
    if (name === 'draft') data.source_sha256['docs/01-concepts/draft.md'] = digest(value.files.get('docs/01-concepts/draft.md'));
    await value.save(data);
    await assert.rejects(value.audit(), /source SHA/);
  });
  await t.test('forged heading added to manifest and sidecar', async t => {
    const value = await fixture(t), manifest = structuredClone(value.manifest), data = structuredClone(value.index);
    manifest.articles[1].headings.push(heading('invented', '捏造', 2));
    data.routes[3].steps[0].inlines[0].target.heading_id = 'invented';
    await value.save(data, manifest);
    await assert.rejects(value.audit(), /source heading projection/);
  });
  await t.test('source-bound identity and current article hash', async t => {
    const value = await fixture(t);
    for (const mutation of [manifest => manifest.articles[1].source_path = '../private.md', manifest => manifest.articles[1].source_sha256 = 'f'.repeat(64), manifest => manifest.articles.push(manifest.articles[1])]) {
      const manifest = structuredClone(value.manifest); mutation(manifest); await value.save(structuredClone(value.index), manifest);
      await assert.rejects(value.audit(), /source-bound identity|current article source SHA|Duplicate learning manifest article/);
    }
  });
  await t.test('removing a published article from both manifest and all learning projections still fails', async t => {
    const value = await fixture(t), manifest = structuredClone(value.manifest), data = structuredClone(value.index);
    manifest.articles.pop(); delete data.article_tags[secondID]; delete data.source_sha256[`docs/${secondID}.md`];
    data.chapters[1].article_ids = [firstID];
    await value.save(data, manifest);
    await assert.rejects(value.audit(), /covers all published source articles/);
  });
  await t.test('roadmap is mandatory', async t => {
    const value = await fixture(t), manifest = structuredClone(value.manifest);
    manifest.articles.shift(); await value.save(structuredClone(value.index), manifest);
    await assert.rejects(value.audit(), /requires selected learning-roadmap/);
  });
});

test('updating source hashes does not make stale learning metadata agree with changed canonical sources', async t => {
  const changes = [
    ['article tags', `docs/${firstID}.md`, value => value.replace('first-tag', 'changed-tag'), /canonical article tags/],
    ['chapter order', 'docs/01-concepts/README.md', value => value.replace('| [紛らわしい第一][second] | 第二を先に |\n| [第一](one.md) | 第一 |', '| [第一](one.md) | 第一 |\n| [紛らわしい第一][second] | 第二を後に |'), /README article order/],
    ['route prose', roadmapPath, value => value.replace('を上から順に', 'を自由な順に'), /canonical route/],
    ['definition', 'GLOSSARY.md', value => value.replace('定義の**太字**。', '変更した定義。'), /canonical glossary/],
    ['later glossary link', 'GLOSSARY.md', value => value.replace('後段の[関連](docs/01-concepts/one.md#本文-1)。', '後段の説明。'), /canonical glossary/]
  ];
  for (const [name, file, change, error] of changes) await t.test(name, async t => {
    const value = await fixture(t), data = structuredClone(value.index), manifest = structuredClone(value.manifest);
    const changed = change(value.files.get(file)); await value.put(file, changed);
    data.source_sha256[file] = digest(changed);
    const selected = manifest.articles.find(article => article.source_path === file);
    if (selected) selected.source_sha256 = digest(changed);
    await value.save(data, manifest);
    await assert.rejects(value.audit(), error);
  });
});

test('learning schema rejects unsafe references, unknown fields and types, duplicate IDs and bounded data', async t => {
  const cases = [
    ['schema', data => data.schema_version = 2, /schema version/],
    ['unknown top field', data => data.html = '<script>ignored</script>', /index fields/],
    ['unknown inline', data => data.routes[0].steps[0].inlines[0].type = 'html', /fields|inline type/],
    ['unknown target', data => data.routes[0].steps[0].inlines[0].target = { type: 'script', url: 'https://example.com/' }, /target type/],
    ['target article', data => data.routes[0].steps[0].inlines[0].target = article('../private'), /target article/],
    ['target heading', data => data.routes[3].steps[0].inlines[0].target.heading_id = 'missing', /target heading/],
    ['target chapter', data => data.routes[0].steps[0].inlines[0].target.chapter_id = '../private', /target chapter/],
    ['target credentials', data => data.routes[2].steps[0].inlines[0].target.url = 'https://user:secret@example.com/', /HTTPS without credentials/],
    ['target insecure', data => data.routes[2].steps[0].inlines[0].target.url = 'http://example.com/', /HTTPS without credentials/],
    ['target JS', data => data.routes[2].steps[0].inlines[0].target.url = 'javascript:alert(1)', /HTTPS without credentials/],
    ['target extra field', data => data.routes[2].steps[0].inlines[0].target.html = '<script>', /external target fields/],
    ['route count', data => data.routes.pop(), /route count/],
    ['step count', data => data.routes[0].steps = Array(129).fill(step(text('a'))), /route step count/],
    ['inline count', data => data.routes[0].steps[0].inlines = Array(65).fill(text('a')), /route inline count/],
    ['glossary link count', data => data.glossary[0].links = Array(257).fill({ label: 'a', target: article(firstID) }), /glossary link count/],
    ['tag count', data => data.article_tags[firstID] = Array.from({ length: 65 }, (_, index) => 'tag-' + index), /tag count/],
    ['tag pattern', data => data.article_tags[firstID] = ['UPPER'], /Invalid learning tag/],
    ['tag length', data => data.article_tags[firstID] = ['a'.repeat(129)], /Invalid learning tag/],
    ['duplicate tag', data => data.article_tags[firstID] = ['a', 'a'], /Duplicate learning tags/],
    ['duplicate glossary ID', data => data.glossary[1].id = data.glossary[0].id, /Duplicate learning glossary IDs/],
    ['UTF8 string bytes', data => data.routes[0].label = '字'.repeat(5462), /oversized learning route label/],
    ['heading bytes', data => data.routes[3].steps[0].inlines[0].target.heading_id = '字'.repeat(86), /oversized learning target heading/],
    ['NUL text', data => data.routes[6].steps[0].inlines[0].text = 'a\0b', /route inline text/],
    ['wrong tags type', data => data.article_tags[firstID] = null, /tag count/],
    ['wrong glossary type', data => data.glossary = {}, /glossary term count/]
  ];
  for (const [name, mutate, error] of cases) await t.test(name, async t => {
    const value = await fixture(t), data = structuredClone(value.index);
    mutate(data); await value.save(data);
    await assert.rejects(value.audit(), error);
  });
});

test('canonical link safety and source structure are checked even after declaring fresh source hashes', async t => {
  const changes = [
    ['external HTTP', roadmapPath, value => value.replace('https://github.com/pero3dev/ai-agent-library/blob/0123456789abcdef/examples/README.md', 'http://example.com/'), /HTTPS without credentials/],
    ['external credentials', roadmapPath, value => value.replace('https://github.com/pero3dev/ai-agent-library/blob/0123456789abcdef/examples/README.md', 'https://user:secret@example.com/'), /HTTPS without credentials/],
    ['escaping relative destination', roadmapPath, value => value.replace('../01-concepts/one.md#本文', '../../../private.md'), /escapes repository/],
    ['encoded escape', roadmapPath, value => value.replace('../01-concepts/one.md#本文', '..%2F..%2F..%2Fprivate.md'), /escapes repository/],
    ['encoded backslash', roadmapPath, value => value.replace('../01-concepts/one.md#本文', '..%5Cprivate.md'), /Unsafe learning source destination/],
    ['internal query', roadmapPath, value => value.replace('../01-concepts/one.md#本文', '../01-concepts/one.md?changed=1#本文'), /cannot contain a query/],
    ['unknown source article', roadmapPath, value => value.replace('../01-concepts/one.md#本文', '../01-concepts/missing.md'), /Unknown learning source article/],
    ['unknown glossary heading', 'GLOSSARY.md', value => value.replace('one.md#本文)', 'one.md#missing)'), /Unknown learning target heading/],
    ['missing README destination', 'docs/01-concepts/README.md', value => value.replace('[第一](one.md)', '[第一](missing.md)'), /ENOENT/],
    ['duplicate README destination', 'docs/01-concepts/README.md', value => value.replace('| [第一](one.md) | 第一 |', '| [第一](one.md) と [再掲](one.md) | 第一 |'), /Duplicate learning chapter source destinations/],
    ['duplicate source tag', `docs/${firstID}.md`, value => value.replace('["first-tag","shared"]', '["shared","shared"]'), /Duplicate learning source tags/]
  ];
  for (const [name, file, change, error] of changes) await t.test(name, async t => {
    const value = await fixture(t), data = structuredClone(value.index), manifest = structuredClone(value.manifest);
    const changed = change(value.files.get(file)); await value.put(file, changed);
    data.source_sha256[file] = digest(changed);
    const selected = manifest.articles.find(article => article.source_path === file);
    if (selected) selected.source_sha256 = digest(changed);
    await value.save(data, manifest);
    await assert.rejects(value.audit(), error);
  });
});

test('learning audit never follows package or source symlinks or accepts unsafe paths, missing sidecars or oversized bytes', async t => {
  for (const name of ['index', 'manifest', 'index directory', 'source', 'source directory', 'content']) await t.test(`symlink ${name}`, async t => {
    const value = await fixture(t);
    const target = name === 'index' ? path.join(value.content, 'assets/learning/index.json') : name === 'manifest' ? path.join(value.content, 'manifest.json') :
      name === 'index directory' ? path.join(value.content, 'assets/learning') : name === 'source' ? path.join(value.root, `docs/${firstID}.md`) :
        name === 'source directory' ? path.join(value.root, 'docs/01-concepts') : value.content;
    const isDirectory = ['index directory', 'source directory', 'content'].includes(name);
    const elsewhere = path.join(value.temporary, isDirectory ? 'real-directory' : 'real-file');
    if (isDirectory) await mkdir(elsewhere); else await writeFile(elsewhere, await readFile(target));
    await rm(target, { recursive: true }); await symlink(elsewhere, target, isDirectory ? 'dir' : 'file');
    await assert.rejects(value.audit(), /Symlink|regular/);
  });
  await t.test('manifest must enumerate fixed path', async t => {
    const value = await fixture(t), manifest = structuredClone(value.manifest);
    delete manifest.files['assets/learning/index.json']; await value.save(value.index, manifest);
    // save intentionally adds the fixed path; remove it afterwards and rehash.
    delete manifest.files['assets/learning/index.json'];
    manifest.revision = digest(JSON.stringify({ schema_version: 2, articles: manifest.articles, audio: manifest.audio, files: manifest.files }));
    await writeFile(path.join(value.content, 'manifest.json'), JSON.stringify(manifest));
    await assert.rejects(value.audit(), /required in manifest.files/);
  });
  await t.test('missing index', async t => {
    const value = await fixture(t); await rm(path.join(value.content, 'assets/learning/index.json'));
    await assert.rejects(value.audit(), /ENOENT/);
  });
  await t.test('unsafe manifest file path', async t => {
    const value = await fixture(t), manifest = structuredClone(value.manifest);
    manifest.files['assets/learning/../../private.json'] = 'a'.repeat(64); await value.save(value.index, manifest);
    await assert.rejects(value.audit(), /Unsafe learning manifest file path/);
  });
  await t.test('index SHA mismatch', async t => {
    const value = await fixture(t); await writeFile(path.join(value.content, 'assets/learning/index.json'), '{}');
    await assert.rejects(value.audit(), /index package SHA/);
  });
  await t.test('index byte bound before parsing', async t => {
    const value = await fixture(t); await truncate(path.join(value.content, 'assets/learning/index.json'), 4 * 1024 * 1024 + 1);
    await assert.rejects(value.audit(), /index byte limit/);
  });
  await t.test('manifest byte bound before parsing', async t => {
    const value = await fixture(t); await truncate(path.join(value.content, 'manifest.json'), 8 * 1024 * 1024 + 1);
    await assert.rejects(value.audit(), /manifest byte limit/);
  });
  await t.test('source byte bound before parsing', async t => {
    const value = await fixture(t); await truncate(path.join(value.root, `docs/${firstID}.md`), 16 * 1024 * 1024 + 1);
    await assert.rejects(value.audit(), /source byte limit/);
  });
  await t.test('arbitrary content authority', async t => {
    const value = await fixture(t);
    for (const content of ['/etc/Content', path.join(value.temporary, 'Other'), path.join(value.root, 'ios/AILibrary/TestContent'), path.join(value.root, 'ios/AILibrary/Content/Content')]) await assert.rejects(auditNativeLearningContent({ root: value.root, content }), /canonical Content|separate from canonical/);
  });
  await t.test('source missing or changed status', async t => {
    const value = await fixture(t), manifest = structuredClone(value.manifest), data = structuredClone(value.index);
    const file = `docs/${firstID}.md`, changed = value.files.get(file).replace('status: "published"', 'status: "draft"');
    await value.put(file, changed); data.source_sha256[file] = digest(changed); manifest.articles[1].source_sha256 = digest(changed);
    await value.save(data, manifest); await assert.rejects(value.audit(), /selected source is published/);
    await rm(path.join(value.root, file)); await assert.rejects(value.audit(), /ENOENT/);
  });
});

test('learning audit module import has no package read, write, generation or CLI side effects', () => {
  const moduleURL = new URL('../../ios/tests/learning-content-audit.mjs', import.meta.url).href;
  const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
  const result = execFileSync(process.execPath, ['--input-type=module', '-e', `const module = await import(${JSON.stringify(moduleURL)}); console.log(typeof module.auditNativeLearningContent);`], { cwd: repositoryRoot, encoding: 'utf8' });
  assert.equal(result, 'function\n');
});

test('raw learning JSON rejects duplicate decoded keys and depth beyond the native consumer limit before JSON.parse erases evidence', async t => {
  const cases = [
    ['schema 2 followed by 1', raw => '{"schema_version":2,' + raw.slice(1), /duplicate.*decoded key/],
    ['same schema repeated', raw => '{"schema_version":1,' + raw.slice(1), /duplicate.*decoded key/],
    ['escaped schema alias first', raw => '{"schema_\\u0076ersion":2,' + raw.slice(1), /duplicate.*decoded key/],
    ['escaped schema alias last', raw => raw.replace('"schema_version": 1', '"schema_version": 2, "\\u0073chema_version": 1'), /duplicate.*decoded key/],
    ['nested SHA key alias', raw => raw.replace('"source_sha256": {', '"source_sha256": {"GLOSSARY\\u002emd":"' + 'f'.repeat(64) + '",'), /duplicate.*decoded key/],
    ['nested article key alias', raw => raw.replace('"article_tags": {', '"article_tags": {"01-concepts\\u002fone": [],'), /duplicate.*decoded key/],
    ['nested route label', raw => raw.replace('"label": "担当0"', '"label":"変更", "label":"担当0"'), /duplicate.*decoded key/],
    ['nested target type', raw => raw.replace('"type": "chapter"', '"type":"article", "type":"chapter"'), /duplicate.*decoded key/],
    ['13 nested containers', raw => '{"probe":' + '['.repeat(12) + 'null' + ']'.repeat(12) + ',' + raw.slice(1), /JSON depth exceeds 12/],
    ['13 mixed containers', raw => '{"probe":' + '{"x":['.repeat(6) + 'null' + ']}'.repeat(6) + ',' + raw.slice(1), /JSON depth exceeds 12/],
    ['12 containers reach schema check', raw => '{"probe":' + '['.repeat(11) + 'null' + ']'.repeat(11) + ',' + raw.slice(1), /Learning index fields/],
    ['quoted delimiters are not depth', raw => '{"probe":' + JSON.stringify('"escaped\\quote"' + '[{'.repeat(20) + '}]'.repeat(20)) + ',' + raw.slice(1), /Learning index fields/],
    ['oversized decoded key', raw => '{' + JSON.stringify('x'.repeat(16385)) + ':null,' + raw.slice(1), /oversized decoded key/],
    ['invalid UTF8 despite fresh SHA', raw => Buffer.concat([Buffer.from(raw), Buffer.from([255])]), /encoded data|UTF-8/i]
  ];
  for (const [name, mutate, error] of cases) await t.test(name, async t => {
    const value = await fixture(t);
    const raw = mutate(JSON.stringify(value.index, null, 2) + '\n');
    await value.saveRaw(raw, structuredClone(value.manifest));
    // saveRaw hashes the raw bytes directly. Do not parse and reserialize here:
    // that would erase exactly the duplicate-key evidence under review.
    const currentManifest = JSON.parse(await readFile(path.join(value.content, 'manifest.json'), 'utf8'));
    assert.equal(currentManifest.files['assets/learning/index.json'], digest(raw));
    assert.equal(currentManifest.revision, digest(JSON.stringify({ schema_version: 2, articles: currentManifest.articles, audio: currentManifest.audio, files: currentManifest.files })));
    await assert.rejects(value.audit(), error);
  });
  await t.test('a unique escaped key preserves its canonical identity', async t => {
    const value = await fixture(t);
    await value.saveRaw(JSON.stringify(value.index).replace('"schema_version"', '"schema_\\u0076ersion"'));
    assert.equal((await value.audit()).result, 'passed');
  });
});
