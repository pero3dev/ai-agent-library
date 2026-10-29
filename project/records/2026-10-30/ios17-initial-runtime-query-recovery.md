# iOS17初回runtime一覧だけの限定回復候補

2026-10-30。自分用iOSアプリを優先度順に自律実装し、commit・PR・通常main統合へ進める依頼に基づく。所有範囲はdriver・Node検査と本記録2本・索引・完成計画の6ファイルで、実機確認は未完了として進める許可を引き継ぐ。新しい契約・課金・配布やローカルOS導入は含まない。[39GiB試行の記録](ios17-compilation-cache-budget.md)を当時の準備・判断として保持し、全体の未完了は[完成計画](../../plans/engineering/ios-app-completion.md)で追跡する。

## 実276の初回停止

作者head `276fb067aee86363e204e0fe0f41c84a1281c125`の[初回Pilot run 40916070056](https://github.com/pero3dev/ai-agent-library/actions/runs/40916070056/attempts/1)／job `123596511199`では、最初の`xcrun simctl list runtimes --json`がfull60,000msを割り当てられ、60.048205秒で時間切れとなった。codeとerrorはnull、signalはSIGKILL、stopは`command-or-shared-deadline`、resource failureはfalse・cancelはnull、raw／captured／retained／uncapturedはすべて0、output上限flagsはfalse・completeはfalseだった。

`first-launch-status`のexit 0は確認したが、CoreSimulator serviceがwarmまたはresponsiveだった証明ではない。cold initializationは仮説であり、deadlock等の原因も特定していない。download・device作成・build・機能検査へ進まず、cleanupはnot-created、全体64.626829秒、実47件は未受入だった。39GiBの有効性や十分性もこのrunでは評価していない。取得元とraw／ZIP等のdigestは[機械可読記録](ios17-initial-runtime-query-recovery.json)に残す。

## 初回読取に限る追加観測

Rootが採択したのは、上のexact structured silent full60秒失敗後だけ、別名`runtimes-before-recovery`で最大1回・full30秒のmetadata読取を許す方針である。初回60秒は維持し、追加30秒は既存の共有19分内から使う。job・download・import・device作成・boot・build・testの再試行や、一律のtimeout引上げではない。service kill／restart・runFirstLaunch・認証／契約操作は加えない。

判定は保存済みのcommand metadataから行う。名前`runtimes-before`・stage inventory・binary xcrun・正確な4引数・実timeout60,000ms・有限のelapsedが60,000ms以上であることを要求する。code／error null・SIGKILL・deadline理由、receiptとlive cancel null、resource false・resource観測null、raw-v1と4MiB設定、すべてのcounter0・empty stream hash・tail空・上限flags false・complete falseも確認する。欠損や未知値は不適合で、error文字列から推測しない。nonempty output・consent・spawn／resource／cancel・非timeoutにも広げない。

新metadataを付ける場所は元のrunのexit put後にあるassertion catchだけで、初回専用の別ifを追加する。既存postbootのmetadataとpredicate／helperは全byte保持する。外側のcatchでFS・intent／exit put・JSON等の例外へtagを付けず、parse／runtimeReceipt／厳密selectorの失敗は回復を起動しない。

元の`runtimes-before` intent／exitは失敗のまま保持する。別のrecovery-planを保存してから、新しいintent／exitでfresh readを行う。planはfirst／freshの名前・最大1回・read-only・必要30秒・共有残量と、`runtimes-before.json`がdownload前のfresh結果へ対応することを示す。plan自体は実行証明ではなく、fresh exitとsnapshotの存在を別に確認する。

plan前と記録完了後に、有限の残り時間30,000ms以上と取消なしを確認する。元first errorを既存runnerの`fullCapFailure`へ渡し、runnerの開始時とresource検査後・intent前のfull-cap検査をそのまま使う。30秒が欠ける場合は新しいcommandを始めず元errorを返す。plan記録失敗もfreshを始めず、record errorを返して最初の失敗metadataを変更しない。既存timer／FS schedulingはbest-effortのままで、実完了時刻を保証しない。

freshの失敗・不正JSON・shape／identifier／build／duplicate等の不適合でも三度目の読取は行わない。runtimeReceiptとselectExact17は新helperのcatch外で元どおり検証する。validな一覧に利用可能な17がなければ、従来のdownload-if-missing分岐へ進み、17.5等の採用やstrict guardの緩和を行わない。

## 確認した範囲と未完了

旧73検査を全文prefixとして保持し、新16件を加えたNode89件が初回で全成功（exit 0、wall2.379秒、fail／skip／cancel0）、構文2fileもexit 0だった。production planner／helperを通し、各fieldの変更・欠損、first成功と不適合errorのidentity、plan前後のbudget／cancel、record失敗、fresh失敗／JSON／strict validationで第三readなし、missing17の旧acquisitionとpostboot分離を確認した。

小さいowned Node fixtureは最初のchildを40msで無出力停止し、明示したsynthetic60,000ms metadataを使ってfresh childの小JSONを読む。実60秒timeoutやsimctl成功の試験ではない。保存済みactual276 receiptをproduction plannerへ渡す純粋確認も成功したが、残量30,000msはsynthetic境界で、実環境の回復を証明しない。本記録の準備ではSource検査を再実行していない。

helper・初回専用metadata・初回callsiteの3領域を逆変換すると、276のdriver全byteへ戻る。既存postboot、他のinventory読取・取得分岐・runtime選択、full-cap／cancelの検査、free2GiB／総owned logical39GiB・全metric、共有19分・出力64MiB／他4MiB・証拠512KiB／2MiB、所有・47判定・cleanupを保持する。新しいApp snapshot等は含めない。

276の[Runtime26 run 40916070075](https://github.com/pero3dev/ai-agent-library/actions/runs/40916070075/attempts/1)では、既存の復帰と3記事メソッドが各1開始・1成功、134.995秒／164.265秒だった。Source・15秒・fullyVisible等のpredicateは不変で、以前の待機原因の修正やSource89の実成功へ転用しない。Rootの17:26:44 UTC checkpointではSource7が5成功・Pilot失敗・Full pending、既知必須11はpre-Readyで全成功だった。旧headの部分履歴であり、Draft／受入保留を維持する。

Source2の独立レビューはP1／P2なしで受け入れられた。全2,826パスの候補で共通検査は1,261件中1,246成功・15skip・失敗0（npm exit 0、wall55.402秒）だった。固定済みlockfileと準備済み依存を再利用し、Source89は無編集である。以後の記録だけの差分には文書・形式の限定検査を行い、成功済みSource検査やSDKを再実行しない。最終文書・metadataのレビューと新headの初回回復・39GiB効果・実47件と必要CIは後続である。App0.2.23（25）、TODO32行／完了13行と全row、採用mainca595のFull診断と既存Native復旧のSource・記録を保持する。実機上書き／保存維持・VoiceOver・最低OS全体・Full診断失敗経路等は未受入のままとする。

## コミットと通常統合

作者baseは276／tree `6ba3b91c476c04974650647e213bfde783bdfd16`・2,824パスで、現在のmainca595を含む。本候補は既存4変更・新記録2本で2,826パスを投影する。追加mainSyncは不要で、Source89と記録を1作業単位のcommitにまとめる。Rootが対象blobと実head、独立レビュー・共通検査・最終6ファイルを照合してから、既存[Draft PR #301](https://github.com/pero3dev/ai-agent-library/pull/301)の`codex/ios17-functional-pilot`を通常FFで更新する。

新epochの7系統と必要証跡、実47件・Runtime26既存2件、Ready後の最新必須11・最終metadata、通常保護main統合とpost-pushを別々に確認する。旧headの再実行、新Draft置き換え、admin例外は計画しない。PR全体の本文・commit／squash形式と外部操作はRootが最終化する。共有Source・Git・GitHub・network・SDK・CI・削除はこの準備では行っていない。
