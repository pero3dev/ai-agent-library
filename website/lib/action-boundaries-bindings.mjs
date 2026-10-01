const grouped = (article, count, headings, groups, types) => ({ article: `docs/02-architecture/${article}.md`, route: `/docs/architecture/${article}`, binding: 'grouped-blocks', stageCount: count, headings, sourceHeadings: headings, blockGroups: groups, blockTypes: types })
export const ACTION_BOUNDARY_BINDINGS = {
  'orchestration-basics': grouped('orchestration-patterns', 6,
    ['概要','詳細: 5 つの基本パターン'], [[{stage:0,count:2}], [{stage:1,count:2}]], [['paragraph','paragraph'],['table','code']]),
  'orchestration-composition': grouped('orchestration-patterns', 5,
    ['詳細: パターンは合成して使う','詳細: 外部エージェント連携の概観','設計判断: 最小構成から計測して育てる'],
    [[{stage:0,count:3}], [{stage:3,count:3}], [{stage:4,count:1}]], [['paragraph','list','paragraph'],['paragraph','paragraph','blockquote'],['paragraph']]),
  'human-intervention-positions': grouped('human-in-the-loop', 6,
    ['概要','詳細: 介入の 4 形態','詳細: どこに承認を置くか — リスクベースで決める'],
    [[{stage:0,count:1}], [{stage:1,count:2}], [{stage:5,count:3}]], [['paragraph'],['table','paragraph'],['paragraph','table','paragraph']]),
  'human-approval-lifecycle': grouped('human-in-the-loop', 5,
    ['詳細: 承認疲れ(approval fatigue)が安全装置を壊す','詳細: 実装上の要点'],
    [[{stage:0,count:2}], [{stage:1,count:1}]], [['paragraph','list'],['list']]),
  'error-layer-routing': grouped('error-handling-and-retries', 5,
    ['概要: 「モデルに回復させる」という選択肢','詳細: エラーの 4 層分類'], [[{stage:0,count:1}],[{stage:1,count:2}]], [['paragraph'],['table','paragraph']]),
  'retry-and-recovery-boundaries': grouped('error-handling-and-retries', 6,
    ['詳細: リトライ設計の 3 つの注意点','詳細: フォールバック — 失敗しても価値を残す','設計判断: 失敗時のユーザー体験を先に決める'],
    [[{stage:0,count:1}], [{stage:3,count:1}], [{stage:5,count:1}]], [['list'],['list'],['paragraph']])
}
