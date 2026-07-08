# 調査メモ: 推論サービング・ローカル実行・LLM ゲートウェイ

- **調査日:** 2026-07-08
- **用途:** LLMOPS 計画 AF-1(`docs/05-operations/self-hosted-inference.md`)・AF-2(`docs/03-implementation/local-and-on-device-llm.md`)・AG-1(`docs/05-operations/llm-gateway.md`)の裏付け。各ドキュメントが「代表例を名前で挙げる」ための一次情報スナップショット
- **注意:** 推論エンジン・ローカル実行系・ゲートウェイ OSS は開発が非常に活発で、機能差・対応モデル・ライセンス条件が動きやすい。本メモは **2026-07-08 時点のスナップショット**であり、**提供形態・ライセンス・主要機能・対応の有無に限定**する。**ベンチマーク数値・性能比較(速い/遅い)は扱わない**。本文執筆時は「代表例 + 選定軸」に留め、定量比較を書かないこと
- **根拠:** 公式リポジトリ / 公式ドキュメントのみ。ブログ・まとめ記事・SNS は根拠にしない(公式ブログは公式扱い)

## 確度マーカーの説明

| マーカー | 意味 |
| --- | --- |
| `公式確認済み` | 公式リポジトリ / 公式ドキュメントで直接確認した |
| `ベンダー自己報告` | 公式情報だが、第三者検証が不能な自己申告(主に性能主張。本メモでは原則採らない) |
| `二次情報` | 公式以外の情報、または公式で断定できず一般的知見で補った |
| `未確認` | 取得できず。確認すべき URL を残す |

---

## 高スループット推論サーバー(サーバー / データセンター向けサービング)

サーバー GPU 上で多数の同時リクエストを捌くためのサービングエンジン。共通して「連続バッチング(continuous batching)」「KV キャッシュの効率管理」「量子化」「OpenAI 互換 API」を軸に差別化する。

### vLLM

- **事実:** 「a fast and easy-to-use library for LLM inference and serving」。主要機能に continuous batching / chunked prefill / prefix caching、および KV キャッシュを効率管理する **PagedAttention** を挙げる。**OpenAI 互換 API サーバー**を提供し、加えて Anthropic Messages API・gRPC もサポートすると明記。ライセンスは **Apache-2.0**。UC Berkeley 発、2000 名超のコントリビュータ
- **出典:** <https://github.com/vllm-project/vllm>
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`

### SGLang

- **事実:** 「a high-performance serving framework for large language models and multimodal models」。**RadixAttention** による prefix caching、continuous batching、paged attention、chunked prefill、各種量子化、multi-LoRA batching を挙げる。「Compatible with most Hugging Face models and OpenAI APIs」と明記し、**OpenAI 互換 API** に対応。ライセンスは **Apache-2.0**
- **出典:** <https://github.com/sgl-project/sglang> / OpenAI API チュートリアル <https://docs.sglang.io/basic_usage/openai_api_completions.html>
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`

### Hugging Face TGI(Text Generation Inference)

- **事実:** 「A Rust, Python and gRPC server for text generation inference」。Hugging Face 本番(HuggingChat・Inference API・Inference Endpoints)で使用。主要機能に continuous batching、複数 GPU 向け tensor parallelism、SSE トークンストリーミング、各種量子化(bitsandbytes / GPT-Q / EETQ / AWQ / Marlin / fp8)、Flash Attention。「**Messages API compatible with OpenAI Chat Completion API**」と明記。ライセンスは **Apache-2.0**
- **出典:** <https://github.com/huggingface/text-generation-inference>
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`

### NVIDIA TensorRT-LLM

- **事実:** NVIDIA GPU 向けに LLM 推論を最適化する OSS ライブラリ。Python の高レベル LLM API を提供し、attention / GEMM / MoE 向けカスタムカーネル、prefill-decode disaggregation、wide expert parallelism、speculative decoding、**paged KV cache**、量子化、マルチ GPU / マルチノード並列をサポート。デプロイ用に **`trtllm-serve`** コマンドを提供。ライセンスは **Apache-2.0**
- **出典:** <https://github.com/NVIDIA/TensorRT-LLM>
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`
- **補足(要確認):** `trtllm-serve` の OpenAI 互換エンドポイント対応は README では「server capabilities」までしか確認できず、詳細は公式ドキュメントで裏取りが必要。
  > **TODO(要確認):** `trtllm-serve` が OpenAI 互換 API を提供するかを NVIDIA 公式ドキュメント(<https://nvidia.github.io/TensorRT-LLM/>)で確認する(最終確認: 2026-07)

### NVIDIA Triton Inference Server

- **事実:** 「an open source inference serving software that streamlines AI inferencing」。LLM 専用ではなく汎用の推論サーバーで、複数フレームワーク(TensorRT / PyTorch / ONNX / OpenVINO / Python / RAPIDS FIL 等)を backend として扱える。**dynamic batching**、concurrent model execution、sequence batching / 暗黙状態管理、Ensemble / Business Logic Scripting によるモデルパイプライン、カスタム backend API を提供。プロトコルは **KServe ベースの HTTP/REST・gRPC**、C API・Java API。ライセンスは **BSD-3-Clause**
- **出典:** <https://github.com/triton-inference-server/server>
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`(ライセンス・プロトコル)
- **補足(要確認):** Triton 自体は OpenAI 互換 API を直接持つエンジンではなく、LLM は TensorRT-LLM backend や vLLM backend 経由でサービングする。OpenAI 互換フロントエンドの提供有無は別途確認が必要。
  > **TODO(要確認):** Triton の OpenAI 互換フロントエンド(vLLM / TensorRT-LLM backend 併用時)対応を公式ドキュメントで確認する(最終確認: 2026-07)

### LMDeploy

- **事実:** 「a toolkit for compressing, deploying, and serving LLM」(MMRazor / MMDeploy チーム)。persistent batch(= continuous batching)、blocked KV cache、dynamic split&fuse、tensor parallelism、高性能 CUDA カーネル。weight-only / k-v 量子化に対応。推論エンジンは **TurboMind**(高性能)と **PyTorch**(導入容易)の 2 系統。api_server による **OpenAI 互換 LLM サービング**を提供。ライセンスは **Apache-2.0**
- **出典:** <https://github.com/InternLM/lmdeploy>
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`

---

## ローカル / 軽量実行系(個人・端末・エッジ)

個人 PC・端末上でモデルを動かす用途。対応 OS、量子化フォーマット(主に **GGUF**、Apple は **MLX**)、OpenAI 互換 API の有無、配布のしやすさが軸。

### Ollama

- **事実:** ローカルで各種 LLM(gpt-oss、Qwen、Gemma、DeepSeek ほか)を動かすツール。**macOS / Windows / Linux / Docker**(公式イメージ `ollama/ollama`)に対応。モデル実行 backend として **llama.cpp** を利用(= GGUF ベース)。REST API を提供し、公式ブログで「built-in compatibility with the **OpenAI Chat Completions API**」と明記(ホスト名を `http://localhost:11434` に差し替えて利用)。ライセンスは **MIT**
- **出典:** <https://github.com/ollama/ollama> / OpenAI 互換 <https://ollama.com/blog/openai-compatibility>
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`
- **補足:** OpenAI 互換ブログ執筆時点では Chat Completions が中心で、Embeddings・function calling・vision 等は「今後対応」とされていた。対応範囲は時期により拡大しているため、最新の対応エンドポイントは要確認。
  > **TODO(要確認):** Ollama の OpenAI 互換対応エンドポイント(embeddings / tools 等)の現状を公式ドキュメントで確認する(最終確認: 2026-07)

### llama.cpp

- **事実:** 「LLM inference in C/C++」。目標は「minimal setup and state-of-the-art performance on a wide range of hardware - locally and in the cloud」。依存のない Plain C/C++ 実装。モデルは **GGUF** 形式が必須。付属の **`llama-server`** は「A lightweight, **OpenAI API compatible**, HTTP server for serving LLMs」。ハードウェアは Apple silicon(Metal)、x86 の AVX/AVX2/AVX512、NVIDIA(CUDA)、AMD(HIP)等を広くサポート。ライセンスは **MIT**
- **出典:** <https://github.com/ggml-org/llama.cpp>
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`
- **補足:** GGUF は llama.cpp エコシステム発祥の量子化コンテナ形式で、Ollama・LM Studio・GPT4All が共通利用する事実上の標準。

### Apple MLX / mlx-lm

- **事実:** MLX は Apple silicon 向けの機械学習フレームワーク(Apple の ml-explore プロジェクト)。**mlx-lm** は「a Python package for generating text and fine-tuning large language models on **Apple silicon** with MLX」。量子化と Hugging Face Hub へのアップロードに対応。HTTP サーバー **`mlx_lm.server`** を提供し「The HTTP API is intended to be similar to the **OpenAI chat API**」(`POST /v1/chat/completions`・`GET /v1/models`)。ただし「**not recommended for production** as it only implements basic security checks」と明記。ライセンスは **MIT**
- **出典:** <https://github.com/ml-explore/mlx-lm> / サーバー仕様 <https://github.com/ml-explore/mlx-lm/blob/main/mlx_lm/SERVER.md>
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`
- **補足:** 対応プラットフォームは **Apple silicon 専用**(macOS / M シリーズ)。量子化フォーマットは MLX 独自(GGUF ではない)。

### LM Studio

- **事実:** ローカル LLM を GUI で動かすデスクトップアプリ。対応は「**Apple Silicon Macs, x64/ARM64 Windows PCs, and x64 Linux PCs**」。バックエンドは llama.cpp(GGUF)で、Apple Silicon 上では **MLX** も利用可能。「Serve local models on **OpenAI-like endpoints**, locally and on the network」と明記し、OpenAI 互換 API と LM Studio REST API(beta)を提供
- **出典:** <https://lmstudio.ai/docs> / SDK <https://github.com/lmstudio-ai/lmstudio.js>
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`(対応 OS・API・モデル形式)
- **ライセンス補足:** デスクトップアプリ本体のライセンス種別は公式ドキュメントに明示がなく取得できなかった(一般には無償のプロプライエタリ製品)。**公式 SDK `lmstudio.js` は MIT**(公式確認済み)。アプリ本体の商用利用条件は要確認。
  > **TODO(要確認):** LM Studio デスクトップアプリ本体の利用ライセンス / 商用利用条件を公式サイトで確認する(最終確認: 2026-07)

### GPT4All(Nomic AI)

- **事実:** consumer デバイスでローカルに LLM を動かす(API・GPU 不要でも可)。対応は **Windows(x64 / ARM)・macOS(Monterey 12.6+、Apple Silicon 最適化)・Linux(Ubuntu、x86-64 のみ)**、Flathub 配布あり。backend は llama.cpp、GPU は Nomic Vulkan(NVIDIA / AMD)。モデル形式は **GGUF**(Q4_0 / Q4_1 等)。「Docker-based API server ... **OpenAI-compatible HTTP endpoint**」を提供。ライセンスは **MIT**
- **出典:** <https://github.com/nomic-ai/gpt4all>
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`
- **メンテナンス補足:** README 上の最新リリースは **v3.10.0(2025-02-25)**。更新頻度は他ローカル系(Ollama / llama.cpp)より緩やかに見えるため、活発さは定点観測対象とする(下記「変わりやすい項目」)。

---

## LLM ゲートウェイ / プロキシ(複数プロバイダ抽象化・キー管理・ルーティング)

複数 LLM プロバイダを統一 API で抽象化し、キー管理・フォールバック・使用量集計・レート制御・キャッシュ・監査ログを一元化するレイヤー。**OSS か マネージドか**が最初の分岐。

### LiteLLM(SDK + Proxy Server)

- **事実:** 「a single, unified interface to call 100+ LLM providers ... using the **OpenAI format**」。**Python SDK** と、チーム/組織向けにデプロイする **AI Gateway(Proxy Server)** の両方を提供。機能に統一 API、プロバイダ差し替え(コード改変不要)、**virtual keys / spend tracking / guardrails / load balancing / admin dashboard**。対応エンドポイントは `/chat/completions`・`/embeddings`・`/images`・`/audio` ほか。ライセンスは **MIT**(コア)+ `enterprise/` ディレクトリのみ別途 **LiteLLM Commercial License**(エンタープライズ機能は有償)
- **出典:** <https://github.com/BerriAI/litellm> / ライセンス <https://raw.githubusercontent.com/BerriAI/litellm/main/LICENSE>
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`

### Portkey AI Gateway

- **事実:** 「A blazing fast AI Gateway with integrated guardrails. Route to 1,600+ LLMs」。OpenAI 互換の統一インターフェース。機能に **fallbacks**(失敗時に別プロバイダ/モデルへ)、**automatic retries**(最大 5 回)、**load balancing**(複数 API キー/プロバイダへ分散)、**caching**、**guardrails**(50+ プリビルト)。**OSS(MIT)**であり、加えて **Portkey Cloud(マネージド)** も提供。セルフホストは Docker / Kubernetes / 各種クラウド
- **出典:** <https://github.com/Portkey-AI/gateway>
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`

### Cloudflare AI Gateway

- **事実:** **マネージドサービス**(セルフホスト OSS ではない、「it only takes one line of code to get started」)。対応プロバイダは Workers AI / Anthropic / Google Gemini / OpenAI / Replicate ほか。機能に **caching**(Cloudflare キャッシュから配信)、**rate limiting**、**request retry & model fallbacks**、**analytics**(リクエスト数・トークン数・コスト)、**logging**(リクエスト/エラーの可視化)。可観測性とコスト管理が主眼
- **出典:** <https://developers.cloudflare.com/ai-gateway/>
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`
- **補足:** 料金体系・無料枠は本メモの対象外(公式料金ページで別途確認)。

### Kong AI Gateway

- **事実:** 「connectivity and governance layer for modern AI-native applications built on top of **Kong Gateway**」。AI 機能は通常の Kong プラグインと同じモデルで有効化する専用プラグイン群として提供。機能に統一インターフェースによるマルチプロバイダルーティング、**AI Proxy Advanced** による load balancing、semantic caching、rate limiting(LLM トラフィック管理)、prompt security / guardrails、usage analytics(リクエスト/トークン量・エラー率・平均レイテンシ)。基盤の **Kong Gateway コアは Apache-2.0**
- **出典:** <https://developer.konghq.com/ai-gateway/> / Kong Gateway ライセンス <https://github.com/Kong/kong>
- **確認日:** 2026-07-08
- **確度:** `公式確認済み`(Kong Gateway コアの Apache-2.0、プラグイン機構)
- **補足(要確認):** AI プラグインのうち OSS で使えるもの(AI Proxy 等)とエンタープライズ限定のもの(AI Proxy Advanced・semantic cache 等の一部)がある可能性が高いが、本調査ではプラグイン単位の OSS/エンタープライズ区分を公式で確定できなかった。
  > **TODO(要確認):** Kong AI プラグイン各機能の OSS 版 / エンタープライズ版の区分を Kong 公式ドキュメントで確認する(最終確認: 2026-07)

---

## 選定軸のまとめ

### 高スループット推論サーバー(自ホスト・GPU)

- **スループット系機能:** continuous batching(連続バッチング)、PagedAttention / paged KV cache / prefix caching、chunked prefill、speculative decoding などの有無
- **対応モデル / 量子化形式:** Hugging Face モデルの広さ、weight-only / KV 量子化、MoE・LoRA 対応
- **API 互換:** OpenAI 互換 API を標準搭載するか(vLLM・SGLang・TGI・LMDeploy は明記。Triton は汎用サーバーで backend 経由)
- **ハードウェア束縛:** NVIDIA 専用(TensorRT-LLM)か、AMD/その他も対応(vLLM は HIP など)か
- **運用負担:** 単一 GPU から分散クラスタまでのスケール、マルチノード並列、デプロイ用 CLI(`trtllm-serve` 等)の成熟度

### ローカル / 軽量実行系(個人・端末・エッジ)

- **対応 OS / ハードウェア:** macOS / Windows / Linux、CPU / GPU(CUDA・Metal・Vulkan・HIP)/ NPU。**Apple silicon 専用**(MLX 系)か汎用か
- **量子化 / モデル形式:** GGUF(llama.cpp 系エコシステムの事実上の標準)か MLX(Apple)か
- **OpenAI 互換 API の有無:** ローカルアプリを既存 OpenAI クライアントから叩けるか(本番非推奨の注記があるか。例: `mlx_lm.server`)
- **配布のしやすさ / UX:** GUI 有無(LM Studio・GPT4All)、ワンライン導入(Ollama)、ライブラリとしての組込み(llama.cpp・mlx-lm)
- **ライセンス / メンテナンス:** OSS(MIT が多い)かプロプライエタリ(LM Studio アプリ)か、リリース頻度

### LLM ゲートウェイ / プロキシ

- **提供形態:** セルフホスト OSS(LiteLLM・Portkey・Kong)か、フルマネージド(Cloudflare)か、両建て(Portkey Cloud・Kong Enterprise)か
- **対応プロバイダ数と統一 API:** OpenAI 形式での抽象化、対応プロバイダの広さ
- **信頼性機能:** フォールバック / リトライ / ロードバランシング
- **コスト・ガバナンス:** 使用量集計(spend tracking)、予算 / レート制御、監査ログ / 可観測性、キャッシュ
- **キー管理:** virtual key / 仮想キーによる下流アプリへの権限分離
- **OSS の境界:** コアが OSS でもエンタープライズ機能が有償分離されるか(LiteLLM `enterprise/`、Kong AI Proxy Advanced 等)

---

## ライセンス早見表

| ツール | カテゴリ | ライセンス種別 | 確度 |
| --- | --- | --- | --- |
| vLLM | 高スループット | Apache-2.0 | `公式確認済み` |
| SGLang | 高スループット | Apache-2.0 | `公式確認済み` |
| Hugging Face TGI | 高スループット | Apache-2.0 | `公式確認済み` |
| NVIDIA TensorRT-LLM | 高スループット | Apache-2.0 | `公式確認済み` |
| NVIDIA Triton Inference Server | 高スループット(汎用) | BSD-3-Clause | `公式確認済み` |
| LMDeploy | 高スループット | Apache-2.0 | `公式確認済み` |
| Ollama | ローカル | MIT | `公式確認済み` |
| llama.cpp | ローカル | MIT | `公式確認済み` |
| Apple MLX / mlx-lm | ローカル(Apple 専用) | MIT | `公式確認済み` |
| LM Studio(アプリ本体) | ローカル | プロプライエタリ / 無償(公式に明示なし) | `二次情報` |
| LM Studio SDK(lmstudio.js) | ローカル | MIT | `公式確認済み` |
| GPT4All | ローカル | MIT | `公式確認済み` |
| LiteLLM | ゲートウェイ | MIT(コア)+ 一部 Commercial(`enterprise/`) | `公式確認済み` |
| Portkey AI Gateway | ゲートウェイ | MIT(コア)。Portkey Cloud はマネージド | `公式確認済み` |
| Cloudflare AI Gateway | ゲートウェイ | マネージド(OSS ではない) | `公式確認済み` |
| Kong AI Gateway | ゲートウェイ | Kong Gateway コアは Apache-2.0(AI プラグインは OSS/Enterprise 混在の可能性) | `公式確認済み` / 一部 `未確認` |

> **注意:** ライセンスは変更されうる。表の確認日はすべて 2026-07-08。本文に転記する際は「2026-07 時点」と明示すること。

---

## 変わりやすい項目(定点観測 — 四半期ごとに再確認)

- **OpenAI 互換 API の対応範囲:** 各ツールが chat/completions 以外(embeddings・tools/function calling・vision・responses API 等)をどこまで実装したか(特に Ollama・mlx-lm・各推論エンジン)
- **ライセンス条件:** OSS コアとエンタープライズ機能の境界(LiteLLM `enterprise/`、Kong AI プラグイン、Portkey Cloud の機能差)。ライセンス種別そのものの変更
- **対応モデル / 量子化形式:** 新モデルアーキテクチャ・新量子化(GGUF の版、MLX、fp4/fp8 等)への追随
- **新規参入・改称・統合:** 新しい推論エンジン / ゲートウェイの登場、プロジェクトの改称・アーカイブ・買収
- **メンテナンス活発度:** GPT4All など更新頻度が緩やかに見えるプロジェクトの最新リリース時期(アーカイブ / メンテナンスモード移行の有無)
- **マネージド各社の対応プロバイダ:** Cloudflare AI Gateway・Portkey Cloud・Kong の対応プロバイダ追加(料金体系は本メモ対象外だが本文で触れる場合は都度確認)
- **未確認事項の解消:** 本メモ内の `TODO(要確認)`(TensorRT-LLM / Triton の OpenAI 互換、Ollama の対応エンドポイント、LM Studio アプリのライセンス、Kong AI プラグインの OSS 区分)
