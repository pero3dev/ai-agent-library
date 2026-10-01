import { test,expect } from '@playwright/test'
import { PROMPT_TOOL_OUTPUT_STAGES } from '../../lib/prompt-tool-output-model.mjs'
import { checkReadingArticles } from './reading-article-checks.mjs'
checkReadingArticles({name:'Prompt tool output',chapter:'implementation',stages:PROMPT_TOOL_OUTPUT_STAGES,sceneSelector:'svg[data-prompt-tool-output-diagram]',articles:[
 ['agent-prompt-design',['prompt-structure-boundaries','prompt-cause-revision']],
 ['tool-definition-design',['tool-definition-contract','tool-result-maintenance']],
 ['structured-output',['structured-method-schema','structured-validation-loop']]
]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
test('prompt structure keeps example approval stop and information conditions separate from diagnosis',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/implementation/agent-prompt-design`)
 const root=page.locator('[data-diagram-id="prompt-structure-boundaries"]')
 await root.getByRole('button',{name:'六つの役割',exact:true}).click()
 for(const section of ['0','1','2','3','4','5']){
  await root.getByRole('combobox',{name:'プロンプトのセクション',exact:true}).selectOption(section)
  await expect(root.locator('[data-prompt-section]')).toHaveAttribute('data-prompt-section',section)
 }
 await root.getByRole('button',{name:'条件へ変える',exact:true}).click()
 for(const action of ['read','write']){
  await root.getByRole('combobox',{name:'原文の操作区分',exact:true}).selectOption(action)
  await expect(root.locator('[data-prompt-approval-required]')).toHaveAttribute('data-prompt-approval-required',String(action==='write'))
 }
 await root.getByRole('button',{name:'止める条件',exact:true}).click()
 for(const errors of ['2','3','4'])for(const missing of ['yes','no']){
  await root.getByRole('combobox',{name:'同じエラーの回数例',exact:true}).selectOption(errors)
  await root.getByRole('combobox',{name:'判断情報の不足',exact:true}).selectOption(missing)
  await expect(root.locator('[data-prompt-stop]')).toHaveAttribute('data-prompt-stop',String(Number(errors)>=3))
  await expect(root.locator('[data-prompt-question]')).toHaveAttribute('data-prompt-question',String(missing==='yes'))
 }
 const causes=page.locator('[data-diagram-id="prompt-cause-revision"]')
 await causes.getByRole('button',{name:'症状から調べる',exact:true}).click()
 for(const cause of ['tool','memory','retrieval']){
  await causes.getByRole('combobox',{name:'原文の症状',exact:true}).selectOption(cause)
  await expect(causes.locator('[data-prompt-cause]')).toHaveAttribute('data-prompt-cause',cause)
  await expect(causes.locator('[data-cause-confirmed="false"]')).toBeVisible()
 }
})
test('expense lookup cannot submit change or delete and truncation is not full retrieval',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/implementation/tool-definition-design`)
 const root=page.locator('[data-diagram-id="tool-definition-contract"]')
 await root.getByRole('button',{name:'使う条件',exact:true}).click()
 for(const detail of ['what','when','cannot','format']){
  await root.getByRole('combobox',{name:'説明の四つの要素',exact:true}).selectOption(detail)
  await expect(root.locator('[data-tool-write-permitted="false"]')).toBeVisible()
 }
 const result=page.locator('[data-diagram-id="tool-result-maintenance"]')
 await result.getByRole('button',{name:'大きさと続き',exact:true}).click()
 for(const choice of ['dump','limited']){
  await result.getByRole('combobox',{name:'大きな結果の扱い',exact:true}).selectOption(choice)
  await expect(result.locator('[data-tool-all-results-retrieved="false"]')).toBeVisible()
 }
})
test('schema does not guarantee content and two retries after initial yield explicit failure',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/implementation/structured-output`)
 const methods=page.locator('[data-diagram-id="structured-method-schema"]')
 await methods.getByRole('button',{name:'三つの方式',exact:true}).click()
 for(const method of ['prompt','tool','native']){
  await methods.getByRole('combobox',{name:'構造化の方式',exact:true}).selectOption(method)
  await expect(methods.locator('[data-structured-method]')).toHaveAttribute('data-structured-method',method)
  await expect(methods.locator('[data-schema-content-guaranteed="false"]')).toBeVisible()
 }
 const root=page.locator('[data-diagram-id="structured-validation-loop"]')
 await root.getByRole('button',{name:'業務を検証',exact:true}).click()
 for(const schema of ['yes','no'])for(const business of ['yes','no'])for(const attempt of ['0','1','2']){
  for(const [name,value] of [['スキーマ検証の結果例',schema],['業務検証の結果例',business],['原文の試行番号',attempt]])await root.getByRole('combobox',{name,exact:true}).selectOption(value)
  await expect(root.locator('[data-structured-next]')).toHaveAttribute('data-structured-next',schema==='yes'&&business==='yes'?'use':attempt==='2'?'fail':'retry')
 }
})
test('all original lists tables code and TODO remain readable without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
 try{const page=await context.newPage();for(const route of ['agent-prompt-design','tool-definition-design','structured-output']){
  await page.goto(`${base}/docs/implementation/${route}`)
  await expect(page.locator('article h2').filter({hasText:'TODO・未確認事項'})).toBeVisible()
  await expect(page.locator('article ul').first()).toBeVisible()
 }}finally{await context.close()}
})
test('low PC playback pause and print retain the original limited retry code',async({page})=>{
 await page.setViewportSize({width:1280,height:720})
 await page.goto(`${base}/docs/implementation/structured-output`)
 const root=page.locator('[data-diagram-id="structured-validation-loop"]')
 await root.getByRole('button',{name:'業務を検証',exact:true}).click()
 await root.getByRole('button',{name:'図解を再生',exact:true}).click()
 await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','playing')
 await root.getByRole('button',{name:'図解を一時停止',exact:true}).click()
 await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','manual')
 await page.emulateMedia({media:'print'})
 await expect(root.locator('svg[data-prompt-tool-output-diagram]')).toBeVisible()
 await expect(root.locator('.aw-timeline')).toBeHidden()
 await expect(page.locator('article')).toContainText('MAX_RETRIES = 2')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
