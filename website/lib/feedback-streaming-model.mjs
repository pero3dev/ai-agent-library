import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const FEEDBACK_STREAMING_STAGES=Object.freeze({
 'optimization-failure-cycle':rows([
  ['評価が土台','具体的な失敗と判定基準から改善を始める。','評価セットと変更管理が前提です。図は原文の改善サイクルを示し、実際の精度を測りません。'],
  ['症状を分類','頻度・影響・費用を見て、症状から調査先を分ける。','低頻度でも重大な漏えい・誤操作を先に扱います。表の対策は原因仮説であり、確定診断ではありません。'],
  ['仮説と原因','プロンプト外の原因も確認し、反証できる変更案にする。','検索・ツール・文脈の不足を、指示の追加だけで直そうとしません。根拠不足と根拠の誤読も分けます。'],
  ['最小変更','一箇所ずつ比較し、組合せは寄与を切り分ける。','複数要素を変える場合も、各要素を外す比較で効果を確認します。図に架空の点数を置きません。'],
  ['改善と非劣化','狙いの改善だけでなく、他のケースと未使用判定を確認する。','プロンプト変更は他のケースへ波及します。開発用だけの成功を採用条件へ変換しません。'],
  ['採否を記録','棄却理由も残し、本番確認と失敗の還流へつなぐ。','採用・棄却を版と評価へ結び付けます。図の候補確認から本番変更や性能保証は行いません。']
 ]),
 'optimization-search-boundaries':rows([
  ['候補と評価','候補生成・評価・選択を反復する構造を見る。','自動最適化の導入判断には、評価との接続・記録・費用が要ります。製品名や必要件数は補完しません。'],
  ['LLMの提案','書換え・批評・生成を、未検証の仮説として扱う。','もっともらしさだけで採用せず、同じLLMの自己評価にも偏りがあり得ます。'],
  ['導入の前提','判定器・データ分離・生成元の記録を先に確かめる。','判定器が甘ければ、それを騙す候補が選ばれます。安全性などを自動評価だけで保証しません。'],
  ['三方向の過適合','評価セット・判定器・モデル時点への適合を区別する。','未使用ケース、判定器の検証と人手照合、モデル更新時の再評価で確認します。'],
  ['運用へ接続','レビューと回帰・オンライン評価・失敗還流へ戻す。','最適化は単発の点数競争で終わりません。原文の未確認の製品動向は未確認のまま保持します。']
 ]),
 'feedback-observation-design':rows([
  ['観測の責任','実行時の観測入力と、開発時の評価を区分する。','結果整形と検証器は次の行動へ返す部品です。生ログを返すだけで理解や回復を保証しません。'],
  ['結果を整形','生・要約・構造化の代償を、次の判断に合わせる。','長大な出力は省略と続きの所在を明示し、状態・識別子を優先します。成功と副作用の結果も返します。'],
  ['原因と制約','原因・修正候補・できる範囲を、エラーへ含める。','原文の日付形式と過去30日以内という照会例を保持します。内部のstack traceを丸投げしません。'],
  ['回復できるか','モデルが直せない失敗は停止・エスカレーションへ分ける。','認証失効や対象消失を無条件に再試行しません。失敗を隠して成功に変換しません。']
 ]),
 'feedback-verifier-control':rows([
  ['検証を配置','決定的検証から、モデル・人の確認へ絞り込む。','テスト・型・スキーマで確認できる範囲を先に扱います。どの検証も全成果の正しさは保証しません。'],
  ['モデルと人','開放的品質は基準付き判定と、人の要所の確認へ。','judge自体を検証し、重要操作の承認を別に扱います。図の操作で実際の承認は行いません。'],
  ['具体的に返す','何がどう失敗したかを、修正する入力へ戻す。','もう一度考えて、だけでは改善を保証しません。成功時も元の課題の成果を照合します。'],
  ['回数と迷走','回復可能性・残る予算・同じ誤りの反復で経路を分ける。','原文は上限を設ける設計で、全タスク共通の回数は指定していません。図は再試行を実行しません。'],
  ['検証を守る','検証器をモデルの書換え権限外へ置く。','テスト書換え・assertion無効化・見せかけの正常終了を成功にしません。緑だけで元の課題の達成を判断しません。'],
  ['再検査と軌跡','修正後の関連検証と、成果・変更経路を照合する。','別の検査を壊していないか確認します。開発時の軌跡確認と実行時の検証を関連する別責任として扱います。']
 ]),
 'stream-progress-surface':rows([
  ['待つ場所','推論・ツール・外部APIの待ちを、ユーザーへ伝える。','原文の数十秒〜数分は一般的な説明で、この図の実測ではありません。動いているかを理解できる表示を設計します。'],
  ['部分と完了','逐次表示の部分テキストを、完了した結果と分ける。','途中でツール呼出しやエラーへ進むことがあります。SSEの成功開始だけで最終成果を成功扱いしません。'],
  ['進捗に翻訳','ツールの状態をユーザーの語彙へ変換する。','生の入出力を流さず、秘密情報・個人情報を出力レビューの対象へ含めます。架空の進捗率は作りません。']
 ]),
 'stream-cancellation-state':rows([
  ['裏まで停止','UI・ループ・実行中ツールの停止を照合する。','ループが止まっても、完了した送信・更新は巻き戻りません。取消不能な作用は状態照会と必要な補償へ進みます。'],
  ['保全して中断','途中経過を保存し、再開・引継ぎできる形で止める。','中断を単なるエラーにせず、保存の有無を確認します。画面を閉じるだけで復旧は得られません。'],
  ['チャットかジョブ','対話で軌道修正する経路と、長い仕事の受付・照会・通知を分ける。','原文の時間目安とタスク特性を合わせて検討します。非同期APIだけでジョブが永続化するとは扱いません。'],
  ['状態を保存','呼出しIDと実行状態を保持し、重複起動を防ぐ。','追加指示を受けたら対象・引数・承認を再評価します。指示の受付と反映、実行済みの作用を区分します。'],
  ['遅れた結果','停止後の結果は元の実行へ記録し、採用を判断する。','新しい条件の実行へ自動で混ぜません。停止済みでも完了した外部操作の事実を表示します。'],
  ['APIとジョブ','非同期ツール・steeringと、永続化・復旧の責任を分ける。','原文のAstra例とcall_idの対応を保持します。APIの採用だけで重複防止・再起動後の復旧は完成しません。']
 ])
})
export function feedbackStreamingFrame(diagram,phase){const stages=FEEDBACK_STREAMING_STAGES[diagram];if(!stages)throw TypeError('Unknown feedback streaming diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
export function optimizationCandidate({improved,nonDegraded,unusedJudgment}){if([improved,nonDegraded,unusedJudgment].some(v=>typeof v!=='boolean'))throw TypeError('Explicit evaluation required');return {candidateReady:improved&&nonDegraded&&unusedJudgment,productionChanged:false}}
export function feedbackRetry({recoverable,budgetRemaining,repeated}){if([recoverable,budgetRemaining,repeated].some(v=>typeof v!=='boolean'))throw TypeError('Explicit loop state required');return {next:!recoverable?'stop':!budgetRemaining||repeated?'escalate':'retry',actionExecuted:false}}
export function streamStop({loopStopped,externalCompleted,checkpointSaved}){if([loopStopped,externalCompleted,checkpointSaved].some(v=>typeof v!=='boolean'))throw TypeError('Explicit execution state required');return {loopStopped,externalEffectRemains:externalCompleted,resumeCandidate:loopStopped&&checkpointSaved,externalUndone:false}}
