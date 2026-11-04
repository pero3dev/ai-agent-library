import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parseFrontMatter, parseScalar, toLines } from '../../../scripts/lib/md-utils.mjs';
const files = execFileSync('git', ['ls-files', '-z', 'docs'], {encoding:'utf8'})
  .split('\0').filter(file => file.endsWith('.md') && !file.endsWith('/README.md'));
const count = files.filter(file => parseFrontMatter(toLines(readFileSync(file, 'utf8')))?.fields
  .some(field => field.key === 'status' && parseScalar(field.value) === 'published')).length;
if (!count) throw new Error('No tracked published articles');
console.log(count);
