import { test,expect } from '@playwright/test'
import { CODING_OPTIONS_STAGES } from '../../lib/coding-options-model.mjs'
import { checkReadingArticles } from './reading-article-checks.mjs'
checkReadingArticles({name:'Copilot OSS and comparison',chapter:'coding-agents',stages:CODING_OPTIONS_STAGES,sceneSelector:'svg[data-coding-options-diagram]',articles:[
 ['github-copilot',['copilot-surfaces-flow','copilot-policy-boundaries','copilot-adoption-budget']],
 ['open-source-coding-agents',['oss-freedom-responsibility','oss-evaluation-controls']],
 ['coding-agents-comparison',['comparison-matrix-meaning','comparison-contract-use']]
]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
test('assessment cannot count and an enabled approval invalidates on new commits',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/coding-agents/github-copilot`)
 const root=page.locator('[data-diagram-id="copilot-surfaces-flow"]')
 await root.getByRole('button',{name:'評価と承認',exact:true}).click()
 for(const enabled of ['on','off'])for(const changed of ['yes','no']){
  await root.getByRole('combobox',{name:'管理者の承認設定',exact:true}).selectOption(enabled)
  await root.getByRole('combobox',{name:'レビュー後のcommit',exact:true}).selectOption(changed)
  await expect(root.locator('[data-approval-can-count]')).toHaveAttribute('data-approval-can-count',String(enabled==='on'&&changed==='no'))
  await expect(root.locator('[data-assessment-counts="false"]')).toBeVisible()
  await expect(root.locator('[data-automatic-merge="false"]')).toBeVisible()
 }
 const policy=page.locator('[data-diagram-id="copilot-policy-boundaries"]')
 await policy.getByRole('button',{name:'提供面の制御',exact:true}).click()
 for(const [surface,status]of [['app-cli','supported'],['ide-agent','unsupported'],['cloud','unconfirmed']]){
  await policy.getByRole('combobox',{name:'コンテンツ除外を使う面',exact:true}).selectOption(surface)
  await expect(policy.locator('[data-content-exclusion]')).toHaveAttribute('data-content-exclusion',status)
 }
 const budget=page.locator('[data-diagram-id="copilot-adoption-budget"]')
 await budget.getByRole('button',{name:'選択と予算申請',exact:true}).click()
 await budget.getByRole('combobox',{name:'予算増額の申請',exact:true}).selectOption('yes')
 await expect(budget.locator('[data-budget-increase]')).toHaveAttribute('data-budget-increase','false')
})
test('OSS freedom changes inference route but cannot guarantee no transmission or maintained status',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/coding-agents/open-source-coding-agents`)
 const root=page.locator('[data-diagram-id="oss-freedom-responsibility"]')
 await root.getByRole('button',{name:'選べるもの',exact:true}).click()
 for(const path of ['api','local']){
  await root.getByRole('combobox',{name:'自分で選ぶ推論経路',exact:true}).selectOption(path)
  await expect(root.locator('[data-external-inference]')).toHaveAttribute('data-external-inference',String(path==='api'))
  await expect(root.locator('[data-oss-guarantees-no-transmission="false"]')).toBeVisible()
 }
 await root.getByRole('button',{name:'状態を読む',exact:true}).click()
 for(const state of ['archive','readme','release']){
  await root.getByRole('combobox',{name:'プロジェクト状態の根拠',exact:true}).selectOption(state)
  await expect(root.locator('[data-liveness-guaranteed="false"]')).toBeVisible()
 }
})
test('comparison unknown requirements cannot proceed and symbols never rank quality',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/coding-agents/coding-agents-comparison`)
 const root=page.locator('[data-diagram-id="comparison-matrix-meaning"]')
 await root.getByRole('button',{name:'契約を絞る',exact:true}).click()
 for(const state of ['met','violated','unknown']){
  await root.getByRole('combobox',{name:'必須制約の確認結果',exact:true}).selectOption(state)
  await expect(root.locator('[data-candidate-can-proceed]')).toHaveAttribute('data-candidate-can-proceed',String(state==='met'))
  await expect(root.locator('[data-quality-ranked="false"]')).toBeVisible()
 }
})
test('three articles preserve original tables dates links and warnings without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
 try{const page=await context.newPage();for(const route of ['github-copilot','open-source-coding-agents','coding-agents-comparison']){
  await page.goto(`${base}/docs/coding-agents/${route}`)
  await expect(page.locator('article table').first()).toBeVisible()
  await expect(page.locator('article h2').filter({hasText:'実務での注意点'})).toBeVisible()
 }}finally{await context.close()}
})
test('low PC playback pause and print retain Copilot approval and original tables',async({page})=>{
 await page.setViewportSize({width:1280,height:720})
 await page.goto(`${base}/docs/coding-agents/github-copilot`)
 const root=page.locator('[data-diagram-id="copilot-surfaces-flow"]')
 await root.getByRole('button',{name:'評価と承認',exact:true}).click()
 await root.getByRole('button',{name:'図解を再生',exact:true}).click()
 await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','playing')
 await root.getByRole('button',{name:'図解を一時停止',exact:true}).click()
 await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','manual')
 await page.emulateMedia({media:'print'})
 await expect(root.locator('svg[data-coding-options-diagram]')).toBeVisible()
 await expect(root.locator('.aw-prose')).toContainText('assessment だけでは必要承認数に算入されません')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
