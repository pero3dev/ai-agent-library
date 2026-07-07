# 業界別規制・ガイドラインの一次情報 調査メモ

- **調査日**: 2026-07-07
- **調査目的**: `docs/09-business/industry-regulations-map.md`(業界別規制・ガイドラインマップ)の執筆材料。記事は規制の内容解説をせず「何を・どの一次情報で確認するか」のマップに徹する方針のため、本メモも**文書の存在・正式名称・発行主体・最新版・URL の確認**を中心とし、内容の説明は 1〜2 行に留める。日本国内が主、海外は参照レベル
- **根拠の方針**: 政府公式(go.jp / lg.jp)、公的機関(PMDA・FISC・日銀)、業界団体公式(全銀協・FDUA・HAIP・JaDHA)、米国公式(federalreserve.gov / fda.gov / nist.gov / federalregister.gov)のみを根拠とします。法律事務所・ベンダーブログの解説は裏取りの補助にのみ使用し、出典には挙げていません
- **確度表記**: 「公式確認済み」= 公式サイトを WebFetch で直接確認 / 「二次情報」= 検索スニペット等で公式ドメインの文書名・日付を確認(直接取得は未実施) / 「未確認」= 今回確認できず
- **横断規制との関係**: EU AI Act・日本の AI 推進法・個人情報保護法改正・AI 事業者ガイドライン・NIST AI RMF の詳細は [research/professional/compliance.md](../professional/compliance.md)(調査日 2026-07-07)で調査済み。本メモでは所在の再掲のみ行い、重複調査はしていない
- **取得上の注意**: fsa.go.jp・soumu.go.jp・mhlw.go.jp・digital.go.jp・pmda.go.jp・fisc.or.jp・zenginkyo.or.jp・federalreserve.gov は今回 WebFetch で直接取得できた。mext.go.jp は PDF のみでテキスト抽出不可、fda.gov はハブページ・ガイダンス検索ページとも 404(URL 移転の可能性)のため検索スニペットで裏取りした

---

## 1. 横断(AI 全般)— 所在確認のみ(詳細は compliance.md)

| 文書 | 発行主体 | 最新版 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- | --- |
| AI 事業者ガイドライン | 総務省・経済産業省 | **第 1.2 版(2026-03-31 公表)**。履歴: 1.0 版 2024-04-19 → 1.01 版 2024-11-22 → 1.1 版 2025-03-28 | https://www.soumu.go.jp/main_sosiki/kenkyu/ai_network/02ryutsu20_04000019.html / 本文 PDF https://www.meti.go.jp/shingikai/mono_info_service/ai_shakai_jisso/pdf/20260331_1.pdf | 2026-07-07 | 公式確認済み(compliance.md 調査時) |
| 人工知能関連技術の研究開発及び活用の推進に関する法律(AI 推進法)・適正性確保に関する指針・人工知能基本計画 | 内閣府(AI 戦略本部) | 法律: 令和 7 年法律第 53 号(全面施行 2025-09-01)/ 指針: 2025-12-19 本部決定 / 基本計画: 2025-12-23 閣議決定 | https://www8.cao.go.jp/cstp/ai/ai_act/ai_act.html / https://www8.cao.go.jp/cstp/ai/ai_guideline/ai_guideline.html | 2026-07-07 | 公式確認済み(compliance.md 調査時) |
| 生成 AI サービスの利用に関する注意喚起等 | 個人情報保護委員会(PPC) | 2023-06-02 公表(一般利用者向け・事業者向け・OpenAI 宛の 3 点構成) | https://www.ppc.go.jp/news/careful_information/230602_AI_utilize_alert/ | 2026-07-07 | 公式確認済み(compliance.md 調査時) |
| DeepSeek に関する情報提供 | 個人情報保護委員会(事務局) | 2025-02-03 公表(2025-03-05 更新)。個人情報が中国国内サーバーに保存され中国法が適用される点の注意 | https://www.ppc.go.jp/news/careful_information/250203_alert_deepseek/ / PPC 注意情報の一覧 https://www.ppc.go.jp/news/careful_information/ | 2026-07-07 | 二次情報 |
| 個人情報保護法改正案(課徴金制度等) | 個人情報保護委員会 | 2026-04-07 閣議決定・国会提出。**成立状況は 2026-07-07 時点で未確認** | https://www.ppc.go.jp/news/press/2026/260407/ | 2026-07-07 | 公式確認済み(compliance.md 調査時)/ 成立状況は未確認 |

**小括**: 横断系は compliance.md が正。記事のマップでは「横断 → 業界別」の 2 層で書き、横断の詳細は `docs/06-security/compliance-and-governance.md` への内部リンクで済ませられます。

---

## 2. 金融

### 2.1 金融庁

| 文書 | 発行主体 | 最新版 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- | --- |
| モデル・リスク管理に関する原則 | 金融庁 | **2021-11-12(令和 3 年 11 月 12 日)公表版が現行**。改訂版の存在は確認されず。AI・機械学習モデルにも適用され得る 8 原則(原則ベース) | プレス https://www.fsa.go.jp/news/r3/ginkou/20211112.html / 本文 PDF https://www.fsa.go.jp/common/law/ginkou/pdf_02.pdf | 2026-07-07 | 二次情報 |
| 金融機関のモデル・リスク管理の高度化に向けたプログレスレポート(2024) | 金融庁 | 2024-12-12 公表。上記原則の適用状況のモニタリング結果 | https://www.fsa.go.jp/news/r6/ginkou/20241212/20241212.html | 2026-07-07 | 二次情報 |
| AI ディスカッションペーパー(AI DP) | 金融庁 | **第 1.1 版(2026-03-03 公表)が最新**。第 1.0 版は 2025-03-04 公表。副題「金融分野における AI の健全な利活用の促進に向けた初期的な論点整理」。「金融庁 AI 官民フォーラム」(2025-06〜12 開催)の知見を反映した改訂で、規制文書ではなく論点整理 | 第 1.1 版 https://www.fsa.go.jp/news/r7/sonota/20260303/aidp.html / 本文 PDF https://www.fsa.go.jp/news/r7/sonota/20260303/aidp_version1.1.pdf / 第 1.0 版 https://www.fsa.go.jp/news/r6/sonota/20250304/aidp.html | 2026-07-07 | 公式確認済み(第 1.1 版ページを直接取得) |
| 金融庁 AI 官民フォーラム(資料) | 金融庁 | 第 1 回 2025-06-18 開催。AI DP 改訂の母体となった官民対話 | 資料例 https://www.fsa.go.jp/singi/ai_forum/siryou/20250618/01.pdf | 2026-07-07 | 二次情報 |

### 2.2 FISC・業界団体

| 文書 | 発行主体 | 最新版 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- | --- |
| 金融機関等コンピュータシステムの安全対策基準・解説書 | 公益財団法人 金融情報システムセンター(FISC) | **第 13 版(2025-03-21 公表)が現行**。第 13 版で **AI・生成 AI 関連の解説追加と新規基準項目の設置**を確認(ほかに経済安全保障推進法対応・オペレーショナルレジリエンス等)。本文は有償頒布 | https://www.fisc.or.jp/topics/006665.php / ガイドライン一覧 https://www.fisc.or.jp/publication/guideline_pdf.php | 2026-07-07 | 公式確認済み(公表ページを直接取得) |
| 金融機関による生成 AI の業務への利活用に関する暫定的考察 | FISC | 2023-12 公表。生成 AI の課題を情報セキュリティ面・倫理面に分類して考察 | 後続文書(次行)の PDF 内で言及。FISC サイト内の単独 URL は今回特定できず | 2026-07-07 | 二次情報(公表主体・時期のみ確認) |
| 金融機関による AI の業務への利活用に関する安全対策の観点からの考察 | FISC | 2024-09-24 公表。暫定的考察を発展させ AI 全般の課題と対応策を整理 | https://www.fisc.or.jp/document/public/file/ai_opinion_20240924.pdf | 2026-07-07 | 二次情報 |
| 「フロンティア AI」による脅威変化を踏まえたサイバーセキュリティ管理態勢について | 一般社団法人 全国銀行協会 | 2026-06-16 公表。高度 AI による脆弱性発見・攻撃コード生成の高速化を踏まえた会員銀行向け参考例(金融庁・日銀の要請を受けたもの)。**全銀協名義の「生成 AI 利活用指針」に当たる文書は今回確認できず** | https://www.zenginkyo.or.jp/news/2026/n061601/ | 2026-07-07 | 公式確認済み(ページを直接取得) |
| 金融生成 AI ガイドライン | 一般社団法人 金融データ活用推進協会(FDUA) | **第 1.1 版(2025-07-14 公表)が最新**。第 1.0 版は 2024-08 公開(2024-12 書籍化)。第 1.1 版で AI エージェントとガバナンスの項目を追加。業界自主ガイドライン | https://www.fdua.org/news/20250714-02 / 生成 AI WG https://www.fdua.org/activities/generativeai | 2026-07-07 | 二次情報 |
| 金融システムレポート別冊「金融機関における生成 AI の利用状況とリスク管理」 | 日本銀行 | 初出 2024-10-21、続編 2025-09-30。規制ではなく実態調査(利用状況・リスク管理のサーベイ) | https://www.boj.or.jp/research/brp/fsr/fsrb241021.htm / 2025 年版 PDF https://www.boj.or.jp/research/brp/fsr/data/fsrb250930.pdf | 2026-07-07 | 二次情報 |

**小括**: 金融は「金融庁(モデル・リスク管理原則 2021 + AI DP 1.1)/ FISC(安全対策基準第 13 版 = AI 増補あり)/ 業界自主(FDUA 1.1 版)」の 3 層で書けます。全銀協は生成 AI の包括指針ではなくサイバーセキュリティ観点の文書(2026-06)が最新である点に注意。

---

## 3. 医療

### 3.1 3 省 2 ガイドライン(医療情報の安全管理)

| 文書 | 発行主体 | 最新版 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- | --- |
| 医療情報システムの安全管理に関するガイドライン(医療機関等向け) | 厚生労働省 | **第 7.0 版(令和 8 年 = 2026 年 6 月公表)が現行**。第 6.0 版(2023-05)から改版。構成は概説編・経営管理編・企画管理編・システム運用編・保守委託機関編の 5 編。**AI・生成 AI 関連の記載有無は未確認**(概要資料 PDF の精読が必要) | https://www.mhlw.go.jp/stf/shingi/0000516275_00006.html | 2026-07-07 | 公式確認済み(ページを直接取得。改定内容の詳細は未確認) |
| 医療情報を取り扱う情報システム・サービスの提供事業者における安全管理ガイドライン(事業者向け) | 総務省・経済産業省 | **第 2.0 版(2025-03-28 公表)が現行**。第 1.1 版(令和 2 年 8 月策定・令和 5 年 7 月改定)から改版。サイバー攻撃の激化と医療機関・事業者間の連携強化に対応 | 総務省プレス https://www.soumu.go.jp/menu_news/s-news/01ryutsu06_02000427.html / 経産省ページ https://www.meti.go.jp/policy/mono_info_service/healthcare/teikyoujigyousyagl.html | 2026-07-07 | 公式確認済み(総務省プレスを直接取得) |

> 記事での要点: 「3 省 2 ガイドライン」は 2026-07 時点で**医療機関側 = 第 7.0 版(2026-06)/ 事業者側 = 第 2.0 版(2025-03)** の組み合わせが現行。両方 2025〜2026 年に改版されたばかりで、二次情報には旧版(6.0 版・1.1 版)ベースの解説が多く残るため要注意。

### 3.2 プログラム医療機器(SaMD)

| 文書 | 発行主体 | 最新版 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- | --- |
| プログラムの医療機器該当性に関するガイドライン | 厚生労働省 医薬・生活衛生局 | 令和 3 年(2021)3 月 31 日発出、**令和 5 年(2023)3 月 31 日一部改正が現行**。ソフトウェアが薬機法上の医療機器に該当するかの判断基準・事例集 | 本文 PDF https://www.pmda.go.jp/files/000240233.pdf / 厚労省「医療機器プログラムについて」 https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000179749_00004.html | 2026-07-07 | 公式確認済み(改正日を PMDA 窓口ページで確認。発出日は PDF 表題の検索スニペットによる) |
| SaMD 一元的相談窓口(医療機器プログラム総合相談) | PMDA | 常設窓口。(1) 医療機器該当性判断(厚労省 監視指導・麻薬対策課)、(2) 薬事開発相談(PMDA プログラム医療機器審査部)、(3) 医療保険相談(厚労省 医政局)の 3 区分を一元受付 | https://www.pmda.go.jp/review-services/f2f-pre/strategies/0011.html | 2026-07-07 | 公式確認済み(ページを直接取得) |
| プログラム医療機器の薬事開発・承認申請に関する手引き | PMDA プログラム医療機器審査部 | 最終更新 令和 7 年(2025)4 月 1 日 | https://www.pmda.go.jp/files/000274829.pdf / PMDA プログラム医療機器ページ https://www.pmda.go.jp/review-services/drug-reviews/about-reviews/devices/0048.html | 2026-07-07 | 二次情報 |

### 3.3 医療分野の AI・生成 AI 利用指針(2024〜2025 の新しいもの)

| 文書 | 発行主体 | 最新版 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- | --- |
| 医療デジタルデータの AI 研究開発等への利活用に係るガイドライン | 厚生労働省 | 令和 6 年(2024)9 月 30 日付で発出(公表日の表記は情報源により揺れあり)。医療機関保有データを AI 研究開発に使う際の法的根拠(仮名加工情報の作成手順等)を整理 | 本文 PDF https://www.mhlw.go.jp/content/001310044.pdf | 2026-07-07 | 二次情報(発出日は学会周知文書等で確認) |
| 医療・ヘルスケア分野における生成 AI 利用ガイドライン | 非営利法人 医療 AI プラットフォーム技術研究組合(HAIP) | **第 2 版(2025-07-11 発行)が最新**。第 1 版は 2024-10-02。医療機関・薬局等での生成 AI 利用者と開発者向けに法規リスクと対策を整理 | https://haip-cip.org/news/20250711/ / 本文 PDF https://haip-cip.org/assets/documents/nr_20241002_02.pdf | 2026-07-07 | 二次情報 |
| ヘルスケア事業者のための生成 AI 活用ガイド(正式名称: ヘルスケア領域において生成 AI を活用したサービスを提供する事業者が参照するための自主ガイドライン) | 日本デジタルヘルス・アライアンス(JaDHA) | **第 2.0 版(2025-02-07 公表)が最新**。第 1.0 版は 2024-01-18。対象は医療機器・SaMD を除くヘルスケア事業者。AI 事業者ガイドラインの事例としても引用実績あり | https://jadha.jp/news/news20250207.html / 本文 PDF https://jadha.jp/news/pdf/20250207/all2_0.pdf | 2026-07-07 | 二次情報 |

**小括**: 医療は「(1) 医療情報の安全管理(3 省 2 ガイドライン)、(2) SaMD(薬機法該当性 + PMDA 窓口)、(3) 生成 AI 利用指針(厚労省のデータ利活用 GL + HAIP / JaDHA の業界自主 GL)」の 3 象限で整理できます。厚労省本体の「医療現場での生成 AI 利用ガイドライン」に相当する単独文書は今回確認できず、業界団体(HAIP・JaDHA)の自主ガイドラインが実務上の参照先になっています。

---

## 4. 公共・行政

| 文書 | 発行主体 | 最新版 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- | --- |
| デジタル社会推進標準ガイドライン DS-920「行政の進化と革新のための生成 AI の調達・利活用に係るガイドライン」 | デジタル庁(デジタル社会推進会議幹事会決定) | **第 2.0 版(2026-06-12 決定)が最新**。第 1.0 版は 2025-05-27 策定。対象が政府機関の生成 AI システム(第 2.0 版で音声・画像へ拡大)。各府省庁の AI 統括責任者(CAIO)体制や調達チェックの枠組みを規定 | 英語版ニュース https://www.digital.go.jp/en/news/decb64eb-f26e-41cb-8d37-f3dd173108b8 / 第 2.0 版本文 PDF https://www.digital.go.jp/assets/contents/node/information/field_ref_resources/decb64eb-f26e-41cb-8d37-f3dd173108b8/59054b35/20260612_resources_standard_guidelines_guideline_01.pdf | 2026-07-07 | 公式確認済み(英語版ニュースページを直接取得。第 2.0 版の決定日・改定趣旨を確認) |
| DeepSeek 等の生成 AI の業務利用に関する注意喚起(事務連絡) | デジタル社会推進会議幹事会事務局 | 2025-02-06 発出。政府機関での特定サービス利用に関する注意喚起 | https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/d2a5bbd2-ae8f-450c-adaa-33979181d26a/e7bfeba7/20250206_councils_social-promotion-executive_outline_01.pdf | 2026-07-07 | 二次情報 |

**小括**: 行政向けは DS-920 が中核で、地方自治体には直接の義務はないものの事実上の参照基準になっています。第 2.0 版(2026-06-12)は公表から 1 か月未満と新しいため、二次解説の多くは第 1.0 版ベースである点に注意。

---

## 5. 教育

| 文書 | 発行主体 | 最新版 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- | --- |
| 初等中等教育段階における生成 AI の利活用に関するガイドライン | 文部科学省 初等中等教育局 | **Ver. 2.0(令和 6 年 = 2024 年 12 月 26 日公表)が現行**。Ver. 1.0(暫定版)は 2023-07 公表。より新しい版は今回確認されず。学校関係者(教職員・教育委員会)と児童生徒の利用場面別にチェック項目を提示 | 本文 PDF https://www.mext.go.jp/content/20241226-mxt_shuukyo02-000030823_001.pdf | 2026-07-07 | 二次情報(mext.go.jp の PDF 表題・日付を検索スニペットで確認。PDF 直接取得はテキスト抽出不可) |

---

## 6. 海外(参照レベル)

| 文書 | 発行主体 | 最新版 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- | --- |
| NIST AI Risk Management Framework(AI RMF 1.0)+ Generative AI Profile(NIST-AI-600-1) | 米国 NIST | AI RMF 1.0: 2023-01-26 / GenAI Profile: 2024-07-26。**AI RMF 1.0 は改訂作業中**(compliance.md 調査時に確認) | https://www.nist.gov/itl/ai-risk-management-framework | 2026-07-07 | 公式確認済み(compliance.md 調査時) |
| SR 11-7「Supervisory Guidance on Model Risk Management」→ **SR 26-2「Revised Guidance on Model Risk Management」に置換** | 米国 FRB(SR 11-7 は OCC と共同) | **SR 26-2(2026-04-17 発行)が SR 11-7(2011-04-04)を「supersedes and replaces」と明記**。15 年の監督経験を踏まえリスクベースアプローチを強調 | SR 26-2 https://www.federalreserve.gov/supervisionreg/srletters/SR2602.htm / 本文 PDF https://www.federalreserve.gov/supervisionreg/srletters/SR2602.pdf / 旧 SR 11-7 https://www.federalreserve.gov/supervisionreg/srletters/sr1107.htm | 2026-07-07 | 公式確認済み(SR 26-2 ページを直接取得)/ 旧 SR 11-7 の URL のみ二次情報 |
| FDA: Marketing Submission Recommendations for a Predetermined Change Control Plan for Artificial Intelligence-Enabled Device Software Functions(PCCP 最終ガイダンス) | 米国 FDA | **Final guidance(2024-12-03 公表)**。市販後のモデル更新を事前承認する PCCP の枠組み | https://www.fda.gov/regulatory-information/search-fda-guidance-documents/marketing-submission-recommendations-predetermined-change-control-plan-artificial-intelligence | 2026-07-07 | 二次情報(fda.gov の直接取得は 404 のため) |
| FDA: Artificial Intelligence-Enabled Device Software Functions: Lifecycle Management and Marketing Submission Recommendations(ドラフトガイダンス) | 米国 FDA | **Draft guidance(2025-01-06 公表、Federal Register 掲載 2025-01-07)**。TPLC(製品ライフサイクル全体)でのリスク管理と申請文書の推奨。**2026-07-07 時点で最終化されたかは未確認** | Federal Register https://www.federalregister.gov/documents/2025/01/07/2024-31543/artificial-intelligence-enabled-device-software-functions-lifecycle-management-and-marketing | 2026-07-07 | 二次情報 / 最終化状況は未確認 |
| FDA: AI-Enabled Medical Devices(ハブページ。認可済み AI 医療機器リストを含む) | 米国 FDA | 常設ページ。旧ハブ「Artificial Intelligence in Software as a Medical Device」の URL は取得時 404 で、移転の可能性 | https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-enabled-medical-devices | 2026-07-07 | 二次情報(URL の存在のみ確認) |

---

## 執筆時の注意(変わりやすい項目)

1. **2025〜2026 年に改版されたばかりの文書が多い**: 厚労省 GL 第 7.0 版(2026-06)、3 省 2 GL 事業者側第 2.0 版(2025-03)、DS-920 第 2.0 版(2026-06-12)、AI DP 第 1.1 版(2026-03-03)、FISC 第 13 版(2025-03-21)、SR 26-2(2026-04-17)。**Web 上の二次解説は旧版ベースが大半**のため、記事では「版数 + 公表年月 + 公式 URL」を必ずセットで書き、確認日を併記する
2. **SR 11-7 は 2026-04-17 に SR 26-2 へ置換済み**。「金融の AI ガバナンスの古典 = SR 11-7」という定番の記述をそのまま書くと 2026 年時点では不正確。「SR 11-7(2011)→ SR 26-2(2026)に改訂」と書く
3. **厚労省 GL 第 7.0 版の AI 関連記載の有無は未確認**。記事で「第 7.0 版で生成 AI に言及」などと書く場合は概要資料 PDF(mhlw.go.jp)の精読が必要 → `TODO(要確認)` 候補
4. **FDA のライフサイクル管理ドラフトガイダンス(2025-01)の最終化状況は未確認**。fda.gov の該当 URL が 404 だったため、執筆時に FDA guidance database で再確認 → `TODO(要確認)` 候補
5. **FISC 安全対策基準は有償頒布**のため本文の直接引用はできない。「第 13 版で AI・生成 AI の基準項目が新設された」という事実(公表ページで確認済み)の紹介に留める
6. **全銀協名義の包括的な生成 AI 指針は存在が確認できなかった**。「銀行業界の生成 AI 指針」として書けるのは FISC の考察 2 本(2023-12 / 2024-09)と FDUA ガイドライン(第 1.1 版)であり、発行主体を取り違えないこと
7. **個人情報保護法改正案(課徴金制度)の成立状況**は 2026-07-07 時点で未確認。医療・金融とも個人データの扱いが論点になるため、成立すれば全業界の記述に影響する → 執筆時に PPC サイトで要確認
