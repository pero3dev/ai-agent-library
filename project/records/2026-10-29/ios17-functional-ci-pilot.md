# iOS 17.0の機能CI試行

2026-10-29。状態は実mainへの統合準備で、iOS 17.0の実行成功ではない。ユーザーの継続した自律実装依頼に基づき、最低対応OSの機能確認に進むための小さい専用CIを準備する。実機操作は未完了のまま進めてよいという許可を使い、本CIでは新しい課金・契約・署名・ローカルOS導入は行わない。[対応方針](../2026-10-28/ios-personal-use-scope.md)と[完成版の計画](../../plans/engineering/ios-app-completion.md)の未完了状態を保つ。

## 基準と既存の受入

基準はPR #298を通常保護で統合したmain `cc2f0aec9e6d741a431dd1fc02250439b8dd0c27`、tree `e1647536dbf7e040e2f3b36cd4f7b0647e86272a`。承認Source `2037565e2ab78bcaf14589322bc8695e93b2d7cf`と全2,805パスのmode・type・blobが一致し、App0.2.23（25）の本文図プレビューは採用済みである。[画像候補の準備記録](ios-figure-preview-images.md)は作成当時の状態として保持する。

採用SourceのPR CIは6系統すべて初回成功。Nativeは単体245件（skip 2・失敗0）、NativeInline46件の追加9件も各1回成功し、UI5件が成功した。Fullは同じ単体245件と、NativeReader2・PublishedReader15・ReaderViewportGeometry6の一意23件が各1回成功した。アプリ操作17件と座標判定6件を区別する。Fullのline 15780でstrict guard後の374 byteコピー成功出力を確認し、先行するスクリプト表示を成功に数えていない。この記録作成者が新たにpbpasteの生bytesを取得したという意味ではない。Debug／Release資源監査は公式APIのsuccessで、App全体の独立ダウンロード監査ではない。

ローカルunsigned Release 25はXcode16.2／iphoneos18.2で39.404秒、199記事・422PNG・音声1本・Content626ファイルの監査まで成功した。以前に生成済みのContentを再利用したビルドで、原文からの新生成や実機・署名更新・VoiceOver・性能比較の成功へ広げない。

main反映後に始まったCommon `40786500129`、Native `40786500120`、Full `40786500147`は、PRの票と別に追跡する。Rootの23:35:02Zの観測ではCommonがdeployを含む10job API成功、NativeとFullがUI段階である。新たな実件数・数値を取得したものではない。親main9a2のFullは初回と条件不変の1回のretryの双方でdestination lookupがexit 70となり、対象ケースの前に失敗した。原因は未解決で、画像変更が原因を直したとは扱わない。

## 所有範囲と機能subset

候補は新しい専用workflow・standalone driver・Node検査の3ファイルと、この記録2本・索引・計画の計7ファイル。App、PBX、既存workflow、既存テストは変更しない。TODOの32行・完了13行は全byte保持し、IOS-15等を完了へ変えない。

専用workflowは自身の3パスを変更する通常PRで自動起動し、手動triggerを併設する。現行の利用可能な接続toolにはworkflow dispatchの変更操作がないため、Rootが通常PRを提出する経路で実pilotを開始する。本準備ではAPI操作・Git変更・外部ネットワークを行っていない。

標準public `macos-15`と既存のXcode16.4を使い、実inventoryでavailableなexact iOS17.0とiPhone15のdevice typeを照合する。iOS17.5へのfallbackはしない。現在のmacOS15 runnerはPR298 Nativeの実headerでarm64を確認したが、未来のrunnerでもdriverがarchitectureを確認し、x64等なら失敗として止める。これもiOS17の実行証拠ではない。

機能対象は現在のSourceにあるNativeInlineTests全46メソッドと、`NativeReaderUITests/testThreeArticlesHaveNativeBodyText`のUI1件だけ。Source由来の正確な名前集合をraw結果と照合し、欠落・skip・重複・他OSの結果を成功にしない。driverには旧Source37件の許容も残すが、このmain基準で期待するのは46件である。全単体245件、全記事・全機能、全OSの受入ではなく、最低iOS17全体やAppMemory／Clockの17用性能契約は採択しない。

## 取得・実行・後片付け

既存の一次調査を再利用し、必要なら公式CLIの`-downloadPlatform iOS -exportPath ... -buildVersion 17.0`と、所有領域内の単一DMGへの`-importPlatform`を試す。現在も匿名で取得できるか、Xcode16.4でimport・bootできるかは未確認。認証・新しい契約・FirstLaunchが必要なら失敗と診断を残し、操作を代行して承諾しない。`-checkFirstLaunchStatus`だけを確認する。

checkoutはPR headへ固定し、公開repo・contents read・資格情報を残さない設定を使う。作成前のUUID集合とrun／attempt／head・nonceを記録して新しい専用deviceを作り、runtime・model・available・UUIDの所有を確認する。所有が証明できない既存deviceを操作・削除せず、global resetはしない。import済みsystem runtimeも削除しない。

| 提案した上限 | 値 |
| --- | --- |
| job／driver step | 25分／22分 |
| driver work＋cleanup | 19分＋最大2分 |
| download／import／boot | 10分／5分／240秒 |
| 実空き容量floor／所有領域cap | 2GiB／14GiB |
| 単一DMG／command出力／保存evidence cap | 12GiB／4MiB／2MiB |

上限は実測した必要量・所要時間ではない。stage最大値の合計がwork枠を超えるため、残時間でcommandを抑止する。空き容量は各command前後と実行中の実値を確認し、runnerの一般的なディスク仕様を空き容量とは仮定しない。filesystemのblock、観測間の増加、外部serviceまで含めたhard quota・厳密なwall-clock保証ではない。

v1の独立レビューで見つかった2点をv2で限定修正した。通常SIGINT／SIGTERMの最初の種類と元の失敗を保持し、activeな所有process groupを停止してfinallyのbest-effort cleanupへ進める。既知のcancel後は新しい通常commandを開始しない。cleanup中の通常signalでcleanup childを再度停止せず、成功してもcancelや元の失敗を消さない。cleanup deadlineはglobalな21分とcleanup開始から2分の早い方とし、早期失敗時の210秒枠を認めない。SIGKILL・runner強制終了・Node event loopやfilesystemのblock時のcleanup、launchd側の停止は保証しない。

容量制限した診断・receipt・機能JSONだけを90日保持する。URL query・認証情報・emailを伏せる処理を使い、DMG・App・DerivedData・xcresult・大量raw logはuploadしない。失敗しても診断を保存し、未完了として残す。

## 確認済みと後続

v1のSourceと最初のconst重複によるsyntax失敗票は元の凍結記録を保持した。v2は既存6件を変えず、cancel state・cleanup開始期限・所有ローカルNode processへのSIGTERMとcleanup中SIGINTの3件を加え、Macの合成検査9件と構文・YAML・actionlint・Markdown検査が成功した。process groupを使う例だけWindowsで明示skipし、純粋なstate／deadline例はWindowsでも続ける。iOS・Simulator・ネットワークは使用していない。

v2 Source3の独立レビューは、2件のP2解消・追加P1／P2なしで受入済み。workflow全byte、旧6検査、2修正を除いたdriverのv1逆変換を別人が照合した。共通検査は実maincc2の全2805blobを確認した隔離コピーへ7ファイルを重ね、1166件中1151成功・15skip・失敗0、約46.571秒で成功した。lockfileが一致する準備済み依存を再利用し、実runtimeは使用していない。追記した記録4だけは後続のMarkdown・相対リンク・配置・Git形式の限定検査で確認する。

本7ファイル候補の最終独立レビュー、通常PR、正確な新headでのHosted download・import・boot・機能実行、必要CIと通常main統合はRootが後続で行う。Source3の受入を実pilot成功へ読み替えない。詳細なhashと区分は[機械可読記録](ios17-functional-ci-pilot.json)を参照する。
