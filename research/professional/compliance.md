# AI 規制・ガバナンスの一次情報 調査メモ

- **調査日**: 2026-07-07
- **調査目的**: `docs/06-security/compliance-and-governance.md`(コンプライアンスとガバナンス)の執筆材料。「何が存在し、いつ適用され、どの一次情報を見るべきか」のレベルで、EU / 日本 / 米国の規制、国際規格、主要 LLM ベンダーのデータ取扱いポリシーを公式一次情報のみで整理する
- **根拠の方針**: EU 公式(eur-lex / digital-strategy.ec.europa.eu / consilium.europa.eu / europarl.europa.eu / ai-act-service-desk.ec.europa.eu)、日本の政府公式(内閣府 / e-Gov / 個人情報保護委員会 / 総務省 / 経産省)、米国公式(whitehouse.gov / 州議会公式)、nist.gov、各社公式ドキュメントのみを根拠とします。法律事務所・個人ブログの解説は使用していません
- **確度表記**: 「公式明記」= 公式ページ・公式資料に明文あり / 「公式から推測」= 公式記述からの合理的推測 / 「未確認」= 今回確認できず
- **取得上の注意**: eur-lex.europa.eu、iso.org、openai.com、meti.go.jp、consilium.europa.eu の一部ページは bot 遮断(403 / 動的レンダリング)により直接取得できませんでした。その場合は代替の公式ページで裏取りし、表の確度欄に注記しています。なお `artificialintelligenceact.eu` は EU 公式ポータルではないため使用していません(EU 公式の実装ポータルは後述の AI Act Service Desk)

---

## 1. EU AI Act

### 1.1 基本情報とリスク分類

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| AI Act の正本は Regulation (EU) 2024/1689。**2024-08-01 発効** | https://eur-lex.europa.eu/eli/reg/2024/1689/oj (正本。直接取得は不可)/ 発効日は https://ai-act-service-desk.ec.europa.eu/en で確認 | 2026-07-07 | 公式明記 |
| リスクベースの 4 分類: **(1) 許容できないリスク(禁止)**= 8 つの禁止プラクティス(有害な操作、ソーシャルスコアリング、法執行目的のリアルタイム遠隔生体識別等)、**(2) 高リスク**(雇用・教育・重要サービス等。リスク評価、データ品質、ログ、人間による監視等の義務)、**(3) 透明性リスク**(AI と対話していることの開示、生成コンテンツの識別可能化、ディープフェイクのラベリング)、**(4) 最小リスク**(義務なし。大半の AI がここ) | https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai | 2026-07-07 | 公式明記 |
| これに加えて **GPAI(汎用 AI)モデル提供者の義務**が横断的に存在する(1.4 参照) | 同上 | 2026-07-07 | 公式明記 |

### 1.2 適用タイムライン(2026-07 時点、omnibus 改正反映後)

| 適用開始日 | 対象 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| 2024-08-01 | 発効 | https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai | 2026-07-07 | 公式明記 |
| 2025-02-02 | 禁止プラクティス(適用済み) | 同上 | 2026-07-07 | 公式明記 |
| 2025-08-02 | ガバナンス規定・GPAI モデル義務(適用済み) | 同上 | 2026-07-07 | 公式明記 |
| 2026-08-02 | 全般適用(透明性義務 = 生成コンテンツの開示等を含む) | 同上 | 2026-07-07 | 公式明記 |
| **2027-12-02**(旧: 2026-08-02) | **高リスクシステム(Annex III の単体システム: 雇用・教育・生体認証・インフラ・移民等)の義務** — omnibus で 16 か月延期 | https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai / https://www.consilium.europa.eu/en/press/press-releases/2026/06/29/artificial-intelligence-council-gives-final-green-light-to-simplify-and-streamline-rules/ | 2026-07-07 | 公式明記 |
| **2028-08-02**(旧: 2027-08-02) | **高リスクシステム(Annex I の規制対象製品に組み込まれるもの)の義務** | 同上(旧日付は規則 Art. 113 由来。条文の直接取得は不可) | 2026-07-07 | 公式明記(旧日付のみ公式から推測) |

### 1.3 Digital Omnibus(AI)の確定状況 — 提案ではなく成立済み

2025 年に報じられた「高リスク義務の延期・簡素化」は、2026-07 時点では**提案段階ではなく立法プロセスを完了(採択済み)**です。ただし官報(OJ)公布は調査日時点で未確認です。

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 欧州委員会が「Digital Omnibus on AI」規則案を提案(2025 年 11 月) | https://digital-strategy.ec.europa.eu/en/library/digital-omnibus-ai-regulation-proposal | 2026-07-07 | 公式から推測(公式ページの存在は確認、提案日の本文確認は未実施) |
| 理事会・欧州議会・欧州委員会が**暫定合意(2026-05-07)** | https://www.consilium.europa.eu/en/press/press-releases/2026/05/07/artificial-intelligence-council-and-parliament-agree-to-simplify-and-streamline-rules/ | 2026-07-07 | 公式明記(consilium は直接取得 403。公式ページの検索経由で内容確認) |
| 欧州議会本会議が可決(**2026-06-16**、賛成 423 / 反対 57 / 棄権 174) | https://www.europarl.europa.eu/legislative-train/package-digital-package/file-digital-omnibus-on-ai | 2026-07-07 | 公式明記 |
| 理事会が最終承認(**2026-06-29**)。「Omnibus VII」簡素化パッケージの一部 | https://www.consilium.europa.eu/en/press/press-releases/2026/06/29/artificial-intelligence-council-gives-final-green-light-to-simplify-and-streamline-rules/ | 2026-07-07 | 公式明記(同上の注記) |
| 官報公布の 3 日後に発効。**2026-07-07 時点で OJ 公布・規則番号は未確認** | 同上 | 2026-07-07 | 公式明記(発効規定)/ 公布は未確認 |
| 主な内容: 高リスク義務の延期(1.2 の表)、**国内 AI サンドボックス設置期限を 2027-08-02 に延期**、**Art. 50(2)(生成コンテンツのマーキング)の実装猶予を短縮し新期限 2026-12-02**、**Art. 5 に新禁止(非同意の性的・親密画像の生成、CSAM 生成)を追加** | 同上 | 2026-07-07 | 公式明記 |

### 1.4 provider(提供者)/ deployer(導入者)/ GPAI の義務構造

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| AI Act は条文構造上 **provider と deployer の義務を明確に区別**する。Chapter III Section 3 は「Obligations of Providers and Deployers」で、Art. 26 が「高リスク AI システムの deployer の義務」 | https://ai-act-service-desk.ec.europa.eu/en/ai-act-explorer | 2026-07-07 | 公式明記(条文構造) |
| 定義の要旨(Art. 3): provider = AI システム/GPAI モデルを開発し自らの名称・商標で市場投入する者。deployer = 自らの権限の下で AI システムを業務利用する者。**LLM API を使ってアプリを提供する企業は文脈により provider にも deployer にもなり得る** | https://eur-lex.europa.eu/eli/reg/2024/1689/oj(条文の直接取得は不可) | 2026-07-07 | 公式から推測 |
| 高リスク義務の大半(リスク管理、データガバナンス、技術文書、適合性評価等)は provider 側。deployer には指示に従った利用、人間による監視、入力データの管理、ログ保存等の利用側義務(Art. 26) | 同上 | 2026-07-07 | 公式から推測(条文タイトルは公式明記) |
| **GPAI モデル提供者の義務**は Art. 53(透明性、著作権ポリシー、学習データの要約公表)と Art. 55(システミックリスクを持つモデルの追加義務)。**2025-08-02 から適用中** | https://digital-strategy.ec.europa.eu/en/policies/ai-code-practice | 2026-07-07 | 公式明記 |
| **GPAI Code of Practice**(任意の遵守ツール): 最終版を 2025-07-10 に欧州委員会が受領、2025-08-01 に adequacy decision で正式承認。透明性・著作権・安全とセキュリティの章で構成 | 同上 | 2026-07-07 | 公式明記 |
| **EU 公式の実装ポータルは「AI Act Service Desk」**(欧州委員会 DG CONNECT が EU AI Office と連携して運営)。AI Act Explorer(条文ブラウザ)、Compliance Checker、タイムライン、高リスクガイドラインを提供 | https://ai-act-service-desk.ec.europa.eu/en | 2026-07-07 | 公式明記 |

**小括**: 記事で EU を紹介する際は「禁止・GPAI 義務は適用済み / 透明性義務は 2026-08-02 から / 高リスク義務は omnibus で 2027-12-02・2028-08-02 に延期済み(成立済み・公布待ち)」という 3 層の時間軸で書くのが 2026-07 時点で正確です。

---

## 2. 日本

### 2.1 AI 推進法(2025 年成立)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 正式名称は**「人工知能関連技術の研究開発及び活用の推進に関する法律」**(通称: AI 法、AI 推進法)。令和 7 年法律第 53 号 | https://www8.cao.go.jp/cstp/ai/ai_act/ai_act.html / https://laws.e-gov.go.jp/law/507AC0000000053 | 2026-07-07 | 公式明記(法律番号は e-Gov 法令 ID からの推測。ページ本文は動的レンダリングのため未取得) |
| **成立 2025-05-28、公布・一部施行 2025-06-04、全面施行 2025-09-01** | https://www8.cao.go.jp/cstp/ai/ai_hou_gaiyou.pdf(概要資料) | 2026-07-07 | 公式明記 |
| 性格は**推進法(基本法型)であり規制法ではない**。目的は国民生活の向上・国民経済の発展。「イノベーションを促進しつつ、リスクに対応する」枠組み | 同上 | 2026-07-07 | 公式明記 |
| 事業者への義務は**「国等の施策に協力しなければならない」という責務規定**のみ。国の手段は情報収集・事案分析・調査と**指導・助言・情報提供**(概要資料に罰則の記載はなく、罰則規定は置かれていないと解される) | 同上 | 2026-07-07 | 公式明記(責務・手段)/ 罰則不存在は公式から推測 |
| **AI 戦略本部**(本部長: 内閣総理大臣、構成員: 全国務大臣)を設置。**人工知能基本計画**の策定を規定 | 同上 | 2026-07-07 | 公式明記 |
| 人工知能基本計画「〜『信頼できるAI』による『日本再起』〜」が **2025-12-23 に閣議決定** | https://www8.cao.go.jp/cstp/ai/ai_plan/aiplan_20251223.pdf | 2026-07-07 | 公式明記(表題・決定日を確認。本文は未精読) |
| 「人工知能関連技術の研究開発及び活用の**適正性確保に関する指針**」が **2025-12-19 に AI 戦略本部決定**(パブコメは 2025-12-05〜12-11)。AI 法(第 13 条)に基づき関係者の自主的・主体的取組を促す性格 | https://www8.cao.go.jp/cstp/ai/ai_guideline/ai_guideline.html / 本文 https://www8.cao.go.jp/cstp/ai/ai_guideline/ai_gl_2025.pdf | 2026-07-07 | 公式明記(決定日・決定主体)/ 根拠条文は公式から推測 |

### 2.2 個人情報保護法と生成 AI

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 個人情報保護委員会(PPC)は **2023-06-02 に「生成AIサービスの利用に関する注意喚起等」**を公表。OpenAI 宛の注意喚起と、一般利用者・事業者向け注意喚起の 2 本立て | https://www.ppc.go.jp/news/careful_information/230602_AI_utilize_alert/ | 2026-07-07 | 公式明記 |
| 事業者向け要点: **個人データを含むプロンプトを入力し、それが応答生成以外の目的(モデル学習等)に利用される場合、本人同意なしでは個人情報保護法違反となるおそれ**。OpenAI 宛では要配慮個人情報の同意なし取得への対応を要請 | 同上(別添 PDF: https://www.ppc.go.jp/files/pdf/230602_alert_generative_AI_service.pdf ) | 2026-07-07 | 公式明記(要旨は公表 PDF で確認) |
| いわゆる 3 年ごと見直しの「**制度改正方針**」を 2026-01-09 に公表 | https://www.ppc.go.jp/files/pdf/01-1_seidokaiseihousin.pdf | 2026-07-07 | 公式明記(表題確認) |
| **「個人情報の保護に関する法律等の一部を改正する法律案」が 2026-04-07 に閣議決定され国会(第 221 回)に提出**。主な内容: 課徴金制度の新設(違法な取扱いで財産上の利益を得た場合)、生体情報の利用停止等請求の拡充、統計作成目的の第三者提供の同意不要化等。**成立状況は 2026-07-07 時点で未確認(審議中)** | https://www.ppc.go.jp/news/press/2026/260407/ | 2026-07-07 | 公式明記(法案内容)/ 成立状況は未確認 |

### 2.3 AI 事業者ガイドライン(経産省・総務省)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 最新版は**第 1.2 版(2026-03-31 公表)**。履歴: 第 1.0 版 2024-04-19 → 第 1.01 版 2024-11-22 → 第 1.1 版 2025-03-28 | https://www.soumu.go.jp/main_sosiki/kenkyu/ai_network/02ryutsu20_04000019.html | 2026-07-07 | 公式明記 |
| **法的拘束力を持たないソフトロー**。対象は「AI 開発者・AI 提供者・AI 利用者」の 3 主体 | 同上 | 2026-07-07 | 公式明記 |
| 第 1.2 版本文 PDF(総務省・経済産業省連名) | https://www.meti.go.jp/shingikai/mono_info_service/ai_shakai_jisso/pdf/20260331_1.pdf | 2026-07-07 | 公式明記(表題確認。meti.go.jp の HTML ページは 403 のため本文詳細は未精読) |
| 第 1.2 版の改訂内容として二次情報では「AI エージェント・フィジカル AI への対応」が言及されるが、**公式本文での確認は未実施** | — | 2026-07-07 | 未確認(執筆時に上記 PDF で要確認) |

---

## 3. 米国

### 3.1 連邦レベル

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **包括的な連邦 AI 規制法は 2026-07 時点で存在しない**。大統領令 + 既存法(FTC 法等)の執行 + 州法のパッチワークが実態 | —(単一の公式ページなし。以下の EO 群と州法の存在から) | 2026-07-07 | 公式から推測 |
| **EO 14179「Removing Barriers to American Leadership in Artificial Intelligence」(2025-01-23)**: バイデン政権の EO 14110(2023-10-30、安全・セキュリティ重視)を撤回し、180 日以内の AI Action Plan 策定を指示 | https://www.whitehouse.gov/presidential-actions/2025/01/removing-barriers-to-american-leadership-in-artificial-intelligence/ | 2026-07-07 | 公式明記 |
| **America's AI Action Plan(2025 年 7 月)**が whitehouse.gov に公表されている(政策文書であり法令ではない) | https://www.whitehouse.gov/wp-content/uploads/2025/07/Americas-AI-Action-Plan.pdf | 2026-07-07 | 公式明記(PDF の存在・所在を確認。本文のテキスト抽出は不可のため内容詳細は未確認) |
| **EO 14365「Ensuring a National Policy Framework for Artificial Intelligence」(2025-12-11)**: 州 AI 法への対抗を明示。(1) 司法長官による AI Litigation Task Force 設置(30 日以内)、(2) 商務省による BEAD 補助金の条件付け(「過重な AI 法」を持つ州を不適格化)、(3) FTC への政策声明指示(90 日以内)、(4) 州法をプリエンプトする連邦立法の提言作成。子供の安全・インフラ・州政府調達等はカーブアウト | https://www.whitehouse.gov/presidential-actions/2025/12/eliminating-state-law-obstruction-of-national-artificial-intelligence-policy/ | 2026-07-07 | 公式明記 |

### 3.2 州法の代表例 (1): Colorado AI Act — 2 度の延期と縮小改正

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **SB 24-205(Colorado AI Act、2024-05-17 署名)**: 高リスク AI の developer / deployer に「算法差別(algorithmic discrimination)」防止の合理的注意義務、リスク管理プログラム、影響評価、消費者通知等を課す。当初の適用開始は **2026-02-01** | https://leg.colorado.gov/bills/sb24-205 | 2026-07-07 | 公式明記 |
| **SB 25B-004(特別会期、2025-08-28 署名)**: 適用開始を **2026-06-30 に延期** | https://leg.colorado.gov/bills/sb25b-004 | 2026-07-07 | 公式明記 |
| **SB 26-189(2026-05-14 署名)**: SB 24-205 の規定を**廃止・再制定**し、ADMT(automated decision-making technology)法へ再構成。リスク管理プログラム義務・年次影響評価義務を廃止し、消費者通知・不利益決定の説明(30 日以内)・人による再審査・記録保存(3 年)等の透明性中心の義務へ縮小。法律自体は 2026-08-12 発効、**実体的義務(developer の技術文書等)は 2027-01-01 から** | https://leg.colorado.gov/bills/sb26-189 | 2026-07-07 | 公式明記 |
| 結論: **2026-07-07 時点で Colorado の AI 法の実体的義務はまだ適用されていない**(2027-01-01 から) | 同上 | 2026-07-07 | 公式明記 |

### 3.3 州法の代表例 (2): California — 複数の法律が段階施行

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **SB 53「Transparency in Frontier Artificial Intelligence Act(TFAIA)」(2025-09-29 成立)**: 大規模フロンティア開発者に frontier AI framework(破滅的リスク管理方針)の公表、デプロイ前の透明性レポート、重大安全インシデントの州緊急サービス局への報告(15 日以内、切迫時 24 時間)、内部通報者保護を義務付け。罰金は違反あたり最大 100 万ドル。2026-01-01 から適用 | https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260SB53 | 2026-07-07 | 公式明記(成立日・義務内容)/ 適用開始日は公式から推測(カリフォルニア州法の通常発効ルール) |
| **AB 2013(生成 AI 学習データの透明性、2024-09-28 成立)**: 生成 AI 開発者に学習データセットの概要(出所、データポイント数、著作権・個人情報の含有等)の Web 公表を義務付け。**2026-01-01 から適用(施行済み)** | https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB2013 | 2026-07-07 | 公式明記 |
| **SB 942「California AI Transparency Act」(2024-09-19 成立)**: 大規模生成 AI プロバイダに無償の AI 検出ツール、manifest / latent disclosure(可視表示と埋め込みメタデータ)を義務付け。当初 2026-01-01 施行 | https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB942 | 2026-07-07 | 公式明記 |
| **AB 853(2025-10-13 成立)が SB 942 を改正し、施行を 2026-08-02 に延期**。大規模オンラインプラットフォームは 2027-01-01、キャプチャデバイスメーカーは 2028-01-01 の段階適用。**つまり SB 942 系の義務は 2026-07-07 時点で未施行(2026-08-02 施行予定)** | https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260AB853 | 2026-07-07 | 公式明記 |

**小括**: 「州ごとのパッチワーク」は Colorado(延期と縮小を繰り返し 2027 年適用へ)と California(複数の法律が 2026 年から段階施行)の対比で裏取りできます。さらに連邦 EO 14365 が州法への訴訟・補助金条件付けを指示しており、**州法の適用見通し自体が流動的**である点が 2026-07 時点の最重要ポイントです。

---

## 4. 国際規格・フレームワーク

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **NIST AI Risk Management Framework(AI RMF 1.0)**: 2023-01-26 公表。**任意(voluntary)**のリスク管理フレームワーク。信頼できる AI のための設計・開発・利用・評価の指針 | https://www.nist.gov/itl/ai-risk-management-framework | 2026-07-07 | 公式明記 |
| **Generative AI Profile(NIST-AI-600-1)**: 2024-07-26 公表。生成 AI 固有のリスクと対応アクションを整理した AI RMF のプロファイル | 同上 | 2026-07-07 | 公式明記 |
| NIST は **AI RMF 1.0 の改訂作業中**(2026 年時点)。2026-04-07 には重要インフラ向け AI RMF プロファイルのコンセプトノートを公表 | 同上 | 2026-07-07 | 公式明記 |
| **ISO/IEC 42001:2023(AI マネジメントシステム = AIMS の要求事項)**: 2023-12-18 発行。AI システムを開発・提供・利用する組織が対象で、リスクベースアプローチによるマネジメントシステム構築の要求事項を規定 | https://www.meti.go.jp/press/2023/01/20240115001/20240115001.html(経産省プレス。meti.go.jp は直接取得 403 のため検索経由で内容確認)/ 規格販売ページ https://www.iso.org/standard/81230.html(iso.org は 403 で未確認) | 2026-07-07 | 公式明記(発行日・スコープは経産省プレスで確認) |
| ISO/IEC 42001 は ISMS(ISO/IEC 27001)と同型の**第三者認証の対象となるマネジメントシステム規格**という位置づけ | 同上 | 2026-07-07 | 公式から推測 |

---

## 5. 主要 LLM ベンダーのデータ取扱い(学習利用の既定・保持 / ZDR・DPA)

> 各社の詳細は `research/coding-agents/data-handling-index.md` および `research/models/` にもあり。ここでは「API 入力の学習利用の既定」と「ZDR / 保持」「DPA」の公式所在のみ確認。

### 5.1 Anthropic

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **商用(API・Claude for Work 等)の入力・出力は既定でモデル学習に使わない**。Development Partner Program 等への明示的オプトイン時のみ利用 | https://privacy.claude.com/en/articles/7996885-how-do-you-use-personal-data-in-model-training | 2026-07-07 | 公式明記 |
| 消費者向け(Claude Free/Pro/Max)は**設定ベース**(ユーザーが許可した場合に学習利用。シークレットチャットは対象外)。商用条項の製品には適用されない | https://privacy.claude.com/en/articles/10023580-i-want-to-opt-out-of-my-prompts-and-results-being-used-for-training-models | 2026-07-07 | 公式明記 |
| **ZDR(zero data retention)は審査制**(組織単位で営業経由の承認)。対象は適格な API、Commercial API キー経由の製品(API 経由の Claude Code を含む)、Claude Code for Enterprise。ZDR 下でも安全分類器の結果は保持される | https://privacy.claude.com/en/articles/8956058-i-have-a-zero-retention-agreement-with-anthropic-what-products-does-it-apply-to | 2026-07-07 | 公式明記 |
| **DPA を公式提供**(2025-02-24 版): 顧客 = controller / Anthropic = processor、EU SCCs・UK/Swiss アデンダム、48 時間以内の侵害通知等 | https://www.anthropic.com/legal/data-processing-addendum | 2026-07-07 | 公式明記 |

### 5.2 OpenAI

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **API に送信されたデータは既定でモデル学習に使わない**(2023-03-01 以降。明示的オプトイン制) | https://developers.openai.com/api/docs/guides/your-data | 2026-07-07 | 公式明記 |
| 既定の保持: **不正利用監視ログとして最大 30 日保持**。**ZDR は事前承認制**(適格顧客のみ)で、対象エンドポイント限定(`/v1/chat/completions`、`/v1/responses`、`/v1/embeddings` 等。Assistants API などは対象外) | 同上 | 2026-07-07 | 公式明記 |
| **DPA を公式提供**(ChatGPT Business / Enterprise / API が対象。API 顧客データの保持は最大 30 日と記載) | https://openai.com/policies/data-processing-addendum/ | 2026-07-07 | 公式明記(openai.com は直接取得 403。公式ページの検索経由で内容確認) |
| 企業向けプライバシーの総覧ページ | https://openai.com/enterprise-privacy/ | 2026-07-07 | 未確認(403。参照先としてのみ記載) |

### 5.3 Google

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **Gemini API の無償枠(unpaid services)は、提出コンテンツと応答を「製品・サービスと機械学習技術の提供・改善・開発」に利用する**(人間のレビューあり)。機密情報を送信しないよう明記 | https://ai.google.dev/gemini-api/terms | 2026-07-07 | 公式明記 |
| **Gemini API の有償(paid services)では、プロンプト・応答を製品改善に使わない**。ログは不正利用検出・法令遵守のための一時的なもの | 同上 | 2026-07-07 | 公式明記 |
| Vertex AI(Google Cloud)のデータガバナンス文書(顧客データを許可なく学習利用しない旨で知られる)は、ページの動的レンダリングにより本文を確認できず | https://docs.cloud.google.com/vertex-ai/generative-ai/docs/data-governance | 2026-07-07 | 未確認(URL の存在のみ確認) |
| Google Cloud の DPA(Cloud Data Processing Addendum) | https://cloud.google.com/terms/data-processing-addendum | 2026-07-07 | 未確認(今回未取得。参照先としてのみ記載) |

**小括**: 3 社とも「**API / 商用経由の入力は既定で学習に使わない**」ことを公式に明記しています。ただし Google は**有償・無償で既定が反転**する(無償枠は学習利用あり)点が実務上の落とし穴です。ZDR は Anthropic・OpenAI とも「既定ではなく審査・承認制」であることも、ベンダー契約の論点として正確に書く必要があります。

---

## 執筆時の注意(変わりやすい項目)

1. **EU omnibus の官報公布**: 2026-06-29 に理事会採択済みだが、2026-07-07 時点で OJ 公布・改正規則番号は未確認。記事執筆時に公布状況と規則番号を確認すること(公布 3 日後に発効)。→ `TODO(要確認)` 候補
2. **2026-08-02 の透明性義務(Art. 50)適用開始**: 記事の公開時期によって「適用直前」か「適用済み」かの記述が変わる。生成コンテンツのマーキング(Art. 50(2))の実装猶予は 2026-12-02 まで
3. **日本の個人情報保護法改正案**: 2026-04-07 閣議決定・国会提出済みで、成立すれば課徴金制度が導入される大きな変化。成立・施行時期は執筆時に PPC サイトで要確認
4. **米国は二重に流動的**: (a) EO 14365 に基づく州法への訴訟・FTC 政策声明・連邦プリエンプション立法の帰趨、(b) Colorado は 2027-01-01 適用開始(再延期の可能性)、California SB 942 系は 2026-08-02 施行予定。州法の記述は「執筆時点のスナップショット」であることを記事中で明示するべき
5. **NIST AI RMF は改訂作業中**: 「AI RMF 1.0」とバージョンを明記し、改訂版(2.0 等)の公表を執筆時に確認すること
6. **ベンダーポリシーの URL・内容は頻繁に変わる**: 今回も support.anthropic.com → privacy.claude.com、platform.openai.com → developers.openai.com への移転を確認。記事にはポリシーの内容を書き写しすぎず「既定 + 公式 URL」の紹介に留め、確認日を併記するのが安全
7. **AI 事業者ガイドライン第 1.2 版の改訂詳細**(AI エージェント・フィジカル AI の扱い)は公式 PDF での一次確認が未了。引用する場合は本文 PDF を精読すること
