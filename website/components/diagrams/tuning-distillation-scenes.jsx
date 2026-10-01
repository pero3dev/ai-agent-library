'use client'
import {useState} from 'react'
import {SelectionFigure,SelectionCanvas,Text,Box,Wire,Select,Tokens} from './framework-model-tuning-primitives'
import {TUNING_CONDITIONS,tuningCandidate} from '../../lib/framework-model-tuning-model.mjs'
const conditionLabels=['評価','指示','知識','代替','データ','経路','再調整']
const missingLabels=['現状を測る評価','評価付きで指示改善','知識・鮮度の切分け','別モデルとの比較','タスクとデータの品質','モデルの提供経路','再調整を担う運用']
export function TuningChoiceMethods({children}){
 const [problem,setProblem]=useState('knowledge'),[missing,setMissing]=useState('routeVerified'),[method,setMethod]=useState('sft'),[route,setRoute]=useState('reception')
 const flags=Object.fromEntries(TUNING_CONDITIONS.map(key=>[key,key!==missing])),state=tuningCandidate(flags)
 const problems={instructions:['指示・形式・基準','プロンプトを改善','評価付きで試す'],knowledge:['知識不足・鮮度','まずRAGと比較','出典・更新・権限を保つ'],capability:['タスク能力不足','上位・別モデルと比較','FTの費用とも比べる'],behavior:['小型の特化した挙動','ここでFT・蒸留が候補','前提条件を確認する']}
 const methods={sft:['SFT','入力と模範出力','挙動・形式の調整'],dpo:['選好最適化','好ましい出力の対','開始能力と評価で選ぶ'],reward:['報酬ベース','採点器による強化','限定的な提供対象'],lora:['LoRAなど','小さな追加パラメータ','自前FTの経路を確認']}
 const routes={reception:['新規学習の受付','対象・顧客・時点','既存の推論とは別'],region:['領域とSLA','学習・配信の領域','手法の提供段階も確認'],retire:['基盤の退役','既存推論の期限','新しい基盤で再調整']}
 return <SelectionFigure diagram="tuning-choice-methods" title="FTの前に試す代替、七つの前提と手法"
 controls={({stage,ready})=>stage===0?<Select label="先に切り分ける課題" value={problem} onChange={setProblem} ready={ready}>{Object.entries(problems).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:stage===1?<Select label="FT検討の不足条件" value={missing} onChange={setMissing} ready={ready}>{TUNING_CONDITIONS.map((key,i)=><option key={key} value={key}>{missingLabels[i]}</option>)}<option value="none">7条件を確認済み</option></Select>:stage===2?<Select label="検討する学習手法" value={method} onChange={setMethod} ready={ready}>{Object.entries(methods).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:stage===3?<Select label="提供経路で照合する条件" value={route} onChange={setRoute} ready={ready}>{Object.entries(routes).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:null}
 scene={s=><SelectionCanvas diagram="tuning-choice-methods" {...s}>{f=><>
  <Text y={35}>{['直したいものを分け、先に試す手段を選ぶ','一つの不足条件も、FTの検討で飛ばさない','手法の役割と、実際の提供経路を分けて見る','モデル世代名だけで、学習できるとは決めない','学習の開始から、継続運用の投資へ戻す'][f.stage]}</Text>
  {f.stage===0?<>
   <Box x={32} y={82} width={260} height={160} title={problems[problem][0]} lines={problems[problem].slice(1)} tone="violet"/>
   <Wire id={s.id} d="M292 162H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={160} title="先に評価する手段" lines={['FTを自動選択しない','事実更新と挙動は別','削除・再現性は保証せず']} tone="teal"/>
   <Text y={355} small>更新できる知識と、モデルの振る舞いを切り分ける</Text>
  </>:f.stage===1?<>
   <Tokens labels={conditionLabels} y={82} selected={TUNING_CONDITIONS.flatMap((key,i)=>flags[key]?[i]:[])}/>
   <Box x={62} y={178} width={516} height={174} title={state.evaluationCandidate?'FTを評価する候補':'不足した条件を確認'} lines={[missing==='none'?'7条件をすべて確認した想定':missingLabels[TUNING_CONDITIONS.indexOf(missing)]+'が不足','他の条件は満たした想定','図は訓練・採用を実行しない']} tone={state.evaluationCandidate?'teal':'amber'} data-tuning-candidate={String(state.evaluationCandidate)} data-training-executed="false" data-tuning-quality-guaranteed="false"/>
  </>:f.stage===2?<>
   <Tokens labels={['SFT','選好','報酬','LoRA']} y={82} selected={[Object.keys(methods).indexOf(method)]}/>
   <Box x={32} y={179} width={260} height={155} title={methods[method][0]} lines={methods[method].slice(1)} tone="violet"/>
   <Box x={348} y={179} width={260} height={155} title="開始モデルと経路" lines={['指示調整済みか評価','SFTが不要な場合も','全モデルの提供にせず']} tone="teal"/>
  </>:f.stage===3?<>
   <Box x={32} y={82} width={260} height={160} title={routes[route][0]} lines={routes[route].slice(1)} tone="violet"/>
   <Box x={348} y={82} width={260} height={160} title="モデル単位で照合" lines={['手法と対象モデル','原文の確認日を保持','未知の条件を補完せず']} tone="teal"/>
   <Text y={355} small>新規jobの受付停止と、既存推論の終了は別</Text>
  </>:<>
   <Box x={32} y={82} width={260} height={177} title="最初の投資" lines={['良質なデータを準備','比較する評価を整える','訓練と検証の費用']} tone="violet"/>
   <Wire id={s.id} d="M292 169H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={177} title="継続して担う負担" lines={['基盤更新の再調整','入力分布の監視','データ・job・設定の版']} tone="teal"/>
   <Text y={359} small>条件が揃っても、図は学習jobを開始しない</Text>
  </>}
 </>}</SelectionCanvas>}>{children}</SelectionFigure>
}
export function DistillationDataLifecycle({children}){
 const [quality,setQuality]=useState('no'),[split,setSplit]=useState('separate'),[result,setResult]=useState('regression'),[scope,setScope]=useState('reception')
 return <SelectionFigure diagram="distillation-data-lifecycle" title="教師の出力から、分離した評価と継続運用へ"
 controls={({stage,ready})=>stage===0?<Select label="教師出力の品質選別" value={quality} onChange={setQuality} ready={ready}><option value="no">選別なし</option><option value="yes">評価で良い出力を選別</option></Select>:stage===2?<Select label="学習用と評価用の分離" value={split} onChange={setSplit} ready={ready}><option value="mixed">同じケースが混入</option><option value="separate">別のケースへ分離</option></Select>:stage===3?<Select label="FT前後の評価結果の模式例" value={result} onChange={setResult} ready={ready}><option value="loss">学習lossだけ改善</option><option value="regression">狙った改善あり・他で劣化</option><option value="both">改善と重要タスクの非劣化を確認</option></Select>:stage===5?<Select label="FT経路で読む提供条件" value={scope} onChange={setScope} ready={ready}><option value="reception">OpenAIの新規受付と既存推論</option><option value="sla">GoogleのSFTとSLA・領域</option><option value="legacy">BedrockのLegacyとEOL</option></Select>:null}
 scene={s=><SelectionCanvas diagram="distillation-data-lifecycle" {...s}>{f=><>
  <Text y={35}>{['教師の出力を正解にせず、選別を通して生徒へ渡す','件数だけでなく、品質と本番の入力分布を見る','学習用と評価用を、別の経路へ分ける','学習の収束と、採用の条件を区分する','何から作ったモデルかを、版で追えるようにする','新規学習・既存推論・契約条件を分けて読む'][f.stage]}</Text>
  {f.stage===0?<>
   <Box x={32} y={82} width={172} height={103} title="教師" lines={['入力と出力を収集']} tone="violet"/>
   <Wire id={s.id} d="M204 135H225" active phase={f.phase}/><Box x={233} y={82} width={174} height={103} title={quality==='yes'?'評価で選別':'選別なし'} lines={[quality==='yes'?'良い出力を選ぶ':'誤りも学習へ']} tone={quality==='yes'?'teal':'amber'} data-teacher-error-transfer={String(quality==='no')}/>
   <Wire id={s.id} d="M407 135H428" active={quality==='yes'} phase={f.phase}/><Box x={436} y={82} width={172} height={103} title="生徒SFT" lines={['選別したデータ']} tone="violet"/>
   <Wire id={s.id} d="M522 185V247H320V267" active phase={f.phase}/><Box x={85} y={267} width={470} height={111} title="同じ評価で教師との差を測る" lines={['分布の変化を監視し、必要なら再蒸留']} tone="teal"/>
  </>:f.stage===1?<>
   <Box x={32} y={82} width={260} height={178} title="質と代表性" lines={['模範出力を揃える','運用入力の分布を保つ','有害な出力を選別']} tone="teal"/>
   <Box x={348} y={82} width={260} height={178} title="数だけで決めない" lines={['原文の件数は目安','普遍的な下限にせず','本番とのずれを監視']} tone="violet"/>
   <Text y={359} small>入力分布が変わると、生徒の品質も変わり得る</Text>
  </>:f.stage===2?<>
   <Box x={170} y={72} width={300} height={93} title="形式・マスクを確認" lines={['本番と同じ入力構造のJSONL']} tone="violet"/>
   <Wire id={s.id} d="M320 165V204H162V235 M320 204H478V235" active phase={f.phase}/>
   <Box x={32} y={235} width={260} height={115} title="学習用のケース" lines={['選別した模範出力','訓練へ使うデータ']} tone="violet"/>
   <Box x={348} y={235} width={260} height={115} title={split==='separate'?'別の評価ケース':'学習ケースが混入'} lines={[split==='separate'?'未使用の入力で測る':'改善の測定が汚染','同じ評価条件を保持']} tone={split==='separate'?'teal':'amber'} data-tuning-evaluation-contaminated={String(split==='mixed')}/>
   <Text y={413} small>機微情報を含むログを、そのまま学習へ送らない</Text>
  </>:f.stage===3?<>
   <Tokens labels={['学習loss','狙った改善','他の非劣化']} y={82} selected={result==='loss'?[0]:result==='regression'?[1]:[1,2]}/>
   <Box x={77} y={181} width={486} height={156} title={result==='both'?'採用を評価する候補':'評価が不足・劣化あり'} lines={result==='loss'?['学習の収束だけでは不足','実タスクの改善を確認']:result==='regression'?['重要タスクの劣化を調査','改善だけで採用しない']:['FT前後を同じ評価で比較','費用と運用条件も確認']} tone={result==='both'?'teal':'amber'} data-tuning-acceptance-candidate={String(result==='both')}/>
   <Text y={403} small>模式例です。実精度・費用を計測した結果ではない</Text>
  </>:f.stage===4?<>
   <Tokens labels={['基盤モデル','dataset','job・設定']} y={82} selected={[0,1,2]}/>
   <Wire id={s.id} d="M320 129V187" active phase={f.phase}/><Box x={90} y={187} width={460} height={108} title="更新・退役を再調整へ結ぶ" lines={['新しい基盤で再調整・再評価']} tone="violet"/>
   <Text y={365} small>FT後も、プロンプトと運用評価を保持する</Text>
  </>:<>
   <Box x={32} y={82} width={260} height={180} title={{reception:'受付と推論を区分',sla:'手法・領域・SLA',legacy:'LegacyとEOL'}[scope]} lines={scope==='reception'?['新規jobは段階的停止','既存推論は基盤に依存','原文の終了時点を読む']:scope==='sla'?['モデルGAと手法は別','学習・配信の領域','SFTのSLA適用は別']:['新規FT受付を区分','既存利用の期限','当日呼出しは未確認']} tone="violet"/>
   <Box x={348} y={82} width={260} height={180} title="モデル単位で照合" lines={['確認日と対象を保持','別モデルへ転用せず','契約条件を補完しない']} tone="teal"/>
   <Text y={360} small>図は訓練・推論・契約照合を実行しない</Text>
  </>}
 </>}</SelectionCanvas>}>{children}</SelectionFigure>
}
