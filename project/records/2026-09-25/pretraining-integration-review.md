# C2 共通統合・本文対応の独立レビュー

判定: **approved / low、必須修正0、推奨修正0**。レビュアー: `/root/pretraining_numeric`。

対象は root が作成した本文6訂正、固定binding、MDXガード、記事の論点割当・受入入力、lazy dispatcher、統合unitとbrowser検査ソース、READMEの15ファイル。レビュー時のhashは同名JSONに固定した。レビュアー自身が作成した数値3図の12ファイルは判定から除外し、別担当の制作・実画像レビューを要求する。概念2図の実装もこの共通統合レビューには含めない。

## 結論の根拠

- 記事は base `517dc8b5166bd7b0c85baef3800d7fe57bac7b31` に承認済み6置換、last_updatedの2026-09-25化、確認済み参考資料2件のアクセス日2026-09-24化だけを適用した内容と、独立計算で完全一致した。他3参考資料の日付・4 display math・原文リストは保持され、新段落・説明例は追加されていない。残差と総損失、固定C配分と予算増加、FLOPsと実コストを分ける訂正は承認済み一次資料記録と整合する。
- 5図23段階・19 READ、6 H3と22本文ブロックを包装する固定bindingは計画と一致。包装前後で元ASTを復元でき、全32有効部分集合でも順序を保つ。数式・Mermaid・リンクは元ノードを保持する。意味依存の重なりと包装範囲の重なりを区別している。
- 9 H3・45論点は29動的・16静的で計画と一致。動的論点は全てREAD段階へ到達し、手動補助だけを割り当てる負例は不受理になる。
- 固定ID、文字列属性、親ごとの段階上限、入れ子拒否をMDX許可リストに追加し、任意import・式・spread・未許可IDは受け入れない。
- C2の16固有runtimeファイルは全て必須入力で、欠落・変更・content-src上書き・図外チェックリスト変更で受入を無効化する。既存7記事への影響範囲を分け、8記事それぞれの受入記録を要求する。
- browserの数値fixtureは製品modelをimportせず、固定の期待値・位置ID・確率・未知値を検査する。全段階・中点・逆シーク・READ/手動・キーボード・拡大共有状態・no-JS/print・chunk失敗時原文保持を検査ソースとして確認した。

独立実行は `node --test website/tests/unit/pretraining-decoration.test.mjs website/tests/unit/mdx-safety.test.mjs website/tests/unit/diagram-article-acceptance.test.mjs`。**79/79成功、失敗0、skip0、149.051秒、exit0**。raw logは `TEMP/pretraining-integration-independent-tests.txt`、SHA-256 `c618a396d83b9bdc3114bce5b1f98208ea92707b4a78910f7adac6c206906ee0`。

## registry 昇格の追補

2026-09-24T16:30:47.959Z に実ファイルで再照合した。C2の5件だけ `reviewedDigest=sourceDigest`、`enabled=true`、`status=reviewed` へ変更され、準備候補から他のfieldは変わっていない。既存19図はbaseと完全一致。訂正後本文から5 sourceDigestを再計算し、`assertDiagramSource` とregistry検査が成功した。`articleCoverage` はpending、記事のreview/local/public gateは全てnullのままであり、ローカル表示・公開完了の捏造はない。

最終 `website/diagrams/registry.json` SHA-256: `ed9ef883835222eed36e9857453535eec08210ba7addc408618b612dbbc655d4`。詳細は `TEMP/pretraining-integration-promotion-proof.json`。

## 判定の限界

外部一次資料の再取得は行わず、リポジトリ内の実取得済み資料記録と承認計画を照合した。browserソースは読んだが実行していない。ローカル再生テストにはPlaywright clockを使うため、実経過再生の証拠とは区別する。build、描画画像、公開サイト、実機、読み上げ、正式なfrozen-tree通常記事レビューは未実施であり、別ゲートで必要。図作者本人による制作物承認には流用しない。
