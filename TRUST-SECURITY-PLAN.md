# TRUST-SECURITY-PLAN — セキュリティ・信頼・法務 追加計画

> **ステータス: 設計案(2026-07-07 作成、ユーザーの選定に基づく。着手指示待ち)。**
> 06-security の発展層(サプライチェーン・新興攻撃・プライバシー技術・来歴と検出・フロンティアセーフティ)と、09-business の法務層(著作権・責任)を追加する計画です。進捗の正本は着手後 [ROADMAP.md](ROADMAP.md) に置きます。

## 1. 位置づけとギャップ分析

既存の 06-security(8 本)は「動いている Agent への攻撃と防御」(インジェクション・権限・漏えい・ガードレール・認証・レッドチーミング・規制)を完成させています。ギャップは 3 方向です。

| 方向 | 既存 | ギャップ(本計画) |
| --- | --- | --- |
| **上流(入ってくるものの信頼)** | [tool-permissions-and-sandboxing](docs/06-security/tool-permissions-and-sandboxing.md)(実行時の防御) | 導入**前**の信頼 — モデル・重み・データセット・MCP サーバー・スキルの検証(サプライチェーン) |
| **攻撃の進化** | [prompt-injection](docs/06-security/prompt-injection.md)(直接・間接の基本形) | 記憶・知識源・ツール定義・マルチエージェント経由の**新興攻撃パターン**の体系化 |
| **社会的信頼・法務** | [compliance-and-governance](docs/06-security/compliance-and-governance.md)(規制の地図)/ [industry-regulations-map](docs/09-business/industry-regulations-map.md)(業界別) | 生成物の**来歴と検出**、なりすまし防御、プライバシー技術、フロンティアセーフティ、**著作権・責任**の入口マップ |

### 執筆方針(このカテゴリ固有)

1. **防御側の記述に徹する**: 攻撃の仕組みは防御設計に必要な粒度まで。攻撃手順・実行可能なペイロードは書かない([red-teaming-agents](docs/06-security/red-teaming-agents.md) 執筆時に確立した方針を継承)
2. **法務系は「入口マップ + 免責」方式**: 内容解説をせず「何を・どの一次情報で確認するか」に徹する(industry-regulations-map と同型。免責 + 鮮度管理 3 点セット必須)
3. **「検出できる」前提を作らない**: 生成物検出・ディープフェイク検出は限界を正面から書き、検出技術をプロセス設計の補助と位置づける

### 配置

**新セクションは作らず、06-security(+6 本)と 09-business(+2 本)に追加**します。06 は 14 本に育ちますが、既存 8 本(脅威→防御)の後ろに「発展層」として並べます。

## 2. 追加トピック一覧(8 本)

| # | 配置 | ファイル | 仮タイトル | level | 鮮度 |
| --- | --- | --- | --- | --- | --- |
| 1 | 06-security | `ai-supply-chain-security.md` | AI サプライチェーンセキュリティ | advanced | 中 |
| 2 | 06-security | `advanced-attack-patterns.md` | 新興攻撃パターンの体系(記憶・知識源・ツール・マルチエージェント) | advanced | 中 |
| 3 | 06-security | `privacy-enhancing-technologies.md` | プライバシー強化技術の概観 | intermediate | 安定 |
| 4 | 06-security | `content-provenance-and-detection.md` | 生成物の来歴と検出 | intermediate | **速い(鮮度管理型)** |
| 5 | 06-security | `deepfake-and-impersonation-defense.md` | ディープフェイク・なりすましへの防御 | intermediate | 中 |
| 6 | 06-security | `frontier-safety-overview.md` | フロンティアセーフティの概観 | intermediate | **速い(鮮度管理型)** |
| 7 | 09-business | `ai-copyright-and-ip-map.md` | AI と著作権・知的財産の入口マップ | intermediate | **速い(免責 + 鮮度管理型)** |
| 8 | 09-business | `agent-liability-and-accountability.md` | エージェントの責任と説明責任 | intermediate | 中(免責) |

## 3. 各ページの設計

### ai-supply-chain-security.md — AI サプライチェーンセキュリティ(06)

- **目的**: 外から持ち込む AI 資産 — モデル・重み・データセット・プロンプト/スキル・MCP サーバー・ツール — を、実行する**前**に信頼できるか判断するプロセスを設計できる
- **主要トピック**: AI 固有のサプライチェーン面の棚卸し(重みファイルの改ざん・実行コード混入 / データセットポイズニング / 共有プロンプト・スキルテンプレートの汚染 / MCP サーバーとその更新(導入後に挙動が変わる問題)/ 依存ライブラリ)/ 信頼の確立手段(出所・署名・ハッシュ検証・レジストリの審査状況)/ 受け入れプロセスの設計(審査 → 限定権限で試用 → 昇格)/ AI 資産の台帳(compliance の AI インベントリとの統合)/ 継続監視(更新の差分確認)
- **分担**: 実行時の隔離・権限 = tool-permissions-and-sandboxing(正本)。本記事は導入前・導入時の信頼

### advanced-attack-patterns.md — 新興攻撃パターンの体系(06)

- **目的**: 基本形(直接・間接インジェクション)の先にある攻撃面 — 記憶・知識源・ツール・エージェント間 — を脅威モデルに組み込み、対策を既存防御にマッピングできる
- **主要トピック**: 記憶への注入(長期記憶に残した指示が後日発火する型 — [long-term-memory-implementation](docs/03-implementation/long-term-memory-implementation.md) の防御面)/ 知識源ポイズニング(RAG に細工された文書が混入する型 — 権限反映・出所管理との接続)/ ツール定義・ツール結果経由の注入(説明文・エラーメッセージが指示になる型)/ マルチエージェント伝播(1 体の汚染が委譲・共有コンテキストで広がる型)/ 条件起動型(特定条件でのみ発火し検査をすり抜ける型)/ 各パターン → 既存防御(ガードレール・隔離・出所検証・HITL)への対策マップ
- **方針**: 仕組みの説明は防御設計に必要な粒度まで。実行可能な攻撃例は載せない
- **分担**: 基本形と防御原則 = prompt-injection(正本)、演習 = red-teaming-agents

### privacy-enhancing-technologies.md — プライバシー強化技術の概観(06)

- **目的**: マスキングの先にあるプライバシー技術(差分プライバシー・連合学習・秘密計算など)の「何が実務で現実的か」の見取り図を持てる
- **主要トピック**: 技術の階層(PII 検出・マスキング → 仮名化・匿名化(と再識別の限界 — 既存記事の復習)→ 差分プライバシー(直感・使いどころ・精度コスト)→ 連合学習 → 秘密計算・TEE の概観)/ それぞれの成熟度と適用場面(集計・学習・推論のどこに効くか)/ 「高度な技術より先にやること」(データ最小化・アクセス統制)/ 選定の判断フレーム
- **分担**: 会話データの実装 = conversation-data-management(正本)。本記事は技術の見取り図

### content-provenance-and-detection.md — 生成物の来歴と検出(06、鮮度管理型)

- **目的**: 「AI 製かどうか」を扱う 2 つのアプローチ — 来歴(作成時に証明を付ける)と検出(後から判定する)— の仕組みと限界を理解し、組織の運用を設計できる
- **主要トピック**: 来歴の仕組み(コンテンツ資格情報(C2PA 系)・電子透かし)と剥がれ方(編集・変換での喪失)/ 検出の原理と限界(誤判定率・回避との軍拡・「検出器で断定しない」原則)/ 組織での運用(自社生成物への来歴付与・受け入れコンテンツの検証プロセス・規制上の表示義務との接続(compliance へ))/ 2026-07 時点の標準・提供状況(TS-R3 反映)
- **鮮度**: 3 点セット必須。標準仕様・各社機能は動く

### deepfake-and-impersonation-defense.md — ディープフェイク・なりすましへの防御(06)

- **目的**: 音声クローン・映像合成によるなりすまし(送金詐欺・虚偽指示)への組織的防御を設計できる
- **主要トピック**: 脅威類型(音声クローンによる電話詐欺・ビデオ会議のなりすまし・偽コンテンツによる風評)/ 防御の中心はプロセス(声・顔を本人確認に使わない前提への移行・重要指示のコールバック検証・合言葉/第二経路・支払いプロセスの二重化)/ 検出技術の位置づけ(補助であり単独で頼らない)/ 従業員訓練と通報経路 / 自社ブランド・経営層のなりすまし監視 / 公的機関の注意喚起の参照
- **方針**: 防御側のみ。作成手法には触れない
- **分担**: 音声クローンの自社利用の統制 = MULTIMODAL 計画の speech-synthesis(採用時に相互リンク)

### frontier-safety-overview.md — フロンティアセーフティの概観(06、鮮度管理型)

- **目的**: 最前線モデルの安全枠組み(危険能力評価・責任あるスケーリング)を読み解き、モデル選定・調達時に「提供者の安全体制」を評価軸にできる
- **主要トピック**: フロンティアセーフティとは(通常のアプリ安全との違い — 能力そのものの評価)/ 各社の安全フレームワークの共通構造(能力閾値・評価・対応措置・公表)/ 危険能力評価の領域(サイバー・生物等 — 概観のみ)/ 第三者機関(各国 AISI 系)と評価エコシステム / 実務者への含意(調達・モデル選定でシステムカード・安全方針の何を見るか)/ 2026-07 時点の主要フレームワークの所在(TS-R2 反映)
- **鮮度**: 3 点セット必須。各社フレームワークは改版される

### ai-copyright-and-ip-map.md — AI と著作権・知的財産の入口マップ(09、免責 + 鮮度管理型)

- **目的**: AI 案件で問題になる知財論点の「在り処」— 何を・どの一次情報で確認するか — を短時間で特定できる(内容解説はしない)
- **主要トピック**: 論点の 3 層(①学習・入力段(学習データ・入力素材の権利)②生成物の権利(権利が発生するか・帰属)③生成物による侵害(既存著作物との類似))/ 確認先マップ(国内: 文化庁の整理・知財本部の資料 / 海外: 参照レベル)/ 契約実務の観点(モデル提供者の補償条項・素材ライセンス・成果物の権利条項 — compliance のベンダー契約チェックと接続)/ 社内ルールの型(生成物の利用範囲・出所記録)/ 法務と協働する準備([industry-regulations-map](docs/09-business/industry-regulations-map.md) §と同じ 4 点セット方式)
- **方式**: 免責 + 鮮度管理 3 点セット + TS-R1(一次情報の所在調査)必須

### agent-liability-and-accountability.md — エージェントの責任と説明責任(09、免責)

- **目的**: エージェントが事故を起こしたとき「誰が・何に基づいて説明するか」を、契約と技術の両面から事前に設計できる
- **主要トピック**: 責任分界の論点整理(モデル提供者 / システム提供者 / 導入企業 / 利用者 — 断定せず論点として)/ 契約での手当(責任制限・免責・SLA・保険の論点 — 観点列挙まで)/ 説明責任の技術的裏付け(行為の帰属(agent-identity)・監査証跡(observability・compliance)・承認記録(HITL)が「説明できる」の実体)/ 自律度と責任の関係(自律度を上げる = 説明の難度が上がる構造)/ 事故対応での説明の型(incident-response の対外説明面)
- **分担**: 規制 = compliance(正本)、ログの実装 = 既存運用記事。本記事は論点整理と設計への落とし込み

## 4. スコープ外(検討のうえ除外)

- **攻撃手順・ペイロードの詳解**: 全記事共通の除外(防御設計に必要な粒度まで)
- **法的助言・判例解説**: 入口マップ方式の徹底(法務系 2 本は確認先の提示まで)
- **暗号理論の詳解**(差分プライバシー・秘密計算の数理): 概観と適用判断まで(学術は LLM-INTERNALS の範囲外でもあり扱わない)
- **物理セキュリティ・一般的な情報セキュリティ**: AI 固有の面まで
- **コンテンツモデレーション基盤の構築**: ガードレール(既存)の範囲を超える分は将来判断

## 5. フェーズ分割(ROADMAP 追記案)

フェーズ記号は **AH〜AJ** を使います(AF・AG は [LLMOPS-PLAN.md](LLMOPS-PLAN.md) が使用)。新セクションがないためスケルトンフェーズは不要です。

| フェーズ | 内容 | 成果物 | 備考 |
| --- | --- | --- | --- |
| AH-1 | サプライチェーン + 新興攻撃パターン | `ai-supply-chain-security.md`, `advanced-attack-patterns.md` | 調査不要(部分確認のみ) |
| AH-2 | プライバシー強化技術 | `privacy-enhancing-technologies.md` | 調査不要 |
| AH-R | Phase AH レビュー(threat-model / prompt-injection / tool-permissions / long-term-memory からの逆リンク・published 化・同期一式) | — | — |
| AI-1 | 来歴と検出 + ディープフェイク防御(TS-R3 反映) | `content-provenance-and-detection.md`, `deepfake-and-impersonation-defense.md` | TS-R3 必須 |
| AI-2 | フロンティアセーフティ(TS-R2 反映・鮮度管理型) | `frontier-safety-overview.md` | TS-R2 必須 |
| AI-R | Phase AI レビュー(published 化・同期一式) | — | — |
| AJ-1 | 著作権・知財マップ(TS-R1 反映・免責 + 鮮度管理型)+ 責任と説明責任 | `ai-copyright-and-ip-map.md`, `agent-liability-and-accountability.md` | TS-R1 必須 |
| AJ-R | Phase AJ レビュー + 統合(compliance / industry-regulations-map / model-selection との相互リンク総点検・定期メンテナンス追加・published 化) | — | — |

完了時の規模: **92 → 100 本**(06: 8 → 14、09: 4 → 6。承認済み他計画とすべて完了なら 150 本)。

## 6. 執筆前調査

| ID | 対象 | 出力先 | 時期 |
| --- | --- | --- | --- |
| TS-R1 | AI と著作権・知財の一次情報所在(文化庁「AI と著作権」系資料の現行版・知財本部・個別論点の公的整理。海外は米著作権局・EU の所在のみ。**内容の解釈はしない**) | `research/trust/copyright.md` | AJ-1 着手時(必須) |
| TS-R2 | フロンティアセーフティの公式一次情報(主要ラボの安全フレームワーク現行版・各国 AISI 系機関・第三者評価の動向) | `research/trust/frontier-safety.md` | AI-2 着手時(必須) |
| TS-R3 | 来歴・検出・なりすまし対策の現在地(コンテンツ来歴標準の仕様版数・主要プラットフォームの来歴/透かし機能・公的機関の注意喚起。検出ツールの性能主張は「ベンダー自己報告」として扱う) | `research/trust/provenance.md` | AI-1 着手時(必須) |

AH 系 3 本(サプライチェーン・攻撃・プライバシー技術)は原則が安定しているため専用調査は不要とし、執筆時の部分確認のみとします。

## 7. 同期・派生作業

- **GLOSSARY 候補**(執筆時確定): サプライチェーン攻撃(supply chain attack)、メモリポイズニング(memory poisoning)、来歴(provenance)、電子透かし(watermarking)、ディープフェイク(deepfake)、差分プライバシー(differential privacy)、連合学習(federated learning)、フロンティアセーフティ(frontier safety)
- **逆リンク**(各 X-R で実施): threat-model-overview → supply-chain / advanced-attacks(脅威一覧の拡張)、prompt-injection → advanced-attacks、tool-permissions-and-sandboxing → ai-supply-chain-security、long-term-memory-implementation → advanced-attacks(記憶注入)、rag-implementation-patterns → advanced-attacks(知識源ポイズニング)、conversation-data-management → privacy-enhancing-technologies、compliance-and-governance → ai-copyright-and-ip-map / agent-liability、industry-regulations-map → ai-copyright-and-ip-map、model-selection / llm-landscape → frontier-safety-overview(選定軸の追加)、incident-response → agent-liability(対外説明)
- **他計画との接続**: MULTIMODAL の speech-synthesis(音声クローン統制)↔ deepfake-defense、image-generation(来歴付与)↔ provenance
- **learning-roadmap**: 変更不要の見込み(セクション追加なし)。読者タイプ E(セキュリティ)のルートに発展層の一文を足すかは AJ-R で判断
- **定期メンテナンス**(AJ-R): 「著作権・来歴標準・フロンティアセーフティの定点観測」を ROADMAP に追加(research/trust/ を更新起点に)

## 8. 未確定事項(着手時に確認)

1. **8 本の粒度**: 縮小案は 6 本(#3 PETs を conversation-data-management の増補に、#8 責任を compliance の増補に吸収)。網羅性を優先するなら 8 本を推奨
2. **frontier-safety-overview の配置**: 推奨は 06(安全の文脈)。政策・調達の色を強めるなら 09 も可
3. **advanced-attack-patterns の粒度**: 攻撃 5 類型を 1 本にまとめる推奨案に対し、将来の分冊(記憶編・マルチエージェント編)余地を残すか

## 9. TODO

> **TODO(要確認):** TS-R1〜R3 は各フェーズ着手時に実施する。法務系 2 本は執筆後に「内容解説をしていないか(入口マップ方式の逸脱がないか)」をレビュー観点に明示的に含める(最終確認: 2026-07)
