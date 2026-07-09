## 調査メモ: AI と地政学・輸出規制の一次情報所在(ST-R1)

このメモは記事「AI と地政学・輸出規制の入口マップ」(ai-geopolitics-map.md)の裏取り用です。方針として、規制の**内容の解釈・適法/違法の判断・見解の表明は一切しません**。目的は「読者が自分の状況を確認するために、どの一次情報源(公式)を見ればよいか」の**所在(URL)を特定し、その情報源が扱うテーマを中立に記述する**ことに限定します。URL は原則として WebSearch/WebFetch で実在を確認したもののみを掲載し、取得できなかったものは確度を下げて明記しています(推測での補完はしていません)。

確度の凡例:
- **公式確認済み**: WebFetch で本文まで取得し、内容の主題を確認できたもの
- **公式ページ存在(内容未読)**: 公式ドメインで URL の実在は確認したが、本文を取得できなかったもの(go.jp の 403、タイムアウト等)
- **未確認**: 実在を確認できなかったもの(掲載時は理由を明記)

調査主体による確認日: 2026-07-09

---

## 1. 輸出管理(半導体・AI モデル/重みの輸出規制)

### 日本 — 経済産業省 安全保障貿易管理(外為法・輸出貿易管理令)

- **確認先**: 経済産業省 貿易経済協力局 安全保障貿易管理
- **一次情報 URL**: https://www.meti.go.jp/policy/anpo/
- **扱う範囲(中立記述)**: 外国為替及び外国貿易法(外為法)に基づく貨物の輸出・技術の提供に関する管理制度の入口。制度概要、関係法令・改正情報、申請手続、Q&A 等へのリンク集。
- **確認日**: 2026-07-09
- **確度**: 公式ページ存在(内容未読)
- **備考**: go.jp は WebFetch が 403 を返すため本文未取得。URL は検索結果で実在確認。

- **確認先**: 経済産業省 安全保障貿易管理(関係法令・改正情報)
- **一次情報 URL**: https://www.meti.go.jp/policy/anpo/law00.html
- **扱う範囲(中立記述)**: 外為法・輸出貿易管理令(輸出令)・外国為替令等の関係法令と、その改正情報を一覧するページ。
- **確認日**: 2026-07-09
- **確度**: 公式ページ存在(内容未読)
- **備考**: 検索結果で URL 実在確認。本文は go.jp のため未取得。

- **確認先**: デジタル庁 e-Gov 法令検索(輸出貿易管理令)
- **一次情報 URL**: https://laws.e-gov.go.jp/law/324CO0000000378/
- **扱う範囲(中立記述)**: 政令「輸出貿易管理令」の条文本文(別表を含む)を掲載する政府の法令データベース。規制品目の一覧(別表第1)が参照される根拠条文の所在。
- **確認日**: 2026-07-09
- **確度**: 公式ページ存在(内容未読)
- **備考**: 検索結果で URL 実在確認。

### 米国 — BIS(Bureau of Industry and Security)/ EAR

- **確認先**: U.S. Department of Commerce, Bureau of Industry and Security (BIS)
- **一次情報 URL**: https://www.bis.gov/
- **扱う範囲(中立記述)**: 米国の Export Administration Regulations (EAR) を所管する当局の公式サイト。輸出許可、品目分類、Advanced Computing 関連の管理、Entity List、執行等の入口を提供。
- **確認日**: 2026-07-09
- **確度**: 公式確認済み
- **備考**: WebFetch で本文取得。EAR・先端計算(advanced computing)関連管理を扱う旨を確認。

- **確認先**: Federal Register(BIS 規則の官報公表先)
- **一次情報 URL**: https://www.federalregister.gov/agencies/industry-and-security-bureau
- **扱う範囲(中立記述)**: BIS が発する規則(final rule / interim final rule 等)が公表される連邦官報。先端半導体・AI モデルの重み等に関する個別規則の版と施行日は、ここで現物確認する。
- **確認日**: 2026-07-09
- **確度**: 公式ページ存在(内容未読)
- **備考**: 個別規則(例: 2026-01-15 付の先端コンピューティング関連規則 https://www.federalregister.gov/documents/2026/01/15/2026-00789/revision-to-license-review-policy-for-advanced-computing-commodities )は版・内容が変化するため、記事では特定規則を断定せず「官報で現物確認」に誘導するのが安全。

### EU — 欧州委員会(デュアルユース輸出管理)

- **確認先**: European Commission, DG Trade(Trade and Economic Security)
- **一次情報 URL**: https://policy.trade.ec.europa.eu/help-exporters-and-importers/exporting-dual-use-items_en
- **扱う範囲(中立記述)**: EU のデュアルユース(軍民両用)品目の輸出管理の入口。Regulation (EU) 2021/821 に基づく認可類型、管理品目リスト(Annex I)、多国間輸出管理体制との関係を扱う。
- **確認日**: 2026-07-09
- **確度**: 公式確認済み
- **備考**: WebFetch で本文取得。

---

## 2. データ主権・越境移転(データ所在地要求・越境データ移転規制)

### EU — GDPR(第三国移転・十分性認定)

- **確認先**: European Commission(Data protection / Adequacy decisions)
- **一次情報 URL**: https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en
- **扱う範囲(中立記述)**: GDPR に基づく第三国への個人データ移転と、欧州委員会による十分性認定(adequacy decision)の制度・対象国を扱うページ。
- **確認日**: 2026-07-09
- **確度**: 公式確認済み
- **備考**: WebFetch で本文取得。上位ページ https://commission.europa.eu/law/law-topic/data-protection_en もデータ保護全般の入口。

### 日本 — 個人情報保護委員会(PPC)

- **確認先**: 個人情報保護委員会(PPC)
- **一次情報 URL**: https://www.ppc.go.jp/
- **扱う範囲(中立記述)**: 個人情報保護法を所管する委員会の公式サイト。法令・ガイドライン、越境移転に関する資料、国際対応の入口。
- **確認日**: 2026-07-09
- **確度**: 公式ページ存在(内容未読)
- **備考**: go.jp のため本文未取得。URL は検索結果で実在確認。

- **確認先**: 個人情報保護委員会(外国にある第三者への提供編ガイドライン)
- **一次情報 URL**: https://www.ppc.go.jp/personalinfo/legal/guidelines_offshore/
- **扱う範囲(中立記述)**: 個人情報保護法第28条(外国にある第三者への個人データ提供)に関するガイドラインの掲載ページ。越境移転時の本人への情報提供等の取扱いを扱う。
- **確認日**: 2026-07-09
- **確度**: 公式ページ存在(内容未読)
- **備考**: go.jp のため本文未取得。URL は検索結果で実在確認。

### 中国 — CAC(国家互联网信息弁公室)/ PIPL

- **確認先**: Cyberspace Administration of China(国家互联网信息弁公室、CAC)
- **一次情報 URL**: http://www.cac.gov.cn/(トップドメイン)
- **扱う範囲(中立記述)**: 個人情報保護法(PIPL)・データ安全法・サイバーセキュリティ法を所管する当局。PIPL 第38条に基づく越境移転の各経路(安全評価・認証・標準契約)に関する規定・通知の発出元。
- **確認日**: 2026-07-09
- **確度**: 未確認
- **備考**: 英語版とされる http://www.cac.gov.cn/english/ は WebFetch で 404。トップドメインの本文も未取得(国外からのアクセス制限の可能性)。記事では「CAC が所管当局」という所在提示にとどめ、具体 URL は現物到達を確認できないため断定を避けるのが安全。個別規則の一次確認は困難な旨を注記推奨。

### インド — MeitY / DPDP

- **確認先**: Ministry of Electronics and Information Technology (MeitY), Government of India
- **一次情報 URL**: https://www.meity.gov.in/data-protection-framework
- **扱う範囲(中立記述)**: Digital Personal Data Protection Act, 2023(DPDP 法)および関連規則(DPDP Rules, 2025)を所管する省庁のデータ保護の入口。
- **確認日**: 2026-07-09
- **確度**: 公式ページ存在(内容未読)
- **備考**: WebFetch は 403。URL は検索結果で実在確認。規則の施行は段階的とされ版が動くため、記事では施行状況を断定しない。

---

## 3. 供給網の集中(特定国・特定社への依存に関する公的な注意喚起・報告書)

### 国際機関 — OECD

- **確認先**: OECD(経済協力開発機構)
- **一次情報 URL**: https://www.oecd.org/content/dam/oecd/en/publications/reports/2023/06/vulnerabilities-in-the-semiconductor-supply-chain_f4de7491/6bed616f-en.pdf
- **扱う範囲(中立記述)**: 報告書「Vulnerabilities in the Semiconductor Supply Chain」(2023)。半導体サプライチェーンの地理的集中・依存・脆弱性を分析。DOI: 10.1787/6bed616f-en。
- **確認日**: 2026-07-09
- **確度**: 公式確認済み
- **備考**: WebFetch で PDF 取得・書誌確認。2025 年の後続資料「Economic Security in a Changing World」内の半導体バリューチェーン章 https://www.oecd.org/en/publications/2025/09/economic-security-in-a-changing-world_78f3b129/full-report/special-focus-semiconductor-value-chains_dc772986.html も同テーマの入口。

### 米国 — GAO / CRS

- **確認先**: U.S. Government Accountability Office (GAO)
- **一次情報 URL**: https://www.gao.gov/assets/gao-26-107882.pdf
- **扱う範囲(中立記述)**: 米国半導体サプライチェーン強靱化に向けた資金投入プロジェクトに関する政府監査報告書。国内生産能力・依存の状況を扱う。
- **確認日**: 2026-07-09
- **確度**: 公式ページ存在(内容未読)
- **備考**: 検索結果で URL 実在確認。関連して議会調査局(CRS)の「U.S. Export Controls and China: Advanced Semiconductors」(R48642)、「Semiconductors and the CHIPS Act」(R47558)も公的分析の入口(congress.gov)。

### 日本 — 経済産業省

- **確認先**: 経済産業省 商務情報政策局(半導体・デジタル産業戦略検討会議)
- **一次情報 URL**: https://www.meti.go.jp/policy/mono_info_service/joho/conference/semicon_digital.html
- **扱う範囲(中立記述)**: 半導体・デジタル産業戦略に関する検討会議の資料・配布物の掲載ページ。国内生産能力・供給の安定確保に関する政策文書の所在。
- **確認日**: 2026-07-09
- **確度**: 公式ページ存在(内容未読)
- **備考**: go.jp のため本文未取得。URL は検索結果で実在確認。

- **確認先**: 経済産業省(経済安全保障 — 半導体に係る安定供給確保の取組方針)
- **一次情報 URL**: https://www.meti.go.jp/policy/economy/economic_security/semicon/torikumihousin_semicon.pdf
- **扱う範囲(中立記述)**: 経済安全保障推進法に基づく特定重要物資としての半導体の安定供給確保に関する取組方針(政府文書)。
- **確認日**: 2026-07-09
- **確度**: 公式ページ存在(内容未読)
- **備考**: 検索結果で URL 実在確認。改定が入るため版・改定日を都度確認。

---

## 4. 制裁・利用制限(制裁リスト・エンドユーザー規制を確認する公式ソース)

### 日本 — 経済産業省(外国ユーザーリスト)

- **確認先**: 経済産業省 安全保障貿易管理課(外国ユーザーリスト)
- **一次情報 URL**: https://www.meti.go.jp/policy/anpo/law_document/tutatu/t04shinsei/t04shinsei_ulkohyo.pdf
- **扱う範囲(中立記述)**: キャッチオール規制の運用のために公表される「外国ユーザーリスト」の公表文書。懸念が払拭されない外国・地域所在団体の情報を提供するもの。
- **確認日**: 2026-07-09
- **確度**: 公式ページ存在(内容未読)
- **備考**: go.jp のため本文未取得。改正告知は経産省プレスリリース(例: https://www.meti.go.jp/press/2025/09/20250929006/20250929006.html )で公表。掲載団体は改正で変動するため版を都度確認。

### 米国 — OFAC(制裁リスト)

- **確認先**: U.S. Department of the Treasury, Office of Foreign Assets Control (OFAC) — Sanctions List Search
- **一次情報 URL**: https://sanctionssearch.ofac.treas.gov/
- **扱う範囲(中立記述)**: OFAC が管理する SDN リスト(Specially Designated Nationals)および非 SDN の統合制裁リストを名称等で検索する公式ツール。
- **確認日**: 2026-07-09
- **確度**: 公式確認済み
- **備考**: WebFetch で本文取得。あわせて制裁プログラム別情報 https://ofac.treasury.gov/sanctions-programs-and-country-information とリスト配布 https://ofac.treasury.gov/sanctions-list-service も公式入口(いずれも WebFetch はタイムアウトしたが公式ドメインで実在確認、内容未読)。

### 米国 — BIS(Entity List / エンドユーザー規制)

- **確認先**: BIS — Entity List
- **一次情報 URL**: https://www.bis.gov/entity-list
- **扱う範囲(中立記述)**: EAR 上、取引に関与すると追加の許可要件を生じさせ得る外国のエンドユーザー等を掲載する Entity List の公式ページ。
- **確認日**: 2026-07-09
- **確度**: 公式確認済み(大容量のため全文は未取得)
- **備考**: WebFetch はコンテンツ容量超過で全文取得はできなかったが、当該 URL が実データを返すことを確認。

### 統合スクリーニング — 米国 CSL

- **確認先**: U.S. Department of Commerce, International Trade Administration — Consolidated Screening List (CSL)
- **一次情報 URL**: https://www.trade.gov/consolidated-screening-list
- **扱う範囲(中立記述)**: 商務省(BIS)・国務省・財務省(OFAC)の複数のスクリーニングリストを統合し、名称検索・ダウンロード・API を提供する入口。
- **確認日**: 2026-07-09
- **確度**: 公式確認済み
- **備考**: WebFetch で本文取得。ただし最終判断は各原典(官報等)で確認する旨がページ自体にも明記。

---

## 記事執筆時の注意

- **規則の版・対象品目リスト・掲載団体は変化が速い**。特定の規則番号・しきい値(性能基準等)・掲載団体数・対象国を本文に断定で書かない。書く場合は「○年○月時点」の絶対表現+「現物確認」への誘導にとどめ、`TODO(要確認)` を残す。
- **記事は「入口マップ+免責」方式**。各ソースが「何を扱うか」の所在提示に徹し、「〜は規制対象」「〜すべき」「適法/違法」といった解釈・判断は書かない。読者には自社の法務・専門家/所管当局への確認を促す免責を明記する。
- **一次情報の到達性に差がある**。go.jp・treasury.gov 系は自動取得で 403/タイムアウトが出ることがあり、CAC は国外から到達を確認できなかった。記事で URL を載せる際は「本調査時点でリンク先の実在は確認済み(ただし版・内容は各自現物確認)」の趣旨を添える。特に中国 CAC は具体 URL の恒常的到達を保証できないため、「所管当局は CAC」という所在提示にとどめるのが安全。
- **リンク切れ・改称に注意**。EU・BIS・OFAC はサイト改編で URL 変更が起こり得る。記事公開時に全リンクの生存を再確認し、`last_updated` とアクセス日を併記する。
- **二次情報(法律事務所の解説等)は本文の根拠にしない**。今回の調査でも解釈は法律事務所ブログ等に多く出てくるが、記事は一次情報(当局・官報・法令 DB)の所在提示に限定する。
