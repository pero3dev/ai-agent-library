'use client'
import {useId,useState} from 'react'
import {CaseFigure,CaseCanvas,CasePair,CaseThree,Text,Box,Wire,Select} from './case-evidence-primitives'
import {analysisValidation} from '../../lib/case-evidence-model.mjs'
export function AnalysisErrorContext({children}){
 const id=useId();const wrong=[['取消の行','status=9を含めた集計'],['単位の混同','税抜を税込として扱う'],['一対多の結合','同じ明細を重複して数える']]
 return <CaseFigure diagram="analysis-error-context" title="エラーがない集計から、意味つきの文脈へ" scene={({phase})=><CaseCanvas diagram="analysis-error-context" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['SQL実行成功と、正しい集計は別の観測','エラーを出さず、それらしい誤りが生まれる','schemaの物理名に、意味と単位を添える','その場の指標生成を、検証済み定義へ置き換える','文脈の整備を、結果の独立検証へつなぐ'][stage]}</Text>
 {stage===0&&<CasePair left={['見えた成功','SQLが実行できる','綺麗な表とグラフ','例外は出ていない']} right={['残る意味の誤り','何を数えた数字か','取消・単位・結合','重要判断には独立検証']} id={id} phase={phase} arrow={false}/>}
 {stage===1&&<>{wrong.map(([title,detail],i)=><Box key={title} x={70} y={86+i*88} width={500} height={70} title={title} lines={[detail]} tone={i===1?'teal':'amber'}/>)}</>}
 {stage===2&&<CasePair left={['列と業務の意味','取消statusの扱い','税抜・税込の単位','結合の多重度']} right={['分析用view','除外と結合を確認済み','対象をviewへ限定','schemaへ意味を添える']} id={id} phase={phase}/>}
 {stage===3&&<CasePair left={['その場の定義','売上・粗利を再組立て','同じ名称でも条件が違う','取り違えを確認しにくい']} right={['一元化した指標','検証済みSQL断片','意味と条件を統一','誤りゼロは保証しない']} id={id} phase={phase}/>}
 {stage===4&&<><CaseThree columns={[["v1 実行","schema→SQL→","結果","意味が不足"],["v2 文脈","意味とviewと指標","誤りの余地を","減らす"],["v3 検証","既知値と別経路","根拠と保留"]]}/><Wire id={id} d="M208 180H230" active phase={phase}/><Wire id={id} d="M408 180H430" active phase={phase}/></>}
 <Text y={412} small>架空の三誤りは網羅ではない。文脈整備も実測の品質保証ではない。</Text>
 </>}</CaseCanvas>}>{children}</CaseFigure>
}
export function AnalysisValidationReturn({children}){
 const id=useId(),[missing,setMissing]=useState('independent'),review=analysisValidation({knownValueMatched:missing!=='known',independentMeaningChecked:missing!=='independent',conditionsShown:missing!=='shown',assumptionsClear:missing!=='assumptions',regressionCovered:missing!=='regression'})
 return <CaseFigure diagram="analysis-validation-return" title="二重の検証と、根拠・保留・回帰を結ぶ" scene={({phase})=><CaseCanvas diagram="analysis-validation-return" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['同じ誤定義を共有した二つのSQLは、一致しても誤り得る','利用者が何を数えた数字か確認できる根拠を出す','前提や確度が不足したら、断定へ進まない','検証できる下書きとして使い、正解つきcaseを回帰へ','文脈・検証・根拠・保留を毎回の分析に戻す'][stage]}</Text>
 {stage===0&&<CasePair left={['既知値との照合','月次KPIなどの正しい値','別の正本から確認','ズレたら出力を差し戻す']} right={['別経路で再現','独立した指標の意味','対象期間と基準data','SQLの表現変更だけでない']} id={id} phase={phase} arrow={false}/>}
 {stage===1&&<CaseThree columns={[["生成した結果","表・グラフ・結論","確認できる下書き"],["実行の根拠","使ったSQL","対象期間とfilter"],["利用者の確認","何を数えたか","重要判断は","独立確認"]]}/>}
 {stage===2&&<CasePair left={['必要な確認','既知値と独立した意味','根拠と明確な前提','回帰の対象']} right={[review.reviewCandidate?'分析reviewの検討候補':'不足する条件へ戻る','曖昧なら判断を保留','図は実queryを検証しない','全誤りの防止を保証しない']} id={id} phase={phase}/>}
 {stage===3&&<><CaseThree columns={[["利用者へ伝える","SQLと条件を確認","鵜呑みを防ぐ"],["現場の誤り","取消・単位・結合","正解つきcaseへ"],["更新後の回帰","実行結果を採点","再発を検知"]]}/><Wire id={id} d="M208 180H230" active phase={phase}/><Wire id={id} d="M408 180H430" active phase={phase}/><Wire id={id} d="M520 269V330H120V269" active phase={phase}/></>}
 {stage===4&&<CasePair left={['与えるものを整える','意味つきschemaとview','一元化した指標','model変更だけに頼らない']} right={['検証できる下書き','独立した結果照合','根拠の表示と正直な保留','自社の誤りを回帰へ']} id={id} phase={phase}/>}
 <Text y={412} small>一致を正しさとせず、指標・期間・基準dataの独立性を確認する。</Text>
 </>}</CaseCanvas>} controls={({stage,ready})=>stage===2?<Select label="分析reviewで不足する条件" value={missing} onChange={setMissing} ready={ready}>{[['known','既知値の照合'],['independent','別経路の意味の独立確認'],['shown','SQLと条件の表示'],['assumptions','前提の明確さ'],['regression','回帰の対象'],['none','全条件を照合した模式入力']].map(([v,t])=><option key={v} value={v}>{t}</option>)}</Select>:null}>{children}</CaseFigure>
}
