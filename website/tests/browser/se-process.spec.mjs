import { test,expect } from '@playwright/test'
import { SE_PROCESS_STAGES } from '../../lib/se-process-model.mjs'
import { checkReadingArticles } from './reading-article-checks.mjs'
checkReadingArticles({name:'SE process design and testing',chapter:'coding-agents',stages:SE_PROCESS_STAGES,sceneSelector:'svg[data-se-process-diagram]',articles:[
 ['se-process-map',['se-common-principles','se-v-model-map']],
 ['se-requirements-and-design',['se-upstream-review','se-document-delivery']],
 ['se-test-process',['se-test-design-generation','se-test-oracle-evidence']]
]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
test('V pairs retain all original stages and people keep each process decision',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/coding-agents/se-process-map`)
 const root=page.locator('[data-diagram-id="se-v-model-map"]')
 await root.getByRole('button',{name:'成果物と検証',exact:true}).click()
 for(const pair of ['requirements','basic','detail']){
  await root.getByRole('combobox',{name:'対応する成果物',exact:true}).selectOption(pair)
  await expect(root.locator(`[data-v-pair="${pair}"]`)).toHaveAttribute('data-selected','true')
  await expect(root.locator('[data-v-pair][data-selected="true"]')).toHaveCount(1)
 }
 await root.getByRole('button',{name:'工程の役割',exact:true}).click()
 for(const process of ['requirements','design','implementation','testing','maintenance']){
  await root.getByRole('combobox',{name:'担当する工程',exact:true}).selectOption(process)
  await expect(root.locator('[data-process-role]')).toHaveAttribute('data-process-role',process)
 }
})
test('document conversion preserves chosen source and masking never approves an information route',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/coding-agents/se-requirements-and-design`)
 const root=page.locator('[data-diagram-id="se-document-delivery"]')
 await root.getByRole('button',{name:'形式の段階',exact:true}).click()
 for(const source of ['text','excel']){
  await root.getByRole('combobox',{name:'合意した正本',exact:true}).selectOption(source)
  await expect(root.locator('[data-design-source]')).toHaveAttribute('data-design-source',source)
  await expect(root.locator('[data-conversion-moves-source="false"]')).toBeVisible()
 }
 await root.getByRole('button',{name:'許可した経路',exact:true}).click()
 for(const approved of ['yes','no'])for(const mask of ['yes','no']){
  await root.getByRole('combobox',{name:'情報経路の許可',exact:true}).selectOption(approved)
  await root.getByRole('combobox',{name:'不要な機微情報',exact:true}).selectOption(mask)
  await expect(root.locator('[data-can-send]')).toHaveAttribute('data-can-send',String(approved==='yes'))
  await expect(root.locator('[data-mask-replaces-approval="false"]')).toBeVisible()
 }
})
test('green requires a specification oracle, execution and reviewed scope, and never guarantees no defects',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/coding-agents/se-test-process`)
 const root=page.locator('[data-diagram-id="se-test-oracle-evidence"]')
 await root.getByRole('button',{name:'判断の範囲',exact:true}).click()
 for(const green of ['yes','no'])for(const oracle of ['specification','implementation'])for(const executed of ['yes','no'])for(const scope of ['yes','no']){
  await root.getByRole('combobox',{name:'テストの結果',exact:true}).selectOption(green)
  await root.getByRole('combobox',{name:'テスト期待値の根拠',exact:true}).selectOption(oracle)
  await root.getByRole('combobox',{name:'記録の実施状態',exact:true}).selectOption(executed)
  await root.getByRole('combobox',{name:'検証範囲の確認',exact:true}).selectOption(scope)
  await expect(root.locator('[data-supports-scope]')).toHaveAttribute('data-supports-scope',String(green==='yes'&&oracle==='specification'&&executed==='yes'&&scope==='yes'))
  await expect(root.locator('[data-no-defects-guaranteed="false"]')).toBeVisible()
 }
})
test('three SE articles preserve text, Mermaid and tables without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
 try{
  const page=await context.newPage()
  for(const route of ['se-process-map','se-requirements-and-design','se-test-process']){
   await page.goto(`${base}/docs/coding-agents/${route}`)
   await expect(page.locator('article h2').filter({hasText:'実務での注意点'})).toBeVisible()
   await expect(page.locator('article table').first()).toBeVisible()
  }
 }finally{await context.close()}
})
test('low PC playback pause and print retain test oracle and evidence original text',async({page})=>{
 await page.setViewportSize({width:1280,height:720})
 await page.goto(`${base}/docs/coding-agents/se-test-process`)
 const root=page.locator('[data-diagram-id="se-test-oracle-evidence"]')
 await root.getByRole('button',{name:'独立した根拠',exact:true}).click()
 await root.getByRole('button',{name:'図解を再生',exact:true}).click()
 await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','playing')
 await root.getByRole('button',{name:'図解を一時停止',exact:true}).click()
 await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','manual')
 await page.emulateMedia({media:'print'})
 await expect(root.locator('svg[data-se-process-diagram]')).toBeVisible()
 await expect(root.locator('.aw-prose')).toContainText('期待値を人が仕様から確定する')
 await expect(root.locator('.aw-prose')).toContainText('実行結果の集約に限定し')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
