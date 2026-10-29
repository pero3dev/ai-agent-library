# iOS 17.0の機能CI試行

## ダウンロード進捗による収集上限の停止

起動後の一覧を限定回復するhead `003de3ea2c7f796f6a7a8c19a569b58064a13937`の初回専用run `40795867714`／job `123192082726`は、別の箇所で失敗した。downloadの通常進捗がCRで繰り返され、観測4,194,565 byte、保持stdout 4,194,293 byte・stderr 0となった時点で、元の4MiB出力guardが`output-cap`としてSIGKILLした。107.576秒はdownloadの10分枠より前で、全体125.561秒も19分内だった。取得処理が終端エラーを返した証拠ではなく、保持した末尾4,096 byteでは78.3／78.4%の進捗反復が確認できる。全4MiBが重複だったとは扱わない。

この実行はimport・所有device作成・起動後の一覧回復・機能検査に到達していない。functionalはnull、受入false、cleanupはnot-createdで、前の回復処理が有効だったかもまだ分からない。初回失敗と小さい診断の独立レビューは保持し、同じheadのjob再実行は行わない。

次の候補はdownloadのxcodebuild引数に`-quiet`を1個加えるだけとし、4MiBの出力上限やdownload 10分・work 19分・cleanup最大2分・機能集合・判定条件を維持する。このMacのXcode16.2付属`xcodebuild(1)`では、quietは警告とエラー以外の出力を抑えるoptionと定義されている。ただしHosted Xcode16.4のdownloadに実際に効くかは未確認で、新headの実行で確認する。ローカルではruntimeを取得・導入せず、quietの効果を確かめるためだけのOS導入もしない。[Appleのcomponent取得手順](https://developer.apple.com/documentation/xcode/downloading-and-installing-additional-xcode-components)が示すdownload／importの経路は変えない。quiet Source1は1引数10 byteの追加だけで、逆変換が親Source全byteと一致した。既存Node17件と構文検査、Source1の独立レビューP1／P2なしを確認した。親003の全2,810 blobを照合した隔離コピーで、新しい共通1174件中1159成功・15skip・失敗0、約41.840秒を確認した。この新しいnpm run checkはexit 0で、前の候補にあった記録空行エラーとは別の実行である。Source1は検査後も同一で、追記した記録4だけを限定静的検査する。最終5ファイルの独立レビューと新headのHostedを後続で確認し、以下の過去の候補・pendingはそれぞれ作成時点の記録として保持する。

## 初回Hostedの失敗と端末一覧だけの限定復旧

PR #299の初回head `f5285cfa5188efae4fbf931276e94dcdedb043dc`では、専用run `40790439617`／job `123174049002`のattempt 1が失敗した。CLIによるiOS17.0のdownloadは63.696秒・importは36.008秒でexit 0、inventoryでは17.0／21A328がavailableだった。新規所有iPhone15のbootは2.089秒、bootstatusは215.446秒でexit 0とFinishedを返した。ただし、その直後の厳密なBooted状態を確認する一覧は取得できず、アプリの機能テストはまだ実行していない。

失敗したのは`devices-after-boot`の`simctl list devices --json`で、名目60秒のintentに対し79.650秒でSIGKILLとなった。code null・spawn error null・stopは`command-or-shared-deadline`・出力0 byte・cancelなしで、summary全体467.258秒は19分の共有枠内だった。timerからcloseまでの超過19.65秒の理由や、一時的なhost障害という原因は確定しない。cleanupの一覧は33.191秒で成功し、所有deviceのshutdown・deleteと削除後一覧も成功した。functionalはnull、受入はfalseである。

この初回失敗を保持し、起動後の最初の一覧がこの特定の時間切れになった場合だけ、新しい一覧を1回取得する候補を準備する。最初と再取得のintent・exitは別に保存し、再取得も60秒・既存19分共有枠内とする。cancel・spawn error・出力や容量制限・他のcommand・不正JSON・所有不一致・Booted以外・2回目失敗には広げない。download・import・boot・機能テストの再試行やOS17.5へのfallbackは追加しない。新headの実Hosted効果は未確認として残す。 Source2の合成Node検査は旧9件の全文をprefixとして保ち、新8件を加えた17件が約0.448秒で成功した。実runtime・ネットワークは使っていない。新しいreceiptのresource failureは最初のstop理由の後でも別に記録し、再取得には明示的なfalseを要求する。旧receiptから後発のresource事象が絶対になかったとは証明しない。Rootは親f528の全2,810 blobを照合した隔離コピーへ6ファイルを重ね、共通1174件中1159成功・15skip・失敗0、約46.915秒を確認した。lockfile不変で準備済み依存を再利用し、外部通信を禁止してlocalhostの試験だけを許可した。初回npm run checkは単体とicon成功後、Root記録のMD012でexit 1となった。余分な空行1個だけを直し、単体を繰り返さず残り6工程をすべて成功まで明示実行した。Source2の独立レビューはP1／P2なしで受入済み。Source2は共通検査後も同一で、記録4の追記だけを限定静的検査する。最終6ファイルの独立レビューと新headのHostedは後続で確認する。

同じheadで発火した既存の欠損／復元UI専用run `40790439478`も初回失敗した。Stage Fのxcodebuildは180秒で停止し、保持された出力に対象ケースの開始・完了はなく、後続のapp container照会も20秒で停止した。Stage Rの代表3記事UI1件は126.155秒で成功し、所有deviceのcleanupも完了したが、専用検査全体の成功ではない。Source変更後の通常実行を優先し、この旧headのjob再実行は行っていない。本文の不具合や待機上限延長を必要とする証拠とは扱わない。

親main cc2のpush後Common・Native・Fullは、その後3系統すべて初回API成功となった。新しいrawケース数・性能値の採取ではない。main cc2から実ビルドした自分用0.2.23（25）はunsigned／既存無料Team署名済みの候補と独立監査を保持し、実機への上書き・保存維持・VoiceOver・性能と最低OS全体は未完了のままとする。以下の準備段階の未知・pendingは当時の履歴で、この追記の観測と区別する。

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
