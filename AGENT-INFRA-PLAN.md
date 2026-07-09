# AGENT-INFRA-PLAN — エージェント基盤技術の詳解 追加計画

> **ステータス: 完了(2026-07-07 作成、ユーザーの選定に基づく。Phase AY〔code-execution-sandboxes〔調査ゼロ〕・agent-interop-protocols〔IF-R1 反映・鮮度管理型〕〕を 2026-07-09 に完了。AGENT-INFRA 完結・03 に 2 本追加)。**
> エージェント基盤の 2 つの技術詳解 — コード実行サンドボックスの実装と、エージェント間プロトコル — の追加計画です。進捗の正本は着手後 [ROADMAP.md](ROADMAP.md) に置きます。

## 1. 位置づけとギャップ分析

| # | ギャップ | 既存の最近接(正本のまま) |
| --- | --- | --- |
| 1 | サンドボックスの**実装技術の選択**(コンテナ / microVM / WebAssembly / ブラウザ内)が未カバー。コード実行系エージェント(データ分析・コーディング)の普及で、tool-permissions の「サンドボックスを使え」の先が必要 | [tool-permissions-and-sandboxing](docs/06-security/tool-permissions-and-sandboxing.md)(原則・要件の正本) |
| 2 | **組織・システムをまたぐエージェント連携**(発見・認証・タスク委譲・信頼)の設計が概観 1 節に留まる | [mcp-and-tool-protocols](docs/03-implementation/mcp-and-tool-protocols.md)(ツール接続)・[orchestration-patterns](docs/02-architecture/orchestration-patterns.md)(A2A に 1 節)・[agent-identity-and-auth](docs/06-security/agent-identity-and-auth.md)(認証) |

## 2. 追加トピック一覧(2 本、いずれも 03-implementation)

| # | ファイル | 仮タイトル | level | 鮮度 |
| --- | --- | --- | --- | --- |
| 1 | `code-execution-sandboxes.md` | コード実行サンドボックスの実装 | advanced | 中 |
| 2 | `agent-interop-protocols.md` | エージェント間連携プロトコル | advanced | **速い(鮮度管理型)** |

## 3. 各ページの設計

### code-execution-sandboxes.md — コード実行サンドボックスの実装(03)

- **目的**: モデル生成コードの実行環境を、隔離強度・起動速度・運用コストのトレードオフで選定・構築できる
- **主要トピック**: 要件の整理(何から何を守るか — ホスト・ネットワーク・データ・他セッション)/ 実装技術の類型(プロセス分離 / コンテナ / microVM / WebAssembly / ブラウザ内実行 / マネージドサンドボックスサービス)と隔離強度・起動レイテンシ・状態管理の比較 / セッションとライフサイクル(使い捨て vs 永続ワークスペース・状態の持ち越し)/ ネットワークとエグレス制御(データ持ち出し面 — data-exfiltration 接続)/ リソース制限と暴走対策 / パッケージ・依存の扱い(インストール許可の設計)/ マルチテナントでの分離水準([multi-tenancy-and-isolation](docs/02-architecture/multi-tenancy-and-isolation.md) 接続)
- **分担**: 権限設計の原則 = tool-permissions-and-sandboxing(正本)。本記事は実装技術の選択と構築
- **鮮度**: 技術類型は安定。マネージドサービスの顔ぶれのみ TODO(要確認)前提

### agent-interop-protocols.md — エージェント間連携プロトコル(03、鮮度管理型)

- **目的**: 組織・システムの境界を越えてエージェント同士が連携する際の、発見・認証・委譲・信頼の設計を判断できる
- **主要トピック**: ツール接続(MCP)とエージェント間連携の違い(部品を呼ぶ vs 相手に任せる — 責任と会話の非対称)/ プロトコルが定める要素(発見(エージェントカード等)・能力広告・タスク委譲・進捗と結果の受け渡し・長時間タスク)/ 認証・認可(組織間の信頼確立 — agent-identity-and-auth の連携版)/ 信頼の段階設計(社内 → パートナー → 公開。委譲してよいタスクの分類)/ 相手エージェントという新しい攻撃面(過剰な情報開示・悪意ある応答 — TRUST 計画の攻撃伝播と接続)/ 2026-07 時点の標準の現在地(A2A 系の成熟度 — IF-R1 反映)/ 「まだ標準に賭けない」設計(抽象化層・最小結合)
- **鮮度**: 3 点セット必須。標準仕様の動きが速い

## 4. スコープ外(検討のうえ除外)

- **OS・仮想化技術の一般論**: サンドボックスは AI エージェント文脈の要件と選択まで
- **特定サンドボックス製品のセットアップ手順**: 類型と判断軸まで
- **プロトコル仕様のリファレンス翻訳**: 設計判断に必要な構造まで(仕様は公式が正)

## 5. フェーズ分割(ROADMAP 追記案)

フェーズ記号は **AY** を使います(AX は [RELIABILITY-PLAN.md](RELIABILITY-PLAN.md) が使用)。

| フェーズ | 内容 | 成果物 | 備考 |
| --- | --- | --- | --- |
| AY-1 | コード実行サンドボックス | `code-execution-sandboxes.md` | 調査不要(類型は安定) |
| AY-2 | エージェント間連携プロトコル(IF-R1 反映・鮮度管理型) | `agent-interop-protocols.md` | IF-R1 必須 |
| AY-R | Phase AY レビュー(tool-permissions / mcp-and-tool-protocols / orchestration / agent-identity からの逆リンク・published 化・同期一式・定期メンテナンス追加) | — | — |

完了時の規模: **92 → 94 本**(03: 15 → 17)。

## 6. 執筆前調査

| ID | 対象 | 出力先 | 時期 |
| --- | --- | --- | --- |
| IF-R1 | エージェント間プロトコルの現在地(A2A 系標準の仕様リビジョン・採用状況・関連標準(エージェント認証は `research/professional/agent-identity.md` を再利用)。公式一次情報のみ) | `research/infra/agent-protocols.md` | AY-2 着手時(必須) |

## 7. 同期・派生作業

- **GLOSSARY 候補**: microVM、WebAssembly(Wasm)、エージェントカード(agent card — 標準の用語を IF-R1 で確認のうえ)。既存 A2A エントリはリンク先の拡張
- **逆リンク**: tool-permissions-and-sandboxing → code-execution-sandboxes(実装詳解)、mcp-and-tool-protocols / orchestration-patterns / agent-identity-and-auth → agent-interop-protocols、multi-tenancy-and-isolation → code-execution-sandboxes
- **定期メンテナンス**(AY-R): 「エージェント間プロトコルの定点観測」を追加(research/infra/ を更新起点に。認証標準の既存観測と統合可)

## 8. 未確定事項(着手時に確認)

1. **agent-interop-protocols の配置**: 推奨は 03(mcp-and-tool-protocols の隣)。設計判断色を強めるなら 02 も可
2. **定点観測の統合**: プロトコル観測を既存の「認証標準の定点観測」と 1 系統に統合するか(推奨: 統合)

## 9. TODO

> **TODO(要確認):** IF-R1 は AY-2 着手時に実施する。A2A 系標準は仕様・ガバナンスとも動くため、本文は構造と判断軸に徹し、仕様の詳細は公式リンク + 最終確認日で扱う(最終確認: 2026-07)
