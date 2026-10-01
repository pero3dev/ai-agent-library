import {test,expect} from '@playwright/test'
import {SLM_COMPUTER_VOICE_STAGES} from '../../lib/slm-computer-voice-model.mjs'
import {checkReadingArticles} from './reading-article-checks.mjs'
checkReadingArticles({name:'SLM computer voice',chapter:'implementation',stages:SLM_COMPUTER_VOICE_STAGES,sceneSelector:'svg[data-slm-computer-voice-diagram]',articles:[
 ['slm-strategy',['slm-quality-components','slm-routing-cost']],
 ['computer-use-implementation',['computer-observation-permission','computer-stability-evidence']],
 ['voice-agents',['voice-architecture-latency','voice-interruption-tools','voice-evaluation-providers']]
]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
test('SLM routes and adoption retain input quality verification cost tails and required safety',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/implementation/slm-strategy`)
 const root=page.locator('[data-diagram-id="slm-routing-cost"]')
 await root.getByRole('button',{name:'難易度の分岐',exact:true}).click()
 for(const difficulty of ['easy','hard'])for(const quality of ['no','yes'])for(const verified of ['no','yes']){
  for(const [name,value] of [['入力の難易度',difficulty],['小型の品質条件',quality],['出力の検証',verified]])await root.getByRole('combobox',{name,exact:true}).selectOption(value)
  await expect(root.locator('[data-slm-route-next]')).toHaveAttribute('data-slm-route-next',difficulty==='hard'?'upper-direct':quality==='yes'&&verified==='yes'?'slm-candidate':'confirm-escalation');await expect(root.locator('[data-model-called="false"]')).toBeVisible()
 }
 await root.getByRole('button',{name:'採用の条件',exact:true}).click()
 for(const guard of ['yes','no'])for(const missing of ['quality','cost','tail','safety','none']){
  await root.getByRole('combobox',{name:'ガードレールの移管',exact:true}).selectOption(guard);await root.getByRole('combobox',{name:'移管前の不足条件',exact:true}).selectOption(missing)
  await expect(root.locator('[data-slm-review-candidate]')).toHaveAttribute('data-slm-review-candidate',String(missing==='none'||missing==='safety'&&guard==='no'));await expect(root.locator('[data-slm-deployment-executed="false"]')).toBeVisible()
 }
})
test('stale approval changed targets stop and limits cannot authorize computer operation',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/implementation/computer-use-implementation`)
 const root=page.locator('[data-diagram-id="computer-observation-permission"]')
 await root.getByRole('button',{name:'変更で戻る',exact:true}).click()
 for(const [value,next] of [['unapproved','wait-approval'],['scope','stop'],['limit','stop'],['changed','reobserve'],['stopped','stop'],['approved','action-candidate'],['no-approval','action-candidate']]){
  await root.getByRole('combobox',{name:'操作候補の状態',exact:true}).selectOption(value);await expect(root.locator('[data-computer-next]')).toHaveAttribute('data-computer-next',next);await expect(root.locator('[data-computer-operation-executed="false"]')).toBeVisible()
 }
})
test('voice history retains only played ranges and does not promise an exact transcript',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/implementation/voice-agents`)
 const root=page.locator('[data-diagram-id="voice-interruption-tools"]')
 await root.getByRole('button',{name:'届いた範囲へ',exact:true}).click()
 for(const value of ['0','1','2','3']){await root.getByRole('combobox',{name:'実際に届いた区間',exact:true}).selectOption(value);await expect(root.locator('[data-voice-retained-segments]')).toHaveAttribute('data-voice-retained-segments',value);await expect(root.locator('[data-voice-exact-transcript="false"]')).toBeVisible();await expect(root.locator('[data-token-row="heard"] [data-selected="true"]')).toHaveCount(Number(value))}
})
test('voice high risk confirmation cannot bypass repeat another channel or the current target',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/implementation/voice-agents`)
 const root=page.locator('[data-diagram-id="voice-interruption-tools"]')
 await root.getByRole('button',{name:'高リスクの確認',exact:true}).click()
 for(const value of ['repeat','channel','target','none']){await root.getByRole('combobox',{name:'高リスクの不足条件',exact:true}).selectOption(value);await expect(root.locator('[data-voice-risk-candidate]')).toHaveAttribute('data-voice-risk-candidate',String(value==='none'));await expect(root.locator('[data-voice-operation-executed="false"]')).toBeVisible()}
})
test('original strategy control loops architecture table and provider dates remain without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
 try{const page=await context.newPage();for(const route of ['slm-strategy','computer-use-implementation','voice-agents']){await page.goto(`${base}/docs/implementation/${route}`);await expect(page.locator('article h2').filter({hasText:'TODO・未確認事項'})).toBeVisible();await expect(page.locator('article')).toContainText(route==='voice-agents'?'GPT-Live':route==='computer-use-implementation'?'toolset':'p95/p99')}}finally{await context.close()}
})
test('low PC voice playback pause and print retain interruption and confirmation boundaries',async({page})=>{
 await page.setViewportSize({width:1280,height:720});await page.goto(`${base}/docs/implementation/voice-agents`)
 const root=page.locator('[data-diagram-id="voice-interruption-tools"]')
 await root.getByRole('button',{name:'届いた範囲へ',exact:true}).click();await root.getByRole('button',{name:'図解を再生',exact:true}).click();await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','playing')
 await root.getByRole('button',{name:'図解を一時停止',exact:true}).click();await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','manual')
 await page.emulateMedia({media:'print'});await expect(root.locator('svg[data-slm-computer-voice-diagram]')).toBeVisible();await expect(root.locator('.aw-timeline')).toBeHidden();await expect(page.locator('article')).toContainText('別チャネル');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
