const grouped = (article, count, headings, groups, types) => ({ article: `docs/01-concepts/${article}.md`, route: `/docs/concepts/${article}`,
  binding: 'grouped-blocks', stageCount: count, headings, sourceHeadings: headings, blockGroups: groups, blockTypes: types })
export const SCREEN_LOOP_BINDINGS = {
  'screen-observation': grouped('computer-use-and-multimodal-agents', 6,
    ['概要: 画面を見て、マウスとキーボードで操作する Agent', '詳細: 画面観測ループの特殊性', '詳細: ツール実行型との違い'],
    [[{ stage: 0, count: 2 }], [{ stage: 1, count: 1 }, { stage: 2, count: 1 }], [{ stage: 4, count: 1 }]],
    [['paragraph', 'paragraph'], ['paragraph', 'list'], ['table']]),
  'screen-boundaries': grouped('computer-use-and-multimodal-agents', 6,
    ['詳細: 画面操作で注意する 3 つのリスク', '設計判断: API があるなら API', '観測と行動の粒度は固定ではない'],
    [[{ stage: 0, count: 1 }, { stage: 1, count: 1 }, { stage: 2, count: 1 }], [{ stage: 3, count: 2 }, { stage: 4, count: 1 }], [{ stage: 5, count: 2 }]],
    [['list', 'paragraph', 'paragraph'], ['paragraph', 'list', 'paragraph'], ['paragraph', 'paragraph']]),
  'loop-stop-reasons': grouped('agent-loop', 6,
    ['詳細: 停止条件は「正常完了」以外に必ず用意する'],
    [[{ stage: 0, count: 1 }, { stage: 2, count: 1 }, { stage: 4, count: 1 }, { stage: 5, count: 1 }]],
    [['paragraph', 'table', 'paragraph', 'paragraph']]),
  'loop-runtime': grouped('agent-loop', 5,
    ['詳細: ツールの失敗はループに返す', '詳細: 履歴は単調増加する', '設計判断: ループを自前で書くか、フレームワークに任せるか', '実装例: 最小の Agent ループ'],
    [[{ stage: 0, count: 1 }], [{ stage: 1, count: 1 }], [{ stage: 2, count: 2 }], [{ stage: 3, count: 2 }, { stage: 4, count: 1 }]],
    [['paragraph'], ['paragraph'], ['table', 'paragraph'], ['paragraph', 'code', 'paragraph']])
}
