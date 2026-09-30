// Code-owned placements. Each original paragraph, list, table and Mermaid is kept whole.
export const AGENT_CONCEPT_BINDINGS = {
  'agent-components': {
    article: 'docs/01-concepts/what-is-an-ai-agent.md', route: '/docs/concepts/what-is-an-ai-agent',
    binding: 'grouped-blocks', stageCount: 5,
    headings: ['概要: このライブラリでの定義', '詳細: Agent を構成する 4 つの要素'],
    sourceHeadings: ['概要: このライブラリでの定義', '詳細: Agent を構成する 4 つの要素'],
    blockGroups: [[{ stage: 0, count: 4 }], [{ stage: 1, count: 1 }, { stage: 3, count: 1 }, { stage: 4, count: 1 }]],
    blockTypes: [['paragraph', 'blockquote', 'paragraph', 'paragraph'], ['code', 'table', 'paragraph']]
  },
  'agent-autonomy': {
    article: 'docs/01-concepts/what-is-an-ai-agent.md', route: '/docs/concepts/what-is-an-ai-agent',
    binding: 'grouped-blocks', stageCount: 6,
    headings: ['詳細: 自律性のスペクトラム', '詳細: Agent の 3 類型', '設計判断: 「Agent が必要か」から始める'],
    sourceHeadings: ['詳細: 自律性のスペクトラム', '詳細: Agent の 3 類型', '設計判断: 「Agent が必要か」から始める'],
    blockGroups: [[{ stage: 0, count: 1 }, { stage: 2, count: 2 }], [{ stage: 4, count: 3 }], [{ stage: 5, count: 5 }]],
    blockTypes: [['paragraph', 'table', 'paragraph'], ['paragraph', 'table', 'paragraph'], ['paragraph', 'list', 'paragraph', 'list', 'paragraph']]
  },
  'tool-execution': {
    article: 'docs/01-concepts/tool-use.md', route: '/docs/concepts/tool-use', binding: 'grouped-blocks', stageCount: 7,
    headings: ['概要: モデルはツールを「実行しない」'], sourceHeadings: ['概要: モデルはツールを「実行しない」'],
    blockGroups: [[{ stage: 0, count: 1 }, { stage: 2, count: 1 }, { stage: 5, count: 1 }]],
    blockTypes: [['paragraph', 'paragraph', 'code']]
  },
  'tool-contract': {
    article: 'docs/01-concepts/tool-use.md', route: '/docs/concepts/tool-use', binding: 'grouped-blocks', stageCount: 6,
    headings: ['詳細: ツール定義の 3 要素', '詳細: 結果の返し方も設計対象', '詳細: 自前実装と標準プロトコル(MCP)', '設計判断: 何をツールにするか(粒度)'],
    sourceHeadings: ['詳細: ツール定義の 3 要素', '詳細: 結果の返し方も設計対象', '詳細: 自前実装と標準プロトコル(MCP)', '設計判断: 何をツールにするか(粒度)'],
    blockGroups: [[{ stage: 0, count: 1 }, { stage: 1, count: 1 }, { stage: 2, count: 1 }], [{ stage: 3, count: 2 }], [{ stage: 4, count: 3 }], [{ stage: 5, count: 1 }]],
    blockTypes: [['table', 'paragraph', 'code'], ['paragraph', 'list'], ['paragraph', 'paragraph', 'blockquote'], ['list']]
  },
  'memory-layers': {
    article: 'docs/01-concepts/memory-and-state.md', route: '/docs/concepts/memory-and-state', binding: 'grouped-blocks', stageCount: 5,
    headings: ['概要: 「メモリ」は 1 つではない', '詳細: 短期記憶はコンテキストウィンドウとの戦い'],
    sourceHeadings: ['概要: 「メモリ」は 1 つではない', '詳細: 短期記憶はコンテキストウィンドウとの戦い'],
    blockGroups: [[{ stage: 0, count: 1 }, { stage: 1, count: 1 }, { stage: 3, count: 1 }], [{ stage: 4, count: 3 }]],
    blockTypes: [['paragraph', 'table', 'paragraph'], ['paragraph', 'list', 'paragraph']]
  },
  'memory-lifecycle': {
    article: 'docs/01-concepts/memory-and-state.md', route: '/docs/concepts/memory-and-state', binding: 'grouped-blocks', stageCount: 7,
    headings: ['詳細: 履歴圧縮の基本手法', '詳細: セッション管理と長時間タスクの再開', '詳細: 長期記憶と RAG の関係', '設計判断: 何をコンテキストに残し、何を外部化するか'],
    sourceHeadings: ['詳細: 履歴圧縮の基本手法', '詳細: セッション管理と長時間タスクの再開', '詳細: 長期記憶と RAG の関係', '設計判断: 何をコンテキストに残し、何を外部化するか'],
    blockGroups: [[{ stage: 0, count: 1 }, { stage: 1, count: 1 }], [{ stage: 3, count: 1 }, { stage: 4, count: 1 }], [{ stage: 5, count: 2 }], [{ stage: 6, count: 2 }]],
    blockTypes: [['table', 'paragraph'], ['paragraph', 'list'], ['paragraph', 'paragraph'], ['table', 'paragraph']]
  }
}
