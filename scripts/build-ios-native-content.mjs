#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildNativeContent } from './lib/ios-native-content.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
export function parseNativeBuildOptions(args) {
  const options = { fixtures: false };
  const seen = new Set();
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (!['--fixtures', '--output'].includes(argument) || seen.has(argument)) throw new Error(`Unknown or duplicate option: ${argument}`);
    seen.add(argument);
    if (argument === '--fixtures') options.fixtures = true;
    else {
      const value = args[++index];
      if (!value || value.startsWith('--')) throw new Error('--output requires a directory');
      options.output = path.resolve(value);
    }
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseNativeBuildOptions(process.argv.slice(2));
    const manifest = await buildNativeContent({ root, ...options });
    console.log(`Native iOS ${options.fixtures ? 'test ' : ''}content: ${manifest.articles.length} articles, ${manifest.audio.length} audio metadata, ${Object.keys(manifest.files).length} verified files; revision ${manifest.revision}`);
  } catch (error) {
    console.error(`Native iOS content build failed: ${error.message}`);
    console.error('Usage: node scripts/build-ios-native-content.mjs [--fixtures] [--output <temporary ailibrary-ios-*/Content directory>]');
    process.exitCode = 1;
  }
}
