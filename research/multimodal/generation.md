# 画像生成・動画生成の提供状況 調査メモ

- **調査日:** 2026-07-08
- **用途:** MULTIMODAL 計画 Z-1 の裏付け。`docs/12-multimodal/image-generation-integration.md`(画像生成のプロダクト組み込み)および `docs/12-multimodal/video-ai-overview.md`(動画生成・理解の概観)執筆前調査
- **注意:** 生成モデルの顔ぶれ・商用利用条件・来歴(プロビナンス)機能は **変化が非常に速い**。本メモは **2026-07-08 時点のスナップショット** であり、優劣比較(スコア・作例・「どれが綺麗か」)は一切行わない。扱うのは **提供形態・商用利用条件・来歴機能の有無** のみ。実装・契約時は必ず各社の一次情報を再確認すること
- **根拠:** 各ベンダーの公式ドキュメント・公式ブログ・利用規約ページのみを一次情報として採用。まとめ記事・SNS は原則不採用(採用時は確度「二次情報」と明記)

## 確度マーカーの定義

| マーカー | 意味 |
| --- | --- |
| `公式確認済み` | 公式ページを直接取得し、本文に明記があることを確認した |
| `ベンダー自己報告` | 公式ページの記載だが、第三者検証が困難な自己申告(例: 学習データの出所、透かしの堅牢性) |
| `二次情報` | 公式以外(まとめ記事・第三者 API 提供者など)を根拠にした情報 |
| `未確認` | 直接確認できなかった。確認先 URL を残す |

> **TODO(要確認):** 本メモの全項目は 2026-07-08 に取得。docs 本文へ反映する前に、少なくともモデル名・提供形態・来歴機能の 3 点を各公式ページで再確認する(最終確認: 2026-07)

---

## A. 画像生成

### A-1 / A-2. 主要な提供の類型と機能

提供形態を「API 提供」「統合サービス」「オープンウェイト(自ホスト可)」の 3 類型で整理します。機能は text-to-image(t2i)/ 画像編集(インペインティング=マスク領域の再生成、アウトペインティング=画像外側の拡張)/ バリエーション / 参照画像・スタイル制御 の提供有無で見ます(優劣は評価しない)。

| 代表例(2026-07 実在) | 提供形態の類型 | 機能(公式ドキュメント記載) | 出典(公式) | 確度 |
| --- | --- | --- | --- | --- |
| OpenAI **GPT Image**(`gpt-image-1` / `-mini` / `-1.5`、`gpt-image-2`) | API 提供 | t2i / 画像編集(部分・全体)/ マスクによるインペインティング / 参照画像による生成。エンドポイントは Generations と Edits の 2 系統 | [image-generation guide](https://developers.openai.com/api/docs/guides/image-generation)、[gpt-image-1 model](https://developers.openai.com/api/docs/models/gpt-image-1) | 公式確認済み |
| Google **Imagen**(Gemini API / Vertex AI 経由) | API 提供 | t2i、画像数・サイズ・アスペクト比・人物生成設定の制御。**Imagen モデルは 2026-08-17 に停止予定**、Nano Banana への移行を推奨 | [Imagen docs](https://ai.google.dev/gemini-api/docs/imagen) | 公式確認済み |
| Google **Nano Banana**(Gemini ネイティブ画像、`Gemini Flash Image` 系) | API 提供(Gemini API / AI Studio / Vertex AI) | t2i / テキスト指示による画像編集(追加・削除・スタイル転写・インペインティング)/ 最大 14 枚の参照画像合成 | [image-generation docs](https://ai.google.dev/gemini-api/docs/image-generation) | 公式確認済み |
| Adobe **Firefly** | 統合サービス(Web / Creative Cloud)+ API | t2i、生成塗りつぶし(Generative Fill=インペインティング相当)、拡張などの編集系 | [Firefly FAQ](https://helpx.adobe.com/firefly/web/get-started/learn-the-basics/adobe-firefly-faq.html) | 公式確認済み(直接取得はタイムアウト、検索スニペット経由で確認) |
| Amazon **Nova Canvas**(Amazon Bedrock) | API 提供 | t2i、画像編集 | [Nova Canvas AI Service Card](https://docs.aws.amazon.com/ai/responsible-ai/nova-canvas/overview.html)、[model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-canvas.html) | 公式確認済み |
| Stability AI **Stable Diffusion 3.5** 系 | オープンウェイト(自ホスト可)+ Platform API | t2i(派生モデル・LoRA による編集/制御が広く存在) | [Stability AI License](https://stability.ai/license)、[SD3.5 発表](https://stability.ai/news-updates/introducing-stable-diffusion-3-5) | 公式確認済み |
| Black Forest Labs **FLUX**(`FLUX.1 [schnell]` / `[dev]` / `Kontext [dev]`、`FLUX.2` 系) | オープンウェイト(自ホスト可)+ API | t2i、FLUX.1 Kontext は画像編集(参照画像ベース)向け | [BFL Licensing](https://bfl.ai/licensing) | 公式確認済み |
| **Midjourney** | 統合サービス(Web / Discord)。公式の汎用パブリック API は 2026-07 時点で確認できず | t2i、バリエーション、編集系(公式ドキュメント参照) | [Midjourney ToS](https://docs.midjourney.com/hc/en-us/articles/32083055291277-Terms-of-Service) | 公式確認済み(サービス提供)/ API 有無は `未確認` |

**類型のまとめ(事実):**
- **API 提供型** … OpenAI GPT Image / Google Imagen・Nano Banana / Amazon Nova Canvas。プロダクト組み込みは HTTP API 呼び出しが基本
- **統合サービス型** … Adobe Firefly / Midjourney。UI 中心。Firefly は API も提供
- **オープンウェイト型** … Stable Diffusion 系 / FLUX。重みをダウンロードして自ホスト可能。編集・制御は派生モデルや ControlNet 系エコシステムで拡張(本メモでは各社公式の範囲のみ記載)

> **TODO(要確認):** Midjourney の公式 API 提供状況(2026-07 時点でパブリック API が一般提供されているか)を [docs.midjourney.com](https://docs.midjourney.com/) で確認する(最終確認: 2026-07)

### A-3. 商用利用条件(断定しない・確認先を示す)

生成物の商用利用可否・権利帰属・規約上の制約は **各社規約による**。以下は公式ページに記載のある要点で、法的助言ではない。実際の可否は各 terms を要確認。

| ベンダー | 公式記載の要点(事実) | 確度 |
| --- | --- | --- |
| OpenAI(GPT Image) | 画像生成ガイドには商用条件・所有権の記載なし。利用条件は OpenAI の利用規約(Terms of use / Business terms)側で規定 | 公式確認済み(ガイドに記載なし)/ 規約細目は `各社規約で要確認` |
| Google(Imagen / Nano Banana) | 画像生成ドキュメントは利用規約・Prohibited Use Policy を参照させる形。細目は Gemini API 追加利用規約側 | 公式確認済み(参照指示あり)/ 規約細目は `各社規約で要確認` |
| Adobe Firefly | beta ラベルのない機能の生成物は商用プロジェクトで利用可。初期の商用モデルは Adobe Stock・オープンライセンス素材・著作権切れのパブリックドメインで学習と説明。IP 補償(indemnification)は主に Enterprise / API 文脈で提供 | 商用可否=公式確認済み / 学習データ=`ベンダー自己報告` |
| Amazon Nova Canvas | 広告・ブランディング・製品デザイン等の商用ユースケースを明示。**一般提供の Nova モデル出力に上限なし(uncapped)の IP 補償**を AWS Service Terms §50.10 で提供 | 公式確認済み |
| Stability AI(SD3.5 系) | Community License により **年間収益 100 万ドル未満**の個人・組織は商用含め無償利用可。**100 万ドル以上は Enterprise License が必要**。ユーザーは **出力の所有権を保持**。ただし Core Models を用いた競合基盤モデルの作成は不可 | 公式確認済み |
| Black Forest Labs FLUX | `FLUX.1 [schnell]` は **Apache 2.0**(商用可)。`FLUX.1 [dev]` / `Kontext [dev]` は **非商用ライセンス**で、商用は API 利用(全用途で商用権付き)か自ホスト用の商用ライセンス(Builder / Platform / Enterprise 各層、セルフサーブ購入可)が必要 | 公式確認済み |
| Midjourney | 生成物はユーザーが所有(サブスク解約後も継続)。ただし **年商 100 万ドル超の事業者は商用利用に Pro / Mega プランが必要**。著作権の個別判断は弁護士に相談を、と明記 | 公式確認済み |

**共通の注意(事実):** 「生成物の権利帰属」「学習データの出所」「著作権侵害の免責(indemnity)」は各社で条件が大きく異なり、かつ改定が頻繁。**断定せず各社 terms を確認先として提示する**方針を docs 本文でも維持する。詳細 URL は後掲「商用利用・権利の確認先」表を参照。

### A-4. 来歴・透明性機能(C2PA / Content Credentials / 電子透かし)

「公式に明記があるか」を基準に確認。明記がなければ「公式に明言なし」とする。

| ベンダー | C2PA / Content Credentials | 電子透かし(watermark) | 出典(公式) | 確度 |
| --- | --- | --- | --- | --- |
| OpenAI(DALL·E / GPT Image) | 生成画像に C2PA メタデータを付与(ヘルプ記事「C2PA and SynthID in OpenAI-generated images」で説明) | 同記事で SynthID の利用に言及 | [help article 8912793](https://help.openai.com/en/articles/8912793-c2pa-and-synthid-in-openai-generated-images)(本文取得は 403、記事タイトルで確認) | ベンダー自己報告(本文未取得・記事タイトルと検索スニペットで確認) |
| Google(Imagen / Nano Banana) | 画像生成ドキュメントに **C2PA の記載なし(公式に明言なし)** | **全生成画像に SynthID 透かし**を付与と明記 | [Imagen docs](https://ai.google.dev/gemini-api/docs/imagen)、[image-generation docs](https://ai.google.dev/gemini-api/docs/image-generation) | SynthID=公式確認済み / C2PA=公式に明言なし |
| Adobe Firefly | **Firefly で 100% のピクセルが生成された画像に Content Credentials(C2PA 準拠)を自動付与**。Adobe は CAI 創設メンバー | Content Credentials(耐タンパーのメタデータ)。可視ウォーターマークではなく来歴メタデータが中心 | [Content Credentials overview](https://helpx.adobe.com/firefly/web/get-started/learn-the-basics/content-credentials-overview.html) | 公式確認済み(検索スニペット経由、直接取得はタイムアウト) |
| Amazon Nova Canvas | **C2PA ベースの Content Credentials を付与**(モデル・プラットフォーム・タスク種別を含む) | **全生成画像に不可視ウォーターマーク**を付与。検出ソリューションで判定可能 | [Nova Canvas AI Service Card](https://docs.aws.amazon.com/ai/responsible-ai/nova-canvas/overview.html) | 公式確認済み |
| Stability AI(SD3.5 系) | 公式ライセンス/発表に C2PA 必須の明記は確認できず(オープンウェイト自ホストのため付与は実装依存) | 同上。透かしは実装側の責任 | [Stability AI License](https://stability.ai/license) | 未確認(オープンウェイト特性上、来歴付与は自ホスト実装に依存) |
| Black Forest Labs FLUX | 公式ライセンスページで C2PA/透かしの明記は確認できず(オープンウェイトは実装依存) | 同上 | [BFL Licensing](https://bfl.ai/licensing) | 未確認 |
| Midjourney | 公式ドキュメントで C2PA 対応の明記は本調査では確認できず | 同上 | [Midjourney docs](https://docs.midjourney.com/) | 未確認 |

**重要な観察(事実):** オープンウェイト型(Stable Diffusion / FLUX)は、モデル自体は来歴機能を保証しない。**来歴・透かしを求める場合は自ホスト側での C2PA 署名・SynthID 相当の実装が必要**という設計判断ポイントがある(docs 本文で強調候補)。

---

## B. 動画生成・理解

### B-5. 動画生成(text-to-video)

主要モデルの類型・提供形態・尺/解像度の一般的制約・音声同期の有無(2026-07 時点)。数値は各公式ドキュメントの記載で、モデル改定で頻繁に変わる。

| 代表例(2026-07 実在) | 提供形態 | 尺 / 解像度(公式記載) | 音声同期 | 出典(公式) | 確度 |
| --- | --- | --- | --- | --- | --- |
| OpenAI **Sora**(`sora-2` / `sora-2-pro`) | API 提供 + アプリ(sora.com) | ガイド記載で 16・20 秒生成に対応、720p / 1080p(1280x720、1920x1080、縦型 1080x1920 等)。1080p は `sora-2-pro` 推奨 | あり(音声付きクリップ生成) | [video-generation guide](https://developers.openai.com/api/docs/guides/video-generation)、[sora-2 model](https://developers.openai.com/api/docs/models/sora-2) | 公式確認済み |
| Google **Veo**(`Veo 3.1` / `Fast` / `Lite`) | API 提供(Gemini API / AI Studio / Vertex AI) | 4 / 6 / 8 秒。720p、1080p(8 秒のみ)、4k(8 秒のみ)。t2v / 画像→動画(i2v)/ 動画→動画(v2v) | **常時オン**でネイティブ音声(台詞・効果音・環境音) | [Veo docs](https://ai.google.dev/gemini-api/docs/veo)、[DeepMind Veo](https://deepmind.google/models/veo/) | 公式確認済み |
| **Runway**(Gen-4 / Gen-4.5 系) | API 提供 + アプリ | 尺・解像度はプラン/モデル依存(公式ヘルプ参照) | モデル・機能による(公式ヘルプ参照) | [Runway API docs](https://docs.dev.runwayml.com/)、[Usage rights](https://help.runwayml.com/hc/en-us/articles/18927776141715-Usage-rights) | 提供形態=公式確認済み / 尺・音声細目=`未確認`(要ヘルプ確認) |
| **Luma**(Ray / Dream Machine、`Ray3` 系) | API 提供 + アプリ | 5 / 10 秒などクレジット課金(公式ドキュメント参照)。解像度は 540p〜(HDR/EXR 等) | モデルによる(公式ドキュメント参照) | [Luma API terms](https://lumalabs.ai/dream-machine/api/terms)、[Video Generation docs](https://docs.lumalabs.ai/docs/video-generation) | 提供形態・課金=公式確認済み / 尺・音声細目=`未確認` |
| Amazon **Nova Reel**(1.0 / 1.1、Bedrock) | API 提供 | Reel 1.0=最大 6 秒、Reel 1.1=最大 120 秒(6 秒ショットの結合、Single/Multi-shot)。入力画像は 1280x720。**英語プロンプトのみ** | **なし**(音声・3D 非対応と明記) | [Nova Reel AI Service Card](https://docs.aws.amazon.com/ai/responsible-ai/nova-reel/overview.html) | 公式確認済み |
| **Kling**(Kuaishou) | サービス/アプリ。**公式パブリック API は 2026-07 時点で未確認**(第三者提供が存在) | 尺・解像度はプラン依存 | モデルによる | [kling.ai](https://kling.ai/)(公式)/ API・透かし情報は第三者記事 | サービス存在=二次情報寄り / API・詳細=`未確認` |

**動画生成の商用利用・来歴(事実):**

| ベンダー | 商用利用(公式記載) | 来歴 / 透かし(公式記載) | 出典 | 確度 |
| --- | --- | --- | --- | --- |
| OpenAI Sora | 商用条件は OpenAI 利用規約側。生成物利用は規約準拠 | **全 Sora 動画に C2PA メタデータ**、sora.com/アプリからのダウンロードには可視ウォーターマーク、内部検出ツールも保有 | [Sora system card](https://openai.com/index/sora-is-here/)、[advancing-content-provenance](https://openai.com/index/advancing-content-provenance/)(403) | C2PA/透かし=ベンダー自己報告(公式ブログ、本文取得は 403・検索スニペットで確認) |
| Google Veo | 各利用規約に準拠 | **Veo 生成動画は SynthID で透かし**、SynthID 検証プラットフォームで確認可。C2PA の明記は確認できず | [Veo docs](https://ai.google.dev/gemini-api/docs/veo) | SynthID=公式確認済み / C2PA=公式に明言なし |
| Runway | 全プランで生成物はユーザー所有・非商用制限なしと明記 | C2PA/透かしの明記は本調査で確認できず | [Usage rights](https://help.runwayml.com/hc/en-us/articles/18927776141715-Usage-rights)、[Commercial use](https://help.runwayml.com/hc/en-us/articles/21668707517587-Can-I-use-the-content-I-made-in-Runway-for-commercial-purposes) | 商用=公式確認済み / 来歴=`未確認` |
| Luma | ToS 3.1 に基づき商用アプリ接続を許可、IP 侵害クレームの防御・補償を提供と記載 | 来歴機能の明記は本調査で確認できず | [Luma API terms](https://lumalabs.ai/dream-machine/api/terms) | 商用=公式確認済み / 来歴=`未確認` |
| Amazon Nova Reel | 広告・ブランディング等の商用ユースケースを明示。一般提供 Nova 出力に uncapped IP 補償(Service Terms §50.10) | **全生成動画に不可視ウォーターマーク**、Reel 1.1 は **C2PA Content Credentials** を付与(Verify 等で確認可) | [Nova Reel AI Service Card](https://docs.aws.amazon.com/ai/responsible-ai/nova-reel/overview.html) | 公式確認済み |
| Kling | 有料プランで商用可・透かし除去可、無料は不可(いずれも第三者記事) | 可視ロゴ + SynthID 系不可視透かし(第三者記事) | 第三者記事のみ | 二次情報 |

> **TODO(要確認):** Kling(Kuaishou)の**公式**な API 提供状況・商用条件・透かし仕様を [kling.ai](https://kling.ai/) の公式規約で確認する。現状の記載は第三者(API 再販業者・まとめ記事)由来で確度が低い(最終確認: 2026-07)

### B-6. 動画理解(video understanding)

動画入力の方式(フレームサンプリング / ネイティブ動画入力)とコスト構造の一般論。代表として Gemini API を一次情報で確認。

**方式の類型(事実):**
- **フレームサンプリング型** … 動画から N 枚のフレームを抽出し、各フレームを画像として VLM に入力する。多くの汎用 VLM で用いる一般的手法。コストは「抽出フレーム数 × 1 フレームあたりトークン」で概算でき、フレーム数(FPS × 秒数)が支配的
- **ネイティブ動画入力型** … API が動画ファイルを直接受け取り、内部でフレーム(+ 音声)をトークン化する。Gemini API が代表例

**Gemini API の動画理解(公式確認済み):**

| 項目 | 公式記載の内容 | 出典 | 確度 |
| --- | --- | --- | --- |
| 入力方式 | File API(20MB 超は必須推奨、大容量・再利用向け)/ インラインデータ(Base64)/ YouTube URL(プレビュー)の 3 経路 | [video-understanding docs](https://ai.google.dev/gemini-api/docs/video-understanding) | 公式確認済み |
| 既定サンプリング | 既定 **1 FPS**。急な動き・シーン変化の多い動画では見落としの可能性 | 同上 | 公式確認済み |
| FPS 変更 | `videoMetadata` に `fps` 引数を渡してカスタムサンプリング可能(公式ドキュメント記載)。※直接取得時の要約では「変更不可」と誤要約されたが、検索スニペット上の公式記載では変更可 | 同上 | 公式確認済み(要 docs 側で再確認) |
| トークン構造 | 既定解像度で **約 258 トークン/フレーム**、低解像度で 66 トークン/フレーム、音声 32 トークン/秒。合計で概ね **既定 300 トークン/秒・低解像度 100 トークン/秒** | 同上 | 公式確認済み |
| 解像度制御 | `media_resolution` パラメータで 1 画像/フレームあたりの最大トークンを制御。高解像度ほど細部認識は上がるがトークン・レイテンシ増 | 同上 | 公式確認済み |

**コスト構造の一般論(事実):** 動画理解のコストは「**尺(秒)× サンプリング FPS × フレームあたりトークン + 音声トークン**」で概算できる。長尺動画・高 FPS・高 `media_resolution` はトークンが急増するため、**必要最小の FPS/解像度に落とす**のが基本的なコスト最適化(docs 本文の設計判断ポイント候補)。

> **TODO(要確認):** Gemini 以外(他社 VLM)のネイティブ動画対応可否とトークン課金体系を各公式ドキュメントで確認する。本メモでは Gemini のみ一次情報で確認済み(最終確認: 2026-07)

---

## 商用利用・権利の確認先

法的論点は断定せず、**確認先 URL** として提示する(各社改定頻度が高い。実装・契約時に必読)。

| ベンダー / 製品 | 確認先(公式 terms / ライセンス) | 補足 |
| --- | --- | --- |
| OpenAI(GPT Image / Sora) | https://openai.com/policies/ (利用規約・Business terms・Usage policies) | 生成物の利用条件・所有権は規約側で規定 |
| Google(Imagen / Nano Banana / Veo) | https://ai.google.dev/gemini-api/terms (Gemini API 追加利用規約)、Prohibited Use Policy | 画像/動画ドキュメントから参照される |
| Adobe Firefly | https://helpx.adobe.com/firefly/web/get-started/learn-the-basics/adobe-firefly-faq.html | 商用可否・学習データ・IP 補償の説明 |
| Amazon Nova(Canvas / Reel) | https://aws.amazon.com/service-terms/ (§50.10 IP 補償ほか) | uncapped IP indemnity の根拠条項 |
| Stability AI(SD3.5 系) | https://stability.ai/license | 年商 100 万ドル閾値・出力所有権・Enterprise 条件 |
| Black Forest Labs FLUX | https://bfl.ai/licensing 、https://bfl.ai/legal/non-commercial-license-terms | schnell=Apache2.0 / dev=非商用 / 商用は API か商用ライセンス |
| Midjourney | https://docs.midjourney.com/hc/en-us/articles/32083055291277-Terms-of-Service 、https://docs.midjourney.com/hc/en-us/articles/27870375276557-Using-Images-Videos-Commercially | 年商 100 万ドル超は Pro/Mega 必須 |
| Runway | https://help.runwayml.com/hc/en-us/articles/18927776141715-Usage-rights | 生成物はユーザー所有 |
| Luma | https://lumalabs.ai/dream-machine/api/terms 、https://lumalabs.ai/learning-hub/licensing | ToS 3.1 商用許可・IP 補償 |
| Kling(Kuaishou) | https://kling.ai/ (公式規約を要特定) | 公式条文の直接確認が未了(`未確認`) |

**共通注意:** 「商用可否」「権利帰属」「学習データ由来の侵害リスク・免責」は、同一ベンダー内でもプラン(無料/有料/Enterprise)や機能(GA/beta)で条件が分岐する。docs 本文では **「各社規約で要確認」を明示し、断定を避ける**方針を維持する。

---

## 来歴・透かし機能の対応状況

「公式に明記があるか」で判定。明記がなければ「公式に明言なし」または `未確認`。

| ベンダー / 製品 | C2PA / Content Credentials | 電子透かし | 確度 |
| --- | --- | --- | --- |
| OpenAI GPT Image | 付与(ヘルプ記事で説明) | SynthID 利用に言及 | ベンダー自己報告(本文 403・タイトル/スニペット確認) |
| OpenAI Sora | 全動画に C2PA メタデータ | 可視ウォーターマーク(配布物)+ 内部検出 | ベンダー自己報告 |
| Google Imagen / Nano Banana(画像) | 公式に明言なし | 全画像に SynthID | SynthID=公式確認済み / C2PA=明言なし |
| Google Veo(動画) | 公式に明言なし | 全動画に SynthID(検証プラットフォームあり) | SynthID=公式確認済み / C2PA=明言なし |
| Adobe Firefly | Content Credentials(C2PA 準拠)を 100% 生成画像に自動付与 | 来歴メタデータ中心 | 公式確認済み(スニペット経由) |
| Amazon Nova Canvas(画像) | C2PA Content Credentials 付与 | 全画像に不可視ウォーターマーク | 公式確認済み |
| Amazon Nova Reel(動画) | Reel 1.1 で C2PA Content Credentials 付与 | 全動画に不可視ウォーターマーク | 公式確認済み |
| Stability AI(SD3.5 系) | 公式ライセンスに必須明記なし(自ホスト実装依存) | 実装依存 | 未確認 |
| Black Forest Labs FLUX | 公式に明記確認できず(自ホスト実装依存) | 実装依存 | 未確認 |
| Midjourney | 公式明記を本調査で確認できず | — | 未確認 |
| Runway / Luma / Kling | 公式明記を本調査で確認できず(Kling は第三者記事で SynthID 系透かし言及) | Runway/Luma=未確認、Kling=二次情報 | 未確認 / 二次情報 |

**設計上の含意(事実):**
- **クラウド API 型の主要各社**(OpenAI・Google・Adobe・Amazon)は、来歴(C2PA)または透かし(SynthID / 不可視透かし)を **既定で付与**する方向。特に Google は SynthID、Adobe/Amazon は C2PA を軸にする違いがある
- **オープンウェイト型**(Stable Diffusion / FLUX)は来歴を保証しない。プロダクトに組み込む際は **自ホスト側で C2PA 署名等の来歴付与を別途実装**する必要がある

---

## 変わりやすい項目(定点観測)

以下は 3〜6 か月単位で陳腐化しやすい。docs 反映後も定期的に一次情報で再確認する。

| 項目 | 変わりやすさ | 再確認先 |
| --- | --- | --- |
| モデル名・世代(gpt-image-*、Veo 3.x、Imagen→Nano Banana など) | 高。**Imagen は 2026-08-17 に停止予定**の実例あり | 各公式モデルドキュメント |
| 尺・解像度・音声対応の上限(Sora の秒数、Veo の 4k/1080p 条件、Nova Reel の 120 秒 等) | 高 | 各公式生成ドキュメント |
| 料金・課金単位(トークン/クレジット/画像・動画単価) | 高。本メモでは優劣比較回避のため価格は最小限 | 各公式 pricing |
| 商用利用の閾値(Stability/Midjourney の年商 100 万ドル等)・IP 補償範囲 | 中〜高 | 各社 terms(上表) |
| 来歴機能(C2PA 採用範囲、SynthID の対象拡大、可視/不可視透かしの仕様) | 中〜高 | 各社 Responsible AI / provenance ページ |
| 動画理解のトークン単価・既定 FPS・media_resolution の既定値 | 中 | [Gemini video-understanding docs](https://ai.google.dev/gemini-api/docs/video-understanding) |
| オープンウェイトのライセンス改定(FLUX の層別条件、SD の Community License 条項) | 中 | [BFL Licensing](https://bfl.ai/licensing)、[Stability License](https://stability.ai/license) |

---

## TODO・未確認事項(一覧)

- OpenAI のヘルプ記事「C2PA and SynthID in OpenAI-generated images」本文は WebFetch が 403。記事タイトルと OpenAI 公式ブログの検索スニペットで内容確認済みだが、docs 反映前にブラウザで本文を直接確認する
- Adobe の Firefly FAQ / Content Credentials overview は WebFetch がタイムアウト。検索スニペット(公式ページ由来の引用)で確認したが、docs 反映前に本文を直接確認する
- Midjourney の公式パブリック API 提供状況が `未確認`
- Kling(Kuaishou)の公式規約・API・透かし仕様が `未確認`(現状の記載は第三者由来 = 二次情報)
- Runway / Luma の尺・解像度・音声対応の細目と来歴機能の有無が `未確認`(公式ヘルプでの追確認が必要)
- Stability AI / FLUX の来歴機能はオープンウェイト特性上 `未確認`(自ホスト実装依存)
