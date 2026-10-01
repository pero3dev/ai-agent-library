'use client'
import { useState } from 'react'
import { ContinuityFigure,ContinuityCanvas,Text,Box,Wire,Select } from './se-continuity-primitives'
import { legacyEquivalence } from '../../lib/se-continuity-model.mjs'
export function LegacyObservationDraft({children}){
 const [path,setPath]=useState('dynamic'),[candidate,setCandidate]=useState('rare'),paths={static:['関数・moduleの依存','実コードと呼出しを確認'],dynamic:['動的な呼出し','文字列・設定・実行条件を確認'],outside:['コード外の連携','batch・DB trigger・外部連携を確認']},choice=paths[path]
 return <ContinuityFigure diagram="legacy-observation-draft" title="現行の観測と、生成された理解を照合する"
  controls={({stage,ready})=>stage===3?<Select label="影響を調べる経路" value={path} onChange={setPath} ready={ready}>{Object.entries(paths).map(([id,row])=><option key={id} value={id}>{row[0]}</option>)}</Select>:stage===4?<Select label="整理の候補" value={candidate} onChange={setCandidate} ready={ready}><option value="rare">使われていなさそう</option><option value="duplicate">重複していそう</option></Select>:null}
  scene={s=><ContinuityCanvas diagram="legacy-observation-draft" {...s}>{f=><>
   <Text y={35}>{['五つの下書きに、人が確かめる根拠を置く','入口・分岐・副作用を、実コードへ戻す','復元した仕様と、現行の入出力を比較','静的な候補だけで、全経路を見たとしない','整理候補と、削除・統合できる判断は別'][f.stage]}</Text>
   {f.stage===0?<>
    {['構造・フロー → 実コード','仕様ドラフト → 実挙動','影響候補 → 影響の確認','削除候補 → 呼出し実態','変換案 → 新旧の比較'].map((t,i)=><Box key={t} x={67} y={75+i*63} width={506} height={50} title={t} tone={i===4?'teal':'violet'}/>)}
    <Text y={419} small>挙動の観測と、望ましい要求への適合判断は別</Text>
   </>:f.stage===1?<>
    <Box x={213} y={78} width={214} height={61} title="処理の入口" tone="teal"/>
    <Wire id={s.id} d="M320 139V164H162V188M320 164H478V188" active phase={f.phase}/>
    <Box x={32} y={197} width={260} height={96} title="通常の経路" lines={['module・データの流れ']} tone="violet"/><Box x={348} y={197} width={260} height={96} title="分岐・副作用" lines={['例外・隠れた変更']} tone="amber"/>
    <Box x={67} y={342} width={506} height={68} title="背景の仮説 → 履歴・関係者で確認" tone="violet"/>
   </>:f.stage===2?<>
    <Box x={32} y={82} width={260} height={169} title="復元した仕様" lines={['入出力・条件の説明','単純化・例外欠落の可能性','生成物はドラフト']} tone="violet"/>
    <Box x={348} y={82} width={260} height={169} title="現行の実挙動" lines={['入出力・test結果','実際に動いた根拠','食い違いはここで確認']} tone="teal"/>
    <Wire id={s.id} d="M292 168H340" active phase={f.phase}/>
    <Text y={356} small>観測した挙動がバグか仕様かは、関係者の別判断</Text>
   </>:f.stage===3?<>
    <Box x={67} y={82} width={506} height={128} title={choice[0]} lines={[choice[1],'見落としと過剰検出の両方を確認']} tone="violet"/>
    <Wire id={s.id} d="M320 210V267" active phase={f.phase}/><Box x={67} y={277} width={506} height={116} title="人が実コードとtestで判断" lines={['指摘なし ≠ 影響なし','候補は調査の当たり付け']} tone="amber" data-impact-none-guaranteed="false"/>
   </>:<>
    <Box x={67} y={82} width={506} height={130} title={candidate==='rare'?'低頻度でも生きている経路':'重複に見える固有の分岐'} lines={candidate==='rare'?['ログ・呼出し元・運用schedule','条件付き実行・年次batchを確認']:['共通部分と固有の条件を照合','統合方針とtestを確認']} tone="violet"/>
    <Box x={67} y={280} width={506} height={113} title="削除・統合の可否は人が確定" lines={['候補の指摘だけでは変更しない','本当に必要な挙動を保つ']} tone="teal" data-deletion-auto-approved="false"/>
   </>}
  </>}</ContinuityCanvas>}>{children}</ContinuityFigure>
}
export function LegacyMeasureMigrate({children}){
 const [executed,setExecuted]=useState('no'),[conditions,setConditions]=useState('yes'),[scope,setScope]=useState('no'),state=legacyEquivalence({executed:executed==='yes',sameConditions:conditions==='yes',scopeReviewed:scope==='yes'})
 return <ContinuityFigure diagram="legacy-measure-migrate" title="小さな実測から、段階移行と等価性の確認へ"
  controls={({stage,ready})=>stage===2?<><Select label="新旧比較の実行" value={executed} onChange={setExecuted} ready={ready}><option value="no">未実行</option><option value="yes">実行した</option></Select><Select label="新旧の比較条件" value={conditions} onChange={setConditions} ready={ready}><option value="yes">同じ入力と条件</option><option value="no">条件が異なる・未確認</option></Select><Select label="検証範囲の確認" value={scope} onChange={setScope} ready={ready}><option value="no">未確認</option><option value="yes">人が確認した</option></Select></>:null}
  scene={s=><ContinuityCanvas diagram="legacy-measure-migrate" {...s}>{f=><>
   <Text y={35}>{['対象の方言と環境で、読解・変換を小さく測る','一つずつ移し、testと文書も整える','説明ではなく、実行した同条件の比較を見る','現行の再現と、要求を変える判断は別','業務リスクと投資判断を人が決める'][f.stage]}</Text>
   {f.stage===0?<>
    {['対象の小さな実コード','読解・変換の実測','公式対応と、実測の誤りを照合'].map((t,i)=><g key={t}><Box x={67} y={77+i*104} width={506} height={77} title={t} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${154+i*104}V${172+i*104}`} active phase={f.phase}/>}</g>)}
    <Text y={419} small>COBOL・VB等の方言・独自拡張は未確認を保つ</Text>
   </>:f.stage===1?<>
    <Box x={32} y={82} width={260} height={155} title="現行のmodule" lines={['境界と観測を整理','残す挙動を確かめる']} tone="violet"/>
    <Wire id={s.id} d="M292 157H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={155} title="移行の下書き" lines={['変換・test・文書','小さく検証して次へ']} tone="teal"/>
    <Text y={352} small>全面置換を図で要求せず、順序と可否を人が判断</Text>
   </>:f.stage===2?<>
    <Box x={32} y={82} width={260} height={126} title="現行の結果" lines={['実際の入出力','比較の基準']} tone="violet"/><Box x={348} y={82} width={260} height={126} title="移行後の結果" lines={['同じ入力と条件','差異と対象範囲']} tone="violet"/>
    <Wire id={s.id} d="M162 208V246H320M478 208V246H320V272" active phase={f.phase}/><Box x={67} y={282} width={506} height={114} title={state.comparisonEvidenceReady?'比較の根拠を確認した範囲':'比較の実行・条件・範囲が不足'} lines={['実行と比較条件、対象範囲を確認','全挙動や望ましい仕様の保証ではない']} tone={state.comparisonEvidenceReady?'teal':'amber'} data-comparison-evidence-ready={String(state.comparisonEvidenceReady)}/>
   </>:f.stage===3?<>
    <Box x={32} y={82} width={260} height={171} title="現行を再現" lines={['同じ条件で新旧を比較','移行による差異を確認','保存する挙動の範囲']} tone="teal"/>
    <Box x={348} y={82} width={260} height={171} title="要求を変更" lines={['バグか仕様かを判断','関係者と合意','変更後の期待値で検証']} tone="amber" data-desired-requirements-verified="false"/>
    <Text y={356} small>現行の比較に通っても、バグを望ましい仕様としない</Text>
   </>:<>
    {['現状維持・塩漬け','段階的に移行','再構築を検討'].map((t,i)=><Box key={t} x={67} y={78+i*104} width={506} height={77} title={t} tone="violet"/>)}
    <Text y={418} small>業務リスク・投資・実測を材料に、人が選ぶ</Text>
   </>}
  </>}</ContinuityCanvas>}>{children}</ContinuityFigure>
}
