# FOUNDATIONS-EXTENSION-PLAN — 基礎・理論の拡張 追加計画

> **ステータス: 設計案(2026-07-07 作成、ユーザーの選定に基づく。着手指示待ち)。**
> 既存の基礎層(01・10 章)を拡張する 5 本 — 推論モデル・SLM 戦略・世界モデル・AI の歴史・マルチモーダルモデルの内部 — の追加計画です。進捗の正本は着手後 [ROADMAP.md](ROADMAP.md) に置きます。

## 1. 位置づけとギャップ分析

| # | ギャップ | 既存の最近接記事 |
| --- | --- | --- |
| 1 | **推論モデル(reasoning models)の専用記事がない**。「考える時間を使うモデル」への言及が model-selection・capabilities-and-limits・prompt-engineering-fundamentals に散在し、正本が不在 | capabilities-and-limits(10)に 1 段落 |
| 2 | 小型モデルの**戦略**(SLM ファースト・ルーティング)が model-selection のティア混在 1 節に留まる | model-selection(03) |
| 3 | 世界モデルが physical-ai の 1 節に留まる(学習インフラとしての意味・エージェント訓練環境) | physical-ai-overview(01) |
| 4 | 「深層学習 → Transformer → LLM → Agent」という**系譜の 1 本**がない(新規参加者の文脈形成用) | なし(01 の憲章に「歴史的経緯」は含まれている) |
| 5 | マルチモーダルモデルの**内部**(視覚エンコーダ・音声トークン化・拡散モデルの位置)が未カバー | [LLM-INTERNALS-PLAN.md](LLM-INTERNALS-PLAN.md)(テキスト系のみ) |

### 配置

新セクションは作らず、**性格に合わせて既存章に分散**します: #1 → 10(実務直感)、#2 → 03(戦略)、#3・#4 → 01(概念・歴史)、#5 → 11(学術。**LLM-INTERNALS 計画の採否に依存** — 不採用なら数式なし版として 10 へ)。

## 2. 追加トピック一覧(5 本)

| # | 配置 | ファイル | 仮タイトル | level | 鮮度 |
| --- | --- | --- | --- | --- | --- |
| 1 | 10-llm-foundations | `reasoning-models.md` | 推論モデル(考える時間を使う LLM) | intermediate | 中 |
| 2 | 03-implementation | `slm-strategy.md` | 小型言語モデル(SLM)の活用戦略 | intermediate | 中 |
| 3 | 01-concepts | `world-models-overview.md` | 世界モデルの概観 | basic | 中 |
| 4 | 01-concepts | `ai-history-and-lineage.md` | AI の歴史と系譜(深層学習から Agent まで) | basic | 安定 |
| 5 | 11-llm-internals(採用時) | `multimodal-model-internals.md` | マルチモーダルモデルの内部 | advanced | 中 |

## 3. 各ページの設計

### reasoning-models.md — 推論モデル(10)

- **目的**: 「応答前に考える時間を使う」モデルの仕組みの直感と、使いどころ・予算制御・プロンプトの変化を実務判断にできる(散在する言及の正本化)
- **主要トピック**: 仕組みの直感(推論トークン = 中間の思考を生成してから答える。how-llms-generate-text の「書いた考察が予測条件になる」の製品化)/ 効くタスク・効かないタスク(多段推論・検証可能問題 vs 単純検索・低レイテンシ要求)/ 思考量の制御(努力パラメータ・予算)とコスト・レイテンシ設計 / 考えすぎ(overthinking)と簡単な問題への過剰コスト / プロンプトの変化(手順指定の価値低下 — prompt-engineering-fundamentals と整合)/ 評価の注意(思考の非公開・再現性)
- **分担**: 学習側の理論(検証可能報酬)= LLM-INTERNALS の alignment-theory(採用時)、選定 = model-selection。10 章の憲章どおり数式なし
- **同期**: 散在する既存言及(model-selection・capabilities 等)に本記事へのリンクを追加

### slm-strategy.md — 小型言語モデルの活用戦略(03)

- **目的**: 「大きいモデルで全部」から「小さいモデルを賢く配る」設計へ移行する判断ができる
- **主要トピック**: SLM の性格(得意領域・落ちる崖の見極め)/ SLM ファースト設計(既定を小さく・失敗時に昇格)/ ルーティング(難易度推定・確信度による振り分け — confidence 系と接続)/ タスク特化(分類・抽出・ガードレール判定など「SLM で十分」な部品の切り出し)/ FT・蒸留との組み合わせ(fine-tuning-and-distillation の戦略面)/ 端末・エッジ展開(LLMOPS 計画の local-and-on-device-llm と分担: あちらは実行環境、こちらはモデル戦略)/ 評価(タスク別の品質ゲート)
- **分担**: 選定の一般論 = model-selection(正本)。本記事は「小型を活かす」戦略の詳解

### world-models-overview.md — 世界モデルの概観(01)

- **目的**: 「世界モデル」という語の指す範囲(生成的シミュレータ・予測モデル・エージェントの内部表現)を整理し、エージェントとの関係を掴む
- **主要トピック**: 世界モデルの 3 つの用法(①環境の生成的シミュレーション ②行動結果の予測 ③エージェント訓練・評価のインフラ)/ なぜ注目されるか(データの製造・安全な試行錯誤 — physical-ai の §を一般化)/ ソフトウェアエージェントへの含意(シミュレーション評価 — EVAL 計画の evaluation-environments と接続)/ 現在地の読み方(デモと実用の距離)
- **分担**: 物理世界の文脈 = physical-ai-overview(相互リンク)。`research/supplementary/physical-ai.md` の世界モデル節を再利用

### ai-history-and-lineage.md — AI の歴史と系譜(01)

- **目的**: 深層学習 → Transformer → LLM → エージェントという系譜を 1 本で掴み、「なぜ今こうなっているか」の文脈を持てる(新規参加者・非専門家への説明にも使える)
- **主要トピック**: 前史(記号主義と機械学習の往復 — 簡潔に)/ 深層学習の転換点 / Transformer と事前学習パラダイム(10 章への入口)/ スケーリングと基盤モデル化 / 指示追従・対話化 / ツール使用とエージェント化(01 章の各記事への接続)/ 「歴史から学べる判断の教訓」(ハイプサイクルとの付き合い方)
- **方針**: 年表の網羅ではなく「設計思想の転換点」で構成。固有モデル名は転換点の代表例に限定

### multimodal-model-internals.md — マルチモーダルモデルの内部(11、LLM-INTERNALS 採用時)

- **目的**: 画像・音声を扱うモデルの内部(エンコーダ・トークン化・生成)を学術粒度で理解する
- **主要トピック**: 視覚入力の仕組み(視覚エンコーダ・パッチトークン化・解像度とトークン数)/ 音声のトークン化(離散音声トークン・ネイティブ音声モデル)/ 生成側(拡散モデルの直感・自己回帰生成との対比)/ 統合の類型(アダプタ接続 vs ネイティブマルチモーダル)/ 実務含意(画像コスト・OCR 精度・レイテンシの由来 — MULTIMODAL 計画の記事群の理論的裏付け)
- **依存**: LLM-INTERNALS(11 章)採用が前提。不採用の場合は数式なしの直感版として 10 章に `multimodal-models.md` を置く縮小案

## 4. スコープ外(検討のうえ除外)

- **AGI 論・能力予測のタイムライン議論**: 見解が分かれ鮮度も速い。歴史記事の末尾で「読み方」に触れるまで
- **個別モデルの機能比較**: llm-landscape(正本)へ
- **拡散モデルの数理詳解**: multimodal-model-internals でも直感 + 原論文参照まで

## 5. フェーズ分割(ROADMAP 追記案)

フェーズ記号は **AQ・AR** を使います(AO・AP は [ORG-PROCESS-PLAN.md](ORG-PROCESS-PLAN.md) が使用)。

| フェーズ | 内容 | 成果物 | 備考 |
| --- | --- | --- | --- |
| AQ-1 | 推論モデル + SLM 戦略 | `reasoning-models.md`, `slm-strategy.md` | 調査不要(原則 + TODO 前提) |
| AQ-R | Phase AQ レビュー(散在言及からの逆リンク付け替え・published 化・同期一式) | — | — |
| AR-1 | 世界モデル + AI の歴史 | `world-models-overview.md`, `ai-history-and-lineage.md` | 調査不要(physical-ai メモ再利用) |
| AR-2 | マルチモーダルモデルの内部(11 章採用時) | `multimodal-model-internals.md` | LLM-INTERNALS の書誌確認方針に従う |
| AR-R | Phase AR レビュー + 統合(published 化・同期一式) | — | — |

完了時の規模: **92 → 97 本**(10: 5 → 6、03: 15 → 16、01: 9 → 11、11: +1)。

## 6. 執筆前調査

**専用タスクなし**。世界モデルは `research/supplementary/physical-ai.md`(2026-07-07)を再利用。#5 は LLM-INTERNALS の「執筆時に原論文の書誌確認」方針に従います。推論モデルの提供状況は TODO(要確認)前提で類型に徹します。

## 7. 同期・派生作業

- **GLOSSARY 候補**: 推論モデル(reasoning model)、推論トークン(reasoning tokens)、SLM(既に LLMOPS 計画でも候補 — 先に執筆した側で登録)、世界モデル(world model)、拡散モデル(diffusion model、#5 採用時)
- **逆リンク**: model-selection / capabilities-and-limits / prompt-engineering-fundamentals / latency-optimization → reasoning-models(散在言及の正本化)、model-selection / fine-tuning-and-distillation → slm-strategy、physical-ai-overview → world-models-overview、what-is-an-ai-agent → ai-history-and-lineage、10 章 attention / how-llms-generate → multimodal-model-internals(採用時)
- **10 章 README**: reasoning-models を読む順序(capabilities の後)に追加

## 8. 未確定事項(着手時に確認)

1. **#5 の扱い**: LLM-INTERNALS 採用なら 11 章(学術版)、不採用なら 10 章(直感版)に縮小
2. **ai-history の粒度**: 推奨は「転換点で語る 1 本」。年表・人物誌には広げない

## 9. TODO

> **TODO(要確認):** 推論モデルの提供形態(努力パラメータの名称・思考の可視性)はモデルごとに異なり変化も速い。本文は類型で書き、具体は各モデル公式ドキュメント参照とする(最終確認: 2026-07)
