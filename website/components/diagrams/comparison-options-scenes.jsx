'use client'
import { useState } from 'react'
import { OptionsFigure,OptionsCanvas,Text,Box,Wire,Select } from './coding-options-primitives'
import { candidateConstraint } from '../../lib/coding-options-model.mjs'
export function ComparisonMatrixMeaning({children}){
 const [symbol,setSymbol]=useState('yes'),[constraint,setConstraint]=useState('unknown'),gate=candidateConstraint(constraint)
 return <OptionsFigure diagram="comparison-matrix-meaning" title="提供表を品質の点数にせず、要件と境界から読む"
  controls={({stage,ready})=>stage===0?<Select label="表の記号" value={symbol} onChange={setSymbol} ready={ready}><option value="yes">○</option><option value="limited">△</option><option value="none">—</option><option value="unknown">?</option></Select>:stage===3?<Select label="必須制約の確認結果" value={constraint} onChange={setConstraint} ready={ready}><option value="met">満たす根拠を確認</option><option value="violated">満たさない</option><option value="unknown">未確認</option></Select>:null}
  scene={s=><OptionsCanvas diagram="comparison-matrix-meaning" {...s}>{f=><>
   <Text y={35}>{['記号は、機能提供と確認の状態','入口・実行形態を、同じ軸で比較する','実行・隔離・承認・データは独立の条件','必須制約に不明が残る候補を、通過扱いにしない'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={67} y={87} width={506} height={130} title={{yes:'○：公式に提供',limited:'△：限定・条件付き',none:'—：提供なし',unknown:'?：未確認'}[symbol]} lines={['品質・精度・優劣の点数ではない','確認日と元記事の注記を合わせて読む']} tone={symbol==='unknown'?'amber':'violet'} data-symbol-quality-score="false"/>
    <Box x={67} y={284} width={506} height={105} title="同じ○でも、中身の深さは違う" lines={['各ツール記事 → 一次情報へ戻る']} tone="teal"/>
   </>:f.stage===1?<>
    {['CLI・IDE拡張','専用IDE・cloud','PR連携・API'].map((t,i)=><Box key={t} x={67} y={77+i*102} width={506} height={76} title={t} tone="violet"/>)}
    <Text y={418} small>アプリはIDEと別。契約の含有と製品名も分ける</Text>
   </>:f.stage===2?<>
    {['実行：local／cloud','隔離：OS・file・通信','承認：既定・変更条件','データ：plan・設定・例外'].map((t,i)=><Box key={t} x={67} y={76+i*81} width={506} height={62} title={t} tone={i===3?'amber':'violet'}/>)}
    <Text y={419} small>ローカルやBYOKだけで、学習不使用とは判断しない</Text>
   </>:<>
    <Box x={67} y={83} width={506} height={117} title={gate.canProceedToTrial?'試用へ進める候補':gate.needsConfirmation?'根拠の確認へ戻す':'制約を満たさない候補'} lines={['この表示は架空の候補の状態を切り替える','実製品の合否や採用順位を判定しない']} tone={gate.canProceedToTrial?'teal':'amber'} data-candidate-can-proceed={String(gate.canProceedToTrial)} data-quality-ranked="false"/>
    <Wire id={s.id} d="M320 200V247" active phase={f.phase}/><Box x={77} y={255} width={486} height={126} title="各記事・一次情報で条件を確認" lines={['未確認を○へ勝手に変えない','必須制約で絞ってから、実作業を試す']} tone="violet"/>
   </>}
  </>}</OptionsCanvas>}>{children}</OptionsFigure>
}
export function ComparisonContractUse({children}){
 const [use,setUse]=useState('pair'),choices={review:["PRレビューの補助","指摘を検証・組織の承認方針を確認","Copilotの承認はopt-in preview"],contract:["既存契約の範囲で始める","同梱条件と学習利用・管理を照合","契約に含まれるだけで選ばない"],pair:['対話的なペア作業','往復の速さ・人が舵を取る','委任とは依頼設計が違う'],pr:['IssueからPRを作る','CI権限・保護規則・レビュー','イベントの連携先を確認'],parallel:['独立タスクの並列処理','隔離と機械検証できる完了基準','消費と依頼の質を測る'],secret:['機密コードの取り扱い','モデル契約・経路・保持条件','自己運用と存続性の責任'],ide:['既存IDEを保つ','拡張またはCLIの対応を確認','専用IDEには移行が必要'],scm:['GitHub以外のSCM','SCM連携・ローカル実行を照合','GitHub連携の価値を一般化しない']},choice=choices[use]
 return <OptionsFigure diagram="comparison-contract-use" title="機能と契約を用途へ照合し、試用で決める"
  controls={({stage,ready})=>stage===2?<Select label="比較する用途" value={use} onChange={setUse} ready={ready}>{Object.entries(choices).map(([id,row])=><option key={id} value={id}>{row[0]}</option>)}</Select>:null}
  scene={s=><OptionsCanvas diagram="comparison-contract-use" {...s}>{f=><>
   <Text y={35}>{['機能の有無から、実際の中身へ戻る','契約と無料枠だけで、採用を決めない','用途ごとに、価値と注意条件を並べる','候補2〜3から、一次情報と試用で決める'][f.stage]}</Text>
   {f.stage===0?<>
    {['理解：索引と探索','復元：fileと外部作用','接続：MCPと権限','規約：配置と実適用'].map((t,i)=><Box key={t} x={32+i%2*316} y={82+Math.floor(i/2)*133} width={260} height={100} title={t} tone="violet"/>)}
    <Text y={376} small>推測・未確認は残し、○の数で勝者を決めない</Text>
   </>:f.stage===1?<>
    <Box x={32} y={89} width={260} height={157} title="プラン・含有枠" lines={['無料・同梱・OSSの条件','公式料金へ戻る','推論費用と消費を確認']} tone="violet"/>
    <Box x={348} y={89} width={260} height={157} title="管理・データ条件" lines={['SSO・policy・監査','予定プランの学習利用','契約経路・地域・保持']} tone="teal"/>
    <Text y={349} small>現在価格は作らず、契約予定の提供面で再確認</Text>
   </>:f.stage===2?<>
    <Box x={67} y={83} width={506} height={94} title={choice[0]} tone="violet"/>
    <Wire id={s.id} d="M320 177V225" active phase={f.phase}/><Box x={67} y={233} width={506} height={155} title="用途の条件を確認" lines={[choice[1],choice[2],'既存契約も、データ条件と管理を個別確認']} tone="teal" data-selected-use={use}/>
   </>:<>
    {['必須制約で候補を絞る','各記事・一次情報で鮮度を確認','社内試用で成果・負担・消費を測る'].map((t,i)=><g key={t}><Box x={67} y={76+i*105} width={506} height={77} title={t} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${153+i*105}V${174+i*105}`} active phase={f.phase}/>}</g>)}
    <Text y={419} small>模式図の切替結果は、実製品の評価結果ではない</Text>
   </>}
  </>}</OptionsCanvas>}>{children}</OptionsFigure>
}
