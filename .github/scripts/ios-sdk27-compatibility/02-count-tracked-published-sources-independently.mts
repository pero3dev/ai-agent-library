import { array, object, objects, jsonObject, jsonArray, match, optionalMessage } from './contracts.mts'
type CommandRecord = { name?: string; label?: string; binary: string; arguments: string[]; exit_code: number | null; signal: NodeJS.Signals | null; error: unknown }
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { load, JSON_SCHEMA } from 'js-yaml';
const files = execFileSync('git', ['ls-files', '-z', 'docs'], { encoding: 'utf8' })
  .split('\0').filter((file) => /^docs\/\d{2}-[a-z0-9-]+\/[a-z0-9-]+\.md$/.test(file));
const articles = files.filter((file) => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(readFileSync(file, 'utf8'));
  if (!match) throw new Error('Missing front matter: ' + file);
  const fields = load(match[1], { schema: JSON_SCHEMA }); object(fields);
  if (!fields || !(['published', 'draft'] as readonly unknown[]).includes(fields.status)) throw new Error('Invalid source status: ' + file);
  return fields.status === 'published';
}).sort();
if (articles.length < 4 || articles.length > 2000) throw new Error('Invalid full published source count');
writeFileSync(path.join(process.env.EVIDENCE_DIR!, 'published-sources.json'),
  JSON.stringify({ articles: articles.length, source_paths: articles }, null, 2) + '\n', { flag: 'wx' });
console.log(articles.length);
