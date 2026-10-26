# SDK27互換性preflightの準備

この冒頭の私有準備・未実施表記はPR279提出時点のsnapshotである。最新の初回Hosted結果と診断の準備は末尾を参照する。

状態: 私有候補・未採択。入力は呼出側が指定したactual main（remote鮮度は未検証） `20f2024a107e75c0c4775e58a1223ad1c3950c05`、tree `f4cd209febdd058ad44a184c5f4ba7fc189b35b1`。Appは0.2.17（19）。SDK27の新実行はpendingで、結果・run IDは未取得。

public標準Hosted `xcode-27`でunsigned generic-device Release Archiveと所有SimulatorのNative2だけを準備する。SDK/runtimeの実照合、exact2件・UUID・OS・Passedを要求し、未知のresult階層は失敗にする。job40分、create6分、UI12分、cleanup4分、boot240秒、staged artifact16MiBを保つ。秘密・署名・課金・self-hosted fallback・Store操作は含まない。

入力から得たsource宣言はunit 153件、Native2件、published Markdown 199記事。PBX登録とsource宣言の集計で、XCTest登録・compile・実行の成功ではない。全unit/full UIや性能の受入へ広げない。構造・件数・版・hashの詳細は[JSON](ios-sdk27-compatibility-preflight.json)を参照する。

IOS-02は既存SDK26の完了根拠を保持し、32件中12完了・IOS-11とIOS-23の未完了を変えない。過去の候補freeze時点のSDK27実行0と、今後の実行pendingを分ける。実機QAは未完了としてスキップする。PR275の旧head862は履歴として扱い、実mainのsquash30aのtype・tree・parentと後続入力への祖先関係を確認する。Iconの正常mergeとremote main鮮度は呼出側で確認し、実mainへ再bindして、独立reviewとexact-head検証を得るまで採択・公開・完了とは扱わない。

## 初回SDK27の実行結果と座標診断

PR279 head `62f284238064802b98e1abb6b92f0ecdba612d32` のrun40322325881では、unsigned Archiveが成功した。小証跡115,346 bytesをメモリ内でSHA-256・全66CRC照合し、Xcode27.0（27A266a）／iOS27.0 SDK（24A430）、App0.2.17（19）・最小OS17.0・arm64、199記事・626files（manifest含む）・422PNGを確認した。署名・profile・配布は使わず、ReleaseのTestContent除外とprivacy source一致・dSYMを確認した。最小OS17での実行や実機の受入を示す結果ではない。

Native2は実iOS27.0／iPhone17で1成功・1失敗だった。失敗は初回目次から「自己注意の数式」へ移った直後の公開可視範囲と操作可能性の待機で、再起動復帰へは未到達。readerと見出しの存在・frame取得が記録され、見出しの非存在とは分ける。直前の座標が残っていないため、製品の配置と試験viewportのどちらに修正が必要かは未確定。後段の厳密監査はfailed parentを正しく拒否し、summaryも未完了を保った。owned Simulatorの削除と3/4記事の実bundle監査は成功した。73,246 bytesの小証跡をメモリ内でSHA・全101CRC照合したが、xcresult内部に作ったスクショとAX階層は旧artifactにexportされておらず、数値の根拠には使えない。

同じheadの再試行は行わない。失敗時に限りapp・reader・target・barの座標、既存control witnessと計算viewportを小JSONでstdoutと添付へ記録する診断を準備する。現在の位置調整・fullyVisible・hittable・15秒待機・selector2件・CI予算は保つ。座標は失敗直後の逐次snapshotとして扱い、最後のpollの同時測定とはしない。実数を得てから必要な製品側または試験側の修正を判断する。新headの実行と受入は未実施であり、SDK27全体・IOS-23・実機・VoiceOver・性能・配布の完了にしない。
