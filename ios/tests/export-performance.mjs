#!/usr/bin/env node
export * from './export-performance.mts'
import { runCli } from './export-performance.mts'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) runCli()
