# 12-multimodal — モダリティ・生成 AI 応用

テキスト以外のモダリティ(文書・画像・動画・音声)の**理解と生成**を実務に組み込むためのセクションです。ドキュメント AI・画像理解・マルチモーダル RAG から、画像・動画・音声の生成、リアルタイム観測型エージェントまでを、選定軸・類型・限界の知識とともに扱います。

- **置くもの**: モダリティの理解(文書構造化・画像読解・マルチモーダル検索)と生成(画像・動画・音声合成)のプロダクト組み込み判断、リアルタイムマルチモーダルの設計
- **置かないもの**: 生成モデルの内部構造(拡散モデルの理論等 → 応用まで)、クリエイティブ制作の技法論、特定ツールのチュートリアル(選定軸と類型まで)

> **対話ループ・画面操作は 03 が正本です**: 音声対話エージェントのループは [音声エージェント(voice agents)](../03-implementation/voice-agents.md)、画面を操作するエージェントの実装は [コンピュータ操作エージェントの実装](../03-implementation/computer-use-implementation.md) が正本のまま維持されます。本セクションは「読解・理解」と「生成」、および「継続観測(支援側)」を扱います。マルチモーダルモデルの内部の直感は [マルチモーダルモデルの仕組み](../10-llm-foundations/multimodal-models.md) を参照してください。

## 収録予定ドキュメント

ファイル名がリンクになっているものは執筆済みです(バッククォートのみの名前は計画段階)。

| ファイル | 内容 |
| --- | --- |
| [document-ai.md](document-ai.md) | ドキュメント AI(帳票・PDF の構造化。OCR と VLM 直読の使い分け・レイアウト解析・抽出結果の検証・RAG への接続) |
| [vision-understanding-patterns.md](vision-understanding-patterns.md) | 画像理解の実務パターン(ユースケース類型別のプロンプト・構造化出力併用・視覚の限界と対策・評価) |
| [multimodal-rag.md](multimodal-rag.md) | マルチモーダル RAG(テキスト化索引・マルチモーダル埋め込み・ページ画像 VLM 読解の 3 構成と使い分け・根拠提示) |
| [image-generation-integration.md](image-generation-integration.md) | 画像生成のプロダクト組み込み(選定軸・一貫性管理・安全と権利・来歴・レビューゲート) |
| [video-ai-overview.md](video-ai-overview.md) | 動画生成・理解の概観(理解と生成の現在地・実務ユースケースの見極め。鮮度管理型) |
| [speech-synthesis-and-voice-design.md](speech-synthesis-and-voice-design.md) | 音声合成(TTS)と声の設計(選定軸・声の設計・音声クローンの統制・発音制御・評価) |
| [realtime-multimodal-agents.md](realtime-multimodal-agents.md) | リアルタイムマルチモーダル Agent(継続観測・応答タイミング・プロアクティブ介入・プライバシー。鮮度管理型) |

執筆順・タスク分割はリポジトリ直下の `MULTIMODAL-PLAN.md` と `ROADMAP.md`(Phase Y・Z)を参照してください。動画・リアルタイム・生成系のページは変化が速いため、各ページ本文冒頭の「最終確認日」を必ず確認してください。
