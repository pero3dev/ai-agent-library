## 調査メモ: AI と地政学・輸出規制の一次情報所在(ST-R1)

このメモは記事「AI と地政学・輸出規制の入口マップ」(ai-geopolitics-map.md)の裏取り用です。方針として、規制の**内容の解釈・適法/違法の判断・見解の表明は一切しません**。目的は「読者が自分の状況を確認するために、どの一次情報源(公式)を見ればよいか」の**所在(URL)を特定し、その情報源が扱うテーマを中立に記述する**ことに限定します。URL は原則として WebSearch/WebFetch で実在を確認したもののみを掲載し、取得できなかったものは確度を下げて明記しています(推測での補完はしていません)。

確度の凡例:
- **公式確認済み**: WebFetch で本文まで取得し、内容の主題を確認できたもの
- **公式ページ存在(内容未読)**: 公式ドメインで URL の実在は確認したが、本文を取得できなかったもの(go.jp の 403、タイムアウト等)
- **未確認**: 実在を確認できなかったもの(掲載時は理由を明記)

初回確認日: 2026-07-09。EG-01〜EG-05・EG-12 の更新確認: 2026-09-10。未更新の項目は各確認日が基準です。

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

- **公式入口**: https://www.bis.gov/news-updates / https://www.federalregister.gov/agencies/industry-and-security-bureau
- **2026-07-10 発表 (EG-01)**: UAE を D:3 / D:4 から除外し A:5 へ変更し、政府・承認済み企業への一定の先端計算品目の license-free eligibility を説明しています。国名だけで一律免許不要とは判断しません。発表対応の https://www.federalregister.gov/d/2026-14132 は本文取得できず、正確な法令発効日は未確認です。
- **2026-05-31 ガイダンス (EG-02)**: D:5 / Macau に本社または最終親会社の本社を持つ entity に対する先端計算品目の既存許可要件は、第三国所在でも継続する場合があります。AI Diffusion の非執行方針から要件消滅を推論しません。対象 ECCN・用途・例外・取引条件を照合します。https://media.bis.gov/media/documents/bis-guidance-may-31-2026.pdf
- **確認日 / 確度**: 2026-09-10 / BIS 発表と 1 頁の公式 PDF を確認。全クラウドサービスに自動適用するとの一般化はしません。

### EU — 欧州委員会(デュアルユース輸出管理)

- **公式入口**: https://policy.trade.ec.europa.eu/help-exporters-and-importers/exporting-dual-use-items_en
- **更新 (EG-03)**: 公式入口は Annex I の改正として委任規則 (EU) 2025/2003 を掲載。採択 2025-09-08、OJ 公布 2025-11-14、翌日 2025-11-15 発効です。https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=OJ:L_202502003
- **確認日 / 確度**: 2026-09-10 / 公式入口と 251 頁 PDF の冒頭・発効規定を確認。全品目の適用照合は未実施です。同ページの September 2024 Excel を現行法令の代替にしません。2026 年の後続更新が一切ないという網羅性の主張ではありません。

## 2. データ主権・越境移転(データ所在地要求・越境データ移転規制)

### EU — GDPR(第三国移転・十分性認定)

- **公式入口**: https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en
- **監視例 (EG-12)**: Brazil は 2026-01-26 の十分性認定決定、Korea は 2026-07-23 の既存認定の first review です。新規決定と再審査を区別します。Brazil 法令: https://eur-lex.europa.eu/legal-content/en/TXT/?uri=CELEX:32026D0179
- **確認日 / 確度**: 2026-09-10 / EC 一覧を確認。個々のデータ移転が無条件で許されることを意味しません。

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

- **公式入口**: https://www.cac.gov.cn/ / 越境データ専用索引 https://www.cac.gov.cn/wxzw/sjzl/sjcjaqpg/A09370801index_1.htm
- **更新 (EG-05)**: 2026-09-10 にトップ・専用索引を取得。索引は 2025-06-27 の「数据出境安全评估申报指南（第三版）」、標準契約・認証資料を掲載します。2026-08-12 の個人情報保護政策法規 FAQ ページも取得しました。https://www.cac.gov.cn/2026-08/12/c_1788195297373459.htm
- **確度 / 限界**: 公式入口・掲載文書・FAQ の到達確認。FAQ 全文の法的解釈や全規則の横断比較は未実施です。旧一律アクセス不能メモを解消し、個別条項への適用確認を残します。

### インド — MeitY / DPDP

- **最終官報 (EG-04)**: G.S.R. 846(E)、通知文書日 2025-11-13。https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf
- **段階施行**: 英語本文 p24 Rule 1(2) は Rules 1・2・17〜21 を公布時、1(3) は Rule 4 を公布 1 年後、1(4) は Rules 3・5〜16・22・23 を公布 18 か月後としています。
- **通知日の表記**: PIB の 2025-11-17 解説は通知日 2025-11-14 と説明します。https://www.pib.gov.in/PressNoteDetails.aspx?ModuleId=3&NoteId=156054&lang=1&reg=3
- **確認日 / 確度**: 2026-09-10 / 最終原文を取得し施行規定を確認。full operationalisation という発表文を全条文即日施行と読みません。日単位の適用期限は公布日と通知日の扱いも含め専門確認が必要です。

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
- **一次情報の到達性に差があります**。CAC のトップ・専用索引と MeitY 最終官報は 2026-09-10 に取得済みです。別の当局・URL に対する過去の取得失敗は、各項目の確認日と範囲で読みます。
- **リンク切れ・改称に注意**。EU・BIS・OFAC はサイト改編で URL 変更が起こり得る。記事公開時に全リンクの生存を再確認し、`last_updated` とアクセス日を併記する。
- **二次情報(法律事務所の解説等)は本文の根拠にしない**。今回の調査でも解釈は法律事務所ブログ等に多く出てくるが、記事は一次情報(当局・官報・法令 DB)の所在提示に限定する。
