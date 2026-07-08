# リアルタイム視覚入力(マルチモーダル)+ 単体 TTS の提供状況(2026-07-08 時点)調査メモ

- **調査日**: 2026-07-08
- **調査目的**: MULTIMODAL 計画 **Z-2** の裏付け資料。リアルタイム API の「視覚(画面・カメラ・映像)入力」の対応状況と、読み上げ・ナレーション用途の「単体 TTS(text-to-speech)」の提供状況を、公式一次情報を軸に整理する
- **分担(重複回避)**: speech-to-speech / realtime **音声** API の基礎(VAD・ターン検出・割り込み・接続方式 WebRTC/WebSocket/SIP・音声セッション中の function calling・レイテンシ設計)は既存メモ [`research/professional/voice-agents.md`](../professional/voice-agents.md)(2026-07-07)が正本です。本メモは **その差分**、すなわち (A) 視覚(映像)入力ストリーミングと (B) 単体 TTS のみを扱い、音声基礎は繰り返しません
- **注意**: リアルタイム API と TTS の提供状況(モデル名・対応言語・上限値・音声クローンの条件)は変化が速い領域です。本メモは **2026-07-08 のスナップショット**であり、記事執筆時は必ず各社公式で再確認してください(§「変わりやすい項目」参照)
- **確度マーカー(4 段階)**:
  - `公式確認済み` = 公式ドキュメント URL に実際にアクセスし、本文の記述を確認した
  - `ベンダー自己報告` = 公式ブログ・製品ページ・マーケティングページの自己申告(独立検証はしていない)
  - `二次情報` = 検索結果の要約・第三者(SDK ベンダー等)ドキュメント経由で、一次ページ本文を直接確認できていない
  - `未確認` = 今回確認できず(確認先 URL を残す)

---

## A. リアルタイムマルチモーダルの「視覚」入力(音声は既知なので差分のみ)

### A.1 各社の映像(カメラ・画面)入力の対応状況

要点: **「連続ストリーム入力」を公式に掲げるのは Google Gemini Live のみ**ですが、その実体は「連続動画」ではなく**低フレームレートの静止画フレーム列(最大 1 fps)**です。OpenAI Realtime は「離散的な画像(スクリーンショット等)の会話への差し込み」を公式サポートしますが、native な連続映像入力は提供していません(連続映像は SDK 側のフレームサンプリングで実現)。Amazon Nova 2 Sonic・Claude は視覚のリアルタイム入力の記載を確認できませんでした。

| ベンダー / API | 映像(カメラ・画面)の連続入力 | 入力方式・制約 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- | --- |
| **Google Gemini Live API** | あり(公式が「low-latency, real-time voice and **vision** interactions」と明記)。ただし連続動画ではなく**画像フレーム列** | 「Video frames are sent as individual images (e.g., JPEG or PNG) at a specific frame rate (**max 1 frame per second**)」。`send_realtime_input` に `video=types.Blob(data=frame, mime_type="image/jpeg")` の形で送る。カメラ・画面いずれもフレーム画像化して送る点は同じ | https://ai.google.dev/gemini-api/docs/live-api/capabilities | 2026-07-08 | 公式確認済み |
| **OpenAI Realtime API** | **native な連続映像入力は「なし」**。離散的な画像(写真・スクリーンショット)を会話に差し込む形は「あり」 | 画像は `conversation.item.create` のユーザメッセージ content part として `type: "input_image"`, `image_url: "data:image/{format};base64,..."` で追加。アプリが「どの画像をいつ見せるか」を制御する設計。`gpt-realtime` / `gpt-realtime-2` 系が画像入力に対応 | https://developers.openai.com/api/docs/guides/realtime-conversations | 2026-07-08 | 公式確認済み |
| OpenAI Realtime API(連続映像を「実現する」パターン) | SDK/フレームワーク層で「カメラ・画面のフレームを 1 枚ずつ画像メッセージとして送る」ことで擬似的に実現 | LiveKit の OpenAI Realtime プラグイン解説では「ユーザ発話中は 1 fps、それ以外は 3 秒に 1 フレームをサンプリングして画像として送る」既定挙動を紹介。**これは OpenAI 公式仕様ではなく統合レイヤの実装**である点に注意 | https://docs.livekit.io/agents/models/realtime/plugins/openai/ | 2026-07-08 | 二次情報 |
| **Amazon Nova 2 Sonic** | リアルタイム**視覚**入力の記載を確認できず(speech-to-speech 音声モデルとしての位置づけ) | Nova 2 Sonic は「統合された音声理解・生成」の speech-to-speech(voice-agents.md §2.3)。ライブ映像入力の公式記述は今回未確認。静止画理解は Nova の別モデル(Nova Pro 等の Understanding 系)側の話であり、Sonic のリアルタイムセッションとは別 | https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-conversational-speech.html | 2026-07-08 | 未確認(視覚のリアルタイム入力の記載を確認できず) |
| **Anthropic Claude** | native な realtime 視覚ストリーミング入力は確認できず | Claude は画像入力(vision)を Messages API で受けるが、これは**リクエスト単位の静止画**であって realtime セッションの連続入力ではない。realtime 音声 API 自体が未提供(voice-agents.md §2.4) | https://platform.claude.com/cookbook/third-party-elevenlabs-low-latency-stt-claude-tts | 2026-07-08 | 未確認(realtime 視覚入力の記載を確認できず) |

**執筆用の整理(差分の核):**

- 「リアルタイム動画をそのままストリーム」できる汎用 API は 2026-07 時点では確認できません。Gemini Live ですら**フレームを静止画に落として最大 1 fps** で送る方式です。記事では「カメラ・画面の"映像"入力 = 実際には低頻度の静止画フレーム列」という設計上の実態を明示するのが安全です。
- OpenAI Realtime は「画像を会話に差し込む(discrete)」が公式で、**連続映像は SDK/フレームワークがフレームサンプリングで肩代わり**します(1 fps 前後)。「native 連続映像」と「フレームサンプリング擬似連続」を混同しないこと。
- カメラ入力も画面共有入力も、API から見れば「画像フレームを送る」点で同じ扱いになります(画面共有専用の入力タイプがあるわけではない)。

### A.2 視覚 + 音声の同時ストリーミングのセッション制約・コスト構造(差分・他社補完)

voice-agents.md で既知の「Gemini Live: 音声のみ 15 分 / 音声+動画 2 分」は再掲しません。ここではその**背景と一般論**を差分として補います。

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Gemini Live で「音声+動画」セッションが **2 分**と音声のみ(15 分)より大幅に短いのは、**映像フレームがトークン消費を押し上げる**ため。映像を足すと同一時間あたりの入力トークン量が増え、コンテキスト長・課金・セッション上限のいずれにも効く(公式は上限値のみ明記、理由は構造的推測) | https://ai.google.dev/gemini-api/docs/live-api/capabilities | 2026-07-08 | 公式確認済み(上限値)/ 二次情報(理由の一般論) |
| 映像入力は「1 fps の静止画列」であっても、1 フレームが画像トークンとして課金・コンテキスト計上される。**フレームレートを上げるほど線形にコスト増**という構造は各社共通(画像入力課金の一般則) | https://ai.google.dev/gemini-api/docs/live-api/capabilities | 2026-07-08 | 二次情報(一般論) |
| OpenAI Realtime での画像差し込みは「連続」ではなくアプリ判断のタイミングで送る設計。これは**コスト面でも合理的**(必要な瞬間だけ画像トークンを消費)で、公式も「どの画像をいつ見せるか制御できる」ことを利点として提示 | https://developers.openai.com/api/docs/guides/realtime-conversations | 2026-07-08 | 公式確認済み(制御できること)/ 二次情報(コスト観点の解釈) |
| 具体的なトークン単価・映像フレーム 1 枚あたりの課金量は、各社の料金ページで頻繁に更新されるため本メモでは数値を断定しない | https://ai.google.dev/gemini-api/docs/pricing / https://openai.com/api/pricing/ | 2026-07-08 | 未確認(数値は執筆時に要取得) |

**執筆用の整理:** 「音声+視覚の同時ストリーミングは、視覚を足した瞬間にセッション上限が縮み・コストが跳ねる」という設計トレードオフが差分の要点です。実装指針としては「常時フル fps でカメラを流す」のではなく「必要な瞬間だけフレームを送る / fps を落とす」設計が、上限・コスト両面で定石になります。

---

## B. 音声合成(TTS)単体 — 読み上げ・ナレーション用途

voice-agents.md がカバーしない「speech-to-speech ではない、テキスト → 音声の単体 TTS」を扱います。優劣比較(どれが自然か)はしません。**提供の有無・機能の有無**のみ。

### B.1 主要 TTS の提供類型(提供形態・ストリーミング対応)

| サービス | 提供形態 | ストリーミング TTS | 主なモデル/エンジン(2026-07) | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- | --- | --- |
| **OpenAI TTS** | REST API(`/audio/speech`)。マネージド API のみ | あり(chunk transfer encoding によるリアルタイムストリーミング。最速化には `wav` / `pcm` 推奨) | `gpt-4o-mini-tts`(realtime 向け推奨)、`tts-1`(低レイテンシ)、`tts-1-hd`(高品質) | https://developers.openai.com/api/docs/guides/text-to-speech | 2026-07-08 | 公式確認済み |
| **Google Cloud Text-to-Speech** | GCP マネージド API。REST / gRPC | あり(Chirp 3: HD voices が `streaming_synthesize` によるストリーミング TTS に対応、GA) | Chirp 3: HD voices(GA、8 speakers × 31 locales)、従来の Neural2 / WaveNet / Standard も併存 | https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd | 2026-07-08 | 二次情報(公式ドキュメント要約) |
| **Amazon Polly** | AWS マネージド API | あり。特に **`StartSpeechSynthesisStream`**(双方向ストリーミング)は現状 generative エンジン専用。SSML/プレーンテキストを逐次送り、生成音声を逐次受信 | エンジン 4 種: Generative / Long-form / Neural / Standard(音声ごとに対応エンジンが異なる) | https://docs.aws.amazon.com/polly/latest/dg/generative-voices.html / https://docs.aws.amazon.com/polly/latest/APIReference/API_StartSpeechSynthesisStream.html | 2026-07-08 | 二次情報(公式ドキュメント要約) |
| **Microsoft Azure AI Speech(Text to speech)** | Azure マネージド API(REST / Speech SDK) | あり(SDK でリアルタイム合成、SSML 入力対応) | 標準(prebuilt neural voices)+ Custom Voice(カスタム。§クローン表参照) | https://learn.microsoft.com/en-us/azure/ai-services/speech-service/custom-neural-voice | 2026-07-08 | 公式確認済み(Custom Voice ページ経由) |
| **ElevenLabs** | マネージド API(REST + WebSocket) | あり(WebSocket ストリーミング TTS。部分テキストから逐次音声生成、word-to-audio alignment 情報も取得可能) | 複数世代の TTS モデル(例: `eleven_v3` 等。世代更新が速い) | https://elevenlabs.io/docs/eleven-api/guides/how-to/websockets/realtime-tts | 2026-07-08 | 二次情報(公式ドキュメント要約) |

**執筆用の整理:** 主要 5 サービスはいずれも「マネージド API + ストリーミング TTS」を提供しており、**ストリーミング対応の有無だけでは差がつきません**。差が出るのは「日本語の声の種類・スタイル制御」「音声クローンの提供条件・同意要件」「発音制御(SSML/読み仮名)」で、以下で扱います。

### B.2 日本語対応(声の種類・スタイル制御の有無。優劣比較はしない)

| サービス | 日本語(ja-JP)音声の提供 | 声の種類・スタイル制御 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- | --- |
| **OpenAI TTS** | あり(Whisper 系の多言語対応に準じ、日本語を含む 50+ 言語。入力テキストをその言語で与える方式) | 声は 13 種の共通ボイス(alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer, verse, marin, cedar)。**言語専用ボイスではなく、共通ボイスが多言語を話す**。スタイルは `instructions` パラメータで自然言語制御(accent/emotion/intonation/speed/tone/whispering 等) | https://developers.openai.com/api/docs/guides/text-to-speech | 2026-07-08 | 公式確認済み |
| **Google Cloud TTS** | あり(Chirp 3: HD が ja-JP を含む 31 locales を GA でサポート。従来の WaveNet/Neural2 でも ja-JP あり) | Chirp 3: HD は複数話者。従来エンジンは複数の日本語ボイス。スタイル/感情制御はエンジンにより差 | https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd / https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types | 2026-07-08 | 二次情報(公式ドキュメント要約) |
| **Amazon Polly** | あり。ja-JP は **Mizuki(Standard)/ Takumi(Standard+Neural)/ Kazuha(Neural)/ Tomoko(Neural)** の 4 ボイス。日本語には現状 **Generative / Long-form の対応表記なし**(Neural/Standard 中心) | Neural ボイスで自然性向上。ニュースキャスター等のスピーキングスタイルは一部の英語系ボイス限定で、日本語ボイスは対象外 | https://docs.aws.amazon.com/polly/latest/dg/available-voices.html | 2026-07-08 | 公式確認済み |
| **Azure AI Speech** | あり(prebuilt neural voices に日本語ボイス複数。Custom Voice の consent 文言も日本語版が用意されている) | SSML でスタイル(pitch/rate/intonation)切替。multi-style voice ではスタイル切替も SSML で可能 | https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support | 2026-07-08 | 二次情報(公式ドキュメント要約) |
| **ElevenLabs** | あり(生成音声クローンは 32+ 言語を自動で話すと自己報告。日本語もその中に含まれる) | 声はビルトイン + クローン。多言語は同一ボイスが複数言語を話す設計 | https://elevenlabs.io/docs/overview/capabilities/voices | 2026-07-08 | ベンダー自己報告 |

**注意:** 「どの日本語音声が自然か」の優劣は本メモの範囲外です。上表は**提供の有無・機能の有無**のみを示します。特に「共通ボイスが多言語を話す(OpenAI・ElevenLabs)」型と「言語別に専用ボイスが用意される(Polly・従来 Google/Azure)」型で設計思想が異なる点は記事で触れる価値があります。

### B.3 発音制御(SSML・読み仮名・固有名詞の発音指定)

| サービス | SSML 対応 | 発音辞書 / 音素指定 / 固有名詞 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- | --- |
| **OpenAI TTS** | **SSML は非対応**(公式ガイドに SSML の記載なし)。代わりに `instructions` による自然言語のスタイル指示 | 明示的な発音辞書 / phoneme タグの記載を確認できず。固有名詞の読み固定は苦手な設計とみられる(未確認) | https://developers.openai.com/api/docs/guides/text-to-speech | 2026-07-08 | 公式確認済み(SSML 非記載)/ 未確認(発音辞書の有無) |
| **Google Cloud TTS** | あり。Chirp 3: HD は SSML 入力に対応(サポートタグ: `<phoneme>`, `<p>`, `<s>`, `<sub>`, `<say-as>`)。ただし**ストリーミング要求では SSML タグ非対応**という制約あり。従来エンジンはより広い SSML | `<phoneme>`(音素指定)、`<sub>`(別語への読み替え=固有名詞対策)、`<say-as>`(数値・日付等の読み方)をサポート | https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd | 2026-07-08 | 二次情報(公式ドキュメント要約) |
| **Amazon Polly** | あり(多くの SSML タグに対応。ただし全タグが全エンジンで使えるわけではなく、Neural では一部のみ) | SSML の `<phoneme>` 等で発音指定。日本語では別途 lexicon(発音辞書)/ ルビ的指定の運用があるが、エンジン別のサポート差に注意 | https://docs.aws.amazon.com/polly/latest/dg/neural-voices.html | 2026-07-08 | 二次情報(公式ドキュメント要約) |
| **Azure AI Speech** | あり(SSML が中心的な制御手段。pitch/rate/intonation に加え **pronunciation correction**=発音修正が可能) | SSML の音素・辞書指定で固有名詞の読みを補正。custom voice でも SSML で調整可 | https://learn.microsoft.com/en-us/azure/ai-services/speech-service/custom-neural-voice | 2026-07-08 | 公式確認済み |
| **ElevenLabs** | 部分的(**pronunciation dictionaries** を提供。phoneme ベース辞書を WebSocket で使うには `enable_ssml_parsing=true` が必要) | pronunciation dictionary で単語/フレーズの読みを固定(1 リクエスト最大 3 辞書 locator)。IPA/CMU 発音を英語以外で使うには `eleven_v3` モデルが必要 | https://elevenlabs.io/docs/eleven-api/guides/how-to/text-to-speech/pronunciation-dictionaries | 2026-07-08 | 二次情報(公式ドキュメント要約) |

**執筆用の整理(差分の要点):** 固有名詞・読み仮名の制御が要る用途(ナレーション、社名・人名読み上げ)では **OpenAI TTS が SSML/発音辞書を持たない**のが実務上の分岐点になります。厳密な発音制御が必要なら Google / Amazon / Azure(SSML)/ ElevenLabs(発音辞書)側が候補、という整理が可能です。日本語固有の「読み仮名(ルビ)指定」の詳細対応は各社で差があり、執筆時に日本語 SSML の対応タグを個別確認する必要があります(下記 TODO)。

---

## 音声クローンの同意・統制要件

各社が音声クローン(voice cloning)を提供する際の **規約上の同意要求・審査・アクセス制限**を整理します。倫理・法的論点は断定せず、**確認先を示す**方針です。「本人の声のみクローン可」「同意文言の録音提出」「アクセス審査(allowlist)」が主な統制手段です。

| サービス / 機能 | 音声クローンの提供 | 本人同意・悪用対策の要件(規約上) | 確認先 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- | --- |
| **Google Cloud TTS — Chirp 3: Instant Custom Voice** | あり(高品質録音から短時間でパーソナル音声を生成) | **同意文言の録音提出が必須**。指定スクリプト「I am the owner of this voice and I consent to Google using this voice to create a synthetic voice model.」(言語別テンプレあり、カスタム文言不可)。さらに **allowlist 制**(利用は許可リスト登録ユーザ限定、営業経由で申請)。作成キー上限あり(1 プロジェクト毎分 10 キー) | https://docs.cloud.google.com/text-to-speech/docs/chirp3-instant-custom-voice | 2026-07-08 | 公式確認済み |
| **Microsoft Azure — Custom Voice(Custom Neural Voice)** | あり(音声サンプルからカスタム neural voice を作成) | **アクセスは limited access(適格性・利用審査あり、intake フォームで申請)**。**voice talent の同意文言録音の提出が必須**(合意契約 + 口頭同意)。consent 文言は多言語(日本語含む)。voice talent 向け開示ガイドライン・Responsible AI ドキュメント群あり | https://learn.microsoft.com/en-us/azure/ai-services/speech-service/custom-neural-voice / https://learn.microsoft.com/en-us/azure/ai-services/speech-service/professional-voice-create-consent | 2026-07-08 | 公式確認済み |
| **ElevenLabs — Professional Voice Cloning(PVC)** | あり(30 分〜3 時間の音声で高品質クローン) | **原則「自分自身の声のみクローン可(we only allow you to clone your own voice)」**。fine-tuning 申請前に **voice verification(voice-captcha による本人確認)** が必須。利用に consent の確認あり。法的可否は Terms of Service / AI Safety 情報を参照するよう案内 | https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/professional-voice-cloning | 2026-07-08 | 公式確認済み(本人のみ・verification)/ 二次情報(captcha の詳細) |
| **ElevenLabs — Instant Voice Cloning(IVC)** | あり(1〜5 分の音声で即時クローン、学習工程なし) | 保存前に「クローンする権利と consent を持つ」ことの確認を要求(自己申告ベース)。IVC は PVC より verification が軽く、悪用リスクは規約と AI Safety 情報で統制 | https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/instant-voice-cloning | 2026-07-08 | 二次情報(公式ドキュメント要約) |
| **Amazon Polly — Brand Voice** | あり(ただしセルフサーブではない)。組織専用のカスタム NTTS 音声 | **AWS の研究者・言語学者チームとの個別エンゲージメント**で構築(AWS アカウントマネージャ経由で問い合わせ)。同意・権利処理はエンゲージメント内で個別スコープ。**規約上の consent 要件は個別契約で要確認** | https://aws.amazon.com/polly/features/ / https://aws.amazon.com/blogs/machine-learning/build-a-unique-brand-voice-with-amazon-polly/ | 2026-07-08 | 公式確認済み(エンゲージメント方式)/ 未確認(consent の具体要件) |
| **OpenAI — カスタムボイス** | あり(Custom voices を作成し TTS / Realtime / Chat Completions で利用可) | 作成条件・同意要件の詳細は今回のガイド範囲では未取得。**利用可否・consent 要件は OpenAI の利用規約・カスタムボイス申請要件で要確認** | https://developers.openai.com/api/docs/guides/text-to-speech | 2026-07-08 | 未確認(consent 要件の詳細) |

**重要(断定回避):** 音声クローンの**本人同意・商用利用条件・第三者の声のクローン可否**は、各社規約・地域法(肖像・パブリシティ権等)で扱いが異なり、かつ更新が速い領域です。本メモは「規約上どんな統制手段が存在するか」までに留め、**具体的な適法性・可否判断は各社規約と法務で要確認**とします。記事本文でも断定を避け、「各社規約で要確認」と明示するのが安全です。

---

## 変わりやすい項目(定点観測)

記事執筆・更新時に必ず公式で再確認すべき項目(2026-07-08 時点の値は陳腐化前提):

1. **Gemini Live の映像入力仕様**: 「最大 1 fps・JPEG/PNG フレーム」「音声+動画セッション 2 分」は preview 段階の制約であり、緩和・変更されうる。
   > **TODO(要確認):** Gemini Live API の映像フレームレート上限とセッション上限を公式で再確認する(https://ai.google.dev/gemini-api/docs/live-api/capabilities 、最終確認: 2026-07-08)
2. **OpenAI Realtime の映像対応**: 現状は「離散画像の差し込み」。将来 native 連続映像入力が追加される可能性があるため、`input_image` 以外の映像入力タイプの有無を再確認する。
   > **TODO(要確認):** OpenAI Realtime API に native なライブ映像入力が追加されていないか公式ガイドで確認する(https://developers.openai.com/api/docs/guides/realtime-conversations 、最終確認: 2026-07-08)
3. **TTS のモデル名・エンジン世代**: OpenAI(`gpt-4o-mini-tts` 等)、Google(Chirp 3: HD)、ElevenLabs(`eleven_v3` 等)はいずれも世代更新が速い。日本語ボイスの追加(特に Polly の Generative/Long-form 日本語対応、Chirp 3 の日本語話者数)は変動しうる。
4. **日本語の発音制御(SSML / 読み仮名)**: 各社の日本語 SSML サポートタグ(特に `<phoneme>` の日本語音素、ルビ相当の指定)は差があり未精査。日本語ナレーション用途では実機確認が必須。
   > **TODO(要確認):** 各社 TTS の日本語 SSML 対応タグ(読み仮名・音素・固有名詞指定)を個別に確認する(最終確認: 2026-07-08)
5. **音声クローンの同意・審査要件**: allowlist / limited access / voice-captcha / consent 文言は各社の Responsible AI ポリシー更新で変わる。商用利用・第三者音声の可否は規約と地域法で要確認(断定しない)。
6. **料金(映像フレーム課金・TTS 文字/秒課金)**: 本メモでは数値を断定していない。執筆時に各社料金ページで取得すること。
   > **TODO(要確認):** リアルタイム映像入力の課金単位と TTS の課金単位(文字数/秒/トークン)を各社料金ページで取得する(https://ai.google.dev/gemini-api/docs/pricing / https://openai.com/api/pricing/ 、最終確認: 2026-07-08)
7. **アクセスできなかった/未精読のソース**: OpenAI の gpt-realtime 発表ブログ(openai.com/index/introducing-gpt-realtime/)は voice-agents.md 調査時に 403 で本文取得不可(画像入力の追加は developers.openai.com の realtime-conversations ガイドで裏取り済み)。Amazon Polly Brand Voice の consent 具体要件、OpenAI カスタムボイスの consent 要件は今回未取得(未確認)。
