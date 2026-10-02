'use client'
import {useId,useState} from 'react'
import {QualityCanvas,QualityFigure,QualityPair,QualityThree,Text,Box,Wire,Select,Tokens} from './quality-trace-primitives'
import {traceScope,toyTraceTail,traceDataGate} from '../../lib/quality-trace-model.mjs'
const spans={common:['共通する項目','開始・終了時刻とステータス','親スパンへの参照','全階層の関連を読む'],task:['タスク実行の項目','入力タスクと最終結果','総ステップ・token・費用','prompt・モデル・tool定義の版'],llm:['LLM呼出しの項目','モデルID・入力と出力','入出力token・停止理由','呼出しのレイテンシ'],tool:['tool実行の項目','tool名・引数','結果またはエラー','実行のレイテンシ']}
export function TraceHierarchyVersions({children}){
 const id=useId(),[span,setSpan]=useState('task'),scope=traceScope(span)
 return <QualityFigure diagram="trace-hierarchy-versions" title="静かな失敗と、実行階層・バージョンの記録" scene={({phase})=><QualityCanvas diagram="trace-hierarchy-versions" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['例外がなくても、誤答は返り得る','一つの応答の裏の、実行階層をつなぐ','各スパンで、記録すべき項目を分ける','生成した応答を、使った版と関連付ける','共通の記録から、失敗を評価へ戻す'][stage]}</Text>
  {stage===0?<QualityPair id={id} phase={phase} arrow={false} left={['技術的に完走','例外・エラーはなし','最終応答は返った','正しい答えとは限らず']} right={['調査と品質の信号','prompt・モデル・入力','LLMとtoolの中間段階','正解は別に点検']}/>:stage===1?<>
   <Box x={196} y={72} width={248} height={75} title="セッション" lines={['会話・ジョブの全体']} tone="violet"/><Wire id={id} d="M320 147V172" active phase={phase}/><Box x={196} y={177} width={248} height={75} title="タスク実行" lines={['Agentループ1回']} tone="teal"/>
   {[0,1,2].map(i=><Wire key={i} id={id} d={`M320 252V276H${120+i*200}V299`} active phase={phase}/>)}
   {[["LLM 1","入力 → 出力"],["tool 2","引数 → 結果"],["LLM 3","履歴 → 出力"]].map((row,i)=><Box key={row[0]} x={32+i*200} y={304} width={176} height={95} title={row[0]} lines={row.slice(1)} tone={i===1?'teal':'violet'}/>)}
  </>:stage===2?<><Tokens labels={['共通','タスク','LLM','tool']} selected={[Object.keys(spans).indexOf(span)]} y={86}/><Box x={64} y={178} width={512} height={204} title={spans[span][0]} lines={spans[span].slice(1)} tone="violet" data-trace-span={span} data-trace-fields={scope.fields.join(',')} data-trace-collected="false" data-trace-quality-verified="false"/></>:stage===3?<QualityPair id={id} phase={phase} left={['使用した版','promptの版','モデルIDと構成','tool定義の版']} right={['生成した応答へ結ぶ','何を使った応答か','調査の起点を残す','版だけで原因確定せず']}/>:<QualityPair id={id} phase={phase} left={['本番と共通のトレース','中間ステップと結果','入力と必要な初期状態','失敗の条件を整理']} right={['評価ケースへ変換','再現と採点条件','修正を回帰へ残す','保存だけを合格にせず']}/>}
 </>}</QualityCanvas>} controls={({stage,ready})=>stage===2?<Select label="確認するトレースのスパン" value={span} onChange={setSpan} ready={ready}>{Object.entries(spans).map(([value,row])=><option key={value} value={value}>{row[0]}</option>)}</Select>:null}>{children}</QualityFigure>
}
export function TraceSignalsDataResponse({children}){
 const id=useId(),[distribution,setDistribution]=useState('tail'),[missing,setMissing]=useState('access'),samples=distribution==='tail'?[1,1,1,13]:[4,4,4,4],tail=toyTraceTail(samples),data=traceDataGate({maskDesigned:missing!=='mask',retentionDesigned:missing!=='retention',accessDesigned:missing!=='access',locationAllowed:missing!=='location'})
 return <QualityFigure diagram="trace-signals-data-response" title="技術と品質の信号、分布の裾と全文の扱い" scene={({phase})=><QualityCanvas diagram="trace-signals-data-response" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['技術的な異常と、品質の傾向を併せて追う','同じ平均でも、長く迷走する裾を読む','全文の保存には、別々の条件を設計する','既存監視と保存先、評価との接続から選ぶ','アラートごとに、発火後の対応を決める','検知から、調査・修正・回帰へ進める'][stage]}</Text>
  {stage===0?<QualityPair id={id} phase={phase} arrow={false} left={['技術メトリクス','エラー・時間・費用','token・ステップの分布','静かな失敗は別に検知']} right={['品質シグナル','評価ボタン・言い直し','人への移管・タスク放棄','遅れとjudge検証を保持']}/>:stage===1?<>
   <Text y={87}>{`模式4件: 平均${tail.mean}、最大${tail.max}ステップ`}</Text>
   <path d="M60 323H580" className="aw-wire-muted"/>
   <path d={`M60 ${323-4*14}H580`} className="aw-wire-muted" strokeDasharray="6 6"/>
   {samples.map((count,i)=><g key={i}><rect x={96+i*130} y={323-count*14} width={64} height={count*14} rx={6} className={count>4?'qt-bar-amber':'qt-bar-teal'}/><Text x={128+i*130} y={309-count*14}>{count}</Text><Text x={128+i*130} y={359} small>{`タスク${i+1}`}</Text></g>)}
   <Text y={404} small>平均は同じ4。4件の最大を本番p95や原因の確定にしない。</Text>
   <g data-trace-tail-mean={tail.mean} data-trace-tail-max={tail.max} data-trace-percentile-measured="false" data-trace-cause-determined="false"/>
  </>:stage===2?<Box x={64} y={102} width={512} height={219} title={data.designCandidate?'保存する設計を検討する候補':'全文の扱いで不足する設計が残る'} lines={['記録前のマスク・保持期間','全文と集計の閲覧権限・保存先','マスクだけで外部送信の許可にせず','図は保存・転送を実行しない']} tone={data.designCandidate?'teal':'amber'} data-trace-data-candidate={String(data.designCandidate)} data-trace-data-stored="false" data-trace-external-sent="false" data-trace-leakage-prevented="false"/>:stage===3?<QualityThree columns={[['汎用スタック','既存監視と統合','GenAI採用版を確認','全文の保存先'],['LLM特化基盤','評価の接続を読む','SaaSへ出せる条件','機能の最新確認'],['自前の実装','必要な形式を設計','保守する範囲','評価と共通形式']]}/>:stage===4?<QualityPair id={id} phase={phase} left={['発火する条件','コスト・エラーの率','ステップ数の分布','品質シグナルの変化']} right={['発火後の手順','担当と初動を決める','インシデント対応へ','検知だけで復旧にせず']}/>:<QualityThree columns={[['検知と調査','技術＋品質の変化','版と経路を読む','原因を実際に確認'],['再現と修正','入力と状態を保存','共通の評価ケース','修正を回帰で確認'],['監視へ戻す','対応の結果を確認','継続して信号を追う','再発とずれを点検']]}/>}
 </>}</QualityCanvas>} controls={({stage,ready})=>stage===1?<Select label="ステップ数の模式分布" value={distribution} onChange={setDistribution} ready={ready}><option value="tail">一部のタスクの裾が長い</option><option value="equal">4件とも同じステップ数</option></Select>:stage===2?<Select label="トレース全文で不足する設計" value={missing} onChange={setMissing} ready={ready}><option value="mask">記録前のマスキング</option><option value="retention">保持期間</option><option value="access">アクセス制御</option><option value="location">保存先の許可</option><option value="none">必要条件を照合</option></Select>:null}>{children}</QualityFigure>
}
