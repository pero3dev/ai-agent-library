'use client'
import {useId,useState} from 'react'
import {DataCanvas,DataFigure,DataPair,DataThree,Text,Box,Select,Tokens} from './data-resilience-primitives'
import {chaosPlan,chaosOutcome} from '../../lib/data-resilience-model.mjs'
const targets={provider:['providerの障害','429・timeout・遅延','外部依存の縮退','正常系だけでは分からない'],model:['出力の変化','品質劣化・拒否','形式崩れ・空応答','モデル自体の異常'],tool:['toolの障害','エラーやtimeout','権限・部分失敗','作用は別に制御'],source:['知識源の異常','空の検索・古い資料','欠損した回答根拠','鮮度と出典を点検']}
export function ChaosHypothesisTargets({children}){
 const id=useId(),[target,setTarget]=useState('provider'),[missing,setMissing]=useState('criteria'),[observed,setObserved]=useState('unobserved')
 const plan=chaosPlan({environment:'evaluation',hypothesisKnown:missing!=='hypothesis',steadyDefined:missing!=='steady',criteriaDefined:missing!=='criteria',smallScope:missing!=='scope',sideEffectsAbsent:true,realDependencyNeeded:false}),outcome=chaosOutcome({observed:observed!=='unobserved',fallbackActivated:observed!=='no-fallback',withinCriteria:observed==='both'})
 return <DataFigure diagram="chaos-hypothesis-targets" title="守る仮説を先に置き、発動と指標を両方読む演習" scene={({phase})=><DataCanvas diagram="chaos-hypothesis-targets" phase={phase} id={id}>{({stage})=><>
 <Text x={320} y={38} center>{['備えと検証演習・攻撃・対応を分担する','四つの対象から、異常を一つ選ぶ','Xが落ちてもYを守る仮説を先に置く','定常指標と成否・限定範囲を注入前に定める','発動だけを、成否の合格にしない'][stage]}</Text>
 {stage===0&&<DataThree columns={[["備えの設計","retryと代替","設計を用意"],["検証の演習","故障とSLI","備えを観測"],["別の正本","攻撃・環境","事故の対応"]]}/>}
 {stage===1&&<><Tokens labels={['provider','出力','tool','知識源']} stage={Object.keys(targets).indexOf(target)} y={90}/><Box x={65} y={190} width={510} height={164} title={targets[target][0]} lines={targets[target].slice(1)} tone="amber"/></>}
 {stage===2&&<DataPair left={['故障の仮定 X','特定providerが停止','一つの異常を限定','同時に複数を壊さない']} right={['守る品質 Y','fallbackが発動する','先に定めたSLIを保つ','例の閾値は設計例']} id={id} phase={phase}/>}
 {stage===3&&<DataPair left={['注入前の準備','守る仮説と定常SLI','成否基準と小さい範囲','副作用を避ける設計']} right={[plan.reviewCandidate?'計画の検討候補':'不足する準備へ戻る','条件と許可は別','図は実注入しない','実観測はまだ別']} id={id} phase={phase}/>}
 {stage===4&&<DataPair left={['二つの観測','fallbackの実発動','SLIが事前基準を保つ','どちらも点検する']} right={[outcome.supportedInToy?'模式条件で仮説を支持':outcome.weaknessInToy?'模式条件で弱点を発見':'未観測なので成否は未定','発動のみでは合格でない','実回復力の測定は別','全障害の保証にしない']} id={id} phase={phase}/>}
 <Text x={320} y={409} center small>模式条件は実障害の注入・実観測・全用途のSLOではない。</Text>
 </>}</DataCanvas>} controls={({stage,ready})=>stage===1?<Select label="模式の障害対象" value={target} onChange={setTarget} ready={ready}>{Object.entries(targets).map(([value,row])=><option key={value} value={value}>{row[0]}</option>)}</Select>:stage===3?<Select label="注入前に不足する準備" value={missing} onChange={setMissing} ready={ready}>{Object.entries({hypothesis:'守る仮説',steady:'定常時のSLI',criteria:'事前の成否基準',scope:'一障害・小さい範囲',none:'必要条件を照合'}).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select>:stage===4?<Select label="模式の演習観測" value={observed} onChange={setObserved} ready={ready}><option value="unobserved">まだ観測していない</option><option value="no-fallback">fallbackが発動しない</option><option value="only-fallback">発動したが指標は基準外</option><option value="both">発動と指標が両方条件内</option></Select>:null}>{children}</DataFigure>
}
export function ChaosEnvironmentLearning({children}){
 const id=useId(),[environment,setEnvironment]=useState('production'),[missing,setMissing]=useState('dependency')
 const plan=chaosPlan({environment,hypothesisKnown:true,steadyDefined:true,criteriaDefined:true,smallScope:missing!=='scope',sideEffectsAbsent:missing!=='effects',realDependencyNeeded:missing!=='dependency'})
 return <DataFigure diagram="chaos-environment-learning" title="評価環境から限定した実依存へ進み、弱点を回帰へ戻す" scene={({phase})=><DataCanvas diagram="chaos-environment-learning" phase={phase} id={id}>{({stage})=><>
 <Text x={320} y={38} center>{['必要な忠実度を、評価環境から上げる','本番は再現できない実依存を小さく限定する','人も含めて、手順どおりの縮退と復旧を試す','成熟した自動化と、変更後の実発動検査を分ける','見つけた弱点を、備えの設計と対応手順へ戻す','再現ケースと評価環境を、継続検査へ戻す'][stage]}</Text>
 {stage===0&&<><Tokens labels={['評価','staging','限定本番']} stage={0} y={90}/><DataThree y={184} columns={[["評価環境","mock・sandbox","細部を再現"],["staging","本番に近い条件","同じ負荷分布"],["限定した本番","実依存のみ","小範囲・無作用"]]}/></>}
 {stage===1&&<DataPair left={[environment==='production'?'本番の限定条件':environment==='staging'?'stagingの計画':'評価環境の計画','仮説とSLI・基準は先','小範囲・副作用なし',environment==='production'?'評価では再現できない':'まず再現可能な範囲']} right={[plan.reviewCandidate?'計画の検討候補':'不足する条件へ戻る','本番の作用toolを避ける','条件照合は許可でない','図は実注入しない']} id={id} phase={phase}/>}
 {stage===2&&<DataThree columns={[["game day","定期に計画","人も参加する"],["縮退と復旧","手順で進める","実発動を確認"],["手順の発見","曖昧な復旧","担当と経路"]]}/>}
 {stage===3&&<DataPair left={['成熟した自動化','CIや本番の限定注入','対象と頻度を管理','準備が進んだ後に']} right={['備えの変更後','fallback・retry変更','実際の発動を試す','設定だけを証拠にしない']} id={id} phase={phase} arrow={false}/>}
 {stage===4&&<DataPair left={['見つけた弱点','fallback未発動','復旧手順が不明','原因と条件を読む']} right={['設計・手順を更新','retryと代替の設計','incidentのrunbook','報告だけで閉じない']} id={id} phase={phase}/>}
 {stage===5&&<DataPair left={['障害の再現','入力と状況を保つ','評価ケースを作る','必要な環境を用意']} right={['継続して検査','回帰へ加える','備え変更後も試す','永久防止の保証でない']} id={id} phase={phase}/>}
 <Text x={320} y={409} center small>図は注入・自動化・ケース保存を行わず、永続的な回復力を保証しない。</Text>
 </>}</DataCanvas>} controls={({stage,ready})=>stage===1?<><Select label="模式の演習環境" value={environment} onChange={setEnvironment} ready={ready}><option value="evaluation">評価環境</option><option value="staging">staging</option><option value="production">限定した本番</option></Select><Select label="演習環境で不足する条件" value={missing} onChange={setMissing} ready={ready}><option value="dependency">評価では再現できない実依存</option><option value="scope">小さい影響範囲</option><option value="effects">副作用のない対象</option><option value="none">必要条件を照合</option></Select></>:null}>{children}</DataFigure>
}
