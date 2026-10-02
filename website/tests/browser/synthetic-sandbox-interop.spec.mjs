import {test,expect} from '@playwright/test'
import {SYNTHETIC_SANDBOX_INTEROP_STAGES} from '../../lib/synthetic-sandbox-interop-model.mjs'
import {checkReadingArticles} from './reading-article-checks.mjs'
checkReadingArticles({name:'Synthetic sandbox interop',chapter:'implementation',stages:SYNTHETIC_SANDBOX_INTEROP_STAGES,sceneSelector:'svg[data-synthetic-sandbox-interop-diagram]',articles:[
 ['synthetic-data-for-training',['synthetic-purpose-generation','synthetic-quality-separation']],
 ['code-execution-sandboxes',['sandbox-isolation-selection','sandbox-lifecycle-egress']],
 ['agent-interop-protocols',['interop-tool-peer-structure','interop-trust-update']]
]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
test('synthetic admission cannot skip any of the seven conditions or execute learning',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/implementation/synthetic-data-for-training`)
 const root=page.locator('[data-diagram-id="synthetic-quality-separation"]');await root.getByRole('button',{name:'学習前の確認',exact:true}).click()
 for(const value of ['purpose','validation','diversity','humanCheck','realData','terms','evaluationSeparation','none']){await root.getByRole('combobox',{name:'学習前の不足条件',exact:true}).selectOption(value);await expect(root.locator('[data-synthetic-admission-candidate]')).toHaveAttribute('data-synthetic-admission-candidate',String(value==='none'));for(const attr of ['training-executed','quality-guaranteed','legal-guaranteed'])await expect(root.locator(`[data-synthetic-${attr}="false"]`)).toBeVisible()}
})
test('synthetic evaluation preserves independent seeds paths and evaluation',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/implementation/synthetic-data-for-training`)
 const root=page.locator('[data-diagram-id="synthetic-quality-separation"]');await root.getByRole('button',{name:'seedから分離',exact:true}).click()
 for(const value of ['seed','path','evaluation','none']){await root.getByRole('combobox',{name:'評価分離の不足',exact:true}).selectOption(value);await expect(root.locator('[data-synthetic-evaluation-candidate]')).toHaveAttribute('data-synthetic-evaluation-candidate',String(value==='none'));await expect(root.locator('[data-synthetic-independence-guaranteed="false"]')).toBeVisible()}
})
test('sandbox network and host output gates are independent and cleanup is not execution completion',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/implementation/code-execution-sandboxes`)
 const root=page.locator('[data-diagram-id="sandbox-lifecycle-egress"]');await root.getByRole('button',{name:'通信と返却',exact:true}).click()
 for(const network of ['blocked','allowed','internal'])for(const outputs of ['pending','checked']){await root.getByRole('combobox',{name:'通信先の条件',exact:true}).selectOption(network);await root.getByRole('combobox',{name:'返却出力の点検',exact:true}).selectOption(outputs);await expect(root.locator('[data-sandbox-network]')).toHaveAttribute('data-sandbox-network',network==='allowed'?'route-candidate':'blocked');await expect(root.locator('[data-sandbox-output-review-pending]')).toHaveAttribute('data-sandbox-output-review-pending',String(outputs==='pending'));await expect(root.locator('[data-sandbox-transmission-executed="false"]')).toBeVisible()}
 await root.getByRole('button',{name:'破棄を確認',exact:true}).click()
 for(const value of ['environment','resources','outputs','none']){await root.getByRole('combobox',{name:'終了時の未確認',exact:true}).selectOption(value);await expect(root.locator('[data-sandbox-release-candidate]')).toHaveAttribute('data-sandbox-release-candidate',String(value==='none'));await expect(root.locator('[data-sandbox-deletion-executed="false"]')).toBeVisible()}
})
test('peer discovery and authentication cannot bypass scope or disclosure and completion needs verification',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/implementation/agent-interop-protocols`)
 const root=page.locator('[data-diagram-id="interop-trust-update"]');await root.getByRole('button',{name:'委譲の確認',exact:true}).click()
 for(const value of ['knownPartner','identityVerified','scopeAllowed','disclosureMinimized','none']){await root.getByRole('combobox',{name:'委譲前の不足条件',exact:true}).selectOption(value);await expect(root.locator('[data-interop-delegation-candidate]')).toHaveAttribute('data-interop-delegation-candidate',String(value==='none'));await expect(root.locator('[data-interop-message-sent="false"]')).toBeVisible();await expect(root.locator('[data-interop-peer-unconditionally-trusted="false"]')).toBeVisible()}
 const state=page.locator('[data-diagram-id="interop-tool-peer-structure"]');await state.getByRole('button',{name:'進捗と成果物',exact:true}).click();await state.getByRole('combobox',{name:'相手のタスク状態',exact:true}).selectOption('done');await expect(state.locator('svg[data-synthetic-sandbox-interop-diagram]')).toContainText('成果物を受け取る');await expect(state.locator('svg[data-synthetic-sandbox-interop-diagram]')).toContainText('宣言だけで成功にせず')
})
test('original comparisons use restrictions and confirmation dates remain without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
 try{const page=await context.newPage();for(const [route,text] of [['synthetic-data-for-training','モデル崩壊'],['code-execution-sandboxes','マルチテナント'],['agent-interop-protocols','まだ標準に賭けない']]){await page.goto(`${base}/docs/implementation/${route}`);await expect(page.locator('article')).toContainText(text);await expect(page.locator('article h2').filter({hasText:'TODO・未確認事項'})).toBeVisible()}}finally{await context.close()}
})
test('low PC sandbox playback pause and print preserve independent returned output review',async({page})=>{
 await page.setViewportSize({width:1280,height:720});await page.goto(`${base}/docs/implementation/code-execution-sandboxes`)
 const root=page.locator('[data-diagram-id="sandbox-lifecycle-egress"]');await root.getByRole('button',{name:'通信と返却',exact:true}).click();await root.getByRole('button',{name:'図解を再生',exact:true}).click();await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','playing');await root.getByRole('button',{name:'図解を一時停止',exact:true}).click();await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','manual');await page.emulateMedia({media:'print'});await expect(root.locator('svg[data-synthetic-sandbox-interop-diagram]')).toBeVisible();await expect(root.locator('.aw-timeline')).toBeHidden();await expect(page.locator('article')).toContainText('エグレス');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
