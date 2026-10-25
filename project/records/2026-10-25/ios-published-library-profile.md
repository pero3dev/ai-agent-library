# 全published記事の通常同梱候補と原文監査

## 作業契約

- 目的: [IOS-13〜15](../../plans/engineering/ios-app-completion.md)の次段階へ向け、全記事を通常Contentへ生成する明示モードと原文監査を追加する。
- 許可根拠: ユーザーのTODO順の自律実装とcommit・PR・main統合の依頼。今回の範囲はopt-inの生成準備で、アプリの既定切替・配布・実機導入を行わない。
- 基準・所有: 空検索改善PR #252。生成担当はnative CLI・変換処理・既存Node試験の3ファイル、監査担当はnative-content-audit・新規Node試験の2ファイル、親はREADME・計画・記録・Git統合を担当する。他者の差分を戻さない。
- 検証・終了条件: mode・出力権限・併用拒否、旧3/4記事の維持、全publishedの厳密な集合と原文・全図・リンク・PNG・ライセンスを確認する。私有rootで新modeを実生成し、実consumer・原文監査と独立レビューを通す。
- 適用: [共通契約](../../../AGENTS.md)、[Git規約](../../../harness/git-rules.md)、[全記事一時生成](ios-all-article-package.md)。

## 明示モードと監査

`--published-library`／builderの`publishedLibrary`は、全published記事と完全な図説明mapを使い、固定の`ios/AILibrary/Content`へ生成する。他profile・fixtures・明示outputとの併用を拒否する。従来の`--all-published`は明示した一時Content専用のまま、no-flagの代表3記事とfixture4記事も維持する。`npm run ios:prepare`の既定は変更していない。

原文監査も代表3・fixture4・一時全記事・通常同梱全記事のprofileを明示する。producerの選定関数を使わずにpublished原本を列挙し、記事ID・source_path・順序・SHA、全74説明、本文leaves・表・コード・数式・リンク・PNG・NOTICEを照合する。research等の非記事ファイルへの外部fallbackも検査する。readonlyの入力先を既知のcanonical rootかsymlinkのない一時Contentへ限定する。

## 確認結果

生成関連Node42件（旧37＋新5）と監査の新8件が成功し、独立した再実行も50/50だった。共有の通常3記事・fixture4記事は全140／151検証対象ファイルのSHAとrevisionが不変だった。入力・参照・asset・render・boundsの書込前拒否で既存出力を維持することを確認した。出力を消した後のI/O障害に対するatomic置換は既存の残件である。

新modeは共有rootへ書かず、私有copy rootのcanonical Contentへ実生成した。199記事・音声1本・625ファイル（manifest込み）・422 PNG、37,547,770 bytes、revision `429cde4a07c65d5897bfe4c37d41634a5b72d9f79d87b183e142c9c4c427e981`を得た。実consumerで全199本文を受け入れ、原文監査でも74図説明・内部リンク3,525・外部リンク902、問題0件だった。代表3・fixture4・旧一時199の実監査もすべて成功した。

## 再描画の再現性と残件

旧一時199とrevisionが一致するという初回の私有assertは失敗した。全記事JSON・metadata・音声・ファイル集合・全画像寸法は同一で、24枚のMermaid PNGに計17 bytesの差があった。decoded比較した3枚では11〜129 pixels、最大channel差2〜5/255の差を観測し、2図の再描画でもbit一致しない場合があった。全24枚のpixel比較や原因解消を完了とはしない。

同じrendered assetsを注入すると両モードの全199記事・manifest・revisionは完全一致した。modeの選択差と実Mermaidラスタの再現差を分け、初回assert失敗も証拠に保持した。再生成時に微小な画像差でrevisionが変わる可能性を残す。[JSON](ios-published-library-profile.json)に実測と未確認を記録する。

新候補のアプリDebug/UI/Release、章別・大図・長文の画面受入、VoiceOver、性能目標は未完了。正常な保存済みpackageを同梱版より優先する現契約も維持しており、既存3記事の取り込み済み端末を全記事へ切り替える操作と保存移行はIOS-20・22へ分ける。IOS-13〜15の全体完了や初版の採択とは扱わない。
