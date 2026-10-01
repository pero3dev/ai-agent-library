import { AGENT_CONCEPT_BINDINGS } from './agent-concepts-bindings.mjs'
import { OVERVIEW_BINDINGS } from './overview-reading-bindings.mjs'
import { CONTEXT_DESIGN_BINDINGS } from './context-design-bindings.mjs'
import { ACTION_BOUNDARY_BINDINGS } from './action-boundaries-bindings.mjs'
import { HARNESS_LOOP_BINDINGS } from './harness-loop-bindings.mjs'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// IDs resolve to code-owned bindings, never to module paths supplied by Markdown
// or the registry. Adding a diagram requires an explicit implementation change.
const BINDINGS = {
  ...HARNESS_LOOP_BINDINGS,
  ...ACTION_BOUNDARY_BINDINGS,
  ...CONTEXT_DESIGN_BINDINGS,
  ...OVERVIEW_BINDINGS,
  ...AGENT_CONCEPT_BINDINGS,
  'multimodal-representation': {
  "article": "docs/10-llm-foundations/multimodal-models.md",
  "route": "/docs/llm-foundations/multimodal-models",
  "binding": "grouped-blocks",
  "stageCount": 5,
  "headings": [
    "直感①: すべてを「表現ベクトルの列」に変換する",
    "直感②: 画像は「パッチ」に分けてトークン相当にする",
    "直感③: 統一された系列を注意機構で混ぜ合わせる"
  ],
  "sourceHeadings": [
    "概要: 分担と「同じ土俵に載せる」",
    "直感①: すべてを「表現ベクトルの列」に変換する",
    "直感②: 画像は「パッチ」に分けてトークン相当にする",
    "直感③: 統一された系列を注意機構で混ぜ合わせる",
    "なぜ効くのか、どこで崖が来るのか",
    "トークン経済とコスト・レイテンシ設計",
    "理解と生成は別物: 非対称に注意"
  ],
  "blockGroups": [
    [
      {
        "stage": 0,
        "count": 1
      },
      {
        "stage": 1,
        "count": 2
      }
    ],
    [
      {
        "stage": 2,
        "count": 2
      }
    ],
    [
      {
        "stage": 3,
        "count": 1
      },
      {
        "stage": 4,
        "count": 1
      }
    ]
  ],
  "blockTypes": [
    [
      "paragraph",
      "list",
      "paragraph"
    ],
    [
      "paragraph",
      "list"
    ],
    [
      "paragraph",
      "list"
    ]
  ]
},
  'multimodal-input-tradeoffs': {
  "article": "docs/10-llm-foundations/multimodal-models.md",
  "route": "/docs/llm-foundations/multimodal-models",
  "binding": "grouped-blocks",
  "stageCount": 4,
  "headings": [
    "なぜ効くのか、どこで崖が来るのか",
    "トークン経済とコスト・レイテンシ設計",
    "理解と生成は別物: 非対称に注意"
  ],
  "sourceHeadings": [
    "直感①: すべてを「表現ベクトルの列」に変換する",
    "直感②: 画像は「パッチ」に分けてトークン相当にする",
    "直感③: 統一された系列を注意機構で混ぜ合わせる",
    "なぜ効くのか、どこで崖が来るのか",
    "トークン経済とコスト・レイテンシ設計",
    "理解と生成は別物: 非対称に注意"
  ],
  "blockGroups": [
    [
      {
        "stage": 0,
        "count": 1
      },
      {
        "stage": 1,
        "count": 1
      }
    ],
    [
      {
        "stage": 2,
        "count": 2
      }
    ],
    [
      {
        "stage": 3,
        "count": 3
      }
    ]
  ],
  "blockTypes": [
    [
      "paragraph",
      "list"
    ],
    [
      "paragraph",
      "list"
    ],
    [
      "paragraph",
      "list",
      "blockquote"
    ]
  ]
},
  'capabilities-assessment': {
  "article": "docs/10-llm-foundations/capabilities-and-limits.md",
  "route": "/docs/llm-foundations/capabilities-and-limits",
  "binding": "grouped-blocks",
  "stageCount": 5,
  "headings": [
    "概要: 流暢さと正確さは別の能力",
    "得意と不得意の構造",
    "ツールによる補完: Agent 設計の理論的根拠",
    "世代差とスケーリングの読み方",
    "能力見積りの実務"
  ],
  "sourceHeadings": [
    "概要: 流暢さと正確さは別の能力",
    "得意と不得意の構造",
    "ツールによる補完: Agent 設計の理論的根拠",
    "世代差とスケーリングの読み方",
    "能力見積りの実務"
  ],
  "blockGroups": [
    [
      {
        "stage": 0,
        "count": 1
      }
    ],
    [
      {
        "stage": 1,
        "count": 3
      }
    ],
    [
      {
        "stage": 2,
        "count": 3
      }
    ],
    [
      {
        "stage": 3,
        "count": 2
      }
    ],
    [
      {
        "stage": 4,
        "count": 2
      }
    ]
  ],
  "blockTypes": [
    [
      "paragraph"
    ],
    [
      "paragraph",
      "table",
      "paragraph"
    ],
    [
      "paragraph",
      "list",
      "paragraph"
    ],
    [
      "paragraph",
      "list"
    ],
    [
      "paragraph",
      "list"
    ]
  ]
},
  'interpretability-evidence': {
  "article": "docs/11-llm-internals/interpretability-basics.md",
  "route": "/docs/llm-internals/interpretability-basics",
  "binding": "grouped-blocks",
  "stageCount": 5,
  "headings": [
    "概要: 行動を見るか、機構を理解するか",
    "プロービング: 表現に情報はあるか",
    "帰属と「注意は説明か」論争",
    "回路: 誘導ヘッドという発見"
  ],
  "sourceHeadings": [
    "概要: 行動を見るか、機構を理解するか",
    "プロービング: 表現に情報はあるか",
    "帰属と「注意は説明か」論争",
    "回路: 誘導ヘッドという発見",
    "実務への応用可能性と限界"
  ],
  "blockGroups": [
    [
      {
        "stage": 0,
        "count": 3
      }
    ],
    [
      {
        "stage": 1,
        "count": 2
      }
    ],
    [
      {
        "stage": 2,
        "count": 3
      }
    ],
    [
      {
        "stage": 3,
        "count": 2
      },
      {
        "stage": 4,
        "count": 1
      }
    ]
  ],
  "blockTypes": [
    [
      "paragraph",
      "list",
      "paragraph"
    ],
    [
      "paragraph",
      "paragraph"
    ],
    [
      "paragraph",
      "list",
      "paragraph"
    ],
    [
      "paragraph",
      "list",
      "paragraph"
    ]
  ]
},
  'interpretability-sae': {
  "article": "docs/11-llm-internals/interpretability-basics.md",
  "route": "/docs/llm-internals/interpretability-basics",
  "binding": "grouped-blocks",
  "stageCount": 4,
  "headings": [
    "重ね合わせと SAE: 特徴を疎に取り出す"
  ],
  "sourceHeadings": [
    "概要: 行動を見るか、機構を理解するか",
    "重ね合わせと SAE: 特徴を疎に取り出す",
    "実務への応用可能性と限界"
  ],
  "blockGroups": [
    [
      {
        "stage": 0,
        "count": 1
      },
      {
        "stage": 1,
        "count": 1
      },
      {
        "stage": 2,
        "count": 2
      },
      {
        "stage": 3,
        "count": 1
      }
    ]
  ],
  "blockTypes": [
    [
      "paragraph",
      "list",
      "math",
      "paragraph",
      "paragraph"
    ]
  ]
},
  'icl-hypotheses': {
  "article": "docs/11-llm-internals/in-context-learning-and-memorization.md",
  "route": "/docs/llm-internals/in-context-learning-and-memorization",
  "binding": "grouped-blocks",
  "stageCount": 5,
  "headings": [
    "概要: 重みを変えずに「学ぶ」ように見える",
    "ICL はなぜ起きるか: 主要な理論仮説"
  ],
  "sourceHeadings": [
    "概要: 重みを変えずに「学ぶ」ように見える",
    "ICL はなぜ起きるか: 主要な理論仮説"
  ],
  "blockGroups": [
    [
      {
        "stage": 0,
        "count": 1
      }
    ],
    [
      {
        "stage": 1,
        "count": 4
      },
      {
        "stage": 3,
        "count": 1
      },
      {
        "stage": 4,
        "count": 1
      }
    ]
  ],
  "blockTypes": [
    [
      "paragraph"
    ],
    [
      "paragraph",
      "list",
      "math",
      "paragraph",
      "list",
      "paragraph"
    ]
  ]
},
  'icl-demonstrations': {
  "article": "docs/11-llm-internals/in-context-learning-and-memorization.md",
  "route": "/docs/llm-internals/in-context-learning-and-memorization",
  "binding": "grouped-blocks",
  "stageCount": 3,
  "headings": [
    "few-shot の例の効き方"
  ],
  "sourceHeadings": [
    "概要: 重みを変えずに「学ぶ」ように見える",
    "ICL はなぜ起きるか: 主要な理論仮説",
    "few-shot の例の効き方"
  ],
  "blockGroups": [
    [
      {
        "stage": 0,
        "count": 1
      },
      {
        "stage": 1,
        "count": 1
      },
      {
        "stage": 2,
        "count": 1
      }
    ]
  ],
  "blockTypes": [
    [
      "paragraph",
      "list",
      "paragraph"
    ]
  ]
},
  'icl-memory-evaluation': {
  "article": "docs/11-llm-internals/in-context-learning-and-memorization.md",
  "route": "/docs/llm-internals/in-context-learning-and-memorization",
  "binding": "grouped-blocks",
  "stageCount": 5,
  "headings": [
    "記憶と汎化",
    "データ汚染とベンチマークへの含意"
  ],
  "sourceHeadings": [
    "記憶と汎化",
    "データ汚染とベンチマークへの含意"
  ],
  "blockGroups": [
    [
      {
        "stage": 0,
        "count": 1
      },
      {
        "stage": 2,
        "count": 1
      },
      {
        "stage": 3,
        "count": 1
      }
    ],
    [
      {
        "stage": 4,
        "count": 2
      }
    ]
  ],
  "blockTypes": [
    [
      "paragraph",
      "list",
      "paragraph"
    ],
    [
      "paragraph",
      "list"
    ]
  ]
},
  'context-causal-cost': {
  "article": "docs/10-llm-foundations/attention-and-context.md",
  "route": "/docs/llm-foundations/attention-and-context",
  "binding": "grouped-blocks",
  "stageCount": 5,
  "headings": [
    "概要: 「全部が全部を見る」仕組みとその請求書",
    "注意機構の直感",
    "コンテキスト長のコスト構造"
  ],
  "sourceHeadings": [
    "概要: 「全部が全部を見る」仕組みとその請求書",
    "注意機構の直感",
    "コンテキスト長のコスト構造",
    "KV キャッシュとプロンプトキャッシュ"
  ],
  "blockGroups": [
    [
      {
        "stage": 0,
        "count": 1
      }
    ],
    [
      {
        "stage": 1,
        "count": 1
      },
      {
        "stage": 2,
        "count": 2
      }
    ],
    [
      {
        "stage": 3,
        "count": 2
      },
      {
        "stage": 4,
        "count": 1
      }
    ]
  ],
  "blockTypes": [
    [
      "paragraph"
    ],
    [
      "paragraph",
      "paragraph",
      "list"
    ],
    [
      "paragraph",
      "table",
      "paragraph"
    ]
  ]
},
  'context-cache-quality': {
  "article": "docs/10-llm-foundations/attention-and-context.md",
  "route": "/docs/llm-foundations/attention-and-context",
  "binding": "grouped-blocks",
  "stageCount": 6,
  "headings": [
    "KV キャッシュとプロンプトキャッシュ",
    "長文での品質劣化"
  ],
  "sourceHeadings": [
    "概要: 「全部が全部を見る」仕組みとその請求書",
    "注意機構の直感",
    "コンテキスト長のコスト構造",
    "KV キャッシュとプロンプトキャッシュ",
    "長文での品質劣化"
  ],
  "blockGroups": [
    [
      {
        "stage": 0,
        "count": 1
      },
      {
        "stage": 2,
        "count": 1
      }
    ],
    [
      {
        "stage": 3,
        "count": 1
      },
      {
        "stage": 4,
        "count": 1
      },
      {
        "stage": 5,
        "count": 1
      }
    ]
  ],
  "blockTypes": [
    [
      "paragraph",
      "list"
    ],
    [
      "paragraph",
      "list",
      "paragraph"
    ]
  ]
},
  'reasoning-sequence': {
  "article": "docs/10-llm-foundations/reasoning-models.md",
  "route": "/docs/llm-foundations/reasoning-models",
  "binding": "grouped-blocks",
  "stageCount": 4,
  "headings": [
    "仕組みの直感: 答える前に考えを書く"
  ],
  "sourceHeadings": [
    "仕組みの直感: 答える前に考えを書く",
    "思考量の制御とコスト・レイテンシ設計",
    "プロンプトの変化: 必須手順と探索の余地を分ける",
    "評価の注意: 思考は見えず、揺れる"
  ],
  "blockGroups": [
    [
      {
        "stage": 0,
        "count": 1
      },
      {
        "stage": 2,
        "count": 1
      },
      {
        "stage": 3,
        "count": 1
      }
    ]
  ],
  "blockTypes": [
    [
      "paragraph",
      "list",
      "paragraph"
    ]
  ]
},
  'reasoning-evaluation': {
  "article": "docs/10-llm-foundations/reasoning-models.md",
  "route": "/docs/llm-foundations/reasoning-models",
  "binding": "grouped-blocks",
  "stageCount": 5,
  "headings": [
    "効くタスクと効かないタスク",
    "思考量の制御とコスト・レイテンシ設計",
    "考えすぎ(overthinking)",
    "プロンプトの変化: 必須手順と探索の余地を分ける",
    "評価の注意: 思考は見えず、揺れる"
  ],
  "sourceHeadings": [
    "仕組みの直感: 答える前に考えを書く",
    "効くタスクと効かないタスク",
    "思考量の制御とコスト・レイテンシ設計",
    "考えすぎ(overthinking)",
    "プロンプトの変化: 必須手順と探索の余地を分ける",
    "評価の注意: 思考は見えず、揺れる"
  ],
  "blockGroups": [
    [
      {
        "stage": 0,
        "count": 3
      }
    ],
    [
      {
        "stage": 1,
        "count": 2
      }
    ],
    [
      {
        "stage": 2,
        "count": 2
      }
    ],
    [
      {
        "stage": 3,
        "count": 2
      }
    ],
    [
      {
        "stage": 4,
        "count": 2
      }
    ]
  ],
  "blockTypes": [
    [
      "paragraph",
      "table",
      "paragraph"
    ],
    [
      "paragraph",
      "list"
    ],
    [
      "paragraph",
      "list"
    ],
    [
      "paragraph",
      "list"
    ],
    [
      "paragraph",
      "list"
    ]
  ]
},
  'alignment-preference': {
  "article": "docs/11-llm-internals/alignment-theory.md",
  "route": "/docs/llm-internals/alignment-theory",
  "binding": "grouped-blocks",
  "stageCount": 7,
  "headings": [
    "概要: 「良さ」をどう最適化するか",
    "RLHF の定式化",
    "DPO の導出: 報酬モデルを消す"
  ],
  "sourceHeadings": [
    "概要: 「良さ」をどう最適化するか",
    "RLHF の定式化",
    "DPO の導出: 報酬モデルを消す",
    "報酬の過剰最適化(Goodhart)"
  ],
  "blockGroups": [
    [
      {
        "stage": 0,
        "count": 2
      }
    ],
    [
      {
        "stage": 1,
        "count": 2
      },
      {
        "stage": 2,
        "count": 2
      },
      {
        "stage": 3,
        "count": 2
      },
      {
        "stage": 4,
        "count": 1
      }
    ],
    [
      {
        "stage": 5,
        "count": 3
      },
      {
        "stage": 6,
        "count": 2
      }
    ]
  ],
  "blockTypes": [
    [
      "paragraph",
      "code"
    ],
    [
      "paragraph",
      "paragraph",
      "math",
      "paragraph",
      "paragraph",
      "math",
      "paragraph"
    ],
    [
      "paragraph",
      "math",
      "paragraph",
      "math",
      "paragraph"
    ]
  ]
},
  'alignment-reward-risk': {
  "article": "docs/11-llm-internals/alignment-theory.md",
  "route": "/docs/llm-internals/alignment-theory",
  "binding": "grouped-blocks",
  "stageCount": 3,
  "headings": [
    "報酬の過剰最適化(Goodhart)"
  ],
  "sourceHeadings": [
    "RLHF の定式化",
    "報酬の過剰最適化(Goodhart)"
  ],
  "blockGroups": [
    [
      {
        "stage": 0,
        "count": 1
      },
      {
        "stage": 1,
        "count": 1
      },
      {
        "stage": 2,
        "count": 1
      }
    ]
  ],
  "blockTypes": [
    [
      "paragraph",
      "list",
      "paragraph"
    ]
  ]
},
  'alignment-feedback': {
  "article": "docs/11-llm-internals/alignment-theory.md",
  "route": "/docs/llm-internals/alignment-theory",
  "binding": "grouped-blocks",
  "stageCount": 5,
  "headings": [
    "検証可能報酬(RLVR)とプロセス報酬",
    "迎合とアラインメント税"
  ],
  "sourceHeadings": [
    "概要: 「良さ」をどう最適化するか",
    "報酬の過剰最適化(Goodhart)",
    "検証可能報酬(RLVR)とプロセス報酬",
    "迎合とアラインメント税"
  ],
  "blockGroups": [
    [
      {
        "stage": 0,
        "count": 1
      },
      {
        "stage": 1,
        "count": 1
      },
      {
        "stage": 2,
        "count": 1
      }
    ],
    [
      {
        "stage": 3,
        "count": 2
      },
      {
        "stage": 4,
        "count": 1
      }
    ]
  ],
  "blockTypes": [
    [
      "paragraph",
      "list",
      "paragraph"
    ],
    [
      "paragraph",
      "list",
      "paragraph"
    ]
  ]
},
  'pretraining-loss-perplexity': {
  article: 'docs/11-llm-internals/pretraining-and-scaling-laws.md',
  route: '/docs/llm-internals/pretraining-and-scaling-laws',
  binding: 'grouped-blocks',
  stageCount: 5,
  headings: [ '概要: 事前学習は「次トークン予測」の一点', '次トークン予測の目的関数' ],
  sourceHeadings: [ '概要: 事前学習は「次トークン予測」の一点', '次トークン予測の目的関数' ],
  blockGroups: [
    [ { stage: 0, count: 1 } ],
    [
      { stage: 1, count: 1 },
      { stage: 2, count: 2 },
      { stage: 3, count: 2 },
      { stage: 4, count: 1 }
    ]
  ],
  blockTypes: [ [ 'paragraph' ], [ 'paragraph', 'math', 'paragraph', 'paragraph', 'math', 'paragraph' ] ]
},
  'pretraining-scaling': {
  article: 'docs/11-llm-internals/pretraining-and-scaling-laws.md',
  route: '/docs/llm-internals/pretraining-and-scaling-laws',
  binding: 'grouped-blocks',
  stageCount: 6,
  headings: [ 'スケーリング則の系譜' ],
  sourceHeadings: [ 'スケーリング則の系譜', '学習の計算量の目安' ],
  blockGroups: [
    [
      { stage: 0, count: 1 },
      { stage: 1, count: 2 },
      { stage: 3, count: 1 },
      { stage: 4, count: 1 },
      { stage: 5, count: 1 }
    ]
  ],
  blockTypes: [ [ 'paragraph', 'math', 'paragraph', 'list', 'code', 'paragraph' ] ]
},
  'pretraining-data': {
  article: 'docs/11-llm-internals/pretraining-and-scaling-laws.md',
  route: '/docs/llm-internals/pretraining-and-scaling-laws',
  binding: 'grouped-blocks',
  stageCount: 4,
  headings: [ 'データ側: 量・品質・混合・繰り返し' ],
  sourceHeadings: [ 'スケーリング則の系譜', 'データ側: 量・品質・混合・繰り返し' ],
  blockGroups: [ [ { stage: 0, count: 1 }, { stage: 2, count: 1 }, { stage: 3, count: 1 } ] ],
  blockTypes: [ [ 'paragraph', 'list', 'paragraph' ] ]
},
  'pretraining-metrics': {
  article: 'docs/11-llm-internals/pretraining-and-scaling-laws.md',
  route: '/docs/llm-internals/pretraining-and-scaling-laws',
  binding: 'grouped-blocks',
  stageCount: 4,
  headings: [ '創発的能力の論争' ],
  sourceHeadings: [ '創発的能力の論争' ],
  blockGroups: [ [ { stage: 0, count: 1 }, { stage: 2, count: 1 }, { stage: 3, count: 1 } ] ],
  blockTypes: [ [ 'paragraph', 'list', 'paragraph' ] ]
},
  'pretraining-compute': {
  article: 'docs/11-llm-internals/pretraining-and-scaling-laws.md',
  route: '/docs/llm-internals/pretraining-and-scaling-laws',
  binding: 'grouped-blocks',
  stageCount: 4,
  headings: [ '学習の計算量の目安' ],
  sourceHeadings: [ 'スケーリング則の系譜', '学習の計算量の目安' ],
  blockGroups: [ [ { stage: 0, count: 1 }, { stage: 1, count: 1 }, { stage: 3, count: 1 } ] ],
  blockTypes: [ [ 'paragraph', 'math', 'paragraph' ] ]
},
  'training-stages': {
    article: 'docs/10-llm-foundations/llm-training-pipeline.md',
    route: '/docs/llm-foundations/llm-training-pipeline',
    binding: 'grouped-blocks', stageCount: 6,
    headings: [
      '概要: 3 つの工程と、それぞれが残す「癖」', '事前学習: 次トークン予測で知識を得る',
      '指示チューニング(SFT): 指示に従う形式を学ぶ', '選好調整: 「良い応答」の基準を最適化する'
    ],
    sourceHeadings: [
      '概要: 3 つの工程と、それぞれが残す「癖」', '事前学習: 次トークン予測で知識を得る',
      '指示チューニング(SFT): 指示に従う形式を学ぶ', '選好調整: 「良い応答」の基準を最適化する'
    ],
    blockGroups: [
      [{ stage: 0, count: 2 }], [{ stage: 1, count: 1 }, { stage: 2, count: 1 }],
      [{ stage: 3, count: 1 }, { stage: 4, count: 1 }], [{ stage: 5, count: 1 }]
    ],
    blockTypes: [['paragraph', 'code'], ['paragraph', 'list'], ['paragraph', 'paragraph'], ['paragraph']]
  },
  'training-runtime-boundary': {
    article: 'docs/10-llm-foundations/llm-training-pipeline.md',
    route: '/docs/llm-foundations/llm-training-pipeline',
    binding: 'grouped-blocks', stageCount: 4,
    headings: ['この工程から生まれる性質: 幻覚・迎合・拒否'],
    sourceHeadings: [
      '概要: 3 つの工程と、それぞれが残す「癖」', '事前学習: 次トークン予測で知識を得る',
      '指示チューニング(SFT): 指示に従う形式を学ぶ', '選好調整: 「良い応答」の基準を最適化する',
      'この工程から生まれる性質: 幻覚・迎合・拒否', 'この理解が効く場面'
    ],
    blockGroups: [[{ stage: 0, count: 1 }, { stage: 2, count: 1 }, { stage: 3, count: 1 }]],
    blockTypes: [['paragraph', 'list', 'paragraph']]
  },
  'inference-sampling': { article: 'docs/11-llm-internals/inference-internals.md',
    route: '/docs/llm-internals/inference-internals',
    binding: 'grouped-blocks',
    stageCount: 7,
    headings: [ 'ロジット → 確率 → 選択の数理' ],
    sourceHeadings: [ '概要: プリフィルとデコードの 2 相', 'ロジット → 確率 → 選択の数理' ],
    blockGroups: [ [ { stage: 0, count: 1 }, { stage: 1, count: 3 }, { stage: 3, count: 2 }, { stage: 6, count: 1 } ] ],
    blockTypes: [ [ 'paragraph', 'paragraph', 'math', 'paragraph', 'paragraph', 'list', 'paragraph' ] ] },
  'inference-cache-batching': { article: 'docs/11-llm-internals/inference-internals.md',
    route: '/docs/llm-internals/inference-internals',
    binding: 'grouped-blocks',
    stageCount: 6,
    headings: [ 'プリフィルとデコードの計算量・メモリ', 'バッチングと連続バッチング' ],
    sourceHeadings: [ '概要: プリフィルとデコードの 2 相', 'プリフィルとデコードの計算量・メモリ', 'バッチングと連続バッチング' ],
    blockGroups:
     [ [ { stage: 1, count: 3 }, { stage: 2, count: 2 } ],
       [ { stage: 3, count: 1 }, { stage: 4, count: 1 }, { stage: 5, count: 1 } ] ],
    blockTypes: [ [ 'paragraph', 'math', 'paragraph', 'paragraph', 'list' ], [ 'paragraph', 'list', 'paragraph' ] ] },
  'inference-speculative': { article: 'docs/11-llm-internals/inference-internals.md',
    route: '/docs/llm-internals/inference-internals',
    binding: 'grouped-blocks',
    stageCount: 6,
    headings: [ '投機的デコーディング' ],
    sourceHeadings:
     [ '概要: プリフィルとデコードの 2 相', 'ロジット → 確率 → 選択の数理', 'プリフィルとデコードの計算量・メモリ', '投機的デコーディング' ],
    blockGroups: [ [ { stage: 0, count: 1 }, { stage: 2, count: 1 }, { stage: 4, count: 1 }, { stage: 5, count: 1 } ] ],
    blockTypes: [ [ 'paragraph', 'list', 'paragraph', 'paragraph' ] ] },
  'inference-quantization': { article: 'docs/11-llm-internals/inference-internals.md',
    route: '/docs/llm-internals/inference-internals',
    binding: 'grouped-blocks',
    stageCount: 4,
    headings: [ '量子化' ],
    sourceHeadings: [ 'プリフィルとデコードの計算量・メモリ', '量子化' ],
    blockGroups: [ [ { stage: 0, count: 1 }, { stage: 2, count: 1 }, { stage: 3, count: 1 } ] ],
    blockTypes: [ [ 'paragraph', 'list', 'paragraph' ] ] },
  'generation-token-loop': {
    article: 'docs/10-llm-foundations/how-llms-generate-text.md',
    route: '/docs/llm-foundations/how-llms-generate-text',
    binding: 'grouped-blocks',
    stageCount: 8,
    headings: [ '概要: たった 1 つのループ', '次トークン予測という実体', 'サンプリングと温度', '「同じ入力で違う出力」になる理由', '停止とストリーミング' ],
    sourceHeadings: [ '概要: たった 1 つのループ', '次トークン予測という実体', 'サンプリングと温度', '「同じ入力で違う出力」になる理由', '停止とストリーミング' ],
    blockGroups: [
      [ { stage: 0, count: 3 } ],
      [ { stage: 3, count: 2 } ],
      [ { stage: 4, count: 3 } ],
      [ { stage: 5, count: 3 } ],
      [ { stage: 6, count: 3 }, { stage: 7, count: 1 } ]
    ],
    blockTypes: [
      [ 'paragraph', 'code', 'paragraph' ],
      [ 'paragraph', 'list' ],
      [ 'paragraph', 'table', 'paragraph' ],
      [ 'paragraph', 'list', 'paragraph' ],
      [ 'paragraph', 'list', 'paragraph', 'paragraph' ]
    ]
  },
  'tokenization-counting': {
    article: 'docs/10-llm-foundations/tokenization.md',
    route: '/docs/llm-foundations/tokenization',
    binding: 'grouped-blocks',
    stageCount: 7,
    headings: [ '概要: トークンは LLM 世界の通貨', 'トークンとは何か: サブワード分割の直感', '言語と内容による効率差', 'モデル間の非互換: 移行時の再見積り', '見積りと計測の実務' ],
    sourceHeadings: [ '概要: トークンは LLM 世界の通貨', 'トークンとは何か: サブワード分割の直感', '言語と内容による効率差', 'モデル間の非互換: 移行時の再見積り', '見積りと計測の実務' ],
    blockGroups: [
      [ { stage: 0, count: 1 }, { stage: 1, count: 1 } ],
      [ { stage: 2, count: 3 } ],
      [ { stage: 3, count: 2 } ],
      [ { stage: 4, count: 2 } ],
      [ { stage: 5, count: 1 } ]
    ],
    blockTypes: [
      [ 'paragraph', 'paragraph' ],
      [ 'paragraph', 'list', 'paragraph' ],
      [ 'paragraph', 'list' ],
      [ 'paragraph', 'list' ],
      [ 'list' ]
    ]
  },
  'moe-routing-load': {
    article: 'docs/11-llm-internals/mixture-of-experts-internals.md',
    route: '/docs/llm-internals/mixture-of-experts-internals',
    binding: 'grouped-blocks', stageCount: 8,
    headings: ['概要: 総パラメータと計算量を切り離す', '疎な活性化とルーティング', '負荷分散: 崩壊をどう防ぐか'],
    sourceHeadings: [
      '概要: 総パラメータと計算量を切り離す', '疎な活性化とルーティング', '負荷分散: 崩壊をどう防ぐか',
      '専門化の実態', '総 vs アクティブパラメータの数理'
    ],
    blockGroups: [
      [{ stage: 0, count: 3 }],
      [{ stage: 1, count: 2 }, { stage: 2, count: 1 }, { stage: 3, count: 2 }, { stage: 4, count: 1 }],
      [{ stage: 5, count: 2 }, { stage: 7, count: 2 }]
    ],
    blockTypes: [
      ['paragraph', 'code', 'paragraph'],
      ['paragraph', 'math', 'paragraph', 'math', 'paragraph', 'paragraph'],
      ['paragraph', 'list', 'math', 'paragraph']
    ]
  },
  'moe-parameters-communication': {
    article: 'docs/11-llm-internals/mixture-of-experts-internals.md',
    route: '/docs/llm-internals/mixture-of-experts-internals',
    binding: 'grouped-blocks', stageCount: 6,
    headings: ['総 vs アクティブパラメータの数理', '提供・運用への含意'],
    sourceHeadings: [
      '概要: 総パラメータと計算量を切り離す', '疎な活性化とルーティング', '負荷分散: 崩壊をどう防ぐか',
      '専門化の実態', '総 vs アクティブパラメータの数理', '提供・運用への含意'
    ],
    blockGroups: [[{ stage: 0, count: 2 }, { stage: 1, count: 2 }, { stage: 2, count: 1 }], [{ stage: 5, count: 1 }]],
    blockTypes: [['paragraph', 'list', 'math', 'paragraph', 'list'], ['list']]
  },
  'self-attention': {
    article: 'docs/11-llm-internals/transformer-architecture.md',
    route: '/docs/llm-internals/transformer-architecture',
    binding: 'attention-section', stageCount: 6,
    headings: ['自己注意の数式'],
    sourceHeadings: ['自己注意の数式']
  },
  'agent-loop': {
    article: 'docs/01-concepts/agent-loop.md',
    route: '/docs/concepts/agent-loop',
    binding: 'ordered-steps', stageCount: 5,
    headings: ['詳細: 1 イテレーションの分解'],
    sourceHeadings: [
      '詳細: 1 イテレーションの分解',
      '詳細: 停止条件は「正常完了」以外に必ず用意する',
      '詳細: ツールの失敗はループに返す',
      '詳細: 履歴は単調増加する'
    ]
  },
  'workflow-comparison': {
    article: 'docs/02-architecture/workflow-vs-agent.md',
    route: '/docs/architecture/workflow-vs-agent',
    binding: 'consecutive-sections', stageCount: 5,
    headings: [
      '概要: 原則は「同じ品質なら、自律性の低い方」',
      '詳細: トレードオフの全体像', '詳細: 判断フロー',
      '詳細: ハイブリッドという現実解', '設計判断: 段階的な移行を前提にする'
    ],
    sourceHeadings: [
      '概要: 原則は「同じ品質なら、自律性の低い方」',
      '詳細: トレードオフの全体像', '詳細: 判断フロー',
      '詳細: ハイブリッドという現実解', '設計判断: 段階的な移行を前提にする'
    ]
  },
  'transformer-io': {
    article: 'docs/11-llm-internals/transformer-architecture.md',
    route: '/docs/llm-internals/transformer-architecture',
    binding: 'grouped-blocks', stageCount: 4,
    headings: ['概要: デコーダ専用 Transformer の全体像', '埋め込みと出力ヘッド'],
    sourceHeadings: ['概要: デコーダ専用 Transformer の全体像', '埋め込みと出力ヘッド'],
    blockGroups: [[{ stage: 0, count: 4 }], [{ stage: 1, count: 3 }, { stage: 2, count: 2 }, { stage: 3, count: 1 }]],
    blockTypes: [
      ['paragraph', 'code', 'paragraph', 'paragraph'],
      ['paragraph', 'math', 'paragraph', 'paragraph', 'math', 'paragraph']
    ]
  },
  'transformer-position': {
    article: 'docs/11-llm-internals/transformer-architecture.md',
    route: '/docs/llm-internals/transformer-architecture',
    binding: 'grouped-blocks', stageCount: 4,
    headings: ['位置符号化: 順序をどう入れるか'],
    sourceHeadings: ['位置符号化: 順序をどう入れるか', '自己注意の数式'],
    blockGroups: [[{ stage: 0, count: 2 }, { stage: 2, count: 1 }, { stage: 3, count: 2 }]],
    blockTypes: [['paragraph', 'list', 'paragraph', 'math', 'paragraph']]
  },
  'attention-kv-sharing': {
    article: 'docs/11-llm-internals/attention-variants-and-long-context.md',
    route: '/docs/llm-internals/attention-variants-and-long-context',
    binding: 'grouped-blocks', stageCount: 5,
    headings: ['概要: 2 つの圧力', 'KV キャッシュを減らす: MQA と GQA'],
    sourceHeadings: ['概要: 2 つの圧力', 'KV キャッシュを減らす: MQA と GQA'],
    blockGroups: [[{ stage: 0, count: 2 }, { stage: 1, count: 3 }], [{ stage: 4, count: 4 }]],
    blockTypes: [['paragraph', 'list', 'paragraph', 'math', 'paragraph'], ['paragraph', 'paragraph', 'math', 'paragraph']]
  },
  'attention-compute-memory': {
    article: 'docs/11-llm-internals/attention-variants-and-long-context.md',
    route: '/docs/llm-internals/attention-variants-and-long-context',
    binding: 'grouped-blocks', stageCount: 6,
    headings: ['注意を疎にする: 局所・スライディング窓・スパース', '線形注意という別路線', 'FlashAttention: 厳密なまま速く'],
    sourceHeadings: ['概要: 2 つの圧力', '注意を疎にする: 局所・スライディング窓・スパース', '線形注意という別路線', 'FlashAttention: 厳密なまま速く'],
    blockGroups: [[{ stage: 0, count: 3 }], [{ stage: 1, count: 1 }, { stage: 2, count: 2 }], [{ stage: 3, count: 1 }, { stage: 4, count: 1 }, { stage: 5, count: 1 }]],
    blockTypes: [['paragraph', 'list', 'paragraph'], ['paragraph', 'math', 'paragraph'], ['paragraph', 'list', 'paragraph']]
  },
  'attention-context-range': {
    article: 'docs/11-llm-internals/attention-variants-and-long-context.md',
    route: '/docs/llm-internals/attention-variants-and-long-context',
    binding: 'grouped-blocks', stageCount: 4,
    headings: ['位置の対応範囲を伸ばす: 外挿と補間'],
    sourceHeadings: ['概要: 2 つの圧力', '位置の対応範囲を伸ばす: 外挿と補間', '「長コンテキスト対応」表記を読む'],
    blockGroups: [[{ stage: 0, count: 1 }, { stage: 2, count: 2 }]],
    blockTypes: [['paragraph', 'list', 'paragraph']]
  },
  'transformer-block': {
    article: 'docs/11-llm-internals/transformer-architecture.md',
    route: '/docs/llm-internals/transformer-architecture',
    binding: 'grouped-blocks', stageCount: 9,
    headings: ['多頭注意', 'FFN と残差ストリーム', '正規化と学習安定性', 'パラメータの内訳'],
    sourceHeadings: [
      '概要: デコーダ専用 Transformer の全体像', '埋め込みと出力ヘッド', '自己注意の数式',
      '多頭注意', 'FFN と残差ストリーム', '正規化と学習安定性', 'パラメータの内訳'
    ],
    blockGroups: [
      [{ stage: 0, count: 3 }, { stage: 1, count: 3 }],
      [{ stage: 2, count: 3 }, { stage: 3, count: 2 }, { stage: 4, count: 3 }],
      [{ stage: 5, count: 3 }, { stage: 6, count: 1 }],
      [{ stage: 7, count: 3 }, { stage: 8, count: 4 }]
    ],
    blockTypes: [
      ['paragraph', 'math', 'paragraph', 'math', 'paragraph', 'paragraph'],
      ['paragraph', 'math', 'paragraph', 'math', 'paragraph', 'paragraph', 'math', 'paragraph'],
      ['paragraph', 'math', 'paragraph', 'paragraph'],
      ['paragraph', 'list', 'paragraph', 'math', 'paragraph', 'paragraph', 'list']
    ]
  }
}
const ENTRY_KEYS = ['id', 'article', 'route', 'binding', 'stageCount', 'headings', 'sourceHeadings', 'sourceDigest', 'reviewedDigest', 'enabled', 'status', 'articleCoverage']
const digestPattern = /^sha256:[a-f0-9]{64}$/
const exactKeys = (object, keys) => object && typeof object === 'object' && !Array.isArray(object)
  && Object.keys(object).length === keys.length && keys.every(key => Object.hasOwn(object, key))

function matchesBlockGroups(actual, expected) {
  return Array.isArray(actual) && actual.length === expected.length
    && actual.every((groups, section) => Array.isArray(groups) && groups.length === expected[section].length
      && groups.every((group, index) => exactKeys(group, ['stage', 'count'])
        && group.stage === expected[section][index].stage && group.count === expected[section][index].count))
}

export function validateDiagramRegistry(registry) {
  if (!exactKeys(registry, ['schemaVersion', 'diagrams']) || registry.schemaVersion !== 1 || !Array.isArray(registry.diagrams)) {
    throw new Error('動的図 registry: schemaVersion 1 と diagrams が必要です。')
  }
  const seen = new Set()
  for (const entry of registry.diagrams) {
    const expected = Object.hasOwn(BINDINGS, entry?.id) ? BINDINGS[entry.id] : null
    const keys = expected?.binding === 'grouped-blocks' ? [...ENTRY_KEYS, 'blockGroups'] : ENTRY_KEYS
    if (!exactKeys(entry, keys) || !expected || seen.has(entry.id)
      || ['article', 'route', 'binding', 'stageCount'].some(key => entry[key] !== expected[key])
      || JSON.stringify(entry.headings) !== JSON.stringify(expected.headings)
      || JSON.stringify(entry.sourceHeadings) !== JSON.stringify(expected.sourceHeadings)
      || (expected.blockGroups && !matchesBlockGroups(entry.blockGroups, expected.blockGroups))
      || !digestPattern.test(entry.sourceDigest)
      || !(entry.reviewedDigest === null || digestPattern.test(entry.reviewedDigest))
      || typeof entry.enabled !== 'boolean'
      || !['draft', 'registered', 'implemented', 'reviewed'].includes(entry.status)
      || entry.articleCoverage !== 'pending'
      || (entry.status === 'draft' && (entry.enabled || entry.reviewedDigest !== null))
      || (entry.status === 'reviewed' && entry.reviewedDigest !== entry.sourceDigest)) {
      throw new Error(`動的図 registry: 不正な登録または未許可の binding (${entry?.id ?? '?'})`)
    }
    seen.add(entry.id)
  }
  if (seen.size !== Object.keys(BINDINGS).length) throw new Error('動的図 registry: コードで定義されたすべての ID を登録してください。')
  return registry
}

export const diagramRegistry = validateDiagramRegistry(JSON.parse(readFileSync(new URL('../diagrams/registry.json', import.meta.url), 'utf8')))

export function getDiagramEntry(id, registry = diagramRegistry) {
  validateDiagramRegistry(registry)
  const entry = registry.diagrams.find(diagram => diagram.id === id)
  if (!entry) throw new Error(`動的図 registry: 未登録の ID (${id})`)
  return entry
}

const textContent = node => node.value ?? (node.children ?? []).map(textContent).join('')

/** Select original source nodes before glossary decoration or route rewriting. */
function selectSections(tree, entry, headings, contiguous) {
  let parentHeading = ''
  const candidates = []
  tree.children.forEach((node, index) => {
    if (node.type === 'heading' && node.depth === 2) parentHeading = textContent(node)
    if (node.type === 'heading' && node.depth === 3 && parentHeading === '本文') candidates.push({ node, index })
  })
  const sections = headings.map(title => {
    const matches = candidates.filter(({ node }) => textContent(node) === title)
    if (matches.length !== 1) throw new Error(`${entry.route}: 動的図の見出し「${title}」を一意に特定できません。`)
    const start = matches[0].index
    let end = start + 1
    while (end < tree.children.length && !(tree.children[end].type === 'heading' && tree.children[end].depth <= 3)) end++
    return { start, end, heading: tree.children[start], body: tree.children.slice(start + 1, end) }
  })
  if (sections.some((section, index) => index > 0 && (contiguous
    ? sections[index - 1].end !== section.start
    : sections[index - 1].end > section.start))) {
    throw new Error(`${entry.route}: 動的図の見出し順序・連続性が変わりました。`)
  }
  return sections
}

/** Only these consecutive sections are wrapped in the reading layout. */
export function selectDiagramSections(tree, entry) {
  return selectSections(tree, entry, entry.headings, true)
}

// Parsing normalizes Markdown syntax and line endings. Positions are editorial
// metadata, while every other AST field (including math, URLs and code) matters.
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).filter(key => key !== 'position').sort().map(key => [key, canonical(value[key])]))
  return typeof value === 'string' ? value.replace(/\r\n?/g, '\n') : value
}

export function diagramSourceDigest(tree, entry) {
  // Semantic dependencies may live outside the wrapped prose, with other
  // sections between them. Their original order and uniqueness still matter.
  const sections = selectSections(tree, entry, entry.sourceHeadings, false)
  const nodes = sections.flatMap(section => [section.heading, ...section.body])
  const identifiers = new Set()
  const visit = node => {
    if (['linkReference', 'imageReference'].includes(node.type)) identifiers.add(node.identifier)
    for (const child of node.children ?? []) visit(child)
  }
  nodes.forEach(visit)
  // A reference definition can live outside the section but still changes the
  // meaning of its links; include only definitions actually used by this figure.
  const definitions = tree.children.filter(node => node.type === 'definition' && identifiers.has(node.identifier))
  return `sha256:${createHash('sha256').update(JSON.stringify(canonical({ nodes, definitions }))).digest('hex')}`
}

export function assertDiagramSource(tree, entry) {
  const actual = diagramSourceDigest(tree, entry)
  if (entry.sourceDigest !== actual || entry.reviewedDigest !== actual || entry.status !== 'reviewed') {
    throw new Error(`${entry.route}: 動的図 ${entry.id} の本文版とレビュー版が一致しません。本文・図解の対応をレビューしてください。actual=${actual}`)
  }
  const sections = selectDiagramSections(tree, entry)
  if (entry.binding === 'grouped-blocks') {
    const expected = BINDINGS[entry.id]
    for (const [index, section] of sections.entries()) {
      if (JSON.stringify(section.body.map(node => node.type)) !== JSON.stringify(expected.blockTypes[index])
        || entry.blockGroups[index].reduce((sum, group) => sum + group.count, 0) !== section.body.length) {
        throw new Error(`${entry.route}: 動的図 ${entry.id} の本文ブロック構成が変わりました。`)
      }
    }
  }
  return sections
}
