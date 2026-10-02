# 動的図解の展開状況

開始日: 2026-09-24。2026-10-02現在、P1は15/15、P2は54/54、P3は24/78、P4は0/52、初期対象199記事中93記事がPages・表示確認まで完了。前単位PR #123は必須CI・squash済み。公開結果は各PR本文を参照。[今回の単位](../2026-10-02/vendor-prompt-controls-diagrams.md)3記事9図41段階をローカル検証済み。次はモデル横断・MCP・評価基礎3記事。P5完了まで継続する。任意レビュー・追加台帳・大量証跡を省き、公開後は表示確認のみ。 以下の独立受入・固定snapshotは旧手順の履歴である。

2026-10-01のユーザー指示を優先し、親担当だけで進める。追加ハッシュ・証跡アーカイブ・任意の独立図解レビュー・公開後の網羅検査を省略する。1〜3記事ずつ実装・必要な検査・通常PR・squashマージ・Pages公開を進め、公開後は表示確認だけを行う。以前のP1停止指定は、P5までの継続依頼で更新された。

## 作業契約

- 目的: [採択計画](../../plans/engineering/dynamic-diagrams.md)に沿って、本文を増やさず動的図解を全学習記事へ順に展開する。
- 許可根拠: 計画提示後の「では順に作業を自律的に進めてください」。計画に記した実装、通常の修正、独立レビュー、PR、CI、マージ、Pagesと公開ページの確認を制作単位ごとに進める。有料APIや外部サービス登録は含めない。
- 基準: `ef8e9a9e27a427f9daa0a62226731adf15c5a1e2`、16章199記事。公開先は既存の `pero3dev/ai-agent-library`（PUBLIC）とGitHub Pages。元mainとorigin/mainの一致、既存open PRなしを確認した。
- 所有範囲: 図解のサイト実装・登録・本文装飾・安全性検査・対応試験・サイトREADME、および計画・索引・実施記録。原文は引き続き `docs/` を正本とし、生成物を直接編集しない。
- 規約: [AGENTS.md](../../../AGENTS.md)、[CONTRIBUTING.md](../../../CONTRIBUTING.md)、[Git規約](../../../harness/git-rules.md)、[計画索引](../../README.md)。ROADMAPの既存執筆タスクを再開扱いにはしない。
- 検証: 本文と図の対応、数値・意味モデル、MDX安全性、静的ビルド、操作・明暗・狭幅・低いPC画面・縮小モーション・印刷・JS無効時、独立レビュー、実GitHubと公開ページの確認。
- 終了条件: 初期対象と現行対象の差分を記録し、対象記事の全対応を計画の完成条件で確認する。各段階の公開確認を次段階の開始条件とする。
- 現在の停止境界: 2026-10-01の「続きからP5完了まで」に従い、P2〜P4を制作し、P5全体受入まで進める。以前のP1停止指定を引き継がない。[引き継ぎ](dynamic-diagram-handoff.md)には現在地を残す。

## 進捗

| 段階 | 対象 | 状態 | 記録 |
| --- | --- | --- | --- |
| 計画 | 全199記事 | 計画作成・独立レビュー済み、採択 | [全件棚卸し](../../plans/engineering/dynamic-diagram-inventory.md)、[計画作成記録](dynamic-diagram-plan.md) |
| P0 | 共通基盤・自己注意・Agentループ・Workflow比較 | PR #52マージ・公開受入完了 | [P0実施記録](reading-diagram-foundation.md) |
| P1 | LLM内部構造・基礎15記事 | 15/15記事が公開完了（PR #65） | [P1完了](../2026-10-01/p1-completion.md) |
| P2 | 中核54記事 | 54/54記事がPages・表示確認まで完了 | 完了結果は各PR本文を参照 |
| P3 | 実装・品質・運用78記事 | 24/78記事がPages・表示確認まで完了 | 今回の単位と各PR本文を参照 |
| P4 | 応用・判断52記事 | 0/52記事がPages・表示確認まで完了 | P3から順に継続 |
| P5 | 全体受入・更新運用 | 未着手 | P4受入後に着手 |

図解を一部導入した記事、記事全体の主要論点の割当と受入を完了した記事、公開確認済みの記事を別に数える。PR #63時点の公開受入済みはP0の部分導入2記事を含む11記事の27図。記事全体の完成基準では9/199記事（P1の9/15記事）であり、図の本数を記事の完了数に読み替えない。

## 再開地点

推論内部の[PR #57](https://github.com/pero3dev/ai-agent-library/pull/57)はマージ・公開機械58件成功後、独立画像レビューで表示ラベル修正1件が必要となった。[修正記録](inference-score-label-fix.md)に従い、`fix/inference-score-labels` の[PR #58](https://github.com/pero3dev/ai-agent-library/pull/58)を提出し、全必須チェック後に `67b1309fcea8267749be6e52881f3d6a4049ae2b` としてマージした。同じmain CIとPages、公開58/58、独立公開レビューapproved / low・must 0を確認し、6記事を公開受入した。6本のPR #58固定スナップショットと以前のPR #56記録を保持する。続く[C1学習パイプライン](training-reading-diagrams.md)の[PR #59](https://github.com/pero3dev/ai-agent-library/pull/59)は `517dc8b5166bd7b0c85baef3800d7fe57bac7b31` でマージされ、main CI `36019573674`・Pages `107704025706` と同artifactの公開HTMLを確認した。C1両engine 13/13、Edge全71/71、原WebKit66/71と元assertを保つ限定5/5、[独立公開画像レビュー](training-public-review.md)approved / low・must 0を確認し、7記事のPR #59固定snapshotと7 completeのCLI結果を保存した。次は `feat/pretraining-reading-diagrams` の[C2事前学習](../2026-09-25/pretraining-reading-diagrams.md)。共有変更後は新しい入力版で再受入する。他のworktreeや音声制作は変更しない。

C2は2026-09-30 JSTに実装・独立ローカル画像レビューと正式記事レビューを完了し、PR #61で公開した。公開Edge/WebKit両91/91は成功したが、独立画像レビューで旧推論図の6桁ロジット表示にmust 1を確認した。その後、[表示間隔の修正](../2026-09-30/inference-score-spacing-fix.md)をPR #62で公開し、両engine 91/91と独立公開レビューの承認を得て8/15記事を完了した。PR #61の未受入結果は履歴として保持する。[D1アラインメント](../2026-09-30/alignment-reading-diagrams.md)はPR #63で公開し、Edge107/107・WebKit初回106/107と条件不変の限定2/2・137実視認の独立レビューにより9記事を公開受入した。初回失敗と原因未確定の限界を原本に保持する。[9記事の固定受入](../2026-09-30/diagram-acceptance-pr63.json)を保存し、次の[D2推論モデル](../2026-09-30/reasoning-reading-diagrams.md)を実装中。
