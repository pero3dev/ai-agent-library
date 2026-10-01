const grouped = (article, count, headings, groups, types) => ({ article: `docs/00-overview/${article}.md`, route: `/docs/overview/${article}`,
  binding: 'grouped-blocks', stageCount: count, headings, sourceHeadings: headings, blockGroups: groups, blockTypes: types })
export const OVERVIEW_BINDINGS = {
  'learning-section-map': grouped('learning-roadmap', 5,
    ['概要: 16 セクションの構成と依存関係', '読者タイプ別の推奨ルート'],
    [[{ stage: 0, count: 3 }], [{ stage: 4, count: 2 }]], [['paragraph', 'code', 'paragraph'], ['table', 'paragraph']]),
  'learning-practice-loop': grouped('learning-roadmap', 3,
    ['セクションごとの読みどころ', '学習の進め方の指針'],
    [[{ stage: 0, count: 1 }], [{ stage: 1, count: 1 }]], [['list'], ['list']]),
  'skill-development': grouped('skill-map', 6,
    ['概要: スキルマップの使い方', '8 つのスキル領域と到達レベル', '役割像別の重点マップ', 'ライブラリ内の学習パス対応', '実践で伸ばす方法(社内題材の選び方)'],
    [[{ stage: 0, count: 4 }], [{ stage: 0, count: 1 }, { stage: 1, count: 2 }], [{ stage: 2, count: 3 }], [{ stage: 3, count: 3 }], [{ stage: 4, count: 2 }, { stage: 5, count: 2 }]],
    [['paragraph', 'list', 'paragraph', 'code'], ['table', 'paragraph', 'table'], ['paragraph', 'table', 'paragraph'], ['paragraph', 'table', 'paragraph'], ['paragraph', 'list', 'paragraph', 'table']]),
  'information-evidence': grouped('research-literacy', 5,
    ['概要: 「全部追う」をやめる', '情報源の階層', '論文の実務的な読み方', 'ハイプの見分け方'],
    [[{ stage: 0, count: 1 }], [{ stage: 1, count: 3 }], [{ stage: 2, count: 2 }, { stage: 3, count: 1 }], [{ stage: 4, count: 3 }]],
    [['paragraph'], ['paragraph', 'table', 'paragraph'], ['paragraph', 'list', 'paragraph'], ['paragraph', 'list', 'paragraph']]),
  'information-maintenance': grouped('research-literacy', 4,
    ['追いかける仕組み', '追わなくてよいものを決める', 'この理解が効く場面'],
    [[{ stage: 0, count: 1 }, { stage: 1, count: 1 }], [{ stage: 2, count: 3 }], [{ stage: 3, count: 1 }]],
    [['paragraph', 'list'], ['paragraph', 'list', 'paragraph'], ['list']])
}
