# プロジェクト構造整理の実施記録

更新日: 2026-09-11(JST)

## 目的・所有・許可

[採択計画](../../plans/engineering/structure-cleanup.md)のS0〜S5を完了します。ユーザーの「計画書すべてが完了するまで自律的に作業を進めてください」に基づき、対象ファイルの移動・整理、条件を満たす不要物の削除、ブランチ・コミット・push・PR・マージ・公開確認を行います。すべてのコミットとsquash本文に `Co-authored-by: Codex <codex@openai.com>` を付けます。

正本記事の内容・URL、定期タスクのpromptとcwd、実働hookの設定と実装、研究JSONと実受入の生証拠、個人設定は保護します。移動する内容・試験の範囲は [移行台帳](structure-migration.json) を正とします。新配置を検査するコードはS1で先行導入します。

## 開始時の状態

- mainとorigin/mainは `948a418cc0f78f1846238cf23c13d63c4efdc8a2` で一致。開始時の未保存変更は依頼済みの計画書だけでした。
- GitHubは `pero3dev/ai-agent-library`。未完了PRは0件です。
- baselineは473追跡ファイル、ルート48ファイル/Markdown41、記事199/章索引16です。
- 本番の定期タスク2件の設定ファイルSHAをローカルで固定しました。認証情報やprompt全文を公開台帳へコピーしません。
- 既存worktreeとbranchのHEAD、全追跡ファイルのSHA256はcommon Git directoryの `structure-cleanup/baseline.json` に保存しました。
- 親担当はS0の台帳・S1の統合とGitHub導入を所有します。別担当がS1コード、独立worktreeでS2文書、読み取り担当がS4削除候補の調査を行います。

## 進捗と再開点

| 工程 | 状態 | 対象・証拠・次の操作 |
| --- | --- | --- |
| S0 | 完了 | baseline・旧新パス54件・worktreeの取り込み証拠と削除条件を保存 |
| S1 | 完了 | PR #26の9必須チェック、マージ・公開照合成功 |
| S2 | 完了 | PR #27の9必須チェック、マージ・公開照合成功。root15/Markdown8 |
| S3 | 完了 | PR #28の9必須チェック・マージ成功。移動19件の試験・実行入口を維持 |
| S4 | 導入待ち | 旧worktree14件・生成物13箇所を解放。旧入口・placeholder削除、恒久検査と手順を実装 |
| S5 | ローカル受入完了 | fresh checkoutの全検証と不変照合に成功。S4のCI・公開照合と今回の作業コピー解放が残る |

## 検証と証拠の扱い

静的確認、単体試験、ブラウザー、実Agent、GitHub/公開確認を区別します。前日の272試験成功はbaselineの証拠であり、今回の変更後の成功とは扱いません。実施する試験とPR・head・マージ・公開の対応を工程ごとに追記します。

ローカルの生ログ、保持中fixture、削除前の一覧と復元記録はcommon Git directoryの `structure-cleanup/` に置きます。プロジェクト外の所有不明なフォルダ、dirty評価worktree、アプリ管理worktree、必要な補助ツールは削除しません。

## S1の確認

`npm ci` と `npm run check` が成功しました。278試験が成功しskipは0件、記事・章索引215ファイル、相対リンク279ファイル/4,979リンク、ハーネス定義30ファイルを検査しました。`--include` の不正・欠落・大文字小文字違い・リンク経由の入力は失敗します。移動先projectの壊れたリンク・アンカー、researchの明示対象、新旧試験領域の分類と不活性な教材も回帰試験で確認しました。親担当の独立レビューは必須指摘0件です。

実装時に利用制限で一度中断しました。保存済み差分を確認してから同じ所有範囲を再開し、上記の全体検証を完了しました。中断した試行を成功した試験へ数え直してはいません。

[PR #26](https://github.com/pero3dev/ai-agent-library/pull/26) はhead `6990d636b5417e9795650a9a9d9c2da263c220ae` の9チェック成功後、merge `6013793b8e3bd665c5af4027b6dd2537bd6e0e66` に進みました。main CI `34511960017`、deployment `6378034130` と公開HTTP200・本文を2026-09-10T18:06:48.119Zにライブ照合しました。

## S2の確認

移行台帳の文書33件・監査出力2件を移動し、project/researchの索引とREADMEの構成案内を整備しました。旧計画の数値は当時の記録として保ち、採択時点・完了状態・後継の現行手順を明示しています。現行参照は移動先へ更新し、過去の証拠JSONのパスとdigestは変更していません。

記事本文・research JSONの変更は0件、ROADMAPの214タスクのID・状態・成果物は不変、監査出力2件のSHA256も不変です。S1の検査で変更したresearch Markdownを追加指定し、294ファイル/5,322リンクが成功しました。実装コメントとignoreコメントの旧計画名も同期しました。

移動後の `npm run check` は278試験・skip 0件で成功しました。独立レビューは必須指摘0件、推奨指摘1件でした。索引のコーディングエージェント章を計画本文に合わせてA・B表記へ修正しました。

[PR #27](https://github.com/pero3dev/ai-agent-library/pull/27) はhead `3b437d41d260879e78754bf9540ef9aa69efddcc` の9チェック成功後、merge `6cd767c91e37f7a44a4144aa9138aac1579998d0` に進みました。main CI `34513406195`、deployment `6378281845` と公開HTTP200・本文を2026-09-10T18:20:15.031Zにライブ照合しました。

## S3の確認

試験12件・helper1件・不活性な固定課題2件・website試験4件の計19件を移動し、実行入口7件を更新しました。試験のimport、root算出、fixtureコピーだけを配置に合わせ、移動前後の試験宣言数を照合しました。旧互換wrapperは試験からcoreを直接参照するよう変更して削除し、実働hookの設定・adapter・coreは維持しています。

root全体278件、Windows重点110件、website単体26件、offline evalの9suite・242件がすべて成功し、skipは0件でした。依存監査・スキル同期・差分検査も成功しました。親担当の独立レビューは必須指摘0件です。S2を取り込んだmerge `1b9385c4042573b21e8442cf02b4fd94b38f6df6` でも全体278試験と281ファイル/5,112リンクを再確認しました。原ログと移動照合はcommon Git directoryの `structure-tests-*`、`structure-cleanup/s3-integrated-check.log` に保存しています。

[PR #28](https://github.com/pero3dev/ai-agent-library/pull/28) はhead `ef759ca4ca871430b5b601eea0802a5d22071c86` からmerge `d3dde747e26af7a5def9ed1177ab4db4bca2e016` へ進みました。公開のライブ照合は最終受入に併記します。

## S4のworktree整理

旧兄弟worktree14件のHEAD、通常/ignored差分、実体パス、リンク属性、PRのsquash/cherry-pick結果を個別照合しました。ignoredデータは依存・生成物だけで、実受入の保持対象は含みません。所有担当の作業終了を確認し、削除直前にもHEAD・状態・登録先を再検査しました。

`refs/archive/structure-cleanup/2026-09-11/harness/` 配下の保持refと、common Git directoryの `structure-cleanup/completed-worktrees.bundle` を作成・検証してから、`git worktree remove` で14件を解放しました。対応するローカルbranch14件と、HEADが一致するremote branch10件も整理しました。remote更新は観測したSHAのleaseを条件とし、mainには適用していません。回収したファイルの論理サイズ合計は1,759,625,334 bytesです。

実受入の差分が残るGit内2件、アプリ管理2件、独立Claude評価コピー1件は保持します。削除一覧・取り込み証拠・復元refはローカルの `structure-cleanup/worktrees-inventory.json`、`worktree-removal-results.json`、`remote-branch-removal.json` に保存しました。復元時はbundleまたは保持refから記録されたHEADでworktreeを作成し、依存をlockfileから再導入します。

## S4の配置契約と生成物整理

[配置契約](../../../harness/structure.json)にルート15ファイル・Markdown8、新配置、正本と生成物、保持期間と削除条件を記録しました。`npm run check:structure` は追跡された旧配置・生成物・依存・リンクと、project Markdownのリンク検査脱落を拒否します。既存の `check:harness` に接続し、9必須CIチェックの名称・権限を維持しています。

読み取り専用の `npm run structure:inventory` はcheckoutとcommon Gitを用途別に計測し、`--worktrees` 指定時だけ登録worktreeを追加します。容量区分の重複、未計測範囲、リンク・読取失敗、論理サイズと割当容量の違いを表示し、自動削除はしません。配置・保持・解放の手順を [CONTRIBUTING](../../../CONTRIBUTING.md#ローカル記録の保管と棚卸し)へ追加しました。

独立レビューで見つかった大小混在Markdown拡張子の検査脱落と、旧Windows helper配置の検出漏れを修正しました。追加回帰を含む構造試験9件の再レビューは必須指摘0件です。親担当はコマンド接続と運用文書も確認しました。

fresh checkoutでの再生成・ブラウザー試験が成功した後、main checkoutの生成物とPython cache計13箇所、933,277,555 bytesを削除しました。サイトの `.next/`・`out/`・`content/`・`generated/`・`public/_pagefind/`・`next-env.d.ts`、旧devログと対象cacheだけを扱っています。devログは削除前にSHA付きでcommon Gitへ保管しました。対象一覧、絶対パス境界、全階層のreparse point、容量・更新時刻の不変、稼働サーバーの終了を確認してから、同じPowerShell内で削除しました。

記録は `structure-cleanup/generated-cleanup-preflight.json`、`generated-cleanup-rechecked.json`、`generated-cleanup-results.json` です。常用のroot/website依存、補助ツール、保持対象の評価証拠は残しています。サイト生成物はlockfileから依存を準備し、正本から `npm run sync` と公開条件の `npm run build:clean` で再生成できます。既存14worktreeと合わせた削除対象の論理サイズは2,692,902,889 bytesで、ディスク割当容量の実測や保管コピーを差し引いた純削減値ではありません。

## S5のfresh checkout受入

所有・HEAD・終了条件を記録した新checkoutの `579def7d74e6355eaadee21f81ef33bd3940d51c` で、lockfileから依存を新規導入しました。Node 24.16.0 / npm 11.13.0 / 専用Python 3.11.3、公開条件 `STATIC_EXPORT=1`、base path `/ai-agent-library` を使用しています。

| 検証 | 結果 |
| --- | --- |
| root全体 | 287/287成功、構造検査480追跡ファイル・root15/Markdown8 |
| Windows重点 | 110/110成功 |
| offline eval | 9suite・242/242成功 |
| Python横断 | 17/17成功。有料API呼出なし |
| website単体 | 26/26成功 |
| clean静的ビルド | 223/223ルート、229 HTML、16章を検査 |
| ブラウザー | 既存Edge 152.0.4191.66で17/17成功。代表記事、用語集、依存マップ、検索、キーボード操作 |
| 依存監査 | root/websiteとも指摘0件 |

全試験のskipは0件です。原ログ・実行時刻・exit・ログSHA・環境を `structure-cleanup/s5-acceptance.json`、生成URL一覧を `s5-routes.json` に保存しました。実働Agentや定期タスクを再実行した証拠ではありません。Windows sandboxのGit所有権という既存の未成功条件は [先行受入記録](../2026-09-10/harness-acceptance.md#実行面ごとの互換性)のままです。

開始時との照合では、記事199件のGit本文・category・派生URL、章16パス、research JSON9件、実働hook8ファイル、登録用prompt2件、本番TOML2件が不変でした。生成223ルートも旧出力の集合・SHAと一致しています。1記事の旧checkoutにあったCRLF表現はGit本文のLFとの表現差として区別し、本文変更へ数えていません。照合スクリプトと結果は `structure-cleanup/verify-preservation.mjs`、`preservation-acceptance-built.json` に保存しました。
