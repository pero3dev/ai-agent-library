# フロンティアセーフティ(最前線 AI の安全枠組み)一次情報 調査メモ

- **初回調査日**: 2026-07-08
- **差分更新日**: 2026-09-10(RSP 3.4・August Risk Report・OpenAI の方針文書・AISI ガイド)。他の行の確認日は据え置き
- **用途**: `docs/06-security/frontier-safety-overview.md`(フロンティアセーフティの概観)の裏付け。TRUST-SECURITY 計画 **AI-2** の材料。実務者が「モデル選定・調達時に、提供者の安全体制を評価軸にする」ために必要な範囲に絞る。危険能力そのものの手法(サイバー・生物等の攻撃方法)は一切扱わず、**枠組みの所在・共通構造・評価/公表の仕組み**のみを整理する
- **根拠の方針**: 各ラボの公式ドキュメント/公式ブログ、政府機関の公式サイト(nist.gov / aisi.gov.uk / aisi.go.jp)、標準・公的機関のみを根拠にする。まとめ記事・SNS・法律事務所ブログは出典に挙げない(裏取りの補助にのみ使用)
- **注意(スナップショット)**: 各社フレームワーク・各国機関は**改版・改組・改称のペースが速い**。本メモは **2026-07-08 時点のスナップショット**。特にラボのフレームワークはバージョン番号が四半期単位で動き、AISI 系機関は 2025 年に米英ともに改称した。記事側では「バージョン番号・URL は変わる前提で、常に各社の一次ページを確認する」と書く
- **確度マーカー**:
  - `公式確認済み` = 公式ページ/公式 PDF を WebFetch で直接取得して確認
  - `ベンダー自己報告` = 提供者自身が公表する安全主張(自己申告)。事実として「そう公表している」ことは確かだが、第三者検証を意味しない
  - `二次情報` = 検索スニペット等で公式ドメインの文書名・日付・URL を確認(直接取得は未実施、または公式ページが bot 遮断)
  - `未確認` = 今回確認できず(確認先 URL を残す)
- **取得状況の更新**: OpenAI の Preparedness 更新記事・Frontier Governance Framework 公表記事・2026-08-18 方針記事を 2026-09-10 に直接取得したため、初回の 403 未確認メモを解消。全モデルの安全評価結果や長大な報告書の全ページは精査していない。

---

## A. 主要ラボの安全フレームワーク(現行版の所在と概要)

> 各ラボが「自社モデルは安全だ」と述べる部分は本質的に **ベンダー自己報告**(自己申告)です。フレームワークの**存在・版・内容**は公式確認済みですが、そこに書かれた安全性の達成度は提供者の自己評価であり、記事では「提供者が公表する安全体制を**評価軸として使う**(鵜呑みにしない)」という文脈で扱います。

### A-1. Anthropic — Responsible Scaling Policy(RSP / 責任あるスケーリング方針)

| 項目 | 2026-09-10 に公式確認した内容 |
| --- | --- |
| 方針の版 | **v3.4、2026-07-08 発効**。公式ページの更新日は 8/14 |
| v3.4 の変更 | 自動化 R&D の閾値を改訂。非墨消し版リスク報告の社内共有先を少なくとも 200 人とし、公開版に墨消し箇所の表示を要求。外部レビューは部分ごとに別担当者でもよいが、全ての部分が少なくとも 1 人の外部レビューを受ける扱い |
| リスク報告の日付 | **August 2026 Risk Report は 8/14 公表、評価対象日(coverage date)は 7/15**。公表日までの全変更が評価済みとはしない |
| 読み方 | 方針・Frontier Safety Roadmap・Risk Report・モデルのカードを照合し、採用モデルがどの対象期間と評価範囲に含まれるかを確認 |
| 確認の限界 | 186 ページの Risk Report は表紙・対象日・構成を確認した範囲。全評価結果の精査や第三者再現は行っていない |

一次情報: [RSP と更新履歴](https://www.anthropic.com/responsible-scaling-policy)、[August 2026 Risk Report](https://www.anthropic.com/aug-2026-risk-report)(アクセス日: 2026-09-10)。方針の版・公表日は公式確認済み、安全性の達成度はベンダー自己報告です。

### A-2. OpenAI — Preparedness / Frontier Governance

| 文書 | 日付・位置づけ | 確認範囲 |
| --- | --- | --- |
| Preparedness Framework の更新 | 2025-04-15。High / Critical の危険能力閾値と、開発・配備段階のセーフガードを定める基礎 | 更新記事を直接取得。初回の 403 未取得メモを解消 |
| Frontier Governance Framework | **2026-05-28**。Preparedness の関連部分を California TFAIA / EU GPAI 実務規範等の規制上の要求へ接続 | 公表記事を直接取得。Preparedness と同一の文書・版とはしない |
| Pacing model development in an era of cyber-critical capabilities | **2026-08-18**。訓練・研究・配備での監視・アラインメント・アクセスや隔離の強化、今後の Preparedness 改定方針 | 方針記事を直接取得。将来改定の予告を新しい Preparedness 版の発行済みと読まない |

更新記事では生物・化学、サイバー、AI 自己改善を Tracked Categories とし、未成熟な領域を Research Categories として扱います。High は配備前、Critical は開発中も重大被害リスクを十分小さくする措置を求めます。方針の存在と、採用モデルで安全性が達成されたという評価結果は別に確認します。

一次情報: [Preparedness 更新](https://openai.com/index/updating-our-preparedness-framework/)、[Frontier Governance](https://openai.com/index/openai-frontier-governance-framework/)、[8/18 の方針](https://openai.com/index/pacing-model-development-cyber-capabilities/)(アクセス日: 2026-09-10)。

> **TODO(要確認):** OpenAI の 2026-08-18 方針記事で予告された Preparedness Framework 改定の公表・発効と、採用モデルのカード・リスク評価の対象範囲を公式ページで確認する(最終確認: 2026-09)

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

日本 AISI の「AI セーフティに関する評価観点ガイド」は **第 1.20 版(2026-07-07)** を確認済みです。Agent の観測と制御、自律的挙動、外部相互作用を追加しています。**AI ロボティクス版は 7/23 公表**です。一次情報: https://aisi.go.jp/output/output_information/260707/ / https://www.ipa.go.jp/pressrelease/2026/press20260723.html (確認日: 2026-09-10)。認証規格ではなく評価計画の参照資料として扱います。

> **TODO(要確認):** 日本 AISI のレッドチーミング手法ガイドなど、本更新で精読していない公表物の現行版・追補を aisi.go.jp の公表物一覧で確認する(最終確認: 2026-07)

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
| 実務者が調達時に見るべきもの(まとめ): ① 提供者の**フレームワーク現行版**(A 章)→ ② 当該モデルの **System/Model Card と Risk Report**(危険能力評価・閾値判定・緩和策、公表日と対象日の区別)→ ③ **Transparency/Safety ページ**での更新履歴 → ④ 補助的に **AISI 系機関の評価連携**(B 章)。**いずれも提供者の自己申告が中心のため、複数を突き合わせて評価軸にする** | 上記各 URL | 2026-07-08 | 公式確認済み(見るべき対象の所在)/ 記載内容は ベンダー自己報告 |

---

## 主要フレームワーク早見表

| ラボ | フレームワーク名 | 確認した版(各行の確認日を参照) | 能力の呼称 | 公式 URL | 確度 |
| --- | --- | --- | --- | --- | --- |
| Anthropic | Responsible Scaling Policy(RSP) | **v3.4(発効 2026-07-08、確認 9/10)** | AI Safety Levels(ASL-2 / ASL-3)+ Capability Thresholds | https://www.anthropic.com/responsible-scaling-policy | 公式確認済み |
| OpenAI | Preparedness Framework | **2025-04-15 更新(確認 9/10)** | High / Critical capability(Tracked Categories) | https://openai.com/index/updating-our-preparedness-framework/ | 公式更新記事確認 |
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
| Anthropic RSP の版 | v3.4(2026-07-08、確認 9/10) | https://www.anthropic.com/responsible-scaling-policy |
| OpenAI Preparedness Framework の版 | 2025-04-15 更新記事を取得、8/18 に将来改定を予告(確認 9/10) | https://openai.com/index/updating-our-preparedness-framework/ |
| Google FSF の版 | v3.0(2025-09-22)/ v3.1 | https://deepmind.google/blog/strengthening-our-frontier-safety-framework/ |
| 米機関の名称・所在 | CAISI(2025-06 に US AISI から改称)@ NIST | https://www.nist.gov/caisi |
| 英機関の名称・所在 | AI Security Institute(2025-02 に改称)@ DSIT | https://www.aisi.gov.uk/ |
| 日本 AISI の公表ガイド版 | 評価観点 1.20 / ロボティクス版を確認(9/10)。レッドチーミング等の追補は未確認 | https://aisi.go.jp/ |
| 国際ネットワーク参加機関 | 12+ 機関(Seoul Summit 2024-05 合意) | 各機関公式サイト |
| 対象ラボの追加 | Meta・Microsoft・xAI 等は未取得 | 各社公式サイト |

---

## 未確認・要フォロー事項の一覧

- OpenAI が 2026-08-18 に予告した Preparedness 改定の次回公表と、各モデルの評価対象範囲
- 各国 AISI 系機関の**改称時期の一次ソース**(US=2025-06 / UK=2025-02 は二次情報。nist.gov / gov.uk のプレスで裏取り可能)
- 日本 AISI のレッドチーミング手法ガイド等、今回確認した 1.20 / ロボティクス以外の公表物の追補
- Meta / Microsoft / xAI 等**他ラボのフレームワーク**の版・URL(記事で列挙する場合)
- International Network of AI Safety Institutes の**恒久公式ポータル URL**(単独ポータルの有無)
