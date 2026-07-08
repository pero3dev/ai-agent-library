# PRIORITY-MAP — 未着手計画の推奨実施順

> **ステータス: 運用中(2026-07-07 作成・2026-07-08 更新)。** 拡張計画のうち DEEP-DIVE(Phase M〜O・7 本)・MODEL-PROMPTING(Phase BA・4 本)・DATA-KNOWLEDGE(Phase AD・AE・6 本)・EVAL-QUALITY(Phase AK・AL・5 本)が完了し、残る拡張計画 14 本(計 85 本 + examples 5 件)の推奨実施順です。フェーズの完了・計画の変更時に本ファイルも同じセッションで更新します(進捗の正本は [ROADMAP.md](ROADMAP.md)、各計画の内容は各 PLAN ファイルが正本)。

## 1. 評価軸

| 軸 | 意味 |
| --- | --- |
| 価値 | 読者需要・実務での即効性(◎ / ○ / △) |
| 調査 | 執筆前調査の要否(ゼロ = すぐ書ける) |
| 鮮度負担 | 鮮度管理型ページの数(**書いた瞬間から四半期メンテナンスの対象が増える** — 早く書くほど維持期間が長くなるため、需要とのバランスで判断) |
| 依存 | 他計画への依存(いずれも弱依存 — 相互リンクは後追いで張れるため順序制約は緩い) |

**前提**: 新セクション番号(11〜15)は計画の**採否**で確定し、実施順には依存しません(どの順で着手しても番号は変わらない。計画が不採用になった場合のみ繰り上げ)。

## 2. 推奨ウェーブ

上の波から順に「Phase X を一括で」と指定するだけで進められます。**波の中の順序は入れ替え自由**です。

### 第 1 波: 中核テーマの詳解(調査ゼロ・最高需要)

| フェーズ | 計画 | 本数 | 根拠 |
| --- | --- | --- | --- |
| ✅ M・N・O 完了(2026-07-08) | [DEEP-DIVE](DEEP-DIVE-PLAN.md)(プロンプト/コンテキスト/ハーネス/ループ) | 7(完了) | 価値◎・調査ゼロ・全計画の分担参照先になる中核。三層の内側から |
| ✅ BA 完了(2026-07-08) | [MODEL-PROMPTING](MODEL-PROMPTING-PLAN.md)(モデル特化ガイド) | 4(完了) | 価値◎(具体需要)。PE-R1〜R3 の調査を `research/prompting/` に記録。鮮度負担 +4 は定点観測へ統合済み |

### 第 2 波: 基盤の深掘り(調査ほぼゼロ・既存章の直下)

| フェーズ | 計画 | 本数 | 根拠 |
| --- | --- | --- | --- |
| ✅ AD・AE 完了(2026-07-08) | [DATA-KNOWLEDGE](DATA-KNOWLEDGE-PLAN.md)(埋め込み・ベクトル DB ほか) | 6(完了) | 価値◎(RAG 下層)・調査ゼロ。AD=embeddings/vector-databases/data-preprocessing、AE=graph-rag/synthetic-data/data-governance |
| ✅ AK・AL 完了(2026-07-08) | [EVAL-QUALITY](EVAL-QUALITY-PLAN.md)(評価環境・シミュレータほか) | 5(完了) | 価値○・調査ゼロ。AK=evaluation-environments/user-simulator-design/confidence-and-calibration、AL=fairness-and-bias-evaluation/japanese-quality-evaluation |
| AX | [RELIABILITY](RELIABILITY-PLAN.md)(SLO・カオス・常駐) | 3 | 価値○・調査ゼロ。AK の評価環境を参照するため EVAL の後が滑らか |
| AQ | [FOUNDATIONS-EXTENSION](FOUNDATIONS-EXTENSION-PLAN.md) 前半(推論モデル・SLM) | 2 | **reasoning-models は散在言及の正本化で、早いほど他記事のリンク先として効く** |

### 第 3 波: 実務応用(調査あり・需要高)

| フェーズ | 計画 | 本数 | 根拠 |
| --- | --- | --- | --- |
| V → X | [SE-CODING-AGENTS](SE-CODING-AGENTS-PLAN.md) | 7 | 価値◎(SE 層の需要)。**08 章の調査メモ(2026-07)が新しいうちが有利**。調査 1 件 |
| AF → AG | [LLMOPS](LLMOPS-PLAN.md)(セルフホスト・ゲートウェイほか) | 7 | 価値◎(閉域網需要)。SE の制約記事と相互補完。調査 1 件 |
| Y → Z | [MULTIMODAL](MULTIMODAL-PLAN.md)(ドキュメント AI ほか) | 7 | Y(理解系)は調査ゼロで価値◎。Z(生成系)は調査 2 件・鮮度負担 +2 |
| AH → AI → AJ | [TRUST-SECURITY](TRUST-SECURITY-PLAN.md) | 8 | AH(サプライチェーン・攻撃)は調査ゼロで価値◎。AI・AJ は調査 3 件・鮮度負担 +3。**compliance メモ(2026-07)の再利用は早いほど楽** |

### 第 4 波: 新章の応用群・組織・事例

| フェーズ | 計画 | 本数 | 根拠 |
| --- | --- | --- | --- |
| AA → AB → AC | [DOMAIN-AGENTS](DOMAIN-AGENTS-PLAN.md)(12 本・新 13 章) | 12 | 価値○〜◎。EVAL の fairness(人事採用が参照)と DEEP-DIVE の loop の後が滑らか。調査 2 件 |
| AU → AV | [CASES-EXAMPLES](CASES-EXAMPLES-PLAN.md)(事例 + examples) | 3 + 5 | **失敗事例(AU-2)は単独で早期繰り上げ可**(依存なし・差別化大)。データ分析事例は DOMAIN の後が理想。AV(examples)は完全独立でいつでも |
| AM → AN | [UX-PRODUCT](UX-PRODUCT-PLAN.md)(新 14 章) | 6 | 価値○・調査ゼロ |
| AO → AP | [ORG-PROCESS](ORG-PROCESS-PLAN.md) | 5 | 価値○・調査ゼロ |
| AY | [AGENT-INFRA](AGENT-INFRA-PLAN.md)(サンドボックス・プロトコル) | 2 | サンドボックス(AY-1)は価値◎・調査ゼロで繰り上げ可。プロトコル(AY-2)は調査必須・鮮度負担 +1 |
| AZ | [AI-STRATEGY](AI-STRATEGY-PLAN.md)(自社モデル・調達ほか) | 4 | 価値○。調査 2 件・鮮度負担 +1 |

### 第 5 波: 大型・独立・維持負担の大きいもの

| フェーズ | 計画 | 本数 | 根拠 |
| --- | --- | --- | --- |
| S → T → U | [LLM-INTERNALS](LLM-INTERNALS-PLAN.md)(学術編・新 11 章) | 8 | 独立性が高くいつでも実施可。数式レンダリング検証(S-0)を含む大型。読者層が相対的に狭いため波 5 |
| AR | [FOUNDATIONS-EXTENSION](FOUNDATIONS-EXTENSION-PLAN.md) 後半(世界モデル・歴史・MM 内部) | 3 | #5(MM 内部)は LLM-INTERNALS 採用後。physical-ai メモ再利用 |
| AW | [HUMAN-AI](HUMAN-AI-PLAN.md)(新 15 章) | 4 | ユニークな差別化だが緊急性は低い |
| AS → AT | [ECOSYSTEM](ECOSYSTEM-PLAN.md) | 4 | **鮮度負担 +2 が最重**(業界マップ・OSS)。research-literacy(AT-1 内)は安定・価値○のため単独繰り上げ可 |

## 3. 順序に関する注意

1. **弱依存の原則**: 計画間の参照(「採用時に相互リンク」)はすべて後追いの逆リンクで解決できるため、波を跨ぐ入れ替えも可能です。上の順序は「最も手戻り・再調査が少ない」推奨に過ぎません
2. **調査メモの賞味期限**: 2026-07-07 実施の調査(benchmarks・compliance・agent-identity・音声/FT・physical-ai・regulations・coding-agents 実践)を参照する記事は、**メモが四半期以内(〜2026-10)のうちに書くと再調査が不要**です(EVAL・SE・TRUST 後半・FOUNDATIONS 後半・DOMAIN 第 2 期が該当)
3. **鮮度負担の総量管理**: 全計画完了で鮮度管理型ページは 10 本超増えます。各 X-R での「定点観測の棚卸し」(ECOSYSTEM 計画に明記)を波 3 以降は毎回実施し、観測系統の統合を進めます
4. **分担の先後**: DEEP-DIVE の prompt-engineering-patterns(汎用上級)と MODEL-PROMPTING(モデル別具体)は、どちらが先でも成立しますが、両方の冒頭分担表が相手を指すため、**片方を書いたら他方の着手時に分担表を確認**します
5. **examples(AV)の特殊性**: コード実行環境の検証を伴うため、ドキュメント執筆と独立したセッションで実施することを推奨します

## 4. 使い方

- 着手: 上の波から「**Phase M を一括で**」のようにフェーズ記号で指定
- 各フェーズ完了時: ROADMAP・本ファイル(該当行に ✅)・計画書ヘッダーを同一セッションで更新
- 計画の縮小・変更: 各計画書の §未確定事項の決定を決定ログに記録し、本ファイルの本数を更新
