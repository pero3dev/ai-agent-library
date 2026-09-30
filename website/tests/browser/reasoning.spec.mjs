import { test, expect } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { createLocalReasoningAdapter, reasoningLocalCases } from '../../../scripts/diagram-release/local-reasoning-adapter.mjs'

// Same fixed semantic/browser cases as the public kit, with honest local evidence.
for (const item of await reasoningLocalCases()) test(item.name, async ({ browser, baseURL }, testInfo) => {
  test.setTimeout(180_000)
  const report = { evidenceClass: 'localhost-static-export-browser', publicAuditExecuted: false, independentVisualReview: 'pending-actual-images', screenshots: [] }
  const result = { name: item.name, status: 'running' }
  const api = createLocalReasoningAdapter({ browser, expect: expect.configure({ timeout: 15_000 }), baseURL, basePath: process.env.NEXT_PUBLIC_BASE_PATH || '', outputPath: name => testInfo.outputPath(name), report })
  try {
    // Register closures with this test's actual browser context helpers.
    const { runReasoningChecks } = await import('../../../scripts/diagram-release/reasoning-checks.mjs')
    await runReasoningChecks({ ...api, check: async (name, operation) => { if (name === item.name) await operation(result) } })
    result.status = 'passed'
  } catch (error) { result.status = 'failed'; result.error = error.stack; throw error }
  finally {
    await writeFile(testInfo.outputPath('reasoning-result.json'), JSON.stringify({ ...report, result }, null, 2) + '\n')
    await testInfo.attach('reasoning-local-evidence', { path: testInfo.outputPath('reasoning-result.json'), contentType: 'application/json' })
  }
})
