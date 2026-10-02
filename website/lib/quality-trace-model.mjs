import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const QUALITY_TRACE_STAGES=Object.freeze({
 'fairness-types-measurement':rows([
  ['測って改善','品質差と表現の偏りを、測定可能な評価へする。','法務上の要求と技術的な測定を分担します。図の模式比較を法的判定や完全な公平性にしません。'],
  ['類型を選ぶ','品質差・固定観念・拒否率の偏りで、見る対象を変える。','品質の層別、生成内容の分析、同種依頼の拒否比較を分けます。同じ対策で全類型を解決したとは扱いません。'],
  ['対照ペア','属性だけを入れ替え、依頼とその他の条件を固定する。','変える属性は事前に設計します。図はLLMを実行せず、出力差の模式選択を法的な不公正の確定にしません。'],
  ['層別で読む','層ごとの成功数と母数を、全体平均と並べる。','模式の層A・Bの集計です。少数の母数を実グループの成績にせず、母数なしの率をゼロや完全公平にしません。'],
  ['先に設計','属性・層・指標を事前に定め、本番でも層ごとに追う。','設計した観点の外の偏りは残ります。一組の対照ペアや層別集計を全偏りの不存在にしません。']
 ]),
 'fairness-japanese-remediation':rows([
  ['日本語の観点','名前・方言・待遇表現の対照ペアと層を設計する。','英語圏の評価セットだけでは観点が不足します。産出する日本語の品質と属性による品質差は隣接する別の評価です。'],
  ['手段の違い','prompt・出力ガード・調整データの効き方と費用を分ける。','指示は確実ではなく、検知の網羅性と新たな偏りの混入は別の問題です。図はFTやガードを実行しません。'],
  ['残りを測る','対策した後も、残る偏りと対応手段の限界を測る。','必要条件の模式照合は検討の候補です。対応済みの宣言だけで測定を止めたり、公平を保証したりしません。'],
  ['定義を残す','どの指標で何を等しくするかを明示する。','公平性の定義は複数あり、同時に満たせない場合もあります。単一の数値で完全な公平を確定しません。'],
  ['合意へつなぐ','タスクの影響と関係者の合意で、許容範囲を判断する。','規制が関わる測定結果はコンプライアンスの統制へつなぎます。図は許容差や法務判断を自動決定しません。']
 ]),
 'japanese-axes-exceptions':rows([
  ['産出の品質','日本語としての適切さを、翻訳の忠実さや公平性と分担する。','意味の正確さだけでは見えない品質を対象にします。用途の文体規定と用法の誤りを同じにしません。'],
  ['五つの軸','敬語・文体・表記・固有名詞・直訳調で、見る条件を分ける。','表現単体を一律禁止する方式にしません。相手・場面・指定表記を評価条件に残します。'],
  ['例外を定める','慣用表現・引用・見出しを、単純な全件不正解から除外する。','原文の「お伺いする」は敬語の指針にある慣習の例です。指針そのものがLLMの採点基準を定めているとは扱いません。'],
  ['実入力から','実際の日本語タスクと、崩れやすい入力から評価を作る。','英語の機械翻訳だけを日本語の実利用分布にしません。図はログの採取や転送を行いません。'],
  ['条件を書く','適用範囲と例外を含む条件で、自社用途の期待値を定義する。','引用を除く本文の敬体や指定表記のように、何をどこで測るかを書きます。単純なパターン一致を自然さの判定にしません。']
 ]),
 'japanese-judge-division':rows([
  ['能力を検証','生成の順位やモデルの大きさから、採点能力を推定しない。','日本語の敬語・文体・表記を判定できるか、人手ラベルで検証します。被評価モデルより大きいことは正しい採点の保証ではありません。'],
  ['人手と照合','誤答を通す・適切な表現を落とす両方と、共有の盲点を見る。','模式の必要条件の照合は候補です。別系統のモデルでも全盲点が消えるとはせず、実際の日本語採点の検証を残します。'],
  ['コードの範囲','指定用語や全半角など、適用範囲を機械定義できる条件を測る。','文体候補でも引用・見出しの除外と誤検知を点検します。図は全文を解析して実採点するものではありません。'],
  ['判断を渡す','曖昧な候補と文脈の自然さを、人または検証済みjudgeへ回す。','全ルール合格を自然な日本語にせず、全項目をjudgeへ投げる費用も避けます。図は人への依頼やモデル呼出しをしません。'],
  ['自社へ戻す','公開ベンチで候補を絞り、自社の日本語評価セットで測る。','公開ベンチの分布と採点基準が自社タスクを代表するとは限りません。顔ぶれと最新の状態は原文TODOの確認を残します。']
 ]),
 'trace-hierarchy-versions':rows([
  ['静かな失敗','例外がなく完走しても、正しい回答とは限らない。','原因はprompt・モデル・入力にも分散します。技術的な正常終了を品質の合格にしません。'],
  ['階層で追う','セッションの中のタスクと、LLM・toolの各ステップをつなぐ。','図は実トレースを収集しません。原文の階層と親子参照を示し、最終回答だけで中間の原因を読めたとは扱いません。'],
  ['項目を分ける','共通・タスク・LLM・toolで、記録する項目を分担する。','時刻・ステータス・親参照は共通です。属性の実装名やGenAI仕様の採用版は導入時に確認し、図を全標準への適合証明にしません。'],
  ['版を残す','prompt・モデル・tool定義の版を、生成した応答へ結び付ける。','版の記録は調査の起点です。記録があるだけで原因が確定したり、記録する全文の閲覧権限が広がったりしません。'],
  ['評価へ接続','本番の失敗を、共通形式のトレースから評価ケースへ戻す。','同じ形式は変換を助けます。入力と必要な状態、採点条件を整え、ログ保存だけを回帰検査の完了にしません。']
 ]),
 'trace-signals-data-response':rows([
  ['二つの系統','技術メトリクスと品質シグナルを、別々に監視する。','静かな失敗にはフィードバックやサンプリング判定が必要です。品質シグナルは遅れがあり、judgeの検証も残します。'],
  ['裾を読む','同じ平均でも、一部のタスクが長く迷走する分布を読む。','無単位の模式ステップ数です。4件の最大値を本番のp95や原因の確定にせず、実際の分布を追います。'],
  ['全文の扱い','マスキング・保持期間・アクセス制御・保存先を設計する。','図の条件照合は保存の設計候補です。マスクしただけで機微データの全外部送信を許可したり、漏えいを防いだりしたとは扱いません。'],
  ['実装を選ぶ','汎用基盤・LLM特化基盤・自前を、統合と保存先から選ぶ。','既存監視、全文の保存先、評価との接続を合わせます。原文TODOの仕様の安定度・対応状況を最新の採用版で確認します。'],
  ['対応を決める','技術と品質のアラートを、発火後の手順へ接続する。','検知だけで復旧したとは扱いません。コスト・エラー・ステップ分布・品質シグナルごとに対応を決めます。'],
  ['改善へ戻す','調査と再現、修正と回帰、継続監視へつなぐ。','図はアラート・インシデント連絡・デプロイを行いません。検知と実際の復旧・原因確認を区別します。']
 ])
})
export function qualityTraceFrame(diagram,phase){const stages=QUALITY_TRACE_STAGES[diagram];if(!stages)throw TypeError('Unknown quality trace diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
const explicit=values=>{if(values.some(v=>typeof v!=='boolean'))throw TypeError('Explicit quality trace conditions required')}
export function counterfactualComparison({attributeOnly,requestFixed,otherFixed,different}){explicit([attributeOnly,requestFixed,otherFixed,different]);return {pairReady:attributeOnly&&requestFixed&&otherFixed,differenceToReview:attributeOnly&&requestFixed&&otherFixed&&different,legalUnfairnessDetermined:false,modelExecuted:false}}
export function stratifiedCounts(groups){if(!Array.isArray(groups)||groups.length>4||groups.some(g=>!g||!Number.isInteger(g.total)||g.total<0||g.total>20||!Number.isInteger(g.correct)||g.correct<0||g.correct>g.total))throw TypeError('Bounded toy strata required');const total=groups.reduce((s,g)=>s+g.total,0),correct=groups.reduce((s,g)=>s+g.correct,0);return {groups:groups.map(g=>({...g,rate:g.total?g.correct/g.total:null})),total,correct,rate:total?correct/total:null,fairnessGuaranteed:false}}
export function fairnessRemediation({limitsMeasured,japaneseIncluded,criteriaDefined,stakeholdersIncluded}){const v=[limitsMeasured,japaneseIncluded,criteriaDefined,stakeholdersIncluded];explicit(v);return {reviewCandidate:v.every(Boolean),fairnessGuaranteed:false,remediationExecuted:false}}
export function japaneseCheckRoute({kind,scopeDefined,exceptionsDefined}){if(!['notation','style','context'].includes(kind))throw TypeError('Known Japanese axis required');explicit([scopeDefined,exceptionsDefined]);return {route:kind==='notation'&&scopeDefined&&exceptionsDefined?'code':'human-or-validated-judge',naturalnessGuaranteed:false,graded:false}}
export function japaneseJudgeAcceptance({humanJapanese,wrongAcceptedChecked,rightRejectedChecked,blindspotsChecked}){const v=[humanJapanese,wrongAcceptedChecked,rightRejectedChecked,blindspotsChecked];explicit(v);return {reviewCandidate:v.every(Boolean),gradingAbilityGuaranteed:false,modelExecuted:false}}
export function traceScope(span){if(!['common','task','llm','tool'].includes(span))throw TypeError('Known trace span required');const fields={common:['time','status','parent'],task:['input','result','steps','tokens','versions'],llm:['model','input','output','tokens','stop','latency'],tool:['name','args','result-or-error','latency']};return {fields:fields[span],traceCollected:false,qualityVerified:false}}
export function toyTraceTail(samples){if(!Array.isArray(samples)||samples.length>8||samples.some(v=>!Number.isInteger(v)||v<1||v>20))throw TypeError('Bounded toy step counts required');return {count:samples.length,mean:samples.length?samples.reduce((s,v)=>s+v,0)/samples.length:null,max:samples.length?Math.max(...samples):null,productionPercentileMeasured:false,causeDetermined:false}}
export function traceDataGate({maskDesigned,retentionDesigned,accessDesigned,locationAllowed}){const v=[maskDesigned,retentionDesigned,accessDesigned,locationAllowed];explicit(v);return {designCandidate:v.every(Boolean),dataStored:false,externalSent:false,leakagePrevented:false}}
