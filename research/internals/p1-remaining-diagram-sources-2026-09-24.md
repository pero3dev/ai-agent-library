# D1/F2 一次資料確認（読み取り専用）

記録日時: 2026-09-24T14:23:50.635Z

判定: 承認済計画の8論点・16置換は、以下の限定を守る範囲で根拠に対応する。本文は未適用。全beforeが現行本文でちょうど1件に一致し、メモリ内の逐次置換でも16件とも衝突なし。最終候補本文の独立レビューは後続実装時に必要。

## 対象・所有・権限

D1/F2の承認済計画にある8論点16置換の一次根拠と実本文一致を記録。正式manifestと最終候補の独立レビューはrootが実装時に行う。

- 計画: project/records/2026-09-24/p1-remaining-storyboards.json / SHA-256 1cef526de4f41aebe195360c50c526386d199f0cd511dc477911223a4a4a7319
- docs/11-llm-internals/alignment-theory.md / SHA-256 6bb4501e5fcd44323a0890d20286cc6e597ab042997df47d2cf9fa2ddabd480b
- docs/10-llm-foundations/multimodal-models.md / SHA-256 151625bf1c3c744cbb5ed04b4de827e4dea9810e6d45844d6cc54d974da28033
- 所有: TEMP/p1-remaining-source-evidence.md と .json。rootから明示された公開一次資料の読み取り調査。記事・製品・Gitは変更しない。
- AGENTS.md、執筆規約、publish-reviewの記事変更証拠契約、harness-change schema、ROADMAP T-1/AR-2を参照。

## 取得・版・書誌

accessedAtはweb取得呼出し完了直後のclock UTC秒。HTMLのCrawled日時を採用しない。planProvenance内の以前の確認日時は履歴として保存し、新規取得日時に流用しない。未指定版URLは取得本文に表示された版を記録。

### lightman

[Let's Verify Step by Step](https://arxiv.org/html/2305.20050v1) — Hunter Lightman et al.

- 取得本文: arXiv:2305.20050v1; 初版: 2023-05-31T17:24:00Z
- 本文アクセス: 2026-09-24T14:14:51Z; [書誌](https://arxiv.org/abs/2305.20050v1)アクセス: 2026-09-24T14:15:46Z
- 書誌と本文の該当節を実取得して確認。
- 計画指定の一次資料。

- L-OUTCOME: §2 Methods; §2.5 Outcome-supervised Reward Models (ORMs) (HTML lines 90–94, 121–123) — 結果への監督からORMを学習する。MATHでは最終答えの照合をラベルに用いるため、結果評価という粒度と報酬の生成方法は別の区分。
- L-PROCESS: §2.4 Data Collection; §2.6 Process-supervised Reward Models (PRMs) (HTML lines 106–115, 124–128) — 人手で各推論ステップを評価し、そのラベルでPRMを学習する。
- L-SCOPE: §2.1 Scope; §6.2 Generalizing Beyond Math (HTML lines 95–98, 180–184) — 生成方策をRLで学習する実験ではなく、報酬モデルとbest-of-Nの評価。数学外への一般化は未確定。
- 限界: 結果/過程は評価粒度を区別する。結果評価だから学習報酬モデルを使わない、報酬ハッキングを防げるとはいえない。
- 限界: PRMが数学外でも一律に優れる、全てのプロセス報酬がRLVRの下位方式、という主張はしない。

### deepseek-r1

[DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/html/2501.12948v1) — DeepSeek-AI et al.

- 取得本文: arXiv:2501.12948v1; 初版: 2025-01-22T15:19:35Z
- 本文アクセス: 2026-09-24T14:14:51Z; [書誌](https://arxiv.org/abs/2501.12948v1)アクセス: 2026-09-24T14:15:46Z
- 書誌と本文の該当節を実取得して確認。
- 計画指定の一次資料。

- D-RULES: §2.2.2 Reward Modeling (HTML lines 161–170) — R1-Zeroは正答・テストと形式に基づくルール報酬を採用し、neuralなORM/PRMは使わない。
- D-LIMITS: §4.2 Unsuccessful Attempts / Process Reward Model (PRM) (HTML lines 345–351) — 同研究のPRM試行の難点を述べるが、手法一般が不可能であるとの結論ではない。
- 限界: v1のR1-Zeroという特定実装の確認。全推論モデルや全LLMの学習方法へ一般化しない。
- 限界: metadataには2026-01-04のv2も存在したが、その本文は未読。v1を最新報告とは表記しない。

### flamingo

[Flamingo: a Visual Language Model for Few-Shot Learning](https://arxiv.org/html/2204.14198v1) — Jean-Baptiste Alayrac et al.

- 取得本文: arXiv:2204.14198v1; 初版: 2022-04-29T16:29:01Z
- 本文アクセス: 2026-09-24T14:14:51Z; [書誌](https://arxiv.org/abs/2204.14198v1)アクセス: 2026-09-24T14:15:46Z
- 書誌と本文の該当節を実取得して確認。
- 計画指定の一次資料。

- F-CONNECTION: §3.1.2 Conditioning a frozen language model on visual representations; Figures 3 and 5 (HTML lines 260–266, 285–287) — 視覚表現をcross-attentionで言語モデルへ接続する構成があり、全モデルを一つの連結方式で説明できない。
- F-RESAMPLER: §3.1.1 Visual processing and the Perceiver Resampler; Figure 4 (HTML lines 271–284) — 入力解像度やフレーム数で変わる特徴列を固定64個の視覚出力へ変換するため、解像度と出力視覚トークン数は恒等関係ではない。
- 限界: 固定64出力は前段の画像処理費用やサービス課金が一定であることを示さない。価格・速度の優劣は検証していない。
- 限界: FlamingoをViTパッチ方式や単一の画像/テキスト連結方式として描かない。音声の特定構成は確認していない。
- 限界: v2は2022-11-15の版があるが本文未読。今回の対象は指定v1。

### vit

[An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale](https://arxiv.org/html/2010.11929) — Alexey Dosovitskiy et al.

- 取得本文: arXiv:2010.11929v2; 初版: 2020-10-22T17:55:59Z; この版: 2021-06-03T13:08:56Z
- 本文アクセス: 2026-09-24T14:14:51Z; [書誌](https://arxiv.org/abs/2010.11929)アクセス: 2026-09-24T14:15:46Z
- 書誌と本文の該当節を実取得して確認。
- 計画指定の一次資料。

- V-PATCH: Abstract; §3 Figure 1; §3.1 Vision Transformer (ViT); §3.2 Fine-tuning and Higher Resolution (HTML lines 59–62, 87–110) — 画像を固定サイズのパッチへ分割し、線形射影した埋込列で処理する画像認識の構成例。固定パッチ寸法では高解像度ほど列が長くなる。
- 限界: 画像認識用Transformerの論文であり、これだけでは画像/テキストを同一の言語モデル系列に接続する実証にはならない。
- 限界: ViTのパッチ数の関係を各製品の課金トークンや料金へ一般化しない。本文はv2だが既存文献の2020年表記は初版年として正しい。

### textvqa

[Towards VQA Models That Can Read](https://arxiv.org/html/1904.08920) — Amanpreet Singh et al.

- 取得本文: arXiv:1904.08920v2; 初版: 2019-04-18T17:55:37Z; この版: 2019-05-13T23:28:48Z
- 本文アクセス: 2026-09-24T14:14:51Z; [書誌](https://arxiv.org/abs/1904.08920)アクセス: 2026-09-24T14:15:46Z
- 書誌と本文の該当節を実取得して確認。
- 計画指定の一次資料。

- T-CONTEXT: Abstract; §1 Introduction; §3 Model / §3.1 VQA Module / §3.2 Text Reading Module / §3.3 Answer Module (HTML lines 46–71, 110–140) — 読み取った文字に加えて画像と質問の文脈を利用するVQA研究。OCR文字列があるだけで必要な位置・外観情報まで保たれるとはいえない。
- 限界: 特定APIの料金比較や、テキスト・画像の一般的な費用の優劣は検証していない。
- 限界: 画像が常に必要、OCRが常に不適切、という結論ではない。既存構造化データで必要情報が保たれる場合も否定しない。

### llava-auxiliary

[Visual Instruction Tuning](https://arxiv.org/html/2304.08485) — Haotian Liu, Chunyuan Li, Qingyang Wu, Yong Jae Lee

- 取得本文: arXiv:2304.08485v2; 初版: 2023-04-17T17:59:25Z; この版: 2023-12-11T17:46:14Z
- 本文アクセス: 2026-09-24T14:16:26Z; [書誌](https://arxiv.org/abs/2304.08485)アクセス: 2026-09-24T14:19:47Z
- 該当節詳細アクセス: 2026-09-24T14:19:47Z
- 計画外の補助一次資料。既存の構成例の実在性を支える用途だけ。

- LV-EXAMPLE: §4.1 Architecture; §4.2 Training; Equations 1–3 and Table 2 (HTML lines 111–131) — 画像特徴を言語の埋込空間へ線形射影し、画像と指示を系列へ組み込む具体的構成例。
- 限界: M1/M3に既にある例の実在性を補強する追加根拠だけ。本文の16置換、図解方式、追加解説の範囲を変えない。
- 限界: Flamingoにはこの接続方式を帰属させず、ViTだけで画像/テキスト系列を証明したとも扱わない。LLaVAの方式を全モデルへ一般化しない。

## 16置換と根拠の対応

逐語の論文引用は0語。原文/置換案は計画から転記し、独自に本文を追加・変更していない。各claim IDの根拠は上節およびJSON sourcesを参照。過去の計画取得日時はJSON planProvenanceに隔離した。

### A1 / A1

docs/11-llm-internals/alignment-theory.md:93 — 検証可能報酬(RLVR)とプロセス報酬

- before一致: 1; 根拠: L-OUTCOME, L-SCOPE

置換前:

**結果報酬**: 最終答えが正しいか(テストが通るか)だけを報酬にする。報酬モデルの誤差・ハッキングを避けられる一方、途中の誤った推論を咎められない

置換後:

**結果報酬**: 最終答えが正しいか(テストが通るか)を評価する。機械的に検証する構成も、結果を評価する報酬モデルを学習する構成もあり、途中の誤った推論は直接評価しない

### A2 / A2

docs/11-llm-internals/alignment-theory.md:96 — 検証可能報酬(RLVR)とプロセス報酬

- before一致: 1; 根拠: L-PROCESS, L-SCOPE, D-RULES, D-LIMITS

置換前:

RLVR は、**推論モデル(考える時間を使う LLM)の学習**を支える枠組みで、[推論モデル](../10-llm-foundations/reasoning-models.md)が検証可能な問題で強い理由の 1 つです。検証器が用意できるタスクに限られる点が本質的な制約です。

置換後:

RLVR は、**推論モデル(考える時間を使う LLM)の学習**を支える枠組みの一つです([推論モデル](../10-llm-foundations/reasoning-models.md))。報酬を検証できる範囲が制約となります。結果/プロセス報酬は評価する粒度の区分で、プロセス報酬には人手のステップ評価から学習する構成もあります。

### A3 / A3

docs/11-llm-internals/alignment-theory.md:130 — チェックリスト

- before一致: 1; 根拠: L-OUTCOME, L-PROCESS

置換前:

RLVR・プロセス報酬が検証可能タスクに限られると理解している

置換後:

RLVR の検証器と、プロセス報酬の各ステップへの評価を区別できる

### M1 / M1

docs/10-llm-foundations/multimodal-models.md:38 — 概要: 分担と「同じ土俵に載せる」

- before一致: 1; 根拠: F-CONNECTION, LV-EXAMPLE

置換前:

本記事はその内部の直感を扱い、それを使ってエージェントを作る側は

置換後:

本記事は、画像表現をテキスト系列に接続する構成を例に内部の直感を扱い、それを使ってエージェントを作る側は

### M2 / M2

docs/10-llm-foundations/multimodal-models.md:45 — 直感①: すべてを「表現ベクトルの列」に変換する

- before一致: 1; 根拠: F-CONNECTION

置換前:

画像や音声は、専用の変換器(エンコーダ)を通して、**同じ形の表現ベクトルの列**に変換します

置換後:

画像や音声は、専用の変換器などで数値表現に変換し、言語モデルへ接続します。具体的な形式・接続方法は構成により異なります

### M3 / M3

docs/10-llm-foundations/multimodal-models.md:46 — 直感①: すべてを「表現ベクトルの列」に変換する

- before一致: 1; 根拠: F-CONNECTION, V-PATCH, LV-EXAMPLE

置換前:

こうして、入力の種類が違っても、モデルの内部では**同じ形式のベクトル列**になります。あとはテキストと同じように処理できます

置換後:

本記事の例では、異なる入力を**同じ形式のベクトル列**に揃え、テキストとともに処理します

### M4 / M4

docs/10-llm-foundations/multimodal-models.md:72 — なぜ効くのか、どこで崖が来るのか

- before一致: 1; 根拠: F-RESAMPLER

置換前:

**解像度がトレードオフ**: 細部を読ませたいなら解像度(=トークン数=コスト)を上げる必要があり、精度とコストが直結します。低解像度で渡して「読めない」のは、多くの場合モデルの知能ではなく入力の粒度の問題です

置換後:

**解像度がトレードオフ**: 細部の読み取りには入力の粒度が影響します。解像度とトークン数・料金の関係はモデルや前処理に依存するため、必要な粒度での精度と費用を比較します

### M4-sync-97 / M4

docs/10-llm-foundations/multimodal-models.md:97 — アンチパターン

- before一致: 1; 根拠: F-RESAMPLER

置換前:

画像=多数のパッチ=多数のトークンとして見積もる

置換後:

画像のトークン換算・料金は採用モデルの仕様で見積もる

### M4-sync-98 / M4

docs/10-llm-foundations/multimodal-models.md:98 — アンチパターン

- before一致: 1; 根拠: F-RESAMPLER

置換前:

読み取りに要る解像度(=コスト)を確保するか、関心領域を切り出す

置換後:

読み取りに要る解像度を確保するか、関心領域を切り出す

### M5 / M5

docs/10-llm-foundations/multimodal-models.md:81 — トークン経済とコスト・レイテンシ設計

- before一致: 1; 根拠: T-CONTEXT

置換前:

**テキストで足りるなら渡さない**: OCR 済みテキストや構造化データがあるなら、画像より安く確実です。マルチモーダルは「テキスト化できない情報」にこそ使います

置換後:

**テキストで足りるか確かめる**: OCR 済みテキストや構造化データで必要な情報が保たれる場合は、画像入力と精度・費用を比較します。位置や外観が必要なら画像も使い、重要な読み取りは検証します

### M5-sync-100 / M5

docs/10-llm-foundations/multimodal-models.md:100 — アンチパターン

- before一致: 1; 根拠: T-CONTEXT

置換前:

**テキストで足りるのに画像を渡す** → 高コスト・低確実性を招く → テキスト化できるものはテキストで渡し、画像は最後の手段にする

置換後:

**テキスト化できるだけで入力方式を決める** → 位置や外観の情報、認識誤りを見落とす → 必要な情報が保たれるか確認し、精度・費用を比較する

### M4-sync-55 / M4

docs/10-llm-foundations/multimodal-models.md:55 — 直感②: 画像は「パッチ」に分けてトークン相当にする

- before一致: 1; 根拠: F-RESAMPLER

置換前:

だから、画像は**トークンを消費します**([トークナイザとトークン経済](tokenization.md))。1 枚の画像が何十〜何百トークン分にもなり、**解像度が高い・大きい画像ほど多くのトークン**を食います

置換後:

画像入力も、採用モデルの換算方法に応じて**トークンや料金を消費します**([トークナイザとトークン経済](tokenization.md))。解像度・サイズと消費量の関係は、モデルや前処理によって異なります

### M4-sync-56 / M4

docs/10-llm-foundations/multimodal-models.md:56 — 直感②: 画像は「パッチ」に分けてトークン相当にする

- before一致: 1; 根拠: F-RESAMPLER

置換前:

これが「画像を入れたら急にコンテキストとコストが増えた」の正体です。画像は「1 個の入力」ではなく「多数のパッチ=多数のトークン」として扱われます

置換後:

画像は「1 個の入力」でも内部では多数の表現に変換されるため、コンテキストと費用への影響を採用モデルの仕様で確認します

### M4-sync-79 / M4

docs/10-llm-foundations/multimodal-models.md:79 — トークン経済とコスト・レイテンシ設計

- before一致: 1; 根拠: F-RESAMPLER

置換前:

画像・音声・動画はトークンを大量に消費します。とくに動画は多数のフレーム=多数の画像で、コストとレイテンシが跳ねます

置換後:

画像・音声・動画は、モデルや処理方法に応じてトークン・費用・レイテンシに影響します。動画は利用するフレーム数も確認します

### M4-sync-105 / M4

docs/10-llm-foundations/multimodal-models.md:105 — チェックリスト

- before一致: 1; 根拠: F-RESAMPLER

置換前:

画像・音声がトークンを消費し、解像度・枚数でコストが増えることを見積もりに入れた

置換後:

画像・音声のトークン換算・料金を採用モデルの仕様で確認し、見積もりに入れた

### M5-sync-108 / M5

docs/10-llm-foundations/multimodal-models.md:108 — チェックリスト

- before一致: 1; 根拠: T-CONTEXT

置換前:

テキスト化できる情報は画像でなくテキストで渡している

置換後:

必要な情報が保たれることを確かめ、入力方式を精度・費用で比較している

## 注意点と後続の同期

- Lightmanの計画書誌略記は正式題名と異なるため、正式題名を記録した。既存記事の題名自体は正しい。
- Flamingoは接続方式の反例、ViTはパッチ列の例であり、その2本だけで画像/テキスト系列の具体例を証明したとは扱わない。追加LLaVAはその根拠を補う。16置換案は変更不要。
- トークンの固定出力とサービス課金は別。論文から特定製品の料金や入力方式の費用の優劣を推定しない。
- 既存参照はLightmanとViT。DeepSeek/Flamingo/TextVQA、構成例の直接根拠に使う場合は補助LLaVAも、後続実装で必要な引用・参照元として同期する。
- 実装で使う一次資料だけ参照元に同期し、実取得日の確認日を付ける。
- 今回再確認していない既存資料の確認日は更新しない。
- last_updatedは後続の記事改訂実施日のJSTで付け、今回の調査日を自動転記しない。
- 補助LLaVAは本文の例を成立させる追加根拠候補。新しい本文段落や方式比較は追加しない。

## 未実施と検証結果

- この記録は実装候補本文の承認・published昇格・公開受入ではない。
- 製品料金・実コスト・性能の比較、音声エンコーダの特定実装、全LLMの学習方式を検証していない。
- DPOや他の図のための計画evidenceは今回再検証していない。対象は8論点16置換のみ。
- Web本文の取得と節確認であり、論文実験の再現は未実施。ブラウザー・build・unit・Git操作は本タスクで未実施。
- JSONはsources候補6件・置換16件・論点8件。本文ファイル2件と計画のSHA-256は読み取り前後で一致。JSON manifestSourceCandidatesは正式manifestではなくroot用の候補。
