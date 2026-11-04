import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { load, JSON_SCHEMA } from 'js-yaml';
const files = execFileSync('git', ['ls-files', '-z', 'docs'], { encoding: 'utf8' })
  .split('\0').filter(file => /^docs\/\d{2}-[a-z0-9-]+\/[a-z0-9-]+\.md$/.test(file));
const articles = files.filter(file => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(readFileSync(file, 'utf8'));
  if (!match) throw new Error('Missing source front matter: ' + file);
  const fields = record(load(match[1], { schema: JSON_SCHEMA }));
  if (!fields || !['published', 'draft'].includes(fields.status as string)) throw new Error('Invalid source status: ' + file);
  return fields.status === 'published';
}).sort();
if (articles.length < 4 || articles.length > 2000) throw new Error('Invalid full published article count');
writeFileSync('.local/ios-performance/evidence/published-sources.json',
  JSON.stringify({ articles: articles.length, source_paths: articles }, null, 2) + '\n');
console.log(articles.length);

// JSON receipts and process output remain untrusted until their consumed fields are checked.
function record(value: unknown): Record<string, unknown> {
  assert.ok(value !== null && typeof value === 'object' && !Array.isArray(value), 'Expected JSON object');
  return value as Record<string, unknown>;
}
