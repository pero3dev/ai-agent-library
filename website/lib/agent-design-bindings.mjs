const binding = (article, stageCount, headings, blockGroups, blockTypes) => ({
  article: `docs/01-concepts/${article}.md`, route: `/docs/concepts/${article}`, binding: 'grouped-blocks',
  stageCount, headings, sourceHeadings: headings, blockGroups, blockTypes
})
export const AGENT_DESIGN_BINDINGS = {
  'planning-patterns': binding('planning-and-reasoning', 5,
    ['概要: プランニングと推論は別の働き', '詳細: プランニングの 3 つの基本パターン'],
    [[{ stage: 0, count: 2 }], [{ stage: 1, count: 1 }, { stage: 4, count: 1 }]],
    [['list', 'paragraph'], ['table', 'paragraph']]),
  'planning-maintenance': binding('planning-and-reasoning', 6,
    ['詳細: 計画は「作る」より「維持する」が難しい', '詳細: モデル側の推論機能との関係', '設計判断: 計画をどこに持たせるか'],
    [[{ stage: 0, count: 1 }, { stage: 2, count: 1 }], [{ stage: 3, count: 3 }], [{ stage: 4, count: 1 }, { stage: 5, count: 1 }]],
    [['paragraph', 'list'], ['paragraph', 'list', 'blockquote'], ['list', 'paragraph']]),
  'retrieval-paths': binding('rag-vs-agent', 5,
    ['概要: RAG と Agent は軸が違う', '詳細: 検索を使う 3 つの構成と検索なしの選択肢'],
    [[{ stage: 0, count: 2 }], [{ stage: 1, count: 1 }, { stage: 2, count: 1 }, { stage: 4, count: 1 }, { stage: 3, count: 1 }]],
    [['paragraph', 'paragraph'], ['code', 'list', 'paragraph', 'paragraph']]),
  'retrieval-choice': binding('rag-vs-agent', 5,
    ['設計判断: どれで作るか', '例: 同じ知識ソースでも質問で構成が変わる'],
    [[{ stage: 0, count: 1 }, { stage: 4, count: 1 }], [{ stage: 0, count: 1 }, { stage: 1, count: 1 }, { stage: 2, count: 1 }]],
    [['table', 'paragraph'], ['paragraph', 'list', 'paragraph']]),
  'delegation-boundaries': binding('single-vs-multi-agent', 7,
    ['概要', '詳細: マルチにする 4 つの動機', '詳細: 代償'],
    [[{ stage: 0, count: 1 }, { stage: 1, count: 1 }], [{ stage: 2, count: 1 }, { stage: 1, count: 1 }], [{ stage: 6, count: 1 }]],
    [['list', 'paragraph'], ['table', 'paragraph'], ['list']]),
  'delegation-patterns': binding('single-vs-multi-agent', 5,
    ['詳細: 基本形', '設計判断: まずシングルで粘る'],
    [[{ stage: 0, count: 1 }, { stage: 1, count: 1 }, { stage: 2, count: 1 }], [{ stage: 3, count: 1 }, { stage: 4, count: 2 }]],
    [['code', 'list', 'paragraph'], ['paragraph', 'list', 'paragraph']])
}
