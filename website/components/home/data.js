/**
 * トップページの編集データ。
 * 原本: docs/00-overview/learning-roadmap.md(読者タイプ別ルート)と
 *       docs/07-case-studies/common-anti-patterns.md(3 つの共通根)。
 * 原本を更新したら、このファイルも同期すること(WEBSITE-PLAN.md §5 段階 3)。
 */

export const READER_ROUTES = [
  {
    key: 'A',
    label: '入門',
    persona: 'AI Agent をこれから学ぶ',
    steps: [
      { title: '基礎概念を順に読む', href: '/docs/concepts', note: 'Agent とは何か → Agent ループ → ツール使用 → メモリ…' },
      { title: 'Workflow 型 vs Agent 型', href: '/docs/architecture/workflow-vs-agent', note: '実務で最初に問われる設計判断' },
      { title: '実装ガイドへ進む', href: '/docs/implementation', note: 'ツール定義・プロンプト設計・構造化出力' },
      { title: 'Agent 評価の基礎', href: '/docs/evaluation/agent-evaluation-basics', note: '「作ったが品質が分からない」を防ぐ' },
      { title: 'プロンプトインジェクション', href: '/docs/security/prompt-injection', note: 'Agent 固有の最重要脅威を知る' }
    ]
  },
  {
    key: 'B',
    label: '設計担当',
    persona: '要件を受けて設計を始める',
    steps: [
      { title: 'AI Agent とは何か', href: '/docs/concepts/what-is-an-ai-agent', note: '自律性のスペクトラムという判断軸' },
      { title: 'Agent ループ', href: '/docs/concepts/agent-loop', note: '動作原理と停止条件の設計' },
      { title: '設計セクションを全部', href: '/docs/architecture', note: 'Workflow vs Agent・コンテキスト・HITL・エラー処理' },
      { title: 'Agent の脅威モデル概観', href: '/docs/security/threat-model-overview', note: '設計初期からのセキュリティ' }
    ]
  },
  {
    key: 'C',
    label: '実装担当',
    persona: '設計済みのものを実装する',
    steps: [
      { title: '実装セクションを全部', href: '/docs/implementation', note: 'ツール定義・プロンプト・構造化出力・MCP・UX' },
      { title: 'サンプルコードを動かす', href: '/docs/examples/python-tool-use', note: '最小の Agent ループ(Python)' },
      { title: '評価セクションへ', href: '/docs/evaluation', note: '書いたものの品質を測れる状態にする' }
    ]
  },
  {
    key: 'D',
    label: '運用・SRE',
    persona: '既存の Agent を本番運用する',
    steps: [
      { title: '運用セクションを全部', href: '/docs/operations', note: '可観測性・コスト・レイテンシ・バージョニング・インシデント' },
      { title: '回帰テストと CI 組み込み', href: '/docs/evaluation/regression-testing', note: '変更のたびの品質検知' },
      { title: 'セキュリティセクションへ', href: '/docs/security', note: '運用と地続きの脅威対応' }
    ]
  },
  {
    key: 'E',
    label: 'セキュリティ',
    persona: 'Agent システムをレビュー・監査する',
    steps: [
      { title: 'セキュリティセクションを全部', href: '/docs/security', note: '脅威モデル → インジェクション → 権限 → 漏えい → ガードレール' },
      { title: 'ツール使用', href: '/docs/concepts/tool-use', note: '攻撃面の源泉となる仕組み' },
      { title: 'Human-in-the-Loop 設計', href: '/docs/architecture/human-in-the-loop', note: '承認ゲートの設計と承認疲れ' }
    ]
  },
  {
    key: 'F',
    label: 'エージェント活用',
    persona: 'Claude Code 等のコーディングエージェントを使う・導入する',
    steps: [
      { title: 'AI Agent とは何か', href: '/docs/concepts/what-is-an-ai-agent', note: '前提となる最小限の概念' },
      { title: 'Agent ループ', href: '/docs/concepts/agent-loop', note: 'コーディングエージェントの動作原理そのもの' },
      { title: '分類と全体像', href: '/docs/coding-agents/coding-agents-overview', note: '提供形態 5 分類と自律性の軸' },
      { title: '選定基準と使い分け', href: '/docs/coding-agents/coding-agent-selection', note: '制約で絞り、試用で決める' },
      { title: '権限とセキュリティ', href: '/docs/coding-agents/coding-agent-security', note: '導入前に必ず読む防御設計' }
    ]
  }
]

/** 概念カードに載せる用語(generated/glossary.json の name と一致させる) */
export const FEATURED_TERMS = [
  'AI Agent',
  'Agent ループ',
  'ツール使用',
  'Workflow 型',
  'コンテキストエンジニアリング',
  'Human-in-the-Loop',
  'LLM-as-a-Judge',
  '致命的三重奏'
]

/** アンチパターンの 3 つの共通根(原本: common-anti-patterns.md) */
export const ANTI_PATTERN_ROOTS = [
  {
    title: '自律性をタダだと思う',
    body: '自律性はコスト・レイテンシ・不確実性・攻撃面で支払う「買い物」です。必要最小限に絞る判断が抜けると、企画から運用まで全段階で罠が生まれます。',
    href: '/docs/architecture/workflow-vs-agent',
    linkLabel: 'Workflow 型 vs Agent 型'
  },
  {
    title: '従来ソフトウェアの直感を持ち込む',
    body: '「1 回テストすれば OK」「変更の影響は局所的」「エラーは例外で現れる」という決定的なコードの直感は、非決定的で非局所的な LLM には通用しません。',
    href: '/docs/evaluation/agent-evaluation-basics',
    linkLabel: 'Agent 評価の基礎'
  },
  {
    title: 'モデルへの指示を強制と混同する',
    body: 'プロンプトに書いた禁止・注意は「お願い」であり、上書きされえます。コードで強制されるガードレールだけが保証になります。',
    href: '/docs/security/guardrails',
    linkLabel: 'ガードレール'
  }
]
