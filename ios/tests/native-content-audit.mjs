#!/usr/bin/env node
// Read-only audit of the actual native package against its Markdown sources.
// This does not launch a browser, Simulator, device, VoiceOver, or the application.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import MarkdownIt from 'markdown-it';
import GithubSlugger from 'github-slugger';
import { installMath, parseArticle, readSource, rejectSymlinks } from '../../scripts/lib/ios-content.mjs';
import { parseFrontMatter, parseScalar, toLines } from '../../scripts/lib/md-utils.mjs';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const usage = 'Usage: node ios/tests/native-content-audit.mjs [--fixtures | --published-library | --all-published --content <temporary ailibrary-ios-*/Content>]';
const profiles = new Set(['representative', 'fixtures', 'published-library', 'all-published']);

export function parseNativeAuditOptions(args) {
  assert.ok(Array.isArray(args), usage);
  const options = { profile: 'representative' };
  const seen = new Set();
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    assert.ok(['--fixtures', '--published-library', '--all-published', '--content'].includes(argument) && !seen.has(argument), usage);
    seen.add(argument);
    if (argument === '--content') {
      const value = args[++index];
      assert.ok(typeof value === 'string' && value.trim() && !value.startsWith('--'), usage);
      options.content = value;
    } else {
      assert.equal(options.profile, 'representative', usage);
      options.profile = argument.slice(2);
    }
  }
  assert.equal(options.profile === 'all-published', options.content !== undefined, usage);
  return options;
}

export async function resolveNativeAuditContent(root, { profile = 'representative', content } = {}) {
  assert.ok(profiles.has(profile), 'Unknown native audit profile');
  root = await realpath(root);
  if (profile !== 'all-published') {
    assert.equal(content, undefined, 'Only the temporary all-published audit accepts --content');
    const canonical = path.join(root, profile === 'fixtures' ? 'ios/AILibrary/TestContent' : 'ios/AILibrary/Content');
    await rejectSymlinks(canonical);
    return canonical;
  }
  assert.ok(typeof content === 'string' && content.trim(), 'The temporary all-published audit requires --content');
  const temp = await realpath(os.tmpdir()), tempAlias = path.resolve(os.tmpdir());
  let absolute = path.resolve(content);
  if (absolute.startsWith(tempAlias + path.sep)) absolute = path.join(temp, path.relative(tempAlias, absolute));
  const relative = path.relative(temp, absolute);
  assert.ok(!relative.startsWith('..') && !path.isAbsolute(relative) && /^ailibrary-ios-[^/\\]+[/\\].+/.test(relative) && path.basename(absolute) === 'Content', 'Audit content must be a temporary ailibrary-ios-*/Content');
  const comparable = value => process.platform === 'darwin' || process.platform === 'win32' ? value.toLowerCase() : value;
  for (const name of ['Content', 'TestContent']) {
    const canonical = comparable(path.join(root, 'ios/AILibrary', name)), candidate = comparable(absolute);
    assert.ok(candidate !== canonical && !candidate.startsWith(canonical + path.sep) && !canonical.startsWith(candidate + path.sep), 'Temporary audit must be separate from canonical Content and TestContent');
  }
  await rejectSymlinks(absolute);
  return absolute;
}

export async function publishedAuditSources(root) {
  const sources = [];
  const sections = await readdir(path.join(root, 'docs'), { withFileTypes: true });
  for (const section of sections) {
    if (!/^\d{2}-[a-z0-9-]+$/.test(section.name)) continue;
    assert.ok(!section.isSymbolicLink(), 'Published source sections must not be symlinks');
    if (!section.isDirectory()) continue;
    for (const file of await readdir(path.join(root, 'docs', section.name), { withFileTypes: true })) {
      if (file.name.toLowerCase() === 'readme.md' || !/^[a-z0-9-]+\.md$/.test(file.name)) continue;
      assert.ok(!file.isSymbolicLink(), 'Published article sources must not be symlinks');
      if (!file.isFile()) continue;
      const sourcePath = `docs/${section.name}/${file.name}`;
      const frontMatter = parseFrontMatter(toLines((await readSource(root, sourcePath)).toString('utf8')));
      assert.ok(frontMatter && !frontMatter.unclosed && !frontMatter.errors.length, `Invalid published-source front matter: ${sourcePath}`);
      const statuses = frontMatter.fields.filter(field => field.key === 'status');
      assert.equal(statuses.length, 1, `Expected exactly one source status: ${sourcePath}`);
      const status = parseScalar(statuses[0].value);
      assert.ok(['published', 'draft'].includes(status), `Unknown source status: ${sourcePath}`);
      if (status === 'published') sources.push(sourcePath);
    }
  }
  assert.ok(sources.length > 0 && sources.length <= 2000, 'Published audit requires 1–2000 source articles');
  return sources.sort();
}

export function assertNativeAuditArticleSet(articles, sourcePaths) {
  assert.ok(Array.isArray(articles), 'Manifest articles must be an array');
  assert.deepEqual(articles.map(article => article.source_path), sourcePaths, 'Exact ordered source article set');
  assert.deepEqual(articles.map(article => article.id), sourcePaths.map(file => file === 'ios/fixtures/native-reader.md' ? 'test-fixtures/native-reader' : file.replace(/^docs\//, '').replace(/\.md$/, '')), 'Each source keeps its canonical article ID');
}

export function expectedNativeAuditLink(href, article, selected) {
  assert.ok(typeof href === 'string', 'Source links must be strings');
  const decode = value => { try { return decodeURIComponent(value); } catch { assert.fail(`Malformed source link: ${href}`); } };
  if (href.startsWith('#')) return { kind: 'article', article_id: article.id, ...(href.length > 1 ? { heading_id: decode(href.slice(1)) } : {}) };
  const external = value => {
    const url = new URL(value);
    assert.ok(url.protocol === 'https:' && !url.username && !url.password, 'External source links require HTTPS without credentials');
    return { kind: 'external', url: url.href };
  };
  if (/^https?:\/\//i.test(href)) return external(href);
  assert.ok(!/^[a-z][a-z\d+.-]*:/i.test(href) && !href.startsWith('//'), 'Unsupported source link protocol');
  const match = href.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  assert.ok(match, `Unknown source link format: ${href}`);
  const pathname = decode(match[1]);
  assert.ok(!pathname.includes('\\') && !pathname.includes('\0') && !pathname.startsWith('/'), 'Unsafe source link path');
  const target = path.posix.normalize(path.posix.join(path.posix.dirname(article.source_path), pathname));
  assert.ok(target !== '..' && !target.startsWith('../'), 'Source link escapes repository');
  const selectedID = selected.get(target);
  if (selectedID !== undefined) return { kind: 'article', article_id: selectedID, ...(match[3] && match[3].length > 1 ? { heading_id: decode(match[3].slice(1)) } : {}) };
  const fragment = match[3] || '', document = target.match(/^docs\/\d{2}-([^/]+)\/(.+)\.md$/), example = target.match(/^examples\/python\/([^/]+)\/README\.md$/);
  const site = 'https://pero3dev.github.io/ai-agent-library';
  if (document) return external(`${site}/docs/${document[1]}${document[2] === 'README' ? '' : '/' + document[2]}${match[2] || ''}${fragment}`);
  if (example) return external(`${site}/docs/examples/${example[1]}${fragment}`);
  if (target === 'GLOSSARY.md') return external(`${site}/glossary${fragment}`);
  if (target === 'README.md') return external(`${site}/${fragment}`);
  return external(`https://github.com/pero3dev/ai-agent-library/blob/main/${target.split('/').map(encodeURIComponent).join('/')}${fragment}`);
}

export function assertNativeAuditDescriptions(keys, descriptions) {
  assert.ok(descriptions && typeof descriptions === 'object' && !Array.isArray(descriptions), 'Invalid diagram description map');
  for (const [key, description] of Object.entries(descriptions)) assert.ok(/^[a-f0-9]{24}$/.test(key) && typeof description === 'string' && description.trim() && Buffer.byteLength(description) <= 16384, 'Invalid source-bound diagram description');
  assert.deepEqual([...keys].sort(), Object.keys(descriptions).sort(), 'No missing, stale or unbound diagram descriptions');
}

export async function auditNativeContent({ root = repositoryRoot, profile = 'representative', content: requestedContent } = {}) {
  root = await realpath(root);
  const content = await resolveNativeAuditContent(root, { profile, content: requestedContent });
  const fixtures = profile === 'fixtures', published = ['all-published', 'published-library'].includes(profile);
  const require = createRequire(new URL('../tools/package.json', import.meta.url));
  const katex = require('katex');
  const digest = data => createHash('sha256').update(data).digest('hex');
  const readJSON = async file => JSON.parse(await readFile(file, 'utf8'));
  const manifestStat = await lstat(path.join(content, 'manifest.json'));
  assert.ok(manifestStat.isFile() && !manifestStat.isSymbolicLink(), 'Manifest must be a regular file');
  assert.ok(manifestStat.size <= 8 * 1024 * 1024, 'Manifest must fit the native byte limit');
  const manifest = await readJSON(path.join(content, 'manifest.json'));
  const selection = JSON.parse(await readSource(root, 'ios/content-selection.json'));
  let descriptions = selection.diagram_descriptions || {};
  if (published) {
    const fullDescriptions = JSON.parse(await readSource(root, 'ios/all-published-diagram-descriptions.json'));
    assert.equal(fullDescriptions.schema_version, 1, 'All-published description map schema');
    descriptions = fullDescriptions.diagram_descriptions;
  }
  assert.equal(manifest.schema_version, 2, 'This audit requires the JSON/PNG native package');
  assert.equal(manifest.revision, digest(JSON.stringify({ schema_version: 2, articles: manifest.articles, audio: manifest.audio, files: manifest.files })), 'Manifest revision matches its content');
  const fixturePath = 'ios/fixtures/native-reader.md';
  assertNativeAuditArticleSet(manifest.articles, published ? await publishedAuditSources(root) : [...selection.articles, ...(fixtures ? [fixturePath] : [])]);
  const selected = new Map(manifest.articles.map(article => [article.source_path, article.id]));
  for (const article of manifest.articles) assert.equal(article.document_path, `articles/${article.id.replaceAll('/', '--')}.json`, 'Article document path is source-bound');
  const headings = new Map(manifest.articles.map(article => [article.id, new Set(article.headings.map(heading => heading.id))]));
  const normalize = value => value.replace(/\s+/g, ' ').trim();
  const leaves = tokens => tokens.flatMap(token => token.children ? leaves(token.children) :
    ['text', 'code_inline', 'math_inline', 'math_block', 'fence', 'code_block'].includes(token.type) ? [token.content] :
      ['softbreak', 'hardbreak'].includes(token.type) ? ['\n'] : []);

  function walk(value) {
    if (Array.isArray(value)) return value.flatMap(walk);
    if (!value || typeof value !== 'object') return [];
    return [value, ...Object.values(value).flatMap(walk)];
  }

  function nativeLeaves(blocks) {
    const inline = values => values.flatMap(value => {
      if (['text', 'code'].includes(value.type)) return [value.text];
      if (value.type === 'math') return [value.source];
      if (['soft_break', 'hard_break'].includes(value.type)) return ['\n'];
      return inline(value.children || []);
    });
    return blocks.flatMap(block => {
      if (block.inlines) return inline(block.inlines);
      if (block.type === 'code') return [block.text];
      if (['math', 'diagram'].includes(block.type)) return [block.source];
      if (block.type === 'table') return [...block.table.header, ...block.table.rows.flat()].flatMap(inline);
      if (block.type === 'list') return block.items.flatMap(item => nativeLeaves(item.blocks));
      return nativeLeaves(block.blocks || []);
    });
  }

  const inlineSource = values => values.map(value => ['text', 'code'].includes(value.type) ? value.text :
    value.type === 'math' ? value.source : ['soft_break', 'hard_break'].includes(value.type) ? '\n' : inlineSource(value.children || [])).join('');

  function auditFixture(document, all) {
    const depth = (blocks, current = 0) => Math.max(current, ...blocks.map(block => block.type === 'list' ?
      Math.max(current + 1, ...block.items.map(item => depth(item.blocks, current + 1))) : depth(block.blocks || [], current)));
    const maximumListDepth = depth(document.blocks);
    assert.ok(maximumListDepth >= 3, 'Fixture includes at least three mixed list levels');
    assert.ok(all.some(node => node.type === 'list' && node.ordered && node.start === 8), 'Fixture tests a non-one ordered list start');
    assert.ok(all.some(node => node.type === 'quote' && walk(node.blocks).some(child => child.type === 'list')), 'Fixture includes a list inside a quote');
    for (const type of ['strong', 'emphasis', 'hard_break', 'thematic_break']) assert.ok(all.some(node => node.type === type), `Fixture includes ${type}`);
    assert.ok(all.filter(node => node.type === 'hard_break').length >= 2, 'Fixture preserves consecutive hard line breaks');
    const table = all.find(node => node.type === 'table');
    assert.deepEqual(table.table.alignments, ['left', 'center', 'right']);
    for (const type of ['strong', 'emphasis', 'code', 'link', 'math']) assert.ok(walk(table).some(node => node.type === type), `Fixture table includes ${type}`);
    const links = all.filter(node => node.type === 'link');
    const mathOnly = links.filter(link => walk(link.children).some(node => node.type === 'math') &&
      !walk(link.children).some(node => ['text', 'code'].includes(node.type) && node.text?.trim()));
    const mixed = links.filter(link => walk(link.children).some(node => node.type === 'math') &&
      walk(link.children).some(node => node.type === 'text' && node.text?.trim()));
    assert.ok(mathOnly.length >= 2 && mixed.length >= 2, 'Fixture tests math-only and mixed-text mathematical links');
    assert.ok(links.some(node => node.target.article_id === 'test-fixtures/native-reader' && node.target.heading_id === '同じ見出し-1'), 'Fixture links to the second duplicate heading');
    const duplicateHeadings = all.filter(node => node.type === 'heading' && inlineSource(node.inlines) === '同じ見出し');
    assert.deepEqual(duplicateHeadings.map(node => node.heading_id), ['同じ見出し', '同じ見出し-1']);
    const code = all.find(node => node.type === 'code' && node.id && node.text.startsWith('BEGIN-COPY-01\n'));
    assert.ok(code?.text.endsWith('END-COPY-01\n') && code.text.includes('\n\ttab-indented:') && code.text.includes('\n```\n'), 'Fixture code preserves copy boundaries, tabs and nested fence characters');
    assert.ok(all.some(node => node.type === 'code' && node.id && node.text === ''), 'Fixture tests copying an empty code block');
    const distanceParagraphs = document.blocks.filter(node => node.type === 'paragraph' && /^P\d{2}。/.test(inlineSource(node.inlines))).length;
    assert.ok(distanceParagraphs >= 10, 'Fixture provides deliberate distance between navigation targets');
    return { maximum_list_depth: maximumListDepth, math_only_links: mathOnly.length, mixed_math_links: mixed.length, distance_paragraphs: distanceParagraphs, empty_code_block: true };
  }

  function sourceTables(tokens) {
    const tables = [];
    for (let index = 0; index < tokens.length; index++) {
      if (tokens[index].type !== 'table_open') continue;
      const table = { header: [], rows: [], alignments: [] };
      let row;
      while (tokens[++index].type !== 'table_close') {
        const token = tokens[index];
        if (token.type === 'tr_open') row = [];
        if (token.type === 'th_open') {
          table.alignments.push(token.attrGet('style')?.match(/text-align:(left|center|right)/)?.[1] || 'left');
          table.header.push(leaves(tokens[index + 1].children || []).join(''));
        }
        if (token.type === 'td_open') row.push(leaves(tokens[index + 1].children || []).join(''));
        if (token.type === 'tr_close' && row.length) table.rows.push(row);
      }
      tables.push(table);
    }
    return tables;
  }

  function decodeEntities(value) {
    return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (whole, entity) => {
      if (entity.startsWith('#x')) return String.fromCodePoint(parseInt(entity.slice(2), 16));
      if (entity.startsWith('#')) return String.fromCodePoint(Number(entity.slice(1)));
      return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[entity] || whole;
    });
  }

  function spokenMath(source, displayMode) {
    const html = katex.renderToString(source.trim(), { displayMode, throwOnError: true, strict: 'error', trust: false, output: 'mathml' });
    const xml = html.match(/<math\b[\s\S]*?<\/math>/)?.[0];
    assert.ok(xml, 'KaTeX must produce a MathML representation');
    const stack = [{ tag: 'root', children: [] }];
    for (const part of xml.match(/<[^>]+>|[^<]+/g)) {
      if (part.startsWith('</')) { stack.pop(); continue; }
      if (part.startsWith('<')) {
        const node = { tag: part.match(/^<([^\s/>]+)/)[1].toLowerCase(), children: [] };
        stack.at(-1).children.push(node);
        if (!part.endsWith('/>')) stack.push(node);
      } else if (part.trim()) stack.at(-1).children.push(decodeEntities(part));
    }
    const operators = { '=': ' イコール ', '+': ' プラス ', '−': ' マイナス ', '-': ' マイナス ', '×': ' かける ', '∈': ' 属する ', '≈': ' およそ ', '∞': ' 無限大 ', '∑': ' 総和 ', '→': ' から ', '⊙': ' 要素ごとの積 ' };
    const speak = node => {
      if (typeof node === 'string') return node;
      if (['annotation', 'annotation-xml'].includes(node.tag)) return '';
      const parts = node.children.map(speak);
      if (node.tag === 'mfrac') return ` ${parts[1]} 分の ${parts[0]} `;
      if (node.tag === 'msup') return ` ${parts[0]} の ${parts[1]} 乗 `;
      if (node.tag === 'msub') return ` ${parts[0]} 添字 ${parts[1]} `;
      if (node.tag === 'msubsup') return ` ${parts[0]} 添字 ${parts[1]} の ${parts[2]} 乗 `;
      if (node.tag === 'msqrt') return ` 平方根 ${parts.join(' ')} `;
      if (node.tag === 'mroot') return ` ${parts[1]} 乗根 ${parts[0]} `;
      if (node.tag === 'mo') { const text = node.children.join(''); return operators[text] || ` ${text} `; }
      return parts.join(' ');
    };
    return normalize(speak(stack[0]));
  }

  function pngPixels(data) {
    assert.ok(data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'PNG signature');
    const width = data.readUInt32BE(16), height = data.readUInt32BE(20), bits = data[24], color = data[25];
    assert.equal(bits, 8, 'PNG audit supports eight-bit assets');
    assert.ok([2, 6].includes(color), 'PNG audit supports RGB/RGBA assets');
    assert.equal(data[28], 0, 'PNG must not be interlaced');
    assert.ok(width > 0 && height > 0 && width <= 8192 && height <= 8192 && width * height <= 32000000);
    const channels = color === 6 ? 4 : 3;
    const stride = width * channels;
    const idat = [];
    for (let cursor = 8; cursor < data.length;) {
      const length = data.readUInt32BE(cursor), type = data.toString('ascii', cursor + 4, cursor + 8);
      assert.ok(cursor + length + 12 <= data.length, 'Complete PNG chunks');
      if (type === 'IDAT') idat.push(data.subarray(cursor + 8, cursor + 8 + length));
      cursor += length + 12;
    }
    const raw = inflateSync(Buffer.concat(idat), { maxOutputLength: (stride + 1) * height });
    assert.equal(raw.length, (stride + 1) * height, 'Complete PNG scanlines');
    let previous = Buffer.alloc(stride), painted = 0, border = 0;
    for (let y = 0; y < height; y++) {
      const row = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
      const filter = raw[y * (stride + 1)];
      assert.ok(filter >= 0 && filter <= 4, 'Known PNG row filter');
      for (let x = 0; x < stride; x++) {
        const left = x >= channels ? row[x - channels] : 0, up = previous[x], upperLeft = x >= channels ? previous[x - channels] : 0;
        let prediction = 0;
        if (filter === 1) prediction = left;
        if (filter === 2) prediction = up;
        if (filter === 3) prediction = Math.floor((left + up) / 2);
        if (filter === 4) {
          const p = left + up - upperLeft, a = Math.abs(p - left), b = Math.abs(p - up), c = Math.abs(p - upperLeft);
          prediction = a <= b && a <= c ? left : b <= c ? up : upperLeft;
        }
        row[x] = (row[x] + prediction) & 255;
      }
      for (let x = 0; x < width; x++) {
        const alpha = channels === 4 ? row[x * channels + 3] : 255;
        if (!alpha) continue;
        painted++;
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) border++;
      }
      previous = row;
    }
    assert.ok(painted > 0, 'PNG must contain visible pixels');
    return { width, height, painted_pixels: painted, ink_on_outer_border: border };
  }

  let inventoryEntries = 0;
  const inventory = async (directory, prefix = '', depth = 0) => {
    assert.ok(depth <= 32, 'Native package directory depth limit');
    const result = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      assert.ok(++inventoryEntries <= 8192, 'Native package entry count limit');
      assert.ok(!entry.isSymbolicLink(), 'Generated package must not contain symlinks');
      const relative = prefix + entry.name;
      if (entry.isDirectory()) result.push(...await inventory(path.join(directory, entry.name), relative + '/', depth + 1));
      else { assert.ok(entry.isFile()); result.push(relative); }
    }
    assert.ok(result.length <= 4096, 'Native package file count limit');
    return result;
  };
  assert.deepEqual((await inventory(content)).sort(), [...Object.keys(manifest.files), 'manifest.json'].sort());
  for (const file of ['assets/licenses/NOTICE.txt', 'assets/katex/LICENSE.txt', 'assets/licenses/Mermaid-LICENSE.txt']) assert.ok(Object.hasOwn(manifest.files, file), `Required attribution file: ${file}`);
  const pngs = new Map();
  let packageBytes = (await lstat(path.join(content, 'manifest.json'))).size;
  for (const [file, hash] of Object.entries(manifest.files)) {
    assert.ok(/^(?:assets|articles)\/[a-zA-Z0-9/_.-]+\.(json|png|txt)$/.test(file) && !file.split('/').includes('..'), 'Native asset path');
    assert.match(hash, /^[a-f0-9]{64}$/, 'Native file SHA format');
    const size = (await lstat(path.join(content, file))).size;
    assert.ok(size <= (file.endsWith('.png') ? 32 : 16) * 1024 * 1024, 'Native file byte limit');
    packageBytes += size;
    assert.ok(packageBytes <= 256 * 1024 * 1024, 'Native package byte limit');
    const data = await readFile(path.join(content, file));
    assert.equal(digest(data), hash, `Package SHA: ${file}`);
    if (file.endsWith('.png')) pngs.set(file, pngPixels(data));
  }
  assert.deepEqual(await readFile(path.join(content, 'assets/licenses/NOTICE.txt')), await readSource(root, 'LICENSE'), 'Documentation and code attribution matches the current source');
  for (const article of manifest.articles) assert.ok(Object.hasOwn(manifest.files, article.document_path), 'Article document is in the hashed inventory');
  const documents = new Map(await Promise.all(manifest.articles.map(async article => [article.id, await readJSON(path.join(content, article.document_path))])));

  const reports = [], issues = [], referencedPNGs = new Set(), pairs = new Set(), descriptionKeys = new Set();
  const coverage = { same_article_fragment: 0, selected_article_fragment: 0, selected_article: 0, external: 0 };
  for (const article of manifest.articles) {
    const source = (await readSource(root, article.source_path)).toString('utf8');
    const isFixture = fixtures && article.source_path === fixturePath;
    assert.equal(article.is_test_fixture, isFixture ? true : undefined, 'Only the explicit test article carries fixture metadata');
    if (isFixture) assert.equal(article.id, 'test-fixtures/native-reader');
    const parsed = parseArticle(source, article.source_path, { fixture: isFixture });
    assert.equal(article.source_sha256, digest(source), `Current source binding: ${article.id}`);
    const document = documents.get(article.id);
    assert.equal(document.source_sha256, article.source_sha256);
    assert.equal(document.article_id, article.id);
    assert.equal(document.schema_version, 1);
    const md = new MarkdownIt({ html: false, linkify: false, typographer: false });
    installMath(md, () => { throw new Error('Audit must not render article HTML'); });
    const tokens = md.parse(parsed.body, {});
    const all = walk(document);
    assert.deepEqual(nativeLeaves(document.blocks), leaves(tokens), `All original leaves, in order: ${article.id}`);
    assert.equal(article.search_text, normalize(leaves(tokens).join(' ')), `Search text preserves the original content: ${article.id}`);
    const slugger = new GithubSlugger();
    const expectedHeadings = tokens.flatMap((token, index) => {
      if (token.type !== 'heading_open') return [];
      const title = tokens[index + 1].children.filter(value => ['text', 'code_inline', 'math_inline'].includes(value.type)).map(value => value.content).join(' ').trim().replace(/\s+/g, ' ');
      return [{ id: slugger.slug(title), title, level: Number(token.tag.slice(1)) }];
    });
    assert.deepEqual(article.headings, expectedHeadings, `Heading destination IDs: ${article.id}`);
    const nativeHeadings = all.filter(node => node.type === 'heading').map(node => ({ id: node.heading_id, title: normalize(inlineSource(node.inlines)), level: node.level }));
    assert.deepEqual(nativeHeadings, expectedHeadings);
    const expectedTables = sourceTables(tokens);
    const tables = all.filter(node => node.type === 'table').map(node => ({ header: node.table.header.map(inlineSource), rows: node.table.rows.map(row => row.map(inlineSource)), alignments: node.table.alignments }));
    assert.deepEqual(tables, expectedTables, `Every table cell/row/column/alignment: ${article.id}`);
    const code = tokens.filter(token => ['fence', 'code_block'].includes(token.type) && token.info.trim() !== 'mermaid').map(token => ({ language: token.info.trim().split(/\s+/)[0] || 'text', text: token.content }));
    assert.deepEqual(all.filter(node => node.type === 'code' && node.id).map(node => ({ language: node.language, text: node.text })), code, `Exact code contents: ${article.id}`);
    const links = all.filter(node => node.type === 'link');
    const expectedLinks = tokens.flatMap(token => walk(token.children || [])).filter(token => token.type === 'link_open').map(token => expectedNativeAuditLink(token.attrGet('href'), article, selected));
    assert.deepEqual(links.map(node => node.target), expectedLinks, `All source links: ${article.id}`);
    const distribution = { same_article_fragment: 0, selected_article_fragment: 0, selected_article: 0, external: 0 };
    for (const { target } of links) {
      let kind;
      if (target.kind === 'article') {
        assert.ok(headings.has(target.article_id), 'Selected destination article exists');
        if (target.heading_id) assert.ok(headings.get(target.article_id).has(target.heading_id), 'Destination fragment exists');
        kind = target.heading_id ? target.article_id === article.id ? 'same_article_fragment' : 'selected_article_fragment' : 'selected_article';
      } else { const url = new URL(target.url); assert.ok(url.protocol === 'https:' && !url.username && !url.password); kind = 'external'; }
      distribution[kind]++; coverage[kind]++;
    }
    let spokenMathCount = 0;
    for (const node of all.filter(value => value.asset)) {
      const asset = node.asset;
      assert.ok(node.accessibility_text?.trim(), 'Every figure and formula needs reading text');
      assert.ok(!/\\(?:frac|mathrm|mathbb|mathbf|sqrt)\b/.test(node.accessibility_text), 'TeX annotations must not leak into reading text');
      assert.ok(asset.light.endsWith('-light.png') && asset.dark.endsWith('-dark.png'));
      assert.ok(asset.width > 0 && asset.height > 0 && asset.scale >= 1 && asset.scale <= 4);
      for (const file of [asset.light, asset.dark]) {
        const png = pngs.get(file); assert.ok(png, `Referenced PNG exists: ${file}`); referencedPNGs.add(file);
        assert.ok(Math.abs(png.width - asset.width * asset.scale) <= 2 && Math.abs(png.height - asset.height * asset.scale) <= 2, 'PNG metadata matches pixels');
      }
      assert.deepEqual([pngs.get(asset.light).width, pngs.get(asset.light).height], [pngs.get(asset.dark).width, pngs.get(asset.dark).height], 'Light/dark canvas dimensions match');
      assert.notEqual(manifest.files[asset.light], manifest.files[asset.dark], 'Theme assets use distinct painted colors');
      pairs.add(asset.light);
      if (node.type === 'math') {
        assert.equal(node.accessibility_text, spokenMath(node.source, Boolean(node.id)), `MathML-derived reading text: ${node.source}`);
        spokenMathCount++;
        if (!node.id) assert.ok(Number.isFinite(asset.baseline) && asset.baseline >= 0 && asset.baseline <= asset.height, 'Inline formula baseline');
      }
      if (node.type === 'diagram') {
        const sourceKey = digest(`diagram\0true\0${node.source.trim()}`).slice(0, 24);
        assert.equal(asset.light, `assets/native/${sourceKey}-light.png`, 'Diagram assets are bound to the original diagram source');
        if (published || selection.diagram_descriptions !== undefined) {
          const description = descriptions?.[sourceKey];
          assert.ok(typeof description === 'string' && description.trim(), 'Source-bound diagram description exists');
          assert.ok(node.accessibility_text.startsWith(`${description}\n図中のラベル: `), 'Generated diagram reading text includes the current complete description');
          descriptionKeys.add(sourceKey);
        }
        const labels = [...node.source.matchAll(/"([^"]+)"/g)].map(match => match[1].replace(/<br\s*\/?\s*>/gi, ' '));
        if (node.source.trim().startsWith('sequenceDiagram')) for (const line of node.source.split('\n')) {
          const participant = line.trim().match(/^participant\s+(\S+)(?:\s+as\s+(.+))?$/);
          const message = line.trim().match(/^\S+[-.<>]+\S+:\s*(.+)$/);
          if (participant) labels.push(participant[2] || participant[1]);
          if (message) labels.push(message[1]);
        }
        const compact = value => value.replace(/\s+/g, '');
        const missing = labels.filter(label => !compact(node.accessibility_text).includes(compact(label)));
        if (missing.length) issues.push({ article: article.id, kind: 'diagram_reading_text_omits_source_labels', asset: asset.light, missing_labels: missing });
      }
    }
    const assets = all.filter(node => node.asset);
    const fixtureCoverage = isFixture ? auditFixture(document, all) : undefined;
    reports.push({ article: article.id, ...(isFixture ? { is_test_fixture: true, fixture_coverage: fixtureCoverage } : {}), original_leaves: leaves(tokens).length, headings: article.headings.length,
      tables: tables.length, table_cells: tables.reduce((sum, table) => sum + table.header.length + table.rows.flat().length, 0),
      code_blocks: code.length, links: links.length, link_distribution: distribution, diagrams: assets.filter(node => node.type === 'diagram').length,
      inline_math: assets.filter(node => node.type === 'math' && !node.id).length, block_math: assets.filter(node => node.type === 'math' && node.id).length,
      math_reading_text_compared: spokenMathCount });
  }
  assert.deepEqual([...referencedPNGs].sort(), [...pngs.keys()].sort(), 'All PNGs are referenced by article content');
  assertNativeAuditDescriptions(descriptionKeys, descriptions);
  const output = { surface: 'static/content-integrity', profile, fixtures, native_ui_test: false, voiceover_test: false, result: issues.length ? 'failed' : 'passed', revision: manifest.revision,
    checked_files: Object.keys(manifest.files).length, checked_pngs: pngs.size, unique_light_dark_pairs: pairs.size,
    source_bound_diagram_descriptions: descriptionKeys.size,
    pngs_with_ink_on_outermost_border: [...pngs].filter(([, value]) => value.ink_on_outer_border > 0).map(([file]) => file),
    articles: reports, source_link_coverage: coverage, issues,
    fixture_needed_for: Object.entries(coverage).filter(([kind, count]) => kind.includes('fragment') && !count).map(([kind]) => kind),
    limitations: ['Asset pixels and reading text are checked statically; native layout, zoom gestures, copy actions, navigation, and VoiceOver require separate UI/device checks.', 'Math reading text matches the generated MathML conversion; this does not establish natural pronunciation or complete mathematical semantics.'] };
  return output;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const output = await auditNativeContent(parseNativeAuditOptions(process.argv.slice(2)));
    console.log(JSON.stringify(output, null, 2));
    if (output.result === 'failed') process.exitCode = 1;
  } catch (error) {
    console.log(JSON.stringify({ surface: 'static/content-integrity', native_ui_test: false, voiceover_test: false, result: 'failed', error: error.message }, null, 2));
    process.exitCode = 1;
  }
}
