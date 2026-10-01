import {test,expect} from '@playwright/test'
import {RAG_MEMORY_GRAPH_STAGES} from '../../lib/rag-memory-graph-model.mjs'
import {checkReadingArticles} from './reading-article-checks.mjs'
checkReadingArticles({name:'RAG memory graph',chapter:'implementation',stages:RAG_MEMORY_GRAPH_STAGES,sceneSelector:'svg[data-rag-memory-graph-diagram]',articles:[
 ['rag-implementation-patterns',['rag-ingestion-search','rag-agent-evidence']],
 ['long-term-memory-implementation',['memory-extract-store','memory-recall-forget']],
 ['graph-rag-and-knowledge-graphs',['graph-build-quality','graph-types-investment']]
]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
test('post-filtering needs expanded candidates but never forwards unauthorized text to reranker or generation',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/implementation/rag-implementation-patterns`)
 const root=page.locator('[data-diagram-id="rag-ingestion-search"]')
 await root.getByRole('button',{name:'権限と上位k',exact:true}).click()
 for(const value of ['pre','post']){await root.getByRole('combobox',{name:'権限条件と件数制限の順序',exact:true}).selectOption(value);await expect(root.locator('[data-filter-needs-expansion]')).toHaveAttribute('data-filter-needs-expansion',String(value==='post'));await expect(root.locator('[data-unauthorized-forwarded="false"]')).toBeVisible()}
 const evidence=page.locator('[data-diagram-id="rag-agent-evidence"]')
 await evidence.getByRole('button',{name:'引用と支持',exact:true}).click()
 for(const hit of ['no','yes'])for(const authorized of ['no','yes'])for(const supports of ['no','yes']){
  for(const [name,value] of [['使える検索hit',hit],['利用者の権限',authorized],['引用が回答を支持',supports]])await evidence.getByRole('combobox',{name,exact:true}).selectOption(value)
  await expect(evidence.locator('[data-rag-evidence-next]')).toHaveAttribute('data-rag-evidence-next',authorized==='no'?'block':hit==='no'?'not-found':supports==='no'?'verify-support':'candidate')
  await expect(evidence.locator('[data-answer-executed="false"]')).toBeVisible()
 }
})
test('a conversation mention does not authorize sensitive memory without an explicit consent and source',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/implementation/long-term-memory-implementation`)
 const root=page.locator('[data-diagram-id="memory-extract-store"]')
 await root.getByRole('button',{name:'覚える基準',exact:true}).click()
 for(const stable of ['no','yes'])for(const source of ['no','yes'])for(const sensitive of ['no','yes'])for(const consent of ['no','yes']){
  for(const [name,value] of [['安定した記憶の基準',stable],['出所・日時・信頼度',source],['機微な個人情報',sensitive],['保存への明示的同意',consent]])await root.getByRole('combobox',{name,exact:true}).selectOption(value)
  await expect(root.locator('[data-memory-save-candidate]')).toHaveAttribute('data-memory-save-candidate',String(stable==='yes'&&source==='yes'&&(sensitive==='no'||consent==='yes')))
  await expect(root.locator('[data-memory-written="false"]')).toBeVisible()
 }
})
test('no relevant recall injects nothing and memory deletion remains incomplete while any derived path is unhandled',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/implementation/long-term-memory-implementation`)
 const root=page.locator('[data-diagram-id="memory-recall-forget"]')
 await root.getByRole('button',{name:'該当なし',exact:true}).click()
 for(const value of ['no','yes']){await root.getByRole('combobox',{name:'関連度の下限への適合',exact:true}).selectOption(value);await expect(root.locator('[data-memory-injection-candidate]')).toHaveAttribute('data-memory-injection-candidate',String(value==='yes'))}
 await root.getByRole('button',{name:'削除の経路',exact:true}).click()
 for(const item of ['no','yes'])for(const index of ['no','yes'])for(const backup of ['no','yes'])for(const derived of ['no','yes']){
  for(const [name,value] of [['記憶項目の削除',item],['vector索引の削除',index],['backupの削除経路',backup],['派生要約の削除',derived]])await root.getByRole('combobox',{name,exact:true}).selectOption(value)
  await expect(root.locator('[data-memory-deletion-candidate]')).toHaveAttribute('data-memory-deletion-candidate',String(item==='yes'&&index==='yes'&&backup==='yes'&&derived==='yes'))
  await expect(root.locator('[data-deletion-executed="false"]')).toBeVisible()
 }
})
test('graph evaluation cannot skip baseline failures relation needs or maintenance and aliases need evidence',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/implementation/graph-rag-and-knowledge-graphs`)
 const build=page.locator('[data-diagram-id="graph-build-quality"]')
 await build.getByRole('button',{name:'抽出と名寄せ',exact:true}).click()
 for(const value of ['no','yes']){await build.getByRole('combobox',{name:'同じ実体である裏付け',exact:true}).selectOption(value);await expect(build.locator('[data-graph-merge-candidate]')).toHaveAttribute('data-graph-merge-candidate',String(value==='yes'))}
 const root=page.locator('[data-diagram-id="graph-types-investment"]')
 await root.getByRole('button',{name:'投資の条件',exact:true}).click()
 for(const baseline of ['no','yes'])for(const relation of ['no','yes'])for(const maintenance of ['no','yes']){
  for(const [name,value] of [['通常RAGでの失敗',baseline],['関係・集約の必要性',relation],['維持費用の受入',maintenance]])await root.getByRole('combobox',{name,exact:true}).selectOption(value)
  await expect(root.locator('[data-graph-investment-candidate]')).toHaveAttribute('data-graph-investment-candidate',String(baseline==='yes'&&relation==='yes'&&maintenance==='yes'))
  await expect(root.locator('[data-graph-quality-guaranteed="false"]')).toBeVisible()
 }
})
test('original number examples permissions memory privacy tables and TODO remain without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
 try{const page=await context.newPage();for(const route of ['rag-implementation-patterns','long-term-memory-implementation','graph-rag-and-knowledge-graphs']){await page.goto(`${base}/docs/implementation/${route}`);await expect(page.locator('article h2').filter({hasText:'TODO・未確認事項'})).toBeVisible();await expect(page.locator('article table').first()).toBeVisible()}}finally{await context.close()}
})
test('low PC playback pause and print retain memory backup and derivative warnings',async({page})=>{
 await page.setViewportSize({width:1280,height:720});await page.goto(`${base}/docs/implementation/long-term-memory-implementation`)
 const root=page.locator('[data-diagram-id="memory-recall-forget"]')
 await root.getByRole('button',{name:'削除の経路',exact:true}).click()
 await root.getByRole('button',{name:'図解を再生',exact:true}).click();await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','playing')
 await root.getByRole('button',{name:'図解を一時停止',exact:true}).click();await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','manual')
 await page.emulateMedia({media:'print'});await expect(root.locator('svg[data-rag-memory-graph-diagram]')).toBeVisible();await expect(root.locator('.aw-timeline')).toBeHidden()
 await expect(page.locator('article')).toContainText('バックアップ');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
