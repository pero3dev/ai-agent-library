import { test, expect } from '@playwright/test'
import { readdirSync, readFileSync } from 'node:fs'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const chunkDirectory = new URL('../../out/_next/static/chunks/', import.meta.url)
const cases = [
  { name: 'self-attention scene', marker: 'SELF-ATTENTION', path: 'llm-internals/transformer-architecture', prose: '自己注意は Transformer の心臓部です。' },
  { name: 'agent-loop scene', marker: 'AGENT LOOP / CONTROL FLOW', path: 'concepts/agent-loop', prose: 'ツール要求がないことだけでは正常完了と判定できません' },
  { name: 'workflow scene', marker: 'WORKFLOW / AGENT', path: 'architecture/workflow-vs-agent', prose: '予測可能な部分をコードに固定し' },
  { name: 'transformer input-output scene', marker: 'TRANSFORMER / INPUT & OUTPUT', path: 'llm-internals/transformer-architecture', prose: '入力の各トークン(整数 ID)は', mathCount: 2 },
  { name: 'transformer position scene', marker: 'TRANSFORMER / POSITION', path: 'llm-internals/transformer-architecture', prose: 'そこで位置情報を明示的に与えます', mathCount: 1 },
  { name: 'transformer block scene', marker: 'TRANSFORMER / BLOCK & WEIGHTS', path: 'llm-internals/transformer-architecture', prose: '1 種類の「注目の仕方」しか表せません', mathCount: 7 },
  { name: 'attention KV sharing scene', marker: 'ATTENTION / KV SHARING', path: 'llm-internals/attention-variants-and-long-context', prose: '標準的な多頭自己注意には', mathCount: 2 },
  { name: 'attention compute scene', marker: 'ATTENTION VARIANTS / COMPUTE & MEMORY', path: 'llm-internals/attention-variants-and-long-context', prose: '全対全をやめて一部の対だけ見る', mathCount: 1 },
  { name: 'attention context scene', marker: 'ATTENTION / CONTEXT RANGE', path: 'llm-internals/attention-variants-and-long-context', prose: '学習時の最大長を超える入力に', mathCount: 0 },
  { name: 'MoE routing scene', marker: 'MOE / ROUTING & LOAD', path: 'llm-internals/mixture-of-experts-internals', prose: 'ルータはスコアを出します', mathCount: 3 },
  { name: 'MoE parameters scene', marker: 'MoE / PARAMETERS & COMMUNICATION', path: 'llm-internals/mixture-of-experts-internals', prose: '2 つのパラメータ数で捉えます', mathCount: 1 },
  { name: 'shared reading frame', marker: 'ReadingFigure requires at least one stage', path: 'concepts/agent-loop', prose: 'ツール要求がないことだけでは正常完了と判定できません' }
]

for (const example of cases) {
  test(`${example.name}: a failed JavaScript chunk leaves the original article readable`, async ({ page }) => {
    // Identify the actual emitted chunk, without relying on a build-specific hash
    // or replacing the component/DOM under test. Only this network request fails.
    const files = readdirSync(chunkDirectory).filter(name => name.endsWith('.js')
      && readFileSync(new URL(name, chunkDirectory), 'utf8').includes(example.marker))
    // Turbopack may put the shared frame into each article chunk rather than
    // emit a separate shared file. Block every matching copy in either layout.
    if (example.name === 'shared reading frame') expect(files.length).toBeGreaterThan(0)
    else expect(files).toHaveLength(1)
    const blocked = []
    await page.route('**/_next/static/chunks/*.js', async route => {
      const name = new URL(route.request().url()).pathname.split('/').at(-1)
      if (files.includes(name)) {
        blocked.push(name)
        await route.abort('failed')
      } else await route.continue()
    })
    const response = await page.goto(`${basePath}/docs/${example.path}`)
    expect(response.status()).toBe(200)
    const fallback = page.locator('.reading-figure-fallback').filter({ hasText: example.prose })
    await expect(fallback).toBeVisible()
    await expect(fallback.getByRole('status')).toContainText('本文は引き続き読めます')
    await expect(fallback).toContainText(example.prose)
    expect(blocked.length).toBeGreaterThan(0)
    expect(blocked.every(name => files.includes(name))).toBe(true)
    await expect(page.locator('article h1')).toBeVisible()
    await expect(page.locator('article')).not.toContainText('Application error')
    if (example.path === 'concepts/agent-loop') {
      await expect(fallback.locator('ol > li')).toHaveCount(5)
    } else if (example.path === 'architecture/workflow-vs-agent') {
      await expect(fallback.locator('table tbody tr')).toHaveCount(7)
    } else {
      await expect(fallback.locator('.katex-display')).toHaveCount(example.mathCount ?? 2)
    }
  })
}
