# AI-STRATEGY-PLAN — AI 戦略・調達・持続性 追加計画

> **ステータス: 設計案(2026-07-07 作成、ユーザーの選定に基づく。着手指示待ち)。**
> 経営・調達レベルの判断 — 自社モデルを持つか・どう買うか・地政学リスク・環境負荷 — を扱う追加計画です。進捗の正本は着手後 [ROADMAP.md](ROADMAP.md) に置きます。

## 1. 位置づけとギャップ分析

09-business は「案件の推進」(選定 → PoC → ROI → 規制)を整備済みですが、その上位にある**経営・調達の判断**が未カバーです。

| # | ギャップ | 既存の最近接(正本のまま) |
| --- | --- | --- |
| 1 | 「自社モデルを持つか」の投資判断(FT の先にある継続事前学習・専用モデルの経営判断) | fine-tuning-and-distillation(手法)・LLMOPS 計画の self-hosted(実行) |
| 2 | AI を**買う側**の実務(RFP・ベンダー評価・契約・検収) | SE 計画(売る側・受注側)・poc-to-production(自社開発前提) |
| 3 | 地政学・輸出規制・データ主権のリスク | compliance-and-governance(規制一般)・industry-regulations-map(業界別) |
| 4 | AI の環境負荷と効率化(グリーン AI) | cost-management(コストは扱うが環境は未カバー) |

## 2. 追加トピック一覧(4 本)

| # | 配置 | ファイル | 仮タイトル | level | 鮮度 |
| --- | --- | --- | --- | --- | --- |
| 1 | 09-business | `own-model-strategy.md` | 「自社モデルを持つか」の判断 | advanced | 中 |
| 2 | 09-business | `ai-procurement.md` | AI 調達・ベンダー選定の実務 | intermediate | 安定 |
| 3 | 09-business | `ai-geopolitics-map.md` | AI と地政学・輸出規制の入口マップ | intermediate | **速い(免責 + 鮮度管理型)** |
| 4 | 05-operations | `green-ai.md` | AI の環境負荷とグリーン AI | intermediate | 中 |

## 3. 各ページの設計

### own-model-strategy.md — 「自社モデルを持つか」の判断(09)

- **目的**: プロンプト → RAG → FT の先にある「専用モデルへの投資」(大規模 FT・継続事前学習・共同開発)を、能力・コスト・組織の観点で判断できる
- **主要トピック**: 「持つ」の段階(既製 API → FT → 継続事前学習 → 共同開発・独自構築)とそれぞれの前提条件 / 判断軸(差別化の源泉か・データ優位はあるか・維持できる組織か・退役リスク)/ コスト構造(初期だけでなく追従コスト — ベースモデル世代交代への追従が最大の見落とし)/ 「持たない」戦略の強さ(モデル中立・乗り換え自由の価値 — model-selection の経営版)/ 段階的な検証(FT の実績 → 拡大)/ 撤退基準の事前定義(roi-and-business-case の原則の適用)
- **分担**: FT の手法 = fine-tuning-and-distillation、実行基盤 = LLMOPS 計画。本記事は投資判断

### ai-procurement.md — AI 調達・ベンダー選定の実務(09)

- **目的**: AI 製品・ソリューションを「買う側」として、RFP・評価・契約・検収を非決定的なシステムの性質に合わせて設計できる
- **主要トピック**: 従来調達との違い(仕様を完全に書けない・性能が確率的・デモが当てにならない)/ RFP の書き方(自社データでの実証を要求する・評価基準の事前定義 — agent-evaluation-basics の調達版)/ ベンダー評価(検証可能な試行(PoC 条件の対等化)・ロックイン評価・安全体制(frontier-safety 接続))/ 契約の観点(SLA・データ利用・モデル更新の扱い・出口条項 — 入口マップ原則で観点列挙まで)/ 検収の設計(受け入れ評価セット・本番前パイロット)/ 継続ガバナンス(更新のたびの再評価)
- **分担**: 売る側 = SE 計画の se-client-adoption(対になる記事)、規制 = compliance 系

### ai-geopolitics-map.md — AI と地政学・輸出規制の入口マップ(09、免責 + 鮮度管理型)

- **目的**: チップ・モデル・データにかかる地政学リスク(輸出規制・データ主権・供給集中)について、「何を・どの一次情報で確認するか」を特定できる(内容解説はしない)
- **主要トピック**: リスクの類型(①輸出管理(半導体・モデルの規制)②データ主権・越境(所在地要求)③供給網の集中(特定国・特定社への依存)④制裁・利用制限)/ 確認先マップ(日本: 経産省安全保障貿易管理 / 米国: BIS / EU 等 — 所在のみ)/ 事業への落とし込み(調達の複線化・リージョン戦略・依存の棚卸し — ai-industry-map(ECOSYSTEM 計画)と接続)/ 法務・貿易管理部門と協働する準備
- **方式**: industry-regulations-map と同型(免責 + 鮮度 3 点セット + 調査 ST-R1 必須)

### green-ai.md — AI の環境負荷とグリーン AI(05)

- **目的**: AI の環境負荷(電力・水・カーボン)の構造を理解し、エンジニアが打てる効率化と、報告要求への備えができる
- **主要トピック**: 負荷の構造(学習 vs 推論・データセンターの電力と冷却水 — 規模感は帯で)/ エンジニアにできる削減(モデル right-sizing・キャッシュ・バッチ・SLM 活用 — **cost-management の施策の多くが環境にも効く**という接続を軸に)/ 測定の現実(排出量の推計手法と限界・プロバイダー開示の読み方)/ 報告需要への備え(ESG・取引先からの照会 — 断定せず確認先)/ グリーンウォッシュを避ける誠実な主張
- **分担**: コスト最適化 = cost-management(正本)。調査 ST-R2(プロバイダーの環境開示の所在)

## 4. スコープ外(検討のうえ除外)

- **国際政治の分析・予測**: リスクの類型と確認先まで(地政学の見解は述べない)
- **投資・M&A の判断**: 自社モデル判断は技術投資の範囲まで
- **カーボン会計の一般論**: AI 固有の測定・削減まで
- **調達法務の契約書ドラフト**: 観点列挙まで(入口マップ原則)

## 5. フェーズ分割(ROADMAP 追記案)

フェーズ記号は **AZ** を使います(AY は [AGENT-INFRA-PLAN.md](AGENT-INFRA-PLAN.md) が使用)。

| フェーズ | 内容 | 成果物 | 備考 |
| --- | --- | --- | --- |
| AZ-1 | 自社モデル戦略 + AI 調達 | `own-model-strategy.md`, `ai-procurement.md` | 調査不要 |
| AZ-2 | 地政学マップ(ST-R1 反映・免責 + 鮮度管理型)+ グリーン AI(ST-R2 反映) | `ai-geopolitics-map.md`, `green-ai.md` | ST-R1・ST-R2 必須 |
| AZ-R | Phase AZ レビュー + 統合(model-selection / fine-tuning / cost-management / compliance 系からの逆リンク・published 化・定期メンテナンス追加) | — | — |

完了時の規模: **92 → 96 本**(09: 4 → 7、05: 8 → 9)。

## 6. 執筆前調査

| ID | 対象 | 出力先 | 時期 |
| --- | --- | --- | --- |
| ST-R1 | 輸出規制・データ主権の一次情報所在(経産省安全保障貿易管理・米 BIS の AI 関連規則・主要国のデータ所在要求の所在。**内容の解釈はしない**) | `research/strategy/geopolitics.md` | AZ-2 着手時(必須) |
| ST-R2 | AI の環境負荷に関する公式情報(主要プロバイダーの環境開示・データセンターの電力/水に関する公的統計・排出推計の代表的方法論) | `research/strategy/green-ai.md` | AZ-2 着手時(必須) |

## 7. 同期・派生作業

- **GLOSSARY 候補**: 輸出管理(export control)、データ主権(data sovereignty)、継続事前学習(continued pre-training)、グリーン AI(green AI)
- **逆リンク**: fine-tuning-and-distillation / model-selection → own-model-strategy、poc-to-production / roi-and-business-case → ai-procurement、compliance-and-governance / industry-regulations-map → ai-geopolitics-map、cost-management → green-ai(施策の共通性)、llm-landscape → ai-geopolitics-map(供給集中)
- **他計画との接続**: ECOSYSTEM の ai-industry-map(供給網の構造)↔ geopolitics、LLMOPS の self-hosted ↔ own-model-strategy、SE の se-client-adoption ↔ ai-procurement(売る側と買う側の対)
- **定期メンテナンス**(AZ-R): 「輸出規制・環境開示の定点観測」を追加(research/strategy/ を更新起点に)

## 8. 未確定事項(着手時に確認)

1. **green-ai の配置**: 推奨は 05(効率化の実務)。報告・ESG 色を強めるなら 09 も可
2. **4 本の粒度**: 縮小案は 3 本(#4 を cost-management の増補に)。報告需要を重視するなら 4 本を推奨

## 9. TODO

> **TODO(要確認):** ST-R1(輸出規制)・ST-R2(環境開示)は AZ-2 着手時に実施する。地政学・環境はライブラリ内で最も評論に流れやすい領域のため、レビュー観点に「事実と確認先に徹しているか(見解を述べていないか)」を含める(最終確認: 2026-07)
