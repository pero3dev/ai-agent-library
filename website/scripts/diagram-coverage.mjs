#!/usr/bin/env node
import { getDiagramCoverage } from '../lib/diagram-coverage.mjs'

// --json includes the complete current article set; default output is concise.
const report = getDiagramCoverage()
console.log(JSON.stringify(process.argv.includes('--json') ? report : report.summary, null, 2))
