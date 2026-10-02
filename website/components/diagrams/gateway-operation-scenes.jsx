'use client'
import {useId,useState} from 'react'
import {ReuseCanvas,ReuseFigure,ReusePair,ReuseThree,Text,Box,Select,Tokens} from './gateway-reuse-primitives'
import {gatewayControl,gatewayAvailability} from '../../lib/gateway-reuse-model.mjs'
const topologies={custom:['薄い自作','小規模・単純な要件','追加機能で重くなる','薄いまま済むか点検'],oss:['自社ホストのOSS','統制とデータ経路を持つ','coreと商用機能を分ける','自分で運用する'],managed:['managed','運用をproviderへ任せる','データはベンダー経由','閉域・主権を点検']}
export function GatewayCrossroadsTopology({children}){
 const id=useId(),[topology,setTopology]=useState('oss')
 return <ReuseFigure diagram="gateway-crossroads-topology" title="アプリの共通入口と、構成・運用の責任" scene={({phase})=><ReuseCanvas diagram="gateway-crossroads-topology" phase={phase} id={id}>{({stage})=><>
 <Text x={320} y={38} center>{['アプリから共通層を経由し、providerへ進む','重複した五つの機能を、共通層へ集める','providerのキーと、アプリの仮想キーを分ける','構成の名前と、統制・経路・保守の条件を比べる','集めた機能は、共通層の運用責任になる'][stage]}</Text>
 {stage===0&&<><Tokens labels={['アプリ','共通層','provider']} stage={1} y={90}/><ReusePair left={['共通の交差点','複数app・model・team','実装点を一か所へ','原則は別の正本']} right={['利用するprovider','APIと自ホスト','モデルの条件を照合','図は実APIを呼ばない']} id={id} phase={phase} y={184}/></>}
 {stage===1&&<><Tokens labels={['キー','抽象化','集計','監査','上限']} stage={1} y={90}/><ReuseThree y={184} columns={[["認証と統制","キーと権限","rateと予算"],["利用の経路","モデル抽象化","用途で選ぶ"],["利用の記録","誰が何を使用","集計と監査"]]}/></>}
 {stage===2&&<ReusePair left={['providerのキー','共通層が保持する','失効とrotationを集約','図はキーを保存しない']} right={['アプリの仮想キー','tenant・appの単位','権限・上限を結ぶ','図はキーを発行しない']} id={id} phase={phase} arrow={false}/>}
 {stage===3&&<><Tokens labels={['自作','OSS','managed']} stage={Object.keys(topologies).indexOf(topology)} y={90}/><Box x={65} y={185} width={510} height={174} title={topologies[topology][0]} lines={topologies[topology].slice(1)} tone="teal"/></>}
 {stage===4&&<ReusePair left={['集約で減る重複','appの個別実装を減らす','共通の集計と統制','業務ロジックへ集中']} right={['共通層の運用','冗長化と可観測性','更新とスケール','運用ゼロとは違う']} id={id} phase={phase} arrow={false}/>}
 <Text x={320} y={409} center small>代表製品は原文の確認時点。構成の比較を実採用にしない。</Text>
 </>}</ReuseCanvas>} controls={({stage,ready})=>stage===3?<Select label="比較する模式の構成" value={topology} onChange={setTopology} ready={ready}>{Object.entries(topologies).map(([value,row])=><option key={value} value={value}>{row[0]}</option>)}</Select>:null}>{children}</ReuseFigure>
}
export function GatewayRoutingBoundaries({children}){
 const id=useId(),[missing,setMissing]=useState('quota'),[redundancy,setRedundancy]=useState('provider')
 const control=gatewayControl({tenantKnown:missing!=='tenant',keyScoped:missing!=='scope',quotaSet:missing!=='quota',budgetSet:missing!=='budget',auditSet:missing!=='audit'}),availability=gatewayAvailability({gatewayRedundant:redundancy==='gateway'||redundancy==='both',providerRedundant:redundancy==='provider'||redundancy==='both'})
 return <ReuseFigure diagram="gateway-routing-boundaries" title="用途の振り分けと、分離・共通故障・固有機能の境界" scene={({phase})=><ReuseCanvas diagram="gateway-routing-boundaries" phase={phase} id={id}>{({stage})=><>
 <Text x={320} y={38} center>{['用途のtierと、自ホストも同じ入口へ結ぶ','信頼性の実装を、共通層へ集約する','名前だけでなく、実制御の単位を設計する','providerの冗長化だけでは、入口の故障を防げない','統一したAPIと、固有機能への経路を両立する','製品世代と、core・有償機能の許諾を分ける'][stage]}</Text>
 {stage===0&&<ReuseThree columns={[["用途の条件","容易／難しい","tierを選ぶ"],["共通の入口","抽象の粒度","分岐を減らす"],["実行する先","API／自ホスト","互換の範囲"]]}/>}
 {stage===1&&<ReuseThree columns={[["fallback","別providerへ","条件を点検"],["retry","一時失敗だけ","上限を持つ"],["breaker","失敗先を遮断","回復を点検"]]}/>}
 {stage===2&&<ReusePair left={['仮想キーに結ぶ','tenantと権限scope','rate・クォータ・予算','tenantごとに集計']} right={[control.reviewCandidate?'制御設計の検討候補':'不足する制御へ戻る','キー名は分離証拠でない','実制御を別に検証','図は実利用を許可しない']} id={id} phase={phase}/>}
 {stage===3&&<><ReusePair left={['共通の入口',availability.gatewaySinglePoint?'共通層は単一障害点':'入口の冗長設計を点検','共通で落ちる範囲','図は実稼働を測らない']} right={['背後のprovider',availability.providerSinglePoint?'providerの代替も点検':'providerの冗長設計','両方の故障を分ける','実可用性の証拠は別']} id={id} phase={phase} arrow={false}/><Text x={320} y={348} center>共通化した場所を、共通の故障範囲として読む</Text></>}
 {stage===4&&<ReusePair left={['抽象化の範囲','共通のAPIで呼ぶ','appの分岐を減らす','全機能互換とは違う']} right={['固有機能の経路','思考制御・出力の作法','必要な機能を残す','監視・更新・容量も運用']} id={id} phase={phase} arrow={false}/>}
 {stage===5&&<ReuseThree columns={[["製品の世代","2.xと旧plugin","原文の確認日"],["coreの許諾","製品全体でない","必要機能を照合"],["機能のtier","Free／OSS境界","未確定は保留"]]}/>}
 <Text x={320} y={409} center small>図はルーティング・再送・失効や、製品の許諾判断を実行しない。</Text>
 </>}</ReuseCanvas>} controls={({stage,ready})=>stage===2?<Select label="共通層の制御で不足する条件" value={missing} onChange={setMissing} ready={ready}>{Object.entries({tenant:'tenantの特定',scope:'キーの権限範囲',quota:'クォータ',budget:'予算',audit:'監査',none:'必要条件を照合'}).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select>:stage===3?<Select label="模式の冗長化対象" value={redundancy} onChange={setRedundancy} ready={ready}><option value="none">どちらも単一</option><option value="provider">providerだけ冗長</option><option value="gateway">共通の入口だけ冗長</option><option value="both">入口とproviderを両方冗長</option></Select>:null}>{children}</ReuseFigure>
}
