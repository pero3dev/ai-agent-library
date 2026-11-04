import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseFrontMatter, parseScalar, toLines } from '../../../scripts/lib/md-utils.mjs';
const files = execFileSync('git', ['ls-files', '-z', 'docs'], { encoding: 'utf8' })
  .split('\0').filter(file => /^docs\/\d{2}-[a-z0-9-]+\/[a-z0-9-]+\.md$/.test(file));
const articles = files.filter(file => {
  const fields = parseFrontMatter(toLines(readFileSync(file, 'utf8')))?.fields ?? [];
  const statuses = fields.filter(field => field.key === 'status');
  if (statuses.length !== 1) throw new Error(`Expected one source status: ${file}`);
  return parseScalar(statuses[0].value) === 'published';
}).sort();
if (!articles.length || articles.length > 2000) throw new Error('Invalid tracked published article count');
writeFileSync('.local/ios-published-candidate/evidence/published-sources.json',
  JSON.stringify({ articles: articles.length, source_paths: articles }, null, 2) + '\n');
console.log(articles.length);
