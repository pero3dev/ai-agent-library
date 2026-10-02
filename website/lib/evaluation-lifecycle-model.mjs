import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const EVALUATION_LIFECYCLE_STAGES=Object.freeze({
 'regression-layer-scope':rows([
  ['非局所の変更','指示・tool定義・モデルの変更を、無関係なケースにも照合する。','依存コードの範囲だけで挙動の影響を限定しません。変更前後を同じスイートで比較します。'],
  ['三つのレイヤ','LLMなし・単一呼出し・Agent全体を分けて検証する。','原文のL1・L2・L3を保持します。すべてを高価なE2Eへ集めず、部品の合格を全体の成功にしません。'],
  ['繰返しの基準','1回以上と全回成功を、タスクの要求から分ける。','表示は模式の成否列です。実測した成功率や独立試行の確率を表していません。'],
  ['ノイズの幅','同じ版の繰返しで、変動幅を先に把握する。','少数回の測定を普遍的な十分性や統計的な有意差へ変換しません。差と新たな失敗の両方を読みます。'],
  ['失敗を残す','flakyなケースを消さず、頻度と原因を調べる。','たまに失敗することも品質情報です。ケースの無効化で品質が改善したとは扱いません。']
 ]),
 'regression-gate-recovery':rows([
  ['頻度と予算','PRの軽い検査から、夜間の全量・リリース前の反復へ広げる。','L1全量とsmoke、フル、複数回フルを区分します。並列化はAPIの制限、専用キーは予算・権限の分離を伴います。'],
  ['変更の範囲','変更種別から最低限の検査を選び、挙動を変える変更は全体へ進む。','内部実装のみは定義・挙動仕様が不変の場合です。モデル更新は同一スイートの比較とjudge自体の検証を省きません。'],
  ['採用の条件','絶対基準と前回比較、予算と新たな失敗を併せて読む。','図の条件は模式入力です。全条件の照合を品質保証や実CIの成功へ昇格しません。'],
  ['原因へ降りる','新たに落ちたケースの出力差から、軌跡の差へたどる。','集計値の差だけで原因を確定しません。ケースの参照先を保ち、成果と経路の調査を接続します。'],
  ['資産へ戻す','本番で見つかった失敗を修正し、回帰ケースへ追加する。','既知の失敗を再発検知へ残します。既知セットの緑だけを将来の全タスク品質にしません。']
 ]),
 'online-sequence-signals':rows([
  ['補完する評価','固定セットで劣化案を落としてから、本番分布へ進む。','速い再現評価と利用者への影響を伴う評価は役割が違います。オフライン合格だけで本番の効果は分かりません。'],
  ['順序と作用','シャドー・カナリアの作用範囲を分け、比較を経て展開を検討する。','図は実入力やtoolを実行しません。シャドー側で副作用を生む操作を許しません。'],
  ['主指標','完了・修正・やり直し等から、タスクに合う代理指標を決める。','明示評価は回答者の偏りと理由を保持します。代理指標の改善をタスクの正しさそのものへ変換しません。'],
  ['悪化を監視','費用・p95・エラー・安全性を、主指標と同時に読む。','主指標が上がっても、合意した悪化条件に触れたら失敗です。図の切替は実計測ではありません。'],
  ['採点を標本化','検証済みのjudgeで本番出力をサンプリングする。','全量の費用・遅さを考え、人手との検証を保ちます。オンラインjudgeの合格を業務完了と同一視しません。']
 ]),
 'online-comparison-release':rows([
  ['割付を固定','同じ利用者またはセッションを同じ群へ割り付ける。','リクエストごとの行き来を避けます。図は実利用者の割付や個人データを生成しません。'],
  ['開始前に定義','主指標・成功条件・標本数・期間を開始前に定める。','早期の見栄えだけで打ち切らず、遅れて現れる成否や信頼も観測します。'],
  ['比較と安全','A/Bの改善判断と、カナリアの壊れていない確認を分ける。','主指標とガードを同時に監視します。必要条件を選ぶ図であり、統計的な有意差や実配信を計算しません。'],
  ['戻す条件','違反で旧構成へ切り替える条件と、操作経路を先に用意する。','フラグで即時切替できることを確認します。切替はすでに完了した外部作用の取消ではありません。'],
  ['作用のない観測','シャドーでは旧構成の回答を返し、新構成は記録へ限定する。','副作用のあるtoolは新構成側で実行しません。入力分布の観測だけでA/Bの勝者とは判断しません。'],
  ['結論の限界','少トラフィック・多重比較・新奇性・交絡・測れない成否を点検する。','探索結果は仮説です。判定不能ならオフラインと人手へ戻り、無理に本番比較の結論を作りません。']
 ]),
 'benchmark-map-provenance':rows([
  ['用途と範囲','足切り・相場観・変化検知に使い、最終判断を自社評価へ残す。','ベンチマークが測るのはその分布と実行条件です。公開の高順位を自社品質へ転用しません。'],
  ['カテゴリの地図','自タスクに近いカテゴリと、測る成果・環境を選ぶ。','代表名は原文の確認時点に従います。カテゴリ内の全派生が同じ課題や飽和状態とは扱いません。'],
  ['組合せの値','スコアをモデル・ハーネス・推論努力・資源・試行の組で読む。','同じモデル名だけで比較条件が揃ったとは扱いません。図は実ベンチマークを再実行しません。'],
  ['実行主体','統一実測・自己報告・集約・選好投票を分ける。','横比較の条件と検証水準を確認します。好まれたことをタスク成功率へ変換しません。'],
  ['条件を照合','版・タスク・ハーネス・努力・資源・反復・採点を揃えて読む。','比較条件の一致は自社品質の保証ではありません。日付と詳細を残し、欠けた条件を推定で埋めません。']
 ]),
 'benchmark-reliability-cost':rows([
  ['信頼性','1回の成功率と、繰返しすべて成功する要求を分ける。','原文のpass@1とpass^kを保持します。模式の成否列から独立確率や実スコアを推定しません。'],
  ['問題の品質','汚染・飽和・問題と採点の誤りを、モデル能力の差と分ける。','少数ポイントの差だけで優劣を確定せず、非公開・新問・未飽和の版や検証水準を確認します。'],
  ['費用と品質','同条件の費用と成果を二軸で読み、欠測をゼロにしない。','数は無単位の模式入力です。パレート候補は自社の最適解ではなく、費用の内訳と対象件数も必要です。'],
  ['三段階の絞込','近いカテゴリ・第三者実測・自社評価の順で候補を絞る。','公開ベンチが決めるのは試す順番までです。自社セットで測定せず採用を確定しません。'],
  ['版を再実行','Terminal-Benchの資源校正・課題修正と、難化を分ける。','原文の2026-09-17確認の4.0改訂と8時間の上限を保持します。上限を実所要時間にしません。メジャー版の値を直接比較しません。'],
  ['詳細の欠測','努力別の行と費用の対象件数を、丸めたトップ表示まで遡る。','原文の2026-09-28観測とpartial: 324/330を保持します。費用内訳未確定をインフラ込み総額にしません。'],
  ['採点を修正','WebArenaの旧版飽和と、Verifiedの課題・評価器修正を分ける。','network traceを使った決定的な評価は採点の修正です。Hard subsetや全派生の飽和へ一般化しません。']
 ])
})
export function evaluationLifecycleFrame(diagram,phase){const stages=EVALUATION_LIFECYCLE_STAGES[diagram];if(!stages)throw TypeError('Unknown evaluation lifecycle diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
const explicit=values=>{if(values.some(v=>typeof v!=='boolean'))throw TypeError('Explicit lifecycle conditions required')}
export function regressionScope(change){if(!['internal','prompt','model'].includes(change))throw TypeError('Known change required');return {layers:change==='internal'?['L1']:['L1','L2','L3'],fullSuite:change!=='internal',judgeRevalidation:change==='model',testsExecuted:false}}
export function regressionGate({absoluteMet,baselineMet,budgetMet,failuresReviewed}){const values=[absoluteMet,baselineMet,budgetMet,failuresReviewed];explicit(values);return {reviewCandidate:values.every(Boolean),ciExecuted:false,qualityGuaranteed:false}}
export function onlineRelease({offlineMet,assignmentStable,criteriaFixed,sampleSufficient,periodObserved,guardrailsMet,rollbackReady}){const values=[offlineMet,assignmentStable,criteriaFixed,sampleSufficient,periodObserved,guardrailsMet,rollbackReady];explicit(values);return {reviewCandidate:values.every(Boolean),rollbackCandidate:!guardrailsMet,deployed:false,effectsUndone:false}}
export function benchmarkComparable({sameVersion,sameTasks,sameHarness,sameEffort,sameResources,sameTrials,sameGrader}){const values=[sameVersion,sameTasks,sameHarness,sameEffort,sameResources,sameTrials,sameGrader];explicit(values);return {comparable:values.every(Boolean),qualityGuaranteed:false}}
export function benchmarkToyPareto(points){if(!Array.isArray(points)||points.length>6||points.some(p=>!p||typeof p.id!=='string'||!Number.isFinite(p.score)||p.score<0||p.score>5||(p.cost!==null&&(!Number.isFinite(p.cost)||p.cost<0||p.cost>6)))||new Set(points.map(p=>p.id)).size!==points.length)throw TypeError('Bounded toy cost and score points required');return points.map(p=>({id:p.id,comparable:p.cost!==null,frontier:p.cost!==null&&!points.some(q=>q.id!==p.id&&q.cost!==null&&q.score>=p.score&&q.cost<=p.cost&&(q.score>p.score||q.cost<p.cost)),qualityGuaranteed:false}))}
