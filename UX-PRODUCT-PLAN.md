# UX-PRODUCT-PLAN — UX・プロダクトデザイン 追加計画

> **ステータス: 完了(2026-07-07 作成、ユーザーの選定に基づく。Phase AM〔前半 3 本 = ai-ux-patterns・conversation-design・beyond-chat-ui + 新セクション 14〕・Phase AN〔後半 3 本 = proactive-agent-ux・accessibility-and-ai + 09 の ai-pricing-and-packaging〕を 2026-07-09 に完了。UX-PRODUCT 完結)。**
> AI プロダクトの体験設計 — UX パターン・会話設計・プロアクティブ性・チャットを超える UI・価格設計・アクセシビリティ — の追加計画です。進捗の正本は着手後 [ROADMAP.md](ROADMAP.md) に置きます。

## 1. 位置づけとギャップ分析

既存ライブラリで UX に触れるのは [streaming-and-agent-ux](docs/03-implementation/streaming-and-agent-ux.md)(進捗提示・中断の**実装**パターン)だけで、**体験の設計論**(信頼をどう築くか・不確実性をどう見せるか・そもそもチャットでよいのか)は未カバーです。非決定的なシステムの UX は従来のデザイン原則がそのまま通用しない、独立した設計領域です。

| 既存 | 役割 | 本計画との分担 |
| --- | --- | --- |
| streaming-and-agent-ux(03) | ストリーミング・進捗・中断の実装(正本のまま) | 本計画はその上位のパターン言語と、実装以前の体験設計 |
| human-in-the-loop(02) | 承認・介入の設計 | 承認 UX の「見せ方」side を本計画が補完 |
| agent-api-design(02) | メータリング(機械間) | 価格設計(対人の商品設計)を本計画が担当 |

### 配置

**新セクション `docs/14-ux-and-product/`(UX・プロダクト)を推奨**します(5 本。番号は 12・13 の採否に応じて繰り上げ)。価格設計(#5)のみ、事業判断の性格から **09-business** に配置します。

## 2. 追加トピック一覧(6 本 + 新セクション 1)

| # | 配置 | ファイル | 仮タイトル | level | 鮮度 |
| --- | --- | --- | --- | --- | --- |
| 1 | 14-ux-and-product | `ai-ux-patterns.md` | AI プロダクトの UX パターン | intermediate | 安定 |
| 2 | 14-ux-and-product | `conversation-design.md` | 会話設計(ペルソナ・トーン・境界) | intermediate | 安定 |
| 3 | 14-ux-and-product | `beyond-chat-ui.md` | チャットを超える UI(プロンプトレス設計) | intermediate | 安定 |
| 4 | 14-ux-and-product | `proactive-agent-ux.md` | プロアクティブエージェントの UX | intermediate | 安定 |
| 5 | 09-business | `ai-pricing-and-packaging.md` | AI 機能の価格設計とパッケージング | intermediate | 中 |
| 6 | 14-ux-and-product | `accessibility-and-ai.md` | アクセシビリティと AI | intermediate | 安定 |

## 3. 各ページの設計

### ai-ux-patterns.md — AI プロダクトの UX パターン

- **目的**: 非決定的なシステムに固有の UX 課題(不確実性・誤り・待ち時間・信頼)に、名前の付いたパターンで対処できる
- **主要トピック**: 不確実性の提示(確度表示・出典・「わからない」の言い方 — confidence 系記事と接続)/ 誤りと訂正の UX(修正のしやすさが信頼を作る・フィードバック導線 = [feedback-loops](docs/05-operations/feedback-loops.md) の入口)/ 待ち時間の設計(進捗の意味付け — 実装は streaming-and-agent-ux)/ 信頼の較正(過信させない・過小評価もさせない)/ 自動化レベルの提示と切替(提案 → 承認 → 自動の段階)/ 初回体験(能力と限界の期待値設定)
- **分担**: 実装 = streaming-and-agent-ux(正本)。本記事はパターン言語

### conversation-design.md — 会話設計

- **目的**: 「何でも答える汎用チャット」ではなく、役割・トーン・境界が設計された会話体験を作れる
- **主要トピック**: ペルソナとトーンの設計(ブランド整合・一人称・敬語レベル — プロンプトへの落とし込みは agent-prompt-design)/ 話題の境界と断り方(スコープ外の依頼への応答設計)/ 会話の構造(オンボーディング・提案・確認・完了の型)/ 記憶の見せ方(覚えていることの透明性 — long-term-memory の UX 面)/ 多言語・文化差 / 会話ログからの改善(conversation-data-management 接続)

### beyond-chat-ui.md — チャットを超える UI

- **目的**: 「テキストボックスに書かせる」以外の選択肢 — 構造化入力・成果物 UI・インライン支援・バックグラウンド実行 — を使い分けられる
- **主要トピック**: チャットが向く場面・向かない場面 / プロンプトレス設計(ボタン・テンプレート・文脈からの自動起動 — ユーザーに書かせない)/ 成果物中心 UI(ドキュメント・キャンバス型: 会話は脇役)/ インライン支援(エディタ・フォームへの埋め込み型)/ バックグラウンドエージェントの UI(投げて後で受け取る — async-and-durable の UX 面)/ 複合(チャット + 構造化のハイブリッド)
- **分担**: ジョブ型 API = agent-api-design(機械間)。本記事は対人の形

### proactive-agent-ux.md — プロアクティブエージェントの UX

- **目的**: エージェント側から動く体験(通知・提案・先回り)を、うるささと便利さの均衡点で設計できる
- **主要トピック**: プロアクティブ性の段階(気付きの表示 → 提案 → 承認付き実行 → 自動実行)/ 介入の閾値設計(確信度 × 重要度 × 頻度)/ ユーザー制御(頻度設定・ミュート・「なぜ出たか」の説明)/ 通知疲れと信頼の損耗(外し続けると無視される)/ 学習との接続(反応から閾値を調整 — feedback-loops)/ リアルタイム観測型(MULTIMODAL 計画採用時に相互リンク)

### ai-pricing-and-packaging.md — AI 機能の価格設計とパッケージング(09)

- **目的**: 原価が従量で変動する AI 機能を、持続可能な価格・パッケージとして設計できる
- **主要トピック**: 価格モデルの類型(既存プランに同梱 / アドオン定額 / クレジット制 / 純従量 / 成果課金)と原価連動の設計 / 無料枠・トライアルの設計(コスト暴走ガードとセット)/ 単価の見える化と利用者の予算統制(エンタープライズ要求)/ 価格とモデルティアの整合(model-selection のティア混在の商品面)/ 改定の設計(原価変動への追従)
- **分担**: 原価側 = cost-management / roi-and-business-case、API 課金の契約面 = agent-api-design(正本)。本記事は対人プロダクトの価格

### accessibility-and-ai.md — アクセシビリティと AI

- **目的**: AI UI 自体のアクセシビリティ確保と、AI による支援技術としての活用の両面を設計できる
- **主要トピック**: AI UI の a11y(ストリーミング出力とスクリーンリーダー・キーボード完結・低速環境・エラー時の代替経路)/ 会話 UI の認知負荷(長文出力・選択肢過多)/ AI による a11y 向上(代替テキスト生成・要約・読み上げ・言い換え — 精度限界の明示とセット)/ 多様なリテラシーへの配慮(プロンプトを書けない利用者 — beyond-chat-ui と接続)/ 検証(支援技術での実機確認)

## 4. スコープ外(検討のうえ除外)

- **ビジュアルデザイン・ブランドデザインの一般論**: AI 固有の論点まで
- **特定デザインシステム・UI ライブラリの解説**: パターンまで
- **ユーザーリサーチ手法の教材化**: AI プロダクトに固有の観点まで
- **website(本ライブラリのサイト)自体の改善**: WEBSITE-PLAN の管轄

## 5. フェーズ分割(ROADMAP 追記案)

フェーズ記号は **AM・AN** を使います(AK・AL は [EVAL-QUALITY-PLAN.md](EVAL-QUALITY-PLAN.md) が使用)。

| フェーズ | 内容 | 成果物 | 備考 |
| --- | --- | --- | --- |
| AM-0 | 14-ux-and-product スケルトン(セクション README・doc-template の category・website 反映・ルート README) | `14-ux-and-product/README.md` ほか同期一式 | 配置・番号の確定(§8-1)を経て実施 |
| AM-1 | UX パターン + 会話設計 | `ai-ux-patterns.md`, `conversation-design.md` | 調査不要 |
| AM-2 | チャットを超える UI | `beyond-chat-ui.md` | 調査不要 |
| AM-R | Phase AM レビュー(streaming-ux / HITL / feedback-loops からの逆リンク・published 化・同期一式) | — | — |
| AN-1 | プロアクティブ UX + アクセシビリティ | `proactive-agent-ux.md`, `accessibility-and-ai.md` | 調査不要 |
| AN-2 | 価格設計(09) | `ai-pricing-and-packaging.md` | 調査不要 |
| AN-R | Phase AN レビュー + 統合(learning-roadmap の 14 セクション化・依存マップ更新・published 化) | — | — |

完了時の規模: **92 → 98 本**(+ 新セクション 1)。

## 6. 執筆前調査

**なし**(全 6 本とも原則安定。UX パターンは確立した知見の整理であり、製品固有の UI は扱わない)。

## 7. 同期・派生作業

- **GLOSSARY 候補**: 会話設計(conversation design)、プロアクティブ(proactive)、プロンプトレス UI、成果物 UI(artifact UI)
- **learning-roadmap / 依存マップ**(AN-R): 14 セクション化。「02・03 を前提とする体験設計」として点線接続。website の SECTION_TITLES(`'ux-and-product': '14. UX・プロダクト'`)等を同期
- **doc-template**: category 列挙に `ux-and-product` を追加(AM-0)
- **逆リンク**: streaming-and-agent-ux → ai-ux-patterns / beyond-chat-ui、human-in-the-loop → ai-ux-patterns(承認 UX)、feedback-loops → ai-ux-patterns(導線設計)、agent-prompt-design → conversation-design、roi-and-business-case / cost-management → ai-pricing-and-packaging、async-and-durable-agents → beyond-chat-ui(バックグラウンド UI)

## 8. 未確定事項(着手時に確認)

1. **配置**: 推奨は新セクション 14(5 本 + 価格は 09)。代替: 全 6 本を既存章に分散(03 に UX 系 — 03 の肥大が難)
2. **6 本の粒度**: 縮小案は 4 本(#6 a11y を #1 に統合、#4 を #1 に統合)。網羅性を優先するなら 6 本を推奨

## 9. TODO

> **TODO(要確認):** 価格設計(#5)は各社の価格改定動向に触れず類型で書く。執筆時に「原価(cost-management)との整合」を相互レビュー観点に含める(最終確認: 2026-07)
