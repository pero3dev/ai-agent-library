# ネイティブコードコピーのCI検査候補

2026-10-27。既存のコピー機能を公開UIから検査する私有の採択候補を記録する。[同名JSON](ios-code-copy-ui-ci.json)にsourceと検査範囲を残す。実mainへの反映、実SDK、実UI、新run、実際の374B受入はいずれも未確定で、成功した機能として扱わない。

対象は[本文renderer](../../../ios/AILibrary/Sources/NativeReaderView.swift)、[Published UI試験](../../../ios/AILibraryUITests/PublishedReaderUITests.swift)、[Full workflow](../../../.github/workflows/ios-published-candidate.yml)と新しい期待値TXTの4ファイルである。診断context候補のうちworkflowだけを最新のcompact upload候補へ差し替える。5eb／eabで既存3ファイルのbefore blobと期待値TXTの不存在が同じことは確認したが、fresh actualmainへの採用bindは別途必要である。Reading・Core・Featureの本文やindexをここでは変更しない。

Appの変更はcode本文とコピーbuttonを対にするAX識別IDの2行だけで、既存のコピー処理は保つ。追加するpublic UI caseは1件で、独立markerを含む最初のfixture codeと対応buttonを見つけて押し、fixtureの読書位置を公開UIで戻す。Source宣言はNative2＋Published15＋geometry6の23件で、Failureと将来のRecovery UIは選択しない。

CI候補はiPhone16／iOS18.5の一意なBooted UUIDにランダムなcanaryを書き、そのUUIDから同じbytesを読み戻してから、同じUUIDをxcodebuildのdestinationにする。観測済みXcode16.4形式のraw結果に対し、固定23 IDが重複なく各1回、containerとleafがすべてPassedであることを要求し、skip・repeat・欠落・未知形式を通過扱いにしない。その後だけ同じUUIDのsimctl pbpasteを読み、独立した期待値TXTの374Bと全bytesを比較する。SHA-256は `e29cb525957fb4bd72350927aa1cf47659da4aef9964ecbf0d43edb4dfe2cee8`で、空白・tab・emoji・長い行・末尾LFも対象である。Mac本体のpasteboardを参照せず、期待値をdeviceへ注入して一致を作る経路も加えない。

最新workflow候補は、JSON6・log3・既知bin2の固定11ファイルだけを別名compact artifactへ残し、従来のfull uploadを保持する。glob・PNG・xcresultをcompactへ加えない。raw binは既存commandが出力する結果JSONとdeviceの実pbpasteであり、追加の取得commandではない。uploadはalways・2分・90日保持、job50分と既存のselector・待機・判定を保つ。compactの不存在やupload成否を、23件や374B受入の代わりにしない。

旧技術候補のSwift／Bash／Node構文検査、診断contextへの機械的再bind、compact upload差分の独立レビューは、それぞれの静的な範囲の証跡である。現組合せのSDK build・実UI・raw23件・canary／pbpaste・artifact実取得の結果ではない。本記録の新しい確認はMarkdown1件のlint、JSONとリンク・保全確認だけで、新test・SDK・GET・benchmark・生成・依存導入・API/Git変更は行わない。

index本体は書き換えず、Copy専用段落を追加するアンカー案だけを私有JSONに残す。Rootがfresh actualmainの前後blob・非所有差分・固定case集合を再bindし、最終内容とHostedを別にレビューする。IOS-25全体、他のcode block・空・inlineのコピー、初回offline・legacy移行・実機pasteboardは未完了で、Reading／Coreの受入や凍結性能へ結果を付け替えない。
