# Native CIの専用Simulator所有と準備のmain400結合

2026-11-02の未結合Code4・記録テンプレートr2である。Native helper/unitだけをcold Code2へ更新し、workflow c16bとReadingRecovery診断0114は全byte保持する。実親SHA/tree/count・公式Root attestation、将来Source8の実owned/newfilesはROOT_REQUIRED。Source8や索引全文/mapは生成せず、準備時点の実main057とPR326 Draft b8dを区別する。以下のr1本文は過去のfreezeを保持する履歴で、現在の準備はこのr2区画による。

## r2の読み取りと所有証明

prepareの5固定readonly role（runtimes/device-types/devices-before-create/devices-after-create/devices-after-boot）だけを、残り共有210秒へclipした各最大60秒の読取へ変更する。Nativeの実receiptがschema/binary/fixed argv/期限内/上限/canonical Base64/長さ/SHA、status null・SIGKILL・error_code ETIMEDOUT・非空かつboundedな実error・output_complete falseを満たす場合だけ、別名timeout-retry-1で1回再試行する。未知失敗・malformed successful JSON・late返却を成功やretry根拠へ読み替えず、3回目はない。期限をresetせず、最悪時間で必ず完了する保証でもない。

intentは採用したprecreateのbase/retry1 label、既存raw stdout SHA、新canonical receipt SHAを結ぶ。cleanupは採用receiptと、retryの場合は元の厳密なtimeout proofも照合し、未知・改変・stale・beforeUUID・late・上限違反をmutating command前に拒否する。context/run/attempt/source/token/name/create UUID/外部step UUIDと前在除外を保持する。canonical SHAはraw fileの空白署名や悪意ある同一UID改変への防御ではない。ready保存前後も同じ期限を確認し、部分的なready fileが残ってもprepare exit失敗ならhandoff成功と扱わない。

mutating create/boot/bootstatus/shutdown/deleteのcapとretry0、prepare210秒/step4分、cleanup90秒/read15秒/retry0/step2分、元job40分とNative8/Full26・collector・Releaseを保持する。サービス再起動、Runtime導入、既存Simulatorへのerase/deleteや別端末fallbackは追加しない。

## r2の保存済み検証と未確認

cold Code2の実Node24.22.1による新fake controlsは80件成功・失敗0・skip0、0.4703205秒で、旧34を再実行した結果と新46から成る。controls/result.json SHAee836b18d7aafd7a50e8abc59d0682ed91be4abe9222642eefedd095cb91ca6fとSourceMF/pinsへ結合する。このr2準備では再実行しない。旧34の過去の結果と初回78・spec/TAP整形停止を別履歴として保持し、old成功を新実行の代用にしない。cold独立IRはP1/P2=0である。

128KiB境界はrunnerとfake executorによる検証だが、2MiB/64entryはinjected store拒否で、実diskStoreの新実行ではない。実diskStore～CLI/environment tailはbyte同一のまま、そのsampled-capやsync service、保存失敗でfailure記録も残せない場合の限界を保つ。実CLI/OS timeout救済、作成/起動/削除、SDK/UI/Hosted、guard新failurebranch・恒久安定と全cleanup成功は未受入である。

## r2準備時点のhead別履歴

実main057 NativeのUI6成功2失敗と別Full26/Common9/deploy成功、旧PR326 efbの初回6成功3失敗、2bcの7成功2失敗、374の8成功1失敗をそれぞれ保存する。374はNative8とFull26等に成功してもRevision1件が55.789秒で停止し、A-before-save一値だけでB未到達だった。374 observer MFc80968836d56ab822b97be2d0e27d3c824f5b87b7975106975aad6d2eb4e58f4へ結合する。通常toolbar Menu AXと別restore AX/capfailは未解決のまま、このCode4の修復やcoverage受入へ広げない。

新PR326 b8dのfiltered setupは保存Root discovery時点でCI9系統がqueued/in-progressで、まだ新head全成功や新Revision受入とはしない。mainは057のままで、b8dをactualmainへ代入しない。PR326通常統合後、Rootがfresh official実mainと全before tuple/mapを確認して初めてSource8を生成・計数し、final IR/形式/common/必要SDK・CI/通常PRへ進める。prospective8path/newfiles4という旧予想は実map採択前の仮数である。

App0.2.28（30）/PBX/保存契約/TODO32行14完了、Original110/Content626と全旧packetを保持し、この準備ではGit/API/SDK/Simulator/new tests・managed編集・削除・既存sim操作を行わない。

## r1テンプレートの保存履歴

## Native CIの専用Simulator所有と準備

2026-11-02の未結合Code4と記録テンプレートである。既存Native workflow/helper/unitのCode3を3ファイルともbyte保持し、ReadingRecoveryUITestsのfirst-failed guard診断Code1を同一で加える。実親SHA/tree/countと公式Root attestationはROOT_REQUIREDで、Source8はまだ生成していない。準備snapshotは実main057、PR326 Draft efb→057であり、efbや仮想mergeをactual mainへ代入しない。PR326実main後にRootが初めて全before tupleへfresh-bindする。

### main057の結果と過去の履歴

[main057 Native](https://github.com/pero3dev/ai-agent-library/actions/runs/41372708102)の初回は単体278件中276成功・2skip・失敗0、元のUI8件が6成功・2失敗でReleaseはskipされた。exportは114.78秒、Browseは138.67秒、最終getterは147.53秒で、共有30秒期限の超過と整合するが、元compound guardのkey/shapeと排他的原因は観測していない。restoreは別caseのlibrary-article-count hittability/activation point異常で、exportとの因果は不明のままにする。

同じ057の[Full](https://github.com/pero3dev/ai-agent-library/actions/runs/41372708108)は元の一意26件と独立した374-byteコピー、Bの全199記事/audio1/625files/noFixtureのReleaseに成功し、[Common](https://github.com/pero3dev/ai-agent-library/actions/runs/41372708204)の9検査とdeployも成功した。Native2失敗は残り、全mainpush受入やこのCode4の効果へ代用しない。

### 旧sourceの保存履歴

[旧mainDaのNative run](https://github.com/pero3dev/ai-agent-library/actions/runs/41339326495)は、初回に既存名のdestination解決でexit70となり、XCTestは未開始だった。条件を変えない1回の再試行では単体278件が276成功・2skip・失敗0、UI8件が7成功・1失敗だった。復元picker前の確認タイトルが元の5秒以内に見つからず、Release監査には到達していない。初回の宛先問題と後の確認タイトル失敗は別の事象で、原因を同一視しない。詳細は[既存の診断記録](ios-recovery-confirmation-diagnostics.md)へ残す。

一方、確認失敗時診断の採用後の[main0a47 Native](https://github.com/pero3dev/ai-agent-library/actions/runs/41349865521)は初回で単体278件中276成功・2skip、UI8成功と代表3記事のRelease監査に成功した。[Full](https://github.com/pero3dev/ai-agent-library/actions/runs/41349865506)もA18＋B8の元の一意26件、独立した374-byteコピー内容一致とBの全199記事Releaseに成功し、[Common](https://github.com/pero3dev/ai-agent-library/actions/runs/41349865669)の9検査とdeployも成功した。これは別sourceの保存済み観測であり、今回の専用UUID準備や新しい確認失敗診断分岐の成功ではない。成功時にcollectorがskipされたことも失敗添付の収録確認に数えない。

### 同一保持するCode3と保存済み検証

既存Xcode16.4・SDK18.5を保持し、一意でavailableなRuntime18.5とiPhone16型を確認する。不在・重複・矛盾はcreate前に失敗させ、SDKやRuntimeを導入したり機種・OSを切り替えたりしない。

作成前に全Runtimeの既存UUIDを固定し、repository/job/run/attempt/source/checkout/tree/tokenを結ぶintentを保存する。createは1回だけ行い、成功終了・単一UUID stdout・前在UUID除外を満たす新規端末だけを認める。現在のname/Runtime/available、任意の型fieldがある場合の一致とboot後のBootedを確認してから、同じUUID destinationを元の単体とUIへ渡す。

cleanupは外部stepのUUID/token、context、intent、成功create receipt、前在一覧と現在metadataがすべて一致する作成所有端末だけをshutdown/deleteする。既存端末・未知所有・証明不足は操作しない。boot途中の失敗でも成功createが証明できた場合だけ片付けられる。既存Simulatorのerase/delete、全端末操作、サービス再起動、Runtime導入は追加しない。shutdown/deleteの失敗や残存は成功へ読み替えない。

prepareは共有210秒、cleanupは別共有90秒で残時間を子commandへ渡す。各command合計出力128KiB、各JSON512KiB、証跡合計2MiBを上限とする。entry数の実装上の数学的上限は64で、旧準備READMEの「64files未満」を厳密な境界の受入として転用しない。workflowはprepare4分・cleanup2分、元job40分を維持し、元の単体/UI選択・並列抑止・Release・全uploadとcollectorを保持する。

### 保存済み検証と限界

同じCode3のRoot実Node24検証は、injected executor/controlの34件が全成功・skip/失敗0で、helperとunitのJS構文2入力も成功した。Code3独立レビューはP1/P2=0だった。本パケットの作者は再実行せず、この保存済み結果と各SHAへ結合した。34件は実CLIのevent/Git/filesystem/GITHUB_OUTPUT経路や実xcrun/simctl/Runtimeサービスを実行していない。実作成・起動・削除、単体/UI/ReleaseとHosted効果は最終sourceで未確認である。

共有期限・出力上限は、呼出し周辺・中間allocation・サービス処理の全時間や全子孫の静止を保証しない。job強制終了、create完了後のUUID／step出力保存失敗などでは、証明不足としてcleanupを拒否し端末が残る場合がある。同jobが全信頼入力を能動的に改ざんする状況への暗号学的所有証明でもない。恒久安定や全cleanup成功は主張しない。

### 同一保持するguard診断Code1

currentReadingExportPickerの既存compound guardを同じ順序に分け、既存failure contextへdeadline-before/count/key/browse-shape-requires-back/browse-shape-root/deadline-afterのfirst-failedタグを加えるだけである。共有30秒、全witness/getter順と回数、短絡、成功時の時計2読取、元assert/test body/Native8/taps/Cancel、既存failure capture/lifetimeを保つ。後続の未評価条件を真と断定しない。

Code1独立IRはP1/P2=0。初回xcrun parseは30秒timeoutでsyntax結果未確認として保持し、Root許可の既存swift-frontend直接parseを同一候補に1回だけ行いexit0/約6.214秒だった。これは構文だけでSDK typecheck/UIではない。新タグの実failurebranch出力は未受入、restore AXは別未解決で、共通isHittableは変更しない。保存Root Node34とCode1 syntaxを新ownedSim/OS/UI効果へ合算しない。

### 次の小単位と残件

所有候補はCode4、同記録MD/JSONの2、索引挿入2の計8パスである。今回は4コードの正逆と記録/挿入テンプレートだけを用意し、索引全文、Source8全map/tree/count、Git objectは生成しない。実親/公式証明はROOT_REQUIRED。RootがPR326の通常統合と実mainを確認後、最新の全before tupleへ再結合してSource8を生成し、旧index全文と他者変更を保持して独立finalreview・共通/形式検査・通常PR/必要CI・通常mainへ進める。mainpushは別確認とする。

Native workflowの元job40分、prepare210秒/step4分、cleanup90秒/step2分、元unit/UI選択とNative8、Full26、App0.2.28（30）/PBX/保存契約/TODO32行14完了、Original110とContent626を保持する。既存端末やユーザーファイルの削除・既存Simulator操作・サービス再起動・downloadは追加しない。新ownedSim・guard branch・新SDK/UI効果、実機/provider/VoiceOver、IOS-11/23/25全体は未完了である。

## 2026-11-03追補: 実main400への結合

上記r1/r2の全文は各準備時点のfreezeを保つ履歴です。未結合、ROOT_REQUIRED、b8dのCI9進行中という記述を現在の状態へ読み替えません。2026-11-03のこの追補では、PR326を通常保護のsquashで統合した実main `400b2adf66bdf1b953ba89ec57b71f3f4ef2352d`、tree `1630b86a577aa2724569c2940ce9afa7d60ea989`、追跡2885件へ結合しました。公式Root proofのmanifestは `1a6ca807b8b15e49645b1002ba5df13b253a6fb4bd7f540959681f8d23e9c57e` で、承認head e6と全mode/type/blob tupleが一致します。managed worktreeのclean detached状態と、Code4の実beforetupleを読み取りで確認しました。

Native workflowとReadingRecovery診断は実親でも元beforeと同一で、候補Code4はまだ採用されていません。helper/unitと記録2は未存在でした。実差分は8パス、新規4パスです。索引2本は実main400の全文を保ったまま挿入し、TODO32行14完了を保持します。独立した変更理由に合わせ、workflow/helper/unitの3本、その後にguard診断1本と記録・索引4本という2段階を準備しました。私有の中間tracked2887・最終tracked2889とtreeは投影値で、Git object・commit・branch・PRは作成していません。

履歴の続きはRootの固定CI context（as of UTC `2026-11-02T16:05:47Z`、SHA `c42eaebf02d94301a51c84108cc736230ec4b0bfd276224d37cda4ba7e546f1c`）へ結びます。b8d初回は6成功3失敗で、Revision UI1件87.796秒の成功後にcontainer path比較で停止しました。別のRecovery retry2成功は初回失敗と分け、安定化やSource修復へ読み替えません。f13は5成功1失敗3cancelledで、profile path guard失敗とSource1記録修正に伴う停止を保持します。

最終e6のPR326は9系統が成功し、Native UI8・Full UI26・Runtime26代表3件と、各単体278件中276成功2skipを確認した別sourceの結果です。制御した改訂1ケース130.456秒は全5phaseと実container変更下のA保持/B選択に成功しましたが、1記事・audio0・PNG0の受入に限ります。通常toolbar Menu AXは未解決で、今回のNative専用UUID/timeout救済/guard診断の効果へ転用しません。

同じ固定context時点でmain400の新pushはCommon8成功・build進行中、Native/Fullも進行中でした。PR成功を新mainpush成功へ代用せず、後続結果はRootが別に観測します。この準備は候補コードを実行せず、既存cold80・構文・個別IRを再実行しません。cold80は旧34再実行と新46のinjected executor/clock/in-memory storeであり、2MiB/64entry拒否は実diskStore受入ではありません。

Code4の全byte、r2 JSON全key/valueのsnapshotと内包するr1、Markdownの全旧本文、既存索引本文を保存しました。App0.2.28（30）/PBX/保存契約/Content626と他者の作業を保ちます。最終Source8レビュー・共通/形式・必要SDK/CIと通常PR/mainはRootの後続工程です。新実OS rescue・所有端末の作成/起動/cleanup・guard failurebranch・恒久安定、実機/provider/VoiceOver/最低OS、IOS-11/23/25全体は未受入です。

## 2026-11-03追補: Native一覧読取の出力上限

ここまでの全文は公開PR327の親head `d1518f226dad33917789cef372767d5a33dd7c41` に入った準備履歴として保持します。この追補は同head/tree `9d9af305020990bbf205c16b6876a27ec0a373eb`・追跡2889件へ追加する1コミット、Code2と既存記録/索引4本のSource6私有準備です。実main400との差分全体は累積8パスとして別に扱い、新しいmainやHosted効果の受入とはしません。

Native初回run41483631222は、prepare先頭のruntimes読取でstdout133117Bが旧131072B上限を2045B超え、status null/SIGKILL/ENOBUFS、output_complete falseでした。timeout設定は60000msですが、typed ETIMEDOUTではありません。読取1回で再読なし・UI0・cleanup not-created/UUIDnull/oktrueを保持します。stdoutをJSONとしてparseできても、上限超過の不完全出力を完全成功へ戻しません。診断SHAは `d0e6692ec65e9cb4aa0a8a68444e5e60ce73686822ae141327135fb84077bdb6`、nested context追補SHAは `3a8088deea9fae41db09871257cbb11f5af23eb6aad0bcb63dd0b839205b7a69` です。

限定診断artifact13160424324（11118B）のGETでは全ZIPのstream/readback SHAと、選択6JSON/180619BのCRC/SHAを検証し、context・prepare-failure.context・cleanup.contextがsource/run/attemptへ一致しました。0.480519秒でown childを回収し、TERMは使っていません。retry receiptだけがなく、success_inputs_completeはfalse、runtime acceptanceもfalseです。大きいfull artifact13161866666はGETしていません。reader SourceMF e12e1d.../IR5e6d...の閉じた範囲を維持します。

修正は厳密なreadonly inventory3 argv（runtimes/devicetypes/devicesのJSON一覧）だけを512KiBへ揃え、他commandの128KiB、全期限、mutator retry0、所有証明・SHAと非timeout再読拒否を保ちます。512KiB rawのBase64が約699KiBになるため、diskStoreのreceipt read/writeを1MiBへ同期し、証跡総量16MiB・64entryを上限にします。上限は瞬間的な全allocationや全serviceの静止を保証しません。

workerが封印した最終Code2 SourceMF `3e5547c5aba6c6cf39f7158a1b57ca53c8af3fedff9e90001ea2c1025e5c1588` を全byteで受け取ります。最終Darwinの専用unitは97件（旧80再実行＋新17）が97成功・失敗/skip0、wall 0.306476834秒です。helper/unitの保存JS構文2入力はexit0で、helper不変の最終追補ではunit構文だけを再確認しました。初回97成功のsource/logは別に保存し、その後、既存CLIのDarwin制約に合わせmain→diskStoreの2件だけへ他OS skipを明示した最終sourceを限定再検証しました。新17のうち15はplatform共通、2はDarwin専用で、他OSの95成功＋2skipは想定に留め未実行です。fake executor/clockの制御に加え、Darwin専用2件はstubbed builtin spawnSyncでmainから所有する実FSのdiskStore書込/cleanup読取とreceipt超過拒否を通しています。実xcrun・simctl・GitやSDKは実行していません。 このbinderは試験を再実行しません。実simctl・SDK・Simulator lifecycleや新head Hostedの受入ではありません。

親d151初回CI（MF `17f131d7db68a6dad04969720ebe5406137785f449d18c38183e424938b7710d`）はCommon/SDK26/RecoveryとFull26、Full Aの単体278件中276成功2skip、374Bコピー/Release、必須11のhighest snapshotに成功しました。Nativeの上記失敗と、R26初回run failure/job cancelled/UI不明は残します。R26のraw取得1回失敗は再GETせず、同一headの通常retry2は別の進行中snapshotとして保持し、この修正の効果へ混ぜません。

旧Markdown全文・JSON全key/valueと索引本文/TODO32行14完了、App0.2.28（30）、workflowと製品ソースを保ちます。Source6最終独立レビュー・共通/形式・新head Hosted・通常PR/mainと別mainpushは後続です。通常Menu/restore AXとcapfail、実機/provider/VoiceOver、IOS-11/23/25全体は未完了です。この私有準備では外部publication・Git/API・SDK/localUI・ユーザーデータ操作を行いません。
