#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildContent } from './lib/ios-content.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
if (args.some((arg, index) => arg !== '--output' && args[index - 1] !== '--output') || args.filter(arg => arg === '--output').length > 1 || (args.includes('--output') && !args[args.indexOf('--output') + 1])) {
  console.error('Usage: node scripts/build-ios-content.mjs [--output <temporary ailibrary-ios-*/Content directory>]');
  process.exitCode = 1;
} else {
  try {
    const output = args.includes('--output') ? path.resolve(args[args.indexOf('--output') + 1]) : undefined;
    const manifest = await buildContent({ root, output });
    console.log(`iOS content: ${manifest.articles.length} articles, ${manifest.audio.length} audio metadata, ${Object.keys(manifest.files).length} verified files; revision ${manifest.revision}`);
  } catch (error) { console.error(`iOS content build failed: ${error.message}`); process.exitCode = 1; }
}
