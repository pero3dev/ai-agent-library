/** @typedef {import('./contracts.ts').AudioConfig} AudioConfig */

/** @param {unknown} value @returns {value is Record<string, unknown>} */
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)

/** @param {string} field @returns {never} */
function invalid(field) { throw new Error(`Invalid audio configuration: ${field}`) }

/**
 * Validate the structure after local tool and environment overrides are applied.
 * Existing range, engine, subscription and account checks remain with their callers.
 * Missing max_chunk_chars retains splitSpeech's existing default of 180.
 * @param {unknown} value
 * @returns {asserts value is AudioConfig}
 */
export function assertAudioConfig(value) {
  if (!record(value)) invalid('expected an object')
  if (value.schema_version !== 1) throw new Error('Unsupported audio configuration version')
  for (const field of ['claude_command', 'claude_model', 'engine_url', 'ffmpeg_path', 'ffprobe_path', 'attribution']) {
    if (typeof value[field] !== 'string') invalid(field)
  }
  for (const field of ['claude_timeout_seconds', 'max_repair_attempts', 'max_articles_per_run', 'inter_article_delay_seconds', 'quota_retry_hours']) {
    if (typeof value[field] !== 'number') invalid(field)
  }
  if (!record(value.voices)) invalid('voices')
  for (const role of ['listener', 'explainer']) {
    const voice = value.voices[role]
    if (!record(voice)) invalid(`voices.${role}`)
    if (typeof voice.speaker_id !== 'number') invalid(`voices.${role}.speaker_id`)
    if (typeof voice.name !== 'string') invalid(`voices.${role}.name`)
    if (typeof voice.license_url !== 'string') invalid(`voices.${role}.license_url`)
  }
  if (!record(value.synthesis)) invalid('synthesis')
  for (const field of ['speed_scale', 'bitrate_kbps']) {
    if (typeof value.synthesis[field] !== 'number') invalid(`synthesis.${field}`)
  }
  if (value.synthesis.max_chunk_chars !== undefined && typeof value.synthesis.max_chunk_chars !== 'number') invalid('synthesis.max_chunk_chars')
}
