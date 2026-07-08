---
title: "AI Agent 学習ロードマップ"
category: "overview"
level: "basic"
status: "published"
last_updated: "2026-07-09"
tags: ["learning-roadmap", "ai-agent"]
---

# AI Agent 学習ロードマップ

## この記事の目的

このライブラリを「どの順で読むか」を、自分の目的に合わせて決められるようになります。13 のセクションの役割と依存関係を把握し、読者タイプ別の推奨ルートから自分に合うものを選べる状態がゴールです。

## 対象読者

- このライブラリを初めて訪れたソフトウェアエンジニア全般
- チームに AI Agent の学習を導入する立場のテックリード・エンジニアリングマネージャー

## 前提知識

- LLM API(チャット補完 API)を一度でも呼び出した経験があること。システムプロンプトとユーザーメッセージの区別が付けば十分です
- このライブラリ内の前提ドキュメントはありません(本記事が入口です)

## 本文

### 概要: 13 セクションの構成と依存関係

このライブラリは「概念 → 設計 → 実装 → 評価 → 運用」という開発ライフサイクルの順にセクションを並べ、セキュリティと事例を横断テーマとして置いています。08(コーディングエージェント)は「Agent を**使う**側」の独立したテーマで、01 の基礎概念だけを前提に読めます。09(ビジネス実務)は「何をやるか・どう本番に届けるか」という案件推進の方法論で、技術セクションと並行して読めます。10(LLM 基礎)は「LLM 自体がなぜそう振る舞うか」を深める任意の基礎で、01 と並行して、または実務で挙動の疑問に当たったときに読めます。12(モダリティ応用)は文書・画像・動画・音声の理解と生成を扱う応用テーマで、03(実装)を前提に、必要になったときに読めます。13(ドメイン応用)はリサーチ・データ分析・RPA・アシスタントなど応用ドメインごとの設計判断で、03(実装)を前提に、該当ドメインに取り組むときに読めます。

```mermaid
flowchart TD
    O["00-overview<br/>全体像(本記事)"] --> C1["01-concepts<br/>基礎概念"]
    C1 --> A2["02-architecture<br/>設計"]
    A2 --> I3["03-implementation<br/>実装"]
    I3 --> E4["04-evaluation<br/>評価"]
    E4 --> P5["05-operations<br/>運用"]
    C1 --> S6["06-security<br/>セキュリティ"]
    A2 --> S6
    I3 --> CS7["07-case-studies<br/>事例"]
    S6 --> CS7
    P5 --> CS7
    C1 --> CA8["08-coding-agents<br/>コーディングエージェント"]
    S6 -.-> CA8
    C1 --> B9["09-business<br/>ビジネス実務"]
    E4 -.-> B9
    C1 -.-> F10["10-llm-foundations<br/>LLM 基礎"]
    I3 -.-> MM12["12-multimodal<br/>モダリティ応用"]
    I3 -.-> DA13["13-domain-agents<br/>ドメイン応用"]
```

矢印は「先に読んでおくと理解が速い」という依存関係です(点線は必須ではない補助的な依存)。上から順にすべて読む必要はなく、次の推奨ルートから選んでください。

### 読者タイプ別の推奨ルート

| タイプ | 状況 | 推奨ルート |
| --- | --- | --- |
| A: 入門 | AI Agent をこれから学ぶ | [01-concepts](../01-concepts/README.md) を上から順に → [Workflow 型 vs Agent 型](../02-architecture/workflow-vs-agent.md) → [03-implementation](../03-implementation/README.md) → [Agent 評価の基礎](../04-evaluation/agent-evaluation-basics.md) → [プロンプトインジェクション](../06-security/prompt-injection.md) |
| B: 設計担当 | 要件を受けて設計を始める | [AI Agent とは何か](../01-concepts/what-is-an-ai-agent.md) → [Agent ループ](../01-concepts/agent-loop.md) → [02-architecture](../02-architecture/README.md) を全部 → [Agent の脅威モデル概観](../06-security/threat-model-overview.md) |
| C: 実装担当 | 設計済みのものを実装する | [03-implementation](../03-implementation/README.md) を全部 → `examples/` のサンプル → [04-evaluation](../04-evaluation/README.md) |
| D: 運用・SRE | 既存の Agent を本番運用する | [05-operations](../05-operations/README.md) を全部 → [回帰テストと CI 組み込み](../04-evaluation/regression-testing.md) → [06-security](../06-security/README.md) |
| E: セキュリティ | Agent システムをレビュー・監査する | [06-security](../06-security/README.md) を全部 → [ツール使用](../01-concepts/tool-use.md) → [Human-in-the-Loop 設計](../02-architecture/human-in-the-loop.md) |
| F: エージェント活用 | Claude Code 等のコーディングエージェントを使う・導入する | [AI Agent とは何か](../01-concepts/what-is-an-ai-agent.md) → [Agent ループ](../01-concepts/agent-loop.md) → [08-coding-agents](../08-coding-agents/README.md) を「この章の読み方」の順で |
| G: プロフェッショナル志向 | 全領域を実務レベルに広げ、案件を推進する | [スキルマップ](skill-map.md)で自己評価 → 弱い領域のセクションを README の順に → [ユースケース発見と要件定義](../09-business/usecase-discovery.md) → [PoC から本番への進め方](../09-business/poc-to-production.md) |
| H: 企業システム開発(SIer・情シス) | 受託・社内の企業システム開発でコーディングエージェントを工程横断で使う | [AI コーディングエージェントの分類と全体像](../08-coding-agents/coding-agents-overview.md) → [SE 工程別活用マップ](../08-coding-agents/se-process-map.md) → 自分の工程の記事(要件定義・設計 / テスト / レガシー / 保守)→ [企業システム環境の制約と対応](../08-coding-agents/se-enterprise-constraints.md) |

個別ドキュメントの執筆状況は各セクションの README で確認できます(ファイル名がリンクになっているものが執筆済み、バッククォートのままの名前は計画段階です)。

### セクションごとの読みどころ

- [01-concepts](../01-concepts/README.md) — 「Agent とは何か」から始まる基礎概念。**全読者に共通の土台**で、他セクションはここの用語を前提にします
- [02-architecture](../02-architecture/README.md) — 「Agent にするか、Workflow で済ませるか」など、コードを書く前の設計判断。**過剰な Agent 化を防ぐ**視点を提供します
- [03-implementation](../03-implementation/README.md) — ツール定義・プロンプト・構造化出力などの実装パターン。`examples/` の動くコードと対で読みます
- [04-evaluation](../04-evaluation/README.md) — 「作ったが品質が分からない」を防ぐ評価設計。**実装と同時に読み始める**ことを推奨します
- [05-operations](../05-operations/README.md) — 可観測性・コスト・インシデント対応など本番運用の実務
- [06-security](../06-security/README.md) — プロンプトインジェクションを筆頭とする Agent 固有の脅威と対策。**設計初期に一読**してください
- [07-case-studies](../07-case-studies/README.md) — 具体事例とアンチパターン詳解。他セクションを読んだあとの総仕上げ
- [08-coding-agents](../08-coding-agents/README.md) — Claude Code などのコーディングエージェントを**使う**側の体系(選定・設定・セキュリティ・チーム導入)。01 だけ読めば独立して読めます
- [09-business](../09-business/README.md) — ユースケース選定・PoC → 本番・ROI といった**案件推進の方法論**。技術の前(何をやるか)と後(どう届けるか)を扱い、04(評価)を先に読むと本番化の関門判断が理解しやすくなります
- [10-llm-foundations](../10-llm-foundations/README.md) — 生成・トークン・注意機構・学習・能力限界という **LLM 自体の「なぜ」**。数式なしの直感で、01 の理解と日々のデバッグ・設計判断を深めます(任意の基礎。01 と並行して読めます)
- [12-multimodal](../12-multimodal/README.md) — 文書・画像・動画・音声の**理解と生成**の実務(ドキュメント AI・画像理解・マルチモーダル RAG・画像/動画/音声生成・リアルタイム観測)。03(実装)を前提とする応用テーマで、必要になったときに読めます
- [13-domain-agents](../13-domain-agents/README.md) — リサーチ・データ分析・RPA・アシスタント・検索・執筆翻訳・教育など**応用ドメインごとの設計判断**。01〜06 章の「ドメイン非依存の作り方」に対する「横の設計ガイド」で、03(実装)を前提に該当ドメインに取り組むときに読めます

### 学習の進め方の指針

1. **概念(01)を飛ばさない**。フレームワークの API はすぐ変わりますが、Agent ループやツール使用(tool use)の原理は変わりません
2. **評価(04)とセキュリティ(06)を「あとで」にしない**。どちらも後付けが最も高くつく領域です
3. 読むだけでなく、`examples/` のサンプルを手元で動かして確かめてください(Phase 4 以降で追加予定)

## 実務での注意点

### アンチパターン

- **いきなりフレームワークから学び始める** → 抽象化の下で何が起きているか分からず、不具合時にデバッグできない → 先に [01-concepts](../01-concepts/README.md) で生の仕組み(ループ・ツール呼び出し)を理解してからフレームワークに進む
- **デモが動いた時点で「学習完了」と判断する** → Agent は動くものを作るより、品質を保証し運用し続ける方が難しい → 04(評価)と 05(運用)までをスコープに含めて学習計画を立てる
- **セキュリティを本番直前に初めて調べる** → プロンプトインジェクション対策は後付けしにくく、設計変更を強いられる → 設計段階で 06 の脅威モデルに目を通す

### チェックリスト

学習を始める前のセルフチェック:

- [ ] 自分の読者タイプ(A〜H)を決めた
- [ ] 作りたいもの(または運用するもの)を 1 文で説明できる
- [ ] LLM API を呼び出せる開発環境がある(examples を動かすため)
- [ ] 読む予定のセクションの README にざっと目を通した

## 関連トピック

- [AI Agent とは何か](../01-concepts/what-is-an-ai-agent.md) — 本記事の次に最初に読む 1 本
- [AI Agent プロフェッショナルのスキルマップ](skill-map.md) — 「どの順で読むか」(本記事)に対して「どこまで深めるか」を決める自己評価軸
- 各セクションの詳細は上記「セクションごとの読みどころ」の各 README リンクを参照

## 参考資料

- [Building Effective Agents(Anthropic)](https://www.anthropic.com/research/building-effective-agents) — Workflow と Agent の区別、シンプルさを優先する設計原則(アクセス日: 2026-07-05)
- [LLM Powered Autonomous Agents(Lilian Weng)](https://lilianweng.github.io/posts/2023-06-23-agent/) — プランニング・メモリ・ツールという構成要素の古典的な整理(アクセス日: 2026-07-05)

## TODO・未確認事項

> **TODO(要確認):** 参考資料に挙げた外部記事の URL 有効性と、より新しい公式の学習ガイド(Anthropic / OpenAI / Google)の有無を各社公式サイトで確認する(最終確認: 2026-07)
