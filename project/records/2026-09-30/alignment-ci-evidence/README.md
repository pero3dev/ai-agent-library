# D1 正式記事レビューと初回CI失敗の証拠

PR63の初回head `e00d6ee700d27816a94e151c4d0d2bfdc0b9a1a4` は、CI run `36696416442` のlint・buildが `npm audit --audit-level=high` で失敗しました。この保存単位は正式記事レビューと初回失敗の6原本だけを扱い、後続patch・再実行・公開の成功を含みません。

[索引](index.json)に原本とgzipそれぞれのSHA256・bytes、相対保存先、復元一致を記録しました。原本の状態・文章・ログを変更せず、通常のgzip展開で元のバイトへ戻せます。

## 正式記事レビュー

2026-09-30T09:25:15Z、独立判定はapproved / low / must 0 / should 2です。対象treeは `0e13b57f4ec4d3b956b6d7a28d60f90ebe1c6eaa`、content digestは `40cc21197f9e144cb13356da00120c664309afbf022124b6f559ecddfbeaac03` で、固定候補記録と一致しています。

should 2件はalignmentとpretrainingの既存チェックリストを、後日、設計記録で確認できる項目へ改める提案です。どちらも公開を妨げない指摘としてrootが後続候補へ見送りました。判定や指摘を消していません。記事レビューは[独立ローカル証拠](../alignment-local-evidence/README.md)に依拠し、別の公開受入を代替しません。

## 初回CIの境界

lintとbuildの完了ログは、brace-expansionに関するhigh severityのaudit失敗とexit code 1を保持しています。lintにはmoderate 3件も記録され、合計4件です。build側はhigh 1件です。

PRメタデータは取得時点の原本です。そこではbuildなどがまだIN_PROGRESSで、後から完了した失敗ログと状態が異なります。これを成功・失敗へ書き換えず、完了ログと区別して保存しています。公開受入はfalseのままです。

| 原本 | 保存先 |
| --- | --- |
| 正式記事レビューMD | [gzip](raw/alignment-article-final-review-20260930.md.gz) |
| 正式記事レビューJSON | [gzip](raw/alignment-article-final-review-20260930.json.gz) |
| 固定候補tree・digest | [gzip](raw/alignment-frozen-candidate.json.gz) |
| 初回PR63メタデータ | [gzip](raw/alignment-pr63.json.gz) |
| 初回lint失敗ログ | [gzip](raw/initial-ci-lint.log.gz) |
| 初回build失敗ログ | [gzip](raw/initial-ci-build.log.gz) |

後続の2 lockfile互換patch・検証・レビューは別担当が進めています。追加の証拠は完了後の別原本として追補し、この6原本と凍結済みローカル証拠を上書きしません。
