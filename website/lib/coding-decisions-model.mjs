import { clampPhase,stageForPhase } from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const CODING_DECISION_STAGES=Object.freeze({
  'coding-support-forms':rows([
    ['タスクの委任','補完・チャット・Agentで、人とシステムの分担が変わる。','Agentは探索・編集・実行・検証を繰り返します。完了条件を満たしたことは確認が必要です。'],
    ['補完とチャット','提案の採否や文脈の受け渡しを、人が担う。','補完からAgentへの整理は提供形態の違いです。全ての用途で置き換えるべき順位ではありません。'],
    ['探索から検証','観測・思考・行動を、コードとテスト結果で回す。','ファイルを編集できることと、期待した挙動を確認できたことを分けます。'],
    ['5つの形態','CLI・IDE・Issue/PR・クラウド・拡張可能な形を、重なりとして読む。','元の比較表と確認時点を保持します。製品名だけでは利用面や実行の場所を特定できません。'],
    ['排他的ではない','一つの製品が、複数の入口と実行場所を持ちうる。','オープンソースと拡張機構の有無も同一ではありません。個別機能は元記事の表と各製品記事で確認します。']
  ]),
  'coding-trigger-execution-map':rows([
    ['二つの軸','仕事を依頼する入口と、ループを回す場所を別々に選ぶ。','入口は開発フロー、実行場所はコード配置とコマンドの権限へ関係します。'],
    ['CLI・IDEから','手元での対話と、クラウドへの委任を区別する。','同じ入口でも実行場所が異なります。機能やデータ経路を製品名だけで決めません。'],
    ['Issue・PRから','イベントを入口に、クラウドや自分のCIで実行する。','元記事の対応表を読む模式図です。図の選択は実際のCI・外部ジョブを起動しません。'],
    ['場所と送信先','実行場所に加え、モデルなどへのデータ送信先を確認する。','ローカルでコマンドが動いても、モデルへのコード送信がないとは限りません。導入条件に沿って経路を確認します。']
  ]),
  'coding-autonomy-learning':rows([
    ['人の関与','補完・都度承認・許可リスト・委任の、確認位置を比較する。','同じツールでも設定と運用で自律性が変わります。'],
    ['権限と検証','確認を減らす運用ほど、権限と完了条件を先に整える。','失敗の影響範囲を制御し、レビューの位置を成果物の公開・反映より前に置きます。'],
    ['読む経路','選定・使い始め・組織展開の立場で、次の学習先を選ぶ。','分類と個別機能、依頼と恒常規約、権限と導入評価をつなぎます。']
  ]),
  'coding-selection-constraints':rows([
    ['制約を先に','変えられない条件から、候補の範囲を決める。','人気や機能の丸印だけで選びません。候補の現況は予定プランの一次情報で確かめます。'],
    ['データと実行','送信・保持・学習利用と、実行場所・権限を別に確認する。','BYOKはキーの持込みであり、経路や保持・統制が自動で要件を満たすことを意味しません。'],
    ['フローと拡張','IDE・SCM・規模、社内ツールとの接続を確認する。','「対応あり」でも、転送方式・承認制御や運用の範囲を確認します。'],
    ['管理と費用','組織管理・コスト構造・モデル選択を、予定条件で確かめる。','SSOやポリシー強制、超過時の挙動、モデル持込みに伴う責任まで確認します。'],
    ['用途と形態','対話・定型大量処理・Issue連携・機密性・既存IDEから形態を考える。','図は特定製品の推薦結果を生成しません。実行経路が要件を満たすかは別途確認します。']
  ]),
  'coding-selection-trial':rows([
    ['併用の設計','補完・対話・レビューは、役割に応じて併用できる。','一つの製品への統一を先に目的にせず、開発フローの役割を揃えます。'],
    ['三つの整合','ルールの正本・重複課金・共通ポリシーを確認する。','最も緩い設定からデータが外へ出る構成を残さず、併用先にも同じ基準を適用します。'],
    ['足切りと試用','制約で2〜3候補へ絞り、同じ条件の実タスクで試す。','同じ依頼文・同等設定・導入予定の組織プラン条件で、成功・介入・時間・費用を測ります。'],
    ['決定と見直し','更新・料金・社内成績の変化を、再評価の引金にする。','この図は試用の点数や順位を作りません。何が変われば再検討するかを決定時に残します。']
  ]),
  'coding-request-contract':rows([
    ['依頼からレビュー','依頼・計画・実装・検証・人のレビューを、一つの流れにする。','計画承認が必要な仕事では承認を挟み、指摘を実装へ戻します。'],
    ['四つの要素','目的、現状と文脈、制約、完了条件を指定する。','元記事の具体例を保持します。図は例文を増やさず、それぞれが判断を支える場所を示します。'],
    ['一回でレビュー','大きな仕事を、レビューできる変更単位へ分ける。','探索と実装を分け、依存する仕事は順番に進めます。独立した仕事だけが並列候補です。'],
    ['具体情報と確度','知っているパス・エラー全文・再現手順を、確度付きで渡す。','当たりがない場所を断定しません。恒常規約はルール側へ、今回の仕事は依頼側へ置きます。']
  ]),
  'coding-request-verification-recovery':rows([
    ['自己検証の手段','実行可能なコマンドと、確認する挙動を渡す。','テスト・リントの成功は、その検査の範囲を裏付けます。人のレビューも含めて完了を確認します。'],
    ['基準を守る','通すために検証基準を弱めたら、期待した完了にはならない。','テスト変更を禁止するか、変更内容をレビューの重点にします。既存挙動の固定が必要な領域は先に確認します。'],
    ['立て直す','長い失敗履歴から、試したことと学びを抽出する。','新しく始める場合も、失敗した手段と正しい前提を次の依頼や恒常規約へ引き継ぎます。'],
    ['部分採用','正しい部分を確認して採用するか、粒度と前提を見直す。','同じ失敗が続くときは、依頼文だけでなくタスクの大きさや規約の不足を確認します。']
  ])
})
export function codingDecisionFrame(id,phase){
  if(!Object.hasOwn(CODING_DECISION_STAGES,id))throw new RangeError('Unknown coding decision diagram')
  const stages=CODING_DECISION_STAGES[id],bounded=clampPhase(phase,stages.length),stage=stageForPhase(bounded,stages.length)
  return {...stages[stage],stage,phase:bounded}
}
export function executionPlacement(trigger,place){
  const allowed={cli:['local','cloud'],ide:['local','cloud'],issue:['cloud','ci']}
  if(!Object.hasOwn(allowed,trigger)||!['local','cloud','ci'].includes(place))throw new RangeError('Unknown coding placement')
  return {represented:allowed[trigger].includes(place),localCommands:place==='local',externalDataConfirmed:false}
}
export function requestCompletion(evidence){
  if(!['verified','claim','weakened'].includes(evidence))throw new RangeError('Unknown request evidence')
  return {satisfiesOriginalCriteria:evidence==='verified'}
}
