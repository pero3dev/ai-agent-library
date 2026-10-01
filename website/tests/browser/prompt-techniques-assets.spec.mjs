import {test,expect} from '@playwright/test'
import {PROMPT_TECHNIQUES_ASSETS_STAGES} from '../../lib/prompt-techniques-assets-model.mjs'
import {checkReadingArticles} from './reading-article-checks.mjs'
checkReadingArticles({name:'Prompt techniques assets',chapter:'implementation',stages:PROMPT_TECHNIQUES_ASSETS_STAGES,sceneSelector:'svg[data-prompt-techniques-diagram]',articles:[
 ['prompt-engineering-fundamentals',['prompt-basics-input','prompt-basics-chain']],
 ['prompt-engineering-patterns',['prompt-pattern-layout','prompt-pattern-verification']],
 ['prompt-management',['prompt-management-assets','prompt-management-change']]
]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
test('delimiters do not authorize and long explanations do not guarantee quality',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/implementation/prompt-engineering-fundamentals`)
 const input=page.locator('[data-diagram-id="prompt-basics-input"]')
 await input.getByRole('button',{name:'指示と資料',exact:true}).click()
 for(const value of ['yes','no']){
  await input.getByRole('combobox',{name:'入力領域の区分',exact:true}).selectOption(value)
  await expect(input.locator('[data-delimiter-authorizes="false"]')).toBeVisible()
 }
 const chain=page.locator('[data-diagram-id="prompt-basics-chain"]')
 await chain.getByRole('button',{name:'モデルと推論',exact:true}).click()
 for(const value of ['generation','reasoning']){
  await chain.getByRole('combobox',{name:'原文の生成と推論の区分',exact:true}).selectOption(value)
  await expect(chain.locator('[data-long-explanation-guarantees-quality="false"]')).toBeVisible()
 }
})
test('self-correction needs evidence and token caps do not specify output length',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/implementation/prompt-engineering-patterns`)
 const root=page.locator('[data-diagram-id="prompt-pattern-verification"]')
 await expect(root.locator('[data-self-correction-guaranteed="false"]')).toBeVisible()
 await root.getByRole('button',{name:'出力の制御',exact:true}).click()
 for(const value of ['prefill','stop','schema','tokens']){
  await root.getByRole('combobox',{name:'原文の出力制御',exact:true}).selectOption(value)
  await expect(root.locator('[data-max-tokens-is-length="false"]')).toBeVisible()
 }
})
test('reading a judgment failure contaminates the adoption gate and no displayed gate changes production',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/implementation/prompt-management`)
 const root=page.locator('[data-diagram-id="prompt-management-change"]')
 for(const judgment of ['unused','used']){
  await root.getByRole('button',{name:'回帰のゲート',exact:true}).click()
  await root.getByRole('combobox',{name:'採用判断用ケースの状態',exact:true}).selectOption(judgment)
  await root.getByRole('button',{name:'明示的に昇格',exact:true}).click()
  for(const review of ['yes','no'])for(const regression of ['yes','no'])for(const promotion of ['yes','no'])for(const scope of ['yes','no']){
   for(const [name,value] of [['変更レビュー',review],['回帰テスト',regression],['明示的な昇格',promotion],['共有部品の検査範囲',scope]])await root.getByRole('combobox',{name,exact:true}).selectOption(value)
   await expect(root.locator('[data-prompt-release-ready]')).toHaveAttribute('data-prompt-release-ready',String(judgment==='unused'&&[review,regression,promotion,scope].every(v=>v==='yes')))
   await expect(root.locator('[data-production-changed="false"]')).toBeVisible()
  }
 }
})
test('all original examples Mermaid tables and TODO remain with JavaScript disabled',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
 try{const page=await context.newPage();for(const route of ['prompt-engineering-fundamentals','prompt-engineering-patterns','prompt-management']){
  await page.goto(`${base}/docs/implementation/${route}`)
  await expect(page.locator('article h2').filter({hasText:'TODO・未確認事項'})).toBeVisible()
  await expect(page.locator('article ul').first()).toBeVisible()
 }}finally{await context.close()}
})
test('low PC playback pause and print preserve the prompt version and evaluated scope',async({page})=>{
 await page.setViewportSize({width:1280,height:720})
 await page.goto(`${base}/docs/implementation/prompt-management`)
 const root=page.locator('[data-diagram-id="prompt-management-assets"]')
 await root.getByRole('button',{name:'共有の影響',exact:true}).click()
 await root.getByRole('button',{name:'図解を再生',exact:true}).click()
 await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','playing')
 await root.getByRole('button',{name:'図解を一時停止',exact:true}).click()
 await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','manual')
 await page.emulateMedia({media:'print'})
 await expect(root.locator('svg[data-prompt-techniques-diagram]')).toBeVisible()
 await expect(root.locator('.aw-timeline')).toBeHidden()
 await expect(page.locator('article')).toContainText('system.md')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
