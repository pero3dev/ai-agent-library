# C1 学習パイプライン・共通統合の実装記録

状態: 実装完了、独立レビュー・build・browser・公開は未実施。担当 /root/training_integration_map、実記録時刻 2026-09-24T14:02:43.964Z。親担当がPR58の公開受入6/6完了を確認してC1実装を許可した。基点は67b1309fcea8267749be6e52881f3d6a4049ae2b、feat/training-reading-diagrams。Git変更操作はしていない。

## 所有と実装

所有13ファイルと各SHA256は同名JSONに列挙した。registry、MDX変換/安全性/mapping、薄いTrainingWalkthrough、記事割当と受入、対応unit、website READMEのみ。scene/model/CSS/model unit、browser、kit、rootの実施記録には触れていない。

- TrainingStages / TrainingRuntimeBoundaryのnamed exportを固定React.lazyで読むdispatcherを追加。2つのCSS、元本文fallback、図の外の目次、図ごとの境界を維持。
- 2図10段階/9 READをgrouped-blocksへ登録。元ASTの5 H3と10 bodyを参照のまま包装し、概要Mermaidは第1図S0内。全8 H3・13 body・1 Mermaid・math0、残る3 H3の13リスト項目を保持。
- 原記事SHAは993147125244a6bfc7b3e64ca5d9f4f2142dd944b7a1fa7d43d33a79b7242e62で不変。sourceDigestを実ASTから再計算して承認済計画と照合。図全体や公開の自己承認を行わず、新C1のreview/local/publicはnull。
- 8 H3/34論点（21 dynamic/13 static）を既存のexact schemaへ投影。意味依存に後方の実務節を含め、包装範囲は広げない。47固定入力とカテゴリに対応するoptional md/mdxを追加。
- 旧6記事の受入ファイル・PR58固定snapshotは変更していない。共有コード変更による3ゲート失効を実物でも確認。PR56履歴testは当時の5記事、PR58履歴testは当時の6記事を明示的に固定した。

## 実行した検査

- C1と既存図のAST/MDX回帰: 85/85、失敗0・skip0、4.361秒。4有効化組合せ、unwrap原AST一致、意味依存、同形変更・構造変更の拒否、MDXの固定ID/属性/親段階/入れ子境界を含む。
- 記事受入unit: 31/31、失敗0・skip0、80.512秒。全7記事集計、固有入力の波及分離、欠落で保留、3ゲート、履歴と現行版の区別を含む。記録logはtraining-integration-acceptance-unit.log。
- 受入test名のsix→sevenだけを修正した後、その1件を再実行して成功（上記31件と重複）。異なるunitの合計は116件。
- website READMEのMarkdown lint、所有する既存追跡10ファイルのdiff whitespace、計画assignment/固定topic表と実装の完全一致を確認。

unitの受入fixtureはscene本体の代用文字列を使う既存設計であり、表示成功を示さない。14:00:17.882Zの実物観測では担当sceneファイルがまだ揃わずC1 inputDigest=nullだった。これは未完成入力を保留する状態で、旧6記事のreview/local/publicは全false。観測ファイルとhashはJSONに残した。

## 次工程と境界

rootの完全なnpm check / website unit /公開条件build、対象と旧6記事のbrowser回帰、別作者の実装・実画像レビュー、公開確認が必要。build・生成物編集・browser・Git更新・PR/CI/公開操作はこの担当では行っていない。registryの本文binding状態をscene最終承認と取り違えず、記事ゲートは実受入後にだけ記録する。
