import { test,expect } from '@playwright/test'
import { CODING_DECISION_STAGES } from '../../lib/coding-decisions-model.mjs'
import { checkReadingArticles } from './reading-article-checks.mjs'
checkReadingArticles({name:'coding classification selection request',chapter:'coding-agents',stages:CODING_DECISION_STAGES,sceneSelector:'svg[data-coding-diagram]',articles:[
  ['coding-agents-overview',['coding-support-forms','coding-trigger-execution-map','coding-autonomy-learning']],
  ['coding-agent-selection',['coding-selection-constraints','coding-selection-trial']],
  ['coding-agent-prompting',['coding-request-contract','coding-request-verification-recovery']]
]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
test('trigger is separate from execution and local commands do not prove no transfer',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto(`${base}/docs/coding-agents/coding-agents-overview`)
  const map=page.locator('[data-diagram-id="coding-trigger-execution-map"]')
  await map.getByRole('button',{name:'二つの軸',exact:true}).click()
  await map.getByRole('combobox',{name:'仕事を依頼する入口',exact:true}).selectOption('ide')
  await map.getByRole('combobox',{name:'ループを実行する場所',exact:true}).selectOption('local')
  await expect(map.locator('[data-coding-map-cell="ide-local"]')).toHaveAttribute('data-selected','true')
  await map.getByRole('combobox',{name:'ループを実行する場所',exact:true}).selectOption('cloud')
  await expect(map.locator('[data-coding-map-cell="ide-cloud"]')).toHaveAttribute('data-selected','true')
  await map.getByRole('button',{name:'Issue・PRから',exact:true}).click()
  await expect(map.getByRole('combobox',{name:'仕事を依頼する入口',exact:true})).toHaveValue('issue')
  await map.getByRole('combobox',{name:'ループを実行する場所',exact:true}).selectOption('ci')
  await expect(map.locator('[data-coding-map-cell="issue-ci"]')).toHaveAttribute('data-selected','true')
  await map.getByRole('button',{name:'場所と送信先',exact:true}).click()
  await expect(map.locator('[data-local-means-no-transfer="false"]')).toBeVisible()
})
test('dependent work, weakened criteria and discarded learning never become safe completion',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto(`${base}/docs/coding-agents/coding-agent-prompting`)
  const request=page.locator('[data-diagram-id="coding-request-contract"]')
  await request.getByRole('button',{name:'一回でレビュー',exact:true}).click()
  await request.getByLabel('分けた仕事の関係').selectOption('dependent')
  await expect(request.locator('[data-coding-parallel-candidate]')).toHaveAttribute('data-coding-parallel-candidate','false')
  const verify=page.locator('[data-diagram-id="coding-request-verification-recovery"]')
  await verify.getByRole('button',{name:'基準を守る',exact:true}).click()
  for(const evidence of ['claim','weakened','verified']){
    await verify.getByLabel('完了を裏付けるもの').selectOption(evidence)
    await expect(verify.locator('[data-original-criteria-met]')).toHaveAttribute('data-original-criteria-met',String(evidence==='verified'))
  }
  await verify.getByRole('button',{name:'立て直す',exact:true}).click()
  await verify.getByLabel('仕切り直しへ引き継ぐ内容').selectOption('nothing')
  await expect(verify.locator('[data-coding-learning-retained]')).toHaveAttribute('data-coding-learning-retained','false')
})
test('three source articles remain readable without JavaScript',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
  try{
    const page=await context.newPage()
    for(const [route,phrase] of [['coding-agents-overview','2 軸での整理(トリガー面 × 実行場所)'],['coding-agent-selection','選定プロセスの設計'],['coding-agent-prompting','検証と完了条件の設計']]){
      await page.goto(`${base}/docs/coding-agents/${route}`)
      await expect(page.locator('article h3').filter({hasText:phrase})).toBeVisible()
    }
  }finally{await context.close()}
})
test('low PC playback pause and print keep request and original prose',async({page})=>{
  await page.setViewportSize({width:1280,height:720})
  await page.goto(`${base}/docs/coding-agents/coding-agent-prompting`)
  const figure=page.locator('[data-diagram-id="coding-request-contract"]')
  await figure.getByRole('button',{name:'依頼からレビュー',exact:true}).click()
  await figure.getByRole('button',{name:'図解を再生',exact:true}).click()
  await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode','playing')
  await figure.getByRole('button',{name:'図解を一時停止',exact:true}).click()
  await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode','manual')
  await page.emulateMedia({media:'print'})
  await expect(figure.locator('svg[data-coding-diagram]')).toBeVisible()
  await expect(figure.locator('.aw-prose')).toContainText('人が 1 回でレビューできる変更量')
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
