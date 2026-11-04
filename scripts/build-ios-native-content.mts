#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildNativeContent } from './lib/ios-native-content.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
/** @param {string[]} args */
export function parseNativeBuildOptions(args: string[]) {
  /** @type {Pick<import('./lib/ios-types.d.mts').IOSNativeOptions, 'fixtures' | 'allPublished' | 'publishedLibrary' | 'output'>} */
  const options: Pick<import('./lib/ios-types.d.mts').IOSNativeOptions, 'fixtures' | 'allPublished' | 'publishedLibrary' | 'output'> = { fixtures: false };
  const seen = new Set();
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (!['--fixtures', '--all-published', '--published-library', '--output'].includes(argument) || seen.has(argument)) throw new Error(`Unknown or duplicate option: ${argument}`);
    seen.add(argument);
    if (argument === '--fixtures') options.fixtures = true;
    else if (argument === '--all-published') options.allPublished = true;
    else if (argument === '--published-library') options.publishedLibrary = true;
    else {
      const value = args[++index];
      if (!value || value.startsWith('--')) throw new Error('--output requires a directory');
      options.output = path.resolve(value);
    }
  }
  if (options.publishedLibrary && (options.fixtures || options.allPublished || options.output !== undefined)) throw new Error('--published-library cannot be combined with --fixtures, --all-published or --output');
  if (options.allPublished && options.fixtures) throw new Error('--all-published cannot be combined with --fixtures');
  if (options.allPublished && !options.output) throw new Error('--all-published requires an explicit --output directory');
  return options;
}

export async function runCli() {
  try {
    const options = parseNativeBuildOptions(process.argv.slice(2));
    const manifest = await buildNativeContent({ root, ...options });
    console.log(`Native iOS ${options.publishedLibrary ? 'published library ' : options.allPublished ? 'all-published temporary ' : options.fixtures ? 'test ' : ''}content: ${manifest.articles.length} articles, ${manifest.audio.length} audio metadata, ${Object.keys(manifest.files).length} verified files; revision ${manifest.revision}`);
  } catch (error) {
    console.error(`Native iOS content build failed: ${error instanceof Error ? error.message : String(error)}`);
    console.error('Usage: node scripts/build-ios-native-content.mjs [--fixtures] [--output <temporary ailibrary-ios-*/Content directory>] | --all-published --output <temporary ailibrary-ios-*/Content directory> | --published-library');
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { await runCli() }
