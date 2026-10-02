import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const RELEASE_RESPONSE_STAGES=Object.freeze({
 'version-composition-pinning':rows([
 ['組合せ全体','コードだけでなく、生成と評価の構成全体を版として読む。','同じ組合せの特定は、同じ出力の決定性や外部状態の完全再現を保証しません。'],
 ['六つの構成','コード・prompt・tool・モデル・設定・評価側を一緒に記録する。','評価側の版は品質の物差しです。アプリだけ同じでも、挙動と採点の条件が同じとは扱いません。'],
 ['応答へ結ぶ','当時の応答から、実行した組合せへ遡れるようにする。','模式の照合は記録設計の候補で、実トレースや実行の復元ではありません。'],
 ['変更の経路','prompt・tool・設定も履歴・レビュー・回帰へ載せる。','DBや管理画面での直接編集はこの経路を迂回します。図は資産を編集せず、緊急時も準備したフラグへ戻します。'],
 ['指定の違い','snapshotの指定と、ベンダー更新を受けるaliasを区別する。','提供形態はベンダー別の原文TODOで確認します。pinを全製品の永久提供や品質保証にしません。'],
 ['期限を持つ','旧モデルの廃止を、期限付きの評価と移行へつなぐ。','図に実モデルの廃止日を設定しません。プラットフォーム別の告知・期限を確認し、原文2026-07のTODOを保ちます。']
 ]),
 'version-rollout-migration':rows([
 ['評価の限界','評価スイート外の分布を、段階リリースで点検する。','段階を経ただけで未知の全入力を保証しません。図は実ユーザーへ変更を配信しません。'],
 ['配信を分ける','shadow・canary・全量で、ユーザーと新構成の範囲を分ける。','shadowの新結果はユーザーへ返さず、副作用のあるtoolを実行しません。二構成を処理する費用との交換条件です。'],
 ['旧構成へ戻す','事前に用意したフラグと旧構成で、デプロイなしの切替を準備する。','存在するだけのフラグを動作確認済みへせず、切替を既に送信した通知や書込の取消にしません。'],
 ['物差しから','judgeも更新するなら、人手ラベルで先に再検証する。','新judgeの合格だけでAgentの品質向上を確定しません。物差しを変えた条件を明示します。'],
 ['差分を読む','全評価・新たな失敗ケース・prompt調整を経て段階移行する。','平均が同じでも新しい失敗を読む。図の必要条件照合は移行検討の候補で、実評価や実採用ではありません。'],
 ['期限内の経路','新構成の安定まで旧構成を残し、廃止期限まで戻す経路を保つ。','提供終了後の旧モデルへ戻れるとは扱いません。廃止対応を締切直前の無評価な切替にしません。']
 ]),
 'incident-detection-containment':rows([
 ['五つの型','暴走・費用・品質・危険な作用・外部依存を分けて読む。','技術エラーの有無だけで品質や副作用の安全を確定しません。'],
 ['五つの段階','検知から封じ込め、影響特定、補償、再発防止へ進む。','封じ込めは以後の拡大を抑える設計です。既に起きた誤った作用は別に特定と補償が必要です。'],
 ['複数の信号','技術・回数の裾・費用の速さ・品質・toolの変化を併せて見る。','模式の信号選択を原因の確定や実アラートにしません。平均だけで暴走の裾を隠しません。'],
 ['静かな劣化','遅行する品質信号と利用者報告を、集約とトリアージへつなぐ。','正常終了の誤答や低頻度で重大な作用を残します。個別対応の終了をインシデント検知の完成にしません。'],
 ['事前に準備','粒度を選べる停止・縮退を、デプロイなしで発動できるようにする。','フラグの配置だけを実発動や成功した演習へ変換しません。図は機能やtoolを停止しません。'],
 ['範囲を選ぶ','自動遮断・書込tool・縮退・特定範囲・全停止を使い分ける。','書込だけを外して読取を維持する選択と、代替手段へ移る選択を読む。自律度を下げても既作用は取り消しません。']
 ]),
 'incident-effects-learning':rows([
 ['対象を特定','問題の構成版とtool呼出しから、影響セッションを抽出する。','属性が揃ったことは原因の確定や全件の影響特定を意味しません。図は実ログを検索しません。'],
 ['作用を洗う','書込・送信・更新を、操作の時刻・対象・内容から洗い出す。','構成のロールバックと作用の補償を分けます。ログがなければ人手の全件調査が必要になり得ます。'],
 ['補償の違い','巻戻せる書込と、送信済みの通知を区別する。','送信済み通知は取り消せません。訂正の検討と実送信を分け、取り消せない操作には平時から承認ゲートを置きます。'],
 ['失敗を資産へ','問題の入力・状況を回帰ケースとガードへ還流する。','ケース追加だけで再発を永久に防止したとは扱いません。図はケースを保存しません。'],
 ['遅れを直す','検知・封じ込め・復旧の遅れから、改善対象を選ぶ。','監視、粒度、操作ログと補償の設計を分けて直します。復旧しただけで対応を閉じません。'],
 ['平時に演習','振り返りとrunbookを更新し、停止手段を平時に試す。','模式の条件選択は演習の実施証拠ではありません。利用ベンダーのstatus・SLA・切替先は原文TODOで確認します。']
 ]),
 'feedback-signals-collection':rows([
 ['一周を作る','シグナルを集め、改善を評価し、利用者の品質へ戻す。','収集ボタンの配置を改善の成立へ変換しません。図は行動や自由記述を収集しません。'],
 ['右半分を作る','トリアージ・評価ケース・対策・回帰と公開まで経路をつなぐ。','データを蓄えるだけで変更が起きたとは扱いません。実際の品質を確かめて一周を閉じます。'],
 ['二つの信号','明示的な理由と通常操作の信号を、異なる偏り付きで読む。','回答者の偏りと暗黙の解釈を保つ。編集や再試行を不満や利用者の意図に一対一で変換しません。'],
 ['代理を点検','タスクの品質を代理する指標を、人の成果や理由と照合する。','暗黙の指標を必ず主指標にしません。模式の照合は指標検討の候補で、実際の妥当性検証ではありません。'],
 ['応答とイベント','trace IDで当時へ戻り、必要なUIイベントを先に設計する。','編集開始・送信・破棄などがなければ、過去の修正率を作れません。低負担な収集も実利用者と比べて測ります。'],
 ['必要な範囲','自由記述と行動ログの目的・範囲・保持・アクセスを揃える。','traceへの結合やマスクだけで収集・利用の許可を保証しません。図は情報を送信せず、法的適合を判定しません。']
 ]),
 'feedback-triage-release':rows([
 ['分類と優先','個別スコアを失敗モードへ分類し、頻度と影響を読む。','平均の横ばいだけで新しい失敗を隠しません。模式の積は優先順位の検討材料で、実被害や唯一の優先基準ではありません。'],
 ['ケースへ戻す','代表ケースは、利用条件とマスクを点検して評価へ流す。','マスクを利用許可にしません。既知の開発ケースを未見の採用評価へ変換せず、元の評価運用へ戻します。'],
 ['対策を広げる','prompt・検索・tool、要件と期待値まで対策を比較する。','すべての低評価をpromptだけで修正しません。要件の変更は合意へ戻す検討で、図は要件を変更しません。'],
 ['改善を確かめる','回帰と新旧比較を通し、実際の品質改善まで確かめる。','条件が揃うことと、改善が実測されることを分けます。図の模式選択を本番のリリースや測定にしません。'],
 ['担当と周期','担当とトリアージ・リリース比較・分類棚卸しを揃える。','原文の週次・四半期は例です。件数と重大度に合わせて周期を調整し、定例の存在だけで一周を閉じません。'],
 ['負担も測る','要求頻度・理由の有用性・回答率・利用者負担を比べる。','N回に1回・重要フロー・反映結果の通知は検討候補です。頻度や通知だけで体験の改善を保証せず、実通知も行いません。']
 ])
})
export function releaseResponseFrame(diagram,phase){const stages=RELEASE_RESPONSE_STAGES[diagram];if(!stages)throw TypeError('Unknown release response diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
const explicit=values=>{if(values.some(v=>typeof v!=='boolean'))throw TypeError('Explicit release response conditions required')}
export function configurationTrace({code,prompt,tool,model,settings,evaluation}){const v=[code,prompt,tool,model,settings,evaluation];explicit(v);return {identifiedCandidate:v.every(Boolean),deterministic:false,restored:false}}
export function releaseAllocation(mode){if(!['old','shadow','canary','full'].includes(mode))throw TypeError('Known toy release mode required');return {oldUserPercent:mode==='full'?0:mode==='canary'?90:100,newUserPercent:mode==='full'?100:mode==='canary'?10:0,newProcessedPercent:mode==='old'?0:mode==='canary'?10:100,shadowSideEffects:false,deployed:false}}
export function rollbackPath({flagPrepared,flagExercised,oldAvailable}){const v=[flagPrepared,flagExercised,oldAvailable];explicit(v);return {reviewCandidate:v.every(Boolean),switched:false,effectsUndone:false}}
export function migrationGate({judgeChanged,judgeHumanValidated,suiteChecked,newFailuresRead,promptChecked,stagedPlan}){explicit([judgeChanged,judgeHumanValidated,suiteChecked,newFailuresRead,promptChecked,stagedPlan]);return {reviewCandidate:(!judgeChanged||judgeHumanValidated)&&suiteChecked&&newFailuresRead&&promptChecked&&stagedPlan,migrated:false}}
export function containmentChoice({scope,prepared,exercised}){if(!['auto','write','readOnly','tenant','all'].includes(scope))throw TypeError('Known containment scope required');explicit([prepared,exercised]);return {scope,readMaintained:scope==='write'||scope==='readOnly',reviewCandidate:prepared&&exercised,activated:false,effectsUndone:false}}
export function recoveryChoice({effect,identified,logged,authorized}){if(!['write','sent'].includes(effect))throw TypeError('Known effect required');explicit([identified,logged,authorized]);return {reviewCandidate:identified&&logged&&authorized,route:effect==='sent'?'correction':'rollback-or-correction',reversible:effect!=='sent',performed:false}}
export function feedbackCollection({kind,traceLinked,eventsRecorded,outcomeCompared,purposeExplained,minimized,retentionSet,accessControlled}){if(!['explicit','implicit'].includes(kind))throw TypeError('Known signal kind required');explicit([traceLinked,eventsRecorded,outcomeCompared,purposeExplained,minimized,retentionSet,accessControlled]);return {reviewCandidate:traceLinked&&(kind==='explicit'||eventsRecorded)&&outcomeCompared&&purposeExplained&&minimized&&retentionSet&&accessControlled,intentInferred:false,collected:false}}
export function feedbackLoop({caseAllowed,masked,regressionChecked,comparisonChecked,ownerAssigned,signalImproved}){explicit([caseAllowed,masked,regressionChecked,comparisonChecked,ownerAssigned,signalImproved]);const ready=caseAllowed&&masked&&regressionChecked&&comparisonChecked&&ownerAssigned;return {reviewCandidate:ready,closedInToy:ready&&signalImproved,qualityMeasured:false,released:false}}
