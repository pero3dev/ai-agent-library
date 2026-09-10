# 調査メモ: 推論サービング・ローカル実行・LLM ゲートウェイ

- **調査日:** 2026-07-08(初版)/ **2026-08-18(四半期定点観測で再確認・更新)**
- **用途:** LLMOPS 計画 AF-1(`docs/05-operations/self-hosted-inference.md`)・AF-2(`docs/03-implementation/local-and-on-device-llm.md`)・AG-1(`docs/05-operations/llm-gateway.md`)の裏付け。各ドキュメントが「代表例を名前で挙げる」ための一次情報スナップショット
- **注意:** 推論エンジン・ローカル実行系・ゲートウェイ OSS は開発が非常に活発で、機能差・対応モデル・ライセンス条件が動きやすい。本メモは **2026-08-18 時点のスナップショット**(初版 2026-07-08)であり、**提供形態・ライセンス・主要機能・対応の有無に限定**する。**ベンチマーク数値・性能比較(速い/遅い)は扱わない**。本文執筆時は「代表例 + 選定軸」に留め、定量比較を書かないこと
- **根拠:** 公式リポジトリ / 公式ドキュメントのみ。ブログ・まとめ記事・SNS は根拠にしない(公式ブログは公式扱い)

## 2026-09-10 鮮度更新

Kong AI Gateway 2.0 は 2026-09-01 GA で、独立した runtime・control plane・Admin API・version を持ちます。従来の Kong Gateway 3.x に AI プラグインを追加する構成と分けて評価します。Kong core の Apache-2.0 を製品全体の許諾とみなせません。旧プラグインの廃止を意味する変更でもありません。AI Proxy 無印の Free / OSS 利用範囲は未確定のまま、契約・機能 tier を確認します。

TensorRT-LLM の主ライセンスは Apache-2.0 ですが、`tensorrt_llm/_torch/visual_gen/models/ltx2/` のコードには LTX-2 Community License Agreement が適用されます。2026-09-10 に現行 LICENSE で確認しました。導入日は推測せず、配布物とディレクトリの個別通知を照合します。

LM Studio App Terms は 2026-08-23 版です。有料機能・subscription・usage credit の条項があり、旧無償案内だけでは費用を判断できません。personal / internal business の許諾、再配布・SaaS 提供の制限、SDK 自体のライセンスは別に読みます。すべての無料機能が終了したという意味ではありません。

一次資料(アクセス日: 2026-09-10):

- https://konghq.com/blog/product-releases/kong-ai-gateway-2-0-ga
- https://developer.konghq.com/ai-gateway/
- https://github.com/NVIDIA/TensorRT-LLM/blob/main/LICENSE
- https://lmstudio.ai/app-terms

以下は以前の調査履歴です。現行の製品・仕様・許諾は上の訂正を優先します。

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
- **確認日:** 2026-07-08(2026-08-18 再確認・変更なし)
- **確度:** `公式確認済み`

### SGLang

- **事実:** 「a high-performance serving framework for large language models and multimodal models」。**RadixAttention** による prefix caching、continuous batching、paged attention、chunked prefill、各種量子化、multi-LoRA batching を挙げる。「Compatible with most Hugging Face models and OpenAI APIs」と明記し、**OpenAI 互換 API** に対応。ライセンスは **Apache-2.0**
- **出典:** <https://github.com/sgl-project/sglang> / OpenAI API チュートリアル <https://docs.sglang.io/basic_usage/openai_api_completions.html>
- **確認日:** 2026-07-08(2026-08-18 再確認)
- **確度:** `公式確認済み`
- **補足(2026-08-18 追記):** LMSYS(非営利)がホストするプロジェクトで、2025-03 に PyTorch Ecosystem に参加。帰属・ガバナンスの観点からも継続性を確認

### Hugging Face TGI(Text Generation Inference)— アーカイブ済み

- **事実:** 「A Rust, Python and gRPC server for text generation inference」として本番サービングの定番だったが、**2025-12-11 にメンテナンスモード告知(PR #3345 マージ)**、**2026-03-21 にリポジトリがアーカイブされ read-only** となった。最終リリースは **v3.3.7(2025-12-19)**。README は代替として **vLLM・SGLang・llama.cpp・MLX** を案内している。ライセンスは **Apache-2.0**(アーカイブ時点)
- **出典:** <https://github.com/huggingface/text-generation-inference>
- **確認日:** 2026-08-18
- **確度:** `公式確認済み`
- **注記(初版の確認漏れの可能性):** アーカイブ日(2026-03-21)は本メモの初版調査日(2026-07-08)より前であり、初版調査の時点で既にアーカイブ済みだった。初版が現役の定番として記載していたのは当時の確認漏れの可能性がある。本文 `docs/05-operations/self-hosted-inference.md` は 2026-08 の定点観測で代表例表から除外し、「顔ぶれは入れ替わる」の実例(注意書き)に移した

### NVIDIA TensorRT-LLM

- **事実:** NVIDIA GPU 向けに LLM 推論を最適化する OSS ライブラリ。Python の高レベル LLM API を提供し、attention / GEMM / MoE 向けカスタムカーネル、prefill-decode disaggregation、wide expert parallelism、speculative decoding、**paged KV cache**、量子化、マルチ GPU / マルチノード並列をサポート。デプロイ用に **`trtllm-serve`** コマンドを提供。ライセンスは **Apache-2.0**
- **出典:** <https://github.com/NVIDIA/TensorRT-LLM>
- **確認日:** 2026-07-08(2026-08-18 再確認)
- **確度:** `公式確認済み`
- **補足(2026-08-18 解消):** `trtllm-serve` は **OpenAI 互換サーバー**であることを公式ドキュメント(<https://nvidia.github.io/TensorRT-LLM/>)で確認。`/v1/models`・`/v1/completions`・`/v1/chat/completions` を提供する。`公式確認済み`

### NVIDIA Triton Inference Server

- **事実:** 「an open source inference serving software that streamlines AI inferencing」。LLM 専用ではなく汎用の推論サーバーで、複数フレームワーク(TensorRT / PyTorch / ONNX / OpenVINO / Python / RAPIDS FIL 等)を backend として扱える。**dynamic batching**、concurrent model execution、sequence batching / 暗黙状態管理、Ensemble / Business Logic Scripting によるモデルパイプライン、カスタム backend API を提供。プロトコルは **KServe ベースの HTTP/REST・gRPC**、C API・Java API。ライセンスは **BSD-3-Clause**
- **出典:** <https://github.com/triton-inference-server/server>
- **確認日:** 2026-07-08(2026-08-18 再確認)
- **確度:** `公式確認済み`(ライセンス・プロトコル)
- **補足(2026-08-18 解消):** Triton 自体は OpenAI 互換 API を直接持つエンジンではなく、LLM は TensorRT-LLM backend や vLLM backend 経由でサービングする。リポジトリの **`python/openai/` に OpenAI 互換フロントエンド**が提供されていることを確認(chat・completions・embeddings・models に対応。backend は vLLM と TensorRT-LLM)。`公式確認済み`

### LMDeploy

- **事実:** 「a toolkit for compressing, deploying, and serving LLM」(MMRazor / MMDeploy チーム)。persistent batch(= continuous batching)、blocked KV cache、dynamic split&fuse、tensor parallelism、高性能 CUDA カーネル。weight-only / k-v 量子化に対応。推論エンジンは **TurboMind**(高性能)と **PyTorch**(導入容易)の 2 系統。api_server による **OpenAI 互換 LLM サービング**を提供。ライセンスは **Apache-2.0**
- **出典:** <https://github.com/InternLM/lmdeploy>
- **確認日:** 2026-07-08(2026-08-18 再確認・変更なし)
- **確度:** `公式確認済み`

---

## ローカル / 軽量実行系(個人・端末・エッジ)

個人 PC・端末上でモデルを動かす用途。対応 OS、量子化フォーマット(主に **GGUF**、Apple は **MLX**)、OpenAI 互換 API の有無、配布のしやすさが軸。

### Ollama

- **事実:** ローカルで各種 LLM(gpt-oss、Qwen、Gemma、DeepSeek ほか)を動かすツール。**macOS / Windows / Linux / Docker**(公式イメージ `ollama/ollama`)に対応。モデル実行 backend として **llama.cpp** を利用(= GGUF ベース)しつつ、マルチモーダルモデルは GGML 上の独自エンジンで実行する構成(公式ブログ 2025-05-15)。REST API を提供し、公式ブログで「built-in compatibility with the **OpenAI Chat Completions API**」と明記(ホスト名を `http://localhost:11434` に差し替えて利用)。ライセンスは **MIT**
- **出典:** <https://github.com/ollama/ollama> / OpenAI 互換 <https://ollama.com/blog/openai-compatibility>
- **確認日:** 2026-07-08(2026-08-18 再確認)
- **確度:** `公式確認済み`
- **補足(2026-08-18 解消):** OpenAI 互換の対応範囲拡大を公式ドキュメントで確認。対応: `/v1/chat/completions`(streaming・vision・tools・JSON mode・seed・reasoning 制御)、`/v1/completions`、`/v1/embeddings`、`/v1/models`、`/v1/responses`(v0.13.3+・ステートレス版のみ)。非対応: logprobs・tool_choice。`公式確認済み`

### llama.cpp

- **事実:** 「LLM inference in C/C++」。目標は「minimal setup and state-of-the-art performance on a wide range of hardware - locally and in the cloud」。依存のない Plain C/C++ 実装。モデルは **GGUF** 形式が必須。付属の **`llama-server`** は「A lightweight, **OpenAI API compatible**, HTTP server for serving LLMs」。ハードウェアは Apple silicon(Metal)、x86 の AVX/AVX2/AVX512、NVIDIA(CUDA)、AMD(HIP)等を広くサポート。ライセンスは **MIT**
- **出典:** <https://github.com/ggml-org/llama.cpp>
- **確認日:** 2026-07-08(2026-08-18 再確認・変更なし)
- **確度:** `公式確認済み`
- **補足:** GGUF は llama.cpp エコシステム発祥の量子化コンテナ形式で、Ollama・LM Studio・GPT4All が共通利用する事実上の標準。

### Apple MLX / mlx-lm

- **事実:** MLX は Apple silicon 向けの機械学習フレームワーク(Apple の ml-explore プロジェクト)。**mlx-lm** は「a Python package for generating text and fine-tuning large language models on **Apple silicon** with MLX」。量子化と Hugging Face Hub へのアップロードに対応。HTTP サーバー **`mlx_lm.server`** を提供し「The HTTP API is intended to be similar to the **OpenAI chat API**」(`POST /v1/chat/completions`・`GET /v1/models`)。ただし「**not recommended for production** as it only implements basic security checks」と明記。ライセンスは **MIT**
- **出典:** <https://github.com/ml-explore/mlx-lm> / サーバー仕様 <https://github.com/ml-explore/mlx-lm/blob/main/mlx_lm/SERVER.md>
- **確認日:** 2026-07-08(2026-08-18 再確認・変更なし)
- **確度:** `公式確認済み`
- **補足:** 対応プラットフォームは **Apple silicon 専用**(macOS / M シリーズ)。量子化フォーマットは MLX 独自(GGUF ではない)。

### LM Studio

- **事実:** ローカル LLM を GUI で動かすデスクトップアプリ。対応は「**Apple Silicon Macs, x64/ARM64 Windows PCs, and x64 Linux PCs**」。バックエンドは llama.cpp(GGUF)で、Apple Silicon 上では **MLX** も利用可能。「Serve local models on **OpenAI-like endpoints**, locally and on the network」と明記し、OpenAI 互換 API と LM Studio REST API(beta)を提供
- **出典:** <https://lmstudio.ai/docs> / SDK <https://github.com/lmstudio-ai/lmstudio.js>
- **確認日:** 2026-07-08(2026-08-18 再確認)
- **確度:** `公式確認済み`(対応 OS・API・モデル形式)
- **ライセンス補足(2026-08-18 解消):** 公式 Terms(Version: July 1, 2025)で、アプリ本体は「personal and/or internal business purposes」での**無償使用が許諾されるプロプライエタリ製品**であることを確認。再配布・SaaS としての提供は禁止。企業向けには別途 Enterprise 提供あり。**公式 SDK `lmstudio.js` は MIT**。いずれも `公式確認済み`

### GPT4All(Nomic AI)

- **事実:** consumer デバイスでローカルに LLM を動かす(API・GPU 不要でも可)。対応は **Windows(x64 / ARM)・macOS(Monterey 12.6+、Apple Silicon 最適化)・Linux(Ubuntu、x86-64 のみ)**、Flathub 配布あり。backend は llama.cpp、GPU は Nomic Vulkan(NVIDIA / AMD)。モデル形式は **GGUF**(Q4_0 / Q4_1 等)。「Docker-based API server ... **OpenAI-compatible HTTP endpoint**」を提供。ライセンスは **MIT**
- **出典:** <https://github.com/nomic-ai/gpt4all>
- **確認日:** 2026-07-08(2026-08-18 再確認)
- **確度:** `公式確認済み`
- **メンテナンス補足(2026-08-18 更新):** 最新リリースは **v3.10.0(2025-02-25)のまま約 18 か月新規リリースなし**(アーカイブ / メンテナンスモードの告知はなし)。更新頻度は他ローカル系(Ollama / llama.cpp)より明確に緩やかで、引き続き定点観測対象とする(下記「変わりやすい項目」)。

---

## LLM ゲートウェイ / プロキシ(複数プロバイダ抽象化・キー管理・ルーティング)

複数 LLM プロバイダを統一 API で抽象化し、キー管理・フォールバック・使用量集計・レート制御・キャッシュ・監査ログを一元化するレイヤー。**OSS か マネージドか**が最初の分岐。

### LiteLLM(SDK + Proxy Server)

- **事実:** 「a single, unified interface to call 100+ LLM providers ... using the **OpenAI format**」。**Python SDK** と、チーム/組織向けにデプロイする **AI Gateway(Proxy Server)** の両方を提供。機能に統一 API、プロバイダ差し替え(コード改変不要)、**virtual keys / spend tracking / guardrails / load balancing / admin dashboard**。対応エンドポイントは `/chat/completions`・`/embeddings`・`/images`・`/audio` に加え、`/responses`・`/messages`・`/rerank`・`/batches` へ拡大(2026-08-18 確認)。ライセンスは **MIT**(コア)+ `enterprise/` ディレクトリのみ別途 **LiteLLM Commercial License**(エンタープライズ機能は有償。ライセンス境界は 2026-08-18 再確認・変更なし)
- **出典:** <https://github.com/BerriAI/litellm> / ライセンス <https://raw.githubusercontent.com/BerriAI/litellm/main/LICENSE>
- **確認日:** 2026-07-08(2026-08-18 再確認)
- **確度:** `公式確認済み`

### Portkey AI Gateway

- **事実:** 「A blazing fast AI Gateway with integrated guardrails. Route to 1,600+ LLMs」。OpenAI 互換の統一インターフェース。機能に **fallbacks**(失敗時に別プロバイダ/モデルへ)、**automatic retries**(最大 5 回)、**load balancing**(複数 API キー/プロバイダへ分散)、**caching**、**guardrails**(プリビルト 40+)。**OSS(MIT)**であり、加えて **Portkey Cloud(マネージド)** も提供。セルフホストは Docker / Kubernetes / 各種クラウド
- **出典:** <https://github.com/Portkey-AI/gateway>
- **確認日:** 2026-07-08(2026-08-18 再確認)
- **確度:** `公式確認済み`
- **補足(2026-08-18 修正):** 現 README の表記ではガードレールは **40+**(初版メモの「50+」を修正)。対応 LLM 数は README 内で **250+** と **1,600+** の表記が併記されている

### Cloudflare AI Gateway

- **事実:** **マネージドサービス**(セルフホスト OSS ではない、「it only takes one line of code to get started」)。対応プロバイダは Workers AI / Anthropic / Google Gemini / OpenAI / Replicate ほか。機能に **caching**(Cloudflare キャッシュから配信)、**rate limiting**、**request retry & model fallbacks**、**analytics**(リクエスト数・トークン数・コスト)、**logging**(リクエスト/エラーの可視化)。可観測性とコスト管理が主眼
- **出典:** <https://developers.cloudflare.com/ai-gateway/>
- **確認日:** 2026-07-08(2026-08-18 再確認・変更なし)
- **確度:** `公式確認済み`
- **補足:** 料金体系・無料枠は本メモの対象外(公式料金ページで別途確認)。

### Kong AI Gateway

- **事実:** 「connectivity and governance layer for modern AI-native applications built on top of **Kong Gateway**」。AI 機能は通常の Kong プラグインと同じモデルで有効化する専用プラグイン群として提供。機能に統一インターフェースによるマルチプロバイダルーティング、**AI Proxy Advanced** による load balancing、semantic caching、rate limiting(LLM トラフィック管理)、prompt security / guardrails、usage analytics(リクエスト/トークン量・エラー率・平均レイテンシ)。基盤の **Kong Gateway コアは Apache-2.0**
- **出典:** <https://developer.konghq.com/ai-gateway/> / Kong Gateway ライセンス <https://github.com/Kong/kong>
- **確認日:** 2026-07-08(2026-08-18 再確認。Kong Gateway コアの Apache-2.0 は変更なし)
- **確度:** `公式確認済み`(Kong Gateway コアの Apache-2.0、プラグイン機構)
- **補足(2026-08-18 一部解消):** 公式 docs のソース(tier メタデータ)で、**AI Proxy Advanced・AI Semantic Cache は `tier: ai_gateway_enterprise`(Enterprise 限定)**であることを確認(`公式確認済み`)。**AI Proxy(無印)は tier メタデータなし(Gateway 3.6+)**だが、「Free tier / OSS で使える」ことを明示的に肯定する公式記述は未取得。残る確認事項はこの 1 点のみ。
  > **TODO(要確認):** Kong AI Proxy(無印)プラグインが Free / OSS 利用で使えるかの明示的な公式記述を Kong 公式ドキュメント(<https://developer.konghq.com/ai-gateway/>)で確認する(最終確認: 2026-08)

---

## 選定軸のまとめ

### 高スループット推論サーバー(自ホスト・GPU)

- **スループット系機能:** continuous batching(連続バッチング)、PagedAttention / paged KV cache / prefix caching、chunked prefill、speculative decoding などの有無
- **対応モデル / 量子化形式:** Hugging Face モデルの広さ、weight-only / KV 量子化、MoE・LoRA 対応
- **API 互換:** OpenAI 互換 API を標準搭載するか(vLLM・SGLang・LMDeploy は明記。TensorRT-LLM も `trtllm-serve` が OpenAI 互換〔2026-08-18 確認〕。Triton は汎用サーバーで backend 経由 + `python/openai/` の OpenAI 互換フロントエンド。TGI はアーカイブ済みのため除外)
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
| Hugging Face TGI | 高スループット(**アーカイブ済み 2026-03-21**) | Apache-2.0(リポジトリは read-only) | `公式確認済み` |
| NVIDIA TensorRT-LLM | 高スループット | Apache-2.0 | `公式確認済み` |
| NVIDIA Triton Inference Server | 高スループット(汎用) | BSD-3-Clause | `公式確認済み` |
| LMDeploy | 高スループット | Apache-2.0 | `公式確認済み` |
| Ollama | ローカル | MIT | `公式確認済み` |
| llama.cpp | ローカル | MIT | `公式確認済み` |
| Apple MLX / mlx-lm | ローカル(Apple 専用) | MIT | `公式確認済み` |
| LM Studio(アプリ本体) | ローカル | プロプライエタリ。公式 Terms(2025-07-01 版)で personal / internal business は無償。再配布・SaaS 禁止。Enterprise 別途 | `公式確認済み` |
| LM Studio SDK(lmstudio.js) | ローカル | MIT | `公式確認済み` |
| GPT4All | ローカル | MIT | `公式確認済み` |
| LiteLLM | ゲートウェイ | MIT(コア)+ 一部 Commercial(`enterprise/`) | `公式確認済み` |
| Portkey AI Gateway | ゲートウェイ | MIT(コア)。Portkey Cloud はマネージド | `公式確認済み` |
| Cloudflare AI Gateway | ゲートウェイ | マネージド(OSS ではない) | `公式確認済み` |
| Kong AI Gateway | ゲートウェイ | Kong Gateway コアは Apache-2.0。AI Proxy Advanced・AI Semantic Cache は Enterprise 限定を確認。AI Proxy(無印)の Free 可否のみ未確認 | `公式確認済み` / 一部 `未確認` |

> **注意:** ライセンスは変更されうる。表の各行は **2026-08-18 に再確認済み**(初版確認日 2026-07-08)。本文に転記する際は「2026-08 時点」と明示すること。

---

## 変わりやすい項目(定点観測 — 四半期ごとに再確認)

- **OpenAI 互換 API の対応範囲:** 各ツールが chat/completions 以外(embeddings・tools/function calling・vision・responses API 等)をどこまで実装したか(特に Ollama・mlx-lm・各推論エンジン)
- **ライセンス条件:** OSS コアとエンタープライズ機能の境界(LiteLLM `enterprise/`、Kong AI プラグイン、Portkey Cloud の機能差)。ライセンス種別そのものの変更
- **対応モデル / 量子化形式:** 新モデルアーキテクチャ・新量子化(GGUF の版、MLX、fp4/fp8 等)への追随
- **新規参入・改称・統合:** 新しい推論エンジン / ゲートウェイの登場、プロジェクトの改称・アーカイブ・買収
- **メンテナンス活発度:** GPT4All など更新頻度が緩やかに見えるプロジェクトの最新リリース時期(アーカイブ / メンテナンスモード移行の有無)
- **マネージド各社の対応プロバイダ:** Cloudflare AI Gateway・Portkey Cloud・Kong の対応プロバイダ追加(料金体系は本メモ対象外だが本文で触れる場合は都度確認)
- **未確認事項の解消:** 初版の `TODO(要確認)` 5 件のうち 4 件(TensorRT-LLM / Triton の OpenAI 互換、Ollama の対応エンドポイント、LM Studio アプリのライセンス)は 2026-08-18 に解消済み。残りは **Kong AI Proxy(無印)の Free / OSS 利用可否** の 1 件のみ(該当節の TODO を参照)
