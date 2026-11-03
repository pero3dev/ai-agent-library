// Read-only, source-based audit of the optional learning index. This module does
// not import the learning producer, render HTML, or exercise a native reader.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import MarkdownIt from 'markdown-it';
import GithubSlugger from 'github-slugger';
import { installMath, rejectSymlinks } from '../../scripts/lib/ios-content.mjs';
import { parseFrontMatter, parseScalar, parseTagsArray, splitLocalDestination, toLines } from '../../scripts/lib/md-utils.mjs';
import { parseMarkdownLinks } from '../../scripts/lib/markdown-links.mjs';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const indexPath = 'assets/learning/index.json';
const roadmapPath = 'docs/00-overview/learning-roadmap.md';
const articleID = /^\d{2}-[a-z0-9-]+\/[a-z0-9-]+$/;
const chapterID = /^\d{2}-[a-z0-9-]+$/;
const hashPattern = /^[a-f0-9]{64}$/;
const limits = { index: 4 * 1024 * 1024, source: 16 * 1024 * 1024, manifest: 8 * 1024 * 1024, string: 16384 };
/** @typedef {import('../../scripts/lib/ios-types.d.mts').MarkdownToken} Token */
/** @typedef {{ type: string, tag: string, map: [number, number] | null, inlines: Token[] | null, nodes: BlockNode[] }} BlockNode */
/** @typedef {import('../../scripts/lib/ios-types.d.mts').LearningTarget} LearningTarget */
/** @typedef {import('../../scripts/lib/ios-types.d.mts').LearningInline} LearningInline */
/** @typedef {{type: 'text', text: string} | {type: 'link', text: string, href: string}} SourceRun */
/** @param {import('node:crypto').BinaryLike} bytes */
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
/** @param {unknown} actual @param {unknown} expected @param {string} label */
const same = (actual, expected, label) => assert.ok(isDeepStrictEqual(actual, expected), label);
/** @template T @param {Iterable<T>} values */
const sorted = values => [...values].sort();
/** @param {unknown} value @param {string} label @returns {asserts value is Record<string, unknown>} */
function object(value, label) { assert.ok(value && typeof value === 'object' && !Array.isArray(value), `Learning ${label} must be an object`); }
/** @param {unknown} value @param {string[]} expected @param {string} label @returns {asserts value is Record<string, unknown>} */
function keys(value, expected, label) { object(value, label); same(sorted(Object.keys(value)), sorted(expected), `Learning ${label} fields`); }
/** @param {unknown} value @param {number} minimum @param {number} maximum @param {string} label @returns {asserts value is unknown[]} */
function list(value, minimum, maximum, label) { assert.ok(Array.isArray(value) && value.length >= minimum && value.length <= maximum, `Learning ${label} count must be ${minimum}–${maximum}`); }
/** @param {unknown} value @param {string} label @param {{blank?: boolean, bytes?: number}} [options] @returns {asserts value is string} */
function string(value, label, { blank = false, bytes = limits.string } = {}) { assert.ok(typeof value === 'string' && (blank || value.trim()) && !value.includes('\0') && Buffer.byteLength(value) <= bytes, `Invalid or oversized learning ${label}`); }
/** @param {unknown[]} values @param {string} label */
const unique = (values, label) => assert.equal(new Set(values).size, values.length, `Duplicate learning ${label}`);

// Keep the same input authority as the package audit, without importing that
// entrypoint (which will call this module). No arbitrary content directory is read.
/** @param {string} root @param {string} [requested] */
async function resolveContent(root, requested) {
  const canonical = path.join(root, 'ios/AILibrary/Content');
  let content = requested === undefined ? canonical : path.resolve(requested);
  const temporary = await realpath(os.tmpdir()), alias = path.resolve(os.tmpdir());
  if (content.startsWith(alias + path.sep)) content = path.join(temporary, path.relative(alias, content));
  /** @param {string} value */
  const comparable = value => ['darwin', 'win32'].includes(process.platform) ? value.toLowerCase() : value;
  if (comparable(content) !== comparable(canonical)) {
    const relative = path.relative(temporary, content);
    assert.ok(!relative.startsWith('..') && !path.isAbsolute(relative) && /^ailibrary-ios-[^/\\]+[/\\].+/.test(relative) && path.basename(content) === 'Content', 'Learning audit requires canonical Content or temporary ailibrary-ios-*/Content');
    for (const name of ['Content', 'TestContent']) {
      const fixed = comparable(path.join(root, 'ios/AILibrary', name)), candidate = comparable(content);
      assert.ok(candidate !== fixed && !candidate.startsWith(fixed + path.sep) && !fixed.startsWith(candidate + path.sep), 'Temporary learning audit must be separate from canonical packages');
    }
  }
  await rejectSymlinks(content);
  assert.ok((await lstat(content)).isDirectory(), 'Learning content must be a directory');
  return content;
}

/** @param {string} base @param {string} relative @param {number} maximum @param {string} label */
async function boundedRead(base, relative, maximum, label) {
  assert.ok(typeof relative === 'string' && relative && !relative.includes('\\') && !relative.includes('\0') && !path.posix.isAbsolute(relative) && relative.split('/').every(part => part && part !== '.' && part !== '..'), `Unsafe learning ${label} path`);
  const file = path.resolve(base, relative);
  assert.ok(file.startsWith(path.resolve(base) + path.sep), `Learning ${label} escapes its root`);
  await rejectSymlinks(file);
  const stat = await lstat(file);
  assert.ok(stat.isFile() && !stat.isSymbolicLink(), `Learning ${label} must be a regular file`);
  assert.ok(stat.size > 0 && stat.size <= maximum, `Learning ${label} byte limit`);
  const bytes = await readFile(file);
  assert.ok(bytes.length > 0 && bytes.length <= maximum, `Learning ${label} byte limit`);
  // Refuse invalid UTF-8 instead of silently replacing it in a source projection.
  new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  return bytes;
}

// JSON.parse keeps only the last occurrence of an object key. Check the raw
// bounded index first so it cannot erase a duplicate that the native consumer
// rejects. Decode each key string once, including Unicode escape aliases. The
// full JSON parser still validates JSON grammar after this structural preflight.
/** @param {string} source */
function preflightIndexJSON(source) {
  /** @type {{opening: string, expectingKey: boolean, keys: Set<string>}[]} */
  const containers = [];
  let quoted = false, escaped = false, keyStart;
  for (let offset = 0; offset < source.length; offset++) {
    const character = source[offset];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') {
        quoted = false;
        if (keyStart !== undefined) {
          const key = JSON.parse(source.slice(keyStart, offset + 1));
          const container = containers.at(-1);
          assert.ok(container, 'JSON object key requires a container');
          assert.ok(Buffer.byteLength(key) <= limits.string && !container.keys.has(key), 'Learning index JSON has a duplicate or oversized decoded key');
          container.keys.add(key);
        }
        keyStart = undefined;
      }
    } else if (character === '"') {
      quoted = true;
      keyStart = containers.at(-1)?.expectingKey ? offset : undefined;
    } else if (character === '{' || character === '[') {
      containers.push({ opening: character, expectingKey: character === '{', keys: new Set() });
      // Match NativeLearningIndex.preflight; schema 1 currently needs at most
      // eight containers, including route link targets.
      assert.ok(containers.length <= 12, 'Learning index JSON depth exceeds 12');
    } else if (character === '}' || character === ']') {
      const container = containers.pop();
      assert.ok(container && (container.opening === '{' && character === '}' || container.opening === '[' && character === ']'), 'Invalid learning index JSON structure');
    } else if (character === ':' && containers.at(-1)?.opening === '{') { const last = containers.at(-1); if (last) last.expectingKey = false; }
    else if (character === ',' && containers.at(-1)?.opening === '{') { const last = containers.at(-1); if (last) last.expectingKey = true; }
  }
  assert.ok(!quoted && !containers.length, 'Invalid learning index JSON structure');
}

/** @param {string} source @param {string} label */
function frontMatter(source, label) {
  const lines = toLines(source), parsed = parseFrontMatter(lines);
  assert.ok(parsed && !parsed.unclosed && !parsed.errors.length, `Invalid learning source front matter: ${label}`);
  /** @param {string} name */
  const field = name => {
    const values = parsed.fields.filter(value => value.key === name);
    assert.equal(values.length, 1, `Learning source requires exactly one ${name}: ${label}`);
    return values[0].value;
  };
  return { field, body: lines.slice(parsed.endLine).join('\n') };
}

// A small block tree makes scope explicit: a code fence is a leaf, table cells
// belong to tbody rows, and an H3 definition ends at the next H1/H2/H3.
/** @param {string} source @param {MarkdownIt} [parser] */
function blockTree(source, parser = new MarkdownIt({ html: false, linkify: false, typographer: false })) {
  /** @type {BlockNode} */
  const root = { type: 'root', tag: '', map: null, inlines: null, nodes: [] }, stack = [root];
  for (const token of parser.parse(source, {})) {
    if (token.nesting === -1) { assert.ok(stack.length > 1, 'Balanced learning Markdown blocks'); stack.pop(); continue; }
    const node = { type: token.type.replace(/_open$/, ''), tag: token.tag, map: token.map, inlines: token.children, nodes: [] };
    const parent = stack.at(-1); assert.ok(parent, 'Learning tree parent'); parent.nodes.push(node);
    if (token.nesting === 1) stack.push(node);
  }
  assert.equal(stack.length, 1, 'Balanced learning Markdown blocks');
  return root.nodes;
}

/** @param {BlockNode[]} nodes @param {string} type @returns {BlockNode[]} */
function descendants(nodes, type) {
  return nodes.flatMap(node => [...(node.type === type ? [node] : []), ...descendants(node.nodes, type)]);
}

/** @param {Token[] | null} [inlines] */
function plain(inlines = []) {
  return (inlines ?? []).map(token => {
    if (['text', 'code_inline'].includes(token.type)) return token.content;
    if (['softbreak', 'hardbreak'].includes(token.type)) return '\n';
    assert.ok(token.nesting && /^(?:link|em|strong|s)_(?:open|close)$/.test(token.type), `Unsupported learning source inline: ${token.type}`);
    return '';
  }).join('');
}

/** @param {Token[] | null} [inlines] @returns {SourceRun[]} */
function sourceRuns(inlines = []) {
  inlines ??= [];
  /** @type {SourceRun[]} */
  const runs = [];
  for (let index = 0; index < inlines.length; index++) {
    const token = inlines[index];
    if (token.type !== 'link_open') {
      const text = plain([token]);
      if (text) runs.push({ type: 'text', text });
      continue;
    }
    const start = index;
    while (++index < inlines.length && inlines[index].type !== 'link_close') { /* Find the parser-resolved link label. */ }
    assert.ok(index < inlines.length, 'Balanced learning source links');
    const href = token.attrGet('href'); assert.ok(href !== null, 'Learning source link requires destination');
    runs.push({ type: 'link', text: plain(inlines.slice(start + 1, index)), href });
  }
  return runs;
}

/** @param {BlockNode[]} nodes */
function tableRows(nodes) {
  return descendants(nodes, 'tbody').flatMap(body => body.nodes.filter(node => node.type === 'tr').map(row => row.nodes.filter(node => node.type === 'td').map(cell => descendants(cell.nodes, 'inline').flatMap(node => node.inlines || []))));
}

/** @param {LearningInline[]} inlines */
function mergeText(inlines) {
  /** @type {LearningInline[]} */
  const result = [];
  for (const inline of inlines) {
    const previous = result.at(-1);
    if (inline.type === 'text' && previous?.type === 'text') previous.text += inline.text;
    else result.push({ ...inline });
  }
  return result;
}

/** @param {SourceRun[]} runs @param {(href: string, sourcePath: string) => LearningTarget} destination */
function sourceSteps(runs, destination) {
  /** @type {LearningInline[][]} */
  const steps = [[]];
  for (const run of runs) {
    if (run.type === 'link') steps[steps.length - 1].push({ type: 'link', text: run.text, target: destination(run.href, roadmapPath) });
    else for (const [index, part] of run.text.split('→').entries()) {
      if (index) steps.push([]);
      if (part) steps[steps.length - 1].push({ type: 'text', text: part });
    }
  }
  return steps.map(inlines => {
    const merged = mergeText(inlines);
    if (merged[0]?.type === 'text') merged[0].text = merged[0].text.trimStart();
    const last = merged.at(-1); if (last?.type === 'text') last.text = last.text.trimEnd();
    return { inlines: merged.filter(inline => inline.type !== 'text' || inline.text) };
  });
}

/** Throws on invalid/missing metadata; callers decide when this optional audit applies.
 * @param {{root?: string, content?: string, manifest?: unknown}} [options]
 */
export async function auditNativeLearningContent({ root = repositoryRoot, content: requestedContent, manifest: suppliedManifest } = {}) {
  root = await realpath(root);
  const content = await resolveContent(root, requestedContent);
  const manifestBytes = await boundedRead(content, 'manifest.json', limits.manifest, 'manifest');
  /** @type {unknown} */
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  if (suppliedManifest !== undefined) same(suppliedManifest, manifest, 'Supplied learning manifest matches the actual package');
  object(manifest, 'manifest');
  assert.equal(manifest.schema_version, 2, 'Learning audit requires manifest schema 2');
  list(manifest.articles, 1, 2000, 'manifest article');
  object(manifest.files, 'manifest files');
  assert.ok(Object.keys(manifest.files).length <= 4095, 'Learning manifest file count limit');
  for (const [file, hash] of Object.entries(manifest.files)) {
    assert.ok(/^(?:assets|articles)\/[a-zA-Z0-9/_.-]+\.(?:json|png|txt)$/.test(file) && file.split('/').every(part => part && part !== '.' && part !== '..'), 'Unsafe learning manifest file path');
    assert.ok(typeof hash === 'string' && hashPattern.test(hash), 'Learning manifest file SHA format');
  }
  assert.equal(manifest.revision, sha256(JSON.stringify({ schema_version: 2, articles: manifest.articles, audio: manifest.audio, files: manifest.files })), 'Learning manifest revision');
  assert.ok(Object.hasOwn(manifest.files, indexPath), 'Learning index is required in manifest.files');
  const bytes = await boundedRead(content, indexPath, limits.index, 'index');
  assert.equal(sha256(bytes), manifest.files[indexPath], 'Learning index package SHA');
  const rawIndex = bytes.toString('utf8');
  preflightIndexJSON(rawIndex);
  /** @type {unknown} */
  const index = JSON.parse(rawIndex);
  keys(index, ['schema_version', 'source_sha256', 'article_tags', 'chapters', 'routes', 'glossary'], 'index');
  assert.equal(index.schema_version, 1, 'Learning index schema version');

  /** @type {Map<string, Buffer>} */
  const sourceCache = new Map();
  /** @param {string} file @returns {Promise<Buffer>} */
  const read = async file => {
    if (!sourceCache.has(file)) sourceCache.set(file, await boundedRead(root, file, limits.source, 'source'));
    const bytes = sourceCache.get(file); assert.ok(bytes); return bytes;
  };
  /** @type {Map<string, {source_path: string, headings: Set<string>}>} */
  const articles = new Map();
  /** @type {Map<string, string>} */
  const bySource = new Map();
  /** @type {Record<string, string[]>} */
  const expectedTags = {};
  for (const article of manifest.articles) {
    object(article, 'manifest article');
    assert.ok(typeof article.id === 'string' && articleID.test(article.id) && article.source_path === `docs/${article.id}.md`, 'Learning article source-bound identity');
    assert.ok(!articles.has(article.id) && !bySource.has(article.source_path), 'Duplicate learning manifest article');
    const source = await read(article.source_path), fm = frontMatter(source.toString('utf8'), article.id);
    assert.equal(parseScalar(fm.field('status')), 'published', 'Learning selected source is published');
    assert.equal(article.source_sha256, sha256(source), `Learning current article source SHA: ${article.id}`);
    const tags = parseTagsArray(fm.field('tags'));
    list(tags, 0, 64, 'source tag');
    unique(tags, 'source tags');
    for (const tag of tags) assert.ok(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag) && tag.length <= 128, 'Invalid learning source tag');
    expectedTags[article.id] = tags;
    // Check the manifest's heading projection against source before accepting a
    // target. A forged manifest heading must not make a nonexistent anchor valid.
    const parser = new MarkdownIt({ html: false, linkify: false, typographer: false });
    installMath(parser, () => assert.fail('Learning audit must never render HTML'));
    const slugger = new GithubSlugger();
    const headings = descendants(blockTree(fm.body, parser), 'heading').map(node => {
      const tokens = descendants(node.nodes, 'inline').flatMap(value => value.inlines || []);
      const title = tokens.filter(token => ['text', 'code_inline', 'math_inline'].includes(token.type)).map(token => token.content).join(' ').trim().replace(/\s+/g, ' ');
      return { id: slugger.slug(title), title, level: Number(node.tag.slice(1)) };
    });
    same(article.headings, headings, `Learning source heading projection: ${article.id}`);
    const entry = { source_path: article.source_path, headings: new Set(headings.map(heading => heading.id)) };
    articles.set(article.id, entry);
    bySource.set(article.source_path, article.id);
  }
  assert.ok(bySource.has(roadmapPath), 'Learning index requires selected learning-roadmap source');

  // A learning index is the published-library projection. Removing an article
  // from both manifest and sidecar must not hide a published canonical source.
  const published = [];
  await rejectSymlinks(path.join(root, 'docs'));
  for (const section of await readdir(path.join(root, 'docs'), { withFileTypes: true })) {
    if (!chapterID.test(section.name)) continue;
    assert.ok(!section.isSymbolicLink() && section.isDirectory(), 'Learning source chapter must be a regular directory');
    for (const file of await readdir(path.join(root, 'docs', section.name), { withFileTypes: true })) {
      if (file.name.toLowerCase() === 'readme.md' || !/^[a-z0-9-]+\.md$/.test(file.name)) continue;
      assert.ok(!file.isSymbolicLink() && file.isFile(), 'Learning article source must be a regular file');
      const sourcePath = `docs/${section.name}/${file.name}`;
      const status = parseScalar(frontMatter((await read(sourcePath)).toString('utf8'), sourcePath).field('status'));
      assert.ok(status === 'published' || status === 'draft', 'Learning source status must be published or draft');
      if (status === 'published') published.push(sourcePath);
    }
  }
  same(sorted(bySource.keys()), sorted(published), 'Learning manifest covers all published source articles');

  object(index.article_tags, 'article tags');
  same(sorted(Object.keys(index.article_tags)), sorted(articles.keys()), 'Learning tag article coverage');
  for (const [id, tags] of Object.entries(index.article_tags)) {
    list(tags, 0, 64, 'tag'); unique(tags, 'tags');
    for (const tag of tags) assert.ok(typeof tag === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag) && tag.length <= 128, 'Invalid learning tag');
    same(tags, expectedTags[id], `Learning canonical article tags: ${id}`);
  }

  list(index.chapters, 1, 100, 'chapter');
  const chapterIDs = sorted(new Set([...articles.keys()].map(id => id.split('/')[0])));
  same(index.chapters.map(chapter => { object(chapter, 'chapter'); return chapter.id; }), chapterIDs, 'Learning canonical chapter order and coverage');
  const covered = [];
  for (const chapter of index.chapters) {
    keys(chapter, ['id', 'title', 'description', 'article_ids'], 'chapter');
    string(chapter.id, 'chapter id'); string(chapter.title, 'chapter title'); string(chapter.description, 'chapter description');
    list(chapter.article_ids, 1, 2000, 'chapter article'); unique(chapter.article_ids, 'chapter articles');
    const nodes = blockTree((await read(`docs/${chapter.id}/README.md`)).toString('utf8'));
    const firstH1 = nodes.findIndex(node => node.type === 'heading' && node.tag === 'h1');
    assert.ok(firstH1 >= 0, 'Learning chapter source requires H1');
    const title = plain(descendants(nodes[firstH1].nodes, 'inline')[0]?.inlines);
    const paragraph = nodes.slice(firstH1 + 1).find(node => node.type === 'paragraph');
    assert.ok(paragraph, 'Learning chapter source requires description paragraph');
    const description = plain(descendants(paragraph.nodes, 'inline')[0]?.inlines);
    same(chapter.title, title, `Learning canonical chapter title: ${chapter.id}`);
    same(chapter.description, description, `Learning canonical chapter description: ${chapter.id}`);
    const order = [];
    for (const row of tableRows(nodes)) for (const cell of row) for (const link of sourceRuns(cell).filter(run => run.type === 'link')) {
      const target = splitLocalDestination(link.href);
      assert.ok(!target.error, 'Invalid learning chapter source destination');
      if (target.external) continue;
      assert.ok(typeof target.pathname === 'string', 'Learning local destination pathname');
      if (!/^(?:\.\/)?[a-z0-9-]+\.md$/.test(target.pathname)) continue;
      /** @type {string} */
      const sourcePath = `docs/${chapter.id}/${target.pathname.replace(/^\.\//, '')}`;
      if (bySource.has(sourcePath)) order.push(bySource.get(sourcePath));
      else assert.equal(parseScalar(frontMatter((await read(sourcePath)).toString('utf8'), sourcePath).field('status')), 'draft', 'Learning chapter may only omit verified draft links');
    }
    unique(order, 'chapter source destinations');
    same(chapter.article_ids, order, `Learning canonical README article order: ${chapter.id}`);
    for (const id of chapter.article_ids) assert.ok(typeof id === 'string' && articles.has(id) && id.split('/')[0] === chapter.id, 'Learning chapter article must exist in its own chapter');
    covered.push(...chapter.article_ids);
  }
  unique(covered, 'chapter article coverage');
  same(sorted(covered), sorted(articles.keys()), 'Learning chapters cover every selected article once');

  /** @param {unknown} target @returns {asserts target is LearningTarget} */
  function validateTarget(target) {
    object(target, 'target');
    if (target.type === 'article') {
      keys(target, ['type', 'article_id', ...(Object.hasOwn(target, 'heading_id') ? ['heading_id'] : [])], 'article target');
      assert.ok(typeof target.article_id === 'string' && articles.has(target.article_id), 'Unknown learning target article');
      if (Object.hasOwn(target, 'heading_id')) {
        string(target.heading_id, 'target heading', { bytes: 256 });
        assert.ok(articles.get(target.article_id)?.headings.has(target.heading_id), 'Unknown learning target heading');
      }
    } else if (target.type === 'chapter') {
      keys(target, ['type', 'chapter_id'], 'chapter target');
      assert.ok(typeof target.chapter_id === 'string' && chapterIDs.includes(target.chapter_id), 'Unknown learning target chapter');
    } else {
      keys(target, ['type', 'url'], 'external target');
      assert.equal(target.type, 'external', 'Unknown learning target type');
      string(target.url, 'external URL');
      const url = new URL(target.url);
      assert.ok(url.protocol === 'https:' && !url.username && !url.password && url.href === target.url, 'Learning external target requires normalized HTTPS without credentials');
    }
  }
  /** @param {string} href @param {string} sourcePath @returns {LearningTarget} */
  const destination = (href, sourcePath) => {
    string(href, 'source destination');
    const parts = splitLocalDestination(href);
    assert.ok(!parts.error, 'Unsafe learning source destination');
    let result;
    if (parts.external) result = { type: 'external', url: new URL(href).href };
    else {
      assert.ok(typeof parts.suffix === 'string' && typeof parts.pathname === 'string', 'Learning local destination parts');
      assert.ok(!parts.suffix.startsWith('?'), 'Learning local source destination cannot contain a query');
      const target = parts.pathname ? path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), parts.pathname)) : sourcePath;
      assert.ok(target !== '..' && !target.startsWith('../') && !target.startsWith('/') && !target.includes('\\'), 'Learning source destination escapes repository');
      if (bySource.has(target)) result = { type: 'article', article_id: bySource.get(target), ...(parts.fragment ? { heading_id: parts.fragment } : {}) };
      else {
        const chapter = target.match(/^docs\/(\d{2}-[a-z0-9-]+)\/README\.md$/)?.[1];
        if (chapter !== undefined && chapterIDs.includes(chapter) && !parts.fragment) result = { type: 'chapter', chapter_id: chapter };
        else {
          assert.ok(!/^docs\/\d{2}-[a-z0-9-]+\/[a-z0-9-]+\.md$/.test(target), 'Unknown learning source article destination');
          const site = 'https://pero3dev.github.io/ai-agent-library';
          const doc = target.match(/^docs\/\d{2}-([^/]+)\/(.+)\.md$/), example = target.match(/^examples\/python\/([^/]+)\/README\.md$/);
          const fragment = parts.suffix.startsWith('#') ? parts.suffix : '';
          const url = doc ? `${site}/docs/${doc[1]}${doc[2] === 'README' ? '' : '/' + doc[2]}${fragment}` :
            example ? `${site}/docs/examples/${example[1]}${fragment}` : target === 'GLOSSARY.md' ? `${site}/glossary${fragment}` :
              target === 'README.md' ? `${site}/${fragment}` : `https://github.com/pero3dev/ai-agent-library/blob/main/${target.split('/').map(encodeURIComponent).join('/')}${fragment}`;
          result = { type: 'external', url: new URL(url).href };
        }
      }
    }
    validateTarget(result);
    return result;
  };

  list(index.routes, 8, 8, 'route');
  same(index.routes.map(route => { object(route, 'route'); return route.id; }), [...'ABCDEFGH'], 'Learning routes have canonical A–H identity and order');
  for (const route of index.routes) {
    keys(route, ['id', 'label', 'persona', 'steps'], 'route');
    string(route.label, 'route label'); string(route.persona, 'route persona'); list(route.steps, 1, 128, 'route step');
    for (const step of route.steps) {
      keys(step, ['inlines'], 'route step'); list(step.inlines, 1, 64, 'route inline');
      for (const inline of step.inlines) {
        object(inline, 'route inline');
        keys(inline, ['type', 'text', ...(inline.type === 'link' ? ['target'] : [])], 'route inline');
        assert.ok(inline.type === 'text' || inline.type === 'link', 'Unknown learning route inline type');
        string(inline.text, 'route inline text', { blank: inline.type === 'text' });
        if (inline.type === 'link') validateTarget(inline.target);
      }
    }
  }
  // Exact keys and every inline/target have been validated above.
  const validatedRoutes = /** @type {{id: string, label: string, persona: string, steps: {inlines: LearningInline[]}[]}[]} */ (index.routes);
  const routeNodes = blockTree(frontMatter((await read(roadmapPath)).toString('utf8'), roadmapPath).body);
  const sections = routeNodes.flatMap((node, position) => node.type === 'heading' && plain(descendants(node.nodes, 'inline')[0]?.inlines) === '読者タイプ別の推奨ルート' ? [position] : []);
  assert.equal(sections.length, 1, 'Learning source requires one reader-route section');
  const start = sections[0], level = Number(routeNodes[start].tag.slice(1));
  const following = routeNodes.findIndex((node, position) => position > start && node.type === 'heading' && Number(node.tag.slice(1)) <= level);
  const rows = tableRows(routeNodes.slice(start + 1, following < 0 ? undefined : following));
  assert.equal(rows.length, 8, 'Learning source route row count');
  for (const [position, row] of rows.entries()) {
    assert.equal(row.length, 3, 'Learning source route column count');
    const identity = plain(row[0]).trim().match(/^([A-H]):\s*(.+)$/);
    assert.ok(identity, 'Learning source route identity');
    const expected = { id: identity[1], label: identity[2], persona: plain(row[1]).trim(), steps: sourceSteps(sourceRuns(row[2]), destination) };
    const actual = { ...validatedRoutes[position], steps: validatedRoutes[position].steps.map(step => ({ inlines: mergeText(step.inlines) })) };
    same(actual, expected, `Learning canonical route text, qualifiers and destinations: ${identity[1]}`);
  }

  list(index.glossary, 1, 2000, 'glossary term'); unique(index.glossary.map(term => { object(term, 'glossary term'); return term.id; }), 'glossary IDs');
  for (const term of index.glossary) {
    keys(term, ['id', 'name', 'english', 'summary', 'links'], 'glossary term');
    for (const field of ['id', 'name', 'summary']) string(term[field], `glossary ${field}`);
    if (term.english !== null) string(term.english, 'glossary English');
    list(term.links, 0, 256, 'glossary link');
    for (const link of term.links) { keys(link, ['label', 'target'], 'glossary link'); string(link.label, 'glossary link label'); validateTarget(link.target); }
  }
  const glossarySource = (await read('GLOSSARY.md')).toString('utf8');
  const glossaryNodes = blockTree(glossarySource), sourceHeadings = parseMarkdownLinks(glossarySource).headings;
  const glossaryInlines = descendants(glossaryNodes, 'inline');
  same(descendants(glossaryNodes, 'heading').filter(node => node.tag === 'h3').map(node => { assert.ok(node.map); return node.map[0] + 1; }), sourceHeadings.filter(value => value.level === 3).map(value => value.line), 'Learning glossary H3 parser agreement');
  const canonicalTerms = [];
  for (const [position, heading] of sourceHeadings.entries()) {
    if (heading.level !== 3) continue;
    const end = sourceHeadings.slice(position + 1).find(next => next.level <= 3)?.line ?? Infinity;
    /** @param {BlockNode} node */
    const inside = node => node.map && node.map[0] + 1 > heading.line && node.map[0] + 1 < end;
    const definition = glossaryNodes.find(node => node.type === 'paragraph' && inside(node));
    assert.ok(definition, 'Learning glossary requires a first definition paragraph');
    const bilingual = heading.text.match(/^(.*?)\s*[（(](.+)[）)]$/);
    canonicalTerms.push({ id: heading.id, name: (bilingual ? bilingual[1] : heading.text).trim(), english: bilingual ? bilingual[2].trim() : null,
      summary: plain(descendants(definition.nodes, 'inline')[0]?.inlines).trim(),
      links: glossaryInlines.filter(inside).flatMap(inline => sourceRuns(inline.inlines).filter(run => run.type === 'link').map(run => ({ label: run.text, target: destination(run.href, 'GLOSSARY.md') }))) });
  }
  same(index.glossary, canonicalTerms, 'Learning canonical glossary IDs, names, first definitions and all links');

  object(index.source_sha256, 'source SHA map');
  const expectedSources = sorted([...bySource.keys(), ...chapterIDs.map(id => `docs/${id}/README.md`), 'GLOSSARY.md']);
  same(sorted(Object.keys(index.source_sha256)), expectedSources, 'Learning exact canonical source SHA set');
  for (const file of expectedSources) {
    assert.ok(typeof index.source_sha256[file] === 'string' && hashPattern.test(index.source_sha256[file]), 'Learning source SHA format');
    assert.equal(index.source_sha256[file], sha256(await read(file)), `Learning current canonical source SHA: ${file}`);
  }
  return { surface: 'static/learning-source-integrity', result: 'passed', revision: manifest.revision, path: indexPath, index_sha256: sha256(bytes), index_bytes: bytes.length,
    articles: articles.size, chapters: chapterIDs.length, routes: index.routes.length, glossary_terms: canonicalTerms.length,
    glossary_terms_with_multiple_links: canonicalTerms.filter(term => term.links.length > 1).length,
    source_files: expectedSources.length, source_sha256: index.source_sha256, issues: [], native_ui_test: false, voiceover_test: false,
    limitations: ['Read-only comparison with canonical Markdown; no producer, consumer, Simulator, device, native UI, or accessibility execution.', 'Source hashes record current bytes; they do not authenticate a publisher or establish a delivery signature.'] };
}
