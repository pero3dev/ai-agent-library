import assert from 'node:assert/strict'

// Fixed, reviewed fixtures; no local product model import and no public-derived expected values.
export const inferencePath = '/docs/llm-internals/inference-internals'
export const inference = [
  { id: 'inference-sampling', labels: ['ロジット','温度','top-k','top-p','正規化','選択','再現性'], steps: [0,1,3,6], marker: 'INFERENCE / SAMPLING', attr: 'data-inference-sampling-stage', controlStage: 3, control: '温度・選択', choice: '2' },
  { id: 'inference-cache-batching', labels: ['再利用','サイズ','2つの相','まとめる','入れ替える','条件'], steps: [1,2,3,4,5], marker: 'INFERENCE / CACHE & BATCHING', attr: 'data-inference-cache-stage', controlStage: 4, control: '処理枠の使い方', choice: 'ordinary' },
  { id: 'inference-speculative', labels: ['下書き','検証','貪欲','受理','補正','確認'], steps: [0,2,4,5], marker: 'INFERENCE / SPECULATIVE DECODING', attr: 'data-speculative-stage', controlStage: 5, control: '確認する方式', choice: 'greedy' },
  { id: 'inference-quantization', labels: ['対象','bit','混合精度','検証'], steps: [0,2,3], marker: 'INFERENCE / QUANTIZATION', attr: 'data-inference-quantization-stage', controlStage: 2, control: '通常部分のbit数', choice: '4' }
]
const headings = ['概要: プリフィルとデコードの 2 相','ロジット → 確率 → 選択の数理','プリフィルとデコードの計算量・メモリ','バッチングと連続バッチング','投機的デコーディング','量子化','この理解が効く場面','アンチパターン','チェックリスト']
const profiles = [[1440,1000,'light'],[1440,1000,'dark'],[1280,720,'light'],[390,844,'light'],[390,844,'dark']]
const near = (a,b) => assert.ok(Number.isFinite(a) && Math.abs(a-b) < 1e-10, String(a)+' != '+String(b))
const vector = (a,b) => { assert.equal(a.length,b.length); a.forEach((v,i)=>near(v,b[i])) }
export const SPECULATIVE_ORACLE = [
  { id:'first-reject', prefix:'AB', draft:'ABC', token:0, alpha:.25, u:.5, p:[.1,.2,.6,.1], q:[.4,.3,.2,.1], exit:[0,0,1,0], suffix:'C', greedy:'C', reject:'0', accepted:0 },
  { id:'middle-reject', prefix:'ABA', draft:'ABC', token:1, alpha:.25, u:.5, p:[.2,.1,.3,.4], q:[.1,.4,.3,.2], exit:[1/3,0,0,2/3], suffix:'AD', greedy:'CD', reject:'1', accepted:1 },
  { id:'all-accept', prefix:'ABAB', draft:'ABC', token:2, alpha:.5, u:.4, p:[.4,.1,.2,.3], q:[.2,.1,.4,.3], exit:[.3,.2,.1,.4], suffix:'ABCD', greedy:'CDCD', reject:'none', accepted:3 }
]
export function samplingOracle(temperature, method, threshold, draw) {
  const weights = [4,3,2,1].map(n=>n ** (1/temperature)), sum=weights.reduce((a,b)=>a+b,0), probabilities=weights.map(n=>n/sum)
  let count = method==='top-k' ? threshold : 4
  if(method==='top-p' && threshold<1) { let cumulative=0; for(let i=0;i<4;i++) { cumulative+=probabilities[i]; if(cumulative>=threshold) { count=i+1; break } } }
  const mass=probabilities.slice(0,count).reduce((a,b)=>a+b,0), selected=probabilities.map((p,i)=>i<count?p/mass:0)
  let cumulative=0, token=3; for(let i=0;i<4;i++) { cumulative+=selected[i]; if(draw<cumulative) {token=i;break} }
  return {probabilities, count, mass, selected, token}
}
export const BATCH_ORACLE = {
  // [active IDs, waiting IDs, slot IDs, reserved flags, total KV at prompt length 4]
  ordinary: [
    ['A,B','C',['A','B'],[false,false],512], ['A,B','C',['A','B'],[false,false],640],
    ['B','C',['A','B'],[true,false],384], ['B','C',['A','B'],[true,false],448],
    ['C','',['C',''],[false,false],256], ['C','',['C',''],[false,false],320],
    ['C','',['C',''],[false,false],384], ['','',['',''],[false,false],0]
  ],
  continuous: [
    ['A,B','C',['A','B'],[false,false],512], ['A,B','C',['A','B'],[false,false],640],
    ['B,C','',['C','B'],[false,false],640], ['B,C','',['C','B'],[false,false],768],
    ['C','',['C',''],[false,false],384], ['','',['',''],[false,false],0],
    ['','',['',''],[false,false],0], ['','',['',''],[false,false],0]
  ]
}

export async function runInferenceChecks(api) {
  const {check,usePage,open,structure,sceneDelivery,stage,phase,geometry,screenshot,rootOf,panelOf,expect}=api
  const source=async page=>{
    await expect(page.locator('article h3')).toHaveText(headings,{useInnerText:true})
    await expect(page.locator('article [data-mermaid-renderer="strict"]')).toHaveCount(1)
    assert.equal(await page.locator('article [data-mermaid-renderer="strict"]').evaluate(n=>n.closest('.reading-figure')===null),true)
    await expect(page.locator('article')).toContainText('以上になる最小の集合')
    assert.equal(await page.locator('article').innerText().then(t=>t.includes('累積確率が p を超える最小の集合')),false)
  }
  const openInference=async(page,result,options={})=>{await open(page,inferencePath,inference,result,options);await structure(page,inference,2,result,9);await source(page)}
  async function extraGeometry(panel,{desktop=false,result=null,label=null}={}) {
    const data=await panel.locator('svg.aw-scene').evaluate(svg=>{
      const screen=svg.getScreenCTM(),inverse=screen.inverse(),rect=svg.getBoundingClientRect()
      const nodes=[...svg.querySelectorAll('text')].filter(n=>{for(let p=n;p&&p!==svg;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false}return true})
      const boxes=nodes.map(n=>{const b=n.getBBox(),m=inverse.multiply(n.getScreenCTM()),points=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));return {text:n.textContent,x:Math.min(...points.map(p=>p.x)),y:Math.min(...points.map(p=>p.y)),right:Math.max(...points.map(p=>p.x)),bottom:Math.max(...points.map(p=>p.y))}})
      // A font's ascender/descender BBox can intersect while the painted glyphs
      // remain separate. Preserve every positive intersection for image review;
      // do not invent a pixel tolerance or equate this with visual acceptance.
      const overlapCandidates=[]
      for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
        const a=boxes[i],b=boxes[j],x=Math.max(a.x,b.x),y=Math.max(a.y,b.y),right=Math.min(a.right,b.right),bottom=Math.min(a.bottom,b.bottom)
        if(right>x&&bottom>y){
          const corners=[[x,y],[right,y],[x,bottom],[right,bottom]].map(([px,py])=>new DOMPoint(px,py).matrixTransform(screen))
          overlapCandidates.push({texts:[a.text,b.text],textBoxesSVG:[a,b],intersectionSVG:{x,y,width:right-x,height:bottom-y},intersectionRenderedPx:{width:Math.max(...corners.map(p=>p.x))-Math.min(...corners.map(p=>p.x)),height:Math.max(...corners.map(p=>p.y))-Math.min(...corners.map(p=>p.y))}})
        }
      }
      const wireText=[];for(const wire of svg.querySelectorAll('.cd-wire path')){const m=inverse.multiply(wire.getScreenCTM()),length=wire.getTotalLength();for(let s=0;s<=length;s+=1){const p=wire.getPointAtLength(s).matrixTransform(m);const b=boxes.find(b=>p.x>b.x-2&&p.x<b.right+2&&p.y>b.y-2&&p.y<b.bottom+2);if(b){wireText.push(b.text);break}}}
      const fontObservations=nodes.map(n=>{const m=n.getScreenCTM(),svgFontPx=parseFloat(getComputedStyle(n).fontSize);return {text:n.textContent,classes:n.getAttribute('class')||'',svgFontPx,renderedFontPx:svgFontPx*Math.min(Math.hypot(m.a,m.b),Math.hypot(m.c,m.d))}})
      return {overlapCandidates,wireText,svgRenderedPx:{width:rect.width,height:rect.height},viewBox:{width:svg.viewBox.baseVal.width,height:svg.viewBox.baseVal.height},fontObservations,minRenderedFontPx:Math.min(...fontObservations.map(n=>n.renderedFontPx))}
    })
    assert.deepEqual(data.wireText,[],'inference wire crosses text')
    assert.ok(Number.isFinite(data.minRenderedFontPx) && data.minRenderedFontPx>0,'Invalid rendered font measurement')
    data.desktop = desktop; data.fontAcceptance = 'Record actual rendered size; use adopted scene-specific visual acceptance, not a new universal 16px minimum'
    data.visualReviewRequired = data.overlapCandidates.length>0
    data.independentVisualReviewStatus = 'pending-independent-public-image-review'
    if(result){(result.inferenceGeometryObservations??=[]).push({label,...data});result.visualReviewRequired ||= data.visualReviewRequired;result.independentVisualReviewStatus=data.independentVisualReviewStatus}
    return data
  }
  async function boundaries(panel,figure) {
    const forward=Array.from({length:figure.labels.length-1},(_,i)=>[i+.49,i+.5,i+.51]).flat()
    for(const p of [...forward,...forward.toReversed()]) {
      await phase(panel,p);const s=Math.round(p)
      await expect(panel.locator('svg.aw-scene')).toHaveAttribute(figure.attr,String(s))
      await expect(panel.getByRole('group',{name:'図解の段階',exact:true}).getByRole('button').nth(s)).toHaveAttribute('aria-pressed','true')
      await expect(panel.getByRole('slider')).toHaveAttribute('aria-valuetext',String(s+1)+' / '+figure.labels.length+'、'+figure.labels[s])
    }
    return forward.length*2
  }
  async function sampling(page,result) {
    const f=inference[0],p=panelOf(page,f.id);await stage(p,f,5);let cases=0
    for(const t of [.5,1,2]) {
      await p.getByLabel('温度・選択',{exact:true}).selectOption(String(t))
      for(const method of ['top-k','top-p']) {
        await p.getByLabel('候補制限の方式',{exact:true}).selectOption(method)
        for(const threshold of method==='top-k'?[1,2,4]:[.6,.8,1]) {
          await p.getByLabel(method==='top-k'?'残す候補数':'累積確率の閾値',{exact:true}).selectOption(String(threshold))
          for(const u of [.22,.62,.92]) {
            await p.getByLabel('固定したu',{exact:true}).selectOption(String(u))
            const expected=samplingOracle(t,method,threshold,u)
            const rows=await p.locator('[data-candidate-id]').evaluateAll(ns=>ns.map(n=>({id:+n.dataset.candidateId,p:+n.dataset.probability,s:+n.dataset.selectionProbability,kept:n.dataset.kept==='true',chosen:n.dataset.selected==='true'})))
            assert.deepEqual(rows.map(r=>r.id),[0,1,2,3]);vector(rows.map(r=>r.p),expected.probabilities);vector(rows.map(r=>r.s),expected.selected)
            assert.deepEqual(rows.map(r=>r.kept),rows.map((_,i)=>i<expected.count));assert.equal(rows.find(r=>r.chosen).id,expected.token)
            near(+(await p.locator('[data-retained-mass]').getAttribute('data-retained-mass')),expected.mass)
            const bin=p.locator('[data-cdf-token="'+expected.token+'"]')
            assert.ok(+(await bin.getAttribute('data-cdf-low'))<=u);assert.ok(+(await bin.getAttribute('data-cdf-high'))>u)
            cases++
          }
        }
      }
    }
    await p.getByLabel('温度・選択',{exact:true}).selectOption('0')
    for(const label of ['候補制限の方式','累積確率の閾値','固定したu'])await expect(p.getByLabel(label,{exact:true})).toBeDisabled()
    await expect(p.locator('[data-selection-kind]')).toHaveAttribute('data-selection-kind','greedy');await expect(p.locator('[data-cdf-token]')).toHaveCount(0)
    vector(await p.locator('[data-probability]').evaluateAll(ns=>ns.map(n=>+n.dataset.probability)),[.4,.3,.2,.1])
    await stage(p,f,1);await expect(p).toContainText('確信100%ではない')
    await stage(p,f,0);await expect(p.locator('svg.aw-scene')).toHaveAttribute('data-sampling-kind','sampling');await expect(p).toContainText('ロジット → 確率 → 1つを選択')
    await stage(p,f,3);await p.getByLabel('温度・選択',{exact:true}).selectOption('1')
    await p.getByLabel('候補制限の方式',{exact:true}).selectOption('top-p')
    await p.getByLabel('累積確率の閾値',{exact:true}).selectOption('0.8')
    await expect(p).toContainText('上位の個数');await expect(p).toContainText('上位の累積');await expect(p).toContainText('で割る → 和1')
    await stage(p,f,2);await expect(p.locator('[data-effective-method]')).toHaveAttribute('data-effective-method','top-k')
    await stage(p,f,6)
    for(const kind of ['draw','logit']) {
      await p.getByLabel('比較する揺らぎ',{exact:true}).selectOption(kind)
      await expect(p.locator('[data-comparison-value-label]')).toHaveText(Array(2).fill(kind==='draw'?'値: 確率':'値: ロジット'))
      if(kind==='logit')await expect(p.locator('[data-comparison-bar-label]')).toHaveText(Array(2).fill('棒: T=1の確率'))
      const sides=await p.locator('[data-comparison-side]').evaluateAll(ns=>ns.map(n=>({selected:n.dataset.comparisonSelected,p:[...n.querySelectorAll('[data-compare-probability]')].map(r=>+r.dataset.compareProbability),z:[...n.querySelectorAll('[data-compare-logit]')].map(r=>+r.dataset.compareLogit)})))
      assert.deepEqual(sides.map(s=>s.selected),['A','B'])
      if(kind==='draw'){assert.deepEqual(sides[0].p,sides[1].p);assert.deepEqual(sides[0].z,sides[1].z)}else {near(sides[0].z[0],1.000001);near(sides[1].z[0],.999999);assert.deepEqual(sides[0].z.slice(1),sides[1].z.slice(1))}
    }
    result.sampling={fixedOracleSettings:cases,greedySeparate:true,topPBoundary:'>=',drawBoundary:'half-open',sameIDs:true}
  }
  async function cache(page,result) {
    const f=inference[1],p=panelOf(page,f.id);await stage(p,f,1)
    for(const n of [4,8]){await p.getByLabel('入力の長さ',{exact:true}).selectOption(String(n));await expect(p.locator('[data-kv-bytes]')).toHaveAttribute('data-kv-bytes',String(64*n));await expect(p.locator('[data-bytes-per-token]')).toHaveAttribute('data-bytes-per-token','64')}
    await stage(p,f,2)
    for(const op of ['prefill','decode']) {
      await p.getByLabel('処理する相',{exact:true}).selectOption(op);const n=op==='prefill'?4:5
      await expect(p.locator('[data-operation]')).toHaveAttribute('data-kv-length',String(n));await expect(p.locator('[data-operation]')).toHaveAttribute('data-sampled-in-cache','false')
      for(const row of ['K','V'])await expect(p.locator('[data-cache-row="'+row+'"] [data-cache-position]')).toHaveCount(n)
      await expect(p).toContainText(op==='prefill'?'TTFT':'以降の間隔');await expect(p).toContainText('単価差の一因')
    }
    await stage(p,f,4)
    for(const mode of ['ordinary','continuous']) {
      await p.getByLabel('処理枠の使い方',{exact:true}).selectOption(mode)
      for(let i=0;i<8;i++) {
        await p.getByLabel('論理反復',{exact:true}).selectOption(String(i));const [active,waiting,slots,reserved,bytes]=BATCH_ORACLE[mode][i],batch=p.locator('[data-batch-mode]')
        await expect(batch).toHaveAttribute('data-active-requests',active);await expect(batch).toHaveAttribute('data-waiting-requests',waiting);await expect(batch).toHaveAttribute('data-total-kv-bytes',String(bytes));await expect(batch).toHaveAttribute('data-weights-changed','false')
        for(let s=0;s<2;s++){await expect(p.locator('[data-slot="'+s+'"]')).toHaveAttribute('data-request',slots[s]);await expect(p.locator('[data-slot="'+s+'"]')).toHaveAttribute('data-reserved',String(reserved[s]))}
      }
    }
    await p.getByLabel('論理反復',{exact:true}).selectOption('2');await stage(p,f,5)
    for(const mode of ['ordinary','continuous']) { await p.getByLabel('処理枠の使い方',{exact:true}).selectOption(mode); for(const n of [4,8]){await p.getByLabel('入力の長さ',{exact:true}).selectOption(String(n));await expect(p.locator('[data-total-kv-bytes]')).toHaveAttribute('data-total-kv-bytes',String((mode==='ordinary'?n+2:n*2+2)*64))} }
    await stage(p,f,3);await expect(p.locator('[data-batch-mode]')).toHaveAttribute('data-batch-mode','ordinary');await expect(p.locator('[data-batch-iteration]')).toHaveAttribute('data-batch-iteration','0')
    await expect(p.locator('[data-total-kv-bytes]')).toHaveAttribute('data-total-kv-bytes','512')
    result.cache={bytesPerToken:64,logicalBatchStates:16,processedOnly:true,sampledTokenNotInCache:true,realTimeOrSpeedClaim:false}
  }
  async function speculative(page,result) {
    const f=inference[2],p=panelOf(page,f.id),svg=p.locator('svg.aw-scene')
    await stage(p,f,4)
    for(const c of SPECULATIVE_ORACLE) {
      await p.getByLabel('固定の経路例',{exact:true}).selectOption(c.id)
      await expect(svg).toHaveAttribute('data-speculative-mode','sampling');await expect(svg).toHaveAttribute('data-candidate-prefix','AB');await expect(svg).toHaveAttribute('data-draft-tokens','ABC')
      await expect(svg).toHaveAttribute('data-first-rejected',c.reject);await expect(svg).toHaveAttribute('data-accepted-count',String(c.accepted));await expect(svg).toHaveAttribute('data-committed-suffix',c.suffix)
      await expect(p.locator('[data-probability-comparison]')).toHaveAttribute('data-probability-comparison',c.prefix)
      for(const kind of ['p','q']) vector(await p.locator('[data-distribution-kind="'+kind+'"] [data-probability-value]').evaluateAll(ns=>ns.map(n=>+n.dataset.probabilityValue)),c[kind])
      near(+(await p.locator('[data-acceptance-rate]').getAttribute('data-acceptance-rate')),c.alpha);near(+(await p.locator('[data-acceptance-draw]').getAttribute('data-acceptance-draw')),c.u)
      vector((await p.locator('[data-exit-distribution]').getAttribute('data-exit-distribution')).split(',').map(Number),c.exit)
      if(c.reject==='none'){await expect(p.locator('[data-bonus-prefix]')).toHaveAttribute('data-bonus-prefix','ABABC');await expect(p).toContainText('追加1個')}
      else {await expect(p.locator('[data-correction-prefix]')).toHaveAttribute('data-correction-prefix',c.prefix);await expect(p).toContainText('後続も破棄');await expect(p).toContainText('max(p − q, 0)')}
      const before=await p.locator('[data-occurrence-id]').evaluateAll(ns=>ns.map(n=>n.dataset.occurrenceId));await phase(p,3.49);await stage(p,f,4)
      assert.deepEqual(await p.locator('[data-occurrence-id]').evaluateAll(ns=>ns.map(n=>n.dataset.occurrenceId)),before)
    }
    await stage(p,f,2);await expect(p).toContainText('本命1回で検証');await expect(p).toContainText('下書き分布が異なる固定例')
    for(const c of SPECULATIVE_ORACLE){await p.getByLabel('固定の経路例',{exact:true}).selectOption(c.id);await expect(svg).toHaveAttribute('data-speculative-mode','greedy');await expect(svg).toHaveAttribute('data-committed-suffix',c.greedy)}
    await stage(p,f,5)
    for(const mode of ['sampling','greedy']) {
      await p.getByLabel('確認する方式',{exact:true}).selectOption(mode)
      for(const c of SPECULATIVE_ORACLE){await p.getByLabel('固定の経路例',{exact:true}).selectOption(c.id);await expect(svg).toHaveAttribute('data-committed-suffix',mode==='sampling'?c.suffix:c.greedy);await expect(svg).toHaveAttribute('data-quality-judgment','none')}
      await expect(p).toContainText('受理率と実行コスト')
    }
    await stage(p,f,3);await expect(svg).toHaveAttribute('data-speculative-mode','sampling')
    await stage(p,f,0);await expect(svg).toHaveAttribute('data-speculative-case','middle-reject');await expect(svg).toHaveAttribute('data-committed-suffix','')
    await stage(p,f,5);await expect(svg).toHaveAttribute('data-speculative-mode','greedy');await expect(svg).toHaveAttribute('data-committed-suffix','CDCD')
    result.speculative={fixedCases:6,stochasticPQAndAcceptanceCases:3,prefixSpecific:true,residualOrBonusVerified:true,discardAfterFirstReject:true,stableOccurrences:true}
  }
  async function quantization(page,result) {
    const f=inference[3],p=panelOf(page,f.id),svg=p.locator('svg.aw-scene');await stage(p,f,2)
    const positions=()=>p.locator('[data-value-occurrence]').evaluateAll(ns=>ns.map(n=>({id:n.dataset.valueOccurrence,rect:[...n.querySelector('rect').attributes].filter(a=>['x','y','width','height'].includes(a.name)).map(a=>[a.name,a.value])})))
    const original=await positions()
    for(const target of ['weights','activations','kv']) {
      await p.getByLabel('量子化する対象',{exact:true}).selectOption(target)
      for(const bits of [16,8,4]) {
        await p.getByLabel('通常部分のbit数',{exact:true}).selectOption(String(bits))
        const regions=await p.locator('[data-quantization-region]').evaluateAll(ns=>ns.map(n=>({id:n.dataset.quantizationRegion,selected:n.dataset.regionSelected==='true',values:[...n.querySelectorAll('[data-value-bits]')].map(v=>({bits:+v.dataset.valueBits,outlier:v.dataset.outlier==='true',high:v.dataset.highPrecisionRetained==='true'}))})))
        assert.equal(regions.filter(r=>r.selected).length,1)
        for(const r of regions)for(const v of r.values){assert.equal(v.bits,r.id===target&&!v.outlier?bits:16);assert.equal(v.high,r.id===target&&bits<16&&v.outlier)}
        assert.deepEqual(await positions(),original)
        const lanes=p.locator('[data-bit-lane]'); await expect(lanes).toHaveCount(2)
        for(const [index,n] of [[0,bits],[1,16]]) { await expect(lanes.nth(index)).toHaveAttribute('data-element-bits',String(n)); await expect(lanes.nth(index).locator('[data-active-bit="true"]')).toHaveCount(n); await expect(lanes.nth(index)).toHaveAttribute('data-bit-lane',index===1&&bits<16?'outlier':'regular') }
      }
    }
    await expect(p).toContainText('PTQは学習後');await stage(p,f,1);await expect(p.locator('[data-bit-lane]')).toHaveCount(2); for(const lane of await p.locator('[data-bit-lane]').all()) { await expect(lane).toHaveAttribute('data-bit-lane','regular'); await expect(lane).toHaveAttribute('data-element-bits','4'); await expect(lane.locator('[data-active-bit="true"]')).toHaveCount(4) }
    await stage(p,f,3);await expect(p.locator('[data-task-validation-required]')).toHaveAttribute('data-task-validation-executed','false');await expect(svg).toHaveAttribute('data-quality-judgment','none')
    await stage(p,f,0);await expect(svg).toHaveAttribute('data-effective-bits','16');await expect(p).toContainText('メモリ・転送量を減らす')
    assert.ok((await p.locator('[data-value-bits]').evaluateAll(ns=>ns.map(n=>+n.dataset.valueBits))).every(n=>n===16))
    result.quantization={targetBitCombinations:9,stablePositions:true,outliersRemain16:true,onlySelectedTargetChanges:true,noMeasuredQuality:true}
  }

  // 5 profiles + semantics + keyboard + reading sync + 4 playback + noJS + print = 14.
  for(const [width,height,theme]of profiles)await check('inference: all 23 stages '+width+'x'+height+' '+theme,async result=>{
    await usePage(result,{viewport:{width,height},colorScheme:theme},async page=>{
      await openInference(page,result,{theme});result.geometry={}
      for(const f of inference) {
        const p=panelOf(page,f.id);result.geometry[f.id]=[]
        for(let i=0;i<f.labels.length;i++){
          await stage(p,f,i);await expect(p.locator('svg.aw-scene')).toHaveAttribute(f.attr,String(i))
          const extra=await extraGeometry(p,{desktop:width>=1280,result,label:f.id+' stage '+i+' '+width+'x'+height+' '+theme})
          result.geometry[f.id].push({stage:i,...await geometry(page,p),...extra})
          if(width===1440&&theme==='light')await screenshot(page,f.id+'-stage-'+i)
          else if(extra.visualReviewRequired)await screenshot(page,f.id+'-stage-'+i+'-'+width+'x'+height+'-'+theme+'-review-candidate')
        }
        if(height===720)await expect(rootOf(page,f.id).locator('.aw-sticky')).toHaveCSS('position','relative')
        if(width!==1440||theme!=='light')await screenshot(page,f.id+'-'+width+'x'+height+'-'+theme)
      }
    });sceneDelivery(result,inference)
  })
  await check('inference: every selector, independent numerical fixtures, all midpoint boundaries and reverse seeks',async result=>{
    await usePage(result,{},async page=>{
      await openInference(page,result);result.midpoints={}
      for(const f of inference)result.midpoints[f.id]=await boundaries(panelOf(page,f.id),f)
      await sampling(page,result);await cache(page,result);await speculative(page,result);await quantization(page,result)
      for(const f of inference){await geometry(page,panelOf(page,f.id));await extraGeometry(panelOf(page,f.id),{desktop:true,result,label:f.id+' semantic final'});await screenshot(page,f.id+'-semantic-final')}
    })
  })
  await check('inference: keyboard transport, modal selector state and focus return',async result=>{
    await usePage(result,{},async page=>{
      await openInference(page,result)
      for(const f of inference) {
        const p=panelOf(page,f.id);await stage(p,f,0);const slider=p.getByRole('slider')
        await slider.focus();await page.keyboard.press('End');await expect(slider).toHaveValue(String(f.labels.length-1));await expect(p.getByRole('button',{name:'次の段階',exact:true})).toBeDisabled()
        await page.keyboard.press('Home');await expect(slider).toHaveValue('0')
        await p.getByRole('button',{name:'次の段階',exact:true}).click();await expect(p).toHaveAttribute('data-stage','1')
        await p.getByRole('button',{name:'前の段階',exact:true}).click();await expect(p).toHaveAttribute('data-stage','0')
        await stage(p,f,f.controlStage);const opener=p.getByRole('button',{name:'図を拡大',exact:true})
        await opener.focus();await page.keyboard.press('Enter');const dialog=rootOf(page,f.id).getByRole('dialog'),large=dialog.locator('.aw-diagram')
        await expect(dialog).toBeVisible();assert.equal(await dialog.evaluate(n=>n.matches(':modal')),true)
        await large.getByLabel(f.control,{exact:true}).selectOption(f.choice);await geometry(page,large);await extraGeometry(large,{desktop:true,result,label:f.id+' expanded selector'});await screenshot(page,f.id+'-expanded-selector')
        await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(opener).toBeFocused();await expect(p.getByLabel(f.control,{exact:true})).toHaveValue(f.choice)
        await opener.click();await dialog.getByRole('button',{name:'拡大図を閉じる',exact:true}).click();await expect(opener).toBeFocused()
        const ids=await rootOf(page,f.id).locator('[id]').evaluateAll(ns=>ns.map(n=>n.id));assert.equal(new Set(ids).size,ids.length)
      }
    })
  })
  await check('inference: independent figure states, every reading step, manual override and resumption',async result=>{
    await usePage(result,{},async page=>{
      await openInference(page,result)
      for(const f of inference)await stage(panelOf(page,f.id),f,0)
      result.readingSteps={}
      const scroll=async(f,i,edge='top')=>{await rootOf(page,f.id).locator('[data-reading-step="'+i+'"]').evaluate((n,edge)=>window.scrollTo({top:scrollY+n.getBoundingClientRect()[edge]-Math.min(innerHeight*.4,340)+8,behavior:'instant'}),edge);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))}
      for(const f of inference) {
        const p=panelOf(page,f.id),others=inference.filter(x=>x!==f),snapshot=await Promise.all(others.map(x=>panelOf(page,x.id).getByRole('slider').inputValue()))
        await stage(p,f,f.labels.length-1);assert.deepEqual(await Promise.all(others.map(x=>panelOf(page,x.id).getByRole('slider').inputValue())),snapshot)
        await p.getByRole('button',{name:'本文に連動する',exact:true}).click()
        for(const i of [...f.steps,...f.steps.toReversed()]){await scroll(f,i);await expect(p).toHaveAttribute('data-mode','reading');await expect(p).toHaveAttribute('data-stage',String(i))}
        await scroll(f,f.steps.at(-1),'bottom');await expect(p).toHaveAttribute('data-stage',String(f.labels.length-1))
        await stage(p,f,0);await scroll(f,f.steps.at(-1));await expect(p).toHaveAttribute('data-mode','manual');await expect(p).toHaveAttribute('data-stage','0')
        await p.getByRole('button',{name:'本文に連動する',exact:true}).click();await scroll(f,f.steps[0]);await expect(p).toHaveAttribute('data-stage',String(f.steps[0]))
        await p.getByRole('button',{name:'本文に連動中',exact:true}).click()
        assert.deepEqual(await Promise.all(others.map(x=>panelOf(page,x.id).getByRole('slider').inputValue())),snapshot)
        result.readingSteps[f.id]={forward:f.steps,reverse:f.steps.toReversed(),endStage:f.labels.length-1}
      }
    })
  })
  for(const f of inference)await check(f.id+': native elapsed play, frozen pause, replay and completion',async result=>{
    await usePage(result,{},async page=>{
      await openInference(page,result);const p=panelOf(page,f.id),slider=p.getByRole('slider');await stage(p,f,0);await p.scrollIntoViewIfNeeded()
      await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(900);const start=Date.now()
      await p.getByRole('button',{name:'図解を再生',exact:true}).click();await expect(p).toHaveAttribute('data-mode','playing');await page.waitForTimeout(5200)
      const progress=+await slider.inputValue();assert.ok(progress>.6&&progress<2)
      await p.getByRole('button',{name:'図解を一時停止',exact:true}).click();await expect(p).toHaveAttribute('data-mode','manual')
      const paused=await slider.inputValue(),frozen=await p.locator('svg.aw-scene').evaluate(n=>n.innerHTML)
      await page.waitForTimeout(1000);assert.equal(await slider.inputValue(),paused);assert.equal(await p.locator('svg.aw-scene').evaluate(n=>n.innerHTML),frozen)
      await page.emulateMedia({reducedMotion:'reduce'});await stage(p,f,f.labels.length-1);await page.emulateMedia({reducedMotion:'no-preference'})
      await p.getByRole('button',{name:'図解を最初から再生',exact:true}).click();await expect.poll(async()=>+await slider.inputValue()).toBeLessThan(.5)
      await p.getByRole('button',{name:'図解を一時停止',exact:true}).click()
      await phase(p,f.labels.length-1-.2);await p.getByRole('button',{name:'図解を再生',exact:true}).click();await page.waitForTimeout(1500)
      await expect(slider).toHaveValue(String(f.labels.length-1));await expect(p).toHaveAttribute('data-mode','manual')
      result.playback={clock:'native browser time; no fake clock',elapsedMs:Date.now()-start,progress,paused,frozen:true,replay:true,completion:true}
    })
  })
  await check('inference noJS: original prose, 9 headings, 2 equations and all 23 static descriptions',async result=>{
    await usePage(result,{javaScriptEnabled:false},async page=>{
      await openInference(page,result,{noJS:true})
      for(const f of inference){const root=rootOf(page,f.id),p=panelOf(page,f.id);await expect(root.locator('.aw-prose')).toBeVisible();assert.ok((await root.locator('.aw-prose').textContent()).trim().length>50);await expect(p.locator('svg.aw-scene')).toBeVisible();await expect(p.getByRole('slider')).toBeDisabled();await expect(root.locator('noscript > p')).toBeVisible();await root.locator('.rf-static-stages summary').click();await expect(root.locator('.rf-static-stages ol')).toBeVisible();await expect(root.locator('.rf-static-stages li')).toHaveCount(f.labels.length)}
      await screenshot(page,'inference-no-javascript')
    })
  })
  await check('inference print: four coherent scenes and original article with controls hidden',async result=>{
    await usePage(result,{},async page=>{
      await openInference(page,result)
      for(const f of inference)await phase(panelOf(page,f.id),Math.min(2.25,f.labels.length-1))
      await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await page.emulateMedia({media:'print'})
      for(const f of inference){await expect(rootOf(page,f.id).locator('.aw-prose')).toBeVisible();await expect(panelOf(page,f.id).locator('svg.aw-scene')).toBeVisible();await expect(panelOf(page,f.id).locator('.aw-timeline')).not.toBeVisible();await expect(rootOf(page,f.id).locator('.aw-sticky')).toHaveCSS('position','static')}
      await expect(page.locator('article h3')).toHaveText(headings,{useInnerText:true});await expect(page.locator('article .katex-display')).toHaveCount(2);await screenshot(page,'inference-print');result.print='CSS emulation with beforeprint; not physical printing'
    })
  })
}
