import { test,expect } from '@playwright/test'
import { CODING_OUTCOME_STAGES } from '../../lib/coding-outcomes-model.mjs'
import { checkReadingArticles } from './reading-article-checks.mjs'
checkReadingArticles({name:'coding team evaluation cost',chapter:'coding-agents',stages:CODING_OUTCOME_STAGES,sceneSelector:'svg[data-outcome-diagram]',articles:[
  ['coding-agent-team-adoption',['coding-team-rollout','coding-team-review','coding-team-governance']],
  ['coding-agent-evaluation',['coding-evaluation-experiment','coding-evaluation-effects']],
  ['coding-agent-cost-optimization',['coding-cost-consumption','coding-cost-context','coding-cost-limits']]
]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
test('AI involvement does not remove the submitter responsibility',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto(`${base}/docs/coding-agents/coding-agent-team-adoption`)
  const review=page.locator('[data-diagram-id="coding-team-review"]')
  await review.getByRole('button',{name:'責任の所在',exact:true}).click()
  await expect(review.locator('[data-ai-removes-responsibility="false"]')).toBeVisible()
})
test('different evaluation conditions are not a controlled comparison and proxies do not prove improvement',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto(`${base}/docs/coding-agents/coding-agent-evaluation`)
  const experiment=page.locator('[data-diagram-id="coding-evaluation-experiment"]')
  await experiment.getByRole('button',{name:'同じ条件',exact:true}).click()
  for(const condition of ['same','prompt','information','attempts']){
    await experiment.getByRole('combobox',{name:'候補間で揃えた評価条件',exact:true}).selectOption(condition)
    await expect(experiment.locator('[data-evaluation-comparable]')).toHaveAttribute('data-evaluation-comparable',String(condition==='same'))
  }
  const effect=page.locator('[data-diagram-id="coding-evaluation-effects"]')
  await effect.getByRole('button',{name:'成果を確認',exact:true}).click()
  for(const evidence of ['proxy','outcomes']){
    await effect.getByRole('combobox',{name:'導入効果を見る証拠',exact:true}).selectOption(evidence)
    await expect(effect.locator('[data-proxy-only]')).toHaveAttribute('data-proxy-only',String(evidence==='proxy'))
    await expect(effect.locator('[data-improvement-proved]')).toHaveAttribute('data-improvement-proved','false')
  }
})
test('cost reduction requires quality and delegation adds its own consumption',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto(`${base}/docs/coding-agents/coding-agent-cost-optimization`)
  const consumption=page.locator('[data-diagram-id="coding-cost-consumption"]')
  await consumption.getByRole('button',{name:'品質を保つ',exact:true}).click()
  for(const quality of ['preserved','lost']){
    await consumption.getByRole('combobox',{name:'消費を減らした後の品質',exact:true}).selectOption(quality)
    await expect(consumption.locator('[data-cost-reduction-accepted]')).toHaveAttribute('data-cost-reduction-accepted',String(quality==='preserved'))
  }
  const context=page.locator('[data-diagram-id="coding-cost-context"]')
  await context.getByRole('button',{name:'委譲の総量',exact:true}).click()
  for(const delegation of ['off','on']){
    await context.getByRole('combobox',{name:'大量の探索の文脈',exact:true}).selectOption(delegation)
    await expect(context.locator('[data-child-consumption-added]')).toHaveAttribute('data-child-consumption-added',String(delegation==='on'))
    await expect(context.locator('[data-total-reduction-guaranteed]')).toHaveAttribute('data-total-reduction-guaranteed','false')
  }
})
test('three source articles remain readable without JavaScript',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
  try{
    const page=await context.newPage()
    for(const [route,phrase] of [['coding-agent-team-adoption','レビュー体制と責任'],['coding-agent-evaluation','社内評価タスクの設計'],['coding-agent-cost-optimization','コンテキスト管理 = コスト管理']]){
      await page.goto(`${base}/docs/coding-agents/${route}`)
      await expect(page.locator('article h3').filter({hasText:phrase})).toBeVisible()
    }
  }finally{await context.close()}
})
test('low PC playback pause and print keep cost and original prose',async({page})=>{
  await page.setViewportSize({width:1280,height:720})
  await page.goto(`${base}/docs/coding-agents/coding-agent-cost-optimization`)
  const figure=page.locator('[data-diagram-id="coding-cost-consumption"]')
  await figure.getByRole('button',{name:'ループと再送',exact:true}).click()
  await figure.getByRole('button',{name:'図解を再生',exact:true}).click()
  await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode','playing')
  await figure.getByRole('button',{name:'図解を一時停止',exact:true}).click()
  await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode','manual')
  await page.emulateMedia({media:'print'})
  await expect(figure.locator('svg[data-outcome-diagram]')).toBeVisible()
  await expect(figure.locator('.aw-prose')).toContainText('毎ターン再送されるコンテキスト')
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
