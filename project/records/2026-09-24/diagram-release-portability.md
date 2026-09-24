# 公開検証キットの別PC対応

開始日: 2026-09-24。状態: LF版を移管し、標準Chromiumを既定とする後継版も独立承認済み。別PCでの実行は未確認。

## 作業契約

- 目的: 会話・旧PCの一時フォルダー・固定ドライブ名がなくても、公開版をCI成果物と照合できる実行手順を残す。
- 許可: ユーザーの別PCへの引き継ぎ依頼。P1全15記事の公開受入で停止し、P2以降へは着手しない。
- 所有: `scripts/diagram-release/`、本記録・独立レビュー・検証記録、および引き継ぎ入口。採用元の一時キットは保持する。
- 元HEAD: `140481edc3968d853f5b8c2b56d4ec5c9c29b027`。所有ブランチは `feat/training-reading-diagrams`。製品実装を進める前の、引き継ぎ準備として移管した。
- 終了条件: ファイルの同一性、移管先でのオフライン検証、操作手順と証拠の限界を記録する。公開確認には実際の成功CI・Pagesの識別情報が別途必要。

## 移管内容

[キットの手順](../../../scripts/diagram-release/README.md)を入口とする。LF版の独立再レビュー後、11ファイルをバイトを変えずに移した。[source-mapping.json](../../../scripts/diagram-release/source-mapping.json)のSHA-256は `d5ff1524136e8279af9e946ba4e4ae5faf71eb2cfa401b574a7258fd1ebaeb7c`。

元キットの生バイトと、Gitの改行契約に合わせたLF版を区別する。推論検査モジュールはCRLFからLFへの正規化だけを含み、他の検査2モジュールは元とバイト一致。旧manifest `6c28da90...` の承認を新しい版へ流用せず、2026-09-24T12:45:28.436Zの独立再レビューで17件と実際のGit改行属性を確認した。

PowerShell 7、Node.js 22以降、GitHub CLI、tar、およびwebsiteのlockfileに合うPlaywrightを使う。リポジトリと証拠出力先は実行時に指定し、旧PCのドライブ名を前提にしない。出力の逸脱・symlink・junction・Windows短縮パス、別フォルダーのPlaywrightへの暗黙の依存を拒否する。検証対象の公開repository・URLの固定は維持した。

元の公開58ケース、固定数値、CIの同一性条件は保持した。`check-preparation.mjs`はオフラインの準備検査であり、レビュー・公開の成否を推測しない。キットREADMEとmanifestにある「提案・承認待ち」は作成時点の固定文言で、後の[独立レビュー](diagram-release-portability-review.md)と本移管記録を合わせて読む。

## 検証と未実施

作成担当の[検証記録](diagram-release-portability-validation.md)では、構文、固定条件の保持、不正入力・パス・依存解決・説明用tar・LF正規化に対する17件が成功した。独立担当も17件を再実行し、最終候補をapproved / low、必須修正0と判定した。初期に見つかった短縮パスとPlaywrightの間接依存の問題は最終版で修正された。

移管時には全11ファイルのhash一致と、移管先の準備検査を確認した。準備成功はブラウザー・GitHub・公開配信・別PC実行の成功ではない。認証情報は移管していない。

検証記録MDも改行だけLFへ正規化し、元SHA-256 `06ab9062b4516f85046d627736c7e8e5bb9a7753f836acb3ab446916fb6f0d32` に対し移管版は `068b33b8fa801acabe227ffc4328ead5126ad7350a4db1807ebb3f180e24df4c`。キット11ファイルのmanifestとは別の来歴として扱う。

LF版の詳細は[独立レビューJSON](diagram-release-portability-review.json)、[元ソースとの比較](diagram-release-portability-support/lf-source-comparison.json)、[準備検査出力](diagram-release-portability-support/lf-preparation-console.json)、[17件の実行ログ](diagram-release-portability-support/lf-offline-tests.log)も移管した。[移管対応表](diagram-release-portability-support/transfer.json)に元名・元生バイトhash・LF版hashを記録する。これらは当時のLF版の証拠で、後継のchannel修正や公開受入の結果ではない。古い絶対パスは履歴であり、新PCの実行パスとして要求しない。

この時点の対象は6記事58ケースで、図なしの対照記事は `alignment-theory`。P1後半でその記事を制作する前に、未実装の対照記事へ変更する必要がある。新しい記事を追加するたびに対象・期待値・公開検査を拡張してレビューし、最終15記事への対応を完了する。Bの公開は、移管前の検証済みキットをそのまま用いて実行する。

## 既定ブラウザーを手順書と合わせた後継版

LF版のrunnerには、channel省略でもEdgeを選ぶ既定値が残っていた。手順書の「Edge指定は任意」と一致させ、channelを省略したChromiumはPlaywrightの標準ブラウザー、`--channel=msedge`を指定した場合はEdgeを選ぶようにした。WebKitではchannel指定を引き続き拒否する。

現行manifest SHA-256は `e9cf22cf7edd16443a6cd4d38c6aec9fac92bd09f4ad442f04270ef352ddac03`。元のraw/normalized hashとLF前版manifestを保持し、runnerの起動・報告2行の差分を明示する。準備検査は変更後のhashだけでなく、その2行を逆適用した旧保護区間のhashも照合する。元B・LF原本、公開58ケース、数値fixture、CI同一性条件は変更していない。

[作成担当の検証](diagram-release-channel-validation.md)と[詳細JSON](diagram-release-channel-validation.json)、[独立レビュー](diagram-release-channel-review.md)と[詳細JSON](diagram-release-channel-review.json)を保存した。2026-09-24T13:20:32.636Z、approved / low、必須修正0。作者と独立担当がそれぞれ18/18のオフライン試験と準備検査を通過し、実ブラウザー起動を伴わないstubで省略・明示・不正な起動条件を確認した。旧assertionをメモリ内で改変した場合に保護検査が拒否することも独立確認済み。この承認は公開実行の成功や実際のブラウザー起動を意味しない。

この4記録は移管時にCRLFをLFへ正規化しただけで内容は同じ。キットREADMEの「提案・承認待ち」は当初の作成時点を表すため、現在の状態は本節を正本とする。PR #58の公開検査は別保存したB後継コピーを使い、このポータブル修正へ途中で切り替えない。

このchannel版の18件は当時rootの `npm test` に含まれなかった。後継版では配置契約に従い `tests/unit/diagram-release-portable.test.mjs` へ移動しているため、この旧パスを新PCの実行手順として使わない。

## 通常の単体試験への組み込み

`scripts/**/*.test.*` は構造契約で禁止されているため、18件を `tests/unit/diagram-release-portable.test.mjs` へ移動した。helperのimport先以外は試験の本文を保持し、manifestでは固定したrepo相対パスを1件だけ許可する。承認された配置版manifestは `bbbb935cd4a81212fc5c703624625659e2d708e6ffa0e378dcafaf10b35a6da8`。

[作成担当の検証](diagram-release-test-layout-validation.md)と[詳細JSON](diagram-release-test-layout-validation.json)、[独立レビュー](diagram-release-test-layout-review.md)と[詳細JSON](diagram-release-test-layout-review.json)を保存した。2026-09-24T13:46:00.104Zにapproved / low、must 0・should 0。独立実行18/18、別repo配置、hash不一致、経路逸脱9件とjunction拒否、限定構造検査に成功した。記録移管はCRLFからLFへの正規化と末尾LFの追加のみで、対象kit/testのバイトは変えていない。

現在の配置ではrootの `npm test` とCIのdocsジョブに参加する。単独実行は `node --test tests/unit/diagram-release-portable.test.mjs`。tarとPowerShell 7も前提となるため、`harness/verification.json` のunit前提へ明記した。`harness-windows` の明示的な試験一覧へ自動追加されたわけではない。

PR #58のdocsジョブで使ったUbuntu runner image `20260907.300.1` の[公式ソフトウェア一覧](https://github.com/actions/runner-images/blob/ubuntu24/20260907.300/images/ubuntu/Ubuntu2404-Readme.md)ではPowerShell 7.6.5とtar 1.35を確認した。これはCIの実行前提の確認であり、新しい18件をLinux CIで実行した証拠ではない。実行結果は後続PRで確認する。

## 学習パイプラインと完全な図の撮影への対応

最終C1版manifestは `4359f9abf06785671e980686f89e596eb8c0d8cd1842fc3480712941a3b40507`。旧58ケース・fixture・CI同一性条件を保持し、学習パイプライン13ケースと対象HTMLを追加した7記事71ケースである。P1全15記事への対応ではない。READMEの候補・保留という文は作成時点の状態で、現時点の判定は本節と後続の公開記録を正本とする。

[初期C1版の検証](training-portable-initial-validation.md)と[詳細JSON](training-portable-initial-validation.json)、[初回の独立レビュー](training-portable-initial-review.md)と[詳細JSON](training-portable-initial-review.json)を保持した。低い画面のviewport画像では図の上端が画像外になり、文字の重なり候補を実見できなかった。元viewport画像を保持して補助のscene画像を追加し、実スクロールで固定ナビゲーションの下へ収めた後、整数clipで撮影して位置を復元する。製品のCSSやviewport寸法は変更しない。

[撮影修正版の検証](training-portable-capture-validation.md)と[詳細JSON](training-portable-capture-validation.json)、[最終独立レビュー](training-portable-final-review.md)と[詳細JSON](training-portable-final-review.json)を保存した。2026-09-24T15:00:13.309Zにapproved / low、must 0・should 0。作者と独立担当がそれぞれ19/19 unit、71登録・7route・旧版への逆適用を確認した。最終ローカルbuildでChromiumとWebKit各13/13成功、各138 PNG（元viewport 68＋補助scene 70）。独立担当は全画像の存在・補助画像の寸法/DSF・66観測の画像対応を照合し、新16画像を実見した。Chromiumの24文字重なり候補はglyphが分離し、低画面での欠けは解消した。

初期の撮影修正で生じたLocator側の再スクロールとJS無効時の待機失敗は、元の失敗証拠を保持して記録した。最終版は明示clipと不要なrAF待機の除去で両ブラウザーを通過した。旧版の結果を最終版へ上書きしていない。rootの全共通unit実行は旧C1版を対象としたため、変更後のkitは上記の独立19件とlocalhost予行で別途検証した。キット承認を製品図解や公開受入の自己承認として数えない。
