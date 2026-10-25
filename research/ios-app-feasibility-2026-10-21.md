# AI Agent LibraryのiOSアプリ化の実現性調査

確認日: 2026-10-21（日本時間）。調査中の時計を`2026-10-21T16:54:07+09:00`に確認した。各ページの秒単位の取得時刻は保存していない。リポジトリの確認対象は`405e29273a7a3257adeb370c6ac3196d35693d4d`。本書は調査と提案であり、実装方式の採択・実機動作・App Store審査通過の記録ではない。[作業記録](../project/records/2026-10-21/ios-app-feasibility.md)に範囲と検証結果を残す。

## 結論

**iPhone向けのネイティブアプリとして提供することは技術的に可能である。** 記事のMarkdownをWebとアプリの共通正本にすれば、記事を二重に執筆する必要はない。現在の公開教材を読む・探す・聴く機能なら、初期段階から認証サーバーやLLM APIを導入する必要もないという判断である。

iOSを優先する場合の有力案は、**SwiftUIで一覧・検索・しおり・保存・音声操作を作り、複雑な記事本文をWKWebViewで表示する構成**である。これはネイティブ画面の中にWebの本文レンダラーを組み込む方式で、本文まで完全にSwiftUIだけで描画する方式とは開発範囲が異なる。後者も可能だが、表・コード・数式・図のレンダラーを整える負担が大きい。

主な難所は記事数ではなく、スマホでの可読性、オフラインと更新の両立、音声のバックグラウンド再生、審査に説明できる学習体験、WebとiOSを継続保守する体制である。方式の判断は公式仕様と静的調査に基づき、工数・動作品質は未実測である。

## 既存資産の調査結果

| 対象 | 現状の観察 | iOSでの再利用と追加作業 |
| --- | --- | --- |
| 記事 | 章索引を除く199記事、Markdown計2,663,623 bytes（約2.66 MB） | 本文・front matter・関連リンクは共有できる。この値には図・フォント・HTML・音声・アプリ本体を含まない |
| 生成経路 | MarkdownをAST化し、リンク・装飾を変換してReact用MDXを生成、Next.js/Nextraで静的HTMLへ出力 | Markdownと変換処理の一部は共有可能。Reactコンポーネントを含むMDXをそのままSwiftUIへ渡すことはできない |
| 図・数式・コード・表 | Mermaid 74ブロックはビルド時に明暗別SVGへ変換。数式はKaTeX、表はGFM、コードはNextraの表示を利用 | 図SVGとWeb表示の仕組みを活用できる。小画面、文字拡大、横スクロール、読み上げはアプリで再確認する |
| メタデータ | `generated/`にpages・sections・tags・glossary等のJSONがあるが、サイトのビルド内import用 | アプリ向けの公開・版管理されたデータ契約と配信工程を追加する必要がある |
| 検索 | 静的HTMLからPagefindの日本語検索索引を生成 | WebView内での再利用かネイティブ検索への置換を選ぶ。独立したアプリ用JSON検索索引は未整備 |
| 学習ルート・依存マップ | ルートはJS配列、依存マップはReact Flow用データ。Markdownとの手動同期箇所がある | 内容は利用可能。iOS専用の別定義を増やす前に共通データ化すると同期漏れを減らせる |
| 学習記録 | 音声キュー・再生位置・速度をlocalStorageへ保存。記事のしおり・既読・読書位置・端末間同期は確認できない | これらは新機能として設計する。Webの保存状態が自動でiOSへ移るわけではない |
| 音声 | 9記事・9回、合計12,080秒（約3時間21分）。GitHub Releasesの版付きMP3を参照 | URL・チャプター・記事ハッシュ・音声SHA-256・クレジットを活用できる。配信・ダウンロード・再生はiOSで確認する |
| CI | Webビルド・ブラウザー・macOS WebKitの音声検査がある | iOSアプリのビルド、Simulator、署名、実機の検査は追加対象。現在のSafari試験をiPhoneアプリの動作証明にはできない |

根拠: [記事変換](../website/scripts/sync-content.mjs)、[記事ページ](../website/app/docs/[[...mdxPath]]/page.jsx)、[図の生成](../website/scripts/render-mermaid-assets.mjs)、[数式設定](../website/next.config.mjs)、[MDX表示](../website/mdx-components.js)、[検索生成](../website/scripts/postbuild.mjs)、[ルート](../website/components/home/data.js)、[依存マップ](../website/components/roadmap/dependency-graph.jsx)、[音声状態](../website/lib/audio-player.mjs)、[音声カタログ](../website/audio/catalog.json)、[CI](../.github/workflows/ci.yml)。数値は入力HEADのファイルからの静的集計で、生成物を再ビルドして測定した値ではない。

音声容量はカタログに記録されていない。[64 kbpsの設定](../automation/audio/config.json)と総時間からは`12,080 × 64,000 ÷ 8 = 96,640,000 bytes`、約96.6 MBと概算できるが、実ファイルの合計サイズは未取得である。また6回で本文ハッシュが現在の記事と異なる。これは本文更新を示す検知情報であり、音声内容の誤りや重大な齟齬を判定したものではない。

## 実装方式の比較

| 方式 | 再利用できる範囲 | 追加負担・判断 |
| --- | --- | --- |
| SwiftUI + 本文WKWebView | Markdown、図、記事用HTML/CSS等。OS機能はAppleのAPIで実装 | 一覧・遷移・保存・検索はSwiftで作る。iOSの操作感を優先する場合の有力案。SwiftとWeb双方を保守する |
| React Native / Expo + 本文WebView | データ処理、記事描画の一部。iOS/Android間でUIを共有できる | 既存のNext.js画面を丸ごと流用はできない。近い将来Androidも対象にする場合に検討する |
| Capacitor + 既存静的サイト | HTML/CSS/JavaScriptを最も広く流用できる | 早く試作する候補。UIの中心はWebViewで、音声や保存はネイティブ連携を補う。アプリとしての操作設計と審査対策が必要 |

[AppleのTextの説明](https://developer.apple.com/documentation/swiftui/text/init%28_%3Atablename%3Abundle%3Acomment%3A%29)ではMarkdownのブロック書式・画像に制限がある。`Text`へMarkdownを入れるだけでは本教材全体の表示を満たせない。[WKWebView](https://developer.apple.com/documentation/webkit/wkwebview/)はローカルやサーバーのHTML等を表示できるため、本文のWeb描画を保つ案に利用できる。

[ExpoのDOM components](https://docs.expo.dev/guides/dom-components/)はWebコードをWebView内で使う仕組みを提供するが、SSG/RSCを含むNext.jsアプリ全体の自動変換ではない。[ExpoのNext.js統合](https://docs.expo.dev/guides/using-nextjs/)にもApp Router等の制約がある。[Next.js static export](https://nextjs.org/docs/app/guides/static-exports)の出力は[Capacitorの導入条件](https://capacitorjs.com/docs/getting-started)と整合する候補だが、ローカルURLでのルーティング、`basePath`、PagefindのJS/WASM、外部リンクの扱いは試作で確かめる。

PWAはホーム画面からの利用を試す比較対象にはなるが、今回希望するネイティブアプリとは方式が異なる。すでにスマホ向けWebサイトがあるため、アプリ化の目的を「通勤中のオフライン学習」「読書の続き」「音声の継続再生」などに置くと、追加開発の効果を評価しやすい。

## 懸念点と設計上の対処

| 懸念 | なぜ問題になるか | 試作・設計で確認すること |
| --- | --- | --- |
| スマホでの表示 | 長い数式、横長の表、コード、図は縮小だけでは読みづらい | 狭幅、横画面、文字拡大、図の拡大、コードのコピー、VoiceOverの見出し移動・読み上げ |
| 古い教材が残る | 同梱コンテンツだけでは更新のたびにアプリ再配布が必要。キャッシュだけでは更新状態を判断できない | 記事ID・revision・更新日時、最終同期日時、更新失敗時の旧版保持。本文・図・検索索引を同じ版として切り替える |
| 学習記録の消失 | Web storageの継続保存を前提にするとOS都合の消失などに弱い。本文改訂で読書位置もずれる | 記録をネイティブの永続領域へ保存。記事IDと見出し単位で復帰し、削除・改名・本文更新時の扱いを決める。初版は端末内、端末間同期は別機能として扱う |
| 日本語検索の品質 | 既存Pagefindの品質を、SQLite等への置換だけで維持できるとは限らない | `評価`等の2文字語、`RAG`・`MCP`、全半角、かな、見出し優先を評価。199記事の段階では正規化した単純検索も比較する |
| ロック中の音声 | HTML audioの前面再生と、バックグラウンド・割込み後の復帰は別 | ネイティブ再生、Audio Session、Background Modes、ロック画面操作。着信、イヤホン切断、次話移行、通信断、再生位置復帰を実機で確認 |
| 保存容量・配信 | 音声を全部同梱・自動保存すると容量が増える。Release URLのリダイレクト等も影響する | 本文・図と音声を分け、音声は任意保存を候補にする。サイズ表示、削除、再開、ハッシュ照合、MP3のRange/シークを確認 |
| WebViewの境界 | ダウンロードしたMDXや任意JSの実行、広いJS bridgeは攻撃面と保守負担を増やす | レンダラーを同梱し、取得データのHTML・URL・型を検証する。許可する配信先、外部リンク、最小限のbridgeを定義する |
| 保守の増加 | Webに加えiOS、署名、SDK更新、ストア申請、OS差の試験が必要になる | 共通コンテンツ生成と版管理を維持。Web/iOSの同時修正範囲、依存更新、端末受入、リリース担当を決める |

保存については[Capacitor storage](https://capacitorjs.com/docs/guides/storage)、[Expo FileSystem](https://docs.expo.dev/versions/latest/sdk/filesystem/)・[SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)が一次資料になる。検索は[Pagefind多言語対応](https://pagefind.app/docs/multilingual/)と[SQLite FTS5のtokenizer仕様](https://www.sqlite.org/fts5.html)を参照した。特にtrigramの短い検索語の制限から、検索エンジンの採用だけで日本語検索の合格とは判断しない。

音声のOS設定は[Appleのmedia playback設定](https://developer.apple.com/documentation/avfoundation/configuring-your-app-for-media-playback)、Expo案は[expo-audio](https://docs.expo.dev/versions/latest/sdk/audio/)で確認した。Capacitor案はネイティブ音声プラグイン等の選定が別途必要。既存の[音声の実機受入項目](../automation/audio/README.md#検証と-iphone-受入)も引き継ぐ。Dynamic TypeとWeb描画の接続は[WebKitのsystem font説明](https://webkit.org/blog/3709/using-the-system-font-in-web-content/)も参考になる。

## 配布・審査・費用・権利

| 論点 | 公式資料・既存記録で確認した条件 | この検討での扱い |
| --- | --- | --- |
| App Store審査 | [4.2 / 4.2.2](https://developer.apple.com/app-store/review/guidelines/#minimum-functionality)は単純なWeb再包装等を制限 | オフライン、しおり、進捗、継続再生などを実用的な学習体験として設計する。機能追加だけで審査通過は保証されない |
| 教材更新 | [2.5.2](https://developer.apple.com/app-store/review/guidelines/#software-requirements)は機能を変更するコードの取得・実行を制限 | 同梱レンダラーに記事データを配信する案。実行コード更新やサンプルの端末上実行は別検討 |
| プライバシー | [5.1.1](https://developer.apple.com/app-store/review/guidelines/#privacy)は全アプリに、App Store Connectのメタデータとアプリ内の分かりやすい場所の両方でポリシーへのリンクを要求。[App Privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/)の回答も必要 | 無料・ログインなしでも対応する。配信先のログや外部SDKを確認してから非収集と申告する |
| 個人の試用 | [無料Apple Account](https://developer.apple.com/help/account/basics/about-your-developer-account)のPersonal Teamで実機試験可能。プロビジョニングは7日で失効 | 自分のiPhoneで試す入口にはなるが、恒久的な個人配布の代替にはしにくい |
| 公開配布 | [Apple Developer Program](https://developer.apple.com/programs/whats-included/)は年額99 USD、地域によって現地通貨 | 契約時の日本円額は未確認。対応するMac/Xcode、iPhone、保守作業も必要。クラウドビルドは別費用の候補 |
| ベータ配布 | [TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)は1ビルド最大90日。外部テスト開始には審査がある | 正式リリース前の受入に使えるが、無期限配布ではない |
| SDK・対応OS | [提出要件](https://developer.apple.com/news/upcoming-requirements/)は2026-04-28からXcode 26以上・iOS 26 SDK以上。2026-09-09からtargetはiOS 13以降 | ビルド用SDKと利用者の最低OSは別。最低対応OSは使用API・framework・対象端末に合わせて決め、[Xcode対応環境](https://developer.apple.com/xcode/system-requirements/)を確認する |
| 記事・コード | [LICENSE](../LICENSE)は記事CC BY 4.0、コードMIT。[CC公式説明](https://creativecommons.org/licenses/by/4.0/)は表示・改変表示等の条件を示す | アプリ内に出典・ライセンス・必要なNOTICEを設ける。CC対象記事への追加制限を含め、アプリ利用規約と素材の扱いを確認する |
| 音声・画像 | [既存棚卸し](../project/records/2026-10-03/license-inventory.md)はMP3・台本・紹介画像の独立配布宣言に未確認点を記録 | アプリ同梱・オフライン保存の範囲を確認する。元記事のCCや音声クレジットだけで音声全体の条件が確定したとは扱わない |

将来、有料記事やサブスクを追加する場合は課金設計を再調査する。[Reader appの説明](https://developer.apple.com/support/reader-apps/)には対象機能と外部リンク権限の条件があり、記事アプリというだけで資格は確定しない。日本向けにも[代替決済等の条件](https://developer.apple.com/support/payment-options-on-the-app-store-in-japan/)があるため、世界共通でIAPのみ、あるいは外部決済ならAppleへの支払い不要、とは断定しない。現時点では無料・アカウントなしを初期案にすると判断要素を減らせるという提案であり、収益化方針の決定ではない。

コンテンツ配信は初期には既存基盤を活用できる可能性がある。[GitHub Pagesの上限](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)は公開サイト1 GB、月間帯域100 GBのsoft limit等を定める。アプリ用データの追加分と利用量は見積もる。音声を配信しているGitHub Releasesを汎用CDNの無制限な動作保証と扱わず、必要になった段階で別配信基盤を比較する。新規サーバー費用が必ず発生する、または完全無料で永続運用できる、とは現段階で判断しない。

## 推奨する次の段階

最初の実装は、全機能の移植より先に**SwiftUI + 本文WKWebViewで代表3記事を読む小さな試作**とするのがよい。通常記事、数式の多い記事、図・表・長いコードを含む記事を選び、既存音声1回を接続する。直近にAndroid提供も必要なら、同じ評価条件でExpoを第一候補に変更する。

試作の合格条件案は次のとおり。

1. 同じ`docs/`から、記事ID・revision・本文・図・検索用テキストを持つデータを生成できる。Web用生成物を手修正しない。
2. 配布物に同梱した記事は初回の機内モードでも読める。更新中断時には本文・図・検索の版を混在させず、最後に成功した版を開ける。
3. 狭幅・文字拡大・VoiceOverで主要な学習内容を読める。表や数式が欠落せず、コードをコピーできる。
4. しおりと読書位置が終了・再起動後も残る。日本語・英語略語の代表クエリで目的の記事へ到達できる。
5. ロック画面で再生・停止・シークでき、着信・イヤホン切断・通信断後の復帰を確認できる。音声保存は容量・権利条件を確認して判断する。

試作後に、最低対応OS、本文まで完全ネイティブにする必要、無料/有料、個人利用/TestFlight/App Store、Androidの時期を決める。その結果から初版の開発量を見積もる。現時点でカレンダー上の工期・受託費用は断定しない。

初版候補は全記事の閲覧・検索・しおり・読書位置・オフライン記事とネイティブ音声。アカウント、クラウド同期、AIチャット、課金、プッシュ通知、依存グラフ全体の再現は追加の判断項目とする。学習ルート自体は一覧で提供できるため、依存グラフの完全移植を初版の必須条件にしなくても学習導線を作れる。

## 調査の限界

今回確認したのはコードとデータの静的構成、公式仕様、既存の権利棚卸しである。Xcodeビルド、iOS Simulator、iPhone実機、音声ファイルの新規取得、App Store申請は行っていない。ネイティブ検索の精度、読み上げ品質、端末容量、音声配信の実動作、審査結果は未検証である。既存の音声配布条件の解消や、日本円での登録費の確定も今回行っていない。
