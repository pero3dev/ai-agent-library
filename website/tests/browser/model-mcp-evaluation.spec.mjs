import {test,expect} from '@playwright/test'
import {MODEL_MCP_EVALUATION_STAGES} from '../../lib/model-mcp-evaluation-model.mjs'
import {checkReadingArticles} from './reading-article-checks.mjs'
const common={name:'Model MCP evaluation',stages:MODEL_MCP_EVALUATION_STAGES,sceneSelector:'svg[data-model-mcp-evaluation-diagram]'}
checkReadingArticles({...common,chapter:'implementation',articles:[['cross-model-prompting',['cross-provider-map','cross-provider-migration']],['mcp-and-tool-protocols',['mcp-connection-versions','mcp-tool-authority']]]})
checkReadingArticles({...common,chapter:'evaluation',articles:[['agent-evaluation-basics',['evaluation-layers-graders','evaluation-harness-decision']]]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
async function open(page,chapter,route,id,label){await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/${chapter}/${route}`);const root=page.locator(`[data-diagram-id="${id}"]`);await root.getByRole('button',{name:label,exact:true}).click();return root}
test('model migration needs all conditions and retains the original comparison date',async({page})=>{
 const root=await open(page,'implementation','cross-model-prompting','cross-provider-migration','回帰の条件')
 for(const value of ['api','parameters','output','budget','regression','none']){await root.getByRole('combobox',{name:'横断移行の不足条件',exact:true}).selectOption(value);await expect(root.locator('[data-cross-migration-candidate]')).toHaveAttribute('data-cross-migration-candidate',String(value==='none'));await expect(root.locator('[data-cross-deployment-executed="false"]')).toBeVisible()}
 await expect(page.locator('article')).toContainText('2026-09-10')
})
test('MCP transport version authorization and host approval are independent of discovered tools',async({page})=>{
 const root=await open(page,'implementation','mcp-and-tool-protocols','mcp-tool-authority','接続の確認')
 for(const value of ['version','transport','feature','user','approval','none']){await root.getByRole('combobox',{name:'MCP接続の不足条件',exact:true}).selectOption(value);await expect(root.locator('[data-mcp-connection-candidate]')).toHaveAttribute('data-mcp-connection-candidate',String(value==='none'));await expect(root.locator('[data-mcp-network-connected="false"]')).toBeVisible()}
})
test('replica placement keeps sessions keys notifications and does not deploy',async({page})=>{
 const root=await open(page,'implementation','mcp-and-tool-protocols','mcp-connection-versions','配置と認可')
 for(const value of ['session','key','notifications','none']){await root.getByRole('combobox',{name:'配置時の不足条件',exact:true}).selectOption(value);await expect(root.locator('[data-mcp-replica-candidate]')).toHaveAttribute('data-mcp-replica-candidate',String(value==='none'));await expect(root.locator('[data-mcp-replica-deployed="false"]')).toBeVisible()}
 await root.getByRole('button',{name:'接続の共通化',exact:true}).click();await expect(root.locator('svg[data-model-mcp-evaluation-diagram]')).toContainText('N+Mになる保証ではない')
})
test('grader choice cannot turn an unvalidated judge or missing human into an executed grade',async({page})=>{
 const root=await open(page,'evaluation','agent-evaluation-basics','evaluation-layers-graders','採点を分担')
 for(const [value,next] of [['code','code'],['judge','judge-candidate'],['human','human-review'],['unconfirmed','criterion-needed']]){await root.getByRole('combobox',{name:'採点条件の選択',exact:true}).selectOption(value);await expect(root.locator('[data-evaluation-grader-next]')).toHaveAttribute('data-evaluation-grader-next',next);await expect(root.locator('[data-evaluation-grading-executed="false"]')).toBeVisible()}
})
test('repeated inputs change with policy and success count remains bounded after fewer runs',async({page})=>{
 const root=await open(page,'evaluation','agent-evaluation-basics','evaluation-harness-decision','反復の基準')
 await expect(root.locator('[data-evaluation-repeat-accepted]')).toHaveAttribute('data-evaluation-repeat-accepted','false')
 await root.getByRole('combobox',{name:'反復の合格基準',exact:true}).selectOption('any');await expect(root.locator('[data-evaluation-repeat-accepted]')).toHaveAttribute('data-evaluation-repeat-accepted','true')
 await root.getByRole('combobox',{name:'模式入力の反復回数',exact:true}).selectOption('5');await root.getByRole('combobox',{name:'模式入力の成功回数',exact:true}).selectOption('5');await root.getByRole('combobox',{name:'反復の合格基準',exact:true}).selectOption('all');await expect(root.locator('[data-evaluation-repeat-accepted]')).toHaveAttribute('data-evaluation-repeat-accepted','true')
 await root.getByRole('combobox',{name:'模式入力の反復回数',exact:true}).selectOption('3');await expect(root.getByRole('combobox',{name:'模式入力の成功回数',exact:true})).toHaveValue('3');await expect(root.locator('[data-evaluation-repeat-rate]')).toHaveAttribute('data-evaluation-repeat-rate','1')
 await root.getByRole('combobox',{name:'模式入力の成功回数',exact:true}).selectOption('0');await expect(root.locator('[data-evaluation-repeat-accepted]')).toHaveAttribute('data-evaluation-repeat-accepted','false');await expect(root.locator('[data-evaluation-quality-guaranteed="false"]')).toBeVisible();await expect(root.locator('svg[data-model-mcp-evaluation-diagram]')).toContainText('実Agentの測定や品質保証ではない')
})
test('whole original dates SDK boundaries and numeric criteria remain without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
 try{const page=await context.newPage();for(const [chapter,route,text] of [['implementation','cross-model-prompting','2026-09-10'],['implementation','mcp-and-tool-protocols','2.2.0'],['evaluation','agent-evaluation-basics','毎回成功すべき']]){await page.goto(`${base}/docs/${chapter}/${route}`);await expect(page.locator('article')).toContainText(text);await expect(page.locator('article h2').filter({hasText:'TODO・未確認事項'})).toBeVisible()}}finally{await context.close()}
})
test('low PC playback pause and print keep evaluation layers and toy input limits',async({page})=>{
 await page.setViewportSize({width:1280,height:720});await page.goto(`${base}/docs/evaluation/agent-evaluation-basics`)
 const root=page.locator('[data-diagram-id="evaluation-harness-decision"]');await root.getByRole('button',{name:'反復の基準',exact:true}).click();await root.getByRole('button',{name:'図解を再生',exact:true}).click();await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','playing');await root.getByRole('button',{name:'図解を一時停止',exact:true}).click();await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','manual');await page.emulateMedia({media:'print'});await expect(root.locator('svg[data-model-mcp-evaluation-diagram]')).toBeVisible();await expect(root.locator('.aw-timeline')).toBeHidden();await expect(page.locator('article')).toContainText('評価対象の 3 層');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
