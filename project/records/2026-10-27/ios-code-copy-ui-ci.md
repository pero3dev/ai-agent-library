# ネイティブコードコピーのCI検査候補

2026-10-27。既存のコピー機能を公開UIから検査する私有の採択候補を記録する。[同名JSON](ios-code-copy-ui-ci.json)にsourceと検査範囲を残す。実mainへの反映、実SDK、実UI、新run、実際の374B受入はいずれも未確定で、成功した機能として扱わない。

対象は[本文renderer](../../../ios/AILibrary/Sources/NativeReaderView.swift)、[Published UI試験](../../../ios/AILibraryUITests/PublishedReaderUITests.swift)、[Full workflow](../../../.github/workflows/ios-published-candidate.yml)と新しい期待値TXTの4ファイルである。診断context候補のうちworkflowだけを最新のcompact upload候補へ差し替える。5eb／eabで既存3ファイルのbefore blobと期待値TXTの不存在が同じことは確認したが、fresh actualmainへの採用bindは別途必要である。Reading・Core・Featureの本文やindexをここでは変更しない。

Appの変更はcode本文とコピーbuttonを対にするAX識別IDの2行だけで、既存のコピー処理は保つ。追加するpublic UI caseは1件で、独立markerを含む最初のfixture codeと対応buttonを見つけて押し、fixtureの読書位置を公開UIで戻す。Source宣言はNative2＋Published15＋geometry6の23件で、Failureと将来のRecovery UIは選択しない。

CI候補はiPhone16／iOS18.5の一意なBooted UUIDにランダムなcanaryを書き、そのUUIDから同じbytesを読み戻してから、同じUUIDをxcodebuildのdestinationにする。観測済みXcode16.4形式のraw結果に対し、固定23 IDが重複なく各1回、containerとleafがすべてPassedであることを要求し、skip・repeat・欠落・未知形式を通過扱いにしない。その後だけ同じUUIDのsimctl pbpasteを読み、独立した期待値TXTの374Bと全bytesを比較する。SHA-256は `e29cb525957fb4bd72350927aa1cf47659da4aef9964ecbf0d43edb4dfe2cee8`で、空白・tab・emoji・長い行・末尾LFも対象である。Mac本体のpasteboardを参照せず、期待値をdeviceへ注入して一致を作る経路も加えない。

最新workflow候補は、JSON6・log3・既知bin2の固定11ファイルだけを別名compact artifactへ残し、従来のfull uploadを保持する。glob・PNG・xcresultをcompactへ加えない。raw binは既存commandが出力する結果JSONとdeviceの実pbpasteであり、追加の取得commandではない。uploadはalways・2分・90日保持、job50分と既存のselector・待機・判定を保つ。compactの不存在やupload成否を、23件や374B受入の代わりにしない。

旧技術候補のSwift／Bash／Node構文検査、診断contextへの機械的再bind、compact upload差分の独立レビューは、それぞれの静的な範囲の証跡である。現組合せのSDK build・実UI・raw23件・canary／pbpaste・artifact実取得の結果ではない。本記録の新しい確認はMarkdown1件のlint、JSONとリンク・保全確認だけで、新test・SDK・GET・benchmark・生成・依存導入・API/Git変更は行わない。

index本体は書き換えず、Copy専用段落を追加するアンカー案だけを私有JSONに残す。Rootがfresh actualmainの前後blob・非所有差分・固定case集合を再bindし、最終内容とHostedを別にレビューする。IOS-25全体、他のcode block・空・inlineのコピー、初回offline・legacy移行・実機pasteboardは未完了で、Reading／Coreの受入や凍結性能へ結果を付け替えない。

## 2026-10-28: コピー操作の1件診断と通常workflow復元の準備

上のid-only Source・candidate・未確認値は、それぞれの時点の履歴として保持します。この追記は固定head `592cea1e7bc286de76c551ff61bc2218a65671af` / tree `760576fc6b3ddd8c0b60d58034fed311c03ab1a8`の1件診断です。現在のSwift2ファイルはreader62160BとUI試験69466Bで、コピー済みAX valueと公開buttonタップ後のpredicate待機が追加されています。旧「識別IDの2行だけ」という説明を現在のSource差分へ転用しません。

[診断run40605473931](https://github.com/pero3dev/ai-agent-library/actions/runs/40605473931) / job122543761239は、consoleで対象caseのStarted1・Passed1・Failed0、147.483秒、xcodebuild exit0でした。Rootが取得したraw test treeもplan・bundle・suite・caseの4段階がPassedで、iOS18.5 / iPhone16の同じUUID `F0E646EF-4792-4F36-B48B-EC89B3A6B73B`へ対応します。公開buttonのTapと`value == "コピー済み"`のpredicate trace、固定Sourceの未コピーassertと待機を含むcase Passedを確認しました。AX valueだけの独立したraw dumpではありません。

contextには公開記事数199とTEST_RUNNER_付き環境名を設定した記録があります。一方、Runnerが受信した環境値そのものの直接dumpはありません。setUpのcount guardと記事数assertを含むcaseがPassedした事実を別の根拠とし、設定値をそのまま受信証跡へ読み替えません。

### byte観測の到達点と欠測

- liveは5attempt、完了capture4回で、同一値をまとめた変化レコードは78Bのseed canary1状態だけです。5回目はcommand timeoutで停止・欠測となり、失敗票のelapsedは10.38524741599997秒、対象processの回収を確認しました。phaseはcontrollerがraw markerを観測した区間であり、端末上の厳密なcase時刻ではありません。live中のコピー成功は推測しません。
- Xcode終了後のproducer報告はexit0・374B・SHA-256 `e29cb525957fb4bd72350927aa1cf47659da4aef9964ecbf0d43edb4dfe2cee8`、expected一致true・canary一致falseでした。Rootとこの記録作業は、committed期待TXTの長さ・SHAが同じであることを別途確認しました。
- 診断artifactはraw clipboard全bytesを保存していません。従ってproducerのRAM比較報告と期待TXTの照合を、独立したraw 374B全bytes受入とは区別します。通常Full workflowでのstrict sameUUID/canaryとraw actual374の確認は未完了です。

artifact12781436776の圧縮39145BはRoot readerが全digestを照合し、固定6メンバーのCRC/SHAを確認しました。記録には小さな要約とhashだけを残し、453135BのlogやZIP・clipboard本体を転載しません。Root取得票のSHA-256は `1ce0788e70fec73566dfca623d0916a038928a06d666f2f1acd63ad8deee063a`、observer票は `75a2c916dfcb58dda13bca8daecc18c508325cd33b5c4cbccadcc30d5f2aa2b4`です。

### 最終復元と残件

固定592では、Common run40605473929の必須9件と、本文更新後の政策40605485286・40605485292を合わせた11件がAPI metadataで成功でした。別SDK26 run40605473950 / job122543761452もAPI metadataで成功でした。この票はraw log GET0・artifact GET0で、新しいNode件数・Archive記事/音声/bytes・Privacyやrunner checkoutの実監査を主張しません。1件診断のraw結果とは証跡を分けます。

Docs290の通常統合で採択したmain `33702453d3805024f0763ef39acece7a4ff26b41` / tree `3b29b3db0b16dba530b9a86cbcb0d4a0fe262eed`は、Copyの最終採択とは別です。次はこのmainへの再結合と、元Full workflow25561B / SHA-256 `e7c8713374cfcb849a236042aa00d5e4dfa0766412e0653cb60106e5c6c17112`への完全復元を予定します。新head・新head CI・normal23・strict sameUUID canary/raw actual374・Swift単体・Full Releaseの結果は、同名JSONでもnullのままです。1件診断やAPIの緑を代わりに使いません。

実機・VoiceOver、他code block・空/inlineのコピー、初回offline・legacy移行とIOS-25全体は未完了です。TODO32行・完了12行を保ち、この記録作業では2記録の追記だけを作成しました。索引の再結合とSource/WF復元は別作業で、新SDK・試験・通信/API・共有checkout変更は行っていません。
