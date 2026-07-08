# 来歴・検出・なりすまし対策 調査メモ(標準／検出限界／公的注意喚起の差分)

- **調査日:** 2026-07-08
- **用途:** TRUST-SECURITY 計画 AI-1 の裏付け。`docs/(TRUST-SECURITY)/content-provenance-and-detection.md`(来歴と検出)および `deepfake-and-impersonation-defense.md`(ディープフェイク・なりすまし防御)の執筆前調査
- **分担(重複回避):** 各生成モデルベンダーの来歴/透かし **機能の対応状況**(OpenAI の C2PA、Google の SynthID、Adobe/Amazon の Content Credentials 等)は既存メモ [`research/multimodal/generation.md`](../multimodal/generation.md)(2026-07-08)が **正**。本メモはその **差分** に絞り、次を扱う: (A) 来歴の「標準」そのもの(C2PA / Content Credentials / 電子透かしの類型)、(B) AI 生成 **検出** の限界、(C) なりすまし・ディープフェイク詐欺への **公的注意喚起の所在**
- **注意:** 標準仕様のバージョン・各社機能・公的ガイダンスは **変化が速い**。本メモは **2026-07-08 時点のスナップショット**。docs 反映前に一次情報を再確認すること
- **根拠の方針:** 標準団体(C2PA / CAI)・公的機関(NIST・FBI/IC3・FTC・警察庁・消費者庁・IPA 等)の一次情報を優先。**検出ツールの性能主張(精度◯%等)は必ず「ベンダー自己報告」として扱い、記事本文で断定に用いない**

## 確度マーカーの定義

| マーカー | 意味 |
| --- | --- |
| `公式確認済み` | 標準団体・公的機関・ベンダーの公式ページを直接取得し、本文に明記があることを確認した |
| `ベンダー自己報告` | 公式記載だが第三者検証が困難な自己申告(特に **検出/透かしの性能・堅牢性の主張**) |
| `二次情報` | 公式以外(まとめ記事・標準解説記事・報道など)を根拠にした情報 |
| `未確認` | 直接確認できなかった。確認先 URL を残す |

> **TODO(要確認):** 本メモの全項目は 2026-07-08 取得。一部の一次情報(NIST AI 100-4 PDF、NSA/CISA CSI PDF、FTC 消費者アラート)は WebFetch が 403 / バイナリ非展開のため、**所在(URL)は確認済みだが本文全文は未取得**。docs 反映前にブラウザで本文を直接確認する(最終確認: 2026-07)

---

## A. 来歴の「標準」そのもの(C2PA / Content Credentials / 電子透かし)

### A-1. C2PA / Content Credentials とは何か

- **事実:** **C2PA(Coalition for Content Provenance and Authenticity)** は、デジタルコンテンツの **出所(origin)と編集履歴(edits)** を証明するためのオープンな技術標準。**Content Credentials** はその実装名で、公式は「デジタルコンテンツの **栄養成分表示ラベル(nutrition label)** のようなもの」と説明。ステアリングメンバーに Adobe・Amazon・BBC・Google・Meta・Microsoft・OpenAI・Sony・Truepic 等。CAI(Content Authenticity Initiative)は Adobe 主導の普及イニシアチブで、C2PA の技術をオープンソースツールとして展開
- **出典:** [c2pa.org](https://c2pa.org/) / [contentauthenticity.org](https://www.contentauthenticity.org/)
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`

### A-2. 何を保証するか(署名付きメタデータで作成・編集の来歴を記録)

- **事実:** C2PA は **マニフェスト(manifest)** というデータ構造を定義し、資産の起源・編集履歴を **アサーション(assertions)** として記録する。アサーションはツール名・取り込んだ元素材(ingredients)等を含み、**クレーム(claim)** にまとめて **PKI(公開鍵基盤)で暗号署名** される。これにより **改ざん検知可能(tamper-evident)** になる。CAI 公式の要点: 署名後にコンテンツや付随データが変更されると「署名後に変更が加えられたことが分かる」。編集自体を **禁止するのではなく**、対応ツールで再ハッシュ・再署名しない限り Content Credential が **無効になる**(= 履歴が正しく引き継がれない)
- **重要な限定(誤用防止):** 来歴は「**誰が・どのツールで・どう編集したか**の履歴」を検証可能にするもの。**内容の真偽や「AI 生成か否か」そのものを証明するものではない**。来歴の有無と、後述 (B) の「AI 生成検出」は別レイヤー
- **出典:** [contentauthenticity.org/how-it-works](https://contentauthenticity.org/how-it-works) / [C2PA Specifications 2.4(索引)](https://spec.c2pa.org/specifications/specifications/2.4/index.html)
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`(履歴記録・PKI 署名・改ざん検知)

### A-3. 標準の現行版・所在・ISO 化

- **事実:** 公式仕様索引で確認できる最新は **C2PA Specifications 2.4**(2.0/2.1/2.2/2.3/2.4 と 1.x が併存)。2.0 は 2024 年 1 月公開、2.1 は 2024-09-20 付。標準の所在は **spec.c2pa.org**。C2PA v2 は **国際標準として ISO/DIS 22144「Authenticity of information — Content Credentials」** にファストトラックされている(C2PA アーキテクチャの技術面を規定するモデル)
- **出典:** [spec.c2pa.org(仕様索引)](https://spec.c2pa.org/specifications/specifications/2.4/index.html) / ISO 化: [ASIS&T 解説「ISO/DIS 22144」](https://www.asist.org/2025/03/19/iso-22144-authenticity-information-standards/)
- **確認日:** 2026-07-08
- **確度:** バージョン・所在=`公式確認済み` / ISO/DIS 22144=`二次情報`(複数の標準関連ソースで一致。最終化状況は [iso.org](https://www.iso.org/) で要確認)

### A-4. 来歴が「剥がれる」条件(標準文書の記載)

- **事実:** メタデータ型の来歴は失われうる。CAI 公式ブログ「Durable Content Credentials」の要点: 「**どんな種類のメタデータも、意図的にも偶発的にも除去されうる**」。スクリーンショット・写真の写真・再録画といった **再ブロードキャスト(rebroadcasting)** は安全なメタデータを事実上消し去る。**プラットフォームへのアップロードや再エンコードで埋め込み情報が剥がれる**ことがある
- **対策としての Durable Content Credentials:** メタデータ単独の脆弱性を補うため、**(1) 安全なメタデータ + (2) 電子透かし(watermark) + (3) 指紋(fingerprint)** の 3 技術を組み合わせて冗長化する。透かしは短い識別子と「完全なマニフェストの所在」を符号化し、**スクリーンショット等を生き延びる**設計。指紋はコンテンツ自体から知覚的コードを生成するため「除去すべき情報が無い」= 削除・再エンコードに強く、劣化後でも元の来歴レコードと照合できる
- **出典:** [contentauthenticity.org/blog/durable-content-credentials](https://contentauthenticity.org/blog/durable-content-credentials) / [contentauthenticity.org/how-it-works](https://contentauthenticity.org/how-it-works)
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`

### A-5. 電子透かし(watermark)の類型と、来歴メタデータとの違い

- **事実(類型):** 電子透かしは大きく **可視(visible)透かし**(例: サービスのロゴ/字幕をピクセルに焼き込む)と **不可視(invisible)透かし**(人には知覚できない信号をコンテンツに埋め込む)に分かれる。代表的な不可視透かしが **Google DeepMind の SynthID**。SynthID は画像/動画に不可視の透かしを埋め込み(クロップ・フィルタ・圧縮後も検出可能と説明)、音声には可聴でない透かし(ノイズ・MP3 圧縮・速度変化に耐えると説明)、テキストには生成時の語選択の確率スコアを調整する方式
- **来歴メタデータとの違い(事実):**
  - **C2PA / Content Credentials = 付随メタデータ型**。コンテンツに「付随」する署名付きレコード。改ざん検知は強いが、メタデータ剥離(A-4)で失われうる
  - **電子透かし = 信号埋め込み型**。コンテンツ **信号そのもの** に埋め込むため、メタデータ剥離や再エンコードに相対的に強い。ただし SynthID 公式も「一般的な改変に **耐えるよう設計**」と述べるにとどまり、**除去不能(絶対)とは主張していない** → 堅牢性は自己申告
  - 両者は競合ではなく **補完**。Durable Content Credentials(A-4)は両方 + 指紋を束ねる設計
- **出典:** [deepmind.google/science/synthid](https://deepmind.google/science/synthid/)(SynthID)
- **確認日:** 2026-07-08
- **確度:** SynthID の存在・方式=`公式確認済み` / **透かしの堅牢性(改変耐性)=`ベンダー自己報告`**

---

## B. 検出の限界(AI 生成を「後から判定」することの限界)

> **記事執筆の原則(明記事項):** 「AI 製かどうか」を後から判定する **検出器(detector)** は誤判定(偽陽性=人間作をAI判定 / 偽陰性=AI作を人間判定)を伴い、回避技術との軍拡競争にある。**検出ツールの性能主張(精度◯%)は必ず「ベンダー自己報告」として扱い、docs 本文で「AI 生成である/でない」を断定する根拠に使わない**。来歴(A)は「履歴の検証」、検出(B)は「AI 由来かの推定」で、**別物として扱う**。

### B-1. NIST の一次文書(検出・透かし・来歴の限界)

- **事実:** NIST(米国標準技術研究所)報告書 **NIST AI 100-4「Reducing Risks Posed by Synthetic Content(合成コンテンツがもたらすリスクの低減)」** は、来歴追跡・ラベリング(透かし)・検出の各技術と **その限界** を整理。要点: **テキストに適用したすべての来歴追跡技術には限界があり改ざんに脆弱**(言い換え/パラフレーズで透かしを引き継がずにコピーできる)/人間支援の検出は分野・熟練度に依存し、合成生成が高度化するほど困難になる/**単一の万能策(silver bullet)は存在せず**、技術・人的監督・法規範・メディアリテラシーを組み合わせた **多層的でユースケース別のアプローチ** が必要
- **出典:** [NIST 出版ページ](https://www.nist.gov/publications/reducing-risks-posed-synthetic-content-overview-technical-approaches-digital-content) / 本文 PDF: `https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-4.pdf`(DOI: 10.6028/NIST.AI.100-4)
- **確認日:** 2026-07-08
- **確度:** 文書の所在=`公式確認済み` / **本文全文は未取得(PDF が WebFetch でバイナリ非展開)**。上記要点は公式出版ページの要旨および検索要約に基づくため `二次情報` 扱い。docs 反映前に PDF 本文で該当箇所を確認する

### B-2. ベンダー自身が検出器を精度不足で撤回した実例(OpenAI)

- **事実:** OpenAI は 2023-01-31 に「AI で書かれたテキストを示す分類器(AI Text Classifier)」を公開したが、**2023-07-20 に「精度が低い(low rate of accuracy)」として提供を停止**。OpenAI 自身の報告で **正解は約 26% にとどまり**、また **人間が書いた文章を AI 作だと誤って(かつ自信を持って)ラベリングすることがあった**(= 偽陽性)。短文(約 1,000 文字未満)では特に信頼できないと明記
- **含意:** モデルの開発元自身が、テキスト AI 検出器を精度不足で撤回した。これは「**検出器の精度主張を鵜呑みにしない・断定に使わない**」原則を裏づける具体例。特に **偽陽性は、実在の人間の制作物や本人を「AI 製/偽物」と誤って断罪するリスク** があり実務上重大
- **出典:** [OpenAI「New AI classifier for indicating AI-written text」(更新注記に提供停止を明記)](https://openai.com/index/new-ai-classifier-for-indicating-ai-written-text/)
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`(OpenAI 自身の告知)。ただし 26% 等の数値は **自社報告**であり、他検出器一般の性能を保証しない

### B-3. 公的機関も「見分けは困難」と明言

- **事実:** FBI/IC3 は 2025-05-15 の公的注意喚起(PSA)で、AI 生成音声について「**AI 生成コンテンツは、しばしば見分けが困難なところまで高度化している(often difficult to identify)**」と明記。人間・簡易ツールによる真偽判定に頼りきることの危うさを公的機関が公式に述べた一次情報
- **出典:** [IC3 PSA 2025-05-15](https://www.ic3.gov/PSA/2025/PSA250515)
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`

### B-4. 検出と回避の「軍拡競争」(事実の整理)

- **事実:** 透かし・検出器は回避手法(テキストのパラフレーズ、画像/音声への微小摂動・再エンコード・トリミング、透かし除去ツール等)と **いたちごっこ** の関係にある。NIST AI 100-4 も来歴/透かしの **改ざん脆弱性** を指摘(B-1)。したがって検出結果は **確率的な補助シグナル** として扱い、**単独で断定しない**(来歴・文脈・別チャネル検証と併用する)のが妥当
- **出典:** B-1(NIST)/ B-2(OpenAI)/ B-3(FBI/IC3)を根拠に整理
- **確認日:** 2026-07-08
- **確度:** 個別事実は上記各項の確度に従う(整理・含意部分は本メモの解釈)

---

## C. なりすまし・ディープフェイク詐欺への公的注意喚起(存在と所在の確認)

> 内容の詳細解説は目的ではなく、**「公的機関が注意喚起を出している事実」と「その所在(URL)」** の確認が目的。共通する手口は、**音声クローン/ディープフェイクによる本人・経営者・公的人物のなりすまし → 緊急の送金指示や機密聴取**。共通する助言は **「別の信頼できる手段でかけ直して本人確認」「合言葉(code word)」「MFA」**。

### C-1. 米 FBI / IC3

- **事実:** IC3 は 2025-05-15 の PSA「Senior US Officials Impersonated in Malicious Messaging Campaign」で、**AI 生成音声メッセージ(vishing)+ 悪性リンクの SMS(smishing)** による米上級当局者・その連絡先へのなりすましを注意喚起。助言: 独立した手段で本人確認、URL/電話番号の微妙な差異を確認、オンライン/電話のみの相手に機密を渡さない、MFA を有効化。関連 PSA(2025-12-19 PSA251219)も継続発出。報道では IC3 の 2025 年報告で AI 関連詐欺の被害が高額(数億ドル規模)と伝えられる
- **出典:** [IC3 PSA 2025-05-15](https://www.ic3.gov/PSA/2025/PSA250515) / [IC3 PSA 2025-12-19](https://www.ic3.gov/PSA/2025/PSA251219)(所在確認)
- **確認日:** 2026-07-08
- **確度:** PSA 本文=`公式確認済み`(2025-05-15 は本文取得) / 被害額の数値=`二次情報`(報道由来。IC3 年次報告原本で要確認)

### C-2. 米 FTC(連邦取引委員会)

- **事実:** FTC は **「政府・事業者なりすまし規則(Government and Business Impersonation Rule)」** を制定・施行し、AI ディープフェイクが **なりすまし詐欺を加速させる** 脅威として、**個人のなりすまし(音声クローン等)への規則拡張**を進めている(補足的規則案 SNPRM を公開)。加えて「Voice Cloning Challenge」実施、消費者向けアラート「Fighting back against harmful voice cloning」(かけ直し確認・家族の合言葉を推奨)を発行
- **出典:** [FTC 個人なりすまし保護の提案(2024-02)](https://www.ftc.gov/news-events/news/press-releases/2024/02/ftc-proposes-new-protections-combat-ai-impersonation-individuals) / [FTC: Approaches to Address AI-enabled Voice Cloning](https://www.ftc.gov/policy/advocacy-research/tech-at-ftc/2024/04/approaches-address-ai-enabled-voice-cloning) / [消費者アラート](https://consumer.ftc.gov/consumer-alerts/2024/04/fighting-back-against-harmful-voice-cloning)(URL 所在確認・本文は 403)
- **確認日:** 2026-07-08
- **確度:** 規則・取り組みの存在=`公式確認済み`(FTC 公式ページ) / 施行日の細目=`未確認`(公式ページで要確認。検索要約に日付の揺れあり)

### C-3. 日本 警察庁

- **事実:** 警察庁 SOS47 特殊詐欺対策ページ(SNS 型投資・ロマンス詐欺)は、**「SNS 上に公開された写真や翻訳アプリ、AI などを利用すれば、誰でも簡単に他人になりすますことができ、本人の音声・動画を作ることができてしまう」** と明記して注意喚起。著名人の画像・動画を無断使用した広告や、ビデオ通話での偽警察官(顔・警察手帳の偽装)による詐欺も警告
- **出典:** [警察庁 SOS47「SNS 型投資・ロマンス詐欺」](https://www.npa.go.jp/bureau/safetylife/sos47/new-topics/sns-romance/) / [SOS47 注意喚起・お知らせ](https://www.npa.go.jp/bureau/safetylife/sos47/new-topics/)
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`(公式ページの記載を検索要約で確認。本文は docs 反映前に再確認)

### C-4. 日本 消費者庁 / 国民生活センター

- **事実:** 消費者庁は「AI 利活用ハンドブック〜生成 AI 編〜」を公表し、**著名人・有名人のなりすまし(と考えられる)事例が令和 5 年度下半期以降に増加傾向**と注意喚起。相談は消費者ホットライン「**188(いやや)**」。国民生活センターも中央省庁と連携し生成 AI 悪用・なりすまし系の注意喚起を掲載
- **出典:** [消費者庁「AI 利活用ハンドブック〜生成 AI 編〜」公表](https://www.caa.go.jp/notice/entry/037914/) / [国民生活センター(生成 AI 利用に関する注意喚起・中央省庁情報)](https://www.kokusen.go.jp/g_link/data/g-20231110_65.html)
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`(公式ページ所在・要旨を確認)

### C-5. 日本 IPA(情報処理推進機構)

- **事実:** IPA は「**AI 利用者のためのセキュリティ豆知識**」「AI セキュリティ短信」を公開し、生成 AI 悪用リスクを啓発。「情報セキュリティ 10 大脅威 2026」で AI 関連脅威が上位にランクイン。「AI セーフティに関する評価観点ガイド」も公開
- **出典:** [IPA「AI 利用者のためのセキュリティ豆知識」](https://www.ipa.go.jp/digital/ai/security/ai_security_tips.html) / [IPA AI セキュリティ](https://www.ipa.go.jp/digital/ai/security/index.html)
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`(所在・内容の要旨を確認)

### C-6. 英 NCSC(参考・非米日の公的機関)

- **事実:** 英 National Cyber Security Centre はブログ「Preserving integrity in the age of generative AI」で、生成 AI・ディープフェイクにより **誰でも低コストで音声/動画を偽造・改変できる** 状況と、その完全性(integrity)への影響・対策を論じている。金融承認等での多要素検証を推奨
- **出典:** [NCSC「Preserving integrity in the age of generative AI」](https://www.ncsc.gov.uk/blog-post/preserving-integrity-in-age-generative-ai)
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`(所在確認・要旨)

---

## 公的機関の注意喚起の所在

| 機関(国) | URL | 対象 |
| --- | --- | --- |
| FBI / IC3(米) | https://www.ic3.gov/PSA/2025/PSA250515 | AI 音声なりすまし(上級当局者)+ 悪性 SMS。継続 PSA: /PSA/2025/PSA251219 |
| FTC(米) | https://www.ftc.gov/news-events/news/press-releases/2024/02/ftc-proposes-new-protections-combat-ai-impersonation-individuals | 政府・事業者/個人なりすまし規則、AI 音声クローン対応 |
| FTC 消費者向け(米) | https://consumer.ftc.gov/consumer-alerts/2024/04/fighting-back-against-harmful-voice-cloning | 音声クローン詐欺(かけ直し確認・合言葉) |
| 警察庁 SOS47(日) | https://www.npa.go.jp/bureau/safetylife/sos47/new-topics/sns-romance/ | SNS 型投資・ロマンス詐欺、AI によるなりすまし(音声・動画) |
| 消費者庁(日) | https://www.caa.go.jp/notice/entry/037914/ | 生成 AI と消費者トラブル、著名人なりすまし。相談: 188 |
| 国民生活センター(日) | https://www.kokusen.go.jp/g_link/data/g-20231110_65.html | 生成 AI 利用の注意喚起(中央省庁情報の集約) |
| IPA(日) | https://www.ipa.go.jp/digital/ai/security/ai_security_tips.html | AI 悪用リスクの啓発、10 大脅威、AI セーフティ |
| NCSC(英) | https://www.ncsc.gov.uk/blog-post/preserving-integrity-in-age-generative-ai | 生成 AI/ディープフェイクとコンテンツ完全性 |
| NIST(米・技術指針) | https://www.nist.gov/publications/reducing-risks-posed-synthetic-content-overview-technical-approaches-digital-content | 合成コンテンツの来歴・透かし・検出と限界(AI 100-4) |
| NSA/CISA/FBI 他(米・技術指針) | https://media.defense.gov/2025/Jan/29/2003634788/-1/-1/0/CSI-CONTENT-CREDENTIALS.PDF | Content Credentials によるマルチメディア完全性強化(CSI。本文は 403、所在のみ確認) |

---

## 変わりやすい項目(定点観測)

3〜6 か月単位で陳腐化しやすい。docs 反映後も一次情報で再確認する。

| 項目 | 変わりやすさ | 再確認先 |
| --- | --- | --- |
| C2PA 仕様の版(2.4→) | 中〜高 | [spec.c2pa.org](https://spec.c2pa.org/specifications/specifications/2.4/index.html) |
| ISO/DIS 22144 の最終化(DIS→IS) | 中 | [iso.org](https://www.iso.org/) / [C2PA](https://c2pa.org/) |
| SynthID の対象拡大・堅牢性の主張 | 中〜高 | [deepmind.google/science/synthid](https://deepmind.google/science/synthid/) |
| Durable Content Credentials(透かし+指紋)の対応範囲 | 中 | [contentauthenticity.org](https://contentauthenticity.org/how-it-works) |
| 検出ツールの提供状況・精度主張(**常にベンダー自己報告**扱い) | 高 | 各ベンダー公式(断定に使わない) |
| NIST の合成コンテンツ指針の改訂 | 中 | [NIST AIRC](https://airc.nist.gov/) |
| FTC の個人なりすまし規則の最終化・施行日 | 中〜高 | [ftc.gov](https://www.ftc.gov/) |
| 各公的機関の新規 PSA・被害統計(FBI/IC3 年次、警察庁統計) | 高 | [ic3.gov](https://www.ic3.gov/) / [警察庁](https://www.npa.go.jp/) |

---

## TODO・未確認事項(一覧)

- **NIST AI 100-4 本文全文が未取得**(PDF が WebFetch でバイナリ非展開)。検出/透かしの限界の要点は公式出版ページ要旨・検索要約で確認したが、docs で引用する前に PDF 本文の該当箇所を直接確認する
- **NSA/CISA/FBI 等の CSI「Content Credentials」PDF が 403**。所在(media.defense.gov の URL)は確認済み。本文は未取得 → ブラウザで確認
- **FTC 消費者アラート本文が 403**。かけ直し・合言葉の助言は検索要約で確認。施行日など規則の細目は FTC 公式で要確認(検索要約に日付の揺れ: 政府・事業者規則の施行時期)
- **ISO/DIS 22144** の最終ステータス(DIS のままか IS 発行済みか)は iso.org で要確認(現状 `二次情報`)
- 日本の **金融庁・NISC** のディープフェイク/なりすまし個別注意喚起は本調査で一次ページを特定できず(`未確認`)。必要なら fsa.go.jp / nisc.go.jp を追確認
- 透かし・検出器の **具体的な回避耐性の数値** は各社自己申告であり、記事では性能値を断定に用いない方針を維持する
