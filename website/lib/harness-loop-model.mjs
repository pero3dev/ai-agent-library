import { clampPhase, stageForPhase } from './reading-clock.mjs'
const rows = values => Object.freeze(values.map(([label,title,detail]) => Object.freeze({label,title,detail})))
export const HARNESS_LOOP_STAGES = Object.freeze({
  'harness-system-boundaries': rows([
    ['全体を設計','同じモデルでも、周囲の作りで性能と信頼性が変わる。','図はベンチマーク得点を再現しません。モデルとハーネスを分け、全体を評価します。'],
    ['入力を包む','ハーネスは、入力全体の設計を包む外側のシステム。','プロンプトの文言、コンテキストの構成、周囲の制御を区別します。'],
    ['5つの部品','ループ・ツール・検証・環境・安全を、一貫した構成にする。','部品それぞれの設計の正本は本文の表から参照できます。'],
    ['裁量と強制','多様な判断はモデルへ、権限・上限・検証はコードへ。','指示は強制ではありません。破られては困る制御を、モデルのお願いに任せません。'],
    ['観測から足す','最小構成から動かし、観測した穴だけを部品で埋める。','先回りの足場は、モデルの能力を奪ったり保守負債になったりします。']
  ]),
  'harness-environment-evolution': rows([
    ['働く場所','中間成果の外部化と、セッションごとの使い捨てを設計する。','環境は安全の隔離と、モデルが手を動かす余地の両方を支えます。'],
    ['既製と自作','差別化する制御を握り、周辺を既製に任せる選択もある。','既製の停止や圧縮のデフォルト、自作の監視・再試行、混成の責務境界を確認します。'],
    ['同じ条件で比較','モデルと評価セットを固定し、ハーネスだけを変える。','品質・費用・遅延と軌跡を一緒に読みます。図は比較結果を作りません。'],
    ['軌跡も読む','最終出力だけでなく、無駄な往復や堂々巡りを確認する。','同じ得点でもタスクごとの成否や経路は違います。集計だけで判断しません。'],
    ['更新時に減らす','モデル更新後に、補助の足場がまだ必要か評価する。','削減対象はモデルの弱点を補う足場です。権限・上限・危険操作の制御を省く根拠にはしません。']
  ]),
  'loop-type-and-stopping': rows([
    ['時間軸の設計','いつ考え・動き・立ち止まり・止めるかを設計する。','1周の仕組みの先にある、長く回すときの制御を扱います。'],
    ['3つの型','自由ループ・フェーズ制・状態機械から、必要な自由度を選ぶ。','制御の強さと柔軟性の代償があります。大枠はフェーズ制、内部は自由ループという混成も使えます。'],
    ['完了を確認','モデルの自己申告を、検証や事前の基準で裏付ける。','検証できないタスクもあります。その場合は完了基準を先に明示します。'],
    ['多次元の予算','ステップ・トークン・時間・費用を、それぞれ上限化する。','ステップ数だけが小さくても、1回の長い出力で別の予算を超えられます。'],
    ['上限後の結果','上限では、部分成果・未完了理由・次の作業を返す。','動的な予算配分は選択肢ですが、1つの次元を増やして他の上限を外しません。']
  ]),
  'loop-replanning-recovery': rows([
    ['節目の再計画','フェーズ完了・大きな失敗・新情報で、計画の前提を見直す。','行動より粗い頻度を基本にし、毎周の方針変更による往復を避けます。'],
    ['停滞を検知','同一呼出し・同一失敗・変化しない成果をコードで監視する。','介入の閾値は先に決めます。図の回数は実行の診断値ではありません。'],
    ['段階的な介入','ヒント・外部化状態からの再構成・人への引き継ぎを用意する。','低い介入で回復しなければ、強い介入へ進みます。必ず自動回復するとは限りません。'],
    ['戻る準備','確定した状態と、失敗した経路の要約を保存する。','作業状態を戻しても、送信などの外部副作用は消えません。再実行の安全性は別に確認します。'],
    ['入れ子と分割','子ループやフェーズへ分け、親へ要点と参照を返す。','親にも子にも上限が必要です。子の戻り値を親が検証し、権限を自動で拡張しません。'],
    ['二つの制御','柔らかな振る舞いは促し、破綻を防ぐ上限はコードで強制する。','ヒントは上限を外す許可ではありません。強制と誘導を併用します。']
  ])
})
export const HARNESS_PARTS = Object.freeze(['ループ制御','ツール','フィードバック・検証','作業環境','安全・権限'])
export function harnessLoopFrame(id,phase) {
  if (!Object.hasOwn(HARNESS_LOOP_STAGES,id)) throw new RangeError('Unknown harness/loop diagram')
  const stages=HARNESS_LOOP_STAGES[id], bounded=clampPhase(phase,stages.length), stage=stageForPhase(bounded,stages.length)
  return {...stages[stage],stage,phase:bounded}
}
export function loopBudget(dimension) {
  if (!['none','steps','tokens','time','cost'].includes(dimension)) throw new RangeError('Unknown budget dimension')
  return { stop:dimension !== 'none', exceeded:dimension, report:dimension !== 'none' ? '部分成果と未完了理由を返す' : '各予算の中で継続' }
}
export function completionCheck(evidence) {
  if (!['claim','verified','unverifiable'].includes(evidence)) throw new RangeError('Unknown completion evidence')
  return { completed:evidence === 'verified', label:evidence === 'verified' ? '検証を通した完了' : evidence === 'claim' ? '自己申告だけでは未確認' : '事前の完了基準を確認' }
}
