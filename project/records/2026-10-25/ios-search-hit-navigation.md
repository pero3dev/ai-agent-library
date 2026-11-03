# 検索結果からネイティブ本文の一致位置へ移動

## 作業契約

- 目的: IOS-10の残件である、一覧の検索結果から本文中の一致ブロックへの移動を実装する。
- 許可根拠: ユーザーがTODO順の自律実施と計画内のcommit・PR・main反映を依頼し、新たな実機確認は未完了としてスキップしてよいと追加指定した。
- 基準: [M0 PR #241](https://github.com/pero3dev/ai-agent-library/pull/241)のhead `3dc5cc6dedf98da880acbb098edb5b1bdbff3383`。main反映は前提依存PRのCI修復待ちのため、基準commitから`codex/ios-search-hit-navigation`へ分けて進める。
- 所有: データ担当はModels・NativeDocument・CoreSmoke・LibraryCoreTests、画面担当はLibraryView・ArticleReaderView・NativeReaderView・NativeInlineTests。親は統合・Xcode版・記録・TODO・検証・GitHub反映を担当する。他者の差分を戻さない。
- 仕様: 一覧の正規化AND検索を維持し、queryは一時的にrouteへ渡す。本文を検証後に一致ブロックを探し、入れ子では親を表示してから対象へ移動する。本文にないmetadataのみの一致は先頭へ案内し、通常の続きを読む・しおり・復帰は維持する。検索文字範囲の装飾と改訂後の位置精度は分ける。
- 検証: Foundationの正規化・本文探索・分散語・空query・metadataのみ・入れ子、navigation状態回帰、共通検査とiOS SDK compile。新しい端末操作・Simulator起動は行わず未実施を記録する。
- 終了条件: 対象ブロックを決定してnativeへ渡せ、戻る時に検索要求を再適用せず既存保存を壊さない。PR・mainの状態と未完了の実機受入を明示する。
- 適用: [AGENTS](../../../AGENTS.md)、[ROADMAP](../../../ROADMAP.md)、[Git規約](../../../harness/git-rules.md)、[検証](../../../CONTRIBUTING.md)、[完成版TODO](../../plans/engineering/ios-app-completion.md)。

## 状態

0.2.4（6）へ実装した。ModelsへReaderRouteを移し、一覧の検索中だけqueryを付ける。NativeDocumentのFoundation検索は本文順に可読ブロックを調べ、全語一致を優先し、なければ一致語の種類数、同点なら本文順で選ぶ。URLは検索対象にしない。装飾・コード・表・図数式・入れ子を扱い、本文に該当語がない場合は先頭へ案内する。

画面側は親containerとleafのscroll IDを分け、親を表示後に対象へ移動する。初回検索は一度だけ消費し、戻りの現在位置と、新しい目次要求を優先する。検索語は保存しない。保存は既存container単位を維持し、表・コードもそのブロック境界までの移動である。文字範囲の色付け・セルやコード行への移動・改訂後の精度は今回の完了へ含めない。

CoreSmokeは通常3記事・fixture付き4記事で成功し、実生成のMAX_STEPSコードと重複見出しマーカーへの探索も検査した。XCTestを9件追加し、42件分のテストターゲットがiOS SDKのbuild-for-testingでcompile成功した。実行成功の件数ではない。`npm run check`も成功し、Node試験559件中544成功・15skip・失敗0、未追跡の今回の記録を含む配置検査も成功した。独立レビューで修正必須事項は見つからなかった。実機の二段スクロールとVoiceOverの受入はユーザー指定により未実施として残す。

前提のCI問題と今回の機能検証を区別し、[JSON](ios-search-hit-navigation.json)へ結果を更新する。PR・mainの反映と、未確認の受入を別に追跡する。
