#!/usr/bin/env node
import { ARTICLE_EVIDENCE_PATH, getDiagramArticleAcceptance, TRANSFORMER_ARTICLE } from '../lib/diagram-article-acceptance.mjs'

// Read-only: this command neither writes approval nor contacts GitHub or Pages.
console.log(JSON.stringify({ article: TRANSFORMER_ARTICLE, evidencePath: ARTICLE_EVIDENCE_PATH, ...getDiagramArticleAcceptance() }, null, 2))
