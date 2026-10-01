import {test,expect} from '@playwright/test'
import {FEEDBACK_STREAMING_STAGES} from '../../lib/feedback-streaming-model.mjs'
import {checkReadingArticles} from './reading-article-checks.mjs'
checkReadingArticles({name:'Feedback streaming',chapter:'implementation',stages:FEEDBACK_STREAMING_STAGES,sceneSelector:'svg[data-feedback-streaming-diagram]',articles:[
 ['prompt-optimization',['optimization-failure-cycle','optimization-search-boundaries']],
 ['loop-feedback-and-verification',['feedback-observation-design','feedback-verifier-control']],
 ['streaming-and-agent-ux',['stream-progress-surface','stream-cancellation-state']]
]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
test('an improved development case cannot bypass non-degradation or an unused judgment',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/implementation/prompt-optimization`)
 const root=page.locator('[data-diagram-id="optimization-failure-cycle"]')
 await root.getByRole('button',{name:'改善と非劣化',exact:true}).click()
 for(const improved of ['yes','no'])for(const regression of ['yes','no'])for(const judgment of ['unused','used']){
  for(const [name,value] of [['狙った類型の改善',improved],['他ケースの非劣化',regression],['最終判定用の使用',judgment]])await root.getByRole('combobox',{name,exact:true}).selectOption(value)
  await expect(root.locator('[data-optimization-candidate]')).toHaveAttribute('data-optimization-candidate',String(improved==='yes'&&regression==='yes'&&judgment==='unused'))
  await expect(root.locator('[data-production-changed="false"]')).toBeVisible()
 }
})
test('unrecoverable errors stop and exhausted or repeated correction escalates without treating green as success',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/implementation/loop-feedback-and-verification`)
 const root=page.locator('[data-diagram-id="feedback-verifier-control"]')
 await root.getByRole('button',{name:'回数と迷走',exact:true}).click()
 for(const recoverable of ['yes','no'])for(const budget of ['yes','no'])for(const repeated of ['yes','no']){
  for(const [name,value] of [['モデルによる回復',recoverable],['修正予算の残り',budget],['同じ検証エラー',repeated]])await root.getByRole('combobox',{name,exact:true}).selectOption(value)
  await expect(root.locator('[data-feedback-next]')).toHaveAttribute('data-feedback-next',recoverable==='no'?'stop':budget==='no'||repeated==='yes'?'escalate':'retry')
 }
 await root.getByRole('button',{name:'検証を守る',exact:true}).click()
 for(const value of ['yes','no']){
  await root.getByRole('combobox',{name:'検証器の書換え権限',exact:true}).selectOption(value)
  await expect(root.locator('[data-verifier-protected]')).toHaveAttribute('data-verifier-protected',String(value==='yes'))
  await expect(root.locator('[data-green-guarantees-success="false"]')).toBeVisible()
 }
})
test('partial streams remain provisional and cancellation does not undo completed external effects',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/implementation/streaming-and-agent-ux`)
 const progress=page.locator('[data-diagram-id="stream-progress-surface"]')
 await progress.getByRole('button',{name:'部分と完了',exact:true}).click()
 for(const value of ['partial','tool','error','complete']){
  await progress.getByRole('combobox',{name:'逐次応答の状態',exact:true}).selectOption(value)
  await expect(progress.locator('[data-stream-output-state]')).toHaveAttribute('data-partial-is-final',String(value==='complete'))
 }
 const root=page.locator('[data-diagram-id="stream-cancellation-state"]')
 for(const stopped of ['yes','no'])for(const external of ['yes','no']){
  await root.getByRole('button',{name:'裏まで停止',exact:true}).click()
  await root.getByRole('combobox',{name:'裏のループの停止',exact:true}).selectOption(stopped)
  await root.getByRole('combobox',{name:'外部操作の完了',exact:true}).selectOption(external)
  await expect(root.locator('[data-loop-stopped]')).toHaveAttribute('data-loop-stopped',String(stopped==='yes'))
  await expect(root.locator('[data-external-effect-remains]')).toHaveAttribute('data-external-effect-remains',String(external==='yes'))
  await expect(root.locator('[data-external-undone="false"]')).toBeVisible()
  await root.getByRole('button',{name:'保全して中断',exact:true}).click()
  for(const saved of ['yes','no']){
   await root.getByRole('combobox',{name:'途中状態の保存',exact:true}).selectOption(saved)
   await expect(root.locator('[data-resume-candidate]')).toHaveAttribute('data-resume-candidate',String(stopped==='yes'&&saved==='yes'))
  }
 }
 await root.getByRole('button',{name:'遅れた結果',exact:true}).click()
 for(const value of ['yes','no']){
  await root.getByRole('combobox',{name:'新しい実行への結果採用',exact:true}).selectOption(value)
  await expect(root.locator('[data-late-result-auto-adopted="false"]')).toBeVisible()
 }
 await root.getByRole('button',{name:'APIとジョブ',exact:true}).click()
 await expect(root.locator('[data-api-guarantees-recovery="false"]')).toBeVisible()
})
test('all original failure tables date example API scope and TODO remain without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
 try{const page=await context.newPage();for(const route of ['prompt-optimization','loop-feedback-and-verification','streaming-and-agent-ux']){
  await page.goto(`${base}/docs/implementation/${route}`)
  await expect(page.locator('article h2').filter({hasText:'TODO・未確認事項'})).toBeVisible()
  await expect(page.locator('article table').first()).toBeVisible()
 }}finally{await context.close()}
})
test('low PC playback pause and print retain cancellation and external effect warnings',async({page})=>{
 await page.setViewportSize({width:1280,height:720})
 await page.goto(`${base}/docs/implementation/streaming-and-agent-ux`)
 const root=page.locator('[data-diagram-id="stream-cancellation-state"]')
 await root.getByRole('button',{name:'保全して中断',exact:true}).click()
 await root.getByRole('button',{name:'図解を再生',exact:true}).click()
 await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','playing')
 await root.getByRole('button',{name:'図解を一時停止',exact:true}).click()
 await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','manual')
 await page.emulateMedia({media:'print'})
 await expect(root.locator('svg[data-feedback-streaming-diagram]')).toBeVisible()
 await expect(root.locator('.aw-timeline')).toBeHidden()
 await expect(page.locator('article')).toContainText('推論の停止は')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
