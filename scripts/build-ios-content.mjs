#!/usr/bin/env node
import path from 'node:path';
import { realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildContent, validateOutput } from './lib/ios-content.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

/** The old HTML exporter is comparison-only; there is deliberately no default output. */
export function parseLegacyBuildOptions(args) {
  if (args.length !== 2 || args[0] !== '--output' || !args[1] || args[1].startsWith('--')) {
    throw new Error('Legacy HTML generation requires exactly one explicit --output directory');
  }
  return { output: path.resolve(args[1]) };
}

export async function validateLegacyBuildOutput(root, output) {
  root = await realpath(root);
  const destination = await validateOutput(root, output);
  for (const name of ['Content', 'TestContent']) {
    const native = path.join(root, 'ios/AILibrary', name);
    if (destination === native || destination.startsWith(native + path.sep) || native.startsWith(destination + path.sep)) {
      throw new Error('Legacy HTML output must be a temporary ailibrary-ios-* directory, separate from native Content and TestContent');
    }
  }
  return destination;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseLegacyBuildOptions(process.argv.slice(2));
    const output = await validateLegacyBuildOutput(root, options.output);
    const manifest = await buildContent({ root, output });
    console.log(`Legacy comparison content: ${manifest.articles.length} articles, ${manifest.audio.length} audio metadata, ${Object.keys(manifest.files).length} verified files; revision ${manifest.revision}`);
  } catch (error) {
    console.error(`Legacy iOS content build failed: ${error.message}`);
    console.error('Usage: node scripts/build-ios-content.mjs --output <temporary ailibrary-ios-*/Content directory>');
    process.exitCode = 1;
  }
}
