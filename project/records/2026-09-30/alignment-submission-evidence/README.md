# D1 依存修正後の最終提出原本

PR63 の修正 head `b7b6ac034716fc38b351266b87bb8b38f02dd2aa` を提出した時点の 7 原本を保存する。[索引](index.json)に元の絶対パスから相対保存先への対応、元 bytes と gzip の SHA256、復元一致を記録した。CI・Pages・公開受入はこの保存単位では未完了で、公開受入は false。後続結果は別の原本で記録する。

目的は最終記事レビューと提出内容の対応を別 PC でも確認できるようにすること。変更範囲はこの新規ディレクトリのみで、既存 archive・製品・kit・gates・親記録・Git は変更しない。7 原本の gzip 復元、hash、相対参照と Markdown の確認をもって保存作業を終了し、凍結する。

## 固定候補と記事レビュー

- base: `5940334a6fd3aab8178cfeb8746a58c8b937d390`
- review 対象 tree: `ac7e30d48f46754893688afac7cb8aebbcf98b38`
- 提出原本が記録する final tree: `d4f6f0c5abd70b3f37a91f088d9c2cd453b8e93c`
- content digest: `700ee5d2fdd47618af83efe03afcd04327718f7d36654c5b2c5cae22c0187b43`

2026-09-30T10:03:36Z の独立記事追補は approved / low、新規 must 0・should 0。以前の非阻害 should 2 は後続候補として残る。review の tree・digest・原本 hash が提出記録と一致することを確認した。review 対象 tree と final tree は別の識別子として保持する。保存担当が新たな Git 差分検証を実行したという記録ではない。

記事レビューは [初回の記事レビュー原本](../alignment-ci-evidence/README.md)と、[依存修正後の独立ローカル追補](../alignment-dependency-evidence/README.md)に接続する。補足ローカル判定は受入済みである一方、CI・公開の成功を代替しない。初回の画像 168 枚・性能結果の限定継承であり、新規視認・性能再測定を主張しない。

## 旧応答と再取得の区別

即時の PR 応答は旧 head `e00d6ee700d27816a94e151c4d0d2bfdc0b9a1a4` と初回 CI の失敗を含む。その原本を成功へ書き換えず保存した。再取得原本は正しい head `b7b6ac034716fc38b351266b87bb8b38f02dd2aa` に一致するが、チェックの多くが IN_PROGRESS の時点であり、CI 完了の証拠ではない。提出記録の CI run は `36700305122`。

manifest completed_at の小数桁が schema に合わず commit 前に拒否され、その後修正した経緯も提出原本に残る。commit ログと PR 本文はそのまま gzip 化し、文章や状態を更新していない。

| 原本 | 保存先 |
| --- | --- |
| 最終記事レビュー MD | [gzip](raw/alignment-article-dependency-review-20260930.md.gz) |
| 最終記事レビュー JSON | [gzip](raw/alignment-article-dependency-review-20260930.json.gz) |
| 提出 tree・digest・head 記録 | [gzip](raw/alignment-pr63-patch-submission.json.gz) |
| 旧 head の PR 応答 | [gzip](raw/alignment-pr63-patch.json.gz) |
| 正しい head の再取得応答 | [gzip](raw/alignment-pr63-patch-current.json.gz) |
| 依存修正 commit ログ | [gzip](raw/alignment-dependency-commit.log.gz) |
| 修正後 PR 本文 | [gzip](raw/alignment-pr-body-patch.md.gz) |

通常の gzip 展開で元のバイトへ戻せる。展開後の SHA256 を index の originalSHA256 と比較する。保存した原本は取得当時の状態を保持し、後続の CI・公開結果をこの原本へ遡って反映しない。
