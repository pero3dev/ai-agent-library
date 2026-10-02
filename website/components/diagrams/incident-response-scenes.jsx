'use client'
import {useId,useState} from 'react'
import {OpsCanvas,OpsFigure,OpsPair,OpsThree,Text,Box,Wire,Select,Tokens} from './release-response-primitives'
import {containmentChoice,recoveryChoice} from '../../lib/release-response-model.mjs'
const signals={technical:['技術の信号','error率とtimeout','外部依存やtoolの障害','原因は別に調べる'],steps:['回数の分布','平均だけでなく裾','右への偏りを点検','迷走・暴走の候補'],cost:['費用の速さ','単位時間のtoken','急増を早期に点検','実請求とは分ける'],quality:['品質の信号','評価と移管・報告','正常終了でも誤答','遅行する指標を読む'],tool:['toolの変化','呼出し頻度と失敗','依存先やpromptを点検','原因は別に調べる']}
const scopes={auto:['自動遮断','三層予算とrate','人が気づく前の初動','既費用は残る'],write:['書込toolを外す','危険なtoolを無効','読取の機能は維持','既書込は残る'],readOnly:['自律度を下げる','読取だけへ縮退','承認・人の経路も候補','既作用は残る'],tenant:['特定範囲を止める','テナントや機能','影響範囲を限定','他の利用を維持'],all:['Agentを全停止','被害進行・原因不明','定型応答や窓口へ','既作用は残る']}
export function IncidentDetectionContainment({children}){
 const id=useId(),[signal,setSignal]=useState('quality'),[scope,setScope]=useState('write'),[readiness,setReadiness]=useState('untested')
 const result=containmentChoice({scope,prepared:readiness!=='absent',exercised:readiness==='tested'})
 return <OpsFigure diagram="incident-detection-containment" title="静かな失敗の信号と、封じ込めの粒度" scene={({phase})=><OpsCanvas diagram="incident-detection-containment" phase={phase} id={id}>{({stage})=><>
 <Text x={320} y={38} center>{['五つの型と、残る副作用を読む','封じ込めから影響特定・補償へ進む','技術・裾・費用・品質・toolの信号を読む','遅行する品質と報告を検知へ戻す','フラグの存在と、準備した演習を区別する','止める範囲と、残す機能を選ぶ'][stage]}</Text>
 {stage===0&&<><Tokens labels={['暴走','費用','品質','危険作用','依存障害']} stage={2} y={90}/><OpsPair left={['技術的に失敗','error・timeout','依存先の障害','速い暴走を検知']} right={['正常終了でも誤り','誤答と危険な作用','品質信号は遅行','作用は蓄積する']} id={id} phase={phase} y={184} arrow={false}/></>}
 {stage===1&&<><Tokens labels={['検知','封込','特定','補償','防止']} stage={1} y={90}/><Box x={65} y={189} width={510} height={156} title="封じ込めと補償は別の段階" lines={['以後の被害拡大を抑える','既に起きた作用は残る','影響特定と補償を続ける']} tone="amber"/></>}
 {stage===2&&<><Tokens labels={['技術','回数裾','費用','品質','tool']} stage={Object.keys(signals).indexOf(signal)} y={90}/><Box x={65} y={190} width={510} height={154} title={signals[signal][0]} lines={signals[signal].slice(1)} tone="teal"/></>}
 {stage===3&&<OpsPair left={['遅行する品質','誤答はerrorなし','採点や移管の変化','利用者からの報告']} right={['検知へ集約','報告を分類・triage','低頻度の重大作用','個別対応だけで閉じない']} id={id} phase={phase}/>}
 {stage===4&&<Box x={65} y={110} width={510} height={212} title={result.reviewCandidate?'封じ込め設計の検討候補':'準備または演習へ戻る'} lines={['デプロイなしの発動手段','粒度ごとのフラグ・設定','平時に実発動を演習','図は停止や演習を行わない']} tone={result.reviewCandidate?'teal':'amber'}/>}
 {stage===5&&<OpsPair left={scopes[scope]} right={[result.readMaintained?'読取を残す設計':'影響範囲と代替',result.reviewCandidate?'準備と演習条件を照合':'実装と演習を点検','図は実停止を行わない','既作用の補償は別']} id={id} phase={phase} arrow={false}/>}
 <Text x={320} y={409} center small>信号は調査の入口。模式条件を原因の確定や実停止にしない。</Text>
 </>}</OpsCanvas>} controls={({stage,ready})=>stage===2?<Select label="検知で読む信号" value={signal} onChange={setSignal} ready={ready}>{Object.entries(signals).map(([value,row])=><option key={value} value={value}>{row[0]}</option>)}</Select>:stage===4||stage===5?<><Select label="封じ込めの模式範囲" value={scope} onChange={setScope} ready={ready}>{Object.entries(scopes).map(([value,row])=><option key={value} value={value}>{row[0]}</option>)}</Select><Select label="停止手段の準備条件" value={readiness} onChange={setReadiness} ready={ready}><option value="absent">手段が未実装</option><option value="untested">手段はあるが演習未実施</option><option value="tested">準備・演習条件を照合</option></Select></>:null}>{children}</OpsFigure>
}
export function IncidentEffectsLearning({children}){
 const id=useId(),[effect,setEffect]=useState('sent'),[missing,setMissing]=useState('logs'),[delay,setDelay]=useState('contain')
 const result=recoveryChoice({effect,identified:missing!=='scope',logged:missing!=='logs',authorized:missing!=='permission'})
 const improvements={detect:['検知の遅れ','監視とアラート','品質・分布・報告','回帰ケースへ戻す'],contain:['封じ込めの遅れ','キルスイッチ粒度','書込・縮退・範囲','平時に演習する'],recover:['復旧の重さ','対象と操作のログ','巻戻しと訂正の手段','承認ゲートを点検']}
 return <OpsFigure diagram="incident-effects-learning" title="作用の洗い出し・補償と、平時へ戻す改善" scene={({phase})=><OpsCanvas diagram="incident-effects-learning" phase={phase} id={id}>{({stage})=><>
 <Text x={320} y={38} center>{['構成とtoolから影響候補を抽出する','旧構成へ戻しても、既に起きた作用は残る','巻戻せる作用と送信済みを区別する','失敗した入力・状況を評価の資産へ戻す','対応のどこが遅れたかから改善対象を選ぶ','振り返り・runbook・平時の演習へ戻す'][stage]}</Text>
 {stage===0&&<OpsThree columns={[["構成版","promptとmodel","当時の版を特定"],["tool呼出し","問題のtool","対象session"],["操作の記録","いつ・何を","どのrecord"]]}/>}
 {stage===1&&<OpsPair left={['構成の切替','以後は旧構成へ','新たな被害を抑える','既作用は取り消さない']} right={['作用の洗い出し','書込・送信・更新','対象と内容と時刻','補償へつなぐ']} id={id} phase={phase}/>}
 {stage===2&&<OpsPair left={[effect==='sent'?'送信済み通知':'記録の書込',effect==='sent'?'送信は取消せない':'巻戻し条件を点検','対象と操作ログ','利用条件と承認']} right={[result.reviewCandidate?'補償の検討候補':'不足する確認へ戻る',result.reversible?'巻戻し・訂正を検討':'訂正の連絡を検討','図は実行しない','不可逆は事前承認']} id={id} phase={phase}/>}
 {stage===3&&<><Box x={60} y={90} width={520} height={110} title="問題の入力と状況" lines={['失敗モードと必要な条件を保つ','実ケースの保存は図では行わない']} tone="amber"/><Wire id={id} d="M320 200V238" active phase={phase}/><Box x={60} y={240} width={520} height={110} title="回帰ケースとガード" lines={['同じ失敗を検知できるようにする','永久に防止する保証ではない']} tone="teal"/></>}
 {stage===4&&<Box x={65} y={110} width={510} height={208} title={improvements[delay][0]} lines={improvements[delay].slice(1)} tone="teal"/>}
 {stage===5&&<OpsThree columns={[["振り返り","対応の遅れ","各段階を改善"],["runbook","手順を更新","担当と経路"],["平時の演習","停止手段を試す","実発動を確認"]]}/>}
 <Text x={320} y={409} center small>封じ込め・復旧だけで閉じず、学びを次の対応へ戻す。</Text>
 </>}</OpsCanvas>} controls={({stage,ready})=>stage===2?<><Select label="補償を考える模式作用" value={effect} onChange={setEffect} ready={ready}><option value="sent">外部へ送信済み通知</option><option value="write">記録への書込</option></Select><Select label="補償で不足する確認" value={missing} onChange={setMissing} ready={ready}><option value="scope">影響対象の特定</option><option value="logs">対象・内容・時刻のログ</option><option value="permission">補償の利用条件と承認</option><option value="none">必要条件を照合</option></Select></>:stage===4?<Select label="改善する対応の遅れ" value={delay} onChange={setDelay} ready={ready}>{Object.entries(improvements).map(([value,row])=><option key={value} value={value}>{row[0]}</option>)}</Select>:null}>{children}</OpsFigure>
}
