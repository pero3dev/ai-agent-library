# 図解の公開検証・別PC引き継ぎキット

2026-09-24作成。既存の推論内部向け公開検証キットを、別のWindows PCで再開できる形にし、`scripts/diagram-release/` に配置しています。元キットは変更していません。公開先は `pero3dev/ai-agent-library` と `https://pero3dev.github.io/ai-agent-library` に固定され、接続先を任意指定する機能はありません。

現在は、PR58向けのsampling比較ラベル2条件を移植した中間版から、C1の学習パイプライン1記事を追加した候補です。旧58ケースを保持し、新13ケースで2図・10段階・9 READ停止を検査します。全7記事・71ケースの候補全体について、独立レビューと実行受入は保留です。別PC・GitHub API・artifact取得・公開ブラウザー検証の実施状況は、リポジトリの最新の実施記録を正本にします。このキットの準備成功を公開完了として扱いません。

## 作業契約と再開入口

- 目的: 既存58ケース、固定fixture、CI/Pagesの同一性条件を維持し、C1の13ケースを追加する。個人のドライブ・ユーザー名・以前の一時フォルダーを必要としない実行入口を用意する。
- 所有: `scripts/diagram-release/` と対応する `tests/unit/diagram-release-portable.test.mjs`。元キット、製品、Git、公開状態を変更しない。
- 許可: 引き継ぎ準備とオフライン検証まで。公開実行は現在の担当者が実際のmerge SHAと成功main CI/Pagesを確認した後に行う。
- 終了条件: 構文・help・オフライン検査、source→portableの差分対応とhash、再開手順を提出する。各後継変更の独立レビューは、その候補に対する判定が出るまで保留として記録する。
- 継続の境界: 最新ユーザー依頼は「P1の15記事を完了して停止」。P2以降へ自動継続しない。次の担当はGPT-6 Astra Ultraを想定するが、製品の利用可能性や設定をこのキットは変更しない。

次の担当は会話より先に、取得したリポジトリ内の `AGENTS.md`、`project/README.md`、`project/plans/engineering/dynamic-diagrams.md`、`dynamic-diagram-inventory.md`、`project/records/2026-09-24/dynamic-diagram-rollout.md`、`inference-reading-diagrams.md` を読みます。受入台帳と最新commit/PR/CIを確認し、過去の公開・レビュー結果を再実行済みと取り違えないでください。実行入口は `scripts/diagram-release/` です。

## 必要なもの

Windows、PowerShell 7以上、Node.js 22以上（CIは22）、npm、GitHub CLI `gh`、Windows同梱または互換の `tar` をPATHに用意します。GitHubの認証はこのPCで行い、トークン・認証ファイルは引き継がないでください。キットはブラウザーや依存を自動インストールしません。

リポジトリのルートで `npm ci`、`website` で `npm ci` を実行します。ブラウザーは `website` で `npx --no-install playwright install chromium webkit` を実行して、lockfileに対応するランタイムを準備します。この準備にはネットワークを使います。Edgeを選ぶ場合はEdgeがインストール済みであることが必要です。グローバルのPlaywrightや別フォルダーの依存は使わず、runnerが `website/package-lock.json` とインストール済み `@playwright/test` の版を照合します。

## パスの契約

`--repo`（PowerShellは `-Repo`）にはリポジトリのルートを指定します。省略時は現在ディレクトリがルートである必要があります。親ディレクトリを推測して探索しません。

`--output`（collectorは `-OutputDirectory`）は必須です。リポジトリとキットの外側に、今回の証拠専用ディレクトリを用意してください。ファイルシステムのルート、リポジトリやキット内、symlink/junction経由の出力は拒否します。生成物はその配下に作成します。過去runの同名ディレクトリは再利用しません。出力先を他プロセスが同時に変更しないようにしてください。この検査はOSの隔離機構ではありません。

collectorの再開先、runnerのevidence、extractorのarchiveも明示した出力先の内側が必要です。extractorはtarの全展開をせず、固定7記事に対応する通常HTMLだけをstdout経由で読み、固定名で保存します。重複member、リンクmember、不一致BUILD_IDは元の条件のまま失敗します。

## 別PCでの実行例

以下はPowerShell 7で、最新リポジトリのルートから実行します。`$kit` は採用した配置、`$evidence` はこのPCで新しく用意するフォルダーに合わせます。これらの例は元PCのパスを必要としません。

```powershell
$repo = (Get-Location).Path
$kit = Join-Path $repo 'scripts/diagram-release'
$evidence = Join-Path (Split-Path $repo -Parent) 'diagram-release-evidence'
node (Join-Path $kit 'check-preparation.mjs') "--repo=$repo" "--output=$evidence"
node --test (Join-Path $repo 'tests/unit/diagram-release-portable.test.mjs')
pwsh -NoProfile -File (Join-Path $kit 'collect-deployment.ps1') -Help
```

新規PCのインストール時やコード変更時は `npm run check` と変更に対応する追加検証をリポジトリの規約に従って行います。上のオフライン試験だけで、製品や公開サイトの受入を済ませたことにはしません。

試験は配置契約に従い `tests/unit/diagram-release-portable.test.mjs` に置き、rootの `npm test` とCIのdocsジョブにも参加します。Node.js 22以上、tar、PowerShell 7が必要で、ツールがない場合は黙ってskipしません。Windows専用の短縮パス確認はWindowsで行います。`harness-windows` ジョブの明示的な試験一覧へ自動追加されるわけではありません。

公開責任者がGitHubの実mergeと成功したmain/pushのCI/Pagesを確認し、`$publishedMergeSha` と `$successfulMainRunId` に実値を設定した後だけ進みます。保存JSONや過去の会話を現在の成功APIの代用にしません。

```powershell
pwsh -NoProfile -File (Join-Path $kit 'collect-deployment.ps1') `
  -ReleaseConfirmed -Repo $repo -OutputDirectory $evidence `
  -MergeSha $publishedMergeSha -RunId $successfulMainRunId
if ($LASTEXITCODE -ne 0) { throw 'Collection failed; inspect the retained evidence' }
$identityFile = Join-Path $evidence 'artifact-evidence.latest.json'
$identity = Get-Content -Raw -LiteralPath $identityFile | ConvertFrom-Json
node (Join-Path $kit 'verify-public.mjs') --release-confirmed `
  "--repo=$repo" "--output=$evidence" "--artifact-evidence=$identityFile" `
  "--deployed-sha=$($identity.mergeSha)" "--expected-build-id=$($identity.expectedBuildId)" `
  --browser=chromium
if ($LASTEXITCODE -ne 0) { throw 'Chromium audit failed; inspect result.json' }
node (Join-Path $kit 'verify-public.mjs') --release-confirmed `
  "--repo=$repo" "--output=$evidence" "--artifact-evidence=$identityFile" `
  "--deployed-sha=$($identity.mergeSha)" "--expected-build-id=$($identity.expectedBuildId)" `
  --browser=webkit
if ($LASTEXITCODE -ne 0) { throw 'WebKit audit failed; inspect result.json' }
```

channel省略時はPlaywrightに同梱された標準Chromiumを使います。Edgeの場合はChromiumのコマンドだけに `--channel=msedge` を追加します。WebKitにはchannelを渡しません。結果の `browser.channel` は標準ChromiumとWebKitではnull、Edgeではmsedgeです。標準ChromiumとEdgeの両方を実施済みと報告しないでください。

中断したcollectorは、同じSHA/runを使い `-ResumeEvidenceDirectory` に出力先内の実際の `ci-...` ディレクトリを指定します。run attempt、artifact ID/digest/updated_atが変化した場合は再開を拒否します。新しい証拠取得としてやり直し、失敗したrunは残します。extractorを単独実行するときは `--archive=<出力先内のtar> --output=<その親の証拠ディレクトリ> --repo=<ルート>` を渡します。

## 保存する証拠と移動方法

出力先全体を同じ相対構造でコピーします。`ci-.../` は前後のGitHub応答、download、HTML抽出結果、artifact-evidence.json、portable-references.jsonを持ちます。`public-.../` はresult.jsonとPNG、`preparation-.../` はオフライン準備結果です。端末ログを保存する場合も出力先内の明示したファイルに保存し、終了コードを記録します。

新規result.jsonは元の絶対パスに加え、`portableReferences` に出力先基準のevidence・result・画像の相対参照を持ちます。collectorの `portable-references.json` はHTMLの対応表です。C1は既存のviewport PNGに加えてSVG全体の `-scene.png` を保存します。geometry観測の `screenshots.completeScene` から対応を辿れ、画像一覧にはCSS bbox・deviceScaleFactor・PNG寸法・撮影前後のスクロール位置を記録します。補助画像は実スクロールで固定ナビの下へSVGを収めて撮影し、元のスクロールへ戻します。スタイルやviewport寸法は変更しません。元viewport PNGを実画面の証拠として維持し、`-scene.png` はglyph確認用の補助証拠として区別します。低い画面のviewport画像で切れた上部/下部も、全体画像で独立確認します。以前の生証拠JSONを書き換えて新PCのパスへ置き換えないでください。旧絶対パスとコピー先の相対パスの対応表を別ファイルに追加します。機械71/71に加え、公開PNGの独立レビューを記録するまで可読性承認はpendingです。WebKitやviewportの結果は物理iPhone Safariの受入ではありません。

## 元キットからの対応

リポジトリの `.gitattributes`（`* text=auto eol=lf`）に合わせ、キット全ファイルをLFで保持し、先頭に空行を置かず、末尾LFは1個にします。元ファイルの空行は来歴と逆適用情報へ残します。Gitへの追加と別PCでのcheckoutによってhashが変わらないことをオフライン試験で検査します。

`source-mapping.json` に全8元ファイルのsourceRawSHA256（元の生バイト）、normalizedSourceSHA256（CRLF→LFだけを適用）、同名portable SHA-256、追加ファイルのSHA-256、変更点、保護したコード区間のhashを固定します。元キット自体や旧TEMPは次PCへコピーする必要がありません。manifestのhashだけで独立レビューを自動承認する仕組みではありません。

LF移管版manifest `d5ff1524136e8279af9e946ba4e4ae5faf71eb2cfa401b574a7258fd1ebaeb7c` の後継修正として、標準Chromiumの既定起動とchannel記録の2行を変更しています。保護区間の `sourceEdits` に前後の行を明示し、準備検査はその2行を元へ戻した内容のhashも照合します。元ソースhashは来歴として保持し、現在の候補hashと区別します。この変更は58ケース・fixture・CI同一性条件を変更せず、独立した限定レビューと実ブラウザー起動の確認は別の判定です。

初回提案は独立レビュー・採用前の状態で作成されました。その後、LF移管版、channel修正、unit試験の配置変更は独立レビューを経ています。manifestの `candidateRevision` と `layoutRevision` のstatusは各候補を作った時点の履歴であり、現在の承認状態を示しません。配置承認版manifest `bbbb935cd4a81212fc5c703624625659e2d708e6ffa0e378dcafaf10b35a6da8` を、今回の `labelRevision` の変更元として記録します。

ラベル移植中間版はPR58向け承認済み元ファイルのCRLF→LF正規化結果と一致しました。現版では提出前の空白検査に合わせ、余分な先頭LFと末尾LFを各1個削除しています。その削除を `reviewedSuccessor.sourceEdits` に明示し、LFを復元して承認済み元ファイルの正規化hashを照合します。本文に追加したのは既存sampling case内の値ラベルとlogit時の棒ラベルの2条件だけです。元B版の生バイトhashとLF正規化hashは履歴として残し、ファイル単位の `sourceEdits` でラベル2条件を逆適用し、先頭/末尾LFを復元した結果が旧LF正規化hashへ戻ることも準備検査で照合します。旧B版と現在のモジュールがそのまま一致するとは扱いません。

- `inference-checks.mjs`: LF移管時はCRLF→LFだけを適用。その後のラベル2条件の追加と、承認済み追加元の生バイトhash・正規化hashを分けて記録。`foundations-checks.mjs` と `known-site-observations.mjs` は元とバイト一致。数値fixture、既存58ケース、favicon例外禁止を維持。
- `verify-public.mjs`: CLI、repo/lockfile依存解決、出力先、相対参照と既定channelを移管時に変更。C1で対象route・marker・module呼出・報告件数を追加。公開先・identity検査・旧検査本文を、明示した追加を逆適用する保護hashで照合。
- `collect-deployment.ps1`: PowerShell 7、明示出力先、help、確認フラグ、パス検査、相対参照。GitHubのrun/attempt/job/deployment/artifact同一性と取得前後の確認を維持。C1では抽出結果が固定7routeと一致する追加検査を行う。
- `extract-ci-html.mjs`: 明示出力先とhelp、出力の排他作成、相対参照。旧6記事を保持し学習パイプラインを加えた7記事の通常HTML選択・hash・単一BUILD_IDを照合。
- `check-preparation.mjs`: 旧TEMPとの比較を固定hashへ置換。case callbackを実行せず登録名を列挙し、承認済みPR58公開結果由来の旧58名と順序を保持すること、新13名を加えた71件、7route集合、23推論段階・54 sampling設定・10学習段階・9 READ停止を確認。
- `training-checks.mjs`: 承認済み絵コンテ由来の独立fixture。全10段階を1440×1000明/暗、1280×720明、390×844明/暗、960×540明・DSF2で検査する。全11 selector値、中点と逆シーク、9 READ停止、keyboard/modal、2図の実時間再生、noJS/print、学習と検索の入力先、モデル外の権限境界、scene配信分離を確認する。製品modelから正解を読み込まない。
- `portable-paths.mjs` とrepo所有の `tests/unit/diagram-release-portable.test.mjs`: オフラインのパス・CLI・依存版検査。試験はkit内に置かず、manifestの `location: repository` と固定repo相対パスで参照する。準備検査はこの試験1ファイルだけをkit外参照として許可し、通常ファイル・経路内・symlink/junctionなしを検査する。
- `README.md`: 今後の再開手順。`finalize-local.mjs` は元公開単位で実行済みの専用処理なので、汎用キットへ含めない。

C1の変更元はラベル中間版manifest `c68b2b87452f374be0da9d8a6a488655db1989e3425e3074895a4aa8d16c05ff` です。`c1Revision.predecessorFiles` にrunner・extractor・collectorの変更行を明示し、逆適用したファイル全体が中間版hashと一致することを検査します。元Bの保護hashも保持し、保護区間の追加だけを逆適用して照合します。7記事のexact route集合は3入口とmanifestで一致させ、旧6記事だけ・重複・異なるBUILD_IDのartifactを拒否します。

## P1の15記事へ広げる前に

C1候補の71ケースは7記事用です。旧58ケースと6記事を保持した上での拡張であり、15記事すべてを網羅したとは数えません。次の制作単位では記事・図・段階・独立fixture・source map・静止表示・noJS/print・実時間操作・画面条件・配信分離を追加し、collectorとextractorの対象HTML、runnerの同一性集合とケース数、準備manifestを同じ変更で更新します。元ケースを残し、新しい版で独立レビューを受けます。

特に `alignment-theory` は現在、図を持たない対照記事としてBUILD_IDとheavy chunkゼロを検査しています。同記事へ図を入れる前に、適切な無図対照の選定、固定許可対象、BUILD_ID検査、分離期待値を更新し、新しい図の記事はartifact HTML照合の対象へ追加してください。heavy chunkゼロのassertionを無条件に外して済ませないでください。

各制作単位の公開ゲートと記事別受入を更新し、P1の15記事の主要論点・数式・表示・公開確認が完了した時点で停止します。次段階への継続はこのキットから開始しません。
