import {test,expect} from '@playwright/test'
import {FRAMEWORK_MODEL_TUNING_STAGES,TUNING_CONDITIONS} from '../../lib/framework-model-tuning-model.mjs'
import {checkReadingArticles} from './reading-article-checks.mjs'
checkReadingArticles({name:'Framework model tuning',chapter:'implementation',stages:FRAMEWORK_MODEL_TUNING_STAGES,sceneSelector:'svg[data-framework-model-tuning-diagram]',articles:[
 ['framework-selection',['framework-abstraction-selection','framework-boundary-migration']],
 ['model-selection',['model-constraints-tier','model-portfolio-updates']],
 ['fine-tuning-and-distillation',['tuning-choice-methods','distillation-data-lifecycle']]
]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
test('migration cannot skip independent tools prompts evaluation or recorded versions',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/implementation/framework-selection`)
 const root=page.locator('[data-diagram-id="framework-boundary-migration"]')
 await root.getByRole('button',{name:'移行の条件',exact:true}).click()
 for(const value of ['tools','prompts','evaluation','version','none']){await root.getByRole('combobox',{name:'移行検査で不足する条件',exact:true}).selectOption(value);await expect(root.locator('[data-migration-candidate]')).toHaveAttribute('data-migration-candidate',String(value==='none'));await expect(root.locator('[data-migration-executed="false"]')).toBeVisible()}
})
test('unknown conditions are not availability and a failed condition needs another model route',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/implementation/model-selection`)
 const root=page.locator('[data-diagram-id="model-constraints-tier"]')
 await root.getByRole('button',{name:'条件の未確認',exact:true}).click()
 for(const modality of ['unknown','yes','no'])for(const provision of ['unknown','yes','no'])for(const evaluation of ['unknown','yes','no']){
  for(const [name,value] of [['modalの対応',modality],['提供・データ条件',provision],['実タスクの評価',evaluation]])await root.getByRole('combobox',{name,exact:true}).selectOption(value)
  const values=[modality,provision,evaluation];await expect(root.locator('[data-model-condition-next]')).toHaveAttribute('data-model-condition-next',values.includes('no')?'alternative':values.includes('unknown')?'confirm':'evaluate-candidate');await expect(root.locator('[data-model-deployment-executed="false"]')).toBeVisible()
 }
})
test('all seven FT gates and uncontaminated evaluation remain visible without executing training',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/implementation/fine-tuning-and-distillation`)
 const root=page.locator('[data-diagram-id="tuning-choice-methods"]')
 await root.getByRole('button',{name:'七つの前提',exact:true}).click()
 for(const value of [...TUNING_CONDITIONS,'none']){await root.getByRole('combobox',{name:'FT検討の不足条件',exact:true}).selectOption(value);await expect(root.locator('[data-tuning-candidate]')).toHaveAttribute('data-tuning-candidate',String(value==='none'));await expect(root.locator('[data-training-executed="false"]')).toBeVisible();await expect(root.locator('[data-tuning-quality-guaranteed="false"]')).toBeVisible()}
 const data=page.locator('[data-diagram-id="distillation-data-lifecycle"]')
 await data.getByRole('button',{name:'学習と評価を分離',exact:true}).click()
 for(const value of ['mixed','separate']){await data.getByRole('combobox',{name:'学習用と評価用の分離',exact:true}).selectOption(value);await expect(data.locator('[data-tuning-evaluation-contaminated]')).toHaveAttribute('data-tuning-evaluation-contaminated',String(value==='mixed'))}
 await data.getByRole('button',{name:'改善と非劣化',exact:true}).click()
 for(const value of ['loss','regression','both']){await data.getByRole('combobox',{name:'FT前後の評価結果の模式例',exact:true}).selectOption(value);await expect(data.locator('[data-tuning-acceptance-candidate]')).toHaveAttribute('data-tuning-acceptance-candidate',String(value==='both'))}
})
test('original tables model examples price snapshots and TODO remain without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
 try{const page=await context.newPage();for(const route of ['framework-selection','model-selection','fine-tuning-and-distillation']){await page.goto(`${base}/docs/implementation/${route}`);await expect(page.locator('article h2').filter({hasText:'TODO・未確認事項'})).toBeVisible();await expect(page.locator('article table').first()).toBeVisible()}}finally{await context.close()}
})
test('low PC playback pause and print retain separate evaluation and provider conditions',async({page})=>{
 await page.setViewportSize({width:1280,height:720});await page.goto(`${base}/docs/implementation/fine-tuning-and-distillation`)
 const root=page.locator('[data-diagram-id="distillation-data-lifecycle"]')
 await root.getByRole('button',{name:'学習と評価を分離',exact:true}).click()
 await root.getByRole('button',{name:'図解を再生',exact:true}).click();await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','playing')
 await root.getByRole('button',{name:'図解を一時停止',exact:true}).click();await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','manual')
 await page.emulateMedia({media:'print'});await expect(root.locator('svg[data-framework-model-tuning-diagram]')).toBeVisible();await expect(root.locator('.aw-timeline')).toBeHidden();await expect(page.locator('article')).toContainText('評価用を分離');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
