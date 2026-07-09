# 14-ux-and-product — UX・プロダクトデザイン

非決定的な AI システムの**体験設計**を扱うセクションです。従来のデザイン原則がそのまま通用しない領域 — 不確実性をどう見せるか・信頼をどう築くか・そもそもチャットでよいのか・プロアクティブ性の均衡点・アクセシビリティ — を、名前の付いたパターンと設計判断として体系化します。

- **置くもの**: AI プロダクト固有の UX パターン、会話設計(ペルソナ・トーン・境界)、チャット以外の UI、プロアクティブ体験の設計、AI UI のアクセシビリティ
- **置かないもの**: ビジュアル/ブランドデザインの一般論、特定 UI ライブラリ・デザインシステムの解説、実装パターン(→ [ストリーミングと Agent の UX 実装パターン](../03-implementation/streaming-and-agent-ux.md) が正本)

> **実装は 03 が正本です**: 進捗提示・ストリーミング・中断などの**実装**は [ストリーミングと Agent の UX 実装パターン](../03-implementation/streaming-and-agent-ux.md) が正本のまま維持されます。本セクションはその上位の「パターン言語」と、実装以前の体験設計を扱います。承認・介入の設計は [Human-in-the-Loop 設計](../02-architecture/human-in-the-loop.md)、価格設計は事業判断の性格から [AI 機能の価格設計とパッケージング](../09-business/ai-pricing-and-packaging.md)(09-business)に置いています。

## 収録予定ドキュメント

ファイル名がリンクになっているものは執筆済みです(バッククォートのみの名前は計画段階)。

| ファイル | 内容 |
| --- | --- |
| [ai-ux-patterns.md](ai-ux-patterns.md) | AI プロダクトの UX パターン(不確実性の提示・誤りと訂正・待ち時間・信頼の較正・自動化レベルの提示・初回体験) |
| [conversation-design.md](conversation-design.md) | 会話設計(ペルソナ・トーン・話題の境界と断り方・会話の構造・記憶の見せ方・多言語) |
| [beyond-chat-ui.md](beyond-chat-ui.md) | チャットを超える UI(プロンプトレス設計・成果物中心 UI・インライン支援・バックグラウンド実行) |
| [proactive-agent-ux.md](proactive-agent-ux.md) | プロアクティブエージェントの UX(段階・介入の閾値・ユーザー制御・通知疲れと信頼の損耗) |
| [accessibility-and-ai.md](accessibility-and-ai.md) | アクセシビリティと AI(AI UI の a11y・認知負荷・AI による支援・多様なリテラシー) |

価格設計は [AI 機能の価格設計とパッケージング](../09-business/ai-pricing-and-packaging.md)(09-business)にあります。

執筆順・タスク分割はリポジトリ直下の `UX-PRODUCT-PLAN.md` と `ROADMAP.md`(Phase AM・AN)を参照してください。
