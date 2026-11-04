import assert from 'node:assert/strict';
import { objectFixture, objectArrayFixture, stringFixture } from './json-fixtures.mjs';
import { isStringRecord } from '../../scripts/lib/json-guards.mjs';

/** @param {unknown} value @returns {number} */
function numberFixture(value: unknown): number {
  assert.equal(typeof value, 'number');
  if (typeof value !== 'number') throw new Error('Expected numeric fixture field');
  return value;
}

/** @param {unknown} value @returns {import('../../scripts/lib/ios-types.d.mts').IOSAudioDeclaration} */
export function audioDeclarationFixture(value: unknown): import('../../scripts/lib/ios-types.d.mts').IOSAudioDeclaration {
  const row = objectFixture(value);
  return {
    episode_id: stringFixture(row.episode_id), article_id: stringFixture(row.article_id),
    article_path: stringFixture(row.article_path), audio_url: stringFixture(row.audio_url),
    audio_sha256: stringFixture(row.audio_sha256), source_digest: stringFixture(row.source_digest),
    script_sha256: stringFixture(row.script_sha256), credit: stringFixture(row.credit), license_url: stringFixture(row.license_url)
  };
}

/** @param {unknown} value @returns {import('../../scripts/lib/ios-types.d.mts').IOSAudioEpisode} */
export function audioEpisodeFixture(value: unknown): import('../../scripts/lib/ios-types.d.mts').IOSAudioEpisode {
  const row = objectFixture(value);
  return {
    ...row, id: stringFixture(row.id), article_path: stringFixture(row.article_path),
    audio_url: stringFixture(row.audio_url), audio_sha256: stringFixture(row.audio_sha256),
    source_digest: stringFixture(row.source_digest), attribution: stringFixture(row.attribution),
    title: stringFixture(row.title), duration_seconds: numberFixture(row.duration_seconds), parts: numberFixture(row.parts),
    ...(row.part === undefined ? {} : {part: numberFixture(row.part)}),
    ...(row.script_sha256 === undefined ? {} : {script_sha256: stringFixture(row.script_sha256)}),
    voices: objectArrayFixture(row.voices).map((voice) => ({...voice, license_url: stringFixture(voice.license_url)})),
    chapters: objectArrayFixture(row.chapters).map((chapter) => ({...chapter, id: stringFixture(chapter.id), title: stringFixture(chapter.title), start_seconds: numberFixture(chapter.start_seconds)}))
  };
}

/** @param {unknown} value */
export function revisionManifestFixture(value: unknown) {
  const row = objectFixture(value);
  assert.ok(isStringRecord(row.files));
  return { ...row, files: row.files, articles: objectArrayFixture(row.articles).map((article) => ({
    ...article, id: stringFixture(article.id), source_path: stringFixture(article.source_path),
    source_sha256: stringFixture(article.source_sha256), document_path: stringFixture(article.document_path),
    headings: article.headings, is_test_fixture: article.is_test_fixture
  })) };
}
