import path from 'node:path';
import { realpath } from 'node:fs/promises';
import MarkdownIt from 'markdown-it';
import { parseFrontMatter, parseScalar, parseTagsArray, splitLocalDestination, toLines } from './md-utils.mjs';
import { parseMarkdownLinks } from './markdown-links.mjs';
import { readSource, rewriteLink, sha256 } from './ios-content.mjs';

export const NATIVE_LEARNING_PATH = 'assets/learning/index.json';
const maxSourceBytes = 16 * 1024 * 1024;
const maxLearningBytes = 4 * 1024 * 1024;
const maxStringBytes = 16384;
const parser = new MarkdownIt({ html: false, linkify: false, typographer: false });
const articlePattern = /^\d{2}-[a-z0-9-]+\/[a-z0-9-]+$/;
const sortedObject = values => Object.fromEntries([...values].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));

function text(value, label, { empty = false } = {}) {
  if (typeof value !== 'string' || (!empty && !value.trim()) || Buffer.byteLength(value) > maxStringBytes) {
    throw new Error(`Invalid or oversized learning ${label}`);
  }
  return value;
}

function plain(tokens = []) {
  return tokens.map(token => {
    if (['text', 'code_inline'].includes(token.type)) return token.content;
    if (['softbreak', 'hardbreak'].includes(token.type)) return '\n';
    if (token.children) return plain(token.children);
    if (token.nesting) return '';
    throw new Error(`Unsupported learning inline: ${token.type}`);
  }).join('');
}

function body(source) {
  const lines = toLines(source);
  const fm = parseFrontMatter(lines);
  if (fm?.unclosed || fm?.errors.length) throw new Error('Invalid learning source front matter');
  if (fm) lines.fill('', 0, fm.endLine);
  return lines.join('\n');
}

function tableRows(tokens) {
  const rows = [];
  let inBody = false;
  let row;
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token.type === 'tbody_open') inBody = true;
    if (token.type === 'tbody_close') inBody = false;
    if (inBody && token.type === 'tr_open') row = [];
    if (inBody && token.type === 'inline' && row) row.push(token.children || []);
    if (inBody && token.type === 'tr_close' && row) { rows.push(row); row = undefined; }
  }
  return rows;
}

function links(tokens) {
  const result = [];
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token.type === 'image') throw new Error('Learning metadata does not support images');
    if (token.type !== 'link_open') continue;
    const close = tokens.findIndex((next, nextIndex) => nextIndex > index && next.type === 'link_close');
    if (close < 0) throw new Error('Unclosed learning link');
    result.push({ href: token.attrGet('href'), label: text(plain(tokens.slice(index + 1, close)), 'link label') });
    index = close;
  }
  return result;
}

/** Optional, hash-listed metadata. It does not add fields to manifest2 or document1. */
export async function buildNativeLearningIndex({ root, articles } = {}) {
  if (!Array.isArray(articles) || articles.length < 1 || articles.length > 2000) throw new Error('Invalid learning article count');
  root = await realpath(root);
  const bySource = new Map();
  const byID = new Map();
  const sourceSHAs = new Map();
  const sources = new Map();
  const read = async file => {
    if (!sources.has(file)) {
      const bytes = await readSource(root, file);
      if (!bytes.length || bytes.length > maxSourceBytes) throw new Error(`Invalid or oversized learning source: ${file}`);
      sources.set(file, bytes.toString('utf8'));
      sourceSHAs.set(file, sha256(bytes));
    }
    return sources.get(file);
  };
  const tags = new Map();
  for (const article of articles) {
    if (!article || !articlePattern.test(article.id) || article.source_path !== `docs/${article.id}.md` ||
        !/^[a-f0-9]{64}$/.test(article.source_sha256) || !Array.isArray(article.headings) ||
        article.headings.some(heading => !heading || typeof heading.id !== 'string') ||
        byID.has(article.id) || bySource.has(article.source_path)) throw new Error('Invalid or duplicate learning article');
    byID.set(article.id, article);
    bySource.set(article.source_path, article);
    const source = await read(article.source_path);
    if (sourceSHAs.get(article.source_path) !== article.source_sha256) throw new Error(`Stale learning article source: ${article.id}`);
    const fm = parseFrontMatter(toLines(source));
    const fields = fm?.fields.filter(field => field.key === 'tags');
    if (!fm || fm.unclosed || fm.errors.length || fields.length !== 1) throw new Error(`Missing or invalid learning tags: ${article.id}`);
    const values = parseTagsArray(fields[0].value);
    if (!values || values.length > 64 || new Set(values).size !== values.length ||
        values.some(value => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || value.length > 128)) {
      throw new Error(`Invalid or duplicate learning tags: ${article.id}`);
    }
    tags.set(article.id, values);
  }

  if (!bySource.has('docs/00-overview/learning-roadmap.md')) throw new Error('Learning metadata requires the published learning-roadmap article');
  const chapters = [];
  const chapterIDs = new Set([...byID.keys()].map(id => id.split('/')[0]));
  if (chapterIDs.size > 100) throw new Error('Learning metadata exceeds 100 chapters');
  for (const id of [...chapterIDs].sort()) {
    const sourcePath = `docs/${id}/README.md`;
    const tokens = parser.parse(await read(sourcePath), {});
    const heading = tokens.findIndex(token => token.type === 'heading_open' && token.tag === 'h1');
    if (heading < 0) throw new Error(`Missing learning chapter title: ${id}`);
    const title = text(plain(tokens[heading + 1]?.children), 'chapter title');
    const paragraph = tokens.slice(heading + 3).findIndex(token => token.type === 'paragraph_open' && token.level === 0);
    if (paragraph < 0) throw new Error(`Missing learning chapter description: ${id}`);
    const description = text(plain(tokens[heading + 4 + paragraph]?.children), 'chapter description');
    const articleIDs = [];
    for (const row of tableRows(tokens)) for (const cell of row) for (const link of links(cell)) {
      const target = splitLocalDestination(link.href);
      if (target.error) throw new Error(`Invalid learning chapter link: ${link.href}`);
      if (target.external || !/^(?:\.\/)?[a-z0-9-]+\.md$/.test(target.pathname)) continue;
      const resolved = path.posix.join(`docs/${id}`, target.pathname);
      const article = bySource.get(resolved);
      if (!article) {
        // Linked drafts do not contribute metadata, but typos must not disappear silently.
        const bytes = await readSource(root, resolved);
        if (bytes.length > maxSourceBytes) throw new Error(`Oversized learning chapter draft: ${resolved}`);
        const fm = parseFrontMatter(toLines(bytes.toString('utf8')));
        const statuses = fm?.fields.filter(field => field.key === 'status');
        if (!fm || fm.unclosed || fm.errors.length || statuses.length !== 1 || parseScalar(statuses[0].value) !== 'draft') throw new Error(`Unknown learning chapter article: ${resolved}`);
        continue;
      }
      if (articleIDs.includes(article.id)) throw new Error(`Duplicate learning chapter article: ${article.id}`);
      articleIDs.push(article.id);
    }
    const expected = [...byID.keys()].filter(article => article.startsWith(`${id}/`));
    if (articleIDs.length !== expected.length || expected.some(article => !articleIDs.includes(article))) throw new Error(`Incomplete learning chapter order: ${id}`);
    chapters.push({ id, title, description, article_ids: articleIDs });
  }

  const destination = (href, sourcePath) => {
    const split = splitLocalDestination(href);
    if (split.error) throw new Error(`Invalid learning destination: ${href}`);
    if (split.external) {
      const url = new URL(href);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`Learning external destination requires HTTPS: ${href}`);
      return { type: 'external', url: text(url.href, 'external URL') };
    }
    if (split.suffix.startsWith('?')) throw new Error(`Learning internal destinations cannot contain a query: ${href}`);
    const resolved = split.pathname ? path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), split.pathname)) : sourcePath;
    if (resolved.startsWith('../') || resolved.startsWith('/') || resolved.includes('\\')) throw new Error(`Unsafe learning destination: ${href}`);
    const article = bySource.get(resolved);
    if (article) {
      if (split.fragment && (Buffer.byteLength(split.fragment) > 256 || !article.headings.some(heading => heading.id === split.fragment))) throw new Error(`Unknown learning article heading: ${href}`);
      return { type: 'article', article_id: article.id, ...(split.fragment ? { heading_id: text(split.fragment, 'article heading') } : {}) };
    }
    const chapter = resolved.match(/^docs\/(\d{2}-[a-z0-9-]+)\/README\.md$/)?.[1];
    if (chapterIDs.has(chapter) && !split.fragment) return { type: 'chapter', chapter_id: chapter };
    // Relative article typos must not silently become external links.
    if (/^docs\/\d{2}-[a-z0-9-]+\/[a-z0-9-]+\.md$/.test(resolved)) throw new Error(`Unknown learning article: ${href}`);
    const rewritten = rewriteLink(href, sourcePath, bySource);
    const url = new URL(rewritten.href);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`Learning external destination requires HTTPS: ${href}`);
    return { type: 'external', url: text(url.href, 'external URL') };
  };
  const routeInlines = tokens => {
    const result = [];
    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index];
      if (token.type === 'link_open') {
        const close = tokens.findIndex((next, nextIndex) => nextIndex > index && next.type === 'link_close');
        if (close < 0) throw new Error('Unclosed learning route link');
        result.push({ type: 'link', text: text(plain(tokens.slice(index + 1, close)), 'route link label'), target: destination(token.attrGet('href'), 'docs/00-overview/learning-roadmap.md') });
        index = close;
      } else if (!token.nesting) {
        result.push({ type: 'text', text: text(plain([token]), 'route text', { empty: true }) });
      }
    }
    return result;
  };
  const routeSource = await read('docs/00-overview/learning-roadmap.md');
  const routeTokens = parser.parse(body(routeSource), {});
  const routeHeadings = routeTokens.flatMap((token, index) => token.type === 'heading_open' && plain(routeTokens[index + 1]?.children) === '読者タイプ別の推奨ルート' ? [index] : []);
  if (routeHeadings.length !== 1) throw new Error('Missing or duplicate learning route section');
  const routeStart = routeHeadings[0];
  const routeLevel = Number(routeTokens[routeStart].tag.slice(1));
  const routeEnd = routeTokens.findIndex((token, index) => index > routeStart && token.type === 'heading_open' && Number(token.tag.slice(1)) <= routeLevel);
  const routes = tableRows(routeTokens.slice(routeStart, routeEnd < 0 ? undefined : routeEnd)).map(row => {
    if (row.length !== 3) throw new Error('Learning routes require three columns');
    const type = plain(row[0]).trim().match(/^([A-H]):\s*(.+)$/);
    if (!type) throw new Error('Invalid learning route identity');
    const steps = [{ inlines: [] }];
    for (const inline of routeInlines(row[2])) {
      if (inline.type === 'link') steps.at(-1).inlines.push(inline);
      else {
        const chunks = inline.text.split('→');
        chunks.forEach((chunk, index) => {
          if (index) steps.push({ inlines: [] });
          if (chunk) steps.at(-1).inlines.push({ type: 'text', text: chunk });
        });
      }
    }
    for (const step of steps) {
      if (step.inlines[0]?.type === 'text') step.inlines[0].text = step.inlines[0].text.trimStart();
      if (step.inlines.at(-1)?.type === 'text') step.inlines.at(-1).text = step.inlines.at(-1).text.trimEnd();
      step.inlines = step.inlines.filter(inline => inline.type !== 'text' || inline.text);
      if (!step.inlines.length) throw new Error('Empty learning route step');
      if (step.inlines.length > 64) throw new Error('Learning route step exceeds 64 inlines');
    }
    if (steps.length > 128) throw new Error('Learning route exceeds 128 steps');
    return { id: type[1], label: text(type[2], 'route label'), persona: text(plain(row[1]).trim(), 'route persona'), steps };
  });
  if (routes.map(route => route.id).join('') !== 'ABCDEFGH') throw new Error('Learning routes must contain A through H once in source order');

  const glossarySource = await read('GLOSSARY.md');
  const glossaryTokens = parser.parse(glossarySource, {});
  const glossaryHeadings = parseMarkdownLinks(glossarySource).headings;
  const glossary = [];
  for (let index = 0; index < glossaryTokens.length; index++) {
    const token = glossaryTokens[index];
    if (token.type !== 'heading_open' || token.tag !== 'h3') continue;
    const heading = glossaryHeadings.find(value => value.line === token.map[0] + 1);
    if (!heading) throw new Error('Missing learning glossary anchor');
    const end = glossaryTokens.findIndex((next, nextIndex) => nextIndex > index && next.type === 'heading_open' && Number(next.tag.slice(1)) <= 3);
    const section = glossaryTokens.slice(index + 3, end < 0 ? undefined : end);
    const paragraph = section.findIndex(next => next.type === 'paragraph_open' && next.level === 0);
    if (paragraph < 0) throw new Error(`Missing learning glossary definition: ${heading.id}`);
    const name = heading.text.match(/^(.+?)\s*(?:[（(](.+)[）)])?$/);
    const details = section.filter(next => next.type === 'inline').flatMap(next => links(next.children || [])).map(link => ({ label: link.label, target: destination(link.href, 'GLOSSARY.md') }));
    if (details.length > 256) throw new Error('Learning glossary term exceeds 256 links');
    glossary.push({ id: text(heading.id, 'glossary ID'), name: text(name[1].trim(), 'term name'), english: name[2] ? text(name[2].trim(), 'English term') : null,
      summary: text(plain(section[paragraph + 1]?.children).trim(), 'term definition'), links: details });
  }
  if (!glossary.length || glossary.length > 2000 || new Set(glossary.map(entry => entry.id)).size !== glossary.length) throw new Error('Invalid learning glossary entries');
  const result = { schema_version: 1, source_sha256: sortedObject(sourceSHAs), article_tags: sortedObject(tags), chapters, routes, glossary };
  if (Buffer.byteLength(`${JSON.stringify(result, null, 2)}\n`) > maxLearningBytes) throw new Error('Learning metadata exceeds 4194304 bytes');
  return result;
}
