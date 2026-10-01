import {test,expect} from '@playwright/test'
import {RETRIEVAL_DATA_STAGES} from '../../lib/retrieval-data-model.mjs'
import {checkReadingArticles} from './reading-article-checks.mjs'
checkReadingArticles({name:'Retrieval data',chapter:'implementation',stages:RETRIEVAL_DATA_STAGES,sceneSelector:'svg[data-retrieval-data-diagram]',articles:[
 ['embeddings',['embedding-choice-asymmetry','embedding-chunk-deploy']],
 ['vector-databases',['vector-choice-approximation','vector-filter-operations']],
 ['data-preprocessing-for-llm',['preprocess-extraction-quality','preprocess-metadata-lineage']]
]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
test('input checking distinguishes refused or split input from explicit evaluated truncation',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/implementation/embeddings`)
 const root=page.locator('[data-diagram-id="embedding-chunk-deploy"]')
 for(const counted of ['no','yes'])for(const over of ['no','yes'])for(const truncate of ['no','yes'])for(const recorded of ['no','yes']){
  for(const [name,value] of [['指示込みのtoken計数',counted],['入力上限の超過',over],['切詰めの明示設定',truncate],['欠落と評価の記録',recorded]])await root.getByRole('combobox',{name,exact:true}).selectOption(value)
  await expect(root.locator('[data-embedding-input-next]')).toHaveAttribute('data-embedding-input-next',counted==='no'?'count':over==='no'?'candidate':truncate==='yes'&&recorded==='yes'?'evaluate-truncation':'split')
  await expect(root.locator('[data-api-executed="false"]')).toBeVisible()
 }
 const choice=page.locator('[data-diagram-id="embedding-choice-asymmetry"]')
 await choice.getByRole('button',{name:'次元の条件',exact:true}).click()
 for(const value of ['unknown','yes','no']){await choice.getByRole('combobox',{name:'先頭N次元の対応',exact:true}).selectOption(value);await expect(choice.locator('[data-prefix-candidate]')).toHaveAttribute('data-prefix-candidate',String(value==='yes'))}
 await root.getByRole('button',{name:'更新と移行',exact:true}).click()
 for(const value of ['old','new']){await root.getByRole('combobox',{name:'queryが使うモデル空間',exact:true}).selectOption(value);await expect(root.locator('[data-query-space]')).toHaveAttribute('data-query-space',value)}
})
test('ANN does not promise true top k and post-generation filtering cannot remove prior context input',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/implementation/vector-databases`)
 const search=page.locator('[data-diagram-id="vector-choice-approximation"]')
 await search.getByRole('button',{name:'厳密と近似',exact:true}).click()
 for(const value of ['exact','ann']){await search.getByRole('combobox',{name:'上位kを探す方式',exact:true}).selectOption(value);await expect(search.locator('[data-ann-guarantees-top-k]')).toHaveAttribute('data-ann-guarantees-top-k',String(value==='exact'))}
 const root=page.locator('[data-diagram-id="vector-filter-operations"]')
 for(const value of ['before','after']){await root.getByRole('combobox',{name:'権限を反映する場所',exact:true}).selectOption(value);await expect(root.locator('[data-post-filter-safe]')).toHaveAttribute('data-post-filter-safe',String(value==='before'))}
 await root.getByRole('button',{name:'併用の責任',exact:true}).click()
 for(const value of ['app','engine']){await root.getByRole('combobox',{name:'候補を融合する担当',exact:true}).selectOption(value);await expect(root.locator('[data-fusion-owner]')).toHaveAttribute('data-fusion-owner',value)}
})
test('tenant ACL and applicable version stay required and removing the source alone is incomplete',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/implementation/data-preprocessing-for-llm`)
 const root=page.locator('[data-diagram-id="preprocess-metadata-lineage"]')
 await root.getByRole('button',{name:'派生物の境界',exact:true}).click()
 for(const tenant of ['yes','no'])for(const acl of ['yes','no'])for(const version of ['yes','no']){
  for(const [name,value] of [['同じテナント',tenant],['原本ACLの継承',acl],['質問時点に適用する版',version]])await root.getByRole('combobox',{name,exact:true}).selectOption(value)
  await expect(root.locator('[data-derived-search-candidate]')).toHaveAttribute('data-derived-search-candidate',String(tenant==='yes'&&acl==='yes'&&version==='yes'))
  await expect(root.locator('[data-authorization-executed="false"]')).toBeVisible()
 }
 await root.getByRole('button',{name:'更新と削除',exact:true}).click()
 for(const deleted of ['no','yes'])for(const removed of ['no','yes']){
  await root.getByRole('combobox',{name:'原本の削除',exact:true}).selectOption(deleted)
  await root.getByRole('combobox',{name:'古い派生物の削除',exact:true}).selectOption(removed)
  await expect(root.locator('[data-deletion-complete]')).toHaveAttribute('data-deletion-complete',String(deleted==='yes'&&removed==='yes'))
 }
})
test('all original comparison tables API limit cautions and TODO remain without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
 try{const page=await context.newPage();for(const route of ['embeddings','vector-databases','data-preprocessing-for-llm']){await page.goto(`${base}/docs/implementation/${route}`);await expect(page.locator('article h2').filter({hasText:'TODO・未確認事項'})).toBeVisible();await expect(page.locator('article table').first()).toBeVisible()}}finally{await context.close()}
})
test('low PC playback pause and print retain original lineage warnings',async({page})=>{
 await page.setViewportSize({width:1280,height:720})
 await page.goto(`${base}/docs/implementation/data-preprocessing-for-llm`)
 const root=page.locator('[data-diagram-id="preprocess-metadata-lineage"]')
 await root.getByRole('button',{name:'派生物の境界',exact:true}).click()
 await root.getByRole('button',{name:'図解を再生',exact:true}).click()
 await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','playing')
 await root.getByRole('button',{name:'図解を一時停止',exact:true}).click()
 await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','manual')
 await page.emulateMedia({media:'print'})
 await expect(root.locator('svg[data-retrieval-data-diagram]')).toBeVisible()
 await expect(root.locator('.aw-timeline')).toBeHidden()
 await expect(page.locator('article')).toContainText('メタデータ')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
