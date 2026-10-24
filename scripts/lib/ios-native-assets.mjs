import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadRenderingDependencies } from './ios-content.mjs';

const scale = 3;
const themes = ['light', 'dark'];
const unsafeSVG = /<script\b|\son[a-z]+\s*=|(?:href|src)\s*=\s*["'](?:https?:|\/\/|javascript:)|url\(\s*["']?(?:https?:|\/\/)|@import/i;

/** Browser dependencies are used only while preparing the native content package. */
export async function loadNativeRenderingDependencies(root) {
  const toolsRoot = process.env.IOS_TOOLS_DIR ? path.resolve(root, process.env.IOS_TOOLS_DIR) : path.join(root, 'ios/tools');
  const require = createRequire(path.join(toolsRoot, 'package.json'));
  const math = await loadRenderingDependencies(root);
  const playwright = await import(pathToFileURL(require.resolve('@playwright/test')).href);
  const chromium = playwright.chromium || playwright.default?.chromium;
  const mermaidDist = path.dirname(require.resolve('mermaid/dist/mermaid.esm.min.mjs'));
  const licenses = new Map([
    ['assets/katex/LICENSE.txt', math.mathAssets.get('assets/katex/LICENSE.txt')],
    ['assets/licenses/Mermaid-LICENSE.txt', await readFile(path.join(mermaidDist, '../LICENSE'))]
  ]);
  return { renderAssets: requests => renderNativeAssets(requests, { chromium, mermaidDist, mathAssets: math.mathAssets, renderMath: math.renderMath, licenses }) };
}

export function nativeRasterGeometry(width, height) {
  if (![width, height].every(value => Number.isFinite(value) && value > 0 && value <= 100000)) throw new Error(`Native image exceeds safe dimensions: ${width} × ${height}`);
  // Very wide Mermaid diagrams retain their full content, but use a smaller
  // canvas so decoding the PNG cannot exhaust the phone's image memory.
  const factor = Math.min(1, 8192 / width, 8192 / height,
    8190 / (width * scale), 8190 / (height * scale),
    Math.sqrt(31900000 / (width * height * scale * scale)));
  return { width: Math.ceil(width * factor), height: Math.ceil(height * factor), factor };
}

/** Union painted text/SVG rectangles after applying their overflow clipping ancestors. */
export function nativePaintGeometry(main, painted = []) {
  const bounds = { ...main };
  for (const paint of painted) {
    const visible = { ...paint.bounds };
    for (const clip of paint.clips) {
      if (clip.x) { visible.left = Math.max(visible.left, clip.bounds.left); visible.right = Math.min(visible.right, clip.bounds.right); }
      if (clip.y) { visible.top = Math.max(visible.top, clip.bounds.top); visible.bottom = Math.min(visible.bottom, clip.bounds.bottom); }
    }
    if (visible.right <= visible.left || visible.bottom <= visible.top) continue;
    bounds.left = Math.min(bounds.left, visible.left); bounds.top = Math.min(bounds.top, visible.top);
    bounds.right = Math.max(bounds.right, visible.right); bounds.bottom = Math.max(bounds.bottom, visible.bottom);
  }
  const padding = 2;
  return { width: Math.ceil(bounds.right - bounds.left) + padding * 2, height: Math.ceil(bounds.bottom - bounds.top) + padding * 2, offsetX: main.left - bounds.left + padding, offsetY: main.top - bounds.top + padding };
}

/** Rasterize diagrams and math into common-size transparent light/dark PNG pairs. */
export async function renderNativeAssets(requests, { chromium, mermaidDist, mathAssets, renderMath, licenses = new Map() }) {
  const files = new Map(licenses), metadata = new Map();
  if (!requests.size) return { files, metadata };
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
      if (pathname === '/') {
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.end('<!doctype html><html lang="ja"><head><meta charset="utf-8"><link rel="stylesheet" href="/katex/katex.min.css"><style>html,body{margin:0;padding:0;background:transparent}body{font-family:Arial,sans-serif}#capture{position:relative;overflow:hidden;background:transparent}#visual{position:absolute;display:inline-block;white-space:nowrap;line-height:normal;font-size:18px}#visual.display{font-size:20px}.katex-display{margin:0!important}.baseline{display:inline-block;width:0;height:0;padding:0;margin:0;vertical-align:baseline}</style></head><body><div id="capture"><div id="visual"></div></div></body></html>');
        return;
      }
      const mathAsset = mathAssets.get(`assets${pathname}`);
      if (pathname.startsWith('/katex/') && mathAsset) {
        response.setHeader('Content-Type', pathname.endsWith('.css') ? 'text/css' : pathname.endsWith('.woff2') ? 'font/woff2' : 'application/octet-stream');
        response.end(mathAsset); return;
      }
      if (!pathname.startsWith('/mermaid/') || pathname.includes('..') || pathname.includes('\\') || !/\.m?js$/.test(pathname)) { response.writeHead(403).end(); return; }
      const file = path.resolve(mermaidDist, pathname.slice('/mermaid/'.length));
      if (!file.startsWith(`${mermaidDist}${path.sep}`)) { response.writeHead(403).end(); return; }
      response.setHeader('Content-Type', 'text/javascript'); response.end(await readFile(file));
    } catch { response.writeHead(404).end(); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  let browser;
  try {
    browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: scale });
    const origin = `http://127.0.0.1:${server.address().port}`;
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.goto(origin);
    if ([...requests.values()].some(request => request.kind === 'diagram')) await page.evaluate(async () => { window.mermaid = (await import('/mermaid/mermaid.esm.min.mjs')).default; });
    for (const [key, request] of [...requests].sort(([a], [b]) => a.localeCompare(b))) {
      if (!['math', 'diagram'].includes(request.kind)) throw new Error(`Unsupported native image kind: ${request.kind}`);
      const mathHTML = request.kind === 'math' ? renderMath(request.source, request.display) : null;
      const variants = [];
      for (const theme of themes) {
        const variant = await page.evaluate(async ({ key, request, theme, mathHTML }) => {
          const visual = document.getElementById('visual');
          visual.className = request.display ? 'display' : '';
          visual.style.cssText = `left:0;top:0;color:${theme === 'dark' ? '#f3f4f6' : '#172033'}`;
          visual.replaceChildren();
          let accessibility_text;
          if (request.kind === 'diagram') {
            mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', suppressErrorRendering: true, deterministicIds: true, deterministicIDSeed: `${key}-${theme}`, theme: theme === 'dark' ? 'dark' : 'default', fontFamily: 'Arial, sans-serif', flowchart: { htmlLabels: false } });
            const { svg } = await mermaid.render(`native${key}${theme}`, request.source, visual);
            visual.innerHTML = svg;
            const element = visual.querySelector('svg');
            const bounds = element?.getAttribute('viewBox')?.trim().split(/\s+/).map(Number);
            if (bounds?.length !== 4 || !bounds.slice(2).every(size => Number.isFinite(size) && size > 0)) throw new Error('Invalid native diagram bounds');
            element.setAttribute('width', String(bounds[2])); element.setAttribute('height', String(bounds[3]));
            element.style.cssText = `display:block;max-width:none;width:${bounds[2]}px;height:${bounds[3]}px`;
            // Flowcharts may put labels in foreignObject HTML even when edge
            // labels are SVG text. Both forms belong to the spoken diagram.
            accessibility_text = [...new Set([...element.querySelectorAll('text, title, desc, .nodeLabel, .edgeLabel')].map(node => node.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean))].join('。');
          } else {
            visual.innerHTML = `${mathHTML}<span class="baseline"></span>`;
            const mathml = visual.querySelector('math')?.cloneNode(true);
            // KaTeX annotations contain the original TeX. Exclude them from spoken math.
            mathml?.querySelectorAll('annotation, annotation-xml').forEach(node => node.remove());
            const operators = { '=': ' イコール ', '+': ' プラス ', '−': ' マイナス ', '-': ' マイナス ', '×': ' かける ', '∈': ' 属する ', '≈': ' およそ ', '∞': ' 無限大 ', '∑': ' 総和 ', '→': ' から ', '⊙': ' 要素ごとの積 ' };
            const speak = node => {
              if (node.nodeType === Node.TEXT_NODE) return node.textContent;
              const children = [...node.childNodes].filter(child => child.nodeType === Node.ELEMENT_NODE || child.textContent.trim());
              const parts = children.map(speak);
              const tag = node.nodeName.toLowerCase();
              if (tag === 'annotation' || tag === 'annotation-xml') return '';
              if (tag === 'mfrac') return ` ${parts[1]} 分の ${parts[0]} `;
              if (tag === 'msup') return ` ${parts[0]} の ${parts[1]} 乗 `;
              if (tag === 'msub') return ` ${parts[0]} 添字 ${parts[1]} `;
              if (tag === 'msubsup') return ` ${parts[0]} 添字 ${parts[1]} の ${parts[2]} 乗 `;
              if (tag === 'msqrt') return ` 平方根 ${parts.join(' ')} `;
              if (tag === 'mroot') return ` ${parts[1]} 乗根 ${parts[0]} `;
              if (tag === 'mo') return operators[node.textContent] || ` ${node.textContent} `;
              return parts.join(' ');
            };
            accessibility_text = mathml ? speak(mathml) : '';
          }
          await document.fonts.ready;
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          const rect = value => ({ left: value.left, top: value.top, right: value.right, bottom: value.bottom });
          const main = rect(visual.getBoundingClientRect());
          const painted = [];
          const addPaint = (bounds, element) => {
            const clips = [];
            // The capture canvas belongs to the previous image until measurement
            // finishes. Only clipping inside the current visual limits its ink.
            for (let ancestor = element; ancestor && ancestor !== visual; ancestor = ancestor.parentElement) {
              const style = getComputedStyle(ancestor);
              const x = ['hidden', 'clip', 'scroll', 'auto'].includes(style.overflowX);
              const y = ['hidden', 'clip', 'scroll', 'auto'].includes(style.overflowY);
              if (x || y) clips.push({ bounds: rect(ancestor.getBoundingClientRect()), x, y });
            }
            painted.push({ bounds: rect(bounds), clips });
          };
          if (request.kind === 'math') {
            const html = visual.querySelector('.katex-html');
            // KaTeX's transparent pstrut spans are layout aids, not painted ink.
            // Its square-root SVG is deliberately 400em wide and is clipped by
            // hide-tail. Counting every element's box creates huge empty images.
            const walker = document.createTreeWalker(html, NodeFilter.SHOW_TEXT);
            let node;
            while ((node = walker.nextNode())) {
              if (!node.textContent.replace(/[\s\u200b]/g, '')) continue;
              const range = document.createRange(); range.selectNodeContents(node);
              for (const bounds of range.getClientRects()) addPaint(bounds, node.parentElement);
            }
            for (const svg of html.querySelectorAll('svg')) addPaint(svg.getBoundingClientRect(), svg);
          }
          const baselineY = request.kind === 'math' && !request.display ? visual.querySelector('.baseline').getBoundingClientRect().top : undefined;
          return { html: visual.innerHTML, color: visual.style.color, className: visual.className, main, painted, baselineY, accessibility_text: accessibility_text.replace(/\s+/g, ' ').trim() };
        }, { key, request, theme, mathHTML });
        const { main, painted, baselineY } = variant;
        Object.assign(variant, nativePaintGeometry(main, painted));
        if (baselineY !== undefined) variant.baseline = variant.height - (baselineY - main.top + variant.offsetY);
        delete variant.main; delete variant.painted; delete variant.baselineY;
        if (request.kind === 'diagram' && unsafeSVG.test(variant.html)) throw new Error('Unsafe SVG generated for native diagram');
        if (!variant.accessibility_text) throw new Error(`Missing accessible native ${request.kind}: ${key}`);
        variants.push(variant);
      }
      const originalWidth = Math.max(...variants.map(value => value.width)), originalHeight = Math.max(...variants.map(value => value.height));
      const { width, height, factor } = nativeRasterGeometry(originalWidth, originalHeight);
      // Two themes use exactly the same canvas dimensions and baseline.
      const originalBaseline = request.kind === 'math' && !request.display ? Math.max(...variants.map(value => value.baseline + originalHeight - value.height)) : undefined;
      const baseline = originalBaseline === undefined ? undefined : originalBaseline * factor;
      for (const [index, theme] of themes.entries()) {
        const variant = variants[index];
        await page.evaluate(async ({ variant, width, height, originalHeight, originalBaseline, factor }) => {
          const capture = document.getElementById('capture'), visual = document.getElementById('visual');
          capture.style.width = `${width}px`; capture.style.height = `${height}px`;
          visual.className = variant.className;
          const baselineOffset = originalBaseline === undefined ? 0 : (originalHeight - originalBaseline) - (variant.height - variant.baseline);
          visual.style.cssText = `color:${variant.color};left:${variant.offsetX * factor}px;top:${(variant.offsetY + baselineOffset) * factor}px;transform-origin:top left;transform:scale(${factor})`;
          visual.innerHTML = variant.html;
          await document.fonts.ready;
        }, { variant, width, height, originalHeight, originalBaseline, factor });
        files.set(`assets/native/${key}-${theme}.png`, await page.locator('#capture').screenshot({ omitBackground: true, animations: 'disabled' }));
      }
      metadata.set(key, { asset: { light: `assets/native/${key}-light.png`, dark: `assets/native/${key}-dark.png`, width, height, scale, ...(baseline === undefined ? {} : { baseline }) }, accessibility_text: variants[0].accessibility_text });
    }
    return { files, metadata };
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
}
