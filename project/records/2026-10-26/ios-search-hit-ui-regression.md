# 本文の検索ヒットと再起動後の復帰を公開UIで確認する

## 作業契約

- 目的: IOS-10・25の入れ子本文への到着と、保存後の復帰で古いqueryを再実行しない動作を検査する。
- 基準: PR #268のhead `a88fe0720beeddcfeeb6b24bc2f353a2b2647d66`。main `b79c0a3f6b76a7603077b0a30a07cdecb94cda93`を含み、版0.2.14（16）を保持する。
- 所有: UITest2ファイル、全記事UIのselector、開発手順と本記録。App・保存形式・既存の操作手順は変更しない。
- 許可根拠: TODO優先順の自律実装・commit/PR/通常main統合の依頼。実機確認は未完了として継続する。
- 終了条件: 独立レビュー後、新headの共通CI・単体・機能UI14件と純粋geometry6件・Releaseを確認する。[AGENTS](../../../AGENTS.md)・[Git規約](../../../harness/git-rules.md)を適用する。

## 検査する動作

「回復 チャンス 一時的」でAgentループを開き、入れ子リストの特定段落が最初の完全可視paragraphになることを確認する。本文gestureで到着位置を作らず、listの先頭だけを表示する場合と区別する。

もう1件は「20 ステップ分」で本文Aへの到着を確認した後、目次で離れた実装例Bへ移って保存する。終了・再起動後に検索欄が空で、「続きを読む」からBが可視・Aが不可視になることを確認する。内部のquery bytes不存在の証明にはしない。生成3記事・199記事で各queryの全語に一致するatomic blockが1件だけになることを、実searchHitで確認済みである。

既存12機能ケースと2件の検索ケースを保持する。専用一覧の検索終了は前面バー配下の一意なキャンセルを使い、通常のfilter・保存記録との分離を確認する。

## 実行履歴と判定処理の修正

追加4行前のhead `18bcbf62`の[run40207531202](https://github.com/pero3dev/ai-agent-library/actions/runs/40207531202)は単体127成功・2skip、UI13/14で専用一覧の最終closeだけが失敗した。検索2件自体は成功した。その後の[head a88のrun40227071664](https://github.com/pero3dev/ai-agent-library/actions/runs/40227071664)では単体127成功・2skip、機能UI14/14とReleaseが成功した。

一方、別headの[3dbのrun40225552378](https://github.com/pero3dev/ai-agent-library/actions/runs/40225552378)ではAのfirst-visible判定が失敗し、[238eのrun40226683804](https://github.com/pero3dev/ai-agent-library/actions/runs/40226683804)ではAとpickerが成功した後、Bの最初の検索到着で同じ判定が失敗した。Bの目次移動・保存・再起動には到達していない。これらをa88の成功で上書きせず、統合を保留した。

一時診断[PR #272](https://github.com/pero3dev/ai-agent-library/pull/272)の最終head `b16da8f0`・[run40235571643](https://github.com/pero3dev/ai-agent-library/actions/runs/40235571643)では、Xcode16.4/SDK18.5・iPhone16/iOS18.5でA/Bだけを実行して両方成功した。公式添付manifestのtestIdentifier/deviceIdと結んだJSONでは、各1pollで先頭IDとtarget IDが一致し、targetが完全表示領域内だった。判定時間はA11.505638秒・B8.495475秒、そのうち段落ごとのgeometryを取得するfilter工程は9.957591秒・7.344782秒だった。初回2回のprebuild停止は保持し、診断PRはmainへ統合せず閉じた。成功観測の費用であり、過去の失敗原因や安定性を確定した値ではない。

今回の判定は1pollで前面viewportを1回解決し、各paragraph queryのexists/frameを取得した後、値としてコピーしたCGRectだけでfilter/sortする。前面barの一意性・操作可能なcontrolの根拠・barによる上部の遮蔽・完全表示・target hittable・先頭ID一致を維持する。AX取得は逐次であり、原子的snapshotではない。targetのguardとcollectionに同じ段落が別query objectとして現れる場合、それぞれの経路でframeを読む。待機15秒・assert・gesture・case本文は変えない。

unknown・複数bar・遮蔽・部分表示・同じ上端の順序・NaN・空viewport等の純粋CGRect検査6件を追加し、全記事workflowの既存2class selectorに専用classを加える。既存Native2件とPublished12件の機能UI14件、純粋6件の計20件が実行対象となる予定で、実登録数は新headの結果を採用する。

## 検証と残件

元のbar/viewport計算式の保全、predicateだけの限定置換、既存case本文・assert・操作の不変、旧14件への一意な適用を静的確認した。新sourceのSwift/SDK compile・XCTest登録・実UI・Release・共通CIは未実施である。空き容量制約によりローカルSDK/Simulatorは実行せず、正確な新headのHostedを使う。以前の版の成功を新sourceへ流用しない。

VoiceOver・最大文字・実機受入はユーザー指定により未完了として記録する。IOS-10・25全体の完了や製品性能の合格を、このテスト修正だけで宣言しない。[JSON](ios-search-hit-ui-regression.json)にsourceと実行を分けて記録する。
