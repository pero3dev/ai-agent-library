import { test,expect } from '@playwright/test'
import { CODING_PRODUCT_STAGES } from '../../lib/coding-products-model.mjs'
import { checkReadingArticles } from './reading-article-checks.mjs'
checkReadingArticles({name:'coding terminal products',chapter:'coding-agents',stages:CODING_PRODUCT_STAGES,sceneSelector:'svg[data-product-diagram]',articles:[
 ['claude-code',['claude-surfaces-runtime','claude-config-permission','claude-integrations-adoption']],
 ['openai-codex',['codex-surfaces-runtime','codex-config-permission','codex-integrations-adoption']],
 ['gemini-cli-and-code-assist',['google-products-runtime','google-config-data','google-integrations-adoption']]
]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
test('Claude own runners and remote control never imply on premise inference or external rollback',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/coding-agents/claude-code`)
 const runtime=page.locator('[data-diagram-id="claude-surfaces-runtime"]')
 await runtime.getByRole('button',{name:'自社runner',exact:true}).click()
 for(const location of ['local','managed','self']){
  await runtime.getByRole('combobox',{name:'実行する場所',exact:true}).selectOption(location)
  await expect(runtime.locator('[data-execution-own-host]')).toHaveAttribute('data-execution-own-host',String(location!=='managed'))
  await expect(runtime.locator('[data-inference-own-host]')).toHaveAttribute('data-inference-own-host','false')
  await expect(runtime.locator('[data-remote-moves-execution]')).toHaveAttribute('data-remote-moves-execution','false')
 }
 await runtime.getByRole('button',{name:'戻せる範囲',exact:true}).click()
 await expect(runtime.locator('[data-rewind-external="false"]')).toBeVisible()
})
test('Codex network needs an effective proxy for domain rules and review does not inspect every allowed action',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/coding-agents/openai-codex`)
 const permissions=page.locator('[data-diagram-id="codex-config-permission"]')
 await permissions.getByRole('button',{name:'通信とproxy',exact:true}).click()
 for(const network of ['off','on'])for(const proxy of ['off','on']){
  await permissions.getByRole('combobox',{name:'ローカルコマンドの通信',exact:true}).selectOption(network)
  await permissions.getByRole('combobox',{name:'ドメイン規則のプロキシ',exact:true}).selectOption(proxy)
  await expect(permissions.locator('[data-commands-connect]')).toHaveAttribute('data-commands-connect',String(network==='on'))
  await expect(permissions.locator('[data-domain-rules-enforced]')).toHaveAttribute('data-domain-rules-enforced',String(network==='on'&&proxy==='on'))
  await expect(permissions.locator('[data-controls-other-surfaces]')).toHaveAttribute('data-controls-other-surfaces','false')
 }
 await permissions.getByRole('button',{name:'審査の対象',exact:true}).click()
 await expect(permissions.locator('[data-auto-review-all-operations="false"]')).toBeVisible()
})
test('Google execution surfaces differ and API Paid conditions never imply no retention',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/coding-agents/gemini-cli-and-code-assist`)
 const runtime=page.locator('[data-diagram-id="google-products-runtime"]')
 await runtime.getByRole('button',{name:'実行の場所',exact:true}).click()
 for(const product of ['cli','ide','review','jules']){
  await runtime.getByRole('combobox',{name:'Google製品の実行面',exact:true}).selectOption(product)
  await expect(runtime.locator('[data-google-local-execution]')).toHaveAttribute('data-google-local-execution',String(['cli','ide'].includes(product)))
 }
 const data=page.locator('[data-diagram-id="google-config-data"]')
 await data.getByRole('button',{name:'PaidとUnpaid',exact:true}).click()
 for(const billing of ['active','unpaid'])for(const region of ['other','exception']){
  await data.getByRole('combobox',{name:'APIの課金条件',exact:true}).selectOption(billing)
  await data.getByRole('combobox',{name:'データ条項の地域条件',exact:true}).selectOption(region)
  await expect(data.locator('[data-paid-data-conditions]')).toHaveAttribute('data-paid-data-conditions',String(billing==='active'||region==='exception'))
  await expect(data.locator('[data-product-improvement-use]')).toHaveAttribute('data-product-improvement-use',String(billing==='unpaid'&&region==='other'))
  await expect(data.locator('[data-no-retention-guaranteed]')).toHaveAttribute('data-no-retention-guaranteed','false')
 }
})
test('three product articles and dated boundaries remain readable without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
 try{
  const page=await context.newPage()
  for(const route of ['claude-code','openai-codex','gemini-cli-and-code-assist']){
   await page.goto(`${base}/docs/coding-agents/${route}`)
   await expect(page.locator('article h3').filter({hasText:'権限管理とセキュリティ'})).toBeVisible()
   await expect(page.locator('article')).toContainText('最終確認日')
  }
 }finally{await context.close()}
})
test('low PC playback pause and print retain Codex original permission axes',async({page})=>{
 await page.setViewportSize({width:1280,height:720})
 await page.goto(`${base}/docs/coding-agents/openai-codex`)
 const figure=page.locator('[data-diagram-id="codex-config-permission"]')
 await figure.getByRole('button',{name:'二つの軸',exact:true}).click()
 await figure.getByRole('button',{name:'図解を再生',exact:true}).click()
 await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode','playing')
 await figure.getByRole('button',{name:'図解を一時停止',exact:true}).click()
 await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode','manual')
 await page.emulateMedia({media:'print'})
 await expect(figure.locator('svg[data-product-diagram]')).toBeVisible()
 await expect(figure.locator('.aw-prose')).toContainText('サンドボックスモード')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
