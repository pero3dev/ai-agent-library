# SDK27互換性preflightの準備

状態: 私有候補・未採択。入力は呼出側が指定したactual main（remote鮮度は未検証） `20f2024a107e75c0c4775e58a1223ad1c3950c05`、tree `f4cd209febdd058ad44a184c5f4ba7fc189b35b1`。Appは0.2.17（19）。SDK27の新実行はpendingで、結果・run IDは未取得。

public標準Hosted `xcode-27`でunsigned generic-device Release Archiveと所有SimulatorのNative2だけを準備する。SDK/runtimeの実照合、exact2件・UUID・OS・Passedを要求し、未知のresult階層は失敗にする。job40分、create6分、UI12分、cleanup4分、boot240秒、staged artifact16MiBを保つ。秘密・署名・課金・self-hosted fallback・Store操作は含まない。

入力から得たsource宣言はunit 153件、Native2件、published Markdown 199記事。PBX登録とsource宣言の集計で、XCTest登録・compile・実行の成功ではない。全unit/full UIや性能の受入へ広げない。構造・件数・版・hashの詳細は[JSON](ios-sdk27-compatibility-preflight.json)を参照する。

IOS-02は既存SDK26の完了根拠を保持し、32件中12完了・IOS-11とIOS-23の未完了を変えない。過去の候補freeze時点のSDK27実行0と、今後の実行pendingを分ける。実機QAは未完了としてスキップする。PR275の旧head862は履歴として扱い、実mainのsquash30aのtype・tree・parentと後続入力への祖先関係を確認する。Iconの正常mergeとremote main鮮度は呼出側で確認し、実mainへ再bindして、独立reviewとexact-head検証を得るまで採択・公開・完了とは扱わない。
