# iPhone用の試作 — SwiftUIのネイティブ本文

代表3記事を構造化JSONへ変換し、本文・一覧・保存・音声の画面をSwiftUIで表示する試作です。文章・コード・表はネイティブ表示し、図と数式はビルド時に明暗別PNGへ変換します。端末での本文表示にWKWebView・HTML・JavaScriptは使用しません。

対象は[Agentループ](../docs/01-concepts/agent-loop.md)、[ツール使用](../docs/01-concepts/tool-use.md)、[Transformerのアーキテクチャ](../docs/11-llm-internals/transformer-architecture.md)。音声は既存のAgentループ1回（約27分）を参照します。選定の正本は[content-selection.json](content-selection.json)です。

2026-10-24に、構造化データへの変換とSwiftUI本文レンダラーを実装しました。3記事・音声1本・照合対象140ファイルを実生成し、共通検査・Foundation/CryptoKit検査・iOS SDKビルドが成功しました。0.2.0（2）をiPhoneへ導入・起動し、更新前のしおり・読書記録の維持を確認しました。ユーザーの実機操作で、3記事の本文・図・数式、目次移動、しおり、終了・再起動後の読書位置の復帰が正常と確認できました。この時点の詳細受入は、後続の0.2.1で進めました。0.2.0の実装と確認範囲は[ネイティブ本文の実施記録](../project/records/2026-10-24/ios-native-reader.md)を参照してください。

移行前のSwiftUI＋WKWebView版では、Xcode 16.2（16C5032a）・iOS 18.2 SDKでのビルド、iOS 18.3.1 Simulatorでの本文・短時間の音声再生、iPhone 12でのオフライン本文と保存・音声の基本受入を確認しています。これらは旧方式の結果です。[旧Simulator記録](../project/records/2026-10-23/ios-prototype.md)と[旧実機記録](../project/records/2026-10-24/ios-device-validation.md)を、今回のネイティブ本文の合格証拠として引き継ぎません。

続く[詳細確認](../project/records/2026-10-24/ios-native-detailed-validation.md)で、図の読み上げ文とVoiceOver情報、音声の再試行・待機中の速度変更を修正した0.2.1（3）を実機へ導入しました。2026-10-25に、[手動チェック表](../project/records/2026-10-24/ios-native-manual-checklist.md)で指定したA〜Dの実施可能な確認を終えました。オフライン、表・コピー・選定記事間と指定外部リンク、図・数式、音声・通信復帰・イヤホン切断、最大文字・縦横・明暗・復帰・VoiceOverはユーザー報告で正常です。Core・音声XCTest16件も実機で成功しています。実着信、未収録要素のfixture等は残件です。画面自動テストはUI Automationの開始待ちで未実行であり、手動確認とは区別します。

代表3記事にない書式・見出しリンク・数式リンクは、[専用記事による検証](../project/records/2026-10-25/ios-native-fixtures.md)へ分けて進めています。対象の0.2.2（4）は実機へ導入・起動し、Core・音声・数式リンクとナビゲーションのXCTest計30件が成功しました。Releaseのテスト記事除外と、テスト記事が未生成のDebugビルドも確認しました。

2026-10-25に専用記事のA〜Dと補足2点を完了しました。記事内・別記事の見出し・数式・表のリンク、重複目次と到着後の読み上げ、外部リンク、書式・入れ子・引用・表・コード3種類と通常段落・数式混在リンクのコピー、最大文字・縦横・明暗・VoiceOverはユーザー報告で正常です。テスト側のしおり・P05付近への再起動復帰、通常3記事と保存記録の保持、テスト側と通常側の音声ボタンの表示も確認しました。専用記事は0.2.2（4）で確認し、0.2.1の受入結果から推定していません。実着信と全記事展開、検索ヒットの本文位置・記事改訂後の位置照合は残件です。

## 準備と起動

基準PRの追加レビューで、外部音声metadataの時間境界とpackage間の画像cacheの分離を修正し、ソース版を0.2.3（5）へ進めました。通常・fixtureのCoreSmokeとiOS SDKのテストターゲットcompile／Release buildを確認しています。追加したXCTestの実行と0.2.3の実機受入は未実施です。ユーザーの指示に従い未完了として記録し、0.2.2の実機結果と区別しています。

必要なものはリポジトリの要求を満たすNode.js、対応するMacとXcode、iOS 17以降のSimulatorまたはiPhoneです。プロジェクトのSwift言語モードは5、アプリに外部Swiftパッケージは使用しません。ストア配布のSDK要件とローカル試作の対応OSは別です。

リポジトリのルートで実行します。

```bash
npm ci
npm ci --prefix ios/tools --ignore-scripts
# Chromeが導入済みの場合。専用の一時ブラウザーを起動します。
PLAYWRIGHT_CHANNEL=chrome npm run ios:prepare
open ios/AILibrary.xcodeproj
```

Chrome以外では、`PLAYWRIGHT_CHANNEL`に利用可能なChromiumのchannelを指定するか、`cd ios/tools`で`npx playwright install chromium`を実行し、ルートへ戻って`npm run ios:prepare`を実行します。ブラウザーを追加取得する場合は別途ディスク容量が必要です。生成ツールは専用の[package.json](tools/package.json)とlockfileで固定し、Web全体の依存準備は不要です。ブラウザー・KaTeX・Mermaidは生成時だけ使います。

Xcodeでscheme `AILibrary`とiPhone Simulatorを選び、Runします。Simulatorは開発者チームの設定なしで試せます。実機ではSigning & Capabilitiesで自分のTeamと一意のBundle Identifierを選びます。リポジトリは個人の署名・Team・認証情報を持ちません。

CLIでの確認例は次のとおりです。対象のSimulatorは手元の一覧から選び、`<simulator-id>`を置き換えてください。

```bash
xcrun simctl list devices available
xcodebuild -project ios/AILibrary.xcodeproj -scheme AILibrary \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath ios/DerivedData CODE_SIGNING_ALLOWED=NO build
xcodebuild -project ios/AILibrary.xcodeproj -scheme AILibrary \
  -destination 'platform=iOS Simulator,id=<simulator-id>' \
  -derivedDataPath ios/DerivedData CODE_SIGNING_ALLOWED=NO test
```

生成後の`AILibrary/Content/`はXcodeのフォルダ参照でまとめてアプリに同梱されます。未生成のときはビルド手順でエラーを表示します。生成物・DerivedData・個人のXcode状態はGit管理しません。

## Debug用の専用テスト記事

通常の`npm run ios:prepare`は、選定した3記事を`AILibrary/Content/`へ生成します。表示確認用の原文は[ios/fixtures/native-reader.md](fixtures/native-reader.md)に置き、公開記事の`docs/`へ追加しません。次のコマンドで通常の`Content`を維持したまま、別の`AILibrary/TestContent/`へ3記事と専用記事1本を生成します。ブラウザーの準備は通常の生成と共通です。

```bash
PLAYWRIGHT_CHANNEL=chrome npm run ios:prepare:fixtures
```

XcodeのDebug構成で再ビルドし、通常一覧の「その他の操作」→「本文表示テスト」を開きます。専用の画面ではテスト記事だけを一覧へ表示し、本文・目次・見出しリンクには通常と同じレンダラーとナビゲーションを使います。読み込み済みのsnapshotには4記事があり、通常3記事の特定見出しへのリンクもアプリ内で開けます。一覧へ戻って「閉じる」を押すと元のライブラリへ戻ります。

テスト中のしおり・読書位置は専用UserDefaults suiteへ保存し、コンテンツの保存先も`LibraryReaderTestContent`へ分けます。通常のしおり・本文位置・音声設定は変更しません。テスト画面では音声とコンテンツ取り込みを利用できず、通常ライブラリへのテスト記事の取り込みも拒否します。

Debugで`TestContent`を生成していない場合は、入口で記事が含まれていない旨を表示します。Release構成にはテスト入口と`TestContent`を含めません。生成物はGit管理せず、専用原文・生成処理・データ契約を正本にします。

数式画像だけのリンクと、文章・数式が混在したリンクには、対象のテキストに限ってUIKitのTextKitを使います。数式をネイティブのテキスト添付画像としてリンク範囲へ含め、選択・コピーと既存のリンク処理へ接続します。通常の文章はSwiftUIのTextを使い、HTMLの読み込みやWebKitは追加しません。実機での操作・読み上げは[専用チェック表](../project/records/2026-10-25/ios-native-fixture-checklist.md)で確認し、結果を専用記事の実施記録へ残します。

## 使える操作

- 記事一覧から3記事を開く。本文検索は空白区切りのAND検索で、英字大小・全半角・ひらがな/カタカナを正規化する。検索中に開くと、一致語を含む本文の段落等へ移動する。
- しおりを付け、しおりだけの一覧へ切り替える。次回起動時は「続きを読む」から保存位置へ戻る。
- 目次から見出しへ移動する。選定3記事間のリンクはアプリ内で開き、それ以外のHTTPSリンクは外部で開く。
- 文章を選択する。見出し、強調、行内コード・リンク、階層リスト、引用をネイティブテキストで表示する。
- コードを横スクロールし、コピーする。表は横スクロールで全列を読み、セル内の強調・リンク・数式も表示する。
- 図と表示数式を横スクロール・拡大し、元のMermaid・TeXをテキスト表現として開く。行内数式は文章に組み込んだ画像で表示し、数式を含む文章の長押しメニューからTeXを開く。
- OSの文字サイズと明暗テーマに追随する。図・数式にも代替読み上げ文を持つ。実際の読み上げ品質は実機受入で確認する。
- Agentループのヘッドホンボタンで音声プレイヤーを開く。再生・停止、シーク、速度、章、ロック画面の操作を用意している。
- 一覧の「その他の操作」から記事パッケージのフォルダを取り込み、コンテンツを切り替える。「このアプリについて」でライセンスと通信の扱いを確認する。

音声は明示的な再生操作をするまで接続しません。初期起動・記事・図・数式・検索は通信不要です。**音声はストリーミングのみ**で、通信が必要です。プレイヤーを開いたまま画面をロックする利用を想定し、プレイヤーを閉じると停止します。

0.2.4（6）では検索結果から本文への移動を追加しました。本文内で全語が揃う箇所を優先し、語が別の段落に分かれる場合は一致する語の種類が多い箇所へ移動します。入れ子リスト・引用にも対応し、表・コードはその要素の先頭へ移ります。語句の色付けやセル・コード行内の移動は含みません。タイトル・概要等だけが一致して本文に語句がない場合は、先頭を表示して案内します。検索語は保存せず、通常の「続きを読む」は保存位置へ戻ります。[実施記録](../project/records/2026-10-25/ios-search-hit-navigation.md)にコード・SDKの確認と未実施の実機受入を分けて記載します。

## 記事の生成と更新の試験

[生成CLI](../scripts/build-ios-native-content.mjs)と[変換処理](../scripts/lib/ios-native-content.mjs)は、Markdown原本と音声カタログからパッケージを作ります。[資産生成](../scripts/lib/ios-native-assets.mjs)は行内・表示数式とMermaidを明暗別PNGへ変換します。元のTeX・Mermaidと代替読み上げ文をJSONへ残し、KaTeX・Mermaid・記事のライセンスも同梱します。端末用パッケージはJSON・PNG・TXTで構成し、HTML・JS・CSS・SVG・フォントは含めません。

形式の正本は[ネイティブ本文のデータ契約](renderer/native-schema.md)です。`manifest.json`の`schema_version`は2、各記事の`document_path`が本文JSONを指します。本文の`schema_version`は1で、段落・見出し・リスト・引用・コード・表・図・数式をblockとinlineへ変換します。記事ID・見出しIDを継承し、block IDは見出しと内容に基づいて生成します。未対応要素や不正な参照は生成・取り込み時に検出します。

`manifest.json`は記事ID、原本のSHA-256、更新日、見出し、検索テキスト、音声の版・クレジット・章、全同梱ファイルのSHA-256を持ちます。`revision`は生成内容に由来する識別子です。同じ入力・ツール・ブラウザー・フォント環境で再生成することを前提とします。

旧HTMLパッケージ（manifest schema 1）はこのレンダラーでは取り込めません。保存済みの現行パッケージが不適合なら、新しい同梱パッケージを読み込みます。しおり・読書記録は維持し、旧`heading`＋`fraction`の記録は見出しから近いblockへ移します。見出しがない場合は割合を補助として使い、旧レイアウトと同じ座標への復帰は保証しません。

更新の試験は、生成した`Content`フォルダを「ファイル」アプリで選べる場所へ置き、一覧のメニューから取り込んで行います。ZIPで転送した場合はファイルアプリで展開してからフォルダを選択します。取り込みはパス・ファイル数・サイズ・SHAに加え、schema、block・inlineの型と必須フィールド、記事・見出し・資産参照、PNG寸法等を検証します。私有領域のstagingへコピー後に再検証してから、atomicなポインタファイルで切り替えます。失敗時は現在の版を維持します。

自動ダウンロードや公開更新サーバーは、この試作には含めません。ハッシュ照合は内容の整合検査であり、作成者の真正性や悪意のない内容を保証する署名ではありません。信頼する生成手順のパッケージを選びます。過去版は開いている記事の参照を壊さないため保持し、自動整理は未実装です。

## 検証

rootの`npm run check`でコンテンツ変換の単体試験と共通検査を実行します。macOSで一時ディレクトリのsymlink拒否に当たる場合は、`TMPDIR=/private/tmp npm run check`を使います。PNG生成は実ブラウザーを使うため、注入した資産を使う単体試験と区別します。

```bash
TMPDIR=/private/tmp npm run check
# 実生成したデータとSwiftのFoundation/CryptoKit部分（XCTestとは別）
npm run ios:test:core
# 実生成物と原文、図・数式の説明、PNGの監査（画面・読み上げの検査とは別）
npm run ios:test:content
# 専用記事を含むTestContentの原文・参照・資産監査
npm run ios:test:fixtures
# TestContent実物のFoundation/CryptoKit検査（通常の3記事検査は上のios:test:core）
DEVELOPER_DIR=/Library/Developer/CommandLineTools bash ios/tests/check-core.sh --fixtures
# 利用できるSimulatorのIDを選ぶ
xcrun simctl list devices available
IOS_SIMULATOR_ID='<simulator-id>' npm run ios:test:reader
```

`ios:test:reader`はiOS SimulatorのネイティブUI検査です。本文が実際に存在することと、目次・しおり・終了再起動後の復帰を確認します。対象と結果、画面証拠の保管先は[今回の記録](../project/records/2026-10-24/ios-native-reader.md)を参照してください。旧`reader-check.mjs`のデスクトップChromium検査は旧HTML本文用であり、ネイティブ本文の検証には使いません。

明示的なDebugのUIテスト起動ではSimulator・実機とも専用の学習記録suiteを使い、通常起動時は従来の記録を使います。`ios:test:content`は原文・表・コード・リンク・数式説明・図説明・全SHA・PNGを読み取り専用で照合します。VoiceOverの聞き取りや画面操作は実行しません。

[LibraryCoreTests.swift](AILibraryTests/LibraryCoreTests.swift)は検索・不正データ・更新中断・読書記録の移行をXCTestで検査します。`CoreSmoke.swift`は同じコアの主要条件と実際の生成manifestをFoundationで確認する補助です。Xcodeがある環境で上記`xcodebuild test`を実行してから、次の実機項目をネイティブ版でも確認します。

| 実機で確認すること | 受入条件 |
| --- | --- |
| 初回のオフライン起動 | 機内モードで3記事・図・数式・検索が利用できる |
| 表示と読み上げ | 大きい文字、横画面、VoiceOverの見出し移動・表/数式/図の代替説明を確認する |
| 読書の継続 | コピー、目次、記事間移動、旧記録の移行、再起動後のしおり・読書位置が機能する |
| 更新失敗 | 壊したパッケージや取り込み中断で正常版を読める。旧schema 1を誤表示しない |
| 音声 | ロック中の再生・停止・シーク、着信・イヤホン切断後の停止/復帰、通信断のエラーと再試行 |

## ライセンスと通信

記事は[CC BY 4.0、試作実装はMIT](../LICENSE)。生成時に原文を構造化データへ変換し、図・数式を画像化しています。KaTeXの利用条件は`assets/katex/LICENSE.txt`、Mermaidの利用条件は`assets/licenses/Mermaid-LICENSE.txt`、記事・コードのNOTICEは`assets/licenses/NOTICE.txt`へ同梱します。

音声は既存の版付きGitHub Releases URLをそのまま利用し、`VOICEVOX Nemo（女声1・男声1）`と[声の利用条件](https://voicevox.hiroshiba.jp/nemo/term/)を表示します。MP3や台本の独立配布条件は[既存の棚卸し](../project/records/2026-10-03/license-inventory.md)の未確認事項として残し、この試作で同梱・ダウンロード機能を追加しません。宣言された音声SHAは識別情報として照合しますが、AVPlayerのストリーム全体のSHAを実測したものではありません。

アカウント、広告、解析SDK、クラウド同期を追加していません。しおり・読書位置・音声位置は端末内へ保存します。音声を再生するとGitHubとその配信基盤へ通信し、外部リンクを開くとそのサイトへ通信します。配信先のIP等のログまで含めたストアのApp Privacy申告は未確定です。

[Appleのrequired reason API説明](https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitype)を2026-10-23に確認し、アプリ内の学習記録をUserDefaultsへ保存する利用を`CA92.1`として[PrivacyInfo.xcprivacy](AILibrary/PrivacyInfo.xcprivacy)へ記載しました。これはストア審査や第三者配信基盤のプライバシー確認を完了した意味ではありません。

## 試作の制約

通常の利用対象は3記事と音声1本です。専用テスト記事はDebugの別画面へ限定します。音声の保存、全199記事の配信、アカウント、課金、プッシュ通知、端末間同期は含めません。読書復帰はblock ID・見出し・割合を使い、block内の厳密な文字位置までは保存しません。大きな記事改訂や見出し変更後の同一位置への復帰は保証しません。

数式の読み上げ文は自動生成し、図には手動の流れの説明と抽出ラベルを含めます。代表3記事の指定箇所はVoiceOverで理解できるとユーザーから確認を得ました。追加記事・未収録形式の代替文は引き続き実機受入が必要です。行内数式の独立した画像拡大操作は未実装です。全記事へ拡張した際の長文・大きな表・最大文字での性能計測、アイコン、配布用メタデータ、App Store向けの最終ポリシーと公開申請は[完成版TODO](../project/plans/engineering/ios-app-completion.md)で追跡します。
