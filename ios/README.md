# iPhone用の開発版 — SwiftUIのネイティブ本文

開発時の標準ビルドは、全published記事（2026-10-25時点で199記事）を構造化JSONへ変換し、本文・一覧・保存・音声の画面をSwiftUIで表示します。文章・コード・表はネイティブ表示し、図と数式はビルド時に明暗別PNGへ変換します。端末での本文表示にWKWebView・HTML・JavaScriptは使用しません。

標準生成はdraftと章READMEを本文記事に含めません。音声は既存のAgentループ1回（約27分）を参照します。代表3記事の回帰対象は[Agentループ](../docs/01-concepts/agent-loop.md)、[ツール使用](../docs/01-concepts/tool-use.md)、[Transformerのアーキテクチャ](../docs/11-llm-internals/transformer-architecture.md)で、音声と代表版の選定は[content-selection.json](content-selection.json)が正本です。

0.2.13（15）の[標準生成の記録](../project/records/2026-10-25/ios-published-development-default.md)で、通常npmの全記事生成・原文監査・実consumer監査、代表版との互換性を追跡します。一般公開・配布用登録・費用・音声権利の採択と、開発時の生成入口の変更は別の工程です。

## これまでの実機・基準確認

2026-10-24に、構造化データへの変換とSwiftUI本文レンダラーを実装しました。3記事・音声1本・照合対象140ファイルを実生成し、共通検査・Foundation/CryptoKit検査・iOS SDKビルドが成功しました。0.2.0（2）をiPhoneへ導入・起動し、更新前のしおり・読書記録の維持を確認しました。ユーザーの実機操作で、3記事の本文・図・数式、目次移動、しおり、終了・再起動後の読書位置の復帰が正常と確認できました。この時点の詳細受入は、後続の0.2.1で進めました。0.2.0の実装と確認範囲は[ネイティブ本文の実施記録](../project/records/2026-10-24/ios-native-reader.md)を参照してください。

移行前のSwiftUI＋WKWebView版では、Xcode 16.2（16C5032a）・iOS 18.2 SDKでのビルド、iOS 18.3.1 Simulatorでの本文・短時間の音声再生、iPhone 12でのオフライン本文と保存・音声の基本受入を確認しています。これらは旧方式の結果です。[旧Simulator記録](../project/records/2026-10-23/ios-prototype.md)と[旧実機記録](../project/records/2026-10-24/ios-device-validation.md)を、今回のネイティブ本文の合格証拠として引き継ぎません。

続く[詳細確認](../project/records/2026-10-24/ios-native-detailed-validation.md)で、図の読み上げ文とVoiceOver情報、音声の再試行・待機中の速度変更を修正した0.2.1（3）を実機へ導入しました。2026-10-25に、[手動チェック表](../project/records/2026-10-24/ios-native-manual-checklist.md)で指定したA〜Dの実施可能な確認を終えました。オフライン、表・コピー・選定記事間と指定外部リンク、図・数式、音声・通信復帰・イヤホン切断、最大文字・縦横・明暗・復帰・VoiceOverはユーザー報告で正常です。Core・音声XCTest16件も実機で成功しています。実着信、未収録要素のfixture等は残件です。画面自動テストはUI Automationの開始待ちで未実行であり、手動確認とは区別します。

代表3記事にない書式・見出しリンク・数式リンクは、[専用記事による検証](../project/records/2026-10-25/ios-native-fixtures.md)へ分けて進めています。対象の0.2.2（4）は実機へ導入・起動し、Core・音声・数式リンクとナビゲーションのXCTest計30件が成功しました。Releaseのテスト記事除外と、テスト記事が未生成のDebugビルドも確認しました。

2026-10-25に専用記事のA〜Dと補足2点を完了しました。記事内・別記事の見出し・数式・表のリンク、重複目次と到着後の読み上げ、外部リンク、書式・入れ子・引用・表・コード3種類と通常段落・数式混在リンクのコピー、最大文字・縦横・明暗・VoiceOverはユーザー報告で正常です。テスト側のしおり・P05付近への再起動復帰、通常3記事と保存記録の保持、テスト側と通常側の音声ボタンの表示も確認しました。専用記事は0.2.2（4）で確認し、0.2.1の受入結果から推定していません。

後続の0.2.4・0.2.5では検索ヒットへの移動と記事改訂後の照合を実装しました。0.2.5（7）の時点で、Hosted Simulatorの単体52件・UI2件とRelease監査が成功しました。新版の実機操作、実着信、本文block内の精度、UIの残る操作網羅と全記事展開は未完了です。今回の区切りは[自律実施記録](../project/records/2026-10-25/ios-autonomous-progress.md#今回の統合前チェックポイント)を参照してください。

## 準備と起動

基準PR作成時の記録では、外部音声metadataの時間境界とpackage間の画像cacheの分離を追加レビューで修正し、ソース版を0.2.3（5）へ進めました。当時の通常・fixtureのCoreSmokeとiOS SDKのテストターゲットcompile／Release buildを確認しています。追加したXCTestの実行と0.2.3の実機受入はその記録の時点で未実施です。ユーザーの指示に従い未完了として記録し、0.2.2の実機結果と区別しています。

必要なものはリポジトリの要求を満たすNode.js、対応するMacとXcode、iOS 17以降のSimulatorまたはiPhoneです。プロジェクトのSwift言語モードは5、アプリに外部Swiftパッケージは使用しません。ストア配布のSDK要件とローカル試作の対応OSは別です。

リポジトリのルートで実行します。

```bash
npm ci
npm ci --prefix ios/tools --ignore-scripts
# Chromeが導入済みの場合。専用の一時ブラウザーを起動します。
PLAYWRIGHT_CHANNEL=chrome npm run ios:prepare
npm run ios:test:content
npm run ios:test:package
open ios/AILibrary.xcodeproj
```

Chrome以外では、`PLAYWRIGHT_CHANNEL`に利用可能なChromiumのchannelを指定するか、`cd ios/tools`で`npx playwright install chromium`を実行し、ルートへ戻って`npm run ios:prepare`を実行します。ブラウザーを追加取得する場合は別途ディスク容量が必要です。生成ツールは専用の[package.json](tools/package.json)とlockfileで固定し、Web全体の依存準備は不要です。ブラウザー・KaTeX・Mermaidは生成時だけ使います。

現行の対応形式はmanifest schema 2・document schema 1・native renderer v1です。[互換性と容量の契約](renderer/native-schema.md)と[実施記録](../project/records/2026-10-25/ios-native-package-contract.md)を参照してください。未対応版の取り込みは拒否し、保存済み版が不適合なら正常な同梱版を使います。旧HTML生成CLIは比較用の明示的な一時出力だけに制限し、`--output`の省略や通常・fixtureの出力先を指定した実行を拒否します。旧形式へ戻す操作には使いません。

Xcodeでscheme `AILibrary`とiPhone Simulatorを選び、Runします。Simulatorは開発者チームの設定なしで試せます。実機ではSigning & Capabilitiesで自分のTeamと一意のBundle Identifierを選びます。リポジトリは個人の署名・Team・認証情報を持ちません。

CLIでの確認例は次のとおりです。対象のSimulatorは手元の一覧から選び、`<simulator-id>`を置き換えてください。

```bash
xcrun simctl list devices available
xcodebuild -project ios/AILibrary.xcodeproj -scheme AILibrary \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath ios/DerivedData CODE_SIGNING_ALLOWED=NO build
xcodebuild -project ios/AILibrary.xcodeproj -scheme AILibrary \
  -destination 'platform=iOS Simulator,id=<simulator-id>' \
  -only-testing:AILibraryTests \
  -only-testing:AILibraryUITests/NativeReaderUITests \
  -derivedDataPath ios/DerivedData CODE_SIGNING_ALLOWED=NO test
```

生成後の`AILibrary/Content/`はXcodeのフォルダ参照でまとめてアプリに同梱されます。未生成のときはビルド手順でエラーを表示します。生成物・DerivedData・個人のXcode状態はGit管理しません。

正常な取り込み済みパッケージは、アプリ更新後も同梱版より優先されます。一覧の「その他の操作」から同梱コンテンツの件数・版を確認し、切替を確定するとこのアプリの同梱版を選べます。取消では変更せず、しおり・読書位置・以前のパッケージも保持します。[切替の記録](../project/records/2026-10-25/ios-bundled-content-activation.md)を参照してください。

## Debug用の専用テスト記事

通常の`npm run ios:prepare`は全published記事を`AILibrary/Content/`へ生成します。代表3記事だけの回帰には`npm run ios:prepare:representative`を使います。表示確認用の原文は[ios/fixtures/native-reader.md](fixtures/native-reader.md)に置き、公開記事の`docs/`へ追加しません。次のコマンドで通常の`Content`を維持したまま、別の`AILibrary/TestContent/`へ3記事と専用記事1本を生成します。ブラウザーの準備は通常の生成と共通です。

```bash
PLAYWRIGHT_CHANNEL=chrome npm run ios:prepare:fixtures
```

XcodeのDebug構成で再ビルドし、通常一覧の「その他の操作」→「本文表示テスト」を開きます。専用の画面ではテスト記事だけを一覧へ表示し、本文・目次・見出しリンクには通常と同じレンダラーとナビゲーションを使います。読み込み済みのsnapshotには4記事があり、代表3記事の特定見出しへのリンクもアプリ内で開けます。一覧へ戻って「閉じる」を押すと元のライブラリへ戻ります。

テスト中のしおり・読書位置は専用UserDefaults suiteへ保存し、コンテンツの保存先も`LibraryReaderTestContent`へ分けます。通常のしおり・本文位置・音声設定は変更しません。テスト画面では音声とコンテンツ取り込みを利用できず、通常ライブラリへのテスト記事の取り込みも拒否します。

Debugで`TestContent`を生成していない場合は、入口で記事が含まれていない旨を表示します。Release構成にはテスト入口と`TestContent`を含めません。生成物はGit管理せず、専用原文・生成処理・データ契約を正本にします。

数式画像だけのリンクと、文章・数式が混在したリンクには、対象のテキストに限ってUIKitのTextKitを使います。数式をネイティブのテキスト添付画像としてリンク範囲へ含め、選択・コピーと既存のリンク処理へ接続します。通常の文章はSwiftUIのTextを使い、HTMLの読み込みやWebKitは追加しません。実機での操作・読み上げは[専用チェック表](../project/records/2026-10-25/ios-native-fixture-checklist.md)で確認し、結果を専用記事の実施記録へ残します。

## 使える操作

- 現在選択しているパッケージの記事を一覧から開く。本文検索は空白区切りのAND検索で、英字大小・全半角・ひらがな/カタカナを正規化する。検索中に開くと、一致語を含む本文の段落等へ移動する。
- しおりを付け、しおりだけの一覧へ切り替える。次回起動時は「続きを読む」から保存位置へ戻る。
- 目次から見出しへ移動する。収録記事間のリンクはアプリ内で開き、有効な学習索引がある場合は正規の用語集・既知章URLもnative画面へ接続する。その他のHTTPS参照は外部で開く。
- 学習索引付きのパッケージでは、章README順・タグ・学習ルート・用語集から本文へ進む。
- 文章を選択する。見出し、強調、行内コード・リンク、階層リスト、引用をネイティブテキストで表示する。
- コードを横スクロールし、コピーする。表は横スクロールで全列を読み、セル内の強調・リンク・数式も表示する。
- 図と表示数式を横スクロール・拡大し、元のMermaid・TeXをテキスト表現として開く。行内数式は文章に組み込んだ画像で表示し、数式を含む文章の長押しメニューからTeXを開く。
- OSの文字サイズと明暗テーマに追随する。図・数式にも代替読み上げ文を持つ。実際の読み上げ品質は実機受入で確認する。
- Agentループのヘッドホンボタンで音声プレイヤーを開く。再生・停止、シーク、速度、章、ロック画面の操作を用意している。
- 一覧の「その他の操作」から記事パッケージのフォルダを取り込み、コンテンツを切り替える。「このアプリについて」でライセンスと通信の扱いを確認する。

音声は明示的な再生操作をするまで接続しません。初期起動・収録記事・図・数式・検索と学習案内は通信不要です。Python例など同梱対象外への参照や、外部の参考資料を開く場合は通信が必要です。**音声はストリーミングのみ**で、通信が必要です。プレイヤーを開いたまま画面をロックする利用を想定し、プレイヤーを閉じると停止します。

以下の版ごとの説明は、各機能を追加した時点の作業記録です。現行の生成入口と確認範囲は、上記の標準生成手順と0.2.13の記録を参照してください。

0.2.4（6）では検索結果から本文への移動を追加しました。本文内で全語が揃う箇所を優先し、語が別の段落に分かれる場合は一致する語の種類が多い箇所へ移動します。入れ子リスト・引用にも対応し、表・コードはその要素の先頭へ移ります。語句の色付けやセル・コード行内の移動は含みません。タイトル・概要等だけが一致して本文に語句がない場合は、先頭を表示して案内します。検索語は保存せず、通常の「続きを読む」は保存位置へ戻ります。[実施記録](../project/records/2026-10-25/ios-search-hit-navigation.md)にコード・SDKの確認と未実施の実機受入を分けて記載します。

0.2.5（7）では[記事改訂後の復帰](../project/records/2026-10-25/ios-reading-revision-restore.md)を追加しました。旧保存を維持し、新たな保存時には本文JSONのdigestと内容の指紋を記録します。段落挿入や見出し改名後も一意に一致する本文を探し、重複・変更・削除で照合できない場合は見出し、次に近い割合へ戻ります。本文を開くだけで保存を書き換えません。block内の文字位置やpixel精度、改訂後の実機スクロールは未確認です。

0.2.6（8）では「絞り込み」から章・難易度を選べるようにしました。検索・しおりとANDで絞り込み、条件表示と全解除を用意しています。選択肢は表示対象の記事だけから作り、未知の難易度も表示します。条件は保存しません。タグ・章順・学習ルート・用語集は引き続き未実装です。[実施記録](../project/records/2026-10-25/ios-category-level-filter.md)でSDK compileと未実施のHosted実行・実機受入を区別します。

0.2.7（9）では初期読み込み失敗に理由と「再試行」を表示し、存在しない記事への遷移から一覧へ戻れるようにしました。保存記録と正常版の保持を検査し、初期失敗中のimportエラーの案内も未読込状態に合わせています。[復旧の実施記録](../project/records/2026-10-25/ios-load-recovery.md)で、実Storeの非UI検査と未実施のiOS XCTest・画面受入を区別します。

0.2.8（10）では全記事候補のHostedで見つかった、目次の到着見出しが上部バーへ隠れる不具合を修正しました。実際の縦スクロールのinsetを反映して配置し、目次を閉じた後に移動します。修正版SDK compileと、未確認のHosted再試験・実機を[候補UIの記録](../project/records/2026-10-25/ios-published-candidate-ui.md)で区別します。

[現targetの照合](../project/records/2026-10-25/ios-native-runtime-audit.md)では、appの本文経路・Sources・resourcesに旧WebKitやHTML/JS bridgeが残っていないことを確認しました。比較用の旧HTML生成・試験と、nativeでも再利用するparser等は開発側へ残しています。

[Hosted Simulator CI](../.github/workflows/ios-native.yml)は記事生成・監査、全AILibraryTests、NativeReaderUITestsの2件、Releaseの通常manifest・全SHA・TestContent不在を追加チェックとして検査します。既存11必須チェックやmain保護設定は維持します。[基準CIの実施記録](../project/records/2026-10-25/ios-native-ci.md)と[UI実行の追加](../project/records/2026-10-25/ios-native-ui-ci.md)で、hostedの実行結果とローカルSDK compileを区別します。UI2件は本文・目次・しおり・再起動復帰の基本範囲で、全UI・実機受入は別に追跡します。

0.2.10（12）では通常一覧の「その他の操作」から、このアプリの同梱コンテンツを確認して選べます。現在・同梱版の実際の記事数と版を表示し、確認の取消では切り替えません。成功後に一覧の一時条件だけを解除し、しおり・読書位置は保持します。保存済み版を自動で上書きせず、旧版削除や全記事の既定採用も別に扱います。[切替の記録](../project/records/2026-10-25/ios-bundled-content-activation.md)で非UI検証と未完了の画面・実機受入を区別します。

0.2.11（13）では読込時に不変の全文検索索引を作り、入力ごとの全記事正規化を省きます。本文と同時に切り替え、別内容の同IDや索引にない記事は従来検索へ戻します。[検索索引の記録](../project/records/2026-10-25/ios-normalized-search-index.md)で結果等価性、Macの補助性能測定、SDK compileと未完了の実機性能を分けて示します。

0.2.12（14）では、学習索引にある正規の章URLを本文から開くと、アプリ内の章案内とREADME順の記事へ進めます。章案内を閉じて本文へ戻る導線を用意し、未知URL等と索引のない代表3記事は従来のbrowser fallbackを保ちます。[章リンクの記録](../project/records/2026-10-25/ios-native-chapter-link.md)で、全199記事の前提・関連リンク保持、URL回帰、SDK compileと未完了の画面確認を区別します。

## block内部の読書位置

0.2.16（18）の[block内部の読書位置候補](../project/records/2026-10-26/ios-intrablock-reading-progress.md)では、実測したblock内の相対位置を任意anchorへ保存し、同じ本文の復帰とlayout変更後の再配置に使います。自動復帰が失敗した場合は旧保存を保ち、未到達の目次・検索等の目的地は自動layout再起動へ引き継ぎます。旧保存形式・しおり・block順の割合を維持し、意味内容で同じblockと確認できないfallbackでは内部位置を破棄します。旧v3 codeのSDK4段階（App16module・Core/Inline型検査・既存2CLI compile）は成功しましたが、新snapshot/pickerへ合わせたPublishedは未compileです。unit152・機能UI16（Published14＋Native2）＋pure geometry6＝22 selectedはsource数で、新mainの実登録・XCTest/UI・CI、最大文字・回転・VoiceOver・実機は未確認です。厳密な同じ文字やpixel位置の保証とIOS-11全体の完了は含みません。 実main270 `955c066c8dc0fdbedf6f0c845a461abda39ac476`（tree `9d2525e28ce3d9b6659eeac57b0b6f910e7e262b`）へbindした私有候補である。親PR270 head85d9のunit133（131成功＋2skip）・full21・Releaseと全15check成功は親の履歴で、新P1 unit152／UI22の実登録・実行は未確認とする。独立review後にrootがDraftへ反映してCIを実行し、必要exact-head CI成功までmainへ統合しない。 Published CIのjob上限だけ40分から50分へ調整し、selector・個別15秒・assert・commandは維持する。これはCI実行上限で製品性能budgetではない。

## 記事の生成と更新の試験

[生成CLI](../scripts/build-ios-native-content.mjs)と[変換処理](../scripts/lib/ios-native-content.mjs)は、Markdown原本と音声カタログからパッケージを作ります。[資産生成](../scripts/lib/ios-native-assets.mjs)は行内・表示数式とMermaidを明暗別PNGへ変換します。元のTeX・Mermaidと代替読み上げ文をJSONへ残し、KaTeX・Mermaid・記事のライセンスも同梱します。端末用パッケージはJSON・PNG・TXTで構成し、HTML・JS・CSS・SVG・フォントは含めません。

形式の正本は[ネイティブ本文のデータ契約](renderer/native-schema.md)です。`manifest.json`の`schema_version`は2、各記事の`document_path`が本文JSONを指します。本文の`schema_version`は1で、段落・見出し・リスト・引用・コード・表・図・数式をblockとinlineへ変換します。記事ID・見出しIDを継承し、block IDは見出しと内容に基づいて生成します。未対応要素や不正な参照は生成・取り込み時に検出します。

`manifest.json`は記事ID、原本のSHA-256、更新日、見出し、検索テキスト、音声の版・クレジット・章、全同梱ファイルのSHA-256を持ちます。`revision`は生成内容に由来する識別子です。同じ入力・ツール・ブラウザー・フォント環境で再生成することを前提とします。

旧HTMLパッケージ（manifest schema 1）はこのレンダラーでは取り込めません。保存済みの現行パッケージが不適合なら、新しい同梱パッケージを読み込みます。しおり・読書記録は維持し、旧`heading`＋`fraction`の記録は見出しから近いblockへ移します。見出しがない場合は割合を補助として使い、旧レイアウトと同じ座標への復帰は保証しません。

更新の試験は、生成した`Content`フォルダを「ファイル」アプリで選べる場所へ置き、一覧のメニューから取り込んで行います。ZIPで転送した場合はファイルアプリで展開してからフォルダを選択します。取り込みはパス・ファイル数・サイズ・SHAに加え、schema、block・inlineの型と必須フィールド、記事・見出し・資産参照、PNG寸法等を検証します。私有領域のstagingへコピー後に再検証してから、atomicなポインタファイルで切り替えます。失敗時は現在の版を維持します。

自動ダウンロードや公開更新サーバーは、この開発版には含めません。ハッシュ照合は内容の整合検査であり、作成者の真正性や悪意のない内容を保証する署名ではありません。信頼する生成手順のパッケージを選びます。過去版は開いている記事の参照を壊さないため保持し、自動整理は未実装です。

## 全published記事の一時生成

全記事の生成検証には、`--all-published`と明示的な`--output`を使います。上記の依存・ブラウザーの準備後、リポジトリのルートで実行します。出力先はsymlinkのないシステム一時ディレクトリ内の`ailibrary-ios-*/Content`に限定し、通常の`Content`・`TestContent`とその親子への出力、`--fixtures`との併用を拒否します。

```bash
all_package_root="$(mktemp -d /private/tmp/ailibrary-ios-all-published.XXXXXX)"
TMPDIR=/private/tmp PLAYWRIGHT_CHANNEL=chrome node scripts/build-ios-native-content.mjs \
  --all-published --output "$all_package_root/Content"
bash ios/tests/check-package.sh "$all_package_root/Content" 199
```

末尾の`199`は2026-10-25時点のpublished記事数です。記事数が変わった場合は、対象の正本に合わせます。draftとREADMEは含めません。全図の説明は[専用map](all-published-diagram-descriptions.json)を必須とし、音声は既存のAgentループ1本を維持します。この一時生成は学習索引を付けない検証用profileで、標準の全記事`Content`や別の4記事fixtureを置き換えません。iPhone上のパッケージ選択も変更しません。

[全記事の実施記録](../project/records/2026-10-25/ios-all-article-package.md)では、199記事・PNG422本・manifest込み625ファイル、37,547,753 bytesを実生成し、appと同じContentValidatorと本文読み込み入口で全199記事を受け入れました。約2.28秒はこのMacのFoundation CLIでの検証・全本文読み込み時間であり、アプリ起動・描画・実機性能の測定ではありません。CIへ全記事の一時生成・consumer監査stepを追加し、初回に見つかった出力先と環境の一時ディレクトリの不一致を修正しました。Hostedでの全記事生成成功は未確認です。全記事の画面・VoiceOver・性能受入を残し、IOS-13・15を完了とはしません。

## 全記事の標準生成と代表版の互換入口

`npm run ios:prepare`は既存CLIの`--published-library`を使い、全publishedを固定の`ios/AILibrary/Content`へ生成します。実行するとそのContentを置き換えます。CLIのこのモードは他profile・fixtures・`--output`とは併用できません。

```bash
PLAYWRIGHT_CHANNEL=chrome npm run ios:prepare
npm run ios:test:content
npm run ios:test:package
```

`ios:test:content`は全publishedの原文監査、`ios:test:package`は同梱物の実Swift consumer監査です。package監査へ件数も渡す場合は`npm run ios:test:package -- <独立に数えた記事数>`を使います。

直接CLIをno flagで呼ぶと従来どおり代表3記事です。npmの互換入口は`ios:prepare:representative`と`ios:test:content:representative`で、既存の`ios:test:core`とその明示alias `ios:test:core:representative`も代表3記事を検査します。fixture4記事は`--fixtures`と既存npm入口を維持します。一時全記事の原文監査は`TMPDIR=/private/tmp node ios/tests/native-content-audit.mjs --all-published --content <一時Content>`で行います。

[通常同梱候補の記録](../project/records/2026-10-25/ios-published-library-profile.md)では、共有Contentを保った私有rootで実生成・consumer・原文監査を確認しました。実Mermaidの微小な再描画差によってrevisionが変わる場合があり、同じassetsを使ったmode比較とは区別します。この記録は明示modeを追加した時点の結果です。後続の標準npm入口の検証は[標準生成の記録](../project/records/2026-10-25/ios-published-development-default.md)へ分けます。保存済みの正常packageは同梱版より優先されるため、同梱更新だけでは取り込み済み3記事版の選択を変えません。

標準の全記事同梱モードには、章の掲載順・タグ・学習ルート・用語集を[任意の学習案内JSON](renderer/learning-index-schema.md)として追加します。正本から抽出した情報を既存のSHA一覧へ載せ、本文schemaと代表3記事・fixture4記事・一時全記事profileの互換性を維持します。[生成の実施記録](../project/records/2026-10-25/ios-learning-index-generation.md)で旧readerの非UI互換と、後続のSwift consumer・学習UI・受入を区別します。

学習案内の[Swift検証モデル](AILibrary/Sources/LearningIndex.swift)は、任意資産の不在、破損・不適合・参照不整合を区別します。Storeは本文と学習情報を一括適用します。全SHA等のパッケージ検証を通過した後、補助JSONの形式・参照等が不正なら正常な本文を保持して学習案内のエラーを分けます。[consumerの実施記録](../project/records/2026-10-25/ios-learning-index-consumer.md)で、モデル追加時点のMac直接XCTest・SDK compileとHosted・UI受入の範囲を分けます。

0.2.9（11）では、学習案内付きコンテンツの「学習ガイド」から章・ルート・用語集へ進めます。タグ検索と他条件のAND、章README順、用語から関連本文、記事内の正規用語集リンクをnative画面へ接続しました。索引なしの従来3/4記事は以前の表示を維持します。[学習UIの記録](../project/records/2026-10-25/ios-native-learning-ui.md)で、SDK compileと未実施のHosted画面・実機受入を区別しています。

## 全記事候補のHosted UI検査

[全記事workflow](../.github/workflows/ios-published-candidate.yml)は、標準のnpm生成・原文監査・package監査を実行し、原本から独立に数えた件数とDebug実アプリ・全UI・Releaseを照合します。このjob内では全記事の描画を一度行い、DebugとReleaseで同じ生成物を使います。別の[代表版workflow](../.github/workflows/ios-native.yml)はrepresentative入口を明示し、3記事・fixture4記事・CoreSmokeと既存`NativeReaderUITests`2件、全記事の一時生成・consumer検査を維持します。ローカルの`ios:test:reader`もこの既存UIクラスだけを実行します。

新しい`PublishedReaderUITests`は、原文から数えた件数を`TEST_RUNNER_AILIBRARY_EXPECTED_PUBLISHED_COUNT`で受け取り、画面の「全N記事」と照合します。値がない・不正・3以下ならskipせず失敗します。代表3記事のテスト例でこのクラスを一緒に実行しない構成です。

初期の全記事候補UIでは、既存の代表3記事・目次・しおり復帰に、大図の拡大とテキスト表現、長文の深い見出しからの復帰、最大表の最終行・列を加えた5件を準備しました。その対象は01・03・08・11章の6記事に限ります。後続の学習導線・同梱切替・章案内にも回帰を加え、全記事jobは`NativeReaderUITests`と`PublishedReaderUITests`の全機能ケースを実行します。これらを全記事の画面受入・実機・VoiceOver・性能合格とは区別し、[候補UIの記録](../project/records/2026-10-25/ios-published-candidate-ui.md)と各機能の記録で実行面を追跡します。

## 全記事一覧が使えるまでの性能観測

[専用のHosted観測](../.github/workflows/ios-performance.yml)は、Debugの起動要求から全記事数と学習ガイドの表示確認までを`XCTClockMetric`で測ります。独立した原文件数と実Debug同梱版の監査後、専用の`PublishedPerformanceUITests`だけを実行します。通常の機能UI10件は別jobで維持します。

終了処理を計測から外し、warm-up1回と記録3回を区別します。操作自動化とアクセシビリティの待ち時間を含み、監査でファイルcacheも温まるため、初回インストール・disk cold・Release・実機の起動時間ではありません。CPU・メモリ・スクロールや性能目標の合否も扱いません。

生xcresult・CSV・型付きmetric・実行環境をartifactへ残します。欠測や異なるテストID、非数は失敗扱いで、ゼロに置き換えません。初回Xcode16.4のJSON・CSV・log・xcresultで実Clock識別子・表示名・秒単位と3標本を独立確認しました。初回は契約nullで非ゼロ終了を保ち、追加guardでは実CSVの5列・1行・宛先/構成・typed原順3値・秒平均を厳密照合します。平均は印字小数位の半刻みだけをBigIntで許し、欠測を補いません。追加sourceは保存済raw再生で確認し、新headのHosted成功とは区別します。[観測基盤の記録](../project/records/2026-10-25/ios-published-readiness-observation.md)で実測前の静的確認と実行結果を追跡します。

[main49のApp起動観測](../project/records/2026-10-28/ios-published-launch-readiness.md)では、Debug・Xcode16.4/iOS18.5の起動から全199記事数と学習ガイドの存在確認までをClock3標本で記録した。平均7.5879547333333335秒とCSVの丸めを照合し、終了処理を除いたUI/AX待機込みの温まったcacheでの観測として扱う。過去のCore CLI、cold起動・p95・RSS・実機・性能予算と区別し、TODOの完了欄は変更しない。

## 全記事Coreのhost観測

`npm run ios:benchmark:core -- --help`と[専用CLI手順](tests/core-performance.md)、[実観測の記録](../project/records/2026-10-26/ios-published-core-benchmark.md)を参照する。b79基線で実施した凍結CLIのraw19process/記録15は旧観測として保持し、最新source4のsnapshotや未実施の再CLIと分ける。通常CIはNode fixtureだけで、SDK・corpus観測は明示した手動CLIと別guardのまま。App/PBX/workflow/P1/Iconと全TODOを保持し、IOS-15と予算採択は未完了である。

2026-10-27の[現行CoreのHosted観測](../project/records/2026-10-27/ios-core-hosted-observation.md)は、b39／Workflow9bの凍結19process・15標本とCore実装main f5eを扱う。上の段落は旧準備時点の履歴として保持する。後続main76の新push Common・Native・Fullは成功し、Nativeの追加12単体と通常UI、Fullの一意22caseを確認した。旧性能値をSource4が変わったApp0.2.20（22）へ転用せず、App・実機・最低iOS17・VoiceOver・p95・性能予算とIOS-15全体は未完了とする。TODO32行・完了12行を保持する。

## 検証

rootの`npm run check`でコンテンツ変換の単体試験と共通検査を実行します。macOSで一時ディレクトリのsymlink拒否に当たる場合は、`TMPDIR=/private/tmp npm run check`を使います。PNG生成は実ブラウザーを使うため、注入した資産を使う単体試験と区別します。

標準の全記事生成後は、次の監査を実行します。これらは画面・VoiceOverの検査やXCTestの実行とは別です。

```bash
TMPDIR=/private/tmp npm run check
npm run ios:test:content
npm run ios:test:package
```

代表3記事と専用記事の回帰を行う場合は、生成profileを明示します。`ios:prepare:representative`はContentを3記事へ置き換えるため、全記事版をビルドし直す前には`npm run ios:prepare`を実行してください。

```bash
PLAYWRIGHT_CHANNEL=chrome npm run ios:prepare:representative
npm run ios:test:content:representative
npm run ios:test:core:representative
PLAYWRIGHT_CHANNEL=chrome npm run ios:prepare:fixtures
npm run ios:test:fixtures
DEVELOPER_DIR=/Library/Developer/CommandLineTools bash ios/tests/check-core.sh --fixtures
# 利用できるSimulatorのIDを選ぶ。既存UI2件の回帰。
xcrun simctl list devices available
IOS_SIMULATOR_ID='<simulator-id>' npm run ios:test:reader
```

`ios:test:reader`はiOS SimulatorのネイティブUI検査です。本文が実際に存在することと、目次・しおり・終了再起動後の復帰を確認します。対象と結果、画面証拠の保管先は[今回の記録](../project/records/2026-10-24/ios-native-reader.md)を参照してください。旧`reader-check.mjs`のデスクトップChromium検査は旧HTML本文用であり、ネイティブ本文の検証には使いません。

明示的なDebugのUIテスト起動ではSimulator・実機とも専用の学習記録suiteを使い、通常起動時は従来の記録を使います。`ios:test:content`は原文・表・コード・リンク・数式説明・図説明・全SHA・PNGを読み取り専用で照合します。VoiceOverの聞き取りや画面操作は実行しません。

[LibraryCoreTests.swift](AILibraryTests/LibraryCoreTests.swift)は検索・不正データ・更新中断・読書記録の移行をXCTestで検査します。`CoreSmoke.swift`は代表3記事・fixture4記事の主要条件と実際の生成manifestをFoundationで確認する補助です。全記事は`PackageAudit.swift`を使う`ios:test:package`で検査します。Xcodeがある環境で上記`xcodebuild test`を実行してから、次の実機項目をネイティブ版でも確認します。

| 実機で確認すること | 受入条件 |
| --- | --- |
| 初回のオフライン起動 | 機内モードで選択中のパッケージ全記事・図・数式・検索を利用でき、索引付きでは学習案内も辿れる |
| 表示と読み上げ | 大きい文字、横画面、VoiceOverの見出し移動・表/数式/図の代替説明を確認する |
| 読書の継続 | コピー、目次、記事間移動、旧記録の移行、再起動後のしおり・読書位置が機能する |
| 更新失敗 | 壊したパッケージや取り込み中断で正常版を読める。旧schema 1を誤表示しない |
| 音声 | ロック中の再生・停止・シーク、着信・イヤホン切断後の停止/復帰、通信断のエラーと再試行 |

## 保存版の保持契約の回帰

[保持契約の追加回帰](../project/records/2026-10-25/ios-storage-retention-regression.md)は、3世代の更新後も旧snapshotから本文・PNGをdisk再読できること、正常な孤立staging/未参照版をload・retryが無変更で無視すること、destination配置後のpointer書込失敗でも既存版・読書記録を保つことを検査します。既存試験を維持し、単体登録は119から122件になりました。

私有Macで新3件は実行成功し、iOS SDKでは全122件・機能UI10件・performance1件のコンパイルを確認しました。iOSでの新3件の実行はHosted待ちです。削除・上限設定・pin/lease・実容量不足・プロセス終了は試していません。容量整理の方針を採用する前の回帰であり、既存の保存処理は変更しません。

[読書記録の破損保全と明示復旧](../project/records/2026-10-27/ios-reading-state-recovery.md)はPR282最終eabの6runとReady最新policy成功後、main76へ通常保護squashで統合した。main76の新push Common・Native・Fullも別観測で成功し、Native追加12単体と通常UI、Fullの一意22caseを確認した。旧Core性能は歴史scopeに保ち、実ユーザーの復旧固有UI・実機・VoiceOver・耐電断等とIOS-22全体は未完了、TODO32行・完了12行を維持する。後続PR283の新Recovery UIはこのmain76 checkpointの受入に含めない。

ネイティブ本文の[コードコピー回帰検査](../project/records/2026-10-27/ios-code-copy-ui-ci.md)は、公開ボタンのコピー済み状態を待ち、同じSimulatorの23件のraw結果とコピー実データ374Bを照合します。固定592の単独診断は成功し、終了後の一致をproducerが報告しました。最新main337へ結合して通常Fullへ復元し、新headの23件・独立raw374B・Releaseを確認する段階です。実機・VoiceOverとIOS-25全体は未完了です。

[読書記録復旧のUI回帰](../project/records/2026-10-27/ios-reading-recovery-ui.md)では、DEBUG隔離suiteの取消し・確認と再起動後のしおり保持を確認しています。採用89のNative4件と、通常保護で統合したmainc1の新push（Common10 jobs・Native4件・Full22件）を2026-10-28 checkpointで分けて記録しました。Dedicated89のF成功・R失敗は別Driver作業として保持し、新Driverの効果、読書位置・backup生bytes・実機・VoiceOver・Core性能とIOS-22全体は未受入です。

[更新復旧試験の実行元](../project/records/2026-10-28/ios-destination-artifacts-ui.md)では、head56・3aの失敗を保持し、C2のDedicatedでF/R各1ケース、7回のApp一覧・phase source相関・最終52B sentinelとcleanupを限定受入として記録しました。通常6系統とmain142採用、反映後のCommon10job・Native UI4件・Full UI22件も別々に確認しました。Rの新しい診断・実launch root、内部cacheの保証と全userdataは未確認で、実機・VoiceOverやIOS-18・22・25全体は未完了です。

## 絞り込み中の補助画面と保存分離のUI回帰

[操作シートの追加UI回帰](../project/records/2026-10-25/ios-filtered-actions-ui.md)は、検索・タグを保持したAboutの開閉と、専用テスト記事のしおり変更が通常の保存へ混ざらないことを検査します。専用一覧は検索前に全1記事と確認し、通常のfilterを確認した後、通常readerの再開より前にアプリを再起動して永続データを読み直します。

既存の10機能ケースを残し、機能UIは12件、専用performanceは1件です。単独型検査と全targetのunit122/機能UI12/performance1のコンパイルを確認しました。追加2件の実UIは初回Hosted待ちです。ファイル選択画面のキャンセル、VoiceOver・最大文字・実機は未確認として残します。

[フォルダー選択取消の追随preview](../project/records/2026-10-26/ios-picker-cancel-ui.md)では、旧238eのfull run40226683804/job121269430760でunit133件（131成功・2skip）と機能UI14/15成功を確認した履歴を保持する。本文検索Aとpicker取消138.720秒は成功し、Bは最初の到着で失敗してTOC/save/restartへ未到達だった。新snapshot helperを保持したPub41c3＋Nativebcafは機能15件＋geometry6件のsource計21件となるが、新snapshot/full/native/runtime26・生成budget・site待機・Releaseは正確な新headで未実施である。実main269 `750a305a82c6ff7882de46fdf7889c81925c509e`（tree `7636f378ecd8e8202cd2d9c8c9e89e2aa85b875d`）へ固有6pathをbindした私有候補で、独立最終レビューと正確な新headのCIを待つ。公開PR270 head238eは未変更である。

## 本文検索ヒットと復帰のUI回帰

[検索ヒットの追加2件](../project/records/2026-10-26/ios-search-hit-ui-regression.md)は、入れ子の特定段落への到着と、本文検索後に別位置を保存して再起動した時のB/A差分を公開UIで検査します。本文のgestureで到着位置を作らず、旧queryが復帰で再実行されない動作までを扱います。

検索終了の修正後、旧head a88では単体127成功・2skip、機能UI14件とReleaseが成功しました。別headの検索到着判定の失敗も保持し、一時診断で判定中のgeometry重複取得を観測しました。新しい判定は1pollのviewportと各段落frameを再利用し、完全表示・先頭ID一致・15秒は維持します。picker追加前のsnapshot基線は機能14件と純粋geometry6件の計20件を新headのHostedで検証する予定です。新sourceのcompile・実登録・実行、VoiceOver・最大文字・実機は未完了です。

## SDK26のiPhoneOS Archive互換性検査

[専用preflight](../.github/workflows/ios-sdk26-archive.yml)は、公開リポジトリの標準`macos-26`でXcode26.6・iOS26.5 SDKを実行時に照合し、全記事を生成してgeneric iOS向けのRelease Archiveを作る候補です。配布用の署名資格情報やProvisioningを使わず、署名が無い場合とTeam/Authorityを持たないad-hocだけを扱います。Archiveの実アプリの全SHA・本文集合・ライセンス・Privacy Manifest、SDK・最低OS17・arm64・device platform・dSYM UUID・fixture不在を監査します。

ローカルMacの更新や署名済みIPAのexport、TestFlight・Store申請とは別の検査です。初回Hostedで実SDK26環境・Archive生成・actual Content監査まで成功しました。空の署名設定キーを扱うguard修正後、Archive Info全体のJSON変換で停止しました。必要な辞書のXML projectionからJSON化する限定修正を加え、実Info/Privacy・MachO/UUID/codesign監査を再検証します。[SDK26の記録](../project/records/2026-10-25/ios-sdk26-archive-preflight.md)で段階を追跡します。従来のXcode16.4・iOS18.5 Simulator回帰と最低対応OS17は維持します。

## iPhone AppIconの候補

[AppIconとビルド後監査](../project/records/2026-10-26/ios-app-icon-native-assets.md)は明示source commit `30a8a1db8d6c30eeb2c6e682f92ba94126cc5e35` へ私有準備した既存ブランドの8PNG/9slot・AppIcon監査候補で、0.2.16(18)から0.2.17(19)を提案する。PNG8/22,198B・source/validator/recipeを保ち、Published cap50・3selectorsへ承認監査呼出だけを加える。旧source check/Node13とactool失敗は履歴で、新compile・実CAR・Home/Store・exact-head CIと別人の最終payloadレビューは未実施。IOS-29全体は未完了で全TODO状態を維持する。

## ライセンスと通信

記事は[CC BY 4.0、試作実装はMIT](../LICENSE)。生成時に原文を構造化データへ変換し、図・数式を画像化しています。KaTeXの利用条件は`assets/katex/LICENSE.txt`、Mermaidの利用条件は`assets/licenses/Mermaid-LICENSE.txt`、記事・コードのNOTICEは`assets/licenses/NOTICE.txt`へ同梱します。

音声は既存の版付きGitHub Releases URLをそのまま利用し、`VOICEVOX Nemo（女声1・男声1）`と[声の利用条件](https://voicevox.hiroshiba.jp/nemo/term/)を表示します。MP3や台本の独立配布条件は[既存の棚卸し](../project/records/2026-10-03/license-inventory.md)の未確認事項として残し、この試作で同梱・ダウンロード機能を追加しません。宣言された音声SHAは識別情報として照合しますが、AVPlayerのストリーム全体のSHAを実測したものではありません。

[音声identityの契約候補](../project/records/2026-10-26/ios-audio-offline-identity.md)では、通常Agentループ1音声を保ち、宣言したepisode・記事・版付きURL・SHA・credit・規約と実原文を生成側で照合します。実main142に固定した関連Node54件と1773Bのmetadata等価性は限定検証の記録であり、将来headのCIではありません。MP3・台本・READYの実bytes、追加8音声・権利・音声保存・実機の受入は未確認です。

[通常1本の実MP3照合](../project/records/2026-10-28/ios-agent-loop-audio-byte-audit.md)では、固定mainf15とAudio候補65のAgentループ音声13,007,768Bを取得し、宣言・catalog・公式ReleaseのSHAと一致した。1取得チェーンを文書化し、音声本体の保存や再取得はしていない。台本のcanonical JSON・READY・制作証拠は未回収で、Releaseの将来不変性、受信ごとのhash検証、権利・追加8本・Store・IOS-04/16全体の受入とは分ける。

アカウント、広告、解析SDK、クラウド同期を追加していません。しおり・読書位置・音声位置は端末内へ保存します。音声を再生するとGitHubとその配信基盤へ通信し、外部リンクを開くとそのサイトへ通信します。配信先のIP等のログまで含めたストアのApp Privacy申告は未確定です。

[Appleのrequired reason API説明](https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitype)を2026-10-23に確認し、アプリ内の学習記録をUserDefaultsへ保存する利用を`CA92.1`として[PrivacyInfo.xcprivacy](AILibrary/PrivacyInfo.xcprivacy)へ記載しました。これはストア審査や第三者配信基盤のプライバシー確認を完了した意味ではありません。

[時計由来APIのPrivacy候補](../project/records/2026-10-26/ios-privacy-clock-reason-candidate.md)は、main142のApp16 Swift・時計7箇所と新しいApple公式DocC JSONの照合を記録しました。現mainのUserDefaultsのみ591Bと、SystemBootTime/35F9.1辞書211Bを追加する私有802B候補を区別します。wrapperへの適用は保守的な推論で、FileTimestamp理由は追加しません。Copy・Audio後の実mainへの結合・独立レビュー・新headのCI/Archive一致、配信先ログ・公開policy・問い合わせ先・Store回答を残し、IOS-27は未完了です。

## 開発版の制約と未完了の受入

開発時の標準同梱対象は全published記事と既存音声1本のmetadataです。音声はストリーミングで、専用テスト記事はDebugの別画面へ限定します。音声保存、独立したネットワーク更新、アカウント、課金、プッシュ通知、端末間同期は実装していません。正常な取り込み済み版と以前のパッケージは保持し、旧版の容量整理は未完了です。読書復帰はblock ID・見出し・割合を使い、block内の厳密な文字位置までは保存しません。大きな記事改訂や見出し変更後の同一位置への復帰は保証しません。

数式の読み上げ文は自動生成し、図には手動の流れの説明と抽出ラベルを含めます。代表3記事の指定箇所はVoiceOverで理解できるとユーザーから確認を得ました。追加記事・未収録形式の代替文は引き続き実機受入が必要です。行内数式の独立した画像拡大操作は未実装です。全記事と新しい画面の実機・VoiceOver・最大文字・性能の全体受入、公開用SDK26環境、アイコン、配布用メタデータ、App Store向けの最終ポリシーと公開申請は[完成版TODO](../project/plans/engineering/ios-app-completion.md)で追跡します。
