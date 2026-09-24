# 動的図解の展開状況

開始日: 2026-09-24。状態: **P0・P1の6記事が公開受入完了、C1学習パイプラインを制作中**。全199記事の完了記録ではない。

## 作業契約

- 目的: [採択計画](../../plans/engineering/dynamic-diagrams.md)に沿って、本文を増やさず動的図解を全学習記事へ順に展開する。
- 許可根拠: 計画提示後の「では順に作業を自律的に進めてください」。計画に記した実装、通常の修正、独立レビュー、PR、CI、マージ、Pagesと公開ページの確認を制作単位ごとに進める。有料APIや外部サービス登録は含めない。
- 基準: `ef8e9a9e27a427f9daa0a62226731adf15c5a1e2`、16章199記事。公開先は既存の `pero3dev/ai-agent-library`（PUBLIC）とGitHub Pages。元mainとorigin/mainの一致、既存open PRなしを確認した。
- 所有範囲: 図解のサイト実装・登録・本文装飾・安全性検査・対応試験・サイトREADME、および計画・索引・実施記録。原文は引き続き `docs/` を正本とし、生成物を直接編集しない。
- 規約: [AGENTS.md](../../../AGENTS.md)、[CONTRIBUTING.md](../../../CONTRIBUTING.md)、[Git規約](../../../harness/git-rules.md)、[計画索引](../../README.md)。ROADMAPの既存執筆タスクを再開扱いにはしない。
- 検証: 本文と図の対応、数値・意味モデル、MDX安全性、静的ビルド、操作・明暗・狭幅・低いPC画面・縮小モーション・印刷・JS無効時、独立レビュー、実GitHubと公開ページの確認。
- 終了条件: 初期対象と現行対象の差分を記録し、対象記事の全対応を計画の完成条件で確認する。各段階の公開確認を次段階の開始条件とする。
- 今回の停止境界（後から指定）: ユーザーの「P1の完了まで」「別PCで、コンテキストを完全には引き継げない」という指定に従い、P1全15記事の公開受入で停止する。P2以降の自動着手はしない。[別PCへの引き継ぎ](dynamic-diagram-handoff.md)と貼り付け用プロンプトをリポジトリに残す。

## 進捗

| 段階 | 対象 | 状態 | 記録 |
| --- | --- | --- | --- |
| 計画 | 全199記事 | 計画作成・独立レビュー済み、採択 | [全件棚卸し](../../plans/engineering/dynamic-diagram-inventory.md)、[計画作成記録](dynamic-diagram-plan.md) |
| P0 | 共通基盤・自己注意・Agentループ・Workflow比較 | PR #52マージ・公開受入完了 | [P0実施記録](reading-diagram-foundation.md) |
| P1 | LLM内部構造・基礎15記事 | Transformer・注意変種・MoE・文章生成・トークン化・推論内部の6/15記事が公開受入完了。C1学習パイプラインを制作中 | [Transformer](transformer-reading-diagrams.md)、[注意変種](attention-variants-reading-diagrams.md)、[MoE](moe-reading-diagrams.md)、[文章生成・トークン化](generation-tokenization-reading-diagrams.md)、[推論内部](inference-reading-diagrams.md) |
| P2 | 中核54記事 | 未着手（P0の2記事は内数） | 今回は着手しない。P1後、別セッションの依頼で再開 |
| P3 | 実装・品質・運用78記事 | 未着手 | P2受入後に着手 |
| P4 | 応用・判断52記事 | 未着手 | P3受入後に着手 |
| P5 | 全体受入・更新運用 | 未着手 | P4受入後に着手 |

図解を一部導入した記事、記事全体の主要論点の割当と受入を完了した記事、公開確認済みの記事を別に数える。公開受入済みは8記事の17図。記事全体の完成基準では6/199記事であり、図の本数を記事の完了数に読み替えない。

## 再開地点

推論内部の[PR #57](https://github.com/pero3dev/ai-agent-library/pull/57)はマージ・公開機械58件成功後、独立画像レビューで表示ラベル修正1件が必要となった。[修正記録](inference-score-label-fix.md)に従い、`fix/inference-score-labels` の[PR #58](https://github.com/pero3dev/ai-agent-library/pull/58)を提出し、全必須チェック後に `67b1309fcea8267749be6e52881f3d6a4049ae2b` としてマージした。同じmain CIとPages、公開58/58、独立公開レビューapproved / low・must 0を確認し、6記事を公開受入した。6本のPR #58固定スナップショットと以前のPR #56記録を保持する。現在は `feat/training-reading-diagrams` で[C1学習パイプライン](training-reading-diagrams.md)を制作中。共有変更後は新しい入力版で再受入する。他のworktreeや音声制作は変更しない。
