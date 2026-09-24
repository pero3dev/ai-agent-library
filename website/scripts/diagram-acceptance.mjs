#!/usr/bin/env node
import { getDiagramArticleAcceptance, getDiagramArticleConfig, TRACKED_ARTICLES } from '../lib/diagram-article-acceptance.mjs'

// Read-only: this command neither writes approval nor contacts GitHub or Pages.
const args = process.argv.slice(2)
const article = args.length === 2 && args[0] === '--article' ? args[1] : null
if (args.length && (!article || !TRACKED_ARTICLES.includes(article))) {
  console.error(`Usage: node website/scripts/diagram-acceptance.mjs [--article ${TRACKED_ARTICLES.join('|')}]`)
  process.exitCode = 1
} else {
  const reports = (article ? [article] : TRACKED_ARTICLES).map(article => ({
    article, evidencePath: getDiagramArticleConfig(article).evidencePath, ...getDiagramArticleAcceptance({ article })
  }))
  console.log(JSON.stringify(article ? reports[0] : { schemaVersion: 1, verification: 'recorded-evidence-only', articles: reports }, null, 2))
}
