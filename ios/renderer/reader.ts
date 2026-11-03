(() => {
  'use strict';
  const headings = [...document.querySelectorAll('main h1[id],main h2[id],main h3[id],main h4[id]')];
  const bridge = (message: ReaderBridgeMessage) => {
    const handler = window.webkit?.messageHandlers?.reader;
    if (!handler || typeof handler.postMessage !== 'function') return false;
    handler.postMessage(message);
    return true;
  };
  const bounded = (value: unknown, min: number, max: number, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
  const setFontScale = (value: number | undefined) => document.documentElement.style.setProperty('--font-scale', String(bounded(value, .8, 4, 1)));
  const goToHeading = (id: unknown) => {
    const target = typeof id === 'string' ? document.getElementById(id) : null;
    if (!target) return false;
    target.scrollIntoView();
    return true;
  };
  let restoring = false;
  window.reader = Object.freeze({
    setFontScale,
    goToHeading,
    restore(value: ReaderRestoreState = {}) {
      restoring = true;
      setFontScale(value.fontScale);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (typeof value.fraction === 'number' && Number.isFinite(value.fraction) && value.fraction > 0) window.scrollTo(0, bounded(value.fraction, 0, 1, 0) * Math.max(0, document.documentElement.scrollHeight - innerHeight));
        else if (!goToHeading(value.heading)) window.scrollTo(0, 0);
        restoring = false;
      }));
    }
  });
  let frame = 0;
  const position = (): ReaderBridgeMessage => {
    const current = headings.filter(element => element.getBoundingClientRect().top <= 100).at(-1);
    return { type: 'position', heading: current?.id || '', fraction: bounded(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight), 0, 1, 0) };
  };
  const report = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (restoring) return;
      bridge(position());
    });
  };
  addEventListener('scroll', report, { passive: true });
  addEventListener('pagehide', () => { if (!restoring) bridge(position()); });
  document.addEventListener('click', async event => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest('a[data-article-id]');
    if (link instanceof HTMLAnchorElement && bridge({ type: 'article', id: link.dataset.articleId || '', fragment: link.dataset.fragment || '' })) event.preventDefault();
    const button = event.target.closest('button[data-copy]');
    if (!(button instanceof HTMLButtonElement)) return;
    const text = document.getElementById(button.dataset.copy || '')?.textContent || '';
    let copied = bridge({ type: 'copy', text });
    if (!copied) {
      try { await navigator.clipboard.writeText(text); copied = true; }
      catch { copied = false; }
    }
    const status = document.getElementById('reader-status');
    if (!status) throw new Error('The reader copy status element is missing');
    status.textContent = copied ? 'コードをコピーしました' : 'コードを長押しして選択・コピーしてください';
    clearTimeout(window.readerStatusTimer);
    window.readerStatusTimer = setTimeout(() => { status.textContent = ''; }, 2500);
  });
})();
