import { test,expect } from '@playwright/test'
import { DURABLE_CONTRACT_STAGES } from '../../lib/durable-tenant-api-model.mjs'
import { checkReadingArticles } from './reading-article-checks.mjs'
checkReadingArticles({name:'durable tenant API contracts',chapter:'architecture',stages:DURABLE_CONTRACT_STAGES,sceneSelector:'svg[data-contract-diagram]',articles:[
  ['async-and-durable-agents',['durable-resume-design','durable-side-effect-contract','durable-wait-and-progress']],
  ['multi-tenancy-and-isolation',['tenant-data-and-settings','tenant-capacity-and-cost']],
  ['agent-api-design',['agent-api-job-states','agent-api-events-and-idempotency','agent-api-change-and-metering']]
]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
test('saved results, unknown side effects and changed approvals have separate decisions',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto(`${base}/docs/architecture/async-and-durable-agents`)
  const resume=page.locator('[data-diagram-id="durable-resume-design"]')
  await resume.getByRole('button',{name:'記録結果の再利用',exact:true}).click()
  await resume.getByLabel('再開時のLLM結果').selectOption('recorded')
  await expect(resume.locator('[data-recorded-result-reused]')).toHaveAttribute('data-recorded-result-reused','true')
  const effect=page.locator('[data-diagram-id="durable-side-effect-contract"]')
  await effect.getByRole('button',{name:'外部の結果不明',exact:true}).click()
  await expect(effect.locator('[data-unknown-side-effect-stop]')).toHaveAttribute('data-unknown-side-effect-stop','true')
  const wait=page.locator('[data-diagram-id="durable-wait-and-progress"]')
  await wait.getByRole('button',{name:'通知と期限',exact:true}).click()
  await wait.getByLabel('承認待ちの現在').selectOption('expired')
  await expect(wait.locator('[data-expiry-approved]')).toHaveAttribute('data-expiry-approved','false')
  await wait.getByRole('button',{name:'変更と遅延結果',exact:true}).click()
  for(const mode of ['same','changed','late']){
    await wait.getByLabel('以前の承認と現在の対象').selectOption(mode)
    await expect(wait.locator('[data-approval-scope-execute]')).toHaveAttribute('data-approval-scope-execute',String(mode==='same'))
  }
})
test('tenant scope, shared pressure, 202 and payload mismatch stay distinct',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto(`${base}/docs/architecture/multi-tenancy-and-isolation`)
  const data=page.locator('[data-diagram-id="tenant-data-and-settings"]')
  await data.getByRole('button',{name:'信頼する文脈',exact:true}).click()
  for(const mode of ['verified','generated','missing']){
    await data.getByLabel('実行に使うテナント文脈').selectOption(mode)
    await expect(data.locator('[data-tenant-permit]')).toHaveAttribute('data-tenant-permit',String(mode==='verified'))
  }
  await data.getByRole('button',{name:'半信頼の設定',exact:true}).click()
  await expect(data.locator('[data-global-policy-retained="true"]')).toBeVisible()
  const capacity=page.locator('[data-diagram-id="tenant-capacity-and-cost"]')
  await capacity.getByRole('button',{name:'優先度と圧力',exact:true}).click()
  await capacity.getByLabel('容量超過の範囲').selectOption('tenant')
  await expect(capacity.locator('[data-tenant-throttled="true"]')).toHaveCount(1)
  await capacity.getByLabel('容量超過の範囲').selectOption('global')
  await expect(capacity.locator('[data-tenant-throttled="true"]')).toHaveCount(3)
  await page.goto(`${base}/docs/architecture/agent-api-design`)
  const jobs=page.locator('[data-diagram-id="agent-api-job-states"]')
  await jobs.getByRole('button',{name:'202で受理',exact:true}).click()
  await expect(jobs.locator('[data-accepted-final-success="false"]')).toBeVisible()
  const events=page.locator('[data-diagram-id="agent-api-events-and-idempotency"]')
  await events.getByRole('button',{name:'再送の契約',exact:true}).click()
  await events.getByLabel('再送のキーと内容').selectOption('match')
  await expect(events.locator('[data-request-create]')).toHaveAttribute('data-request-create','false')
  await expect(events.locator('[data-request-reuse]')).toHaveAttribute('data-request-reuse','true')
  await events.getByLabel('再送のキーと内容').selectOption('different')
  await expect(events.locator('[data-request-reject]')).toHaveAttribute('data-request-reject','true')
})
test('all three source articles are readable without JavaScript',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
  try{
    const page=await context.newPage()
    for(const [route,phrase] of [['async-and-durable-agents','冪等性と重複実行'],['multi-tenancy-and-isolation','分離レベルの選択'],['agent-api-design','実行中の指示変更を API 契約に含める']]){
      await page.goto(`${base}/docs/architecture/${route}`)
      await expect(page.locator('article h3').filter({hasText:phrase})).toBeVisible()
    }
  }finally{await context.close()}
})
test('low PC playback, pause and printing keep contract and prose',async({page})=>{
  await page.setViewportSize({width:1280,height:720})
  await page.goto(`${base}/docs/architecture/agent-api-design`)
  const figure=page.locator('[data-diagram-id="agent-api-job-states"]')
  await figure.getByRole('button',{name:'内部から契約へ',exact:true}).click()
  await figure.getByRole('button',{name:'図解を再生',exact:true}).click()
  await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode','playing')
  await figure.getByRole('button',{name:'図解を一時停止',exact:true}).click()
  await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode','manual')
  await page.emulateMedia({media:'print'})
  await expect(figure.locator('svg[data-contract-diagram]')).toBeVisible()
  await expect(figure.locator('.aw-prose')).toContainText('内部でできないことは契約にできないため')
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
