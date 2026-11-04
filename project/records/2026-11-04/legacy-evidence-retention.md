# 凍結済み旧証跡の保存判断

Issue #348。2026-11-04にmain `e617bca`の全追跡パスと、共通Git repositoryを測定しました。旧証跡はGit内で保持します。Release assetへの移行は採用せず、この改善案は理由を付けて`not_planned`で閉じます。

## 測定と分類

`git rev-parse --is-shallow-repository`は`false`です。`git count-objects -vH`ではloose objectが5,777件・54.77 MiB、packが7本・8,931 object・86.46 MiB、prune-packableが1,292件でした。共通repositoryの全ref・他worktree由来objectを含む観測であり、mainだけの履歴サイズや新規cloneの転送量ではありません。既存の一時object等4件・208 KiBのgarbage警告は保持し、整理は実施していません。

| 対象 | ファイル数 | 論理bytes |
| --- | ---: | ---: |
| mainの全追跡ファイル | 3,266 | 124,952,619 |
| `project/`の追跡ファイル | 2,183 | 110,232,113 |
| うちMarkdown・JSON以外 | 1,488 | 97,165,524 |
| 凍結した`legacy`全体 | 1,556 | 101,348,506 |

[ファイル別の分類](legacy-evidence-inventory.json)は718,010 bytesです。Markdownリンク・画像から参照される原本109件、`privacy_exception`69件、legacy本体と配置契約以外の追跡テキストからSHA-256が参照されるもの783件です。分類は重複します。リンクは参照元から相対解決し、digestは文字列の完全一致で分類しました。動的に組み立てるURLや説明文だけの参照まで網羅したという意味ではありません。

`structure:inventory`による08:23:47 UTCの作業領域と共通Gitの棚卸しは、通常ファイル110,406件・3,987,900,781 bytes、入口内の測定はcompleteでした。内訳は追跡正本124,922,247、依存873,205,237、サイト生成物13,316,595、Git metadata156,428,702、評価27,273、補助ツール1,019,788,709、その他ローカル1,800,212,018 bytesです。この値は測定時の依存・一時作業と共通領域を含み、mainの追跡サイズとは区別します。物理割当容量は測定していません。

## 判断理由と境界

移行で減らせるのは主に新しいcheckoutの約97 MBで、既存のGit履歴は減りません。1,556原本の再取得検証、外部URLの維持、digest参照と69件の公開範囲例外の扱いに対し、得られる容量削減は限られます。新しい大容量証跡の追跡追加は既に配置契約で止めているため、今回の移行費用を掛ける根拠は不足しています。

原本・SHA-256・`legacy`登録・`privacy_exception`を維持します。履歴改変、LFS導入、Release作成、公開範囲変更は実施しません。リンクが見つからない原本も、digestや再現性の保全対象から自動除外しません。今後checkout容量が具体的な支障になる場合は、非例外・参照なしの一部だけを候補に再評価できます。

## 検証

`npm run check:structure`、`npm run structure:inventory`と統合後の`npm run check`で配置・既存原本のhash・リンクを確認します。移動したファイルは0件のため、Releaseからの再取得試験は該当しません。依存や生成物を含む実作業領域の棚卸しは統合PRの検証結果で追跡します。
