import {test,expect} from '@playwright/test'
import {EVALUATION_EVIDENCE_STAGES} from '../../lib/evaluation-evidence-model.mjs'
import {checkReadingArticles} from './reading-article-checks.mjs'
checkReadingArticles({name:'Evaluation evidence',chapter:'evaluation',stages:EVALUATION_EVIDENCE_STAGES,sceneSelector:'svg[data-evaluation-evidence-diagram]',articles:[['llm-as-a-judge',['judge-format-bias','judge-validation-split']],['trajectory-evaluation',['trajectory-path-review','trajectory-record-constraints']],['evaluation-datasets',['dataset-source-synthetic','dataset-label-maintenance']]]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
async function open(page,route,id,label){await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/evaluation/${route}`);const root=page.locator(`[data-diagram-id="${id}"]`);await root.getByRole('button',{name:label,exact:true}).click();return root}
test('high overall agreement cannot hide false acceptance and empty samples cannot create a rate',async({page})=>{
 const root=await open(page,'llm-as-a-judge','judge-validation-split','誤りの母数')
 for(const [value,agreement,accept] of [['rare','0.875','1'],['typical','0.75','0.25'],['improved','0.875','0'],['empty','unavailable','unavailable']]){await root.getByRole('combobox',{name:'judgeの模式件数',exact:true}).selectOption(value);await expect(root.locator('[data-judge-false-acceptance]')).toHaveAttribute('data-judge-false-acceptance',accept);await expect(root.locator('[data-judge-agreement]')).toHaveAttribute('data-judge-agreement',agreement);await expect(root.locator('[data-judge-quality-guaranteed]')).toHaveAttribute('data-judge-quality-guaranteed','false')}
 await expect(root.locator('svg[data-evaluation-evidence-diagram]')).toContainText('母数なし')
})
test('semantic winners survive swapping order without claiming other biases are resolved',async({page})=>{
 const root=await open(page,'llm-as-a-judge','judge-format-bias','偏りを点検')
 for(const [value,consistent] of [['biased','false'],['consistent','true']]){await root.getByRole('combobox',{name:'順序交換後の模式判定',exact:true}).selectOption(value);await expect(root.locator('[data-judge-order-consistent]')).toHaveAttribute('data-judge-order-consistent',consistent);await expect(root.locator('[data-judge-quality-guaranteed="false"]')).toBeVisible()}
 for(const value of ['length','self','lenient','position'])await root.getByRole('combobox',{name:'点検するjudgeの偏り',exact:true}).selectOption(value)
})
test('judge adoption cannot skip unseen data human labels sample size or frozen criteria',async({page})=>{
 const root=await open(page,'llm-as-a-judge','judge-validation-split','固定して測る')
 for(const value of ['criteria','labels','unseen','thresholds','sample','frozen','none']){await root.getByRole('combobox',{name:'judge採用前の不足条件',exact:true}).selectOption(value);await expect(root.locator('[data-judge-review-candidate]')).toHaveAttribute('data-judge-review-candidate',String(value==='none'));await expect(root.locator('[data-judge-grading-executed="false"]')).toBeVisible()}
})
test('trajectory conditions do not prove outcome prevent effects or require one exact route',async({page})=>{
 const root=await open(page,'trajectory-evaluation','trajectory-record-constraints','不変条件')
 for(const value of ['information','forbidden','approval','budget','none']){await root.getByRole('combobox',{name:'軌跡の不足する不変条件',exact:true}).selectOption(value);await expect(root.locator('[data-trajectory-invariants-met]')).toHaveAttribute('data-trajectory-invariants-met',String(value==='none'));await expect(root.locator('[data-trajectory-outcome-verified="false"]')).toBeVisible();await expect(root.locator('[data-trajectory-effects-prevented="false"]')).toBeVisible()}
 await root.getByRole('button',{name:'別解を認める',exact:true}).click();for(const value of ['a','b']){await root.getByRole('combobox',{name:'条件を満たす模式の別解',exact:true}).selectOption(value);await expect(root.locator('svg[data-evaluation-evidence-diagram]')).toContainText('完全一致を要求せず')}
})
test('masked data still needs usage agreement human labels and split source lineage',async({page})=>{
 const root=await open(page,'evaluation-datasets','dataset-source-synthetic','正解を点検')
 for(const value of ['mask','usage','labels','strata','sets','lineage','none']){await root.getByRole('combobox',{name:'評価ケース採用の不足条件',exact:true}).selectOption(value);await expect(root.locator('[data-dataset-review-candidate]')).toHaveAttribute('data-dataset-review-candidate',String(value==='none'));await expect(root.locator('[data-dataset-collected="false"]')).toBeVisible();await expect(root.locator('[data-dataset-quality-guaranteed="false"]')).toBeVisible()}
})
test('reference paths and derived cases remain separate while strata are visible',async({page})=>{
 const root=await open(page,'evaluation-datasets','dataset-label-maintenance','層別と分割')
 for(const value of ['prompt','example','rag','derived','checked']){await root.getByRole('combobox',{name:'評価の混入経路',exact:true}).selectOption(value);await expect(root.locator('[data-evaluation-reference-separated]')).toHaveAttribute('data-evaluation-reference-separated',String(value==='checked'));await expect(root.locator('svg[data-evaluation-evidence-diagram]')).toContainText('タスク・難易度・入力長')}
})
test('original tables Mermaid dates and dataset numeric guidelines remain without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
 try{const page=await context.newPage();for(const [route,text] of [['llm-as-a-judge','誤合格率'],['trajectory-evaluation','マイルストーン'],['evaluation-datasets','100〜300']]){await page.goto(`${base}/docs/evaluation/${route}`);await expect(page.locator('article')).toContainText(text);await expect(page.locator('article h2').filter({hasText:'TODO・未確認事項'})).toBeVisible()}}finally{await context.close()}
})
test('low PC playback pause and print keep judge validation and human fail denominators',async({page})=>{
 await page.setViewportSize({width:1280,height:720});await page.goto(`${base}/docs/evaluation/llm-as-a-judge`)
 const root=page.locator('[data-diagram-id="judge-validation-split"]');await root.getByRole('button',{name:'誤りの母数',exact:true}).click();await root.getByRole('button',{name:'図解を再生',exact:true}).click();await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','playing');await root.getByRole('button',{name:'図解を一時停止',exact:true}).click();await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','manual');await page.emulateMedia({media:'print'});await expect(root.locator('svg[data-evaluation-evidence-diagram]')).toBeVisible();await expect(root.locator('.aw-timeline')).toBeHidden();await expect(page.locator('article')).toContainText('誤合格率');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
