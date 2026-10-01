'use client'
import {useState} from 'react'
import {SelectionFigure,SelectionCanvas,Text,Box,Wire,Select,Tokens} from './framework-model-tuning-primitives'
import {modelConditions} from '../../lib/framework-model-tuning-model.mjs'
export function ModelConstraintsTier({children}){
 const [axis,setAxis]=useState('context'),[task,setTask]=useState('middle'),[modality,setModality]=useState('yes'),[provision,setProvision]=useState('unknown'),[evaluation,setEvaluation]=useState('yes')
 const axes={tier:['tierと能力','軽量・中位・上位','タスク品質で上下'],reason:['推論の強さ','難しい判断の支援','時間・費用も評価'],latency:['遅延','待ち時間と処理量','UXの条件と照合'],cost:['費用','入出力と運用量','品質と合わせて評価'],context:['文脈の容量','必要な入力が入るか','長さだけで品質保証せず'],modality:['入力形式','text・画像・音声','必要なmodalを確認'],provision:['提供・データ条件','API・領域・保管','契約と設定を照合']}
 const state=modelConditions({modality,provision,evaluation})
 return <SelectionFigure diagram="model-constraints-tier" title="用途の条件と、モデルを選ぶ七つの軸"
 controls={({stage,ready})=>stage===1?<Select label="モデル選定の判断軸" value={axis} onChange={setAxis} ready={ready}>{Object.entries(axes).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:stage===2?<Select label="用途と評価の出発点" value={task} onChange={setTask} ready={ready}><option value="light">規則的な大量処理</option><option value="middle">通常の実行・ツール呼出し</option><option value="upper">難しい計画・失敗が高価な判断</option></Select>:stage===3?<>{[['modalの対応',modality,setModality],['提供・データ条件',provision,setProvision],['実タスクの評価',evaluation,setEvaluation]].map(([label,value,onChange])=><Select key={label} label={label} value={value} onChange={onChange} ready={ready}><option value="unknown">未確認</option><option value="yes">条件を満たす</option><option value="no">条件を満たさない</option></Select>)}</>:null}
 scene={s=><SelectionCanvas diagram="model-constraints-tier" {...s}>{f=><>
  <Text y={35}>{['最強の一つを探す前に、用途の条件を定める','能力以外の制約も、独立した軸として見る','出発点を選び、実タスクの評価で上下させる','未確認・不可・検討候補を区分する','公開benchmarkから、自分のタスクへ戻す'][f.stage]}</Text>
  {f.stage===0?<>
   <Box x={32} y={83} width={260} height={172} title="タスクの条件" lines={['失敗の影響と処理量','待てる時間・入力形式','データ・提供の制約']} tone="violet"/>
   <Wire id={s.id} d="M292 170H340" active phase={f.phase}/><Box x={348} y={83} width={260} height={172} title="評価する候補" lines={['能力と費用の釣合い','単一モデルに固定せず','実際の入力で比較']} tone="teal"/>
   <Text y={359} small>原文の2026-08時点の例は、現在の順位ではない</Text>
  </>:f.stage===1?<>
   <Box x={32} y={82} width={260} height={169} title={axes[axis][0]} lines={axes[axis].slice(1)} tone="violet"/>
   <Box x={348} y={82} width={260} height={169} title="軸を合わせて確認" lines={['上位tierだけで決めず','必要な提供条件','同じ実タスクで評価']} tone="teal"/>
   <Tokens labels={['能力','推論','遅延','費用']} y={284} selected={[[ 'tier','reason','latency','cost'].indexOf(axis)].filter(i=>i>=0)}/>
   <Tokens labels={['文脈','modal','提供']} y={344} selected={[[ 'context','modality','provision'].indexOf(axis)].filter(i=>i>=0)}/>
  </>:f.stage===2?<>
   <Tokens labels={['軽量','中位','上位']} y={82} selected={[['light','middle','upper'].indexOf(task)]}/>
   <Box x={32} y={180} width={260} height={170} title={{light:'規則的な大量処理',middle:'通常の実行',upper:'難しい計画・判断'}[task]} lines={task==='light'?['分類・抽出・定型処理','軽量から評価','失敗を見て上位も比較']:task==='middle'?['実行・ツール呼出し','中位から評価','品質を測り上下する']:['複雑な計画・推論','上位から評価','失敗の費用を合わせる']} tone="violet"/>
   <Box x={348} y={180} width={260} height={170} title="固定順位にしない" lines={['原文の用途別の例','モデル世代で変わる','入力と制約で再評価']} tone="teal"/>
  </>:f.stage===3?<>
   <Tokens labels={['modal対応','提供条件','実タスク評価']} y={82} selected={[modality,provision,evaluation].flatMap((v,i)=>v==='yes'?[i]:[])}/>
   <Box x={79} y={181} width={482} height={152} title={{alternative:'別経路を検討',confirm:'未確認を先に照合','evaluate-candidate':'採用を評価する候補'}[state.next]} lines={['一つの不可も飛ばさない','未知を可に変換しない','図は採用・実行をしない']} tone={state.next==='evaluate-candidate'?'teal':'amber'} data-model-condition-next={state.next} data-model-deployment-executed="false"/>
  </>:<>
   <Box x={32} y={83} width={260} height={171} title="公開の成績" lines={['比較条件とタスク','自社入力と異なる','採用の保証にしない']} tone="violet"/>
   <Wire id={s.id} d="M292 167H340" active phase={f.phase}/><Box x={348} y={83} width={260} height={171} title="実タスクで比較" lines={['正確さと失敗の振舞い','費用・遅延も測る','必要な制約を確認']} tone="teal"/>
   <Text y={360} small>図は実モデルの精度・速度・費用を生成しない</Text>
  </>}
 </>}</SelectionCanvas>}>{children}</SelectionFigure>
}
export function ModelPortfolioUpdates({children}){
 const [role,setRole]=useState('execute'),[cost,setCost]=useState('thinking')
 const roles={plan:['計画する役割','難しい判断を上位へ','分解と経路を設計'],execute:['実行する役割','中位・軽量も候補','ツールと状態を進める'],delegate:['限定した委譲','範囲を絞るタスク','軽量でも実品質を評価'],route:['routing・fallback','入力条件で分岐','失敗時の別経路を評価'],evaluate:['別系統の評価','出力を異なる視点で','誤りが消える保証なし']}
 const costs={input:['入力','送った文脈と再利用','実際の請求条件へ'],output:['出力','回答の長さを管理','入力単価と別に確認'],thinking:['思考','出力費用に含む場合','可視表示だけで計算せず'],cache:['cache','再利用できる入力','率と条件は時点で照合'],batch:['batch','まとめて処理する経路','割引と待ち時間を照合']}
 return <SelectionFigure diagram="model-portfolio-updates" title="役割分担、費用の構成と変更時の再評価"
 controls={({stage,ready})=>stage===0?<Select label="構成の中で見る役割" value={role} onChange={setRole} ready={ready}>{Object.entries(roles).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:stage===1?<Select label="請求条件へ照合する費用" value={cost} onChange={setCost} ready={ready}>{Object.entries(costs).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:null}
 scene={s=><SelectionCanvas diagram="model-portfolio-updates" {...s}>{f=><>
  <Text y={35}>{['計画・実行・委譲・評価を、必要な強さへ分ける','見えている回答だけで、総費用を決めない','モデルと設定の変更を、同じ評価へ結びつける','旧新の比較から、段階的な切替と復帰を設計する'][f.stage]}</Text>
  {f.stage===0?<>
   <Tokens labels={['計画','実行','委譲','経路','評価']} y={82} selected={[Object.keys(roles).indexOf(role)]}/>
   <Box x={32} y={181} width={260} height={156} title={roles[role][0]} lines={roles[role].slice(1)} tone="violet"/>
   <Wire id={s.id} d="M292 253H340" active phase={f.phase}/><Box x={348} y={181} width={260} height={156} title="評価した分担" lines={['タスクの範囲を確認','一つへ全部を任せず','複数でも品質保証せず']} tone="teal"/>
  </>:f.stage===1?<>
   <Tokens labels={['入力','出力','思考','cache','batch']} y={82} selected={[Object.keys(costs).indexOf(cost)]}/>
   <Box x={32} y={182} width={260} height={151} title={costs[cost][0]} lines={costs[cost].slice(1)} tone="violet"/>
   <Box x={348} y={182} width={260} height={151} title="条件と時点を確認" lines={['原文は2026-08の傾向','率を全製品へ転用せず','長文の割増も照合']} tone="teal"/>
   <Text y={403} small>数値を再計算せず、費用を読む構成を示す</Text>
  </>:f.stage===2?<>
   <Box x={32} y={83} width={260} height={174} title="版・設定を記録" lines={['モデルの識別子','promptと推論の設定','可変aliasを固定とせず']} tone="violet"/>
   <Wire id={s.id} d="M292 170H340" active phase={f.phase}/><Box x={348} y={83} width={260} height={174} title="同じ評価で比較" lines={['品質・費用・遅延','データ方針と提供終了','変更点を追える状態']} tone="teal"/>
   <Text y={360} small>新しい世代へ自動的に切り替えない</Text>
  </>:<>
   {['旧新を同じ実タスクで比較','段階的に切替・観測','非劣化と戻せる条件を確認'].map((title,i)=><g key={title}><Box x={62} y={75+i*103} width={516} height={73} title={title} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${148+i*103}V${174+i*103}`} active phase={f.phase}/>}</g>)}
   <Text y={413} small>図は切替・復帰を実行しない</Text>
  </>}
 </>}</SelectionCanvas>}>{children}</SelectionFigure>
}
