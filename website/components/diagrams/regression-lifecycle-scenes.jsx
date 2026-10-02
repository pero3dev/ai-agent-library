'use client'
import {useId,useState} from 'react'
import {LifecycleCanvas,LifecycleFigure,LifecyclePair,LifecycleThree,Text,Box,Select,Tokens} from './evaluation-lifecycle-primitives'
import {regressionScope,regressionGate} from '../../lib/evaluation-lifecycle-model.mjs'
const patterns={mixed:[true,false,true,true],all:[true,true,true,true],none:[false,false,false,false]}
export function RegressionLayerScope({children}){
 const id=useId(),[pattern,setPattern]=useState('mixed'),[policy,setPolicy]=useState('all'),values=patterns[pattern],passed=values.filter(Boolean).length,met=policy==='all'?passed===values.length:passed>0
 return <LifecycleFigure diagram="regression-layer-scope" title="非局所の変更と、LLM呼出し別の回帰レイヤ" scene={({phase})=><LifecycleCanvas diagram="regression-layer-scope" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['小さな挙動変更でも、別のケースへ影響する','部品・単一呼出し・Agent全体を分ける','同じ成否列でも、必要な成功条件は異なる','同じ版の変動を、変更の劣化と区分する','不安定なケースも、品質情報として残す'][stage]}</Text>
  {stage===0?<LifecyclePair id={id} phase={phase} left={['小さな変更','promptの一行','tool説明の一語','モデルの版']} right={['全体へ照合','検索・経費・別タスク','前後を同じセットで比較','依存コードだけで絞らず']}/>:stage===1?<LifecycleThree columns={[
   ['L1: 決定的','LLMなし','実装の単体検査','毎コミット全量'],['L2: 部品','1ケース1呼出し','分類・抽出・judge','PR小規模＋夜間'],['L3: 全体','1ケース多数回','成果と軌跡','夜間・公開前']
  ]}/>:stage===2?<>
   <Tokens labels={values.map((value,i)=>`${i+1}: ${value?'成功':'失敗'}`)} selected={values.flatMap((value,i)=>value?[i]:[])} y={106}/>
   <Box x={64} y={227} width={512} height={140} title={`${passed}/${values.length}成功 → ${met?'模式条件を満たす':'要求条件に届かない'}`} lines={[policy==='all'?'要求: 毎回成功する':'要求: 1回以上成功する','成否列は模式入力。実スイートの測定ではない']} tone={met?'teal':'amber'} data-regression-repeat-met={String(met)} data-regression-tests-executed="false"/>
  </>:stage===3?<LifecyclePair id={id} phase={phase} arrow={false} left={['同じ版の繰返し','通常の変動幅を把握','原文の2〜3回は作業例','統計的十分性でない']} right={['変更後との比較','同じセット・採点条件','劣化幅と新たな失敗','集計差だけで原因にせず']}/>:<LifecyclePair id={id} phase={phase} left={['たまに落ちるケース','削除で成功率を上げず','発生頻度を記録','本番にも残る失敗']} right={['調査と対策','ノイズと欠陥を調べる','条件と軌跡へたどる','回帰資産として保つ']}/>}
 </>}</LifecycleCanvas>} controls={({stage,ready})=>stage===2?<><Select label="回帰の模式成否列" value={pattern} onChange={setPattern} ready={ready}><option value="mixed">3成功・1失敗</option><option value="all">4回すべて成功</option><option value="none">4回とも失敗</option></Select><Select label="タスクの反復要求" value={policy} onChange={setPolicy} ready={ready}><option value="all">毎回成功すべき</option><option value="any">1回以上でよい</option></Select></>:null}>{children}</LifecycleFigure>
}
export function RegressionGateRecovery({children}){
 const id=useId(),[change,setChange]=useState('prompt'),[missing,setMissing]=useState('baseline'),scope=regressionScope(change),gate=regressionGate({absoluteMet:missing!=='absolute',baselineMet:missing!=='baseline',budgetMet:missing!=='budget',failuresReviewed:missing!=='failures'})
 return <LifecycleFigure diagram="regression-gate-recovery" title="検査を広げる条件と、落ちたケースの還流" scene={({phase})=><LifecycleCanvas diagram="regression-gate-recovery" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['軽く頻繁に、全体と反復は必要な時点へ','変更種別から、検査範囲とjudge検証を選ぶ','絶対基準だけで、前回からの劣化を通さない','出力の差から、経路と原因の調査へ進む','本番の失敗を、再発検知の資産へ戻す'][stage]}</Text>
  {stage===0?<>
   <LifecycleThree columns={[['PR','L1全量＋smoke','分単位の予算','小さく頻繁に'],['夜間・マージ後','フルスイート','全ケースを照合','集計とケース差'],['リリース前','複数回フル','反復要求を判定','合意したゲート']]}/>
   <Text y={322} small>{['費用を記録し、並列化はAPI制限と調整する','評価専用キーで、予算と権限を本番から分離']}</Text>
  </>:stage===1?<>
   <Tokens labels={['L1','L2','L3']} selected={scope.layers.map(layer=>Number(layer.slice(1))-1)} y={99}/>
   <Box x={64} y={207} width={512} height={168} title={change==='internal'?'定義・挙動仕様が不変の内部実装':change==='model'?'モデル更新: 新旧を同じフルで比較':'prompt・tool定義・追加: smokeからフルへ'} lines={[change==='internal'?'原文の最低限: L1。仕様も変わるなら再分類':'原文の最低限: L1・L2・L3',scope.judgeRevalidation?'judgeの人手一致検証もやり直す':'図は実テストやモデル更新を実行しない']} tone="violet" data-regression-scope={scope.layers.join(',')} data-regression-full-suite={String(scope.fullSuite)} data-regression-judge-revalidation={String(scope.judgeRevalidation)}/>
  </>:stage===2?<Box x={64} y={104} width={512} height={219} title={gate.reviewCandidate?'採用の検討へ進む候補':'不足する条件を残して戻る'} lines={['絶対基準と、前回比の劣化幅','予算内か、新たな失敗を確認','集計だけで原因を確定しない','図はCI実行や品質保証をしない']} tone={gate.reviewCandidate?'teal':'amber'} data-regression-review-candidate={String(gate.reviewCandidate)} data-regression-ci-executed="false" data-regression-quality-guaranteed="false"/>:stage===3?<LifecyclePair id={id} phase={phase} left={['落ちたケースの一覧','集計からケースへ','新旧の出力差','直接たどれる参照先']} right={['軌跡の比較へ','tool・引数・回復','成果と経路を調査','原因の仮説を検証']}/>:<LifecyclePair id={id} phase={phase} left={['本番の不具合','失敗の条件を保存','原因と修正を確認','再現するケースを追加']} right={['回帰の資産へ','既知の失敗を再評価','次の変更で再発を検知','緑だけで全品質にせず']}/>}
 </>}</LifecycleCanvas>} controls={({stage,ready})=>stage===1?<Select label="回帰範囲を選ぶ変更" value={change} onChange={setChange} ready={ready}><option value="internal">内部実装のみ・仕様不変</option><option value="prompt">prompt・tool定義・追加</option><option value="model">モデルの版更新</option></Select>:stage===2?<Select label="回帰ゲートの不足条件" value={missing} onChange={setMissing} ready={ready}><option value="absolute">絶対基準</option><option value="baseline">前回との比較</option><option value="budget">評価の予算</option><option value="failures">新たな失敗の確認</option><option value="none">必要条件を照合</option></Select>:null}>{children}</LifecycleFigure>
}
