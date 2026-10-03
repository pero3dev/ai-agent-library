'use client'
import {useId,useState} from 'react'
import {GovernanceFigure,GovernanceCanvas,GovernancePair,GovernanceThree,Text,Box,Wire,Select} from './governance-safety-primitives'
import {reportCoverage,frontierProcurement} from '../../lib/governance-safety-model.mjs'
const opts=entries=>entries.map(([v,t])=><option key={v} value={v}>{t}</option>)
export function FrontierFrameworkReport({children}){
 const id=useId(),[match,setMatch]=useState('model'),report=reportCoverage({publicationDate:'2026-08-14',coverageDate:'2026-07-15',modelIncluded:match!=='model',versionMatched:match!=='version'})
 return <GovernanceFigure diagram="frontier-framework-report" title="方針の四段構造と、文書の日付・評価範囲を読む" scene={({phase})=><GovernanceCanvas diagram="frontier-framework-report" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['能力の評価と、自社アプリの攻撃面を別の層に置く','原文の観測日を保ち、採用時に公式へ戻る','事前閾値から評価・措置・公表へ結ぶ','枠組みの存在と、実際の安全達成は別に読む','公表日が進んでも、評価対象日は自動で伸びない','model・期間・外部reviewの対象範囲を読む'][stage]}</Text>
 {stage===0&&<GovernancePair left={['提供者の能力評価','危険能力の領域','閾値と評価の方針','緩和・展開の制約']} right={['自社アプリの評価','権限と攻撃経路','観測と制御の手段','用途の品質とsecurity']} id={id} phase={phase} arrow={false}/>}
 {stage===1&&<GovernancePair left={['原文の観測','2026-09-10時点','文書の版と機関名','部分確認の対象を保持']} right={['採用と変更の確認','現行方針と対象model','版・名称・提供者の変更','公式から対象scopeへ']} id={id} phase={phase}/>}
 {stage===2&&<>{[['閾値','何を危険能力とするか'],['評価','対象領域・model・時点'],['措置','緩和策と展開制限'],['公表','方針・modelカード・report']].map(([t,d],i)=><Box key={t} x={55} y={72+i*74} width={530} height={62} title={t} lines={[d]} tone={i%2?'teal':'violet'}/>)}{[0,1,2].map(i=><Wire key={i} id={id} d={`M320 ${134+i*74}V${146+i*74}`} active phase={phase}/>)}</>}
 {stage===3&&<GovernancePair left={['自己統治と申告','方針が公表されている','安全達成の自己評価','墨消しと対象外を読む']} right={['補完する経路','規制と第三者評価','各reviewのscope','全安全の認証としない']} id={id} phase={phase}/>}
 {stage===4&&<><GovernanceThree columns={[["対象の期間","評価対象07-15","変更は範囲を確認"],["方針の発効","版ごとの適用日","報告日とは別"],["reportの公表","公開08-14","対象日を延長しない"]]}/><Wire id={id} d="M208 180H230" active phase={phase}/><Wire id={id} d="M408 180H430" active phase={phase}/><Text y={340}>{report.reviewCandidate?'対象modelと版の検討候補':'採用modelと版を照合する'}</Text><Text y={374} small>August report例。公表までの全modelが評価済みとは限らない。</Text></>}
 {stage===5&&<GovernancePair left={['公開文書の範囲','採用modelと対象期間','墨消しと未知の部分','原文は全186頁の精査なし']} right={['外部reviewの範囲','何をどこまで確認したか','全内容・全modelとは別','図も全精査を主張しない']} id={id} phase={phase} arrow={false}/>}
 <Text y={412} small>危険能力を試験せず、版・日付・主体と公表範囲の読み方を示す。</Text>
 </>}</GovernanceCanvas>} controls={({stage,ready})=>stage===4?<Select label="reportで一致していない対象" value={match} onChange={setMatch} ready={ready}>{opts([['model','採用modelが対象外'],['version','版が未照合'],['none','modelと版を照合した模式入力']])}</Select>:null}>{children}</GovernanceFigure>
}
export function FrontierProcurementObservation({children}){
 const id=useId(),[missing,setMissing]=useState('coverage'),review=frontierProcurement({frameworkChecked:missing!=='framework',modelCardChecked:missing!=='card',coverageMatched:missing!=='coverage',updatesChecked:missing!=='updates',thirdPartyScopeChecked:missing!=='thirdparty'})
 return <GovernanceFigure diagram="frontier-procurement-observation" title="提供者の記録と、自社で観測・制御する範囲を結ぶ" scene={({phase})=><GovernanceCanvas diagram="frontier-procurement-observation" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['評価の領域・閾値と、開発・展開の段階を読む','第三者機関の役割と、個別評価のscopeを読む','提供者の評価から、自社の観測と制御へ戻す','文書の存在に加えて、採用modelと範囲を揃える','複数の根拠と、自社の品質・費用・遅延を照合','採用前だけでなく、版と役割の変更を追う'][stage]}</Text>
 {stage===0&&<GovernanceThree columns={[["能力領域","サイバー・CBRN等","方法はここで","扱わない"],["評価の定義","領域ごとの閾値","どこまでを","評価するか"],["評価の段階","開発と展開の両方","緩和策と","対象model"]]}/>}
 {stage===1&&<GovernancePair left={['第三者機関','各国の機関の名称と役割','連携と評価ツール','現在の所在を公式で確認']} right={['個別の評価','何を評価・公表したか','対象と確認できた範囲','網羅的な認証にしない']} id={id} phase={phase}/>}
 {stage===2&&<GovernancePair left={['提供者の評価','危険能力の対象と結果','緩和策と展開制限','自社の評価計画への材料']} right={['自社で観測・制御','Agentや環境の評価','権限と停止・回復','提供者の評価だけに頼らない']} id={id} phase={phase}/>}
 {stage===3&&<><GovernanceThree columns={[["現行の記録","framework","model card","risk report"],["modelとの一致","対象期間と版","採用対象を照合"],["変化と補完","更新履歴","第三者連携の","scope"]]}/><Text y={340}>{review.reviewCandidate?'選定reviewの検討候補':'不足する記録と範囲へ戻る'}</Text><Text y={374} small>文書が揃うだけで、自社アプリを安全・採用済みにしない。</Text></>}
 {stage===4&&<GovernancePair left={['公開の補助signal','自己申告を複数で照合','第三者連携のscope','機微用途で重みを調整']} right={['自社の要件と評価','品質・費用・遅延','securityと制御','model採用は独立の判断']} id={id} phase={phase}/>}
 {stage===5&&<><GovernanceThree columns={[["版と対象","更新・評価期間","採用model"],["主体と役割","名称・提供者","第三者の焦点"],["規制の接続","各法域の変更","自社の再確認"]]}/><Wire id={id} d="M520 269V330H120V269" active phase={phase}/><Text y={366} small>一回の調達reviewから、将来の全変更の適合を推測しない。</Text></>}
 <Text y={412} small>四軸の根拠と自社評価を結ぶ。図は実評価・採用・公開を行わない。</Text>
 </>}</GovernanceCanvas>} controls={({stage,ready})=>stage===3?<Select label="frontier選定で不足する根拠" value={missing} onChange={setMissing} ready={ready}>{opts([['framework','現行framework'],['card','modelカード'],['coverage','採用modelと評価範囲'],['updates','更新履歴'],['thirdparty','第三者のscope'],['none','全根拠を照合した模式入力']])}</Select>:null}>{children}</GovernanceFigure>
}
