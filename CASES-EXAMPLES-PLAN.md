# CASES-EXAMPLES-PLAN — ケーススタディ・サンプルコード拡充計画

> **ステータス: 設計案(2026-07-07 作成、ユーザーの選定に基づく。着手指示待ち)。**
> 07-case-studies の構成事例 3 本(**失敗事例を含む**)と、`examples/` の動くサンプルコード 5 件の拡充計画です。他計画と性格が異なり、**examples はコード実行環境の検証を伴います**。進捗の正本は着手後 [ROADMAP.md](ROADMAP.md) に置きます。

## 1. 位置づけとギャップ分析

### ケーススタディ(07 章)

現在 5 本(アンチパターン集 + 事例 4)。事例は成功系 3 : 失敗系 1(メール漏えい)で、**「案件ごと失敗する」型(PoC 死・コスト爆発・撤退)の事例がない**のが最大のギャップです。roi-and-business-case・poc-to-production が説く撤退基準を、物語として裏付けます。また、実行系(書き込みを伴う)エージェントの通し事例も薄いままです。

### examples/

現在 `examples/python/tool-use/` の 1 件のみ。docs 側は 92 本に育ち、「docs ↔ examples の双方向リンク」という当初方針(CLAUDE.md)に対して実装例が大きく不足しています。EXPANSION 時に RAG サンプルを一度見送った経緯(依存の重さ)があるため、**「依存最小・自己完結」の設計条件**を先に定義して再挑戦します。

## 2. 追加内容一覧

### ケーススタディ(3 本、07-case-studies)

| # | ファイル | 仮タイトル | level | 型 |
| --- | --- | --- | --- | --- |
| 1 | `case-study-it-helpdesk-agent.md` | 社内 IT ヘルプデスク Agent(実行系の段階導入) | intermediate | 成功(実行系) |
| 2 | `case-study-data-analysis-agent.md` | データ分析 Agent(もっともらしい誤りとの戦い) | intermediate | 苦戦 → 改善 |
| 3 | `case-study-failed-poc.md` | 撤退したプロジェクト(PoC 死とコスト爆発) | intermediate | **失敗** |

### examples(5 件、examples/python/)

| # | ディレクトリ | 内容 | 対応する docs |
| --- | --- | --- | --- |
| 1 | `structured-output/` | 構造化出力とバリデーション・リトライの最小実装 | structured-output |
| 2 | `evaluation-harness/` | 最小の評価ハーネス(データセット・実行・判定・レポートの 4 点) | agent-evaluation-basics, regression-testing |
| 3 | `rag-basics/` | 依存最小の RAG(小さな文書集合 + 単純なベクトル検索。ベクトル DB 不使用) | rag-implementation-patterns |
| 4 | `mcp-server/` | 最小の MCP サーバー実装(ツール 2 つ・権限の考え方をコメントで) | mcp-and-tool-protocols |
| 5 | `multi-agent/` | 最小のオーケストレーション(計画役 + 実行役の 2 エージェント) | orchestration-patterns, single-vs-multi-agent |

## 3. 各内容の設計

### case-study-it-helpdesk-agent.md — 社内 IT ヘルプデスク Agent

- **主題**: **書き込み(実行)を伴う**エージェントの段階導入 — パスワードリセット・アカウント申請・ソフト配布という「実行して初めて価値が出る」領域で、権限・承認・監査をどう設計したか
- **通す判断**: 照会系から実行系への段階拡大(expense 事例の権限版)/ ツール側での権限強制と承認ゲート / 実行の監査証跡(agent-identity の実例)/ セルフサービス化の効果測定(roi)
- **差別化**: expense(技術の育て方)・support(案件推進)・knowledge(知識運用)に対し、**「実行権限の運用」**に重心

### case-study-data-analysis-agent.md — データ分析 Agent

- **主題**: 「動くのに信用されない」からの回復 — もっともらしく誤る分析(集計条件の取り違え・欠損の無視)にどう気付き、検証可能な構造に作り直したか
- **通す判断**: セマンティックレイヤー整備が精度を変えた構造 / 検証の二重化(件数照合・別経路集計)/ 信頼度表示と「わからない」の設計 / 利用者教育(鵜呑み防止)
- **接続**: DOMAIN 計画の data-analysis-agents(採用時)の設計ガイドと対になる物語

### case-study-failed-poc.md — 撤退したプロジェクト

- **主題**: **失敗で終わる事例**。華々しいデモ → パイロットで品質が出ない → コスト試算が崩れる → 撤退判断、までを誠実に描き、「うまくいかなかった判断」から学ぶ
- **通す判断**: デモの罠(選ばれた入力)/ 成功基準を後から緩める誘惑 / サンクコストと撤退基準(roi・poc-to-production の裏面)/ 撤退の実務(利害関係者への説明・資産の回収 — 評価セットと学びは残る)/ 「撤退 = 失敗ではない」という組織学習
- **方針**: 既存事例と同じ架空の構成事例(冒頭注記)。自虐でも他責でもない筆致で

### examples 共通の設計条件

1. **依存最小・自己完結**: 標準ライブラリ + 必要最小限のパッケージ。ベクトル DB・重いフレームワークは使わない(rag-basics は数値計算のみで実装)
2. **API 呼び出しの抽象化**: LLM 呼び出しを 1 モジュールに集約し、**モック応答での実行**を全サンプルでサポートする(`--mock` 実行)。これにより「API キーなしでも構造が動く」ことを CI 的に検証可能にし、実 API での動作確認日は README に別途記録する(既存 tool-use の「API 実行未確認」問題への構造的対処)
3. **既存規約の遵守**: 依存バージョン固定・実行手順 README・動作確認日・docs との双方向リンク・秘密情報は環境変数(CLAUDE.md)
4. **ベンダー中立**: docs 本文の中立方針に合わせ、コード例のプロバイダー依存部分は差し替え可能な形に隔離する

## 4. スコープ外(検討のうえ除外)

- **TypeScript 版 examples**: Python 5 件の完成後に需要を見て判断(examples/typescript/ の空ディレクトリは維持)
- **フレームワーク使用版のサンプル**(LangGraph 等): 「生の仕組みを見せる」という examples の方針を維持
- **実在事例の取材・引用**: 架空の構成事例方式を継続(確立済みの決定)
- **音声・画像系のサンプル**: MULTIMODAL 計画の採否とあわせて将来判断

## 5. フェーズ分割(ROADMAP 追記案)

フェーズ記号は **AU・AV** を使います(AS・AT は [ECOSYSTEM-PLAN.md](ECOSYSTEM-PLAN.md) が使用)。

| フェーズ | 内容 | 成果物 | 備考 |
| --- | --- | --- | --- |
| AU-1 | ヘルプデスク事例 + データ分析事例 | `case-study-it-helpdesk-agent.md`, `case-study-data-analysis-agent.md` | 調査不要(架空事例) |
| AU-2 | 失敗事例(PoC 死) | `case-study-failed-poc.md` | 調査不要 |
| AU-R | Phase AU レビュー(07 README・roi / poc-to-production からの逆リンク・published 化) | — | — |
| AV-1 | examples: structured-output + evaluation-harness | 2 ディレクトリ一式 | モック実行の検証を含む |
| AV-2 | examples: rag-basics + mcp-server + multi-agent | 3 ディレクトリ一式 | 同上 |
| AV-R | Phase AV レビュー(全サンプルのモック実行検証・docs ↔ examples 双方向リンク検査・README 動作確認日・ルート README の examples 記述更新) | — | — |

完了時の規模: **92 → 95 本** + examples 1 → 6 件。

## 6. 執筆前調査

**専用タスクなし**。examples 実装時に各公式 SDK・プロトコル仕様(MCP)の現行版を確認します(コードは書誌でなく動作で検証できるため、実装 + モック実行検証で担保)。

## 7. 同期・派生作業

- **GLOSSARY**: 追加なしの見込み(既存概念の実装・事例のため)
- **docs ↔ examples 双方向リンク**(AV-R): structured-output・agent-evaluation-basics・regression-testing・rag-implementation-patterns・mcp-and-tool-protocols・orchestration-patterns・single-vs-multi-agent の各 docs に examples への参照を追加
- **07 README / ルート README**: 事例 3 本の行追加・examples 6 件への更新・「失敗事例」の存在を README で明示
- **learning-roadmap**: 読者タイプ C(実装担当)のルートに examples 拡充を反映するか AV-R で判断
- **定期メンテナンス**: `examples/` の実行確認(四半期)の対象が 6 件に増える — モック実行の自動化で負担を抑える

## 8. 未確定事項(着手時に確認)

1. **examples の実 API 動作確認の扱い**: 推奨は「モック実行は必須検証・実 API 確認はユーザー環境で実施し README に確認日を記録」(キーの取り扱いのため)。代替: セッション内で実 API 確認まで行う(API キーの提供が必要)
2. **事例 3 本の粒度**: 縮小案は 2 本(#1 と #2 を統合はせず、どちらか 1 本 + 失敗事例)。失敗事例(#3)は最優先を推奨
3. **rag-basics の実装方式**: 推奨は「純 Python + 小さな埋め込み呼び出し(またはモック埋め込み)」。外部ベクトル DB は使わない

## 9. TODO

> **TODO(要確認):** MCP サーバーの最小実装は MCP 仕様の現行リビジョンに依存する。AV-2 実装時に公式仕様・SDK の現行版を確認する(最終確認: 2026-07)
