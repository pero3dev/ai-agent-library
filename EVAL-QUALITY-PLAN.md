# EVAL-QUALITY-PLAN — 評価・品質の深掘り 追加計画

> **ステータス: 実施中(2026-07-07 作成。2026-07-08 に Phase AK 完了 = evaluation-environments / user-simulator-design / confidence-and-calibration の 3 本 published。残りは Phase AL の 2 本 = 公平性・日本語品質)。**
> 04-evaluation の発展層 — 評価環境の構築・ユーザーシミュレータ・信頼度較正・公平性・日本語品質 — の追加計画です。進捗の正本は着手後 [ROADMAP.md](ROADMAP.md) に置きます。

## 1. 位置づけとギャップ分析

既存の 04-evaluation(7 本)は「何をどう測るか」(基礎・judge・軌跡・回帰・データセット・オンライン・ベンチマーク)を完成させています。ギャップは**測るための装置と、測る観点の拡張**です。

| 既存 | カバー範囲 | ギャップ(本計画) |
| --- | --- | --- |
| [agent-evaluation-basics](docs/04-evaluation/agent-evaluation-basics.md) / [regression-testing](docs/04-evaluation/regression-testing.md) | 評価設計・CI 組み込み | 評価を**実行する環境**(モック・サンドボックス・状態リセット)の構築論 |
| [llm-as-a-judge](docs/04-evaluation/llm-as-a-judge.md) | 出力の判定 | **対話相手**(ユーザーシミュレータ)の設計 — `research/professional/benchmarks.md` の τ-bench 知見を実務に転用 |
| [online-evaluation-and-ab-testing](docs/04-evaluation/online-evaluation-and-ab-testing.md) | 本番の品質シグナル | **確信度**という出力側のシグナル(較正・選択的予測)/ **層別の公平性**評価 / **日本語固有**の品質観点 |

## 2. 追加トピック一覧(5 本、すべて 04-evaluation)

| # | ファイル | 仮タイトル | level | 鮮度 |
| --- | --- | --- | --- | --- |
| 1 | `evaluation-environments.md` | エージェント評価環境の構築 | advanced | 安定 |
| 2 | `user-simulator-design.md` | ユーザーシミュレータの設計 | advanced | 安定 |
| 3 | `confidence-and-calibration.md` | 信頼度と較正(calibration) | advanced | 安定 |
| 4 | `fairness-and-bias-evaluation.md` | 公平性・バイアスの評価 | intermediate | 中 |
| 5 | `japanese-quality-evaluation.md` | 日本語品質の評価 | intermediate | 中(ベンチ名は TODO 前提) |

## 3. 各ページの設計

### evaluation-environments.md — エージェント評価環境の構築

- **目的**: 「ツールを実行する Agent」を安全・再現可能に評価する環境(モック・サンドボックス・シード付き状態)を構築できる
- **主要トピック**: 評価環境の 3 層(①ツールスタブ・モック(決定的な応答)②状態付きサンドボックス(DB・ファイルをシードして実行し、終了状態を検証 — τ-bench・OSWorld 型の自前版)③本番接続の限定評価)/ 再現性の作り(状態リセット・時刻の固定・乱数)/ 忠実度と保守コストのトレードオフ(モックが本番と乖離する問題)/ 環境の CI 統合(regression-testing の実行系)/ 失敗の再現環境化(本番インシデント → 評価ケース + 環境)
- **分担**: 何を測るか = agent-evaluation-basics、隔離技術 = tool-permissions-and-sandboxing

### user-simulator-design.md — ユーザーシミュレータの設計

- **目的**: 対話型 Agent の評価に「ユーザー役 LLM」を使う際の、シミュレータの設計と信頼性検証ができる
- **主要トピック**: シミュレータの構成(ペルソナ・目標・知識・忍耐度・口調)/ 暴走の抑制(シミュレータをツール・状態で縛る — 公開ベンチマークの設計知見の転用)/ シナリオ生成(分布の設計・エッジケースの意図的混入)/ シミュレータ品質の検証(人間対話ログとの乖離測定)/ 落とし穴(シミュレータへの過適合・シミュレータと被評価系が同系モデルの盲点共有 — evaluation-datasets の合成データ論と同根)
- **分担**: 判定側 = llm-as-a-judge(相手役と審判役は別コンポーネント)

### confidence-and-calibration.md — 信頼度と較正

- **目的**: 「モデルがどれくらい確信しているか」を取り出し・検証し、確信が低いときの縮退(人へ回す)を設計できる
- **主要トピック**: 信頼度の取り出し方(自己申告・対数確率・複数回実行の一致度)とそれぞれの信頼性 / 較正の測定(確信 80% のとき本当に 8 割正しいか — 過信・迎合の影響)/ 選択的予測(閾値を切って「わからない」と言わせる・人へエスカレーションする — [Human-in-the-Loop 設計](docs/02-architecture/human-in-the-loop.md) の入力信号化)/ 閾値の設計(失敗コストとの関係)/ 運用での再較正(モデル更新で較正はずれる)
- **分担**: 幻覚の由来 = llm-training-pipeline(10 章)

### fairness-and-bias-evaluation.md — 公平性・バイアスの評価

- **目的**: 属性・グループによる品質差と表現の偏りを、測定可能な形で評価に組み込める
- **主要トピック**: バイアスの類型(グループ間の品質差・表現の固定観念・拒否率の偏り)/ 評価設計(対照ペアテスト(属性だけ入れ替える)・層別評価 — online-evaluation の層別の公平性版)/ 日本語・日本文化圏の観点(名前・方言・敬語の扱い)/ 対応の選択肢(プロンプト・ガードレール・データ)と限界 / 「完全な公平」ではなく「測って改善する」姿勢
- **分担**: 規制上の要求 = compliance-and-governance

### japanese-quality-evaluation.md — 日本語品質の評価

- **目的**: 英語中心の評価では見えない日本語固有の品質(敬語・文体・表記)を測る評価を設計できる
- **主要トピック**: 日本語固有の品質軸(敬語・待遇表現の適切さ / 文体一貫性(です・ます / である)/ 表記ゆれ・全半角 / 固有名詞・読み / 不自然な直訳調)/ 評価データの作り方(日本語の実タスクから)/ judge の日本語能力の検証(日本語の採点を英語系 judge に任せる危険)/ 自動チェック(表記・形式)と judge の分担 / 公開日本語ベンチマークの読み方(帯・TODO 前提)
- **分担**: 評価一般 = agent-evaluation-basics、翻訳品質は DOMAIN 計画の writing-and-translation(採用時)と接続

## 4. スコープ外(検討のうえ除外)

- **統計的検定の教材化**: online-evaluation の範囲を超える統計理論は外部に委ねる
- **公平性の法的議論**: 測定の実務まで(法務は compliance 系へ)
- **日本語 NLP の言語学的詳解**: 評価に効く観点まで

## 5. フェーズ分割(ROADMAP 追記案)

フェーズ記号は **AK・AL** を使います(AH〜AJ は [TRUST-SECURITY-PLAN.md](TRUST-SECURITY-PLAN.md) が使用)。

| フェーズ | 内容 | 成果物 | 備考 |
| --- | --- | --- | --- |
| AK-1 | 評価環境 + ユーザーシミュレータ | `evaluation-environments.md`, `user-simulator-design.md` | 調査不要(benchmarks メモを再利用) |
| AK-2 | 信頼度と較正 | `confidence-and-calibration.md` | 調査不要 |
| AK-R | Phase AK レビュー(agent-evaluation-basics / regression-testing / HITL からの逆リンク・published 化・同期一式) | — | — |
| AL-1 | 公平性 + 日本語品質 | `fairness-and-bias-evaluation.md`, `japanese-quality-evaluation.md` | 調査不要(日本語ベンチ名は TODO 前提) |
| AL-R | Phase AL レビュー + 統合(published 化・同期一式) | — | — |

完了時の規模: **92 → 97 本**(04: 7 → 12)。

## 6. 執筆前調査

**なし**(全 5 本とも原則安定。`research/professional/benchmarks.md` の τ-bench・評価環境知見を再利用し、日本語ベンチマークの具体名は TODO(要確認)前提)。

## 7. 同期・派生作業

- **GLOSSARY 候補**: ユーザーシミュレータ(user simulator)、較正(calibration)、選択的予測(selective prediction)、対照ペアテスト(counterfactual test)
- **逆リンク**: agent-evaluation-basics → 5 本(発展層として)、regression-testing → evaluation-environments、human-in-the-loop → confidence-and-calibration、evaluation-datasets → user-simulator-design(合成の盲点共有)、online-evaluation → fairness(層別)
- **learning-roadmap / website**: 構造変更なし。ビルド検証のみ

## 8. 未確定事項(着手時に確認)

1. **5 本の粒度**: 縮小案は 3 本(#4 公平性を #5 日本語品質と統合、#3 を HITL 増補に)。網羅性を優先するなら 5 本を推奨
2. **japanese-quality-evaluation の射程**: 評価に限定(推奨)か、日本語プロンプトの書き方まで広げるか

## 9. TODO

> **TODO(要確認):** 日本語評価ベンチマーク・リーダーボードの顔ぶれは執筆時に確認し、本文では帯と確認方法のみ扱う(最終確認: 2026-07)
