'use client'
import {useId,useState} from 'react'
import {LifecycleCanvas,LifecycleFigure,LifecyclePair,LifecycleThree,Text,Box,Select,Tokens} from './deployment-lifecycle-primitives'
import {successionPlan,retirementCoverage} from '../../lib/deployment-lifecycle-model.mjs'
const kinds={memory:['記憶と文脈','肥大・汚染・無効な知識','決定と確立した知識を残す','raw履歴を積み続けない'],rules:['ルールと構成','累積した制約・矛盾','資産の版と矛盾を点検','modelの重みの劣化と分ける'],environment:['環境と接続先','API・tool・業務の変化','変更イベントで点検','急な変化も検出する'],quality:['品質の変化','成功率・人への移管','SLIと入力群を観測','周期の実測を捏造しない']}
export function ResidentMaintenanceSignals({children}){
 const id=useId(),[kind,setKind]=useState('memory')
 return <LifecycleFigure diagram="resident-maintenance-signals" title="常駐個体の変化と、保守の入口・戻り先" scene={({phase})=><LifecycleCanvas diagram="resident-maintenance-signals" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['個体はprocessと構成・外部記憶・taskの組','変化の種類を分け、対応する観測へ結ぶ','緩やかな傾向と急変を、両方の兆候で読む','定期の時刻と、変更イベントから点検する','必要な決定を残し、外部状態から再構成する'][stage]}</Text>
 {stage===0&&<><Tokens labels={['process','構成','外部記憶','task']} y={90}/><LifecyclePair left={['一つのtaskを続ける','durabilityとcheckpoint','同じtaskの再開点','他の正本と分担する']} right={['個体のlifecycle','週・月の保守と交代','起動から退役まで設計','重みの自然劣化ではない']} id={id} phase={phase} y={185} arrow={false}/></>}
 {stage===1&&<><Tokens labels={['記憶','ルール','環境','品質']} selected={[Object.keys(kinds).indexOf(kind)]} y={90}/><Box x={65} y={185} width={510} height={175} title={kinds[kind][0]} lines={kinds[kind].slice(1)} tone="violet"/></>}
 {stage===2&&<LifecyclePair left={['傾向を観測する','SLIの変化と失敗の分類','入力群と個体を分ける','実測して原因を点検']} right={['変更イベントを読む','API・toolの変更','記憶の汚染も急変する','一回で全体を決めない']} id={id} phase={phase} arrow={false}/>}
 {stage===3&&<><LifecyclePair left={['定期の保守','決めた周期で点検','時刻だけで合格しない','無効記憶・ルールの矛盾']} right={['イベント起点','失敗や環境の変化','必要な点検を開始','実影響とSLIを確認']} id={id} phase={phase} arrow={false}/><Text y={348}>二つの入口から、同じ保守と健康確認へ</Text></>}
 {stage===4&&<><Tokens labels={['決定','計画','成果物','再構成','品質確認']} selected={[3]} y={90}/><LifecycleThree y={186} columns={[["残す情報","決定と知識","外部の計画"],["減らす情報","raw履歴","無効な記憶"],["確かめる結果","品質と成功率","人への移管"]]}/></>}
 <Text y={412} small>図は劣化率や保守周期の実測を示さない。観測から判断へ戻る。</Text>
 </>}</LifecycleCanvas>} controls={({stage,ready})=>stage===1?<Select label="観測する個体の変化" value={kind} onChange={setKind} ready={ready}>{Object.entries(kinds).map(([v,t])=><option key={v} value={v}>{t[0]}</option>)}</Select>:null}>{children}</LifecycleFigure>
}
export function ResidentSuccessionRetirement({children}){
 const id=useId(),[missing,setMissing]=useState('effects'),[retire,setRetire]=useState('state'),succession=successionPlan({noShadowEffects:missing!=='effects',exclusiveRight:missing!=='right',processedRecords:missing!=='records',businessKey:missing!=='key'}),retirement=retirementCoverage({disabled:retire!=='disabled',accessRecovered:retire!=='access',stateHandled:retire!=='state'})
 return <LifecycleFigure diagram="resident-succession-retirement" title="引継ぎの選別と、作用を重複させない交代・退役" scene={({phase})=><LifecycleCanvas diagram="resident-succession-retirement" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['保守で回復しないとき、新しい個体へ進む','残す情報と、持ち込まない汚染を分ける','replayとshadowの比較では、外部作用を止める','実行権を一つにし、処理済みを引き継ぐ','停止だけでなく、権限と保存状態を回収する','無期限の継続や二重実行を、設計へ戻す'][stage]}</Text>
 {stage===0&&<><Tokens labels={['観測','保守','回復確認','交代候補']} selected={[3]} y={90}/><LifecyclePair left={['保守で戻らない','SLIと失敗で判断','外部状態を日常から保持','旧個体の記憶に頼らない']} right={['新個体を準備','計画と成果物を参照','評価してから切り替える','図は実個体を生成しない']} id={id} phase={phase} y={182}/></>}
 {stage===1&&<LifecyclePair left={['引き継ぐもの','重要な決定','確立した知識','未完taskと成果物参照']} right={['持ち込まないもの','汚染された履歴','無効になった設定','保持と権限も別に点検']} id={id} phase={phase} arrow={false}/>}
 {stage===2||stage===3?<><LifecyclePair left={['比較と再現','記録入力をreplay','shadowは副作用を停止','記憶と構成のsnapshot']} right={[succession.reviewCandidate?'交代設計の検討候補':'不足する条件へ戻る','排他的な実行権','処理済み記録と業務キー','図は実切替しない']} id={id} phase={phase}/><Text y={348}>新旧の同時注文・送信・更新を、比較に含めない</Text></>:null}
 {stage===4&&<LifecyclePair left={['退役の三つの条件','個体の実行を止める','権限と資源を回収','保存状態を保持／安全破棄']} right={[retirement.reviewCandidate?'退役設計の検討候補':'終了処理を点検','SLIの基準は起動前に決める','停止は全削除の証拠でない','図は実削除しない']} id={id} phase={phase}/>}
 {stage===5&&<LifecycleThree columns={[["無期限の稼働","SLIと終了基準","費用・権限も"],["全履歴のコピー","知識を選別","汚染を持たない"],["副作用付き並走","比較から分ける","実行権は一つ"]]}/>}
 <Text y={412} small>同じpromptとmodelにも個体差。図は実品質・安全を保証しない。</Text>
 </>}</LifecycleCanvas>} controls={({stage,ready})=>stage===2||stage===3?<Select label="交代設計で不足する条件" value={missing} onChange={setMissing} ready={ready}>{Object.entries({effects:'shadowの副作用を停止していない',right:'排他的な実行権が未確認',records:'処理済み記録が未確認',key:'業務キーが未確認',none:'四条件を照合'}).map(([v,t])=><option key={v} value={v}>{t}</option>)}</Select>:stage===4?<Select label="退役設計で不足する条件" value={retire} onChange={setRetire} ready={ready}><option value="disabled">実行停止が未確認</option><option value="access">権限回収が未確認</option><option value="state">保存状態の処理が未確認</option><option value="none">三条件を照合</option></Select>:null}>{children}</LifecycleFigure>
}
