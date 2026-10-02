'use client'
import {useId,useState} from 'react'
import {BoundaryCanvas,BoundaryFigure,BoundaryPair,Text,Box,Wire,Select,Tokens} from './synthetic-sandbox-interop-primitives'
import {SYNTHETIC_CONDITIONS,syntheticAdmission,syntheticEvaluationSeparation} from '../../lib/synthetic-sandbox-interop-model.mjs'
export function SyntheticPurposeGeneration({children}){
 const id=useId(),[purpose,setPurpose]=useState('sft'),[pattern,setPattern]=useState('seed')
 const purposes={sft:['指示 → 望ましい応答','指示追従・形式・文体'],distill:['教師の出力を選別','小型へ挙動を移す'],preference:['同じ入力への応答ペア','選好の違いを教える'],augment:['実データの言い換え','不足パターンを補強']}
 return <BoundaryFigure diagram="synthetic-purpose-generation" title="学習用データの目的から、生成と選別へ進む。" scene={({phase})=><BoundaryCanvas diagram="synthetic-purpose-generation" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['学習を選ぶ判断と、評価用データを区分する','目的ごとに、作るものと使い先を合わせる','seedと条件の範囲が、生成分布へ影響する','生成量より、残すものを選ぶ設計を見る','教師の出力を、そのまま正解にしない'][stage]}</Text>
  {stage===0?<BoundaryPair id={id} phase={phase} left={['先に必要性を確認','プロンプト・RAGと比較','FT・蒸留の正本へ','不要なら作成へ進めず']} right={['学習用に限定','SFT・蒸留・選好','評価用は別の正本へ','学習と評価を分離']} arrow={false}/>:stage===1?<>
   <Tokens labels={['SFT','蒸留','選好','拡張']} y={87} selected={[['sft','distill','preference','augment'].indexOf(purpose)]}/>
   <BoundaryPair id={id} phase={phase} y={187} left={['作るもの',...purposes[purpose],'目的に合う形を確認']} right={['使う前の確認','正しさ・形式・条件','選別と多様性を測る','大量生成を品質にせず']}/>
  </>:stage===2?<BoundaryPair id={id} phase={phase} left={[pattern==='seed'?'良質なseedから':pattern==='conditions'?'条件を多様化':'自己生成から選別',pattern==='seed'?'実例の分布を起点':pattern==='conditions'?'視点・条件を変える':'候補を生成する','偏りと重複を点検','目的に合う範囲を保持']} right={['生成の候補','偏りは増幅されうる','似た表現を大量化せず','選別と計測へ渡す']}/>:<>
   <Box x={32} y={87} width={260} height={140} title={stage===3?'生成器の候補':'教師出力の候補'} lines={['もっともらしさは未検証','学習へ直送しない']} tone="violet"/>
   <Wire id={id} d="M292 157H340" active phase={phase}/>
   <Box x={348} y={87} width={260} height={140} title="検証器のfilter" lines={['schema・test・照合','独立ラベルと人手']}/>
   <Wire id={id} d="M478 227V263H320V281" active phase={phase}/>
   <Box x={64} y={290} width={512} height={91} title="形式・正しさ・条件を照合した候補" lines={['利用許諾と評価の分離は、学習前に別途確認']} tone="amber"/>
  </>}
 </>}</BoundaryCanvas>} controls={({stage,ready})=>stage===1?<Select label="学習データの用途" value={purpose} onChange={setPurpose} ready={ready}><option value="sft">SFT: 指示と望ましい応答</option><option value="distill">蒸留: 教師出力</option><option value="preference">選好: 良い応答と悪い応答</option><option value="augment">実データの拡張</option></Select>:stage===2?<Select label="生成する型" value={pattern} onChange={setPattern} ready={ready}><option value="seed">良質なseedを拡張</option><option value="conditions">ペルソナ・条件を多様化</option><option value="filter">自己生成してfilter</option></Select>:null}>{children}</BoundaryFigure>
}
export function SyntheticQualitySeparation({children}){
 const id=useId(),[missing,setMissing]=useState('validation'),[separation,setSeparation]=useState('seed'),[mixture,setMixture]=useState('recursive')
 const admission=syntheticAdmission(Object.fromEntries(SYNTHETIC_CONDITIONS.map(key=>[key,missing!==key])))
 const evaluation=syntheticEvaluationSeparation({seedsDisjoint:separation!=='seed',pathsSeparated:separation!=='path',independentEvaluation:separation!=='evaluation'})
 return <BoundaryFigure diagram="synthetic-quality-separation" title="選別・分布・権利・評価分離を、学習前に合わせる。" scene={({phase})=><BoundaryCanvas diagram="synthetic-quality-separation" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['生成器と同系の判定だけで、ラベルを正解にしない','量を増やすことと、多様性を確保することは別','反復のリスクを、架空の崩壊曲線にしない','利用する教師の規約・契約を照合する','言い換えでも、同じseedは実質重複になりうる','必要な確認を合わせて、学習を検討する'][stage]}</Text>
  {stage===0?<BoundaryPair id={id} phase={phase} left={['機械のfilter','決定的な検証','モデル判定の限界','共有する盲点を点検']} right={['独立した照合','別手段のラベル確認','無作為の人手検品','もっともらしい誤り']}/>:stage===1?<>
   <Tokens labels={['重複','近重複','表現の分散']} y={102} selected={[0,1,2]}/>
   <Box x={64} y={219} width={512} height={138} title="多様性を計測して、単調化を検出" lines={['大量の類似表現を、広い分布にしない','生成の条件と複数のソースを点検','図は件数・割合・精度を作らない']} tone="violet"/>
  </>:stage===2?<BoundaryPair id={id} phase={phase} left={[mixture==='recursive'?'自己生成の反復':'実データを補強','モデル出力 → 次の学習','裾の喪失を点検','文体の単調化を点検']} right={['実データと評価','合成は補強として使う','分布と品質を点検','混合で保証はしない']} arrow={mixture==='recursive'}/>:stage===3?<BoundaryPair id={id} phase={phase} left={['対象の教師モデル','提供者・モデル・時点','学習利用の条件','契約の確認先へ戻る']} right={['利用範囲を照合','用途と競合学習等','代替するデータも検討','図は法的判定をしない']}/>:stage===4?<g data-synthetic-evaluation-candidate={String(evaluation.reviewCandidate)} data-synthetic-independence-guaranteed="false">
   <Box x={32} y={89} width={260} height={174} title="学習側のseed" lines={['学習用の生成経路','言い換えも系譜を保持','評価側へ流用しない']} tone="violet"/>
   <Box x={348} y={89} width={260} height={174} title="評価側のseed" lines={['独立した生成と評価','汚染を点検する','スコアだけで判断せず']}/>
   <Text y={328} small tone={evaluation.reviewCandidate?'teal':'amber'}>{evaluation.reviewCandidate?'分離を照合する候補':'seed・経路・独立評価の不足を残す'}</Text>
  </g>:<g data-synthetic-admission-candidate={String(admission.reviewCandidate)} data-synthetic-training-executed="false" data-synthetic-quality-guaranteed="false" data-synthetic-legal-guaranteed="false">
   <Box x={64} y={112} width={512} height={190} title={admission.reviewCandidate?'学習を検討する候補':'不足を残して生成・選別・照合へ戻る'} lines={['目的・検証・多様性・人手の確認','実データ・利用条件・評価分離','品質と利用許諾を保証せず','図は学習を実行しない']} tone={admission.reviewCandidate?'teal':'amber'}/>
  </g>}
 </>}</BoundaryCanvas>} controls={({stage,ready})=>stage===2?<Select label="反復学習の読み方" value={mixture} onChange={setMixture} ready={ready}><option value="recursive">自己生成を反復するリスク</option><option value="supplement">実データを補強する構成</option></Select>:stage===4?<Select label="評価分離の不足" value={separation} onChange={setSeparation} ready={ready}><option value="seed">同じseedを流用</option><option value="path">生成経路を共有</option><option value="evaluation">独立評価が未確認</option><option value="none">必要な分離を照合</option></Select>:stage===5?<Select label="学習前の不足条件" value={missing} onChange={setMissing} ready={ready}>{[['purpose','用途'],['validation','検証とラベル'],['diversity','多様性'],['humanCheck','人手検品'],['realData','実データによる補強'],['terms','教師の利用条件'],['evaluationSeparation','評価の分離'],['none','必要条件を照合']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select>:null}>{children}</BoundaryFigure>
}
