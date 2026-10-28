# iOS App本文表示時のメモリ観測

2026-10-28。IOS-15の次の小単位として、指定iOS Appの本文表示区間を観測する候補を準備する。自分用初版の実装・検証を優先度順に自律実施し、commit・PR・通常main統合へ分ける本人の依頼を根拠とする。新しい課金・契約・外部配布・署名更新・OS更新は対象にしない。

2026-10-29の現行契約は[実CSVの照合と固定契約](#実csvの照合と固定契約)にまとめる。以下の初期準備と各runの記録を保持し、初期の未採択状態と後続Sourceでの採択を区別する。

## 目的と対象

基準はmain `e0c3031f3d62adab017c72949ffa3376e77b18bf`、App 0.2.22（24）。既存のMac Core CLIのRSSをAppのメモリと扱わず、UIテストから対象Appを指定する。App・PBX・版・本文の実装を変えず、既存Clockの2ケースとexport契約を保持する。

[Appleのinitializer](https://developer.apple.com/documentation/xctest/xctmemorymetric/init(application:))とローカルXcode16.2のXCTest SDK headerにより、`XCTMemoryMetric(application: app)`が指定Appを対象とし、引数なしが現在のprocessを対象とすることを確認した。APIは確認したが、iOS18.5での実標本はまだ得ていない。

[Appleの説明](https://developer.apple.com/documentation/xcode/preventing-memory-use-regressions)は計測区間のピークと開始・終了間の増加を扱う。1つのmetric objectから出るrow数・identifier・wire unitを決め付けず、増分を正値と仮定しない。[Simulatorの制約](https://developer.apple.com/documentation/xcode/gathering-information-about-memory-use)と[代表的な計測環境の推奨](https://developer.apple.com/documentation/xcode/writing-and-running-performance-tests)を踏まえ、今回をDebug Simulatorの参考観測とする。

## 旧実験の参照

[閉じた一時PR #274](https://github.com/pero3dev/ai-agent-library/pull/274)には、0.2.14（16）の検索区間でmemory 3行・各5値を記録した履歴がある。UIは成功したがcollectorは読取前のseal不一致で停止し、元のbefore filelistがないためSQLite更新が原因とは確定していない。旧記録の承認範囲と、後続再読取の独立確認待ちを区別する。

今回は0.2.22のTransformer本文シナリオで初回rawを採取する別の観測で、旧5値・指標の意味・換算・性能基準を転用しない。旧branchは変更・統合しない。新exporterはcontextの安定した読取とxcresultのroot同一性を検査するが、公式reader前後のbundle内部全byte不変を検証済みとは主張しない。

## 測定の境界

全記事一覧と学習ガイドの準備後にmetricを構築する。最初の明示launchは1回。各invocationで一覧・検索・一意なTransformer行を準備した後、行tapの直前に開始し、前面のTransformer文脈、reader、その内部の非空で完全表示されたnative textを確認して停止する。戻り・検索・行の準備・添付・終了は区間外。UI／AX同期と画面遷移を含む。

[iterationCount](https://developer.apple.com/documentation/xctest/xctmeasureoptions/iterationcount)のwarm-up1回と記録3回を採用し、sourceでは4回の呼出しと本文witnessを確認する。[開始](https://developer.apple.com/documentation/xctest/xctmeasureoptions/invocationoptions-swift.struct/manuallystart)・[停止](https://developer.apple.com/documentation/xctest/xctmeasureoptions/invocationoptions-swift.struct/manuallystop)を手動指定する。明示launch1回とforeground状態の確認は、PID不変を独立観測した証拠ではない。

対象は `11-llm-internals/transformer-architecture`、scenarioは `published-article-app-memory`、caseは `PublishedPerformanceUITests/testPublishedArticleAppMemory`。起動時間、cold起動、lifetime peak、全画像decode、scroll、Release、実機の安全限界、製品SLOを測ったとはしない。

## 実装と初回の採択手順

Swiftの専用case・新memory workflow・別exporter・独立Node試験をSource commitへまとめ、記録と索引を別commitにする。既存Clockの単一指標・CSV契約をmemoryへ拡張しない。

初回のtrusted memory契約は未採択とする。exact1 case・型付き3値・出所の対応と、上限付きraw／CSVを保存しても、契約が未確定なら `metric-contract-unconfirmed`、`accepted_measurements: null`、非ゼロ終了を保つ。Draftのまま実metric集合・単位・row数・CSVとsource／checkoutを独立に確認し、別commitで固定契約を採択して新headの検証を行う。初回の未採択結果を削除・同条件retryで置き換えず、製品不具合や性能合格とも扱わない。

job40分とビルド・UI実行の別上限はCI資源の制限で、製品の性能予算ではない。専用Simulatorだけを作成・片付け、compactは全体2MiB・JSON各512KiB・CSV各64KiBを上限に90日保持する。上限超過時に指標を切り落として成功にしない。source／checkoutとGitHub event／run／attemptは別に照合する。

## 確認状況と残件

候補のSwift構文と、Xcode16.2／iOS18.2 Simulator SDKを使う単一UIファイルの型検査が成功した。Appのlink・実UI・実メモリ実行ではない。workflowのactionlint・YAML・Bash・埋込Nodeの静的検査、新memory Node20件と既存Clock44件が成功した。exporterの初回レビューで見つかった別case混入・open直前のサイズ増加・最終child後の期限確認の3件を修正し、負例を追加した。3件の修正版の独立差分レビューでも新しいP1・P2は0件だった。lockfileから依存を隔離準備した `npm run check` も成功し、Node1130件中1115成功・15skip・失敗0を確認した。Macの一時path・Git設定は専用配置で隔離し、既存sourceをこのために変更していない。独立レビューと実SDK型検査、実UIと3標本、identifier・unit・cardinality・CSVの採択、必要CIと通常main統合を区別して記録する。実protocol payloadを取得していなければ、sourceのassertとcase成功をpayload検証済みへ広げない。

IOS-15全体と受入目標、他のTODOは未完了を維持する。実機確認は本人の許可により未完了のままスキップできる。TODO32行・完了13行を保持し、旧0.2.20のClock値を今回の実メモリや現行版の値として転用しない。

## 初回Hostedの環境失敗と再確認

2026-10-29追記。Draftの[PR #296](https://github.com/pero3dev/ai-agent-library/pull/296)、head `b7f3ae46b217c15d545a34a8aa8a3b23e752b53b`の[初回run](https://github.com/pero3dev/ai-agent-library/actions/runs/40711271095/attempts/1)は、専用Simulator起動後の端末一覧取得で停止した。bootとbootstatusはexit 0で、後続の `simctl list devices --json` が約59.9秒の制限でタイムアウトした。ビルド・UI・メモリ計測は未到達であり、契約未採択のexit 2ではない。後続exportはxcresult未作成で失敗した。

同じ一覧取得は後片付け時に成功し、今回作成した端末だけのshutdown・deleteと削除後の一覧確認も成功した。初回raw 75,321Bと公式compact ZIP 72,481Bを1回ずつ取得し、ZIPの公式SHA256 `449db972a94375f22072b3d09be6d31eadedcdd80d372b54724dcef1b87db9ca`と78 memberの上限・hashを独立に照合した。一時的な管理コマンドの無応答と整合するが、原因は確定しない。初回失敗を保持し、Source・timeout・選択条件を変えない1回だけの再実行を行った。実測未採択を同条件retryで置き換える手順とは区別する。

## 再実行で分かったmanifest読取上限の不整合

[同runのattempt 2](https://github.com/pero3dev/ai-agent-library/actions/runs/40711271095/attempts/2)、job `122905720245`では専用Simulatorの起動後確認とDebugのbuild-for-testingが成功した。ビルドは約237秒だったが、App内のContent manifestを読む際に一般メタデータ向けの512KiB上限へ達して停止し、UI・メモリ計測には進まなかった。これはSource側の上限の不整合であり、追加の同条件retryは行わない。後続exportはxcresult未作成で失敗し、専用端末の後片付けは成功した。

[アプリの検証器](../../../ios/AILibrary/Sources/ContentValidator.swift)はmanifestに8MiB上限を設けている。Appと生成元のContent／TestContentの4読取だけをこの上限に揃える。一般JSONの512KiB、compact全体2MiBと各ファイル上限、ビルド・起動・測定の制限時間、未採択の指標契約は保持する。ローカルの全199記事manifestは3,120,173Bで同じ種類の失敗を再現できるが、その生成revisionはHostedと異なり、Hosted Appのmanifest実サイズとして転用しない。

attempt 2のraw 77,325Bとcompact ZIP 77,605Bを各1回取得し、公式SHA256 `a51ad185961f16795038e6ff2e711669d76bede241fa4d606336ac99765fe7d6`、86 memberと85件のmanifest記載ファイルのbyte・hash、出所を独立に照合した。修正後の実行で初めて実metricとCSVを確認する。現時点の測定結果は未取得で、IOS-15・性能予算・実機の未完了を保持する。

修正候補の4引数だけを戻すと元workflowと完全一致する。抽出した実auditとreaderにローカルの全199記事manifestと既存fixtureを通し、修正前のbyte cap失敗と修正後のcontext作成を確認した。4読取それぞれの8MiB超過、両組のbyte不一致を拒否し、一般readerの512KiB境界も維持した。外部のpackage audit・plutil・executableはstubであり、Hosted SDK／UIの再実行成功とはしない。actionlintとYAML・Bash11本・埋込Nodeの静的検査も成功した。

この4引数の修正版の独立レビューは新しいP1・P2が0件だった。隔離済み依存と同じlockfileで共通検査を再実行し、Node1130件中1115成功・15skip・失敗0、`npm run check` exit 0を確認した。既存の本文・App・PBX・版・Clock・新memory caseとexporterは保持する。新headのHosted実行と実指標の採択は別の確認として残す。

## 修正版で再発した起動後の読み取り

manifestの上限を直したhead `0811dd5470317ed576fc3c7fc095b37d201e0678`の[run 40718446381](https://github.com/pero3dev/ai-agent-library/actions/runs/40718446381)、attempt 1／job `122922434713`では、boot約2.2秒とbootstatus約60.9秒がexit 0で終わった後、起動後の一覧取得が約60秒で再びタイムアウトした。その後の同じ一覧取得は約7.8秒、削除後は約0.7秒で成功し、専用端末だけの後片付けも成功した。ビルド・UI・実メモリには進んでいない。

同runのraw 77,137Bと公式compact ZIP 72,529Bを各1回取得し、公式SHA256 `5c64e8ea7877014f9225e7794d88effca9e3fbdfcf2814d50d0a3e314dbb1e5d`、78 memberと77件のmanifest記載ファイルを照合した。起動後の読み取りが繰り返し停止するため、Sourceに限定した回復手順を追加する。同条件のジョブ再実行は行わず、過去の失敗を保持する。

回復の対象は起動後の `simctl list devices --json`だけとし、最初のNodeエラーcodeが `ETIMEDOUT`かつexit statusがnullの場合に限り、別名のcommandで新たに1回取得する。最初の不完全な出力を採用せず、両方のintent・exitと小さな判断記録を保持する。判断記録のretry plannedは実行済みを意味せず、実際のspawn有無はcommandの記録で区別する。それ以外のエラー・非ゼロ終了・JSON不正・端末不一致は失敗のままとし、再取得の失敗後に3回目の起動後確認を行わない。

各読取60秒、Simulator工程330秒、作業31分・job40分の上限と、既存の端末同一性・状態・所有確認を保持する。残り時間がなければ追加読取をspawnしない。端末作成・boot・削除やUIテスト・測定の再試行は追加しない。既存の後片付けは別工程として維持する。この回復も実Hostedでの効果は未確認で、実指標の未採択とTODO32行・完了13行を維持する。

回復候補は、抽出した実driverと実ファイル、外部command・時計のstubを使う28例で確認した。通常成功は1回、対象timeoutだけは2回の起動後確認となり、非対象エラー・不正JSON・端末不一致は追加読取せず失敗した。再取得の失敗後の3回目と、工程・全体の残り時間がない場合の実spawnも行わない。最初と追加の記録が変わらずcompactに含まれることも確認した。VM adapterの準備で発生した2件のローカル失敗はSourceを変えずに修正して記録し、最終28例は成功した。actionlintとYAML・Bash11本・埋込Nodeの構文も成功した。これらはstub検証であり、Hostedでの回復や実UI・実メモリの成功ではない。

回復候補の独立Sourceレビューは新P1・P2が0件だった。隔離済み依存と同じlockfileで共通検査を行い、Node1130件中1115成功・15skip・失敗0、`npm run check` exit 0を確認した。App・PBX・版、Clock、新memory caseとexporterは保持する。追加コミットの新Hosted結果は別途確認する。

## 初回UI測定の停止と診断の追加

[head def8のrun 40724373484](https://github.com/pero3dev/ai-agent-library/actions/runs/40724373484)、attempt 1／job `122943532415`は、初めて実Appのビルドと監査を通過した。App 0.2.22（24）、199記事とfixture 4記事の監査は成功し、ビルドは約181.5秒だった。起動後一覧は最初の読取が約15.9秒で成功し、条件付き追加読取は発火していない。この結果を追加読取そのものの実OS検証成功とはしない。

UI測定のxcodebuildは450秒上限に対して約450.4秒でSIGKILL／ETIMEDOUTとなった。採取stdoutは58,240Bだったが、compactには末尾512Bだけが残り、最後は実行開始約120.7秒のTransformer行tap、約121.1秒のapp idle待機だった。何回目か、tapの内部か、直後のAX取得かを特定できない。15秒のpredicate待機は、tap・期待構築・ブロック中のAX取得を強制的に中断する上限ではない。原因は未確定で、同条件のジョブ再試行や判定の緩和は行わない。

結果bundleの読取もexit 64で失敗し、exporterはexit 1だった。実標本・CSV・protocol payloadは取得できず、契約未採択のexit 2とは区別する。raw 83,366Bと公式compact ZIP 95,345Bを各1回取得し、公式SHA256 `4ff98b01f58734d1a65e7a9e9602d677bf42ccd3670d8aff206703ae7d3315a9`、111 memberと110件のmanifest記載ファイルを独立照合した。専用端末の後片付けは成功し、他の7workflowと初期required11はAPI successだった。

次の診断では、Runnerの操作前後に実行回・monotonic時刻・固定phaseを容量制限付きで記録する。期待の構築前後とwaiterの前後も分け、既存値だけを使い追加AX取得を行わない。workflowは既に採取したmeasure stdoutを64KiB、stderrを16KiBまで固定pathで保持し、元のbyte数・SHAと保持分のbyte数・SHAを分ける。超過時は途中省略を明示するbyte抜粋とし、失われた今回のstdoutを再構成したとはしない。全compactの2MiB上限とmetric入力の非切り詰めを保持する。

これらは停止位置を調べる診断で、Appの不具合修正ではない。計測区間にRunnerのログ出力が加わるため、数値の比較性は未確認として扱う。App・PBX・版、Clock 2case、判定・制限時間・warm-up 1回と記録3回は保持し、実機とIOS-15全体は未完了を維持する。

診断候補のSwift構文とXcode16.2／iOS18.2 SDK単一ファイル型検査は成功し、Foundation-onlyの補助クラス6例（同時2000呼出しを含む）で順序・実行回・出力pool・32KiB上限を確認した。初回のhost補助検査でSDK指定が足りなかった失敗は、Sourceを変えずにコマンドを直して記録した。workflow側は抽出した実compactと実ファイルを使う4例を含む18正常例・3負例、actionlint・YAML・Bash11本・埋込Nodeの構文が成功した。58,240B／403Bの例は今回失われた出力の再構成ではなく、同じサイズの合成fixtureである。これらを新HostedのUI実行・実メモリ取得の成功へ広げない。

Swiftとworkflowの独立Sourceレビューは新しいP1・P2が0件だった。診断候補を隔離した依存で共通検査し、Node1130件中1115成功・15skip・失敗0、`npm run check` exit 0を確認した。旧4コミットを残した追加コミットとして診断を検証し、実Hostedの結果と実指標の採択は別に確認する。

## 診断headの初回成功とlegacy JSONの収録上限

[head 1134のrun 40735397499](https://github.com/pero3dev/ai-agent-library/actions/runs/40735397499)、attempt 1／job `122982456036`では、専用UI 1 caseが113.057秒で成功した。consoleにはMemory 3指標・生単位kB・各3値が出たが、型付きsummaryとCSVはまだ取得できていない。診断のRunner出力を加えた観測であり、以前のdef8の停止原因や数値の比較性を解決したとはしない。

modern tests／detailsとlegacy root／planの読取は成功し、次のlegacy summary読取で512KiB上限に達した。childはENOBUFS／SIGKILL、stdoutは589,824Bのprefixで、完全なJSONサイズの下限しか分からない。collectorはexit 1となり、CSV exportへ進まなかった。契約未採択で正常収録した際のexit 2とは区別する。

raw 83,460Bと公式compact ZIP 109,930Bを各1回取得し、公式SHA256 `7bef6588441c383d6ef0317a65418aff83197f5a453832a08693ab35e30fe89e`、118 memberとmanifest記載ファイルを照合した。64KiBのstdout抜粋は途中を省略しており、保持phaseにseq 26→53の欠落がある。全4回の完全なjournal、protocol payloadやwarm-upの独立検証は主張しない。case成功と、review済Sourceの4呼出しassert、保持された各ordinalの存在、consoleの3値を別の証拠として扱う。

後続の限定修正は、内部固定名 `legacy-summary.json`のchild出力・JSON parse・所有ファイル・compact memberだけを1MiBへ揃える。他のJSONは512KiB、全体2MiB・診断予約32KiB・child60秒・export170秒と既存のfd／出所／case guardを保持する。値やactivityを削除・切り詰め・再serializeせず、上限内のrawをそのまま保存し、超過時は失敗とする。consoleの値や旧PR274の形式を使った契約採択は行わない。新headで完全な型付きmetric・CSVを得てから独立に確認する。

限定修正は、新4例を加えたNode24例が成功し、元20例の本文を保持した。約700〜900KiBの合成pretty summaryをrawのまま保存して未採択exit 2まで進むことと、1MiB超過・他JSONの512KiB超過・予約と総量の拒否を確認した。workflow側も実compactと実ファイルの5合成例で1MiB境界と総量を確認し、静的検査が成功した。初回のharnessが「失敗診断artifactのready」と「metricの成功」を同一視した誤りはSourceを変えずに訂正して記録した。独立SourceレビューのP1・P2は0件だった。新Hostedでの完全summary取得と指標採択は未確認のままとする。

この限定修正を隔離済み依存で共通検査し、Node1134件中1119成功・15skip・失敗0、`npm run check` exit 0を確認した。旧5コミットを残した追加コミットとして必要CIを検証する。完全summary・CSVと実metricの固定契約は、新しい収録が成功してから別に採択する。

## 完全summaryの取得とCSV収録前の失敗

head `124b5281c67933710b50439979fef9cd263b7452`の[run 40741532861](https://github.com/pero3dev/ai-agent-library/actions/runs/40741532861)は、attempt 1で環境一覧取得の120秒上限に達し、ビルド・UIへ進まなかった。初回raw 80,673Bとcompact ZIP 11,909Bを保持した。原因を確定せず、条件を変えない1回だけの再実行を行った。このheadの追加再実行は行わない。

attempt 2／job `123008623901`では、全199記事のApp監査と専用UIが成功した。6件のxcresulttool commandはすべてexit 0で、746,097Bの型付きlegacy summaryを切り詰めず取得し、1MiB収録上限内であることを確認した。公式runのhead・event・attemptとproducer context、Source4のhashとtreeも照合した。CSV出力command自体は成功したが、収集器が `Unexpected CSV export member or count`で失敗した。非CSV・非通常ファイル・16件超過のどの条件かを示す情報がなく、CSVは保存前に失われた。これは未採択契約のexit 2ではなくexit 1であり、CSV形式・指標契約は未採択のままである。

raw 83,632Bと公式compact ZIP 149,390Bを各1回取得した。ZIPのSHA256 `3fef46da48f37204115da0797dde0bdfc9b2c08cd74d648821c9d52648003151`、121 memberとmanifestに載る120ファイルのbyte・hashを照合した。完全summaryの取得、専用caseの成功、CSVの未取得とprotocol payloadの未検証を分けて記録する。以前のタイムアウト原因やRunner診断IOの数値比較性が解決したとはしない。

後続修正は、CSV出力のstdoutとmember一覧を各16KiBの固定診断ファイルへ残す。CSV以外のmemberを成功扱いで無視せず、上限・所有・通常ファイル等の確認を通ったCSVを先に保存してから、未知member等があれば失敗を維持する。未知memberの内容を推測で採用せず、次の実データを確認してから必要な変更を決める。型付き指標の値やCSVの固定契約は別の採択まで受入値にしない。

独立のraw監査では、modernとlegacyの一意な専用caseのPassed・約101.588秒と参照を照合し、`ActionTestPerformanceMetricSummary` 3行・各Double3値・wire単位 `kB`を確認した。9値はいずれも有限かつ正だったが、CSV未取得のため意味・換算・平均・性能予算を採択しない。本文診断のseq26から53には保持欠落があり、protocol attachmentは参照だけでpayloadを取得していない。起動後の一覧は初回timeout約60.388秒の後、別commandの追加読取1回が約17.980秒で成功し、限定回復が実行された。今回の1実行の成功として記録し、常時回復の保証にしない。

限定修正のNode29例（既存24例と追加5例）は成功した。未知memberの順序、通常ファイル以外・重複inode等、CSV17本とmember／path／depth等の上限を拒否しつつ、安全な候補を保持することを確認した。workflowの固定診断2名の各16KiB境界を含むcompact合成11例と静的13検査も成功した。これはローカルの合成出力による確認で、新Hostedの実CSV形式や収集成功を示さない。既存の出所・fd・期限・caseと容量のガード、未採択契約・受入値nullを保持する。

修正後の共通検査 `npm run check` は成功し、Node1139件中1124成功・15skip・失敗0を確認した。最初の共通検査は同じNode結果の後、作業記録2ファイルの空行で停止した。空行だけを訂正して再実行し、Source3は変更していない。最終内容の独立レビューと新headのHosted収集は別に確認する。

## 実CSVの照合と固定契約

head `fb29b31c4a01dfb7bb7128f325a1ab977b4317b9`の[run 40748853889](https://github.com/pero3dev/ai-agent-library/actions/runs/40748853889)、attempt 1／job `123029792404`で、専用caseは約100.914秒で成功した。公式runのhead・event・attempt、checkoutとSource4、modern／legacyの一意なcase・参照・型を照合した。Appは0.2.22（24）・全199記事で、今回のContent revisionは `702aaa3591c121e43dd40facf261849f79351c32b521550a7453ebff455cb284`である。

6件の公式reader commandがexit 0となり、型付きsummary 742,166BとCSV 667Bを取得した。raw 83,841B、公式compact ZIP 149,550Bを各1回取得し、ZIP SHA256 `fdce64e00e28e8674a073a13f2491b3181a2e52ee7da5bfa3c88e07bf29baae0`、122 memberとmanifestに載る121ファイルを照合した。独立のDecimal／Fraction照合で、下記の3行・各3値と順序・単位が一致し、CSV平均はそれぞれ表示桁の丸め幅内だった。数値はwireの `kB`のままで、換算や性能予算を採択しない。

| wireの表示名 | 3標本 | CSV平均 |
| --- | --- | --- |
| Absolute Memory Physical (prototype) | 115629.696, 116989.568, 117530.24 | 116716.5013 kB |
| Memory Peak Physical (prototype) | 117972.608, 119398.016, 120151.68 | 119174.1013 kB |
| Memory Physical (prototype) | 3489.792, 3129.344, 2441.216 | 3020.117333 kB |

CSVは11列・データ1行・1ファイルで、Destinationは `iPhone 16 iOS Simulator 18.5`、Configurationは `Test Scheme Action`だった。列名で対応させ、列位置や専用Simulatorの任意の名前では照合しない。typed baselineは0.0・名前なし、CSV baselineは0で一致したが、性能基準の採用とはしない。平均の比較は表示丸めとbinary64で生じる誤差を分け、極小値へ一律の絶対許容差を追加しない。

この実行のcollectorは、CSVと同じ出力rootにツールが生成した通常ファイル `manifest.json` 305Bを拒否してexit 1となった。stdoutにも生成manifestの案内があり、member一覧は2件・走査完了・CSV1件保存・manifestだけ拒否だった。このheadの成功収集や契約採択を主張せず、同条件の再実行は行わない。

後続Sourceの固定契約は `xcode16.4-app-memory-v1`とし、現行Appに対応する3 identifier・wire単位 `kB`・各3値と、上記CSVの列名・device／configuration・標本の順序・平均・baselineの照合を条件にする。契約は入れ子も凍結し、引数・実データから別契約を与えて成功へ変えない。型付き標本のゼロ・負値を一律に除外しない。

CSVツールのmanifestは、出力rootの正確な名前・通常ファイル・単一link・16KiB以内だけを `csv-export-manifest.json`へraw保存する。不在も許容し、内容はopaqueな診断として扱う。本文のschemaはまだ確認しておらず、JSONの指示や参照先・metric・ファイル名を採用する入力にしない。CSVと型付きデータの照合だけで受入条件を満たす必要があり、他の未知member・nested manifest・unsafe／oversizeは失敗を維持する。

すべての照合に成功した観測だけ `matched-memory-observation`・`metric_contract_accepted: true`・CLI exit 0とする。workflowも終了コードに加えて固定契約名、3行・各3標本、CSVの照合状態を確認する。`protocol_payload_verified: false`と`product_performance_acceptance: false`を保つ。Runner診断には保持欠落があり、protocolは添付参照だけでpayload未取得、全4呼出しの完全journalやwarm-upを独立検証したとはしない。

このSource採択後の新headでのHosted収集・必要CI・通常main統合は別に確認する。先行124bの通常Native検査では、Transformer本文の前の一覧行待機が失敗し、待機後の行は操作可能だったが、原因は未特定である。fb29のFull runはfailure／job cancelled・実行stepなしで、取消理由やactorは未確認のまま残す。今回のCSV契約をその原因修正とせず、必要な最終headの検証を別に行う。App・PBX・版・既存Clock・TODO32行／完了13行とIOS-15全体の未完了を保持する。

固定契約候補のNode47例は成功した。既存の39カテゴリに加えて、実CSVのfixture、3 identifier・単位・標本数・raw token・平均・device／configuration・baselineの不一致、既知manifestの限定保存と未知／nested／unsafe／oversizeの拒否を検査した。実fb29のpure auditも成功したが、これは旧collectorのexit 1を成功へ書き換える証拠ではない。workflowはcompact合成14例、成功summaryの必須項目と非ゼロ終了を確認するexport工程の合成22例、静的13検査が成功した。実Hostedの再実行とは区別する。

隔離済み依存と同じlockfileで共通検査 `npm run check` が成功し、Node1157件中1142成功・15skip・失敗0を確認した。Source3と記録4を最終レビューの対象とし、新headでの実収集と通常保護のmain反映を別に確認する。平均検証の誤差モデルは一般的なbinary64演算の上限であり、Apple内部の集計実装を検証したものではない。
