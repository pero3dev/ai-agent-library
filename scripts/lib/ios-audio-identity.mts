import { createHash } from 'node:crypto';
import { isRecord } from './json-guards.mjs';

// Reviewed producer declarations, never read from catalog/selection/manifest/import.
// This pins metadata identity only: it does not verify received MP3/script bytes or rights.
/** @type {readonly Readonly<import('./ios-types.d.mts').IOSAudioDeclaration>[]} */
export const DEFAULT_NATIVE_AUDIO_IDENTITIES: readonly Readonly<import('./ios-types.d.mts').IOSAudioDeclaration>[] = Object.freeze([Object.freeze({
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

/** @param {import('node:crypto').BinaryLike} bytes */
const digest = (bytes: import('node:crypto').BinaryLike) => createHash('sha256').update(bytes).digest('hex');
/** @param {unknown} value @returns {value is string} */
const hash = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
/** @param {unknown} value @returns {value is string} */
const articlePath = (value: unknown): value is string => typeof value === 'string' && /^docs\/\d{2}-[a-z0-9-]+\/[a-z0-9-]+\.md$/.test(value);
/** @param {unknown} value @returns {value is string} */
const id = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,199}$/.test(value);
/** @param {unknown} value @returns {value is string} */
const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim() === value && value.length > 0 && value.length <= 1024;
const fields = ['episode_id', 'article_id', 'article_path', 'audio_url', 'audio_sha256', 'source_digest', 'script_sha256', 'credit', 'license_url'];
/** @param {string} reason @returns {never} */
function invalid(reason: string): never { throw new Error(`Audio identity rejected: ${reason}`); }
/** @param {unknown} value @param {import('./ios-types.d.mts').IOSAudioDeclaration} declaration */
function versionedURL(value: unknown, declaration: import('./ios-types.d.mts').IOSAudioDeclaration) {
  if (typeof value !== 'string' || !/^https:\/\/github\.com\/pero3dev\/ai-agent-library\/releases\/download\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+\.mp3$/.test(value)) return false;
  const url = new URL(value), segments = url.pathname.split('/');
  return url.href === value && segments[5].endsWith(`-${declaration.source_digest.slice(0, 16)}-${declaration.script_sha256.slice(0, 16)}`) &&
    segments[6].endsWith(`-${declaration.audio_sha256.slice(0, 16)}.mp3`);
}
/** @param {unknown} value */
function licenseURL(value: unknown) {
  if (!nonempty(value)) return false;
  let url;
  try { url = new URL(value); } catch { return false; }
  return url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.search && !url.hash && url.href === value;
}

/** Structural narrowing complements the identity and domain checks below.
 * @param {Record<string, unknown>} value
 * @returns {value is Record<string, unknown> & import('./ios-types.d.mts').IOSAudioEpisode}
 */
function episodeShape(value: Record<string, unknown>): value is Record<string, unknown> & import('./ios-types.d.mts').IOSAudioEpisode {
  return ['id', 'article_path', 'audio_url', 'audio_sha256', 'source_digest', 'attribution', 'title'].every((key) => typeof value[key] === 'string') &&
    (value.script_sha256 === undefined || typeof value.script_sha256 === 'string') &&
    (value.part === undefined || typeof value.part === 'number') && typeof value.parts === 'number' && typeof value.duration_seconds === 'number' &&
    Array.isArray(value.voices) && value.voices.every((voice) => isRecord(voice) && typeof voice.license_url === 'string') &&
    Array.isArray(value.chapters) && value.chapters.every((chapter) => isRecord(chapter) && typeof chapter.id === 'string' && typeof chapter.title === 'string' && typeof chapter.start_seconds === 'number');
}

// Construct first, before catalog IO/processing. Only trusted JS callers/tests may
// inject declarations; the CLI and selection/catalog/manifest/import data cannot.
/** @param {readonly Readonly<import('./ios-types.d.mts').IOSAudioDeclaration>[]} [trustedDeclarations] */
export function createDeclaredAudioResolver(trustedDeclarations: readonly Readonly<import('./ios-types.d.mts').IOSAudioDeclaration>[] = DEFAULT_NATIVE_AUDIO_IDENTITIES) {
  if (!Array.isArray(trustedDeclarations) || !trustedDeclarations.length || trustedDeclarations.length > 32) invalid('trusted declarations required');
  /** @type {Map<string, Readonly<import('./ios-types.d.mts').IOSAudioDeclaration>>} */
  const identities: Map<string, Readonly<import('./ios-types.d.mts').IOSAudioDeclaration>> = new Map();
  const episodes = new Set(), urls = new Set(), articles = new Set();
  for (const input of trustedDeclarations) {
    if (!input || typeof input !== 'object' || fields.some((key) => !Object.hasOwn(input, key))) invalid('invalid trusted declaration');
    const value = { episode_id: input.episode_id, article_id: input.article_id, article_path: input.article_path, audio_url: input.audio_url, audio_sha256: input.audio_sha256, source_digest: input.source_digest, script_sha256: input.script_sha256, credit: input.credit, license_url: input.license_url };
    if (!id(value.episode_id) || !articlePath(value.article_path) || value.article_id !== value.article_path.slice(5, -3) ||
        !hash(value.audio_sha256) || !hash(value.source_digest) || !hash(value.script_sha256) || !nonempty(value.credit) ||
        !licenseURL(value.license_url) || !versionedURL(value.audio_url, value)) invalid('invalid trusted declaration');
    if (identities.has(value.article_path) || articles.has(value.article_id) || episodes.has(value.episode_id) || urls.has(value.audio_url)) invalid('duplicate or ambiguous trusted declaration');
    identities.set(value.article_path, Object.freeze(value)); articles.add(value.article_id); episodes.add(value.episode_id); urls.add(value.audio_url);
  }
  /** @param {{catalog?: unknown, article?: import('./ios-types.d.mts').IOSArticle, sourcePath?: string, sourceText?: unknown}} [options] @returns {import('./ios-types.d.mts').IOSAudioEpisode} */
  return function resolveDeclaredAudioEpisode({ catalog, article, sourcePath, sourceText }: { catalog?: unknown; article?: import('./ios-types.d.mts').IOSArticle; sourcePath?: string; sourceText?: unknown } = {}): import('./ios-types.d.mts').IOSAudioEpisode {
    const expected = identities.get(sourcePath ?? '');
    if (!expected) invalid('article is not declared');
    if (!article || article.source_path !== sourcePath || article.id !== expected.article_id || typeof sourceText !== 'string' || Buffer.byteLength(sourceText) > 1024 * 1024) invalid('article/source binding');
    const raw = digest(sourceText), normalized = digest(sourceText.replace(/\r\n?/g, '\n'));
    if (article.source_sha256 !== raw || article.normalized_digest !== normalized || normalized !== expected.source_digest) invalid('article source SHA mismatch');
    if (!isRecord(catalog) || catalog.schema_version !== 1 || !Array.isArray(catalog.episodes) || catalog.episodes.length > 10000) invalid('catalog schema');
    const catalogEpisodes = ((catalog.episodes as unknown[])).map((value) => { if (!isRecord(value)) invalid('invalid or duplicate catalog episode ID'); return value; });
    const seen = new Set();
    for (const episode of catalogEpisodes) {
      if (!episode || typeof episode !== 'object' || !id(episode.id) || seen.has(episode.id)) invalid('invalid or duplicate catalog episode ID');
      seen.add(episode.id);
    }
    const matches = catalogEpisodes.filter((episode) => episode.article_path === sourcePath);
    if (matches.length !== 1) invalid('ambiguous catalog article');
    const episode = matches[0];
    if (episode.audio_url !== expected.audio_url) invalid('must match declared versioned repository release');
    if (episode.id !== expected.episode_id || episode.audio_sha256 !== expected.audio_sha256 || episode.source_digest !== expected.source_digest ||
        episode.script_sha256 !== expected.script_sha256 || episode.attribution !== expected.credit || episode.part !== 1 || episode.parts !== 1 ||
        !Array.isArray(episode.voices) || !episode.voices.length || episode.voices.some((voice) => !isRecord(voice) || voice.license_url !== expected.license_url)) invalid('episode tuple/credit/terms mismatch');
    if (!nonempty(episode.title) || typeof episode.duration_seconds !== 'number' || !Number.isFinite(episode.duration_seconds) || episode.duration_seconds <= 0 || episode.duration_seconds > 86400 ||
        !Array.isArray(episode.chapters) || !episode.chapters.length) invalid('invalid metadata');
    let previous = -1;
    const chapters = new Set();
    for (const chapter of (episode.chapters as unknown[])) {
      if (!isRecord(chapter) || !nonempty(chapter.id) || chapters.has(chapter.id) || !nonempty(chapter.title) || typeof chapter.start_seconds !== 'number' || !Number.isFinite(chapter.start_seconds) ||
          chapter.start_seconds < 0 || chapter.start_seconds <= previous || chapter.start_seconds >= episode.duration_seconds) invalid('invalid chapter');
      chapters.add(chapter.id); previous = chapter.start_seconds;
    }
    // The tuple, text, finite numbers, every voice and every chapter were checked above.
    // Preserve the original catalog object and any additional reviewed metadata.
    if (!episodeShape(episode)) invalid('invalid metadata');
    return episode;
  };
}
