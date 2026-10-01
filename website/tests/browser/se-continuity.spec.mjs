import { test,expect } from '@playwright/test'
import { SE_CONTINUITY_STAGES } from '../../lib/se-continuity-model.mjs'
import { checkReadingArticles } from './reading-article-checks.mjs'
checkReadingArticles({name:'SE continuity and enterprise',chapter:'coding-agents',stages:SE_CONTINUITY_STAGES,sceneSelector:'svg[data-se-continuity-diagram]',articles:[
 ['se-legacy-code-analysis',['legacy-observation-draft','legacy-measure-migrate']],
 ['se-maintenance-and-operations',['maintenance-hypothesis-change','maintenance-production-boundary']],
 ['se-enterprise-constraints',['enterprise-constraints-topology','enterprise-contract-route']]
]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
test('legacy impact never guarantees no impact and comparison needs execution conditions and scope',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/coding-agents/se-legacy-code-analysis`)
 const observation=page.locator('[data-diagram-id="legacy-observation-draft"]')
 await observation.getByRole('button',{name:'影響の調査',exact:true}).click()
 for(const path of ['static','dynamic','outside']){
  await observation.getByRole('combobox',{name:'影響を調べる経路',exact:true}).selectOption(path)
  await expect(observation.locator('[data-impact-none-guaranteed="false"]')).toBeVisible()
 }
 const compare=page.locator('[data-diagram-id="legacy-measure-migrate"]')
 await compare.getByRole('button',{name:'新旧を比較',exact:true}).click()
 for(const executed of ['yes','no'])for(const conditions of ['yes','no'])for(const scope of ['yes','no']){
  await compare.getByRole('combobox',{name:'新旧比較の実行',exact:true}).selectOption(executed)
  await compare.getByRole('combobox',{name:'新旧の比較条件',exact:true}).selectOption(conditions)
  await compare.getByRole('combobox',{name:'検証範囲の確認',exact:true}).selectOption(scope)
  await expect(compare.locator('[data-comparison-evidence-ready]')).toHaveAttribute('data-comparison-evidence-ready',String(executed==='yes'&&conditions==='yes'&&scope==='yes'))
 }
 await compare.getByRole('button',{name:'要求と分ける',exact:true}).click()
 await expect(compare.locator('[data-desired-requirements-verified="false"]')).toBeVisible()
})
test('maintenance evidence never automatically confirms cause and masking never bypasses the route',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/coding-agents/se-maintenance-and-operations`)
 const hypothesis=page.locator('[data-diagram-id="maintenance-hypothesis-change"]')
 await hypothesis.getByRole('button',{name:'原因の証拠',exact:true}).click()
 for(const evidence of ['none','logs','reproduce','code']){
  await hypothesis.getByRole('combobox',{name:'調査で得た根拠',exact:true}).selectOption(evidence)
  await expect(hypothesis.locator('[data-cause-auto-confirmed="false"]')).toBeVisible()
 }
 const production=page.locator('[data-diagram-id="maintenance-production-boundary"]')
 await production.getByRole('button',{name:'渡す情報',exact:true}).click()
 for(const masked of ['yes','no'])for(const route of ['unknown','denied','allowed']){
  await production.getByRole('combobox',{name:'本番ログの加工',exact:true}).selectOption(masked)
  await production.getByRole('combobox',{name:'契約と送信経路',exact:true}).selectOption(route)
  await expect(production.locator('[data-information-ready]')).toHaveAttribute('data-information-ready',String(masked==='yes'&&route==='allowed'))
 }
 await production.getByRole('button',{name:'環境の分離',exact:true}).click()
 await expect(production.locator('[data-agent-production-access="false"]')).toBeVisible()
})
test('enterprise communication differs from retention and unknown contracts or routes never permit candidates',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/coding-agents/se-enterprise-constraints`)
 const topology=page.locator('[data-diagram-id="enterprise-constraints-topology"]')
 await topology.getByRole('button',{name:'閉域の通信',exact:true}).click()
 for(const network of ['closed','open']){
  await topology.getByRole('combobox',{name:'推論APIへの到達',exact:true}).selectOption(network)
  await expect(topology.locator('[data-remote-api-reachable]')).toHaveAttribute('data-remote-api-reachable',String(network==='open'))
  await expect(topology.locator('[data-local-alone-guarantees-airgap="false"]')).toBeVisible()
 }
 const route=page.locator('[data-diagram-id="enterprise-contract-route"]')
 await route.getByRole('button',{name:'経路を照合',exact:true}).click()
 for(const contract of ['unknown','denied','allowed'])for(const classified of ['yes','no'])for(const verified of ['yes','no']){
  await route.getByRole('combobox',{name:'説明用案件の契約状態',exact:true}).selectOption(contract)
  await route.getByRole('combobox',{name:'対象の情報分類',exact:true}).selectOption(classified)
  await route.getByRole('combobox',{name:'経路と条件の照合',exact:true}).selectOption(verified)
  await expect(route.locator('[data-enterprise-candidate-ready]')).toHaveAttribute('data-enterprise-candidate-ready',String(contract==='allowed'&&classified==='yes'&&verified==='yes'))
  await expect(route.locator('[data-legal-compliance-determined="false"]')).toBeVisible()
 }
})
test('all three continuity articles retain their original tables and TODO without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
 try{const page=await context.newPage();for(const route of ['se-legacy-code-analysis','se-maintenance-and-operations','se-enterprise-constraints']){
  await page.goto(`${base}/docs/coding-agents/${route}`)
  await expect(page.locator('article table').first()).toBeVisible()
  await expect(page.locator('article h2').filter({hasText:'TODO・未確認事項'})).toBeVisible()
 }}finally{await context.close()}
})
test('low PC playback pause and print keep production separation and source text',async({page})=>{
 await page.setViewportSize({width:1280,height:720})
 await page.goto(`${base}/docs/coding-agents/se-maintenance-and-operations`)
 const root=page.locator('[data-diagram-id="maintenance-production-boundary"]')
 await root.getByRole('button',{name:'渡す情報',exact:true}).click()
 await root.getByRole('button',{name:'図解を再生',exact:true}).click()
 await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','playing')
 await root.getByRole('button',{name:'図解を一時停止',exact:true}).click()
 await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','manual')
 await page.emulateMedia({media:'print'})
 await expect(root.locator('svg[data-se-continuity-diagram]')).toBeVisible()
 await expect(root.locator('.aw-prose')).toContainText('本番反映は人が承認して実行します')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
