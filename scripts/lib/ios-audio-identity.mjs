import { createHash } from 'node:crypto';

// Reviewed producer declarations, never read from catalog/selection/manifest/import.
// This pins metadata identity only: it does not verify received MP3/script bytes or rights.
export const DEFAULT_NATIVE_AUDIO_IDENTITIES = Object.freeze([Object.freeze({
  "episode_id": "01-concepts--agent-loop-3c6f324e5d0d-7ab8a0e6323a-47803c3cb76f-p01",
  "article_id": "01-concepts/agent-loop",
  "article_path": "docs/01-concepts/agent-loop.md",
  "audio_url": "https://github.com/pero3dev/ai-agent-library/releases/download/audio-agent-loop-3c6f324e5d0d4a60-7ab8a0e6323a20e7/01-concepts--agent-loop-3c6f324e5d0d-7ab8a0e6323a-47803c3cb76f-p01-47803c3cb76f5e73.mp3",
  "audio_sha256": "47803c3cb76f5e737a3d2f11a8878886590d4159363f52c453bd44396214942e",
  "source_digest": "3c6f324e5d0d4a60c48cf9be030279731c2e3ea2951f1e51c1c3a570eec7f101",
  "script_sha256": "7ab8a0e6323a20e72cada9f6559d5e219786616a2f2e308da5f2af646b60c9fb",
  "credit": "VOICEVOX Nemo（女声1・男声1）",
  "license_url": "https://voicevox.hiroshiba.jp/nemo/term/"
})]);

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const articlePath = value => typeof value === 'string' && /^docs\/\d{2}-[a-z0-9-]+\/[a-z0-9-]+\.md$/.test(value);
const id = value => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,199}$/.test(value);
const nonempty = value => typeof value === 'string' && value.trim() === value && value.length > 0 && value.length <= 1024;
const fields = ['episode_id', 'article_id', 'article_path', 'audio_url', 'audio_sha256', 'source_digest', 'script_sha256', 'credit', 'license_url'];
function invalid(reason) { throw new Error(`Audio identity rejected: ${reason}`); }
function versionedURL(value, declaration) {
  if (typeof value !== 'string' || !/^https:\/\/github\.com\/pero3dev\/ai-agent-library\/releases\/download\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+\.mp3$/.test(value)) return false;
  const url = new URL(value), segments = url.pathname.split('/');
  return url.href === value && segments[5].endsWith(`-${declaration.source_digest.slice(0, 16)}-${declaration.script_sha256.slice(0, 16)}`) &&
    segments[6].endsWith(`-${declaration.audio_sha256.slice(0, 16)}.mp3`);
}
function licenseURL(value) {
  if (!nonempty(value)) return false;
  let url;
  try { url = new URL(value); } catch { return false; }
  return url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.search && !url.hash && url.href === value;
}

// Construct first, before catalog IO/processing. Only trusted JS callers/tests may
// inject declarations; the CLI and selection/catalog/manifest/import data cannot.
export function createDeclaredAudioResolver(trustedDeclarations = DEFAULT_NATIVE_AUDIO_IDENTITIES) {
  if (!Array.isArray(trustedDeclarations) || !trustedDeclarations.length || trustedDeclarations.length > 32) invalid('trusted declarations required');
  const identities = new Map(), episodes = new Set(), urls = new Set(), articles = new Set();
  for (const input of trustedDeclarations) {
    if (!input || typeof input !== 'object' || fields.some(key => !Object.hasOwn(input, key))) invalid('invalid trusted declaration');
    const value = Object.fromEntries(fields.map(key => [key, input[key]]));
    if (!id(value.episode_id) || !articlePath(value.article_path) || value.article_id !== value.article_path.slice(5, -3) ||
        !hash(value.audio_sha256) || !hash(value.source_digest) || !hash(value.script_sha256) || !nonempty(value.credit) ||
        !licenseURL(value.license_url) || !versionedURL(value.audio_url, value)) invalid('invalid trusted declaration');
    if (identities.has(value.article_path) || articles.has(value.article_id) || episodes.has(value.episode_id) || urls.has(value.audio_url)) invalid('duplicate or ambiguous trusted declaration');
    identities.set(value.article_path, Object.freeze(value)); articles.add(value.article_id); episodes.add(value.episode_id); urls.add(value.audio_url);
  }
  return function resolveDeclaredAudioEpisode({ catalog, article, sourcePath, sourceText } = {}) {
    const expected = identities.get(sourcePath);
    if (!expected) invalid('article is not declared');
    if (!article || article.source_path !== sourcePath || article.id !== expected.article_id || typeof sourceText !== 'string' || Buffer.byteLength(sourceText) > 1024 * 1024) invalid('article/source binding');
    const raw = digest(sourceText), normalized = digest(sourceText.replace(/\r\n?/g, '\n'));
    if (article.source_sha256 !== raw || article.normalized_digest !== normalized || normalized !== expected.source_digest) invalid('article source SHA mismatch');
    if (catalog?.schema_version !== 1 || !Array.isArray(catalog.episodes) || catalog.episodes.length > 10000) invalid('catalog schema');
    const seen = new Set();
    for (const episode of catalog.episodes) {
      if (!episode || typeof episode !== 'object' || !id(episode.id) || seen.has(episode.id)) invalid('invalid or duplicate catalog episode ID');
      seen.add(episode.id);
    }
    const matches = catalog.episodes.filter(episode => episode.article_path === sourcePath);
    if (matches.length !== 1) invalid('ambiguous catalog article');
    const episode = matches[0];
    if (episode.audio_url !== expected.audio_url) invalid('must match declared versioned repository release');
    if (episode.id !== expected.episode_id || episode.audio_sha256 !== expected.audio_sha256 || episode.source_digest !== expected.source_digest ||
        episode.script_sha256 !== expected.script_sha256 || episode.attribution !== expected.credit || episode.part !== 1 || episode.parts !== 1 ||
        !Array.isArray(episode.voices) || !episode.voices.length || episode.voices.some(voice => voice?.license_url !== expected.license_url)) invalid('episode tuple/credit/terms mismatch');
    if (!nonempty(episode.title) || !Number.isFinite(episode.duration_seconds) || episode.duration_seconds <= 0 || episode.duration_seconds > 86400 ||
        !Array.isArray(episode.chapters) || !episode.chapters.length) invalid('invalid metadata');
    let previous = -1;
    const chapters = new Set();
    for (const chapter of episode.chapters) {
      if (!chapter || !nonempty(chapter.id) || chapters.has(chapter.id) || !nonempty(chapter.title) || !Number.isFinite(chapter.start_seconds) ||
          chapter.start_seconds < 0 || chapter.start_seconds <= previous || chapter.start_seconds >= episode.duration_seconds) invalid('invalid chapter');
      chapters.add(chapter.id); previous = chapter.start_seconds;
    }
    return episode;
  };
}
