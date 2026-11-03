import assert from 'node:assert/strict'
import { readJson } from '../../scripts/audio/core.mjs'
import type { SupplementalBundle } from '../../scripts/audio/contracts.ts'
import { objectFixture, stringFixture } from './json-fixtures.mjs'

/** Inspect only the fields consumed by these assertions; retain all persisted metadata during invalid-fixture edits. */
export async function readReadyFixture(file: string) {
  const value = objectFixture(await readJson(file)), review = objectFixture(value.review)
  assert(typeof review.passed === 'boolean')
  const scriptSha = stringFixture(review.script_sha256)
  assert(review.supplemental_digest === undefined || typeof review.supplemental_digest === 'string')
  assert(Array.isArray(value.episodes))
  const episodes = value.episodes.map((item: unknown) => {
    const episode = objectFixture(item)
    return { ...episode, source_digest: stringFixture(episode.source_digest), audio_sha256: stringFixture(episode.audio_sha256) }
  })
  assert(value.script_file === undefined || typeof value.script_file === 'string')
  assert(value.supplemental_file === undefined || typeof value.supplemental_file === 'string')
  assert(value.supplemental_digest === undefined || value.supplemental_digest === null || typeof value.supplemental_digest === 'string')
  const checks = objectFixture(value.signal_checks)
  assert(Array.isArray(checks.parts))
  const parts = checks.parts.map((item: unknown) => {
    const part = objectFixture(item)
    assert(part.audio_sha256 === undefined || typeof part.audio_sha256 === 'string')
    return { ...part, audio_sha256: part.audio_sha256 }
  })
  return { ...value, production_signature: stringFixture(value.production_signature), script_file: value.script_file, supplemental_file: value.supplemental_file, supplemental_digest: value.supplemental_digest, review: { ...review, passed: review.passed, script_sha256: scriptSha, supplemental_digest: review.supplemental_digest }, episodes, signal_checks: { ...checks, parts } }
}

export async function readQueueFixture(file: string) {
  const value = objectFixture(await readJson(file)), sourceJobs = objectFixture(value.jobs)
  const jobs: Record<string, { status: string }> = {}
  for (const [id, data] of Object.entries(sourceJobs)) { const job = objectFixture(data); jobs[id] = { ...job, status: stringFixture(job.status) } }
  return { ...value, jobs }
}

export async function readSupplementalFixture(file: string): Promise<SupplementalBundle> {
  const value = objectFixture(await readJson(file))
  assert(typeof value.schema_version === 'number' && Array.isArray(value.entries))
  return { schema_version: value.schema_version, entries: value.entries.map((item: unknown) => {
    const entry = objectFixture(item)
    return { document_path: stringFixture(entry.document_path), heading: stringFixture(entry.heading), excerpt: stringFixture(entry.excerpt), excerpt_sha256: stringFixture(entry.excerpt_sha256) }
  }) }
}
