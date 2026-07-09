# ECOSYSTEM-PLAN — 業界・エコシステム動向 追加計画

> **ステータス: 進行中(2026-07-07 作成、ユーザーの選定に基づく。Phase AS を 2026-07-10 に完了。ai-industry-map〔09〕・open-source-ai-ecosystem〔03〕の 2 本 published〔鮮度管理型・EC-R1 反映〕。残り AT〔ai-standards-and-certification・research-literacy・EC-R2 必須〕)。**
> AI 業界の構造・オープンソースエコシステム・規格認証・研究情報の追い方という「地図と情報リテラシー」の追加計画です。**4 本中 2 本が鮮度管理型**という、鮮度リスクを引き受ける性格の計画のため、定点観測の運用込みで設計します。進捗の正本は着手後 [ROADMAP.md](ROADMAP.md) に置きます。

## 1. 位置づけとギャップ分析

既存の「地図系」ページは [llm-landscape](docs/03-implementation/llm-landscape.md)(モデル)と [agent-benchmarks-landscape](docs/04-evaluation/agent-benchmarks-landscape.md)(ベンチマーク)、[coding-agents-comparison](docs/08-coding-agents/coding-agents-comparison.md)(ツール)で確立しています。ギャップは**それらを取り巻く業界の全体構造**と、**情報の目利き**です。

| # | ギャップ | 既存の最近接 |
| --- | --- | --- |
| 1 | 業界のレイヤー構造(チップ → クラウド → モデル → ツール → アプリ)と力学の地図がない | llm-landscape(モデル層のみ) |
| 2 | オープンソース AI(ハブ・ライセンス・コミュニティ)の体系がない | llm-landscape のオープンウェイト節・GLOSSARY の BYOK |
| 3 | AI 規格の**認証・適合の実務**(ISO/IEC 42001 等)がない | compliance-and-governance(規格に 1 段言及) |
| 4 | 研究・技術情報の**追い方**(一次情報の目利き・ハイプの見分け)がない — 本ライブラリ自身の調査方法論を読者に開示する形にできる | 各鮮度管理型ページの「更新の追い方」節に分散 |

## 2. 追加トピック一覧(4 本)

| # | 配置 | ファイル | 仮タイトル | level | 鮮度 |
| --- | --- | --- | --- | --- | --- |
| 1 | 09-business | `ai-industry-map.md` | AI 業界レイヤーマップ | basic | **速い(鮮度管理型)** |
| 2 | 03-implementation | `open-source-ai-ecosystem.md` | オープンソース AI エコシステム | intermediate | **速い(鮮度管理型)** |
| 3 | 06-security | `ai-standards-and-certification.md` | AI 規格・認証の実務(ISO/IEC 42001 ほか) | intermediate | 中 |
| 4 | 00-overview | `research-literacy.md` | AI 情報の追い方(一次情報の目利き) | basic | 安定 |

## 3. 各ページの設計

### ai-industry-map.md — AI 業界レイヤーマップ(09、鮮度管理型)

- **目的**: 「どの会社が何の層で稼いでいるか」を構造で掴み、調達・提携・技術選定の会話で業界力学を読めるようになる
- **主要トピック**: レイヤー構造(半導体 / クラウド・データセンター / 基盤モデル / ミドルウェア・ツール / アプリケーション)と各層の力学(集中と分散・利益の偏在)/ 垂直統合の潮流(層をまたぐプレイヤー)/ 提携・依存関係の読み方(調達リスクの観点 — deployment-and-scaling のフォールバックの戦略版)/ 日本市場の構造(国産モデル・SIer 層)/ 「地図の使い方」(ベンダーロックイン評価・技術選定への接続)
- **鮮度**: 3 点セット必須 + 調査 EC-R1。プレイヤー名は代表例に留め、資本関係の詳細は追わない
- **分担**: モデル層の詳細 = llm-landscape(正本)

### open-source-ai-ecosystem.md — オープンソース AI エコシステム(03、鮮度管理型)

- **目的**: オープンウェイト・OSS ツールのエコシステム(ハブ・ライセンス・コミュニティ)を使いこなし、リスクを判断できる
- **主要トピック**: エコシステムの構造(モデルハブ・データセット・OSS フレームワーク/エージェント・ローカル実行系)/ **ライセンスの読み方の詳解**(寛容 / コピーレフト / 独自制限付き(利用規模・用途制限)— 「オープン = 商用自由ではない」の実務判断)/ モデルカード・データシートの読み方 / 派生モデル(FT・マージ・量子化版)の系譜と信頼(TRUST 計画のサプライチェーンと接続)/ コミュニティの力学(誰が保守しているか・持続性の見極め)/ 企業としての関与(利用・貢献・公開の判断)
- **鮮度**: 3 点セット必須 + EC-R1。llm-landscape のオープンウェイト節を「モデルの地図」、本記事を「エコシステムの地図」として分担

### ai-standards-and-certification.md — AI 規格・認証の実務(06)

- **目的**: AI マネジメント規格(ISO/IEC 42001 ほか)への適合・認証を検討する際の、費用対効果と進め方を判断できる
- **主要トピック**: 規格の地図(マネジメントシステム規格 / リスクフレームワーク / 個別技術規格の関係 — compliance の 1 節を詳解)/ 認証を取る意味(取引要件・信頼の外部化)と限界(認証 ≠ 安全)/ 適合の進め方(既存 ISMS 等との統合・ギャップ分析・文書化の実務)/ 監査対応(compliance の「監査 = 運用の副産物」原則の規格版)/ 取得判断のフレーム(誰に求められているか・維持コスト)
- **方式**: 規格の内容解説は最小限にし「何を・どこで確認するか」を示す(入口マップ原則)。調査 EC-R2
- **分担**: 規制 = compliance-and-governance(正本)、業界別 = industry-regulations-map

### research-literacy.md — AI 情報の追い方(00)

- **目的**: 変化の速い AI 情報を、振り回されずに追う個人・チームの仕組みを作れる(本ライブラリの調査方法論の一般化)
- **主要トピック**: 情報源の階層(一次(論文・公式ドキュメント・公式ブログ)/ 準一次(第三者実測)/ 二次(解説・まとめ)— 本ライブラリの research/ 方式の開示)/ 論文の実務的な読み方(アブストラクト → 図表 → 限界節。再現・検証の有無を見る)/ ハイプの見分け方(デモと製品の距離・自己報告数値の扱い — benchmarks の読み方の一般化)/ 追いかける仕組み(定点観測・鮮度管理 — 本ライブラリの「変わりやすい項目」運用をチーム実践として紹介)/ 追わなくてよいものを決める(原理は安定・具体は変わる、の使い分け)
- **分担**: ベンチマークの読み方 = agent-benchmarks-landscape(正本)

## 4. スコープ外(検討のうえ除外)

- **投資・株式分析の視点**: 業界マップは技術選定・調達の文脈まで
- **個別企業の戦略評論**: 構造と力学まで(企業評は鮮度と主観のリスクが高い)
- **ライセンスの法的解釈**: 読み方の実務まで(判断は法務へ — 入口マップ原則)
- **ニュースの継続配信的な内容**: ライブラリは「追い方」を教え、ニュース自体は扱わない

## 5. フェーズ分割(ROADMAP 追記案)

フェーズ記号は **AS・AT** を使います(AQ・AR は [FOUNDATIONS-EXTENSION-PLAN.md](FOUNDATIONS-EXTENSION-PLAN.md) が使用)。

| フェーズ | 内容 | 成果物 | 備考 |
| --- | --- | --- | --- |
| AS-1 | 業界レイヤーマップ(EC-R1 反映・鮮度管理型) | `ai-industry-map.md` | EC-R1 必須 |
| AS-2 | オープンソースエコシステム(EC-R1 反映・鮮度管理型) | `open-source-ai-ecosystem.md` | — |
| AS-R | Phase AS レビュー(llm-landscape との分担確認・published 化・同期一式) | — | — |
| AT-1 | 規格・認証(EC-R2 反映)+ 情報の追い方 | `ai-standards-and-certification.md`, `research-literacy.md` | EC-R2 必須 |
| AT-R | Phase AT レビュー + 統合(定期メンテナンスへ 2 系統追加・published 化) | — | — |

完了時の規模: **92 → 96 本**(09: 5、03: 16、06: 9、00: 3)。

## 6. 執筆前調査

| ID | 対象 | 出力先 | 時期 |
| --- | --- | --- | --- |
| EC-R1 | 業界レイヤーと OSS エコシステムの現在地(各層の代表プレイヤーの公式情報・主要ハブの規約・代表的モデルライセンスの現行版) | `research/ecosystem/industry-oss.md` | AS-1 着手時(必須) |
| EC-R2 | AI 規格・認証の一次情報(ISO/IEC 42001 の概要・国内審査機関の状況・NIST AI RMF・関連規格の所在) | `research/ecosystem/standards.md` | AT-1 着手時(必須) |

## 7. 同期・派生作業

- **GLOSSARY 候補**: コピーレフト(copyleft)、モデルカード(model card)、ISO/IEC 42001、一次情報(primary source — research-literacy の中心概念)
- **逆リンク**: llm-landscape → ai-industry-map / open-source-ai-ecosystem、compliance-and-governance → ai-standards-and-certification、agent-benchmarks-landscape → research-literacy、open-source-coding-agents(08)→ open-source-ai-ecosystem、model-selection → ai-industry-map(調達リスク)
- **定期メンテナンス**(AT-R): 「業界マップ・OSS エコシステムの定点観測」を ROADMAP に追加(research/ecosystem/ を更新起点に)。鮮度管理型が全体で増えるため、定点観測の総量を AT-R で棚卸しする
- **learning-roadmap / website**: 構造変更なし

## 8. 未確定事項(着手時に確認)

1. **ai-industry-map の配置**: 推奨は 09-business(調達・戦略の文脈)。全体像の性格を重視するなら 00-overview も可
2. **鮮度負担の受け入れ**: 本計画は定点観測を 2 系統増やす。既存の観測 8 系統との総量を許容できるか(縮小案: #1 と #2 を統合して 1 本にし観測を 1 系統に)

## 9. TODO

> **TODO(要確認):** EC-R1・EC-R2 は各フェーズ着手時に実施する。業界構造・ライセンス・認証状況はいずれも変化するため、本文は構造と読み方に徹し、固有名は代表例 + 最終確認日で扱う(最終確認: 2026-07)
