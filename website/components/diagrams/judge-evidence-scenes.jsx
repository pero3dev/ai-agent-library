'use client'
import {useId,useState} from 'react'
import {EvidenceCanvas,EvidenceFigure,EvidencePair,EvidenceThree,Text,Box,Select,Tokens} from './evaluation-evidence-primitives'
import {judgeConfusion,judgeSwapResult,judgeAcceptance} from '../../lib/evaluation-evidence-model.mjs'
const formats={binary:['観点ごとの二値判定','事実性・遵守・網羅性を分解','1 judgeで1観点を扱う','失敗理由を改善へつなげる'],pair:['手順を決めたペア比較','同じ観点で二つを比べる','順序を入れ替えて点検','絶対基準の不足を保持'],score:['基準のない数値へ注意','総合点の差で原因は分からず','点数の境界と偏り','観点の分解へ戻る']}
const biases={position:['位置の偏り','提示順を入れ替える','内容の勝者を照合','一致だけで品質にせず'],length:['長さの偏り','長さを品質と混ぜない','簡潔さを別の観点へ','長さの基準を明示'],self:['自己選好の偏り','同系統の優遇に注意','生成とjudgeを分担','別系統でも再検証'],lenient:['寛大さの偏り','迷いを無条件に合格へせず','不合格の基準を明示','境界例を用意する']}
export function JudgeFormatBias({children}){
 const id=useId(),[format,setFormat]=useState('binary'),[bias,setBias]=useState('position'),[swap,setSwap]=useState('biased')
 const swapped=judgeSwapResult({firstWinner:'a',reversedWinner:swap==='consistent'?'a':'b'})
 return <EvidenceFigure diagram="judge-format-bias" title="判定する観点・基準・文脈と、偏りの点検" scene={({phase})=><EvidenceCanvas diagram="judge-format-bias" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['judgeの誤りは、本体の改善を誤らせる','観点ごとに、行動へつながる判定形式を選ぶ','必要な文脈と基準を、理由と判定へ結ぶ','偏りごとに点検し、品質保証とは分ける'][stage]}</Text>
  {stage===0?<EvidencePair id={id} phase={phase} left={['対象の出力と文脈','元のタスクと資料','評価する観点','判定に必要な入力']} right={['別のLLMアプリ','judgeの基準とモデル','人手との不一致を確認','検証してから採用']}/>:stage===1?<Box x={64} y={104} width={512} height={207} title={formats[format][0]} lines={formats[format].slice(1)} tone={format==='score'?'amber':'violet'}/>:stage===2?<>
   <Tokens labels={['境界例','必要な文脈','理由','判定']} y={100} selected={[0,1,2,3]}/>
   <Box x={64} y={233} width={512} height={136} title="具体的な基準で、理由から判定へ" lines={['合格・不合格の境界を定める','理由と判定を構造化して受け取る','形式だけで判断の正しさは決まらない']} tone="violet"/>
  </>:bias==='position'?<>
   <Box x={32} y={85} width={260} height={125} title="提示順: A → B" lines={['模式の判定: A','内容の識別を保持']} tone="violet"/>
   <Box x={348} y={85} width={260} height={125} title="提示順: B → A" lines={[`模式の判定: ${swap==='consistent'?'A':'B'}`,'順序を入れ替えて点検']} tone="teal"/>
   <Box x={64} y={252} width={512} height={113} title={swapped.orderConsistent?'内容の勝者は順序交換後も一致':'先頭を選ぶ偏りが残る模式入力'} lines={['順序の一致は、全体品質の保証ではない','実judgeの判定結果ではない']} tone={swapped.orderConsistent?'teal':'amber'} data-judge-order-consistent={String(swapped.orderConsistent)} data-judge-quality-guaranteed="false"/>
  </>:<Box x={64} y={104} width={512} height={207} title={biases[bias][0]} lines={biases[bias].slice(1)} tone="amber"/>}
 </>}</EvidenceCanvas>} controls={({stage,ready})=>stage===1?<Select label="judgeの判定形式" value={format} onChange={setFormat} ready={ready}><option value="binary">観点別の二値判定</option><option value="pair">ペア比較</option><option value="score">数値スコアの注意</option></Select>:stage===3?<><Select label="点検するjudgeの偏り" value={bias} onChange={setBias} ready={ready}>{Object.entries(biases).map(([value,row])=><option key={value} value={value}>{row[0]}</option>)}</Select>{bias==='position'&&<Select label="順序交換後の模式判定" value={swap} onChange={setSwap} ready={ready}><option value="biased">再び先頭を選ぶ</option><option value="consistent">同じ内容Aを選ぶ</option></Select>}</>:null}>{children}</EvidenceFigure>
}
const samples={typical:{truePass:3,trueFail:3,falsePass:1,falseFail:1},rare:{truePass:7,trueFail:0,falsePass:1,falseFail:0},improved:{truePass:3,trueFail:4,falsePass:0,falseFail:1},empty:{truePass:0,trueFail:0,falsePass:0,falseFail:0}}
export function JudgeValidationSplit({children}){
 const id=useId(),[sample,setSample]=useState('rare'),[missing,setMissing]=useState('unseen'),data=samples[sample],metrics=judgeConfusion(data)
 const decision=judgeAcceptance({criteriaFixed:missing!=='criteria',labelsChecked:missing!=='labels',unseenSet:missing!=='unseen',thresholdsMet:missing!=='thresholds',sampleReported:missing!=='sample',compositionFrozen:missing!=='frozen'})
 return <EvidenceFigure diagram="judge-validation-split" title="未見の判定用と、誤合格・過剰不合格の母数" scene={({phase})=><EvidenceCanvas diagram="judge-validation-split" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['原資料の派生を跨がせず、調整と判定を分ける','不一致を、曖昧な基準と誤りの種類へ分ける','構成を固定し、用途別の採用条件へ照合する','高い全体一致でも、不合格の見逃しは残る','読んで調整したセットは、既知の開発用へ','コードで採れる条件を先に検査する'][stage]}</Text>
  {stage===0?<EvidencePair id={id} phase={phase} arrow={false} left={['開発用','失敗と不一致を読む','基準とプロンプトを調整','原資料の派生をまとめる']} right={['未見の採用判定用','調整から隔離する','固定した構成で測る','同じ原資料を跨がせず']}/>:stage===1?<EvidencePair id={id} phase={phase} arrow={false} left={['人手の基準とラベル','合否の境界を明示','人手の品質も確認','初期件数は十分性でない']} right={['judgeの不一致','不合格の見逃し','過剰な不合格','観点ごとの原因を読む']}/>:stage===2?<Box x={64} y={104} width={512} height={207} title={decision.reviewCandidate?'用途別の採用を検討する候補':'不足を残して検証へ戻る'} lines={['基準・ラベル・未見データを確認','採用条件と標本数・ばらつき','構成を固定して測定する','図は実採点や採用を行わない']} tone={decision.reviewCandidate?'teal':'amber'} data-judge-review-candidate={String(decision.reviewCandidate)} data-judge-grading-executed="false"/>:stage===3?<>
   <Box x={32} y={81} width={260} height={103} title={`正合格: ${data.truePass}`} lines={['人手: 合格／judge: 合格']} tone="teal"/>
   <Box x={348} y={81} width={260} height={103} title={`過剰不合格: ${data.falseFail}`} lines={['人手: 合格／judge: 不合格']} tone="amber"/>
   <Box x={32} y={206} width={260} height={103} title={`誤合格: ${data.falsePass}`} lines={['人手: 不合格／judge: 合格']} tone="amber"/>
   <Box x={348} y={206} width={260} height={103} title={`正不合格: ${data.trueFail}`} lines={['人手: 不合格／judge: 不合格']} tone="teal"/>
   <Text y={344} small>{`一致: ${metrics.total?`${data.truePass+data.trueFail}/${metrics.total}`:'母数なし'}　誤合格: ${metrics.humanFail?`${data.falsePass}/${metrics.humanFail}`:'母数なし'}　過剰不合格: ${metrics.humanPass?`${data.falseFail}/${metrics.humanPass}`:'母数なし'}`}</Text>
   <g data-judge-false-acceptance={metrics.falseAcceptance===null?'unavailable':String(metrics.falseAcceptance)} data-judge-agreement={metrics.agreement===null?'unavailable':String(metrics.agreement)} data-judge-quality-guaranteed="false"/>
  </>:stage===4?<EvidencePair id={id} phase={phase} left={['判定用を読んで調整','ケースと誤りが既知になる','調整したセットは開発用','同じ最終評価へ戻さない']} right={['新たな未見の判定用','基準に合うラベルを確認','構成とデータの版を記録','既知ケースは回帰へ残す']}/>:<EvidencePair id={id} phase={phase} arrow={false} left={['コードで決める条件','形式・schema・必須要素','実際の最終状態','決定的な検査を先に置く']} right={['判断が必要な観点','検証したjudgeへ分担','費用・遅さ・非決定性','人手と用途別に確認']}/>}
 </>}</EvidenceCanvas>} controls={({stage,ready})=>stage===2?<Select label="judge採用前の不足条件" value={missing} onChange={setMissing} ready={ready}><option value="criteria">基準の固定</option><option value="labels">人手ラベルの品質</option><option value="unseen">未見の判定用</option><option value="thresholds">用途別の採用条件</option><option value="sample">標本数とばらつき</option><option value="frozen">構成の固定</option><option value="none">必要条件を照合</option></Select>:stage===3?<Select label="judgeの模式件数" value={sample} onChange={setSample} ready={ready}><option value="rare">高一致でも不合格を見逃す</option><option value="typical">両方向の誤りがある</option><option value="improved">誤合格0でも過剰不合格がある</option><option value="empty">標本がない</option></Select>:null}>{children}</EvidenceFigure>
}
