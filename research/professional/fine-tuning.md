# ファインチューニング・蒸留の各社公式メニュー 調査メモ

- **調査日**: 2026-07-07
- **調査目的**: `docs/03-implementation/fine-tuning-and-distillation.md`(ファインチューニングと蒸留)の執筆材料。記事は原則(プロンプト/RAG/FT の使い分け、SFT・選好学習・蒸留の概観、データ準備、運用)を扱い、各社の提供形態は「2026-07 時点」の注記付きで軽く触れる方針。したがって本メモは「各社が何を公式に提供しているか(提供の有無と形態)」に絞る。個別の価格・具体的手順は対象外
- **根拠の方針**: 各社公式ドキュメント(developers.openai.com / platform.openai.com、cloud.google.com / docs.cloud.google.com、platform.claude.com、docs.aws.amazon.com)と各社公式ブログのみを根拠とします。個人ブログ・比較記事は使用していません
- **確度表記**: 「公式明記」= 公式ページに明文あり / 「公式から推測」= 公式記述からの合理的推測 / 「未確認」= 今回確認できず
- **取得上の注意**:
  - **OpenAI が fine-tuning プラットフォームの提供を縮小(winding down)している**のが 2026-07 時点の最重要トピック(後述 §2)。既存機能の説明は残っているが、新規ユーザーには非開放
  - `openai.com/index/*`(公式ブログ本文)は 403 で直接取得できず、`developers.openai.com` の docs / cookbook と検索経由で裏取りした(確度欄に注記)
  - `cloud.google.com` / `docs.cloud.google.com` の tuning 系ドキュメントは動的レンダリングのため WebFetch では**目次(ナビ)のみ**が返り、本文の細部(対応モデル一覧・LoRA/アダプタ・最小件数)を直接取得できないページが多かった。方式の有無はナビ構造 + 公式ブログで確定できたが、細部は Google Cloud 公式ブログや検索経由で裏取りし、取れないものは「未確認」とした

---

## 1. 手法の定義と各社が公式に使う用語(横断整理)

| 手法 | OpenAI の呼称 | Google(Vertex AI)の呼称 | Anthropic の扱い |
| --- | --- | --- | --- |
| 教師ありファインチューニング | Supervised fine-tuning (SFT) | Supervised fine-tuning(教師ありファインチューニング) | 用語集で「fine-tuning」を一般語として定義。**製品としては非提供**(§4) |
| 選好最適化 | Direct Preference Optimization (DPO) | Preference tuning(選好チューニング。DPO 系) | 製品として非提供 |
| 強化学習系 | Reinforcement fine-tuning (RFT、grader 使用) | Reinforcement learning fine-tuning | RLHF は用語集で「Claude の学習方法の説明」として記載。顧客向け機能ではない |
| 蒸留 | Model distillation(stored completions + Evals + SFT のワークフロー) | Distillation(教師→生徒の蒸留チューニング) | 製品として非提供 |
| パラメータ効率型(LoRA 等) | 明示的な公開なし(方式はマネージド、非公開) | ドキュメント本文を直接取得できず**未確認** | — |

- 各社とも「SFT」「DPO」「distillation」という業界共通語をほぼそのまま使っています。記事の用語導入時に各社呼称のブレは小さいです
- パラメータ効率型(LoRA / アダプタ)を**顧客が明示的に選ぶ形で提供している証拠は、今回どの API プロバイダでも公式には確認できませんでした**(マネージド提供のため方式は隠蔽されている可能性が高い)。オープンウェイト自前 FT では LoRA/QLoRA が一般的(§5)

---

## 2. OpenAI

### 2.1 最重要: fine-tuning プラットフォームの縮小(2026-07 時点)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **「OpenAI is winding down the fine-tuning platform. The platform is no longer accessible to new users, but existing users of the fine-tuning platform will be able to create training jobs for the coming months.」** という告知が、SFT・DPO・model optimization の各ガイド冒頭に掲載されている(= 新規ユーザーには非開放、既存ユーザーも「今後数か月」で終了の見込み) | https://developers.openai.com/api/docs/guides/supervised-fine-tuning / https://developers.openai.com/api/docs/guides/model-optimization / https://developers.openai.com/api/docs/guides/direct-preference-optimization | 2026-07-07 | 公式明記 |
| FT 済みモデルは、**ベースモデルが非推奨(deprecated)になるまでは推論に利用可能**("All fine-tuned models will remain available for inference until their base models are deprecated.") | https://developers.openai.com/api/docs/guides/supervised-fine-tuning | 2026-07-07 | 公式明記 |

**執筆上の含意**: 記事で「OpenAI の fine-tuning API」を現在形で紹介するのは 2026-07 時点では不正確になり得ます。「かつて SFT/DPO/RFT/蒸留を提供していたが、2026 年半ばに新規受付を停止し縮小中」と時制を明示するのが安全です。ただし機能の概念説明(SFT/DPO/蒸留とは何か)の教材としては依然有効です。

### 2.2 提供していた(いる)手法と対象モデル

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **SFT** を提供。対象ベースモデルは `gpt-4.1-2025-04-14` / `gpt-4.1-mini-2025-04-14` / `gpt-4.1-nano-2025-04-14`(GPT-4.1 系スナップショット) | https://developers.openai.com/api/docs/guides/supervised-fine-tuning | 2026-07-07 | 公式明記 |
| **DPO**(選好最適化)を提供。対象モデルは SFT と同じ GPT-4.1 系 3 モデル。`beta` ハイパーパラメータで「従来挙動の維持 vs 選好への追従」を制御 | https://developers.openai.com/api/docs/guides/direct-preference-optimization | 2026-07-07 | 公式明記 |
| model optimization ページは FT 手法を 4 種列挙: **Supervised fine-tuning / Vision fine-tuning / Direct Preference Optimization / Reinforcement fine-tuning(RFT、expert grader で推論チェーンを強化)** | https://developers.openai.com/api/docs/guides/model-optimization | 2026-07-07 | 公式明記 |
| SFT の前に DPO を行うのではなく、**SFT → DPO の順**が推奨(SFT で初期ポリシーを確立してから選好整合) | https://developers.openai.com/cookbook/examples/fine_tuning_direct_preference_optimization_guide | 2026-07-07 | 公式明記(cookbook) |

### 2.3 蒸留(distillation)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **Model Distillation** を公式機能として提供(2024 年に API へ導入)。大型モデルの出力を使って小型モデルを SFT する、というワークフロー。「leveraging the outputs of a large model to fine-tune another smaller model」 | https://developers.openai.com/cookbook/examples/leveraging_model_distillation_to_fine-tune_a_model / https://platform.openai.com/docs/guides/distillation | 2026-07-07 | 公式明記(openai.com ブログ本文は 403。cookbook/docs と検索で裏取り) |
| 仕組み: Chat Completions に `store=True` を付けて大型モデル(例 gpt-4o)の**入出力を stored completions として保存** → **Evals** で評価 → その入出力データを SFT の教師データに使う。入出力の保存・評価・最適化がプラットフォームに統合されている | 同上 | 2026-07-07 | 公式明記(同上の注記) |
| **注意**: 蒸留の最終段が SFT であるため、§2.1 の「fine-tuning プラットフォーム縮小」の影響を受ける(蒸留による小型モデル生成も新規ユーザーには実質不可の見込み) | §2.1 と同じ出典から導出 | 2026-07-07 | 公式から推測 |

### 2.4 FT を選ぶ前の順序・データ準備

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 推奨する最適化ループは **evals → prompt engineering → fine-tuning**。「prompt engineering may be all you need」= まずプロンプトで足りるか確かめ、FT は最後 | https://developers.openai.com/api/docs/guides/model-optimization | 2026-07-07 | 公式明記 |
| SFT のデータ最小件数: **最低 10 例**。ただし「意味のある改善は 50〜100 例あたりから(ユースケース依存)」 | https://developers.openai.com/api/docs/guides/supervised-fine-tuning | 2026-07-07 | 公式明記 |

---

## 3. Google(Vertex AI / Gemini)

### 3.1 提供している手法(Gemini モデル向け)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Vertex AI は Gemini モデルの tuning として **Supervised fine-tuning / Preference tuning(選好チューニング= DPO 系)/ Reinforcement learning fine-tuning / Distillation** の 4 系統をドキュメントで提示している | https://docs.cloud.google.com/vertex-ai/generative-ai/docs/tuning/model-distillation(Introduction to tuning) | 2026-07-07 | 公式明記(ページのナビ構造から確認。本文詳細は動的レンダリングで未取得) |
| **Supervised fine-tuning は GA**。公式ブログが「New Supervised Fine-Tuning (SFT) for **Gemini 2.5 Flash** is generally available」と明記 | https://cloud.google.com/blog/products/ai-machine-learning/gemini-2-5-flash-lite-flash-pro-ga-vertex-ai | 2026-07-07 | 公式明記(対象は Gemini 2.5 Flash を確認) |
| SFT の対応モデルとして `gemini-2.5-pro` / `gemini-2.5-flash` / `gemini-2.5-flash-lite` が案内されている(対応は世代更新で変わる) | https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini-supervised-tuning(検索経由で内容確認。本文直接取得は不可) | 2026-07-07 | 公式から推測(GA 明記は Flash のみ。Pro / Flash-Lite の GA 状態は要確認) |
| **Preference tuning(DPO)** を独立した tuning 手法として提供("About preference tuning" / "Prepare your data" / "Use preference tuning" のドキュメント群が存在) | https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini-use-preference-tuning | 2026-07-07 | 公式明記(存在。GA/preview の別は未確認) |
| SFT は text / image / audio / document など複数モダリティのデータで実施可能(モダリティ対応が公式にうたわれている) | https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini-supervised-tuning(検索経由) | 2026-07-07 | 公式から推測 |

### 3.2 蒸留(distillation)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **Distillation(蒸留チューニング)** を提供。大型の**教師モデル(teacher)** の出力で小型の**生徒モデル(student)** をチューニングし、自前ホスト可能な軽量カスタムモデルを作る | https://docs.cloud.google.com/vertex-ai/generative-ai/docs/tuning/model-distillation | 2026-07-07 | 公式明記(教師/生徒の枠組みを確認) |
| Gemini モデルの蒸留は **preview 段階**(2026-07 時点)と案内されている | 同上(検索経由で「available in preview」を確認) | 2026-07-07 | 公式から推測(preview 表記は検索で確認。docs 本文の直接取得は不可) |

### 3.3 オープンモデル向けの tuning

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Vertex AI は Gemini だけでなく**オープンモデル(例: Llama 3.1 系)向けにも Supervised fine-tuning と Distillation を提供**。GenAI SDK の `vertexai.tuning` から実施 | https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/tuning/open-model-tuning | 2026-07-07 | 公式明記(ページ存在・タイトルを確認。対応モデル一覧の本文は未取得) |

### 3.4 FT を選ぶ前の順序・データ準備(Google)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| SFT は「well-defined task で labeled data がある場合」「対象言語/内容がベースの学習分布から大きく外れる場合」に有効、と位置づけ(= 汎用タスクはまずプロンプトで試す含意) | https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini-supervised-tuning(検索経由) | 2026-07-07 | 公式から推測 |
| tuning が LoRA/アダプタ等のパラメータ効率型か、最小/推奨データ件数はいくつか | — | 2026-07-07 | **未確認**(docs が動的レンダリングで本文取得不可。執筆時に "About supervised fine-tuning" 本文で要確認) |

---

## 4. Anthropic(Claude)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **Claude の第一者 API はファインチューニングを提供していない**。用語集の fine-tuning 項に次の明文: 「**Our API does not currently offer fine-tuning, but please ask your Anthropic contact if you are interested in exploring this option.**」 | https://platform.claude.com/docs/en/about-claude/glossary | 2026-07-07 | 公式明記 |
| 用語集は RLHF・Pretraining・RAG を解説語として掲載するが、これらは「Claude がどう作られたか」の説明であり、**顧客向けの SFT/DPO/蒸留メニューは掲載されていない**(distillation・LoRA の項も無し) | 同上 | 2026-07-07 | 公式明記(不掲載の確認) |
| **例外ルート: Amazon Bedrock 経由の fine-tuning**。ただし fine-tune 可能な Anthropic モデルは **Claude 3 Haiku のみ**(`anthropic.claude-3-haiku-20240307-v1:0:200k`、単一リージョン us-west-2)。Opus 4.x / Sonnet 5 / Haiku 4.5 / Fable 5 など現行世代は fine-tune 非対応 | https://docs.aws.amazon.com/bedrock/latest/userguide/custom-model-fine-tuning.html | 2026-07-07 | 公式明記(サポート表を確認) |
| Bedrock の Claude 3 Haiku FT は 2024 年に GA 化。ローンチ時点で **テキストベース・最大 32K コンテキスト**対応と告知 | https://www.anthropic.com/news/fine-tune-claude-3-haiku | 2026-07-07 | 公式明記(告知) |
| FT 済み Claude モデルは Bedrock の **Provisioned Throughput** でホストして推論する | https://platform.claude.com/cookbook/finetuning-finetuning-on-bedrock(検索経由で確認) | 2026-07-07 | 公式から推測 |

**執筆上の含意**: 「Anthropic は第一者 API で FT を提供せず、公式には Anthropic 担当者への相談を案内している。実質的な FT ルートは Amazon Bedrock だが、対象は**旧世代の Claude 3 Haiku に限られる**」と書くのが 2026-07 時点で正確です。DPO・蒸留の顧客向けメニューは Anthropic からは提供されていません。

---

## 5. オープンウェイトモデル(自前 FT)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| オープンウェイトモデル(Meta Llama 系など)は**自前で FT 可能**。マネージド経路の例として Vertex AI は Llama 3.1 系の SFT/蒸留を提供 | https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/tuning/open-model-tuning | 2026-07-07 | 公式明記 |
| Amazon Bedrock も Meta Llama 3.1/3.2/3.3 系や Amazon Nova 系を fine-tune 対象として提供(= オープン系/自社モデルは FT 対象が広い) | https://docs.aws.amazon.com/bedrock/latest/userguide/custom-model-fine-tuning.html | 2026-07-07 | 公式明記(サポート表を確認) |
| 代表的な手法名(full FT / LoRA / QLoRA / SFT / DPO)はオープンエコシステムで一般的(自前インフラ + OSS ライブラリで実施)。深掘りは記事の対象外 | —(一般的技術知識。特定の一次ソースに依らない) | 2026-07-07 | 公式から推測 |

**執筆上の含意**: 「クローズドな API 各社が FT メニューを絞る/畳む一方、オープンウェイトは LoRA 等で自前 FT できる自由度が強み」という対比が 2026-07 時点で成立します。ただし手法名の列挙にとどめ、深掘りはしない方針を維持。

---

## 6. FT を選ぶ前の判断(公式が推奨する順序)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **OpenAI**: evals → prompt engineering → fine-tuning の順。「prompt engineering may be all you need」 | https://developers.openai.com/api/docs/guides/model-optimization | 2026-07-07 | 公式明記 |
| **Google**: SFT は「タスクが明確で labeled data がある」場合に有効と位置づけ(まずプロンプトで足りるか確認する含意) | https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini-supervised-tuning(検索経由) | 2026-07-07 | 公式から推測 |
| **Anthropic**: 用語集で RAG を「学習データ外の情報を扱える手法」として紹介。FT は非提供のため、実質「プロンプト/RAG が第一選択」 | https://platform.claude.com/docs/en/about-claude/glossary | 2026-07-07 | 公式から推測 |

- 「プロンプトエンジニアリング → RAG → FT」という 3 段の順序を、**その順序どおり一枚のページで明示**している公式ドキュメントは今回確認できませんでした。OpenAI は「evals + prompt engineering を先に、FT は最後」を明言(RAG はこの最適化ループとは別ページ扱い)。したがって記事では「FT は最後の手段」という点は各社共通、と書けますが、「必ず RAG を挟む」という明示は各社ページには乏しい、と正確に書くのが安全です

---

## 7. 運用上の論点(公式記載があるもの)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **OpenAI**: FT 済みモデルは**ベースモデルが deprecated になるまで**推論利用可。裏返すと、ベース更新時は新ベースで作り直しが必要 | https://developers.openai.com/api/docs/guides/supervised-fine-tuning | 2026-07-07 | 公式明記 |
| **OpenAI** データ準備: SFT は JSONL チャット形式、最低 10 例・意味ある改善は 50〜100 例〜 | 同上 | 2026-07-07 | 公式明記 |
| **Anthropic/Bedrock** データ準備: `{"system": ..., "messages":[{"role":"user",...},{"role":"assistant",...}]}` 形式の messages 配列(user/assistant 交互) | https://docs.aws.amazon.com/bedrock/latest/userguide/model-customization-prepare.html(検索経由で書式確認) | 2026-07-07 | 公式明記(書式) |
| **Anthropic/Bedrock**: fine-tune 対象が Claude 3 Haiku(旧世代)に固定 = 現行フロンティアの改善サイクルには追随できない、という運用上の制約 | https://docs.aws.amazon.com/bedrock/latest/userguide/custom-model-fine-tuning.html | 2026-07-07 | 公式から推測 |
| **Google** のデータ件数目安・再チューニング運用 | — | 2026-07-07 | **未確認**(docs 本文取得不可。執筆時に要確認) |

---

## 執筆時の注意(変わりやすい項目)

1. **OpenAI の fine-tuning 縮小は最優先で再確認**。2026-07-07 時点で「winding down / 新規非開放 / 既存も coming months で終了」の告知。記事公開時には**完全終了しているか、代替(蒸留・RFT 含む)がどう案内されているか**が変わっている可能性が高い。→ `TODO(要確認)` 必須。確認先: https://developers.openai.com/api/docs/guides/model-optimization
2. **OpenAI の FT 対象モデルは GPT-4.1 系スナップショット(gpt-4.1 / mini / nano、2025-04-14)** に固定されており、フロンティア世代(GPT-5 系等)は FT 対象ではない。縮小方針と整合的。記事でモデル名を出す場合は日付付きスナップショットである点に注意
3. **Google の SFT 対応 Gemini モデルと GA/preview 状態**は世代更新が速い。今回 GA を明記で確認できたのは Gemini 2.5 Flash のみ。Pro / Flash-Lite、および蒸留(preview)の状態は執筆時に docs で要確認。→ `TODO(要確認)`
4. **Google docs の細部(LoRA/アダプタの有無・最小データ件数)は今回未取得**。動的レンダリングで WebFetch がナビしか返さないため。執筆時に "About supervised fine-tuning for Gemini models" 本文を人手で確認すること。確認先: https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini-supervised-tuning
5. **Anthropic の FT 対象は Claude 3 Haiku のみ(Bedrock 経由)**。Claude 3 Haiku 自体が旧世代で、Bedrock 側の退役スケジュール次第で FT 対象から外れる可能性がある。記事では「現行世代 Claude は FT 不可」という点を強調するのが安全。確認先: https://docs.aws.amazon.com/bedrock/latest/userguide/custom-model-fine-tuning.html
6. **「プロンプト → RAG → FT」の順序**は業界の通説だが、この 3 段を一枚で明示する公式ページは各社に乏しい。記事では各社の実際の記載(OpenAI = evals + prompt engineering を先に / FT は最後)に沿って、断定を避けて書くこと
7. **openai.com 公式ブログ本文が 403** で取れないため、OpenAI の蒸留・料金系は developers.openai.com(docs/cookbook)を一次参照にした。記事で openai.com ブログを引く場合はアクセス可否を再確認
