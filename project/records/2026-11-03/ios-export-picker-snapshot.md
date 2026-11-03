# 書き出し取消UIの画面確認をまとめる候補

2026-11-03の準備時点を記録する。以下は作成時点の観測と未採用候補であり、候補コードの通常UI・新head CI・main受入は未完了である。

## 観測した二つの境界

main eb0cのNative検査では、初回openingでBrowse-rootのMove0・Cancel1・Browse-back0が観測された。旧試験は初回Rootを許可せず、画面の形を認識する段階で停止した。失敗時の画面には正確なバックアップ名があったが、失敗後の資料だけでは30秒以内の操作可能性や取消成功を証明できない。

PR #328 head1834のNative検査は別の境界で失敗した。Browse-back後の正確なファイル名と画面条件は成立したが、最後の全走査を残り約1.2秒で始め、約4.8秒後に共有期限超過を検出した。時刻差はXCTestのAXイベント開始ログに基づき、個々のRPC完了時間を厳密に計測した値ではない。このときCancelは実行されていない。読書位置修正の原因・効果や自然OS障害を、この二つの失敗から断定しない。

## 変更する確認方式

公開Snapshot APIで取得した階層の標準属性から、固定IDのバーが一つ、その祖先windowが一つ、Move・Cancel・Browseの適格な形、正確なファイル名・型・位置とframe条件を確認する。8192node・depth64を超える入力や無効な木は受け入れない。各操作の直前には、同じ固定バーとkey、唯一window、同scopeの唯一の許可action、live exists・enabled・hittableと期限を確認する。Snapshot取得自体の時間上限APIや、取得から操作までの原子性・性能保証を主張しない。返却後の期限超過は失敗にする。

初回からのBrowse-rootも、その回の操作自身で新規出現・画面・ファイル名・許可Cancelを確認できた場合に扱う。これはAX走査の削減とは別の試験要件変更で、旧「初回実Back済みを二回目Root許可の根拠にする」規則を置き換える。Backが示された場合だけ一回操作し、その後の適格Cancelは旧条件どおりMove1Cancel1Back0またはMove0Cancel1Back0を確認する。各回のentry/post shape・実Back・Cancel後closureを追加のAX取得なしで記録し、実Back0をBack検証済みとは数えない。

共有30秒、2回の書き出し取消、画面閉鎖、再起動後のしおり・読書位置確認は維持する。Move・Save・provider・保存先選択は操作しない。アプリ本体、保存形式、App0.2.29（31）の候補、通常Native8・全記事26と単体287の試験集合は変更しない。

## 現在の検証と後続

分類関数を実コードのまま取り出したSwift host fixtureは13群・28assertで成功した。初回のCoreGraphics overlay不足と、その後のfixtureのNaN型指定の曖昧性は保存し、検証用プログラムだけを直した。pure hostだけでiOSのSnapshot取得・live adapterの型検査やUI成功を主張しない。

同じ最終Code1に対する別の既存Xcode16.2（16C5032a）/iPhoneSimulator18.2 SDKのgeneric Debug build-for-testingは42.778秒・exit0だった。arm64とx86_64でReader6と変更したUI1の入力を確認し、App0.2.29（31）・他674入力と保護対象を保持した。これはAPI・型互換性だけの検証であり、実UI・30秒以内の操作・AX費用・新head CIや原因解消は未受入である。

内容レビューは最終候補に対して独立に確認する。最終Sourceの共通検査、通常Native8・全記事26・R26等と必須CIを確認し、同PRへテストと記録を責務別コミットで追加する。Ready後の必要検査と通常保護でのmain統合、main pushは別々に確認する。実機・VoiceOver・最低OSは未完了でスキップし、TODO32行・完了14行を保つ。
