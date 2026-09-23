/** Deterministic views of the control structures already described in docs/.
 * These are reading states, not live model or tool executions. */
export const COMPARISON_ROWS = [
  { label: '予測可能性', workflow: ['実行経路が固定', '予測しやすい'], agent: ['実行のたびに', '経路が変わりうる'] },
  { label: 'デバッグ性', workflow: ['失敗したステップを', '特定しやすい'], agent: ['経路に依存し', '再現が難しい'] },
  { label: 'コスト', workflow: ['呼び出し回数が固定', '見積もり可能'], agent: ['ループ回数が入力依存', '上振れする'] },
  { label: 'レイテンシ', workflow: ['安定'], agent: ['変動が大きい'] },
  { label: '柔軟性', workflow: ['想定外の入力に弱い'], agent: ['想定外の入力に', '対応しうる'] },
  { label: '評価', workflow: ['ステップ単位で評価'], agent: ['軌跡（過程）の評価'] },
  { label: '失敗モード', workflow: ['想定外の入力で', '手順が破綻する'], agent: ['経路の選択そのものを', '誤る'] }
]

export const WORKFLOW_STAGES = [
  { label: '手順', title: '手順を、誰が決めるか。', formula: 'コードで固定 / モデルに委ねる', detail: 'WorkflowでもLLMを使えます。違いは、実行手順の決定をどこに置くかです。' },
  { label: '比較', title: '柔軟性と、引き受ける代償。', formula: '同じ観点で、二方式を見る', detail: '同じ品質なら、自律性の低い構成から。本文の7つの観点を切り替えて確かめます。' },
  { label: '選択', title: '判断を委ねる範囲を、絞る。', formula: '列挙 → 振り分け → 範囲の限定', detail: '手順の列挙を実際に試み、その結果から構成を選びます。' },
  { label: '混在', title: '固定手順と探索を、組み合わせる。', formula: 'Workflow の中の Agent / Agent のツール', detail: '予測可能な部分をコードに固定し、判断が必要な部分だけモデルへ委ねます。' },
  { label: '境界', title: '必要な部分を変え、戻せるように。', formula: '関数・ツールとして境界を保つ', detail: 'Workflowで始め、足りない部分を特定します。全体を一方向にAgentへ移す図ではありません。' }
]

export const CHOICE_OPTIONS = [
  { id: 'fixed', label: '手順をすべて列挙できる', result: 'Workflow', steps: [0], answer: '手順をコードに固定' },
  { id: 'routing', label: '手順は固定、入口の振り分けだけ判断', result: 'Workflow ＋ ルーティング', steps: [0, 1], answer: '入口の判断と固定手順を分ける' },
  { id: 'bounded', label: '変わる手順の範囲を一部に限定できる', result: 'ハイブリッド', steps: [0, 1, 2], answer: '一部の判断をモデルへ委ねる' },
  { id: 'open', label: '変わる範囲を限定できない', result: 'Agent', steps: [0, 1, 2], answer: '停止条件・権限を最初に設計' }
]

export function workflowChoice(id) {
  const choice = CHOICE_OPTIONS.find(item => item.id === id)
  if (!choice) throw new RangeError('Unknown workflow choice')
  return choice
}
