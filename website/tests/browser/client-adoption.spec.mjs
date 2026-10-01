import { test,expect } from '@playwright/test'
import { CLIENT_ADOPTION_STAGES } from '../../lib/client-adoption-model.mjs'
import { checkReadingArticles } from './reading-article-checks.mjs'
checkReadingArticles({name:'Client adoption',chapter:'coding-agents',stages:CLIENT_ADOPTION_STAGES,sceneSelector:'svg[data-client-adoption-diagram]',articles:[['se-client-adoption',['client-approval-contract','client-staged-adoption','client-measured-evidence']]]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''

test('stakeholder materials and legal topics never auto-exempt quality or decide prices',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/coding-agents/se-client-adoption`)
 const root=page.locator('[data-diagram-id="client-approval-contract"]')
 await root.getByRole('button',{name:'判断者の棚卸し',exact:true}).click()
 for(const actor of ['client','prime','company','audit']){
  await root.getByRole('combobox',{name:'資料を示す相手',exact:true}).selectOption(actor)
  await expect(root.locator('[data-client-actor]')).toHaveAttribute('data-client-actor',actor)
 }
 await root.getByRole('button',{name:'契約の論点',exact:true}).click()
 for(const topic of ['quality','ip','data','industry']){
  await root.getByRole('combobox',{name:'法務へつなぐ論点',exact:true}).selectOption(topic)
  await expect(root.locator('[data-ai-exempts-quality="false"]')).toBeVisible()
 }
 await root.getByRole('button',{name:'見積りの前提',exact:true}).click()
 await expect(root.locator('svg[data-client-adoption-diagram]')).toContainText('単価の判断は別')
})

test('self-authored code can be under client contracts and no unknown gate permits rollout',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/coding-agents/se-client-adoption`)
 const root=page.locator('[data-diagram-id="client-staged-adoption"]')
 await root.getByRole('button',{name:'題材を確認',exact:true}).click()
 await expect(root.locator('[data-self-authorship-exempt="false"]')).toBeVisible()
 await root.getByRole('button',{name:'合意して適用',exact:true}).click()
 for(const contract of ['yes','no'])for(const classified of ['yes','no'])for(const approved of ['yes','no'])for(const measured of ['yes','no']){
  for(const [name,value] of [['契約と経路の確認',contract],['顧客非依存の分類確認',classified],['必要承認の確認',approved],['対象の効果とリスクの測定',measured]])await root.getByRole('combobox',{name,exact:true}).selectOption(value)
  await expect(root.locator('[data-client-scope-ready]')).toHaveAttribute('data-client-scope-ready',String([contract,classified,approved,measured].every(v=>v==='yes')))
  await expect(root.locator('[data-unlimited-rollout="false"]')).toBeVisible()
 }
})

test('client source tables contract cautions and TODO remain readable with JavaScript disabled',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
 try{const page=await context.newPage();await page.goto(`${base}/docs/coding-agents/se-client-adoption`)
  await expect(page.locator('article table').first()).toBeVisible()
  await expect(page.locator('article h2').filter({hasText:'TODO・未確認事項'})).toBeVisible()
  await expect(page.locator('article')).toContainText('自社が書いたコード')
 }finally{await context.close()}
})

test('low PC playback pause and print preserve agreement and measurement boundaries',async({page})=>{
 await page.setViewportSize({width:1280,height:720})
 await page.goto(`${base}/docs/coding-agents/se-client-adoption`)
 const root=page.locator('[data-diagram-id="client-staged-adoption"]')
 await root.getByRole('button',{name:'題材を確認',exact:true}).click()
 await root.getByRole('button',{name:'図解を再生',exact:true}).click()
 await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','playing')
 await root.getByRole('button',{name:'図解を一時停止',exact:true}).click()
 await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','manual')
 await page.emulateMedia({media:'print'})
 await expect(root.locator('svg[data-client-adoption-diagram]')).toBeVisible()
 await expect(root.locator('.aw-timeline')).toBeHidden()
 await expect(page.locator('article')).toContainText('品質責任')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
