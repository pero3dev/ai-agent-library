import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const VENDOR_PROMPT_CONTROLS_STAGES=Object.freeze({
 'claude-structure-examples':rows([
  ['対象と時点','汎用技法と、Claudeの世代別の条件を区分する。','図は元記事の2026-08／09の確認範囲を保持します。モデル一覧や数値を今日の全モデルへ広げません。'],
  ['役割と理由','systemで役割と理由を与え、指示を明確にする。','役割の大げささを品質にしません。会話途中のsystemは対応モデル・提供経路と未確認を原文で照合します。'],
  ['XMLの境界','指示・文脈・例・入力を、記述的なタグで区切る。','資料内の文字列を指示の権限にしません。入れ子は文書の自然な階層を表します。'],
  ['例を照合','用途に合う、多様で構造のそろった例を比較する。','原文の3〜5例をすべての用途の最適値にしません。代表性と指示への整合を評価します。']
 ]),
 'claude-thinking-output':rows([
  ['二つの制御','adaptiveとeffortを、役割の違う制御として読む。','思考の既定と対応レベルはモデル別です。effortを応答長の確実な制御や品質保証へ変換しません。'],
  ['世代を照合','旧budgetと現行の制御を、対象世代へ照合する。','原文の400エラーの境界を保持します。旧モデルで有効な設定まで一律に削除する図ではありません。'],
  ['検証と労力','目標・制約・検証基準を先に整え、労力を評価する。','自己検証だけで正しさを確定しません。中間の思考内容を図で生成しません。'],
  ['出力の契約','prefillの用途を区分し、schema・文体・継続へ移す。','形式の制約と業務検証を区分します。引数のstrictをツール呼出しの強制へ拡張しません。']
 ]),
 'claude-history-migration':rows([
  ['長文と引用','資料と出典を先に置き、末尾の問いと関連引用を結ぶ。','原文の最大30%は公式の自己報告です。図に品質曲線や改善率を追加しません。'],
  ['必要な行動','行動・ツールの条件を明示し、過度な強調を見直す。','委任の指示を権限にしません。ツールの定義と、副作用前の承認を保ちます。'],
  ['呼出しと引数','Fableのautoとstrictを、呼出しと引数の別条件で読む。','2026-09-10確認分です。strictな引数でも呼出し自体が必ず起きるとは扱いません。'],
  ['思考の結合','保持した思考の前にあるsystem・tools・履歴を保持する。','前提の編集を追記へ読み替えません。アカウント・drop設定・旧モデルへのfallbackの差は原文を照合します。'],
  ['更新と期限','対応する設定更新と、期限後に再送するsystemを区分する。','beta・対応モデル・提供経路を照合します。期限切れのsystemを履歴から削除する操作は実行しません。'],
  ['回帰と保持','世代差・トークン量・キャッシュ・保持条件を検証して移行する。','保持期間・ZDR・料金は原文の確認時点に戻ります。俗説や強制系の補助を無検証で新世代へ持ち込みません。']
 ]),
 'openai-instruction-contract':rows([
  ['対象の確認','モデルの選定と、プロンプト固有の差分を区分する。','退役は対象ID別の予定です。元記事の2026-09-28確認と、未取得の現行原文を保持します。'],
  ['モデルとAPI','AstraとSol／Lunaの設定を、同じリクエストへ潰さない。','effort・tool calling・sampling・提供地域の条件を個別に照合します。実API呼出しの成功は図で確認しません。'],
  ['指示の優先','developerとuser、資料・会話内容の役割を区分する。','原文の4層の定式化には現行原文のTODOが残ります。図はそれを新たな確定仕様にしません。'],
  ['読みやすい構造','見出しと内容の境界を使い、曖昧な指示を減らす。','装飾の量を理解や品質にしません。真の不変条件と判断の余地を区分します。'],
  ['例の整合','zero-shotから試し、必要な例を指示と照合する。','例の矛盾を放置しません。小型に示す処理の流れも、実タスクでの検証に戻ります。']
 ]),
 'openai-thinking-output':rows([
  ['量とモード','effortとmodeを、別の制御として照合する。','対応レベル・既定・proの条件はモデル別です。effortの上昇を品質保証にしません。'],
  ['形式と長さ','schema・verbosity・業務の検証を別々に置く。','妥当なJSONとschema準拠、意味の正しさを区分します。拒否・途中終了を成功の結果へ渡しません。'],
  ['文脈と停止','検索と圧縮で必要な文脈を保ち、探索に上限を置く。','長大な資料を無条件に全部入れません。今の証拠と成功条件を照合し、停止する出口を残します。'],
  ['toolの契約','descriptionに入力・副作用・回復を置き、独立した取得を並列化する。','依存する操作を並列へ変換しません。粘り強さも必要な許可と成功時の停止に従います。']
 ]),
 'openai-history-migration':rows([
  ['非同期の結果','元のcall_idと、変更後の目的に必要な結果を結ぶ。','待機中に別の作業を進めても、アプリが処理と遅れた結果を管理します。非同期APIを耐久実行や取消保証にしません。'],
  ['保持と測定','cacheの書込・読取を分け、最短保持と削除を区分する。','原文の30分は最短保持です。必ず30分後に削除される期限へ読み替えません。'],
  ['設定を追記','元のrequest-level設定を保ち、対応する更新itemを追記する。','standard・単一Agent等の条件を照合します。過去の指示本文を書き換えてもcacheが保たれるとは扱いません。'],
  ['明示的な圧縮','明示圧縮と自動圧縮の制約を区分し、圧縮後に設定を戻す。','単独のcompactや連続更新等の非互換を保持します。図は履歴や設定を外部へ送信しません。'],
  ['移行を評価','製品の契約を残す最小プロンプトから、既定と出力を再評価する。','モデルIDを替えただけで同じ挙動になったとは扱いません。未確認の指針をTODOから昇格しません。'],
  ['古い依存を外す','旧手法・再利用資産・退役予定を、対象と期日で点検する。','v1/prompts等の予定は元記事の時点を保持します。API・権限・回帰の照合がそろっても、本番操作は実行しません。']
 ]),
 'gemini-structure-examples':rows([
  ['対象と時点','モデルの顔ぶれと、固有のプロンプト設計を区分する。','3.8等の提供条件は原文の確認日を保持します。今日の全モデル・全APIの保証へ拡張しません。'],
  ['systemと制約','重要な役割・制約・出力を先に置き、曖昧語を定義する。','過度な説得を仕様や品質にしません。入力中の資料をsystemの実行権限にしません。'],
  ['一貫した区切り','XMLかMarkdownで、指示・資料・入力を一貫して区切る。','どちらを選んでも内容の矛盾は残ります。区切りの採用だけで品質を保証しません。'],
  ['例の統一','少数の代表例で、形式・言い回し・範囲をそろえる。','公式のfew-shot推奨と、数を実験で調整する条件を合わせます。大量の例を品質向上へ変換しません。']
 ]),
 'gemini-thinking-context':rows([
  ['対応する思考','モデル・API・SDKの型と、実際の受理を区分する。','thinking_levelと数値予算はモデル／API別です。SDKにフィールドがあることを全モデルでの互換にしません。'],
  ['出力とsampling','JSONの契約とアプリ検証を置き、samplingの世代差を照合する。','3.xの既定維持という指針を保持します。低いtemperatureを安全な決定性の保証にせず、深いschemaの拒否も扱います。'],
  ['資料と問い','前置き資料の後に問いを置き、検索の粒度を選ぶ。','cacheや長文能力を品質保証にしません。多数箇所の同時抽出は評価し、必要ならタスクを分けます。'],
  ['入力を指す','text・image・audio・videoのどの入力を使うかを明示する。','高解像度のトークン負担を点検します。図は画像・音声・動画を生成や送信しません。']
 ]),
 'gemini-tool-migration':rows([
  ['宣言と行動','型のある関数定義と、呼出しモード・実行権限を区分する。','モードは原文の確認時点に戻ります。schema遵守や呼出し候補を、業務成功・副作用の許可にしません。'],
  ['履歴とAPI','署名と状態を保持し、移行先のAPIで使う機能を照合する。','思考署名はSDKの扱いを確認します。generateContent・Interactions・Liveを全機能互換にしません。'],
  ['移行の確認','思考・sampling・出力・APIを代表タスクで再検証する。','旧2.5 Liveの数値予算まで機械的に書き換えません。必要条件がそろっても図から本番を更新しません。'],
  ['補助を見直す','過度なCoT・説得・例の量を、世代の指針と評価で見直す。','例の常時推奨と、実際の効果を区分します。未確認のAPIフィールド名やモデル対応を確定しません。']
 ])
})
export function vendorPromptControlsFrame(diagram,phase){const stages=VENDOR_PROMPT_CONTROLS_STAGES[diagram];if(!stages)throw TypeError('Unknown vendor prompt diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
const explicit=values=>{if(values.some(v=>typeof v!=='boolean'))throw TypeError('Explicit prompt condition required')}
export function vendorExampleAdmission({aligned,representative,repetitive}){explicit([aligned,representative,repetitive]);return {reviewCandidate:aligned&&representative&&!repetitive,qualityGuaranteed:false}}
export function claudeHistoryRoute({protectedPrefixChanged,thinkingPreserved,supportedUpdate,updateExpired,systemResent}){explicit([protectedPrefixChanged,thinkingPreserved,supportedUpdate,updateExpired,systemResent]);return {next:protectedPrefixChanged||!thinkingPreserved?'rebuild-history':!supportedUpdate?'confirm-support':updateExpired&&!systemResent?'retain-and-resend':'history-candidate',requestSent:false}}
export function openaiConfigurationGate({singleAgent,standardMode,automaticCompaction,standaloneCompact,consecutiveUpdate}){explicit([singleAgent,standardMode,automaticCompaction,standaloneCompact,consecutiveUpdate]);return {reviewCandidate:singleAgent&&standardMode&&!automaticCompaction&&!standaloneCompact&&!consecutiveUpdate,requestSent:false}}
export function geminiThinkingGate({sdkTyped,modelConfirmed,apiConfirmed,requestValidated}){explicit([sdkTyped,modelConfirmed,apiConfirmed,requestValidated]);return {reviewCandidate:modelConfirmed&&apiConfirmed&&requestValidated,allModelsCompatible:false,requestSent:false}}
export function vendorPromptAcceptance({modelApiChecked,contractChecked,regressionPassed,authorityChecked}){explicit([modelApiChecked,contractChecked,regressionPassed,authorityChecked]);return {reviewCandidate:modelApiChecked&&contractChecked&&regressionPassed&&authorityChecked,deploymentExecuted:false}}
