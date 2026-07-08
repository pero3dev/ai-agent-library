# MULTIMODAL-PLAN — モダリティ・生成 AI 応用 追加計画

> **ステータス: 完了(2026-07-07 作成。2026-07-08 に新セクション `12-multimodal` を新設し、Phase Y〔document-ai・vision-understanding-patterns・multimodal-rag〕+ Phase Z〔image-generation-integration・video-ai-overview・speech-synthesis-and-voice-design・realtime-multimodal-agents〕の全 7 本 published。調査 MM-R2 = `research/multimodal/generation.md`、MM-R3 = `research/multimodal/realtime-tts.md`。learning-roadmap を 12 セクション化)。**
> テキスト以外のモダリティ(文書・画像・動画・音声)の**理解と生成**を実務に組み込むための追加計画です。進捗の正本は [ROADMAP.md](ROADMAP.md) に置きます。

## 1. 位置づけとギャップ分析

ライブラリの現状(92 本)はテキスト中心で、モダリティ関連は次の 3 本に限られます。

| 既存 | カバー範囲 | 正本のまま維持 |
| --- | --- | --- |
| [computer-use-and-multimodal-agents](docs/01-concepts/computer-use-and-multimodal-agents.md)(01) | 画面観測型 Agent の概念 | ✓ |
| [computer-use-implementation](docs/03-implementation/computer-use-implementation.md) / [voice-agents](docs/03-implementation/voice-agents.md)(03) | 画面操作の実装 / 音声対話ループ | ✓ |
| [physical-ai-overview](docs/01-concepts/physical-ai-overview.md)(01) | 物理世界(VLA) | ✓ |

ギャップ: **(a) 文書・画像・動画の「理解」の実務**(帳票・PDF の構造化、図表読解、マルチモーダル RAG)、**(b) 「生成」のプロダクト組み込み**(画像・動画・音声合成の選定・権利・安全)、**(c) リアルタイム観測**(カメラ・画面共有の継続入力)が未カバーです。とくにドキュメント AI は RAG の取り込み([rag-implementation-patterns](docs/03-implementation/rag-implementation-patterns.md))の前段として実務需要が大きい領域です。

### 配置

**新セクション `docs/12-multimodal/`(モダリティ・生成 AI 応用)を推奨**します。理由: (1) 7 本規模のまとまったテーマで、ライフサイクル章(01〜05)ではなく独立テーマ章(08〜11 と同型)の性格を持つ、(2) 03-implementation は DEEP-DIVE 完了後に 18 本となり、さらに 7 本を足すと肥大しすぎる。既存の voice-agents / computer-use-implementation は **03 の正本のまま動かさず**、12 のセクション README から「対話ループ・画面操作はこちら」と参照します(公開済み URL を壊さないため)。

代替案(03 内サブシリーズ)は §8 未確定事項に残します。

## 2. 追加トピック一覧(7 本 + 新セクション 1)

| # | ファイル(docs/12-multimodal/) | 仮タイトル | level | 鮮度 |
| --- | --- | --- | --- | --- |
| 1 | `document-ai.md` | ドキュメント AI(帳票・PDF の構造化) | intermediate | 中 |
| 2 | `vision-understanding-patterns.md` | 画像理解の実務パターン | intermediate | 中 |
| 3 | `multimodal-rag.md` | マルチモーダル RAG | advanced | 中 |
| 4 | `image-generation-integration.md` | 画像生成のプロダクト組み込み | intermediate | 中(TODO 前提) |
| 5 | `video-ai-overview.md` | 動画生成・理解の概観 | basic | **速い(鮮度管理型)** |
| 6 | `speech-synthesis-and-voice-design.md` | 音声合成(TTS)と声の設計 | intermediate | 中(TODO 前提) |
| 7 | `realtime-multimodal-agents.md` | リアルタイムマルチモーダル Agent | advanced | **速い(鮮度管理型)** |

## 3. 各ページの設計

### document-ai.md — ドキュメント AI(帳票・PDF の構造化)

- **目的**: スキャン文書・PDF・帳票から、後続処理(RAG・業務システム)に使える構造化データを取り出すパイプラインを設計できる
- **主要トピック**: 入力の多様性(ボーンデジタル PDF / スキャン / 写真)と前処理 / OCR と VLM 直読の使い分け(精度・コスト・レイアウト保持)/ レイアウト解析(表・図・段組・ヘッダーフッター)/ 表の抽出と構造化出力への接続([structured-output](docs/03-implementation/structured-output.md))/ 帳票処理の実務(項目抽出 + 検証ルールの併用・信頼度による人手振り分け)/ 長文書の分割と文書単位のメタデータ / 精度検証(グラウンドトゥルース作成・サンプリング検品)
- **H3 案**: 概要 / 入力の類型と前処理 / OCR か VLM 直読か / レイアウトと表の扱い / 抽出結果の検証 / RAG・業務システムへの接続 / 精度の測り方
- **分担**: 取り込み後の検索 = rag-implementation-patterns、形式の強制 = structured-output

### vision-understanding-patterns.md — 画像理解の実務パターン

- **目的**: VLM(視覚言語モデル)への画像入力を、ユースケース類型別のプロンプトパターンと限界の知識をもって設計できる
- **主要トピック**: ユースケース類型(図表・グラフ読解 / スクリーンショット・UI 解析 / 写真の検品・分類 / 手書き)/ プロンプトパターン(観点の指定・領域への言及・複数画像の比較・画像付き few-shot)/ 構造化出力との併用 / 限界と対策(細かい文字・数え上げ・空間関係・座標の弱さ — [capabilities-and-limits](docs/10-llm-foundations/capabilities-and-limits.md) の視覚版)/ 解像度・トークンコストの構造 / 視覚タスクの評価設計
- **分担**: 画面「操作」= computer-use-implementation(本記事は「読解」まで)

### multimodal-rag.md — マルチモーダル RAG

- **目的**: 画像・図表・PDF を含む知識源で RAG を組む際の 3 つの構成を使い分けられる
- **主要トピック**: 構成の 3 類型(①テキスト化して索引(ドキュメント AI 経由)②マルチモーダル埋め込みで直接検索 ③ページ画像を VLM で読みながら検索)とトレードオフ / 図表の引用・根拠提示(該当箇所の画像を返す)/ ハイブリッド(テキスト + 画像索引の併用)/ 評価(検索と読解の分離)
- **分担**: テキスト RAG の原則 = rag-implementation-patterns(正本)。本記事は差分のみ

### image-generation-integration.md — 画像生成のプロダクト組み込み

- **目的**: 画像生成をデモではなくプロダクト機能として組み込む際の、選定・制御・権利・安全の判断ができる
- **主要トピック**: ユースケース類型(素材生成・バリエーション・編集(インペインティング等)・パーソナライズ)/ 選定軸(品質・指示追従・制御性・速度・コスト — モデル名は挙げず軸で)/ 出力の一貫性管理(スタイル固定・シード・参照画像)/ プロンプト資産の管理([prompt-management](docs/03-implementation/prompt-management.md) の画像版)/ 安全と権利(不適切生成の防止・実在人物・商標 / 生成物の商用利用とライセンス確認 / 来歴表示の潮流)/ 人のレビューゲート設計
- **鮮度**: モデルの顔ぶれは TODO(要確認)前提。権利まわりは断定せず [industry-regulations-map](docs/09-business/industry-regulations-map.md) と同じ「確認先を示す」方式

### video-ai-overview.md — 動画生成・理解の概観(鮮度管理型)

- **目的**: 動画の理解(長尺の質問応答・要約・検索)と生成(テキスト → 動画)の 2026 年時点の現在地と、実務で成立するユースケースの見極めができる
- **主要トピック**: 理解: 入力方式(フレームサンプリング・ネイティブ動画入力)とコスト構造 / 実務ユースケース(会議・監視・教育・メディア資産検索)の現実解 / 生成: 現在地(尺・一貫性・音声同期)と制作ワークフローでの位置(素材・下書き)/ コストと権利の注意
- **鮮度**: llm-landscape と同じ鮮度管理 3 点セット(最終確認日 + アクセス日 + 定点観測)。調査 MM-R2 を執筆前に実施

### speech-synthesis-and-voice-design.md — 音声合成(TTS)と声の設計

- **目的**: 対話ループ以外も含む TTS の実務(読み上げ・ナレーション・通知)と「声」というプロダクト資産の設計ができる
- **主要トピック**: 選定軸(自然さ・レイテンシ・多言語 / 日本語品質・スタイル制御・コスト)/ ストリーミング TTS と応答設計 / 声の設計(ブランドとしての声・ペルソナ整合)/ 音声クローンの利用と統制(本人同意・社内承認・悪用対策)/ 発音制御(固有名詞・読み仮名)/ 評価(了解性・自然さの測り方)
- **分担**: 対話エージェントのループ全体 = [voice-agents](docs/03-implementation/voice-agents.md)(正本)。本記事は出力部品の詳解と非対話用途

### realtime-multimodal-agents.md — リアルタイムマルチモーダル Agent(鮮度管理型)

- **目的**: カメラ・画面共有・音声を**継続的に観測**しながら支援するエージェント(ライブ型)の設計判断ができる
- **主要トピック**: ターン型との違い(常時入力・いつ応答するかの判断)/ 入力設計(フレームレート・解像度とコストの設計・何を送るか)/ プロアクティブ介入の設計(割り込みの節度・確信度による発話判断)/ セッションとコンテキストの管理(長時間ストリームの圧縮)/ プライバシー(常時観測の同意・録画の扱い — [conversation-data-management](docs/05-operations/conversation-data-management.md) の映像版)/ 提供状況(2026-07 時点の類型)
- **鮮度**: 提供 API の状況は速い。調査 MM-R3 を執筆前に実施(P-R3 の音声調査メモを起点に差分)
- **分担**: 音声のみのリアルタイム対話 = voice-agents、画面操作 = computer-use-implementation(本記事は観測・支援側)

## 4. スコープ外(検討のうえ除外)

- **生成モデルの内部構造**(拡散モデルの理論等): 本計画は応用まで。学術詳解が必要になれば [LLM-INTERNALS-PLAN.md](LLM-INTERNALS-PLAN.md) の拡張として別途判断
- **クリエイティブ制作の技法論**(デザイン・映像制作のノウハウ): エンジニアリングの範囲を超える
- **特定ツール・モデルのチュートリアル**: 選定軸と類型まで(モデル名の具体は鮮度管理型ページと調査メモに閉じ込める)
- **埋め込みモデル・ベクトル DB の詳解**: 別カテゴリ(データ・知識基盤)の候補として本計画には含めない
- **3D・空間コンピューティング**: 需要が確認できたら将来検討

## 5. フェーズ分割(ROADMAP 追記案)

フェーズ記号は **Y・Z** を使います(M〜O = DEEP-DIVE、S〜U = LLM-INTERNALS、V・X = SE。W は Web 化フェーズのため欠番。Z 以降の将来計画は AA〜 の 2 文字に移行)。

| フェーズ | 内容 | 成果物 | 備考 |
| --- | --- | --- | --- |
| Y-0 | 12-multimodal スケルトン(セクション README・doc-template の category・website 反映・ルート README) | `12-multimodal/README.md` ほか同期一式 | 配置の確定(§8-1)を経て実施 |
| Y-1 | ドキュメント AI + 画像理解 | `document-ai.md`, `vision-understanding-patterns.md` | 原則安定。執筆時の部分確認のみ |
| Y-2 | マルチモーダル RAG | `multimodal-rag.md` | 調査不要 |
| Y-R | Phase Y レビュー(rag・structured-output・computer-use からの逆リンク、published 化、同期一式) | — | — |
| Z-1 | 画像生成の組み込み + 動画概観(MM-R2 反映・鮮度管理型) | `image-generation-integration.md`, `video-ai-overview.md` | MM-R2 必須 |
| Z-2 | 音声合成と声の設計 + リアルタイムマルチモーダル(MM-R3 反映・鮮度管理型) | `speech-synthesis-and-voice-design.md`, `realtime-multimodal-agents.md` | MM-R3 必須 |
| Z-R | Phase Z レビュー + 統合(learning-roadmap の 12 セクション化・依存マップ更新・voice-agents / computer-use との相互リンク総点検・定期メンテナンスへの定点観測追加) | — | — |

完了時の規模: **92 → 99 本**(+ 新セクション 1。承認済み他計画とすべて完了なら 121 本)。

## 6. 執筆前調査

| ID | 対象 | 出力先 | 時期 |
| --- | --- | --- | --- |
| MM-R2 | 画像・動画生成の提供状況(主要モデルの類型・提供形態・商用利用条件・来歴機能。公式一次情報のみ。スコアや作例の優劣比較はしない) | `research/multimodal/generation.md` | Z-1 着手時(必須) |
| MM-R3 | リアルタイムマルチモーダル API と TTS の現状(画面・カメラ入力対応・TTS の日本語/クローン提供条件。`research/professional/voice-agents.md`(P-R3、2026-07-07)を起点に差分調査) | `research/multimodal/realtime-tts.md` | Z-2 着手時(必須) |

ドキュメント AI・画像理解・マルチモーダル RAG(Y 系)は原則が安定しているため専用調査は不要とし、執筆時の部分確認のみとします。

## 7. 同期・派生作業

- **GLOSSARY 候補**(執筆時確定): VLM(視覚言語モデル)— physical-ai-overview でも既出のため優先、ドキュメント AI(document AI)、OCR、マルチモーダル RAG、インペインティング(inpainting)、音声クローン(voice cloning)。既存「マルチモーダル」エントリはリンク先の拡張を検討
- **learning-roadmap / 依存マップ**(Z-R): 12 セクション化。12 は「03 の実装を前提とするモダリティ応用」として `I3 -.-> MM12` の点線接続を想定。website の dependency-graph.jsx・SECTION_TITLES(`multimodal: '12. モダリティ応用'`)・index.mdx を同期
- **doc-template**: category 列挙に `multimodal` を追加(Y-0)
- **逆リンク**(各 X-R で実施): rag-implementation-patterns → document-ai / multimodal-rag、structured-output → document-ai、computer-use-and-multimodal-agents(01)→ vision-understanding-patterns / realtime-multimodal-agents、voice-agents → speech-synthesis / realtime-multimodal-agents、conversation-data-management → realtime-multimodal-agents(常時観測データ)
- **定期メンテナンス**(Z-R): 「生成 AI(画像・動画)・リアルタイム API の定点観測」を ROADMAP に追加(research/multimodal/ を更新起点に)

## 8. 未確定事項(着手時に確認)

1. **配置**: 推奨は新セクション `12-multimodal`。代替案は 03-implementation 内サブシリーズ(接頭辞なしで 7 本追加 — 03 が 25 本まで肥大する点が難)
2. **7 本の粒度**: 縮小案は 5 本(#5 動画を #7 リアルタイムに統合、#6 TTS を voice-agents の改訂で吸収)。網羅性を優先するなら 7 本を推奨
3. **セクション名**: `12-multimodal`(表示名「12. モダリティ応用」)。代替: `12-multimodal-ai`

## 9. TODO

> **TODO(要確認):** MM-R2(画像・動画生成)・MM-R3(リアルタイム・TTS)は各フェーズ着手時に実施する。生成系の商用利用条件・来歴機能は変化が速く、法的論点は断定せず確認先の提示に徹する(最終確認: 2026-07)
