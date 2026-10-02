'use client'
import {useId,useState} from 'react'
import {OpsCanvas,OpsFigure,OpsPair,OpsThree,Text,Box,Wire,Select,Tokens} from './release-response-primitives'
import {feedbackCollection,feedbackLoop} from '../../lib/release-response-model.mjs'
const collectionKeys=['trace','events','outcome','purpose','minimum','retention','access'],collectionLabels=['trace ID','UIイベント','成果との照合','目的の説明','必要範囲への限定','保持期間','アクセス制御']
export function FeedbackSignalsCollection({children}){
 const id=useId(),[kind,setKind]=useState('implicit'),[missing,setMissing]=useState('events')
 const result=feedbackCollection({kind,traceLinked:missing!=='trace',eventsRecorded:missing!=='events',outcomeCompared:missing!=='outcome',purposeExplained:missing!=='purpose',minimized:missing!=='minimum',retentionSet:missing!=='retention',accessControlled:missing!=='access'})
 return <OpsFigure diagram="feedback-signals-collection" title="フィードバックの循環と、シグナルの解釈・収集" scene={({phase})=><OpsCanvas diagram="feedback-signals-collection" phase={phase} id={id}>{({stage})=><>
 <Text x={320} y={38} center>{['収集から改善・利用者へ一周を作る','収集ボタンの先に担当と経路を置く','明示と暗黙の信号を、偏り付きで読む','代理指標を人の成果・理由と照合する','どの応答かと、必要なイベントを記録する','自由記述も行動ログも必要範囲を揃える'][stage]}</Text>
 {stage===0&&<><Tokens labels={['利用者','収集','triage','改善','利用者']} stage={1} y={87}/><Box x={97} y={183} width={446} height={155} title="評価と比較を経て品質へ戻す" lines={['ケースと対策へ分けて還流','回帰・新旧比較・実際の改善','ボタンだけでは一周が閉じない']} tone="teal"/><Wire id={id} d="M320 133V180" active phase={phase}/><Wire id={id} d="M97 260H19V68H91V84" active phase={phase}/></>}
 {stage===1&&<OpsPair left={['集まるだけ','評価ボタンを配置','理由や行動が蓄積','誰も見なければ止まる']} right={['循環の右半分','担当とトリアージ','ケースと改善の対策','評価し品質を確認']} id={id} phase={phase}/>}
 {stage===2&&<OpsPair left={['明示の信号','評価・理由・問題報告','応答と理由を尋ねる','回答者の偏りを残す']} right={['暗黙の信号','編集・再試行・放棄','採用率と人への移管','行動は意図と同じでない']} id={id} phase={phase} arrow={false}/>}
 {stage===3&&<OpsPair left={[kind==='implicit'?'行動の代理指標':'明示的な理由',kind==='implicit'?'修正距離・再質問':'応答の評価と理由','タスクごとに候補','主指標を決めつけない']} right={['妥当性を確かめる','人が確認した成果','理由との対応を点検','利用者の意図を推定しない']} id={id} phase={phase}/>}
 {stage===4&&<OpsThree columns={[["応答へ結ぶ","trace ID","当時の構成"],["イベント","編集・送信","破棄・再試行"],["負担を測る","文脈の中で","任意の理由"]]}/>}
 {stage===5&&<Box x={65} y={110} width={510} height={212} title={result.reviewCandidate?'収集設計の検討候補':'不足する収集条件へ戻る'} lines={['目的説明・必要範囲・保持・アクセス',missing==='none'?'必要な条件を照合':`${collectionLabels[collectionKeys.indexOf(missing)]}を点検`,'応答への結合と成果の妥当性','暗黙の計算にはUIイベントも必要']} tone={result.reviewCandidate?'teal':'amber'}/>}
 <Text x={320} y={409} center small>模式の条件照合は、実収集や代理指標の実検証ではない。</Text>
 </>}</OpsCanvas>} controls={({stage,ready})=>stage===3||stage===5?<><Select label="品質を考えるシグナルの系統" value={kind} onChange={setKind} ready={ready}><option value="implicit">暗黙の行動</option><option value="explicit">明示的な評価・理由</option></Select>{stage===5&&<Select label="収集で不足する条件" value={missing} onChange={setMissing} ready={ready}>{collectionKeys.map((key,i)=><option key={key} value={key}>{collectionLabels[i]}</option>)}<option value="none">必要条件を照合</option></Select>}</>:null}>{children}</OpsFigure>
}
const loopKeys=['permission','mask','regression','comparison','owner'],loopLabels=['ケースの利用許可','マスキング','回帰テスト','新旧の品質比較','運用の担当']
export function FeedbackTriageRelease({children}){
 const id=useId(),[missing,setMissing]=useState('comparison'),[observed,setObserved]=useState('unknown'),[action,setAction]=useState('search')
 const result=feedbackLoop({caseAllowed:missing!=='permission',masked:missing!=='mask',regressionChecked:missing!=='regression',comparisonChecked:missing!=='comparison',ownerAssigned:missing!=='owner',signalImproved:observed==='improved'})
 const actions={prompt:['promptの調整','指示と例を見直す','回帰と新旧比較','実際の品質へ戻す'],search:['検索の改善','取り込み・検索を点検','RAGの条件へ戻る','実際の品質へ戻す'],tool:['toolの見直し','定義・結果・挙動','契約と許可を点検','実際の品質へ戻す'],requirements:['要件と期待値','タスクと合意を再検討','ループの外も見る','未承認の変更をしない']}
 return <OpsFigure diagram="feedback-triage-release" title="失敗ケース・対策・リリースと、運用の一周" scene={({phase})=><OpsCanvas diagram="feedback-triage-release" phase={phase} id={id}>{({stage})=><>
 <Text x={320} y={38} center>{['失敗モード・頻度・影響をケースと一緒に読む','代表ケースを条件付きで評価へ還流する','原因に合わせ、ループの外も対策を比較する','条件の照合と、実際の品質改善を分ける','担当と周期を決めて循環を続ける','要求の頻度だけでなく、負担と有用性を測る'][stage]}</Text>
 {stage===0&&<OpsThree columns={[["検索の失敗","頻度を集計","影響を点検"],["規定の解釈","ケースを読む","頻度×影響"],["口調の問題","新しい型を探す","平均だけにしない"]]}/>}
 {stage===1&&<OpsPair left={['代表ケース','収集と利用の条件','機微情報をmask','失敗条件を保持']} right={['評価セットへ','回帰のケースを追加','既知を未見にしない','採用は別の未見評価']} id={id} phase={phase}/>}
 {stage===2&&<Box x={65} y={110} width={510} height={212} title={actions[action][0]} lines={actions[action].slice(1)} tone="teal"/>}
 {stage===3&&<Box x={65} y={110} width={510} height={212} title={result.closedInToy?'模式条件で一周を照合':result.reviewCandidate?'実改善の確認が残る':'不足する運用条件へ戻る'} lines={[missing==='none'?'ケース・回帰・比較・担当を照合':`${loopLabels[loopKeys.indexOf(missing)]}が不足`,observed==='improved'?'改善した模式条件を選択':'品質が改善したかは未確認','実際のシグナル改善まで確かめる','図は測定・公開を行わない']} tone={result.closedInToy?'teal':'amber'}/>}
 {stage===4&&<OpsThree columns={[["トリアージ","週次は運用例","担当を明示"],["リリース比較","変更ごとに比較","実品質を確認"],["分類と棚卸し","四半期は例","件数と重大度"]]}/>}
 {stage===5&&<OpsPair left={['要求の設計候補','N回に1回のsample','重要フローに限定','反映結果を知らせる']} right={['利用者と比較','回答率と理由の用途','負担と代表性を測る','図は通知を送らない']} id={id} phase={phase}/>}
 <Text x={320} y={409} center small>定例や収集の存在だけで一周を閉じず、実際の品質へ戻す。</Text>
 </>}</OpsCanvas>} controls={({stage,ready})=>stage===2?<Select label="改善で検討する対策" value={action} onChange={setAction} ready={ready}>{Object.entries(actions).map(([value,row])=><option key={value} value={value}>{row[0]}</option>)}</Select>:stage===3?<><Select label="改善の一周で不足する条件" value={missing} onChange={setMissing} ready={ready}>{loopKeys.map((key,i)=><option key={key} value={key}>{loopLabels[i]}</option>)}<option value="none">必要条件を照合</option></Select><Select label="品質改善の模式確認" value={observed} onChange={setObserved} ready={ready}><option value="unknown">改善は未確認</option><option value="improved">改善した模式条件</option></Select></>:null}>{children}</OpsFigure>
}
