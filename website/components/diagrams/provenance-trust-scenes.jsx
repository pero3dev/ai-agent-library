'use client'
import {useId,useState} from 'react'
import {TrustFigure,TrustCanvas,TrustPair,TrustThree,Text,Box,Wire,Select,Tokens} from './trust-privacy-primitives'
import {provenanceClaim,detectorSignal} from '../../lib/trust-privacy-model.mjs'
export function ProvenanceLayersLoss({children}){
 const id=useId(),[status,setStatus]=useState('absent'),[route,setRoute]=useState('text'),claim=provenanceClaim(status)
 return <TrustFigure diagram="provenance-layers-loss" title="署名付き履歴とAI由来の推定、失われる来歴" scene={({phase})=><TrustCanvas diagram="provenance-layers-loss" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['来歴は作成時、検出は出来上がった後の別レイヤー','原文の観測日と、採用時の新しい確認を分ける','署名付きmetadataと信号の透かしは補完する','媒体・生成経路・取得API・後工程を照合する','剥離と再署名のない編集を、内容の真偽から分ける','冗長化して辿る経路と、受入の判断を分ける'][stage]}</Text>
 {stage===0&&<TrustPair left={['来歴の検証','作成・編集の履歴','署名付きmetadata','作成時に付ける']} right={['AI由来の推定','完成した内容を判定','誤りを含むsignal','事後の検出']} id={id} phase={phase} arrow={false}/>}
 {stage===1&&<><TrustPair left={['原文の時点','2026-09-10の確認','ISO/CD 22144・30.99','発行済み規格ではない']} right={['採用時の照合','標準と提供範囲を確認','model・媒体・取得API','図の時点を現在へ転用しない']} id={id} phase={phase} arrow={false}/><Text y={344}>仕様の公開と国際規格の成立は、別の段階</Text></>}
 {stage===2&&<TrustPair left={['署名付きmetadata','作成と編集を記録','改ざんの検知','付随情報は剥がれ得る']} right={['信号への透かし','可視と不可視','剥離へ相対的に強い','除去不能は保証しない']} id={id} phase={phase} arrow={false}/>}
 {stage===3&&<><TrustPair left={[route==='text'?'生成テキスト':'対応する生成ファイル','原文のClaudeモデル範囲',route==='text'?'テキスト透かしの方式':'Files APIで取得する経路','全生成物へ一般化しない']} right={['後工程でも照合','媒体と取得APIを特定','変換 → 保存 → 配信','配信後の成果物を検証']} id={id} phase={phase}/><Text y={345} small>テキスト透かしとファイルのC2PAは、異なる方式と提供範囲。</Text></>}
 {stage===4&&<><Tokens labels={['生成','変換・再撮影','保存・配信','検証']} selected={[1]} y={86}/><TrustPair left={[status==='invalid'?'再署名のない編集':status==='absent'?'剥離した来歴':'付随する履歴','再encode・upload・再撮影','履歴を失う場合がある','編集と署名の対応を検証']} right={[claim.historyClue?'履歴を照合する手がかり':'履歴だけでは判断できない','来歴なしは偽物の証拠でない','来歴ありは内容の真実でない','図は実署名を検証しない']} id={id} phase={phase} y={203} height={171}/></>}
 {stage===5&&<><TrustThree columns={[["metadata","署名付きの履歴","剥離し得る"],["透かし・指紋","信号や照合で辿る","耐久性を補う"],["受入のプロセス","文脈と別チャネル","人の判断"]]}/><Wire id={id} d="M208 180H230" active phase={phase}/><Wire id={id} d="M408 180H430" active phase={phase}/><Text y={345}>来歴の有無だけで、信頼や真偽を決めない</Text></>}
 <Text y={412} small>来歴は履歴の手がかり。内容の真実・AI生成そのものを断定しない。</Text>
 </>}</TrustCanvas>} controls={({stage,ready})=>stage===3?<Select label="原文で区別する生成経路" value={route} onChange={setRoute} ready={ready}><option value="text">生成テキストの透かし</option><option value="file">Files API取得時のC2PA</option></Select>:stage===4?<Select label="観測した来歴の状態" value={status} onChange={setStatus} ready={ready}><option value="present">来歴が付随する</option><option value="absent">来歴がない</option><option value="invalid">編集で対応が崩れた</option></Select>:null}>{children}</TrustFigure>
}
const errors=[['人の制作物','AI製と推定','偽陽性: 不利益の危険'],['AI製の内容','人の制作物と推定','偽陰性: 見逃し']]
export function ProvenanceDetectionProcess({children}){
 const id=useId(),[signal,setSignal]=useState('uncertain'),result=detectorSignal(signal)
 return <TrustFigure diagram="provenance-detection-process" title="検出の二つの誤りと、生成・受入の検証プロセス" scene={({phase})=><TrustCanvas diagram="provenance-detection-process" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['検出器はAIらしさを推定する、誤りを含むsignal','偽陽性と偽陰性は、異なる相手と被害につながる','生成時から配信後まで、来歴の対応を確認する','外部の受入は、検出と来歴を複数の確認へ結ぶ','標準・提供範囲・主張・表示義務の時点を見直す','断定せず、透明性と受入の運用を点検する'][stage]}</Text>
 {stage===0&&<TrustPair left={['検出器の推定',result.signal==='ai'?'AI由来らしい':result.signal==='human'?'人の制作物らしい':'判定が不確か','回避と誤判定を含む','自己申告の精度は別に検証']} right={['補助signalとして使う','AI製を断定しない','本人確認を成立させない','来歴と別チャネルへ戻す']} id={id} phase={phase}/>}
 {stage===1&&<>{errors.map((r,i)=><g key={r[0]}><Box x={42} y={90+i*145} width={230} height={118} title={r[0]} lines={[r[1]]} tone={i===0?'purple':'teal'}/><Wire id={id} d={`M272 ${149+i*145}H332`} active phase={phase}/><Box x={334} y={90+i*145} width={264} height={118} title={r[2].split(':')[0]} lines={[r[2].split(': ')[1],i===0?'学生・本人を誤って断罪':'生成物を見逃す']} tone="amber"/></g>)}</>}
 {stage===2&&<><TrustThree columns={[["自社の生成","媒体と生成経路","対応する来歴付与"],["変換・保存","後工程での剥離","署名を照合"],["配信後の成果物","実際の取得物","対応と透明性を確認"]]}/><Wire id={id} d="M208 180H230" active phase={phase}/><Wire id={id} d="M408 180H430" active phase={phase}/></>}
 {stage===3&&<TrustThree columns={[["外部の内容","来歴を照合","検出は補助"],["別の証拠","文脈と作者","別チャネルで裏取"],["受入の判断","人の確認","重要操作は別に承認"]]}/>}
 {stage===4&&<><Tokens labels={['標準の版','透かし対象','精度主張','表示義務']} y={88}/><TrustPair left={['公式の確認入口','標準団体と各社','堅牢性は自己申告','地域と用途で義務を確認']} right={['運用へ反映','媒体・API・後工程','提供範囲と確認日','実証と判断を分ける']} id={id} phase={phase} y={203} height={171}/></>}
 {stage===5&&<TrustPair left={['透明性を付ける','自社生成の来歴と表示','変換・配信後の照合','標準と範囲を更新']} right={['受入を確認する','来歴・文脈・別チャネル','検出で断定しない','人の判断とプロセス']} id={id} phase={phase} arrow={false}/>}
 <Text y={412} small>検出の自己報告は実測でない。図は実検出・法的適合を判定しない。</Text>
 </>}</TrustCanvas>} controls={({stage,ready})=>stage===0?<Select label="補助として読む検出signal" value={signal} onChange={setSignal} ready={ready}><option value="ai">AI由来らしい</option><option value="human">人の制作物らしい</option><option value="uncertain">不確か</option></Select>:null}>{children}</TrustFigure>
}
