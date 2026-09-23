/** Deterministic views of the control structures already described in docs/.
 * These are reading states, not live model or tool executions. */
export const RESPONSE_OPTIONS = [
  { id: 'tool', label: 'ツール呼び出し要求' },
  { id: 'complete', label: '正常終了理由 ＋ 有効な最終応答' },
  { id: 'truncated', label: '生成上限による打ち切り' },
  { id: 'refused', label: '拒否・不正応答' },
  { id: 'continue', label: '継続可能な停止' }
]

export const LOOP_STAGES = [
  { label: '入力', title: '履歴を、次の入力へ。', formula: 'コンテキスト組み立て', detail: 'システムプロンプト・会話履歴・これまでのツール結果をまとめます。' },
  { label: 'モデル', title: 'モデルが、次の一手を返す。', formula: 'LLM 呼び出し', detail: 'モデルが状況を解釈します。ツールを実行するのはアプリケーションです。' },
  { label: '解釈', title: '応答の種類で、経路が分かれる。', formula: '本文 ＋ 停止理由', detail: 'ツール要求がないだけでは正常完了と判定できません。' },
  { label: '結果', title: '実行結果も、次の観測になる。', formula: 'アプリが実行 → 履歴へ追記', detail: 'ツールの成功も失敗も、モデルの応答とともに履歴へ残します。' },
  { label: '停止', title: '続ける前に、止まる条件を確かめる。', formula: '停止判定 → 継続 / 状態報告', detail: '周回・時間・費用などの上限や、回復不能なエラーをアプリが判定します。' }
]

export function loopFrame(stage, response = 'tool', boundary = 'continue', toolResult = 'success') {
  if (!Number.isInteger(stage) || stage < 0 || stage > 4) throw new RangeError('Unknown loop stage')
  if (!RESPONSE_OPTIONS.some(item => item.id === response)) throw new RangeError('Unknown response')
  if (!['continue', 'stop'].includes(boundary) || !['success', 'failure'].includes(toolResult)) throw new RangeError('Unknown loop condition')
  const interpreted = stage >= 2
  const acted = stage >= 3
  const toolExecuted = acted && response === 'tool'
  const terminalResponse = response === 'complete' || response === 'truncated' || response === 'refused'
  const stoppedByApp = stage >= 4 && !terminalResponse && boundary === 'stop'
  const terminal = acted && terminalResponse ? (response === 'complete' ? 'complete' : 'incomplete') : stoppedByApp ? 'incomplete' : null
  const bypassTool = acted && response !== 'tool'
  const active = stage === 0 ? 'context' : stage === 1 ? 'model' : stage === 2 ? 'interpret' : terminal ? 'terminal' : stage === 3 && toolExecuted ? 'tool' : 'boundary'
  const edges = stage === 0 ? [] : stage === 1 ? ['input'] : stage === 2 ? ['response'] : terminalResponse
    ? ['response', response === 'complete' ? 'complete' : 'incomplete']
    : stage === 3 && toolExecuted ? ['execute']
      : ['response', response === 'continue' ? 'resume' : 'observe', ...(stage >= 4 ? [boundary === 'stop' ? 'app-stop' : 'repeat'] : [])]
  let detail = LOOP_STAGES[stage].detail
  if (acted && response === 'complete') detail = '正常終了理由と有効な最終応答を確認し、ツール実行を通らず正常完了へ。業務上の成功は別途検証します。'
  else if (acted && response === 'truncated') detail = '生成上限による途中の応答を正常完了にしません。不完全なツール要求は実行せず、途中状態を報告します。'
  else if (acted && response === 'refused') detail = '拒否・不正応答を正常完了と分け、ツール実行を通らず未完了の状態を報告します。'
  else if (acted && response === 'continue') detail = stoppedByApp ? '継続可能な停止でも、アプリ側の上限に達したら履歴を保持して終了します。' : 'ツールを実行せず停止判定へ。履歴を保持し、アプリ側の上限内で再開します。'
  else if (toolExecuted && stage === 3 && toolResult === 'failure') detail = '失敗の内容も履歴へ返します。モデルはそれを観測できますが、必ず回復できるとは限りません。'
  else if (stoppedByApp) detail = '周回・時間・費用などの上限に達したら、途中経過と未完了理由を残して終了します。'
  let title = LOOP_STAGES[stage].title, formula = LOOP_STAGES[stage].formula
  if (acted && response === 'complete') {
    title = '有効な最終応答を、正常完了へ。'; formula = '正常終了理由 ＋ 有効な最終応答'
  } else if (acted && ['truncated', 'refused'].includes(response)) {
    title = '未完了の状態を、区別して残す。'; formula = 'ツール実行なし → 状態報告'
  } else if (acted && response === 'continue') {
    title = '履歴を保ち、停止判定へ。'; formula = 'ツール実行を省略 → アプリの停止判定'
  }
  if (stoppedByApp) { title = '上限で止め、途中経過を残す。'; formula = 'アプリの上限 → 未完了の状態報告' }
  else if (stage === 4 && !terminalResponse) { title = '上限の範囲で、次の周回へ。'; formula = '履歴を保持 → 入力を組み立てる' }
  return { active, edges, terminal, bypassTool, toolExecuted, toolResult, detail, title, formula,
    history: [...(interpreted ? ['モデルの応答'] : []), ...(toolExecuted ? [`ツール結果（${toolResult === 'success' ? '成功' : '失敗'}）`] : [])],
    repeats: stage >= 4 && !terminalResponse && boundary === 'continue' }
}
