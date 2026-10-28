# project — 計画と実施記録

記事拡張、サイト、定期最新化、ハーネスの採択計画と実施記録をまとめます。作業の共通契約は [AGENTS.md](../AGENTS.md)、検証手順は [CONTRIBUTING.md](../CONTRIBUTING.md)、記事タスクと定点観測の正本は [ROADMAP.md](../ROADMAP.md) です。

計画本文の「現状」「未着手」「追加予定」は、各計画の作成・採択時点を表します。実施結果は後継記録で確認してください。計画の終了に合わせてファイルを移し直さず、状態と適用時点をこの索引で案内します。記事の公開状態は各記事の front matter が正本です。

[iPhone AppIconとビルド後監査](records/2026-10-26/ios-app-icon-native-assets.md)は明示source commit `30a8a1db8d6c30eeb2c6e682f92ba94126cc5e35` へ私有準備した既存ブランドの8PNG/9slot・AppIcon監査候補で、0.2.16(18)から0.2.17(19)を提案する。PNG8/22,198B・source/validator/recipeを保ち、Published cap50・3selectorsへ承認監査呼出だけを加える。旧source check/Node13とactool失敗は履歴で、新compile・実CAR・Home/Store・exact-head CIと別人の最終payloadレビューは未実施。IOS-29全体は未完了で全TODO状態を維持する。

## 構造・運用の計画

[App本文表示時のメモリ観測](records/2026-10-28/ios-app-memory-observation.md)では、起動済みの全記事一覧からTransformer本文への移動を、対象Appを指定して測る候補を扱う。既存Clockは維持し、本文シナリオの初回rawから指標・単位を別commitで採択する。実測・性能予算・実機を未確認のまま区別する。 PR296の初回はSimulator起動後の一覧取得でビルド前に失敗し、同条件の再実行1回ではビルド後にmanifest読取上限の不整合が判明した。初回失敗と再実行を別々に保持し、Appと生成元のmanifestの4読取を製品側の8MiBへ揃える。一般JSON・compact・制限時間・未採択契約を保ち、新headの実測と指標採択は未確認のままとする。 起動後一覧取得の再発を受け、タイムアウト時だけの追加読取1回を既存の全体上限内に限定し、元の失敗を保持する回復候補を準備する。実Hostedでの効果と実指標の採択は別に確認する。

全記事の[Core host観測](records/2026-10-26/ios-published-core-benchmark.md)はb79基線で実施した凍結CLIのraw19process/記録15は旧観測として保持し、最新source4のsnapshotや未実施の再CLIと分ける。通常CIはNode fixtureだけで、SDK・corpus観測は明示した手動CLIと別guardのまま。App/PBX/workflow/P1/Iconと全TODOを保持し、IOS-15と予算採択は未完了である。

2026-10-27の[現行CoreのHosted観測](records/2026-10-27/ios-core-hosted-observation.md)は、b39／Workflow9bの凍結19process・15標本とCore実装main f5eを扱う。上の段落は旧準備時点の履歴として保持する。後続main76の新push Common・Native・Fullは成功し、Nativeの追加12単体と通常UI、Fullの一意22caseを確認した。旧性能値をSource4が変わったApp0.2.20（22）へ転用せず、App・実機・最低iOS17・VoiceOver・p95・性能予算とIOS-15全体は未完了とする。TODO32行・完了12行を保持する。

通常CIの[Playwright依存取得を制限する候補](records/2026-10-27/ci-playwright-dependency-download.md)は、f28のAPT長時間転送へ対処し、30分上限・全検査を維持する私有準備である。純78ケースと独立レビューは成功したが、実APT・sudo・変更後Hosted CI・全browser検査は未実施で、通常の別PRと正確なhead/runの確認を待つ。取消原因や転送改善成功は断定せず、アプリ版・TODO・iOS source・mainは未変更とする。

[読書記録の破損保全と明示復旧](records/2026-10-27/ios-reading-state-recovery.md)はPR282最終eabの6runとReady最新policy成功後、main76へ通常保護squashで統合した。main76の新push Common・Native・Fullも別観測で成功し、Native追加12単体と通常UI、Fullの一意22caseを確認した。旧Core性能は歴史scopeに保ち、実ユーザーの復旧固有UI・実機・VoiceOver・耐電断等とIOS-22全体は未完了、TODO32行・完了12行を維持する。後続PR283の新Recovery UIはこのmain76 checkpointの受入に含めない。

[読書記録の手動書き出し](records/2026-10-28/ios-reading-backup-export.md)は、正常な永続rawと現一覧外IDを保持するexportだけを準備した。v2レビューの未知metadata P2をraw identityで修正し、観測不一致後の一般保存停止をUIへ同期する。v3 Source5を保ち、PBXだけ0.2.21（23）へ上げる。grammar5と影響旧11＋新5のFoundation16件成功までで、App XCTest24・SDK・実picker／provider・実機・VoiceOverは未実施。最終Source5独立レビューはP1／P2が0件。復元は後続とし、TODO32行・完了13行、IOS-22未完了を維持する。

[読書exportの採用追記](records/2026-10-28/ios-reading-backup-export.md#pr293の採用追記)では、PR293を通常保護でmain `a18a47c2911a`へ採用した結果とReady必須検査・export SDKの観測を記録する。旧準備記述を保持し、後続復元のApp71・SDK・provider・実機等の成功へ転用しない。

[読書記録の手動復元](records/2026-10-28/ios-reading-manual-restore.md)はPR #294をmain `d74c68179aa2053a457b964f4cf756d0a9bf77b1`へ通常統合した。0.2.22（24）のpreview・明示置換・復元前1世代保全と解除を実装し、訂正headの単体236件（skip2・失敗0）・UI5件と必要CIの成功を確認した（Dedicatedは初回を保持し条件不変で1回retry）。ローカル既存署名Releaseと学習索引のMac consumerは別範囲で確認した。実機・実provider・新版VoiceOver・署名更新後の保持は未確認で、TODO32行・完了13行とIOS-22未完了を維持する。

[iOS26の本文待機診断](records/2026-10-28/ios-runtime26-wait-trace.md)は、15秒・fullyVisible・前面一意性・hittableを保持し、通常2ケースのwait／poll／既存geometry capture境界を追加AX0で記録する候補である。NSLockとlast8でboundedにし、wait-return直後のlock時点とcapture出力費用を区別する。synthetic helper5件・grammarと独立レビューP1・P2が0件までで、新SDK／UI・実traceは未実施。PR292／293初回失敗と各1回の同条件retry2成功を残し、原因修正とはしない。復元採用後の別2コミット／1PR案で、TODO32行・完了13行とIOS-23・25未完了を維持する。

[コードコピー回帰検査](records/2026-10-27/ios-code-copy-ui-ci.md)では、通常Fullの固定3abaで単体165件（skip2・失敗0）・UI23件・Releaseが成功し、同UUIDのraw結果と実コピー374Bを独立TXTへ全byte照合しました。canaryと一意なBooted選択はproducerの申告範囲です。通常保護squashで同じtreeのmain169へ採用しました。新push CIは未確認で、実機・VoiceOverとIOS-25全体の受入も残します。

[読書記録復旧のUI回帰](records/2026-10-27/ios-reading-recovery-ui.md)では、DEBUG隔離suiteの取消し・確認と再起動後のしおり保持を確認しています。採用89のNative4件と、通常保護で統合したmainc1の新push（Common10 jobs・Native4件・Full22件）を2026-10-28 checkpointで分けて記録しました。Dedicated89のF成功・R失敗は別Driver作業として保持し、新Driverの効果、読書位置・backup生bytes・実機・VoiceOver・Core性能とIOS-22全体は未受入です。

[更新復旧試験の実行元](records/2026-10-28/ios-destination-artifacts-ui.md)では、head56・3aの失敗を保持し、C2のDedicatedでF/R各1ケース、7回のApp一覧・phase source相関・最終52B sentinelとcleanupを限定受入として記録しました。通常6系統とmain142採用、反映後のCommon10job・Native UI4件・Full UI22件も別々に確認しました。Rの新しい診断・実launch root、内部cacheの保証と全userdataは未確認で、実機・VoiceOverやIOS-18・22・25全体は未完了です。

[iOS TODOと統合状況のチェックポイント](records/2026-10-26/ios-todo-integration-checkpoint.md)で、main955を基準とするIOS-02・10・13・14の達成と、12／32件の完了を追跡します。SDK26のunsigned Archive用技術環境・native導線・全199記事生成・学習案内が対象です。PR275は未マージで、iOS26.5の再起動復帰に失敗が残っています。実機・性能・配布資格・契約・公開と最新OS27の受入は未完了として分けます。

[iOS自分用初版の方針](records/2026-10-28/ios-personal-use-scope.md)では、本人の直接回答で配布先を自用とし、Rootが既存自律依頼に基づきiPhone/iOS17以降・全記事native同梱・音声1本等の現行baselineを採択しました。新課金なし・既存無料Teamで自用し、Store価格・契約・外部配布は未選択です。IOS-01の範囲決定だけ完了し現行13/32、他31行と旧12件のcheckpoint履歴を保持します。RootはPR286のFull raw23/実374B独立一致・Releaseを受入れmain169へ通常統合済みですが、新main pushCI・実機・上書き保持/読書backup復元は未確認です。旧Draft/nullは履歴に保ち、範囲記録→検索観測→読書export→復元を各小commit・PR・通常main mergeへ分けます。

[block内部の読書位置候補](records/2026-10-26/ios-intrablock-reading-progress.md)は、旧anchorと保存を保ち、実測した相対位置の復帰・自動配置失敗時の保全・layout再起動を扱う。承認済みv3 codeの旧SDK4段階は成功したが、新snapshot/pickerを持つPublishedは未compileである。unit152・機能16＋pure geometry6＝22 selectedはsource数で、実main270へのbind後の確認とexact-head CI・実機等をIOS-11へ残す。 実main270 `955c066c8dc0fdbedf6f0c845a461abda39ac476`（tree `9d2525e28ce3d9b6659eeac57b0b6f910e7e262b`）へbindした私有候補である。親PR270 head85d9のunit133（131成功＋2skip）・full21・Releaseと全15check成功は親の履歴で、新P1 unit152／UI22の実登録・実行は未確認とする。独立review後にrootがDraftへ反映してCIを実行し、必要exact-head CI成功までmainへ統合しない。 Published CIのjob上限だけ40分から50分へ調整し、selector・個別15秒・assert・commandは維持する。これはCI実行上限で製品性能budgetではない。

[フォルダー選択取消の追随preview](records/2026-10-26/ios-picker-cancel-ui.md)では、旧238eのfull run40226683804/job121269430760でunit133件（131成功・2skip）と機能UI14/15成功を確認した履歴を保持する。本文検索Aとpicker取消138.720秒は成功し、Bは最初の到着で失敗してTOC/save/restartへ未到達だった。新snapshot helperを保持したPub41c3＋Nativebcafは機能15件＋geometry6件のsource計21件となるが、新snapshot/full/native/runtime26・生成budget・site待機・Releaseは正確な新headで未実施である。実main269 `750a305a82c6ff7882de46fdf7889c81925c509e`（tree `7636f378ecd8e8202cd2d9c8c9e89e2aa85b875d`）へ固有6pathをbindした私有候補で、独立最終レビューと正確な新headのCIを待つ。公開PR270 head238eは未変更である。

[本文検索の到着と復帰](records/2026-10-26/ios-search-hit-ui-regression.md)では、入れ子の特定段落への移動と、別位置を保存した後に旧queryを再実行しない動作を公開UIで検査する。既存12件を保持した追加2件を、型検査と実UIに分けて追跡する。

絞り込み中の[補助画面と保存分離UI回帰](records/2026-10-25/ios-filtered-actions-ui.md)では、Aboutと専用記事の開閉、検索・タグ保持、通常reader再開前のrestartによる永続分離を検査する。既存10件を保って機能UI12件へ増やし、SDK compileと未実施の実UIを区別する。

旧版と更新失敗時の[保持回帰3件](records/2026-10-25/ios-storage-retention-regression.md)では、実repositoryの3世代snapshot・後読資産、孤立版の無変更、pointer書込失敗時の既存bytesを検査する。Mac新3件とiOS単体122件のcompileを区別し、将来の削除・pin・容量管理方針の採択は残す。

[SDK27互換性preflight](records/2026-10-26/ios-sdk27-compatibility-preflight.md)は、0.2.18（20）・CDCでもArchiveと代表UI2件が成功した。観測した形状補正をiOS27以降へ限定し、17〜26では明示的shapeを外す0.2.19（21）の候補を準備する。iOS26.5の待機失敗の原因や修正効果は未確定であり、新headのUI・実機・VoiceOverは未確認。TODO12／32とIOS-11/23等の未完了を保持する。

現行SDKへの[Archive互換性の事前検証](records/2026-10-25/ios-sdk26-archive-preflight.md)は、公開repoの標準Hosted環境でdevice Releaseと実同梱物を監査する。資格情報を使う署名・Provisioningを分け、SDK26の初回実行とStore配布・ローカルOS更新の採択を区別する。

全記事一覧が使えるまでの[性能観測基盤](records/2026-10-25/ios-published-readiness-observation.md)では、機能UIと専用Clockケースを分ける。実Debug全数監査・warm-upと3標本・生xcresult/CSVを保持し、初回の実Clock型・単位・識別子の確認と性能予算の採択を区別する。

[検索UIのClock観測候補](records/2026-10-28/ios-search-ui-clock.md)は、起動と不一致queryへの復帰を計測外に置き、公開検索欄の置換から正のquery・filter summary・可視witnessまでを対象にする。自動実行は従来の起動1件を保ち、検索はmanual選択時だけ。合成exporter44件・静的確認とXcode16.2付属Swiftの構文解析のみ確認し、SDK型検査・Hosted・実検索metric・性能予算は未受入、TODO32行・完了13行を維持する。

[検索Clockの採用追記](records/2026-10-28/ios-search-ui-clock.md#pr292の採用と実観測の追記)では、PR292のmainc148通常採用と独立raw／typed3標本／CSV照合を記録する。App0.2.20（22）のDebug SimulatorでCSV平均は起動8.817993219秒・検索6.153735783秒。UI automation／AXを含み、実機・性能予算・IOS-15全体は未受入のまま。後続exportの検証へ転用しない。

[main49のApp起動観測](records/2026-10-28/ios-published-launch-readiness.md)では、Debug・Xcode16.4/iOS18.5の起動から全199記事数と学習ガイドの存在確認までをClock3標本で記録した。平均7.5879547333333335秒とCSVの丸めを照合し、終了処理を除いたUI/AX待機込みの温まったcacheでの観測として扱う。過去のCore CLI、cold起動・p95・RSS・実機・性能予算と区別し、TODOの完了欄は変更しない。

全publishedの開発用標準生成は[入口統合の記録](records/2026-10-25/ios-published-development-default.md)で追跡する。標準npmで全199記事と学習索引を生成・原文監査・実consumer監査し、代表3記事とfixture4記事の回帰入口を保つ。公開申請の採択や全記事の実機受入とは分ける。

本文の既知章URLをアプリ内の章案内へつなぐ[章リンクの記録](records/2026-10-25/ios-native-chapter-link.md)では、全199記事の前提・関連リンク保持と、説明文を保った章・記事への導線を追跡する。厳密URL/helperと累積SDK compile、未完了のHosted/実機を区別する。

入力ごとの全文正規化を省く[検索索引の記録](records/2026-10-25/ios-normalized-search-index.md)では、snapshotと一緒に切り替えるメモリ上の索引、実199記事15queryの結果等価性、Macの補助測定とSDK compileを追跡する。Hostedと実機・入力遅延・性能目標は別に残す。

保存済み版から同梱版への明示切替は[同梱版選択の記録](records/2026-10-25/ios-bundled-content-activation.md)で追跡する。既定3記事・通常import優先・しおりと読書位置を保持し、実3→199→再起動→3の非UI確認と、未完了の画面・実機・容量管理を区別する。

章・タグ・学習ルート・用語集の画面接続は[ネイティブ学習UIの記録](records/2026-10-25/ios-native-learning-ui.md)で追跡する。本文と学習情報の一括公開、旧profile互換、SDK compileと未完了のHosted/実機受入を区別する。

学習案内の任意JSONを読むSwiftモデルとXcode登録は[consumerの記録](records/2026-10-25/ios-learning-index-consumer.md)で追跡する。不在互換・不正データ拒否・SDK compileと、後続のStore/学習UI・Hosted実行を区別する。

章順・タグ・学習ルート・用語集の構造化は[学習案内の生成記録](records/2026-10-25/ios-learning-index-generation.md)で追跡する。全記事同梱候補だけへ任意JSONを追加し、旧profile互換と原文の独立監査、後続のconsumer/UI受入を分ける。

全記事候補のDebug・UI・Release検査は[候補UIの記録](records/2026-10-25/ios-published-candidate-ui.md)で追跡する。通常3記事の回帰を保ち、動的件数と01/03/08/11章の6記事を検査する準備を分ける。

全published記事の通常同梱候補と原文監査は[準備記録](records/2026-10-25/ios-published-library-profile.md)で追跡する。明示modeと既定の切替を分け、3/4記事の回帰と全数監査を維持する。

全記事の負荷棚卸しと空検索の全文正規化省略は[性能準備の記録](records/2026-10-25/ios-empty-search-performance.md)で追跡する。検索結果の同値とMac CLI比較を確認し、UI・実機の性能受入を残す。

初期読み込み失敗の再試行と利用できない記事からの一覧復帰は[復旧の記録](records/2026-10-25/ios-load-recovery.md)で追跡する。保存と正常版の維持、実Storeの検証と画面受入を分ける。

[同梱記事の欠損と正常版への更新のUI回帰](records/2026-10-26/ios-missing-package-ui.md)は、旧失敗とPR282最終F/R・本文後sentinelのcontrolled受入を分けて保持する。実装main76への通常保護squash後、新push Common・Native・Fullの成功を別に確認した。main76に専用F/R・SDK26・Runtime26の新pushはなく、PR結果を代入しない。固定sentinelを実bookmark・読書位置の更新越し保持とは扱わず、同process内修復・offline・import・実機・VoiceOverとIOS-18／25全体は未完了である。

章・難易度のネイティブ一覧絞り込みは[実施記録](records/2026-10-25/ios-category-level-filter.md)で追跡する。検索・しおりとのANDと解除を追加し、タグ・学習ルート等の残件を分ける。

全published記事の一時生成とconsumer監査は[全記事の生成記録](records/2026-10-25/ios-all-article-package.md)で追跡する。通常3記事・fixture4記事を保ち、全記事の画面・性能・実機受入を残す。

検索結果からネイティブ本文の一致位置へ移動する作業は[0.2.4の実施記録](records/2026-10-25/ios-search-hit-navigation.md)と[PR #242](https://github.com/pero3dev/ai-agent-library/pull/242)で追跡する。正規化AND検索を維持し、入れ子の本文位置と保存用の位置を分けた。Foundation回帰とSDK compileを確認し、新たな実機受入はユーザー指定により未実施として残す。前提PRのmain反映待ちと、機能の検証を分けて進める。

記事改訂後の保存位置は[照合の実施記録](records/2026-10-25/ios-reading-revision-restore.md)で追跡する。旧保存を維持しつつ、本文digestと意味内容fingerprintを使う任意anchorを追加する。見出し・本文が曖昧な重複を持つ場合のfallbackと、未完了のblock内精度を区別する。

追加の[Hosted Simulator CI](records/2026-10-25/ios-native-ci.md)は[PR #243](https://github.com/pero3dev/ai-agent-library/pull/243)へ分けた。正本からの生成・監査、全AILibraryTests、Releaseの同梱SHA・TestContent除外を検査し、実行結果と未実施のUI・実機受入を区別する。

ネイティブ記事の[パッケージ契約](records/2026-10-25/ios-native-package-contract.md)では、app・renderer・schemaの対応、未対応版の拒否と正常版維持、生成側と端末側の音声・ファイル数・byte上限を揃える。旧HTMLの比較生成は一時出力へ限定し、全記事展開や配信の真正性とは範囲を分ける。

[音声offline identity契約](records/2026-10-26/ios-audio-offline-identity.md)は通常Agentループ1音声を保つ。旧750aのNode検証と1773Bのmetadata等価性を履歴として保持し、今回の実main snapshotと未実施のexact-head CIを分ける。追加8音声・権利・IOS-04/16全体は未採択で、実音声bytesの検証や新しい配信を採択しない。

[通常1本の実MP3照合](records/2026-10-28/ios-agent-loop-audio-byte-audit.md)では、固定mainf15とAudio候補65のAgentループ音声13,007,768Bを取得し、宣言・catalog・公式ReleaseのSHAと一致した。1取得チェーンを文書化し、音声本体の保存や再取得はしていない。台本のcanonical JSON・READY・制作証拠は未回収で、Releaseの将来不変性、受信ごとのhash検証、権利・追加8本・Store・IOS-04/16全体の受入とは分ける。

既存のネイティブUI試験2件のHosted実行は[専用のCI追加記録](records/2026-10-25/ios-native-ui-ci.md)で追跡する。通常3記事の本文とTransformerの目次・しおり・再起動復帰を確認し、未対象のオフライン・コピー・内部リンク等のUI受入を区別する。

[新runtimeの代表UI検査](records/2026-10-26/ios-runtime26-smoke.md)のCDCは、実2target・arm64のみをbuildしUI step539秒で完了した。Contentsの最初の目次待機は失敗、ThreeArticlesは成功し未受入を維持する。失敗後の逐次snapshotがvisible/hittableでも先行timeoutを覆さない。下位OSへ及ぶ形状補正の範囲を見直す候補と原因調査を分け、同headの再試行・待機や判定の緩和は行わない。

[runtimeの照合記録](records/2026-10-25/ios-native-runtime-audit.md)では、現行app targetに旧WebKit・HTML/JS bridge・blockerが残っていないことを確認した。再利用する生成parserと比較用旧HTMLツールを保持したままIOS-24を完了とし、UI・実機の全体受入を別に残す。

共通検査・サイト依存のhigh／critical対策は[限定依存修正の記録](records/2026-10-25/markdown-parser-security-update.md)で追跡する。パーサー・描画依存と必要な互換処理を更新し、通常CIとbase側の監査結果を分けて記録する。

iOSのTODO自律実施と段階統合は[自律実施記録](records/2026-10-25/ios-autonomous-progress.md)で追跡する。

図の遅延読み込みと見出し位置の安定化は[検証記録](records/2026-10-25/website-mermaid-layout-stability.md)で追跡する。生成SVGの寸法をSSRへ渡して本文のずれを防ぐ。

[main前提の限定復旧](records/2026-10-25/ios-main-recovery.md)はPR #240だけに許可された管理者復旧を追跡する。trusted baseの未実行検査、変更前の保護条件、本人再認証、実merge・直後の復元を分け、後続PRは通常の11必須検査で統合する。

[本文の目次移動の回復](records/2026-10-25/ios-toc-placement-recovery.md)では、遅延生成後の有限再配置、実整列の確認、手動操作と世代交代での取消を扱う。過去の画面失敗、Macの制御テスト、SDK型検査とHosted実行を区別する。

[前面の可視範囲判定](records/2026-10-25/ios-foreground-viewport-regression.md)では、専用記事の背景navigation barによるUI誤判定を修正する。前面の一意性が不明な場合と、直接判定・待機中の判定を分け、実UIの確認範囲を記録する。

代表3記事にない書式・見出しリンクは、[専用テスト記事の実施記録](records/2026-10-25/ios-native-fixtures.md)と[実機チェック表](records/2026-10-25/ios-native-fixture-checklist.md)で追跡する。2026-10-25に0.2.2（4）のA〜Dと補足2点をユーザー報告で正常と確認した。数式・重複見出し・記事内外リンク、階層リスト・引用・表・コピー、最大文字・VoiceOver、テスト用記録の保存と通常側からの分離を確認し、実機XCTest30件も成功した。代表3記事の過去の受入と合わせてIOS-07・08・12を完了とし、検索ヒットの本文位置・改訂後の位置照合・全記事展開は残す。確認版と機械検査・本人操作の結果を区別して記録する。

代表3記事のネイティブ版の詳細受入は[詳細確認の記録](records/2026-10-24/ios-native-detailed-validation.md)と[手動チェック表](records/2026-10-24/ios-native-manual-checklist.md)で追跡する。修正版0.2.1（3）について、指定A〜Dの実施した手順は2026-10-25までにユーザー報告で正常と確認した。オフライン・表・コピー・リンク・図数式・音声・表示設定と復帰・VoiceOverを確認し、実機のCore・音声XCTest16件も成功した。実着信・未収録要素のfixture等は残し、自動UI試験の未実行とも区別する。

iPhone向けのネイティブ本文は[開発・起動手順](../ios/README.md)と[2026-10-24の実施記録](records/2026-10-24/ios-native-reader.md)で追跡する。代表3記事を構造化JSONへ変換し、文章・コード・表をSwiftUI、図・数式をビルド時のPNG生成とネイティブ画像で表示する実装を行った。0.2.0（2）の実機操作について、本文・図・数式・目次・しおり・再起動後の復帰が正常とユーザーから確認を得た。詳細受入の残件、生成・SDKビルド・Simulatorの結果は、この記録で確認する。

移行前のSwiftUI・WKWebView試作は[2026-10-23の実施記録](records/2026-10-23/ios-prototype.md)に残す。3記事と音声1本を対象に実装し、2026-10-24にXcode 16.2の導入、iOS SDKでのビルド、XCTest 6件、Simulatorでの本文表示と短時間の音声再生を確認した。これは旧方式の結果である。

旧方式のiPhone実機の基本受入は[2026-10-24の確認記録](records/2026-10-24/ios-device-validation.md)を参照する。iPhone 12で本文空白を修正し、オフラインの3記事・図・数式・検索、しおり・読書位置の復帰、音声の基本操作を確認した。当時未確認だったVoiceOverや着信時などの項目も、この履歴に保持する。現行のネイティブ版の結果は上記の詳細確認の記録で確認する。

iOS完成版への作業は[完成版TODO](plans/engineering/ios-app-completion.md)に整理した。ユーザー指定の本文を含むSwiftUI全面移行を前提に、代表3記事のネイティブ描画から全記事・既存音声・更新・品質・配布まで32項目で追跡する。2026-10-25に[コミットとmainへのマージの計画](plans/engineering/ios-app-completion.md#コミットとmainへのマージの計画)を追加し、受入済みの基準PRから機能ごとのPR・公開準備までM0〜M9の節目を設けた。[追記の記録](records/2026-10-25/ios-delivery-checkpoints.md)は計画更新までであり、Git操作は未実施。初版の公開方法・費用等は採択が必要であり、[作成記録](records/2026-10-24/ios-completion-planning.md)と実装の進捗を区別する。

[時計由来APIのPrivacy候補](records/2026-10-26/ios-privacy-clock-reason-candidate.md)は、main142のApp16 Swift・時計7箇所と新しいApple公式DocC JSONの照合を記録しました。現mainのUserDefaultsのみ591Bと、SystemBootTime/35F9.1辞書211Bを追加する私有802B候補を区別します。wrapperへの適用は保守的な推論で、FileTimestamp理由は追加しません。Copy・Audio後の実mainへの結合・独立レビュー・新headのCI/Archive一致、配信先ログ・公開policy・問い合わせ先・Store回答を残し、IOS-27は未完了です。

iOSアプリ化の可能性は[2026-10-21の実現性調査](../research/ios-app-feasibility-2026-10-21.md)に、既存資産の再利用、方式比較、配布・運用上の懸念と次の試作条件をまとめた。[作業記録](records/2026-10-21/ios-app-feasibility.md)は調査の範囲・検証・未実施事項を示す。実装方式の採択やアプリの開発開始を示すものではない。

2026-10-08の総合レビュー親 #224–#231・子 #232–#237 は[是正記録](records/2026-10-08/comprehensive-review-remediation.md)で、6件の修正と検証・独立レビュー・公開後の終了条件を追跡します。最終のmerge・CI・公開確認とCloseの証拠は各Issueに記録します。

鮮度監視 Issue #220 は[2026-10-08の再開記録](records/2026-10-08/freshness-monitor-recovery.md)で、3系統の部分観測、未確認範囲、記事・依存修復・公開台帳の検証と公開状態を追跡します。宣言範囲の完了記録やScheduled起動の確認は引き続き残件です。

サイドバー下部にも背景の霧を透かす Issue #218 は[2026-10-04の実施記録](records/2026-10-04/sidebar-footer-fog.md)で、開閉・スクロール・両テーマの画面証拠と修正・公開の結果を追跡します。

サイト背景の霧とダークテーマの装飾色の Issue #215・#216 は[2026-10-04の実施記録](records/2026-10-04/site-fog-and-dark-callouts.md)で、実装・画面・検証・公開の証拠を追跡します。

第3回総合レビューの全43Issueは[解決記録](records/2026-10-03/third-review-resolution.md)で追跡します。[記事の修正](records/2026-10-03/third-review-article-remediation.md)、[サイトの修正](records/2026-10-03/third-review-website-remediation.md)、[前提知識55件の判断](records/2026-10-03/prerequisite-level-audit.md)、[タグ193件の判断](records/2026-10-03/tag-singleton-audit.md)、[公開記録の保持とパスの扱い](records/2026-10-03/public-records-retention.md)、[執筆履歴の移行](records/2026-10-03/roadmap-history-migration.json)から担当範囲と証拠を確認できます。IssueのCloseは[根拠と全完了条件の照合](../harness/git-rules.md#issueのcloseと解消の証拠)を満たしてから行います。

憲章・鮮度ティア・実行環境・計測の選択肢は[2026Q4判断メモ](plans/maintenance/2026q4-decision-memo.md)と[199記事の3層試算](plans/maintenance/2026q4-tier-proposal.json)にまとめました。提案であり、運用を変更した記録ではありません。

Git契約・単体試験・期限検出・週次監視は[ハーネスの修正と検証範囲](records/2026-10-03/third-review-harness-remediation.md)で追跡します。本文の訂正と一次資料の実取得は[今回の調査](../research/reviews/2026-10-03-article-remediation.md)に記録しています。

2026-10-03の総合レビューIssueを解決する作業は[実施記録](records/2026-10-03/issue-resolution.md)で追跡する。[公開資産の既存ライセンス棚卸し](records/2026-10-03/license-inventory.md)、[Pages診断・復旧の現行手順](../website/operations.md)、[公開正本による保守基準値](records/2026-10-03/maintenance-baseline.md)を作成し、記事・サイト・音声排他・依存を修正する。完了は各記録とPR/CI/公開証拠で確認する。

担当別の変更と検証範囲は[記事の修正](records/2026-10-03/article-issue-remediation.md)、[サイトの修正](records/2026-10-03/website-issue-remediation.md)、[音声・CI・依存の修正](records/2026-10-03/harness-audio-issue-remediation.md)に記録する。

動的図解の全記事展開は停止し、全ソース・未提出状態・保存時の表示をバックアップして機能削除へ移行した。[実施記録](records/2026-10-03/dynamic-diagram-removal.md)に保存先・復元確認・削除と公開の結果を記載する。本文・既存Mermaid・数式を保持する。

E1〜F2の[旧検証計画](records/2026-09-30/p1-kit-preparation/README.md)と[保存時の確認](records/2026-09-30/p1-kit-preparation-review.json)は経緯として残す。旧計画の全手順を今後の作業へ再適用しない。

| 計画 | 状態・適用時点 | 実施記録・現行の入口 |
| --- | --- | --- |
| R1-01 本文を主役にする三列 | 2026-10-03、main `d990973`へ反映。対応deployment `6823843847`のsuccessと公開先URLを実APIで確認 | [サンプル・公開の実施記録](records/2026-10-03/r1-01-layout-preview.md) |
| [動的図解のバックアップと機能削除](plans/engineering/dynamic-diagram-removal-and-recovery.md) | 2026-10-03、復元確認後にmain `42dcee2`へ反映。対応deployment `6822376321`のsuccessを実APIで確認 | [実施記録](records/2026-10-03/dynamic-diagram-removal.md) |
| [動的図解の全記事展開](plans/engineering/dynamic-diagrams.md) | 2026-10-03展開停止。削除前の4保存点を私有バックアップへ保存。旧計画・制作記録は経緯 | [展開状況](records/2026-09-24/dynamic-diagram-rollout.md)、[P0実施記録](records/2026-09-24/reading-diagram-foundation.md)、[Transformer制作](records/2026-09-24/transformer-reading-diagrams.md)、[注意変種制作](records/2026-09-24/attention-variants-reading-diagrams.md)、[MoE制作](records/2026-09-24/moe-reading-diagrams.md)、[文章生成・トークン化](records/2026-09-24/generation-tokenization-reading-diagrams.md)、[推論内部](records/2026-09-24/inference-reading-diagrams.md)、[学習パイプラインの制作](records/2026-09-24/training-reading-diagrams.md)、[事前学習の制作](records/2026-09-25/pretraining-reading-diagrams.md)、[推論図の表示間隔修正](records/2026-09-30/inference-score-spacing-fix.md)、[D1アラインメント制作](records/2026-09-30/alignment-reading-diagrams.md)、[D2推論モデル制作](records/2026-09-30/reasoning-reading-diagrams.md)、[残り7記事の具体案](records/2026-09-30/p1-interface-preparation/README.md)、[記事別棚卸し](plans/engineering/dynamic-diagram-inventory.md)、[計画作成記録](records/2026-09-24/dynamic-diagram-plan.md) |
| 自己注意の読書連動図解 | 2026-09-24実装・公開後、2026-10-03の機能削除対象へ移行。保存時の記録 | [実施記録](records/2026-09-24/self-attention-reader.md) |
| LLM 内部構造の数式表示修正 | 2026-09-23 数式・狭幅・強調表示を修正し、ローカル検証完了。公開状況はPRを参照 | [実施記録](records/2026-09-23/llm-internals-ui-fix.md)、[PR #50](https://github.com/pero3dev/ai-agent-library/pull/50) |
| GitHub 紹介ページの改善 | 2026-09-20 README・画像の独立レビューと PR 検証済み。共有画像の登録は認証待ち | [実施記録](records/2026-09-20/github-showcase.md)、[PR #48](https://github.com/pero3dev/ai-agent-library/pull/48) |
| Safari の音声読み込み失敗 | 2026-09-13 形式指定・再試行処理を修正。Windows と macOS WebKit の試験を通過。公開状況は [PR #45](https://github.com/pero3dev/ai-agent-library/pull/45)を参照 | [実施記録](records/2026-09-13/safari-audio-fix.md) |
| iPhone 幅のモバイルメニュー表示修正 | 2026-09-13 修正・ローカル検証完了。マージ状況は [PR #41](https://github.com/pero3dev/ai-agent-library/pull/41) を参照 | [実施記録](records/2026-09-13/mobile-menu-fix.md) |
| [音声学習機能](plans/engineering/audio-learning.md) | 2026-09-13 公開・定期運用開始。初回2記事を公開し、残りを順次制作 | [運用開始記録](records/2026-09-13/audio-learning-launch.md)、[制作・運用手順](../automation/audio/README.md)、[実装記録](records/2026-09-13/audio-learning-implementation.md)、[台本の共同編集者](records/2026-09-13/audio-script-authorship.md) |
| セキュリティレビューへの対応 | 2026-09-12 SEC-01〜07 の修正反映済み。導入後の受入は実施記録を参照 | [実施記録](records/2026-09-12/security-remediation.md) |
| Git操作の規約整備 | 2026-09-12 G1〜G4 の実装・受入完了 | [実施記録](records/2026-09-12/git-conventions.md)、[Git共通規約](../harness/git-rules.md) |
| [プロジェクト構造の整理](plans/engineering/structure-cleanup.md) | 2026-09-11 S0〜S5完了 | [実施記録](records/2026-09-11/structure-cleanup.md)、[配置・棚卸し手順](../CONTRIBUTING.md#配置の維持) |
| [サイト構築](plans/engineering/website.md) | 2026-07-07 全フェーズ完了 | [サイトの開発手順](../website/README.md) |
| [記事の定期最新化](plans/engineering/freshness-automation.md) | 2026-09-10 導入完了 | [導入記録](records/2026-09-10/freshness-automation-setup.md)、[現行運用](../freshness-automation.md) |
| [ハーネス整備](plans/engineering/harness-improvement.md) | 2026-09-10 H0〜H6 の実装・受入完了 | [実施記録・実行面ごとの制約](records/2026-09-10/harness-acceptance.md)、[現行手順](../CONTRIBUTING.md#ハーネスを変更するとき) |
| [2026Q3 メンテナンス](plans/maintenance/2026q3.md) | 2026-08-18 計画、2026-09-10 に全 16 系統の差分反映を完了 | [更新記録](records/2026-09-10/freshness-update.md)、[以後の定点観測](../ROADMAP.md#定期メンテナンスフェーズ完了後も継続) |

## 完了した記事拡張計画

22 計画と、そのうち後続の拡張を横断した [実施順の記録](plans/content/priority-map.md) を保持します。各フェーズの成果物・完了状態は [執筆履歴](plans/content/roadmap-history.md#フェーズ別タスク分割作業依頼単位) で確認できます。以後の記事保守は[ROADMAPの定点観測](../ROADMAP.md#定期メンテナンスフェーズ完了後も継続)と [research の調査記録](../research/README.md) に接続します。

| 計画 | 対応フェーズ | 完了日 |
| --- | --- | --- |
| [コーディングエージェント章](plans/content/coding-agents.md) | A・B | 2026-07-06 |
| [プロフェッショナル化拡張](plans/content/expansion.md) | D〜I | 2026-07-07 |
| [周辺・基礎領域](plans/content/supplementary.md) | J〜L | 2026-07-07 |
| [プロンプト・コンテキスト・ハーネス・ループ詳解](plans/content/deep-dive.md) | M〜O | 2026-07-08 |
| [モデル特化プロンプティング](plans/content/model-prompting.md) | BA | 2026-07-08 |
| [データ・知識基盤](plans/content/data-knowledge.md) | AD・AE | 2026-07-08 |
| [評価・品質](plans/content/eval-quality.md) | AK・AL | 2026-07-08 |
| [信頼性エンジニアリング](plans/content/reliability.md) | AX | 2026-07-08 |
| [基礎・理論の拡張](plans/content/foundations-extension.md) | AQ・AR | 2026-07-08 |
| [SE 向けコーディングエージェント活用](plans/content/se-coding-agents.md) | V・X | 2026-07-08 |
| [モデル運用・インフラ](plans/content/llmops.md) | AF・AG | 2026-07-08 |
| [マルチモーダル応用](plans/content/multimodal.md) | Y・Z | 2026-07-08 |
| [セキュリティ・信頼・法務](plans/content/trust-security.md) | AH〜AJ | 2026-07-08 |
| [ドメイン別エージェント](plans/content/domain-agents.md) | AA〜AC | 2026-07-09 |
| [ケーススタディとサンプル](plans/content/cases-examples.md) | AU・AV | 2026-07-09 |
| [UX・プロダクト](plans/content/ux-product.md) | AM・AN | 2026-07-09 |
| [組織・プロセス](plans/content/org-process.md) | AO・AP | 2026-07-09 |
| [エージェント基盤](plans/content/agent-infra.md) | AY | 2026-07-09 |
| [AI 戦略・調達・持続性](plans/content/ai-strategy.md) | AZ | 2026-07-09 |
| [LLM 内部構造](plans/content/llm-internals.md) | S〜U | 2026-07-09 |
| [人と AI の協働](plans/content/human-ai.md) | AW | 2026-07-09 |
| [業界・エコシステム](plans/content/ecosystem.md) | AS・AT | 2026-07-10 |

## 2026-09-10 の監査・修正・導入記録

| 記録 | 読み方・後続との関係 |
| --- | --- |
| [プロジェクトレビュー](records/2026-09-10/review.md) | レビュー時点の指摘と失敗を保持。修正結果は次の記録で追跡 |
| [レビュー指摘の修正](records/2026-09-10/review-remediation.md) | 指摘の対応、追加論点、検証範囲 |
| [鮮度監査](records/2026-09-10/freshness-audit.md) | 一次資料の観測と、更新前に特定した 107 件 |
| [鮮度更新の実施](records/2026-09-10/freshness-update.md) | 107 件の適用結果と未検証範囲。監査 JSON の当時の状態は上書きしない |
| [定期最新化の導入](records/2026-09-10/freshness-automation-setup.md) | PR #11・#12 時点の構成と受入。以後の変更はハーネス実施記録を参照 |
| [ハーネス整備の受入](records/2026-09-10/harness-acceptance.md) | H0〜H6、必須 9 チェック、実 Agent・定期起動・公開の証拠と制約 |
| [サンプル監査出力](records/2026-09-10/evidence/examples-audit.json)、[サイト監査出力](records/2026-09-10/evidence/website-audit.txt) | レビュー時に取得した生出力。取得後のパスや結果へ書き換えない |

## 追加するときの配置

新しい計画は `plans/content/`・`plans/maintenance/`・`plans/engineering/`、実施記録は `records/YYYY-MM-DD/` に用途を表す英語ケバブケースで置きます。外部資料の出典・主張・取得時刻・適用台帳は [research/](../research/README.md) に置き、記事テンプレートは使いません。新しい計画・記録はこの索引から辿れるようにします。ルートの README へ計画ファイルの長い列挙を戻しません。
