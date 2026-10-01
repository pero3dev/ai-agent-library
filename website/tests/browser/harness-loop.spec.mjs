import { test,expect } from '@playwright/test'
import { HARNESS_LOOP_STAGES } from '../../lib/harness-loop-model.mjs'
import { checkReadingArticles } from './reading-article-checks.mjs'
checkReadingArticles({name:'harness and loop control',chapter:'architecture',stages:HARNESS_LOOP_STAGES,sceneSelector:'svg[data-harness-diagram]',articles:[
  ['harness-engineering',['harness-system-boundaries','harness-environment-evolution']],
  ['loop-engineering',['loop-type-and-stopping','loop-replanning-recovery']]
]})
test('completion, budgets and retained failure routes keep their distinct boundaries',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto(`${process.env.NEXT_PUBLIC_BASE_PATH||''}/docs/architecture/loop-engineering`)
  const stop=page.locator('[data-diagram-id="loop-type-and-stopping"]')
  await stop.getByRole('button',{name:'完了を確認',exact:true}).click()
  for(const evidence of ['verified','claim','unverifiable']){
    await stop.getByLabel('完了を裏付ける情報').selectOption(evidence)
    await expect(stop.locator('[data-loop-completed]')).toHaveAttribute('data-loop-completed',String(evidence==='verified'))
  }
  await stop.getByRole('button',{name:'多次元の予算',exact:true}).click()
  for(const dimension of ['steps','tokens','time','cost','none']){
    await stop.getByLabel('超えた予算の次元').selectOption(dimension)
    await expect(stop.locator('[data-loop-budget-stop]')).toHaveAttribute('data-loop-budget-stop',String(dimension!=='none'))
  }
  const recovery=page.locator('[data-diagram-id="loop-replanning-recovery"]')
  await recovery.getByRole('button',{name:'戻る準備',exact:true}).click()
  await recovery.getByLabel('保存して戻る情報').selectOption('state')
  await expect(recovery.locator('[data-failed-route-retained]')).toHaveAttribute('data-failed-route-retained','false')
  await expect(recovery.locator('svg[data-harness-diagram]')).toContainText('外部の副作用は消えない')
  await page.goto(`${process.env.NEXT_PUBLIC_BASE_PATH||''}/docs/architecture/harness-engineering`)
  const harness=page.locator('[data-diagram-id="harness-environment-evolution"]')
  await harness.getByRole('button',{name:'更新時に減らす',exact:true}).click()
  await harness.getByLabel('更新後の補助的な足場').selectOption('remove')
  await expect(harness.locator('[data-harness-safety="retained"]')).toBeVisible()
})
test('two sources are readable without JavaScript',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
  try{
    const page=await context.newPage()
    for(const [route,phrase] of [['harness-engineering','ハーネスの評価: 同一モデルで A/B する'],['loop-engineering','バックトラックとやり直し']]){
      await page.goto(`${process.env.NEXT_PUBLIC_BASE_PATH||''}/docs/architecture/${route}`)
      await expect(page.locator('article h3').filter({hasText:phrase})).toBeVisible()
    }
  }finally{await context.close()}
})
test('low PC playback, pause and print retain both model and prose',async({page})=>{
  await page.setViewportSize({width:1280,height:720})
  await page.goto(`${process.env.NEXT_PUBLIC_BASE_PATH||''}/docs/architecture/loop-engineering`)
  const figure=page.locator('[data-diagram-id="loop-type-and-stopping"]')
  await figure.getByRole('button',{name:'時間軸の設計',exact:true}).click()
  await figure.getByRole('button',{name:'図解を再生',exact:true}).click()
  await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode','playing')
  await figure.getByRole('button',{name:'図解を一時停止',exact:true}).click()
  await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode','manual')
  await page.emulateMedia({media:'print'})
  await expect(figure.locator('svg[data-harness-diagram]')).toBeVisible()
  await expect(figure.locator('.aw-prose')).toContainText('必要な最小限の自由度')
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
