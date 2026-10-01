'use client'
import {useState} from 'react'
import {FeedbackFigure,FeedbackCanvas,Text,Box,Wire,Select} from './feedback-streaming-primitives'
import {optimizationCandidate} from '../../lib/feedback-streaming-model.mjs'
const symptoms={format:['形式が崩れる','構造化出力・書出し'],instruction:['指示を無視する','配置と優先順位'],unstable:['判断が揺れる','基準と境界・否定例'],shallow:['難問で浅い答え','情報・中間処理・モデル'],tone:['冗長・トーン不一致','具体的な形式と例'],fact:['事実が間違う','根拠不足と誤読を分ける'],robust:['実入力で壊れる','頑健性のケースを追加']}
export function OptimizationFailureCycle({children}){
 const [symptom,setSymptom]=useState('fact'),[cause,setCause]=useState('unknown'),[improved,setImproved]=useState('no'),[regression,setRegression]=useState('no'),[judgment,setJudgment]=useState('unused')
 const state=optimizationCandidate({improved:improved==='yes',nonDegraded:regression==='yes',unusedJudgment:judgment==='unused'})
 return <FeedbackFigure diagram="optimization-failure-cycle" title="失敗から一つの変更を作り、改善と非劣化で戻り方を選ぶ"
  controls={({stage,ready})=>stage===1?<Select label="原文の失敗症状" value={symptom} onChange={setSymptom} ready={ready}>{Object.entries(symptoms).map(([id,[t]])=><option key={id} value={id}>{t}</option>)}</Select>:stage===2?<Select label="原因を確認する先" value={cause} onChange={setCause} ready={ready}><option value="unknown">未確認</option><option value="prompt">指示・配置の仮説</option><option value="other">検索・ツール・文脈</option></Select>:stage===4?<><Select label="狙った類型の改善" value={improved} onChange={setImproved} ready={ready}><option value="no">確認できていない</option><option value="yes">確認済み</option></Select><Select label="他ケースの非劣化" value={regression} onChange={setRegression} ready={ready}><option value="no">確認できていない</option><option value="yes">確認済み</option></Select><Select label="最終判定用の使用" value={judgment} onChange={setJudgment} ready={ready}><option value="unused">未使用で分離</option><option value="used">候補選択に使用済み</option></Select></>:null}
  scene={s=><FeedbackCanvas diagram="optimization-failure-cycle" {...s}>{f=><>
   <Text y={35}>{['評価基盤から、失敗の循環へ','症状から調べる先を選ぶ','原因を確認してから変更案へ','比較で寄与を切り分ける','狙いの改善と、他の非劣化','採否の理由を次の循環へ'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={67} y={76} width={506} height={90} title="評価セット・判定基準・版管理" lines={['先に、改善を確かめる土台を置く']} tone="teal"/>
    {['失敗収集','分類と仮説','変更と評価'].map((t,i)=><Box key={t} x={32+i*204} y={240} width={168} height={96} title={t} tone="violet"/>)}
    <Wire id={s.id} d="M320 166V219M200 288H229M404 288H433" active phase={f.phase}/>
    <Text y={391} small>良くなった気がする、を判定基準にしない</Text>
   </>:f.stage===1?<>
    <Box x={32} y={85} width={260} height={150} title={symptoms[symptom][0]} lines={['頻度・影響・費用','重大な失敗は先に扱う']} tone="amber"/>
    <Wire id={s.id} d="M292 160H340" active phase={f.phase}/><Box x={348} y={85} width={260} height={150} title={symptoms[symptom][1]} lines={['まず試す変更の候補','確定診断ではない']} tone="teal" data-optimization-symptom={symptom}/>
    <Text y={350} small>漏えい・誤操作を、頻度の低さだけで後回しにしない</Text>
   </>:f.stage===2?<>
    <Box x={67} y={79} width={506} height={109} title={cause==='unknown'?'原因は未確認':cause==='other'?'検索・ツール・文脈を調べる':'指示と配置の仮説を調べる'} lines={['症状と、実際の原因を区分する']} tone={cause==='unknown'?'amber':'violet'} data-cause-confirmed="false"/>
    <Wire id={s.id} d="M320 188V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={110} title="反証できる仮説と変更案" lines={['根拠の不足と、提示した根拠の誤読も分ける']} tone="teal"/>
   </>:f.stage===3?<>
    <Box x={32} y={85} width={260} height={165} title="最初は一箇所" lines={['仮説と差分を明示','他条件を合わせる','効果を比較する']} tone="teal"/>
    <Box x={348} y={85} width={260} height={165} title="組合せを変える" lines={['要素を外す比較','各変更の寄与を見る','切戻しを設計する']} tone="violet"/>
    <Text y={360} small>図は架空の改善率・順位を表示しない</Text>
   </>:f.stage===4?<>
    {['狙いの改善','他の非劣化','未使用の判定'].map((t,i)=><Box key={t} x={32+i*204} y={77} width={168} height={99} title={t} lines={[[improved==='yes'?'確認済み':'未確認'],[regression==='yes'?'確認済み':'未確認'],[judgment==='unused'?'分離を確認':'選択に使用']][i]} tone={[improved==='yes',regression==='yes',judgment==='unused'][i]?'teal':'amber'}/>)}
    <Wire id={s.id} d="M116 176V222H320M524 176V222H320M320 176V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={110} title={state.candidateReady?'採用候補として記録へ':'不足を確認・分析へ戻す'} lines={['図の操作で本番は変更しない']} tone={state.candidateReady?'teal':'amber'} data-optimization-candidate={String(state.candidateReady)} data-production-changed="false"/>
   </>:<>
    <Box x={32} y={82} width={260} height={149} title="採用と棄却の記録" lines={['版・仮説・差分','評価と採否の理由','棄却も再試行に役立つ']} tone="violet"/>
    <Wire id={s.id} d="M292 157H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={149} title="運用へ戻す" lines={['レビューと回帰','本番で効果を確認','失敗を再び集める']} tone="teal"/>
    <Text y={351} small>選択したケースだけで、一般的な成功を保証しない</Text>
   </>}
  </>}</FeedbackCanvas>}>{children}</FeedbackFigure>
}
const suggestions={rewrite:['書き換え','現行と改善意図を渡す'],critique:['批評','入力・出力・期待を渡す'],generate:['生成','タスク記述から作る']}
const overfits={set:['評価セット','未使用判定と新ケース'],judge:['判定器','検証と人手照合'],model:['モデル時点','原理と更新時の再評価']}
export function OptimizationSearchBoundaries({children}){
 const [suggestion,setSuggestion]=useState('critique'),[overfit,setOverfit]=useState('set')
 return <FeedbackFigure diagram="optimization-search-boundaries" title="候補生成を評価へ通し、三つの過適合と記録を確認する"
  controls={({stage,ready})=>stage===1?<Select label="LLMによる提案の方法" value={suggestion} onChange={setSuggestion} ready={ready}>{Object.entries(suggestions).map(([id,[t]])=><option key={id} value={id}>{t}</option>)}</Select>:stage===3?<Select label="過適合を確認する方向" value={overfit} onChange={setOverfit} ready={ready}>{Object.entries(overfits).map(([id,[t]])=><option key={id} value={id}>{t}</option>)}</Select>:null}
  scene={s=><FeedbackCanvas diagram="optimization-search-boundaries" {...s}>{f=><>
   <Text y={35}>{['候補生成・評価・選択を反復','提案のもっともらしさは、改善の証明ではない','導入前に評価と記録を確認','選択するほど、偏りも点検する','最適化を変更フローへ結ぶ'][f.stage]}</Text>
   {f.stage===0?<>
    {['候補生成','評価','選択'].map((t,i)=><Box key={t} x={32+i*204} y={99} width={168} height={103} title={t} lines={[['変異・例選択','設定を保存'][i]||'候補を残す']} tone={i===1?'teal':'violet'}/>)}
    <Wire id={s.id} d="M200 151H229M404 151H433M524 202V267H116V211" active phase={f.phase}/>
    <Text y={351} small>最適化の上限は、評価器の質に依存する</Text>
   </>:f.stage===1?<>
    <Box x={67} y={80} width={506} height={109} title={suggestions[suggestion][0]} lines={[suggestions[suggestion][1]]} tone="violet"/>
    <Wire id={s.id} d="M320 189V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={110} title="提案は評価前の仮説" lines={['同じLLMの自己評価にも偏りがある']} tone="amber" data-llm-proposal-improved="false"/>
   </>:f.stage===2?<>
    {['判定器を検証','データを分離','生成元を記録'].map((t,i)=><Box key={t} x={67} y={75+i*109} width={506} height={88} title={t} lines={[['甘い判定は、抜け道を選ぶ','必要件数はタスクと探索規模に依存','設定・データを保守と監査へ残す'][i]]} tone={i===0?'amber':'teal'}/>)}
   </>:f.stage===3?<>
    <Box x={32} y={85} width={260} height={165} title={overfits[overfit][0]} lines={['選択の偏りが蓄積','対象外で崩れる可能性']} tone="amber"/>
    <Wire id={s.id} d="M292 168H340" active phase={f.phase}/><Box x={348} y={85} width={260} height={165} title={overfits[overfit][1]} lines={['対象と結果を照合','万能な回避策ではない']} tone="teal" data-optimization-overfit={overfit}/>
    <Text y={357} small>評価セット・judge・時点は、別の確認対象</Text>
   </>:<>
    {['変更レビュー・回帰','オンラインで確認','失敗の継続的な還流'].map((t,i)=><g key={t}><Box x={67} y={76+i*108} width={506} height={79} title={t} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${155+i*108}V${174+i*108}`} active phase={f.phase}/>}</g>)}
   </>}
  </>}</FeedbackCanvas>}>{children}</FeedbackFigure>
}
