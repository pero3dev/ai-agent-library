import { test,expect } from '@playwright/test'
import { CODING_PRACTICE_STAGES } from '../../lib/coding-practice-model.mjs'
import { checkReadingArticles } from './reading-article-checks.mjs'
checkReadingArticles({name:'Claude Codex Copilot practice',chapter:'coding-agents',stages:CODING_PRACTICE_STAGES,sceneSelector:'svg[data-coding-practice-diagram]',articles:[
 ['claude-code-in-practice',['claude-practice-mechanisms','claude-practice-context-cache','claude-practice-automation-quality']],
 ['openai-codex-in-practice',['codex-practice-surfaces-config','codex-practice-budget-context','codex-practice-automation-quality']],
 ['github-copilot-in-practice',['copilot-practice-functions-config','copilot-practice-budget-cache','copilot-practice-automation']]
]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
test('Claude dated effort exception differs from model change and infrastructure green is insufficient',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/coding-agents/claude-code-in-practice`)
 const cache=page.locator('[data-diagram-id="claude-practice-context-cache"]')
 await cache.getByRole('button',{name:'失効の条件',exact:true}).click()
 for(const change of ['model','effort','rewind','upgrade-resume'])for(const exception of ['yes','no']){
  await cache.getByRole('combobox',{name:'会話で変えたもの',exact:true}).selectOption(change)
  await cache.getByRole('combobox',{name:'本文時点のeffort例外',exact:true}).selectOption(exception)
  await expect(cache.locator('[data-prefix-can-stay]')).toHaveAttribute('data-prefix-can-stay',String(change==='rewind'||change==='effort'&&exception==='yes'))
 }
 const automation=page.locator('[data-diagram-id="claude-practice-automation-quality"]')
 await automation.getByRole('button',{name:'Routinesの境界',exact:true}).click()
 await automation.getByRole('combobox',{name:'Routinesのインフラ結果',exact:true}).selectOption('yes')
 await automation.getByRole('combobox',{name:'タスクの検証結果',exact:true}).selectOption('no')
 await expect(automation.locator('[data-infra-green="yes"]')).toBeVisible()
 await expect(automation.locator('[data-task-verified="no"]')).toBeVisible()
 const mechanisms=page.locator('[data-diagram-id="claude-practice-mechanisms"]')
 await mechanisms.getByRole('button',{name:'試行と復元',exact:true}).click()
 await expect(mechanisms.locator('[data-rewind-all-effects="false"]')).toBeVisible()
})
test('Codex lower AGENTS follows cwd and scheduled PC access follows location and running state',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/coding-agents/openai-codex-in-practice`)
 const budget=page.locator('[data-diagram-id="codex-practice-budget-context"]')
 await budget.getByRole('button',{name:'cwdと規約',exact:true}).click()
 for(const cwd of ['root','payments']){
  await budget.getByRole('combobox',{name:'開始するcwd',exact:true}).selectOption(cwd)
  await expect(budget.locator('[data-lower-agents-loaded]')).toHaveAttribute('data-lower-agents-loaded',String(cwd==='payments'))
 }
 const automation=page.locator('[data-diagram-id="codex-practice-automation-quality"]')
 await automation.getByRole('button',{name:'定期の場所',exact:true}).click()
 for(const surface of ['local','worktree','web'])for(const auth of ['account','api'])for(const running of ['yes','no']){
  await automation.getByRole('combobox',{name:'定期タスクの実行場所',exact:true}).selectOption(surface)
  await automation.getByRole('combobox',{name:'定期実行の認証',exact:true}).selectOption(auth)
  await automation.getByRole('combobox',{name:'PCとappの稼働',exact:true}).selectOption(running)
  await expect(automation.locator('[data-can-use-pc-folder]')).toHaveAttribute('data-can-use-pc-folder',String(surface!=='web'&&running==='yes'))
  await expect(automation.locator('[data-scheduled-billing]')).toHaveAttribute('data-scheduled-billing',auth)
 }
})
test('Copilot budget keeps ties and ULB hard stop while assessment cannot count',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(`${base}/docs/coding-agents/github-copilot-in-practice`)
 const budget=page.locator('[data-diagram-id="copilot-practice-budget-cache"]')
 await budget.getByRole('button',{name:'付与と予算',exact:true}).click()
 await budget.getByRole('combobox',{name:'説明用の予算残枠',exact:true}).selectOption('tie')
 await expect(budget.locator('[data-first-budget="user"]')).toBeVisible()
 await expect(budget.locator('[data-first-budget="cost"]')).toBeVisible()
 await budget.getByRole('combobox',{name:'説明用の予算残枠',exact:true}).selectOption('user')
 await expect(budget.locator('[data-user-hard-stop="true"]')).toBeVisible()
 const automation=page.locator('[data-diagram-id="copilot-practice-automation"]')
 await automation.getByRole('button',{name:'評価と承認',exact:true}).click()
 for(const enabled of ['on','off'])for(const changed of ['yes','no']){
  await automation.getByRole('combobox',{name:'preview承認の管理設定',exact:true}).selectOption(enabled)
  await automation.getByRole('combobox',{name:'レビュー後の追加commit',exact:true}).selectOption(changed)
  await expect(automation.locator('[data-practice-approval-counts]')).toHaveAttribute('data-practice-approval-counts',String(enabled==='on'&&changed==='no'))
  await expect(automation.locator('[data-practice-assessment-counts="false"]')).toBeVisible()
 }
})
test('practice articles keep original commands tables dates and TODO without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
 try{const page=await context.newPage();for(const route of ['claude-code-in-practice','openai-codex-in-practice','github-copilot-in-practice']){
  await page.goto(`${base}/docs/coding-agents/${route}`)
  await expect(page.locator('article table').first()).toBeVisible()
  await expect(page.locator('article h2').filter({hasText:'TODO・未確認事項'})).toBeVisible()
 }}finally{await context.close()}
})
test('low PC playback pause and print preserve Codex original location and authentication boundaries',async({page})=>{
 await page.setViewportSize({width:1280,height:720})
 await page.goto(`${base}/docs/coding-agents/openai-codex-in-practice`)
 const root=page.locator('[data-diagram-id="codex-practice-surfaces-config"]')
 await root.scrollIntoViewIfNeeded()
 await root.getByRole('button',{name:'図解を再生',exact:true}).click()
 await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','playing')
 await root.getByRole('button',{name:'図解を一時停止',exact:true}).click()
 await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','manual')
 const paused=await root.getAttribute('data-current-stage')
 await page.waitForTimeout(250)
 await expect(root).toHaveAttribute('data-current-stage',paused)
 await page.emulateMedia({media:'print'})
 await expect(page.locator('article')).toContainText('PC の電源とアプリの起動が必要')
 await expect(page.locator('article')).toContainText('OpenAI Platform の API 料金')
 await expect(root.locator('.aw-timeline')).toBeHidden()
})
