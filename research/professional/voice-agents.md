# 音声エージェント(voice agents)の現行 API・アーキテクチャ選択肢(2026-07 時点)調査メモ

- **調査日**: 2026-07-07
- **調査目的**: `docs/03-implementation/voice-agents.md`(音声エージェントの実装)の執筆材料。記事本体は原則(パイプライン型 vs speech-to-speech 型の選択、割り込み・ターンテイキング、レイテンシ設計、ツール併用、評価)を扱い、具体的な API・モデル名は「2026-07 時点」の注記付きで軽く触れる方針。そのため本メモは「各社が何を公式に提供し、どのアーキテクチャを推奨しているか」に絞る
- **根拠の方針**: 各社公式ドキュメント(developers.openai.com / platform.openai.com / openai.com、ai.google.dev、docs.aws.amazon.com / aws.amazon.com、platform.claude.com)と公式ブログのみを根拠とします。個人ブログ・比較記事は使用していません
- **確度表記**: 「公式明記」= 公式ページに明文あり(URL に実際にアクセスして本文を確認済み) / 「公式から推測」= 公式記述からの合理的推測 / 「未確認」= 今回確認できず(直接アクセス不可を含む)

---

## 1. 2 つのアーキテクチャ(パイプライン型 vs speech-to-speech)の定義と各社の位置づけ

### 1.1 定義とトレードオフ(OpenAI の公式フレーミング)

OpenAI の Voice agents ガイドは、音声エージェントの構成を **2 択** として明示的に整理しています。これは記事の主軸にそのまま使えます。

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **Speech-to-speech(realtime / live audio)**: 「モデルがライブ音声の入出力を直接扱う(The model handles live audio input and output directly)」。用途は「自然で低レイテンシな会話」で、「barge-in(割り込み)、低い first-audio latency(最初の発話までの遅延)、自然なターンテイキング、リアルタイムのツール使用」を要する対話に向くと明記 | https://developers.openai.com/api/docs/guides/voice-agents | 2026-07-07 | 公式明記 |
| **Chained / pipeline(STT → テキスト推論 → TTS)**: 「アプリが文字起こし・テキスト推論・音声出力を明示的に制御し続ける(Your app keeps explicit control over transcription, text reasoning, and speech output)」。用途は「予測可能なワークフロー、既存のテキストエージェントの拡張」で、「各段が可視・差し替え可能である必要がある場合(ポリシーチェック、内部システム呼び出し、音声生成前の承認ゲート)」「durable な transcript(会話ログ)と決定的ロジックが要る場合」に向くと明記 | https://developers.openai.com/api/docs/guides/voice-agents | 2026-07-07 | 公式明記 |

**トレードオフの整理(執筆用、上記の公式記述からの合理的整理 = 公式から推測):**

- **レイテンシ**: speech-to-speech は STT/TTS の段間往復がないぶん first-audio latency が小さい。パイプラインは 3 段のそれぞれに遅延が積み上がる(パイプラインの実測例は §6 参照)。
- **制御性・可観測性**: パイプラインは各段のテキスト(文字起こし・LLM 出力)が取れるため、監査ログ・ガードレール・決定的分岐を挟みやすい。speech-to-speech は音声から音声へ直行するため、中間テキストの制御点が減る。
- **コスト**: 公式ドキュメントは両者のコスト比較を数値では示していない(§6、未確認)。一般論として speech-to-speech は音声トークン課金、パイプラインは STT+LLM+TTS の 3 課金の合算になる、という構造の違いがある(公式から推測)。

### 1.2 各社がどちらを提供しているか(俯瞰)

| ベンダー | speech-to-speech / realtime(単一モデル音声入出力) | パイプライン向けの公式部品 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- | --- |
| OpenAI | あり(Realtime API、GA)。SDK 上位ラッパーは `RealtimeAgent` / `RealtimeSession` | あり(Agents SDK の `VoicePipeline` + `SingleAgentVoiceWorkflow`、および STT/TTS 用の realtime-transcription 等) | https://developers.openai.com/api/docs/guides/voice-agents | 2026-07-07 | 公式明記 |
| Google(Gemini) | あり(Gemini Live API、Preview) | 別途 Cloud Speech-to-Text / Text-to-Speech を組む形(Live API とは別製品) | https://ai.google.dev/gemini-api/docs/live-api | 2026-07-07 | 公式明記(Live API 側)/ パイプライン部品は公式から推測 |
| Amazon(Nova Sonic) | あり(Nova Sonic / Nova 2 Sonic、speech-to-speech 基盤モデル) | Amazon Transcribe / Amazon Polly など別サービス(Nova Sonic 自体は単一モデル) | https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-conversational-speech.html | 2026-07-07 | 公式明記(Nova Sonic 側) |
| Anthropic(Claude) | **なし(native な realtime 音声 API は確認できず)**。公式 Cookbook はサードパーティ STT/TTS を組み合わせるパイプライン型を提示 | 公式 Cookbook が ElevenLabs(STT/TTS)+ Claude(テキスト推論)のパイプライン例を提供 | https://platform.claude.com/cookbook/third-party-elevenlabs-low-latency-stt-claude-tts | 2026-07-07 | 公式明記(Cookbook がパイプライン型であること)+ 公式から推測(native realtime API の不在) |

---

## 2. 各社の speech-to-speech / realtime API の詳細

### 2.1 OpenAI Realtime API

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Realtime API は **GA(一般提供)**。ドキュメントは「まだ beta の Realtime 連携があるなら、新規作業の前に GA インターフェースへ移行せよ(migrate it to the GA interface)」と明記 | https://developers.openai.com/api/docs/guides/realtime | 2026-07-07 | 公式明記 |
| アーキテクチャは **speech-to-speech**(音声入出力を直接扱う単一モデル)。GA の主力音声モデルは **`gpt-realtime-2.1`**。用途別に `gpt-realtime-translate`(翻訳)、`gpt-realtime-whisper`(文字起こし)も提示 | https://developers.openai.com/api/docs/guides/realtime | 2026-07-07 | 公式明記 |
| GA 版モデル系統の呼称は **`gpt-realtime`**(launch 名)。ガイドの現行例は `gpt-realtime-2.1`。旧 beta では `gpt-4o-realtime-preview` 系が使われていた(移行元の「beta インターフェース」に相当) | https://developers.openai.com/api/docs/guides/realtime | 2026-07-07 | 公式明記(`gpt-realtime` / `gpt-realtime-2.1`)+ 公式から推測(旧 beta モデル名の系譜) |
| 接続方式は 3 種: **WebRTC**(ブラウザ・モバイルなど音声を直接扱うクライアント向け)、**WebSocket**(サーバがメディアパイプライン/通話系/ワーカから生音声を受ける場合)、**SIP**(電話系の音声エージェント向け) | https://developers.openai.com/api/docs/guides/realtime | 2026-07-07 | 公式明記 |
| リアルタイムセッション中の **ツール(function calling)** に対応。`session.update` または `response.create` の `tools` で定義し、モデルは `type: "function_call"`(`name` / `call_id` / `arguments`)を返す。結果は `conversation.item.create` の `type: "function_call_output"` で返す。function tools に加え **MCP サーバ / connector** も接続できると案内 | https://developers.openai.com/api/docs/guides/realtime-conversations / https://developers.openai.com/api/docs/guides/realtime | 2026-07-07 | 公式明記 |

### 2.2 Google Gemini Live API

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Live API は「低レイテンシのリアルタイム音声・ビジョン対話(low-latency, real-time voice and vision interactions)」を可能にし、音声・画像・テキストの連続ストリームを処理して「人間らしい即時の音声応答」を返す。**ステータスは Preview(The Live API is in Preview)** | https://ai.google.dev/gemini-api/docs/live-api | 2026-07-07 | 公式明記 |
| 接続は **ステートフルな WebSocket(WSS)**。構成はサーバ間(バックエンドが WebSocket で接続)とクライアント直結(フロントエンドが直接接続)の 2 通り。本番はフロント直結時に **ephemeral token(短命トークン)** の使用を推奨 | https://ai.google.dev/gemini-api/docs/live-api / https://ai.google.dev/gemini-api/docs/live-api/capabilities | 2026-07-07 | 公式明記 |
| **native audio 出力**モデルを提供(「自然で写実的な音声、多言語性能の向上」)。ガイドの例では **`gemini-3.1-flash-live-preview`** と **`gemini-2.5-flash-live-preview`** を提示。両者はネイティブ音声出力に対応 | https://ai.google.dev/gemini-api/docs/live-api/capabilities | 2026-07-07 | 公式明記(モデル名は preview 表記で変わりやすい) |
| 音声フォーマット: 入力は raw 16-bit PCM / 16kHz / little-endian(MIME `audio/pcm;rate=16000`)、出力は 24kHz | https://ai.google.dev/gemini-api/docs/live-api/capabilities | 2026-07-07 | 公式明記 |
| **セッション長の制限**: 音声のみは 15 分、音声+動画は 2 分。セッション管理手法により延長可能 | https://ai.google.dev/gemini-api/docs/live-api/capabilities | 2026-07-07 | 公式明記 |
| **ツール(function calling)** に対応。`gemini-3.1-flash-live-preview` は function calling が **sequential のみ**。`gemini-2.5-flash-live-preview` は関数宣言で `behavior` を **`NON_BLOCKING`** に設定すると「関数実行中もモデルが対話を続けられる」 | https://ai.google.dev/gemini-api/docs/live-api/capabilities | 2026-07-07 | 公式明記 |

### 2.3 Amazon Nova Sonic / Nova 2 Sonic

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Nova Sonic は「統合された音声理解・生成アーキテクチャ(unified speech understanding and generation architecture)」を持つ **speech-to-speech 基盤モデル**。リアルタイム発話をそのまま処理・応答する | https://docs.aws.amazon.com/nova/latest/userguide/speech.html | 2026-07-07 | 公式明記 |
| 接続は **双方向ストリーム API(bidirectional stream API)**。「持続的な双方向コネクションで双方向に同時イベントストリーミング」を行い、従来の request-response ではなく「連続音声ストリーミング」「同時的な音声処理と生成」「完全な発話を待たないリアルタイム応答」を可能にする。クライアントとモデルが構造化 JSON イベントを交換する event-driven プロトコル | https://docs.aws.amazon.com/nova/latest/userguide/speech.html | 2026-07-07 | 公式明記 |
| **Nova 2 Sonic は GA**。公式ブログによれば **2025-12-02** に一般提供開始、Bedrock 経由・モデル ID **`amazon.nova-2-sonic-v1:0`**、リージョンは US East(N. Virginia)/ US West(Oregon)/ Asia Pacific(Tokyo) | https://aws.amazon.com/blogs/aws/introducing-amazon-nova-2-sonic-next-generation-speech-to-speech-model-for-conversational-ai/ | 2026-07-07 | 公式明記 |
| Nova 2 Sonic の対応言語(自動言語検出・切替あり): 英語(US, UK, India, Australia)、フランス語、イタリア語、ドイツ語、スペイン語、ポルトガル語、ヒンディー語。同一セッション内で言語を跨げる **polyglot voice** あり | https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-conversational-speech.html | 2026-07-07 | 公式明記 |
| Nova 2 Sonic の **コネクション上限は 8 分**。コネクション更新・セッション継続のパターンがコードサンプルで提供される | https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-conversational-speech.html | 2026-07-07 | 公式明記 |
| **ツール / エージェント対応**: function calling、RAG による knowledge grounding、agentic workflow をサポート。Nova 2 は **非同期ツール呼び出し(asynchronous tool handling)** で「ツール実行中もアシスタントが話し続けられる」 | https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-conversational-speech.html | 2026-07-07 | 公式明記 |

### 2.4 Anthropic Claude(native な realtime 音声 API は確認できず)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Claude API には **native な speech-to-speech / realtime 音声入出力 API を確認できず**。公式 Cookbook は「ElevenLabs の STT/TTS + Claude(テキスト推論)」による **パイプライン型**の低レイテンシ音声アシスタントを提示(STT → `messages.create`(例: `claude-haiku-4-5`)→ TTS) | https://platform.claude.com/cookbook/third-party-elevenlabs-low-latency-stt-claude-tts | 2026-07-07 | 公式明記(Cookbook がパイプライン型)+ 公式から推測(native API の不在) |
| 低レイテンシ化の推奨として Claude の **streaming API**(最初のトークンを早く受けて perceived latency を下げる)、TTS 側の **WebSocket ストリーミング** を挙げる | https://platform.claude.com/cookbook/third-party-elevenlabs-low-latency-stt-claude-tts | 2026-07-07 | 公式明記 |

> 注: 「Claude に native realtime 音声 API がない」は不在の証明であり、確度は「公式から推測」に留めています。執筆時は最新の Claude ドキュメントで再確認してください(§7)。

---

## 3. 会話制御のプリミティブ(VAD / turn detection / barge-in)

「ターン検出(turn detection)= ユーザが話し終えたかの判定」と「割り込み(barge-in)= モデル発話中にユーザが話し始めたときの停止」を、各社がどう公式提供しているか。

| ベンダー | ターン検出 / VAD の提供形態 | 割り込み(barge-in)の扱い | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- | --- |
| OpenAI | サーバ側 VAD を 2 モード提供。**`server_vad`**(無音区間で音声を区切る)と **`semantic_vad`**(発話内容から「言い終えた」確率を推定して区切る)。**VAD 対応セッション/モデルの既定は `server_vad`**。`turn_detection` を `null` にすると自動ターン検出を無効化し、`input_audio_buffer.commit` / `response.create` で手動制御。`semantic_vad` には `eagerness`(`auto`=`medium` が既定、`low` / `high`)がある | モデル発話中にユーザが話すと **`input_audio_buffer.speech_started`** を発火。WebSocket では未再生音声を **`conversation.item.truncate`**(`audio_end_ms` 指定)で切り詰める必要がある。WebRTC / SIP ではサーバが未再生音声を自動で切り詰める。`turn_detection.interrupt_response` で割り込み時の応答挙動を制御 | https://developers.openai.com/api/docs/guides/realtime-vad / https://developers.openai.com/api/docs/guides/realtime-conversations | 2026-07-07 | 公式明記 |
| Google(Gemini Live) | 既定で **自動 VAD**(連続音声入力に対しモデルが VAD 実行)。`realtimeInputConfig.automaticActivityDetection` で調整(`start_of_speech_sensitivity` / `end_of_speech_sensitivity` / `prefix_padding_ms` / `silence_duration_ms`。`silenceDurationMs` 推奨 500–800ms)。**手動 VAD** は `automatic_activity_detection: {disabled: true}` にしてクライアントが `activityStart` / `activityEnd` を送る | **barge-in** を明示提供(「ユーザはいつでもモデルを中断できる」)。「VAD が割り込みを検出すると、進行中の生成はキャンセル・破棄され、クライアントへ送信済みの情報だけがセッション履歴に残る」 | https://ai.google.dev/gemini-api/docs/live-api / https://ai.google.dev/gemini-api/docs/live-api/capabilities | 2026-07-07 | 公式明記 |
| Amazon(Nova 2 Sonic) | 「ユーザが話し終えたタイミングとアシスタントが応答すべきタイミングを検出する intelligent turn-taking」。公式ブログは **VAD 感度を high / medium / low で設定可能** と記載 | 「ユーザの割り込みを会話コンテキストを落とさずに graceful に処理(Graceful handling of user interruptions without dropping conversational context)」 | https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-conversational-speech.html / https://aws.amazon.com/blogs/aws/introducing-amazon-nova-2-sonic-next-generation-speech-to-speech-model-for-conversational-ai/ | 2026-07-07 | 公式明記 |
| Anthropic(Claude) | native な VAD / turn detection は API として提供せず。パイプライン構成のため、ターン検出・割り込みは STT/TTS ミドルウェア側(例: ElevenLabs、LiveKit 等)の責務になる | 同上(Claude 単体では扱わない) | https://platform.claude.com/cookbook/third-party-elevenlabs-low-latency-stt-claude-tts | 2026-07-07 | 公式から推測 |

**執筆用の整理(公式から推測):** 3 社の speech-to-speech API はいずれも「サーバ側 VAD による自動ターン検出 + 割り込み時の生成キャンセル」を標準機能として持ち、感度(無音時間・sensitivity・eagerness)を調整パラメータとして公開している点で一致します。OpenAI の `semantic_vad`(発話内容ベース)は、無音長ベースの `server_vad` に対する差別化点として記事で触れる価値があります。

---

## 4. 接続方式(WebRTC / WebSocket)と電話(SIP / telephony)統合

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| OpenAI: 「クライアント(Web ブラウザやモバイル)から接続する場合は、より一貫した性能のため WebSocket ではなく **WebRTC を推奨(we recommend using WebRTC rather than WebSockets for more consistent performance)**」。WebRTC ではピア接続オブジェクトが音声イベント処理を肩代わりし、WebSocket のような細粒度のイベント処理が不要 | https://developers.openai.com/api/docs/guides/realtime-webrtc | 2026-07-07 | 公式明記 |
| OpenAI: **WebSocket はサーバ間(server-to-server)** 向け。音声を使う場合は input audio buffer を手動操作し、base64 エンコード音声を JSON イベントで送る | https://developers.openai.com/api/docs/guides/realtime / (WebSocket ガイド)https://developers.openai.com/api/docs/guides/realtime-websocket | 2026-07-07 | 公式明記 |
| OpenAI: **SIP による電話統合を公式提供**。「SIP はインターネット経由で電話をかけるプロトコルで、着信を Realtime API に振り向けられる」。SIP トランキング事業者(例: Twilio)経由で電話番号を接続し、`sip:$PROJECT_ID@sip.api.openai.com;transport=tls` にトランクを向ける。着信は Webhook で受け、Accept / Reject / Hang up / Transfer(SIP REFER)を API 操作できる | https://developers.openai.com/api/docs/guides/realtime-sip | 2026-07-07 | 公式明記 |
| Google(Gemini Live): 接続は **WebSocket(WSS)** のみ(サーバ間 or クライアント直結)。SIP/電話の直接統合は Live API ドキュメントでは確認できず(電話は別途メディア基盤を挟む形になる) | https://ai.google.dev/gemini-api/docs/live-api | 2026-07-07 | 公式明記(WebSocket)/ SIP 統合は未確認 |
| Amazon(Nova 2 Sonic): **電話事業者との直接統合を公式に案内**。Amazon Connect、Vonage、Twilio、Audiocodes などのテレフォニー事業者、および LiveKit・Pipecat などのメディア基盤と統合。「audio codec 最適化、セッションのライフサイクル管理」を担うと記載 | https://aws.amazon.com/blogs/aws/introducing-amazon-nova-2-sonic-next-generation-speech-to-speech-model-for-conversational-ai/ | 2026-07-07 | 公式明記 |
| Anthropic(Claude): 接続方式は通常の Messages API(HTTP / streaming)。音声・電話は STT/TTS・メディア基盤側で扱う | https://platform.claude.com/cookbook/third-party-elevenlabs-low-latency-stt-claude-tts | 2026-07-07 | 公式から推測 |

**執筆用の整理:** 「ブラウザ・低レイテンシ = WebRTC / サーバ間 = WebSocket」という使い分けは OpenAI が最も明確に公式化しています(WebRTC 推奨は client 接続の性能一貫性が理由)。Gemini Live は WebSocket 一本(client 直結時は ephemeral token 推奨)。電話統合は OpenAI(SIP native)と Amazon(主要 CPaaS との直接統合)が公式に前面へ出しており、Gemini は Live API 単体では SIP 直結の記載を確認できませんでした。

---

## 5. ツール呼び出し(function calling)とリアルタイム音声の併用

| ベンダー | リアルタイム音声セッション中の function calling | 特記事項 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- | --- |
| OpenAI Realtime | 対応(`tools` 定義 → `function_call` → `function_call_output`)。MCP サーバ / connector も接続可能 | 音声セッション中の tool 呼び出しを標準サポート | https://developers.openai.com/api/docs/guides/realtime-conversations | 2026-07-07 | 公式明記 |
| Gemini Live | 対応。`gemini-3.1-flash-live-preview` は **sequential のみ**、`gemini-2.5-flash-live-preview` は `behavior: NON_BLOCKING` で**関数実行中も対話継続**可 | モデルにより同期/非同期の扱いが異なる | https://ai.google.dev/gemini-api/docs/live-api/capabilities | 2026-07-07 | 公式明記 |
| Nova 2 Sonic | 対応。**非同期ツール(asynchronous tool handling)** で、ツール実行中もアシスタントが話し続ける。RAG・agentic workflow もサポート | 「話しながらツール実行」を公式に打ち出す | https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-conversational-speech.html | 2026-07-07 | 公式明記 |
| Claude(パイプライン) | Claude 自体は Messages API の tool use に対応(音声とは独立)。音声パイプラインでは LLM 段で tool use を行う構成 | native 音声セッションではなくテキスト段での tool use | https://platform.claude.com/cookbook/third-party-elevenlabs-low-latency-stt-claude-tts | 2026-07-07 | 公式から推測 |

**執筆用の論点:** speech-to-speech 3 社はいずれも「音声会話中の function calling」を公式サポートし、うち Gemini(2.5)と Nova 2 は「ツールが走っている間も会話を止めない非同期(NON_BLOCKING / asynchronous)」を差別化点にしています。長い外部 API を叩く音声エージェントで「ツール実行中の沈黙」をどう扱うかは記事の設計判断ポイントになります。

---

## 6. レイテンシと評価の観点

### 6.1 レイテンシ

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 各社とも定性的に「low-latency」を掲げるが、**公式の数値レイテンシ目標(◯ms 以内など)は今回確認した範囲では提示なし** | (各 speech-to-speech ガイド) | 2026-07-07 | 公式明記(数値目標の不在)/ 未確認(具体数値) |
| OpenAI は設計目標として「低い first-audio latency(最初の音声が返るまでの遅延)」「自然なターンテイキング」を挙げる。これらが speech-to-speech を選ぶ理由として明記される | https://developers.openai.com/api/docs/guides/voice-agents | 2026-07-07 | 公式明記 |
| パイプライン型の実測例(Claude Cookbook): 文字起こし 0.54 秒、非ストリーミング応答 1.03 秒、streaming の time-to-first-token 0.71 秒(perceived latency 約 30.7% 削減)、TTS の time-to-first-audio-chunk 0.39 秒 / 文単位で最初の音声まで 1.48 秒。**streaming と WebSocket 化が低レイテンシの鍵** と記載 | https://platform.claude.com/cookbook/third-party-elevenlabs-low-latency-stt-claude-tts | 2026-07-07 | 公式明記 |

**執筆用の整理(公式から推測):** レイテンシの評価軸として公式ドキュメントが実際に使うのは「first-audio latency / time-to-first-audio」「ターンテイキングの自然さ」であり、これは speech-to-speech を選ぶ動機として直接語られています。パイプライン型は段ごとの time-to-first-token / time-to-first-audio を積み上げて測る形になり、streaming で perceived latency を下げるのが定石(Cookbook の実測がその根拠)。

### 6.2 音声特有の評価観点

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 音声エージェント特有の **定量評価フレームワーク / 標準メトリクス** への公式言及は、今回確認したページ範囲では見当たらず | — | 2026-07-07 | 未確認 |
| ただし各社は「ターンテイキング / 割り込みの調整」を主要な品質ノブとして公式化: OpenAI の `eagerness`(low/medium/high)、Gemini の VAD sensitivity(`silence_duration_ms` 推奨 500–800ms)、Nova の VAD 感度(high/medium/low)。「早すぎる割り込み(false interruption)vs 応答の遅さ」のトレードオフ調整が実務の評価対象になる | https://developers.openai.com/api/docs/guides/realtime-vad / https://ai.google.dev/gemini-api/docs/live-api/capabilities / https://aws.amazon.com/blogs/aws/introducing-amazon-nova-2-sonic-next-generation-speech-to-speech-model-for-conversational-ai/ | 2026-07-07 | 公式明記(各ノブの存在)+ 公式から推測(評価観点としての位置づけ) |
| 音声モデル向けの **prompting ベストプラクティス** ページは各社に存在(OpenAI: realtime-models-prompting、Amazon: Nova Sonic prompting best practices)。音声特有の指示設計の材料になりうる(今回は本文未精読) | https://platform.openai.com/docs/guides/realtime-models-prompting / https://docs.aws.amazon.com/nova/latest/userguide/prompting-speech.html | 2026-07-07 | 未確認(存在は確認、本文は未精読) |

---

## 7. 執筆時の注意(変わりやすい項目)

記事本文では以下を断定で書かず、`TODO(要確認)` 前提で扱うことを推奨します。

1. **提供ステータスとモデル名**: OpenAI Realtime は GA(主力 `gpt-realtime-2.1`)、Amazon Nova 2 Sonic は GA(2025-12-02、`amazon.nova-2-sonic-v1:0`)ですが、Gemini Live API は **Preview** です。Gemini のモデル名(`gemini-3.1-flash-live-preview` / `gemini-2.5-flash-live-preview`)は preview 表記で改称・世代更新が速いので、引用時は必ず確認日を併記してください。
2. **数値・上限の変動**: Gemini のセッション上限(音声 15 分 / 音声+動画 2 分)、Nova 2 のコネクション上限(8 分)、VAD の推奨無音長(500–800ms)などは変わりやすい数値です。断定引用は避けるか確認日付きで。
3. **既定 VAD モード**: OpenAI は「VAD 対応セッションの既定は `server_vad`」です(調査中に一部要約で `semantic_vad` が既定と出ましたが、専用の VAD ガイドで `server_vad` が既定と確認・訂正済み)。`semantic_vad` は明示設定で使うモードとして扱ってください。
4. **Claude の音声対応**: 「native な realtime 音声 API がない」は不在に基づく判断です。Anthropic が将来 realtime/音声 API を出す可能性があるため、執筆時に platform.claude.com の最新ドキュメントで再確認してください。記事では「Claude は 2026-07 時点でパイプライン型(サードパーティ STT/TTS)が公式の想定」と限定して書くのが安全です。
5. **電話(SIP/telephony)統合の一覧**: OpenAI は SIP を native 提供、Amazon は主要 CPaaS(Connect / Twilio / Vonage / Audiocodes)+ メディア基盤(LiveKit / Pipecat)との直接統合を公式化。Gemini Live は WebSocket 一本で SIP 直結の記載は今回未確認。統合先リストは各社で頻繁に更新されるため、記事では「電話は多くが SIP か CPaaS 経由で接続」という原則に留めるのが無難です。
6. **数値レイテンシ・評価メトリクス**: 各社の公式 speech-to-speech ドキュメントに「◯ms 以内」等の数値目標や標準評価フレームワークは今回見当たりませんでした(未確認)。記事のレイテンシ・評価パートは「first-audio latency」「ターンテイキング調整のトレードオフ」という定性軸で書き、数値はパイプライン実測例(Claude Cookbook)を一例として紹介する構成が、後から陳腐化しにくいです。
7. **アクセス不可だったソース**: gpt-realtime 発表ブログ(https://openai.com/index/introducing-gpt-realtime/)は 403 で本文取得できず。GA・SIP・semantic VAD 等の該当事実は developers.openai.com の各ガイドで裏取り済みです。platform.openai.com 配下(realtime-models-prompting 等)は SPA のため本文未精読(存在のみ確認)。
