# TypeScript 段階移行 — 実施記録

開始日: 2026-11-03(JST)。状態: 実装中。

## 作業契約

- 目的: [移行計画](../../plans/engineering/typescript-migration.md)のP0〜P6を順に実施し、主要コードの型検査、既存互換性、CIと必要な公開確認を完了する。
- 許可根拠: 計画提示後のユーザーの「全て完了するまで自律的に作業」「本当に必要な時のみ確認」という依頼。計画段階の操作制限は当時の記録として保持し、本記録を実装・依存追加・検証・通常Git/PR/merge/公開の許可根拠とする。有料API利用や個人設定変更は含めない。
- 元HEAD: `405e29273a7a3257adeb370c6ac3196d35693d4d`。開始時の差分は前回自分が作成した計画・調査・索引・記録6ファイルのみ。
- 所有範囲: `website/`の自前ソースと型設定・依存、`scripts/`、`tests/`、必要な`.codex/`・`.claude/`互換入口、`harness/`の検証契約、CI、関連README、計画・調査・実施記録。記事本文、Python、外部vendor、過去証跡、実行中runの永続状態は保持する。
- 検証: 各実行面の型検査、共通check、依存未導入CLI、最低Node22.22.2/対応24、サイトunit/clean build/browser、Windows回帰、CI/policy/独立レビュー、通常のPRと公開確認。
- 終了条件: 未分類0件、主要UI/データ/運用状態の検査、互換例外の根拠、既存動作と公開経路の維持、最終レビュー・CIと公開した変更の公開確認を記録する。

## 分担と進捗

- サイトUI: app/components/MDX入口/browser tests。
- サイトデータ: lib/scripts/unit、共有データと音声・AST契約。
- Node共通: 文書解析・検証・レポートと共通helper。
- 主担当: 固定版の適合検証、依存・型設定、Node状態/公開/フック、CIと全体統合、記録、GitHub提出・公開確認。

P0の依存準備を開始。サイト固定依存428 packageの準備成功。TypeScript 6.0.3とNode22系・React19系の型を直接devDependencyへ固定する。必要な全テストを再実行するまで移行完了とは扱わない。
