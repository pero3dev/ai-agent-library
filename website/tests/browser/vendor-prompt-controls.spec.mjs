import {test,expect} from '@playwright/test'
import {VENDOR_PROMPT_CONTROLS_STAGES} from '../../lib/vendor-prompt-controls-model.mjs'
import {checkReadingArticles} from './reading-article-checks.mjs'
checkReadingArticles({name:'Vendor prompt controls',chapter:'implementation',stages:VENDOR_PROMPT_CONTROLS_STAGES,sceneSelector:'svg[data-vendor-prompt-controls-diagram]',articles:[
 ['claude-prompting',['claude-structure-examples','claude-thinking-output','claude-history-migration']],
 ['openai-prompting',['openai-instruction-contract','openai-thinking-output','openai-history-migration']],
 ['gemini-prompting',['gemini-structure-examples','gemini-thinking-context','gemini-tool-migration']]
]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
test('all vendors keep example relevance representation repetition and quality limits',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 for(const [route,id,label] of [['claude-prompting','claude-structure-examples','例を照合'],['openai-prompting','openai-instruction-contract','例の整合'],['gemini-prompting','gemini-structure-examples','例の統一']]){await page.goto(`${base}/docs/implementation/${route}`);const root=page.locator(`[data-diagram-id="${id}"]`);await root.getByRole('button',{name:label,exact:true}).click();for(const value of ['conflict','biased','repeated','checked']){await root.getByRole('combobox',{name:'例の照合条件',exact:true}).selectOption(value);await expect(root.locator('[data-vendor-example-candidate]')).toHaveAttribute('data-vendor-example-candidate',String(value==='checked'));await expect(root.locator('[data-vendor-quality-guaranteed="false"]')).toBeVisible()}}
})
test('Claude histories keep thinking premises supported updates and retained expired system',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/implementation/claude-prompting`)
 const root=page.locator('[data-diagram-id="claude-history-migration"]');await root.getByRole('button',{name:'思考の結合',exact:true}).click()
 for(const [value,next] of [['prefix','rebuild-history'],['thinking','rebuild-history'],['support','confirm-support'],['expired','retain-and-resend'],['resent','history-candidate'],['checked','history-candidate']]){await root.getByRole('combobox',{name:'思考履歴の状態',exact:true}).selectOption(value);await expect(root.locator('[data-claude-history-next]')).toHaveAttribute('data-claude-history-next',next);await expect(root.locator('[data-claude-request-sent="false"]')).toBeVisible()}
})
test('OpenAI configuration gates preserve all incompatible combinations without a request',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/implementation/openai-prompting`)
 const root=page.locator('[data-diagram-id="openai-history-migration"]');await root.getByRole('button',{name:'設定を追記',exact:true}).click()
 for(const value of ['multi','pro','auto','compact','consecutive','none']){await root.getByRole('combobox',{name:'設定更新の条件',exact:true}).selectOption(value);await expect(root.locator('[data-openai-configuration-candidate]')).toHaveAttribute('data-openai-configuration-candidate',String(value==='none'));await expect(root.locator('[data-openai-request-sent="false"]')).toBeVisible()}
})
test('Gemini typed SDK fields do not guarantee model API and request compatibility',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/implementation/gemini-prompting`)
 const root=page.locator('[data-diagram-id="gemini-thinking-context"]');await root.getByRole('button',{name:'対応する思考',exact:true}).click()
 for(const value of ['sdk','model','api','request','none','untyped']){await root.getByRole('combobox',{name:'思考制御の確認状態',exact:true}).selectOption(value);await expect(root.locator('[data-gemini-thinking-candidate]')).toHaveAttribute('data-gemini-thinking-candidate',String(['none','untyped'].includes(value)));await expect(root.locator('[data-gemini-all-models-compatible="false"]')).toBeVisible();await expect(root.locator('[data-gemini-request-sent="false"]')).toBeVisible()}
})
test('all vendor migrations keep contract regressions and authority without deploying',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 for(const [route,id,label] of [['claude-prompting','claude-history-migration','回帰と保持'],['openai-prompting','openai-history-migration','古い依存を外す'],['gemini-prompting','gemini-tool-migration','移行の確認']]){await page.goto(`${base}/docs/implementation/${route}`);const root=page.locator(`[data-diagram-id="${id}"]`);await root.getByRole('button',{name:label,exact:true}).click();for(const value of ['model','contract','regression','authority','none']){await root.getByRole('combobox',{name:'移行前の不足条件',exact:true}).selectOption(value);await expect(root.locator('[data-vendor-migration-candidate]')).toHaveAttribute('data-vendor-migration-candidate',String(value==='none'));await expect(root.locator('[data-vendor-deployment-executed="false"]')).toBeVisible()}}
})
test('late async results keep the original call and current purpose without cancelling effects',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/implementation/openai-prompting`)
 const root=page.locator('[data-diagram-id="openai-history-migration"]');await root.getByRole('button',{name:'非同期の結果',exact:true}).click()
 for(const [value,disposition] of [['stale','exclude'],['needed','review']]){await root.getByRole('combobox',{name:'遅れた結果の用途',exact:true}).selectOption(value);await expect(root.locator('[data-openai-result-disposition]')).toHaveAttribute('data-openai-result-disposition',disposition);await expect(root.locator('svg[data-vendor-prompt-controls-diagram]')).toContainText('取消保証ではない')}
})
test('vendor dates TODO and complete parameter tables remain without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
 try{const page=await context.newPage();for(const [route,text] of [['claude-prompting','Fable 5.1'],['openai-prompting','2026-09-28'],['gemini-prompting','thinking_budget']]){await page.goto(`${base}/docs/implementation/${route}`);await expect(page.locator('article')).toContainText(text);await expect(page.locator('article h2').filter({hasText:'TODO・未確認事項'})).toBeVisible()}}finally{await context.close()}
})
test('low PC vendor playback pause and print retain model API confirmation boundaries',async({page})=>{
 await page.setViewportSize({width:1280,height:720});await page.goto(`${base}/docs/implementation/gemini-prompting`)
 const root=page.locator('[data-diagram-id="gemini-thinking-context"]');await root.getByRole('button',{name:'対応する思考',exact:true}).click();await root.getByRole('button',{name:'図解を再生',exact:true}).click();await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','playing');await root.getByRole('button',{name:'図解を一時停止',exact:true}).click();await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','manual');await page.emulateMedia({media:'print'});await expect(root.locator('svg[data-vendor-prompt-controls-diagram]')).toBeVisible();await expect(root.locator('.aw-timeline')).toBeHidden();await expect(page.locator('article')).toContainText('モデル / API');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
