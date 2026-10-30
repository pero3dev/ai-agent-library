# 読書UIの待機失敗を観測する診断候補

2026-10-30の診断準備とPR #306初回実行の記録。main303後の二つの失敗を、判定を変えないテスト診断で観測する。凍結Source3は完全保持し、PR #307を通常採用した実main`77083715ed7786a34f2947572c10b45e0a557079`を既存c6c branchへ通常mergeした後、記録・索引4本を同期する。製品修正・retry・待機延長・成功条件の緩和は行わない。初回c6cの観測と、最終同期headで未確認の検証を区別する。

## PR306作成前の作者基準と採用の順番（履歴）

最終候補の基準は、PR305を2026-10-29 23:59:47 UTCに通常保護squashで採用した実main`9146aa99887a0fbcd3243da663efcd8a79797886`／tree`c980ce0fab34df85a48daced9b64e8870f917ca7`／2815ファイルで、単親はmain759eである。Rootとこの私有準備のsafe readerで、元の公開head f8eと実mainの全2815 mode／blob一致、Source3の元blob一致を確認した。Rootは実commit本文と予約canonical squashの一致・形式0も確認した。既存5変更＋新Reader記録2の7パス／想定2817をこの実mainに結び直し、採用済み長文観測記録2本を非所有として全保持する。

所有はNativeReaderUITests／ReadingRecoveryUITests／PublishedReaderUITestsのコピー3、記録MD／JSON新規2、索引2への純粋な挿入。性能側のworkflow／Node／PublishedPerformance3とは別単位で、[長文Clock記録](ios-long-scroll-clock.md)と[自分用候補](ios-personal-use-candidate-checkpoint.md)、旧索引段落を保持する。識別hashは[JSON](ios-reader-wait-diagnostics.json)へ残す。

PR305の最終本文23:58:04 UTCに対するfresh必須11件は23:58:30 UTCに全成功し、通常の文書2パス採用を完了した。追加Nativeは旧f8eのUIがmerge時にpendingで未受入であり、このSource3診断の実行根拠へ転用しない。RootはDoc2-onlyとして通常11・独立レビュー・共通で統合した。新main9146のpostpushは別observerが開始した段階で結果未確定。このReader候補の新branch／commit／PRはまだなく、最終独立レビュー後にRootが1つのcode/doc commitと小PRへ進める。本人への新しい承認依頼ではない。

## PR306初回headの観測と現在のmain同期

初回head`c6c793f4821c5532c400d9cb8fb7b72ee466cd3b`／tree`2f52c1e3315d8ecc4b9ecb3a2e2352b90d73ee84`のDraftでは、実発火した6系統のうち5成功・Common失敗、必須11は10成功・build1失敗だった。Common run40979576004／job123815965604のBrowser regression checksが失敗した。これは初回headの結果として保持し、新しい同期headの成功とはしない。未発見のPilot／Performanceも成功扱いしない。

同じ旧headのNative run40979576075／job123815965184ではCore245件（skip2・失敗0）、UI一意6成功、Release BUILD SUCCEEDEDを確認した。Recoveryの90記録・9openは独立QCでschemaと生成元に照合した範囲の受入で、元失敗の原因解消や性能値の受入ではない。Full run40979576035／job123815965156もCore245件（skip2・失敗0）、UI一意23成功、Release BUILD SUCCEEDEDだった。対象resumeは91.800秒で成功し、failure-only NormalResume記録0件は成功時の想定どおりで、実失敗経路は未観測である。

RootがPR #307を2026-10-30T01:43:21Zに通常保護squashで採用した実main`77083715ed7786a34f2947572c10b45e0a557079`／tree`e641f47f842b8f5565b9c7bfda9b2980789fe4f8`は、main9146からWeb検査1pathだけが変わる。Root作成の通常merge`fb6fa0e22f54fe2526b006cb670dff970ab269a1`／tree`a145dc28649a019db3d3e8468074fa506f186cbd`はfirst parentが旧c6c、second parentがこの実mainであり、Source3のbytesを保つ。この4文書同期を別の小commitとして重ね、PR内は既存code1＋通常merge1＋文書1の計3commitとする。rebase／forceは行わない。

この準備はRootの実OID付きreceiptを入力としてtree・Source3・全非所有mode/blob・既存history・索引本文・TODO32行／13完了を照合する私有単位で、Source／SDK／UI／共通を再実行しない。最終4文書とbindingの独立レビュー・実最終候補の共通・通常形式検査は別receiptで確認する。最終同期headの必要CI・Native6／Full23・実診断、Ready・通常保護main統合・postpushは未確認であり、旧c6cのpassを転用しない。App0.2.23（25）・PBX・全記事と元の未完了事項を保持する。

## 元の二つの失敗

| 対象 | 保存済みの事実と限界 |
| --- | --- |
| Native run40946625335／job123703574253 | Core245件（skip2/fail0）、UI6中5成功・1失敗。ReadingRecoveryの最初のAgent行、旧505行の最終15秒requireHittableで止まり、復旧確認前。59.156秒はケース全体。期限後の逐次geometryがvisible/hittableでも、期限内の成功や原因を示さない |
| Full run40946625482／job123703574803 | Core245件（skip2/fail0）、geometry6を含む選択23件中22成功・1失敗。再起動後library-resumeを一度tapし、native-readerの20秒waitがfalseで停止。77.215秒はケース全体で、B見出し・旧query hitの後続assertには未到達 |

main push APIのCommon/deploy成功、Native/Full失敗は独立した履歴として保持する。復旧記録の破損・検索の再生・製品routingや二件共通の原因は未確定で、後続passだけを修正や安定性の証拠にしない。Rootが一度取得したrawの選択済み記録を根拠とし、この単位は再取得しない。

## 凍結Source3の診断範囲

ReadingRecoveryだけが記事openのphaseと行の最終waitを新prefix`AILibraryRecoveryOpen`＋半角spaceへ記録する。公開fixture3記事の既存articleID引数、既存Bool、test-process monotonic時刻だけを使い、追加AX getter・title/query文字列・suite UUIDを収めない。NSLock・last8を使い、固定9phase＋最大3wait境界、1open最大12行、各JSON payload8192B以内（prefixは別）。precheckは既に得たBoolの回数と最後の値を最大12回まで保存する。検索phaseは検索準備からtypeText完了までで、個々のAX getterを特定した扱いにしない。既存Native iOS26のopt-in・prefix・default JSON、predicate／geometry／結果の順、15秒・8/12回・assertと全case identityを保つ。

Fullの対象Agent resumeだけ、既存failure-only helperへexpectedTitleを渡す。Transformer既定値・旧caller・payloadを保つ8箇所の置換で、成功時は同じreader20秒・paragraph10秒・非空確認だけ、追加AX0、tapも一度のまま。失敗後だけ公開route、一覧、loading/error/unavailableを既存snapshotへ収め、元の失敗を維持する。JSON8192B、group8行・文字128、hierarchy UTF-8 prefix8000B（置換後最大8002B）と既存text handlingを保ち、新しい強いredaction保証とはしない。

ログは時間に影響し得る。失敗後snapshotは逐次・best effortで、以前の瞬間を再現せず、バイト上限はAX取得の所要時間を保証しない。

## 作成前の検証と完了条件（履歴）

凍結Source2の独立レビュー99ba、Source1／Reader3組合せのレビューe640はP1/P2なし。Rootが過去に実fdaを基準としたUI5ファイル・Reader overlay3、性能側の新traceを元のまま保持して、SDK18.2／arm64 iOS17／Swift5の型検査0・9.743秒・stdout/stderr0を確認した（証跡1f1e）。実XCTest・UI・新traceの実行ではない。旧5ee基準の型検査0・7.984秒は以前の履歴として別に残す。

Recovery2だけの旧共通1185件中1170成功・15skip・失敗/cancel0、npm0・47.362秒はSource2だけの結果で、Reader3／最終7パス／現fdaへ転用しない。この私有単位はコピーhash・scope・文書／metadataの限定静的検査だけを行い、Source／SDK／Node／共通を繰り返さない。その後Rootが実施した旧Reader7共通（証跡96cc）は、fda＋7パスのtree`308f34cf500066ef1ed5f24a1d03193010eadeec`／2817で1186件中1171成功・15skip・失敗／cancel0、npm0・50.329秒だった。SDK1f1eとこの共通は過去の作者・記録bytesに対する結果で、新f8e＋7パスで実行したものではない。Rootが現在作者f8eのP2修正前候補bea5／tree`164aa50904903cd17ed47046fa4bcbe14a9482f7`／2817で実施した共通1回（証跡e5c173）は、1186件中1171成功・15skip・失敗／cancel0、npm0・43.776秒だった。全working／private indexの2817一致と非所有のPR305長文記録2本を前後で保持した。検査対象には当時の履歴オブジェクト誤りが含まれるため、今回のJSON履歴2項目復元と記録2本のreceipt追記は限定検査・差分レビューへ分け、修正後／将来の実main再結合後treeで共通が成功したとはしない。Source変更や共通再実行ではない。4a9履歴修正／receipt差分は独立レビュー44d3でP2解消・P1/P2なしとなった。今回の全2815 actualmain結合proofは別に追加し、履歴修正後／receipt後／今回main結合後の共通やSDKを再実行したとはしない。新head Native6・Full23と実診断、必要CI・Ready・通常main／postpushも未実施である。

PR304は23:08:47 UTCに通常保護squashでmain759eへ採用された。fdaのFull実rawでは単体245件（2skip・失敗0）と本文UI一意23成功／TEST SUCCEEDEDを確認した後、Release compile中にcancelledとなり、Full全体やRelease完了監査は未受入である。以前失敗したresumeケースはfdaで73.934秒の成功があるが、原因修正・安定性の証明にしない。別の長文観測と受入は長文Clock記録へ分け、このReader単位へ性能値を移さない。Rootのmain759e pushは23:45:24 UTCのAPI snapshotで実発火5系統すべて成功・pending0・guard0となった。unit／UI／ReleaseはAPI上のstep成功だけを記録し、raw未取得のままcase数・新しい性能値・本診断の実行を受入れない。23:35:13の4成功／Full進行中は当時の部分snapshotとしてJSON履歴へ残す。旧5eeの6成功2失敗・別manual失敗も移さない。App0.2.23（25）・製品31blob／PBX・本人データを保ち、[完成TODO](../../plans/engineering/ios-app-completion.md)32行／13完了とIOS-15未完了、PR301のAX493とminimumOS47、実機上書き・VoiceOver・provider・着信・backup／署名期限更新の未受入を維持する。

本人の自分用完成・自律実施・通常commit／PR／mainの既存許可を根拠に準備し、実機が必要な部分は未完了のままスキップできる。この子は共有Source・Git・外部API・CI・端末を変更せず、他者の作業と凍結原本を保持する。

## 以前の準備snapshot

元packet 2bb099は、当時のDraft304 fda／実main6bfを基準とし、304採用・長文実測・Reader7共通が未確定だった私有記録として保持する。旧Source／SDK／共通と二つの初回失敗は履歴のままで、今回の再結合により成功へ書き換えない。実測・Source／SDK／UI／Node／共通／APIの再実行は行っていない。

4a9の当時のDraft305 f8e author／main759e・current scope／delivery planは独立したdeep copyでJSON履歴へ追加した。2bb original_scope／original_delivery_planと既存の他historyを再上書きせず、現在の採用SHAと検証の実施基準を区別する。2ccc準備時点ではSource3／索引2のbytesを4a9と完全一致で保持していたが、索引の古い現在形にP2が出たため、この保持claimは当時の履歴へ移す。その索引更新時点ではSource3を完全保持し、索引2の新しい先頭段落だけを日付付きの採用前履歴と当時の通常採用済みmain9146の現況へ同期した。元のmain9146索引本文は全bytesを保持し、純挿入を除けば完全復元する。e5共通はP2修正前・索引更新前のf8e／tree164aaだけで、最終treeの共通成功ではない。今回の限定文書／形式検査と最終差分レビューで提出内容を確認する。
