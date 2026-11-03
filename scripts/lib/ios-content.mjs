import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { lstat, mkdir, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import MarkdownIt from 'markdown-it';
import GithubSlugger from 'github-slugger';
import { load as loadYaml, JSON_SCHEMA } from 'js-yaml';

export const PUBLIC_SITE = 'https://pero3dev.github.io/ai-agent-library';
export const NATIVE_READER_FIXTURE = Object.freeze({ source_path: 'ios/fixtures/native-reader.md', id: 'test-fixtures/native-reader' });
export const sha256 = value => createHash('sha256').update(value).digest('hex');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const articlePattern = /^docs\/\d{2}-[a-z0-9-]+\/[a-z0-9-]+\.md$/;
const idFor = source => source.replace(/^docs\//, '').replace(/\.md$/, '');
const fileFor = id => `articles/${id.replaceAll('/', '--')}.html`;
const comparePath = ([a], [b]) => a < b ? -1 : a > b ? 1 : 0;

export async function rejectSymlinks(file) {
  const absolute = path.resolve(file);
  const { root } = path.parse(absolute);
  let current = root;
  for (const part of absolute.slice(root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try {
      if ((await lstat(current)).isSymbolicLink()) throw new Error(`Symlink is not permitted: ${current}`);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}

export async function readSource(root, relative) {
  if (typeof relative !== 'string' || relative.includes('\\') || relative.includes('\0') || path.posix.isAbsolute(relative) || relative.split('/').includes('..')) throw new Error(`Unsafe source path: ${relative}`);
  const file = path.resolve(root, relative);
  if (!file.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error(`Source escapes root: ${relative}`);
  await rejectSymlinks(file);
  return readFile(file);
}

export async function validateOutput(root, output, { fixtures = false } = {}) {
  if (typeof fixtures !== 'boolean') throw new Error('fixtures must be a boolean');
  let absolute = path.resolve(output);
  const expected = path.join(path.resolve(root), fixtures ? 'ios/AILibrary/TestContent' : 'ios/AILibrary/Content');
  const temp = await realpath(os.tmpdir());
  // Normalize the system temp alias (e.g. /var -> /private/var on macOS).
  const tempAlias = path.resolve(os.tmpdir());
  if (absolute.startsWith(`${tempAlias}${path.sep}`)) absolute = path.join(temp, path.relative(tempAlias, absolute));
  const candidate = path.relative(temp, absolute);
  const isTemporary = !candidate.startsWith('..') && !path.isAbsolute(candidate) && /^ailibrary-ios-[^/\\]+[/\\].+/.test(candidate);
  const otherPackage = path.join(path.resolve(root), fixtures ? 'ios/AILibrary/Content' : 'ios/AILibrary/TestContent');
  const overlapsOtherPackage = absolute === otherPackage || absolute.startsWith(otherPackage + path.sep) || otherPackage.startsWith(absolute + path.sep);
  if (overlapsOtherPackage || absolute !== expected && !isTemporary) throw new Error(`Output must be ${fixtures ? 'ios/AILibrary/TestContent' : 'ios/AILibrary/Content'} or a child of a temporary ailibrary-ios-* directory`);
  // macOS /var is a system symlink. Resolve the existing temp root, but reject
  // application-controlled symlinks from that root downward.
  if (isTemporary) await rejectSymlinks(path.join(temp, candidate));
  else await rejectSymlinks(absolute);
  return absolute;
}

export function parseArticle(source, sourcePath, { fixture = false } = {}) {
  if (typeof fixture !== 'boolean') throw new Error('fixture must be a boolean');
  if (fixture ? sourcePath !== NATIVE_READER_FIXTURE.source_path : !articlePattern.test(sourcePath)) throw new Error(`Invalid article selection: ${sourcePath}`);
  const normalized = source.replace(/\r\n?/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) throw new Error(`Front matter missing: ${sourcePath}`);
  const metadata = loadYaml(match[1], { schema: JSON_SCHEMA });
  for (const key of ['title', 'category', 'level', 'last_updated']) if (typeof metadata?.[key] !== 'string' || !metadata[key].trim()) throw new Error(`Missing ${key}: ${sourcePath}`);
  if (metadata.status !== (fixture ? 'test-fixture' : 'published')) throw new Error(`Only ${fixture ? 'explicit test-fixture' : 'published'} articles can be bundled: ${sourcePath}`);
  return { id: fixture ? NATIVE_READER_FIXTURE.id : idFor(sourcePath), ...(fixture ? { is_test_fixture: true } : {}), source_path: sourcePath, source_sha256: sha256(source), normalized_digest: sha256(normalized), title: metadata.title, category: metadata.category, level: metadata.level, last_updated: metadata.last_updated, body: normalized.slice(match[0].length) };
}

export function rewriteLink(href, sourcePath, selected) {
  if (href.startsWith('#')) return { href };
  if (/^https?:\/\//i.test(href)) {
    const url = new URL(href);
    if (url.username || url.password) throw new Error('Credentials in a link are not permitted');
    return { href: url.href };
  }
  if (/^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith('//')) throw new Error(`Unsupported link: ${href}`);
  const parts = href.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  let pathname;
  try { pathname = decodeURIComponent(parts[1]); } catch { throw new Error(`Malformed link: ${href}`); }
  if (pathname.includes('\\') || pathname.includes('\0') || pathname.startsWith('/')) throw new Error(`Unsafe link: ${href}`);
  const target = path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), pathname));
  if (target.startsWith('../')) throw new Error(`Link escapes repository: ${href}`);
  const fragment = parts[3] || '';
  if (selected.has(target)) {
    const articleID = selected instanceof Map ? selected.get(target) : idFor(target);
    if (typeof articleID !== 'string' || !/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(articleID)) throw new Error(`Invalid selected article ID: ${articleID}`);
    return { href: `${path.posix.basename(fileFor(articleID))}${fragment}`, article_id: articleID, fragment: decodeURIComponent(fragment.slice(1)) };
  }
  const docs = target.match(/^docs\/\d{2}-([^/]+)\/(.+)\.md$/);
  if (docs) return { href: `${PUBLIC_SITE}/docs/${docs[1]}${docs[2] === 'README' ? '' : `/${docs[2]}`}${parts[2] || ''}${fragment}` };
  if (target === 'GLOSSARY.md') return { href: `${PUBLIC_SITE}/glossary${fragment}` };
  if (target === 'README.md') return { href: `${PUBLIC_SITE}/${fragment}` };
  const example = target.match(/^examples\/python\/([^/]+)\/README\.md$/);
  if (example) return { href: `${PUBLIC_SITE}/docs/examples/${example[1]}${fragment}` };
  return { href: `https://github.com/pero3dev/ai-agent-library/blob/main/${target.split('/').map(encodeURIComponent).join('/')}${fragment}` };
}

export function installMath(md, renderMath) {
  md.inline.ruler.before('escape', 'ios_math', (state, silent) => {
    const start = state.pos;
    if (state.src[start] !== '$' || state.src[start + 1] === '$' || /\s/.test(state.src[start + 1] || ' ')) return false;
    let end = start + 1;
    while ((end = state.src.indexOf('$', end)) !== -1) {
      if (state.src[end - 1] !== '\\' && !/\s/.test(state.src[end - 1])) break;
      end++;
    }
    if (end === -1 || /\d/.test(state.src[end + 1] || '')) return false;
    if (!silent) { const token = state.push('math_inline', 'math', 0); token.content = state.src.slice(start + 1, end); }
    state.pos = end + 1;
    return true;
  });
  md.block.ruler.before('fence', 'ios_math_block', (state, startLine, endLine, silent) => {
    if (state.src.slice(state.bMarks[startLine] + state.tShift[startLine], state.eMarks[startLine]).trim() !== '$$') return false;
    let end = startLine + 1;
    while (end < endLine && state.src.slice(state.bMarks[end] + state.tShift[end], state.eMarks[end]).trim() !== '$$') end++;
    if (end >= endLine) throw new Error('Unclosed display math');
    if (silent) return true;
    const token = state.push('math_block', 'math', 0);
    token.block = true; token.content = state.getLines(startLine + 1, end, state.blkIndent, false);
    state.line = end + 1;
    return true;
  });
  md.renderer.rules.math_inline = (tokens, index) => renderMath(tokens[index].content, false);
  md.renderer.rules.math_block = (tokens, index) => `<div class="math-display" tabindex="0" role="group" aria-label="数式。左右にスクロールできます">${renderMath(tokens[index].content, true)}</div>\n`;
}

export function tokenText(tokens) {
  return tokens.map(token => token.children ? tokenText(token.children) : ['text', 'code_inline', 'math_inline', 'math_block', 'fence', 'code_block'].includes(token.type) ? token.content : ['softbreak', 'hardbreak'].includes(token.type) ? '\n' : '').join(' ');
}

export function renderArticle(article, { selected, diagrams, renderMath }) {
  const md = new MarkdownIt({ html: false, linkify: false, typographer: false });
  installMath(md, renderMath);
  const tokens = md.parse(article.body, {});
  const headings = [];
  const slugger = new GithubSlugger();
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token.type === 'heading_open') {
      const title = tokenText(tokens[index + 1].children || []).trim().replace(/\s+/g, ' ');
      const id = slugger.slug(title);
      token.attrSet('id', id);
      headings.push({ id, title, level: Number(token.tag.slice(1)) });
    }
  }
  const link = md.renderer.rules.link_open || ((values, index, options, env, self) => self.renderToken(values, index, options));
  md.renderer.rules.link_open = (values, index, options, env, self) => {
    const token = values[index];
    const destination = rewriteLink(token.attrGet('href'), article.source_path, selected);
    token.attrSet('href', destination.href);
    if (destination.article_id) { token.attrSet('data-article-id', destination.article_id); token.attrSet('data-fragment', destination.fragment); }
    else if (!destination.href.startsWith('#')) token.attrSet('rel', 'noreferrer');
    return link(values, index, options, env, self);
  };
  md.renderer.rules.image = (values, index) => { throw new Error(`Images must be explicitly bundled: ${values[index].attrGet('src')}`); };
  let block = 0;
  md.renderer.rules.fence = (values, index) => {
    const token = values[index];
    const language = token.info.trim().split(/\s+/)[0] || 'text';
    const key = sha256(token.content.trim()).slice(0, 24);
    if (language === 'mermaid') {
      if (!diagrams.has(key)) throw new Error(`Missing rendered diagram: ${key}`);
      return `<figure><div class="horizontal-scroll" tabindex="0" role="group" aria-label="図。左右にスクロールできます"><picture><source media="(prefers-color-scheme: dark)" srcset="../assets/diagrams/${key}-dark.svg"><img src="../assets/diagrams/${key}-light.svg" alt="${escape(article.title)}の構成図。図の内容は直前・直後の本文と図のソースでも説明しています。"></picture></div><figcaption>図は横にスクロールできます。ピンチ操作で拡大できます。</figcaption><details class="diagram-source"><summary>図のテキスト表現を読む</summary><pre>${escape(token.content)}</pre></details></figure>\n`;
    }
    const id = `code-${++block}`;
    return `<div class="code-block"><div class="code-toolbar"><span>${escape(language)}</span><button type="button" data-copy="${id}" aria-label="${escape(language)}のコードをコピー">コピー</button></div><pre tabindex="0" role="group" aria-label="${escape(language)}のコード。左右にスクロールできます"><code id="${id}">${escape(token.content)}</code></pre></div>\n`;
  };
  md.renderer.rules.table_open = () => '<div class="horizontal-scroll" tabindex="0" role="group" aria-label="表。左右にスクロールできます"><table>\n';
  md.renderer.rules.table_close = () => '</table></div>\n';
  const body = md.renderer.render(tokens, md.options, {});
  const text = tokenText(tokens).replace(/\s+/g, ' ').trim();
  const purpose = tokens.findIndex((token, index) => token.type === 'heading_open' && tokens[index + 1]?.content === 'この記事の目的');
  const summaryToken = purpose < 0 ? null : tokens.slice(purpose + 3).find(token => token.type === 'inline');
  const summary = summaryToken ? tokenText(summaryToken.children || []).trim().replace(/\s+/g, ' ').slice(0, 240) : text.slice(0, 240);
  const csp = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; connect-src 'none'; media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
  const html = `<!doctype html>\n<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${escape(csp)}"><title>${escape(article.title)}</title><link rel="stylesheet" href="../assets/katex/katex.min.css"><link rel="stylesheet" href="../assets/reader.css"><script src="../assets/reader.js" defer></script></head><body><main aria-label="記事本文"><p class="metadata">${escape(article.category)} · ${escape(article.level)} · 更新 ${escape(article.last_updated)} · オフライン試作</p>${body}<p class="source-note"><a href="${PUBLIC_SITE}/docs/${article.id.replace(/^\d{2}-/, '')}" rel="noreferrer">公開サイトで原本を見る</a></p></main><div id="reader-status" class="reader-status" role="status" aria-live="polite"></div></body></html>\n`;
  return { html, summary, search_text: text, headings };
}

export async function loadRenderingDependencies(root) {
  const toolsRoot = process.env.IOS_TOOLS_DIR ? path.resolve(root, process.env.IOS_TOOLS_DIR) : path.join(root, 'ios/tools');
  const require = createRequire(path.join(toolsRoot, 'package.json'));
  let katex, chromium, mermaidDist;
  try {
    katex = (await import(pathToFileURL(require.resolve('katex/dist/katex.mjs')).href)).default;
    const playwright = await import(pathToFileURL(require.resolve('@playwright/test')).href);
    chromium = playwright.chromium || playwright.default?.chromium;
    if (!chromium) throw new Error('Playwright chromium export is unavailable');
    mermaidDist = path.dirname(require.resolve('mermaid/dist/mermaid.esm.min.mjs'));
  } catch (error) { throw new Error(`Rendering dependencies are required. Run npm ci --prefix ios/tools, or set IOS_TOOLS_DIR. ${error.message}`); }
  const dist = path.dirname(require.resolve('katex/dist/katex.min.css'));
  const mathAssets = new Map([['assets/katex/katex.min.css', await readFile(path.join(dist, 'katex.min.css'))], ['assets/katex/LICENSE.txt', await readFile(require.resolve('katex/LICENSE'))]]);
  for (const name of (await readdir(path.join(dist, 'fonts'))).sort()) mathAssets.set(`assets/katex/fonts/${name}`, await readFile(path.join(dist, 'fonts', name)));
  return {
    renderMath: (source, displayMode) => katex.renderToString(source, { displayMode, throwOnError: true, strict: 'error', trust: false, output: 'htmlAndMathml', maxExpand: 1000 }),
    renderDiagrams: diagrams => renderDiagrams(diagrams, { chromium, mermaidDist }),
    mathAssets
  };
}

export async function renderDiagrams(diagrams, { chromium, mermaidDist }) {
  if (!diagrams.size) return new Map();
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
      if (pathname === '/') { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><html lang="ja"><body></body></html>'); return; }
      if (pathname.includes('..') || pathname.includes('\\') || !/\.m?js$/.test(pathname)) { response.writeHead(403).end(); return; }
      const file = path.resolve(mermaidDist, `.${pathname}`);
      if (!file.startsWith(`${mermaidDist}${path.sep}`)) { response.writeHead(403).end(); return; }
      response.setHeader('Content-Type', 'text/javascript'); response.end(await readFile(file));
    } catch { response.writeHead(404).end(); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  let browser;
  try {
    browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    const origin = `http://127.0.0.1:${server.address().port}`;
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.goto(origin);
    await page.evaluate(async () => { window.mermaid = (await import('/mermaid.esm.min.mjs')).default; });
    const assets = new Map();
    for (const [key, source] of [...diagrams].sort(comparePath)) for (const theme of ['light', 'dark']) {
      const svg = await page.evaluate(async ({ key, source, theme }) => {
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', suppressErrorRendering: true, deterministicIds: true, deterministicIDSeed: `${key}-${theme}`, theme: theme === 'dark' ? 'dark' : 'default', fontFamily: 'Arial, sans-serif', flowchart: { htmlLabels: false } });
        const host = document.createElement('div'); document.body.append(host);
        try {
          const { svg } = await mermaid.render(`m${key}${theme}`, source, host);
          host.innerHTML = svg;
          const element = host.querySelector('svg');
          const bounds = element.getAttribute('viewBox').split(/\s+/).map(Number);
          if (bounds.length !== 4 || !bounds.slice(2).every(size => Number.isFinite(size) && size > 0)) throw new Error('Invalid SVG bounds');
          element.setAttribute('width', String(bounds[2])); element.setAttribute('height', String(bounds[3]));
          const result = new XMLSerializer().serializeToString(element);
          if (new DOMParser().parseFromString(result, 'image/svg+xml').querySelector('parsererror')) throw new Error('Invalid SVG XML');
          return result;
        } finally { host.remove(); }
      }, { key, source, theme });
      if (/<script\b|\son[a-z]+\s*=|(?:href|src)\s*=\s*["'](?:https?:|\/\/|javascript:)|url\(\s*["']?(?:https?:|\/\/)|@import/i.test(svg)) throw new Error('Unsafe SVG generated');
      assets.set(`assets/diagrams/${key}-${theme}.svg`, Buffer.from(svg));
    }
    return assets;
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
}

export function audioMetadata(catalog, article, sourcePath) {
  if (catalog?.schema_version !== 1 || !Array.isArray(catalog.episodes)) throw new Error('Invalid audio catalog schema');
  const episodes = catalog.episodes.filter(episode => episode.article_path === sourcePath);
  if (episodes.length !== 1 || episodes[0].parts !== 1) throw new Error('Prototype requires exactly one complete audio episode');
  const episode = episodes[0];
  const url = new URL(episode.audio_url);
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.username || url.password || url.port || url.search || url.hash || !/^\/pero3dev\/ai-agent-library\/releases\/download\/[^/]+\/[^/]+\.mp3$/.test(url.pathname)) throw new Error('Audio must use an existing versioned repository release');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,199}$/.test(episode.id || '') || typeof episode.title !== 'string' || !episode.title.trim() || !/^[a-f0-9]{64}$/.test(episode.audio_sha256) || !/^[a-f0-9]{64}$/.test(episode.source_digest) || !Number.isFinite(episode.duration_seconds) || !(episode.duration_seconds > 0) || episode.duration_seconds > 86_400 || typeof episode.attribution !== 'string' || !episode.attribution.trim() || !Array.isArray(episode.voices) || !Array.isArray(episode.chapters) || !episode.chapters.length) throw new Error('Invalid audio metadata');
  const licenseURLs = [...new Set(episode.voices.map(voice => voice.license_url))];
  if (licenseURLs.length !== 1 || new URL(licenseURLs[0]).protocol !== 'https:') throw new Error('Audio credit requires a shared HTTPS license URL');
  let previous = -1;
  const chapterIDs = new Set();
  for (const chapter of episode.chapters) {
    if (typeof chapter.id !== 'string' || !chapter.id || chapterIDs.has(chapter.id) || typeof chapter.title !== 'string' || !chapter.title.trim() || !Number.isFinite(chapter.start_seconds) || chapter.start_seconds < 0 || chapter.start_seconds <= previous || chapter.start_seconds >= episode.duration_seconds) throw new Error('Invalid audio chapter');
    previous = chapter.start_seconds;
    chapterIDs.add(chapter.id);
  }
  return { id: episode.id, title: episode.title, article_id: article.id, url: url.href, duration_seconds: episode.duration_seconds, sha256: episode.audio_sha256, credit: episode.attribution, license_url: licenseURLs[0], source_digest: episode.source_digest, source_is_current: episode.source_digest === article.normalized_digest, chapters: episode.chapters.map(({ id, title, start_seconds }) => ({ id, title, start_seconds })) };
}

export async function buildContent({ root, output = path.join(root, 'ios/AILibrary/Content'), dependencies, selection } = {}) {
  root = await realpath(root);
  output = await validateOutput(root, output);
  selection ||= JSON.parse(await readSource(root, 'ios/content-selection.json'));
  if (selection.schema_version !== 1 || !Array.isArray(selection.articles) || selection.articles.length !== 3 || new Set(selection.articles).size !== 3 || !selection.articles.includes(selection.audio_article)) throw new Error('Select exactly three distinct articles and audio from one of them');
  const articles = await Promise.all(selection.articles.map(async sourcePath => parseArticle((await readSource(root, sourcePath)).toString('utf8'), sourcePath)));
  const catalog = JSON.parse(await readSource(root, 'website/audio/catalog.json'));
  const audioArticle = articles.find(article => article.source_path === selection.audio_article);
  const audio = [audioMetadata(catalog, audioArticle, selection.audio_article)];
  const diagrams = new Map();
  const parser = new MarkdownIt({ html: false });
  for (const article of articles) for (const token of parser.parse(article.body, {})) if (token.type === 'fence' && token.info.trim() === 'mermaid') diagrams.set(sha256(token.content.trim()).slice(0, 24), token.content.trim());
  dependencies ||= await loadRenderingDependencies(root);
  const assets = new Map(dependencies.mathAssets);
  for (const [file, data] of await dependencies.renderDiagrams(diagrams)) assets.set(file, data);
  for (const name of ['reader.js', 'reader.css']) assets.set(`assets/${name}`, await readSource(root, `ios/renderer/${name}`));
  assets.set('assets/licenses/NOTICE.txt', await readSource(root, 'LICENSE'));
  const selected = new Set(selection.articles);
  const manifestArticles = articles.map(article => {
    const rendered = renderArticle(article, { selected, diagrams, renderMath: dependencies.renderMath });
    const html_path = fileFor(article.id);
    assets.set(html_path, Buffer.from(rendered.html));
    const { body, normalized_digest, ...metadata } = article;
    return { ...metadata, html_path, summary: rendered.summary, search_text: rendered.search_text, headings: rendered.headings, ...(article === audioArticle ? { audio_id: audio[0].id } : {}) };
  });
  const files = Object.fromEntries([...assets].sort(comparePath).map(([file, data]) => [file, sha256(data)]));
  const manifestBody = { schema_version: 1, articles: manifestArticles, audio, files };
  const manifest = { schema_version: 1, revision: sha256(JSON.stringify(manifestBody)), articles: manifestArticles, audio, files };
  // Validate every generated path before deleting or writing anything.
  for (const file of assets.keys()) if (!/^(?:assets|articles)\/[a-zA-Z0-9/_.-]+$/.test(file) || file.split('/').includes('..')) throw new Error(`Unsafe output asset: ${file}`);
  // This path has already been restricted to generated Content or a test temp directory.
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const [file, data] of assets) { await mkdir(path.dirname(path.join(output, file)), { recursive: true }); await writeFile(path.join(output, file), data); }
  await writeFile(path.join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}
