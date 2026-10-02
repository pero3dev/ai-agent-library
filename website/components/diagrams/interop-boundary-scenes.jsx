'use client'
import {useId,useState} from 'react'
import {BoundaryCanvas,BoundaryFigure,BoundaryPair,Text,Box,Select,Tokens} from './synthetic-sandbox-interop-primitives'
import {peerDelegation} from '../../lib/synthetic-sandbox-interop-model.mjs'
const states={working:['処理中','相手の進捗を確認','期限と取消を保持','成果物はまだ未検証'],input:['入力を要求','不足と目的を確認','開示範囲を限定','必要なら人へ戻す'],done:['完了を宣言','成果物を受け取る','実結果と条件を検証','宣言だけで成功にせず'],failed:['失敗を通知','部分成果と作用を照合','再試行条件を確認','未達を残して戻す']}
export function InteropToolPeerStructure({children}){
 const id=useId(),[state,setState]=useState('done')
 return <BoundaryFigure diagram="interop-tool-peer-structure" title="部品の呼出しと、相手Agentへの委譲を区分する。" scene={({phase})=><BoundaryCanvas diagram="interop-tool-peer-structure" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['手元の部品と、内部を持つ相手Agentは異なる','発見から状態・認証まで、連携の要素をそろえる','公開された能力と、実行の許可を照合する','非同期の状態を追い、成果物を検証する','共通語彙でも、権限と成功条件は実装に残る'][stage]}</Text>
  {stage===0?<BoundaryPair id={id} phase={phase} arrow={false} left={['ツールを呼ぶ','既知の部品と入出力','呼び手が手順を管理','ツールの結果を検証']} right={['相手に任せる','内部の推論・道具は不透明','相手の状態を追う','返却成果物を検証']}/>:stage===1?<>
   <Tokens labels={['発見','能力','委譲','状態','認証']} y={101} selected={[0,1,2,3,4]}/>
   <Box x={64} y={231} width={512} height={126} title="役割を定めても、権限は自動で増えない" lines={['接続相手と委譲範囲を照合する','図は接続もメッセージ送信もしない']} tone="amber"/>
  </>:stage===2?<BoundaryPair id={id} phase={phase} left={['発見と能力','接続先とカードを照合','公開したskillを確認','自己申告を信頼へ転換せず']} right={['委譲の契約','入力と期待する成果物','委譲・開示・期限の範囲','現在の許可を別に確認']}/>:stage===3?<>
   <BoundaryPair id={id} phase={phase} left={states[state]} right={['呼び手側の照合','相手の宣言と成果物','自分の成功条件','残る作用・未達を確認']}/>
   <Text y={338} small>相手の「完了」と、自タスクの成功は別</Text>
  </>:<BoundaryPair id={id} phase={phase} left={['認証・認可の入口','相手のidentityを確認','能力・操作・データの範囲','現行の契約とpolicy']} right={['実装に残る判断','誰が何を実行できるか','認証後も最小権限','結果の検証と監査']}/>}
 </>}</BoundaryCanvas>} controls={({stage,ready})=>stage===3?<Select label="相手のタスク状態" value={state} onChange={setState} ready={ready}>{Object.entries(states).map(([value,labels])=><option key={value} value={value}>{labels[0]}</option>)}</Select>:null}>{children}</BoundaryFigure>
}
export function InteropTrustUpdate({children}){
 const id=useId(),[trust,setTrust]=useState('partner'),[missing,setMissing]=useState('identityVerified')
 const decision=peerDelegation({knownPartner:missing!=='knownPartner',identityVerified:missing!=='identityVerified',scopeAllowed:missing!=='scopeAllowed',disclosureMinimized:missing!=='disclosureMinimized'})
 return <BoundaryFigure diagram="interop-trust-update" title="信頼・権限・開示と、変更しやすい接続点を読む。" scene={({phase})=><BoundaryCanvas diagram="interop-trust-update" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['認証した相手にも、委譲の権限を限定する','信頼の段階に応じて、開く範囲を決める','既知の相手と、許すタスクを先に絞る','相手からの応答も、非信頼入力として受ける','動く仕様の接続点を、安定した中核から区分する','相手・現在の許可・開示を合わせて確認する'][stage]}</Text>
  {stage===0?<BoundaryPair id={id} phase={phase} left={['組織間のidentity','委譲経路を確認','最終ユーザーとの関係','資格情報を限定して渡す']} right={['操作ごとの認可','skill・操作・データ','誰の権限で実行するか','認証済みでも無制限にせず']}/>:stage===1?<BoundaryPair id={id} phase={phase} left={[trust==='internal'?'社内の連携':trust==='partner'?'契約したパートナー':'公開された相手','登録と管理の範囲','identityと契約を確認','必要な入力だけを開示']} right={['開く範囲を段階化','委譲権限を明示','結果と挙動を検証','信頼を全権委譲にせず']}/>:stage===5?<g data-interop-delegation-candidate={String(decision.reviewCandidate)} data-interop-message-sent="false" data-interop-peer-unconditionally-trusted="false">
   <Tokens labels={['既知の相手','identity','委譲範囲','最小開示']} y={98} selected={[0,1,2,3]}/>
   <Box x={64} y={224} width={512} height={147} title={decision.reviewCandidate?'委譲を検討する候補':'不足を残して接続条件へ戻る'} lines={['条件の照合後も、結果を検証する','相手の内部を無条件に信頼しない','図はメッセージを送信しない']} tone={decision.reviewCandidate?'teal':'amber'}/>
  </g>:stage===3?<BoundaryPair id={id} phase={phase} left={['新しい攻撃面','相手の応答・成果物','過剰な開示要求','内側の指示を権限にせず']} right={['呼び手側の守り','入力と出力を検証','委譲・伝播の権限を制限','監査・停止の出口を保持']}/>:stage===4?<BoundaryPair id={id} phase={phase} left={['動く接続点','仕様・認証・task形状','提供条件と確認日','adapter側へ寄せる']} right={['安定した中核','業務の成功条件','許可とデータの境界','仕様の更新でも保持']}/>:<BoundaryPair id={id} phase={phase} left={['既知の相手から','自前のcatalogueに限定','接続先と登録を照合','動的発見だけで任せず']} right={['許すタスクを分類','対象・内容・期限','現在の権限を確認','公開範囲を広げすぎず']}/>}
 </>}</BoundaryCanvas>} controls={({stage,ready})=>stage===1?<Select label="相手との信頼の段階" value={trust} onChange={setTrust} ready={ready}><option value="internal">社内</option><option value="partner">契約したパートナー</option><option value="public">公開された相手</option></Select>:stage===5?<Select label="委譲前の不足条件" value={missing} onChange={setMissing} ready={ready}><option value="knownPartner">既知の相手</option><option value="identityVerified">identityの確認</option><option value="scopeAllowed">委譲範囲の許可</option><option value="disclosureMinimized">最小限の開示</option><option value="none">必要条件を照合</option></Select>:null}>{children}</BoundaryFigure>
}
