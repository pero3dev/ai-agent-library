# 動的図解の展開状況

開始日: 2026-09-24。状態: **P0公開受入完了、P1のTransformer記事を公開手続き中**。全199記事の完了記録ではない。

## 作業契約

- 目的: [採択計画](../../plans/engineering/dynamic-diagrams.md)に沿って、本文を増やさず動的図解を全学習記事へ順に展開する。
- 許可根拠: 計画提示後の「では順に作業を自律的に進めてください」。計画に記した実装、通常の修正、独立レビュー、PR、CI、マージ、Pagesと公開ページの確認を制作単位ごとに進める。有料APIや外部サービス登録は含めない。
- 基準: `ef8e9a9e27a427f9daa0a62226731adf15c5a1e2`、16章199記事。公開先は既存の `pero3dev/ai-agent-library`（PUBLIC）とGitHub Pages。元mainとorigin/mainの一致、既存open PRなしを確認した。
- 所有範囲: 図解のサイト実装・登録・本文装飾・安全性検査・対応試験・サイトREADME、および計画・索引・実施記録。原文は引き続き `docs/` を正本とし、生成物を直接編集しない。
- 規約: [AGENTS.md](../../../AGENTS.md)、[CONTRIBUTING.md](../../../CONTRIBUTING.md)、[Git規約](../../../harness/git-rules.md)、[計画索引](../../README.md)。ROADMAPの既存執筆タスクを再開扱いにはしない。
- 検証: 本文と図の対応、数値・意味モデル、MDX安全性、静的ビルド、操作・明暗・狭幅・低いPC画面・縮小モーション・印刷・JS無効時、独立レビュー、実GitHubと公開ページの確認。
- 終了条件: 初期対象と現行対象の差分を記録し、対象記事の全対応を計画の完成条件で確認する。各段階の公開確認を次段階の開始条件とする。

## 進捗

| 段階 | 対象 | 状態 | 記録 |
| --- | --- | --- | --- |
| 計画 | 全199記事 | 計画作成・独立レビュー済み、採択 | [全件棚卸し](../../plans/engineering/dynamic-diagram-inventory.md)、[計画作成記録](dynamic-diagram-plan.md) |
| P0 | 共通基盤・自己注意・Agentループ・Workflow比較 | PR #52マージ・公開受入完了 | [P0実施記録](reading-diagram-foundation.md) |
| P1 | LLM内部構造・基礎15記事 | Transformer1記事のローカル受入完了、公開手続き中。0/15記事完了 | [制作記録](transformer-reading-diagrams.md) |
| P2 | 中核54記事 | 未着手（P0の2記事は内数） | P1受入後に着手 |
| P3 | 実装・品質・運用78記事 | 未着手 | P2受入後に着手 |
| P4 | 応用・判断52記事 | 未着手 | P3受入後に着手 |
| P5 | 全体受入・更新運用 | 未着手 | P4受入後に着手 |

図解を一部導入した記事、記事全体の主要論点の割当と受入を完了した記事、公開確認済みの記事を別に数える。公開済みは3記事の3図。記事全体の完成基準では0/199記事であり、図の本数を記事の完了数に読み替えない。

## 再開地点

所有ブランチは `feat/transformer-reading-diagrams`。P0の公開SHA `584a379ccd56f19cc4c31162288f30880be7bb67` を最新mainとして取得し、P1の最初の制作単位を開始した。他のworktreeや音声制作のブランチは変更しない。

P0の3図を共通外枠へ統合し、CIで判明したIntersectionObserverの通知取りこぼしを修正した。[PR #52](https://github.com/pero3dev/ai-agent-library/pull/52)のマージ、main CI、Pages、公開11件の受入まで完了。最終候補はChromium161成功・音声専用5 skip、WebKit42成功、サイト単体126成功。詳細・証拠の境界はP0記録を参照する。

[P1の最初の3記事の絵コンテ](llm-diagram-storyboards.md)を起点に、Transformer1記事（追加3図と既存自己注意）の実装・独立レビュー・ローカル受入を完了。次はPR・CI・Pagesと公開ページの受入を行う。注意変種3図・MoE2図は後続。全31見出しの論点対応を用い、制作単位ごとの公開受入後に進む。
