import {test,expect} from '@playwright/test'
import {EVALUATION_CONTEXT_STAGES} from '../../lib/evaluation-context-model.mjs'
import {checkReadingArticles} from './reading-article-checks.mjs'
checkReadingArticles({name:'Evaluation context',chapter:'evaluation',stages:EVALUATION_CONTEXT_STAGES,sceneSelector:'svg[data-evaluation-context-diagram]',articles:[['evaluation-environments',['environment-layers-state','environment-repro-fidelity']],['user-simulator-design',['simulator-roles-constraints','simulator-scenarios-validation']],['confidence-and-calibration',['calibration-signals-bins','calibration-abstain-update']]]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
async function open(page,route,id,label){await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/evaluation/${route}`);const root=page.locator(`[data-diagram-id="${id}"]`);await root.getByRole('button',{name:label,exact:true}).click();return root}
test('environment layers preserve calls final-state and limited read-only targets without security guarantees',async({page})=>{
 const root=await open(page,'evaluation-environments','environment-layers-state','三つの層');
 for(const [value,target,readonly] of [['mock','calls','false'],['state','final-state','false'],['limited','drift','true']]){await root.getByRole('combobox',{name:'評価で必要な環境の層',exact:true}).selectOption(value);const scope=root.locator('[data-evaluation-environment-target]');await expect(scope).toHaveAttribute('data-evaluation-environment-target',target);await expect(scope).toHaveAttribute('data-evaluation-read-only',readonly);await expect(scope).toHaveAttribute('data-evaluation-environment-created','false');await expect(scope).toHaveAttribute('data-evaluation-security-guaranteed','false')}
 await root.getByRole('button',{name:'終了状態',exact:true}).click();for(const value of ['wrong','match']){await root.getByRole('combobox',{name:'宣言と別に照合する模式状態',exact:true}).selectOption(value);await expect(root.locator('svg[data-evaluation-context-diagram]')).toContainText('途中の遵守も別に点検')}
})
test('state time seed and external responses are independently required while Agent stochasticity remains',async({page})=>{
 const root=await open(page,'evaluation-environments','environment-repro-fidelity','条件を固定');
 for(const value of ['state','time','seed','external','none']){await root.getByRole('combobox',{name:'評価環境の未固定条件',exact:true}).selectOption(value);await expect(root.locator('[data-evaluation-repro-matched]')).toHaveAttribute('data-evaluation-repro-matched',String(value==='none'));await expect(root.locator('[data-evaluation-agent-deterministic="false"]')).toBeVisible();await expect(root.locator('[data-evaluation-environment-created="false"]')).toBeVisible()}
})
test('simulator faults cannot be silently counted as Agent failures or successful outcomes',async({page})=>{
 const root=await open(page,'user-simulator-design','simulator-roles-constraints','発話を照合');
 for(const value of ['facts','action','goal','end','none']){await root.getByRole('combobox',{name:'相手役の模式違反',exact:true}).selectOption(value);await expect(root.locator('[data-simulator-failure]')).toHaveAttribute('data-simulator-failure',String(value!=='none'));await expect(root.locator('[data-simulator-agent-outcome-verified="false"]')).toBeVisible();await expect(root.locator('[data-simulator-conversation-executed="false"]')).toBeVisible()}
 await root.getByRole('button',{name:'原論文の分担',exact:true}).click();await expect(root.locator('svg[data-evaluation-context-diagram]')).toContainText('Agentとtoolの通信は不可視')
})
test('simulator adoption retains human validation known quality failure partition repetition and blindspots',async({page})=>{
 const root=await open(page,'user-simulator-design','simulator-scenarios-validation','道具を検証');
 for(const value of ['human','quality','facts','failures','repeat','blindspots','none']){await root.getByRole('combobox',{name:'相手役の検証で不足する条件',exact:true}).selectOption(value);await expect(root.locator('[data-simulator-review-candidate]')).toHaveAttribute('data-simulator-review-candidate',String(value==='none'));await expect(root.locator('[data-simulator-quality-guaranteed="false"]')).toBeVisible();await expect(root.locator('[data-simulator-conversation-executed="false"]')).toBeVisible()}
})
test('confidence bins display separate observed accuracy and empty denominators without an actual model measurement',async({page})=>{
 const root=await open(page,'confidence-and-calibration','calibration-signals-bins','ビンで読む');
 for(const [value,observed] of [['overconfident','0.5'],['calibrated','0.8'],['broken','0.6'],['empty','unavailable']]){await root.getByRole('combobox',{name:'較正の模式集計',exact:true}).selectOption(value);await expect(root.locator('[data-calibration-bin-observed]')).toHaveAttribute('data-calibration-bin-observed',observed);await expect(root.locator('[data-calibration-model-measured="false"]')).toBeVisible()}
 await expect(root.locator('svg[data-evaluation-context-diagram]')).toContainText('母数がないビン')
})
test('answer coverage and accuracy retain different denominators and increasing a threshold need not improve precision',async({page})=>{
 const root=await open(page,'confidence-and-calibration','calibration-abstain-update','母数と精度');
 await root.getByRole('combobox',{name:'棄権で読む模式集計',exact:true}).selectOption('broken');
 for(const [value,coverage,accuracy] of [['0','1','0.575'],['0.7','0.75',String(19/30)],['0.8','0.5','0.55'],['0.9','0.25','0.5'],['1','0','unavailable']]){await root.getByRole('combobox',{name:'模式の回答閾値',exact:true}).selectOption(value);await expect(root.locator('[data-selective-coverage]')).toHaveAttribute('data-selective-coverage',coverage);await expect(root.locator('[data-selective-accuracy]')).toHaveAttribute('data-selective-accuracy',accuracy);await expect(root.locator('[data-selective-escalation-sent="false"]')).toBeVisible()}
 await expect(root.locator('svg[data-evaluation-context-diagram]')).toContainText('母数なし');await root.getByRole('combobox',{name:'棄権で読む模式集計',exact:true}).selectOption('empty');await expect(root.locator('[data-selective-coverage]')).toHaveAttribute('data-selective-coverage','unavailable')
})
test('source tables Mermaid numeric examples and TODO remain without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'});
 try{const page=await context.newPage();for(const [route,text] of [['evaluation-environments','状態リセット'],['user-simulator-design','ユーザー役 LLM'],['confidence-and-calibration','精度 97%']]){await page.goto(`${base}/docs/evaluation/${route}`);await expect(page.locator('article')).toContainText(text);await expect(page.locator('article h2').filter({hasText:'TODO・未確認事項'})).toBeVisible()}}finally{await context.close()}
})
test('low PC playback pause and print keep calibration charts and the source reading path',async({page})=>{
 await page.setViewportSize({width:1280,height:720});await page.goto(`${base}/docs/evaluation/confidence-and-calibration`);
 const root=page.locator('[data-diagram-id="calibration-signals-bins"]');await root.getByRole('button',{name:'ビンで読む',exact:true}).click();await root.getByRole('button',{name:'図解を再生',exact:true}).click();await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','playing');await root.getByRole('button',{name:'図解を一時停止',exact:true}).click();await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','manual');await page.emulateMedia({media:'print'});await expect(root.locator('svg[data-evaluation-context-diagram]')).toBeVisible();await expect(root.locator('.aw-timeline')).toBeHidden();await expect(page.locator('article')).toContainText('確信度 80%');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
