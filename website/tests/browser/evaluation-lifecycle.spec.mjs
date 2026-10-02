import {test,expect} from '@playwright/test'
import {EVALUATION_LIFECYCLE_STAGES} from '../../lib/evaluation-lifecycle-model.mjs'
import {checkReadingArticles} from './reading-article-checks.mjs'
checkReadingArticles({name:'Evaluation lifecycle',chapter:'evaluation',stages:EVALUATION_LIFECYCLE_STAGES,sceneSelector:'svg[data-evaluation-lifecycle-diagram]',articles:[['regression-testing',['regression-layer-scope','regression-gate-recovery']],['online-evaluation-and-ab-testing',['online-sequence-signals','online-comparison-release']],['agent-benchmarks-landscape',['benchmark-map-provenance','benchmark-reliability-cost']]]})
const base=process.env.NEXT_PUBLIC_BASE_PATH||''
async function open(page,route,id,label){await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}/docs/evaluation/${route}`);const root=page.locator(`[data-diagram-id="${id}"]`);await root.getByRole('button',{name:label,exact:true}).click();return root}
test('same toy failures differ between all-success and any-success requirements',async({page})=>{
 const root=await open(page,'regression-testing','regression-layer-scope','繰返しの基準');
 for(const [pattern,all,any] of [['mixed','false','true'],['all','true','true'],['none','false','false']]){await root.getByRole('combobox',{name:'回帰の模式成否列',exact:true}).selectOption(pattern);for(const [policy,expected] of [['all',all],['any',any]]){await root.getByRole('combobox',{name:'タスクの反復要求',exact:true}).selectOption(policy);await expect(root.locator('[data-regression-repeat-met]')).toHaveAttribute('data-regression-repeat-met',expected);await expect(root.locator('[data-regression-tests-executed="false"]')).toBeVisible()}}
})
test('model change widens regression and retains judge revalidation while internal scope is conditional',async({page})=>{
 const root=await open(page,'regression-testing','regression-gate-recovery','変更の範囲');
 for(const [value,layers,full,judge] of [['internal','L1','false','false'],['prompt','L1,L2,L3','true','false'],['model','L1,L2,L3','true','true']]){await root.getByRole('combobox',{name:'回帰範囲を選ぶ変更',exact:true}).selectOption(value);const scope=root.locator('[data-regression-scope]');await expect(scope).toHaveAttribute('data-regression-scope',layers);await expect(scope).toHaveAttribute('data-regression-full-suite',full);await expect(scope).toHaveAttribute('data-regression-judge-revalidation',judge)}
})
test('absolute quality does not bypass baseline budget or new-failure review',async({page})=>{
 const root=await open(page,'regression-testing','regression-gate-recovery','採用の条件');
 for(const value of ['absolute','baseline','budget','failures','none']){await root.getByRole('combobox',{name:'回帰ゲートの不足条件',exact:true}).selectOption(value);await expect(root.locator('[data-regression-review-candidate]')).toHaveAttribute('data-regression-review-candidate',String(value==='none'));await expect(root.locator('[data-regression-ci-executed="false"]')).toBeVisible();await expect(root.locator('[data-regression-quality-guaranteed="false"]')).toBeVisible()}
})
test('online release does not bypass guards delayed observation or rollback and cannot undo effects',async({page})=>{
 const root=await open(page,'online-evaluation-and-ab-testing','online-comparison-release','比較と安全');
 for(const value of ['offline','assignment','criteria','sample','period','guard','rollback','none']){await root.getByRole('combobox',{name:'本番比較の不足条件',exact:true}).selectOption(value);await expect(root.locator('[data-online-review-candidate]')).toHaveAttribute('data-online-review-candidate',String(value==='none'));await expect(root.locator('[data-online-rollback-candidate]')).toHaveAttribute('data-online-rollback-candidate',String(value==='guard'));await expect(root.locator('[data-online-deployed="false"]')).toBeVisible();await expect(root.locator('[data-online-effects-undone="false"]')).toBeVisible()}
 await root.getByRole('button',{name:'作用のない観測',exact:true}).click();await expect(root.locator('svg[data-evaluation-lifecycle-diagram]')).toContainText('副作用toolは実行せず')
})
test('model name cannot establish comparability without effort resources trials and grader',async({page})=>{
 const root=await open(page,'agent-benchmarks-landscape','benchmark-map-provenance','条件を照合');
 for(const value of ['version','tasks','harness','effort','resources','trials','grader','none']){await root.getByRole('combobox',{name:'ベンチ比較の異なる条件',exact:true}).selectOption(value);await expect(root.locator('[data-benchmark-comparable]')).toHaveAttribute('data-benchmark-comparable',String(value==='none'));await expect(root.locator('[data-benchmark-quality-guaranteed="false"]')).toBeVisible()}
})
test('cost chart distinguishes tradeoff domination and missing cost without inventing a free point',async({page})=>{
 const root=await open(page,'agent-benchmarks-landscape','benchmark-reliability-cost','費用と品質');
 for(const [value,comparable,frontier,points] of [['tradeoff','true','true',3],['dominated','true','false',3],['missing','false','false',2]]){await root.getByRole('combobox',{name:'模式の費用・成果条件',exact:true}).selectOption(value);await expect(root.locator('[data-toy-pareto-c-comparable]')).toHaveAttribute('data-toy-pareto-c-comparable',comparable);await expect(root.locator('[data-toy-pareto-c-frontier]')).toHaveAttribute('data-toy-pareto-c-frontier',frontier);await expect(root.locator('[data-toy-pareto-id]')).toHaveCount(points);await expect(root.locator('[data-benchmark-actual-score]')).toHaveAttribute('data-benchmark-actual-score','false');await expect(root.locator('svg[data-evaluation-lifecycle-diagram]')).toBeVisible()}
 await expect(root.locator('svg[data-evaluation-lifecycle-diagram]')).toContainText('費用欠測 → 点を描かない')
})
test('original tables Mermaid dates and partial costs remain without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'});
 try{const page=await context.newPage();for(const [route,text] of [['regression-testing','L1: 決定的ユニットテスト'],['online-evaluation-and-ab-testing','シャドーラン'],['agent-benchmarks-landscape','partial: 324/330']]){await page.goto(`${base}/docs/evaluation/${route}`);await expect(page.locator('article')).toContainText(text);await expect(page.locator('article h2').filter({hasText:'TODO・未確認事項'})).toBeVisible()}}finally{await context.close()}
})
test('wide benchmark tables retain readable columns and scroll inside the source column',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});
 const root=await open(page,'agent-benchmarks-landscape','benchmark-map-provenance','カテゴリの地図');
 const table=root.locator('.aw-prose table').first();
 const result=await table.evaluate(element=>{const cell=element.querySelector('tbody td');const before=element.scrollLeft;element.scrollLeft=element.scrollWidth;return {columnWidth:cell.getBoundingClientRect().width,internalScroll:element.scrollLeft>before,contained:element.getBoundingClientRect().width<=element.closest('.aw-prose').getBoundingClientRect().width+1}});
 expect(result.columnWidth).toBeGreaterThanOrEqual(96);expect(result.internalScroll).toBe(true);expect(result.contained).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
test('low PC playback pause and print preserve cost chart and missingness boundaries',async({page})=>{
 await page.setViewportSize({width:1280,height:720});await page.goto(`${base}/docs/evaluation/agent-benchmarks-landscape`);
 const root=page.locator('[data-diagram-id="benchmark-reliability-cost"]');await root.getByRole('button',{name:'費用と品質',exact:true}).click();await root.getByRole('button',{name:'図解を再生',exact:true}).click();await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','playing');await root.getByRole('button',{name:'図解を一時停止',exact:true}).click();await expect(root.locator('.aw-diagram')).toHaveAttribute('data-mode','manual');await page.emulateMedia({media:'print'});await expect(root.locator('svg[data-evaluation-lifecycle-diagram]')).toBeVisible();await expect(root.locator('.aw-timeline')).toBeHidden();await expect(page.locator('article')).toContainText('partial: 324/330');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})
