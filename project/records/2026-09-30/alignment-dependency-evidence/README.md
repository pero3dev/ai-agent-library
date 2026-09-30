# D1 PR63 依存patchの証拠

rootとwebsiteの2 lockfileで、brace-expansionを5.0.9から5.0.12へ更新した証拠です。変更は当該entryのversion・resolved・integrityに限定され、package.json・記事・製品・kitの変更を含みません。

[索引](index.json)に原本72参照、重複を除く60 gzipの相対保存先、原本とgzipのSHA256・bytesを記録しました。31件の作者証拠は報告JSONのhashと一致しています。同一バイトを共有する原本も、元の場所をそれぞれ残しています。通常のgzip展開で元バイトへ戻せます。

- [作者報告MD](raw/patch-report.md.gz)・[JSON](raw/patch-report.json.gz): 両環境のnpm ciとauditはexit 0。rootはmoderate 3件が残り、high・criticalは0、websiteは全0件です。初期の失敗auditと空stderrも保持しました。
- [root check](raw/root-check.log.gz): 485件中484成功・1skip、失敗0です。
- [再build](raw/build.log.gz): 223 routes・230 HTML、BUILD_IDは `1kDzaUHLTh2VduCcoTkhj` です。
- 更新前後のidentityと各9記事HTMLは索引から辿れます。各HTMLは対応するidentityのhashと一致しています。
- [独立レビューの前提確認](raw/independent-prerequisites.json.gz): 原本は再build比較待ちで、承認を意味しません。

[出力比較の原本](raw/independent-output-proof.json.gz)は更新前に保存した419ファイルだけが対象です。230 HTMLはBUILD_ID置換後に一致し、保存済み非HTMLも一致しています。更新前保存にない2132ファイルは同一性を主張せず、SPAの補助検証と区別しています。

SPA補助検証は3 helper・3ログ・各2 engineの原resultを保存しました。初回2回はsidebar操作の不備でfailedです。3回目は両engineで9記事の図ready・手動次段・READ復帰まで完了し、WebKitはpassedです。Edgeはrawに39件のrequest failureを残し、最後の狭い分類器ではroot・audio・roadmap・glossary・tagsの5 fetch中断によりfailedです。失敗を成功へ書き換えていません。

[最終補足レビュー](final-review.json)は原JSONと完全に同じバイトです。2026-09-30T09:55:15.572Z、approved / low / must 0 / should 0。索引のfinalReviewReferencesで、原レビュー中の絶対パスを保存済みの相対パスへ対応させています。localAcceptedはtrue、publicAcceptedはfalseです。

独立reviewerはEdgeの39中断すべてを既存HTMLのhashへ結び付け、未到達だった3 assertを原resultから補完しました。両engineの9記事操作、83 RSC、8 WOFF2、前後identityを確認し、9件の新入力へ限定して旧ローカル判定を引き継いでいます。Edgeの原failedは保持しています。新しい画像の実視認・全ブラウザー再走・性能再測定は0で、既存168枚を新しい測定として数えません。419ファイルの比較範囲外にある2132ファイルの旧版との同一性も主張しません。

[初回CI失敗](../alignment-ci-evidence/README.md)と[凍結済みローカル証拠](../alignment-local-evidence/README.md)は別の保存単位です。今回の原本で、それらの旧失敗・pending・入力hashを書き換えていません。
