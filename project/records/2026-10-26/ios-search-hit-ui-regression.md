# 本文の検索ヒットと再起動後の復帰を公開UIで確認する

## 作業契約

- 目的: IOS-10・25で、本文検索の入れ子leafへの実到着と、保存後の復帰で古いqueryを再実行しないことを確認する。
- 基準: 専用記事の再検証PR #265 head `5a064a3c5ed4b7a1ece51cd672d2711662ad9014`。版0.2.14（16）を保持する。
- 所有: PublishedReaderUITestsの追加2件、開発手順・TODO・本記録と索引。既存caseと他者の変更を戻さない。
- 許可根拠: ユーザーによるTODO優先順の自律実装・commit/PR/通常main統合の依頼。実機確認は未完了として継続する。
- 終了条件: 内容レビューとSDK型検査後、正確なheadで共通CI・単体・機能UI14件・Releaseを確認する。[AGENTS](../../../AGENTS.md)・[Git規約](../../../harness/git-rules.md)を適用する。

## 追加した観測

1件目は「回復 チャンス 一時的」でAgentループを開き、4項目リストの3番目にある段落が最初の完全可視paragraphになることを確認する。単にtop-levelのlist先頭へ着く場合と区別し、本文をgestureで探して成功へ合わせない。

2件目は「20 ステップ分」で本文Aへの到着を陽性確認した後、目次で離れた実装例Bへ移り保存する。終了・再起動後に検索欄が空で、通常の「続きを読む」からBが可視・Aが不可視になることを確認する。内部にqueryのbytesが存在しないという証明にはせず、復帰時に古いqueryを再実行しない公開動作に限定する。

旧Native2件は既にタイトル検索・目次・しおり・再起動復帰を扱う。新規性は入れ子の特定段落への即到着と、body hit Aの陽性を経たB/A差分であり、一般的な復帰の検査を新規とは数えない。既存12caseのselector・assert・helper・gestureを保持する。

前面bar判定のPR #267に合わせ、新しいpositive predicateの1か所だけpoll用の幾何helperを使う。最終の陰性判定ではunknownを明示失敗にし、判定不能を不可視として成功へ変換しない。

## 検証と残件

生成3記事版と199記事版で、実NativeDocument.searchHitと正規化処理を使い、各queryの全語に一致するatomic blockが全体で1件だけになることを確認した。AからBはtop-levelで9block離れている。私有候補と前面helper対応後の同じUI sourceのSDK限定型検査が成功し、内容の独立レビューも受けた。

共有workspaceの共通検査765件は750成功・15skip・失敗0で、最終treeのexact共通検査はHosted待ちである。全target build、機能14件の実登録・実行、実AX・スクロール・保存タイミングは未確認。型検査とsource上の件数を実UIの成功に読み替えない。先行のTOC未到達と専用記事の幾何誤判定はPR #266・267で分けて修正し、PR #265の12件と本追加2件の結果も分ける。VoiceOver・最大文字・実機とIOS-10・25全体は未完了。[JSON](ios-search-hit-ui-regression.json)に段階別の証拠を保存する。
