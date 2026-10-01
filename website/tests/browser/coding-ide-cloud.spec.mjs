import { test,expect } from '@playwright/test'
import { IDE_CLOUD_STAGES } from '../../lib/coding-ide-cloud-model.mjs'
import { checkReadingArticles } from './reading-article-checks.mjs'
checkReadingArticles({name:'coding IDE and cloud',chapter:'coding-agents',stages:IDE_CLOUD_STAGES,sceneSelector:'svg[data-ide-cloud-diagram]',articles:[
 ['cursor',['cursor-runtime-data','cursor-rules-security','cursor-connections-adoption']],
 ['windsurf',['windsurf-runtime-migration','windsurf-rules-security','windsurf-connections-adoption']],
 ['devin',['devin-delegation-runtime','devin-teaching-security','devin-connections-adoption']]
]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
test('Cursor historical indexing and local Run Modes do not become current server indexing or cloud approvals',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/coding-agents/cursor`)
 const root=page.locator('[data-diagram-id="cursor-runtime-data"]')
 await root.getByRole('button',{name:'索引の保存',exact:true}).click()
 for(const period of ['current','old']){
  await root.getByRole('combobox',{name:'検索方式の時点',exact:true}).selectOption(period)
  await expect(root.locator('[data-index-server]')).toHaveAttribute('data-index-server',String(period==='old'))
  await expect(root.locator('[data-inference-sent="true"]')).toBeVisible()
 }
 await root.getByRole('button',{name:'実行の判断',exact:true}).click()
 for(const surface of ['local','cloud'])for(const mode of ['review','allowlist','everything']){
  await root.getByRole('combobox',{name:'実行する面',exact:true}).selectOption(surface)
  await root.getByRole('combobox',{name:'ローカルのRun Mode',exact:true}).selectOption(mode)
  await expect(root.locator('[data-local-mode-applies]')).toHaveAttribute('data-local-mode-applies',String(surface==='local'))
  await expect(root.locator('[data-approval-possible]')).toHaveAttribute('data-approval-possible',String(surface==='local'&&mode!=='everything'))
  await expect(root.locator('[data-hard-boundary="false"]')).toBeVisible()
 }
})
test('Cursor privacy and BYOK do not remove backend transmission or retention exceptions',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/coding-agents/cursor`)
 const root=page.locator('[data-diagram-id="cursor-rules-security"]')
 await root.getByRole('button',{name:'送信と学習',exact:true}).click()
 for(const privacy of ['on','off'])for(const byok of ['yes','no']){
  await root.getByRole('combobox',{name:'Privacy Mode',exact:true}).selectOption(privacy)
  await root.getByRole('combobox',{name:'APIキーの経路',exact:true}).selectOption(byok)
  await expect(root.locator('[data-backend-used="true"]')).toBeVisible()
  await expect(root.locator('[data-training-may-occur]')).toHaveAttribute('data-training-may-occur',String(privacy==='off'))
  await expect(root.locator('[data-retention-exceptions="true"]')).toBeVisible()
 }
})
test('Desktop ACP third parties keep separate contracts and new rules are not legacy Cascade levels',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/coding-agents/windsurf`)
 const root=page.locator('[data-diagram-id="windsurf-runtime-migration"]')
 await root.getByRole('button',{name:'操作と委任',exact:true}).click()
 for(const agent of ['local','cloud','external']){
  await root.getByRole('combobox',{name:'Desktopで扱うAgent',exact:true}).selectOption(agent)
  await expect(root.locator('[data-devin-terms-apply]')).toHaveAttribute('data-devin-terms-apply',String(agent!=='external'))
  await expect(root.locator('[data-third-party-billing]')).toHaveAttribute('data-third-party-billing',String(agent==='external'))
 }
 await root.getByRole('button',{name:'権限の移行',exact:true}).click()
 for(const generation of ['old','new']){
  await root.getByRole('combobox',{name:'権限モデルの世代',exact:true}).selectOption(generation)
  await expect(root.locator('[data-permission-generation]')).toHaveAttribute('data-permission-generation',generation==='old'?'cascade':'devin-local')
 }
})
test('Devin blocking keeps the session; kill_session represents historical records, not current configuration',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/coding-agents/devin`)
 const root=page.locator('[data-diagram-id="devin-teaching-security"]')
 await root.getByRole('button',{name:'Guardrails',exact:true}).click()
 for(const action of ['log','warn','block','kill_session']){
  await root.getByRole('combobox',{name:'検知後の対応',exact:true}).selectOption(action)
  await expect(root.locator('[data-guard-message-blocked]')).toHaveAttribute('data-guard-message-blocked',String(action==='block'))
  await expect(root.locator('[data-guard-session-ended]')).toHaveAttribute('data-guard-session-ended',String(action==='kill_session'))
  await expect(root.locator('[data-guard-configurable]')).toHaveAttribute('data-guard-configurable',String(action!=='kill_session'))
  await expect(root.locator('[data-per-command-approval="false"]')).toBeVisible()
 }
})
test('IDE and cloud original text remains readable without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
 try{
  const page=await context.newPage()
  for(const route of ['cursor','windsurf','devin']){
   await page.goto(`${base}/docs/coding-agents/${route}`)
   await expect(page.locator('article h3').filter({hasText:'権限管理とセキュリティ'})).toBeVisible()
   await expect(page.locator('article')).toContainText('最終確認日')
  }
 }finally{await context.close()}
})
test('low PC playback pause and print retain Devin intervention and review',async({page})=>{
 await page.setViewportSize({width:1280,height:720})
 await page.goto(`${base}/docs/coding-agents/devin`)
 const root=page.locator('[data-diagram-id="devin-teaching-security"]')
 await root.getByRole('button',{name:'人の介入',exact:true}).click()
 await root.getByRole('button',{name:'図解を再生',exact:true}).click()
 await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','playing')
 await root.getByRole('button',{name:'図解を一時停止',exact:true}).click()
 await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','manual')
 await page.emulateMedia({media:'print'})
 await expect(root.locator('svg[data-ide-cloud-diagram]')).toBeVisible()
 await expect(root.locator('.aw-prose')).toContainText('事後(PR レビュー)')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
