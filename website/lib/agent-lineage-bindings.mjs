const grouped = (article, count, headings, groups, types) => ({ article: `docs/01-concepts/${article}.md`, route: `/docs/concepts/${article}`,
  binding: 'grouped-blocks', stageCount: count, headings, sourceHeadings: headings, blockGroups: groups, blockTypes: types })
export const AGENT_LINEAGE_BINDINGS = {
  'ai-design-lineage': grouped('ai-history-and-lineage', 8,
    ['概要: 年表ではなく「転換点」でたどる', '前史: 記号主義と機械学習の往復', '深層学習の転換点', 'Transformer と事前学習パラダイム', 'スケーリングと基盤モデル化', '指示追従・対話化', 'ツール使用とエージェント化', '歴史から学べる判断の教訓'],
    Array.from({ length: 8 }, (_, stage) => [{ stage, count: 2 }]),
    [['paragraph', 'paragraph'], ['paragraph', 'paragraph'], ...Array.from({ length: 6 }, () => ['paragraph', 'list'])]),
  'world-model-usages': grouped('world-models-overview', 6,
    ['概要: 「世界モデル」は 1 つの意味ではない', '世界モデルの 3 つの用法', 'なぜ注目されるのか'],
    [[{ stage: 0, count: 1 }], [{ stage: 1, count: 1 }, { stage: 4, count: 1 }], [{ stage: 3, count: 2 }, { stage: 5, count: 1 }]],
    [['paragraph'], ['table', 'paragraph'], ['paragraph', 'list', 'paragraph']]),
  'world-model-evidence': grouped('world-models-overview', 4,
    ['ソフトウェアエージェントへの含意', '現在地の読み方: デモと実用の距離'],
    [[{ stage: 0, count: 1 }, { stage: 1, count: 1 }], [{ stage: 3, count: 1 }, { stage: 2, count: 1 }]],
    [['paragraph', 'list'], ['paragraph', 'list']]),
  'physical-ai-boundaries': grouped('physical-ai-overview', 7,
    ['概要: なぜソフトウェアエンジニアが知っておくべきか', 'ソフトウェア Agent との共通点', '本質的に違う点: 3 つの制約'],
    [[{ stage: 0, count: 2 }], [{ stage: 1, count: 1 }, { stage: 2, count: 1 }], [{ stage: 3, count: 1 }, { stage: 4, count: 1 }]],
    [['paragraph', 'paragraph'], ['paragraph', 'list'], ['paragraph', 'list']]),
  'physical-ai-evidence': grouped('physical-ai-overview', 6,
    ['VLA モデルの概観', '現在地と展望(2026-09-10 時点)'],
    [[{ stage: 0, count: 1 }, { stage: 2, count: 3 }, { stage: 3, count: 1 }], [{ stage: 4, count: 2 }, { stage: 5, count: 1 }]],
    [['paragraph', 'paragraph', 'table', 'paragraph', 'paragraph'], ['paragraph', 'list', 'paragraph']])
}
