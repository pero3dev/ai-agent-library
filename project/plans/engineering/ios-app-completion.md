# iOS完成版に向けたTODO

作成日: 2026-10-24。状態: **本文までSwiftUIへ全面移行する目標はユーザー指定。実装順・公開範囲は提案**。実装着手やApp Store公開の承認を示すものではない。

後続の実施: 同日の追加依頼で、代表3記事の構造化変換とSwiftUI本文レンダラーへ着手した。進捗と検証は[ネイティブ本文の実施記録](../../records/2026-10-24/ios-native-reader.md)を正本とし、この計画の作成時点の調査・前提とは区別する。一般公開・契約・費用・OS更新の採択を示すものではない。

2026-10-25追記: ユーザーの依頼で、[コミットとmainへのマージの計画](#コミットとmainへのマージの計画)を追加した。現在の受入済み実装を最初の節目とし、後続を機能ごとのPRへ分ける。今回は計画の更新までで、branch・commit・PR・mergeは実施していない。[追記の作業記録](../../records/2026-10-25/ios-delivery-checkpoints.md)で範囲と検証を確認できる。

完成形は、**本文の構造もSwiftUIで描画し、実行時の本文表示にWKWebView・HTML・reader.jsを使わないiOSアプリ**とする。文章は選択・検索・読み上げ可能なネイティブテキストで扱う。図・数式はネイティブ描画とビルド時の対応資産生成を比較し、端末ではSwiftUIから表示する。

既存のSwiftUI＋WKWebView試作は比較基準として再利用する。完成版の基準案は全published記事・既存音声・App Store公開までを含み、最低OS、公開方法、費用、初版の音声体験はIOS-01で採択する。ストア提出・配布用登録・申請の工程は、App Store／TestFlight配布を選んだ場合に適用する。ビルド時のNode.js・Mermaid・数式生成ツールと、アプリ実行時のWebView非依存は区別する。

## 2026-10-26の統合状況

[TODOと統合状況のチェックポイント](../../records/2026-10-26/ios-todo-integration-checkpoint.md)では、main `955c066c8dc0fdbedf6f0c845a461abda39ac476` の明示完了条件を照合し、IOS-02・10・13・14を完了とします。既存public標準Hosted Xcode26.6をSDK26最低条件に合うunsigned Archive用の技術環境として採用し、検索・native導線、全199記事生成・学習導線を確認した範囲です。他28行を保持し、12／32件の完了と、実機・性能・配布全体の未完了を分けます。

以下は作成時点の計画と段階ごとの履歴です。「未commit」「前提PR待ち」「通常3記事」等を最新状態へ読み替えず、実績とPR275の未マージsnapshotは上記記録を参照します。実機スキップを成功へ変えません。配布方式・費用・契約・署名・資格・申請と、最新OS27の受入は別に未完了で残します。

## 目的と作業契約

- 目的: 実機で動く試作から完成版までの差分を、優先度・依存関係・完了条件付きのTODOへ落とす。
- 今回の範囲: 現行実装と一次資料の読み取り、計画・索引・[作成記録](../../records/2026-10-24/ios-completion-planning.md)の更新。
- 所有ファイル: この計画、`project/README.md`、`project/records/2026-10-24/ios-completion-planning.md`と同名JSON。既存の試作・他者の変更を保持する。
- 許可根拠: ユーザーによる「完全iOSアプリ化に向けたTODO」の依頼。公式資料の閲覧とローカル計画作成までで、登録・課金・OS更新・申請は実施しない。
- 検証: 準備済み依存による`TMPDIR=/private/tmp npm run check`、Markdown・リンク・JSON・配置・差分確認。アプリコードは変更しない。
- 終了条件: 実装済みと残件、初版必須と追加案、採択が必要な判断を区別し、次に着手する単位を示す。
- 適用規約: [AGENTS](../../../AGENTS.md)、[計画索引](../../README.md)、[運用文書の規約](../../../harness/writing-rules.md#調査記録と運用文書)。ROADMAPのサイト・ハーネス入口を確認した。

## 現在の土台

[試作の手順](../../../ios/README.md)と[実機の確認記録](../../records/2026-10-24/ios-device-validation.md)を再利用する。

| 対象 | 2026-10-24時点の状態 |
| --- | --- |
| コンテンツ | 公開記事199本・16章、固有Mermaid 74種。Markdown原本は約2.66MB。[一時生成の実測](../../records/2026-10-25/ios-all-article-package.md)は全625ファイル・37,547,753 bytes。通常アプリの対象は3記事のまま |
| 音声 | 公開カタログは9本。現在の記事の正規化SHAと異なるものが6本あり、旧記事版としての表示・更新方針を確認する対象 |
| 試作の対象 | 3記事と完全音声1本。生成処理と音声URL許可の両方に固定条件がある |
| 実機確認済み | オフライン本文・図・数式・検索、しおり・読書位置復帰、音声・ロック画面・シーク・速度変更 |
| 再利用する基盤 | LibraryStore、ReadingStore、ContentRepository、音声エンジン、SHA付きmanifest、手動取り込みの検証・原子的切替・失敗時旧版維持 |
| 本文と一緒に移行するもの | 目次、コピー、本文リンク、OS連動の文字サイズ・明暗、読書位置。既存機能の仕様を保ち、SwiftUI本文上で再実装・再検証する |
| 追加検証 | VoiceOver、最大文字、横画面、着信・イヤホン切断・通信断、実機での更新失敗。割込処理などは実装済みでも実機受入は未完了 |
| 開発環境 | macOS 14.6.1／Xcode 16.2／iOS 18.2 SDK。試作の実機確認はできたが、現行のストア提出条件を満たさない |

現199記事には276表、表示数式33・行内数式234があり、本文の移行は`Text`への単純な置換では完了しない。ストア・更新・音声の基盤を再利用し、本文表示とそれに結び付くナビゲーション・保存形式・回帰検査を移行する。

## TODOと完了条件

P0は方針決定・公開条件、P1は完成版に向けた実装と品質、P2は配布準備。番号は作業を参照するためのIDで、順番の詳細は後述の依存関係に従う。

### P0: 初版の条件と公開を阻む項目

| 状態 | ID | TODO | 完了条件 |
| --- | --- | --- | --- |
| [ ] | IOS-01 | 初版の範囲を採択する | 本文までSwiftUI化する目標を前提に、自分用／一般公開、最低OS、iPhoneのみ／iPadも対象、無料／有料、音声の継続再生・キューを決める。基準案は全published記事・記事オフライン・アカウントなし・既存音声のストリーミング |
| [x] | IOS-02 | 提出できる開発・ビルド環境を用意する | 公開時点のSDK条件に合うXcodeとmacOSでArchiveを作れる。今のMacの更新、別Mac、対応するCIのいずれを使うか決め、SDK・Simulator・実機symbol cacheを含む空き容量を確保する |
| [ ] | IOS-03 | 配布用アカウントと識別子を整える | App Store案ではDeveloper Programの加入、配布Team、正式Bundle ID、署名管理、App Store Connectの権限を整える。契約・支払いは採択後に本人が行う |
| [ ] | IOS-04 | 記事・音声・素材の配布条件を確定する | CC BY・MIT・KaTeX等の出典とNOTICEを同梱。音声・台本・合成音声の利用条件を採用音声ごとに確認し、ストリーミング／同梱／保存の可否を記録する |
| [ ] | IOS-05 | 初版の更新方式と信頼境界を決める | 記事をアプリ更新で同梱する方式／記事データを独立更新する方式を選ぶ。後者や手動importを公開する場合、配信元・形式互換性・真正性・容量管理の条件をIOS-19〜22へ渡す |

現在の提出最低条件は**Xcode 26以上・iOS 26 SDK以上**。例としてXcode 26の対応環境はmacOS 15.6〜26.xであり、採用するXcodeの対応範囲を確認する。2027年4月以降はiOS 27 SDK以上への引き上げ予定があるため、公開予定日に再確認する。ビルドSDKと利用者の最低OSは別に決める。[提出要件](https://developer.apple.com/news/upcoming-requirements/)、[互換表](https://developer.apple.com/xcode/system-requirements/)、[2027年の変更告知](https://developer.apple.com/news/?id=k1mtkt1k)

IOS-02の準備として[SDK26のHosted Archive preflight](../../records/2026-10-25/ios-sdk26-archive-preflight.md)を追加する。公開repoの標準macos-26・公式Xcode26.6をruntime照合し、配布資格情報・Provisioningを使わずgeneric iPhoneOS Release Archiveと実同梱物を監査する候補である。初回Hostedで実環境・Archive・actual Contentまで確認し、空の資格情報キーの省略とArchive InfoのJSON互換性を分けた限定修正後に、後段の実監査を再検証する。ローカルOSの更新・署名済み配布・Store提出環境の採択とは分け、最低対応OS17と既存Simulator回帰を保つ。IOS-02全体は未完了を維持する。

SDK27の[互換性preflight](../../records/2026-10-26/ios-sdk27-compatibility-preflight.md)は、CDCの0.2.18（20）でもArchiveと代表UI2件が成功した。補正をiOS27以降だけに限定する0.2.19（21）の候補を準備し、下位OSの明示shapeを外す。[iOS26.5](../../records/2026-10-26/ios-runtime26-smoke.md)は実2target・arm64だけをbuildし539秒で終えたが、Contents待機1件が失敗して未受入である。失敗原因や新候補の効果を確定せず、本文位置・40/12/6分・boot240秒と判定を保持する。SDK26で達成したIOS-02、TODO12／32とIOS-11/23・実機・VoiceOver・性能全体の未完了を保持する。

Developer Programは年額99 USDまたは提供地域の現地通貨。日本円の契約額は未確認であり、予算決定時に確認する。自分用のPersonal Teamと一般配布用の登録を区別する。[Programの内容・費用](https://developer.apple.com/programs/whats-included/)

### P1: まず代表3記事でネイティブ本文を成立させる

2026-10-24の実装進捗: IOS-06の代表3記事の構造化変換を完了した。IOS-07〜09の描画、IOS-10〜11の目次・記事内外リンク・旧読書記録との接続を実装し、共通検査・Foundation検査・SDKビルドとiPhoneへの導入・起動を確認した。0.2.0（2）のユーザー操作で、本文・図・数式・目次・しおり・終了再起動後の基本復帰が正常と確認できた。Simulatorの画面試験は起動待ちのタイムアウトで未実行。当時の詳細受入は、後続の0.2.1で進めた。現行の完了状況は次の進捗と表を参照する。

2026-10-25の[詳細確認](../../records/2026-10-24/ios-native-detailed-validation.md)では、修正版0.2.1（3）の指定A〜Dの実施した手順を、ユーザー報告で正常と確認した。オフライン、指定した表・コピー・リンク・図数式、音声・通信復帰・イヤホン切断に加え、最大文字・縦横・明暗・変更後の再起動復帰・VoiceOverの見出し・表・図・数式・操作も確認済みである。Core・音声XCTest16件も実機で成功した。図・数式の方式・表示・読み上げが揃ったIOS-09を完了とする。実着信は未確認であり、IOS-07・08は未収録要素のfixture、IOS-10はfragment・検索ヒットの本文位置、IOS-11は改訂後の位置照合等、IOS-12は不足fixtureの補完が残るため未完了を維持する。[手動チェック表](../../records/2026-10-24/ios-native-manual-checklist.md)で実施範囲を区別する。

| 状態 | ID | TODO | 完了条件 |
| --- | --- | --- | --- |
| [x] | IOS-06 | Markdownを構造化データへ変換する | 段落・見出し・リスト・引用・コード・表・図・数式・行内要素を型付きJSON等にする。安定したblock／heading ID、schema、元記事SHA、許可資産参照を持つ。リンクは記事ID・見出しID／外部URLに型付けし、未対応要素を生成時に検出する |
| [x] | IOS-07 | SwiftUIの基本本文を実装する | 段落、見出し、強調、行内コード・リンク、階層リスト、引用をネイティブ表示する。日本語の折り返し、語句選択、読み上げ、明暗・文字サイズが正常 |
| [x] | IOS-08 | コードと表をネイティブ表示する | コードの字下げ・横スクロール・コピーを保つ。iPhoneでも表の全列・見出し・長いセルを読め、セル内のリンク・強調・数式、横スクロールと読み上げを保持する |
| [x] | IOS-09 | 図・数式の表示方式を決めて実装する | ネイティブ描画／ビルド時の画像・ベクター等の方式を比較する。行内・表示数式の読みやすさ、図の文字・拡大・明暗、意味のある読み上げ代替を確認する。端末でHTMLやJSを描画しない |
| [x] | IOS-10 | 目次・リンク・検索ヒットの移動を移行する | 見出し・block IDからnativeスクロール位置へ移動できる。記事間リンク、fragment、検索ヒットの原文位置を扱い、外部HTTPSは明示操作で開く |
| [ ] | IOS-11 | ネイティブ本文の読書位置へ移行する | 保存形式を記事revision・block ID・必要なblock内位置等で定義する。旧heading＋fractionから近い見出し等へ安全に移し、しおりを保つ。文字サイズ・回転・記事改訂後も復帰できる |
| [x] | IOS-12 | 代表3記事を実機で合格にする | Agentループ・ツール使用・Transformerで、本文・表・コード・図・数式、オフライン、目次・コピー・リンク、旧記録移行・再起動復帰、音声併用を確認する。足りない要素は小さいfixtureで補う |

本文の長文表示はLazy構成等を検討し、表示前のblockへの遠距離移動も検証する。配列indexだけをblock IDにせず、旧WebViewのスクロール割合を新レイアウトの割合へそのまま流用しない。表示ライブラリを採用する場合は、内部・依存も含め本文表示にWebViewを使っていないことを確認する。

2026-10-25に[専用テスト記事](../../records/2026-10-25/ios-native-fixtures.md)の受入を完了した。0.2.2（4）で数式を含むリンク・重複見出し・記事内外のfragment、入れ子・引用・表内要素・コピー、最大文字・VoiceOver、通常記録との保存の分離が正常とユーザーから確認を得た。実機XCTest30件も成功し、Releaseからのテスト記事除外を確認した。

0.2.0（2）の旧記録維持・基本復帰、0.2.1（3）の代表3記事のオフライン・音声・表示・読み上げ、0.2.2（4）の不足fixtureを合わせ、独立した記録照合を経てIOS-07・08・12を完了とした。すべてを同じ版で再試験したという意味ではない。IOS-10の検索ヒットの本文位置、IOS-11の記事改訂後の照合とblock内の位置精度、実着信・追加のUI操作網羅、全記事展開・一般公開は残件として保持する。

0.2.4（6）の[IOS-10実装](../../records/2026-10-25/ios-search-hit-navigation.md)では、検索queryを一時routeへ渡し、本文内の一致ブロック・入れ子のleafへ移動する接続を追加した。CoreSmokeとSDK compile・独立レビューまで確認した。表・コードはブロック境界までで、新しい実機スクロール・VoiceOver受入はユーザー指定により未実施。実装の進捗を記録し、未確認の受入を理由なく成功へ変えないためIOS-10の完了欄は維持する。

0.2.5（7）の[IOS-11実装](../../records/2026-10-25/ios-reading-revision-restore.md)では、旧保存を維持する任意anchorを追加し、本文digestと意味内容fingerprintで改訂前後を照合する。一意な本文、見出し内の一意な本文、見出し、割合へ順にfallbackし、読取時は保存を書き換えない。CoreSmoke通常・fixture、50件のXCTestを含むSDK compile、Release監査と独立レビューを確認した。続くHosted実行でも50件・失敗0とRelease監査が成功した。実機受入とblock内の精度は未完了としてIOS-11を維持する。

0.2.16（18）の[IOS-11 block内部位置の実装候補](../../records/2026-10-26/ios-intrablock-reading-progress.md)では、旧保存を維持した任意anchorに有限な相対位置を加え、実top/end markerで得た高さから復帰する。意味内容で同じblockと確認できた場合だけ内部位置を再利用し、見出し・割合fallbackでは破棄する。自動復帰失敗時の旧位置保持、未達の明示目的地のlayout再起動持越し、最新panとVoiceOver focusの整合をproduction stateの回帰候補に含めた。承認済みv3 codeの旧SDK4段階（App16module・Core/Inline型検査・既存2CLI compile）は成功した。新snapshot/pickerを合わせたPublishedは未compileで、unit152・機能16＋pure geometry6＝22 selectedはsource数である。実main270へbindし、exact-head CI・実登録/XCTest/UI、最大文字・回転・改訂後の実位置・VoiceOver・実機を未確認としてIOS-11は未完了を保つ。 実main270 `955c066c8dc0fdbedf6f0c845a461abda39ac476`（tree `9d2525e28ce3d9b6659eeac57b0b6f910e7e262b`）へbindした私有候補である。親PR270 head85d9のunit133（131成功＋2skip）・full21・Releaseと全15check成功は親の履歴で、新P1 unit152／UI22の実登録・実行は未確認とする。独立review後にrootがDraftへ反映してCIを実行し、必要exact-head CI成功までmainへ統合しない。 Published CIのjob上限だけ40分から50分へ調整し、selector・個別15秒・assert・commandは維持する。これはCI実行上限で製品性能budgetではない。

IOS-25・26の[CI実装](../../records/2026-10-25/ios-native-ci.md)は[PR #243](https://github.com/pero3dev/ai-agent-library/pull/243)へ分けた。生成・監査と全AILibraryTests、Releaseのfixture除外を追加チェックで確認する。hostedの実行結果が揃うまでは実行成功へ変えず、UI試験と実機受入も別に残す。既存11必須チェックと保護設定は変更しない。

続く[UI実行の追加](../../records/2026-10-25/ios-native-ui-ci.md)では既存2件をunit後のstrictなstepへ接続する。実際のHosted結果が得られるまでは未実施とし、2件が扱う本文・目次・しおり・再起動復帰を、オフライン・コピー・内部リンク等のUI全体受入と区別する。

### P1: 全記事と既存音声へ展開する

| 状態 | ID | TODO | 完了条件 |
| --- | --- | --- | --- |
| [x] | IOS-13 | 全published記事をネイティブ形式へ生成する | 作業時点の公開全記事（計画時199本）とmanifestが一致し、欠落・重複・未対応要素なし。全数の図・数式も生成でき、記事追加へ追随する |
| [x] | IOS-14 | 章・タグ・学習ルート・用語集を接続する | 章の掲載順、難易度、関連記事・前提知識、既存学習ルート、用語集から本文へ到達できる。WebとiOSで正本を共有し、オフラインでも辿れる |
| [ ] | IOS-15 | 全記事の性能と容量を測定する | 初回起動・検索・長文スクロール・ハッシュ検査・画像解像度・メモリ・全生成物容量を計測し、受入目標を決めて満たす。必要に応じ正規化キャッシュ・索引化を行う |
| [ ] | IOS-16 | 音声1本固定をカタログ対応へ拡張する | 採用する音声（現カタログ9本）のURL・版・SHA・章・クレジットを検証でき、切替と位置保存が正常。記事SHA不一致は内容確認と旧版表示／再制作方針で扱う |
| [ ] | IOS-17 | 初版に必要な継続再生・キューを整える | IOS-01で採用した場合、プレイヤーをアプリ全体で保持し、本文へ戻っても聴ける。連続再生・次／前・ロック画面・音声差し替え時の保存位置を確認する |
| [ ] | IOS-18 | 読み込み・描画失敗の復旧を整える | 未対応形式、壊れた資産、削除された記事、初期化失敗に再試行・一覧へ戻る操作を提供する。空白のままにならず、最後の正常なコンテンツを利用できる |

全記事の音声を新規制作することは、既存音声をアプリへ接続する作業と分ける。サイトの[音声計画](audio-learning.md)ではストリーミング、再生キュー・連続再生、同一端末の位置保存を採択済みであり、iOS初版への継承範囲をIOS-01で決める。音声ダウンロードは初版の基準案に含めず、権利と容量管理の条件を確認して追加判断する。

IOS-13・15の準備として、全published記事の明示的な一時生成を追加した。199記事・図74種・数式137種を実生成し、全本文とSHA・PNGをappのvalidatorで受け入れた。通常3記事・fixture4記事を維持し、全記事のUI受入・既定カタログへの切替・起動や検索等の性能目標は未完了のため、両TODOのチェックは残す。[全記事の生成記録](../../records/2026-10-25/ios-all-article-package.md)でローカル実行・CI・実機を区別する。

IOS-14のうち[章・難易度の絞り込み](../../records/2026-10-25/ios-category-level-filter.md)を既存metadataで実装した。検索・しおりとのANDと解除を追加し、通常3記事と専用画面を維持する。タグ・章の掲載順・学習ルート・用語集と新たな実機受入は残し、IOS-14全体は未完了とする。

IOS-14の次の単位として、[学習案内の構造化生成](../../records/2026-10-25/ios-learning-index-generation.md)を追加した。全記事の明示同梱候補にだけ、章README順・タグ・A〜Hルート・用語集を任意JSONとして載せる。manifest 2・document 1と旧3/4記事を維持した生成・旧reader非UI互換を確認し、新Swift consumer・学習UI・操作受入とIOS-14全体は後続へ残す。

学習案内の[Swift consumerとXcode登録](../../records/2026-10-25/ios-learning-index-consumer.md)では、不在互換・型/参照/上限・SHA/安全なパスを検査するAPIと回帰を用意した。Mac直接XCTestとSDK compileを確認し、最終Hosted・Store/学習UI・実機とIOS-14全体は未完了として残す。

0.2.9（11）の[ネイティブ学習UI接続](../../records/2026-10-25/ios-native-learning-ui.md)では、章順・タグ・A〜Hルート・用語集と本文を結んだ。本文と学習情報を一括適用し、import取消し後の保存先と表示の整合も修正した。Mac回帰12件とhelper4件・SDK compileを確認し、最終Hosted単体101件/全UI8件、VoiceOver・実機・性能とIOS-14全体の受入は残す。

IOS-18のうち[初期失敗と利用できない記事の復旧](../../records/2026-10-25/ios-load-recovery.md)を追加した。保存を維持した再試行とimport復帰を実Storeの非UI検査で確認し、画面の操作と読み上げ・全体受入は未完了として残す。

[同梱記事の欠損と正常版への更新のUI回帰](../../records/2026-10-26/ios-missing-package-ui.md)は、旧失敗とPR282最終F/R・本文後sentinelのcontrolled受入を分けて保持する。実装main76への通常保護squash後、新push Common・Native・Fullの成功を別に確認した。main76に専用F/R・SDK26・Runtime26の新pushはなく、PR結果を代入しない。固定sentinelを実bookmark・読書位置の更新越し保持とは扱わず、同process内修復・offline・import・実機・VoiceOverとIOS-18／25全体は未完了である。

IOS-14の[本文から章案内への接続](../../records/2026-10-25/ios-native-chapter-link.md)では、既知章URLを有効な索引のある場合だけnativeへ振り分ける。全199本文の前提405・関連1411リンクの保持を確認し、説明文を落とす重複schema追加は避けた。Mac6件・累積SDK compileと、未完了の全UI10件・実機・VoiceOverを分け、Python例10参照の通信境界とIOS-14全体を残す。

IOS-15の準備では[負荷の棚卸しと空検索の改善](../../records/2026-10-25/ios-empty-search-performance.md)を行った。全199記事で結果・順序を保ち、空queryの全文正規化を省いた。CLIの比較測定と、未完了の起動・検索入力・描画・メモリ・実機性能を分けて記録する。

IOS-15の[全文検索索引](../../records/2026-10-25/ios-normalized-search-index.md)では、snapshotと一緒に正規化結果を保持して入力ごとの全記事変換を省く。実199記事・15queryの結果と順序を維持し、読込・取り込み・同梱選択の切替回帰とSDK compileを確認した。Mac CLIの参考値を入力遅延やappメモリと混同せず、Hosted・実機と性能受入目標は別に残す。

M4の次段階では[全記事の通常同梱候補](../../records/2026-10-25/ios-published-library-profile.md)を明示modeとして追加し、独立した原文監査で全数・図説明・リンク等を照合した。既定3記事・fixture4記事を維持し、実候補アプリのUI・Release、既存取り込み版からの切替、実Mermaid再描画の再現差を別の受入単位へ残す。

続いて[全記事候補のHosted UI](../../records/2026-10-25/ios-published-candidate-ui.md)を別workflowに分けた。正本の動的件数とDebug/Release実bundleを照合し、既存2件＋大図・長文・最大表の新3件を準備した。対象は01・03・08・11章の6記事に限る。初回Hostedで単体57件・Debug全数監査に成功したがUI3件が失敗し、目次到着の遮蔽とテスト操作を修正した0.2.8（10）を用意した。修正版のSDK compileと未確認のHosted再試験・全体受入を分ける。

0.2.13（15）では[開発時の標準生成](../../records/2026-10-25/ios-published-development-default.md)を全publishedへ接続する。標準npmの生成→原文監査→実consumer監査を私有コピーで実行し、199記事・学習索引・626ファイル・422PNGと全SHA・クレジットを確認した。直接CLIのno flagと代表版alias、3記事・fixture4記事の回帰を維持し、全記事CIは標準npm入口と独立した原文件数を使う。正常な取り込み済み版はアプリ更新後も優先され、利用者が同梱版への切替を確認するまで保存版と読書記録を保つ。開発入口の変更と一般公開・費用・配布用登録・音声権利・独立ネット配信の採択は分ける。全記事の実機・VoiceOver・性能受入、公開用SDK26環境と旧版容量管理を残し、IOS-13・14全体のチェックは完了にしない。

0.2.14（16）では[全記事一覧が使えるまでの観測](../../records/2026-10-25/ios-published-readiness-observation.md)を専用Hosted jobへ分ける。Debug起動要求から独立した全記事数・学習ガイドの表示確認までを測り、warm-up1回と記録3回、生xcresult/CSV/型付きmetricを保持する。初回は契約未採択で非ゼロ終了を保ち、生JSON/CSV/log/添付の独立照合後に実Clock識別子・秒単位・3値と厳密CSV guardを追加した。保存済raw再生と新headのHostedを区別し、欠測をゼロへ置き換えない。機能UI10件を別に維持し、操作自動化・AX同期を含む参考観測と、初回インストール・Release・実機・CPU/メモリ・スクロール・性能予算を分ける。IOS-15の完了欄は維持する。

IOS-15の[全記事Core host観測](../../records/2026-10-26/ios-published-core-benchmark.md)はb79基線で実施した凍結CLIのraw19process/記録15は旧観測として保持し、最新source4のsnapshotや未実施の再CLIと分ける。通常CIはNode fixtureだけで、SDK・corpus観測は明示した手動CLIと別guardのまま。App/PBX/workflow/P1/Iconと全TODOを保持し、IOS-15と予算採択は未完了である。

2026-10-27の[現行CoreのHosted観測](../../records/2026-10-27/ios-core-hosted-observation.md)は、b39／Workflow9bの凍結19process・15標本とCore実装main f5eを扱う。上の段落は旧準備時点の履歴として保持する。後続main76の新push Common・Native・Fullは成功し、Nativeの追加12単体と通常UI、Fullの一意22caseを確認した。旧性能値をSource4が変わったApp0.2.20（22）へ転用せず、App・実機・最低iOS17・VoiceOver・p95・性能予算とIOS-15全体は未完了とする。TODO32行・完了12行を保持する。

### P1: 更新と保存データを運用できる状態にする

| 状態 | ID | TODO | 完了条件 |
| --- | --- | --- | --- |
| [x] | IOS-19 | ネイティブ記事パッケージを定義する | 実行コードを含まない構造化本文・許可資産・manifestとし、schema／native renderer／appの互換性を定義する。HTML／JSを含む旧形式の扱いを明示する |
| [ ] | IOS-20 | 記事データの独立更新を実装する | IOS-05で採用する場合の工程。更新確認・サイズ案内・取消・再試行、発行元の確認、互換性を扱う。通信断・不正データ・不適合版でも最後の正常版を読める |
| [ ] | IOS-21 | 旧版と残骸の容量管理を実装する | 独立更新やimportを採用する場合の工程。現行版・表示中の版を守り、旧版・孤立stagingを上限付きで整理する。低容量・処理中終了・繰り返し更新を試す |
| [ ] | IOS-22 | 保存・旧パッケージの移行と復旧を整える | 記事改名・削除・見出し変更・schema更新で学習記録を引き継ぐ。旧HTMLパッケージからnative形式へ移り、不適合版を誤って表示しない。破損時にしおりを黙って全消去せず、復旧・案内を行う |

SHA照合・staging検証・原子的切替・失敗時の旧版維持は既存実装を拡張する。記事をアプリ更新だけで同梱する初版では、独立配信・更新UI・複数旧版の管理を必須にしない。配信を採る場合は既存GitHub等の条件・帯域・運用費を測り、新しいサーバーが必須とは決めない。

2026-10-25の[形式契約の確認](../../records/2026-10-25/ios-native-package-contract.md)でIOS-19を完了した。manifest 2・document 1・renderer v1とappの対応、未対応形式の拒否・保存済みfuture版のfallbackを定義・検査し、旧HTML CLIを比較用一時出力へ限定した。生成側の音声時間・manifest込み件数／容量・PNG byte上限もconsumerへ揃え、通常とfixtureの実生成revisionを維持した。続くHosted実行で追加2件を含むXCTest52件とRelease監査も成功した。独立配信の採択・真正性・容量管理やIOS-22全体の完了を示さない。

IOS-04・16の[音声identity契約候補](../../records/2026-10-26/ios-audio-offline-identity.md)は、通常Agentループ1音声のまま宣言tupleと実原文のSHAを束縛し、catalogや選定データによる許可policyの注入を拒否します。実main142の関連Node54件とmetadata1773Bの旧converter一致を、全package・実音声bytes・app playerの受入と分けます。追加8音声・権利・配信/保存方式、最終統合headのCIと実機は残し、IOS-04・16全体のcheckboxは完了にしません。

IOS-22の準備として[同梱版の明示選択](../../records/2026-10-25/ios-bundled-content-activation.md)を追加する。正常な保存版の優先を維持し、利用者の確認後にだけ同梱版へ切り替える。実3→199→再起動→3で記録bytesと本文fingerprintの復帰を確認し、画面・Hosted・実機、記事改名・削除・容量整理とIOS-22全体は分けて追跡する。

IOS-22の[読書記録の破損保全と明示復旧](../../records/2026-10-27/ios-reading-state-recovery.md)はPR282最終eabの6runとReady最新policy成功後、main76へ通常保護squashで統合した。main76の新push Common・Native・Fullも別観測で成功し、Native追加12単体と通常UI、Fullの一意22caseを確認した。旧Core性能は歴史scopeに保ち、実ユーザーの復旧固有UI・実機・VoiceOver・耐電断等とIOS-22全体は未完了、TODO32行・完了12行を維持する。後続PR283の新Recovery UIはこのmain76 checkpointの受入に含めない。

[読書記録復旧のUI回帰](../../records/2026-10-27/ios-reading-recovery-ui.md)では、DEBUG隔離suiteの取消し・確認と再起動後のしおり保持を確認しています。採用89のNative4件と、通常保護で統合したmainc1の新push（Common10 jobs・Native4件・Full22件）を2026-10-28 checkpointで分けて記録しました。Dedicated89のF成功・R失敗は別Driver作業として保持し、新Driverの効果、読書位置・backup生bytes・実機・VoiceOver・Core性能とIOS-22全体は未受入です。

[更新復旧試験の実行元](../../records/2026-10-28/ios-destination-artifacts-ui.md)では、head56・3aの失敗を保持し、C2のDedicatedでF/R各1ケース、7回のApp一覧・phase source相関・最終52B sentinelとcleanupを限定受入として記録しました。通常6系統とmain142採用、反映後のCommon10job・Native UI4件・Full UI22件も別々に確認しました。Rの新しい診断・実launch root、内部cacheの保証と全userdataは未確認で、実機・VoiceOverやIOS-18・22・25全体は未完了です。

IOS-21の準備として[旧版保持の回帰3件](../../records/2026-10-25/ios-storage-retention-regression.md)を追加する。実repositoryの3世代snapshot・後読asset、孤立版の非選択/非削除、destination検証後のpointer ENOSPC模擬で既存bytes保持を確認する。Macの新3件成功とiOS全122件のcompileを分け、iOS実行はHosted待ち。削除数・自動整理・snapshot pinや処理排他を採択するものではなく、IOS-21全体は未完了を維持する。

Appleの2.5.2は、アプリの機能を導入・変更するコードのダウンロード等を制限する。完成版では構造化記事データとアプリ側の描画機能を分ける。配信署名等は真正性を確認する設計として検討するもので、署名だけでコード更新の制限が免除されるわけではない。現在の手動importを直ちに違反と断定せず、公開する挙動と更新範囲を審査へ説明する。[ソフトウェア要件](https://developer.apple.com/app-store/review/guidelines/#software-requirements)

### P1: 品質・プライバシー・継続運用

| 状態 | ID | TODO | 完了条件 |
| --- | --- | --- | --- |
| [ ] | IOS-23 | ネイティブ本文で実機受入を完了する | VoiceOver、最大文字、横画面、長い表・コード・数式、小型端末、最低対応OSと現行OSで確認する。音声の着信・イヤホン切断・通信断と再試行、採用する更新方式の失敗も記録する |
| [x] | IOS-24 | iOSの旧WebKit本文経路を除去する | 完成版ターゲットからReaderWebView、HTML／JS bridge、blockerを除く。依存ライブラリも本文にWebViewを使わず、オフライン記事・図・数式をnative経路で表示する。Webサイト側の機能は維持する |
| [ ] | IOS-25 | ネイティブ本文の回帰検査へ移行する | 初回オフライン、本文・コピー・内部リンク・目次・しおり・終了再起動・旧記録移行・位置復帰をNative UIで検査する。旧WebKit試験を削除するだけで終えない |
| [x] | IOS-26 | iOS用CIを追加する | 新規checkoutから構造化データ・資産生成、iOS SDKビルド、XCTest・UI検査を再現できる。現行のWeb用macOS jobと区別し、署名情報はCIの秘密情報として扱う |
| [ ] | IOS-27 | プライバシー申告を完成させる | アプリ・音声配信・依存SDKの通信とデータ利用を棚卸しし、Privacy Manifest、App Privacy回答、公開ポリシーを一致させる。アプリ内とストア情報からポリシーへ到達できる |
| [ ] | IOS-28 | 更新・障害対応の運用を決める | コンテンツ版・アプリ版の対応、公開手順、障害時の配信停止／旧版復帰、問い合わせ先、依存・SDKの更新担当を決める。個人情報を含まない診断手段を用意する |

IOS-24は[現targetの独立した照合](../../records/2026-10-25/ios-native-runtime-audit.md)で既に条件を満たすことを確認し、完了とした。appのSources・resources・本文の入口に旧WebKit・HTML/JS bridge・blockerはなく、許可資産もJSON・PNG・TXTだけである。native生成でも再利用するparser・SHA等と比較用旧HTMLツールは開発側へ残す。UI全体の回帰や新たな実機受入とは区別する。

IOS-26は[PR #246のHosted実行](https://github.com/pero3dev/ai-agent-library/actions/runs/40137064755)、head `d4d982ce…`で新規checkoutからの生成・監査、iOS SDK、単体52件・UI2件、Release同梱監査が成功し、完了とした。署名不要のSimulator回帰基盤としての完了であり、App Store提出環境・配布署名・実機の完了を示さない。UI2件は本文・目次・しおり・再起動復帰の基本範囲で、IOS-25の残る操作網羅は維持する。

IOS-25の[絞り込み中の追加UI回帰2件](../../records/2026-10-25/ios-filtered-actions-ui.md)では、About開閉のfilter保持と、専用記事の別しおり・音声不可・2段階戻り・通常保存の永続分離を公開UIだけで検査する。通常reader再開前のrestartを入れてcached Storeだけのfalse-passを防ぐ。既存10機能ケースを保持して12件へ増やし、SDK compileを確認した。初回Hosted・fileImporterキャンセル・VO/実機とIOS-25全体の受入は未完了を維持する。

[フォルダー選択取消の追随preview](../../records/2026-10-26/ios-picker-cancel-ui.md)では、旧238eのfull run40226683804/job121269430760でunit133件（131成功・2skip）と機能UI14/15成功を確認した履歴を保持する。本文検索Aとpicker取消138.720秒は成功し、Bは最初の到着で失敗してTOC/save/restartへ未到達だった。新snapshot helperを保持したPub41c3＋Nativebcafは機能15件＋geometry6件のsource計21件となるが、新snapshot/full/native/runtime26・生成budget・site待機・Releaseは正確な新headで未実施である。実main269 `750a305a82c6ff7882de46fdf7889c81925c509e`（tree `7636f378ecd8e8202cd2d9c8c9e89e2aa85b875d`）へ固有6pathをbindした私有候補で、独立最終レビューと正確な新headのCIを待つ。公開PR270 head238eは未変更である。

IOS-10・25の[本文検索ヒットと復帰の追加2件](../../records/2026-10-26/ios-search-hit-ui-regression.md)では、入れ子leafへの即到着と、本文Aの検索後に保存したBへ再起動復帰する公開動作を確認する。旧head a88では単体127成功・2skip、機能UI14件とReleaseが成功したが、別headの到着判定失敗も保持している。一時診断で観測したgeometryの重複取得を減らす修正は、完全表示・先頭ID一致・15秒を維持する。picker追加前のsnapshot基線の機能14件＋純粋geometry6件・全target build・Releaseは正確な新headのHosted待ちである。過去の失敗原因・安定性、VoiceOver/最大文字/実機とIOS-10・25全体は未完了を維持する。

現在のPrivacy ManifestにはUserDefaultsの利用理由がある。最終版では対象API・依存SDKを再監査し、Archiveへの同梱も確認する。プライバシーポリシーとApp Privacyは、無料・アカウントなしでも必要な申請項目として扱う。[プライバシー規約](https://developer.apple.com/app-store/review/guidelines/#privacy)、[App Privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/)、[required reason API](https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api)

[時計由来APIのPrivacy候補](../../records/2026-10-26/ios-privacy-clock-reason-candidate.md)は、main142のApp16 Swift・時計7箇所と新しいApple公式DocC JSONの照合を記録しました。現mainのUserDefaultsのみ591Bと、SystemBootTime/35F9.1辞書211Bを追加する私有802B候補を区別します。wrapperへの適用は保守的な推論で、FileTimestamp理由は追加しません。Copy・Audio後の実mainへの結合・独立レビュー・新headのCI/Archive一致、配信先ログ・公開policy・問い合わせ先・Store回答を残し、IOS-27は未完了です。

### P2: ベータ配布とApp Store公開

| 状態 | ID | TODO | 完了条件 |
| --- | --- | --- | --- |
| [ ] | IOS-29 | 製品用の見た目と案内を整える | アイコン、アプリ名、起動体験、設定・ライセンス・サポート導線、配布向けバージョンを用意し、試作専用表示を整理する |
| [ ] | IOS-30 | TestFlightで候補版を配る | 推奨工程。配布用Archiveから内部テスト、必要に応じ外部テストを行い、上書き更新・保存データ維持・新規インストールを実機確認する |
| [ ] | IOS-31 | ストア情報と申告を用意する | 説明・スクリーンショット・キーワード・サポートURL・著作権・年齢レーティング・価格・配布地域を決め、暗号化の質問を実装に照合する。DSAのtrader／非traderを申告し、EUでtraderとして配布する場合は連絡先の検証・公開条件を満たす |
| [ ] | IOS-32 | 申請・審査対応・公開後の確認を行う | ネイティブな学習体験と更新方式を審査へ説明する。提出ビルドの完成度・リンク・配信を確認し、承認後に一般配布版の導入と不具合受付を確認する |

IOS-29の[AppIcon候補](../../records/2026-10-26/ios-app-icon-native-assets.md)は明示source commit `30a8a1db8d6c30eeb2c6e682f92ba94126cc5e35` へ私有準備した既存ブランドの8PNG/9slot・AppIcon監査候補で、0.2.16(18)から0.2.17(19)を提案する。PNG8/22,198B・source/validator/recipeを保ち、Published cap50・3selectorsへ承認監査呼出だけを加える。旧source check/Node13とactool失敗は履歴で、新compile・実CAR・Home/Store・exact-head CIと別人の最終payloadレビューは未実施。IOS-29全体は未完了で全TODO状態を維持する。

TestFlightは推奨するベータ工程で、App Store公開の一律必須条件ではない。使用する場合はProgram、ビルド90日の期限、外部テストの審査を計画へ含める。[TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)

WKWebView採用だけで審査可否は決まらない。完成度と単純なWeb再包装に関する2.1・4.2等を最終の体験へ照合する。機能数だけで通過を保証しない。[審査ガイドライン](https://developer.apple.com/app-store/review/guidelines/)

申請直前に最新の質問票と提出条件を再確認する。[年齢レーティング](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating/)、[ストア情報](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information)、[暗号化](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance)、[EUのDSA申告](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements)

## 着手順と初版の完了条件

1. **IOS-01〜05**: 初版の範囲、開発環境、配布・権利・更新方針を固める。構造化データと本文の試作はこの間に並行できるが、契約・OS更新は採択後に進める。
2. **IOS-06〜12**: 代表3記事でネイティブ本文と旧記録移行を成立させる。
3. **IOS-13〜22**: 全記事・採用音声・学習導線へ展開し、採用する更新方式と保存運用を整える。
4. **IOS-23〜28**: 品質・旧依存除去・回帰自動化・CI・プライバシー・運用を整える。回帰検査とCIは実装と並行して追加する。
5. **IOS-29〜32**: 配布候補版を作り、ベータ確認と申請を進める。

最初の実装単位は、**代表3記事の構造化JSON＋SwiftUI本文（IOS-06〜09）**とする。文章・コード・表・図・数式を先に比較し、続いて目次・コピー・リンク・位置復帰と旧記録移行（IOS-10〜12）を固める。ネイティブ3記事の受入後に全記事へ広げる。公開用環境と権利確認は並行する。

一般公開案の完了は、本文が実行時WebViewへ依存せず、採択した全コンテンツ・更新・保存・音声・アクセシビリティの受入と、配布ビルド・申告・一般配布後の導入確認が揃った時点とする。自分用を採択した場合は、該当する機能と実機受入を完了条件にする。自動検査・実機操作・申請・審査通過を区別して記録する。工期はIOS-01とネイティブ3記事の方式比較・全記事容量の計測後に見積もる。

## コミットとmainへのマージの計画

2026-10-25時点の分割案。実装・実機受入の完了と、commit・PR・main反映の完了を別に追跡する。現在の0.2.2（4）は代表3記事と専用fixtureの受入まで完了しているが、iOS一式は未コミットである。**次の機能追加に入る前に、M0で現在の成果を基準化する**。

後続の自律実施では[M0 PR #241](https://github.com/pero3dev/ai-agent-library/pull/241)へ責務別4コミットを保存した。main反映は[前提の依存修正PR #240](https://github.com/pero3dev/ai-agent-library/pull/240)のbase監査による阻害待ち。保護回避は行わず、固定した基準headから別branchを切り、独立して進められるM2の実装・検証を継続する。

原則は、**1つの機能または不具合の修正を、対応試験・手順・記録と合わせて1 PR**にする。通常は1 PRあたり1〜3個の意図別コミットを目安とし、実装と回帰試験が揃ったところでcommitする。複数日にわたる場合は途中の区切りで保存し、draft PRで差分を共有できる。mainへのマージはその単位の完了条件を満たしてから行い、全iOS機能の完成まで貯め込まない。

### マージの節目と依存

下表のPR数は分割の目安であり、実施・作成済みの数ではない。同じ行の中も独立して確認できる機能は別PRにする。任意機能を採用しない場合は、理由と判断を記録し、その実装を完了扱いにしない。

| 節目 | まとめる作業・対応TODO | 依存と順番 | commit・PR・main反映のタイミング |
| --- | --- | --- | --- |
| M0: 受入済み試作の基準化 | IOS-06〜09・12と、IOS-10・11等の実装済み部分。0.2.2のfixtureを含む現成果 | 最初。機能受入済み、Git反映は未実施 | 1 PR内で後述の責務別commitへ整理。新規checkoutで生成・検査・SDKビルドが再現できた最終headをmainへマージ。未完了TODOの状態は維持 |
| M1: 初版・配布・更新の前提 | IOS-01〜05 | M0後、M2と並行可。採択が必要な方針・費用・契約は実装へ混ぜない | 初版と更新方針、配布環境・アカウント、権利の記録を2〜3 PRに分ける。各判断・準備結果が揃った時点でマージ。アカウント操作そのものや秘密はcommitしない |
| M2: 検索と読書位置 | IOS-10の検索ヒットへの移動、IOS-11の改訂後の復帰 | M0後。schemaを変える部分はM3のIOS-19の契約を先に更新 | 検索位置と改訂後復帰を各1 PR。実装・回帰試験・レビューを揃え、片方ずつmainへ反映。追加指定により新しい実機受入は未完了と記録して先へ進み、実装のmain反映とTODO全体の受入完了を区別する |
| M3: 形式・回帰・CI・旧経路整理 | IOS-19・25・26・24 | M0後。形式の契約→native回帰→CI→旧経路除去を基本順とし、M2と調整 | 各TODOを別PRにする。CIの最小構成は全記事展開前に導入。旧経路はnative回帰の代替が確認できてから除去。専用UI試験が動かない現状を成功扱いにしない |
| M4: 全記事・学習導線・性能 | IOS-13〜15・18 | M1の対象・権利判断、M2、M3の形式・検査基盤 | 生成基盤を1 PR、記事は原則1章ごとの受入PR、章・タグと学習ルート等の導線は別PR、性能・失敗時復旧も各PRへ。各単位を順次マージし、全数照合までIOS-13を完了にしない |
| M5: 既存音声の拡張 | IOS-16・17 | M1の音声範囲・権利、M0。M4と並行可 | カタログ対応を1 PR、採用する継続再生・キューを別PR。版・SHA不一致の扱い、切替・復帰・ロック操作等を確認した単位でマージ |
| M6: 更新・容量・移行 | IOS-20〜22 | M1のIOS-05、M3のIOS-19、M2の保存位置 | 独立更新を採用する場合は、更新→容量管理→移行・復旧を各1 PR。通信断・破損・旧版維持を各PRで確認。アプリ更新のみの場合もIOS-22の必要な移行・復旧は残す |
| M7: 公開向けの申告・運用・表示 | IOS-27〜29 | M1と、採用するM4〜M6の機能・通信仕様 | プライバシー、更新・障害運用、製品向け表示を各1 PR。機能と申告・案内が一致し、必要な再受入を終えた単位でマージ |
| M8: 全体品質とベータ候補 | IOS-23・30、IOS-25・26の最終充足 | M1の開発・配布準備と、採用したM2〜M7 | 品質の是正は不具合ごとのPRで反映し、最後に全体受入をまとめる。TestFlight採用時は配布設定・候補版準備を別PRにし、mainの対象SHAからArchiveを作る。実配布・上書き更新等の結果は記録する |
| M9: ストア情報・申請・公開 | IOS-31・32 | App Store案を採用し、M8と公開条件を満たした後 | ストア情報・申告の準備を1 PR、審査で必要になったコード修正は修正ごとのPR。申請・承認・公開後確認を別々に記録し、mergeしただけで公開完了にしない |

M4の章別PRでは、対象の章と確認した形式を明示し、未確認の章まで成功へ広げない。生成JSON・PNGをcommitせず、原文・選定・生成コード・試験を反映する。全記事への既定切替は全数の生成・容量・整合性確認と合わせる。

IOS-23・25・26は最終段階だけの仕事にせず、各機能PRで必要な試験を追加し、M8で不足を閉じる。M1の判断や外部準備で待ちがある間も、依存しないローカル実装は進められる。

### M0のコミット案

初回はファイルの相互依存が強いため、独立した複数PRへの後付け分割を避け、**1つの基準PR内で4〜5コミット**を目安にする。過去の開発順を再現するための仮実装は作らず、現在の成果を責務で整理する。

| 順序 | 対象と検証 | 件名の例 |
| --- | --- | --- |
| 1 | iOS配置・生成物除外・共通検査の対応と、その回帰試験 | `build(harness): iOS成果物の配置と生成物検査を整える` |
| 2 | 構造化変換・図数式の生成・原文選定・Node試験・生成ツールの固定依存 | `feat(repo): iOS向け構造化記事の生成を追加する` |
| 3 | SwiftUI本文・保存・音声・Xcode構成と対応するXCTest | `feat(repo): iOSのネイティブ読書アプリを追加する` |
| 4 | 専用fixture・保存隔離・リンク回帰と受入結果 | `test(repo): 専用記事で本文形式とリンクを検証する` |
| 5 | 調査・開発手順・ライセンス・完成版TODO・実施記録の同期 | `docs(repo): iOS試作の手順と受入結果をまとめる` |

これは責務の目安であり、同じファイルの依存する変更を無理に切らない。型定義・コマンド・参照先などは先に必要となるcommitへ含め、参照切れやビルド不能を作る場合は隣接commitへ統合する。PRの最終headは新規checkoutで再現できる状態にする。branch候補は`codex/ios-native-baseline`、PRタイトル候補は`feat(repo): iOSネイティブ読書アプリの試作を追加する`。

現在の未コミット差分をパス・変更理由・検証へ対応付け、iOSに必要な共有設定の変更と他作業の変更を分ける。最新mainを起点とする作業ブランチへ所有差分を引き継ぎ、他者の変更をstash・reset・一括stageで取り込まない。`Content/`・`TestContent/`・DerivedData・`.local/`・個人署名・端末識別情報を含めない。mainへ直接commit/pushしない。

### 各PRをmainへ反映する条件

1. **commit前**: 所有パスを明示してstageし、差分・生成物・秘密の混入を確認する。対応試験と`npm run check`を実行し、[Git共通規約](../../../harness/git-rules.md)の件名・理由・検証・影響・名義を[共通検査](../../../scripts/check-git-conventions.mjs)へ通す。既存scopeを使い、今回のために`ios` scopeを新設しない。
2. **PR作成・更新時**: 最新の取得済みmain・remote・既存PRを照合する。`codex/` branchからmain向けのPRを作り、[テンプレート](../../../.github/pull_request_template.md)の変更内容・検証・影響と残件を埋める。アプリ版・build番号・コンテンツ版・確認端末・検証したSHAを記録する。
3. **merge前**: 最終PR headで独立した内容レビューと必要な実機受入を終え、実施時点の共通policyの必須CIを満たす。計画時点は11必須チェック。iOS専用CIが未整備の間も、ローカルの生成・SDK build/test・実機の証拠を記録する。未実行のUI試験等は理由と解消先を明記し、必須チェックや公開前の品質条件を省略しない。変更・main同期・競合解消で結果に影響があれば該当検証とレビューを更新する。
4. **merge実行時**: 最終タイトル・本文・headを再取得し、検査済みのsquash件名と本文を使って、そのheadを指定してPR経由でmainへ反映する。auto-mergeの予約は完了に数えず、保護ルールを回避しない。
5. **merge後**: 実merge SHA・squash内容・main CIと、変更が公開サイトへ影響する場合の公開内容を確認して、その節目を完了にする。main上の新しい基準から次の作業へ進む。問題があれば原因を記録し、必要な修正またはrevertを別PRで検証する。

コミットとPRが複数あっても、mainにはPRごとにsquashで区切りを残す。iPhoneへ確認版を導入する時と配布候補を作る時に一意のbuild番号を付け、merge SHAと対応付ける。mainへのマージ、実機への導入、TestFlight・App Storeの公開はそれぞれ確認する。タグ・リリースの作成は、依頼された場合の別の公開操作として扱う。

この追記だけで将来の外部操作を実行許可とは扱わない。実施を依頼された際は許可された到達点まで進め、既に承認されたcommit・PR・mergeについて、節目ごとに同じ確認を求め直さない。

## 追加判断に分けるもの

- **音声ダウンロード**: 権利確認後、保存・削除・容量・通信・中断再開を設計する。
- **アプリ独自の読書設定**: OS連動とは別に、文字・余白・テーマ等の設定を追加するか決める。
- **iPad、共有リンク、Spotlight、ハイライト、学習進捗、クラウド同期**: 必要な利用場面から採否を決める。
- **アカウント、課金、通知、AIチャット**: 初版の基準案には加えず、それぞれの価値・費用・申告・運用を別に設計する。

## 作成根拠

コードの確認先は[生成処理](../../../scripts/lib/ios-content.mjs)、[記事モデルと検索](../../../ios/AILibrary/Sources/Models.swift)、[更新処理](../../../ios/AILibrary/Sources/ContentRepository.swift)、[保存処理](../../../ios/AILibrary/Sources/ReadingStore.swift)、[音声処理](../../../ios/AILibrary/Sources/AudioPlayer.swift)、[既存CI](../../../.github/workflows/ci.yml)。前提調査は[実現性調査](../../../research/ios-app-feasibility-2026-10-21.md)、権利の未確定事項は[既存棚卸し](../../records/2026-10-03/license-inventory.md)を参照した。Apple要件は2026-10-24に公式資料で確認した。
