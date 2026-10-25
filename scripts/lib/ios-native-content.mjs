import { mkdir, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import GithubSlugger from 'github-slugger';
import { load as loadYaml, JSON_SCHEMA } from 'js-yaml';
import { audioMetadata, installMath, NATIVE_READER_FIXTURE, parseArticle, readSource, rewriteLink, sha256, tokenText, validateOutput } from './ios-content.mjs';
import { loadNativeRenderingDependencies } from './ios-native-assets.mjs';

const assetKey = Symbol('nativeAssetKey');
const comparePath = ([a], [b]) => a < b ? -1 : a > b ? 1 : 0;
const fileFor = id => `articles/${id.replaceAll('/', '--')}.json`;
const maxTextBytes = 1024 * 1024;
const maxDocumentBytes = 16 * 1024 * 1024;
const maxPNGBytes = 32 * 1024 * 1024;
const maxElements = 20000;
const maxDepth = 32;

function text(value, label) {
  if (typeof value !== 'string' || Buffer.byteLength(value) > maxTextBytes) throw new Error(`Invalid or oversized ${label}`);
  return value;
}

function nativeLink(href, article, selected) {
  if (href.startsWith('#')) {
    let heading;
    try { heading = decodeURIComponent(href.slice(1)); } catch { throw new Error(`Malformed link: ${href}`); }
    if (Buffer.byteLength(heading) > 256) throw new Error('Native heading link exceeds 256 bytes');
    return { kind: 'article', article_id: article.id, ...(heading ? { heading_id: heading } : {}) };
  }
  const target = rewriteLink(href, article.source_path, selected);
  if (target.article_id) {
    if (Buffer.byteLength(target.fragment || '') > 256) throw new Error('Native heading link exceeds 256 bytes');
    return { kind: 'article', article_id: target.article_id, ...(target.fragment ? { heading_id: target.fragment } : {}) };
  }
  const url = new URL(target.href);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`Native external links require HTTPS without credentials: ${href}`);
  return { kind: 'external', url: url.href };
}

/** Convert Markdown to the native schema, retaining build-time image requests separately. */
export function parseNativeArticle(article, { selected = new Map([[article.source_path, article.id]]) } = {}) {
  if (Buffer.byteLength(article.body) > maxDocumentBytes) throw new Error(`Oversized article: ${article.id}`);
  const md = new MarkdownIt({ html: false, linkify: false, typographer: false });
  installMath(md, () => { throw new Error('Native conversion must not render HTML'); });
  const tokens = md.parse(article.body, {});
  const headings = [];
  const requests = new Map();
  const slugger = new GithubSlugger();
  const duplicates = new Map();
  let headingContext = '';
  let count = 0;
  const consume = depth => {
    if (depth > maxDepth) throw new Error(`Native document exceeds depth ${maxDepth}`);
    if (++count > maxElements) throw new Error(`Native document exceeds ${maxElements} elements`);
  };
  const stableID = (kind, value, section = headingContext) => {
    const digest = sha256(`${article.id}\0${section}\0${kind}\0${JSON.stringify(value)}`).slice(0, 24);
    const occurrence = (duplicates.get(digest) || 0) + 1;
    duplicates.set(digest, occurrence);
    return `${kind}-${digest}${occurrence > 1 ? `-${occurrence}` : ''}`;
  };
  const image = (kind, source, display) => {
    text(source, `${kind} source`);
    const key = sha256(`${kind}\0${display}\0${source.trim()}`).slice(0, 24);
    requests.set(key, { key, kind, source: source.trim(), display });
    // The placeholder is never written. buildNativeContent requires rendered metadata.
    return { asset: { light: `assets/native/${key}-light.png`, dark: `assets/native/${key}-dark.png`, width: 1, height: 1, scale: 1 }, source, accessibility_text: source, [assetKey]: key };
  };
  function inlines(values, depth) {
    let cursor = 0;
    function read(until) {
      const result = [];
      while (cursor < values.length) {
        const token = values[cursor++];
        if (token.type === until) return result;
        consume(depth);
        if (token.type === 'text') result.push({ type: 'text', text: text(token.content, 'inline text') });
        else if (token.type === 'code_inline') result.push({ type: 'code', text: text(token.content, 'inline code') });
        else if (token.type === 'softbreak' || token.type === 'hardbreak') result.push({ type: token.type === 'softbreak' ? 'soft_break' : 'hard_break' });
        else if (token.type === 'math_inline') result.push({ type: 'math', ...image('math', token.content, false) });
        else if (['strong_open', 'em_open', 'link_open'].includes(token.type)) {
          if (depth + 1 > maxDepth) throw new Error(`Native document exceeds depth ${maxDepth}`);
          const previousDepth = depth;
          depth++;
          const children = read(token.type.replace('_open', '_close'));
          depth = previousDepth;
          if (token.type === 'link_open') result.push({ type: 'link', children, target: nativeLink(token.attrGet('href'), article, selected) });
          else result.push({ type: token.type === 'strong_open' ? 'strong' : 'emphasis', children });
        } else throw new Error(`Unsupported native inline token ${token.type}: ${article.source_path}`);
      }
      if (until) throw new Error(`Unclosed native inline: ${until}`);
      return result;
    }
    return read();
  }
  let cursor = 0;
  const expect = type => {
    const token = tokens[cursor++];
    if (token?.type !== type) throw new Error(`Expected ${type}, found ${token?.type || 'end'}: ${article.source_path}`);
    return token;
  };
  function inlineBlock(depth) { return inlines(expect('inline').children || [], depth); }
  function table(depth) {
    expect('thead_open'); expect('tr_open');
    const header = [], alignments = [];
    while (tokens[cursor]?.type === 'th_open') {
      const cell = expect('th_open');
      const alignment = (cell.attrGet('style') || '').match(/text-align:(left|center|right)/)?.[1] || 'left';
      alignments.push(alignment); header.push(inlineBlock(depth + 1)); expect('th_close');
    }
    expect('tr_close'); expect('thead_close');
    const rows = [];
    if (tokens[cursor]?.type === 'tbody_open') {
      expect('tbody_open');
      while (tokens[cursor]?.type === 'tr_open') {
        expect('tr_open'); const cells = [];
        while (tokens[cursor]?.type === 'td_open') { expect('td_open'); cells.push(inlineBlock(depth + 1)); expect('td_close'); }
        if (cells.length !== header.length) throw new Error('Native table has inconsistent columns');
        expect('tr_close'); rows.push(cells);
      }
      expect('tbody_close');
    }
    expect('table_close');
    if (!header.length) throw new Error('Native table requires a header');
    return { header, rows, alignments };
  }
  function blocks(until, depth = 0) {
    const result = [];
    while (cursor < tokens.length) {
      const token = tokens[cursor++];
      if (token.type === until) return result;
      consume(depth);
      const section = headingContext;
      let value;
      if (token.type === 'heading_open') {
        const raw = tokens[cursor];
        const title = text(tokenText(raw?.children || []).trim().replace(/\s+/g, ' '), 'heading title');
        const heading_id = slugger.slug(title);
        if (!heading_id || Buffer.byteLength(heading_id) > 256) throw new Error('Native heading ID must contain 1–256 bytes');
        const level = Number(token.tag.slice(1));
        headings.push({ id: heading_id, title, level }); headingContext = heading_id;
        value = { type: 'heading', heading_id, level, inlines: inlineBlock(depth + 1) };
        expect('heading_close');
        result.push({ id: stableID('heading', heading_id, heading_id), ...value }); continue;
      } else if (token.type === 'paragraph_open') {
        value = { type: 'paragraph', inlines: inlineBlock(depth + 1) }; expect('paragraph_close');
      } else if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
        const ordered = token.type === 'ordered_list_open';
        const items = [];
        while (tokens[cursor]?.type === 'list_item_open') {
          expect('list_item_open'); consume(depth + 1);
          const children = blocks('list_item_close', depth + 2);
          items.push({ id: stableID('item', children, section), blocks: children });
        }
        expect(ordered ? 'ordered_list_close' : 'bullet_list_close');
        value = { type: 'list', ordered, start: ordered ? Number(token.attrGet('start') || 1) : 1, items };
      } else if (token.type === 'blockquote_open') value = { type: 'quote', blocks: blocks('blockquote_close', depth + 1) };
      else if (token.type === 'fence' || token.type === 'code_block') {
        const language = token.info.trim().split(/\s+/)[0] || 'text';
        value = language === 'mermaid' ? { type: 'diagram', ...image('diagram', token.content, true) } : { type: 'code', language: text(language, 'code language'), text: text(token.content, 'code text') };
      } else if (token.type === 'math_block') value = { type: 'math', ...image('math', token.content, true) };
      else if (token.type === 'table_open') value = { type: 'table', table: table(depth) };
      else if (token.type === 'hr') value = { type: 'thematic_break' };
      else throw new Error(`Unsupported native block token ${token.type}: ${article.source_path}`);
      result.push({ id: stableID(value.type, value, section), ...value });
    }
    if (until) throw new Error(`Unclosed native block: ${until}`);
    return result;
  }
  const document = { schema_version: 1, article_id: article.id, source_sha256: article.source_sha256, blocks: blocks() };
  const search_text = tokenText(tokens).replace(/\s+/g, ' ').trim();
  const purpose = tokens.findIndex((token, index) => token.type === 'heading_open' && tokens[index + 1]?.content === 'この記事の目的');
  const summaryToken = purpose < 0 ? null : tokens.slice(purpose + 3).find(token => token.type === 'inline');
  const summary = summaryToken ? tokenText(summaryToken.children || []).trim().replace(/\s+/g, ' ').slice(0, 240) : search_text.slice(0, 240);
  return { document, headings, summary, search_text, requests };
}

function walk(value, visitor) {
  if (!value || typeof value !== 'object') return;
  visitor(value);
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) for (const item of child) walk(item, visitor);
    else walk(child, visitor);
  }
}

function safeOutputPath(file) {
  if (!/^(?:assets|articles)\/[a-zA-Z0-9/_.-]+\.(?:json|png|txt)$/.test(file) || file.split('/').includes('..')) throw new Error(`Unsafe native output asset: ${file}`);
}

function validateAsset(asset, files) {
  const { width, height, scale, baseline } = asset || {};
  if (![width, height, scale].every(value => Number.isFinite(value) && value > 0) || width > 8192 || height > 8192 || scale > 4 || (baseline !== undefined && (!Number.isFinite(baseline) || baseline < 0 || baseline > height))) throw new Error('Invalid native asset dimensions or baseline');
  for (const file of [asset.light, asset.dark]) {
    if (typeof file !== 'string' || !file.endsWith('.png') || !files.has(file)) throw new Error(`Missing native PNG asset: ${file}`);
    safeOutputPath(file);
    const bytes = files.get(file);
    if (!Buffer.isBuffer(bytes) || bytes.length < 33 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) || bytes.toString('ascii', 12, 16) !== 'IHDR') throw new Error(`Invalid native PNG: ${file}`);
    const pixelWidth = bytes.readUInt32BE(16), pixelHeight = bytes.readUInt32BE(20);
    if (!pixelWidth || !pixelHeight || pixelWidth > 8192 || pixelHeight > 8192 || pixelWidth * pixelHeight > 32000000 || Math.abs(pixelWidth - width * scale) > 2 || Math.abs(pixelHeight - height * scale) > 2) throw new Error(`Native PNG dimensions disagree with metadata: ${file}`);
  }
}

/** Counts include manifest.json, matching ContentValidator's on-device limits. */
export function validateNativePackageBounds({ fileCount, totalBytes, manifestBytes }) {
  if (![fileCount, totalBytes, manifestBytes].every(Number.isSafeInteger) || fileCount < 1 || manifestBytes < 1 || totalBytes < manifestBytes) {
    throw new Error('Invalid native package size accounting');
  }
  if (manifestBytes > 8 * 1024 * 1024) throw new Error('Native manifest exceeds 8388608 bytes');
  if (fileCount > 4096 || totalBytes > 256 * 1024 * 1024) throw new Error('Native package exceeds file count or byte size limit');
}

async function publishedArticles(root) {
  const articles = [];
  const sections = await readdir(path.join(root, 'docs'), { withFileTypes: true });
  for (const section of sections.sort((a, b) => comparePath([a.name], [b.name]))) {
    if (!/^\d{2}-[a-z0-9-]+$/.test(section.name)) continue;
    if (section.isSymbolicLink()) throw new Error(`Symlink is not permitted: docs/${section.name}`);
    if (!section.isDirectory()) continue;
    const files = await readdir(path.join(root, 'docs', section.name), { withFileTypes: true });
    for (const file of files.sort((a, b) => comparePath([a.name], [b.name]))) {
      if (file.name.toLowerCase() === 'readme.md' || !/^[a-z0-9-]+\.md$/.test(file.name)) continue;
      const sourcePath = `docs/${section.name}/${file.name}`;
      if (file.isSymbolicLink()) throw new Error(`Symlink is not permitted: ${sourcePath}`);
      if (!file.isFile()) continue;
      const source = (await readSource(root, sourcePath)).toString('utf8');
      const frontMatter = source.replace(/\r\n?/g, '\n').match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
      if (!frontMatter) throw new Error(`Front matter missing: ${sourcePath}`);
      const metadata = loadYaml(frontMatter[1], { schema: JSON_SCHEMA });
      if (!['draft', 'published'].includes(metadata?.status)) throw new Error(`Invalid article status: ${sourcePath}`);
      if (metadata.status === 'published') articles.push(parseArticle(source, sourcePath));
    }
  }
  if (!articles.length || articles.length > 2000) throw new Error('All-published selection must contain between 1 and 2000 articles');
  return articles;
}

async function allPublishedOutput(root, output) {
  if (typeof output !== 'string' || !output.trim()) throw new Error('allPublished requires an explicit temporary output directory');
  const destination = await validateOutput(root, output);
  const comparable = value => process.platform === 'darwin' || process.platform === 'win32' ? value.toLowerCase() : value;
  const actual = comparable(destination);
  for (const name of ['Content', 'TestContent']) {
    const standard = path.join(root, 'ios/AILibrary', name);
    const protectedPath = comparable(standard);
    if (actual === protectedPath || actual.startsWith(protectedPath + path.sep) || protectedPath.startsWith(actual + path.sep)) {
      throw new Error('All-published output must be separate from ordinary Content and TestContent');
    }
  }
  // validateOutput permits only the ordinary package or a symlink-free system
  // temporary child. The ordinary paths above are deliberately excluded here.
  if (path.basename(destination) !== 'Content') throw new Error('All-published temporary output must be named Content');
  return destination;
}

/** Build an offline, hashed JSON/PNG-only package. Browser use is injectable for tests. */
export async function buildNativeContent({ root, output, fixtures = false, allPublished = false, dependencies, selection } = {}) {
  if (typeof fixtures !== 'boolean') throw new Error('fixtures must be a boolean');
  if (typeof allPublished !== 'boolean') throw new Error('allPublished must be a boolean');
  if (allPublished && fixtures) throw new Error('allPublished cannot be combined with fixtures');
  root = await realpath(root);
  if (allPublished) output = await allPublishedOutput(root, output);
  else {
    output ??= path.join(root, fixtures ? 'ios/AILibrary/TestContent' : 'ios/AILibrary/Content');
    output = await validateOutput(root, output, { fixtures });
  }
  selection ||= JSON.parse(await readSource(root, 'ios/content-selection.json'));
  if (selection?.schema_version !== 1 || typeof selection.audio_article !== 'string') throw new Error('Invalid native content selection');
  if (!allPublished && (!Array.isArray(selection.articles) || selection.articles.length !== 3 || new Set(selection.articles).size !== 3 || !selection.articles.includes(selection.audio_article))) throw new Error('Select exactly three distinct articles and audio from one of them');
  const articles = allPublished ? await publishedArticles(root) : await Promise.all(selection.articles.map(async file => parseArticle((await readSource(root, file)).toString('utf8'), file)));
  if (fixtures) articles.push(parseArticle((await readSource(root, NATIVE_READER_FIXTURE.source_path)).toString('utf8'), NATIVE_READER_FIXTURE.source_path, { fixture: true }));
  const catalog = JSON.parse(await readSource(root, 'website/audio/catalog.json'));
  const audioArticle = articles.find(article => article.source_path === selection.audio_article);
  if (!audioArticle) throw new Error('Selected audio article must be included among published articles');
  const audio = [audioMetadata(catalog, audioArticle, selection.audio_article)];
  const selected = new Map(articles.map(article => [article.source_path, article.id]));
  const parsed = articles.map(article => parseNativeArticle(article, { selected }));
  const headings = new Map(articles.map((article, index) => [article.id, new Set(parsed[index].headings.map(heading => heading.id))]));
  for (const { document } of parsed) walk(document, node => {
    if (node.type !== 'link' || node.target.kind !== 'article') return;
    const destination = headings.get(node.target.article_id);
    if (!destination || (node.target.heading_id && !destination.has(node.target.heading_id))) throw new Error(`Unknown native article or heading link: ${JSON.stringify(node.target)}`);
  });
  const requests = new Map(parsed.flatMap(value => [...value.requests]));
  let descriptions = selection.diagram_descriptions ?? {};
  if (allPublished) {
    const fullDescriptions = JSON.parse(await readSource(root, 'ios/all-published-diagram-descriptions.json'));
    if (fullDescriptions?.schema_version !== 1 || !fullDescriptions.diagram_descriptions || typeof fullDescriptions.diagram_descriptions !== 'object' || Array.isArray(fullDescriptions.diagram_descriptions)) throw new Error('Invalid all-published diagram description map');
    descriptions = fullDescriptions.diagram_descriptions;
  }
  if (typeof descriptions !== 'object' || Array.isArray(descriptions)) throw new Error('Invalid native diagram descriptions');
  for (const [key, description] of Object.entries(descriptions)) {
    if (!/^[a-f0-9]{24}$/.test(key) || requests.get(key)?.kind !== 'diagram') throw new Error(`Unknown or stale native diagram description: ${key}`);
    if (!text(description, 'diagram description').trim() || Buffer.byteLength(description) > 16384) throw new Error('Invalid native diagram description');
  }
  if (allPublished || selection.diagram_descriptions !== undefined) for (const [key, request] of requests) {
    if (request.kind === 'diagram' && !Object.hasOwn(descriptions, key)) throw new Error(`Missing native diagram description: ${key}`);
  }
  dependencies ||= await loadNativeRenderingDependencies(root);
  const rendered = await dependencies.renderAssets(requests);
  if (!(rendered?.files instanceof Map) || !(rendered?.metadata instanceof Map)) throw new Error('Native renderer must return files and metadata Maps');
  const assets = new Map(rendered.files);
  assets.set('assets/licenses/NOTICE.txt', await readSource(root, 'LICENSE'));
  const manifestArticles = articles.map((article, index) => {
    const value = parsed[index];
    walk(value.document, node => {
      if (!node[assetKey]) return;
      const metadata = rendered.metadata.get(node[assetKey]);
      if (!metadata) throw new Error(`Missing native rendered metadata: ${node[assetKey]}`);
      validateAsset(metadata.asset, assets);
      if (!text(metadata.accessibility_text, 'asset accessibility text').trim()) throw new Error('Missing native asset accessibility text');
      node.asset = metadata.asset;
      const description = descriptions[node[assetKey]];
      node.accessibility_text = description ? `${description}\n図中のラベル: ${metadata.accessibility_text}` : metadata.accessibility_text;
    });
    const document_path = fileFor(article.id);
    const data = Buffer.from(`${JSON.stringify(value.document, null, 2)}\n`);
    if (data.length > maxDocumentBytes) throw new Error(`Native document exceeds ${maxDocumentBytes} bytes: ${article.id}`);
    assets.set(document_path, data);
    const { body, normalized_digest, ...metadata } = article;
    return { ...metadata, document_path, summary: value.summary, search_text: value.search_text, headings: value.headings, ...(article === audioArticle ? { audio_id: audio[0].id } : {}) };
  });
  for (const [file, data] of assets) {
    safeOutputPath(file);
    if (!Buffer.isBuffer(data)) throw new Error(`Native asset must be a Buffer: ${file}`);
    if (file.endsWith('.png') && data.length > maxPNGBytes) throw new Error(`Native PNG exceeds ${maxPNGBytes} bytes: ${file}`);
  }
  const files = Object.fromEntries([...assets].sort(comparePath).map(([file, data]) => [file, sha256(data)]));
  const manifestBody = { schema_version: 2, articles: manifestArticles, audio, files };
  const manifest = { schema_version: 2, revision: sha256(JSON.stringify(manifestBody)), articles: manifestArticles, audio, files };
  const manifestData = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
  validateNativePackageBounds({ fileCount: assets.size + 1,
    totalBytes: [...assets.values()].reduce((size, data) => size + data.length, manifestData.length),
    manifestBytes: manifestData.length });
  // Finish parsing, reference checks and asset validation before replacing generated output.
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const [file, data] of assets) { await mkdir(path.dirname(path.join(output, file)), { recursive: true }); await writeFile(path.join(output, file), data); }
  await writeFile(path.join(output, 'manifest.json'), manifestData);
  return manifest;
}
