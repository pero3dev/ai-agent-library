import { test,expect } from '@playwright/test'
import { CODING_CONTROL_STAGES } from '../../lib/coding-controls-model.mjs'
import { checkReadingArticles } from './reading-article-checks.mjs'
checkReadingArticles({name:'coding rules permissions automation',chapter:'coding-agents',stages:CODING_CONTROL_STAGES,sceneSelector:'svg[data-control-diagram]',articles:[
  ['coding-agent-rules-and-config',['coding-rules-content','coding-rules-scope-maintenance']],
  ['coding-agent-security',['coding-security-threat-paths','coding-security-permission-modes','coding-security-defense-audit']],
  ['coding-agent-automation-patterns',['coding-automation-task-design','coding-automation-runtime-recovery']]
]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
test('starting cwd determines automatic rule discovery and text rules do not enforce access',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto(`${base}/docs/coding-agents/coding-agent-rules-and-config`)
  const scope=page.locator('[data-diagram-id="coding-rules-scope-maintenance"]')
  await scope.getByRole('button',{name:'起動の経路',exact:true}).click()
  for(const cwd of ['root','web','ml']){
    await scope.getByRole('combobox',{name:'Codexを開始する作業ディレクトリ',exact:true}).selectOption(cwd)
    for(const child of ['web','ml'])await expect(scope.locator(`[data-cwd-rule="${child}"]`)).toHaveAttribute('data-loaded',String(cwd===child))
  }
  const content=page.locator('[data-diagram-id="coding-rules-content"]')
  await content.getByRole('button',{name:'検証可能に',exact:true}).click()
  await expect(content.locator('[data-rule-text-enforces-access="false"]')).toBeVisible()
})
test('permission modes cannot auto-execute unapproved secrets or external boundary operations',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto(`${base}/docs/coding-agents/coding-agent-security`)
  const permission=page.locator('[data-diagram-id="coding-security-permission-modes"]')
  await permission.getByRole('button',{name:'最小権限',exact:true}).click()
  for(const mode of ['ask','allowlist','isolated']){
    await permission.getByRole('combobox',{name:'操作を制御する方式',exact:true}).selectOption(mode)
    for(const request of ['bounded','external','secret']){
      await permission.getByRole('combobox',{name:'要求する操作の範囲',exact:true}).selectOption(request)
      await expect(permission.locator('[data-auto-execute]')).toHaveAttribute('data-auto-execute',String(mode!=='ask'&&request==='bounded'))
      await expect(permission.locator('[data-operation-denied]')).toHaveAttribute('data-operation-denied',String(request==='secret'))
    }
  }
  const threat=page.locator('[data-diagram-id="coding-security-threat-paths"]')
  await threat.getByRole('button',{name:'間接の指示',exact:true}).click()
  await expect(threat.locator('[data-external-text-is-authorization="false"]')).toBeVisible()
  const defense=page.locator('[data-diagram-id="coding-security-defense-audit"]')
  await defense.getByRole('button',{name:'戻せる変更',exact:true}).click()
  await expect(defense.locator('[data-git-reverts-external="false"]')).toBeVisible()
})
test('missing readiness keeps human review and CI-only verification does not execute a model',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto(`${base}/docs/coding-agents/coding-agent-automation-patterns`)
  const task=page.locator('[data-diagram-id="coding-automation-task-design"]')
  await task.getByRole('button',{name:'自動化の条件',exact:true}).click()
  for(const condition of ['all','pattern','verify','failure']){
    await task.getByRole('combobox',{name:'自動化の前提で不足するもの',exact:true}).selectOption(condition)
    await expect(task.locator('[data-unattended-candidate]')).toHaveAttribute('data-unattended-candidate',String(condition==='all'))
  }
  const runtime=page.locator('[data-diagram-id="coding-automation-runtime-recovery"]')
  await runtime.getByRole('button',{name:'実行する場所',exact:true}).click()
  for(const place of ['local','ci']){
    await runtime.getByRole('combobox',{name:'モデルを実行する場所',exact:true}).selectOption(place)
    await expect(runtime.locator('[data-ci-model-auth-needed]')).toHaveAttribute('data-ci-model-auth-needed',String(place==='ci'))
  }
  await runtime.getByRole('button',{name:'安全な失敗',exact:true}).click()
  await expect(runtime.locator('[data-publish-broken-partial="false"]')).toBeVisible()
  await runtime.getByRole('button',{name:'外部の起点',exact:true}).click()
  await expect(runtime.locator('[data-trigger-is-authorization="false"]')).toBeVisible()
})
test('three source articles remain readable without JavaScript',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
  try{
    const page=await context.newPage()
    for(const [route,phrase] of [['coding-agent-rules-and-config','階層化とスコープ'],['coding-agent-security','権限モデルの設計'],['coding-agent-automation-patterns','自動化の失敗設計']]){
      await page.goto(`${base}/docs/coding-agents/${route}`)
      await expect(page.locator('article h3').filter({hasText:phrase})).toBeVisible()
    }
  }finally{await context.close()}
})
test('low PC playback pause and print keep automation and original prose',async({page})=>{
  await page.setViewportSize({width:1280,height:720})
  await page.goto(`${base}/docs/coding-agents/coding-agent-automation-patterns`)
  const figure=page.locator('[data-diagram-id="coding-automation-task-design"]')
  await figure.getByRole('button',{name:'三つの段階',exact:true}).click()
  await figure.getByRole('button',{name:'図解を再生',exact:true}).click()
  await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode','playing')
  await figure.getByRole('button',{name:'図解を一時停止',exact:true}).click()
  await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode','manual')
  await page.emulateMedia({media:'print'})
  await expect(figure.locator('svg[data-control-diagram]')).toBeVisible()
  await expect(figure.locator('.aw-prose')).toContainText('成否を機械判定できる')
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
