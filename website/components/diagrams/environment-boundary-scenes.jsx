'use client'
import {useId,useState} from 'react'
import {HardwareCanvas,HardwareFigure,HardwarePair,HardwareThree,Text,Box,Select,Tokens} from './hardware-serving-primitives'
import {toyFacilityImpact,environmentalComparison} from '../../lib/hardware-serving-model.mjs'
const actions={sizing:['right-sizing','自社品質を満たす小型等','計算量を減らす候補','一律の削減率は測れない'],prefix:['prefix cache','処理済みprefixを再利用','重複計算を減らす候補','再送自体が必要な場合も'],history:['履歴の圧縮','以後の入力を減らす','要約生成の計算も含める','情報欠落と品質を評価'],response:['応答cache','modelを呼ばずに応答','呼出し回数を減らす','誤hitと権限を制御'],batch:['batch処理','稼働効率を改善する余地','割引と電力を分ける','割引から削減率は推定不可'],time:['低炭素の時間帯','同じ電力でも排出を減らす','電源構成を時点で確認','オフピーク≠低炭素'],loop:['空回りの抑制','無駄なloopに上限を持つ','浪費する計算を減らす','品質と実結果を検証'],region:['regionの選択','電源の炭素強度で選ぶ','遅延とデータ主権も照合','総使用量を同じ境界で測る']}
export function EnvironmentScopeMechanisms({children}){
 const id=useId(),[pue,setPue]=useState('1.5'),[intensity,setIntensity]=useState('3'),[action,setAction]=useState('batch'),impact=toyFacilityImpact({pue:Number(pue),intensity:Number(intensity)})
 return <HardwareFigure diagram="environment-scope-mechanisms" title="費用・電力・炭素の作用と、算定する境界" scene={({phase})=><HardwareCanvas diagram="environment-scope-mechanisms" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['自分で動かす効率化と、測って説明する報告を分ける','計算・稼働効率・電源の違いを、別の作用として読む','学習と推論、ITと施設、電力と水・炭素を区分する','低PUEだけでは、低炭素の電源にならない','施策ごとの作用と条件を、同じ境界で読む','一件の効率と、総使用量・task構成を分ける'][stage]}</Text>
 {stage===0&&<HardwarePair left={['効率化の面','計算や空回りを減らす','自分で動かせる施策','既存のコスト施策と接続']} right={['測定と報告の面','自社使用分と前提','誠実な開示と照会','確認先と限界を押さえる']} id={id} phase={phase} arrow={false}/>}
 {stage===1&&<HardwareThree columns={[["計算量","少なく計算","小型・cache等"],["稼働効率","待機や配置","batch等の余地"],["電源の強度","同じ電力でも","炭素量が違う"]]}/>}
 {stage===2&&<HardwareThree columns={[["taskの範囲","学習／推論","総回数も点検"],["施設の範囲","IT＋冷却等","PUEと水WUE"],["会計の範囲","scope2／3等","立地／市場"]]}/>}
 {stage===3&&<><HardwareThree columns={[["IT電力量","10 単位","計算効率は別"],["施設電力量",`${impact.facilityEnergy} 単位`,`PUE ${pue}`],["模式の炭素",`${impact.carbonUnits} 単位`,`炭素強度 ${intensity}`]]}/><Text y={326}>施設電力 × 電源の炭素強度を、別々に点検</Text><Text y={364} small>架空の単位で関係だけ示す。scope3や実排出量は計算しない。</Text></>}
 {stage===4&&<><Tokens labels={['計算','効率','電源','前提']} y={90}/><Box x={65} y={182} width={510} height={175} title={actions[action][0]} lines={actions[action].slice(1)} tone="teal"/></>}
 {stage===5&&<HardwarePair left={['一件の効率','同じ品質で比較する','計算と電源を区分する','施策の前後を測る']} right={['総使用量の変化','利用回数とtask構成','同じ算定境界で比較','需要の増加も別に読む']} id={id} phase={phase} arrow={false}/>}
 <Text y={412} small>料金の割引・電力・排出を同一視しない。図は実測値を生成しない。</Text>
 </>}</HardwareCanvas>} controls={({stage,ready})=>stage===3?<><Select label="模式の施設PUE" value={pue} onChange={setPue} ready={ready}><option value="1">1.0</option><option value="1.5">1.5</option><option value="2">2.0</option></Select><Select label="模式の電源炭素強度" value={intensity} onChange={setIntensity} ready={ready}><option value="1">1 単位</option><option value="3">3 単位</option></Select></>:stage===4?<Select label="環境への作用を読む施策" value={action} onChange={setAction} ready={ready}>{Object.entries(actions).map(([v,t])=><option key={v} value={v}>{t[0]}</option>)}</Select>:null}>{children}</HardwareFigure>
}
export function EnvironmentMeasureReport({children}){
 const id=useId(),[missing,setMissing]=useState('scope'),comparison=environmentalComparison({sameScope:missing!=='scope',samePeriod:missing!=='period',sameMethod:missing!=='method',sameUnit:missing!=='unit',sameVersion:missing!=='version'})
 return <HardwareFigure diagram="environment-measure-report" title="推計と開示の前提、ツールの観測範囲と報告の確認先" scene={({phase})=><HardwareCanvas diagram="environment-measure-report" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['実測と推計の前提を、機能単位とlifecycleへ結ぶ','境界が違う開示を、そのまま比較しない','後継GAと非推奨告知、実画面の確認は別の結果','方法論と期間・配賦を、同じ版で記録する','義務・自主開示・照会を、専門の確認先へつなぐ'][stage]}</Text>
 {stage===0&&<HardwarePair left={['実測／推計の範囲','hardware・時間・region','PUE等の仮定とrange','SCIの機能単位を明示']} right={['lifecycleの境界','学習・推論・その他工程','GSFのAI拡張を区分','AI拡張までISO済みでない']} id={id} phase={phase} arrow={false}/>}
 {stage===1&&<HardwarePair left={['揃える比較条件','scopeと対象期間','立地／市場等の算定法','機能単位と方法論の版']} right={[comparison.reviewCandidate?'比較条件の検討候補':'境界を揃え直す','自己申告と保証範囲を確認','単純な社間順位を作らない','図は比較を実施しない']} id={id} phase={phase}/>}
 {stage===2&&<HardwareThree columns={[["後継のGA","原文の確認日","提供の告知"],["旧版の非推奨","公式PDFの告知","実停止と区別"],["個別アカウント","移行・権限","実画面は未確認"]]}/>}
 {stage===3&&<HardwarePair left={['AWSの対象境界','AWS運用infraのworkload','第三者側の開発保守と別','Marketplaceの対象を照合']} right={['同じ版で比較する','方法論変更で過去再計算','公表年と実績年を区分','月次推計の自社配賦を記録']} id={id} phase={phase} arrow={false}/>}
 {stage===4&&<><Tokens labels={['義務報告','自主開示','取引先照会']} y={90}/><HardwarePair left={['制度の所在を確認','原文の時点を保持する','法令と適用日を照合','予定だけで採択としない']} right={['専門担当へ確認','法務とsustainability','自社の適用・算定境界','図は法的判断をしない']} id={id} phase={phase} y={182}/></>}
 <Text y={412} small>出典・確認日・前提を残す。月次推計を個別AI要求の実測にしない。</Text>
 </>}</HardwareCanvas>} controls={({stage,ready})=>stage===1?<Select label="開示比較で不足する条件" value={missing} onChange={setMissing} ready={ready}>{Object.entries({scope:'scopeが違う',period:'対象期間が違う',method:'算定法が違う',unit:'機能単位が違う',version:'方法論の版が違う',none:'五条件を照合'}).map(([v,t])=><option key={v} value={v}>{t}</option>)}</Select>:null}>{children}</HardwareFigure>
}
export function EnvironmentHonestClaims({children}){
 const id=useId(),[claim,setClaim]=useState('annual'),claims={offset:['相殺・net zero等','相殺や補充を含む主張','実消費・実排出とは別','言葉を実削減へ変えない'],annual:['年間の証書matching','一年の調達を合わせる','使用時点の電源と別','24/7 CFEへ読み替えない'],target:['将来の目標','将来の到達を掲げる','現在の達成と区分する','実績と前提を別に確認'],reduction:['実施した削減','同じ境界と品質で測る','総使用量も確認する','施策名だけで成果にしない']}
 return <HardwareFigure diagram="environment-honest-claims" title="実削減・証書・相殺・目標と、説明できる自社使用分" scene={({phase})=><HardwareCanvas diagram="environment-honest-claims" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['派手な言葉の前に、主張が示す量を分ける','年間の調達と、消費した瞬間の電源を分ける','実施した効率化と、その実測結果を対応づける','前提とrangeを伴って、測定の限界を説明する','平時の自社使用分から、照会へ備える'][stage]}</Text>
 {stage===0||stage===1?<><Tokens labels={['実削減','相殺','年間証書','目標']} selected={[[1,2,3,0][Object.keys(claims).indexOf(claim)]]} y={90}/><HardwarePair left={claims[claim]} right={['説明する根拠','実施内容と確認日','対象境界と期間','実測と推計・保証の範囲']} id={id} phase={phase} y={182} arrow={false}/></>:null}
 {stage===2&&<HardwareThree columns={[["right-sizing","品質を保つ","小型等を選ぶ"],["cacheの利用","重複計算","誤hitを制御"],["空回りの抑制","loopに上限","結果を確かめる"]]}/>}
 {stage===3&&<HardwarePair left={['示す範囲と前提','出典と確認日','hardware・立地・利用量','rangeと不確実性']} right={['同じ境界で比較','単一の断定値を避ける','方法論と期間を揃える','実施した効率化を説明']} id={id} phase={phase}/>}
 {stage===4&&<><Tokens labels={['平時の測定','使用分と前提','専門担当','照会の回答']} y={90}/><HardwarePair left={['自社で把握する','利用サービスと配賦','自社使用分の推計','依拠する前提を保存']} right={['専門担当へ照合','義務と自主開示を分ける','法務とsustainability','図は実提出を行わない']} id={id} phase={phase} y={182}/></>}
 <Text y={412} small>主張の名前だけで成果や義務を確定しない。図は排出実績を測らない。</Text>
 </>}</HardwareCanvas>} controls={({stage,ready})=>stage===0||stage===1?<Select label="区分する環境の主張" value={claim} onChange={setClaim} ready={ready}>{Object.entries(claims).map(([v,t])=><option key={v} value={v}>{t[0]}</option>)}</Select>:null}>{children}</HardwareFigure>
}
