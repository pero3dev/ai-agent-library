# AI の環境負荷とグリーン AI 調査メモ(ST-R2)

## 調査メモ: AI の環境負荷に関する公式情報の所在(ST-R2)

- **調査日**: 2026-07-09。EG-06〜EG-11 更新確認: 2026-09-10。未更新の記録は各項目の確認日を参照
- **調査目的**: `docs/` の記事「AI の環境負荷とグリーン AI」(green-ai.md)の裏取り。方針は **中立** かつ **所在特定**。特定プロバイダーの優劣比較はしない。個別の推計値(1 クエリあたり CO2 など)は変化が速く比較に使うと誤解を生むため、**「どこを見れば最新の開示があるか」の一次情報 URL の特定**を主目的とし、数値は断定しない
- **確度の付け方**: 「公式確認済み」= 公式ページを WebFetch で直接取得できたもの / 「公式ページ存在(内容未読)」= 公式ドメインの URL・文書名を検索で確認したが本文は直接未取得 / 「ベンダー自己報告」= プロバイダー自身が公表する環境主張(第三者保証の有無は別途注記が必要)/ 「二次情報」= 公式以外での確認 / 「未確認」
- **取得メモ**: IEA の 2026 年資料は 2026-09-10 に取得済み。資料の存在・要旨の確認と、全文の数値再計算・独立検証を区別します。

---

## 1. 主要クラウド/AI プロバイダーの環境開示の所在

> 注: 以下はいずれも **プロバイダー自身の自己報告**。掲載される数値(PUE・WUE・CFE 比率・水補充量・スコープ別排出)は **年次で更新され変動する**ため、記事に固定値を書かず「最新は各社レポートを参照」とすること。優劣比較は避ける。

### Google / Alphabet(サステナビリティレポート)

- **確認済み公開版**: 2026 Environmental Report。2025 年実績を扱います。
- **一次情報**: https://sustainability.google/google-2026-environmental-report/
- **確認日 / 確度**: 2026-09-10 / 公式報告の掲載を確認。数値は事業者の自己報告です。
- **引用時**: PUE、CFE、水、Scope 1/2/3 は実績期間・組織境界・保証範囲を本文で照合します。他社の公表年だけを合わせて比較しません。

### Microsoft(Environmental Sustainability Report)

- **確認済み公開版**: 2026 Environmental Sustainability Report。旧 2025 fact sheet を現行版と扱いません。
- **一次情報**: https://www.microsoft.com/en-us/corporate-responsibility/topics/sustainability/report/ / https://www.microsoft.com/en-us/corporate-responsibility/reports-hub
- **確認日 / 確度**: 2026-09-10 / 公式報告の掲載確認。数値・目標は自己報告で、実績期間と保証対象の照合は引用時に必要です。
- **注意**: water positive / carbon negative の目標・相殺・補充と、実消費・実排出を区別します。

### Amazon / AWS(Amazon Sustainability + AWS)

- **確認済み公開版**: Amazon hub は 2025 Sustainability Report を掲載しています。https://sustainability.aboutamazon.com/reports
- **後継サービス**: AWS Sustainability console は 2026-03-31 GA。無料、専用コンソール、Scope 1 / 2 / 3、立地ベース/市場ベース、サービス/リージョン粒度、API / CSV を提供します。Billing 権限を要求せず専用のアクセス権限を使います。
- **データ**: ガイドは月次排出量と年次取水量(water withdrawals)を説明します。AI 個別リクエストの直接測定ではなく、サービスへ配賦する境界を別途記録します。
- **一次情報**: https://aws.amazon.com/about-aws/whats-new/2026/03/aws-launches-sustainability-console/ / https://aws.amazon.com/sustainability/tools/console/ / https://docs.aws.amazon.com/sustainability/latest/userguide/getting-started.html
- **旧 CCFT**: release notes は 2026-06-30 の廃止予告を掲載していますが、2026-09-10 の取得時にも未来形が残ります。後継の提供と旧 UI の実停止を区別し、アカウント画面での停止検証は未実施です。https://docs.aws.amazon.com/ccft/latest/releasenotes/what-is-ccftrn.html
- **確認日 / 確度**: 2026-09-10 / 公式本文確認。環境数値の独立検証は未実施。

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
- **一次情報 URL**: Google Cloud Carbon Footprint https://cloud.google.com/carbon-footprint / Microsoft Emissions Impact Dashboard https://www.microsoft.com/en-us/sustainability/emissions-impact-dashboard / AWS Sustainability console https://aws.amazon.com/sustainability/tools/console/ (2026-03-31 GA、2026-09-10 更新確認)
- **開示・扱う項目(中立記述)**: サービス/リージョン/期間別のスコープ 2(location-based / market-based)排出。ツールにより スコープ 1・3 も対象。いずれも GHG プロトコル準拠を掲げる
- **確認日**: 2026-07-09
- **確度**: ベンダー自己報告(公式ドメイン URL は検索で確認)
- **備考**: 市場ベース(証書反映)と立地ベースで数値が大きく変わる。ツール間・自己報告間の単純比較は不可

---

## 2. データセンターの電力・水に関する公的統計・報告書

### IEA(国際エネルギー機関)Energy and AI

- **資料**: Energy and AI (2025) に加え、Key Questions on Energy and AI が 2026-04-16 公開。
- **一次情報**: https://www.iea.org/reports/energy-and-ai / https://www.iea.org/reports/key-questions-on-energy-and-ai / https://www.iea.org/reports/key-questions-on-energy-and-ai/executive-summary
- **確認日 / 確度**: 2026-09-10 / 2026 年資料と要旨を取得済み。旧アクセス不能記録を更新しました。
- **設計への含意**: タスク当たりの効率と、利用回数・タスク構成による総需要の変化を別に測ります。将来推計はシナリオと算定境界に依存し、全数値・前提の再計算は未実施です。

### LBNL / 米国エネルギー省(DOE)2024 US Data Center Energy Usage Report

- **確認先**: Lawrence Berkeley National Laboratory(LBNL)、DOE(Energy Act of 2020 に基づく公的報告)
- **一次情報 URL**: 出版ページ https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report / 本文 PDF https://eta-publications.lbl.gov/sites/default/files/2024-12/lbnl-2024-united-states-data-center-energy-usage-report_1.pdf / DOE 告知 https://www.energy.gov/articles/doe-releases-new-report-evaluating-increase-electricity-demand-data-centers / eScholarship https://escholarship.org/uc/item/32d6m0d1
- **開示・扱う項目(中立記述)**: 米国データセンターの電力消費の実績(TWh)と 2028 までのシナリオ幅、米国総電力に占める割合、負荷成長の推移。政府資金による公的推計
- **確認日**: 2026-07-09
- **確度**: 公式ページ存在(内容未読)— 公式 LBNL/DOE ドメインの URL・報告書名を検索で確認、本文 PDF は直接未取得
- **備考**: 2016 年版(前身)の更新。将来はレンジ提示である点を明記して引用する

### EU 欧州委員会 データセンターのエネルギー性能報告(公的データベース)

- **一次情報**: https://energy.ec.europa.eu/topics/energy-efficiency/energy-efficiency-targets-directive-and-rules/energy-efficiency-directive/energy-performance-data-centres_en
- **確認日 / 確度**: 2026-09-10 / EC hub と FAQ の版・概要を確認。
- **FAQ**: hub 掲載 2026-07-28、PDF 表紙 v1.8 July 2026。URL の filename に 1v7 があっても本文版を優先します。IT 設備の設置電力需要 500 kW 以上の年次報告を説明します。79 頁の全法的論点のレビューは未実施です。
- **格付け**: EC ページは preparing と記載。2026-03-26〜04-23 の意見募集と将来計画は、採択・施行とは別です。Q2 の予定経過だけで採択済みとしません。

## 3. AI/ML の排出量推計の代表的な方法論

### ML CO2 Impact Calculator(Lacoste ほか)/ CodeCarbon

- **確認先**: 学術発の推計フレームワーク(Lacoste, Luccioni, Schmidt ら, NeurIPS 2019 Climate Change AI Workshop)と実測ツール CodeCarbon
- **一次情報 URL**: 計算機 https://mlco2.github.io/impact/ / リポジトリ https://github.com/mlco2/impact / 論文 "Quantifying the Carbon Emissions of Machine Learning" https://arxiv.org/abs/1910.09700 / CodeCarbon https://github.com/mlco2/codecarbon(組織 https://github.com/mlco2 )
- **開示・扱う項目(中立記述)**: ハードウェア・稼働時間・リージョンの電力炭素強度から学習等の CO2 を **推計**(ML CO2 Impact)。CodeCarbon は GPU/CPU/RAM の消費電力を実行時に **実測**しトラッキング。いずれも「計算メタデータ/実測から排出を出す」手法の代表例
- **確認日**: 2026-07-09
- **確度**: 二次情報(arXiv・GitHub の存在は検索で確認、本文は直接未取得)
- **備考**: 数値そのものより「学習 vs 推論」「立地の炭素強度依存」を説明する材料として使う。推計値は前提で大きく動く

### Green Software Foundation — Software Carbon Intensity(SCI)/ ISO/IEC 21031

- **基本 SCI**: 機能単位あたりの炭素強度を算定する ISO/IEC 21031:2024。総量会計とは目的が異なります。
- **SCI for AI**: GSF 公式トップは Ratified December 2025 と表示。GSF 仕様として批准済みで、AI ライフサイクル(データ準備・学習・推論等)の算定境界を扱います。AI 拡張まで ISO 規格化済みとは扱いません。
- **一次情報**: https://greensoftware.foundation/ / https://greensoftware.foundation/standards/sci-ai/ / https://greensoftware.foundation/standards/sci/
- **確認日 / 確度**: 2026-09-10 / GSF 本文確認。ISO 規格全文の精査は未実施です。

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

- **更新**: EU 理事会は 2026-02-24、サステナビリティ報告・デューデリジェンスの簡素化法制を最終承認しました。提案段階の記述を更新します。
- **公式発表の範囲**: 企業の対象閾値は従業員 1,000 人超かつ純売上 4.5 億ユーロ超。第三国企業・移行措置は別条件です。
- **一次情報**: https://www.consilium.europa.eu/en/press/press-releases/2026/02/24/council-signs-off-simplification-of-sustainability-reporting-and-due-diligence-requirements-to-boost-eu-competitiveness/
- **確認日 / 確度**: 2026-09-10 / 理事会の最終承認発表を確認。確定法令番号、加盟国ごとの国内法化・適用日は未照合です。具体的な自社義務は法令・国内法と法務部門で確認します。

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
- **規制・ツールの追跡**: AWS Sustainability console の GA、GSF SCI for AI の批准、CSRD の理事会最終承認は確認済みです。残るのは旧 CCFT の実画面停止、国内法適用、EED 格付けの採択・施行など、対象を絞った確認です。
- **記事の立ち位置**: 数値の比較表は作らず、「どの一次情報で最新値を確認するか」の所在マップに徹する。自主開示(レポート)と義務報告(EED)、総量会計(GHG プロトコル)と効率レート(SCI)、施設指標(PUE/WUE)を **役割ごとに整理**すると読者が使い分けられる
