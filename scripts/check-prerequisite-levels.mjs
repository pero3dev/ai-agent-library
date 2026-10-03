#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { collectDocs } from './lib/md-utils.mjs'
import { checkPrerequisiteLevels } from './lib/prerequisite-levels.mjs'

const result = checkPrerequisiteLevels(collectDocs().filter(doc => !doc.isReadme).map(doc => ({ file: doc.repoRel, text: readFileSync(doc.abs, 'utf8') })))
for (const problem of result.problems) console.error(problem)
console.log(`${result.problems.length ? 'NG' : 'OK'}: ${result.checkedArticles} articles, ${result.checkedPrerequisites} prerequisites, ${result.problems.length} level inversions`)
process.exitCode = result.problems.length ? 1 : 0
