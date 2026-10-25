# 絞り込み中の操作シートと保存分離のUI回帰

## 作業契約

- 目的: IOS-25として、新しい操作シート経由のAboutと専用記事の動作を自動UI検査へ追加する。
- 基準: PR #264 heada9aa3f3721f1ddcd74edc217e129e0e296b58a81。版0.2.14（16）を保持する。
- 所有: PublishedReaderUITestsの追加2件、開発手順・TODO・本記録と索引。他者と既存ケースを戻さない。
- 許可根拠: ユーザーのiOS TODO自律実装・段階的commit/PR/通常main統合の依頼。実機未確認を残す方針を継承する。
- 終了条件: 候補の独立レビューとSDK compile後、最終headの全記事Hostedで既存10＋追加2件を実行する。
- 規約: [AGENTS](../../../AGENTS.md)、[Git規約](../../../harness/git-rules.md)、[開発手順](../../../CONTRIBUTING.md)。

## 追加した操作

1件目はタグと検索語を組み合わせ、操作シートからAboutを開いて閉じ、同じ検索語・タグ・summaryが保たれることを確認する。2件目は通常Transformerにしおり・自己注意の位置を準備してから専用記事へ進み、専用一覧は検索前に全1記事・foreground article1件だけであることを確認する。専用側のしおりを変更し、単独リンクからAgentへ移って音声が無いことを確認し、2段戻って閉じる。

退出後は通常filter/query/tag保持を先に確認し、clearした後にアプリを終了・再起動する。通常readerを先に開かずに永続データを読み直し、Transformerのしおり・自己注意の位置へ戻ることを検査する。同processのcached normalStoreだけではsuiteの汚染を読み取らず合格する可能性があり、独立レビューで順序を修正した。

公開UIだけを操作し、Storeへ直接書き込むrouteやテスト専用の遷移は追加しない。検索欄は上限付きで表示を待ち、唯一foregroundでhittableな対象だけを使い、背景を誤選択した場合は成功扱いしない。既存Published8ケースとNative2ケース、全selector/assertionを保持する。fileImporterは実picker階層を確定できず、推測したキャンセルを追加しない。

## 検証と残件

初期UIソースSHA `26d9f24c…`では、私有候補の2点修正を含む独立レビューとSDK単独型検査を確認し、PublishedReaderUITestsだけへ反映した。全target build-for-testingの最初の1回は既存shell phaseのnested sandbox制約で停止し、ソースcompileの不具合とは区別して記録した。同じcache/同じcommandをtool sandbox外で再実行し、Xcodeのscript sandbox設定を保ったまま成功した。

この初期ソースでunit122・機能UI12・performance1の実FileListとarm64/x86_64両binaryのmethod登録、actual app0.2.14（16）、保護48sourceのbefore/after SHA不変を確認した。SDK compileであり、追加2件の実UI成功ではない。ローカルSimulator・iPhoneを起動せず、空き容量5GiB以上を維持した。

## 2026-10-26のHosted結果と限定修正

初回のhead `c33301ac…`は全記事UI12件のうち10成功・2失敗だった。目次位置決めと前面bar判定を取り込んだhead `5a064a3c5ed4b7a1ece51cd672d2711662ad9014`のrun `40204963946`／job `121203831572`では、単体129件は127成功・2skip、UI12件は11成功・1失敗、ReleaseはUI失敗後にskipとなった。旧見出しへの移動、専用記事からAgentへのleafリンク、Relatedの確認は進み、最後に専用一覧へ戻った後の「閉じる」だけが残った。

実AXでは、本文readerがなくなった前面「本文表示テスト」バーに検索値「CASE-LINK-01」と消去・キャンセルがあり、「閉じる」のlabelはなかった。背景の通常検索にもキャンセルが残るため、全画面から選ばず、前面fixtureバー配下のキャンセルを既存の一意性・hittable判定で選んで押す4行を、最後の検索値保持assertと既存の閉じる操作の間に追加した。About・操作シートの閉じ方、通常query保持、既存close/hittable/bar消失assertは変更しない。m0の内容承認までで、この操作の成功はまだ確認していない。

現在のPR #265用12件ソースSHAは `ad5f668c516aed07333c2cbbcbfbe86231c45f2d00d64c549f473b0543111c6c`である。workingには検索2件を加えた14件版を置くため、この12件版とは区別する。上記の初回SDK・binary登録は `26d9f24c…`の原証跡として維持し、新4行へ流用しない。容量制約によりローカルSDKは再実行せず、新しい正確な12件版のHosted compile・登録・実UIと、その後の通常filter／保存分離を待つ。新しいbranch headは未作成で、公開後にrootが実SHAを記録する。

目次位置決めと前面判定の両修正はPR #267へまとめ、root報告のmain `8e982b8460a7b9b33f130755a7ca4c6596cfd8fe`へ通常統合済みである。PR #266の単独統合は、この包含によりsupersededとして扱う。これは今回の検索キャンセル4行のcompileや実UI成功を意味しない。

fileImporterキャンセル、最大文字・VoiceOver・実機とIOS-25全体は未完了。[JSON](ios-filtered-actions-ui.json)に初回・修復版・現在候補を分けて保存する。
