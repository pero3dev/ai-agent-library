# AI の環境負荷とグリーン AI 調査メモ(ST-R2)

## 調査メモ: AI の環境負荷に関する公式情報の所在(ST-R2)

- **調査日**: 2026-07-09
- **調査目的**: `docs/` の記事「AI の環境負荷とグリーン AI」(green-ai.md)の裏取り。方針は **中立** かつ **所在特定**。特定プロバイダーの優劣比較はしない。個別の推計値(1 クエリあたり CO2 など)は変化が速く比較に使うと誤解を生むため、**「どこを見れば最新の開示があるか」の一次情報 URL の特定**を主目的とし、数値は断定しない
- **確度の付け方**: 「公式確認済み」= 公式ページを WebFetch で直接取得できたもの / 「公式ページ存在(内容未読)」= 公式ドメインの URL・文書名を検索で確認したが本文は直接未取得 / 「ベンダー自己報告」= プロバイダー自身が公表する環境主張(第三者保証の有無は別途注記が必要)/ 「二次情報」= 公式以外での確認 / 「未確認」
- **取得メモ**: `iea.org` は今回 WebFetch が HTTP 403 を返したため「公式ページ存在(内容未読)」扱い。`ghgprotocol.org`・`greensoftware.foundation`・`energy.ec.europa.eu` は直接取得できた

---

## 1. 主要クラウド/AI プロバイダーの環境開示の所在

> 注: 以下はいずれも **プロバイダー自身の自己報告**。掲載される数値(PUE・WUE・CFE 比率・水補充量・スコープ別排出)は **年次で更新され変動する**ため、記事に固定値を書かず「最新は各社レポートを参照」とすること。優劣比較は避ける。

### Google / Alphabet(サステナビリティレポート)

- **確認先**: Google Sustainability / Environmental Report(年次)
- **一次情報 URL**: https://sustainability.google/reports/ (レポート一覧) / https://sustainability.google/operations/ / データセンター単体 https://datacenters.google/operating-sustainably/ / 24x7 CFE 手法 https://sustainability.google/reports/24x7-carbon-free-energy-data-centers/ / ブログ告知例 https://blog.google/company-news/outreach-and-initiatives/sustainability/
- **開示・扱う項目(中立記述)**: フリート平均 PUE、24/7 カーボンフリー電力(CFE)比率(時間単位マッチング)、水使用量・水補充(replenishment)、スコープ 1/2/3 排出、ネットゼロ目標(2030)。手法解説として 24/7 CFE の考え方を別ドキュメント化
- **確認日**: 2026-07-09
- **確度**: ベンダー自己報告(公式ドメイン URL は検索で確認、本文は直接未取得)
- **備考**: 2025 年版・2026 年版の告知ページが並存。年版の最新性は執筆時に再確認が必要

### Microsoft(Environmental Sustainability Report)

- **確認先**: Microsoft Environmental Sustainability Report(年次)/ データセンター向けページ
- **一次情報 URL**: https://www.microsoft.com/en-us/corporate-responsibility/sustainability/report/ / データセンター https://datacenters.microsoft.com/sustainability/ / 計測手法(Azure ブログ)https://azure.microsoft.com/en-us/blog/how-microsoft-measures-datacenter-water-and-energy-use-to-improve-azure-cloud-sustainability/ / データファクトシート PDF(例)https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/msc/documents/presentations/CSR/2025-Microsoft-Environmental-Data-Fact-Sheet-PDF.pdf
- **開示・扱う項目(中立記述)**: PUE・WUE(L/kWh)、carbon negative / water positive / zero waste の 2030 目標、スコープ 1/2/3、再エネ調達、冷却技術(direct-to-chip 等)。ファクトシートで数値の一覧を提供
- **確認日**: 2026-07-09
- **確度**: ベンダー自己報告(公式ドメイン URL は検索で確認)
- **備考**: 「water positive」「carbon negative」は **目標・相殺・補充を含む主張**であり、実消費と区別して読む必要がある(グリーンウォッシュ注意)

### Amazon / AWS(Amazon Sustainability + AWS)

- **確認先**: Amazon Sustainability(全社)/ AWS Sustainability(クラウド)/ Customer Carbon Footprint Tool(顧客向け)
- **一次情報 URL**: 全社 https://sustainability.aboutamazon.com/ / AWS https://aws.amazon.com/sustainability/ / データセンター https://aws.amazon.com/sustainability/data-centers/ / 顧客カーボン算定手法 PDF https://sustainability.aboutamazon.com/aws-customer-carbon-footprint-methodology.pdf / AWS サマリ PDF https://sustainability.aboutamazon.com/2024-amazon-sustainability-report-aws-summary.pdf
- **開示・扱う項目(中立記述)**: グローバル PUE、WUE(L/kWh)、water positive(2030)進捗、再エネ調達、Customer Carbon Footprint Tool(CCFT)による顧客単位スコープ 1/2 排出。方法論 PDF を別掲
- **確認日**: 2026-07-09
- **確度**: ベンダー自己報告(公式ドメイン URL は検索で確認)
- **備考**: 検索スニペット上、CCFT は 2026-06-30 に廃止し後継サービスへ移行予定との記述あり。**顧客向けツールの提供形態は変更が速い**ため、URL とツール名は執筆時に再確認(TODO 化推奨)

### Meta(Sustainability Report)

- **確認先**: Meta Sustainability(年次レポート)/ データセンター向けページ
- **一次情報 URL**: https://sustainability.atmeta.com/ / レポート https://sustainability.atmeta.com/2025-sustainability-report/ / データセンター https://sustainability.atmeta.com/data-centers/ 及び https://datacenters.atmeta.com/sustainability/
- **開示・扱う項目(中立記述)**: PUE、再エネ 100% マッチング、水補充(water restoration)プロジェクト、スコープ 1/2/3、バリューチェーン全体のネットゼロ目標(2030)、建設廃棄物・LEED 認証
- **確認日**: 2026-07-09
- **確度**: ベンダー自己報告(公式ドメイン URL は検索で確認)
- **備考**: 「再エネ 100%」は多くの場合 **年間マッチング(証書調達等)** による主張。時間単位の脱炭素とは意味が異なる点に注意

### Anthropic

- **確認先**: 単独の詳細な環境レポート(スコープ別排出等)は 2026 年時点で乏しい
- **一次情報 URL**: 公式サステナビリティレポートの固定 URL は今回特定できず(未確認)。関連の公表として気候関連イニシアチブ参加(Frontier Climate への参加報道)などが二次情報で確認される程度
- **開示・扱う項目(中立記述)**: 監査済みスコープ 1/2/3 の体系的開示は確認できず。カーボン除去等の調達参加が報じられる段階
- **確認日**: 2026-07-09
- **確度**: 未確認(公式の包括開示は特定できず)/ 参加報道は二次情報
- **備考**: 「開示が乏しい」ことを **断定的に不利と評さない**。フロンティア AI ラボは単独開示が発展途上である旨を中立に書き、`TODO(要確認)` を残す

### OpenAI

- **確認先**: 単独の詳細な環境レポート(スコープ別排出等)は 2026 年時点で乏しい
- **一次情報 URL**: 公式サステナビリティレポートの固定 URL は今回特定できず(未確認)
- **開示・扱う項目(中立記述)**: 監査済みスコープ別排出の体系的開示は確認できず
- **確認日**: 2026-07-09
- **確度**: 未確認(公式の包括開示は特定できず)
- **備考**: Anthropic と同様、記事では「主要 AI ラボの単独開示は限定的(2026 年時点)」と中立記述にとどめる。インフラを担うクラウド事業者側の開示で近似する読み方があることを併記可

### (参考)顧客向けクラウドカーボン算定ツール

- **確認先**: 各クラウドが提供する顧客単位の排出可視化ツール(記事の「利用者が自分の使用分をどう測るか」に対応)
- **一次情報 URL**: Google Cloud Carbon Footprint https://cloud.google.com/carbon-footprint / Microsoft Emissions Impact Dashboard https://www.microsoft.com/en-us/sustainability/emissions-impact-dashboard / AWS Customer Carbon Footprint Tool(上記 Amazon 項の方法論 PDF)
- **開示・扱う項目(中立記述)**: サービス/リージョン/期間別のスコープ 2(location-based / market-based)排出。ツールにより スコープ 1・3 も対象。いずれも GHG プロトコル準拠を掲げる
- **確認日**: 2026-07-09
- **確度**: ベンダー自己報告(公式ドメイン URL は検索で確認)
- **備考**: 市場ベース(証書反映)と立地ベースで数値が大きく変わる。ツール間・自己報告間の単純比較は不可

---

## 2. データセンターの電力・水に関する公的統計・報告書

### IEA(国際エネルギー機関)Energy and AI

- **確認先**: IEA "Energy and AI"(2025 公表)および関連の "Key Questions on Energy and AI"、データセンター電力に関するニュース/分析
- **一次情報 URL**: レポート https://www.iea.org/reports/energy-and-ai / エグゼクティブサマリ https://www.iea.org/reports/energy-and-ai/executive-summary / 需要 https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai / 供給 https://www.iea.org/reports/energy-and-ai/energy-supply-for-ai / PDF(Key Questions)https://iea.blob.core.windows.net/assets/3179f7f8-01f6-4dd6-bffa-c9f7b73f1dc9/KeyQuestionsonEnergyandAI.pdf
- **開示・扱う項目(中立記述)**: 世界のデータセンター電力消費の見通し(TWh、世界電力に占める比率)、AI 特化データセンターの伸び、電源構成、AI タスクあたりのエネルギー効率改善。国際横断の一次分析
- **確認日**: 2026-07-09
- **確度**: 公式ページ存在(内容未読)— WebFetch が HTTP 403。URL・文書名・扱う論点は検索で確認
- **備考**: 将来推計はシナリオ幅が大きい。記事では単一の見通し値を断定せず「IEA のシナリオでは幅がある」と書く

### LBNL / 米国エネルギー省(DOE)2024 US Data Center Energy Usage Report

- **確認先**: Lawrence Berkeley National Laboratory(LBNL)、DOE(Energy Act of 2020 に基づく公的報告)
- **一次情報 URL**: 出版ページ https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report / 本文 PDF https://eta-publications.lbl.gov/sites/default/files/2024-12/lbnl-2024-united-states-data-center-energy-usage-report_1.pdf / DOE 告知 https://www.energy.gov/articles/doe-releases-new-report-evaluating-increase-electricity-demand-data-centers / eScholarship https://escholarship.org/uc/item/32d6m0d1
- **開示・扱う項目(中立記述)**: 米国データセンターの電力消費の実績(TWh)と 2028 までのシナリオ幅、米国総電力に占める割合、負荷成長の推移。政府資金による公的推計
- **確認日**: 2026-07-09
- **確度**: 公式ページ存在(内容未読)— 公式 LBNL/DOE ドメインの URL・報告書名を検索で確認、本文 PDF は直接未取得
- **備考**: 2016 年版(前身)の更新。将来はレンジ提示である点を明記して引用する

### EU 欧州委員会 データセンターのエネルギー性能報告(公的データベース)

- **確認先**: European Commission(エネルギー効率指令 EED に基づくデータセンター報告義務・欧州データベース)
- **一次情報 URL**: https://energy.ec.europa.eu/topics/energy-efficiency/energy-efficiency-targets-directive-and-rules/energy-efficiency-directive/energy-performance-data-centres_en / 委任規則の告知・レーティングスキーム関連 https://energy.ec.europa.eu/news/rating-scheme-data-centres-eu-commission-launches-call-feedback-2026-03-27_en / 最低性能基準 https://energy.ec.europa.eu/resources/preparatory-studies/minimum-performance-standards-eu-data-centres_en
- **開示・扱う項目(中立記述)**: 一定規模(設置 IT 電力 500kW 超)のデータセンターに年次報告義務。委任規則(EU)2024/1364 が報告項目・KPI(エネルギー性能・水フットプリント等)と欧州データベースを規定。集計値を EU/国レベルで公開。第 2 段のサステナビリティ・レーティング/ラベルを検討中
- **確認日**: 2026-07-09
- **確度**: 公式確認済み(委員会ページを直接取得。ただし個別 KPI の一覧は本文で明示されず要一次確認)
- **備考**: これは **プロバイダー自己報告と異なる公的集計** の入口。単一事業者ではなく地域集計として読む

---

## 3. AI/ML の排出量推計の代表的な方法論

### ML CO2 Impact Calculator(Lacoste ほか)/ CodeCarbon

- **確認先**: 学術発の推計フレームワーク(Lacoste, Luccioni, Schmidt ら, NeurIPS 2019 Climate Change AI Workshop)と実測ツール CodeCarbon
- **一次情報 URL**: 計算機 https://mlco2.github.io/impact/ / リポジトリ https://github.com/mlco2/impact / 論文 "Quantifying the Carbon Emissions of Machine Learning" https://arxiv.org/abs/1910.09700 / CodeCarbon https://github.com/mlco2/codecarbon(組織 https://github.com/mlco2 )
- **開示・扱う項目(中立記述)**: ハードウェア・稼働時間・リージョンの電力炭素強度から学習等の CO2 を **推計**(ML CO2 Impact)。CodeCarbon は GPU/CPU/RAM の消費電力を実行時に **実測**しトラッキング。いずれも「計算メタデータ/実測から排出を出す」手法の代表例
- **確認日**: 2026-07-09
- **確度**: 二次情報(arXiv・GitHub の存在は検索で確認、本文は直接未取得)
- **備考**: 数値そのものより「学習 vs 推論」「立地の炭素強度依存」を説明する材料として使う。推計値は前提で大きく動く

### Green Software Foundation — Software Carbon Intensity(SCI)/ ISO/IEC 21031

- **確認先**: Green Software Foundation(GSF)Software Standards Working Group
- **一次情報 URL**: SCI https://greensoftware.foundation/standards/sci/ / SCI for AI(AI 向け拡張)https://greensoftware.foundation/standards/sci-ai/ / 仕様リポジトリ https://github.com/Green-Software-Foundation/sci / ISO 標準 https://www.iso.org/standard/86612.html(ISO/IEC 21031:2024)
- **開示・扱う項目(中立記述)**: ソフトウェアの機能単位(ユーザー/トランザクション/API コール等)あたりの炭素強度を **レート**で算定する方法論。式 `SCI = (E × I + M) per R`(E=消費電力、I=電力の炭素強度、M=製造時の内包排出、R=機能単位)。SCI for AI は AI ライフサイクル(データ準備〜学習〜推論)向け拡張
- **確認日**: 2026-07-09
- **確度**: 公式確認済み(SCI ページを直接取得。ISO 番号 21031:2024 を確認)/ SCI for AI ページは公式ページ存在(内容未読)
- **備考**: 相殺(オフセット)を含めず「実効率」を示すレート指標である点が特徴。総量会計(GHG プロトコル)とは目的が異なる

### GHG プロトコル(企業排出会計の基盤)/ PUE・WUE の標準

- **確認先**: GHG Protocol(WRI と WBCSD の共同)/ データセンター KPI は ISO/IEC 30134 シリーズ(The Green Grid が原型を策定)
- **一次情報 URL**: GHG プロトコル標準一覧 https://ghgprotocol.org/standards (Corporate Standard, Scope 2 Guidance, Scope 3 Standard 等)/ PUE 標準 ISO/IEC 30134-2 https://www.iso.org/standard/30134-2 / WUE は ISO/IEC 30134-9(The Green Grid 由来)
- **開示・扱う項目(中立記述)**: GHG プロトコルはスコープ 1(直接)/2(購入エネルギー)/3(バリューチェーン)の会計方法を規定。スコープ 2 は立地ベース/市場ベースの二重報告。PUE=施設総電力÷IT 機器電力(理想 1.0)、WUE=冷却等の水使用量÷IT 電力(L/kWh)。WUE はカテゴリ 1〜3(直接水のみ〜電源生成の間接水まで)で境界が異なる
- **確認日**: 2026-07-09
- **確度**: 公式確認済み(GHG プロトコル標準ページを直接取得、発行主体 WRI/WBCSD を確認)/ ISO 30134 の番号は検索確認(公式ページ存在・内容未読)
- **備考**: PUE は「IT 機器から先」を測らない指標。低 PUE = 低総排出ではない(電源の炭素強度は別)。WUE のカテゴリを揃えないと比較不可

---

## 4. 報告・規制枠組みの入口(所在のみ)

### GHG プロトコル(自主的会計標準の事実上の基盤)

- **確認先**: WRI / WBCSD
- **一次情報 URL**: https://ghgprotocol.org/standards
- **開示・扱う項目(中立記述)**: 企業 GHG インベントリ作成の国際的デファクト標準。後述の各種規制が方法論として参照
- **確認日**: 2026-07-09
- **確度**: 公式確認済み
- **備考**: 内容解釈はせず「多くの開示制度が参照する基盤」という所在にとどめる

### EU CSRD / ESRS E1(気候変動開示)

- **確認先**: EU(企業サステナビリティ報告指令 CSRD、欧州サステナビリティ報告基準 ESRS の E1)
- **一次情報 URL**: EFRAG(基準策定主体)https://www.efrag.org/ / 欧州委員会 CSRD 概要 https://finance.ec.europa.eu/capital-markets-union-and-financial-markets/company-reporting-and-auditing/company-reporting/corporate-sustainability-reporting_en
- **開示・扱う項目(中立記述)**: ESRS E1 が対象企業にスコープ 1/2/3 の GHG 排出開示等を要求し、方法論として GHG プロトコルを参照(スコープ 3 は 15 カテゴリ)。制度の内容解釈は記事では行わず入口のみ示す
- **確認日**: 2026-07-09
- **確度**: 公式ページ存在(内容未読)/ GHG プロトコル参照関係は二次情報での確認
- **備考**: CSRD/ESRS は適用範囲・簡素化(Omnibus 等)が変化中。**最新の適用状況は執筆時に一次確認**し `TODO(要確認)` を残す。EFRAG 公式 URL は執筆時に再確認

### EU EED データセンター報告(公的データベース)— 再掲

- **確認先**: European Commission(EED 委任規則(EU)2024/1364)
- **一次情報 URL**: 上記 2. の EU 項に同じ
- **開示・扱う項目(中立記述)**: データセンター単位のエネルギー・水 KPI を欧州データベースへ報告する **義務ベース** の枠組み。自己 PR ではなく規制報告
- **確認日**: 2026-07-09
- **確度**: 公式確認済み
- **備考**: 「自主開示(サステナビリティレポート)」と「義務報告(EED)」を記事で区別すると読者の理解が進む

---

## 記事執筆時の注意

- **推計値の幅**: 1 クエリ/1 学習あたりの CO2・電力・水の推計は前提(モデル規模・ハードウェア・立地の炭素強度・PUE の仮定)で 1 桁以上動く。**単一の数値を断定しない**。出す場合は出典・確認日・前提を必ず併記し、レンジで示す
- **測定境界を明示する**:
  - **学習(training)vs 推論(inference)** — 総影響は推論側が支配的になり得るが、公開推計は学習偏重のものが多い
  - **スコープ 1/2/3** — 電力は主にスコープ 2。ハードウェア製造・バリューチェーンはスコープ 3 で境界が曖昧
  - **スコープ 2 の立地ベース vs 市場ベース** — 証書調達を反映する市場ベースは数値が大きく下がる。混同しない
  - **PUE の境界** — IT 機器から先のオーバーヘッドのみ。低 PUE は低総排出を意味しない(電源の炭素強度は別軸)
  - **WUE のカテゴリ(1〜3)と直接/間接水** — 施設の直接冷却水か、発電に伴う間接水まで含むかで別物。カテゴリを揃えないと比較不可
- **自己報告の扱い**: プロバイダーのサステナビリティレポートは **自己申告**。第三者保証(assurance)の有無、対象期間、算定境界を確認し、社間の単純比較は避ける。数値は年次更新される前提で「最新は各社レポート参照」と書く
- **グリーンウォッシュ回避**: 「carbon negative」「water positive」「再エネ 100%」「ネットゼロ」は **相殺・証書調達・水補充・目標** を含む主張であり、実消費・実排出の削減とは別概念。**24/7 CFE(時間単位マッチング)と年間マッチングの違い**、実削減と相殺の違いを区別して記述する
- **AI ラボの単独開示は限定的(2026 年時点)**: Anthropic・OpenAI の包括的な環境開示は今回特定できず。これを一方的に不利と評さず、「単独開示は発展途上」「インフラを担うクラウド側の開示で近似する読み方がある」と中立に書き、`TODO(要確認)` を残す
- **規制・ツールは変化が速い**: CSRD/ESRS の適用範囲、EU EED レーティングスキーム、AWS CCFT の後継移行(2026-06-30 廃止予定の記述あり)などは流動的。URL・制度名・提供形態は執筆セッションで再確認し、断定を避ける
- **記事の立ち位置**: 数値の比較表は作らず、「どの一次情報で最新値を確認するか」の所在マップに徹する。自主開示(レポート)と義務報告(EED)、総量会計(GHG プロトコル)と効率レート(SCI)、施設指標(PUE/WUE)を **役割ごとに整理**すると読者が使い分けられる
