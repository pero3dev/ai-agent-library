#!/usr/bin/env node
export * from './native-simulator-prepare.mts'
import { runCli } from './native-simulator-prepare.mts'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) runCli()
