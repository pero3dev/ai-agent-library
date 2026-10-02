import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const MODEL_MCP_EVALUATION_STAGES=Object.freeze({
 'cross-provider-map':rows([
  ['共通と固有','タスクの意図・制約と、モデル別の記法・制御を区分する。','横断比較は2026-09-10の各ガイドの統合です。元の確認日と、個別ガイドを正本とする条件を保持します。'],
  ['三社の比較','記法・指示・例・思考・出力・sampling等を、観点ごとに比べる。','図の比較は元記事の確認範囲です。新しいモデル一覧・既定・価格・全APIの互換を追加しません。'],
  ['壊れる共通値','sampling・思考・強調を、全社共通の設定へ潰さない。','リクエスト拒否と静かな品質劣化を区分します。共通のtemperature=0を安全性や再現性の保証にしません。'],
  ['既定も個別','思考制御の名前・水準・既定を、モデルと世代へ結ぶ。','同じベンダーの別世代も同じではありません。選んだ名前を実APIへ送信しません。'],
  ['履歴と例外','Fableの履歴・呼出しと、Geminiの数値予算の例外を確認する。','strictな引数を呼出し強制にせず、SDKに型があることを全モデルでの受理へ拡張しません。']
 ]),
 'cross-provider-migration':rows([
  ['移行の範囲','API・出力・思考・強調・予算と回帰を、対象別に点検する。','運用の段階リリース・ロールバックは更新追従の正本へ戻ります。受理したことを品質へ昇格しません。'],
  ['APIと形式','旧prefill・budget・samplingと、移行先のschemaを照合する。','機能名の似た設定を機械的にコピーしません。形式の一致と業務検証を区分します。'],
  ['思考と強調','移行先の水準と既定を固定し、強い補助の効果を再確認する。','高いeffortや強調の量を品質の保証にしません。原文にない最適設定を生成しません。'],
  ['tokenの予算','同じ文章でも、対象tokenizerで枠・費用・文脈予算を測り直す。','原文の最大35%という例を全モデルへ拡張しません。模式図に架空の価格や増分を置きません。'],
  ['回帰の条件','言い換え・崩れた入力を含め、同じ成功条件で移行前後を比べる。','必要な確認がそろった状態は移行候補です。図は本番へリリースしません。'],
  ['薄い差分','共通骨格と、管理するモデル別のバリアントを接続層で分ける。','上位アプリが同じ形で呼べても、全機能や品質の互換を保証しません。バリアントと版を管理します。']
 ]),
 'mcp-connection-versions':rows([
  ['接続の共通化','N×Mの個別実装を、対応する標準の入口へ寄せる。','共通化するのは接続の実装です。実際の接続本数がN+Mになる保証や、実装工数の節約率を作りません。'],
  ['三つの責任','host・client・serverと、公開されるプリミティブを区分する。','発見・形式・接続の標準化を、モデルの選択・業務の認可の自動保証にしません。'],
  ['版を二つ記録','SDKの版と、相手への要求に適用する仕様版を分ける。','元記事の2026-07-28仕様とSDK 2.2.0の時点を保持します。SDKの更新だけで全機能対応とは扱いません。'],
  ['新旧の接続','旧initializeと、新discover・要求単位のmetaを比べる。','Client autoのfallbackとlegacyの明示を区分します。新旧方式を混ぜて一つの保証にしません。'],
  ['複数往復','MRTRで不足入力を受け、回答と封印状態を付けて再要求する。','新方式で旧backchannelをそのまま使いません。リゾルバーの対応と、再要求の権限を保持します。'],
  ['配置と認可','stdio／HTTPの搬送と、利用者認可・鍵・通知を別に確認する。','session不要を、封印状態の鍵・通知・旧clientのsession管理が不要という意味にしません。']
 ]),
 'mcp-tool-authority':rows([
  ['エラーの層','業務のToolErrorと、通信のMCPErrorを区分する。','Pythonのis_errorとwireのisErrorを混同しません。失敗を正常結果として処理しません。'],
  ['検証面を区分','mock・別プロセスstdio・HTTP認可を、別々の確認とする。','原文のローカル回帰は経費APIや承認業務に接続しません。stdioの成功をHTTP認可の受入にしません。'],
  ['SDKの範囲','原文で未実装の拡張と、保守する系統の条件を確認する。','Tasks・DPoP・JWTの原文時点を今日の全版へ拡張しません。必要な機能は採用版で再確認します。'],
  ['役割で選ぶ','自前の語彙、汎用の接続、絞るwrapper、社内の再利用を比べる。','自前かMCPかの二者択一にしません。全ツールをモデルへ提示する必要はありません。'],
  ['外部の供給元','コード・tool説明・結果が、供給元と入力の境界を越える。','tool poisoning・過剰権限・結果経由の指示を区分します。説明と結果を実行権限にしません。'],
  ['接続の確認','供給元・版・機能・利用者権限と副作用前の承認を合わせる。','条件の照合は接続を検討する候補です。図はserver起動・認証・通信・業務操作を実行しません。']
 ]),
 'evaluation-layers-graders':rows([
  ['評価の難しさ','非決定性・自由な経路・開放出力・多段の失敗を区分する。','文字列一致一つでAgent全体を採点しません。非決定性はtemperatureを下げても消えません。'],
  ['最終の成果','投入判断は、回答と実際の最終状態を先に確認する。','それらしい文や成功宣言だけで達成にしません。デモ・公開順位を自タスクの品質へ変換しません。'],
  ['途中の軌跡','原因と安全性は、途中のtool・引数・作用の経路を確認する。','一つの正解経路だけを要求しません。最終成果と軌跡の指標は別々に照合します。'],
  ['部品の評価','検索・分類・tool実装を、改善の反復に使う。','部品の合格をタスク全体の達成にしません。原因の切り分けから全体の回帰へ戻します。'],
  ['採点を分担','コードで採点できるものを先に判定し、judgeと人手を合わせる。','judge自体も基準・人手との照合で検証します。模式図は実LLMや人手の採点結果を作りません。']
 ]),
 'evaluation-harness-decision':rows([
  ['失敗をケースへ','実入力の失敗を、秘密を除いた入力と期待条件へする。','想像だけの容易なケースや正常系に偏らせません。原文の件数目安を全タスクの網羅性保証にしません。'],
  ['四つの部品','データセット・実行・採点・報告を、再実行できる資産にする。','期待値と採点基準を版管理します。新たな評価サービスや実Agentを起動しません。'],
  ['ケースで判定','合否と失敗一覧を残し、費用・遅延・ステップも測る。','平均スコア一つで理由を隠しません。品質上昇と費用悪化を別々に確認します。'],
  ['反復の基準','1回成功でよい基準と、毎回成功すべき基準を比較する。','成否の個数は読者が選ぶ模式入力です。実Agentの測定・統計的な保証ではありません。'],
  ['品質と費用','自タスクの品質と、費用・待ち時間の条件を合わせる。','公開ベンチマークの順位を投入判断へ転用しません。評価条件の合意が必要です。'],
  ['段階と投資','試作・投入前・運用で、評価の整備と還流を変える。','試作に重い運用基盤を必須にせず、投入前の合意基準と運用中の回帰・監視への接続は保持します。']
 ])
})
export function modelMcpEvaluationFrame(diagram,phase){const stages=MODEL_MCP_EVALUATION_STAGES[diagram];if(!stages)throw TypeError('Unknown model MCP evaluation diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
const explicit=values=>{if(values.some(v=>typeof v!=='boolean'))throw TypeError('Explicit integration evaluation condition required')}
export function modelVariantGate({apiCompatible,parametersPinned,outputContractChecked,tokenBudgetMeasured,regressionPassed}){explicit([apiCompatible,parametersPinned,outputContractChecked,tokenBudgetMeasured,regressionPassed]);return {reviewCandidate:apiCompatible&&parametersPinned&&outputContractChecked&&tokenBudgetMeasured&&regressionPassed,deploymentExecuted:false}}
export function mcpConnectionGate({versionCompatible,transportCompatible,featureSupported,userAuthorized,hostApproved}){explicit([versionCompatible,transportCompatible,featureSupported,userAuthorized,hostApproved]);return {reviewCandidate:versionCompatible&&transportCompatible&&featureSupported&&userAuthorized&&hostApproved,networkConnected:false}}
export function mcpReplicaGate({legacySessionRequired,sessionManaged,signedStateRequired,keyShared,notificationsRequired,notificationsShared}){explicit([legacySessionRequired,sessionManaged,signedStateRequired,keyShared,notificationsRequired,notificationsShared]);return {reviewCandidate:(!legacySessionRequired||sessionManaged)&&(!signedStateRequired||keyShared)&&(!notificationsRequired||notificationsShared),deploymentExecuted:false}}
export function evaluationGraderRoute({deterministicCriterion,openOutput,judgeValidated,humanAvailable}){explicit([deterministicCriterion,openOutput,judgeValidated,humanAvailable]);return {next:deterministicCriterion?'code':openOutput&&judgeValidated?'judge-candidate':humanAvailable?'human-review':'criterion-needed',gradingExecuted:false}}
export function evaluationRepeatResult({runs,passed,policy}){if(!Number.isInteger(runs)||runs<1||runs>8||!Number.isInteger(passed)||passed<0||passed>runs||!['any','all'].includes(policy))throw TypeError('Bounded observed runs and explicit policy required');return {observedAccepted:policy==='any'?passed>0:passed===runs,passRate:passed/runs,qualityGuaranteed:false}}
