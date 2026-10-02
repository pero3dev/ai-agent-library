'use client'
import {useId,useState} from 'react'
import {LifecycleCanvas,LifecycleFigure,LifecyclePair,LifecycleThree,Text,Box,Select,Tokens} from './evaluation-lifecycle-primitives'
import {benchmarkComparable,benchmarkToyPareto} from '../../lib/evaluation-lifecycle-model.mjs'
const categories={code:['コーディング','SWE-bench・Terminal-Bench','Issueの修正パッチ・ターミナル実作業','版・課題・資源と評価器を確認'],web:['Web操作','WebArena・VisualWebArena・Mind2Web','Webのタスク遂行と実行結果','旧版とVerified・Hardを区分'],computer:['コンピュータ操作','OSWorld・AndroidWorld','実OS・アプリのGUI操作','長時間版と旧版を区分'],general:['汎用アシスタント','GAIA・HLE','実世界質問・専門知識の限界','課題の正解と後継版を確認'],tool:['対話＋tool','τ-bench・BFCL','対話中のポリシーと状態・呼出し','関数精度を全Agent品質にせず'],safety:['安全性','AgentHarmなど','拒否と攻撃後の能力保持','高得点を全安全保証にせず']}
const providers={uniform:['第三者の統一実測','条件を揃えた横比較','最適化の余地を保持','検証水準と実測条件'],vendor:['ベンダー自己報告','ベンダーの最適条件','直接比較には条件照合','自己報告の出所を保持'],aggregate:['自己申告の集約','条件・検証がばらばら','主に傾向を把握する','実行主体へ遡る'],preference:['人間の選好投票','好まれた回答の比較','タスク成功率でない','測っている観点を区分']}
export function BenchmarkMapProvenance({children}){
 const id=useId(),[category,setCategory]=useState('code'),[provider,setProvider]=useState('uniform'),[missing,setMissing]=useState('effort'),selected=Object.keys(categories).indexOf(category)
 const comparison=benchmarkComparable({sameVersion:missing!=='version',sameTasks:missing!=='tasks',sameHarness:missing!=='harness',sameEffort:missing!=='effort',sameResources:missing!=='resources',sameTrials:missing!=='trials',sameGrader:missing!=='grader'})
 return <LifecycleFigure diagram="benchmark-map-provenance" title="自タスクに近い地図と、スコアの実行条件" scene={({phase})=><LifecycleCanvas diagram="benchmark-map-provenance" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['候補を絞る公開評価から、自社の評価へ進む','何を測るカテゴリか、タスクから選ぶ','同じモデル名だけで、同条件と読まない','誰がどの条件で測った値かを分ける','欠けた条件を埋めず、比較可能性を照合する'][stage]}</Text>
  {stage===0?<LifecyclePair id={id} phase={phase} left={['公開ベンチの3用途','候補の足切り','相場観を把握','能力の変化検知']} right={['自社の分布と条件','候補を試す順番へ','自社セットで実測','最終の採用判断']}/>:stage===1?<>
   <Tokens labels={['コード','Web','GUI']} selected={selected<3?[selected]:[]} y={81}/>
   <Tokens labels={['汎用','対話＋tool','安全性']} selected={selected>=3?[selected-3]:[]} y={140}/>
   <Box x={48} y={217} width={544} height={157} title={categories[category][0]} lines={categories[category].slice(1)} tone="violet"/>
  </>:stage===2?<>
   <Tokens labels={['モデル','ハーネス','推論努力']} selected={[0,1,2]} y={92}/>
   <Tokens labels={['課題と版','計算資源','反復と採点']} selected={[0,1,2]} y={165}/>
   <Box x={64} y={254} width={512} height={113} title="組合せに付くスコア" lines={['ループ・tool・再試行・結果選択が変わる','モデル名だけで横比較せず、実行条件へ遡る']} tone="teal"/>
  </>:stage===3?<Box x={64} y={104} width={512} height={207} title={providers[provider][0]} lines={providers[provider].slice(1)} tone={provider==='uniform'?'teal':'amber'}/>:<Box x={64} y={104} width={512} height={219} title={comparison.comparable?'比較条件を照合した候補':'条件が欠けた比較を保留'} lines={['版・タスク・ハーネス・推論努力','資源・試行回数・採点条件','日付と詳細の出所も残す','一致だけで自社品質を保証しない']} tone={comparison.comparable?'teal':'amber'} data-benchmark-comparable={String(comparison.comparable)} data-benchmark-quality-guaranteed="false"/>}
 </>}</LifecycleCanvas>} controls={({stage,ready})=>stage===1?<Select label="自タスクに近いベンチカテゴリ" value={category} onChange={setCategory} ready={ready}>{Object.entries(categories).map(([value,row])=><option key={value} value={value}>{row[0]}</option>)}</Select>:stage===3?<Select label="ベンチスコアの実行主体" value={provider} onChange={setProvider} ready={ready}>{Object.entries(providers).map(([value,row])=><option key={value} value={value}>{row[0]}</option>)}</Select>:stage===4?<Select label="ベンチ比較の異なる条件" value={missing} onChange={setMissing} ready={ready}><option value="version">版</option><option value="tasks">タスク集合</option><option value="harness">ハーネス</option><option value="effort">推論努力</option><option value="resources">計算資源</option><option value="trials">試行回数</option><option value="grader">採点条件</option><option value="none">必要条件を照合</option></Select>:null}>{children}</LifecycleFigure>
}
const costs={tradeoff:{id:'C',score:5,cost:4},dominated:{id:'C',score:3,cost:4},missing:{id:'C',score:5,cost:null}}
const issues={contamination:['汚染','公開問題の学習混入','非公開・新問の版を確認','記憶と能力を混ぜない'],saturation:['飽和','上限近くで差が出ない','未飽和のカテゴリへ','上位の微差で決めない'],quality:['課題・採点の誤り','曖昧さ・厳しいテスト','人手検証と修正版を確認','数ポイントを能力差にせず']}
export function BenchmarkReliabilityCost({children}){
 const id=useId(),[cost,setCost]=useState('tradeoff'),[issue,setIssue]=useState('contamination'),points=[{id:'A',score:3,cost:1},{id:'B',score:4,cost:2},costs[cost]],decisions=benchmarkToyPareto(points)
 return <LifecycleFigure diagram="benchmark-reliability-cost" title="信頼性・費用・欠測と、版を改めて測る条件" scene={({phase})=><LifecycleCanvas diagram="benchmark-reliability-cost" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['1回できることと、繰返し安定してできること','モデル差と、問題・採点のノイズを区分する','成果と費用の二軸を、欠測を残して読む','カテゴリ・統一実測・自社評価で絞り込む','難化と、資源や課題の修正を分ける','努力別の詳細と費用の対象件数まで確認する','旧版の飽和を、修正後の全派生へ転用しない'][stage]}</Text>
  {stage===0?<LifecyclePair id={id} phase={phase} arrow={false} left={['pass@1','1回試行の成功率','試行ごとに成否が揺れる','小差はノイズも疑う']} right={['pass^k','k回すべて成功する確率','業務の反復要求へ照合','1回成功と区分する']}/>:stage===1?<Box x={64} y={104} width={512} height={207} title={issues[issue][0]} lines={issues[issue].slice(1)} tone="amber"/>:stage===2?<>
   <Text x={66} y={89} small anchor="start">模式の成果 ↑</Text>
   <path d="M88 110V329H557" fill="none" stroke="#a7becf" strokeWidth="2"/>
   {[1,2,3,4,5].map(n=><g key={n}><path d={`M88 ${329-n*41}H557`} stroke="#7893a7" strokeOpacity=".35"/><Text x={67} y={336-n*41} small>{n}</Text></g>)}
   {[1,2,3,4,5,6].map(n=><Text key={n} x={88+n*72} y={353} small>{n}</Text>)}
   {points.filter(p=>p.cost!==null).map(p=>{const decision=decisions.find(row=>row.id===p.id);return <g key={p.id} data-toy-pareto-id={p.id} data-toy-pareto-frontier={String(decision.frontier)}><circle cx={88+p.cost*72} cy={329-p.score*41} r="10" fill={decision.frontier?'#42d6b2':'#ffd48a'} stroke="#e4efff" strokeWidth="2"/><Text x={88+p.cost*72+22} y={337-p.score*41} anchor="start">{p.id}</Text></g>})}
   <Text x={551} y={89} small anchor="end">模式の費用 →</Text>
   <Text y={393} small>{cost==='missing'?'C: 費用欠測 → 点を描かない':cost==='dominated'?'C: Bより高費用・低成果':'A・B・C: 異なる費用と成果'}</Text>
   <g data-toy-pareto-c-comparable={String(decisions[2].comparable)} data-toy-pareto-c-frontier={String(decisions[2].frontier)} data-benchmark-actual-score="false"/>
  </>:stage===3?<LifecycleThree columns={[['近いカテゴリ','自社タスクの型','無関係な高順位','判断に使わず'],['第三者実測','条件と検証を確認','自己報告を補正','同条件で相場観'],['自社評価セット','候補2〜3を測る','実際の分布へ','最終判断を残す']]}/>:stage===4?<LifecyclePair id={id} phase={phase} arrow={false} left={['Terminal-Bench 4.0','原文: 2026-09-17確認','時間・CPU・メモリ校正','課題の除外と修正']} right={['メジャー版を再実行','旧版の値を直比較せず','8時間は実行時間の上限','所要時間ではない']}/>:stage===5?<LifecyclePair id={id} phase={phase} arrow={false} left={['原文の表示観測','2026-09-28確認','同じ組でも努力別の行','費用と区間が異なる']} right={['費用の対象を確認','partial: 324/330','欠測をゼロにしない','内訳未確定は総額にせず']}/>:<LifecyclePair id={id} phase={phase} arrow={false} left={['旧WebArena','飽和報告の対象を保持','全派生を一括にしない','問題と版へ遡る']} right={['WebArena-Verified','課題・参照解・評価器','network traceで採点','Hardの飽和に一般化せず']}/>}
 </>}</LifecycleCanvas>} controls={({stage,ready})=>stage===1?<Select label="ベンチ品質の点検対象" value={issue} onChange={setIssue} ready={ready}>{Object.entries(issues).map(([value,row])=><option key={value} value={value}>{row[0]}</option>)}</Select>:stage===2?<Select label="模式の費用・成果条件" value={cost} onChange={setCost} ready={ready}><option value="tradeoff">Cは高費用・高成果</option><option value="dominated">CはBに劣る組合せ</option><option value="missing">Cの費用が欠測</option></Select>:null}>{children}</LifecycleFigure>
}
