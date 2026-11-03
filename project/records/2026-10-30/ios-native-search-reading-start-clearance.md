# 検索着地点の読書開始余白

作成日: 2026-10-30。状態: **App 0.2.24（26）の修正候補**。作者基準は実main `e6e1d81fe3df17cebe0173fbd1e3a175cd4e3236`。初回失敗を保持し、修正版のHosted受入・通常main統合は後続で確認する。TODO14/32を維持する。

## 目的と作業契約

本文検索の着地点が可視領域の上端に僅かに重なる問題を対象とする。所有範囲は`NativeReaderView.swift`、`NativeInlineTests.swift`、`project.pbxproj`、この記録と同名JSON、`project/README.md`、[完成版TODO](../../plans/engineering/ios-app-completion.md)の7パスである。[共通契約](../../../AGENTS.md)・[Git規約](../../../harness/git-rules.md)・[運用文書の規約](../../../harness/writing-rules.md#調査記録と運用文書)に従う。

ユーザーのTODO自律実施と通常commit・PR/main統合の継続依頼を許可根拠とする。実機確認は未完了でスキップできる。本記録の初稿は私有領域で作成し、下記のソース変更・型検査とは作業を分けた。

## 初回失敗と修正範囲

PR #309の共通・Native成功は旧候補への結果として保持する。初回Fullのrun 41047541115では単体245件（skip2・失敗0）の後、対象23件中、本文検索1件が`PublishedReaderUITests.swift:561`で失敗した。target上端97.59649122806938に対し、可視上端は97.66666666666667で、AX frameが約0.070175pt欠けていた。Releaseと独立374Bコピー照合には到達していない。

app側markerの記録は0件で、AX座標とmarker・goal・実offsetの対応は未確認である。この座標から作った算術反例を、根本原因の完全な証明とは扱わない。

productionの読書開始だけ1ptの余白を明示し、block内位置が未指定または0の場合に適用する。純粋関数の既定値は0、正のfractionは既存の計算とinverseを維持する。既存の0.5pt収束、合法offsetのclamp、厳密なUI可視判定・selectors・全上限・再試行・保存schemaは変えない。正の位置へ毎回余白を足す復帰driftを避け、0の保存は既存clampで0へ戻す。

## 検証と受入の残件

反例、production marker経路、nil/zeroの反復保存復帰、正のfractionとinverse、clamp・不正入力を扱う4メソッドを追加した。既存46メソッドを保持し、productionのnil jumpに対応する期待値11行を1pt分同期した。予定数を実XCTest成功数にはしない。限定逆変換で元Source2へ戻ることとSwift構文を確認した。

SDK18.2のApp module生成とXCTest型検査は、保存済みguard結果で各exit 0（18.45秒／4.198秒、総22.649秒）を確認した。binary・新4件のXCTestは実行していない。

PBXはバージョン関連4箇所だけを0.2.23（25）から0.2.24（26）へ変更し、Team・署名設定は保持する。新しいXCTest、厳密判定を保ったFull23件、独立copy374B、Release監査、共通検査・必要CIと通常統合は未確認である。初回失敗と新版の結果を分けて確認する。

実機・最低OS17のUI・VoiceOver・性能予算とIOS-11/15/25全体は未完了のままとし、SDKのiOS17ターゲット型検査を実OS上の合格へ転用しない。

## 初回修正版の単体試験とfixture修正

PR #310の初回head `184da64e6de765f5886a64473f93b9a3c725c8a9`は、Fullの単体249件・skip2のうち、追加した境界確認1件が失敗した。`NativeInlineTests.swift:1152`で0.5pt差を要求した後、観測が`aligned`にならなかった。UI・独立copy・Releaseには未到達であり、必須11検査の成功から受入を推測しない。

Appの収束式は変更していないため、観測時の計算差は0.5ptを超えていたことになる。生ログに実offsetやgoalはなく、具体的な丸めの原因は断定しない。fixtureで厳密な境界を作れるという前提を外し、0.125ptの内部点を要求した後に実readbackが0.5pt未満であることを確認する。一定の`aligned`期待と正の表示余白、純粋な±0.5pt境界の反例試験は保つ。

この追記とfixture修正でproduction App・版番号・収束値・UI判定・上限を変えない。初回2つの失敗を保持し、新headの実XCTestとFull23・copy374B・Releaseの結果を別に確認する。
