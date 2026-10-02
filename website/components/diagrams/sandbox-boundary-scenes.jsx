'use client'
import {useId,useState} from 'react'
import {BoundaryCanvas,BoundaryFigure,BoundaryPair,Text,Box,Wire,Select,Tokens} from './synthetic-sandbox-interop-primitives'
import {sandboxEgress,sandboxRelease} from '../../lib/synthetic-sandbox-interop-model.mjs'
const technologies={process:['プロセス分離','ホストkernelを共有','設定と権限を点検','脱出への対策は残る'],container:['標準コンテナ','ホストkernelを共有','namespaceと制限','共有は消えない'],enhanced:['強化したコンテナ','アプリ用kernel等','互換性と負担を照合','脱出への対策は残る'],microvm:['microVM','ゲストkernelを分離','デバイスと設定を絞る','更新と監視は残る'],wasm:['Wasm runtime','線形メモリを隔離','host機能を許可制に','runtimeを更新する'],browser:['ブラウザ内で実行','利用者側の保護','外部接続の制約','用途との適合を測る'],managed:['管理された実行環境','提供者との責任分界','持込データと通信','終了・削除条件を照合']}
export function SandboxIsolationSelection({children}){
 const id=useId(),[technology,setTechnology]=useState('container')
 return <BoundaryFigure diagram="sandbox-isolation-selection" title="隔離する境界を、守る対象から選ぶ。" scene={({phase})=><BoundaryCanvas diagram="sandbox-isolation-selection" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['コードを非信頼入力として、守る対象を決める','プロセスと標準コンテナは、kernelを共有する','アプリ用kernelが、直接の露出を減らす','microVMは、ゲストkernelを持つ','Wasmの隔離と、許可したhost機能を分ける','技術名ではなく、要件と運用を照合する'][stage]}</Text>
  {stage===0?<>
   <Box x={64} y={90} width={512} height={110} title="生成されたコード" lines={['もっともらしいコードも非信頼入力']} tone="amber"/>
   <Tokens labels={['ホスト','通信','データ','他セッション']} y={252} selected={[0,1,2,3]}/>
   <Text y={354} small>必要な保護と、許可する操作を先に決める</Text>
  </>:stage===1?<>
   <Box x={32} y={80} width={260} height={124} title="プロセス" lines={['権限・資源の制限','同じホストkernel']} tone="violet"/>
   <Box x={348} y={80} width={260} height={124} title="標準コンテナ" lines={['namespace等を使う','同じホストkernel']} tone="teal"/>
   <Wire id={id} d="M162 204V238H318V270" active phase={phase}/><Wire id={id} d="M478 204V238H322V270" active phase={phase}/>
   <Box x={132} y={278} width={376} height={85} title="共有するホストkernel" tone="amber"/>
  </>:stage===2?<>
   <Box x={64} y={78} width={512} height={78} title="アプリの処理" tone="violet"/>
   <Wire id={id} d="M320 156V185" active phase={phase}/>
   <Box x={64} y={192} width={512} height={78} title="ユーザー空間のアプリ用kernel" tone="teal"/>
   <Wire id={id} d="M320 270V299" active phase={phase}/>
   <Box x={64} y={306} width={512} height={78} title="ホストkernelへの入口を減らす" tone="amber"/>
  </>:stage===3?<BoundaryPair id={id} phase={phase} left={['microVM内','アプリとguest kernel','最小の仮想デバイス','ゲスト側も更新する']} right={['仮想化の境界','KVM等の構成を照合','ホストの設定・更新','VM脱出への対策']}/>:stage===4?<BoundaryPair id={id} phase={phase} left={['Wasmの内部','線形メモリと制御','runtimeの隔離','脆弱性の対策は残る']} right={['外部との接点','import・WASIの能力','host機能を絞る','許可したI/Oを点検']}/>:<>
   <BoundaryPair id={id} phase={phase} left={technologies[technology]} right={['採用構成に照合','起動条件と運用負担','必要なI/Oと制限','順位と保証を作らない']}/>
   <Text y={339} small>名前を選んでも、コードは実行されない</Text>
  </>}
 </>}</BoundaryCanvas>} controls={({stage,ready})=>stage===5?<Select label="隔離技術の類型" value={technology} onChange={setTechnology} ready={ready}>{Object.entries(technologies).map(([value,labels])=><option key={value} value={value}>{labels[0]}</option>)}</Select>:null}>{children}</BoundaryFigure>
}
export function SandboxLifecycleEgress({children}){
 const id=useId(),[mode,setMode]=useState('ephemeral'),[missing,setMissing]=useState('environment'),[network,setNetwork]=useState('blocked'),[outputs,setOutputs]=useState('pending')
 const release=sandboxRelease({environmentDestroyed:missing!=='environment',resourcesReleased:missing!=='resources',returnedOutputsChecked:missing!=='outputs'})
 const egress=sandboxEgress({networkRequired:network!=='blocked',destinationAllowed:network==='allowed',internalTarget:network==='internal',hostOutputsChecked:outputs==='checked'})
 return <BoundaryFigure diagram="sandbox-lifecycle-egress" title="終了・通信・戻す出力を、別々に確認する。" scene={({phase})=><BoundaryCanvas diagram="sandbox-lifecycle-egress" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['セッションと状態の範囲を、先に結ぶ','保持するものと、resetする範囲を決める','処理の終了を、破棄完了へ変換しない','外向き通信と、ホストに戻す出力を分ける','暴走する資源と時間を、上限で止める','依存を持ち込む入口と、保存先を点検する','テナント間で、状態と出力を持ち越さない'][stage]}</Text>
  {stage===0?<>
   <Tokens labels={['生成','利用','終了']} y={96} selected={[0,1,2]}/>
   <BoundaryPair id={id} phase={phase} y={207} left={[mode==='ephemeral'?'使い捨て':'永続セッション','セッションを識別','保存の許可を確認','終了時の出口を決める']} right={[mode==='ephemeral'?'破棄を確認':'状態を限定して保持','秘密を持ち越さない','返却出力は別に点検','他テナントへ流さない']}/>
  </>:stage===1?<BoundaryPair id={id} phase={phase} left={['保持する状態','ファイル・依存・作業','必要な範囲を限定','汚染の持越しを点検']} right={['resetする範囲','秘密と一時データ','テナントの境界','保存の許可は別途']}/>:stage===2?<g data-sandbox-release-candidate={String(release.cleanupReviewCandidate)} data-sandbox-deletion-executed="false">
   <Tokens labels={['環境の破棄','資源の解放','出力の点検']} y={93} selected={[0,1,2]}/>
   <Box x={64} y={209} width={512} height={154} title={release.cleanupReviewCandidate?'終了条件を照合する候補':'残った終了条件を確認する'} lines={['環境が閉じても、出力は残りうる','図は環境・ファイルを削除しない','破棄済みの実証は運用側で確認']} tone={release.cleanupReviewCandidate?'teal':'amber'}/>
  </g>:stage===3?<g data-sandbox-network={egress.network} data-sandbox-output-review-pending={String(egress.outputReviewPending)} data-sandbox-transmission-executed="false">
   <BoundaryPair id={id} phase={phase} arrow={false} left={['外向きの通信',egress.network==='route-candidate'?'許可先を照合する候補':'通信は閉じたまま','内部宛先を制限','DNS・redirectも点検']} right={['ホストへ戻す出力',egress.outputReviewPending?'出力の点検が残る':'出力の点検条件を照合','秘密・成果物を確認','通信制限とは別の出口']}/>
   <Text y={339} small>ネットワークを閉じても、出力の出口は残る</Text>
  </g>:stage===4?<>
   <Tokens labels={['CPU・メモリ','時間・回数','容量・出力']} y={103} selected={[0,1,2]}/>
   <Box x={64} y={232} width={512} height={133} title="超過時は、停止と回復の経路へ" lines={['予算とタイムアウトを組み合わせる','実行終了と資源回収を別々に確認']} tone="amber"/>
  </>:stage===5?<BoundaryPair id={id} phase={phase} left={['依存の入口','許可した取得先','版と検証を固定','任意のinstallを制限']} right={['依存を置く範囲','ベース環境か一時領域','保存と更新の責任','次セッションへの持越し']}/>:<BoundaryPair id={id} phase={phase} arrow={false} left={['テナントA','状態と資源の上限','入力・秘密・返却出力','境界をA内で確認']} right={['テナントB','別の状態と上限','別の入力・返却出力','Aの状態を継承しない']}/>}
 </>}</BoundaryCanvas>} controls={({stage,ready})=>stage===0?<Select label="セッションの寿命" value={mode} onChange={setMode} ready={ready}><option value="ephemeral">使い捨て</option><option value="persistent">永続</option></Select>:stage===2?<Select label="終了時の未確認" value={missing} onChange={setMissing} ready={ready}><option value="environment">環境の破棄</option><option value="resources">資源の解放</option><option value="outputs">返却出力の点検</option><option value="none">終了条件を照合</option></Select>:stage===3?<><Select label="通信先の条件" value={network} onChange={setNetwork} ready={ready}><option value="blocked">外向き通信を閉じる</option><option value="allowed">必要な許可先へ限定</option><option value="internal">内部宛先を指定</option></Select><Select label="返却出力の点検" value={outputs} onChange={setOutputs} ready={ready}><option value="pending">未確認</option><option value="checked">確認条件を照合</option></Select></>:null}>{children}</BoundaryFigure>
}
