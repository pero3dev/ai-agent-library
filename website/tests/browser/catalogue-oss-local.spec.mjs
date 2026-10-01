import {test,expect} from '@playwright/test'
import {CATALOGUE_OSS_LOCAL_STAGES} from '../../lib/catalogue-oss-local-model.mjs'
import {checkReadingArticles} from './reading-article-checks.mjs'
checkReadingArticles({name:'Catalogue OSS local',chapter:'implementation',stages:CATALOGUE_OSS_LOCAL_STAGES,sceneSelector:'svg[data-catalogue-oss-local-diagram]',articles:[
 ['llm-landscape',['catalogue-common-map','catalogue-provider-boundaries','catalogue-openweight-licenses']],
 ['open-source-ai-ecosystem',['oss-layers-permission','oss-provenance-maintenance']],
 ['local-and-on-device-llm',['local-runtime-selection','local-quality-deployment']]
]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
test('asset acceptance cannot skip the version use lineage or maintenance and never confers legal compliance',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/implementation/open-source-ai-ecosystem`)
 const root=page.locator('[data-diagram-id="oss-provenance-maintenance"]')
 await root.getByRole('button',{name:'採用の確認',exact:true}).click()
 for(const value of ['version','use','provenance','maintenance','none']){await root.getByRole('combobox',{name:'受入確認の不足条件',exact:true}).selectOption(value);await expect(root.locator('[data-asset-review-candidate]')).toHaveAttribute('data-asset-review-candidate',String(value==='none'));await expect(root.locator('[data-legal-compliance-guaranteed="false"]')).toBeVisible();await expect(root.locator('[data-asset-deployment-executed="false"]')).toBeVisible()}
})
test('local quality failure cannot bypass network and data conditions or complete a device update by distribution alone',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/implementation/local-and-on-device-llm`)
 const root=page.locator('[data-diagram-id="local-quality-deployment"]')
 await root.getByRole('button',{name:'昇格の条件',exact:true}).click()
 for(const quality of ['no','yes'])for(const network of ['no','yes'])for(const external of ['no','yes']){
  for(const [name,value] of [['ローカルの品質条件',quality],['ネットワークを利用可能',network],['外部送信の条件',external]])await root.getByRole('combobox',{name,exact:true}).selectOption(value)
  await expect(root.locator('[data-local-cloud-next]')).toHaveAttribute('data-local-cloud-next',quality==='yes'?'local':network==='yes'&&external==='yes'?'confirm-cloud-route':'hold-and-confirm');await expect(root.locator('[data-external-transmission-executed="false"]')).toBeVisible()
 }
 await root.getByRole('button',{name:'端末ごとの更新',exact:true}).click()
 for(const value of ['incomplete','verified']){await root.getByRole('combobox',{name:'端末ごとの更新確認',exact:true}).selectOption(value);await expect(root.locator('[data-local-update-candidate]')).toHaveAttribute('data-local-update-candidate',String(value==='verified'))}
})
test('provider tables license terms runtime examples and TODO remain without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
 try{const page=await context.newPage();for(const route of ['llm-landscape','open-source-ai-ecosystem','local-and-on-device-llm']){await page.goto(`${base}/docs/implementation/${route}`);await expect(page.locator('article h2').filter({hasText:'TODO・未確認事項'})).toBeVisible();await expect(page.locator('article table').first()).toBeVisible()}}finally{await context.close()}
})
test('low PC playback pause and print retain local quality and distribution limits',async({page})=>{
 await page.setViewportSize({width:1280,height:720});await page.goto(`${base}/docs/implementation/local-and-on-device-llm`)
 const root=page.locator('[data-diagram-id="local-quality-deployment"]')
 await root.getByRole('button',{name:'昇格の条件',exact:true}).click();await root.getByRole('button',{name:'図解を再生',exact:true}).click();await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','playing')
 await root.getByRole('button',{name:'図解を一時停止',exact:true}).click();await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','manual')
 await page.emulateMedia({media:'print'});await expect(root.locator('svg[data-catalogue-oss-local-diagram]')).toBeVisible();await expect(root.locator('.aw-timeline')).toBeHidden();await expect(page.locator('article')).toContainText('量子化');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
