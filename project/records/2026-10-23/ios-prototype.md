# SwiftUIとWKWebViewによるiOS試作

## 作業契約

- 目的: [実現性調査](../../../research/ios-app-feasibility-2026-10-21.md)を踏まえ、代表3記事と既存音声1本でiPhone用の試作を実装する。
- 許可根拠: ユーザーがSwiftUIとWKWebViewでの試作開始を明示した。ローカル実装・依存準備・検証を行う。ストア登録、公開配布、有料契約、外部への投稿は含めない。
- 入力HEAD: `405e29273a7a3257adeb370c6ac3196d35693d4d`。前回の調査5ファイルが未コミットの状態であり、その変更を保持する。
- 所有範囲: `ios/`、`scripts/build-ios-content.mjs`と必要な`ios-*`補助、対応する単体試験、`package.json`、生成物のignore・配置・リンク検査の契約、`project/README.md`と今回の作業記録。`docs/`と既存Webの表示実装は変更しない。
- 対象: Agentループ、ツール使用、Transformerのアーキテクチャ。音声は既存カタログのAgentループ1回を参照し、MP3は同梱・再配布しない。
- 実装: SwiftUIの一覧・検索・しおり、読書位置保存、WKWebViewの記事表示、ローカル記事パッケージ、検証後に切り替えるコンテンツ更新、AVPlayerの音声再生・ロック画面連携。
- 検証: lockfileで依存準備、記事生成の単体試験、実記事パッケージ生成・オフラインブラウザー表示、Swiftの可能な範囲の構文/型確認、プロジェクト設定、`npm run check`。iOS SDKと実機が必要な検査を別記する。
- 終了条件: 生成手順とXcodeで開けるプロジェクト、試作コード、検証結果、起動・実機受入手順を残す。実行環境不足の検査を成功扱いにしない。
- 適用規約: [AGENTS](../../../AGENTS.md)、[CONTRIBUTING](../../../CONTRIBUTING.md)、[調査・運用記録の規約](../../../harness/writing-rules.md#調査記録と運用文書)、[配置契約](../../../harness/structure.json)。ROADMAPのサイト・ハーネス入口とproject索引を確認した。

## 実装と検証の状況

3記事と音声1本の試作を実装し、記事生成、共通検査、Xcode 16.2によるSimulator向けビルドとXCTest 6件を完了した。Simulatorで3記事の本文、目次移動、数式、音声の短時間再生・一時停止を確認した。[起動・利用・受入手順](../../../ios/README.md)とXcodeプロジェクトを用意している。iPhone実機での受入は未実施である。

SwiftUI/記事保存、コンテンツ生成/本文レンダラー、ネイティブ音声を担当分担した。10月23日の初期実装時点ではCommand Line Toolsのみだったが、追加依頼を受けて10月24日にXcode本体とSimulatorを導入した。導入と実SDK検証の経緯は後掲する。

### 実装した範囲

- `ios/AILibrary/Sources/`: 一覧、日本語/英語検索、しおり、読書再開、目次、本文のWKWebView、コードコピー、Dynamic Type、外部HTTPSリンク、案内画面。
- 記事更新は「ファイル」からパッケージフォルダを選択し、全ファイル検証後にステージングとatomicなポインタ切り替えを行う。失敗時は旧版を維持する。遠隔更新サーバーは新設していない。
- `AVPlayer`・Audio Session・MediaPlayerによる音声再生、位置・速度・章の保存、ロック画面操作、割込み・イヤホン切断、通信失敗後の再試行を実装した。実動作確認とは区別する。音声画面を閉じると停止する。
- 記事は正本から安全な静的HTMLへ変換し、図SVG、KaTeXのHTML/MathML、フォントを同梱する。音声は既存URLとメタデータのみで、MP3を同梱・保存しない。
- `ios/`を配置・リンク検査へ追加し、生成Content・DerivedDataを除外/保護する。新規iOS実装のMIT適用と、記事・第三者資産の条件の継承をLICENSEへ追記した。

生成パッケージは3記事・音声1件のメタデータ、manifest以外の74ファイル、manifestを含め1,515,546 bytes。revisionは`b17704b3fbc3ed1549a2dfa232ef4e0643acf7832921132e9d295374faf74360`。今回選んだ音声の原文digestは現在の記事と一致した。

### 検証結果

| 面 | 実施結果と限界 |
| --- | --- |
| root共通検査 | `npm ci`と`TMPDIR=/private/tmp npm run check`成功。最新の共通試験は542件中527件成功・15件skip・失敗0件。Markdown・記事規約・リンク・ハーネスを含む |
| 生成単体試験 | 9件成功。出力とSHAの決定性、リンク、数式、危険なHTML/URL、symlink、音声版、読書復帰と明示ジャンプ |
| 実生成 | `PLAYWRIGHT_CHANNEL=chrome npm run ios:prepare`成功。ローカルChromeで図をSVG化、実KaTeXで数式を変換。生成物はGit管理外 |
| オフライン本文 | `PLAYWRIGHT_CHANNEL=chrome npm run ios:test:reader`成功。3記事、明暗、320/390px、1.6/2.5倍の文字サイズ、画像、MathML、コピーbridge、見出し移動、読書復帰。HTTP要求0・JavaScriptエラー0。デスクトップChromiumでの検査 |
| Swiftコア | `bash ios/tests/check-core.sh`成功。Foundation/CryptoKitで検索・パス/SHA・リンク/余剰ファイル拒否・更新失敗時の旧版保持・保存復帰の5シナリオと、実生成パッケージの3記事1音声74ファイル検証を実行 |
| Swift構文 | 11ソース・XCTest・CoreSmokeのparse成功。コア4ソースのmacOS向け型検査・コンパイルも成功。構文検査自体は実SDK検査の代替としない |
| プロジェクト | plist・XML・参照整合の静的確認に加え、Xcode 16.2による読込とSimulator向けビルドに成功 |
| iOS SDK / XCTest | iOS 18.2 SDK、iPhone 16・iOS 18.3.1 Simulatorで6件成功・失敗0。実WebKitでのルールコンパイルを含む |
| Simulator基本操作 | 3記事の本文、Transformerの目次ジャンプ・KaTeX数式、音声0→6→13秒の進行、一時停止後の13秒維持を確認。実機受入や全操作の網羅検査とは区別する |
| 公開音声のHTTP | HEAD 200、13,007,768 bytes、Range 206。先頭1,024 bytesのID3確認に加え、Simulatorで短時間のAVPlayer再生を確認。全体SHAの実測・全編再生・オフライン保存は未実施 |

本文の大きな文字でインライン数式が画面からはみ出す問題を検出し、数式部分の横スクロールで修正した。生成物パスの大文字小文字を含む保護の不備は単体試験で検出して修正した。

独立した読み取りレビューで、Debugのtestability設定不足、読込中の目次要求の取りこぼし、パッケージ更新時のSwiftUIとWKWebViewの版不整合を指摘・修正した。修正後の再確認で指摘解消を確認した。スクロールしない場合にも読書再開の記事が保存されるよう修正し、コア試験で確認した。レビューは実SDKの検証の代替ではない。

検証の機械可読要約は[JSON](ios-prototype.json)。画像と本文検査のJSONは`<repo>/.local/ios-evidence/`、共通検査ログはローカル一時領域の`ai-agent-library-ios-prototype-check.log`に保存した。大量のログ・画像は追跡対象へ追加しない。

最終記録反映後のMarkdown lint、調査本文を明示したリンク検査（474ファイル・6,166リンク）、JSON構文、差分の空白は成功した。構造検査は未追跡の提出候補を含む2,589ファイルでも成功し、生成物・依存が候補に混ざっていないことを確認した。commit・push・公開操作は行っていない。

### 依存準備と容量

rootの`npm ci`は成功した。開始時に存在しなかった`<repo>/website/node_modules`へWeb全体の`npm ci`を行ったところ、529 MiB展開した時点で`ENOSPC`になった。使用プロセスの終了、正本・既存の依存・証拠を含まないこと、リンクではない実体パスを確認して、この不完全なフォルダのみを削除した。復元方法は`cd website && npm ci`。

必要な生成ツール3種だけを一時的に`<repo>/.local/ios-tools`へ用意した後、`ios/tools`の専用packageとlockfileへ移行した。`npm ci --prefix ios/tools --ignore-scripts`は成功し、以後はWeb全体の依存なしで生成できる。rootとwebsiteのlockfileは変更していない。実行時のNodeは同梱のv24.19.0を一時的なPATHで選び、個人設定は変更していない。

## 残る受入

Xcodeの導入、アプリ全体のSimulator向けビルド、標準XCTestと基本表示・短時間再生は確認した。iPhone、VoiceOver、ロック画面での実再生・着信・イヤホン切断・通信断などの実機受入は未実施である。[READMEの受入表](../../../ios/README.md#検証)に従い、実機で確認する必要がある。

権利棚卸しの未確認点を解消したという意味ではなく、音声の同梱・ダウンロードを追加しない試作としている。アイコン・配布用メタデータ、App Privacyの最終申告、ストア登録・申請、全記事への展開は今回の到達点に含めない。前回の調査資料と、今回の実装・未実施項目は別記録として保持する。

## 追加依頼: Xcodeの導入確認

ユーザーからXcode導入の依頼を受け、OS・空き容量・公式の配布経路を確認した。Xcodeの導入と初期設定は依頼範囲に入るが、無関係な個人ファイルの削除やmacOSのアップグレードは依頼されていない。

実測はmacOS 14.6.1・arm64、空き約1.2〜1.3 GiB、Xcode未導入・Command Line Toolsのみ。[Appleの互換表](https://developer.apple.com/xcode/system-requirements/)でXcode 16.2がmacOS 14.5〜15.x対応と確認した。試作のビルド候補になるが、現行ストア提出のSDK条件とは区別する。[旧版の公式取得経路](https://developer.apple.com/xcode/resources/)はApple Accountへのサインインが必要で、有料Developer Program加入は不要である。ログイン後のファイル容量・ダウンロードの実行は未確認。

現状は空き容量が足りず、ダウンロード・導入を開始していない。空きのある外付けディスクも確認できなかった。rootの容量棚卸しは成功したが、リポジトリ全体は論理サイズ約368 MBであり、ここだけの整理で十分な容量は作れない。一般のDownloads等の容量集計は応答を待たず中止し、削除・移動は行っていない。容量整理の対象を選ぶ、自身で空ける、外付けSSDを使う、の選択をユーザーへ提示した。

### 2026-10-24: 整理対象を選ぶための容量確認

ユーザーが「容量の大きい項目を確認して、整理対象を選ぶ」を選択したため、Downloads、ユーザー/システムのキャッシュ、ローカルAIモデル、Dockerの保存領域のmetadataを読み取りで調べた。ファイル本文・会話・認証情報は読まず、削除・移動・アプリ停止・Docker起動は行っていない。

| 候補 | 割当容量の概算 | 整理時の影響・未確認点 |
| --- | --- | --- |
| A: Yarn・Playwright・pip・pnpm・Homebrewキャッシュ | 7.32 GiB | パッケージや対応ブラウザーの再取得が必要。オフラインでの導入や検査に影響 |
| B: 旧インストーラー・古いダウンロード残骸19件 | 約4.76 GiB | マウント中のClaude/Orcaの2画像と、個人の書類ZIP・ソースを除外。削除前に使用中でないことを再確認する |
| C: LM Studioの2モデル | 約7.25 GiB | Qwen3-8B-MLX-4bit約4.31 GiB、openchat_3.5-GGUF約2.95 GiB。削除すると再取得が必要 |
| D: Microsoft更新パッケージ | 約2.97 GiB | Word・PowerPoint・OneNote用。更新中/保留中か未確認。管理者権限が必要な可能性 |
| E: 旧IDEキャッシュとtorchモデル重み | 約2.07 GiB | JetBrains約1.02 GiB、VGG16/VGG19約1.05 GiB。再索引や再取得が必要 |
| F: Docker保存領域 | 約20.58 GiB | images・containers・volumes等を含み得る。直接削除を単純なキャッシュ整理として扱わない |

Docker.rawの論理サイズ59.60 GiBに対して割当容量は20.52 GiBであり、59.60 GiBを解放見込としていない。Docker CLIで内部内訳を読み取ろうとしたがdaemonへ接続できず、内部の不要量は未確認である。現在使用しているCodexの実行依存と更新状態が未確認のCodexキャッシュは候補から除外した。

容量は通常ファイルの`st_blocks × 512`を集計し、hardlinkは領域内で重複排除した。symlinkは追跡せず、APFSの共有ブロック・snapshotや実行中の変更により、削除後の空き容量増加は集計値と一致しない場合がある。保護されたキャッシュの一部とTrashはアクセス不可として未調査。具体的な対象パスとmetadataは私有の`<repo>/.local/xcode-storage/candidates.json`へ保存し、公開記録に個人のパスや資料名は取り込まない。

ユーザーによる整理対象の選択を待つ。候補の提示は削除・保存データ破棄の実施許可とは扱わず、Xcodeの取得と導入も未開始である。

記録更新後の`npm ci`・`TMPDIR=/private/tmp npm run check`は成功した（542件中528件成功・14件skip・失敗0件）。JSON構文と差分の空白も確認した。

### 2026-10-24: A〜Eの整理の実施

ユーザーからA〜Eを対象にする明示指示を受けた。Aの再取得用キャッシュ、Bの選定済み19ファイル、CのLM Studioの2モデル、DのOffice更新パッケージ、Eの旧IDEキャッシュ/torch重みを整理し、空き容量確認後にXcode導入へ進む。FのDockerとCodex実行環境・更新キャッシュは対象外である。

削除前に対象の実体パス、リンク/マウント/利用中の状態を確認し、私有の作業台帳へ保存する。ソフトウェア本体や文書へ対象を拡張しない。Officeの更新中ファイルや管理者権限が必要な箇所は、実際の確認結果に基づいて個別に扱う。削除結果と空き容量は追記する。

削除前に実体パス・inode・マウント・現在ユーザーから見えるopen fileを照合し、Aの5ディレクトリ、Bの19ファイル、Cの2モデル、Dの選定済み3更新PKG、Eの旧IDEキャッシュとtorch重みの計31対象を削除した。エラーはなく、選定対象の消失を再確認した。Dは個別ファイルへの権限で削除でき、管理者権限は使用していない。JetBrains Toolboxには使用中のIPCがあったため残し、Office自己更新PKG、Docker保存領域、Codex実行環境、マウント中のディスクイメージも保持を確認した。

削除直前の空きは約1.15 GB、削除直後は約25.68 GBで、約24.53 GB増えた。その後の確認時点では約20.10 GB（約18.72 GiB）である。整理中にOfficeの別バージョンの更新PKGが新しく生成され、バックグラウンド処理による再利用も観測したため、容量は時点値として扱う。私有の削除台帳と確認結果を`<repo>/.local/xcode-storage/cleanup-results.json`、`cleanup-verification.json`へ保存した。

Xcode 16.2の公式ダウンロードをブラウザーで開き、Apple公式のサインイン画面に到達した。ユーザーへ画面内でのログインを依頼し、画面を引き継ぎ用に保持した。パスワード・認証コードは収集していない。ログイン完了待ちのためXcode本体の取得・導入、iOS SDKビルドは未実施で、macOSの更新も行っていない。整理後の`TMPDIR=/private/tmp npm run check`は528成功・14スキップ・失敗0で終了した。

### 2026-10-24: Appleの初回契約画面での引き継ぎ

ユーザーからサインイン完了の返答を受け、Apple公式画面でログイン後の状態を確認した。初回のApple Developer Agreementへの同意画面が表示されたため、ブラウザー操作の確認ルールに従い、契約に同意する操作は行わず、ユーザー自身による内容確認・Agree操作を依頼した。契約画面を引き継ぎ用に保持し、画面写真は一時領域にのみ保存した。Xcodeのダウンロード・導入はまだ開始していない。有料プログラム加入やmacOSアップグレードは行っていない。

02:47:26 JSTの読み取り専用の再確認では、空き容量は26,432,266,240 bytes（約26.43 GB / 24.62 GiB）。Aの5キャッシュの内容の割当容量は合計0 bytesで、Dは既存のAutoUpdate自己更新PKGだけが残る。整理中に観測した別バージョンのOffice更新PKGも残存していない。容量整理の追加操作は行っていない。

### 2026-10-24: Xcode本体の取得と署名確認

ユーザーから契約同意完了の返答を受け、Apple公式の登録後画面を確認した。任意のプロフィール作成は後回しにし、認証済みのMore Downloadsから安定版Xcode 16.2を取得した。公式画面の表示は2.77 GB、保存されたXIPは2,969,019,672 bytesである。別経路の非公式アーカイブは使用していない。

最初のsandbox内の`pkgutil --check-signature`は`invalid signature`を返したため、XIP展開の申請は自動承認レビューに拒否された。展開を迂回せず、sandbox外の読み取り専用の同じ検査で`Status: signed Apple Software`と終了コード0を確認した。証明書チェーンはSoftware Update（2029年期限）、Apple Software Update Certification Authority（2031年期限）、Apple Root CA（2035年期限）である。環境による検査結果の差を観測したが、最初の失敗原因そのものは断定しない。信頼設定や隔離属性は変更していない。

この新しい検証結果を根拠に、Apple標準の`xip --expand`を一時作業ディレクトリで再申請し、展開処理を開始した。Apple署名のXIPのみを扱う組込検証と、展開後のアプリの検証を行い、失敗したアプリは起動しない。

XIPの展開は終了コード0で完了した。ただし出力は`signing certificate was "Software Update" (validation not attempted)`であり、展開コマンド自身が署名の検証を実施したとは記録しない。別に行った`pkgutil`の検査成功に加え、展開後の`codesign --verify --deep --strict --verbose=2`が終了コード0で`valid on disk`・`satisfies its Designated Requirement`、`spctl --assess --type execute --verbose=2`が終了コード0で`accepted`・`source=Apple System`となることを確認した。

検証後に既存配置先がないことを確認し、アプリを`/Applications/Xcode.app`へ移動した。`xcodebuild -version`でXcode 16.2・Build version 16C5032aを確認した。配置時のアプリの割当容量は約6.11 GBである。

最初のSDK一覧取得はXcode and Apple SDKsのライセンス未同意を示して終了コード69となった。XcodeをUIで開くとプラットフォーム選択画面へ進んだため、macOS 15.2の組込サポートに加えてiOS 18.2（表示8.72 GB）を選択し、Download & Installを実行した。共通システムコンポーネントのインストールが進んでいることを画面で確認した。エージェントはAgreeボタンや`-license accept`を実行していない。Xcodeの初回セットアップ中に`xcode-select -p`がXcode本体のDeveloperディレクトリを指す状態になったことも観測した。

### 2026-10-24: 実SDK検証とSimulatorでの受入

初回セットアップ完了を`-checkFirstLaunchStatus`の終了コード0で確認し、iOS 18.2 SDKと利用可能なiOS 18.3.1 runtime（22D8075）を確認した。UIが取得した構成は「iOS 18.2 + iOS 18.3.1 Simulator」である。プラットフォーム取得前のビルドは宛先なしで終了し、取得後に実コンパイルへ進んだ。

実SDKでは音声プレーヤーが全stored property初期化前に`@Published duration`を読むエラーを検出し、初期値のローカル定数で修正した。WebKit importの並行性互換指定、Binding setterの明示クロージャ、毎回実行するmanifest検査phaseの宣言も調整した。独立した読み取りレビューで退行がないことを確認し、Simulator向けビルドに成功した。

接続更新後に古いテストの完了記録・実行プロセスがないことを確認し、成功扱いせず再実行した。実行PID・終了コード・ログ・xcresultを私有領域へ保存し、まずコア5件の成功を確認した。

実UIでは記事一覧を表示できたが、本文の準備でWebKitのルールコンパイルが失敗した。`|`を含む正規表現は[WebKitの実装](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/contentextensions/URLFilterParser.cpp)で非対応である。macOSの公開APIでも旧ルールの失敗を再現し、3つの独立したルールへ分けて同じ6schemeの遮断範囲を維持した。実WebKitでコンパイルする回帰検査を追加し、XCTest 6件の成功と、Simulatorで3記事本文・目次ジャンプ・数式表示を確認した。初回WebContentプロセスの起動中は白紙を観測したが、読み込み完了後には本文を表示できた。

音声の初回再生ではHTTP 206でデータを受信しながらAVFoundationの形式認識エラー（-11828）になった。配信先のContent-Typeは`application/octet-stream`だったため、[公開APIのMIME指定](https://developer.apple.com/documentation/avfoundation/avurlassetoverridemimetypekey)で許可済みの固定MP3を`audio/mpeg`として扱うよう修正した。URL制限や保存方式は変えていない。再ビルド後のXCTest 6件は失敗0、実UIでは再生位置が0→6→13秒へ進み、一時停止後は13秒に留まることを確認した。修正の最終内容も独立した読み取りレビューを受けた。

取得用XIPの削除は当初、A〜Eとは別の明示許可がないとして自動承認レビューに拒否された。ユーザーからXIP削除とテスト継続の明示指示を受け、取得ファイルのサイズ・所有者・SHA256を確認して2,969,019,672 bytesのXIPのみを削除した。Xcode本体とruntimeは保持した。私有台帳は`<repo>/.local/xcode-storage/new-installation-archive-cleanup.json`である。

検証中にはVMのswapファイル12 GiBを観測したが、開始時点のVM使用量は不明のため増加分や原因プロセスは断定しない。検証用iPhone 16を元のShutdown状態へ戻し、停止後の空き容量は約10.39 GBへ戻った。仮想端末のデータと導入済みruntimeは保持し、VMファイルの直接削除やMacの再起動は行っていない。

最新の共通検査は`npm ci`成功、`TMPDIR=/private/tmp npm run check`成功（527成功・15skip・失敗0）。最終のXCTestは私有の`<repo>/.local/ios-evidence/AILibrary-tests-20261024T040305Z.xcresult`と対応ログに保存した。画面写真は同領域の`simulator-*.png`に保存し、追跡ファイルへ含めていない。実機試験、ストア申請、commit・push・公開は行っていない。
