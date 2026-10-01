# P3: フレームワーク・モデル選定・FT／蒸留

## 作業契約と方針

- 3記事を選び、抽象度と移行境界、タスクの条件とモデル構成、学習前の条件とデータ・評価の分離を本文と並べる。文章や具体例の増量を目的にしない。
- 専用モデル・本文対応・SVG・包装・登録・MDX許可・固有試験、本記録と索引・引き継ぎを所有する。原文の表・モデル例・料金の時点・出典・確認日・TODOを保持する。
- 前単位の実マージ後mainから通常PRを提出し、前単位の公開表示後にマージする。通常PR・必要検査・必須CI・squash・既存Pagesは依頼で許可済み。任意レビュー・追加台帳・大量証跡を省き、公開後は表示確認のみ。

| 記事 | 主要論点の割当 | 保持する境界 |
| --- | --- | --- |
| フレームワーク選定 | 小さな生API、3抽象度、8選定軸、なしという選択、業務ロジックと接着層の分離、版と提供段階、移行時の代表タスク | 多機能を採用条件にしない。安定した中核APIを全機能の安定へ拡張せず、分離だけで無償移行を保証しない |
| モデル選定 | 7判断軸、用途別tier、構成の役割分担、routing・fallback・別系統評価、費用の構成、版固定と再評価 | 原文の2026-08時点の例を現在の順位や価格保証にしない。文脈長・tier・公開benchmarkだけで実タスク品質を確定しない |
| FT／蒸留 | 先に試す代替、7前提条件、4手法、提供経路、教師・選別・生徒・評価、代表性・分離・マスク、改善と非劣化、版と再調整 | 学習で最新事実・削除・再現性を保証しない。教師の出力を正解にせず、学習データを評価へ混ぜず、経路の確認を訓練実行やSLA適合へ昇格しない |

3記事の全原文と本文ASTを確認した。2026-10-01に[Microsoft Agent Framework 1.0](https://devblogs.microsoft.com/agent-framework/microsoft-agent-framework-version-1-0/)、[OpenAIの提供終了条件](https://developers.openai.com/api/docs/deprecations)、[GoogleのSFT条件](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/tuning/supervised-tuning)、[新しい事実を学ぶFTの研究](https://arxiv.org/abs/2405.05904)、[Claudeの思考と費用](https://platform.claude.com/docs/en/build-with-claude/thinking-steering-and-cost)を参照した。提供対象・時点・研究条件を図の採用条件と区分し、原文の未確認を保持する。

6図29段階を実装した。root・websiteでnpm ci、共通487成功・3skip、サイト単体568成功、原文AST・時計・意味モデル7検査が成功。静的223ルート・230 HTML、対象ブラウザ11検査が成功し、全段階・全選択肢のPC明色／モバイル暗色、本文同期、前後・シーク・拡大、JS無効、低画面の再生停止・印刷を確認した。PCで6図を目視した。

選択ラベルの孤立した末尾を短く整え、最終静的出力・対象11検査と変更図のPC目視も成功した。依存準備の初回はnpmキャッシュのEPERMで停止し、対象コマンドの許可済み実行経路で回復した。実API・学習・移行は未実施。通常PR・必須CI・squash・Pages・公開表示は未実施で、前単位の実マージ後に進める。

提出baseは[PR #91](https://github.com/pero3dev/ai-agent-library/pull/91)の実squash 26cdb1c88d7b10d21c4c04c549504e3a57e75d5f。前単位の提出headとPR CI 36925745081・必須9検査・実メッセージ・ツリーを確認。文書・リンク・Markdown・差分を提出前に検査する。公開済みは81/199記事で、公開後は表示確認のみ。
