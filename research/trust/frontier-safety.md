# フロンティアセーフティ(最前線 AI の安全枠組み)一次情報 調査メモ

- **調査日**: 2026-07-08
- **用途**: `docs/06-security/frontier-safety-overview.md`(フロンティアセーフティの概観)の裏付け。TRUST-SECURITY 計画 **AI-2** の材料。実務者が「モデル選定・調達時に、提供者の安全体制を評価軸にする」ために必要な範囲に絞る。危険能力そのものの手法(サイバー・生物等の攻撃方法)は一切扱わず、**枠組みの所在・共通構造・評価/公表の仕組み**のみを整理する
- **根拠の方針**: 各ラボの公式ドキュメント/公式ブログ、政府機関の公式サイト(nist.gov / aisi.gov.uk / aisi.go.jp)、標準・公的機関のみを根拠にする。まとめ記事・SNS・法律事務所ブログは出典に挙げない(裏取りの補助にのみ使用)
- **注意(スナップショット)**: 各社フレームワーク・各国機関は**改版・改組・改称のペースが速い**。本メモは **2026-07-08 時点のスナップショット**。特にラボのフレームワークはバージョン番号が四半期単位で動き、AISI 系機関は 2025 年に米英ともに改称した。記事側では「バージョン番号・URL は変わる前提で、常に各社の一次ページを確認する」と書く
- **確度マーカー**:
  - `公式確認済み` = 公式ページ/公式 PDF を WebFetch で直接取得して確認
  - `ベンダー自己報告` = 提供者自身が公表する安全主張(自己申告)。事実として「そう公表している」ことは確かだが、第三者検証を意味しない
  - `二次情報` = 検索スニペット等で公式ドメインの文書名・日付・URL を確認(直接取得は未実施、または公式ページが bot 遮断)
  - `未確認` = 今回確認できず(確認先 URL を残す)
- **取得上の注意**: `openai.com` の Preparedness Framework 解説ページは WebFetch で **HTTP 403(bot 遮断)**、公式 PDF は**バイナリ(テキスト抽出不可)**のため、OpenAI の詳細は公式 URL の存在を確認したうえで検索スニペット(公式ドメイン引用)で裏取りした。`anthropic.com` / `deepmind.google` / `nist.gov` / `aisi.gov.uk` / `aisi.go.jp` は直接取得できた

---

## A. 主要ラボの安全フレームワーク(現行版の所在と概要)

> 各ラボが「自社モデルは安全だ」と述べる部分は本質的に **ベンダー自己報告**(自己申告)です。フレームワークの**存在・版・内容**は公式確認済みですが、そこに書かれた安全性の達成度は提供者の自己評価であり、記事では「提供者が公表する安全体制を**評価軸として使う**(鵜呑みにしない)」という文脈で扱います。

### A-1. Anthropic — Responsible Scaling Policy(RSP / 責任あるスケーリング方針)

| 事実 | 出典 URL(公式) | 確認日 | 確度 |
| --- | --- | --- | --- |
| 現行版は **Version 3.3(発効 2026-05-26)**。初版(v1)は 2023-09 公開。v3.0(2026-02-24 公開)で全面改訂された経緯を公式ページ本文が記載 | https://www.anthropic.com/responsible-scaling-policy | 2026-07-08 | 公式確認済み |
| 定めるもの: **能力閾値(Capability Thresholds)**(CBRN 兵器開発、AI R&D 自律加速など)、**評価(定期的な能力評価)**、能力に応じた**必要なセーフガード(セキュリティ・展開時の防護)**、**公表**(下記ロードマップと Risk Report) | https://www.anthropic.com/responsible-scaling-policy | 2026-07-08 | 公式確認済み(自己申告部分は ベンダー自己報告) |
| **AI Safety Levels(ASL)**: ASL-2 / ASL-3 を段階として運用。ASL-3 が高能力モデル向けの強化要件 | https://www.anthropic.com/responsible-scaling-policy | 2026-07-08 | 公式確認済み |
| v3.0 で新設された**Frontier Safety Roadmap**(Security / Alignment / Safeguards / Policy 領域の緩和策計画)と、全展開モデルのリスクを定量化する **Risk Report** を公表する枠組み | https://www.anthropic.com/responsible-scaling-policy/roadmap | 2026-07-08 | 公式確認済み |
| 安全評価・システムカード等の公表ハブ(Transparency Hub) | https://www.anthropic.com/transparency | 2026-07-08 | 公式確認済み |

補足: v3.0 で従来の「一時停止(pause)コミットメント」の表現が変わった点が 2026-02 に報道されたが、これは緩和策の引き下げではないと Anthropic は説明。**版差の詳細は変わりやすいため記事では版番号を断定せず「最新版を各社ページで確認」と書く**。

### A-2. OpenAI — Preparedness Framework(準備フレームワーク)

| 事実 | 出典 URL(公式) | 確認日 | 確度 |
| --- | --- | --- | --- |
| 現行版は **Version 2(最終更新 2025-04-15)**。2023-12 の Beta 版を置換 | 解説: https://openai.com/index/updating-our-preparedness-framework/ / 本文 PDF: https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf | 2026-07-08 | 二次情報(公式ページは 403、PDF はバイナリで直接抽出不可。URL 存在と版・日付は公式ドメイン引用で確認) |
| **Tracked Categories(追跡対象の能力領域)**: サイバーセキュリティ、生物・化学、**AI 自己改善(self-improvement)** の 3 つ。加えて閾値未達の領域を扱う **Research Categories** を新設 | 同上 | 2026-07-08 | 二次情報 |
| 能力閾値を 2 段階に整理: **High capability**(既存の重大被害経路を増幅しうる)と **Critical capability**(前例のない新たな重大被害経路を生みうる)。High 到達モデルは**展開前に**、Critical は**開発中も**リスクを「十分に最小化する」セーフガードが必要 | 同上 | 2026-07-08 | 二次情報 |
| 「severe harm(重大被害)」の定義例: 数千人規模の死亡/重傷、または数千億ドル規模の経済損害 | 同上 | 2026-07-08 | 二次情報 |
| 評価結果・セーフガードの公表は **Safeguards Report** と各モデルの **System Card** による(公表手段は C 章参照) | https://openai.com/index/updating-our-preparedness-framework/ | 2026-07-08 | 二次情報 |

> **TODO(要確認):** OpenAI Preparedness Framework の**現行版番号**を openai.com の公式ページ(または PDF)で直接確認する。2026-07-08 時点では公式ページが bot 遮断(403)で直接取得できず、v2(2025-04-15)が最新かどうかを一次取得で裏取りできていない(最終確認: 2026-07)

### A-3. Google DeepMind — Frontier Safety Framework(FSF / フロンティア安全枠組み)

| 事実 | 出典 URL(公式) | 確認日 | 確度 |
| --- | --- | --- | --- |
| **Version 3.0 を 2025-09-22 公開**。さらに小改訂の **Version 3.1** PDF が存在(公式ブログは 2026-04-17 に更新記載)。初版は 2024-05、v2.0 は 2025-02-04 | ブログ: https://deepmind.google/blog/strengthening-our-frontier-safety-framework/ / v3.0 PDF: https://storage.googleapis.com/deepmind-media/DeepMind.com/Blog/strengthening-our-frontier-safety-framework/frontier-safety-framework_3.pdf / v3.1 PDF: https://storage.googleapis.com/deepmind-media/DeepMind.com/Blog/strengthening-our-frontier-safety-framework/frontier-safety-framework_3-1.pdf | 2026-07-08 | 公式確認済み |
| 中核概念は **Critical Capability Levels(CCL)**=「緩和策がなければ重大被害の高いリスクをもたらしうる能力水準」。v3.0 で **有害な操作(harmful manipulation)** の CCL を新設 | https://deepmind.google/blog/strengthening-our-frontier-safety-framework/ | 2026-07-08 | 公式確認済み |
| カバーするリスク領域: **CBRN、サイバーセキュリティ、機械学習 R&D(ML R&D)、ミスアラインメント(操作者の制御・シャットダウンへの干渉を含む)** | 同上 | 2026-07-08 | 公式確認済み |
| 仕組み: **早期警告評価(early-warning evaluations)**、体系的な能力特定を伴うリスク評価、CCL 到達時の**外部公開前セーフティケース審査(safety case review)**、より早期に検知する **Tracked Capability Levels(TCL)** | 同上 | 2026-07-08 | 公式確認済み |

補足: 初版 2024-05 → v2.0 2025-02-04 → v3.0 2025-09-22 → v3.1(2026-04 反映)と、**約半年ごとに改訂**されている。記事では「版番号は流動的」と明記する。

### A-4. その他ラボ(存在の確認のみ / 記事では概観)

| 事実 | 出典 URL(公式) | 確認日 | 確度 |
| --- | --- | --- | --- |
| Meta・xAI・Microsoft 等も類似のフロンティア安全方針(frontier AI framework / preparedness 系)を公表しているが、本メモでは主要 3 社に絞って一次確認した。他社は記事執筆時に各社公式ページを個別確認する方針 | 各社公式サイト(未取得) | 2026-07-08 | 未確認 |

> **TODO(要確認):** Meta の Frontier AI Framework、Microsoft の Frontier Governance Framework 等の**現行版と公式 URL**を、記事に列挙するなら各社公式ページで直接確認する(最終確認: 2026-07)

---

## B. 各国 AISI 系機関・政府枠組み(存在と所在の確認)

> 本章は**存在・役割・公式所在(URL)の確認に留める**(活動の詳細解説は記事の範囲外)。2025 年に米英ともに機関名が「Safety」から「Security / Standards」へ改称した点が実務上のポイント(URL・名称が変わる)。

| 機関 | 現名称(改称) | 設立 | 役割(要旨) | 公式 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- | --- | --- |
| 米国 | **CAISI(Center for AI Standards and Innovation)**。旧「US AI Safety Institute(US AISI)」を **2025-06 に改称**。NIST 内 | 2023-11(US AISI として) | 産業界の政府側窓口として AI のテスト・共同研究を促進。国家安全保障に関わる AI 能力の非機密評価、ガイドライン/ベストプラクティス策定、国際標準への関与 | https://www.nist.gov/caisi | 2026-07-08 | 公式確認済み(ミッションを直接取得)/ 改称時期は 二次情報 |
| 英国 | **AI Security Institute(AISI)**。旧「AI Safety Institute」を **2025-02(ミュンヘン安全保障会議で発表)に改称**。DSIT(科学・イノベーション・技術省)内の研究組織 | 2023-11(Frontier AI Taskforce から発展) | 先端 AI モデルの**展開前後テスト**、評価ツール(オープンソースの Inspect)提供、サイバー悪用・アラインメント・自律能力等のリスク研究。政府に科学的知見を提供 | https://www.aisi.gov.uk/ / About: https://www.aisi.gov.uk/about / GOV.UK: https://www.gov.uk/government/organisations/ai-security-institute | 2026-07-08 | 公式確認済み(About を直接取得)/ 改称時期は 二次情報 |
| 日本 | **AI セーフティ・インスティテュート(AISI)** | 2024-02-14 | AI 安全の**評価手法・基準**の検討と促進。安全評価の調査、テスト手法、レッドチーミング、ガイドライン整備、国際連携。**IPA(情報処理推進機構)に事務局** | https://aisi.go.jp/ / About: https://aisi.go.jp/about/ | 2026-07-08 | 公式確認済み(About を直接取得) |
| 国際 | **International Network of AI Safety Institutes(AI 安全機関の国際ネットワーク)** | 2024-05(AI Seoul Summit で合意) | 英・米・日・仏・独・伊・シンガポール・韓・豪・加・EU・ケニア等の機関が参加し、評価・基準策定を協調(例: AI エージェント評価の共同演習を 2025-07 実施) | 参加各機関の公式サイト(ネットワーク単独の恒久公式ポータルは未特定) | 2026-07-08 | 二次情報 |

補足(記事向けの含意): 実務者は調達時に「提供者が**どの国の AISI 系機関と評価連携しているか**」「政府評価の対象になっているか」を補助的な信頼シグナルとして見られます。ただし各機関の**評価は網羅的な認証ではなく**、機関ごとに焦点(英=セキュリティ寄り、米=標準/国家安全保障寄り、日=評価手法・基準)が異なる点に注意。

> **TODO(要確認):** 日本 AISI が公表する「AI セーフティ評価観点ガイド」「レッドチーミング手法ガイド」等の**現行版と版番号**を aisi.go.jp の公表物ページで直接確認する(記事でガイドラインを名指しする場合。最終確認: 2026-07)

---

## C. 評価エコシステム・システムカード(実務者が調達時に見るもの)

### C-1. 危険能力評価(dangerous capability evaluations)の位置づけ(概念レベル)

| 事実 | 出典 URL(公式) | 確認日 | 確度 |
| --- | --- | --- | --- |
| ラボの各フレームワークは共通して「**危険能力評価**(CBRN・サイバー・AI 自己改善/ML R&D・自律性・操作等の能力を測る評価)」を能力閾値の判定手段として位置づける。閾値到達の疑いがあれば追加の緩和策・審査が発動する構造 | A 章各フレームワーク(Anthropic RSP / OpenAI PF / Google FSF) | 2026-07-08 | 公式確認済み(枠組みの構造)/ 危険能力の具体手法は本メモでは扱わない |
| 第三者評価: 各国 AISI 系機関(B 章)による**展開前後テスト**、およびラボ間のクロス評価が行われる(例: OpenAI–Anthropic の相互アラインメント評価演習) | https://openai.com/index/openai-anthropic-safety-evaluation/ | 2026-07-08 | 二次情報(公式ドメインの公表を検索で確認、直接取得は未実施) |
| 評価ツールの例: 英国 AISI が **Inspect**(オープンソース評価基盤)を提供し、コミュニティで評価を標準化 | https://www.aisi.gov.uk/about | 2026-07-08 | 公式確認済み |

> 本メモは危険能力の**手法**(サイバー攻撃・生物/化学兵器の作り方等)を一切記載しません。扱うのは「**どの能力領域が評価対象か**」「**誰が・どの段階で評価するか**」という防御・ガバナンスの枠組みのみです。

### C-2. システムカード / モデルカード(安全評価の公表手段)

| 事実 | 出典 URL(公式) | 確認日 | 確度 |
| --- | --- | --- | --- |
| **System Card / Model Card** は、モデルの能力・限界・安全評価結果を公表する主要手段。OpenAI・Anthropic は「System Card」、Google は「Model Card」の語を主に使う | Anthropic Transparency Hub: https://www.anthropic.com/transparency | 2026-07-08 | 公式確認済み(Anthropic)/ 用語傾向は 二次情報 |
| Anthropic のシステムカードは、セーフガードのテスト、正直性・エージェント安全性、アラインメント評価、**RSP が求める危険能力評価**の結果を記載(例: Claude Opus 4.5 System Card / Claude Opus 4.6 System Card) | https://assets.anthropic.com/m/64823ba7485345a7/Claude-Opus-4-5-System-Card.pdf | 2026-07-08 | 公式確認済み(PDF の存在・記載範囲) |
| 実務者が調達時に見るべきもの(まとめ): ① 提供者の**フレームワーク現行版**(A 章)→ ② 当該モデルの **System/Model Card**(危険能力評価・閾値判定・緩和策)→ ③ **Transparency/Safety ページ**での更新履歴 → ④ 補助的に **AISI 系機関の評価連携**(B 章)。**いずれも提供者の自己申告が中心のため、複数を突き合わせて評価軸にする** | 上記各 URL | 2026-07-08 | 公式確認済み(見るべき対象の所在)/ 記載内容は ベンダー自己報告 |

---

## 主要フレームワーク早見表

| ラボ | フレームワーク名 | 現行版(2026-07-08) | 能力の呼称 | 公式 URL | 確度 |
| --- | --- | --- | --- | --- | --- |
| Anthropic | Responsible Scaling Policy(RSP) | **v3.3(発効 2026-05-26)** | AI Safety Levels(ASL-2 / ASL-3)+ Capability Thresholds | https://www.anthropic.com/responsible-scaling-policy | 公式確認済み |
| OpenAI | Preparedness Framework | **v2(2025-04-15)** ※版番号は未直接確認 | High / Critical capability(Tracked Categories) | https://openai.com/index/updating-our-preparedness-framework/ | 二次情報 |
| Google DeepMind | Frontier Safety Framework(FSF) | **v3.0(2025-09-22)/ v3.1(2026-04 反映)** | Critical Capability Levels(CCL)+ Tracked Capability Levels(TCL) | https://deepmind.google/blog/strengthening-our-frontier-safety-framework/ | 公式確認済み |

---

## 共通構造のまとめ(能力閾値 → 評価 → 対応措置 → 公表)

3 社のフレームワークは名称・粒度は違えど、次の 4 段パイプラインを共有します(記事の骨格に使える)。

1. **能力閾値の設定(threshold)**: 重大被害につながりうる能力領域(CBRN、サイバー、AI 自己改善/ML R&D、自律性、操作/ミスアラインメント等)ごとに、危険とみなす**能力水準**を事前定義する。
   - Anthropic = Capability Thresholds + ASL、OpenAI = High / Critical、Google = CCL / TCL
2. **評価(evaluation)**: 開発・展開の過程で**危険能力評価**を定期・イベント駆動で実施し、閾値到達を判定する(早期警告評価を含む)。
3. **閾値到達時の対応措置(response)**: 閾値に達したら、能力に応じた**セキュリティ強化・展開制限・セーフガード**を課し、外部公開前に**セーフティケース審査**等を行う(Anthropic は ASL-3 の強化要件、Google は safety case review、OpenAI は「十分な最小化」要件)。
4. **公表・説明責任(transparency)**: フレームワーク本文の版管理に加え、モデル単位の **System/Model Card**、Anthropic の Frontier Safety Roadmap / Risk Report のような**計画・リスク報告**を公表する。

> 実務含意: この 4 段は**提供者の自己統治(self-governance)**であり、外部の強制力は各国 AISI 系機関の評価連携・規制(EU AI Act の GPAI 義務等)で補完される。記事では「**共通構造を評価チェックリストに変換**(①閾値を定義しているか ②評価を公表しているか ③到達時の措置が具体的か ④モデルごとのカードがあるか)」という使い方を提案できる。

---

## 変わりやすい項目(定点観測)

記事公開後も定期確認が必要な、動きの速い項目:

| 項目 | 現状(2026-07-08) | 確認先 |
| --- | --- | --- |
| Anthropic RSP の版 | v3.3(2026-05-26) | https://www.anthropic.com/responsible-scaling-policy |
| OpenAI Preparedness Framework の版 | v2(2025-04-15)※直接未確認 | https://openai.com/index/updating-our-preparedness-framework/ |
| Google FSF の版 | v3.0(2025-09-22)/ v3.1 | https://deepmind.google/blog/strengthening-our-frontier-safety-framework/ |
| 米機関の名称・所在 | CAISI(2025-06 に US AISI から改称)@ NIST | https://www.nist.gov/caisi |
| 英機関の名称・所在 | AI Security Institute(2025-02 に改称)@ DSIT | https://www.aisi.gov.uk/ |
| 日本 AISI の公表ガイド版 | 評価観点/レッドチーミング等(版は未確認) | https://aisi.go.jp/ |
| 国際ネットワーク参加機関 | 12+ 機関(Seoul Summit 2024-05 合意) | 各機関公式サイト |
| 対象ラボの追加 | Meta・Microsoft・xAI 等は未取得 | 各社公式サイト |

---

## 未確認・要フォロー事項の一覧

- OpenAI Preparedness Framework の**現行版番号**(公式ページ 403・PDF バイナリで直接未確認。v2/2025-04-15 が最新かの一次裏取りが残)
- 各国 AISI 系機関の**改称時期の一次ソース**(US=2025-06 / UK=2025-02 は二次情報。nist.gov / gov.uk のプレスで裏取り可能)
- 日本 AISI の**公表ガイドラインの正式名称・現行版**(記事で名指しする場合)
- Meta / Microsoft / xAI 等**他ラボのフレームワーク**の版・URL(記事で列挙する場合)
- International Network of AI Safety Institutes の**恒久公式ポータル URL**(単独ポータルの有無)
