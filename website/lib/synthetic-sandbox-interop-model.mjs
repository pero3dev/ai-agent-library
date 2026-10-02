import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const SYNTHETIC_SANDBOX_INTEROP_STAGES=Object.freeze({
 'synthetic-purpose-generation':rows([
  ['学習用の範囲','FT・蒸留の必要性を確認し、学習用と評価用の正本を区分する。','プロンプトやRAGで足りるなら学習データ作成へ飛びません。図はデータ・モデル出力を生成しません。'],
  ['用途を先に','SFT・蒸留・選好ペア・実データ拡張で、作るものを変える。','目的を決めずに大量生成しません。同じ形式のデータで全用途を済ませる図にはしません。'],
  ['seedと条件','良質なseedと条件の多様化から、生成する範囲を決める。','seedの偏りは増幅されえます。ペルソナを増やすだけで分布や独立性を確保したとは扱いません。'],
  ['生成と選別','生成器から候補を受け、検証器で残すものを選ぶ。','自己生成にも教師出力にも選別が要ります。大量生成やもっともらしさを品質の証拠にしません。'],
  ['教師を選別','教師出力の正しさ・形式・利用条件を確かめて学習候補へ渡す。','教師の出力を自動的に正解へ昇格しません。利用規約と契約の確認は学習前に別途行います。']
 ]),
 'synthetic-quality-separation':rows([
  ['検証と人手','決定的な検証・モデル判定・独立ラベル・抜取確認を合わせる。','生成器と同系の判定には盲点の共有があります。フィルタだけで正解ラベルの信頼性を保証しません。'],
  ['多様性を測る','重複・近重複・表現の分散を測り、単調化を見つける。','サンプル数を多様性へ変換しません。図の模式区間は実データの比率や品質スコアではありません。'],
  ['再帰学習のリスク','自己生成の反復と、実データによる補強を区分する。','裾の喪失やスタイルの単調化を確認します。実データを混ぜることを崩壊回避の保証にせず、混合率を新たに指定しません。'],
  ['教師の利用条件','利用する教師モデルの規約と契約を、用途に照合する。','提供者・対象モデル・時点で条件が変わります。公開重みや自社モデルという分類だけで法的適合を認定しません。'],
  ['seedから分離','学習と評価をseed・生成経路から分け、独立した評価で汚染を点検する。','同じseedの言い換えを独立した評価へ混ぜません。スコア上昇を実力向上へ自動変換しません。'],
  ['学習前の確認','目的・検証・多様性・人手・実データ・規約・評価分離を合わせる。','すべて確認した状態は学習を検討する候補です。品質・利用許諾・学習の成功は保証しません。']
 ]),
 'sandbox-isolation-selection':rows([
  ['守る対象','ホスト・ネットワーク・データ・他セッションを要件へ置く。','生成コードも非信頼入力です。図は任意コードを実行せず、隔離技術を安全認証へ変換しません。'],
  ['共有kernel','プロセス分離と標準コンテナの、共有するカーネルを見分ける。','namespaceやseccomp・制限だけでカーネル共有が消えるわけではありません。任意コードでの脱出を想定します。'],
  ['アプリ用kernel','ユーザー空間のアプリ用カーネルで、直接の露出を減らす。','gVisorの境界・互換性・負担を照合します。ホストに一切アクセスしないという図にはしません。'],
  ['ゲストkernel','microVMの仮想化境界と、デバイス・設定・更新を点検する。','Firecrackerの公開起動性能を採用構成の保証へ転用しません。VM脱出と設定不備への対策は残ります。'],
  ['Wasmとhost機能','線形メモリ・制御フローを隔離し、許可したhost機能を絞る。','外部入出力はimport・WASI等の能力次第です。許可した機能の悪用やruntimeの脆弱性は消えません。'],
  ['実装を比較','7類型を、必要な境界・起動条件・運用負担へ照合する。','ブラウザは利用者側の保護、managedは責任分界も確認します。技術名だけで安全性や速度の順位を作りません。']
 ]),
 'sandbox-lifecycle-egress':rows([
  ['生成と利用','使い捨てか永続かを決め、セッションと状態の範囲を結ぶ。','使い捨てでも終了を破棄完了にしません。永続化は秘密や一時データを保存する許可ではありません。'],
  ['保持とreset','残すファイル・依存・作業状態と、戻す範囲を明示する。','状態の継続には汚染や持ち越しのリスクがあります。別テナントへ状態を引き継ぎません。'],
  ['破棄を確認','不要な環境・データ・資源の破棄と、返却した出力を点検する。','実行を止めただけでは環境・資源の破棄を確認できません。図の操作は削除を実行しません。'],
  ['通信と返却','ネットワークを既定遮断し、許可宛先とhostの返却経路を分ける。','内部ネットワーク・メタデータへの到達も制限します。通信遮断だけでファイル・ログ・応答の検査を済ませません。'],
  ['資源と打切り','CPU・メモリ・時間・ディスク・ファイル数・再試行へ上限を置く。','無限ループや大量生成で基盤を巻き込ませません。本文にない上限値や推奨秒数は追加しません。'],
  ['依存を制御','許可した依存・事前イメージ・proxyと、offline実行を合わせる。','任意のpackage installを許可せず、供給経路を絞ります。事前準備だけで安全性を保証しません。'],
  ['テナント境界','要件に応じた隔離水準と、テナントごとの資源上限を置く。','共有度と分離のtrade-offを測ります。1テナントの暴走やデータを他のテナントへ波及させません。']
 ]),
 'interop-tool-peer-structure':rows([
  ['呼ぶと任せる','toolの入出力と、自律したpeerへのタスク委譲を区分する。','MCPとA2Aは相補的な層です。peerの内部メモリ・道具を共有することを連携の前提にしません。'],
  ['発見と広告','cardで相手と能力を見つけ、タスクに合う候補へ絞る。','能力の広告は能力の実証でも認可でもありません。発見できたことを信頼へ昇格しません。'],
  ['委譲と状態','依頼を渡し、長いタスクの状態と会話の文脈を保持する。','即答と非同期タスクを区分します。progress・要入力・完了・失敗を同じ単発応答へ押し込みません。'],
  ['進捗と成果物','polling・streaming・通知で状態と成果物を受け取り、結果を検証する。','進捗の受信や完了の宣言を、自タスクの成功へ変換しません。状態と成果物を別に確認します。'],
  ['認証と認可','広告した認証方式で相手を確かめ、個別実装が委譲範囲を決める。','搬送する認証情報をcardへ静的秘密として埋めません。認証済みでも何でも任せてよいとは扱いません。']
 ]),
 'interop-trust-update':rows([
  ['組織の認可','搬送層で身元を確かめ、能力・データ・ポリシーで認可する。','認可は実装固有です。重い委譲では同意・真正性・説明責任の記録も確認します。'],
  ['相手ごとの範囲','社内・契約partner・公開の相手ごとに委譲範囲を設計する。','社内という分類だけで全権限へ広げません。高リスクの委譲と未知の相手を同じ条件で扱いません。'],
  ['既知の相手から','既知の相手か自前catalogueに絞り、許すタスクを分類する。','動的発見を自動委譲の許可にしません。登録情報と認証・能力・許可範囲を別々に照合します。'],
  ['開示と応答','通信保護・最小開示・応答検証で、peer由来の攻撃面を抑える。','相手は外部アプリとして扱います。機微な能力とデータを保護し、応答の指示を実行権限へ変換しません。'],
  ['中核と周辺','発見・委譲・taskを使い、認可・ID・registryの変化を層で吸収する。','版数・財団・成熟度は原文の確認時点を保持します。現在の標準状態を図で新たに保証しません。'],
  ['委譲の確認','相手・身元・許可範囲・最小開示を合わせて委譲を検討する。','条件をそろえた状態は確認候補です。peerを無条件に信頼せず、実際の送信・委譲・決済は実行しません。']
 ])
})
export function syntheticSandboxInteropFrame(diagram,phase){const stages=SYNTHETIC_SANDBOX_INTEROP_STAGES[diagram];if(!stages)throw TypeError('Unknown synthetic sandbox interop diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
const explicit=values=>{if(values.some(v=>typeof v!=='boolean'))throw TypeError('Explicit boundary state required')}
export const SYNTHETIC_CONDITIONS=Object.freeze(['purpose','validation','diversity','humanCheck','realData','terms','evaluationSeparation'])
export function syntheticAdmission(conditions){const values=SYNTHETIC_CONDITIONS.map(key=>conditions[key]);explicit(values);return {reviewCandidate:values.every(Boolean),trainingExecuted:false,qualityGuaranteed:false,legalComplianceGuaranteed:false}}
export function syntheticEvaluationSeparation({seedsDisjoint,pathsSeparated,independentEvaluation}){explicit([seedsDisjoint,pathsSeparated,independentEvaluation]);return {reviewCandidate:seedsDisjoint&&pathsSeparated&&independentEvaluation,independenceGuaranteed:false}}
export function sandboxEgress({networkRequired,destinationAllowed,internalTarget,hostOutputsChecked}){explicit([networkRequired,destinationAllowed,internalTarget,hostOutputsChecked]);return {network:networkRequired&&destinationAllowed&&!internalTarget?'route-candidate':'blocked',outputReviewPending:!hostOutputsChecked,transmissionExecuted:false}}
export function sandboxRelease({environmentDestroyed,resourcesReleased,returnedOutputsChecked}){explicit([environmentDestroyed,resourcesReleased,returnedOutputsChecked]);return {cleanupReviewCandidate:environmentDestroyed&&resourcesReleased&&returnedOutputsChecked,deletionExecuted:false}}
export function peerDelegation({knownPartner,identityVerified,scopeAllowed,disclosureMinimized}){explicit([knownPartner,identityVerified,scopeAllowed,disclosureMinimized]);return {reviewCandidate:knownPartner&&identityVerified&&scopeAllowed&&disclosureMinimized,messageSent:false,peerTrustedUnconditionally:false}}
